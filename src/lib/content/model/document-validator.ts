// Document validator — enforces content.document.v1 schema fully
import type { ContentDocument } from './types'

const SCHEMA_VERSION = 'content.document.v1'

interface ValidationResult { valid: boolean; errors?: ValidationError[] }
interface ValidationError { path: string; message: string; code: string }

const LINK_HREF = /^(https?:\/\/|mailto:|(?!\/\/)\/(?!\/)|#)/
const DANGEROUS = /^(javascript|data|vbscript):/i
const MAX_DEPTH = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify'])
const IMAGE_ALIGN = new Set(['left', 'center', 'right'])
const DISPLAY_WIDTHS = new Set([25, 50, 75, 100])
const GALLERY_LAYOUTS = new Set(['two-column', 'three-column', 'grid'])
const SIZE_PERCENTS = new Set([75, 100, 125, 150, 200])
const HEADING_LEVELS = new Set([2, 3, 4])

// Per JSON Schema: blockNode = these 11 types only (listItem/tableRow etc are NOT blockNode)
const BLOCK_NODE_TYPES = new Set([
  'paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList',
  'codeBlock', 'horizontalRule', 'table', 'image', 'gallery', 'collapse'
])

interface Ctx { path: string; errors: ValidationError[]; depth: number }
function err(ctx: Ctx, code: string, msg: string) { ctx.errors.push({ path: ctx.path || 'doc', message: msg, code }) }
function isInt(n: unknown): boolean { return typeof n === 'number' && Number.isInteger(n) && Number.isFinite(n) }
function isPlainObject(v: unknown): boolean { return v !== null && typeof v === 'object' && !Array.isArray(v) }

// ---- Top-level ----
function validateTop(obj: Record<string, unknown>, ctx: Ctx): void {
  for (const k of Object.keys(obj)) {
    if (k !== 'schemaVersion' && k !== 'doc') err(ctx, 'EXTRA_FIELD', `Unexpected top-level field: ${k}`)
  }
  if (obj.schemaVersion !== SCHEMA_VERSION) {
    err(ctx, obj.schemaVersion ? 'UNKNOWN_VERSION' : 'MISSING_SCHEMA_VERSION', `schemaVersion must be "${SCHEMA_VERSION}"`)
  }
  if (!isPlainObject(obj.doc) || (obj.doc as any)?.type !== 'doc') {
    err(ctx, 'INVALID_DOC', 'Root doc must be a document node with type "doc"')
    return
  }
  const doc = obj.doc as Record<string, unknown>
  if (!Array.isArray(doc.content)) { err(ctx, 'MISSING_CONTENT', 'doc requires content array'); return }
  if (doc.content.length > 5000) err(ctx, 'MAX_ITEMS', 'doc content exceeds 5000 items')
  for (const k of Object.keys(doc)) if (k !== 'type' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field on doc: ${k}`)

  for (let i = 0; i < doc.content.length; i++) {
    const child = doc.content[i]
    if (child?.type !== 'image') { /* any blockNode except image — checked below */ }
    validateBlock(child, ctx, 1, BLOCK_NODE_TYPES)
  }
}

// ---- Block dispatcher ----
function validateBlock(node: any, ctx: Ctx, depth: number, allowed: Set<string>): void {
  if (!isPlainObject(node)) { err(ctx, 'NOT_OBJECT', 'Block must be a plain object'); return }
  if (depth > MAX_DEPTH) { err(ctx, 'MAX_DEPTH', `Document exceeds max depth of ${MAX_DEPTH}`); return }
  const t = node.type
  if (!t || !allowed.has(t)) { err(ctx, 'UNKNOWN_NODE', `Unexpected node type "${t}" here`); return }

  const prev = ctx.path
  switch (t) {
    case 'paragraph': validateParagraph(node, ctx); break
    case 'heading': validateHeading(node, ctx); break
    case 'blockquote': validateBlockQuote(node, ctx, depth); break
    case 'bulletList': validateBulletList(node, ctx, depth); break
    case 'orderedList': validateOrderedList(node, ctx, depth); break
    case 'listItem': validateListItem(node, ctx, depth); break
    case 'codeBlock': validateCodeBlock(node, ctx); break
    case 'horizontalRule': validateHorizontalRule(node, ctx); break
    case 'table': validateTable(node, ctx, depth); break
    case 'tableRow': validateTableRow(node, ctx, depth); break
    case 'tableCell': validateTableCell(node, ctx, 'tableCell', depth); break
    case 'tableHeader': validateTableCell(node, ctx, 'tableHeader', depth); break
    case 'image': validateImage(node, ctx); break
    case 'gallery': validateGallery(node, ctx); break
    case 'collapse': validateCollapse(node, ctx, depth); break
  }
  ctx.path = prev
}

function eachChild(node: any, ctx: Ctx, fn: (child: any, i: number) => void): void {
  if (!Array.isArray(node.content)) return
  for (let i = 0; i < node.content.length; i++) {
    const prev = ctx.path; ctx.path = `${prev}.content[${i}]`; fn(node.content[i], i); ctx.path = prev
  }
}

// ---- Paragraph ----
function validateParagraph(node: any, ctx: Ctx): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (node.attrs !== undefined) {
    if (!isPlainObject(node.attrs)) { err(ctx, 'INVALID_ATTRS', 'attrs must be a plain object or omitted'); return }
    for (const k of Object.keys(node.attrs)) {
      if (k !== 'textAlign') err(ctx, 'EXTRA_FIELD', `Unexpected attr: ${k}`)
      else if (!TEXT_ALIGN.has(node.attrs[k])) err(ctx, 'INVALID_ATTRS', `Invalid textAlign: ${node.attrs[k]}`)
    }
  }
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) { err(ctx, 'INVALID_CONTENT', 'content must be array'); return }
    if (node.content.length > 2000) err(ctx, 'MAX_ITEMS', 'paragraph exceeds 2000 inline items')
    eachChild(node, ctx, (child) => validateInline(child, ctx))
  }
}

// ---- Heading ----
function validateHeading(node: any, ctx: Ctx): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!isPlainObject(node.attrs)) { err(ctx, 'MISSING_ATTRS', 'heading requires attrs object'); return }
  if (!HEADING_LEVELS.has(node.attrs.level)) err(ctx, 'INVALID_ATTRS', `heading level must be 2-4, got ${node.attrs.level}`)
  for (const k of Object.keys(node.attrs)) {
    if (k === 'level') continue
    if (k === 'textAlign') { if (!TEXT_ALIGN.has(node.attrs[k])) err(ctx, 'INVALID_ATTRS', `Invalid textAlign: ${node.attrs[k]}`) }
    else err(ctx, 'EXTRA_FIELD', `Unexpected heading attr: ${k}`)
  }
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'heading requires content')
  else if (node.content.length > 500) err(ctx, 'MAX_ITEMS', 'heading exceeds 500 items')
  else eachChild(node, ctx, (child) => validateInline(child, ctx))
}

// ---- Blockquote ----
function validateBlockQuote(node: any, ctx: Ctx, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'blockquote requires content')
  else if (node.content.length > 200) err(ctx, 'MAX_ITEMS', 'blockquote exceeds 200 items')
  else eachChild(node, ctx, (child) => validateBlock(child, ctx, depth + 1, BLOCK_NODE_TYPES))
}

// ---- Lists ----
function validateBulletList(node: any, ctx: Ctx, depth: number): void {
  validateListBase(node, ctx, depth, false)
}

function validateOrderedList(node: any, ctx: Ctx, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (node.attrs !== undefined) {
    if (!isPlainObject(node.attrs)) err(ctx, 'INVALID_ATTRS', 'orderedList attrs must be a plain object')
    else for (const k of Object.keys(node.attrs)) {
      if (k === 'start') {
        if (!isInt(node.attrs.start) || node.attrs.start < 1 || node.attrs.start > 9999) err(ctx, 'INVALID_ATTRS', 'start must be integer 1-9999')
      } else err(ctx, 'EXTRA_FIELD', `Unexpected orderedList attr: ${k}`)
    }
  }
  validateListBase(node, ctx, depth, true)
}

function validateListBase(node: any, ctx: Ctx, depth: number, isOrdered: boolean): void {
  // For bulletList: only type+content. For orderedList: type+attrs+content (already checked in caller).
  if (!isOrdered) {
    for (const k of Object.keys(node)) if (k !== 'type' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  }
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'list requires content')
  else if (node.content.length > 500) err(ctx, 'MAX_ITEMS', 'list exceeds 500 items')
  else {
    eachChild(node, ctx, (child) => {
      if (child?.type !== 'listItem') err(ctx, 'INVALID_CHILD', `list children must be listItem, got ${child?.type}`)
      else validateListItem(child, ctx, depth + 1)
    })
  }
}

function validateListItem(node: any, ctx: Ctx, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'listItem requires content')
  else if (node.content.length > 100) err(ctx, 'MAX_ITEMS', 'listItem exceeds 100 items')
  else eachChild(node, ctx, (child) => validateBlock(child, ctx, depth + 1, BLOCK_NODE_TYPES))
}

// ---- CodeBlock ----
function validateCodeBlock(node: any, ctx: Ctx): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (node.attrs !== undefined) {
    if (!isPlainObject(node.attrs)) err(ctx, 'INVALID_ATTRS', 'codeBlock attrs must be a plain object')
    else for (const k of Object.keys(node.attrs)) {
      if (k === 'language') {
        const v = node.attrs.language
        if (v !== null && (typeof v !== 'string' || v.length > 32 || !/^[A-Za-z0-9_+.#-]*$/.test(v))) err(ctx, 'INVALID_ATTRS', 'Invalid codeBlock language')
      } else err(ctx, 'EXTRA_FIELD', `Unexpected attr: ${k}`)
    }
  }
  if (node.content !== undefined) {
    if (!Array.isArray(node.content) || node.content.length > 1) err(ctx, 'INVALID_CONTENT', 'codeBlock content must be 0-1 text nodes')
    else if (node.content.length === 1) {
      const t = node.content[0]
      if (t?.type !== 'text' || typeof t.text !== 'string' || (t.text?.length || 0) > 500000)
        err(ctx, 'INVALID_CONTENT', 'codeBlock content must be a plain text node')
      for (const k of Object.keys(t || {})) {
        if (k !== 'type' && k !== 'text')
          err(ctx, 'INVALID_CONTENT', `plainText must not have field: ${k}`)
      }
    }
  }
}

// ---- HorizontalRule ----
function validateHorizontalRule(node: any, ctx: Ctx): void {
  for (const k of Object.keys(node)) if (k !== 'type') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
}

// ---- Table ----
const CELL_TYPES = new Set(['tableCell', 'tableHeader'])

function validateTable(node: any, ctx: Ctx, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'table requires content')
  else if (node.content.length > 100) err(ctx, 'MAX_ITEMS', 'table exceeds 100 rows')
  else eachChild(node, ctx, (child) => {
    if (child?.type !== 'tableRow') err(ctx, 'INVALID_CHILD', `table children must be tableRow, got ${child?.type}`)
    else validateTableRow(child, ctx, depth + 1)
  })
}

function validateTableRow(node: any, ctx: Ctx, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'tableRow requires cells')
  else if (node.content.length > 50) err(ctx, 'MAX_ITEMS', 'tableRow exceeds 50 cells')
  else eachChild(node, ctx, (child) => {
    if (!CELL_TYPES.has(child?.type)) err(ctx, 'INVALID_CHILD', `tableRow children must be tableCell/tableHeader, got ${child?.type}`)
    else validateTableCell(child, ctx, child.type, depth + 1)
  })
}

function validateTableCell(node: any, ctx: Ctx, cellType: string, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (node.attrs !== undefined) {
    if (!isPlainObject(node.attrs)) err(ctx, 'INVALID_ATTRS', `${cellType} attrs must be a plain object`)
    else for (const k of Object.keys(node.attrs)) {
      const v = node.attrs[k]
      if (k === 'colspan') { if (!isInt(v) || v < 1 || v > 50) err(ctx, 'INVALID_ATTRS', `Invalid colspan: ${v}`) }
      else if (k === 'rowspan') { if (!isInt(v) || v < 1 || v > 100) err(ctx, 'INVALID_ATTRS', `Invalid rowspan: ${v}`) }
      else if (k === 'textAlign') { if (!TEXT_ALIGN.has(v)) err(ctx, 'INVALID_ATTRS', `Invalid cell textAlign: ${v}`) }
      else if (k === 'colwidth') {
        if (v !== null && (!Array.isArray(v) || v.length > 50 || v.some((w: any) => !isInt(w) || w < 25 || w > 4096))) err(ctx, 'INVALID_ATTRS', 'Invalid colwidth')
      } else err(ctx, 'EXTRA_FIELD', `Unexpected attr: ${k}`)
    }
  }
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', `${cellType} requires content`)
  else if (node.content.length > 200) err(ctx, 'MAX_ITEMS', `${cellType} exceeds 200 items`)
  else eachChild(node, ctx, (child) => validateBlock(child, ctx, depth + 1, BLOCK_NODE_TYPES))
}

// ---- Image ----
function validateImage(node: any, ctx: Ctx): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!isPlainObject(node.attrs)) { err(ctx, 'MISSING_ATTRS', 'image requires attrs object'); return }
  const a = node.attrs
  if (!a.mediaId || typeof a.mediaId !== 'string' || !UUID_RE.test(a.mediaId)) err(ctx, 'INVALID_ATTRS', 'image requires valid mediaId UUID')
  if (typeof a.alt !== 'string' || a.alt.length > 300) err(ctx, 'INVALID_ATTRS', 'alt must be string ≤300 chars')
  if (!IMAGE_ALIGN.has(a.align)) err(ctx, 'INVALID_ATTRS', `Invalid align: ${a.align}`)
  if (!DISPLAY_WIDTHS.has(a.displayWidth)) err(ctx, 'INVALID_ATTRS', `Invalid displayWidth: ${a.displayWidth}`)
  if (a.src !== undefined && a.src !== null && (typeof a.src !== 'string' || a.src.length > 2048 || !/^(https:\/\/|media:\/\/)/.test(a.src))) err(ctx, 'INVALID_ATTRS', 'Invalid src')
  if (a.caption !== undefined && a.caption !== null && (typeof a.caption !== 'string' || a.caption.length > 500)) err(ctx, 'INVALID_ATTRS', 'caption must be string/null ≤500 chars')
  if (a.width !== undefined && a.width !== null) { if (!isInt(a.width) || a.width < 1 || a.width > 16384) err(ctx, 'INVALID_ATTRS', `width must be integer 1-16384, got ${a.width}`) }
  if (a.height !== undefined && a.height !== null) { if (!isInt(a.height) || a.height < 1 || a.height > 16384) err(ctx, 'INVALID_ATTRS', `height must be integer 1-16384, got ${a.height}`) }
  const imgAttrs = new Set(['mediaId', 'src', 'alt', 'caption', 'align', 'displayWidth', 'width', 'height'])
  for (const k of Object.keys(a)) if (!imgAttrs.has(k)) err(ctx, 'EXTRA_FIELD', `Unexpected image attr: ${k}`)
}

// ---- Gallery ----

function validateGallery(node: any, ctx: Ctx): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!isPlainObject(node.attrs)) { err(ctx, 'MISSING_ATTRS', 'gallery requires attrs object'); return }
  if (!GALLERY_LAYOUTS.has(node.attrs.layout)) err(ctx, 'INVALID_ATTRS', `Invalid layout: ${node.attrs.layout}`)
  for (const k of Object.keys(node.attrs)) if (k !== 'layout') err(ctx, 'EXTRA_FIELD', `Unexpected gallery attr: ${k}`)
  if (!Array.isArray(node.content) || node.content.length < 2) err(ctx, 'MISSING_CONTENT', 'gallery requires ≥2 images')
  else if (node.content.length > 20) err(ctx, 'MAX_ITEMS', 'gallery exceeds 20 images')
  else eachChild(node, ctx, (child) => {
    if (child?.type !== 'image') err(ctx, 'INVALID_CHILD', `gallery children must be image, got ${child?.type}`)
    else validateImage(child, ctx)
  })
}

// ---- Collapse ----
function validateCollapse(node: any, ctx: Ctx, depth: number): void {
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'attrs' && k !== 'content') err(ctx, 'EXTRA_FIELD', `Unexpected field: ${k}`)
  if (!isPlainObject(node.attrs)) { err(ctx, 'MISSING_ATTRS', 'collapse requires attrs object'); return }
  if (typeof node.attrs.title !== 'string' || node.attrs.title.length < 1 || node.attrs.title.length > 120) err(ctx, 'INVALID_ATTRS', 'collapse title must be string 1-120 chars')
  for (const k of Object.keys(node.attrs)) if (k !== 'title') err(ctx, 'EXTRA_FIELD', `Unexpected collapse attr: ${k}`)
  if (!Array.isArray(node.content) || node.content.length < 1) err(ctx, 'MISSING_CONTENT', 'collapse requires content')
  else if (node.content.length > 1000) err(ctx, 'MAX_ITEMS', 'collapse exceeds 1000 items')
  else eachChild(node, ctx, (child) => validateBlock(child, ctx, depth + 1, BLOCK_NODE_TYPES))
}

// ---- Inline ----
function validateInline(node: any, ctx: Ctx): void {
  if (!isPlainObject(node)) { err(ctx, 'NOT_OBJECT', 'Inline must be a plain object'); return }
  if (node.type === 'hardBreak') {
    for (const k of Object.keys(node)) if (k !== 'type') err(ctx, 'EXTRA_FIELD', `Unexpected field on hardBreak: ${k}`)
    return
  }
  if (node.type !== 'text') { err(ctx, 'UNKNOWN_NODE', `Unknown inline type: ${node.type}`); return }
  if (typeof node.text !== 'string') err(ctx, 'MISSING_TEXT', 'text node requires text field')
  else if (node.text.length > 500000) err(ctx, 'MAX_LENGTH', 'text exceeds 500000 chars')
  for (const k of Object.keys(node)) if (k !== 'type' && k !== 'text' && k !== 'marks') err(ctx, 'EXTRA_FIELD', `Unexpected field on text: ${k}`)
  if (node.marks !== undefined) {
    if (node.marks === null) { err(ctx, 'INVALID_MARKS', 'marks must not be null'); return }
    if (!Array.isArray(node.marks)) { err(ctx, 'INVALID_MARKS', 'marks must be array'); return }
    if (node.marks.length > 8) err(ctx, 'MAX_ITEMS', 'text marks exceed 8')
    for (const m of node.marks) {
      if (!isPlainObject(m)) { err(ctx, 'INVALID_MARK', 'mark must be a plain object'); continue }
      if (m.type === 'bold' || m.type === 'italic' || m.type === 'underline' || m.type === 'strike' || m.type === 'code') {
        for (const k of Object.keys(m)) if (k !== 'type') err(ctx, 'EXTRA_FIELD', `Unexpected field on ${m.type} mark: ${k}`)
      } else if (m.type === 'textStyle') {
        for (const k of Object.keys(m)) if (k !== 'type' && k !== 'attrs') err(ctx, 'EXTRA_FIELD', `Unexpected field on textStyle mark: ${k}`)
        if (!isPlainObject(m.attrs)) { err(ctx, 'INVALID_MARK', 'textStyle requires attrs object'); continue }
        for (const k of Object.keys(m.attrs)) {
          if (k === 'color') { const c = m.attrs.color; if (c !== undefined && c !== null && (typeof c !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(c))) err(ctx, 'INVALID_COLOR', 'color must be #RRGGBB') }
          else if (k === 'sizePercent') { const s = m.attrs.sizePercent; if (s !== undefined && s !== null && !SIZE_PERCENTS.has(s)) err(ctx, 'INVALID_SIZE', `sizePercent must be one of [${[...SIZE_PERCENTS]}]`) }
          else err(ctx, 'EXTRA_FIELD', `Unexpected textStyle attr: ${k}`)
        }
      } else if (m.type === 'link') {
        for (const k of Object.keys(m)) if (k !== 'type' && k !== 'attrs') err(ctx, 'EXTRA_FIELD', `Unexpected field on link mark: ${k}`)
        if (!isPlainObject(m.attrs)) { err(ctx, 'INVALID_MARK', 'link requires attrs object'); continue }
        if (!m.attrs.href || typeof m.attrs.href !== 'string') { err(ctx, 'INVALID_LINK', 'link requires href'); continue }
        const href = m.attrs.href
        if (DANGEROUS.test(href)) err(ctx, 'DANGEROUS_URL', `Dangerous link: ${href.slice(0, 50)}`)
        else if (!LINK_HREF.test(href)) err(ctx, 'UNSAFE_URL', `Unsafe link: ${href.slice(0, 50)}`)
        if (href.length > 2048) err(ctx, 'MAX_LENGTH', 'link href exceeds 2048 chars')
        for (const k of Object.keys(m.attrs)) {
          if (k === 'href') continue
          if (k === 'target') { if (m.attrs.target !== undefined && m.attrs.target !== null && m.attrs.target !== '_blank') err(ctx, 'INVALID_LINK', 'target must be null or _blank') }
          else if (k === 'rel') { if (m.attrs.rel !== undefined && m.attrs.rel !== null && m.attrs.rel !== 'noopener noreferrer nofollow') err(ctx, 'INVALID_LINK', 'rel must be null or noopener noreferrer nofollow') }
          else err(ctx, 'EXTRA_FIELD', `Unexpected link attr: ${k}`)
        }
      } else {
        err(ctx, 'UNKNOWN_MARK', `Unknown mark type: ${m.type}`)
      }
    }
  }
}

// ---- Public API ----
export function validateContentDocument(input: unknown): ValidationResult {
  if (!isPlainObject(input)) return { valid: false, errors: [{ path: '', message: 'Input must be a plain object', code: 'NOT_OBJECT' }] }
  const ctx: Ctx = { path: 'doc', errors: [], depth: 0 }
  validateTop(input as Record<string, unknown>, ctx)
  return ctx.errors.length === 0 ? { valid: true } : { valid: false, errors: ctx.errors }
}

export function migrateDocument(doc: unknown, targetVersion: string): ContentDocument {
  const input = doc as Record<string, any>
  if (!input?.schemaVersion) throw new Error('Cannot migrate document without schemaVersion')
  if (input.schemaVersion === targetVersion) {
    const result = validateContentDocument(doc)
    if (!result.valid) throw new Error(`Invalid document: ${result.errors?.map(e => e.message).join('; ')}`)
    return input as ContentDocument
  }
  throw new Error(`No migration path from ${input.schemaVersion} to ${targetVersion}`)
}
