// Export tree walker — deterministic traversal for serializers

import type { BlockNode, InlineNode, DocumentNode } from '../model/types'

export type NodeVisitor = (node: BlockNode | InlineNode, path: number[]) => void

export interface WalkContext {
  path: number[]
  depth: number
}

const MAX_DEPTH = 50

export function walkDocument(doc: DocumentNode, visitor: NodeVisitor): void {
  walkChildren(doc.content, visitor, { path: [], depth: 0 })
}

function walkChildren(
  nodes: (BlockNode | InlineNode)[] | undefined,
  visitor: NodeVisitor,
  ctx: WalkContext
): void {
  if (!nodes || ctx.depth > MAX_DEPTH) return

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const nodePath = [...ctx.path, i]
    visitor(node, nodePath)

    // Recurse into content-bearing nodes
    const childNodes = (node as any).content
    if (Array.isArray(childNodes)) {
      walkChildren(childNodes, visitor, { path: nodePath, depth: ctx.depth + 1 })
    }
  }
}

// Collect all mediaIds from a document
export function collectMediaIds(doc: DocumentNode): string[] {
  const ids: string[] = []
  walkDocument(doc, (node) => {
    if (node.type === 'image') {
      const img = node as any
      if (img.attrs?.mediaId) ids.push(img.attrs.mediaId)
    }
  })
  return ids
}

// Collect all text content (for search indexing / word count)
export function collectPlainText(doc: DocumentNode): string {
  const parts: string[] = []
  walkDocument(doc, (node) => {
    if (node.type === 'text') {
      parts.push((node as any).text || '')
    }
  })
  return parts.join(' ')
}
