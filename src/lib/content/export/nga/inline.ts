// NGA inline serialization — marks, links, textStyle (T050).
// Marks are closed in reverse order of opening so nested tags stay balanced.
// Unknown marks are never silent: the text is kept and a WARNING loss is
// recorded (symmetric with the unknown-node BLOCKING policy).

import { escapeNgaUrl } from './escaping'
import type { InlineNode, Mark, TextNode } from '@/lib/content/model/types'
import type { ExportLoss } from '@/lib/content/model/types'

export interface InlineResult {
  text: string
  losses: ExportLoss[]
}

function loss(severity: ExportLoss['severity'], nodePath: number[], nodeType: string, code: string): ExportLoss {
  return { severity, nodePath, nodeType, code, messageKey: `contentStudio.export.loss.${code}`, fallback: null }
}

/** Map a mark to its NGA opening/closing tag, or null when unsupported. */
function markTag(mark: Mark): { open: string; close: string } | null {
  switch (mark.type) {
    case 'bold': return { open: '[b]', close: '[/b]' }
    case 'italic': return { open: '[i]', close: '[/i]' }
    case 'underline': return { open: '[u]', close: '[/u]' }
    case 'strike': return { open: '[del]', close: '[/del]' }
    case 'code': return { open: '[code]', close: '[/code]' }
    case 'textStyle': {
      const attrs = mark.attrs ?? {}
      if (typeof attrs.color === 'string' && attrs.color) {
        const color = /^#[0-9a-fA-F]{3,8}$/.test(attrs.color) ? attrs.color : `#${attrs.color}`
        return { open: `[color=${color}]`, close: '[/color]' }
      }
      if (typeof attrs.sizePercent === 'number' && attrs.sizePercent !== null) {
        return { open: `[size=${attrs.sizePercent}%]`, close: '[/size]' }
      }
      return null
    }
    case 'link': {
      const href = mark.attrs?.href ?? ''
      // attribute position is security-sensitive: an unescaped ] would
      // truncate the tag and let the remainder be parsed as new BBCode
      return { open: `[url=${escapeNgaUrl(href)}]`, close: '[/url]' }
    }
    default:
      return null
  }
}

/** Is this mark the special bare-url link (href === text)? */
function isBareUrl(mark: Mark, text: string): boolean {
  return mark.type === 'link' && mark.attrs?.href === text
}

export function serializeInlineNodes(nodes: InlineNode[] | undefined, nodePath: number[] = []): InlineResult {
  const parts: string[] = []
  const losses: ExportLoss[] = []
  if (!nodes) return { text: '', losses }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === 'hardBreak') {
      parts.push('\n')
      continue
    }
    // node.type === 'text' here (InlineNode = TextNode | HardBreakNode)
    const textNode = node as TextNode
    const marks = textNode.marks ?? []
    // bare-url links: [url]href[/url] (no attribute form)
    if (marks.length === 1 && isBareUrl(marks[0], textNode.text)) {
      parts.push(`[url]${escapeNgaUrl(textNode.text)}[/url]`)
      continue
    }
    const tags: { open: string; close: string }[] = []
    for (const m of marks) {
      const tag = markTag(m)
      if (tag) {
        tags.push(tag)
      } else {
        // unknown mark: degrade the mark but keep the text — never silent
        losses.push(loss('WARNING', nodePath, m.type, 'unknown-mark'))
      }
    }
    const inner = textNode.text // NGA has no escape syntax: text goes out raw
    // open in order, close in reverse
    parts.push(tags.map((t) => t.open).join('') + inner + tags.map((t) => t.close).reverse().join(''))
  }

  return { text: parts.join(''), losses }
}
