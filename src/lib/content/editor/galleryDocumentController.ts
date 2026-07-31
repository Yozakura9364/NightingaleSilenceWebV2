// galleryDocumentController — pure production module for gallery doc operations.
// Gallery nodes carry a unique `gid`; operations locate the gallery by gid,
// so positions survive edits before the gallery and multiple galleries coexist.

export interface GalleryImage {
  mediaId: string
  alt: string
  caption?: string | null
  align: string
  displayWidth: number
}

export interface BareDoc {
  type: 'doc'
  content: any[]
}

export interface GalleryState {
  gid: string
  images: GalleryImage[]
  layout: string
}

const GALLERY_MIN = 2

export function imageNode(img: GalleryImage) {
  return {
    type: 'image',
    attrs: {
      mediaId: img.mediaId, alt: img.alt,
      caption: img.caption || null, align: img.align, displayWidth: img.displayWidth
    }
  }
}

export function galleryNode(images: GalleryImage[], layout: string, gid: string) {
  return {
    type: 'gallery', attrs: { layout, gid },
    content: images.map(imageNode)
  }
}

function clone(doc: BareDoc): BareDoc {
  return JSON.parse(JSON.stringify(doc)) as BareDoc
}

function imageToGal(img: any): GalleryImage {
  return {
    mediaId: img.attrs?.mediaId || '', alt: img.attrs?.alt || '',
    caption: img.attrs?.caption || null, align: img.attrs?.align || 'center',
    displayWidth: img.attrs?.displayWidth || 75,
  }
}

/** Recursively locate the gallery node with gid. Returns {index, node} or null. */
function findGalleryByGid(doc: BareDoc, gid: string): { index: number; node: any } | null {
  for (let i = 0; i < doc.content.length; i++) {
    const n = doc.content[i]
    if (n.type === 'gallery' && n.attrs?.gid === gid) return { index: i, node: n }
  }
  return null
}

/** Locate the standalone image node with the given gid (used for 1-image state). */
function findImageByGid(doc: BareDoc, gid: string): { index: number; node: any } | null {
  for (let i = 0; i < doc.content.length; i++) {
    const n = doc.content[i]
    if (n.type === 'image' && n.attrs?.gid === gid) return { index: i, node: n }
  }
  return null
}

/** Read gallery state by gid; null if node missing. */
export function readGallery(doc: BareDoc, gid: string): GalleryState | null {
  const found = findGalleryByGid(doc, gid)
  if (!found) return null
  return {
    gid,
    layout: found.node.attrs?.layout || 'two-column',
    images: (found.node.content || []).map(imageToGal),
  }
}

/** A standalone image carrying the gid is a 1-image gallery state (pending gallery). */
export function readStandaloneByGid(doc: BareDoc, gid: string): GalleryState | null {
  if (!gid) return null
  const found = findImageByGid(doc, gid)
  if (!found) return null
  return { gid, layout: 'two-column', images: [imageToGal(found.node)] }
}

function newGid(): string {
  return 'g' + Math.random().toString(36).slice(2, 10)
}

/** First image: standalone node tagged with gid (so we can find it later). */
export function addFirstImage(doc: BareDoc, img: GalleryImage, gid: string): { doc: BareDoc; state: GalleryState } {
  const next = clone(doc)
  next.content.push({ type: 'image', attrs: { ...img, gid } })
  return { doc: next, state: { gid, images: [img], layout: 'two-column' } }
}

/** Second image: replace the gid-tagged standalone node with a gallery. */
export function addSecondImage(
  doc: BareDoc, state: GalleryState, img: GalleryImage
): { doc: BareDoc; state: GalleryState } {
  const next = clone(doc)
  const found = findImageByGid(next, state.gid)
  if (!found) throw new Error('galleryDocumentController: standalone image not found')
  const images = [...state.images, img]
  next.content[found.index] = galleryNode(images, state.layout, state.gid)
  return { doc: next, state: { ...state, images } }
}

/** Append image to existing gallery (>= 2 images). */
export function appendToGallery(
  doc: BareDoc, state: GalleryState, img: GalleryImage
): { doc: BareDoc; state: GalleryState } {
  const next = clone(doc)
  const found = findGalleryByGid(next, state.gid)
  if (!found) throw new Error('galleryDocumentController: gallery node not found')
  const images = [...state.images, img]
  found.node.content = images.map(imageNode)
  return { doc: next, state: { ...state, images } }
}

/** Add an image to whatever gallery state exists; picks the right transition. */
export function addImage(
  doc: BareDoc, state: GalleryState | null, img: GalleryImage
): { doc: BareDoc; state: GalleryState } {
  if (!state) return addFirstImage(doc, img, newGid())
  if (state.images.length === 0) return addFirstImage(doc, img, state.gid)
  if (state.images.length === 1) return addSecondImage(doc, state, img)
  return appendToGallery(doc, state, img)
}

/** Remove image at images[index]. Handles 2→1 (gallery→standalone) and 1→0 (delete node). */
export function removeImage(
  doc: BareDoc, state: GalleryState, index: number
): { doc: BareDoc; state: GalleryState | null } {
  const next = clone(doc)
  const images = state.images.filter((_, i) => i !== index)
  if (images.length >= GALLERY_MIN) {
    const found = findGalleryByGid(next, state.gid)
    if (!found) throw new Error('galleryDocumentController: gallery node not found')
    found.node.content = images.map(imageNode)
    return { doc: next, state: { ...state, images } }
  }
  if (images.length === 1) {
    // gallery → standalone image (keep gid so it can become gallery again)
    const found = findGalleryByGid(next, state.gid)
    if (!found) throw new Error('galleryDocumentController: gallery node not found')
    next.content[found.index] = { type: 'image', attrs: { ...images[0], gid: state.gid } }
    return { doc: next, state: { ...state, images } }
  }
  // 0 images: delete node entirely (gallery or standalone)
  const found = findGalleryByGid(next, state.gid) || findImageByGid(next, state.gid)
  if (found) next.content.splice(found.index, 1)
  return { doc: next, state: null }
}

/** Move image within gallery from → to. */
export function moveImage(
  doc: BareDoc, state: GalleryState, from: number, to: number
): { doc: BareDoc; state: GalleryState } {
  const next = clone(doc)
  const found = findGalleryByGid(next, state.gid)
  if (!found) throw new Error('galleryDocumentController: gallery node not found')
  const images = [...state.images]
  const [moved] = images.splice(from, 1)
  images.splice(to, 0, moved)
  found.node.content = images.map(imageNode)
  return { doc: next, state: { ...state, images } }
}

/** Set gallery layout. */
export function setLayout(
  doc: BareDoc, state: GalleryState, layout: string
): { doc: BareDoc; state: GalleryState } {
  const next = clone(doc)
  const found = findGalleryByGid(next, state.gid)
  if (!found) throw new Error('galleryDocumentController: gallery node not found')
  found.node.attrs = { ...found.node.attrs, layout }
  return { doc: next, state: { ...state, layout } }
}

/** Return the gid of the first gallery in the doc, if any. */
export function findFirstGalleryGid(doc: BareDoc): string | null {
  for (const n of doc.content) {
    if (n.type === 'gallery' && n.attrs?.gid) return n.attrs.gid
  }
  return null
}

/** After load (gid stripped at save), re-tag the first gallery with a session gid. */
export function adoptFirstGallery(doc: BareDoc, gid: string): { doc: BareDoc; state: GalleryState } {
  const next = clone(doc)
  for (const n of next.content) {
    if (n.type === 'gallery') {
      n.attrs = { ...n.attrs, gid }
      return { doc: next, state: readGallery(next, gid)! }
    }
  }
  throw new Error('galleryDocumentController: no gallery to adopt')
}

/**
 * Re-tag the single standalone image as the pending gallery candidate.
 * Only used when session knows the draft previously had a 1-image pending state.
 */
export function adoptStandaloneImage(doc: BareDoc, gid: string): { doc: BareDoc; state: GalleryState } | null {
  const next = clone(doc)
  const standalone = next.content.filter(n => n.type === 'image')
  if (standalone.length !== 1) return null
  standalone[0].attrs = { ...standalone[0].attrs, gid }
  const img = imageToGal(standalone[0])
  return { doc: next, state: { gid, images: [img], layout: 'two-column' } }
}

/** localStorage 持久化的单图候选记录。mediaId 参与加载匹配;gid 仅作存储兼容,加载收养一律使用会话 gid。 */
export interface PendingGalleryRecord {
  gid: string
  mediaId: string
}

/**
 * 运行时状态推导(页面 applyDoc 使用):
 * 按 gid 优先读取 gallery 节点;文档中不存在该 gid 的 gallery 时,
 * 回退读取同 gid 的独立图(单图候选,即 pending gallery)。
 * 修复边界回归:候选单图存在时插入无关独立图,候选状态不再被清空。
 */
export function deriveGalleryState(doc: BareDoc, gid: string | null): GalleryState | null {
  if (!gid) return null
  return readGallery(doc, gid) ?? readStandaloneByGid(doc, gid)
}

/**
 * 文档加载后推导 gallery 状态(页面 selectDraft / autosave.recover 使用):
 * - doc 含 gallery 节点 → 用 sessionGid 收养第一个 gallery;
 * - 否则仅一条独立图且与 pending.mediaId 匹配 → 收养为单图候选(使用 sessionGid,而非 pending.gid);
 * - 否则无 gallery 状态。
 */
export function deriveGalleryOnLoad(
  doc: BareDoc, sessionGid: string, pending: PendingGalleryRecord | null
): { doc: BareDoc; state: GalleryState | null } {
  const hasGallery = doc.content.some((n: any) => n.type === 'gallery')
  if (hasGallery) return adoptFirstGallery(doc, sessionGid)
  const standaloneImgs = doc.content.filter((n: any) => n.type === 'image')
  if (pending && standaloneImgs.length === 1 && standaloneImgs[0].attrs?.mediaId === pending.mediaId) {
    return adoptStandaloneImage(doc, sessionGid) ?? { doc, state: null }
  }
  return { doc, state: null }
}
