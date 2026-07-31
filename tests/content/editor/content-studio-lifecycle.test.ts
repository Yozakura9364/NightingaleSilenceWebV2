// ContentStudioPage lifecycle integration test — H2B Package 3
// Tests the PRODUCTION galleryDocumentController module directly.
import { describe, it, expect } from 'vitest'
import {
  addImage, removeImage, moveImage, setLayout, readGallery, findFirstGalleryGid,
  adoptStandaloneImage,
  deriveGalleryState, deriveGalleryOnLoad,
  type GalleryState, type GalleryImage, type BareDoc, type PendingGalleryRecord,
} from '@/lib/content/editor/galleryDocumentController'
import { extractEditorDoc, buildSaveDraftBody } from '@/pages/content-studio/helpers/contentDocumentHelpers'
import { toCanonicalDocument } from '@/lib/content/editor/toCanonicalDocument'

const META = { title: 'Lifecycle', tags: ['test'] }

const imgA: GalleryImage = { mediaId: 'a1b2c3d4-e5f6-4789-ab12-cd3456789012', alt: 'A', caption: 'capA', align: 'left', displayWidth: 50 }
const imgB: GalleryImage = { mediaId: 'b2c3d4e5-f6a7-4890-bc23-de4567890123', alt: 'B', caption: 'capB', align: 'right', displayWidth: 100 }
const imgC: GalleryImage = { mediaId: 'c3d4e5f6-a7b8-4901-cd23-ef4567890123', alt: 'C', caption: 'capC', align: 'center', displayWidth: 75 }

function emptyDoc(): BareDoc { return { type: 'doc', content: [] } }

describe('galleryDocumentController — production module', () => {
  it('first image → standalone node, saved + recovered intact', () => {
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA)
    doc = r1.doc
    expect(doc.content[0].type).toBe('image')
    expect(doc.content[0].attrs.mediaId).toBe(imgA.mediaId)
    expect(doc.content[0].attrs.caption).toBe('capA')
    expect(doc.content[0].attrs.align).toBe('left')
    expect(doc.content[0].attrs.displayWidth).toBe(50)
    // save + recover via envelope helpers
    const envelope = { schemaVersion: 'content.document.v1', doc: doc }
    const recovered = extractEditorDoc(envelope)
    expect(recovered.content[0].attrs.mediaId).toBe(imgA.mediaId)
  })

  it('second image converts standalone → gallery preserving all 5 fields', () => {
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA)
    doc = r1.doc
    const r2 = addImage(doc, r1.state, imgB)
    doc = r2.doc
    const gid = findFirstGalleryGid(doc)!
    expect(gid).toBeTruthy()
    const g = readGallery(doc, gid)!
    expect(g.images.length).toBe(2)
    expect(g.images[0]).toEqual(imgA)
    expect(g.images[1]).toEqual(imgB)
    expect(g.layout).toBe('two-column')
  })

  it('3rd image appended; reorder; layout switch; save/recover keeps everything', () => {
    let doc = emptyDoc()
    let state: GalleryState | null = null
    const r1 = addImage(doc, state, imgA); doc = r1.doc; state = r1.state
    const r2 = addImage(doc, state, imgB); doc = r2.doc; state = r2.state
    const r3 = addImage(doc, state, imgC); doc = r3.doc; state = r3.state
    const gid = findFirstGalleryGid(doc)!
    expect(readGallery(doc, gid)!.images.length).toBe(3)

    // reorder B→front
    const rm = moveImage(doc, state!, 1, 0); doc = rm.doc; state = rm.state
    expect(readGallery(doc, gid)!.images[0].mediaId).toBe(imgB.mediaId)

    // layout switch
    const rl = setLayout(doc, state!, 'three-column'); doc = rl.doc; state = rl.state
    expect(readGallery(doc, gid)!.layout).toBe('three-column')

    // save + recover
    const envelope = { schemaVersion: 'content.document.v1', doc: doc }
    const recovered = extractEditorDoc(envelope)
    const rgid = findFirstGalleryGid(recovered)!
    const rg = readGallery(recovered, rgid)!
    expect(rg.layout).toBe('three-column')
    expect(rg.images.length).toBe(3)
    expect(rg.images[0].caption).toBe('capB')
    expect(rg.images[1].displayWidth).toBe(50)
  })

  it('remove down to 1 → standalone; remove last → node gone', () => {
    let doc = emptyDoc()
    let state: GalleryState | null = null
    const r1 = addImage(doc, state, imgA); doc = r1.doc; state = r1.state
    const r2 = addImage(doc, state, imgB); doc = r2.doc; state = r2.state
    const r3 = addImage(doc, state, imgC); doc = r3.doc; state = r3.state

    const rr = removeImage(doc, state!, 2); doc = rr.doc; state = rr.state
    expect(state!.images.length).toBe(2)

    const rr2 = removeImage(doc, state!, 1); doc = rr2.doc; state = rr2.state
    expect(state!.images.length).toBe(1)
    expect(doc.content[0].type).toBe('image')
    expect(doc.content[0].attrs.mediaId).toBe(imgA.mediaId)

    const rr3 = removeImage(doc, state!, 0); doc = rr3.doc; state = rr3.state
    expect(state).toBeNull()
    expect(doc.content.length).toBe(0)
  })

  it('unrelated standalone image is untouched; second gallery independent', () => {
    const unrelated = { type: 'image', attrs: { mediaId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', alt: 'unrelated', align: 'center', displayWidth: 75 } }
    let doc: BareDoc = { type: 'doc', content: [unrelated] }
    let state: GalleryState | null = null
    const r1 = addImage(doc, state, imgA); doc = r1.doc; state = r1.state
    const r2 = addImage(doc, state, imgB); doc = r2.doc; state = r2.state
    // gallery at index 1, unrelated image untouched at 0
    expect(doc.content[0]).toEqual(unrelated)
    expect(doc.content[1].type).toBe('gallery')

    // Second independent gallery (another gid) doesn't affect the first
    let doc2 = doc
    const s2 = addImage(doc2, null, imgC)
    doc2 = s2.doc
    const r2b = addImage(doc2, s2.state, imgA)
    doc2 = r2b.doc
    const gids = doc2.content.filter(n => n.type === 'gallery').map(n => n.attrs.gid)
    expect(gids.length).toBe(2)
    expect(new Set(gids).size).toBe(2)
  })

  it('paragraph inserted before gallery does not break operations (gid lookup)', () => {
    let doc = emptyDoc()
    let state: GalleryState | null = null
    const r1 = addImage(doc, state, imgA); doc = r1.doc; state = r1.state
    const r2 = addImage(doc, state, imgB); doc = r2.doc; state = r2.state
    const gid = state!.gid

    // user types a paragraph BEFORE the gallery
    doc = { type: 'doc', content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'intro' }] },
      ...doc.content,
    ] }

    // operations still find the gallery by gid
    const r3 = addImage(doc, state, imgC); doc = r3.doc; state = r3.state
    const g = readGallery(doc, gid)!
    expect(g.images.length).toBe(3)
    expect(doc.content[0].type).toBe('paragraph')
    expect(doc.content[1].type).toBe('gallery')
  })
})


describe('gid boundary — runtime only, stripped at save', () => {
  it('gid stripped by toCanonicalDocument (image and gallery)', () => {
    let doc = emptyDoc()
    let state: GalleryState | null = null
    const r1 = addImage(doc, state, imgA); doc = r1.doc; state = r1.state
    const r2 = addImage(doc, state, imgB); doc = r2.doc; state = r2.state
    // runtime doc has gid
    expect(findFirstGalleryGid(doc)).toBeTruthy()
    const canon = toCanonicalDocument(doc)
    const g = canon.content[0]
    expect(g.attrs.gid).toBeUndefined()
    for (const img of g.content) expect(img.attrs.gid).toBeUndefined()
  })

  it('gid survives standalone → save → recover → second image still converts', () => {
    // standalone state in-session
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA)
    const gid = r1.state.gid
    // save strips gid
    const canon = toCanonicalDocument(r1.doc)
    expect(canon.content[0].attrs.gid).toBeUndefined()
    // recover: adopt standalone with remembered gid
    const adopted = adoptStandaloneImage(canon, gid)!
    expect(adopted.state.gid).toBe(gid)
    // second image converts to gallery
    const r2 = addImage(adopted.doc, adopted.state, imgB)
    expect(readGallery(r2.doc, gid)!.images.length).toBe(2)
  })
})


describe('deriveGalleryOnLoad — page load derivation (pending localStorage semantics)', () => {
  const store = new Map<string, string>()
  const LS = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  }

  function readPending(key: string): PendingGalleryRecord | null {
    try {
      const raw = LS.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  it('valid pending record matches single standalone image → adopted with SESSION gid (not pending.gid)', () => {
    store.set('contentStudio.pending.d1', JSON.stringify({ gid: 'stored-g1', mediaId: imgA.mediaId }))
    const doc: BareDoc = { type: 'doc', content: [{ type: 'image', attrs: { ...imgA } }] }
    const derived = deriveGalleryOnLoad(doc, 'session-g2', readPending('contentStudio.pending.d1'))
    expect(derived.state).not.toBeNull()
    // page semantics: session gid wins; pending.gid is storage-only
    expect(derived.state!.gid).toBe('session-g2')
    expect(derived.state!.images[0].mediaId).toBe(imgA.mediaId)
    // second image converts to gallery under the session gid
    const r2 = addImage(derived.doc, derived.state, imgB)
    expect(readGallery(r2.doc, 'session-g2')!.images.length).toBe(2)
  })

  it('corrupted JSON → treated as no pending record', () => {
    store.set('contentStudio.pending.d2', '{broken json')
    expect(readPending('contentStudio.pending.d2')).toBeNull()
    const doc: BareDoc = { type: 'doc', content: [{ type: 'image', attrs: { ...imgA } }] }
    const derived = deriveGalleryOnLoad(doc, 'session-g3', readPending('contentStudio.pending.d2'))
    expect(derived.state).toBeNull()
    expect(derived.doc.content[0].attrs.gid).toBeUndefined()
  })

  it('mediaId mismatch → page guard rejects adoption', () => {
    store.set('contentStudio.pending.d3', JSON.stringify({ gid: 'stored-g3', mediaId: 'other-id' }))
    const doc: BareDoc = { type: 'doc', content: [{ type: 'image', attrs: { ...imgA } }] }
    const derived = deriveGalleryOnLoad(doc, 'session-g4', readPending('contentStudio.pending.d3'))
    expect(derived.state).toBeNull()
    // image not tagged when adoption rejected
    expect(derived.doc.content[0].attrs.gid).toBeUndefined()
  })

  it('doc with gallery node → adopts first gallery with session gid', () => {
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA); doc = r1.doc
    const r2 = addImage(doc, r1.state, imgB); doc = r2.doc
    const derived = deriveGalleryOnLoad(doc, 'session-g5', null)
    expect(derived.state).not.toBeNull()
    expect(derived.state!.gid).toBe('session-g5')
    expect(derived.state!.images.length).toBe(2)
    expect(derived.doc.content[0].type).toBe('gallery')
    expect(derived.doc.content[0].attrs.gid).toBe('session-g5')
  })

  it('no pending record → standalone image stays untagged, no gallery state', () => {
    const doc: BareDoc = { type: 'doc', content: [{ type: 'image', attrs: { ...imgA } }] }
    const derived = deriveGalleryOnLoad(doc, 'session-g6', null)
    expect(derived.state).toBeNull()
    expect(derived.doc.content[0].attrs.gid).toBeUndefined()
  })

  it('multiple standalone images → no adoption even with matching pending', () => {
    const doc: BareDoc = { type: 'doc', content: [
      { type: 'image', attrs: { ...imgA } },
      { type: 'image', attrs: { ...imgB } },
    ] }
    const derived = deriveGalleryOnLoad(doc, 'session-g7', { gid: 'stored-g7', mediaId: imgA.mediaId })
    expect(derived.state).toBeNull()
  })
})

describe('deriveGalleryState — applyDoc runtime derivation (regression)', () => {
  it('standalone candidate re-derived by gid; second image converts to gallery', () => {
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA)
    doc = r1.doc
    const state = deriveGalleryState(doc, r1.state.gid)!
    expect(state.images.length).toBe(1)
    expect(state.images[0].mediaId).toBe(imgA.mediaId)
    const r2 = addImage(doc, state, imgB)
    const g = readGallery(r2.doc, r2.state.gid)!
    expect(g.images.length).toBe(2)
    expect(g.images[0]).toEqual(imgA)
    expect(g.images[1]).toEqual(imgB)
  })

  it('REGRESSION: single-image candidate survives inserting an unrelated standalone image, then converts', () => {
    // 1) single-image gallery candidate (gid-tagged standalone node)
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA)
    doc = r1.doc
    const gid = r1.state.gid
    // 2) insert an unrelated standalone image (no gid) — page insertSingleImage path.
    //    applyDoc must KEEP the candidate, not wipe it.
    doc = { type: 'doc', content: [
      ...doc.content,
      { type: 'image', attrs: { mediaId: 'unrelated-1111-2222-3333-444455556666', alt: 'X', align: 'center', displayWidth: 75 } },
    ] }
    const state = deriveGalleryState(doc, gid)
    expect(state).not.toBeNull()
    expect(state!.images.length).toBe(1)
    expect(state!.images[0].mediaId).toBe(imgA.mediaId)
    // 3) second gallery image converts candidate → gallery; unrelated image stays standalone
    const r2 = addImage(doc, state!, imgB)
    const g = readGallery(r2.doc, gid)!
    expect(g.images.map(i => i.mediaId)).toEqual([imgA.mediaId, imgB.mediaId])
    const unrelatedNodes = r2.doc.content.filter(n => n.type === 'image')
    expect(unrelatedNodes.length).toBe(1)
    expect(unrelatedNodes[0].attrs.mediaId).toBe('unrelated-1111-2222-3333-444455556666')
  })

  it('existing gallery survives inserting an unrelated standalone image', () => {
    let doc = emptyDoc()
    const r1 = addImage(doc, null, imgA); doc = r1.doc
    const r2 = addImage(doc, r1.state, imgB); doc = r2.doc
    const gid = r2.state.gid
    doc = { type: 'doc', content: [
      ...doc.content,
      { type: 'image', attrs: { mediaId: 'unrelated-1111-2222-3333-444455556666', alt: 'X', align: 'center', displayWidth: 75 } },
    ] }
    const state = deriveGalleryState(doc, gid)
    expect(state).not.toBeNull()
    expect(state!.images.length).toBe(2)
    expect(state!.images.map(i => i.mediaId)).toEqual([imgA.mediaId, imgB.mediaId])
  })

  it('no gid → null state', () => {
    expect(deriveGalleryState(emptyDoc(), null)).toBeNull()
    expect(deriveGalleryState(emptyDoc(), '')).toBeNull()
  })
})

describe('contentDocumentHelpers', () => {
  it('buildSaveDraftBody wraps with envelope and canonicalizes', () => {
    const bare: any = { type: 'doc', content: [{ type: 'image', attrs: { mediaId: 'a1b2c3d4-e5f6-4789-ab12-cd3456789012', alt: 'x', align: 'center', displayWidth: 75, gid: 'g123' } }] }
    const body = buildSaveDraftBody(bare, META, 3)
    expect(body.expectedRevision).toBe(3)
    expect(body.document.schemaVersion).toBe('content.document.v1')
    // gid stripped at save boundary
    expect(body.document.doc.content[0].attrs.gid).toBeUndefined()
  })
})
