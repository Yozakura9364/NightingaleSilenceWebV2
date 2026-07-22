import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { readJsonFile } from './lib/shared.mjs'

const DEFAULT_ARMOIRE_CATALOG = 'public/data/armoire-catalog.json'
const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const DEFAULT_OUTPUT = 'public/data/armoire-store-item-display-index.json'
const SCHEMA_VERSION = 'nsarmoire.storeItemDisplayIndex.v1'

function parseArgs(argv) {
  const args = {
    armoireCatalog: DEFAULT_ARMOIRE_CATALOG,
    storeCatalog: DEFAULT_STORE_CATALOG,
    output: DEFAULT_OUTPUT
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--armoire-catalog') {
      args.armoireCatalog = argv[index + 1] ?? DEFAULT_ARMOIRE_CATALOG
      index += 1
      continue
    }

    if (arg === '--store-catalog') {
      args.storeCatalog = argv[index + 1] ?? DEFAULT_STORE_CATALOG
      index += 1
      continue
    }

    if (arg === '--output') {
      args.output = argv[index + 1] ?? DEFAULT_OUTPUT
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Build NSArmoire store item display index from existing catalogs.

Usage:
  node scripts/build-armoire-store-item-display-index.mjs

Options:
  --armoire-catalog <file>  Full Armoire item catalog. Default: ${DEFAULT_ARMOIRE_CATALOG}
  --store-catalog <file>    Store catalog. Default: ${DEFAULT_STORE_CATALOG}
  --output <file>           Output JSON path. Default: ${DEFAULT_OUTPUT}
`)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertCatalogs(armoireCatalog, storeCatalog) {
  if (!isRecord(armoireCatalog) || !isRecord(armoireCatalog.items)) {
    throw new Error('invalid armoire catalog')
  }

  if (!isRecord(storeCatalog) || !Array.isArray(storeCatalog.outfits)) {
    throw new Error('invalid armoire store catalog')
  }
}

function collectDisplayItemIds(storeCatalog) {
  const itemIds = new Set()

  for (const outfit of storeCatalog.outfits) {
    if (!isRecord(outfit)) {
      continue
    }

    if (Number.isInteger(outfit.coverItemId) && outfit.coverItemId > 0) {
      itemIds.add(outfit.coverItemId)
    }

    for (const itemId of Array.isArray(outfit.itemIds) ? outfit.itemIds : []) {
      if (Number.isInteger(itemId) && itemId > 0) {
        itemIds.add(itemId)
      }
    }
  }

  return itemIds
}

function buildDisplayItem(itemId, sourceItem) {
  const item = { itemId }

  if (typeof sourceItem.name === 'string' && sourceItem.name.trim()) {
    item.name = sourceItem.name
  }

  if (
    sourceItem.localizedNames &&
    typeof sourceItem.localizedNames === 'object' &&
    !Array.isArray(sourceItem.localizedNames) &&
    Object.keys(sourceItem.localizedNames).length > 0
  ) {
    item.localizedNames = sourceItem.localizedNames
  }

  if (Number.isInteger(sourceItem.iconId) && sourceItem.iconId > 0) {
    item.iconId = sourceItem.iconId
  }

  return item
}

function buildIndex(armoireCatalog, storeCatalog) {
  const itemIds = collectDisplayItemIds(storeCatalog)
  const missingItemIds = []
  const items = {}

  for (const itemId of Array.from(itemIds).sort((left, right) => left - right)) {
    const sourceItem = armoireCatalog.items[itemId]

    if (!sourceItem) {
      missingItemIds.push(itemId)
      continue
    }

    items[itemId] = buildDisplayItem(itemId, sourceItem)
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: armoireCatalog.generatedAt,
      storeCatalogGeneratedAt: storeCatalog.generatedAt
    },
    items,
    missingItemIds
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const armoireCatalog = await readJsonFile(args.armoireCatalog)
  const storeCatalog = await readJsonFile(args.storeCatalog)
  assertCatalogs(armoireCatalog, storeCatalog)

  const index = buildIndex(armoireCatalog, storeCatalog)
  const outputPath = resolve(args.output)

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(index), 'utf8')

  console.log(
    JSON.stringify(
      {
        output: outputPath,
        generatedAt: index.generatedAt,
        itemCount: Object.keys(index.items).length,
        missingItemCount: index.missingItemIds.length
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
