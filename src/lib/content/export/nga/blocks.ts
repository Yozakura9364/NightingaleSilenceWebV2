// NGA block serialization — paragraphs, headings, lists, quotes, code,
// collapse and unknown-node handling (T050).

import { serializeInlineNodes } from './inline'
import type { BlockNode } from '@/lib/content/model/types'
import type { ExportLoss } from '@/lib/content/model/types'

export interface BlockResult {
  text: string
  losses: ExportLoss[]
}

const HEADING_SIZE: Record<number, string> = { 2: '120%', 3: '110%', 4: '100%' }

function loss(severity: ExportLoss['severity'], nodePath: number[], nodeType: string, code: string, fallback: string | null): ExportLoss {
  return { severity, nodePath, nodeType, code, messageKey: `contentStudio.export.loss.${code}`, fallback }
}

/** Serialize a list of block nodes separated by blank lines. */
export function serializeBlocks(nodes: BlockNode[] | undefined, path: number[]): BlockResult {
  const parts: string[] = []
  const losses: ExportLoss[] = []
  if (!nodes) return { text: '', losses }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const r = serializeBlock(node, [...path, i])
    parts.push(r.text)
    losses.push(...r.losses)
  }

  const text = parts.filter((p) => p.length > 0).join('\n\n')
  return { text, losses }
}

/** Serialize one block node with an explicit full path (top-level use). */
export function serializeSingleBlock(node: BlockNode, nodePath: number[]): BlockResult {
  return serializeBlock(node, nodePath)
}

function serializeBlock(node: BlockNode, nodePath: number[]): BlockResult {
  switch (node.type) {
    case 'paragraph': {
      const inline = serializeInlineNodes(node.content, nodePath)
      if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
        inline.losses.push(loss('INFO', nodePath, 'paragraph', 'text-align-degraded', null))
      }
      return { text: inline.text, losses: inline.losses }
    }
    case 'heading': {
      const inline = serializeInlineNodes(node.content, nodePath)
      const size = HEADING_SIZE[node.attrs.level] ?? '100%'
      inline.losses.push(loss('INFO', nodePath, 'heading', 'heading-degraded', null))
      if (node.attrs.textAlign && node.attrs.textAlign !== 'left') {
        inline.losses.push(loss('INFO', nodePath, 'heading', 'text-align-degraded', null))
      }
      return { text: `[b][size=${size}]${inline.text}[/size][/b]`, losses: inline.losses }
    }
    case 'blockquote': {
      const inner = serializeBlocks(node.content, nodePath)
      return { text: `[quote]${inner.text}[/quote]`, losses: inner.losses }
    }
    case 'bulletList': {
      const losses: ExportLoss[] = []
      const items = node.content.map((li, liIdx) => {
        const inner = serializeBlocks(li.content, [...nodePath, liIdx])
        losses.push(...inner.losses)
        return `[*]${inner.text}`
      })
      return { text: `[list]\n${items.join('\n')}\n[/list]`, losses }
    }
    case 'orderedList': {
      const start = node.attrs?.start && node.attrs.start !== 1 ? node.attrs.start : 1
      const losses: ExportLoss[] = []
      const items = node.content.map((li, liIdx) => {
        const inner = serializeBlocks(li.content, [...nodePath, liIdx])
        losses.push(...inner.losses)
        return `[*]${inner.text}`
      })
      const tag = start === 1 ? '[list=1]' : `[list=${start}]`
      return { text: `${tag}\n${items.join('\n')}\n[/list]`, losses }
    }
    case 'codeBlock': {
      const text = node.content?.map((t) => (t.type === 'text' ? t.text : '')).join('') ?? ''
      const lang = node.attrs?.language ? `=${node.attrs.language}` : ''
      // NGA has no escape syntax; code content goes out raw (NGA treats
      // [code] bodies verbatim). Residual risk: if NGA ever parses tags
      // inside [code], a literal [/code] would truncate early — no dialect
      // mechanism exists to prevent it, so this is accepted and documented.
      return { text: `[code${lang}]${text}[/code]`, losses: [] }
    }
    case 'horizontalRule':
      // NGA divider: ===…=== line (verified 2026-08-01; [h][/h] is the fallback)
      return { text: '==========', losses: [] }
    case 'collapse': {
      const inner = serializeBlocks(node.content, nodePath)
      // no escape syntax in the attribute position: strip brackets instead
      const title = node.attrs.title.replace(/[\][]/g, '')
      return { text: `[collapse=${title}]${inner.text}[/collapse]`, losses: inner.losses }
    }
    default:
      // image/table/gallery handled by blocks-with-media (table.ts / image.ts);
      // anything truly unknown is a blocking loss and skipped.
      return {
        text: '',
        losses: [loss('BLOCKING', nodePath, node.type, 'unknown-node', null)],
      }
  }
}
