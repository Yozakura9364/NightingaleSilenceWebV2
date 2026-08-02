// serializeNgaBbcode.ts — T052. Top-level NGA BBCode serializer.
// Pure function: returns { text, losses, mappingVersion } and never mutates the
// input document. Losses are sorted deterministically by (nodePath, code).
// Unknown nodes are BLOCKING and skipped, never silently dropped.

import { serializeSingleBlock } from './blocks'
import { serializeImage, serializeGallery } from './image'
import { serializeTable } from './table'
import type { BlockNode, ContentDocument, ExportLoss } from '@/lib/content/model/types'

export interface NgaExportResult {
  text: string
  losses: ExportLoss[]
  mappingVersion: string
}

export const NGA_MAPPING_VERSION = 'nga-v1'

function loss(severity: ExportLoss['severity'], nodePath: number[], nodeType: string, code: string): ExportLoss {
  return { severity, nodePath, nodeType, code, messageKey: `contentStudio.export.loss.${code}`, fallback: null }
}

function serializeBlockWithMedia(node: BlockNode, nodePath: number[]): { text: string; losses: ExportLoss[] } {
  switch (node.type) {
    case 'image':
      return serializeImage(node, nodePath)
    case 'gallery':
      return serializeGallery(node, nodePath)
    case 'table':
      return serializeTable(node, nodePath)
    case 'paragraph':
    case 'heading':
    case 'blockquote':
    case 'bulletList':
    case 'orderedList':
    case 'codeBlock':
    case 'horizontalRule':
    case 'collapse':
      return serializeSingleBlock(node, nodePath)
    default:
      return {
        text: '',
        losses: [loss('BLOCKING', nodePath, node.type, 'unknown-node')],
      }
  }
}

export function serializeNgaBbcode(document: ContentDocument): NgaExportResult {
  const losses: ExportLoss[] = []
  const parts: string[] = []

  const root = document.doc
  root.content.forEach((node, i) => {
    const r = serializeBlockWithMedia(node, [i])
    if (r.text) parts.push(r.text)
    losses.push(...r.losses)
  })

  // stable deterministic order: nodePath (document order), then severity, then code
  const pathKey = (p: number[]): string => p.join('.')
  losses.sort((a, b) => {
    const pa = pathKey(a.nodePath)
    const pb = pathKey(b.nodePath)
    if (pa !== pb) return pa < pb ? -1 : 1
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (sev !== 0) return sev
    return a.code < b.code ? -1 : a.code > b.code ? 1 : 0
  })

  return {
    text: parts.filter((p) => p.length > 0).join('\n\n'),
    losses,
    mappingVersion: NGA_MAPPING_VERSION,
  }
}

const SEVERITY_ORDER: Record<ExportLoss['severity'], number> = {
  BLOCKING: 0,
  WARNING: 1,
  INFO: 2,
}
