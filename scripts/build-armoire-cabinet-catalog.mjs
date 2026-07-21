import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { readJsonFile } from './lib/shared.mjs'

const DEFAULT_ARMOIRE_CATALOG = 'public/data/armoire-catalog.json'
const DEFAULT_OUTPUT = 'public/data/armoire-cabinet-catalog.json'
const SCHEMA_VERSION = 'nsarmoire.cabinetCatalog.v1'

function parseArgs(argv) {
  const args = {
    armoireCatalog: DEFAULT_ARMOIRE_CATALOG,
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
  console.log(`Build NSArmoire cabinet catalog from existing full catalog.

Usage:
  node scripts/build-armoire-cabinet-catalog.mjs

Options:
  --armoire-catalog <file>  Full Armoire item catalog. Default: ${DEFAULT_ARMOIRE_CATALOG}
  --output <file>           Output JSON path. Default: ${DEFAULT_OUTPUT}
`)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertArmoireCatalog(catalog) {
  if (!isRecord(catalog) || !isRecord(catalog.items) || !Array.isArray(catalog.cabinetItemIds)) {
    throw new Error('invalid armoire catalog')
  }
}

function buildCabinetDisplayItem(itemId, sourceItem) {
  const item = { itemId }

  if (typeof sourceItem.name === 'string' && sourceItem.name.trim()) {
    item.name = sourceItem.name
  }

  if (Number.isInteger(sourceItem.iconId) && sourceItem.iconId > 0) {
    item.iconId = sourceItem.iconId
  }

  return item
}

function buildCabinetCatalog(catalog) {
  const cabinetItemIds = Array.from(
    new Set(catalog.cabinetItemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0))
  ).sort((left, right) => left - right)
  const items = {}
  const missingItemIds = []

  for (const itemId of cabinetItemIds) {
    const sourceItem = catalog.items[itemId]

    if (!sourceItem) {
      missingItemIds.push(itemId)
      continue
    }

    items[itemId] = buildCabinetDisplayItem(itemId, sourceItem)
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    items,
    cabinetItemIds,
    cabinetEntries: Array.isArray(catalog.cabinetEntries) ? catalog.cabinetEntries : [],
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
  assertArmoireCatalog(armoireCatalog)

  const cabinetCatalog = buildCabinetCatalog(armoireCatalog)
  const outputPath = resolve(args.output)

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(cabinetCatalog), 'utf8')

  console.log(
    JSON.stringify(
      {
        output: outputPath,
        generatedAt: cabinetCatalog.generatedAt,
        itemCount: Object.keys(cabinetCatalog.items).length,
        cabinetItemCount: cabinetCatalog.cabinetItemIds.length,
        cabinetEntryCount: cabinetCatalog.cabinetEntries.length,
        missingItemCount: cabinetCatalog.missingItemIds.length
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
