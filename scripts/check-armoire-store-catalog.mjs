import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULT_ARMOIRE_CATALOG = 'public/data/armoire-catalog.json'
const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const STORE_SCHEMA_VERSION = 'nsarmoire.storeCatalog.v1'
const VALID_REGIONS = new Set(['cn', 'global', 'tw'])
const VALID_LINK_REGIONS = new Set(['cn', 'global', 'tw', 'kr'])
const LINK_URL_PATTERNS = new Map([
  [
    'cn',
    /^https:\/\/(?:qu\.sdo\.com\/product-detail\/[A-Za-z0-9]+|ffpay\.sdo\.com\/pc\/giftsStation\/index\.html#\/index|actff1\.web\.sdo\.com\/[A-Za-z0-9_-]+\/index\.html#\/index)(?:[/?#].*)?$/
  ],
  [
    'global',
    /^https:\/\/(?:store\.finalfantasyxiv\.com\/ffxivstore\/[a-z]{2}-[a-z]{2}\/product\/\d+|jp\.finalfantasyxiv\.com\/product\/)(?:[/?#].*)?$/
  ],
  [
    'tw',
    /^https:\/\/www\.ffxiv\.com\.tw\/web\/store\/product_detail\.aspx\?id=[A-Za-z0-9_]+(?:[&#].*)?$/
  ],
  [
    'kr',
    /^https:\/\/www\.ff14\.co\.kr\/(?:shop\/home\/detail\/\d+|member\/event\/news\/index\.aspx|main)(?:[/?#].*)?$/i
  ]
])
const VALID_STORE_TAGS = new Set([
  'npcCostume',
  'bonusCostume',
  'collectorEditionBonus',
  'replicaCostume',
  'fanFestivalCostume',
  'crossoverCostume',
  'moonfireFaire',
  'huntingMoon',
  'hatchingTide',
  'theRising',
  'starlightCelebration',
  'valentioneDay',
  'littleLadiesDay',
  'allSaintsWake',
  'heavensturn',
  'goldSaucerFestival'
])
const VALID_STORE_DETAIL_TAGS = new Set(['maleOnly', 'femaleOnly'])
const VALID_MAPPING_SOURCES = new Set(['cn-store', 'global-store', 'manual'])
const VALID_LOCALIZED_NAME_LOCALES = new Set(['zh-CN', 'en', 'ja', 'ko', 'fr', 'de'])

function parseArgs(argv) {
  const args = {
    armoireCatalog: DEFAULT_ARMOIRE_CATALOG,
    storeCatalog: DEFAULT_STORE_CATALOG,
    pendingLimit: 20,
    help: false
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

    if (arg === '--pending-limit') {
      args.pendingLimit = Number.parseInt(argv[index + 1] ?? '20', 10)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Check NSArmoire store catalog consistency.

Usage:
  node scripts/check-armoire-store-catalog.mjs

Options:
  --armoire-catalog <file>  Armoire item catalog. Default: ${DEFAULT_ARMOIRE_CATALOG}
  --store-catalog <file>    Store catalog. Default: ${DEFAULT_STORE_CATALOG}
  --pending-limit <number>  How many needsMapping rows to print. Default: 20
`)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isLocalizedNames(value) {
  return (
    value === undefined ||
    (isRecord(value) &&
      Object.entries(value).every(
        ([locale, name]) => VALID_LOCALIZED_NAME_LOCALES.has(locale) && typeof name === 'string'
      ))
  )
}

function isRegionalPriceLabels(value) {
  return (
    value === undefined ||
    (isRecord(value) &&
      Object.entries(value).every(
        ([region, label]) => VALID_LINK_REGIONS.has(region) && typeof label === 'string'
      ))
  )
}

function isEnumArray(value, enumValues) {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((item) => typeof item === 'string' && enumValues.has(item)))
  )
}

function isItemIdArray(value) {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item) && item > 0)
}

function isOptionalItemId(value) {
  return value === undefined || (Number.isInteger(value) && value > 0)
}

function validateRegionalStoreUrls(outfit, label, issues) {
  if (outfit.regionalStoreUrls === undefined) {
    return
  }

  if (!isRecord(outfit.regionalStoreUrls)) {
    addIssue(issues, `${label}.regionalStoreUrls must be an object when present`)
    return
  }

  for (const [region, url] of Object.entries(outfit.regionalStoreUrls)) {
    if (!VALID_LINK_REGIONS.has(region)) {
      addIssue(issues, `${label}.regionalStoreUrls has unsupported region`, region)
      continue
    }

    if (typeof url !== 'string' || !url) {
      addIssue(issues, `${label}.regionalStoreUrls.${region} must be a non-empty string`)
      continue
    }

    const pattern = LINK_URL_PATTERNS.get(region)

    if (pattern && !pattern.test(url)) {
      addIssue(issues, `${label}.regionalStoreUrls.${region} has unsupported URL format`, url)
    }
  }
}

function addIssue(issues, message, detail) {
  issues.push(detail ? `${message}: ${detail}` : message)
}

function validateStoreCatalogShape(storeCatalog, issues) {
  if (!isRecord(storeCatalog)) {
    addIssue(issues, 'Store catalog root must be an object')
    return
  }

  if (storeCatalog.schemaVersion !== STORE_SCHEMA_VERSION) {
    addIssue(issues, 'Invalid store catalog schemaVersion', String(storeCatalog.schemaVersion))
  }

  if (typeof storeCatalog.generatedAt !== 'string' || !storeCatalog.generatedAt) {
    addIssue(issues, 'Store catalog generatedAt must be a non-empty string')
  }

  if (!Array.isArray(storeCatalog.sources)) {
    addIssue(issues, 'Store catalog sources must be an array')
  }

  if (!Array.isArray(storeCatalog.outfits)) {
    addIssue(issues, 'Store catalog outfits must be an array')
    return
  }

  for (const [index, outfit] of storeCatalog.outfits.entries()) {
    validateOutfitShape(outfit, index, issues)
  }
}

function validateOutfitShape(outfit, index, issues) {
  const label = `outfits[${index}]`

  if (!isRecord(outfit)) {
    addIssue(issues, `${label} must be an object`)
    return
  }

  for (const key of ['id', 'region', 'name', 'storeUrl', 'sourceUrl']) {
    if (typeof outfit[key] !== 'string' || !outfit[key]) {
      addIssue(issues, `${label}.${key} must be a non-empty string`)
    }
  }

  if (!isLocalizedNames(outfit.localizedNames)) {
    addIssue(issues, `${label}.localizedNames must be a locale-to-string object when present`)
  }

  if (!isRegionalPriceLabels(outfit.regionalPriceLabels)) {
    addIssue(issues, `${label}.regionalPriceLabels must be a region-to-string object when present`)
  }

  if (typeof outfit.region === 'string' && !VALID_REGIONS.has(outfit.region)) {
    addIssue(issues, `${label}.region is not supported`, outfit.region)
  }

  for (const key of ['globalProductId', 'globalProductName']) {
    if (outfit[key] !== undefined && typeof outfit[key] !== 'string') {
      addIssue(issues, `${label}.${key} must be a string when present`)
    }
  }

  for (const key of ['globalItemNames', 'globalItemUris']) {
    if (outfit[key] !== undefined && !isStringArray(outfit[key])) {
      addIssue(issues, `${label}.${key} must be a string array when present`)
    }
  }

  if (!isStringArray(outfit.itemNames)) {
    addIssue(issues, `${label}.itemNames must be a string array`)
  }

  if (!isItemIdArray(outfit.itemIds)) {
    addIssue(issues, `${label}.itemIds must be a positive integer array`)
  }

  if (!isEnumArray(outfit.tags, VALID_STORE_TAGS)) {
    addIssue(issues, `${label}.tags contains unsupported values`)
  }

  if (!isEnumArray(outfit.detailTags, VALID_STORE_DETAIL_TAGS)) {
    addIssue(issues, `${label}.detailTags contains unsupported values`)
  }

  if (outfit.mappingSource !== undefined && !VALID_MAPPING_SOURCES.has(outfit.mappingSource)) {
    addIssue(issues, `${label}.mappingSource is not supported`, outfit.mappingSource)
  }

  if (outfit.corrected !== undefined && typeof outfit.corrected !== 'boolean') {
    addIssue(issues, `${label}.corrected must be boolean when present`)
  }

  validateRegionalStoreUrls(outfit, label, issues)

  if (!isOptionalItemId(outfit.coverItemId)) {
    addIssue(issues, `${label}.coverItemId must be a positive integer when present`)
  }

  if (outfit.needsMapping !== undefined && typeof outfit.needsMapping !== 'boolean') {
    addIssue(issues, `${label}.needsMapping must be boolean when present`)
  }
}

function buildDuplicateValues(values) {
  const seen = new Set()
  const duplicates = new Set()

  for (const value of values.filter(Boolean)) {
    if (seen.has(value)) {
      duplicates.add(value)
    } else {
      seen.add(value)
    }
  }

  return Array.from(duplicates)
}

function validateOutfitUniqueness(outfits, issues) {
  const duplicateIds = buildDuplicateValues(outfits.map((outfit) => outfit.id))
  const duplicateProductIds = buildDuplicateValues(
    outfits.map((outfit) =>
      outfit.productId && outfit.region ? `${outfit.region}:${outfit.productId}` : outfit.productId
    )
  )

  if (duplicateIds.length > 0) {
    addIssue(issues, 'Duplicate store outfit ids', duplicateIds.join(', '))
  }

  if (duplicateProductIds.length > 0) {
    addIssue(issues, 'Duplicate store product ids', duplicateProductIds.join(', '))
  }
}

function validateMappedItems(storeCatalog, armoireCatalog, issues, warnings) {
  const catalogItemIds = new Set(Object.keys(armoireCatalog.items ?? {}).map(Number))

  for (const outfit of storeCatalog.outfits ?? []) {
    for (const itemId of outfit.itemIds ?? []) {
      if (!catalogItemIds.has(itemId)) {
        addIssue(
          issues,
          'Store outfit itemId is missing from armoire catalog',
          `${outfit.name} -> ${itemId}`
        )
      }
    }

    if (outfit.coverItemId !== undefined && !catalogItemIds.has(outfit.coverItemId)) {
      addIssue(
        issues,
        'Store outfit coverItemId is missing from armoire catalog',
        `${outfit.name} -> ${outfit.coverItemId}`
      )
    }

    if (outfit.needsMapping === false && (!outfit.itemIds || outfit.itemIds.length === 0)) {
      warnings.push(`${outfit.name}: needsMapping=false but itemIds is empty`)
    }

    if (outfit.itemNames?.some((name) => /[*×xX]\s*\d+$/.test(name))) {
      warnings.push(`${outfit.name}: itemNames still contain quantity suffix`)
    }
  }
}

function buildNameIndex(armoireCatalog) {
  return Object.values(armoireCatalog.items ?? {})
    .filter((item) => item && typeof item.name === 'string' && item.name.trim())
    .map((item) => ({
      itemId: item.itemId,
      name: item.name.trim(),
      pieceItemIds: Array.isArray(item.pieceItemIds) ? item.pieceItemIds : []
    }))
}

function normalizeForSearch(value) {
  return String(value ?? '')
    .replace(/[·・\-—_（）()【】\[\]「」『』“”"']/g, '')
    .replace(/套装|服装套装|装备套装|新装|夏装|浴衣套装|套$/g, '')
    .trim()
}

function findCandidateItems(outfit, catalogNameEntries) {
  const searchNames = [outfit.name, ...(outfit.itemNames ?? [])]
    .map(normalizeForSearch)
    .filter((name) => name.length >= 2)

  if (searchNames.length === 0) {
    return []
  }

  return catalogNameEntries
    .filter((item) => searchNames.some((name) => normalizeForSearch(item.name).includes(name)))
    .slice(0, 8)
}

function buildSummary(storeCatalog) {
  return {
    generatedAt: storeCatalog.generatedAt,
    outfitCount: storeCatalog.outfits.length,
    mappedCount: storeCatalog.outfits.filter((outfit) => outfit.itemIds.length > 0).length,
    coverCount: storeCatalog.outfits.filter((outfit) => outfit.coverItemId).length,
    needsMappingCount: storeCatalog.outfits.filter((outfit) => outfit.needsMapping).length,
    emptyItemNameCount: storeCatalog.outfits.filter((outfit) => outfit.itemNames.length === 0)
      .length
  }
}

function printPendingRows(storeCatalog, armoireCatalog, pendingLimit) {
  const catalogNameEntries = buildNameIndex(armoireCatalog)
  const pending = storeCatalog.outfits
    .filter((outfit) => outfit.needsMapping)
    .slice(0, pendingLimit)

  if (pending.length === 0 || pendingLimit <= 0) {
    return
  }

  console.log('\nNeeds mapping:')
  for (const outfit of pending) {
    const candidates = findCandidateItems(outfit, catalogNameEntries)
      .map(formatCandidateItem)
      .join(' / ')
    const itemNames = outfit.itemNames.length > 0 ? outfit.itemNames.join(' / ') : '无散件名'
    const links = formatRegionalLinks(outfit)
    const tags = [...(outfit.tags ?? []), ...(outfit.detailTags ?? [])].join(' / ')
    const meta = [
      `id: ${outfit.id}`,
      outfit.productId ? `product: ${outfit.productId}` : '',
      outfit.skuId ? `sku: ${outfit.skuId}` : '',
      tags ? `tags: ${tags}` : '',
      outfit.notes ? `notes: ${outfit.notes}` : ''
    ].filter(Boolean)

    console.log(`- ${outfit.name} | ${meta.join(' | ')}`)
    console.log(`  items: ${itemNames}${candidates ? ` | candidates: ${candidates}` : ''}`)
    if (links) {
      console.log(`  links: ${links}`)
    }
  }
}

function formatCandidateItem(item) {
  const pieces = item.pieceItemIds.length > 0 ? ` -> ${item.pieceItemIds.length}件散件` : ''

  return `${item.itemId}:${item.name}${pieces}`
}

function formatRegionalLinks(outfit) {
  const links = []
  const regionalStoreUrls = isRecord(outfit.regionalStoreUrls) ? outfit.regionalStoreUrls : {}

  for (const region of VALID_LINK_REGIONS) {
    const url = regionalStoreUrls[region]
    if (typeof url === 'string' && url) {
      links.push(`${region}=${url}`)
    }
  }

  if (
    typeof outfit.storeUrl === 'string' &&
    outfit.storeUrl &&
    !Object.values(regionalStoreUrls).includes(outfit.storeUrl)
  ) {
    links.push(`store=${outfit.storeUrl}`)
  }

  return links.join(' | ')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const [armoireCatalog, storeCatalog] = await Promise.all([
    readJson(resolve(args.armoireCatalog)),
    readJson(resolve(args.storeCatalog))
  ])
  const issues = []
  const warnings = []

  validateStoreCatalogShape(storeCatalog, issues)

  if (Array.isArray(storeCatalog.outfits)) {
    validateOutfitUniqueness(storeCatalog.outfits, issues)
    validateMappedItems(storeCatalog, armoireCatalog, issues, warnings)
  }

  console.log(JSON.stringify(buildSummary(storeCatalog), null, 2))
  printPendingRows(storeCatalog, armoireCatalog, args.pendingLimit)

  if (warnings.length > 0) {
    console.warn('\nWarnings:')
    for (const warning of warnings) {
      console.warn(`- ${warning}`)
    }
  }

  if (issues.length > 0) {
    console.error('\nErrors:')
    for (const issue of issues) {
      console.error(`- ${issue}`)
    }
    process.exitCode = 1
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
