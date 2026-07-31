// Shared core for the public content generator/checker (T038/T039).
// Both scripts derive the public view from content.publication.v1 snapshots
// through the exact same functions, so index/entries can never drift apart.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const INDEX_SCHEMA = 'content.index.v1'
export const ENTRY_SCHEMA = 'content.entry.v1'
export const SNAPSHOT_SCHEMA = 'content.publication.v1'

export const DEFAULT_MEDIA_HOST = 'https://img.nightingalesilence.com/content/'

/** A stable public media URL: exact configured HTTPS host prefix, no query/credential params. */
export function isStableMediaUrl(url, mediaHost = DEFAULT_MEDIA_HOST) {
  if (typeof url !== 'string' || !url) return false
  if (!url.startsWith(mediaHost)) return false
  if (url.includes('?')) return false // signed/expiring/credential params
  return true
}

const LEAK_PATTERNS = [
  { re: /data:[a-z0-9+/]+;base64,/i, label: 'base64 data URI' },
  { re: /^[a-zA-Z]:[\\/]/, label: 'windows drive path' },
  { re: /\\\\/, label: 'backslash path' },
  { re: /file:\/\//i, label: 'file URL' },
]

/** Scan every string value in a JSON tree for local-path/base64 leakage. */
export function findLeaks(value) {
  const found = []
  const walk = (v, path) => {
    if (typeof v === 'string') {
      for (const { re, label } of LEAK_PATTERNS) {
        if (re.test(v)) {
          found.push({ path: path || '(root)', label, sample: v.slice(0, 60) })
          break
        }
      }
      return
    }
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${path}[${i}]`))
      return
    }
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v)) walk(val, path ? `${path}.${k}` : k)
    }
  }
  walk(value, '')
  return found
}

// ---- canonical document structure validation. Mirrors the constraints of
// editor-document.schema.json (parent/child relations, required attrs,
// additionalProperties:false, marks and array bounds) so tampered snapshots
// fail closed. The Python side remains the full JSON-Schema validator at the
// write boundary; this guard is the generation/check boundary. ----
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'codeBlock', 'horizontalRule', 'table', 'image', 'gallery', 'collapse'])
const INLINE_TYPES = new Set(['text', 'hardBreak'])
// container nodes are legal under their specific parents (not at doc root)
const NODE_TYPES = new Set([...BLOCK_TYPES, ...INLINE_TYPES, 'listItem', 'tableRow', 'tableCell', 'tableHeader'])
const MAX_DEPTH = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

// item: 'block' | 'inline' | concrete node type(s)
const CONTENT_RULES = {
  doc: { item: 'block' },
  paragraph: { item: 'inline', max: 2000 },
  heading: { item: 'inline', min: 1, max: 500 },
  blockquote: { item: 'block', min: 1, max: 200 },
  bulletList: { item: 'listItem', min: 1, max: 500 },
  orderedList: { item: 'listItem', min: 1, max: 500 },
  listItem: { item: 'block', min: 1, max: 100 },
  codeBlock: { item: 'plainText', max: 1 },
  table: { item: 'tableRow', min: 1, max: 100 },
  tableRow: { item: 'cell', min: 1, max: 50 },
  tableCell: { item: 'block', min: 1, max: 200 },
  tableHeader: { item: 'block', min: 1, max: 200 },
  gallery: { item: 'image', min: 2, max: 20 },
  collapse: { item: 'block', min: 1, max: 1000 },
}

// attrs: { field: {type|enum|max|min|pattern|nullable} }, required: [..]
const ATTR_RULES = {
  heading: {
    attrs: { level: { enum: [2, 3, 4] }, textAlign: { enum: ['left', 'center', 'right', 'justify'] } },
    required: ['level'],
  },
  orderedList: { attrs: { start: { int: [1, 9999] } } },
  codeBlock: { attrs: { language: { str: [0, 32], pattern: /^[A-Za-z0-9_+.#-]*$/, nullable: true } } },
  tableCell: { attrs: cellAttrs() },
  tableHeader: { attrs: cellAttrs() },
  image: {
    attrs: {
      mediaId: { str: [36, 36], pattern: UUID_RE },
      src: { str: [0, 2048], pattern: /^(https:\/\/|media:\/\/)/, nullable: true },
      alt: { str: [0, 300] },
      caption: { str: [0, 500], nullable: true },
      align: { enum: ['left', 'center', 'right'] },
      displayWidth: { enum: [25, 50, 75, 100] },
      width: { int: [1, 16384], nullable: true },
      height: { int: [1, 16384], nullable: true },
    },
    required: ['mediaId', 'alt', 'align', 'displayWidth'],
  },
  gallery: { attrs: { layout: { enum: ['two-column', 'three-column', 'grid'] } }, required: ['layout'] },
  collapse: { attrs: { title: { str: [1, 120] } }, required: ['title'] },
}

function cellAttrs() {
  return {
    colspan: { int: [1, 50] },
    rowspan: { int: [1, 100] },
    colwidth: { arrayInt: [25, 4096], maxItems: 50 },
    textAlign: { enum: ['left', 'center', 'right', 'justify'] },
  }
}

const MARK_RULES = {
  bold: {}, italic: {}, underline: {}, strike: {}, code: {},
  textStyle: { attrs: { color: { str: [7, 7], pattern: /^#[0-9A-Fa-f]{6}$/, nullable: true }, sizePercent: { enum: [null, 75, 100, 125, 150, 200] } } },
  link: { attrs: { href: { str: [1, 2048], pattern: /^(https?:\/\/|mailto:|\/(?!\/)|#)/ }, target: { enum: [null, '_blank'] }, rel: { enum: [null, 'noopener noreferrer nofollow'] } }, required: ['href'] },
}

function checkAttrs(node, rules, errors, where) {
  const attrs = node.attrs
  if (attrs === undefined) {
    if (rules.required && rules.required.length > 0) {
      for (const k of rules.required) errors.push(`${where}: missing required attrs.${k}`)
    }
    return
  }
  if (attrs === null || typeof attrs !== 'object' || Array.isArray(attrs)) {
    errors.push(`${where}: attrs must be an object`)
    return
  }
  if (rules.attrs) {
    for (const k of Object.keys(attrs)) {
      if (!(k in rules.attrs)) errors.push(`${where}: unknown attr ${JSON.stringify(k)}`)
    }
    for (const [k, rule] of Object.entries(rules.attrs)) {
      const v = attrs[k]
      if (v === undefined) continue
      if (v === null) {
        if (rule.nullable) continue
        errors.push(`${where}: attrs.${k} must not be null`)
        continue
      }
      if (rule.enum !== undefined && !rule.enum.includes(v)) errors.push(`${where}: attrs.${k} invalid value ${JSON.stringify(v)}`)
      if (rule.int !== undefined) {
        if (!Number.isInteger(v) || v < rule.int[0] || v > rule.int[1]) errors.push(`${where}: attrs.${k} must be integer ${rule.int[0]}-${rule.int[1]}`)
      }
      if (rule.str !== undefined) {
        if (typeof v !== 'string' || v.length < rule.str[0] || v.length > rule.str[1]) errors.push(`${where}: attrs.${k} must be string ${rule.str[0]}-${rule.str[1]} chars`)
        else if (rule.pattern && !rule.pattern.test(v)) errors.push(`${where}: attrs.${k} invalid format`)
      }
      if (rule.arrayInt !== undefined) {
        if (!Array.isArray(v)) errors.push(`${where}: attrs.${k} must be an array`)
        else if (rule.maxItems && v.length > rule.maxItems) errors.push(`${where}: attrs.${k} exceeds ${rule.maxItems} items`)
        else for (const item of v) if (!Number.isInteger(item) || item < rule.arrayInt[0] || item > rule.arrayInt[1]) errors.push(`${where}: attrs.${k} item invalid`)
      }
    }
  }
  for (const k of rules.required || []) {
    if (!(k in attrs)) errors.push(`${where}: missing required attrs.${k}`)
  }
}

function itemMatches(item, kind) {
  if (kind === 'block') return BLOCK_TYPES.has(item)
  if (kind === 'inline') return INLINE_TYPES.has(item)
  if (kind === 'cell') return item === 'tableCell' || item === 'tableHeader'
  return item === kind
}

export function validateDocumentStructure(doc) {
  const errors = []
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return ['document is not an object']
  if (doc.schemaVersion !== 'content.document.v1') {
    errors.push(`document schemaVersion must be content.document.v1, got ${JSON.stringify(doc.schemaVersion)}`)
  }
  const root = doc.doc
  if (!root || typeof root !== 'object' || root.type !== 'doc' || !Array.isArray(root.content)) {
    errors.push('document.doc must be {type:"doc", content:[...]}')
    return errors
  }
  const walk = (n, parentType, depth, where) => {
    if (depth > MAX_DEPTH) {
      errors.push(`${where}: exceeds max depth ${MAX_DEPTH}`)
      return
    }
    if (!n || typeof n !== 'object' || Array.isArray(n)) {
      errors.push(`${where}: node is not an object`)
      return
    }
    const t = n.type
    if (t === 'doc') {
      errors.push(`${where}: nested doc node is not allowed`)
      return
    }
    if (!NODE_TYPES.has(t)) {
      errors.push(`${where}: unknown node type ${JSON.stringify(t)}`)
      return
    }
    // additionalProperties:false at node level
    const nodeKeys = new Set(['type', 'attrs', 'content', 'text', 'marks'])
    for (const k of Object.keys(n)) {
      if (!nodeKeys.has(k)) errors.push(`${where}: unknown field ${JSON.stringify(k)}`)
    }
    // parent/child relation
    const rule = CONTENT_RULES[t]
    if (rule) {
      if (n.content === undefined) {
        errors.push(`${where}: missing content`)
      } else if (!Array.isArray(n.content)) {
        errors.push(`${where}: content must be an array`)
      } else {
        if (rule.min !== undefined && n.content.length < rule.min) errors.push(`${where}: content needs at least ${rule.min} items`)
        if (rule.max !== undefined && n.content.length > rule.max) errors.push(`${where}: content exceeds ${rule.max} items`)
        n.content.forEach((c, i) => {
          const cType = c && c.type
          if (!itemMatches(cType, rule.item)) errors.push(`${where}.content[${i}]: ${JSON.stringify(cType)} is not allowed here`)
          else walk(c, t, depth + 1, `${where}.content[${i}]`)
        })
      }
    }
    // text node
    if (t === 'text') {
      if (typeof n.text !== 'string') errors.push(`${where}: text node missing text string`)
      else if (n.text.length > 500000) errors.push(`${where}: text exceeds 500000 chars`)
    }
    // marks
    if (n.marks !== undefined) {
      if (!Array.isArray(n.marks)) errors.push(`${where}: marks must be an array`)
      else {
        if (n.marks.length > 8) errors.push(`${where}: marks exceeds 8`)
        n.marks.forEach((m, i) => {
          if (!m || typeof m !== 'object' || Array.isArray(m)) {
            errors.push(`${where}.marks[${i}]: mark is not an object`)
            return
          }
          const mr = MARK_RULES[m.type]
          if (!mr) {
            errors.push(`${where}.marks[${i}]: unknown mark ${JSON.stringify(m.type)}`)
            return
          }
          for (const k of Object.keys(m)) {
            if (!['type', 'attrs'].includes(k)) errors.push(`${where}.marks[${i}]: unknown field ${JSON.stringify(k)}`)
          }
          checkAttrs(m, mr, errors, `${where}.marks[${i}]`)
        })
      }
    }
    // attrs per node type
    if (ATTR_RULES[t]) checkAttrs(n, ATTR_RULES[t], errors, where)
  }
  root.content.forEach((c, i) => {
    if (!itemMatches(c && c.type, 'block')) errors.push(`doc.content[${i}]: ${JSON.stringify(c && c.type)} is not allowed at document root`)
    else walk(c, 'doc', 1, `doc.content[${i}]`)
  })
  return errors
}

// ---- Python-compatible canonical JSON serialization (mirrors
// json.dumps(payload, ensure_ascii=False, sort_keys=True) from the publish
// side, so generationHash can be re-verified byte-for-byte) ----
function pyJsonSort(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(pyJsonSort).join(', ') + ']'
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => `${JSON.stringify(k)}: ${pyJsonSort(obj[k])}`).join(', ') + '}'
}

/** Recompute the publish-side generationHash for a snapshot. */
export function snapshotHash(snapshot) {
  const payload = { ...snapshot }
  delete payload.generationHash
  return createHash('sha256').update(pyJsonSort(payload), 'utf8').digest('hex')
}

/** Collect every mediaId referenced by the document (image attrs + media:// src). */
export function collectMediaRefs(doc) {
  const refs = new Set()
  const walk = (n) => {
    if (!n || typeof n !== 'object') return
    if (n.type === 'image') {
      const attrs = n.attrs || {}
      if (typeof attrs.mediaId === 'string') refs.add(attrs.mediaId)
      if (typeof attrs.src === 'string' && attrs.src.startsWith('media://')) refs.add(attrs.src.slice('media://'.length))
    }
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  // walk the editor tree (doc.doc), not the schema envelope
  walk(doc && doc.doc)
  return refs
}

/** Resolve media://<id> src references inside the document to public CDN URLs. */
export function resolveDocumentMedia(doc, mediaByPublicUrl) {
  const clone = structuredClone ? structuredClone(doc) : JSON.parse(JSON.stringify(doc))
  const walk = (n) => {
    if (!n || typeof n !== 'object') return
    if (n.attrs && typeof n.attrs.src === 'string' && n.attrs.src.startsWith('media://')) {
      const url = mediaByPublicUrl.get(n.attrs.src)
      if (url) n.attrs.src = url
    }
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  if (clone && clone.doc) walk(clone.doc)
  return clone
}

/** Validate a snapshot before it may enter the public output. Returns error list. */
export function validateSnapshot(snapshot, mediaHost = DEFAULT_MEDIA_HOST) {
  const errors = []
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return ['snapshot is not an object']
  }
  if (snapshot.schemaVersion !== SNAPSHOT_SCHEMA) {
    errors.push(`schemaVersion must be ${SNAPSHOT_SCHEMA}, got ${JSON.stringify(snapshot.schemaVersion)}`)
  }
  if (!Number.isInteger(snapshot.publicId) || snapshot.publicId < 1) {
    errors.push(`publicId must be a positive integer, got ${JSON.stringify(snapshot.publicId)}`)
  }
  if (!snapshot.metadata || typeof snapshot.metadata.title !== 'string' || !snapshot.metadata.title.trim()) {
    errors.push('metadata.title is required')
  }
  // generationHash must be a real sha256 AND match the snapshot content
  if (typeof snapshot.generationHash !== 'string' || !/^[0-9a-f]{64}$/.test(snapshot.generationHash)) {
    errors.push(`generationHash must be a 64-char hex sha256, got ${JSON.stringify(snapshot.generationHash)}`)
  } else if (snapshotHash(snapshot) !== snapshot.generationHash) {
    errors.push('generationHash does not match snapshot content (tampered)')
  }
  // document structure + media references
  errors.push(...validateDocumentStructure(snapshot.document))
  const leaks = findLeaks(snapshot)
  for (const l of leaks) errors.push(`leak ${l.label} at ${l.path} (${l.sample})`)
  const mediaById = new Map((snapshot.media || []).map((m) => [m.id, m]))
  for (const m of snapshot.media || []) {
    if (m.status !== 'REMOTE_VERIFIED') errors.push(`media ${m.id || '?'}: not REMOTE_VERIFIED`)
    if (!isStableMediaUrl(m.publicUrl, mediaHost)) errors.push(`media ${m.id || '?'}: unstable URL ${JSON.stringify(m.publicUrl)}`)
  }
  for (const ref of collectMediaRefs(snapshot.document || {})) {
    const m = mediaById.get(ref)
    if (!m) {
      errors.push(`unresolved media reference ${JSON.stringify(ref)} in document`)
    } else if (!isStableMediaUrl(m.publicUrl, mediaHost)) {
      errors.push(`media ${ref}: unstable URL ${JSON.stringify(m.publicUrl)}`)
    }
  }
  return errors
}

/** Load snapshots from the published directory; only <publicId>.json files are read. */
export function loadSnapshots(publishedDir) {
  if (!existsSync(publishedDir)) return []
  const files = readdirSync(publishedDir).filter((f) => /^\d+\.json$/.test(f))
  const snapshots = []
  for (const f of files) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(join(publishedDir, f), 'utf8'))
    } catch (e) {
      throw new Error(`cannot parse ${f}: ${e.message}`)
    }
    snapshots.push(parsed)
  }
  return snapshots
}

/** Build the public entry view for one snapshot. Throws on invalid input. */
export function deriveEntryView(snapshot, mediaHost = DEFAULT_MEDIA_HOST) {
  const errs = validateSnapshot(snapshot, mediaHost)
  if (errs.length > 0) throw new Error(errs.join('; '))
  const media = snapshot.media || []
  const mediaByPublicUrl = new Map()
  for (const m of media) mediaByPublicUrl.set(`media://${m.id}`, m.publicUrl)
  return {
    schemaVersion: ENTRY_SCHEMA,
    publicId: snapshot.publicId,
    title: snapshot.metadata.title,
    summary: snapshot.metadata.summary ?? null,
    tags: Array.isArray(snapshot.metadata.tags) ? [...snapshot.metadata.tags] : [],
    publishedAt: snapshot.publishedAt,
    revision: snapshot.revision,
    generationHash: snapshot.generationHash,
    document: resolveDocumentMedia(snapshot.document, mediaByPublicUrl),
    media: media.map((m) => ({ mediaId: m.id, mediaType: m.mediaType, publicUrl: m.publicUrl })),
  }
}

/** Build the public index view; snapshots must already be sorted by publicId. */
export function deriveIndexView(snapshots) {
  return {
    schemaVersion: INDEX_SCHEMA,
    entries: snapshots.map((s) => ({
      publicId: s.publicId,
      title: s.metadata.title,
      summary: s.metadata.summary ?? null,
      tags: Array.isArray(s.metadata.tags) ? [...s.metadata.tags] : [],
      publishedAt: s.publishedAt,
      revision: s.revision,
    })),
  }
}
