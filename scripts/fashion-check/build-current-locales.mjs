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
const armoireDyePath = path.join(projectRoot, 'public/data/armoire-dye-catalog.json')
const outputPath = path.join(projectRoot, 'public/data/fashion-check/current-locales.json')
const itemPaths = {
  'zh-CN': path.join(referenceRoot, 'official/chs/Item.csv'),
  en: path.join(referenceRoot, 'official/en/Item.csv'),
  ja: path.join(referenceRoot, 'official/ja/Item.csv'),
  ko: path.join(referenceRoot, 'official/ko/Item.csv')
}
const categoryPaths = {
  'zh-CN': path.join(referenceRoot, 'official/chs/FashionCheckThemeCategory.csv'),
  en: path.join(referenceRoot, 'official/en/FashionCheckThemeCategory.csv'),
  ja: path.join(referenceRoot, 'official/ja/FashionCheckThemeCategory.csv'),
  ko: path.join(referenceRoot, 'official/ko/FashionCheckThemeCategory.csv')
}
const mergedDyeItemIds = {
  general: 52254,
  extra1: 52255,
  extra2: 52256
}

function collectIds(value, key, result) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectIds(entry, key, result))
    return
  }
  if (!value || typeof value !== 'object') return

  const record = value
  if (Number.isInteger(record[key])) result.add(record[key])
  Object.entries(record).forEach(([childKey, child]) => collectIds(child, key, result))
}

function loadNames(rows, ids) {
  const names = new Map()
  for (const row of rows) {
    const itemId = Number(row['#'])
    if (!ids.has(itemId)) continue
    const name = String(row.Name ?? '').trim()
    if (name) names.set(itemId, name)
  }
  return names
}

function buildLocalizedNames(ids, rowsByLocale, label) {
  const namesByLocale = new Map(
    Object.entries(rowsByLocale).map(([locale, rows]) => [locale, loadNames(rows, ids)])
  )
  const result = new Map()

  for (const id of ids) {
    const names = Object.fromEntries(
      [...namesByLocale.entries()].map(([locale, values]) => [locale, values.get(id) ?? ''])
    )
    if (Object.values(names).some((name) => !name)) {
      throw new Error(`Missing localized ${label} name for ID ${id}`)
    }
    result.set(String(id), names)
  }

  return { namesByLocale, result }
}

function findStoreDyeItemId(dyeId, dyeDocument, rows) {
  const dyeName = dyeDocument.dyes?.[String(dyeId)]?.['zh-CN']
  const expectedItemName = dyeName ? `${dyeName}染剂` : ''
  const row = rows.find(
    (candidate) =>
      Number(candidate.AdditionalData) === dyeId &&
      String(candidate.Name ?? '').trim() === expectedItemName
  )
  const itemId = Number(row?.['#'])

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error(`Missing store dye item for dye ID ${dyeId}`)
  }
  return itemId
}

function getDyeItemIds(dyeIds, dyeDocument, armoireDyeCatalog, chsRows) {
  const result = new Map()
  for (const dyeId of dyeIds) {
    const category = armoireDyeCatalog.dyes?.[String(dyeId)]?.valueCategory
    const mergedItemId = mergedDyeItemIds[category]
    const itemId =
      mergedItemId ??
      (category === 'storeSpecial' ? findStoreDyeItemId(dyeId, dyeDocument, chsRows) : undefined)

    if (!itemId) throw new Error(`Missing dye item category for dye ID ${dyeId}`)
    result.set(dyeId, itemId)
  }
  return result
}

function sortedRecord(values) {
  return Object.fromEntries(
    [...values.entries()].sort(([left], [right]) => Number(left) - Number(right))
  )
}

async function main() {
  const [current, dyeDocument, armoireDyeCatalog, localeRowsEntries, categoryRowsEntries] =
    await Promise.all([
      readFile(currentPath, 'utf8').then(JSON.parse),
      readFile(dyePath, 'utf8').then(JSON.parse),
      readFile(armoireDyePath, 'utf8').then(JSON.parse),
      Promise.all(
        Object.entries(itemPaths).map(async ([locale, filePath]) => [
          locale,
          await readSaintCoinachCsv(filePath)
        ])
      ),
      Promise.all(
        Object.entries(categoryPaths).map(async ([locale, filePath]) => [
          locale,
          await readSaintCoinachCsv(filePath)
        ])
      )
    ])
  const itemIds = new Set()
  const dyeIds = new Set()
  const categoryIds = new Set()
  collectIds(current, 'itemId', itemIds)
  collectIds(current, 'dyeId', dyeIds)
  collectIds(current, 'categoryId', categoryIds)
  const localeRows = new Map(localeRowsEntries)
  const dyeItemIds = getDyeItemIds(
    dyeIds,
    dyeDocument,
    armoireDyeCatalog,
    localeRows.get('zh-CN') ?? []
  )
  const allItemIds = new Set([...itemIds, ...dyeItemIds.values()])

  const { namesByLocale: itemNamesByLocale, result: allItems } = buildLocalizedNames(
    allItemIds,
    Object.fromEntries(
      Object.entries(itemPaths).map(([locale]) => [locale, localeRows.get(locale) ?? []])
    ),
    'item'
  )
  const items = new Map([...allItems].filter(([itemId]) => itemIds.has(Number(itemId))))
  const { result: tags } = buildLocalizedNames(
    categoryIds,
    Object.fromEntries(categoryRowsEntries),
    'tag'
  )

  const dyes = new Map()
  for (const dyeId of dyeIds) {
    const names = dyeDocument.dyes?.[String(dyeId)]
    if (!names || ['zh-CN', 'en', 'ja', 'ko'].some((locale) => !names[locale])) {
      throw new Error(`Missing localized dye name for dye ID ${dyeId}`)
    }
    dyes.set(String(dyeId), names)
  }

  const chsItemsById = new Map(
    (localeRows.get('zh-CN') ?? []).map((row) => [Number(row['#']), row])
  )
  const dyeItems = new Map()
  for (const [dyeId, itemId] of dyeItemIds) {
    const row = chsItemsById.get(itemId)
    const iconId = Number(row?.Icon)
    const names = Object.fromEntries(
      [...itemNamesByLocale.entries()].map(([locale, values]) => [locale, values.get(itemId) ?? ''])
    )
    if (!Number.isInteger(iconId) || iconId <= 0) {
      throw new Error(`Missing dye item icon for Item ID ${itemId}`)
    }
    if (Object.values(names).some((name) => !name)) {
      throw new Error(`Missing localized dye item name for Item ID ${itemId}`)
    }
    dyeItems.set(String(dyeId), { itemId, iconId, names })
  }

  const output = {
    schemaVersion: 'fashion-check.current-locales.v3',
    items: sortedRecord(items),
    dyes: sortedRecord(dyes),
    dyeItems: sortedRecord(dyeItems),
    tags: sortedRecord(tags)
  }
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(
    `Fashion Check current locales: ${items.size} items, ${dyes.size} dyes, ${dyeItems.size} dye items, ${tags.size} tags`
  )
}

await main()
