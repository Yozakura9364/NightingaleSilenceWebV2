import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readSaintCoinachCsv } from './lib/csv.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const referenceRoot = path.resolve(
  projectRoot,
  process.env.FASHION_CHECK_REFERENCE_DIR ?? 'local-assets/fashion-check/references'
)
const currentPath = path.join(projectRoot, 'public/data/fashion-check/current.json')
const dyePath = path.join(projectRoot, 'data/fashion-check/current-dye-locales.json')
const outputPath = path.join(projectRoot, 'public/data/fashion-check/current-locales.json')
const itemPaths = {
  'zh-CN': path.join(referenceRoot, 'official/chs/Item.csv'),
  en: path.join(referenceRoot, 'official/en/Item.csv'),
  ja: path.join(referenceRoot, 'official/ja/Item.csv'),
  ko: path.join(referenceRoot, 'official/ko/Item.csv')
}

function collectIds(value, key, result) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectIds(entry, key, result))
    return
  }
  if (!value || typeof value !== 'object') return

  const record = value
  if (key === 'itemId' && Number.isInteger(record.itemId)) result.add(record.itemId)
  if (key === 'dyeId' && Number.isInteger(record.dyeId)) result.add(record.dyeId)
  Object.entries(record).forEach(([childKey, child]) => collectIds(child, key, result))
}

async function loadNames(filePath, ids) {
  const rows = await readSaintCoinachCsv(filePath)
  const names = new Map()
  for (const row of rows) {
    const itemId = Number(row['#'])
    if (!ids.has(itemId)) continue
    const name = String(row.Name ?? '').trim()
    if (name) names.set(itemId, name)
  }
  return names
}

function sortedRecord(values) {
  return Object.fromEntries([...values.entries()].sort(([left], [right]) => Number(left) - Number(right)))
}

async function main() {
  const [current, dyeDocument] = await Promise.all([
    readFile(currentPath, 'utf8').then(JSON.parse),
    readFile(dyePath, 'utf8').then(JSON.parse)
  ])
  const itemIds = new Set()
  const dyeIds = new Set()
  collectIds(current, 'itemId', itemIds)
  collectIds(current, 'dyeId', dyeIds)

  const entries = await Promise.all(
    Object.entries(itemPaths).map(async ([locale, filePath]) => [locale, await loadNames(filePath, itemIds)])
  )
  const itemNamesByLocale = new Map(entries)
  const items = new Map()

  for (const itemId of itemIds) {
    const names = Object.fromEntries(
      [...itemNamesByLocale.entries()].map(([locale, values]) => [locale, values.get(itemId) ?? ''])
    )
    if (Object.values(names).some((name) => !name)) {
      throw new Error(`Missing localized item name for Item ID ${itemId}`)
    }
    items.set(String(itemId), names)
  }

  const dyes = new Map()
  for (const dyeId of dyeIds) {
    const names = dyeDocument.dyes?.[String(dyeId)]
    if (!names || ['zh-CN', 'en', 'ja', 'ko'].some((locale) => !names[locale])) {
      throw new Error(`Missing localized dye name for dye ID ${dyeId}`)
    }
    dyes.set(String(dyeId), names)
  }

  const output = {
    schemaVersion: 'fashion-check.current-locales.v1',
    items: sortedRecord(items),
    dyes: sortedRecord(dyes)
  }
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(`Fashion Check current locales: ${items.size} items, ${dyes.size} dyes`)
}

await main()
