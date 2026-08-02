// Generate NGA BBCode preview samples from the golden fixtures (T055).
// Usage: node scripts/content/generate-nga-samples.mjs [outDir]
// Writes one .txt per fixture case + a combined file, for manual paste into
// NGA's editor/preview. Never posts anything.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', '..')
const cases = JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/content/nga/golden-cases.json'), 'utf8'))

const outDir = process.argv[2] ?? join(ROOT, 'tests/fixtures/content/nga/samples')
mkdirSync(outDir, { recursive: true })

const { serializeNgaBbcode } = await import(join(ROOT, 'src/lib/content/export/nga/serializeNgaBbcode.ts'))

for (const tc of cases.cases) {
  const result = serializeNgaBbcode(tc.document)
  const safe = tc.name.replace(/[^\w\u4e00-\u9fff-]+/g, '-')
  const header = `=== ${tc.name} ===\n(mapping ${result.mappingVersion}; losses: ${result.losses.length})\n`
  const body = result.text + (result.text ? '\n' : '') + (result.losses.length ? `\n-- losses --\n${result.losses.map((l) => `${l.severity} [${l.nodePath.join('.')}] ${l.code}`).join('\n')}\n` : '')
  writeFileSync(join(outDir, `${safe}.txt`), header + body, 'utf8')
  console.log(`wrote ${safe}.txt (${result.text.length} chars)`)
}

// combined file
const combined = cases.cases.map((tc) => {
  const result = serializeNgaBbcode(tc.document)
  return `===== ${tc.name} =====\n${result.text}\n`
}).join('\n\n')
writeFileSync(join(outDir, 'ALL-SAMPLES.txt'), combined, 'utf8')
console.log(`wrote ALL-SAMPLES.txt`)
