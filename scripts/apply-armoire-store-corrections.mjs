import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readJson } from './lib/shared.mjs'

const STORE_SCHEMA_VERSION = 'nsarmoire.storeCatalog.v1'
const CORRECTION_SCHEMA_VERSION = 'nsarmoire.storeCatalogCorrections.v1'
const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const STORE_TAGS = [
  'npcCostume',
  'bonusCostume',
  'collectorEditionBonus',
  'replicaCostume',
  'fanFestivalCostume',
  'crossoverCostume',
  'moonfireFaire',
  'hatchingTide',
  'theRising',
  'starlightCelebration',
  'valentioneDay',
  'littleLadiesDay',
  'allSaintsWake',
  'heavensturn',
  'goldSaucerFestival'
]
const STORE_DETAIL_TAGS = ['maleOnly', 'femaleOnly']
const STORE_TAG_SET = new Set(STORE_TAGS)
const STORE_DETAIL_TAG_SET = new Set(STORE_DETAIL_TAGS)

function parseArgs(argv) {
  const args = {
    correctionFile: '',
    storeCatalog: DEFAULT_STORE_CATALOG,
    out: '',
    dryRun: false,
    help: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--store-catalog') {
      args.storeCatalog = argv[index + 1] ?? DEFAULT_STORE_CATALOG
      index += 1
      continue
    }

    if (arg === '--out') {
      args.out = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }

    if (!args.correctionFile) {
      args.correctionFile = arg
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Apply NSArmoire store-review correction JSON into the store catalog.

Usage:
  node scripts/apply-armoire-store-corrections.mjs <corrections.json>

Options:
  --store-catalog <file>  Store catalog to update. Default: ${DEFAULT_STORE_CATALOG}
  --out <file>            Write to another file instead of updating the store catalog in place.
  --dry-run               Validate and print summary without writing.
`)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function getUniqueItemIds(itemIds) {
  return Array.from(new Set(itemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0)))
}

function normalizeTagArray(value, fieldName, id, allowedTags) {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string')) {
    throw new Error(`${id}.${fieldName} must be a string array when present`)
  }

  const unknownTags = value.filter((tag) => !allowedTags.has(tag))

  if (unknownTags.length > 0) {
    throw new Error(`${id}.${fieldName} contains unknown tags: ${unknownTags.join(', ')}`)
  }

  return Array.from(new Set(value))
}

function normalizeRegionalStoreUrls(value) {
  if (!isRecord(value)) {
    return undefined
  }

  const urls = {}

  for (const region of ['cn', 'global', 'tw', 'kr']) {
    const url = normalizeRegionalStoreUrl(region, value[region])

    if (url) {
      urls[region] = url
    }
  }

  return Object.keys(urls).length > 0 ? urls : undefined
}

function normalizeRegionalPriceLabels(value) {
  if (!isRecord(value)) {
    return undefined
  }

  const priceLabels = {}

  for (const region of ['cn', 'global', 'tw', 'kr']) {
    const priceLabel = typeof value[region] === 'string' ? value[region].trim() : ''

    if (priceLabel) {
      priceLabels[region] = priceLabel
    }
  }

  return Object.keys(priceLabels).length > 0 ? priceLabels : undefined
}

function normalizeRegionalStoreUrl(region, value) {
  const url = typeof value === 'string' ? value.trim() : ''

  if (!url) {
    return ''
  }

  if (region === 'cn') {
    const productKey = url.match(/\/product-detail\/([A-Za-z0-9]+)(?:$|[/?#])/)?.[1]
    return productKey ? `https://qu.sdo.com/product-detail/${productKey}` : url
  }

  if (region === 'global') {
    const productId = url.match(/\/product\/(\d+)(?:$|[/?#])/)?.[1]
    return productId
      ? `https://store.finalfantasyxiv.com/ffxivstore/ja-jp/product/${productId}`
      : url
  }

  if (region === 'tw') {
    const productId = url.match(/[?&]id=([A-Za-z0-9_]+)/)?.[1]
    return productId
      ? `https://www.ffxiv.com.tw/web/store/product_detail.aspx?id=${productId}`
      : url
  }

  if (region === 'kr') {
    const productId = url.match(/\/shop\/home\/detail\/(\d+)(?:$|[/?#])/i)?.[1]
    return productId ? `https://www.ff14.co.kr/shop/home/detail/${productId}` : url
  }

  return url
}

function validateStoreCatalog(value) {
  if (
    !isRecord(value) ||
    value.schemaVersion !== STORE_SCHEMA_VERSION ||
    !Array.isArray(value.outfits)
  ) {
    throw new Error(`Store catalog must use schemaVersion ${STORE_SCHEMA_VERSION}`)
  }
}

function validateCorrections(value) {
  if (
    !isRecord(value) ||
    value.schemaVersion !== CORRECTION_SCHEMA_VERSION ||
    !Array.isArray(value.outfits)
  ) {
    throw new Error(`Corrections must use schemaVersion ${CORRECTION_SCHEMA_VERSION}`)
  }
}

function normalizeCorrection(rawCorrection, index) {
  if (!isRecord(rawCorrection)) {
    throw new Error(`corrections.outfits[${index}] must be an object`)
  }

  const id = typeof rawCorrection.id === 'string' ? rawCorrection.id.trim() : ''

  if (!id) {
    throw new Error(`corrections.outfits[${index}].id is required`)
  }

  if (rawCorrection.itemIds !== undefined && !Array.isArray(rawCorrection.itemIds)) {
    throw new Error(`${id}.itemIds must be an array when present`)
  }

  if (
    rawCorrection.itemIds !== undefined &&
    rawCorrection.itemIds.some((itemId) => !Number.isInteger(itemId) || itemId <= 0)
  ) {
    throw new Error(`${id}.itemIds must contain positive integers`)
  }

  const itemIds =
    rawCorrection.itemIds === undefined ? undefined : getUniqueItemIds(rawCorrection.itemIds)

  if (rawCorrection.itemNames !== undefined && !isStringArray(rawCorrection.itemNames)) {
    throw new Error(`${id}.itemNames must be a string array when present`)
  }

  if (
    itemIds !== undefined &&
    (!rawCorrection.itemNames || rawCorrection.itemNames.length !== itemIds.length)
  ) {
    throw new Error(`${id}.itemNames must be present and match itemIds length`)
  }

  if (rawCorrection.corrected !== undefined && typeof rawCorrection.corrected !== 'boolean') {
    throw new Error(`${id}.corrected must be boolean when present`)
  }

  if (rawCorrection.excluded !== undefined && typeof rawCorrection.excluded !== 'boolean') {
    throw new Error(`${id}.excluded must be boolean when present`)
  }

  if (rawCorrection.needsMapping !== undefined && typeof rawCorrection.needsMapping !== 'boolean') {
    throw new Error(`${id}.needsMapping must be boolean when present`)
  }

  return {
    id,
    regionalStoreUrls: normalizeRegionalStoreUrls(rawCorrection.regionalStoreUrls),
    regionalPriceLabels: normalizeRegionalPriceLabels(rawCorrection.regionalPriceLabels),
    itemIds,
    itemNames: rawCorrection.itemNames,
    tags: normalizeTagArray(rawCorrection.tags, 'tags', id, STORE_TAG_SET),
    detailTags: normalizeTagArray(rawCorrection.detailTags, 'detailTags', id, STORE_DETAIL_TAG_SET),
    corrected: rawCorrection.corrected,
    needsMapping: rawCorrection.needsMapping,
    excluded: rawCorrection.excluded
  }
}

function applyCorrection(outfit, correction) {
  const nextOutfit = {
    ...outfit,
    ...(correction.regionalStoreUrls
      ? {
          regionalStoreUrls: {
            ...outfit.regionalStoreUrls,
            ...correction.regionalStoreUrls
          }
        }
      : {}),
    ...(correction.regionalPriceLabels
      ? {
          regionalPriceLabels: {
            ...outfit.regionalPriceLabels,
            ...correction.regionalPriceLabels
          }
        }
      : {})
  }

  if (correction.itemIds !== undefined) {
    nextOutfit.itemIds = correction.itemIds
    nextOutfit.itemNames = correction.itemNames
    nextOutfit.mappingSource = 'manual'
  }

  if (correction.corrected !== undefined) {
    nextOutfit.corrected = correction.corrected
  }

  if (correction.tags !== undefined) {
    if (correction.tags.length > 0) {
      nextOutfit.tags = correction.tags
    } else {
      delete nextOutfit.tags
    }
  }

  if (correction.detailTags !== undefined) {
    if (correction.detailTags.length > 0) {
      nextOutfit.detailTags = correction.detailTags
    } else {
      delete nextOutfit.detailTags
    }
  }

  if (correction.needsMapping !== undefined) {
    nextOutfit.needsMapping = correction.needsMapping
  } else if (correction.itemIds !== undefined && correction.itemIds.length > 0) {
    nextOutfit.needsMapping = false
  }

  return nextOutfit
}

function applyCorrections(storeCatalog, corrections) {
  const outfitIndex = new Map(storeCatalog.outfits.map((outfit, index) => [outfit.id, index]))
  const nextOutfits = [...storeCatalog.outfits]
  const applied = []
  const missing = []
  const excluded = []

  corrections.outfits.forEach((rawCorrection, index) => {
    const correction = normalizeCorrection(rawCorrection, index)
    const outfitIndexValue = outfitIndex.get(correction.id)

    if (outfitIndexValue === undefined) {
      missing.push(correction.id)
      return
    }

    if (correction.excluded) {
      excluded.push(correction.id)
      applied.push(correction.id)
      return
    }

    nextOutfits[outfitIndexValue] = applyCorrection(nextOutfits[outfitIndexValue], correction)
    applied.push(correction.id)
  })

  const excludedIds = new Set(excluded)

  return {
    catalog: {
      ...storeCatalog,
      generatedAt: new Date().toISOString(),
      outfits: nextOutfits.filter((outfit) => !excludedIds.has(outfit.id))
    },
    applied,
    missing,
    excluded
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  if (!args.correctionFile) {
    throw new Error('Missing corrections JSON path. Use --help for usage.')
  }

  const storeCatalogPath = resolve(args.storeCatalog)
  const outputPath = resolve(args.out || args.storeCatalog)
  const [storeCatalog, corrections] = await Promise.all([
    readJson(storeCatalogPath),
    readJson(resolve(args.correctionFile))
  ])

  validateStoreCatalog(storeCatalog)
  validateCorrections(corrections)

  const result = applyCorrections(storeCatalog, corrections)
  const summary = {
    storeCatalog: storeCatalogPath,
    output: outputPath,
    dryRun: args.dryRun,
    correctionCount: corrections.outfits.length,
    appliedCount: result.applied.length,
    excludedCount: result.excluded.length,
    excluded: result.excluded,
    missingCount: result.missing.length,
    missing: result.missing
  }

  console.log(JSON.stringify(summary, null, 2))

  if (result.missing.length > 0) {
    throw new Error(`Some correction IDs were not found: ${result.missing.join(', ')}`)
  }

  if (!args.dryRun) {
    await writeFile(outputPath, `${JSON.stringify(result.catalog, null, 2)}\n`, 'utf8')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
