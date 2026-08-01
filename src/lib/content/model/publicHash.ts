// publicHash.ts — browser-side canonical serialization + sha256 for the
// publicContent service (T042). The canonicalJson algorithm here is the EXACT
// same contract as scripts/content/lib/canonical-hash.mjs (sorted keys, `, ` /
// `: ` separators) — a cross-implementation test locks the two outputs to be
// byte-identical. sha256 uses Web Crypto (crypto.subtle) because node:crypto is
// not available in browser chunks.

/** Python-style json.dumps(obj, ensure_ascii=False, sort_keys=True). */
export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(', ') + ']'
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  return '{' + keys.map((k) => `${JSON.stringify(k)}: ${canonicalJson((obj as Record<string, unknown>)[k])}`).join(', ') + '}'
}

/** hex sha256 via Web Crypto. */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** generationHash for a public entry view: entry minus its own generationHash. */
export async function entryGenerationHash(entry: Record<string, unknown>): Promise<string> {
  const payload = { ...entry }
  delete payload.generationHash
  return sha256Hex(canonicalJson(payload))
}
