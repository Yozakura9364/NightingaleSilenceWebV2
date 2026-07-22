import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readSaintCoinachCsv } from './lib/csv.mjs'
import { loadNameTable } from './lib/source-normalizer.mjs'
import { buildTagDatabase } from './lib/tag-database.mjs'
import { readJson, writeJson } from './lib/validation.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const referenceRoot = path.resolve(
  projectRoot,
  process.env.FASHION_CHECK_REFERENCE_DIR ?? 'local-assets/fashion-check/references'
)
const generatedRoot = path.resolve(
  projectRoot,
  process.env.FASHION_CHECK_OUTPUT_DIR ?? 'local-assets/fashion-check/generated'
)
const outputPath = path.join(projectRoot, 'public/data/fashion-check/tag-database.json')
const localeDirectories = {
  'zh-CN': 'chs',
  en: 'en',
  ja: 'ja',
  ko: 'ko'
}

function collectReferencedItemIds(answers) {
  const result = new Set()
  for (const category of Object.values(answers.categories ?? {})) {
    for (const itemIds of Object.values(category.goldItemIdsBySlot ?? {})) {
      for (const itemId of itemIds) result.add(Number(itemId))
    }
  }
  return result
}

async function loadReferencedItems(filePath, itemIds) {
  const rows = await readSaintCoinachCsv(filePath)
  const result = new Map()
  for (const row of rows) {
    const itemId = Number(row['#'])
    if (!itemIds.has(itemId)) continue
    result.set(itemId, {
      itemId,
      name: String(row.Name ?? '').trim(),
      iconId: Number(row.Icon),
      rarity: Number(row.Rarity),
      equipSlotCategoryId: Number(row.EquipSlotCategory)
    })
  }
  return result
}

async function main() {
  const answers = await readJson(path.join(generatedRoot, 'answers.json'))
  const itemIds = collectReferencedItemIds(answers)
  const categoryNamesByLocale = new Map()
  const itemCatalogsByLocale = new Map()

  for (const [locale, directory] of Object.entries(localeDirectories)) {
    const localeRoot = path.join(referenceRoot, 'official', directory)
    const categoryNames = await loadNameTable(
      path.join(localeRoot, 'FashionCheckThemeCategory.csv')
    )
    categoryNamesByLocale.set(locale, categoryNames.byId)
    itemCatalogsByLocale.set(
      locale,
      await loadReferencedItems(path.join(localeRoot, 'Item.csv'), itemIds)
    )
  }

  const document = buildTagDatabase({
    answers,
    categoryNamesByLocale,
    itemCatalogsByLocale
  })
  await writeJson(outputPath, document)
  console.log(
    `Fashion Check tag database: ${document.summary.categories} categories, ${document.summary.categorySlotPairs} category-slot pairs, ${document.summary.items} items`
  )
}

await main()
