// contentViewModel.ts — fail-closed allowlist view model for the public
// renderer (T040). Only content.document.v1 known nodes/marks/attrs survive;
// unknown nodes, extra attributes, dangerous links, unresolved media and
// over-long text throw RenderValidationError instead of rendering.

import { evaluateLink } from './linkPolicy'
import { isPermanentContentUrl } from '@/lib/content/model/media-url'

export class RenderValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly path: string,
    message: string,
  ) {
    super(`[${code}] ${path}: ${message}`)
    this.name = 'RenderValidationError'
  }
}

export type Align = 'left' | 'center' | 'right' | 'justify'
export type ImageAlign = 'left' | 'center' | 'right'
export type GalleryLayout = 'two-column' | 'three-column' | 'grid'
export type HeadingLevel = 2 | 3 | 4
export type DisplayWidth = 25 | 50 | 75 | 100

export type SafeMark =
  | { kind: 'bold' }
  | { kind: 'italic' }
  | { kind: 'underline' }
  | { kind: 'strike' }
  | { kind: 'code' }
  | { kind: 'textStyle'; color: string | null; sizePercent: number | null }
  | { kind: 'link'; href: string; target: string | null; rel: string | null }

export interface SafeTextNode {
  kind: 'text'
  text: string
  marks: SafeMark[]
}
export interface SafeHardBreak {
  kind: 'hardBreak'
}
export type SafeInline = SafeTextNode | SafeHardBreak

export interface SafeParagraph {
  kind: 'paragraph'
  textAlign: Align | null
  children: SafeInline[]
}
export interface SafeHeading {
  kind: 'heading'
  level: HeadingLevel
  textAlign: Align | null
  children: SafeInline[]
}
export interface SafeBlockquote {
  kind: 'blockquote'
  children: SafeBlock[]
}
export interface SafeBulletList {
  kind: 'bulletList'
  children: SafeListItem[]
}
export interface SafeOrderedList {
  kind: 'orderedList'
  start: number
  children: SafeListItem[]
}
export interface SafeListItem {
  kind: 'listItem'
  children: SafeBlock[]
}
export interface SafeCodeBlock {
  kind: 'codeBlock'
  language: string | null
  text: string
}
export interface SafeHorizontalRule {
  kind: 'horizontalRule'
}
export interface SafeImage {
  kind: 'image'
  mediaId: string
  src: string
  alt: string
  caption: string | null
  align: ImageAlign
  displayWidth: DisplayWidth
}
export interface SafeGallery {
  kind: 'gallery'
  layout: GalleryLayout
  images: SafeGalleryImage[]
}
export interface SafeGalleryImage {
  mediaId: string
  src: string
  alt: string
  caption: string | null
  align: ImageAlign
  displayWidth: DisplayWidth
}
export interface SafeCollapse {
  kind: 'collapse'
  title: string
  children: SafeBlock[]
}
export interface SafeTable {
  kind: 'table'
  rows: SafeTableRow[]
}
export interface SafeTableRow {
  cells: SafeTableCell[]
}
export interface SafeTableCell {
  kind: 'cell' | 'header'
  colspan: number
  rowspan: number
  colwidth: number[] | null
  textAlign: Align | null
  children: SafeBlock[]
}
export type SafeBlock =
  | SafeParagraph
  | SafeHeading
  | SafeBlockquote
  | SafeBulletList
  | SafeOrderedList
  | SafeListItem
  | SafeCodeBlock
  | SafeHorizontalRule
  | SafeImage
  | SafeGallery
  | SafeCollapse
  | SafeTable

export interface SafeDocumentViewModel {
  blocks: SafeBlock[]
}

export interface ViewModelOptions {
  mediaResolver: (mediaId: string) => string | null
}

// ---- allowlists (mirror editor-document.schema.json) ----
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'codeBlock', 'horizontalRule', 'table', 'image', 'gallery', 'collapse'])
const INLINE_TYPES = new Set(['text', 'hardBreak'])
const MAX_DEPTH = 50
const MAX_TEXT = 500000
// independent total node cap, mirrors server/content/schema.py MAX_NODE_COUNT
const MAX_NODES = 10_000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify'])
const HEADING_LEVELS = new Set([2, 3, 4])
const IMAGE_ALIGN = new Set(['left', 'center', 'right'])
const DISPLAY_WIDTHS = new Set([25, 50, 75, 100])
const GALLERY_LAYOUTS = new Set(['two-column', 'three-column', 'grid'])
const SIZE_PERCENTS = new Set([75, 100, 125, 150, 200])

const NODE_FIELDS: Record<string, string[]> = {
  doc: ['type', 'content'],
  paragraph: ['type', 'attrs', 'content'],
  heading: ['type', 'attrs', 'content'],
  blockquote: ['type', 'content'],
  bulletList: ['type', 'content'],
  orderedList: ['type', 'attrs', 'content'],
  listItem: ['type', 'content'],
  codeBlock: ['type', 'attrs', 'content'],
  horizontalRule: ['type'],
  table: ['type', 'content'],
  tableRow: ['type', 'content'],
  tableCell: ['type', 'attrs', 'content'],
  tableHeader: ['type', 'attrs', 'content'],
  image: ['type', 'attrs'],
  gallery: ['type', 'attrs', 'content'],
  collapse: ['type', 'attrs', 'content'],
  text: ['type', 'text', 'marks'],
  hardBreak: ['type'],
}

type AttrRule =
  | { enum: unknown[] }
  | { int: [number, number]; nullable?: boolean }
  | { str: [number, number]; pattern?: RegExp; nullable?: boolean }
  | { arrayInt: [number, number]; maxItems?: number; nullable?: boolean }

const ATTR_RULES: Record<string, { attrs: Record<string, AttrRule>; required?: string[] }> = {
  paragraph: { attrs: { textAlign: { enum: [...TEXT_ALIGN] } } },
  heading: { attrs: { level: { enum: [...HEADING_LEVELS] }, textAlign: { enum: [...TEXT_ALIGN] } }, required: ['level'] },
  orderedList: { attrs: { start: { int: [1, 9999] } } },
  codeBlock: { attrs: { language: { str: [0, 32], pattern: /^[A-Za-z0-9_+.#-]*$/, nullable: true } } },
  tableCell: { attrs: cellAttrs() },
  tableHeader: { attrs: cellAttrs() },
  image: {
    attrs: {
      mediaId: { str: [36, 36], pattern: UUID_RE },
      src: { str: [1, 2048], nullable: true },
      alt: { str: [0, 300] },
      caption: { str: [0, 500], nullable: true },
      align: { enum: [...IMAGE_ALIGN] },
      displayWidth: { enum: [...DISPLAY_WIDTHS] },
      width: { int: [1, 16384], nullable: true },
      height: { int: [1, 16384], nullable: true },
    },
    required: ['mediaId', 'alt', 'align', 'displayWidth'],
  },
  gallery: { attrs: { layout: { enum: [...GALLERY_LAYOUTS] } }, required: ['layout'] },
  collapse: { attrs: { title: { str: [1, 120] } }, required: ['title'] },
}

function cellAttrs(): Record<string, AttrRule> {
  return {
    colspan: { int: [1, 50] },
    rowspan: { int: [1, 100] },
    colwidth: { arrayInt: [25, 4096], maxItems: 50, nullable: true },
    textAlign: { enum: [...TEXT_ALIGN] },
  }
}

const MARK_TYPES = new Set(['bold', 'italic', 'underline', 'strike', 'code', 'textStyle', 'link'])

// content rule: which child types are allowed per node
const CHILD_RULE: Record<string, string> = {
  doc: 'block',
  paragraph: 'inline',
  heading: 'inline',
  blockquote: 'block',
  bulletList: 'listItem',
  orderedList: 'listItem',
  listItem: 'block',
  codeBlock: 'text',
  table: 'tableRow',
  tableRow: 'cell',
  tableCell: 'block',
  tableHeader: 'block',
  gallery: 'image',
  collapse: 'block',
}

// array bounds per node (editor-document.schema.json minItems/maxItems)
const CONTENT_LIMITS: Record<string, { min?: number; max?: number }> = {
  doc: { max: 5000 },
  paragraph: { max: 2000 },
  heading: { min: 1, max: 500 },
  blockquote: { min: 1, max: 200 },
  bulletList: { min: 1, max: 500 },
  orderedList: { min: 1, max: 500 },
  listItem: { min: 1, max: 100 },
  codeBlock: { max: 1 },
  table: { min: 1, max: 100 },
  tableRow: { min: 1, max: 50 },
  tableCell: { min: 1, max: 200 },
  tableHeader: { min: 1, max: 200 },
  gallery: { min: 2, max: 20 },
  collapse: { min: 1, max: 1000 },
}

function enforceContentLimits(type: string, content: unknown[], ctx: WalkCtx): void {
  const limits = CONTENT_LIMITS[type]
  if (!limits) return
  if (limits.min !== undefined && content.length < limits.min) {
    fail(ctx, 'MIN_ITEMS', `${type} content needs at least ${limits.min} items (got ${content.length})`)
  }
  if (limits.max !== undefined && content.length > limits.max) {
    fail(ctx, 'MAX_ITEMS', `${type} content exceeds ${limits.max} items (got ${content.length})`)
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function checkAllowedKind(childType: string | undefined, rule: string): boolean {
  if (rule === 'block') return BLOCK_TYPES.has(childType ?? '')
  if (rule === 'inline') return INLINE_TYPES.has(childType ?? '')
  if (rule === 'cell') return childType === 'tableCell' || childType === 'tableHeader'
  return childType === rule
}

function fail(ctx: { path: string }, code: string, message: string): never {
  throw new RenderValidationError(code, ctx.path, message)
}

// ---- mark validation ----
function toSafeMarks(marks: unknown, ctx: { path: string }): SafeMark[] {
  if (marks === undefined) return []
  // schema: marks is optional; when present it must be an array (never null)
  if (marks === null) fail(ctx, 'INVALID_MARKS', 'marks must be an array, got null')
  if (!Array.isArray(marks)) fail(ctx, 'INVALID_MARKS', 'marks must be an array')
  if (marks.length > 8) fail(ctx, 'MAX_MARKS', 'marks exceeds 8')
  const out: SafeMark[] = []
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i]
    const path = `${ctx.path}.marks[${i}]`
    if (!isPlainObject(m)) fail({ path }, 'INVALID_MARK', 'mark must be a plain object')
    const type = m.type
    if (typeof type !== 'string' || !MARK_TYPES.has(type)) fail({ path }, 'UNKNOWN_MARK', `unknown mark type ${JSON.stringify(type)}`)
    for (const k of Object.keys(m)) {
      if (k !== 'type' && k !== 'attrs') fail({ path }, 'EXTRA_FIELD', `unexpected field on mark: ${k}`)
    }
    switch (type) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'code': {
        if (m.attrs !== undefined) fail({ path }, 'EXTRA_FIELD', `${type} mark must not carry attrs`)
        out.push({ kind: type })
        break
      }
      case 'textStyle': {
        if (!isPlainObject(m.attrs)) fail({ path }, 'INVALID_MARK', 'textStyle requires attrs object')
        const color = m.attrs.color
        if (color !== undefined && color !== null) {
          if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) fail({ path }, 'INVALID_MARK', 'textStyle color must be #rrggbb or null')
        }
        const sizePercent = m.attrs.sizePercent
        if (sizePercent !== undefined && sizePercent !== null && !SIZE_PERCENTS.has(sizePercent as number)) {
          fail({ path }, 'INVALID_MARK', 'textStyle sizePercent must be null or one of 75/100/125/150/200')
        }
        for (const k of Object.keys(m.attrs)) {
          if (k !== 'color' && k !== 'sizePercent') fail({ path }, 'EXTRA_FIELD', `unexpected textStyle attr: ${k}`)
        }
        out.push({ kind: 'textStyle', color: (color as string) ?? null, sizePercent: (sizePercent as number) ?? null })
        break
      }
      case 'link': {
        if (!isPlainObject(m.attrs)) fail({ path }, 'INVALID_MARK', 'link requires attrs object')
        for (const k of Object.keys(m.attrs)) {
          if (k !== 'href' && k !== 'target' && k !== 'rel') fail({ path }, 'EXTRA_FIELD', `unexpected link attr: ${k}`)
        }
        const evalResult = evaluateLink(m.attrs.href, { target: m.attrs.target, rel: m.attrs.rel })
        if (!evalResult.ok) fail({ path }, 'UNSAFE_URL', evalResult.reason)
        out.push({ kind: 'link', href: evalResult.href, target: evalResult.target, rel: evalResult.rel })
        break
      }
    }
  }
  return out
}

// ---- attr validation for node attrs ----
function validateAttrs(node: Record<string, unknown>, ctx: { path: string }): void {
  const type = node.type as string
  const rules = ATTR_RULES[type]
  const attrs = node.attrs
  if (attrs === undefined) {
    if (rules?.required) {
      for (const k of rules.required) fail(ctx, 'MISSING_ATTR', `missing required attrs.${k}`)
    }
    return
  }
  if (!isPlainObject(attrs)) fail(ctx, 'INVALID_ATTRS', 'attrs must be an object')
  if (!rules) {
    fail(ctx, 'EXTRA_FIELD', `${type} must not carry attrs`)
  }
  if (rules) {
    for (const k of Object.keys(attrs)) {
      if (!(k in rules.attrs)) fail(ctx, 'EXTRA_FIELD', `unknown attr ${JSON.stringify(k)}`)
    }
    for (const k of rules.required ?? []) {
      if (!(k in attrs)) fail(ctx, 'MISSING_ATTR', `missing required attrs.${k}`)
    }
    for (const [k, rule] of Object.entries(rules.attrs)) {
      const v = attrs[k]
      if (v === undefined) continue
      if (v === null) {
        if ('nullable' in rule && rule.nullable) continue
        fail(ctx, 'INVALID_ATTR', `attrs.${k} must not be null`)
      }
      if ('enum' in rule) {
        if (!rule.enum.includes(v)) fail(ctx, 'INVALID_ATTR', `attrs.${k} invalid value ${JSON.stringify(v)}`)
      } else if ('int' in rule) {
        if (typeof v !== 'number' || !Number.isInteger(v) || v < rule.int[0] || v > rule.int[1]) {
          fail(ctx, 'INVALID_ATTR', `attrs.${k} must be integer ${rule.int[0]}-${rule.int[1]}`)
        }
      } else if ('str' in rule) {
        if (typeof v !== 'string' || v.length < rule.str[0] || v.length > rule.str[1]) {
          fail(ctx, 'INVALID_ATTR', `attrs.${k} must be string ${rule.str[0]}-${rule.str[1]} chars`)
        } else if (rule.pattern && !rule.pattern.test(v)) {
          fail(ctx, 'INVALID_ATTR', `attrs.${k} invalid format`)
        }
      } else if ('arrayInt' in rule) {
        if (!Array.isArray(v)) fail(ctx, 'INVALID_ATTR', `attrs.${k} must be an array`)
        if (rule.maxItems !== undefined && v.length > rule.maxItems) fail(ctx, 'INVALID_ATTR', `attrs.${k} exceeds ${rule.maxItems} items`)
        for (const item of v) {
          if (typeof item !== 'number' || !Number.isInteger(item) || item < rule.arrayInt[0] || item > rule.arrayInt[1]) {
            fail(ctx, 'INVALID_ATTR', `attrs.${k} item invalid`)
          }
        }
      }
    }
  }
}

// ---- media validation ----
function validateImageAttrs(attrs: Record<string, unknown>, opts: ViewModelOptions, ctx: { path: string }): SafeImage {
  const mediaId = attrs.mediaId as string
  const src = attrs.src
  const alt = attrs.alt as string
  if (typeof src !== 'string' || src.length === 0) fail(ctx, 'UNRESOLVED_MEDIA', `image ${mediaId} has no src`)
  if (src.startsWith('media://')) fail(ctx, 'UNRESOLVED_MEDIA', `image ${mediaId} src not resolved (media://)`)
  if (!isPermanentContentUrl(src)) fail(ctx, 'UNSAFE_URL', `image ${mediaId} src is not a stable CDN URL`)
  const resolved = opts.mediaResolver(mediaId)
  if (!resolved) fail(ctx, 'UNRESOLVED_MEDIA', `image mediaId ${mediaId} not found`)
  if (src !== resolved) fail(ctx, 'MEDIA_MISMATCH', `image ${mediaId} src does not match resolved URL`)
  const caption = attrs.caption === undefined ? null : (attrs.caption as string)
  return {
    kind: 'image',
    mediaId,
    src,
    alt,
    caption,
    align: attrs.align as ImageAlign,
    displayWidth: attrs.displayWidth as DisplayWidth,
  }
}

function validateGalleryImage(attrs: Record<string, unknown>, opts: ViewModelOptions, ctx: { path: string }): SafeGalleryImage {
  const mediaId = attrs.mediaId as string
  const src = attrs.src
  const alt = attrs.alt as string
  if (typeof src !== 'string' || src.length === 0 || src.startsWith('media://')) {
    fail(ctx, 'UNRESOLVED_MEDIA', `gallery image ${mediaId} src not resolved`)
  }
  if (!isPermanentContentUrl(src)) fail(ctx, 'UNSAFE_URL', `gallery image ${mediaId} src is not a stable CDN URL`)
  const resolved = opts.mediaResolver(mediaId)
  if (!resolved) fail(ctx, 'UNRESOLVED_MEDIA', `gallery image mediaId ${mediaId} not found`)
  if (src !== resolved) fail(ctx, 'MEDIA_MISMATCH', `gallery image ${mediaId} src does not match resolved URL`)
  const caption = attrs.caption === undefined ? null : (attrs.caption as string)
  return {
    mediaId,
    src,
    alt,
    caption,
    align: attrs.align as ImageAlign,
    displayWidth: attrs.displayWidth as DisplayWidth,
  }
}

// ---- node walker ----
interface WalkCtx {
  path: string
  opts: ViewModelOptions
  count: (path: string) => void
}

function walkInline(node: unknown, ctx: WalkCtx): SafeInline {
  ctx.count(ctx.path)
  if (!isPlainObject(node)) fail(ctx, 'NOT_OBJECT', 'node is not a plain object')
  const type = node.type
  if (type === 'text') {
    for (const k of Object.keys(node)) if (!NODE_FIELDS.text.includes(k)) fail(ctx, 'EXTRA_FIELD', `unexpected field on text: ${k}`)
    const text = node.text
    if (typeof text !== 'string') fail(ctx, 'INVALID_TEXT', 'text node requires a string text')
    if (text.length > MAX_TEXT) fail(ctx, 'MAX_TEXT', `text exceeds ${MAX_TEXT} chars`)
    return { kind: 'text', text, marks: toSafeMarks(node.marks, ctx) }
  }
  if (type === 'hardBreak') {
    for (const k of Object.keys(node)) if (!NODE_FIELDS.hardBreak.includes(k)) fail(ctx, 'EXTRA_FIELD', `unexpected field on hardBreak: ${k}`)
    return { kind: 'hardBreak' }
  }
  fail(ctx, 'UNKNOWN_NODE', `unknown inline node type ${JSON.stringify(type)}`)
}

function walkBlock(node: unknown, depth: number, ctx: WalkCtx): SafeBlock {
  ctx.count(ctx.path)
  if (!isPlainObject(node)) fail(ctx, 'NOT_OBJECT', 'node is not a plain object')
  if (depth > MAX_DEPTH) fail(ctx, 'MAX_DEPTH', `exceeds max depth ${MAX_DEPTH}`)
  const type = node.type
  if (typeof type !== 'string' || !BLOCK_TYPES.has(type)) {
    fail(ctx, 'UNKNOWN_NODE', `unknown node type ${JSON.stringify(type)}`)
  }
  const fields = NODE_FIELDS[type]
  for (const k of Object.keys(node)) {
    if (!fields.includes(k)) fail(ctx, 'EXTRA_FIELD', `unexpected field on ${type}: ${k}`)
  }
  validateAttrs(node, ctx)
  const childRule = CHILD_RULE[type]
  const content = node.content
  // unified array-bound enforcement (minItems/maxItems per schema)
  if (content !== undefined) {
    if (!Array.isArray(content)) fail(ctx, 'INVALID_CONTENT', `${type} content must be an array`)
    enforceContentLimits(type, content, ctx)
  }
  const child = (c: unknown, i: number): unknown => {
    const childType = isPlainObject(c) ? (c.type as string) : undefined
    if (!checkAllowedKind(childType, childRule)) fail({ ...ctx, path: `${ctx.path}.content[${i}]` }, 'INVALID_CHILD', `${JSON.stringify(childType)} is not allowed under ${type}`)
    return c
  }

  switch (type) {
    case 'paragraph': {
      const children = content === undefined ? [] : walkChildren(content, child, ctx)
      return { kind: 'paragraph', textAlign: alignOf(node.attrs), children }
    }
    case 'heading': {
      const children = content === undefined ? [] : walkChildren(content, child, ctx)
      return { kind: 'heading', level: (node.attrs as any).level as HeadingLevel, textAlign: alignOf(node.attrs), children }
    }
    case 'blockquote': {
      if (!Array.isArray(content)) fail(ctx, 'MISSING_CONTENT', 'blockquote requires content')
      return { kind: 'blockquote', children: (content as unknown[]).map((c, i) => walkBlock(child(c, i), depth + 1, { ...ctx, path: `${ctx.path}.content[${i}]` })) }
    }
    case 'bulletList': {
      if (!Array.isArray(content)) fail(ctx, 'MISSING_CONTENT', 'bulletList requires content')
      return { kind: 'bulletList', children: (content as unknown[]).map((c, i) => walkListItem(child(c, i), depth + 1, ctx, i)) }
    }
    case 'orderedList': {
      if (!Array.isArray(content)) fail(ctx, 'MISSING_CONTENT', 'orderedList requires content')
      const start = isPlainObject(node.attrs) && typeof node.attrs.start === 'number' ? (node.attrs.start as number) : 1
      return { kind: 'orderedList', start, children: (content as unknown[]).map((c, i) => walkListItem(child(c, i), depth + 1, ctx, i)) }
    }
    case 'codeBlock': {
      // plainText children only: {type:'text', text} — no marks, no extra fields
      let text = ''
      if (content !== undefined) {
        for (let ci = 0; ci < (content as unknown[]).length; ci++) {
          const p = `${ctx.path}.content[${ci}]`
          ctx.count(p)
          const c = (content as unknown[])[ci]
          if (!isPlainObject(c)) fail({ path: p }, 'NOT_OBJECT', 'codeBlock child must be a plain object')
          if (c.type !== 'text') fail({ path: p }, 'INVALID_CHILD', 'codeBlock only accepts text children')
          for (const k of Object.keys(c)) {
            if (k !== 'type' && k !== 'text') fail({ path: p }, 'EXTRA_FIELD', `unexpected field on codeBlock text: ${k}`)
          }
          if (typeof c.text !== 'string') fail({ path: p }, 'INVALID_TEXT', 'codeBlock text requires a string text')
          if ((c.text as string).length > MAX_TEXT) fail({ path: p }, 'MAX_TEXT', `text exceeds ${MAX_TEXT} chars`)
          text = c.text as string
        }
      }
      return {
        kind: 'codeBlock',
        language: isPlainObject(node.attrs) && typeof node.attrs.language === 'string' ? (node.attrs.language as string) : null,
        text,
      }
    }
    case 'horizontalRule':
      return { kind: 'horizontalRule' }
    case 'table': {
      if (!Array.isArray(content)) fail(ctx, 'MISSING_CONTENT', 'table requires content')
      const rows: SafeTableRow[] = (content as unknown[]).map((r, i) => walkTableRow(child(r, i), depth + 1, ctx, i))
      return { kind: 'table', rows }
    }
    case 'image': {
      validateAttrs(node, ctx)
      return validateImageAttrs(node.attrs as Record<string, unknown>, ctx.opts, ctx)
    }
    case 'gallery': {
      if (!Array.isArray(content)) fail(ctx, 'MISSING_CONTENT', 'gallery requires content')
      validateAttrs(node, ctx)
      const images = (content as unknown[]).map((c, i) => {
        const p = `${ctx.path}.content[${i}]`
        ctx.count(p)
        if (!isPlainObject(c) || c.type !== 'image') fail({ path: p }, 'INVALID_CHILD', 'gallery only accepts image children')
        for (const k of Object.keys(c)) if (!NODE_FIELDS.image.includes(k)) fail({ path: p }, 'EXTRA_FIELD', `unexpected field on gallery image: ${k}`)
        validateAttrs(c, { path: p })
        return validateGalleryImage(c.attrs as Record<string, unknown>, ctx.opts, { path: p })
      })
      return { kind: 'gallery', layout: (node.attrs as any).layout as GalleryLayout, images }
    }
    case 'collapse': {
      if (!Array.isArray(content)) fail(ctx, 'MISSING_CONTENT', 'collapse requires content')
      validateAttrs(node, ctx)
      const title = (node.attrs as any).title as string
      return { kind: 'collapse', title, children: (content as unknown[]).map((c, i) => walkBlock(child(c, i), depth + 1, { ...ctx, path: `${ctx.path}.content[${i}]` })) }
    }
    default:
      fail(ctx, 'UNKNOWN_NODE', `unknown node type ${JSON.stringify(type)}`)
  }
}

function walkChildren(content: unknown, child: (c: unknown, i: number) => unknown, ctx: WalkCtx): SafeInline[] {
  if (!Array.isArray(content)) fail(ctx, 'INVALID_CONTENT', 'content must be an array')
  return (content as unknown[]).map((c, i) => {
    const p = `${ctx.path}.content[${i}]`
    return walkInline(child(c, i) as any, { ...ctx, path: p })
  })
}

function walkListItem(node: unknown, depth: number, ctx: WalkCtx, index: number): SafeListItem {
  const path = `${ctx.path}.content[${index}]`
  ctx.count(path)
  if (!isPlainObject(node)) fail({ path }, 'NOT_OBJECT', 'listItem must be a plain object')
  if (node.type !== 'listItem') fail({ path }, 'INVALID_CHILD', 'list only accepts listItem children')
  for (const k of Object.keys(node)) if (!NODE_FIELDS.listItem.includes(k)) fail({ path }, 'EXTRA_FIELD', `unexpected field on listItem: ${k}`)
  if (node.attrs !== undefined) fail({ path }, 'EXTRA_FIELD', 'listItem must not carry attrs')
  if (!Array.isArray(node.content)) fail({ path }, 'MISSING_CONTENT', 'listItem requires content')
  return { kind: 'listItem', children: (node.content as unknown[]).map((c, i) => walkBlock(c, depth + 1, { ...ctx, path: `${path}.content[${i}]` })) }
}

function walkTableRow(node: unknown, depth: number, ctx: WalkCtx, index: number): SafeTableRow {
  const path = `${ctx.path}.content[${index}]`
  ctx.count(path)
  if (!isPlainObject(node)) fail({ path }, 'NOT_OBJECT', 'tableRow must be a plain object')
  if (node.type !== 'tableRow') fail({ path }, 'INVALID_CHILD', 'table only accepts tableRow children')
  for (const k of Object.keys(node)) if (!NODE_FIELDS.tableRow.includes(k)) fail({ path }, 'EXTRA_FIELD', `unexpected field on tableRow: ${k}`)
  if (node.attrs !== undefined) fail({ path }, 'EXTRA_FIELD', 'tableRow must not carry attrs')
  if (!Array.isArray(node.content)) fail({ path }, 'MISSING_CONTENT', 'tableRow requires content')
  const cells: SafeTableCell[] = (node.content as unknown[]).map((c, i) => walkTableCell(c, depth + 1, ctx, i, path))
  return { cells }
}

function walkTableCell(node: unknown, depth: number, ctx: WalkCtx, index: number, rowPath: string): SafeTableCell {
  const path = `${rowPath}.content[${index}]`
  ctx.count(path)
  if (!isPlainObject(node)) fail({ path }, 'NOT_OBJECT', 'cell must be a plain object')
  const type = node.type
  if (type !== 'tableCell' && type !== 'tableHeader') fail({ path }, 'INVALID_CHILD', 'tableRow only accepts tableCell/tableHeader children')
  const fields = NODE_FIELDS[type]
  for (const k of Object.keys(node)) if (!fields.includes(k)) fail({ path }, 'EXTRA_FIELD', `unexpected field on ${type}: ${k}`)
  validateAttrs(node, { path })
  if (!Array.isArray(node.content)) fail({ path }, 'MISSING_CONTENT', `${type} requires content`)
  const attrs = isPlainObject(node.attrs) ? node.attrs : {}
  return {
    kind: type === 'tableHeader' ? 'header' : 'cell',
    colspan: typeof attrs.colspan === 'number' ? (attrs.colspan as number) : 1,
    rowspan: typeof attrs.rowspan === 'number' ? (attrs.rowspan as number) : 1,
    colwidth: Array.isArray(attrs.colwidth) ? (attrs.colwidth as number[]) : null,
    textAlign: alignOf(attrs),
    children: (node.content as unknown[]).map((c, i) => walkBlock(c, depth + 1, { ...ctx, path: `${path}.content[${i}]` })),
  }
}

function alignOf(attrs: unknown): Align | null {
  if (isPlainObject(attrs) && typeof attrs.textAlign === 'string') return attrs.textAlign as Align
  return null
}

// ---- public API ----
export function buildContentViewModel(input: unknown, opts: ViewModelOptions): SafeDocumentViewModel {
  if (!isPlainObject(input)) fail({ path: 'document' }, 'NOT_OBJECT', 'document must be a plain object')
  const doc = input as Record<string, unknown>
  for (const k of Object.keys(doc)) {
    if (k !== 'schemaVersion' && k !== 'doc') fail({ path: 'document' }, 'EXTRA_FIELD', `unexpected top-level field: ${k}`)
  }
  if (doc.schemaVersion !== 'content.document.v1') {
    fail({ path: 'document' }, 'UNKNOWN_VERSION', `schemaVersion must be content.document.v1`)
  }
  const root = doc.doc
  if (!isPlainObject(root) || root.type !== 'doc') fail({ path: 'document.doc' }, 'INVALID_DOC', 'root must be a doc node')
  for (const k of Object.keys(root)) {
    if (!NODE_FIELDS.doc.includes(k)) fail({ path: 'document.doc' }, 'EXTRA_FIELD', `unexpected field on doc: ${k}`)
  }
  if (root.attrs !== undefined) fail({ path: 'document.doc' }, 'EXTRA_FIELD', 'doc must not carry attrs')
  if (!Array.isArray(root.content)) fail({ path: 'document.doc' }, 'MISSING_CONTENT', 'doc requires content array')
  if (root.content.length > 5000) fail({ path: 'document.doc' }, 'MAX_ITEMS', 'doc content exceeds 5000 items')
  // independent total node count (root doc counts as one node)
  let nodeCount = 0
  const count = (path: string): void => {
    nodeCount += 1
    if (nodeCount > MAX_NODES) fail({ path }, 'MAX_NODES', `document exceeds ${MAX_NODES} nodes`)
  }
  count('document.doc')
  const ctx: WalkCtx = { path: 'document.doc', opts, count }
  const blocks: SafeBlock[] = (root.content as unknown[]).map((c, i) => {
    const childType = isPlainObject(c) ? (c.type as string) : undefined
    if (!checkAllowedKind(childType, 'block')) fail({ path: `document.doc.content[${i}]` }, 'INVALID_CHILD', `${JSON.stringify(childType)} is not allowed at document root`)
    return walkBlock(c, 1, { ...ctx, path: `document.doc.content[${i}]` })
  })
  return { blocks }
}
