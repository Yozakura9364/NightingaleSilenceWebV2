import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import {
  cleanText,
  loadSheetRows,
  normalizeRow,
  parseCsv,
  parseInteger,
  readJsonFile
} from './lib/shared.mjs'

const DEFAULT_ARMOIRE_CATALOG = 'public/data/armoire-catalog.json'
const DEFAULT_OUTPUT = 'public/data/armoire-store-catalog.json'
const DEFAULT_JA_ITEM_CSV_URL =
  'https://cdn.jsdelivr.net/gh/InfSein/ffxiv-datamining-mixed@master/ja/Item.csv'
const SCHEMA_VERSION = 'nsarmoire.storeCatalog.v1'
const CN_STORE_URL = 'https://qu.sdo.com/tools-shop?merchantId=1'
const CN_PRODUCT_API = 'https://sqmallservice.u.sdo.com/api/ps/product/list'
const GLOBAL_STORE_URL = 'https://store.finalfantasyxiv.com/ffxivstore/ja-jp/'
const GLOBAL_PRODUCT_API_BASE = 'https://api.store.finalfantasyxiv.com/ffxivcatalog/api'
const SOURCE_REPOSITORY_URL = 'https://github.com/InfSein/ffxiv-datamining-mixed.git'
const SOURCE_BRANCH = 'master'
const SOURCE_FOLDER = 'ja'
const PAGE_SIZE = 100
const GLOBAL_PAGE_SIZE = 12
const GLOBAL_FILTER_IDS_BY_TAG = new Map([
  [66, 'npcCostume'],
  [6, 'fanFestivalCostume'],
  [80, 'crossoverCostume'],
  [81, 'crossoverCostume'],
  [75, 'crossoverCostume'],
  [87, 'crossoverCostume'],
  [76, 'crossoverCostume'],
  [77, 'crossoverCostume'],
  [78, 'crossoverCostume'],
  [86, 'crossoverCostume'],
  [12, 'moonfireFaire'],
  [10, 'hatchingTide'],
  [13, 'theRising'],
  [16, 'starlightCelebration'],
  [8, 'valentioneDay'],
  [9, 'littleLadiesDay'],
  [15, 'allSaintsWake'],
  [7, 'heavensturn'],
  [11, 'goldSaucerFestival']
])
const GLOBAL_STANDALONE_PRODUCT_IDS = [
  187, 294, 295, 306, 307, 308, 309, 310, 311, 368, 369, 370, 371, 372, 631, 827, 902, 903, 904,
  905, 906, 907, 908, 1075, 1111
]
const GLOBAL_PRODUCT_ID_BY_OUTFIT_ID = new Map([
  ['cn-142', 134],
  ['cn-145', 135],
  ['cn-181', 198],
  ['cn-387', 469],
  ['cn-434', 528],
  ['cn-435', 527],
  ['cn-583', 625],
  ['cn-598', 765],
  ['cn-613', 786],
  ['cn-196', 386],
  ['cn-231', 319],
  ['cn-45', 189],
  ['cn-1516685016094642176', 857],
  ['cn-1516685614395330560', 858],
  ['cn-1655445923972149248', 901],
  ['cn-1673893209865605120', 913],
  ['cn-1905464059595239424', 1065],
  ['cn-1949696744794300417', 1073],
  ['cn-2029848962696134657', 1141],
  ['cn-2047568766563434497', 1147],
  ['cn-2054809453562417152', 1156]
])
const STORE_TAG_ORDER = [
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
const STORE_DETAIL_TAG_ORDER = ['maleOnly', 'femaleOnly']
const GLOBAL_DETAIL_TAG_BY_ICON_CLASS = new Map([
  ['mens_clothing', 'maleOnly'],
  ['men_clothing', 'maleOnly'],
  ['womens_clothing', 'femaleOnly'],
  ['women_clothing', 'femaleOnly']
])
const GLOBAL_DETAIL_TAG_BY_ICON_TEXT = new Map([
  ['男性用', 'maleOnly'],
  ['女性用', 'femaleOnly']
])
const TEXT_TAG_RULES = [
  {
    tag: 'collectorEditionBonus',
    patterns: [/典藏版/, /典藏包/, /コレクターズエディション/i, /collector'?s edition/i]
  },
  {
    tag: 'bonusCostume',
    patterns: [/特典/, /予約特典/, /購入特典/]
  },
  {
    tag: 'replicaCostume',
    patterns: [/レプリカ/, /Replica/i, /复制品/]
  },
  {
    tag: 'crossoverCostume',
    patterns: [
      /FFIV/i,
      /FFVII/i,
      /FFIX/i,
      /FFX(?!IV)/i,
      /FFXI/i,
      /FFXIII/i,
      /ファイナルファンタジー\s*(?:IV|VII|IX|X|XI|XIII)/,
      /ファイナルファンタジータクティクス/,
      /FINAL FANTASY TACTICS/i,
      /Ivalice/i,
      /イヴァリース/
    ]
  }
]
const PRODUCT_NAME_WORDS = [
  '套装',
  '服装',
  '夏装',
  '新装',
  '礼服',
  '浴衣',
  '校服',
  '制服',
  '燕尾',
  '永夏',
  '远北',
  '运动休闲',
  '战场玫瑰',
  '正统圣人',
  '新生国民',
  '新生女王',
  '志士',
  '唱诗班',
  '学院制服',
  '辨天',
  '艾达',
  '艾普',
  '纯白',
  '冰心',
  '血盟',
  '苍穹',
  '传代',
  '公主',
  '王子',
  '女仆',
  '执事',
  '优雅',
  '休闲',
  '街头',
  '假面'
]
const ITEM_NAME_WORDS = [
  '帽',
  '头',
  '冠',
  '衣',
  '袍',
  '服',
  '裙',
  '裤',
  '手套',
  '靴',
  '鞋',
  '凉鞋',
  '上衣',
  '外套',
  '短衣',
  '长衣',
  '礼帽',
  '礼服',
  '礼裙',
  '卫衣',
  '衬裤',
  '短裤',
  '长裤',
  '紧身裤',
  '马裤',
  '筒靴',
  '矮靴',
  '便鞋',
  '罩衫',
  '针织帽',
  '兜帽',
  '高筒靴',
  '束腰衣',
  '束膝裤',
  '打底裤',
  '半指手套',
  '剑',
  '刀',
  '斧',
  '枪',
  '弓',
  '杖',
  '盾',
  '书',
  '双剑',
  '大剑',
  '长枪',
  '刺剑',
  '火枪',
  '枪刃',
  '圆月轮',
  '战镰',
  '天球仪',
  '魔导书',
  '拳套',
  '手甲',
  '武器'
]
const SKIP_PRODUCT_WORDS = [
  '幻想药',
  '雇员',
  '呼铃',
  '坐骑',
  '乐谱',
  '动作',
  '表情',
  '宠物',
  '发型',
  '染剂',
  '烟花',
  '星芒树',
  '家具',
  '房屋',
  '季票',
  '冒险录',
  '改名',
  '转服',
  '婚典',
  '永结同心礼包',
  '声援',
  '演技教材',
  '管弦乐琴谱',
  '迷你',
  '优惠券',
  '纪念币',
  '礼包码',
  '冒险者录',
  '任务录',
  '海报',
  '蛋壳帽',
  '橘篮',
  '庭具',
  '内墙',
  '地板',
  '吊灯',
  '系列',
  '直升',
  '复制原画'
]
const SKIP_ITEM_PATTERNS = [
  /^商品/,
  /^购买/,
  /^售价/,
  /^注[:：]/,
  /^※/,
  /^\d+\./,
  /^领取/,
  /^使用/,
  /^打开/,
  /^若/,
  /^本商品/,
  /^道具/,
  /^不可/,
  /^可以/,
  /^请/,
  /^注意/,
  /^每个/,
  /^限购/,
  /^角色/,
  /^游戏内/,
  /^男女/,
  /^维埃拉/,
  /^此套装/,
  /^该套装/,
  /^本套装/,
  /^这套/,
  /^为了/,
  /^冒险者/,
  /^拂晓/,
  /^最潮/,
  /^一套/,
  /^具有/,
  /^盛夏/,
  /^FFT/,
  /^2017年/,
  /^新生/,
  /^印有/,
  /^白色的/,
  /^黑色的/,
  /^翠绿的/,
  /^银月的/,
  /^把一个/,
  /^周年/,
  /^用于/,
  /^学习/,
  /装备箱/,
  /游戏中打开后/,
  /套装$/,
  /不可染色/,
  /可以染色/,
  /衣服而设计/,
  /活动奖励/,
  /纪念服装/,
  /一共有/,
  /包含/,
  /部位/,
  /外观/,
  /风格/,
  /穿上/,
  /衣着$/,
  /的装备$/
]
const CN_PRODUCT_HEADERS = {
  'qu-merchant-id': '1',
  'qu-hardware-platform': '3',
  'qu-software-platform': '1',
  'qu-deploy-platform': '1',
  'qu-web-host': 'qu.sdo.com',
  accept: 'application/json, text/plain, */*'
}
const COVER_ITEM_NAME_HINTS = {
  男性人狼套装: ['人狼身体'],
  女性人狼套装: ['人狼身体'],
  西德套装: ['首席机械师装备套装', '首席机械师套装'],
  运动休闲套装: ['运动休闲破烂罩衫上衣'],
  血盟公爵武器套装: ['血盟公爵幻杖']
}
const MANUAL_OUTFIT_ITEM_IDS_BY_ID = new Map([
  ['cn-485', [21017, 21018, 21019, 21020, 21021]],
  ['cn-484', [21017, 21018, 21019, 21020, 21026]],
  ['cn-2029848962696134657', [50451, 50452, 50453]]
])
const MANUAL_OUTFIT_DETAIL_TAGS_BY_ID = new Map([
  ['cn-485', ['maleOnly']],
  ['cn-484', ['femaleOnly']]
])
const STORE_ITEM_NAME_CORRECTIONS = {
  血盟双剑师膝裤: '血盟双剑师长裤'
}
let gitSourceDirPromise

function parseArgs(argv) {
  const args = {
    armoireCatalog: DEFAULT_ARMOIRE_CATALOG,
    jaItemCsv: '',
    jaItemCsvUrl: DEFAULT_JA_ITEM_CSV_URL,
    output: DEFAULT_OUTPUT,
    preserveExisting: true,
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

    if (arg === '--output') {
      args.output = argv[index + 1] ?? DEFAULT_OUTPUT
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

    if (arg === '--no-preserve-existing') {
      args.preserveExisting = false
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Build NSArmoire store catalog from public store product data.

Usage:
  node scripts/build-armoire-store-catalog.mjs

Options:
  --armoire-catalog <file>  Armoire item catalog used for exact name -> itemId mapping.
                            Default: ${DEFAULT_ARMOIRE_CATALOG}
  --ja-item-csv <file>      Japanese Item.csv used for global store item name -> itemId mapping.
  --ja-item-csv-url <url>   Remote Japanese Item.csv URL. Default: ${DEFAULT_JA_ITEM_CSV_URL}
  --output <file>           Output store catalog path. Default: ${DEFAULT_OUTPUT}
  --no-preserve-existing    Do not preserve existing manual itemId corrections.
`)
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

function stripHtml(value) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>(?=.)/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function normalizeProductRow(raw) {
  return {
    raw,
    product: raw.product ?? raw,
    sku: raw.sku ?? raw.skuList?.[0] ?? {}
  }
}

function cleanItemName(value) {
  return decodeHtml(value)
    .replace(/^[-·•*\s"“”]+/, '')
    .replace(/["“”]+$/g, '')
    .replace(/\s*\/\s*\d+$/g, '')
    .replace(/\s*[*×xX]\s*\d+$/g, '')
    .replace(/[：:。；;，,]+$/g, '')
    .trim()
}

function normalizeStoreItemName(value) {
  return STORE_ITEM_NAME_CORRECTIONS[value] ?? value
}

function isLikelyItemName(value) {
  if (!value || value.length > 24) {
    return false
  }

  if (SKIP_ITEM_PATTERNS.some((rule) => rule.test(value))) {
    return false
  }

  if (value.includes('点券') || value.includes('官方商城')) {
    return false
  }

  return ITEM_NAME_WORDS.some((word) => value.includes(word))
}

function extractItemNames(productName, productContent) {
  const html = String(productContent ?? '')
  const afterPurchase = html.includes('购买后将获得')
    ? html.split('购买后将获得').slice(1).join('购买后将获得')
    : html
  const strongNames = Array.from(afterPurchase.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/gi)).map(
    (match) => cleanItemName(match[1].replace(/<[^>]+>/g, ''))
  )
  const lineNames = stripHtml(afterPurchase).split(/\n+/).map(cleanItemName)

  return Array.from(
    new Set([...strongNames, ...lineNames].filter(isLikelyItemName).map(normalizeStoreItemName))
  ).slice(0, 12)
}

function isStoreOutfitProduct(raw, nameIndex, catalogItemIndex) {
  const { product } = normalizeProductRow(raw)
  const productName = String(product.productName ?? '')

  if (SKIP_PRODUCT_WORDS.some((word) => productName.includes(word))) {
    return false
  }

  const itemNames = extractItemNames(productName, product.productContent)
  const itemIds = resolveStoreItemIds(itemNames, nameIndex, catalogItemIndex)

  if (itemIds.length > 0) {
    return true
  }

  if (PRODUCT_NAME_WORDS.some((word) => productName.includes(word))) {
    return true
  }

  return itemNames.length >= 2
}

function formatPriceLabel(raw) {
  const { raw: row, sku } = normalizeProductRow(raw)
  const rawPrice = row.price ?? sku.netPrice ?? sku.originalPrice

  if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
    return undefined
  }

  const numericPrice = Number(rawPrice)
  const priceValue = Number.isFinite(numericPrice)
    ? String(Math.trunc(numericPrice))
    : String(rawPrice)
  const currencyUnit = row.currency?.shortName ?? sku.currency?.shortName ?? '点券'

  return `${priceValue} ${currencyUnit}`
}

async function fetchCnProductPage(page) {
  const url = new URL(CN_PRODUCT_API)
  url.searchParams.set('merchantId', '1')
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', String(PAGE_SIZE))
  url.searchParams.set('categoryType', '0')
  url.searchParams.set('order', '0')
  url.searchParams.set('keyword', '')

  const response = await fetch(url, { headers: CN_PRODUCT_HEADERS })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchCnProducts() {
  const firstPage = await fetchCnProductPage(1)
  const totalCount = firstPage.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  let products = Array.isArray(firstPage.data?.productList) ? firstPage.data.productList : []

  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await fetchCnProductPage(page)
    products = products.concat(
      Array.isArray(payload.data?.productList) ? payload.data.productList : []
    )
  }

  return { products, totalCount }
}

async function readJaItemCsv(args) {
  if (args.jaItemCsv) {
    return readFile(args.jaItemCsv, 'utf8')
  }

  try {
    const response = await fetch(args.jaItemCsvUrl, {
      headers: {
        'User-Agent': 'NightingaleSilence NSArmoire store catalog builder'
      }
    })

    if (response.ok) {
      return response.text()
    }

    throw new Error(`${response.status} ${response.statusText}`)
  } catch (error) {
    console.warn('Remote Japanese Item.csv fetch failed; falling back to git sparse checkout.')
    console.warn(String(error))
  }

  const gitSourceDir = await getGitSourceDir()
  return readFile(join(gitSourceDir, 'Item.csv'), 'utf8')
}

async function getGitSourceDir() {
  gitSourceDirPromise ??= checkoutGitSourceDir()
  return gitSourceDirPromise
}

async function checkoutGitSourceDir() {
  const cacheDir = await mkdtemp(join(tmpdir(), 'nsarmoire-ja-csv-'))
  execFileSync(
    'git',
    ['clone', '--depth=1', '--filter=blob:none', '--sparse', SOURCE_REPOSITORY_URL, cacheDir],
    { stdio: 'ignore' }
  )
  execFileSync(
    'git',
    ['-C', cacheDir, 'sparse-checkout', 'set', '--no-cone', `${SOURCE_FOLDER}/Item.csv`],
    { stdio: 'ignore' }
  )

  return join(cacheDir, SOURCE_FOLDER)
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NightingaleSilence NSArmoire store catalog builder',
      accept: 'application/json, text/plain, */*'
    }
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

function buildGlobalProductUrl(productId, lang = 'ja-jp', currency = 'JPY') {
  const url = new URL(`${GLOBAL_PRODUCT_API_BASE}/products/${productId}`)
  url.searchParams.set('lang', lang)
  url.searchParams.set('currency', currency)
  return url
}

async function fetchGlobalProduct(productId, lang = 'ja-jp', currency = 'JPY') {
  const payload = await fetchJson(buildGlobalProductUrl(productId, lang, currency))

  if (!payload?.product) {
    throw new Error(`Global product ${productId} returned no product`)
  }

  return payload.product
}

async function fetchGlobalProducts(productIds, lang = 'ja-jp', currency = 'JPY') {
  const products = new Map()

  for (const productId of productIds) {
    try {
      products.set(productId, await fetchGlobalProduct(productId, lang, currency))
    } catch (error) {
      console.warn(`Global product fetch failed for ${productId} (${lang}): ${String(error)}`)
    }
  }

  return products
}

function buildGlobalProductsFilterUrl(filterId, offset) {
  const url = new URL(`${GLOBAL_PRODUCT_API_BASE}/products/`)
  url.searchParams.set('lang', 'ja-jp')
  url.searchParams.set('currency', 'JPY')
  url.searchParams.set('filters', String(filterId))
  url.searchParams.set('offset', String(offset))
  return url
}

async function fetchGlobalProductIdsByFilter(filterId) {
  const productIds = new Set()
  let offset = 0

  for (let page = 0; page < 200; page += 1) {
    const payload = await fetchJson(buildGlobalProductsFilterUrl(filterId, offset))
    const products = Array.isArray(payload.products) ? payload.products : []

    for (const product of products) {
      const productId = Number(product.id)

      if (Number.isInteger(productId) && productId > 0) {
        productIds.add(productId)
      }
    }

    const nextOffset = Number(payload.meta?.nextOffset)

    if (
      !Number.isInteger(nextOffset) ||
      nextOffset <= offset ||
      products.length < GLOBAL_PAGE_SIZE
    ) {
      break
    }

    offset = nextOffset
  }

  return productIds
}

async function buildGlobalTagIndex() {
  const tagsByProductId = new Map()

  for (const [filterId, tag] of GLOBAL_FILTER_IDS_BY_TAG.entries()) {
    let productIds

    try {
      productIds = await fetchGlobalProductIdsByFilter(filterId)
    } catch (error) {
      console.warn(`Global filter fetch failed for ${filterId}: ${String(error)}`)
      continue
    }

    for (const productId of productIds) {
      const tags = tagsByProductId.get(productId) ?? new Set()
      tags.add(tag)
      tagsByProductId.set(productId, tags)
    }
  }

  return tagsByProductId
}

function buildNameIndex(armoireCatalog) {
  const index = new Map()

  for (const item of Object.values(armoireCatalog.items ?? {})) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) {
      continue
    }

    const name = item.name.trim()
    const itemIds = index.get(name) ?? []
    itemIds.push(Number(item.itemId))
    index.set(name, itemIds)
  }

  return index
}

function buildCatalogItemIndex(armoireCatalog) {
  return new Map(
    Object.values(armoireCatalog.items ?? {})
      .filter((item) => item && Number.isInteger(item.itemId) && item.itemId > 0)
      .map((item) => [Number(item.itemId), item])
  )
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

function resolveGlobalStoreItems(globalItems, jaNameIndex, catalogItemIndex) {
  const itemIds = []
  const unresolvedItemNames = []

  for (const item of globalItems) {
    const name = cleanText(item?.name)

    if (!name) {
      continue
    }

    const candidateItemIds = jaNameIndex.get(name) ?? []

    if (candidateItemIds.length === 0) {
      unresolvedItemNames.push(name)
      continue
    }

    itemIds.push(
      ...candidateItemIds.filter((itemId) =>
        isStoreAppearanceCatalogItem(catalogItemIndex.get(itemId))
      )
    )
  }

  return {
    itemIds: getUniqueSortedItemIds(itemIds),
    unresolvedItemNames
  }
}

function resolveStoreItemIds(itemNames, nameIndex, catalogItemIndex) {
  return getUniqueSortedItemIds(
    itemNames.flatMap((name) =>
      (nameIndex.get(name) ?? []).filter((itemId) =>
        isStoreAppearanceCatalogItem(catalogItemIndex.get(itemId))
      )
    )
  )
}

function resolveProductNameItemIds(productName, catalogItemIndex) {
  const exactMatches = Array.from(catalogItemIndex.values()).filter(
    (item) => item?.name?.trim() === productName && isStoreAppearanceCatalogItem(item)
  )

  if (exactMatches.length > 0) {
    return getUniqueSortedItemIds(exactMatches.map((item) => Number(item.itemId)))
  }

  const normalizedProductName = normalizeCoverSearchName(productName)

  if (!normalizedProductName || normalizedProductName.length < 2) {
    return []
  }

  const normalizedMatches = Array.from(catalogItemIndex.values()).filter(
    (item) =>
      normalizeCoverSearchName(item?.name) === normalizedProductName &&
      isStoreAppearanceCatalogItem(item)
  )

  if (normalizedMatches.length !== 1) {
    return []
  }

  return [Number(normalizedMatches[0].itemId)]
}

function normalizeCoverSearchName(value) {
  return String(value ?? '')
    .replace(/[·・\-—_（）()【】\[\]「」『』“”"']/g, '')
    .replace(/服装套装|装备套装|浴衣套装|装束|套装|服装|新装|夏装|浴衣/g, '')
    .trim()
}

function isCoverPreferredCatalogItem(item) {
  return (
    item?.isGlamourSetContainer === true ||
    item?.itemUiCategoryId === 112 ||
    /套装|装束|服装套装|装备套装/.test(String(item?.name ?? ''))
  )
}

function scoreCoverCandidate(outfitName, item) {
  if (!item || !item.iconId || typeof item.name !== 'string' || !item.name.trim()) {
    return 0
  }

  const itemName = item.name.trim()
  const outfitNormalized = normalizeCoverSearchName(outfitName)
  const itemNormalized = normalizeCoverSearchName(itemName)
  const preferredBonus = isCoverPreferredCatalogItem(item) ? 100 : 0

  if (itemName === outfitName) {
    return 1000 + preferredBonus
  }

  if (outfitNormalized && itemNormalized && itemNormalized === outfitNormalized) {
    return 800 + preferredBonus
  }

  if (
    outfitNormalized.length >= 2 &&
    itemNormalized.length >= 2 &&
    (itemNormalized.includes(outfitNormalized) || outfitNormalized.includes(itemNormalized))
  ) {
    return 500 + preferredBonus
  }

  return 0
}

function resolveCoverItemId(outfit, catalogItemIndex) {
  const hintedNames = COVER_ITEM_NAME_HINTS[outfit.name] ?? []
  const hintedItem = hintedNames
    .map((name) => Array.from(catalogItemIndex.values()).find((item) => item.name?.trim() === name))
    .find(Boolean)

  if (hintedItem?.iconId) {
    return Number(hintedItem.itemId)
  }

  const rankedCandidates = Array.from(catalogItemIndex.values())
    .map((item) => ({
      itemId: Number(item.itemId),
      score: scoreCoverCandidate(outfit.name, item)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.itemId - right.itemId)

  if (rankedCandidates.length > 0) {
    return rankedCandidates[0].itemId
  }

  return outfit.itemIds.find((itemId) => catalogItemIndex.get(itemId)?.iconId)
}

function getUniqueSortedItemIds(itemIds) {
  return Array.from(
    new Set(itemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0))
  ).sort((left, right) => left - right)
}

function getUniqueOrderedValues(values, order) {
  const valueSet = new Set(values.filter(Boolean))

  return order.filter((value) => valueSet.has(value))
}

function getGlobalProductIdFromUrl(url) {
  const match = String(url ?? '').match(/\/product\/(\d+)(?:$|[/?#])/)
  const productId = Number(match?.[1] ?? 0)

  return Number.isInteger(productId) && productId > 0 ? productId : undefined
}

function getGlobalProductId(outfit) {
  return getGlobalProductIdFromUrl(outfit.regionalStoreUrls?.global)
}

function getGlobalStoreUrl(productId) {
  return `${GLOBAL_STORE_URL.replace(/\/$/, '')}/product/${productId}`
}

function applyKnownGlobalLink(outfit) {
  const productId = GLOBAL_PRODUCT_ID_BY_OUTFIT_ID.get(outfit.id)

  if (!productId || outfit.regionalStoreUrls?.global) {
    return outfit
  }

  return {
    ...outfit,
    regionalStoreUrls: {
      ...outfit.regionalStoreUrls,
      global: getGlobalStoreUrl(productId)
    }
  }
}

function getGlobalItems(globalProduct) {
  return Array.isArray(globalProduct?.items) ? globalProduct.items : []
}

function buildGlobalProductSearchText(globalProduct, outfit) {
  const textParts = [
    outfit?.name,
    ...(outfit?.itemNames ?? []),
    globalProduct?.name,
    globalProduct?.features?.main?.caption,
    globalProduct?.features?.main?.description,
    ...(globalProduct?.features?.subs ?? []).flatMap((feature) => [
      feature?.caption,
      feature?.description
    ]),
    ...(globalProduct?.noteSet?.remarkNotes ?? []),
    ...(globalProduct?.noteSet?.notes ?? [])
  ]

  return textParts.filter(Boolean).join('\n')
}

function inferStoreTags(globalProduct, outfit, tagsByProductId) {
  const productId = Number(globalProduct?.id ?? getGlobalProductId(outfit) ?? 0)
  const tags = new Set(
    Number.isInteger(productId) && productId > 0
      ? Array.from(tagsByProductId.get(productId) ?? [])
      : []
  )
  const searchText = buildGlobalProductSearchText(globalProduct, outfit)

  for (const { tag, patterns } of TEXT_TAG_RULES) {
    if (patterns.some((pattern) => pattern.test(searchText))) {
      tags.add(tag)
    }
  }

  if (tags.has('collectorEditionBonus')) {
    tags.delete('bonusCostume')
  }

  if (tags.has('crossoverCostume')) {
    return ['crossoverCostume']
  }

  return getUniqueOrderedValues(Array.from(tags), STORE_TAG_ORDER)
}

function inferStoreDetailTags(globalProduct) {
  const detailTags = new Set()

  for (const icon of globalProduct?.icons ?? []) {
    const byClass = GLOBAL_DETAIL_TAG_BY_ICON_CLASS.get(String(icon?.className ?? ''))
    const byText = GLOBAL_DETAIL_TAG_BY_ICON_TEXT.get(String(icon?.text ?? ''))

    if (byClass) {
      detailTags.add(byClass)
    }

    if (byText) {
      detailTags.add(byText)
    }
  }

  return getUniqueOrderedValues(Array.from(detailTags), STORE_DETAIL_TAG_ORDER)
}

function getCatalogItemNames(itemIds, catalogItemIndex) {
  return itemIds.map((itemId) => catalogItemIndex.get(itemId)?.name).filter(Boolean)
}

function getGlobalMetadata(globalProduct, productId) {
  if (!globalProduct && !productId) {
    return {}
  }

  const globalItems = getGlobalItems(globalProduct)
  const globalProductId = String(globalProduct?.id ?? productId)
  const globalItemNames = globalItems.map((item) => cleanText(item?.name)).filter(Boolean)
  const globalItemUris = globalItems.map((item) => String(item?.uriKey ?? '')).filter(Boolean)

  return {
    globalProductId,
    ...(globalProduct?.name ? { globalProductName: cleanText(globalProduct.name) } : {}),
    ...(globalItemNames.length > 0 ? { globalItemNames } : {}),
    ...(globalItemUris.length > 0 ? { globalItemUris } : {})
  }
}

function getGlobalLocalizedNames(globalProduct, localizedGlobalProducts = {}) {
  const localizedNames = {}
  const jaName = cleanText(globalProduct?.name)
  const enName = cleanText(localizedGlobalProducts.en?.name)

  if (jaName) {
    localizedNames.ja = jaName
  }

  if (enName) {
    localizedNames.en = enName
  }

  return Object.keys(localizedNames).length > 0 ? localizedNames : undefined
}

function formatGlobalPriceLabel(globalProduct) {
  const priceText = cleanText(globalProduct?.salePriceText) || cleanText(globalProduct?.priceText)
  const textAmount = priceText.match(/([\d,]+)\s*円/)?.[1]

  if (textAmount) {
    return `${textAmount.replace(/,/g, '')} crysta`
  }

  if (Number.isFinite(Number(globalProduct?.salePrice))) {
    return `${Number(globalProduct.salePrice)} crysta`
  }

  if (Number.isFinite(Number(globalProduct?.price))) {
    return `${Number(globalProduct.price)} crysta`
  }

  return undefined
}

function buildOutfitFromGlobalProduct(
  globalProduct,
  jaNameIndex,
  catalogItemIndex,
  tagsByProductId,
  localizedGlobalProducts
) {
  const productId = Number(globalProduct?.id ?? 0)
  const priceLabel = formatGlobalPriceLabel(globalProduct)
  const globalItems = getGlobalItems(globalProduct)
  const { itemIds, unresolvedItemNames } = resolveGlobalStoreItems(
    globalItems,
    jaNameIndex,
    catalogItemIndex
  )
  const outfit = {
    id: `global-${productId}`,
    region: 'global',
    name: cleanText(globalProduct?.name),
    storeUrl: getGlobalStoreUrl(productId),
    regionalStoreUrls: {
      global: getGlobalStoreUrl(productId)
    },
    sourceUrl: GLOBAL_STORE_URL,
    productId: String(productId),
    skuId: cleanText(globalProduct?.skuId),
    priceLabel,
    ...(priceLabel ? { regionalPriceLabels: { global: priceLabel } } : {}),
    itemNames: getCatalogItemNames(itemIds, catalogItemIndex),
    itemIds,
    mappingSource: itemIds.length > 0 ? 'global-store' : undefined,
    needsMapping: itemIds.length === 0 || unresolvedItemNames.length > 0,
    localizedNames: getGlobalLocalizedNames(globalProduct, localizedGlobalProducts),
    ...getGlobalMetadata(globalProduct, productId)
  }
  const tags = inferStoreTags(globalProduct, outfit, tagsByProductId)
  const detailTags = inferStoreDetailTags(globalProduct)
  const coverItemId = outfit.itemIds.find((itemId) => catalogItemIndex.get(itemId)?.iconId)

  return {
    ...outfit,
    ...(coverItemId ? { coverItemId } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(detailTags.length > 0 ? { detailTags } : {})
  }
}

function applyGlobalProductData(
  outfit,
  globalProduct,
  jaNameIndex,
  catalogItemIndex,
  tagsByProductId,
  localizedGlobalProducts
) {
  const productId = Number(globalProduct?.id ?? getGlobalProductId(outfit) ?? 0)
  const globalItems = getGlobalItems(globalProduct)
  const { itemIds, unresolvedItemNames } = resolveGlobalStoreItems(
    globalItems,
    jaNameIndex,
    catalogItemIndex
  )
  const tags = inferStoreTags(globalProduct, outfit, tagsByProductId)
  const detailTags = inferStoreDetailTags(globalProduct)
  const globalMetadata = getGlobalMetadata(globalProduct, productId)
  const localizedNames = {
    ...outfit.localizedNames,
    ...getGlobalLocalizedNames(globalProduct, localizedGlobalProducts)
  }
  const localizedNameMetadata =
    Object.keys(localizedNames).length > 0 ? { localizedNames } : {}
  const regionalStoreUrls =
    productId > 0
      ? {
          ...outfit.regionalStoreUrls,
          global: outfit.regionalStoreUrls?.global ?? getGlobalStoreUrl(productId)
        }
      : outfit.regionalStoreUrls
  const tagMetadata = {
    ...(tags.length > 0 ? { tags } : {}),
    ...(detailTags.length > 0 ? { detailTags } : {})
  }

  if (outfit.corrected) {
    return {
      ...outfit,
      ...globalMetadata,
      ...localizedNameMetadata,
      ...(outfit.tags ? { tags: outfit.tags } : tags.length > 0 ? { tags } : {}),
      ...(outfit.detailTags
        ? { detailTags: outfit.detailTags }
        : detailTags.length > 0
          ? { detailTags }
          : {}),
      regionalStoreUrls,
      mappingSource: outfit.mappingSource ?? 'manual'
    }
  }

  if (itemIds.length === 0) {
    return {
      ...outfit,
      ...globalMetadata,
      ...localizedNameMetadata,
      ...tagMetadata,
      regionalStoreUrls,
      needsMapping: outfit.needsMapping || globalItems.length > 0,
      mappingSource: outfit.itemIds.length > 0 ? outfit.mappingSource : undefined
    }
  }

  return {
    ...outfit,
    ...globalMetadata,
    ...localizedNameMetadata,
    ...tagMetadata,
    regionalStoreUrls,
    itemNames: getCatalogItemNames(itemIds, catalogItemIndex),
    itemIds,
    needsMapping: unresolvedItemNames.length > 0,
    mappingSource: 'global-store'
  }
}

function buildOutfitFromCnProduct(row, nameIndex, catalogItemIndex) {
  const { product, sku } = normalizeProductRow(row)
  const productId = String(product.productId ?? product.id ?? row.productId ?? '')
  const outfitId = `cn-${productId}`
  const skuId = String(row.defaultSKUId ?? sku.skuId ?? sku.id ?? '')
  const extractedItemNames = extractItemNames(product.productName, product.productContent)
  const extractedItemIds = resolveStoreItemIds(extractedItemNames, nameIndex, catalogItemIndex)
  const fallbackItemIds =
    extractedItemIds.length === 0
      ? resolveProductNameItemIds(String(product.productName ?? '').trim(), catalogItemIndex)
      : []
  const manualItemIds = MANUAL_OUTFIT_ITEM_IDS_BY_ID.get(outfitId) ?? []
  const itemIds =
    extractedItemIds.length > 0
      ? extractedItemIds
      : fallbackItemIds.length > 0
        ? fallbackItemIds
        : manualItemIds
  const itemNames =
    extractedItemNames.length > 0
      ? extractedItemNames
      : getCatalogItemNames(itemIds, catalogItemIndex)
  const detailTags = MANUAL_OUTFIT_DETAIL_TAGS_BY_ID.get(outfitId) ?? []
  const storeUrl = skuId ? `https://qu.sdo.com/product-detail/${skuId}` : CN_STORE_URL
  const priceLabel = formatPriceLabel(row)
  const outfit = {
    id: outfitId,
    region: 'cn',
    name: String(product.productName ?? '').trim(),
    localizedNames: {
      'zh-CN': String(product.productName ?? '').trim()
    },
    storeUrl,
    regionalStoreUrls: {
      cn: storeUrl
    },
    sourceUrl: CN_STORE_URL,
    productId,
    skuId,
    priceLabel,
    ...(priceLabel ? { regionalPriceLabels: { cn: priceLabel } } : {}),
    itemNames,
    itemIds,
    mappingSource: itemIds.length > 0 ? 'cn-store' : undefined,
    needsMapping:
      itemIds.length === 0 ||
      (extractedItemNames.length > 0 && itemIds.length < extractedItemNames.length),
    ...(detailTags.length > 0 ? { detailTags } : {}),
    notes: itemNames.length > 0 ? undefined : '商品说明未解析出散件名称，待人工校正'
  }
  const coverItemId = resolveCoverItemId(outfit, catalogItemIndex)

  return coverItemId ? { ...outfit, coverItemId } : outfit
}

function isStoreCatalog(value) {
  return (
    value &&
    typeof value === 'object' &&
    value.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(value.outfits)
  )
}

async function readExistingCatalog(output) {
  try {
    const value = JSON.parse(await readFile(output, 'utf8'))
    return isStoreCatalog(value) ? value : null
  } catch {
    return null
  }
}

function mergeExistingCorrection(outfit, existingOutfit, preserveExisting) {
  if (!preserveExisting || !existingOutfit) {
    return outfit
  }

  const regionalStoreUrls = {
    ...outfit.regionalStoreUrls,
    ...existingOutfit.regionalStoreUrls
  }
  const localizedNames = {
    ...outfit.localizedNames,
    ...existingOutfit.localizedNames
  }
  const regionalPriceLabels = {
    ...outfit.regionalPriceLabels,
    ...existingOutfit.regionalPriceLabels
  }
  const preservedMetadata = {
    ...(Object.keys(localizedNames).length > 0 ? { localizedNames } : {}),
    ...(Object.keys(regionalPriceLabels).length > 0 ? { regionalPriceLabels } : {})
  }

  const existingItemIds = getUniqueSortedItemIds(existingOutfit.itemIds ?? [])
  const isManuallyCorrected = existingOutfit.corrected === true
  const shouldPreserveItemIds =
    existingItemIds.length > 0 &&
    (isManuallyCorrected ||
      existingItemIds.length >= outfit.itemIds.length ||
      existingOutfit.needsMapping === false)

  if (!shouldPreserveItemIds) {
    return {
      ...outfit,
      ...preservedMetadata,
      regionalStoreUrls,
      coverItemId: existingOutfit.coverItemId ?? outfit.coverItemId,
      corrected: existingOutfit.corrected,
      tags: existingOutfit.tags ?? outfit.tags,
      detailTags: existingOutfit.detailTags ?? outfit.detailTags
    }
  }

  const needsMapping = isManuallyCorrected
    ? false
    : existingOutfit.needsMapping === false
      ? false
      : existingItemIds.length > outfit.itemIds.length
        ? (existingOutfit.needsMapping ?? outfit.needsMapping)
        : outfit.needsMapping

  return {
    ...outfit,
    ...preservedMetadata,
    regionalStoreUrls,
    coverItemId: existingOutfit.coverItemId ?? outfit.coverItemId,
    itemIds: existingItemIds,
    itemNames: isManuallyCorrected
      ? (existingOutfit.itemNames ?? outfit.itemNames)
      : outfit.itemNames,
    corrected: existingOutfit.corrected,
    tags: existingOutfit.tags ?? outfit.tags,
    detailTags: existingOutfit.detailTags ?? outfit.detailTags,
    mappingSource: isManuallyCorrected
      ? 'manual'
      : (existingOutfit.mappingSource ?? outfit.mappingSource),
    needsMapping,
    notes: existingOutfit.notes ?? outfit.notes
  }
}

function buildStoreCatalog(outfits) {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sources: [
      {
        region: 'cn',
        url: CN_STORE_URL,
        note: '抓取自公开商品列表接口；用于保留国服商品名、国服链接和价格。未校正时不作为 itemIds 主数据源。'
      },
      {
        region: 'global',
        url: GLOBAL_STORE_URL,
        note: '有国际服商品链接时，优先使用国际服商品详情 items 与日文 Item.csv 映射 itemIds，并使用国际服 filter/icons 自动生成 tags/detailTags。'
      },
      {
        region: 'tw',
        url: 'https://www.ffxiv.com.tw/web/store/',
        note: '繁中服进度与其他服务器不同，只保留人工维护的地区链接并做格式校验；不从繁中服自动抓取商品、补漏或反推 itemIds。'
      }
    ],
    outfits
  }
}

function buildSummary(catalog, totalCount, output) {
  return {
    output: resolve(output),
    generatedAt: catalog.generatedAt,
    sourceProductCount: totalCount,
    outfitCount: catalog.outfits.length,
    mappedCount: catalog.outfits.filter((outfit) => outfit.itemIds.length > 0).length,
    globalMappedCount: catalog.outfits.filter((outfit) => outfit.mappingSource === 'global-store')
      .length,
    taggedCount: catalog.outfits.filter(
      (outfit) => (outfit.tags?.length ?? 0) > 0 || (outfit.detailTags?.length ?? 0) > 0
    ).length,
    needsMappingCount: catalog.outfits.filter((outfit) => outfit.needsMapping).length
  }
}

function getPreservedManualOutfits(existingCatalog, generatedOutfits) {
  if (!existingCatalog?.outfits) {
    return []
  }

  const generatedIds = new Set(generatedOutfits.map((outfit) => outfit.id))

  return existingCatalog.outfits.filter(
    (outfit) => outfit.corrected === true && !generatedIds.has(outfit.id)
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const outputPath = resolve(args.output)
  const armoireCatalog = JSON.parse(await readFile(resolve(args.armoireCatalog), 'utf8'))
  const jaItemCsv = await readJaItemCsv(args)
  const existingCatalog = await readExistingCatalog(outputPath)
  const existingOutfits = new Map(
    (existingCatalog?.outfits ?? []).map((outfit) => [outfit.id, outfit])
  )
  const nameIndex = buildNameIndex(armoireCatalog)
  const catalogItemIndex = buildCatalogItemIndex(armoireCatalog)
  const jaNameIndex = buildJaNameIndex(jaItemCsv)
  const globalTagsByProductId = await buildGlobalTagIndex()
  const { products, totalCount } = await fetchCnProducts()
  const baseOutfits = products
    .filter((product) => isStoreOutfitProduct(product, nameIndex, catalogItemIndex))
    .map((product) => buildOutfitFromCnProduct(product, nameIndex, catalogItemIndex))
    .filter((outfit) => outfit.productId && outfit.name)
    .map((outfit) =>
      mergeExistingCorrection(outfit, existingOutfits.get(outfit.id), args.preserveExisting)
    )
    .map(applyKnownGlobalLink)
  const baseGlobalProductIds = new Set(
    baseOutfits.map(getGlobalProductId).filter((productId) => productId > 0)
  )
  const globalProductIds = Array.from(
    new Set([...baseGlobalProductIds, ...GLOBAL_STANDALONE_PRODUCT_IDS])
  ).sort((left, right) => left - right)
  const globalProducts = await fetchGlobalProducts(globalProductIds)
  const enGlobalProducts = await fetchGlobalProducts(globalProductIds, 'en-us', 'USD')
  const globalStandaloneOutfits = GLOBAL_STANDALONE_PRODUCT_IDS.filter(
    (productId) => !baseGlobalProductIds.has(productId) && globalProducts.has(productId)
  )
    .map((productId) =>
      buildOutfitFromGlobalProduct(
        globalProducts.get(productId),
        jaNameIndex,
        catalogItemIndex,
        globalTagsByProductId,
        {
          en: enGlobalProducts.get(productId)
        }
      )
    )
    .filter((outfit) => outfit.productId && outfit.name)
    .map((outfit) =>
      mergeExistingCorrection(outfit, existingOutfits.get(outfit.id), args.preserveExisting)
    )
  const outfits = baseOutfits
    .map((outfit) =>
      applyGlobalProductData(
        outfit,
        globalProducts.get(getGlobalProductId(outfit)),
        jaNameIndex,
        catalogItemIndex,
        globalTagsByProductId,
        {
          en: enGlobalProducts.get(getGlobalProductId(outfit))
        }
      )
    )
    .concat(globalStandaloneOutfits)
    .concat(getPreservedManualOutfits(existingCatalog, baseOutfits.concat(globalStandaloneOutfits)))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
  const catalog = buildStoreCatalog(outfits)

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify(buildSummary(catalog, totalCount, outputPath), null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
