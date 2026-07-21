import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
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

const DEFAULT_BASE_URL =
  'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs'
const DEFAULT_OUTPUT = 'public/data/armoire-catalog.json'
const DEFAULT_CABINET_CATALOG_OUTPUT = 'public/data/armoire-cabinet-catalog.json'
const DEFAULT_CATALOG_DISPLAY_OUTPUT = 'public/data/armoire-catalog-display-index.json'
const DEFAULT_ITEM_DISPLAY_CHUNK_DIR = 'public/data/armoire-item-display-chunks'
const DEFAULT_CABINET_ITEM_CHUNK_DIR = 'public/data/armoire-cabinet-item-chunks'
const DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT = 'public/data/armoire-glamour-set-catalog.json'
const DEFAULT_GLAMOUR_SET_CHUNK_DIR = 'public/data/armoire-glamour-set-chunks'
const DEFAULT_IDENTICAL_MODEL_CATALOG_OUTPUT = 'public/data/armoire-identical-model-catalog.json'
const DEFAULT_DYE_CATALOG_OUTPUT = 'public/data/armoire-dye-catalog.json'
const DEFAULT_CRAFTER_GATHERER_REPLICA_CATALOG_OUTPUT =
  'public/data/armoire-crafter-gatherer-replica-catalog.json'
const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const DEFAULT_STORE_ITEM_DISPLAY_OUTPUT = 'public/data/armoire-store-item-display-index.json'
const SCHEMA_VERSION = 'nsarmoire.catalog.v1'
const CABINET_CATALOG_SCHEMA_VERSION = 'nsarmoire.cabinetCatalog.v1'
const CATALOG_DISPLAY_SCHEMA_VERSION = 'nsarmoire.catalogDisplayIndex.v1'
const ITEM_DISPLAY_CHUNK_SCHEMA_VERSION = 'nsarmoire.itemDisplayChunk.v1'
const CABINET_ITEM_CHUNK_SCHEMA_VERSION = 'nsarmoire.cabinetItemChunk.v1'
const GLAMOUR_SET_CATALOG_SCHEMA_VERSION = 'nsarmoire.glamourSetCatalog.v1'
const GLAMOUR_SET_CHUNK_SCHEMA_VERSION = 'nsarmoire.glamourSetChunk.v1'
const IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION = 'nsarmoire.identicalModelCatalog.v1'
const DYE_CATALOG_SCHEMA_VERSION = 'nsarmoire.dyeCatalog.v1'
const CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION =
  'nsarmoire.crafterGathererReplicaCatalog.v1'
const STORE_ITEM_DISPLAY_SCHEMA_VERSION = 'nsarmoire.storeItemDisplayIndex.v1'
const ITEM_DISPLAY_CHUNK_SIZE = 2000
const SOURCE_REPOSITORY = 'InfSein/ffxiv-datamining-mixed'
const SOURCE_REPOSITORY_URL = `https://github.com/${SOURCE_REPOSITORY}.git`
const SOURCE_BRANCH = 'master'
const SOURCE_FOLDER = 'chs'
const REQUIRED_FILES = [
  'Item.csv',
  'Cabinet.csv',
  'CabinetCategory.csv',
  'CabinetSubCategory.csv',
  'Addon.csv',
  'MirageStoreSetItem.csv',
  'Stain.csv'
]
const ITEM_NAME_LOCALE_SOURCES = [
  { locale: 'zh-CN', folder: 'chs' },
  { locale: 'en', folder: 'en' },
  { locale: 'ja', folder: 'ja' },
  {
    locale: 'ko',
    url: 'https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Item.csv',
    repositoryUrl: 'https://github.com/Ra-Workspace/ffxiv-datamining-ko.git',
    repositoryPath: 'csv/Item.csv',
    localRelativePaths: ['ko/Item.csv', 'ffxiv-datamining-ko/csv/Item.csv']
  }
]
const EXCLUDED_IDENTICAL_EQUIP_SLOT_CATEGORY_IDS = new Set([6, 14, 17])
const EXTRA_DYE_1_IDS = new Set([86, 87, 88, 89, 90, 91, 92, 93, 94])
const EXTRA_DYE_2_IDS = new Set([95, 96, 97, 98, 99, 100, 121, 122, 123, 124, 125])
const STORE_SPECIAL_DYE_IDS = new Set([
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120
])
const CRAFTER_GATHERER_REPLICA_RARITY_VALUES = new Set([2, 3])
const CRAFTER_GATHERER_REPLICA_EQUIP_SLOT_CATEGORY_IDS = new Set([3, 4, 5, 7, 8])
const EXCLUDED_CRAFTER_GATHERER_REPLICA_ITEM_IDS = new Set([23343, 23344])
let gitSourceDirPromise
const localeGitFilePromises = new Map()

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    cabinetCatalogOutput: DEFAULT_CABINET_CATALOG_OUTPUT,
    cabinetItemChunkDir: DEFAULT_CABINET_ITEM_CHUNK_DIR,
    catalogDisplayOutput: DEFAULT_CATALOG_DISPLAY_OUTPUT,
    crafterGathererReplicaCatalogOutput: DEFAULT_CRAFTER_GATHERER_REPLICA_CATALOG_OUTPUT,
    dyeCatalogOutput: DEFAULT_DYE_CATALOG_OUTPUT,
    glamourSetCatalogOutput: DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT,
    glamourSetChunkDir: DEFAULT_GLAMOUR_SET_CHUNK_DIR,
    identicalModelCatalogOutput: DEFAULT_IDENTICAL_MODEL_CATALOG_OUTPUT,
    itemDisplayChunkDir: DEFAULT_ITEM_DISPLAY_CHUNK_DIR,
    output: DEFAULT_OUTPUT,
    storeCatalog: DEFAULT_STORE_CATALOG,
    storeItemDisplayOutput: DEFAULT_STORE_ITEM_DISPLAY_OUTPUT,
    sourceDir: ''
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--source-dir') {
      args.sourceDir = resolve(argv[index + 1] ?? '')
      index += 1
      continue
    }

    if (arg === '--output') {
      args.output = argv[index + 1] ?? DEFAULT_OUTPUT
      index += 1
      continue
    }

    if (arg === '--cabinet-catalog-output') {
      args.cabinetCatalogOutput = argv[index + 1] ?? DEFAULT_CABINET_CATALOG_OUTPUT
      index += 1
      continue
    }

    if (arg === '--catalog-display-output') {
      args.catalogDisplayOutput = argv[index + 1] ?? DEFAULT_CATALOG_DISPLAY_OUTPUT
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

    if (arg === '--glamour-set-catalog-output') {
      args.glamourSetCatalogOutput = argv[index + 1] ?? DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT
      index += 1
      continue
    }

    if (arg === '--glamour-set-chunk-dir') {
      args.glamourSetChunkDir = argv[index + 1] ?? DEFAULT_GLAMOUR_SET_CHUNK_DIR
      index += 1
      continue
    }

    if (arg === '--identical-model-catalog-output') {
      args.identicalModelCatalogOutput = argv[index + 1] ?? DEFAULT_IDENTICAL_MODEL_CATALOG_OUTPUT
      index += 1
      continue
    }

    if (arg === '--dye-catalog-output') {
      args.dyeCatalogOutput = argv[index + 1] ?? DEFAULT_DYE_CATALOG_OUTPUT
      index += 1
      continue
    }

    if (arg === '--crafter-gatherer-replica-catalog-output') {
      args.crafterGathererReplicaCatalogOutput =
        argv[index + 1] ?? DEFAULT_CRAFTER_GATHERER_REPLICA_CATALOG_OUTPUT
      index += 1
      continue
    }

    if (arg === '--store-item-display-output') {
      args.storeItemDisplayOutput = argv[index + 1] ?? DEFAULT_STORE_ITEM_DISPLAY_OUTPUT
      index += 1
      continue
    }

    if (arg === '--store-catalog') {
      args.storeCatalog = argv[index + 1] ?? DEFAULT_STORE_CATALOG
      index += 1
      continue
    }

    if (arg === '--base-url') {
      args.baseUrl = (argv[index + 1] ?? DEFAULT_BASE_URL).replace(/\/$/, '')
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Build NSArmoire static catalog from FFXIV datamining CSV.

Usage:
  node scripts/build-armoire-catalog.mjs
  node scripts/build-armoire-catalog.mjs --source-dir <datamining chs dir>

Options:
  --source-dir <dir>  Read CSV files from a local directory instead of GitHub raw URLs.
  --output <file>     Output JSON path. Default: ${DEFAULT_OUTPUT}
  --cabinet-catalog-output <file>
                      Output cabinet catalog path. Default: ${DEFAULT_CABINET_CATALOG_OUTPUT}
  --catalog-display-output <file>
                      Output catalog display index path. Default: ${DEFAULT_CATALOG_DISPLAY_OUTPUT}
  --item-display-chunk-dir <dir>
                      Output item display chunk directory. Default: ${DEFAULT_ITEM_DISPLAY_CHUNK_DIR}
  --cabinet-item-chunk-dir <dir>
                      Output cabinet item chunk directory. Default: ${DEFAULT_CABINET_ITEM_CHUNK_DIR}
  --glamour-set-catalog-output <file>
                      Output glamour set catalog path. Default: ${DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT}
  --glamour-set-chunk-dir <dir>
                      Output glamour set chunk directory. Default: ${DEFAULT_GLAMOUR_SET_CHUNK_DIR}
  --identical-model-catalog-output <file>
                      Output identical model catalog path. Default: ${DEFAULT_IDENTICAL_MODEL_CATALOG_OUTPUT}
  --dye-catalog-output <file>
                      Output dye catalog path. Default: ${DEFAULT_DYE_CATALOG_OUTPUT}
  --crafter-gatherer-replica-catalog-output <file>
                      Output crafter/gatherer replica recycle catalog path. Default: ${DEFAULT_CRAFTER_GATHERER_REPLICA_CATALOG_OUTPUT}
  --store-catalog <file>
                      Store catalog used to build display index. Default: ${DEFAULT_STORE_CATALOG}
  --store-item-display-output <file>
                      Output store item display index path. Default: ${DEFAULT_STORE_ITEM_DISPLAY_OUTPUT}
  --base-url <url>    Remote base URL. Default: ${DEFAULT_BASE_URL}
`)
}

async function readSourceFile(fileName, args) {
  if (args.sourceDir) {
    return readFile(join(args.sourceDir, fileName), 'utf8')
  }

  const url = `${args.baseUrl}/${fileName}`
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NightingaleSilence NSArmoire catalog builder'
      }
    })

    if (response.ok) {
      return response.text()
    }

    throw new Error(`${response.status} ${response.statusText}`)
  } catch (error) {
    console.warn(`Remote CSV fetch failed for ${fileName}; falling back to git sparse checkout.`)
    console.warn(String(error))
  }

  const gitSourceDir = await getGitSourceDir()
  return readFile(join(gitSourceDir, fileName), 'utf8')
}

async function readLocalizedItemFile(source, args) {
  const { locale, folder, url: sourceUrl, localRelativePaths = [] } = source

  if (folder === SOURCE_FOLDER) {
    return readSourceFile('Item.csv', args)
  }

  if (args.sourceDir) {
    const siblingRoot = dirname(args.sourceDir)
    const candidatePaths = [
      ...(folder ? [join(siblingRoot, folder, 'Item.csv')] : []),
      ...localRelativePaths.map((relativePath) => join(siblingRoot, relativePath))
    ]

    for (const candidatePath of candidatePaths) {
      try {
        return await readFile(candidatePath, 'utf8')
      } catch {
        // Try the next known local layout.
      }
    }

    console.warn(`Local ${locale} Item.csv not found; tried: ${candidatePaths.join(', ')}; skipping.`)
    return ''
  }

  const baseRootUrl = args.baseUrl.replace(new RegExp(`/${SOURCE_FOLDER}$`), '')
  const url = sourceUrl ?? `${baseRootUrl}/${folder}/Item.csv`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NightingaleSilence NSArmoire catalog builder'
      }
    })

    if (response.ok) {
      return response.text()
    }

    throw new Error(`${response.status} ${response.statusText}`)
  } catch (error) {
    console.warn(`Remote ${locale} Item.csv fetch failed; falling back to git sparse checkout if available.`)
    console.warn(String(error))
  }

  if (source.repositoryUrl && source.repositoryPath) {
    try {
      return await readLocaleGitFile(source)
    } catch (error) {
      console.warn(`${locale} Item.csv git sparse fallback failed; skipping.`)
      console.warn(String(error))
      return ''
    }
  }

  if (!folder) {
    console.warn(`${locale} Item.csv has no same-repository sparse fallback; skipping.`)
    return ''
  }

  const gitSourceDir = await getGitSourceDir()
  const gitItemPath = join(dirname(gitSourceDir), folder, 'Item.csv')

  try {
    return await readFile(gitItemPath, 'utf8')
  } catch {
    console.warn(`${locale} Item.csv not found at ${gitItemPath}; skipping.`)
    return ''
  }
}

async function getGitSourceDir() {
  gitSourceDirPromise ??= checkoutGitSourceDir()
  return gitSourceDirPromise
}

async function readLocaleGitFile(source) {
  const cacheKey = `${source.repositoryUrl}:${source.repositoryPath}`
  let filePromise = localeGitFilePromises.get(cacheKey)

  if (!filePromise) {
    filePromise = checkoutLocaleGitFile(source)
    localeGitFilePromises.set(cacheKey, filePromise)
  }

  return filePromise
}

async function checkoutLocaleGitFile(source) {
  const cacheDir = await mkdtemp(join(tmpdir(), 'nsarmoire-locale-csv-'))
  execFileSync(
    'git',
    ['clone', '--depth=1', '--filter=blob:none', '--sparse', source.repositoryUrl, cacheDir],
    { stdio: 'ignore' }
  )
  execFileSync(
    'git',
    ['-C', cacheDir, 'sparse-checkout', 'set', '--no-cone', source.repositoryPath],
    { stdio: 'ignore' }
  )

  return readFile(join(cacheDir, source.repositoryPath), 'utf8')
}

async function checkoutGitSourceDir() {
  const cacheDir = await mkdtemp(join(tmpdir(), 'nsarmoire-csv-'))
  execFileSync(
    'git',
    ['clone', '--depth=1', '--filter=blob:none', '--sparse', SOURCE_REPOSITORY_URL, cacheDir],
    { stdio: 'ignore' }
  )
  execFileSync(
    'git',
    [
      '-C',
      cacheDir,
      'sparse-checkout',
      'set',
      '--no-cone',
      ...REQUIRED_FILES.map((fileName) => `${SOURCE_FOLDER}/${fileName}`),
      ...ITEM_NAME_LOCALE_SOURCES.filter(
        (source) => source.folder && source.folder !== SOURCE_FOLDER
      ).map((source) => `${source.folder}/Item.csv`)
    ],
    { stdio: 'ignore' }
  )

  return join(cacheDir, SOURCE_FOLDER)
}

function parseBoolean(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return normalized === 'true' || normalized === '1'
}

function parseModelTuple(value) {
  return model.every((value) => value === 0)
}

function createModelKey(mainModel, subModel, itemUiCategoryId, equipSlotCategoryId) {
  if (
    equipSlotCategoryId <= 0 ||
    EXCLUDED_IDENTICAL_EQUIP_SLOT_CATEGORY_IDS.has(equipSlotCategoryId) ||
    itemUiCategoryId <= 0
  ) {
    return ''
  }

  if (isEmptyModelTuple(mainModel) && isEmptyModelTuple(subModel)) {
    return ''
  }

  return [
    `main:${mainModel.join('/')}`,
    `sub:${subModel.join('/')}`,
    `slot:${equipSlotCategoryId}`,
    `ui:${itemUiCategoryId}`
  ].join('|')
}

function buildCabinetItemIds(cabinetRows) {
  return Array.from(
    new Set(cabinetRows.map((row) => parseInteger(row.Item)).filter((itemId) => itemId > 0))
  ).sort((left, right) => left - right)
}

function buildAddonTextById(addonRows) {
  return new Map(
    addonRows
      .map((row) => [parseInteger(row['#']), cleanText(row.Text)])
      .filter(([addonId, text]) => addonId > 0 && text)
  )
}

function buildCabinetCategoryById(cabinetCategoryRows, addonRows) {
  const addonTextById = buildAddonTextById(addonRows)
  const categories = new Map()

  for (const row of cabinetCategoryRows) {
    const categoryId = parseInteger(row['#'])

    if (categoryId <= 0) {
      continue
    }

    const addonId = parseInteger(row.Category)
    const name = addonTextById.get(addonId) ?? ''

    categories.set(categoryId, {
      categoryId,
      categoryName: name,
      categoryMenuOrder: parseInteger(row.MenuOrder),
      categoryHideOrder: parseInteger(row.HideOrder),
      categoryIconId: parseInteger(row.Icon)
    })
  }

  return categories
}

function buildCabinetSubCategoryById(cabinetSubCategoryText) {
  const subCategories = new Map()

  for (const row of parseCsv(cabinetSubCategoryText).slice(3)) {
    const subCategoryId = parseInteger(row[0])

    if (subCategoryId <= 0) {
      continue
    }

    subCategories.set(subCategoryId, {
      subCategoryId,
      subCategoryOrder: parseInteger(row[1]),
      subCategoryName: cleanText(row[2])
    })
  }

  return subCategories
}

function pickDefinedObjectValues(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== '')
  )
}

function buildCabinetEntries(cabinetRows, cabinetCategoryRows, cabinetSubCategoryText, addonRows) {
  const categoryById = buildCabinetCategoryById(cabinetCategoryRows, addonRows)
  const subCategoryById = buildCabinetSubCategoryById(cabinetSubCategoryText)

  return cabinetRows
    .map((row) => {
      const categoryId = parseInteger(row.Category)
      const sortKey = parseInteger(row.SortKey)
      const category = categoryById.get(categoryId)
      const subCategory = subCategoryById.get(sortKey)

      return pickDefinedObjectValues({
        cabinetId: parseInteger(row['#']),
        itemId: parseInteger(row.Item),
        order: parseInteger(row.Order),
        sortKey,
        ...(category ?? (categoryId > 0 ? { categoryId } : {})),
        ...(subCategory ?? (sortKey > 0 ? { subCategoryId: sortKey } : {}))
      })
    })
    .filter((entry) => entry.cabinetId > 0 && entry.itemId > 0)
    .sort(
      (left, right) =>
        (left.categoryMenuOrder ?? 0) - (right.categoryMenuOrder ?? 0) ||
        (left.categoryId ?? 0) - (right.categoryId ?? 0) ||
        (left.subCategoryId ?? 0) - (right.subCategoryId ?? 0) ||
        (left.order ?? 0) - (right.order ?? 0) ||
        left.cabinetId - right.cabinetId
    )
}

function buildGlamourSetRows(mirageRows) {
  return mirageRows
    .map((row) => {
      const setItemId = parseInteger(row['#'])
      const pieceSlotItemIds = Array.from({ length: 9 }, (_, index) =>
        parseInteger(row[`Item[${index}]`])
      )
      const pieceItemIds = Array.from(
        new Set(pieceSlotItemIds.filter((itemId) => itemId > 0))
      )

      return { setItemId, pieceSlotItemIds, pieceItemIds }
    })
    .filter((set) => set.setItemId > 0 && set.pieceItemIds.length > 0)
    .sort((left, right) => left.setItemId - right.setItemId)
}

function buildDyes(stainText) {
  const rows = parseCsv(stainText)
  const dyes = {}

  for (const row of rows.slice(3)) {
    const dyeId = parseInteger(row[0])
    const colorValue = parseInteger(row[1])
    const name = cleanText(row[7] || row[6])
    const color = `#${(colorValue & 0xffffff).toString(16).toUpperCase().padStart(6, '0')}`

    const dye = {
      dyeId,
      name,
      color,
      shade: parseInteger(row[2]),
      subOrder: parseInteger(row[3])
    }
    const valueCategory = getDyeValueCategory(dyeId)

    if (valueCategory) {
      dye.valueCategory = valueCategory
    }

    dyes[dyeId] = dye
  }

  return dyes
}

function getDyeValueCategory(dyeId) {
  if (dyeId >= 1 && dyeId <= 85) {
    return 'general'
  }

  if (EXTRA_DYE_1_IDS.has(dyeId)) {
    return 'extra1'
  }

  if (EXTRA_DYE_2_IDS.has(dyeId)) {
    return 'extra2'
  }

  if (STORE_SPECIAL_DYE_IDS.has(dyeId)) {
    return 'storeSpecial'
  }

  return ''
}

function addIfPositive(record, key, value) {
  if (value > 0) {
    record[key] = value
  }
}

function buildItems(itemRows, cabinetItemIds, glamourSets, localizedNamesByItemId) {
  const cabinetItemIdSet = new Set(cabinetItemIds)
  const setContainerIds = new Set(glamourSets.map((set) => set.setItemId))
  const setPieceIds = new Set(glamourSets.flatMap((set) => set.pieceItemIds))
  const setPieceIdsByContainer = new Map(
    glamourSets.map((set) => [set.setItemId, set.pieceItemIds])
  )
  const items = {}
  const names = new Map()

  for (const row of itemRows) {
    const itemId = parseInteger(row['#'])
    if (itemId <= 0) {
      continue
    }

    const name = cleanText(row.Name)
    if (name) {
      names.set(itemId, name)
    }

    const itemUiCategoryId = parseInteger(row.ItemUICategory)
    const equipSlotCategoryId = parseInteger(row.EquipSlotCategory)
    const mainModel = parseModelTuple(row['Model{Main}'])
    const subModel = parseModelTuple(row['Model{Sub}'])
    const hasModel =
      equipSlotCategoryId > 0 && (!isEmptyModelTuple(mainModel) || !isEmptyModelTuple(subModel))
    const isGlamourous = parseBoolean(row.IsGlamourous)
    const isTradable = !parseBoolean(row.IsUntradable)
    const isCabinetStorable = cabinetItemIdSet.has(itemId)
    const isGlamourSetContainer = setContainerIds.has(itemId)
    const isGlamourSetPiece = setPieceIds.has(itemId)

    if (
      !hasModel &&
      !isGlamourous &&
      !isCabinetStorable &&
      !isGlamourSetContainer &&
      !isGlamourSetPiece
    ) {
      continue
    }

    const item = {
      itemId
    }

    if (name) {
      item.name = name
    }

    const localizedNames = localizedNamesByItemId.get(itemId)
    if (localizedNames && Object.keys(localizedNames).length > 0) {
      item.localizedNames = localizedNames
    }

    addIfPositive(item, 'iconId', parseInteger(row.Icon))
    addIfPositive(item, 'itemUiCategoryId', itemUiCategoryId)
    addIfPositive(item, 'equipSlotCategoryId', equipSlotCategoryId)

    item.isGlamourous = isGlamourous

    if (isTradable) {
      item.isTradable = true
    }

    if (isCabinetStorable) {
      item.isCabinetStorable = true
    }

    if (isGlamourSetContainer) {
      item.isGlamourSetContainer = true
      item.pieceItemIds = setPieceIdsByContainer.get(itemId) ?? []
    }

    const dyeSlotCount = parseInteger(row.DyeCount)
    if (dyeSlotCount > 0) {
      item.dyeSlotCount = dyeSlotCount
    }

    if (hasModel) {
      item.mainModel = mainModel
      item.subModel = subModel
    }

    items[itemId] = item
  }

  return { items, names }
}

function buildGlamourSets(glamourSetRows, names) {
  return glamourSetRows.map((set) => ({
    setItemId: set.setItemId,
    setName: names.get(set.setItemId),
    pieceSlotItemIds: set.pieceSlotItemIds,
    pieceItemIds: set.pieceItemIds
  }))
}

function buildIdenticalGroups(items) {
  const groups = new Map()

  for (const item of Object.values(items)) {
    if (!item.mainModel || !item.subModel || !item.itemUiCategoryId || !item.equipSlotCategoryId) {
      continue
    }

    const key = createModelKey(
      item.mainModel,
      item.subModel,
      item.itemUiCategoryId,
      item.equipSlotCategoryId
    )

    if (!key) {
      continue
    }

    const itemIds = groups.get(key) ?? []
    itemIds.push(item.itemId)
    groups.set(key, itemIds)
  }

  return Array.from(groups.entries())
    .filter(([, itemIds]) => itemIds.length > 1)
    .map(([key, itemIds]) => ({
      key,
      itemIds: itemIds.sort((left, right) => left - right)
    }))
    .sort((left, right) => left.key.localeCompare(right.key))
}

async function loadCsvSources(args) {
  const entries = await Promise.all(
    REQUIRED_FILES.map(async (fileName) => [fileName, await readSourceFile(fileName, args)])
  )
  const csvByFileName = Object.fromEntries(entries)

  csvByFileName.localizedItemCsvByLocale = Object.fromEntries(
    await Promise.all(
      ITEM_NAME_LOCALE_SOURCES.map(async (source) => [
        source.locale,
        await readLocalizedItemFile(source, args)
      ])
    )
  )

  return csvByFileName
}

function buildLocalizedNamesByItemId(localizedItemCsvByLocale) {
  const namesByItemId = new Map()

  for (const [locale, csvText] of Object.entries(localizedItemCsvByLocale ?? {})) {
    if (!csvText) {
      continue
    }

    for (const row of loadSheetRows(csvText)) {
      const itemId = parseInteger(row['#'])
      const name = cleanText(row.Name)

      if (itemId <= 0 || !name) {
        continue
      }

      const localizedNames = namesByItemId.get(itemId) ?? {}
      localizedNames[locale] = name
      namesByItemId.set(itemId, localizedNames)
    }
  }

  return namesByItemId
}

function buildCatalog(csvByFileName, args) {
  const itemRows = loadSheetRows(csvByFileName['Item.csv'])
  const cabinetRows = loadSheetRows(csvByFileName['Cabinet.csv'])
  const cabinetCategoryRows = loadSheetRows(csvByFileName['CabinetCategory.csv'])
  const mirageRows = loadSheetRows(csvByFileName['MirageStoreSetItem.csv'])
  const cabinetItemIds = buildCabinetItemIds(cabinetRows)
  const cabinetEntries = buildCabinetEntries(
    cabinetRows,
    cabinetCategoryRows,
    csvByFileName['CabinetSubCategory.csv'],
    loadSheetRows(csvByFileName['Addon.csv'])
  )
  const glamourSetRows = buildGlamourSetRows(mirageRows)
  const localizedNamesByItemId = buildLocalizedNamesByItemId(csvByFileName.localizedItemCsvByLocale)
  const { items, names } = buildItems(
    itemRows,
    cabinetItemIds,
    glamourSetRows,
    localizedNamesByItemId
  )
  const glamourSetItems = buildGlamourSets(glamourSetRows, names)
  const identicalGroups = buildIdenticalGroups(items)
  const dyes = buildDyes(csvByFileName['Stain.csv'])

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      repository: SOURCE_REPOSITORY,
      branch: SOURCE_BRANCH,
      folder: SOURCE_FOLDER,
      baseUrl: args.sourceDir ? undefined : args.baseUrl,
      sourceDir: args.sourceDir || undefined
    },
    items,
    cabinetItemIds,
    cabinetEntries,
    glamourSetItems,
    identicalGroups,
    dyes
  }
}

function buildSummary(catalog, output) {
  const sampleIds = [1675, 2673, 12117, 45094]
  const sampleItems = Object.fromEntries(
    sampleIds.map((itemId) => [itemId, Boolean(catalog.items[itemId])])
  )

  return {
    output: resolve(output),
    generatedAt: catalog.generatedAt,
    itemCount: Object.keys(catalog.items).length,
    cabinetItemCount: catalog.cabinetItemIds.length,
    cabinetEntryCount: catalog.cabinetEntries.length,
    glamourSetCount: catalog.glamourSetItems.length,
    identicalGroupCount: catalog.identicalGroups.length,
    dyeCount: Object.keys(catalog.dyes).length,
    sampleItems
  }
}

function buildDisplayItem(itemId, sourceItem) {
  const item = { itemId }

  if (sourceItem.name) {
    item.name = sourceItem.name
  }

  if (sourceItem.localizedNames && Object.keys(sourceItem.localizedNames).length > 0) {
    item.localizedNames = sourceItem.localizedNames
  }

  if (sourceItem.iconId) {
    item.iconId = sourceItem.iconId
  }

  return item
}

function buildDisplayTuple(itemId, sourceItem) {
  const tuple = [itemId]
  const hasIcon = sourceItem.iconId > 0
  const hasDyeSlotCount = sourceItem.dyeSlotCount > 0
  const isTradable = sourceItem.isTradable === true
  const hasLocalizedNames =
    sourceItem.localizedNames && Object.keys(sourceItem.localizedNames).length > 0

  if (sourceItem.name) {
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

  if (hasLocalizedNames) {
    if (tuple.length === 1) {
      tuple[1] = ''
    }

    if (!hasIcon) {
      tuple[2] = 0
    }

    if (!hasDyeSlotCount) {
      tuple[3] = 0
    }

    if (!isTradable) {
      tuple[4] = 0
    }

    tuple[5] = sourceItem.localizedNames
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

    items.push(buildDisplayTuple(itemId, sourceItem))
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
    const chunkItems = groupedItems.get(chunkKey) ?? []
    chunkItems.push(buildDisplayTuple(item.itemId, item))
    groupedItems.set(chunkKey, chunkItems)
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
  const itemIds = new Set()

  for (const set of catalog.glamourSetItems) {
    itemIds.add(set.setItemId)

    for (const itemId of set.pieceItemIds) {
      itemIds.add(itemId)
    }
  }

  const { items, missingItemIds } = collectDisplayTuples(catalog, itemIds)

  return {
    schemaVersion: GLAMOUR_SET_CATALOG_SCHEMA_VERSION,
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
  const itemIds = new Set(catalog.identicalGroups.flatMap((group) => group.itemIds))
  const { items, missingItemIds } = collectDisplayTuples(catalog, itemIds)

  return {
    schemaVersion: IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION,
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
    schemaVersion: DYE_CATALOG_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    dyes: catalog.dyes
  }
}

function isCrafterGathererReplicaRow(row) {
  const itemId = parseInteger(row['#'])
  const name = cleanText(row.Name)

  return (
    itemId > 0 &&
    name.includes('（复制品）') &&
    parseInteger(row['Level{Item}']) === 1 &&
    parseInteger(row['Level{Equip}']) === 1 &&
    CRAFTER_GATHERER_REPLICA_RARITY_VALUES.has(parseInteger(row.Rarity)) &&
    CRAFTER_GATHERER_REPLICA_EQUIP_SLOT_CATEGORY_IDS.has(
      parseInteger(row.EquipSlotCategory)
    ) &&
    !EXCLUDED_CRAFTER_GATHERER_REPLICA_ITEM_IDS.has(itemId)
  )
}

function buildCrafterGathererReplicaCatalog(catalog, itemRows) {
  const itemIds = uniqueSortedNumbers(
    itemRows.filter(isCrafterGathererReplicaRow).map((row) => parseInteger(row['#']))
  )
  const { items, missingItemIds } = collectDisplayTuples(catalog, itemIds)

  return {
    schemaVersion: CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    items,
    itemIds,
    excludedItemIds: Array.from(EXCLUDED_CRAFTER_GATHERER_REPLICA_ITEM_IDS).sort(
      (left, right) => left - right
    ),
    missingItemIds
  }
}

function buildCabinetCatalog(catalog) {
  const cabinetItemIds = Array.from(new Set(catalog.cabinetItemIds)).sort(
    (left, right) => left - right
  )
  const items = {}
  const missingItemIds = []

  for (const itemId of cabinetItemIds) {
    const sourceItem = catalog.items[itemId]

    if (!sourceItem) {
      missingItemIds.push(itemId)
      continue
    }

    items[itemId] = buildDisplayItem(itemId, sourceItem)
  }

  return {
    schemaVersion: CABINET_CATALOG_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt
    },
    items,
    cabinetItemIds,
    cabinetEntries: catalog.cabinetEntries,
    missingItemIds
  }
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

function collectStoreDisplayItemIds(storeCatalog) {
  const itemIds = new Set()

  if (!storeCatalog || !Array.isArray(storeCatalog.outfits)) {
    return itemIds
  }

  for (const outfit of storeCatalog.outfits) {
    if (Number.isInteger(outfit.coverItemId) && outfit.coverItemId > 0) {
      itemIds.add(outfit.coverItemId)
    }

    for (const itemId of outfit.itemIds ?? []) {
      if (Number.isInteger(itemId) && itemId > 0) {
        itemIds.add(itemId)
      }
    }
  }

  return itemIds
}

async function buildStoreItemDisplayIndex(catalog, storeCatalogPath) {
  const storeCatalog = await readJsonFile(storeCatalogPath)
  const itemIds = collectStoreDisplayItemIds(storeCatalog)
  const items = {}

  for (const itemId of Array.from(itemIds).sort((left, right) => left - right)) {
    const sourceItem = catalog.items[itemId]

    if (!sourceItem) {
      continue
    }

    items[itemId] = buildDisplayItem(itemId, sourceItem)
  }

  return {
    schemaVersion: STORE_ITEM_DISPLAY_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      catalogGeneratedAt: catalog.generatedAt,
      storeCatalogGeneratedAt: storeCatalog.generatedAt
    },
    items
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const csvByFileName = await loadCsvSources(args)
  const catalog = buildCatalog(csvByFileName, args)
  const outputPath = resolve(args.output)

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(catalog), 'utf8')

  const cabinetCatalog = buildCabinetCatalog(catalog)
  const cabinetCatalogOutputPath = resolve(args.cabinetCatalogOutput)

  await mkdir(dirname(cabinetCatalogOutputPath), { recursive: true })
  await writeFile(cabinetCatalogOutputPath, JSON.stringify(cabinetCatalog), 'utf8')

  const catalogDisplayIndex = buildCatalogDisplayIndex(catalog)
  const catalogDisplayOutputPath = resolve(args.catalogDisplayOutput)

  await mkdir(dirname(catalogDisplayOutputPath), { recursive: true })
  await writeFile(catalogDisplayOutputPath, JSON.stringify(catalogDisplayIndex), 'utf8')

  const itemDisplayChunks = buildItemDisplayChunks(catalog)
  const itemDisplayChunkOutputDir = await writeJsonDir(args.itemDisplayChunkDir, itemDisplayChunks)

  const cabinetItemChunks = buildCabinetItemChunks(catalog)
  const cabinetItemChunkOutputDir = await writeJsonDir(args.cabinetItemChunkDir, cabinetItemChunks)

  const glamourSetCatalog = buildGlamourSetCatalog(catalog)
  const glamourSetCatalogOutputPath = resolve(args.glamourSetCatalogOutput)

  await mkdir(dirname(glamourSetCatalogOutputPath), { recursive: true })
  await writeFile(glamourSetCatalogOutputPath, JSON.stringify(glamourSetCatalog), 'utf8')

  const glamourSetChunks = buildGlamourSetChunks(catalog)
  const glamourSetChunkOutputDir = await writeJsonDir(args.glamourSetChunkDir, glamourSetChunks)

  const identicalModelCatalog = buildIdenticalModelCatalog(catalog)
  const identicalModelCatalogOutputPath = resolve(args.identicalModelCatalogOutput)

  await mkdir(dirname(identicalModelCatalogOutputPath), { recursive: true })
  await writeFile(identicalModelCatalogOutputPath, JSON.stringify(identicalModelCatalog), 'utf8')

  const dyeCatalog = buildDyeCatalog(catalog)
  const dyeCatalogOutputPath = resolve(args.dyeCatalogOutput)

  await mkdir(dirname(dyeCatalogOutputPath), { recursive: true })
  await writeFile(dyeCatalogOutputPath, JSON.stringify(dyeCatalog), 'utf8')

  const crafterGathererReplicaCatalog = buildCrafterGathererReplicaCatalog(
    catalog,
    loadSheetRows(csvByFileName['Item.csv'])
  )
  const crafterGathererReplicaCatalogOutputPath = resolve(
    args.crafterGathererReplicaCatalogOutput
  )

  await mkdir(dirname(crafterGathererReplicaCatalogOutputPath), { recursive: true })
  await writeFile(
    crafterGathererReplicaCatalogOutputPath,
    JSON.stringify(crafterGathererReplicaCatalog),
    'utf8'
  )

  const storeItemDisplayIndex = await buildStoreItemDisplayIndex(catalog, args.storeCatalog)
  const storeItemDisplayOutputPath = resolve(args.storeItemDisplayOutput)

  await mkdir(dirname(storeItemDisplayOutputPath), { recursive: true })
  await writeFile(storeItemDisplayOutputPath, JSON.stringify(storeItemDisplayIndex), 'utf8')

  console.log(
    JSON.stringify(
      {
        ...buildSummary(catalog, outputPath),
        cabinetCatalog: {
          output: cabinetCatalogOutputPath,
          itemCount: Object.keys(cabinetCatalog.items).length,
          cabinetItemCount: cabinetCatalog.cabinetItemIds.length,
          cabinetEntryCount: cabinetCatalog.cabinetEntries.length,
          missingItemCount: cabinetCatalog.missingItemIds.length
        },
        catalogDisplayIndex: {
          output: catalogDisplayOutputPath,
          itemCount: catalogDisplayIndex.items.length,
          missingItemCount: catalogDisplayIndex.missingItemIds.length
        },
        itemDisplayChunks: {
          output: itemDisplayChunkOutputDir,
          chunkCount: itemDisplayChunks.length,
          itemCount: itemDisplayChunks.reduce((count, chunk) => count + chunk.items.length, 0)
        },
        cabinetItemChunks: {
          output: cabinetItemChunkOutputDir,
          chunkCount: cabinetItemChunks.length,
          itemCount: cabinetItemChunks.reduce((count, chunk) => count + chunk.items.length, 0),
          cabinetItemCount: cabinetItemChunks.reduce(
            (count, chunk) => count + chunk.cabinetItemIds.length,
            0
          ),
          missingItemCount: cabinetItemChunks.reduce(
            (count, chunk) => count + chunk.missingItemIds.length,
            0
          )
        },
        glamourSetCatalog: {
          output: glamourSetCatalogOutputPath,
          itemCount: glamourSetCatalog.items.length,
          glamourSetCount: glamourSetCatalog.glamourSetItems.length,
          missingItemCount: glamourSetCatalog.missingItemIds.length
        },
        glamourSetChunks: {
          output: glamourSetChunkOutputDir,
          chunkCount: glamourSetChunks.length,
          itemCount: glamourSetChunks.reduce((count, chunk) => count + chunk.items.length, 0),
          glamourSetCount: glamourSetChunks.reduce(
            (count, chunk) => count + chunk.glamourSetItems.length,
            0
          ),
          missingItemCount: glamourSetChunks.reduce(
            (count, chunk) => count + chunk.missingItemIds.length,
            0
          )
        },
        identicalModelCatalog: {
          output: identicalModelCatalogOutputPath,
          itemCount: identicalModelCatalog.items.length,
          identicalGroupCount: identicalModelCatalog.identicalGroups.length,
          missingItemCount: identicalModelCatalog.missingItemIds.length
        },
        dyeCatalog: {
          output: dyeCatalogOutputPath,
          dyeCount: Object.keys(dyeCatalog.dyes).length
        },
        crafterGathererReplicaCatalog: {
          output: crafterGathererReplicaCatalogOutputPath,
          itemCount: crafterGathererReplicaCatalog.itemIds.length,
          missingItemCount: crafterGathererReplicaCatalog.missingItemIds.length
        },
        storeItemDisplayIndex: {
          output: storeItemDisplayOutputPath,
          itemCount: Object.keys(storeItemDisplayIndex.items).length
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
