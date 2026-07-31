// T033 — public content builder/checker tests.
// Covers stable ordering, publicId paths, draft exclusion, atomic generation,
// last-known-good protection and checker fault detection.
import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildPublicContent } from '../../../scripts/content/build-public-content.mjs'
import { checkPublicContent } from '../../../scripts/content/check-public-content.mjs'
import { snapshotHash } from '../../../scripts/content/lib/public-content-core.mjs'

const MEDIA_HOST = 'https://img.nightingalesilence.com/content/'

function makeSnapshot(overrides = {}) {
  const publicId = overrides.publicId ?? 1
  const snap = {
    schemaVersion: 'content.publication.v1',
    entryId: `00000000-0000-4000-8000-${String(publicId).padStart(12, '0')}`,
    publicId,
    revision: 3,
    publishedAt: '2026-07-30T00:00:00+00:00',
    publicPath: `/data/content/entries/${publicId}.json`,
    metadata: { title: `Title ${publicId}`, summary: null, coverMediaId: null, tags: ['t1'] },
    document: {
      schemaVersion: 'content.document.v1',
      doc: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `Body ${publicId}` }] }],
      },
    },
    media: [],
  }
  const merged = { ...snap, ...overrides }
  if (merged.generationHash === undefined) {
    // same algorithm as the publish side (Python _snapshot_hash)
    merged.generationHash = snapshotHash(merged)
  }
  return merged
}

function makeSnapshotDir() {
  const dir = mkdtempSync(join(tmpdir(), 'content-pub-'))
  return { root: dir, publishedDir: join(dir, 'published'), outDir: join(dir, 'out') }
}

function writePublished(publishedDir, snapshots) {
  mkdirSync(publishedDir, { recursive: true })
  for (const s of snapshots) {
    writeFileSync(join(publishedDir, `${s.publicId}.json`), JSON.stringify(s, null, 2), 'utf8')
  }
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'))
}

function build(ctx, snapshots, extra = {}) {
  writePublished(ctx.publishedDir, snapshots)
  return buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST, ...extra })
}

describe('buildPublicContent', () => {
  it('generates index + entries with ascending publicId and no internal fields', () => {
    const ctx = makeSnapshotDir()
    const r = build(ctx, [makeSnapshot({ publicId: 2 }), makeSnapshot({ publicId: 1 })])
    expect(r.ok).toBe(true)
    const index = readJson(join(ctx.outDir, 'index.json'))
    expect(index.schemaVersion).toBe('content.index.v1')
    expect(index.entries.map(e => e.publicId)).toEqual([1, 2])
    expect(index.entries[0].title).toBe('Title 1')
    expect(index.entries[0]).not.toHaveProperty('entryId')
    const entry = readJson(join(ctx.outDir, 'entries', '1.json'))
    expect(entry.schemaVersion).toBe('content.entry.v1')
    expect(entry.publicId).toBe(1)
    expect(entry.generationHash).toMatch(/^[0-9a-f]{64}$/)
    expect(entry.document.doc.content[0].content[0].text).toBe('Body 1')
    // internal identity never leaks to public output
    expect(JSON.stringify(entry)).not.toContain('entryId')
    expect(JSON.stringify(index)).not.toContain('entryId')
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('is deterministic: two builds produce byte-identical output', () => {
    const ctx = makeSnapshotDir()
    const snaps = [makeSnapshot({ publicId: 3 }), makeSnapshot({ publicId: 1 }), makeSnapshot({ publicId: 2 })]
    expect(build(ctx, snaps).ok).toBe(true)
    const firstIndex = readFileSync(join(ctx.outDir, 'index.json'))
    const firstEntry = readFileSync(join(ctx.outDir, 'entries', '2.json'))
    expect(build(ctx, snaps).ok).toBe(true)
    expect(readFileSync(join(ctx.outDir, 'index.json'))).toEqual(firstIndex)
    expect(readFileSync(join(ctx.outDir, 'entries', '2.json'))).toEqual(firstEntry)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('rejects a non-publication file (draft leakage) and keeps last-known-good', () => {
    const ctx = makeSnapshotDir()
    expect(build(ctx, [makeSnapshot({ publicId: 1 })]).ok).toBe(true)
    const goodIndex = readFileSync(join(ctx.outDir, 'index.json'))
    // inject a draft-like file into published/ then rebuild
    writeFileSync(join(ctx.publishedDir, '9.json'), JSON.stringify({ schemaVersion: 'content.draft.v1', title: 'draft' }), 'utf8')
    const r = buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/snapshot|publication/i)
    // previous output untouched
    expect(readFileSync(join(ctx.outDir, 'index.json'))).toEqual(goodIndex)
    expect(existsSync(join(ctx.outDir, 'entries', '1.json'))).toBe(true)
    // no stray temp/staging dirs
    expect(existsSync(join(ctx.outDir + '.tmp'))).toBe(false)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('rejects media outside the stable host, signed URLs, base64 and local paths', () => {
    const badMedia = [
      { label: 'foreign host', media: [{ id: 'm1', mediaType: 'image/png', publicUrl: 'https://evil.example/x.png' }] },
      { label: 'signed url', media: [{ id: 'm1', mediaType: 'image/png', publicUrl: `${MEDIA_HOST}x.png?X-Amz-Signature=abc` }] },
    ]
    for (const { label, media } of badMedia) {
      const ctx = makeSnapshotDir()
      const r = build(ctx, [makeSnapshot({ publicId: 1, media })])
      expect(r.ok, `should reject: ${label}`).toBe(false)
      expect(existsSync(join(ctx.outDir, 'index.json')), `no output for ${label}`).toBe(false)
      rmSync(ctx.root, { recursive: true, force: true })
    }
    // base64 data URI inside the document
    const ctx2 = makeSnapshotDir()
    const withB64 = makeSnapshot({ publicId: 1 })
    withB64.document.doc.content[0].content[0].text = 'data:image/png;base64,AAAA'
    withB64.generationHash = snapshotHash(withB64)
    writePublished(ctx2.publishedDir, [withB64])
    const r2 = buildPublicContent({ publishedDir: ctx2.publishedDir, outDir: ctx2.outDir, mediaHost: MEDIA_HOST })
    expect(r2.ok).toBe(false)
    rmSync(ctx2.root, { recursive: true, force: true })
    // local path inside the document
    const ctx3 = makeSnapshotDir()
    const withPath = makeSnapshot({ publicId: 1 })
    withPath.document.doc.content[0].content[0].text = 'C:\\Users\\13359\\secret.png'
    withPath.generationHash = snapshotHash(withPath)
    writePublished(ctx3.publishedDir, [withPath])
    const r3 = buildPublicContent({ publishedDir: ctx3.publishedDir, outDir: ctx3.outDir, mediaHost: MEDIA_HOST })
    expect(r3.ok).toBe(false)
    rmSync(ctx3.root, { recursive: true, force: true })
  })

  it('rejects duplicate publicId snapshots', () => {
    const ctx = makeSnapshotDir()
    // two distinct files whose *content* carries the same publicId
    const a = makeSnapshot({ publicId: 1, entryId: '10000000-0000-4000-8000-000000000001' })
    const b = makeSnapshot({ publicId: 1, entryId: '20000000-0000-4000-8000-000000000002' })
    writePublished(ctx.publishedDir, [a])
    writeFileSync(join(ctx.publishedDir, '2.json'), JSON.stringify(b, null, 2), 'utf8')
    const r = buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/duplicate|publicId/i)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('drops entries whose snapshot was withdrawn/archived (file removed)', () => {
    const ctx = makeSnapshotDir()
    expect(build(ctx, [makeSnapshot({ publicId: 1 }), makeSnapshot({ publicId: 2 })]).ok).toBe(true)
    expect(existsSync(join(ctx.outDir, 'entries', '2.json'))).toBe(true)
    // withdraw/archive removes the snapshot file; rebuild drops it
    rmSync(join(ctx.publishedDir, '2.json'))
    expect(build(ctx, [makeSnapshot({ publicId: 1 })]).ok).toBe(true)
    expect(existsSync(join(ctx.outDir, 'entries', '2.json'))).toBe(false)
    expect(readJson(join(ctx.outDir, 'index.json')).entries.map(e => e.publicId)).toEqual([1])
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('rejects invalid document structure (non-canonical)', () => {
    const ctx = makeSnapshotDir()
    const bad = makeSnapshot({ publicId: 1 })
    bad.document = { foo: 'bar' }
    writePublished(ctx.publishedDir, [bad])
    const r = buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/document|node|schemaVersion/i)
    expect(existsSync(join(ctx.outDir, 'index.json'))).toBe(false)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('rejects unresolved media:// references in the document', () => {
    const ctx = makeSnapshotDir()
    const withRef = makeSnapshot({ publicId: 1 })
    withRef.document.doc.content.push({
      type: 'image',
      attrs: { mediaId: 'm-missing', src: 'media://m-missing', alt: '', align: 'center', displayWidth: 75 },
    })
    // re-hash after the content change so the media check is what fails
    withRef.generationHash = snapshotHash(withRef)
    writePublished(ctx.publishedDir, [withRef])
    const r = buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/unresolved media|media reference/i)
    // no output may contain an unresolved internal reference
    expect(existsSync(join(ctx.outDir, 'index.json'))).toBe(false)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('rejects invalid generationHash format and stale hash after content change', () => {
    // non-hex hash must be rejected outright
    const ctx1 = makeSnapshotDir()
    writePublished(ctx1.publishedDir, [makeSnapshot({ publicId: 1, generationHash: 'not-a-sha256' })])
    const r1 = buildPublicContent({ publishedDir: ctx1.publishedDir, outDir: ctx1.outDir, mediaHost: MEDIA_HOST })
    expect(r1.ok).toBe(false)
    expect(r1.error).toMatch(/sha256|generationHash/i)
    rmSync(ctx1.root, { recursive: true, force: true })
    // content changed while hash stays stale -> recompute must fail the checker
    const ctx2 = makeSnapshotDir()
    expect(build(ctx2, [makeSnapshot({ publicId: 1 })]).ok).toBe(true)
    const snapPath = join(ctx2.publishedDir, '1.json')
    const snap = JSON.parse(readFileSync(snapPath, 'utf8'))
    snap.metadata.title = 'Tampered'
    writeFileSync(snapPath, JSON.stringify(snap), 'utf8')
    const r2 = checkPublicContent({ publishedDir: ctx2.publishedDir, outDir: ctx2.outDir, mediaHost: MEDIA_HOST })
    expect(r2.ok).toBe(false)
    expect(r2.errors.join('\n')).toMatch(/tampered|generationHash/i)
    rmSync(ctx2.root, { recursive: true, force: true })
  })

  it('rejects schema violations: parent/child relations, required attrs, extra fields, marks, bounds', () => {
    const UUID1 = '00000000-0000-4000-8000-000000000001'
    const img = (extra = {}) => ({ type: 'image', attrs: { mediaId: UUID1, alt: '', align: 'center', displayWidth: 75, ...extra } })
    const para = (text = 'x') => ({ type: 'paragraph', content: [{ type: 'text', text }] })
    const cases = [
      { name: 'table with paragraph child', mutate: (doc) => { doc.doc.content = [{ type: 'table', content: [para()] }] } },
      { name: 'gallery with paragraph child', mutate: (doc) => { doc.doc.content = [{ type: 'gallery', attrs: { layout: 'grid' }, content: [para()] }] } },
      { name: 'listItem at document root', mutate: (doc) => { doc.doc.content = [{ type: 'listItem', content: [para()] }] } },
      { name: 'image missing alt', mutate: (doc) => { doc.doc.content = [img()]; delete doc.doc.content[0].attrs.alt } },
      { name: 'image unknown attr', mutate: (doc) => { doc.doc.content = [img({ unknown: 1 })] } },
      { name: 'unknown mark', mutate: (doc) => { doc.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'glow' }] }] }] } },
      { name: 'gallery below min items', mutate: (doc) => { doc.doc.content = [{ type: 'gallery', attrs: { layout: 'grid' }, content: [img()] }] } },
      { name: 'text node extra field', mutate: (doc) => { doc.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'x', bogus: true }] }] } },
    ]
    for (const { name, mutate } of cases) {
      const ctx = makeSnapshotDir()
      const snap = makeSnapshot({ publicId: 1 })
      mutate(snap.document)
      snap.generationHash = snapshotHash(snap)
      writePublished(ctx.publishedDir, [snap])
      const r = buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
      expect(r.ok, `should reject: ${name}`).toBe(false)
      expect(existsSync(join(ctx.outDir, 'index.json')), `no output for: ${name}`).toBe(false)
      rmSync(ctx.root, { recursive: true, force: true })
    }
  })
})

describe('checkPublicContent', () => {
  function built(ctx, snapshots) {
    writePublished(ctx.publishedDir, snapshots)
    const r = buildPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(true)
  }

  it('passes on a clean generated tree', () => {
    const ctx = makeSnapshotDir()
    built(ctx, [makeSnapshot({ publicId: 1 }), makeSnapshot({ publicId: 2 })])
    const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('fails on residual .bak/.retired/.tmp files in published/', () => {
    const ctx = makeSnapshotDir()
    built(ctx, [makeSnapshot({ publicId: 1 })])
    for (const suffix of ['.bak', '.retired', '.tmp']) {
      writeFileSync(join(ctx.publishedDir, `1.json${suffix}`), '{}', 'utf8')
      const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
      expect(r.ok, `should fail on ${suffix}`).toBe(false)
      expect(r.errors.join('\n')).toMatch(/residual|orphan|\.bak|\.retired|\.tmp/)
      rmSync(join(ctx.publishedDir, `1.json${suffix}`))
    }
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('fails when an entry file referenced by the index is missing', () => {
    const ctx = makeSnapshotDir()
    built(ctx, [makeSnapshot({ publicId: 1 }), makeSnapshot({ publicId: 2 })])
    rmSync(join(ctx.outDir, 'entries', '2.json'))
    const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.errors.join('\n')).toMatch(/2\.json|missing/i)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('fails on tampered entry content (title mismatch)', () => {
    const ctx = makeSnapshotDir()
    built(ctx, [makeSnapshot({ publicId: 1 })])
    const entryPath = join(ctx.outDir, 'entries', '1.json')
    const entry = readJson(entryPath)
    entry.title = 'Tampered'
    writeFileSync(entryPath, JSON.stringify(entry), 'utf8')
    const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.errors.join('\n')).toMatch(/1\.json|inconsistent|tamper/i)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('fails on index/entry inconsistency and invalid media in output', () => {
    const ctx = makeSnapshotDir()
    built(ctx, [makeSnapshot({ publicId: 1 })])
    // index tampered: drop the entry row
    const indexPath = join(ctx.outDir, 'index.json')
    const index = readJson(indexPath)
    index.entries = []
    writeFileSync(indexPath, JSON.stringify(index), 'utf8')
    const r1 = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r1.ok).toBe(false)
    // invalid media URL hand-injected into output entry
    const entryPath = join(ctx.outDir, 'entries', '1.json')
    const entry = readJson(entryPath)
    entry.media = [{ mediaId: 'm1', mediaType: 'image/png', publicUrl: 'http://insecure.example/x.png' }]
    writeFileSync(entryPath, JSON.stringify(entry), 'utf8')
    const r2 = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r2.ok).toBe(false)
    expect(r2.errors.join('\n')).toMatch(/media|url|host/i)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('fails when output tree has leftovers but no published snapshots', () => {
    const ctx = makeSnapshotDir()
    // stale output without any published snapshot (index.json even missing)
    mkdirSync(join(ctx.outDir, 'entries'), { recursive: true })
    writeFileSync(join(ctx.outDir, 'entries', '1.json'), '{}', 'utf8')
    const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.errors.join('\n')).toMatch(/stale|remain/i)
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('passes when both published/ and output are absent (empty state)', () => {
    const ctx = makeSnapshotDir()
    const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
    rmSync(ctx.root, { recursive: true, force: true })
  })

  it('fails on leftover build backup/staging dirs next to output', () => {
    const ctx = makeSnapshotDir()
    built(ctx, [makeSnapshot({ publicId: 1 })])
    mkdirSync(join(ctx.outDir, '..', 'content.bak-1-deadbeef'), { recursive: true })
    const r = checkPublicContent({ publishedDir: ctx.publishedDir, outDir: ctx.outDir, mediaHost: MEDIA_HOST })
    expect(r.ok).toBe(false)
    expect(r.errors.join('\n')).toMatch(/content\.bak|leftover/i)
    rmSync(ctx.root, { recursive: true, force: true })
  })
})
