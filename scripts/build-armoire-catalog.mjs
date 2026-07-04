import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const DEFAULT_BASE_URL =
  'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs'
const DEFAULT_OUTPUT = 'public/data/armoire-catalog.json'
const SCHEMA_VERSION = 'nsarmoire.catalog.v1'
const SOURCE_REPOSITORY = 'InfSein/ffxiv-datamining-mixed'
const SOURCE_REPOSITORY_URL = `https://github.com/${SOURCE_REPOSITORY}.git`
const SOURCE_BRANCH = 'master'
const SOURCE_FOLDER = 'chs'
const REQUIRED_FILES = ['Item.csv', 'Cabinet.csv', 'MirageStoreSetItem.csv', 'Stain.csv']
const EXCLUDED_IDENTICAL_EQUIP_SLOT_CATEGORY_IDS = new Set([6, 14, 17])
let gitSourceDirPromise

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    output: DEFAULT_OUTPUT,
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
  execFileSync('git', [
    'clone',
    '--depth=1',
    '--filter=blob:none',
    '--sparse',
    SOURCE_REPOSITORY_URL,
    cacheDir
  ], { stdio: 'ignore' })
  execFileSync('git', [
    '-C',
    cacheDir,
    'sparse-checkout',
    'set',
    '--no-cone',
    ...REQUIRED_FILES.map((fileName) => `${SOURCE_FOLDER}/${fileName}`)
  ], { stdio: 'ignore' })

  return join(cacheDir, SOURCE_FOLDER)
}

function parseCsv(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
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
  const normalized = String(value ?? '').trim().toLowerCase()
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

    dyes[dyeId] = {
      dyeId,
      name,
      color,
      shade: parseInteger(row[2]),
      subOrder: parseInteger(row[3])
    }
  }

  return dyes
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
    const hasModel = equipSlotCategoryId > 0 && (!isEmptyModelTuple(mainModel) || !isEmptyModelTuple(subModel))
    const isGlamourous = parseBoolean(row.IsGlamourous)
    const isCabinetStorable = cabinetItemIdSet.has(itemId)
    const isGlamourSetContainer = setContainerIds.has(itemId)
    const isGlamourSetPiece = setPieceIds.has(itemId)

    if (!hasModel && !isGlamourous && !isCabinetStorable && !isGlamourSetContainer && !isGlamourSetPiece) {
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

  console.log(JSON.stringify(buildSummary(catalog, outputPath), null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
