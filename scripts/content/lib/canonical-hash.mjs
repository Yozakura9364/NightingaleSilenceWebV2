// canonical-hash.mjs — THE single canonical serialization + hashing helper
// for public content (T038/T039/T042). Generator, checker and the browser-side
// publicContent service ALL import this module, so the generationHash contract
// (input object, key ordering, serialization, digest) can never drift.
//
// Contract:
//   - canonicalJson(value): Python-style json.dumps(value, ensure_ascii=False,
//     sort_keys=True) — sorted keys, `, ` / `: ` separators, no trailing newline.
//   - sha256Hex(text): hex sha256 of the UTF-8 bytes.
//   - entryGenerationHash(entry): sha256(canonicalJson(entry minus generationHash)).
//     This is the hash stored in public entry files. It binds EVERY field of the
//     entry (title/summary/tags/publishedAt/revision/document/media) so tampering
//     with any of them is detectable.
import { createHash } from 'node:crypto'

export function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(', ') + ']'
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => `${JSON.stringify(k)}: ${canonicalJson(obj[k])}`).join(', ') + '}'
}

export function sha256Hex(text) {
  return createHash('sha256').update(String(text), 'utf8').digest('hex')
}

/** generationHash for a public entry view: entry minus its own generationHash. */
export function entryGenerationHash(entry) {
  const payload = { ...entry }
  delete payload.generationHash
  return sha256Hex(canonicalJson(payload))
}

/** Legacy snapshot-level hash (publication snapshot minus generationHash). */
export function snapshotHash(snapshot) {
  const payload = { ...snapshot }
  delete payload.generationHash
  return sha256Hex(canonicalJson(payload))
}
