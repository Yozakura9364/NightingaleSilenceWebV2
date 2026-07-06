import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const DEFAULT_BASE_URL =
  'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs'
const DEFAULT_OUTPUT = 'public/data/armoire-catalog.json'
const DEFAULT_CABINET_CATALOG_OUTPUT = 'public/data/armoire-cabinet-catalog.json'
const DEFAULT_CATALOG_DISPLAY_OUTPUT = 'public/data/armoire-catalog-display-index.json'
const DEFAULT_ITEM_DISPLAY_CHUNK_DIR = 'public/data/armoire-item-display-chunks'
const DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT = 'public/data/armoire-glamour-set-catalog.json'
const DEFAULT_IDENTICAL_MODEL_CATALOG_OUTPUT = 'public/data/armoire-identical-model-catalog.json'
const DEFAULT_DYE_CATALOG_OUTPUT = 'public/data/armoire-dye-catalog.json'
const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const DEFAULT_STORE_ITEM_DISPLAY_OUTPUT = 'public/data/armoire-store-item-display-index.json'
const SCHEMA_VERSION = 'nsarmoire.catalog.v1'
const CABINET_CATALOG_SCHEMA_VERSION = 'nsarmoire.cabinetCatalog.v1'
const CATALOG_DISPLAY_SCHEMA_VERSION = 'nsarmoire.catalogDisplayIndex.v1'
const ITEM_DISPLAY_CHUNK_SCHEMA_VERSION = 'nsarmoire.itemDisplayChunk.v1'
const GLAMOUR_SET_CATALOG_SCHEMA_VERSION = 'nsarmoire.glamourSetCatalog.v1'
const IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION = 'nsarmoire.identicalModelCatalog.v1'
const DYE_CATALOG_SCHEMA_VERSION = 'nsarmoire.dyeCatalog.v1'
const STORE_ITEM_DISPLAY_SCHEMA_VERSION = 'nsarmoire.storeItemDisplayIndex.v1'
const ITEM_DISPLAY_CHUNK_SIZE = 2000
const SOURCE_REPOSITORY = 'InfSein/ffxiv-datamining-mixed'
const SOURCE_REPOSITORY_URL = `https://github.com/${SOURCE_REPOSITORY}.git`
const SOURCE_BRANCH = 'master'
const SOURCE_FOLDER = 'chs'
const REQUIRED_FILES = ['Item.csv', 'Cabinet.csv', 'MirageStoreSetItem.csv', 'Stain.csv']
const EXCLUDED_IDENTICAL_EQUIP_SLOT_CATEGORY_IDS = new Set([6, 14, 17])
const EXTRA_DYE_1_IDS = new Set([86, 87, 88, 89, 90, 91, 92, 93, 94])
const EXTRA_DYE_2_IDS = new Set([95, 96, 97, 98, 99, 100, 121, 122, 123, 124, 125])
const STORE_SPECIAL_DYE_IDS = new Set([
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120
])
let gitSourceDirPromise

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    cabinetCatalogOutput: DEFAULT_CABINET_CATALOG_OUTPUT,
    catalogDisplayOutput: DEFAULT_CATALOG_DISPLAY_OUTPUT,
    dyeCatalogOutput: DEFAULT_DYE_CATALOG_OUTPUT,
    glamourSetCatalogOutput: DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT,
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

    if (arg === '--glamour-set-catalog-output') {
      args.glamourSetCatalogOutput = argv[index + 1] ?? DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT
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
  --glamour-set-catalog-output <file>
                      Output glamour set catalog path. Default: ${DEFAULT_GLAMOUR_SET_CATALOG_OUTPUT}
  --identical-model-catalog-output <file>
                      Output identical model catalog path. Default: ${DEFAULT_IDENTICAL_MODEL_CATALOG_OUTPUT}
  --dye-catalog-output <file>
                      Output dye catalog path. Default: ${DEFAULT_DYE_CATALOG_OUTPUT}
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

async function getGitSourceDir() {
  gitSourceDirPromise ??= checkoutGitSourceDir()
  return gitSourceDirPromise
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
      ...REQUIRED_FILES.map((fileName) => `${SOURCE_FOLDER}/${fileName}`)
    ],
    { stdio: 'ignore' }
  )

  return join(cacheDir, SOURCE_FOLDER)
}

function parseCsv(text) {
  const normalized = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

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

  if (row.length > width) {
    return row.slice(0, width)
  }

  return row
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
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return 0
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseBoolean(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return normalized === 'true' || normalized === '1'
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/<(?:SoftHyphen|Indent)\s*\/>/gi, '')
    .trim()
}

function parseModelTuple(value) {
  const parts = String(value ?? '')
    .split(',')
    .map((part) => parseInteger(part))

  if (parts.length < 4) {
    return [0, 0, 0, 0]
  }

  return [parts[0], parts[1], parts[2], parts[3]]
}

function isEmptyModelTuple(model) {
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

function buildCabinetEntries(cabinetRows) {
  return cabinetRows
    .map((row) => ({
      cabinetId: parseInteger(row['#']),
      itemId: parseInteger(row.Item)
    }))
    .filter((entry) => entry.cabinetId > 0 && entry.itemId > 0)
    .sort((left, right) => left.cabinetId - right.cabinetId)
}

function buildGlamourSetRows(mirageRows) {
  return mirageRows
    .map((row) => {
      const setItemId = parseInteger(row['#'])
      const pieceItemIds = Array.from(
        new Set(
          Array.from({ length: 9 }, (_, index) => parseInteger(row[`Item[${index}]`])).filter(
            (itemId) => itemId > 0
          )
        )
      )

      return { setItemId, pieceItemIds }
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

function buildItems(itemRows, cabinetItemIds, glamourSets) {
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

    addIfPositive(item, 'iconId', parseInteger(row.Icon))
    addIfPositive(item, 'itemUiCategoryId', itemUiCategoryId)
    addIfPositive(item, 'equipSlotCategoryId', equipSlotCategoryId)

    item.isGlamourous = isGlamourous

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
  return Object.fromEntries(entries)
}

function buildCatalog(csvByFileName, args) {
  const itemRows = loadSheetRows(csvByFileName['Item.csv'])
  const cabinetRows = loadSheetRows(csvByFileName['Cabinet.csv'])
  const mirageRows = loadSheetRows(csvByFileName['MirageStoreSetItem.csv'])
  const cabinetItemIds = buildCabinetItemIds(cabinetRows)
  const cabinetEntries = buildCabinetEntries(cabinetRows)
  const glamourSetRows = buildGlamourSetRows(mirageRows)
  const { items, names } = buildItems(itemRows, cabinetItemIds, glamourSetRows)
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

  if (sourceItem.iconId) {
    item.iconId = sourceItem.iconId
  }

  return item
}

function buildDisplayTuple(itemId, sourceItem) {
  const tuple = [itemId]

  if (sourceItem.name) {
    tuple[1] = sourceItem.name
  }

  if (sourceItem.iconId) {
    if (tuple.length === 1) {
      tuple[1] = ''
    }

    tuple[2] = sourceItem.iconId
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

async function readJsonFile(path) {
  const text = await readFile(path, 'utf8')
  return JSON.parse(text)
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

  const glamourSetCatalog = buildGlamourSetCatalog(catalog)
  const glamourSetCatalogOutputPath = resolve(args.glamourSetCatalogOutput)

  await mkdir(dirname(glamourSetCatalogOutputPath), { recursive: true })
  await writeFile(glamourSetCatalogOutputPath, JSON.stringify(glamourSetCatalog), 'utf8')

  const identicalModelCatalog = buildIdenticalModelCatalog(catalog)
  const identicalModelCatalogOutputPath = resolve(args.identicalModelCatalogOutput)

  await mkdir(dirname(identicalModelCatalogOutputPath), { recursive: true })
  await writeFile(identicalModelCatalogOutputPath, JSON.stringify(identicalModelCatalog), 'utf8')

  const dyeCatalog = buildDyeCatalog(catalog)
  const dyeCatalogOutputPath = resolve(args.dyeCatalogOutput)

  await mkdir(dirname(dyeCatalogOutputPath), { recursive: true })
  await writeFile(dyeCatalogOutputPath, JSON.stringify(dyeCatalog), 'utf8')

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
        glamourSetCatalog: {
          output: glamourSetCatalogOutputPath,
          itemCount: glamourSetCatalog.items.length,
          glamourSetCount: glamourSetCatalog.glamourSetItems.length,
          missingItemCount: glamourSetCatalog.missingItemIds.length
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
