// markRenderer.ts — maps validated marks to tag/style descriptors for the
// public renderer (T040). Pure function, no HTML string generation.
import type { SafeMark } from './contentViewModel'

export interface RenderedMark {
  tag: 'strong' | 'em' | 'u' | 's' | 'code' | 'span' | 'a'
  attrs: Record<string, string> | null
  style: Record<string, string> | null
}

export function renderMark(mark: SafeMark): RenderedMark {
  switch (mark.kind) {
    case 'bold':
      return { tag: 'strong', attrs: null, style: null }
    case 'italic':
      return { tag: 'em', attrs: null, style: null }
    case 'underline':
      return { tag: 'u', attrs: null, style: null }
    case 'strike':
      return { tag: 's', attrs: null, style: null }
    case 'code':
      return { tag: 'code', attrs: null, style: null }
    case 'textStyle': {
      const style: Record<string, string> = {}
      if (mark.color) style.color = mark.color
      if (mark.sizePercent !== null && mark.sizePercent !== undefined) style.fontSize = `${mark.sizePercent}%`
      return { tag: 'span', attrs: null, style: Object.keys(style).length > 0 ? style : null }
    }
    case 'link': {
      const attrs: Record<string, string> = { href: mark.href }
      if (mark.target) attrs.target = mark.target
      if (mark.rel) attrs.rel = mark.rel
      return { tag: 'a', attrs, style: null }
    }
    default: {
      const kind = (mark as { kind?: unknown }).kind
      throw new Error(`Unknown mark kind: ${JSON.stringify(kind)}`)
    }
  }
}
