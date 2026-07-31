// toCanonicalDocument — shared canonical conversion module
// Used by ContentEditor/autosave before sending to API, and by tests.
// Only strips known Tiptap null defaults and maps table cell align→textAlign.
// Unknown attrs are PRESERVED and left for the server to reject (fail-closed).

export interface CanonicalNode {
  type: string
  attrs?: Record<string, unknown>
  content?: CanonicalNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

const TABLE_CELL_TYPES = new Set(['tableCell', 'tableHeader'])

export function toCanonicalDocument(doc: CanonicalNode): CanonicalNode {
  if (Array.isArray(doc)) return (doc as unknown as CanonicalNode[]).map(toCanonicalDocument) as unknown as CanonicalNode
  if (doc && typeof doc === 'object' && 'type' in doc) {
    const node = { ...doc } as any
    delete node.type
    delete node.content
    delete node.text
    delete node.marks
    delete node.attrs

    const r: any = { type: doc.type }

    if (doc.text !== undefined) r.text = doc.text

    if (doc.marks && Array.isArray(doc.marks)) {
      r.marks = doc.marks.map((m: any) => {
        const clean: any = { type: m.type }
        if (m.attrs) {
          const a: any = {}
          for (const [k, v] of Object.entries(m.attrs)) {
            if (v === null && isTiptapDefaultNull(m.type, k)) continue
            a[k] = v
          }
          if (Object.keys(a).length > 0) clean.attrs = a
        }
        return clean
      })
    }

    if (doc.attrs && typeof doc.attrs === 'object') {
      const a: any = {}
      for (const [k, v] of Object.entries(doc.attrs)) {
        // Skip known Tiptap default-null attrs (not meaningful in canonical JSON)
        if (v === null && isTiptapDefaultNull(doc.type, k)) continue
        // gid is editor-runtime only on image/gallery; strip ONLY there.
        // Unknown gid on other nodes is preserved → strict server rejects it (fail-closed).
        if (k === 'gid' && (doc.type === 'image' || doc.type === 'gallery')) continue
        // Table cell align → textAlign
        if (k === 'align' && TABLE_CELL_TYPES.has(doc.type)) {
          a['textAlign'] = v
        } else {
          a[k] = v
        }
      }
      if (Object.keys(a).length > 0) r.attrs = a
    }

    if (doc.content && Array.isArray(doc.content)) {
      r.content = doc.content.map(toCanonicalDocument)
    }

    return r
  }
  return doc
}

// Known Tiptap default-null attrs that should be stripped from canonical JSON
const TIPPAK_DEFAULT_NULL: Record<string, Set<string>> = {
  'textAlign': new Set(['textAlign']),
  'tableCell': new Set(['colwidth', 'align']),
  'tableHeader': new Set(['colwidth', 'align']),
  'heading': new Set(['textAlign']),
  'paragraph': new Set(['textAlign']),
  'codeBlock': new Set(['language']),
}

function isTiptapDefaultNull(nodeType: string, attrName: string): boolean {
  const attrs = TIPPAK_DEFAULT_NULL[nodeType]
  if (attrs && attrs.has(attrName)) return true
  return false
}
