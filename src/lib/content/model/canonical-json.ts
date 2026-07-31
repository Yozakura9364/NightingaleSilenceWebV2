// Canonical JSON — stable serialization with sorted keys and content hash

import type { ContentDocument } from './types'

// Recursively sort object keys for deterministic output
function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortKeys)
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key])
  }
  return sorted
}

// Stable JSON serialization: sorted keys, no whitespace
export function toCanonicalJson(document: ContentDocument): string {
  return JSON.stringify(sortKeys(document))
}

// SHA-256 hash of canonical JSON for integrity/deduplication
export async function hashDocument(document: ContentDocument): Promise<string> {
  const json = toCanonicalJson(document)
  const encoder = new TextEncoder()
  const data = encoder.encode(json)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Deep-clone without mutating the input
export function cloneDocument(document: ContentDocument): ContentDocument {
  return JSON.parse(toCanonicalJson(document))
}
