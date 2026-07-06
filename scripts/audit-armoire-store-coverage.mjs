import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULT_ARMOIRE_CATALOG = 'public/data/armoire-catalog.json'
const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const DEFAULT_OUTPUT = ''
const DEFAULT_JA_ITEM_CSV_URL =
  'https://cdn.jsdelivr.net/gh/InfSein/ffxiv-datamining-mixed@master/ja/Item.csv'
const GLOBAL_PRODUCT_API_BASE = 'https://api.store.finalfantasyxiv.com/ffxivcatalog/api'
const GLOBAL_STORE_URL = 'https://store.finalfantasyxiv.com/ffxivstore/ja-jp'
const REQUEST_TIMEOUT_MS = 12000
const DETAIL_CONCURRENCY = 8
const GLOBAL_PAGE_SIZE = 12

const INCLUDE_GLOBAL_PRODUCT_PATTERNS = [
  /コスチューム/,
  /衣装/,
  /武器/,
  /ウェポン/i,
  /ソード/,
  /ブレード/,
  /アクス/,
  /アックス/,
  /ランス/,
  /スピア/,
  /ボウ/,
  /ダガー/,
  /ナイフ/,
  /スタッフ/,
  /ロッド/,
  /ワンド/,
  /サイズ/,
  /リーパー/,
  /ガン/,
  /シールド/,
  /盾/,
  /剣/,
  /刀/,
  /斧/,
  /槍/,
  /弓/,
  /銃/,
  /杖/,
  /鎌/
]
const EXCLUDE_GLOBAL_PRODUCT_PATTERNS = [
  /冒険録/,
  /マウント/,
  /ミニオン/,
  /エモート/,
  /オーケストリオン/,
  /幻想薬/,
  /リテイナー/,
  /チョコボかばん/,
  /ハウジング/,
  /調度品/,
  /庭具/,
  /内装/,
  /外装/,
  /染料/,
  /カララント/,
  /花火/,
  /転送網利用券/,
  /ホームワールド変更/,
  /エターナルバンド/
]

function parseArgs(argv) {
  const args = {
    armoireCatalog: DEFAULT_ARMOIRE_CATALOG,
    storeCatalog: DEFAULT_STORE_CATALOG,
    jaItemCsv: '',
    jaItemCsvUrl: DEFAULT_JA_ITEM_CSV_URL,
    output: DEFAULT_OUTPUT,
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

    if (arg === '--ja-item-csv') {
      args.jaItemCsv = resolve(argv[index + 1] ?? '')
      index += 1
      continue
    }

    if (arg === '--ja-item-csv-url') {
      args.jaItemCsvUrl = argv[index + 1] ?? DEFAULT_JA_ITEM_CSV_URL
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
  console.log(`Audit NSArmoire store catalog coverage against the global store.

Usage:
  node scripts/audit-armoire-store-coverage.mjs

Options:
  --armoire-catalog <file>  Armoire item catalog. Default: ${DEFAULT_ARMOIRE_CATALOG}
  --store-catalog <file>    Store catalog. Default: ${DEFAULT_STORE_CATALOG}
  --ja-item-csv <file>      Japanese Item.csv used for global item name mapping.
  --ja-item-csv-url <url>   Remote Japanese Item.csv URL. Default: ${DEFAULT_JA_ITEM_CSV_URL}
  --output <file>           Write full report JSON to a file.
`)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const normalized = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]

    if (char === '"') {
      if (inQuotes && normalized[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n' && !inQuotes) {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((csvRow) => csvRow.some((value) => value !== ''))
}

function normalizeRow(row, width) {
  if (row.length < width) {
    return [...row, ...Array.from({ length: width - row.length }, () => '')]
  }

  return row.length > width ? row.slice(0, width) : row
}

function loadSheetRows(text) {
  const rows = parseCsv(text)

  if (rows.length < 4) {
    throw new Error('CSV content is too short')
  }

  const headers = rows[1].map((value) => value.replace(/^\uFEFF/, '').trim())
  return rows.slice(3).map((row) => {
    const normalized = normalizeRow(row, headers.length)
    return Object.fromEntries(headers.map((header, index) => [header, normalized[index] ?? '']))
  })
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/<(?:SoftHyphen|Indent)\s*\/>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function readJson(filePath) {
  return JSON.parse(await readFile(resolve(filePath), 'utf8'))
}

async function fetchText(url) {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'NightingaleSilence NSArmoire store coverage audit'
    }
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.text()
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'NightingaleSilence NSArmoire store coverage audit',
      accept: 'application/json, text/plain, */*'
    }
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function readJaItemCsv(args) {
  if (args.jaItemCsv) {
    return readFile(args.jaItemCsv, 'utf8')
  }

  return fetchText(args.jaItemCsvUrl)
}

function buildJaNameIndex(itemCsvText) {
  const index = new Map()

  for (const row of loadSheetRows(itemCsvText)) {
    const itemId = parseInteger(row['#'])
    const name = cleanText(row.Name)

    if (itemId <= 0 || !name) {
      continue
    }

    const itemIds = index.get(name) ?? []
    itemIds.push(itemId)
    index.set(name, itemIds)
  }

  return index
}

function isStoreAppearanceCatalogItem(item) {
  return Boolean(
    item &&
    (item.isGlamourous === true ||
      item.isGlamourSetContainer === true ||
      item.itemUiCategoryId === 112)
  )
}

function isRelevantGlobalProduct(product) {
  const name = cleanText(product?.name)

  if (!name) {
    return false
  }

  if (EXCLUDE_GLOBAL_PRODUCT_PATTERNS.some((pattern) => pattern.test(name))) {
    return false
  }

  return INCLUDE_GLOBAL_PRODUCT_PATTERNS.some((pattern) => pattern.test(name))
}

function buildGlobalProductsUrl(offset) {
  const url = new URL(`${GLOBAL_PRODUCT_API_BASE}/products/`)
  url.searchParams.set('lang', 'ja-jp')
  url.searchParams.set('currency', 'JPY')
  url.searchParams.set('offset', String(offset))
  return url
}

function buildGlobalProductUrl(productId) {
  const url = new URL(`${GLOBAL_PRODUCT_API_BASE}/products/${productId}`)
  url.searchParams.set('lang', 'ja-jp')
  url.searchParams.set('currency', 'JPY')
  return url
}

async function fetchGlobalProductList() {
  const products = []
  let offset = 0

  for (let page = 0; page < 300; page += 1) {
    const payload = await fetchJson(buildGlobalProductsUrl(offset))
    const pageProducts = Array.isArray(payload.products) ? payload.products : []
    products.push(...pageProducts)

    const nextOffset = Number(payload.meta?.nextOffset)

    if (
      !Number.isInteger(nextOffset) ||
      nextOffset <= offset ||
      pageProducts.length < GLOBAL_PAGE_SIZE
    ) {
      break
    }

    offset = nextOffset
  }

  return products
}

async function mapConcurrent(values, worker, concurrency) {
  const results = new Array(values.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(values[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => runWorker()))

  return results
}

function resolveGlobalProductItems(product, jaNameIndex, catalogItems) {
  const itemIds = []
  const unresolvedItemNames = []

  for (const item of product?.items ?? []) {
    const name = cleanText(item?.name)
    const candidateIds = jaNameIndex.get(name) ?? []
    const resolvedIds = candidateIds.filter((itemId) =>
      isStoreAppearanceCatalogItem(catalogItems.get(itemId))
    )

    if (resolvedIds.length === 0 && name) {
      unresolvedItemNames.push(name)
    }

    itemIds.push(...resolvedIds)
  }

  return {
    itemIds: getUniqueSortedItemIds(itemIds),
    unresolvedItemNames
  }
}

function getUniqueSortedItemIds(itemIds) {
  return Array.from(
    new Set(itemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0))
  ).sort((left, right) => left - right)
}

function getItemSetKey(itemIds) {
  return getUniqueSortedItemIds(itemIds).join(',')
}

function getGlobalProductIdFromUrl(url) {
  const productId = Number(String(url ?? '').match(/\/product\/(\d+)(?:$|[/?#])/)?.[1] ?? 0)
  return Number.isInteger(productId) && productId > 0 ? productId : undefined
}

function getCatalogGlobalProductIds(storeCatalog) {
  const productIds = new Set()

  for (const outfit of storeCatalog.outfits ?? []) {
    const fromMetadata = Number(outfit.globalProductId ?? 0)
    const fromGlobalRegion = outfit.region === 'global' ? Number(outfit.productId ?? 0) : 0
    const fromUrl = getGlobalProductIdFromUrl(outfit.regionalStoreUrls?.global)

    for (const productId of [fromMetadata, fromGlobalRegion, fromUrl]) {
      if (Number.isInteger(productId) && productId > 0) {
        productIds.add(productId)
      }
    }
  }

  return productIds
}

function buildCatalogCoverageIndexes(storeCatalog) {
  const outfitsByExactItemSet = new Map()
  const outfitsByAnyItem = new Map()

  for (const outfit of storeCatalog.outfits ?? []) {
    const itemIds = getUniqueSortedItemIds(outfit.itemIds ?? [])

    if (itemIds.length === 0) {
      continue
    }

    const exactKey = getItemSetKey(itemIds)
    const exactOutfits = outfitsByExactItemSet.get(exactKey) ?? []
    exactOutfits.push(outfit)
    outfitsByExactItemSet.set(exactKey, exactOutfits)

    for (const itemId of itemIds) {
      const itemOutfits = outfitsByAnyItem.get(itemId) ?? []
      itemOutfits.push(outfit)
      outfitsByAnyItem.set(itemId, itemOutfits)
    }
  }

  return { outfitsByExactItemSet, outfitsByAnyItem }
}

function formatOutfitReference(outfit) {
  return {
    id: outfit.id,
    name: outfit.name,
    region: outfit.region,
    productId: outfit.productId
  }
}

function buildProductEntry(product, resolvedItems, armoireCatalog) {
  return {
    id: Number(product.id),
    skuId: cleanText(product.skuId),
    name: cleanText(product.name),
    storeUrl: `${GLOBAL_STORE_URL}/product/${Number(product.id)}`,
    priceText: cleanText(product.salePriceText) || cleanText(product.priceText),
    itemIds: resolvedItems.itemIds,
    itemNames: resolvedItems.itemIds
      .map((itemId) => armoireCatalog.items?.[itemId]?.name)
      .filter(Boolean),
    unresolvedItemNames: resolvedItems.unresolvedItemNames
  }
}

async function auditGlobalCoverage(args) {
  const [armoireCatalog, storeCatalog, jaItemCsv] = await Promise.all([
    readJson(args.armoireCatalog),
    readJson(args.storeCatalog),
    readJaItemCsv(args)
  ])
  const catalogItems = new Map(
    Object.values(armoireCatalog.items ?? {}).map((item) => [Number(item.itemId), item])
  )
  const jaNameIndex = buildJaNameIndex(jaItemCsv)
  const listedProducts = await fetchGlobalProductList()
  const relevantProducts = listedProducts.filter(isRelevantGlobalProduct)
  const knownGlobalProductIds = getCatalogGlobalProductIds(storeCatalog)
  const unknownRelevantProducts = relevantProducts.filter(
    (product) => !knownGlobalProductIds.has(Number(product.id))
  )
  const { outfitsByExactItemSet, outfitsByAnyItem } = buildCatalogCoverageIndexes(storeCatalog)
  const fetchFailures = []
  const trueMissing = []
  const coveredMissingGlobalLink = []
  const directBoxOrUnresolved = []

  const details = await mapConcurrent(
    unknownRelevantProducts,
    async (listedProduct) => {
      try {
        const payload = await fetchJson(buildGlobalProductUrl(Number(listedProduct.id)))
        return payload.product
      } catch (error) {
        fetchFailures.push({
          id: Number(listedProduct.id),
          name: cleanText(listedProduct.name),
          error: String(error)
        })
        return undefined
      }
    },
    DETAIL_CONCURRENCY
  )

  for (const product of details.filter(Boolean)) {
    const resolvedItems = resolveGlobalProductItems(product, jaNameIndex, catalogItems)
    const entry = buildProductEntry(product, resolvedItems, armoireCatalog)

    if (entry.itemIds.length === 0) {
      directBoxOrUnresolved.push({
        ...entry,
        globalItemNames: (product.items ?? []).map((item) => cleanText(item?.name)).filter(Boolean)
      })
      continue
    }

    const exactMatches = outfitsByExactItemSet.get(getItemSetKey(entry.itemIds)) ?? []

    if (exactMatches.length > 0) {
      coveredMissingGlobalLink.push({
        ...entry,
        matchedOutfits: exactMatches.map(formatOutfitReference)
      })
      continue
    }

    const partialMatches = Array.from(
      new Map(
        entry.itemIds
          .flatMap((itemId) => outfitsByAnyItem.get(itemId) ?? [])
          .map((outfit) => [outfit.id, formatOutfitReference(outfit)])
      ).values()
    )

    trueMissing.push({
      ...entry,
      partialMatches
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    note: 'Only the global store is scanned for automatic coverage. TW links are manually maintained and intentionally excluded from product crawling and itemId inference.',
    summary: {
      storeOutfitCount: storeCatalog.outfits?.length ?? 0,
      globalListedProductCount: listedProducts.length,
      relevantGlobalProductCount: relevantProducts.length,
      unknownRelevantGlobalProductCount: unknownRelevantProducts.length,
      trueMissingCount: trueMissing.length,
      coveredMissingGlobalLinkCount: coveredMissingGlobalLink.length,
      directBoxOrUnresolvedCount: directBoxOrUnresolved.length,
      fetchFailureCount: fetchFailures.length
    },
    trueMissing,
    coveredMissingGlobalLink,
    directBoxOrUnresolved,
    fetchFailures
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const report = await auditGlobalCoverage(args)

  if (args.output) {
    await writeFile(resolve(args.output), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  }

  console.log(
    JSON.stringify(
      {
        output: args.output ? resolve(args.output) : undefined,
        summary: report.summary,
        trueMissing: report.trueMissing.slice(0, 30),
        coveredMissingGlobalLink: report.coveredMissingGlobalLink.slice(0, 20),
        directBoxOrUnresolved: report.directBoxOrUnresolved.slice(0, 20),
        fetchFailures: report.fetchFailures.slice(0, 20)
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
