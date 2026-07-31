// ContentDocument envelope ↔ bare ProseMirror doc boundary helpers
import { toCanonicalDocument } from '@/lib/content/editor/toCanonicalDocument'
// Used by ContentStudioPage and tested directly for regression protection.

export interface ContentDocument {
  schemaVersion: string
  doc: BareDoc
}

export interface BareDoc {
  type: 'doc'
  content: unknown[]
}

/** Extract bare ProseMirror doc from API ContentDocument response. */
export function extractEditorDoc(contentDocument: ContentDocument | null | undefined): BareDoc {
  return contentDocument?.doc || { type: 'doc', content: [] }
}

/** Wrap bare runtime doc and metadata into SaveDraftInput; canonicalize here (strips gid). */
export function buildSaveDraftBody(
  bareDoc: BareDoc,
  metadata: { title: string; [key: string]: unknown },
  expectedRevision: number
) {
  return {
    expectedRevision,
    document: { schemaVersion: 'content.document.v1' as const, doc: toCanonicalDocument(bareDoc as any) },
    metadata
  }
}
