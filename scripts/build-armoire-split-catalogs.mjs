import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { readJsonFile } from './lib/shared.mjs'

const DEFAULT_ARMOIRE_CATALOG = 'public/data/armoire-catalog.json'
const DEFAULT_DISPLAY_OUTPUT = 'public/data/armoire-catalog-display-index.json'
const DEFAULT_ITEM_DISPLAY_CHUNK_DIR = 'public/data/armoire-item-display-chunks'
const DEFAULT_CABINET_ITEM_CHUNK_DIR = 'public/data/armoire-cabinet-item-chunks'
const DEFAULT_GLAMOUR_SET_OUTPUT = 'public/data/armoire-glamour-set-catalog.json'
const DEFAULT_GLAMOUR_SET_CHUNK_DIR = 'public/data/armoire-glamour-set-chunks'
const DEFAULT_IDENTICAL_MODEL_OUTPUT = 'public/data/armoire-identical-model-catalog.json'
const DEFAULT_DYE_OUTPUT = 'public/data/armoire-dye-catalog.json'
const CATALOG_DISPLAY_SCHEMA_VERSION = 'nsarmoire.catalogDisplayIndex.v1'
const ITEM_DISPLAY_CHUNK_SCHEMA_VERSION = 'nsarmoire.itemDisplayChunk.v1'
const CABINET_ITEM_CHUNK_SCHEMA_VERSION = 'nsarmoire.cabinetItemChunk.v1'
const GLAMOUR_SET_SCHEMA_VERSION = 'nsarmoire.glamourSetCatalog.v1'
const GLAMOUR_SET_CHUNK_SCHEMA_VERSION = 'nsarmoire.glamourSetChunk.v1'
const IDENTICAL_MODEL_SCHEMA_VERSION = 'nsarmoire.identicalModelCatalog.v1'
const DYE_SCHEMA_VERSION = 'nsarmoire.dyeCatalog.v1'
const ITEM_DISPLAY_CHUNK_SIZE = 2000

function parseArgs(argv) {
  const args = {
    armoireCatalog: DEFAULT_ARMOIRE_CATALOG,
    displayOutput: DEFAULT_DISPLAY_OUTPUT,
    itemDisplayChunkDir: DEFAULT_ITEM_DISPLAY_CHUNK_DIR,
    cabinetItemChunkDir: DEFAULT_CABINET_ITEM_CHUNK_DIR,
    glamourSetOutput: DEFAULT_GLAMOUR_SET_OUTPUT,
    glamourSetChunkDir: DEFAULT_GLAMOUR_SET_CHUNK_DIR,
    identicalModelOutput: DEFAULT_IDENTICAL_MODEL_OUTPUT,
    dyeOutput: DEFAULT_DYE_OUTPUT
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

    if (arg === '--display-output') {
      args.displayOutput = argv[index + 1] ?? DEFAULT_DISPLAY_OUTPUT
      index += 1
      continue
    }

    if (arg === '--item-display-chunk-dir') {
      args.itemDisplayChunkDir = argv[index + 1] ?? DEFAULT_ITEM_DISPLAY_CHUNK_DIR
      index += 1
      continue
    }

    if (arg === '--cabinet-item-chunk-dir') {
      args.cabinetItemChunkDir = argv[index + 1] ?? DEFAULT_CABINET_ITEM_CHUNK_DIR
      index += 1
      continue
    }

    if (arg === '--glamour-set-output') {
      args.glamourSetOutput = argv[index + 1] ?? DEFAULT_GLAMOUR_SET_OUTPUT
      index += 1
      continue
    }

    if (arg === '--glamour-set-chunk-dir') {
      args.glamourSetChunkDir = argv[index + 1] ?? DEFAULT_GLAMOUR_SET_CHUNK_DIR
      index += 1
      continue
    }

    if (arg === '--identical-model-output') {
      args.identicalModelOutput = argv[index + 1] ?? DEFAULT_IDENTICAL_MODEL_OUTPUT
      index += 1
      continue
    }

    if (arg === '--dye-output') {
      args.dyeOutput = argv[index + 1] ?? DEFAULT_DYE_OUTPUT
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Build split NSArmoire catalogs from existing full catalog.

Usage:
  node scripts/build-armoire-split-catalogs.mjs

Options:
  --armoire-catalog <file>       Full Armoire item catalog. Default: ${DEFAULT_ARMOIRE_CATALOG}
  --display-output <file>        Output display index path. Default: ${DEFAULT_DISPLAY_OUTPUT}
  --item-display-chunk-dir <dir> Output item display chunk directory. Default: ${DEFAULT_ITEM_DISPLAY_CHUNK_DIR}
  --cabinet-item-chunk-dir <dir> Output cabinet item chunk directory. Default: ${DEFAULT_CABINET_ITEM_CHUNK_DIR}
  --glamour-set-output <file>    Output glamour set catalog path. Default: ${DEFAULT_GLAMOUR_SET_OUTPUT}
  --glamour-set-chunk-dir <dir>  Output glamour set chunk directory. Default: ${DEFAULT_GLAMOUR_SET_CHUNK_DIR}
  --identical-model-output <file>
                                 Output identical model catalog path. Default: ${DEFAULT_IDENTICAL_MODEL_OUTPUT}
  --dye-output <file>            Output dye catalog path. Default: ${DEFAULT_DYE_OUTPUT}
`)
}

async function writeJsonFile(path, payload) {
  const outputPath = resolve(path)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(payload), 'utf8')
  return outputPath
}

async function writeJsonDir(dir, payloads) {
  const outputDir = resolve(dir)
  await mkdir(outputDir, { recursive: true })

  await Promise.all(
    payloads.map((payload) =>
      writeFile(resolve(outputDir, `${payload.chunkKey}.json`), JSON.stringify(payload), 'utf8')
    )
  )

  return outputDir
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertArmoireCatalog(catalog) {
  if (
    !isRecord(catalog) ||
    !isRecord(catalog.items) ||
    !Array.isArray(catalog.cabinetItemIds) ||
    !Array.isArray(catalog.glamourSetItems) ||
    !Array.isArray(catalog.identicalGroups) ||
    !isRecord(catalog.dyes)
  ) {
    throw new Error('invalid armoire catalog')
  }
}

function toDisplayTuple(itemId, sourceItem) {
  const tuple = [itemId]
  const hasIcon = Number.isInteger(sourceItem?.iconId) && sourceItem.iconId > 0
  const hasDyeSlotCount =
    Number.isInteger(sourceItem?.dyeSlotCount) && sourceItem.dyeSlotCount > 0
  const isTradable = sourceItem?.isTradable === true

  if (typeof sourceItem?.name === 'string' && sourceItem.name.trim()) {
    tuple[1] = sourceItem.name
  }

  if (hasIcon) {
    if (tuple.length === 1) {
      tuple[1] = ''
    }

    tuple[2] = sourceItem.iconId
  }

  if (hasDyeSlotCount) {
    if (tuple.length === 1) {
      tuple[1] = ''
    }

    if (!hasIcon) {
      tuple[2] = 0
    }

    tuple[3] = sourceItem.dyeSlotCount
  }

  if (isTradable) {
    if (tuple.length === 1) {
      tuple[1] = ''
    }

    if (!hasIcon) {
      tuple[2] = 0
    }

    if (!hasDyeSlotCount) {
      tuple[3] = 0
    }

    tuple[4] = 1
  }

  return tuple
}

function collectDisplayTuples(catalog, itemIds) {
  const items = []
  const missingItemIds = []

  for (const itemId of Array.from(itemIds).sort((left, right) => left - right)) {
    const sourceItem = catalog.items[itemId]

    if (!sourceItem) {
      missingItemIds.push(itemId)
      continue
    }

    items.push(toDisplayTuple(itemId, sourceItem))
  }

  return { items, missingItemIds }
}

function buildCatalogDisplayIndex(catalog) {
  const { items, missingItemIds } = collectDisplayTuples(
    catalog,
    new Set(Object.values(catalog.items).map((item) => item.itemId))
  )

  return {
    schemaVersion: CATALOG_DISPLAY_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    items,
    missingItemIds
  }
}

function getItemDisplayChunkKey(itemId) {
  return String(Math.floor(itemId / ITEM_DISPLAY_CHUNK_SIZE) * ITEM_DISPLAY_CHUNK_SIZE).padStart(
    6,
    '0'
  )
}

function buildItemDisplayChunks(catalog) {
  const groupedItems = new Map()

  for (const item of Object.values(catalog.items)) {
    const chunkKey = getItemDisplayChunkKey(item.itemId)
    const items = groupedItems.get(chunkKey) ?? []
    items.push(toDisplayTuple(item.itemId, item))
    groupedItems.set(chunkKey, items)
  }

  return Array.from(groupedItems.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([chunkKey, items]) => ({
      schemaVersion: ITEM_DISPLAY_CHUNK_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      source: {
        catalogGeneratedAt: catalog.generatedAt
      },
      chunkKey,
      chunkSize: ITEM_DISPLAY_CHUNK_SIZE,
      items: items.sort((left, right) => left[0] - right[0])
    }))
}

function getCatalogItemChunkKeys(catalog) {
  return Array.from(
    new Set(Object.values(catalog.items).map((item) => getItemDisplayChunkKey(item.itemId)))
  ).sort()
}

function uniqueSortedNumbers(values) {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function buildCabinetItemChunks(catalog) {
  const cabinetItemIds = uniqueSortedNumbers(catalog.cabinetItemIds)
  const cabinetEntriesByItemId = new Map()
  const groupedItemIds = new Map()

  for (const entry of catalog.cabinetEntries ?? []) {
    const entries = cabinetEntriesByItemId.get(entry.itemId) ?? []
    entries.push(entry)
    cabinetEntriesByItemId.set(entry.itemId, entries)
  }

  for (const itemId of cabinetItemIds) {
    const chunkKey = getItemDisplayChunkKey(itemId)
    const itemIds = groupedItemIds.get(chunkKey) ?? []
    itemIds.push(itemId)
    groupedItemIds.set(chunkKey, itemIds)
  }

  return getCatalogItemChunkKeys(catalog)
    .map((chunkKey) => [chunkKey, groupedItemIds.get(chunkKey) ?? []])
    .map(([chunkKey, itemIds]) => {
      const { items, missingItemIds } = collectDisplayTuples(catalog, new Set(itemIds))

      return {
        schemaVersion: CABINET_ITEM_CHUNK_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        source: {
          catalogGeneratedAt: catalog.generatedAt
        },
        chunkKey,
        chunkSize: ITEM_DISPLAY_CHUNK_SIZE,
        items,
        cabinetItemIds: uniqueSortedNumbers(itemIds),
        cabinetEntries: itemIds.flatMap((itemId) => cabinetEntriesByItemId.get(itemId) ?? []),
        missingItemIds
      }
    })
}

function buildGlamourSetCatalog(catalog) {
  const displayItemIds = new Set()

  for (const set of catalog.glamourSetItems) {
    displayItemIds.add(set.setItemId)

    for (const itemId of set.pieceItemIds) {
      displayItemIds.add(itemId)
    }
  }

  const { items, missingItemIds } = collectDisplayTuples(catalog, displayItemIds)

  return {
    schemaVersion: GLAMOUR_SET_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    items,
    cabinetItemIds: catalog.cabinetItemIds,
    glamourSetItems: catalog.glamourSetItems,
    missingItemIds
  }
}

function getGlamourSetItemIds(set) {
  return uniqueSortedNumbers([set.setItemId, ...set.pieceItemIds])
}

function buildGlamourSetChunks(catalog) {
  const cabinetItemIds = new Set(catalog.cabinetItemIds)
  const groupedSets = new Map()

  for (const set of catalog.glamourSetItems) {
    const chunkKeys = new Set(getGlamourSetItemIds(set).map(getItemDisplayChunkKey))

    for (const chunkKey of chunkKeys) {
      const sets = groupedSets.get(chunkKey) ?? []
      sets.push(set)
      groupedSets.set(chunkKey, sets)
    }
  }

  return getCatalogItemChunkKeys(catalog)
    .map((chunkKey) => [chunkKey, groupedSets.get(chunkKey) ?? []])
    .map(([chunkKey, sets]) => {
      const itemIds = new Set(sets.flatMap(getGlamourSetItemIds))
      const { items, missingItemIds } = collectDisplayTuples(catalog, itemIds)

      return {
        schemaVersion: GLAMOUR_SET_CHUNK_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        source: {
          catalogGeneratedAt: catalog.generatedAt
        },
        chunkKey,
        chunkSize: ITEM_DISPLAY_CHUNK_SIZE,
        items,
        cabinetItemIds: uniqueSortedNumbers(
          Array.from(itemIds).filter((itemId) => cabinetItemIds.has(itemId))
        ),
        glamourSetItems: sets.sort((left, right) => left.setItemId - right.setItemId),
        missingItemIds
      }
    })
}

function buildIdenticalModelCatalog(catalog) {
  const displayItemIds = new Set(catalog.identicalGroups.flatMap((group) => group.itemIds))
  const { items, missingItemIds } = collectDisplayTuples(catalog, displayItemIds)

  return {
    schemaVersion: IDENTICAL_MODEL_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    items,
    identicalGroups: catalog.identicalGroups,
    missingItemIds
  }
}

function buildDyeCatalog(catalog) {
  return {
    schemaVersion: DYE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    dyes: catalog.dyes
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const armoireCatalog = await readJsonFile(args.armoireCatalog)
  assertArmoireCatalog(armoireCatalog)

  const displayIndex = buildCatalogDisplayIndex(armoireCatalog)
  const itemDisplayChunks = buildItemDisplayChunks(armoireCatalog)
  const cabinetItemChunks = buildCabinetItemChunks(armoireCatalog)
  const glamourSetCatalog = buildGlamourSetCatalog(armoireCatalog)
  const glamourSetChunks = buildGlamourSetChunks(armoireCatalog)
  const identicalModelCatalog = buildIdenticalModelCatalog(armoireCatalog)
  const dyeCatalog = buildDyeCatalog(armoireCatalog)

  const outputs = {
    catalogDisplayIndex: await writeJsonFile(args.displayOutput, displayIndex),
    itemDisplayChunkDir: await writeJsonDir(args.itemDisplayChunkDir, itemDisplayChunks),
    cabinetItemChunkDir: await writeJsonDir(args.cabinetItemChunkDir, cabinetItemChunks),
    glamourSetCatalog: await writeJsonFile(args.glamourSetOutput, glamourSetCatalog),
    glamourSetChunkDir: await writeJsonDir(args.glamourSetChunkDir, glamourSetChunks),
    identicalModelCatalog: await writeJsonFile(args.identicalModelOutput, identicalModelCatalog),
    dyeCatalog: await writeJsonFile(args.dyeOutput, dyeCatalog)
  }

  console.log(
    JSON.stringify(
      {
        outputs,
        generatedAt: {
          catalogDisplayIndex: displayIndex.generatedAt,
          itemDisplayChunks: itemDisplayChunks[0]?.generatedAt ?? '',
          cabinetItemChunks: cabinetItemChunks[0]?.generatedAt ?? '',
          glamourSetCatalog: glamourSetCatalog.generatedAt,
          glamourSetChunks: glamourSetChunks[0]?.generatedAt ?? '',
          identicalModelCatalog: identicalModelCatalog.generatedAt,
          dyeCatalog: dyeCatalog.generatedAt
        },
        counts: {
          catalogDisplayItems: displayIndex.items.length,
          itemDisplayChunks: itemDisplayChunks.length,
          itemDisplayChunkItems: itemDisplayChunks.reduce(
            (count, chunk) => count + chunk.items.length,
            0
          ),
          cabinetItemChunks: cabinetItemChunks.length,
          cabinetItemChunkItems: cabinetItemChunks.reduce(
            (count, chunk) => count + chunk.items.length,
            0
          ),
          glamourSetItems: glamourSetCatalog.items.length,
          glamourSets: glamourSetCatalog.glamourSetItems.length,
          glamourSetChunks: glamourSetChunks.length,
          glamourSetChunkItems: glamourSetChunks.reduce(
            (count, chunk) => count + chunk.items.length,
            0
          ),
          glamourSetChunkSets: glamourSetChunks.reduce(
            (count, chunk) => count + chunk.glamourSetItems.length,
            0
          ),
          identicalModelItems: identicalModelCatalog.items.length,
          identicalModelGroups: identicalModelCatalog.identicalGroups.length,
          dyes: Object.keys(dyeCatalog.dyes).length
        },
        missing: {
          catalogDisplayItems: displayIndex.missingItemIds.length,
          cabinetItemChunkItems: cabinetItemChunks.reduce(
            (count, chunk) => count + chunk.missingItemIds.length,
            0
          ),
          glamourSetItems: glamourSetCatalog.missingItemIds.length,
          glamourSetChunkItems: glamourSetChunks.reduce(
            (count, chunk) => count + chunk.missingItemIds.length,
            0
          ),
          identicalModelItems: identicalModelCatalog.missingItemIds.length
        }
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
