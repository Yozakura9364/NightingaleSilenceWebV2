// Refresh shared Stain facts while retaining the existing manual value classes.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGameDataBatch, optionValue, publicSource } from './lib/game-data-batch.mjs'
import { readSaintCoinachCsv } from './fashion-check/lib/csv.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceBatch = optionValue('--source-batch')
const output = optionValue('--output')
if (!sourceBatch || !output) throw new Error('--source-batch and --output are required')
const baselinePath = optionValue('--baseline') || path.join(root, 'public/data/ffxiv/dye-catalog.json')
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
if (baseline.schemaVersion !== 'ffxiv.dyeCatalog.v1' || !baseline.dyes || Array.isArray(baseline.dyes)) throw new Error('Invalid manual dye catalog baseline')
const batch = await loadGameDataBatch({ sourceBatch, requirements: { chs: ['Stain'] } })
const source = batch.sources.get('chs/Stain')
const rows = await readSaintCoinachCsv(source.file)
// 上游 2026-10 后把 Stain.Name 列漂移成关联 Item id;染剂真名落在首个无名列
// (SaintCoinach 的 InlineName 语义)。按行稳健解析:Name 列非纯数字则直接用,
// 否则取第一个非空、非布尔的无名列文本。
const isBooleanText = (value) => value === 'True' || value === 'False'
const stainName = (row) => {
  const named = String(row.Name ?? '').trim()
  if (named && !/^\d+$/.test(named)) return named
  // 上游 InlineName 落在无名列(csv.mjs 保留为 col{i});取首个非布尔文本列
  const unnamedKeys = Object.keys(row).filter((key) => /^col\d+$/.test(key)).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
  for (const key of unnamedKeys) {
    const text = String(row[key] ?? '').trim()
    if (text && !isBooleanText(text) && !/^\d+$/.test(text)) return text
  }
  return ''
}
const dyes = structuredClone(baseline.dyes)
const seen = new Set()
const missingCategories = []
for (const row of rows) {
  const id = Number(row['#'])
  const color = Number(row.Color)
  const shade = Number(row.Shade)
  const order = Number(row.SubOrder)
  if (![id, color, shade, order].every(Number.isInteger) || id < 0 || color < 0 || color > 0xffffffff || shade < 0 || order < 0 || seen.has(id)) throw new Error('Invalid or duplicate Stain row')
  seen.add(id)
  dyes[id] = { ...dyes[id], dyeId: id, name: stainName(row),
    color: `#${(color & 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`, shade, subOrder: order }
  if (id > 0 && dyes[id].name && !dyes[id].valueCategory) missingCategories.push(id)
}
const missing = Object.keys(baseline.dyes).map(Number).filter((id) => !seen.has(id)).sort((a, b) => a - b)
const result = { schemaVersion: baseline.schemaVersion, ...(batch.createdAt ? { generatedAt: batch.createdAt } : {}),
  source: { ...baseline.source, source_batch_id: batch.batchId, stain: publicSource(source),
    missing_stain_ids: missing, manual_category_missing: missingCategories }, dyes }
await mkdir(path.dirname(path.resolve(output)), { recursive: true })
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Shared dye catalog: ${seen.size} Stain rows; ${missingCategories.length} need manual value categories`)
