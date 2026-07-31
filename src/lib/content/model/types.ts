// Content entry types — mirrors data-model.md with publicId replacing slug

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface ContentEntry {
  id: string // UUID, immutable
  publicId: number // Server-generated positive integer, globally unique
  title: string
  summary: string | null
  coverMediaId: string | null
  tags: string[]
  status: ContentStatus
  draftRevisionId: string
  publishedRevisionId: string | null
  revision: number // Optimistic concurrency
  createdAt: string // ISO 8601
  updatedAt: string
  publishedAt: string | null
}

export interface ContentRevision {
  id: string
  entryId: string
  sequence: number
  document: ContentDocument
  metadataSnapshot: {
    publicId: number
    title: string
    summary: string | null
    coverMediaId: string | null
    tags: string[]
  }
  mediaReferences: MediaReference[]
  documentHash: string // SHA-256 lowercase hex
  createdAt: string
}

export interface ContentDocument {
  schemaVersion: 'content.document.v1'
  doc: DocumentNode
}

export type MediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
export type MediaStatus = 'STAGED' | 'REMOTE_VERIFIED' | 'REFERENCED' | 'ORPHANED'

export interface MediaAsset {
  id: string
  contentHash: string
  originalName: string
  mediaType: MediaType
  byteSize: number
  width: number
  height: number
  localObjectName: string
  publicObjectKey: string
  publicUrl: string | null
  status: MediaStatus
  remoteCheckedAt: string | null
  createdAt: string
}

export interface MediaReference {
  revisionId: string
  mediaId: string
  nodePath: number[]
  role: 'BODY' | 'GALLERY' | 'COVER'
}

export interface Publication {
  entryId: string
  revisionId: string
  publicId: number
  sourcePath: string
  publicPath: string
  publishedAt: string
  generationHash: string
}

export type ExportFormat = 'NGA_BBCODE' | 'MARKDOWN'

export interface ExportArtifact {
  revisionId: string
  format: ExportFormat
  mappingVersion: string
  text: string
  losses: ExportLoss[]
  generatedAt: string
}

export interface ExportLoss {
  severity: 'INFO' | 'WARNING' | 'BLOCKING'
  nodePath: number[]
  nodeType: string
  code: string
  messageKey: string
  fallback: string | null
}

export type AuditAction = 'PUBLISH' | 'WITHDRAW' | 'ARCHIVE' | 'RESTORE' | 'MEDIA_STAGE' | 'MEDIA_VERIFY'

export interface AuditEvent {
  id: string
  entryId: string
  action: AuditAction
  revisionId: string | null
  result: 'SUCCESS' | 'FAILURE'
  reasonCode: string | null
  createdAt: string
}

// ProseMirror/Tiptap JSON node types
export interface DocumentNode {
  type: 'doc'
  content: BlockNode[]
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | BulletListNode
  | OrderedListNode
  | ListItemNode
  | CodeBlockNode
  | HorizontalRuleNode
  | TableNode
  | ImageNode
  | GalleryNode
  | CollapseNode

export interface ParagraphNode {
  type: 'paragraph'
  attrs?: TextAlignAttrs
  content?: InlineNode[]
}

export interface HeadingNode {
  type: 'heading'
  attrs: { level: 2 | 3 | 4; textAlign?: 'left' | 'center' | 'right' | 'justify' }
  content: InlineNode[]
}

export interface BlockquoteNode {
  type: 'blockquote'
  content: BlockNode[]
}

export interface BulletListNode {
  type: 'bulletList'
  content: ListItemNode[]
}

export interface OrderedListNode {
  type: 'orderedList'
  attrs?: { start?: number }
  content: ListItemNode[]
}

export interface ListItemNode {
  type: 'listItem'
  content: BlockNode[]
}

export interface CodeBlockNode {
  type: 'codeBlock'
  attrs?: { language?: string | null }
  content?: TextNode[]
}

export interface HorizontalRuleNode {
  type: 'horizontalRule'
}

export interface TableNode {
  type: 'table'
  content: TableRowNode[]
}

export interface TableRowNode {
  type: 'tableRow'
  content: (TableCellNode | TableHeaderNode)[]
}

export interface TableCellAttrs {
  colspan?: number
  rowspan?: number
  colwidth?: number[] | null
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}

export interface TableCellNode {
  type: 'tableCell'
  attrs?: TableCellAttrs
  content: BlockNode[]
}

export interface TableHeaderNode {
  type: 'tableHeader'
  attrs?: TableCellAttrs
  content: BlockNode[]
}

export interface ImageNode {
  type: 'image'
  attrs: {
    mediaId: string
    src?: string | null
    alt: string
    caption?: string | null
    align: 'left' | 'center' | 'right'
    displayWidth: 25 | 50 | 75 | 100
    width?: number | null
    height?: number | null
  }
}

export interface GalleryNode {
  type: 'gallery'
  attrs: { layout: 'two-column' | 'three-column' | 'grid' }
  content: ImageNode[]
}

export interface CollapseNode {
  type: 'collapse'
  attrs: { title: string }
  content: BlockNode[]
}

export interface TextAlignAttrs {
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}

export type InlineNode = TextNode | HardBreakNode

export interface TextNode {
  type: 'text'
  text: string
  marks?: Mark[]
}

export interface HardBreakNode {
  type: 'hardBreak'
}

export type Mark = SimpleMark | TextStyleMark | LinkMark

export interface SimpleMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'code'
}

export interface TextStyleMark {
  type: 'textStyle'
  attrs: {
    color?: string | null
    sizePercent?: 75 | 100 | 125 | 150 | 200 | null
  }
}

export interface LinkMark {
  type: 'link'
  attrs: {
    href: string
    target?: '_blank' | null
    rel?: 'noopener noreferrer nofollow' | null
  }
}
