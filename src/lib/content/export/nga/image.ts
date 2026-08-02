// NGA image/gallery serialization — permanent HTTPS CDN URLs only (T051).
// Temporary/signed/foreign URLs produce a BLOCKING loss and no [img] tag.

import { escapeNgaUrl } from './escaping'
import type { ExportLoss, GalleryNode, ImageNode } from '@/lib/content/model/types'

export interface ImageResult {
  text: string
  losses: ExportLoss[]
}

// The project's stable media host (content CDN). Anything else is unstable.
const STABLE_HOST = 'https://img.nightingalesilence.com/content/'

export function isStableImageUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith(STABLE_HOST) && !url.includes('?')
}

function loss(severity: ExportLoss['severity'], nodePath: number[], nodeType: string, code: string, fallback: string | null): ExportLoss {
  return { severity, nodePath, nodeType, code, messageKey: `contentStudio.export.loss.${code}`, fallback }
}

export function serializeImage(node: ImageNode, nodePath: number[]): ImageResult {
  const url = node.attrs.src ?? null
  if (!isStableImageUrl(url)) {
    return {
      text: '',
      losses: [loss('BLOCKING', nodePath, 'image', 'unstable-image-url', null)],
    }
  }
  const losses: ExportLoss[] = []
  const parts = [`[img]${escapeNgaUrl(url)}[/img]`]
  if (node.attrs.caption && node.attrs.caption.length > 0) {
    losses.push(loss('INFO', nodePath, 'image', 'caption-as-text', null))
    parts.push(`[b]${node.attrs.caption}[/b]`) // raw: NGA has no escape syntax
  }
  return { text: parts.join('\n'), losses }
}

export function serializeGallery(node: GalleryNode, nodePath: number[]): ImageResult {
  // NGA [album]: one image URL per line, first image is the cover.
  // Album lines cannot carry captions — if any image has one, fall back to
  // the flattened [img] form so captions survive as text.
  const anyCaption = node.content.some((img) => img.attrs.caption && img.attrs.caption.length > 0)
  if (anyCaption) {
    const losses: ExportLoss[] = [loss('INFO', nodePath, 'gallery', 'gallery-flattened', null)]
    const parts: string[] = []
    node.content.forEach((img, idx) => {
      const r = serializeImage(img, [...nodePath, idx])
      if (r.text) parts.push(r.text)
      losses.push(...r.losses)
    })
    return { text: parts.join('\n\n'), losses }
  }

  const losses: ExportLoss[] = []
  if (node.attrs?.layout) {
    losses.push(loss('INFO', nodePath, 'gallery', 'gallery-layout-degraded', null))
  }
  const lines: string[] = []
  node.content.forEach((img, idx) => {
    const url = img.attrs.src ?? null
    if (!isStableImageUrl(url)) {
      losses.push(loss('BLOCKING', [...nodePath, idx], 'image', 'unstable-image-url', null))
      return
    }
    lines.push(escapeNgaUrl(url))
  })
  const text = lines.length > 0 ? `[album]\n${lines.join('\n')}\n[/album]` : ''
  return { text, losses }
}
