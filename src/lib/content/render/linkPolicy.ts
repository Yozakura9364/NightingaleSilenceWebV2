// linkPolicy.ts — fail-closed link URL evaluation for the public renderer (T040).
// Only https/http, mailto, root-relative and anchor hrefs are accepted;
// javascript:/data:/vbscript: and anything outside the schema pattern is rejected.

export interface SafeLink {
  ok: true
  href: string
  target: string | null
  rel: string | null
}

export interface RejectedLink {
  ok: false
  reason: string
}

export type LinkEvaluation = SafeLink | RejectedLink

// Same pattern as editor-document.schema.json linkMark.attrs.href
const ALLOWED_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/
const DANGEROUS = /^(javascript|data|vbscript):/i
const MAX_HREF = 2048
const TARGETS = new Set([null, '_blank'])
const RELS = new Set([null, 'noopener noreferrer nofollow'])

export function evaluateLink(href: unknown, attrs: { target?: unknown; rel?: unknown }): LinkEvaluation {
  if (typeof href !== 'string' || href.length === 0) {
    return { ok: false, reason: 'link href must be a non-empty string' }
  }
  if (href.length > MAX_HREF) {
    return { ok: false, reason: `link href exceeds ${MAX_HREF} chars` }
  }
  if (DANGEROUS.test(href)) {
    return { ok: false, reason: `dangerous link protocol in href: ${href.slice(0, 40)}` }
  }
  if (!ALLOWED_HREF.test(href)) {
    return { ok: false, reason: `unsafe link href: ${href.slice(0, 40)}` }
  }
  const target = attrs.target === undefined ? null : attrs.target
  const rel = attrs.rel === undefined ? null : attrs.rel
  if (!TARGETS.has(target as null | '_blank')) {
    return { ok: false, reason: 'link target must be null or "_blank"' }
  }
  if (!RELS.has(rel as null | 'noopener noreferrer nofollow')) {
    return { ok: false, reason: 'link rel must be null or "noopener noreferrer nofollow"' }
  }
  return { ok: true, href, target: (target as string) ?? null, rel: (rel as string) ?? null }
}
