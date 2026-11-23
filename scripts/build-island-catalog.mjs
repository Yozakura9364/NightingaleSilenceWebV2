// 无人岛（Island Sanctuary）公开数据生成器。
// 消费冻结游戏数据批次（--source-batch / --source-root）中的 MJI* 与关联表，
// 产出 public/data/ffxiv/island/ 下按主题拆分的公开切片。
// 表映射与语义标注见 docs/ai/MODULES/island.md。
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadGameDataBatch, optionValue, publicSource } from './lib/game-data-batch.mjs'

const BATCH_LOCALES = ['chs', 'en', 'ja', 'ko', 'tc', 'fr', 'de']
// 批次 locale → 公开数据 locale 键（chs 对外为 zh，与 item-card-emotes 一致）。
const OUT_LOCALE = { chs: 'zh', en: 'en', ja: 'ja', ko: 'ko', tc: 'tc', fr: 'fr', de: 'de' }

const MJI_SHEETS = [
  'MJIRank',
  'MJIProgress',
  'MJIItemPouch',
  'MJIItemCategory',
  'MJIGatheringItem',
  'MJIGatheringTool',
  'MJIRecipe',
  'MJIRecipeMaterial',
  'MJIKeyItem',
  'MJICraftworksObject',
  'MJICraftworksObjectTheme',
  'MJICraftworksPopularity',
  'MJICraftworksPopularityType',
  'MJICraftworksSupplyDefine',
  'MJICraftworksRankRatio',
  'MJICraftworksTension',
  'MJIAnimals',
  'MJIBuilding',
  'MJILandmark',
  'MJICropSeed',
  'MJIDisposalShopItem',
  'MJIDisposalShopUICategory',
  'MJIStockyardManagementArea',
  'MJIStockyardManagementTable',
  'MJIText'
]
const EXTRA_SHEETS = ['EObjName', 'BNpcName', 'Item', 'Weather', 'SpecialShop', 'Achievement', 'Title']
const ALL_SHEETS = [...MJI_SHEETS, ...EXTRA_SHEETS]

const OUTPUT_DIR = new URL('../public/data/ffxiv/island/', import.meta.url)
const PRIMARY_SHEET = 'MJICraftworksObject'
// MJIAnimals → BNpcName / 刷新时段坐标 无游戏内外键，使用已登记来源的手工桥接（data/island/）。
const ANIMAL_NAME_MAP_URL = new URL('../data/island/animal-bnpc-name-map.json', import.meta.url)
const ANIMAL_SPAWN_MAP_URL = new URL('../data/island/animal-spawn-map.json', import.meta.url)
// 采集工具/种子的开拓等级解锁门槛（游戏 CSV 无此数据，社区 wiki 桥接）。
const UNLOCK_RANKS_URL = new URL('../data/island/unlock-ranks.json', import.meta.url)
// 素材采集点坐标（MJIGatheringItem X/Y 为原始内部值，展示坐标走社区换算桥接）。
const GATHERING_COORDS_URL = new URL('../data/island/gathering-coords.json', import.meta.url)
// 各开拓等级的具体解锁内容（游戏 CSV 无等级→解锁映射，社区 wiki 桥接）。
const RANK_UNLOCKS_URL = new URL('../data/island/rank-unlocks.json', import.meta.url)
// 岛建阶段工房固定作业参考路线（NGA 桥接，名称包含匹配工房制品）。
const PHASE_ROUTES_URL = new URL('../data/island/workshop-phase-routes.json', import.meta.url)
// 奖励兑换商店分组名（SpecialShop 无人岛相关行）。
const REWARD_GROUPS_URL = new URL('../data/island/reward-shop-groups.json', import.meta.url)
// 农田生长/收获常量（客户端无字段，wiki 桥接）。
const CROP_CYCLE_URL = new URL('../data/island/crop-cycle.json', import.meta.url)

function parseCsv(csv) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[index + 1] === '\n') {
        index += 1
      }
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell || row.length) {
    row.push(cell.trim())
    rows.push(row)
  }
  return rows
}

/** 解析 datamining CSV：返回 { fields, rows }；rows 为按字段名取值的对象数组。 */
function parseTable(csv) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''))
  const headerIndex = rows.findIndex((row) => row.includes('#'))
  if (headerIndex < 0) {
    throw new Error('Island CSV header row not found')
  }
  const fields = ['key', ...rows[headerIndex].slice(1)]
  const data = []
  for (const row of rows.slice(headerIndex + 1)) {
    if (
      !row.length ||
      String(row[0] || '').startsWith('#') ||
      !/^\d+(\.\d+)?$/.test(String(row[0] || ''))
    ) {
      continue
    }
    const entry = {}
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index]
      if (field) {
        entry[field] = row[index] ?? ''
      }
    }
    data.push(entry)
  }
  return { fields, rows: data }
}

function num(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function isFilled(value) {
  return value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '0'
}

/**
 * 引用型字段的非空判断：MJIItemPouch 等 id 空间里 0 是合法行（如棕榈叶），
 * 只有空字符串才算"未引用"；用于材料、分类等口袋引用。
 */
function isRef(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

// ---------------------------------------------------------------------------
// 输入装载
// ---------------------------------------------------------------------------

const sourceBatch = optionValue('--source-batch')
const sourceRoot = optionValue('--source-root')
const outputDir = optionValue('--output') || fileURLToPath(OUTPUT_DIR)
if (!sourceBatch && !sourceRoot) {
  throw new Error('Island catalog requires --source-batch or --source-root (frozen game-data batch)')
}

const batch = await loadGameDataBatch({
  sourceBatch,
  sourceRoot,
  requirements: Object.fromEntries(BATCH_LOCALES.map((locale) => [locale, ALL_SHEETS]))
})

const tables = new Map() // `${locale}/${sheet}` -> { fields, rows }
async function table(locale, sheet) {
  const key = `${locale}/${sheet}`
  if (!tables.has(key)) {
    const record = batch.sources.get(key)
    if (!record) {
      throw new Error(`Missing game-data dependency: ${key}`)
    }
    tables.set(key, parseTable(await readFile(record.file, 'utf8')))
  }
  return tables.get(key)
}

/** 主记录集（chs）行按 key 索引。 */
async function tableByKey(locale, sheet) {
  const { rows } = await table(locale, sheet)
  return new Map(rows.map((row) => [row.key, row]))
}

/** 跨 locale 名称索引：table 的 refKey 列 → locale → nameKey 列值。 */
async function nameIndex(sheet, refField, nameField) {
  const names = new Map() // refId -> { zh, en, ... }
  for (const locale of BATCH_LOCALES) {
    const { rows } = await table(locale, sheet)
    for (const row of rows) {
      const ref = row[refField]
      if (!ref) {
        continue
      }
      const value = row[nameField]
      if (!value) {
        continue
      }
      const entry = names.get(ref) ?? {}
      entry[OUT_LOCALE[locale]] = value
      names.set(ref, entry)
    }
  }
  return names
}

// ---------------------------------------------------------------------------
// 名称解析
// ---------------------------------------------------------------------------

const itemNames = await nameIndex('Item', 'key', 'Name').then(async (byName) => {
  // Item.csv 的 Name 列多数语言为空，回退 Singular。
  const bySingular = await nameIndex('Item', 'key', 'Singular')
  for (const [id, names] of bySingular) {
    for (const [locale, value] of Object.entries(names)) {
      if (!byName.get(id)?.[locale]) {
        const entry = byName.get(id) ?? {}
        entry[locale] = value
        byName.set(id, entry)
      }
    }
  }
  return byName
})
// 物品图标 id（语言无关，取 chs）；页面经幻化共享图标服务渲染。
const itemIcons = new Map()
{
  const { rows } = await table('chs', 'Item')
  for (const row of rows) {
    if (isFilled(row.Icon)) {
      const icon = num(row.Icon)
      if (icon > 0) {
        itemIcons.set(row.key, icon)
      }
    }
  }
}
const bnpcNames = await nameIndex('BNpcName', 'key', 'Singular')
const eobjNames = await nameIndex('EObjName', 'key', 'Singular')

// 动物名：MJIAnimals.id → BNpcName.id 使用登记来源的手工桥接。
const animalNameMapFile = JSON.parse(await readFile(fileURLToPath(ANIMAL_NAME_MAP_URL), 'utf8'))
const animalNameMap = animalNameMapFile.map ?? {}
const animalNames = new Map() // MJIAnimals key -> { locale: name }
for (const [animalId, bnpcNameId] of Object.entries(animalNameMap)) {
  const names = bnpcNames.get(String(bnpcNameId))
  if (names && Object.keys(names).length) {
    animalNames.set(String(animalId), names)
  }
}
// 动物刷新时段/坐标：MJIAnimals.id → { x, y, weather?, spawn?, duration? }（同源手工桥接）。
const animalSpawnMapFile = JSON.parse(await readFile(fileURLToPath(ANIMAL_SPAWN_MAP_URL), 'utf8'))
const animalSpawnMap = animalSpawnMapFile.map ?? {}
// 工具/种子解锁等级：itemId → 开拓等级。
const unlockRanksFile = JSON.parse(await readFile(fileURLToPath(UNLOCK_RANKS_URL), 'utf8'))
const toolUnlockRanks = unlockRanksFile.tools ?? {}
const cropUnlockRanks = unlockRanksFile.crops ?? {}
// 采集点坐标：itemId → { x, y, radius }（0-42 地图刻度）。
const gatheringCoordsFile = JSON.parse(await readFile(fileURLToPath(GATHERING_COORDS_URL), 'utf8'))
const gatheringCoords = gatheringCoordsFile.map ?? {}
// 等级解锁清单：rank → 条目数组（tool/seed/gather/build 解析为数据条目，feature 直传）。
const rankUnlocksFile = JSON.parse(await readFile(fileURLToPath(RANK_UNLOCKS_URL), 'utf8'))
// 岛建阶段工房路线桥接。
const phaseRoutesFile = JSON.parse(await readFile(fileURLToPath(PHASE_ROUTES_URL), 'utf8'))
const rewardGroupsFile = JSON.parse(await readFile(fileURLToPath(REWARD_GROUPS_URL), 'utf8'))
const cropCycleFile = JSON.parse(await readFile(fileURLToPath(CROP_CYCLE_URL), 'utf8'))

// 参考文献登记（社区攻略/维基，非数据来源，供页面展示与文档溯源）。
const ISLAND_REFERENCES = [
  {
    title: '无人岛工坊岛建阶段作业指南（NGA 玩家社区）',
    url: 'https://bbs.nga.cn/read.php?tid=34810413',
    role: '工房岛建阶段的作业排布方案参考',
    fetchedAt: '2026-11-23'
  },
  {
    title: '开拓无人岛（FF14 中文维基）',
    url: 'https://ff14.huijiwiki.com/wiki/%E5%BC%80%E6%8B%93%E6%97%A0%E4%BA%BA%E5%B2%9B',
    role: '无人岛机制综合参考',
    fetchedAt: '2026-11-23'
  }
]

// 无人岛货币物品（Item.csv 实名直出，客户端译名即 谢尔达莱青船币/绿岛币）。
// MJIDisposalShopItem.Currency 枚举方向依据售价结构校准：44 个基础素材全部定价 3 →
// 常见货币青船币（Seafarer's，与玩家大量持有一致）；35 个稀有素材定价 4~25 → 绿岛币（Islander's）。
// 工房制品产出同样为青船币。
const CURRENCY_ITEM_IDS = { seafarer: '37549', islander: '37550' }
function currencyInfo(itemId) {
  const names = itemNames.get(itemId) || {}
  return {
    itemId,
    icon: itemIcons.get(itemId) ?? null,
    name: displayName(names),
    names
  }
}
// 天气名（Weather.csv，标准艾欧泽亚天气 id；桥接数据中的 weather 使用同一 id 空间）。
const weatherNames = await nameIndex('Weather', 'key', 'Name')

function displayName(names) {
  return names?.zh || names?.en || ''
}

function localizedColumn(sheetByLocaleRows, field) {
  // sheetByLocaleRows: Map<locale, rows>；返回 key -> { locale: value }
  const result = new Map()
  for (const [locale, rows] of sheetByLocaleRows) {
    for (const row of rows) {
      const value = row[field]
      if (!value) {
        continue
      }
      const entry = result.get(row.key) ?? {}
      entry[OUT_LOCALE[locale]] = value
      result.set(row.key, entry)
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// 各主题切片
// ---------------------------------------------------------------------------

const pouchByKey = await tableByKey('chs', 'MJIItemPouch')
const gatheringItemByItem = new Map(
  (await table('chs', 'MJIGatheringItem')).rows.map((row) => [row.Item, row])
)
const toolByKey = await tableByKey('chs', 'MJIGatheringTool')
const keyItemByKey = await tableByKey('chs', 'MJIKeyItem')
const categoryByKey = await tableByKey('chs', 'MJIItemCategory')
const categoryNames = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'MJIItemCategory')).rows]))),
  'Singular'
)

function pouchItemName(pouchId) {
  const pouch = pouchByKey.get(pouchId)
  if (!pouch || !pouch.Item) {
    return null
  }
  const names = itemNames.get(pouch.Item)
  if (!names || !Object.keys(names).length) {
    return null
  }
  return {
    id: pouchId,
    itemId: pouch.Item,
    icon: itemIcons.get(pouch.Item) ?? null,
    name: displayName(names),
    names
  }
}

// materials.json —— 素材图鉴 + 采集 + 手工配方
/** 工具 id（MJIGatheringTool）→ 名称信息；经 MJIKeyItem 解析到真实物品，等级门槛走桥接。 */
function toolInfo(toolId) {
  const tool = toolId ? toolByKey.get(toolId) : null
  if (!tool || !isFilled(tool.Item)) {
    return null
  }
  const keyItem = keyItemByKey.get(tool.Item)
  const itemId = keyItem?.Item ?? ''
  const names = itemId ? itemNames.get(itemId) || {} : {}
  if (!Object.keys(names).length) {
    return null
  }
  const unlockRank = toolUnlockRanks[itemId]
  return {
    id: tool.key,
    keyItemId: tool.Item,
    itemId,
    icon: itemIcons.get(itemId) ?? null,
    name: displayName(names),
    names,
    ...(Number.isFinite(unlockRank) ? { unlockRank } : { unlockRank: null })
  }
}

const materialRows = [...pouchByKey.values()].filter((row) => isFilled(row.Item))
const materials = materialRows
  .map((row) => {
    const names = itemNames.get(row.Item)
    if (!names || !Object.keys(names).length) {
      return null
    }
    const gathering = gatheringItemByItem.get(row.Item)
    const coords = gatheringCoords[row.Item]
    return {
      id: row.key,
      itemId: row.Item,
      icon: itemIcons.get(row.Item) ?? null,
      name: displayName(names),
      names,
      categoryId: row.Category || '0',
      toolId: gathering && isFilled(gathering.Tool) ? gathering.Tool : null,
      tool: gathering ? toolInfo(gathering.Tool) : null,
      gathering: gathering
        ? {
            map: num(gathering.Map),
            // 展示坐标来自社区换算桥接（0-42 地图刻度）；MJIGatheringItem 原始 X/Y 不可用。
            x: Number.isFinite(coords?.x) ? coords.x : null,
            y: Number.isFinite(coords?.y) ? coords.y : null,
            radius: Number.isFinite(coords?.radius) ? coords.radius : null
          }
        : null
    }
  })
  .filter(Boolean)

const tools = [...toolByKey.values()]
  .map((row) => toolInfo(row.key))
  .filter(Boolean)

const categories = [...categoryByKey.values()]
  .map((row) => {
    const names = categoryNames.get(row.key) || {}
    return { id: row.key, name: names.zh || names.en || '', names }
  })
  .filter((category) => category.name)

const recipeMaterialByKey = await tableByKey('chs', 'MJIRecipeMaterial')
const manualRecipes = (await table('chs', 'MJIRecipe')).rows
  .map((row) => {
    const materials = []
    for (let index = 0; index <= 4; index += 1) {
      const materialRef = row[`Material[${index}]`]
      const amount = num(row[`Amount[${index}]`])
      if (!isRef(materialRef) || !amount) {
        continue
      }
      const recipeMaterial = recipeMaterialByKey.get(materialRef)
      const product = recipeMaterial ? pouchItemName(recipeMaterial.ItemPouch) : null
      if (product) {
        materials.push({ ...product, amount })
      }
    }
    const keyItem = keyItemByKey.get(row.KeyItem)
    const keyItemInfo = keyItem && isFilled(keyItem.Item)
      ? {
          id: keyItem.key,
          itemId: keyItem.Item,
          icon: itemIcons.get(keyItem.Item) ?? null,
          name: displayName(itemNames.get(keyItem.Item) || {}),
          names: itemNames.get(keyItem.Item) || {}
        }
      : null
    if (!materials.length && !isFilled(row.ItemPouch)) {
      return null
    }
    return {
      id: row.key,
      product: pouchItemName(row.ItemPouch),
      keyItem: keyItemInfo && keyItemInfo.name ? keyItemInfo : null,
      materials
    }
  })
  .filter((recipe) => recipe && (recipe.product || recipe.materials.length))

// workshop.json —— 工房配方 + 倍率
const themeNames = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'MJICraftworksObjectTheme')).rows]))),
  'Name'
)
const craftworksRows = (await table('chs', 'MJICraftworksObject')).rows.filter((row) => isFilled(row.Item))
const workshopProducts = craftworksRows
  .map((row) => {
    const names = itemNames.get(row.Item)
    if (!names || !Object.keys(names).length) {
      return null
    }
    const materials = []
    for (let index = 0; index <= 3; index += 1) {
      const materialRef = row[`Material[${index}]`]
      const amount = num(row[`Amount[${index}]`])
      if (!isRef(materialRef) || !amount) {
        continue
      }
      const material = pouchItemName(materialRef)
      if (material) {
        materials.push({ ...material, amount })
      }
    }
    const themeIds = [row['Theme[0]'], row['Theme[1]']].filter((id) => isFilled(id))
    return {
      id: row.key,
      itemId: row.Item,
      icon: itemIcons.get(row.Item) ?? null,
      name: displayName(names),
      names,
      themeIds,
      materials,
      levelReq: num(row.LevelReq),
      hours: num(row.CraftingTime),
      value: num(row.Value)
    }
  })
  .filter(Boolean)

const workshopThemes = (await table('chs', 'MJICraftworksObjectTheme')).rows
  .map((row) => {
    const names = themeNames.get(row.key) || {}
    return { id: row.key, name: names.zh || names.en || '', names }
  })
  .filter((theme) => theme.name)

// 岛建阶段固定作业参考路线：NGA 简称与工房制品中文名包含匹配（需唯一命中）。
const productsByZh = new Map()
for (const product of workshopProducts) {
  const zh = product.names.zh
  if (zh && !productsByZh.has(zh)) {
    productsByZh.set(zh, product)
  }
}
function resolvePhaseRouteProduct(shortName) {
  // 简称包含匹配（需唯一命中）；无法唯一解析时返回 null 并记录（离线 fixture 等小数据集允许整条跳过）。
  const matches = [...productsByZh.values()].filter((product) => (product.names.zh || '').includes(shortName))
  if (matches.length !== 1) {
    console.log(
      `WARN phase route product "${shortName}" matched ${matches.length} workshop products; entry skipped`
    )
    return null
  }
  return matches[0]
}
const unresolvedPhaseRouteEntries = []
const phaseRoutes = Object.entries(phaseRoutesFile.ranks ?? {}).map(([rank, config]) => ({
  rank: num(rank),
  newProducts: (config.newProducts ?? [])
    .map((name) => resolvePhaseRouteProduct(name))
    .filter((product) => {
      if (!product) {
        unresolvedPhaseRouteEntries.push(`${rank}:new:${product ?? ''}`)
        return false
      }
      return true
    })
    .map((product) => ({ id: product.id, icon: product.icon, name: product.name, names: product.names })),
  routes: (config.routes ?? []).map((route) =>
    route
      .map((name) => resolvePhaseRouteProduct(name))
      .map((product) => {
        if (!product) {
          unresolvedPhaseRouteEntries.push(`${rank}:route:${product ?? ''}`)
          return null
        }
        return {
          id: product.id,
          icon: product.icon,
          name: product.name,
          names: product.names,
          hours: product.hours,
          value: product.value
        }
      })
      .filter(Boolean)
  )
}))
if (unresolvedPhaseRouteEntries.length) {
  console.log(`WARN unresolved phase route entries: ${unresolvedPhaseRouteEntries.length}`)
}

function multiplierRows(sheet, extraField) {
  return (async () => {
    const { rows } = await table('chs', sheet)
    return rows
      .filter((row) => isFilled(row.key) && row.key !== '0')
      .map((row) => {
        const entry = { id: row.key, ratio: num(row.Ratio) }
        if (extraField && isFilled(row[extraField])) {
          entry.supply = num(row[extraField])
        }
        return entry
      })
  })()
}

const popularityTypes = await multiplierRows('MJICraftworksPopularityType')
const supplyDefines = await multiplierRows('MJICraftworksSupplyDefine', 'Supply')
const rankRatios = await multiplierRows('MJICraftworksRankRatio')
const tensionLevels = (await table('chs', 'MJICraftworksTension')).rows.map((row) => ({
  id: row.key,
  bonus: num(row[Object.keys(row).find((field) => field && field !== 'key') || ''])
}))

// weekly.json —— 100 周人气轮换表（周→行映射为服务器侧逻辑，见模块文档）
const validProductIds = new Set(workshopProducts.map((product) => product.id))
const weeklyRotation = (await table('chs', 'MJICraftworksPopularity')).rows.map((row) => {
  const values = {}
  for (let index = 0; index <= 90; index += 1) {
    const value = row[`Popularity[${index}]`]
    if (validProductIds.has(String(index)) && isFilled(value)) {
      values[String(index)] = num(value)
    }
  }
  return { id: row.key, values }
})

// animals.json —— 牧场动物
const animals = (await table('chs', 'MJIAnimals')).rows
  .filter((row) => isFilled(row.BNpcBase))
  .map((row) => {
    const names = animalNames.get(row.key) || {}
    const rewards = [row['Reward[0]'], row['Reward[1]']]
      .filter((itemId) => isFilled(itemId))
      .map((itemId) => {
        const rewardNames = itemNames.get(itemId) || {}
        return {
          itemId,
          icon: itemIcons.get(itemId) ?? null,
          name: displayName(rewardNames),
          names: rewardNames
        }
      })
      .filter((reward) => reward.name)
    const spawnRecord = animalSpawnMap[row.key]
    let spawn = null
    if (spawnRecord && Number.isFinite(spawnRecord.x) && Number.isFinite(spawnRecord.y)) {
      spawn = { x: spawnRecord.x, y: spawnRecord.y }
      if (Number.isFinite(spawnRecord.weather) && weatherNames.get(String(spawnRecord.weather))) {
        const weatherName = weatherNames.get(String(spawnRecord.weather))
        spawn.weather = {
          id: spawnRecord.weather,
          name: displayName(weatherName),
          names: weatherName
        }
      }
      if (Number.isFinite(spawnRecord.spawn) && Number.isFinite(spawnRecord.duration)) {
        spawn.spawnHour = spawnRecord.spawn
        spawn.durationHours = spawnRecord.duration
      }
    }
    return {
      id: row.key,
      bnpcBaseId: row.BNpcBase,
      icon: isFilled(row.Icon) ? num(row.Icon) : null,
      name: displayName(names),
      names,
      size: num(row.Size),
      rarity: num(row.Rarity),
      rewards,
      spawn
    }
  })

// crops.json —— 农田作物
const pouchByCrop = new Map()
for (const row of pouchByKey.values()) {
  if (isFilled(row.Crop)) {
    pouchByCrop.set(row.Crop, row)
  }
}
const crops = (await table('chs', 'MJICropSeed')).rows
  .filter((row) => isFilled(row.Item))
  .map((row) => {
    // MJICropSeed.Item 是收获作物；MJIItemPouch.Crop 反查到的物品才是商店种子。
    const cropNames = itemNames.get(row.Item) || {}
    const seedPouch = pouchByCrop.get(row.key)
    const seed = seedPouch ? pouchItemName(seedPouch.key) : null
    const fieldNames = eobjNames.get(row.Name) || {}
    const seedUnlockRank = seed ? cropUnlockRanks[seed.itemId] : undefined
    return {
      id: row.key,
      seedItemId: seed?.itemId ?? '',
      seedIcon: seed?.icon ?? null,
      seedName: seed?.name ?? '',
      seedNames: seed?.names ?? {},
      seedUnlockRank: Number.isFinite(seedUnlockRank) ? seedUnlockRank : null,
      crop: {
        id: row.key,
        itemId: row.Item,
        icon: itemIcons.get(row.Item) ?? null,
        name: displayName(cropNames),
        names: cropNames
      },
      fieldNames
    }
  })
  .filter((crop) => crop.seedName)

// buildings.json —— 建筑与地标
const mjiTextNames = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'MJIText')).rows]))),
  'Text'
)
function structureRows(sheet) {
  return (async () => {
    const { rows } = await table('chs', sheet)
    return rows
      .map((row) => {
        if (!isFilled(row.Name)) {
          return null
        }
        const names = mjiTextNames.get(row.Name) || {}
        if (!Object.keys(names).length) {
          return null
        }
        const materials = []
        for (let index = 0; index <= 4; index += 1) {
          const materialRef = row[`Material[${index}]`]
          const amount = num(row[`Amount[${index}]`])
          if (!isRef(materialRef) || !amount) {
            continue
          }
          const material = pouchItemName(materialRef)
          if (material) {
            materials.push({ ...material, amount })
          }
        }
        return { id: row.key, icon: isFilled(row.Icon) ? num(row.Icon) : null, name: displayName(names), names, materials }
      })
      .filter(Boolean)
  })()
}
const buildings = await structureRows('MJIBuilding')
const landmarks = await structureRows('MJILandmark')

// ranks.json —— 开发等级 + 岛屿进程 + 逐级解锁清单（桥接解析）
const toolsByItemId = new Map(tools.map((tool) => [tool.itemId, tool]))
const materialsByItemId = new Map(materials.map((material) => [material.itemId, material]))
const cropBySeedItemId = new Map(crops.map((crop) => [crop.seedItemId, crop]))
const buildablesByEn = new Map()
for (const structure of [...buildings, ...landmarks]) {
  const en = (structure.names?.en || '').toLowerCase()
  if (en && !buildablesByEn.has(en)) {
    buildablesByEn.set(en, structure)
  }
}

function resolveRankUnlock(entry) {
  if (entry.type === 'feature') {
    return { kind: 'feature', text: { zh: entry.zh, en: entry.en } }
  }
  let resolved = null
  if (entry.type === 'tool') {
    resolved = toolsByItemId.get(entry.itemId)
  } else if (entry.type === 'seed') {
    resolved = cropBySeedItemId.get(entry.itemId)
  } else if (entry.type === 'gather') {
    resolved = materialsByItemId.get(entry.itemId)
  } else if (entry.type === 'build') {
    resolved = buildablesByEn.get(String(entry.match || '').toLowerCase())
  }
  if (!resolved) {
    return null
  }
  if (entry.type === 'seed') {
    return {
      kind: entry.type,
      icon: resolved.seedIcon,
      name: resolved.seedName,
      names: resolved.seedNames
    }
  }
  return {
    kind: entry.type,
    icon: resolved.icon ?? null,
    name: resolved.name || displayName(resolved.names || {}),
    names: resolved.names || {}
  }
}

const rankUnlocks = {}
const unresolvedRankEntries = []
for (const [rank, entries] of Object.entries(rankUnlocksFile.ranks ?? {})) {
  const resolvedList = []
  for (const entry of entries) {
    const resolved = resolveRankUnlock(entry)
    if (resolved) {
      resolvedList.push(resolved)
    } else {
      unresolvedRankEntries.push(`${rank}:${entry.type}:${entry.itemId ?? entry.match ?? ''}`)
    }
  }
  if (resolvedList.length) {
    rankUnlocks[rank] = resolvedList
  }
}
if (unresolvedRankEntries.length) {
  console.log(`WARN unresolved rank unlock entries: ${unresolvedRankEntries.join(', ')}`)
}

const rankRows = (await table('chs', 'MJIRank')).rows
const ranks = rankRows
  .filter((row) => row.key !== '0')
  .map((row) => ({ rank: num(row.key), expToNext: num(row.ExpToNext) }))
const progressVision = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'MJIProgress')).rows]))),
  'Vision'
)
const progressObjective = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'MJIProgress')).rows]))),
  'Objective'
)
const progress = (await table('chs', 'MJIProgress')).rows
  .filter((row) => progressObjective.get(row.key)?.zh || progressObjective.get(row.key)?.en)
  .map((row) => ({
    id: row.key,
    vision: progressVision.get(row.key)?.zh || progressVision.get(row.key)?.en || '',
    objective: progressObjective.get(row.key)?.zh || progressObjective.get(row.key)?.en || '',
    names: {
      vision: progressVision.get(row.key) || {},
      objective: progressObjective.get(row.key) || {}
    }
  }))
  .filter((step) => step.objective)

// shop.json —— 珊瑚贝商店
const shopCategoryNames = localizedColumn(
  new Map(
    await Promise.all(
      BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'MJIDisposalShopUICategory')).rows])
    )
  ),
  'Category'
)
const shopCategories = (await table('chs', 'MJIDisposalShopUICategory')).rows
  .map((row) => {
    const names = shopCategoryNames.get(row.key) || {}
    return { id: row.key, name: names.zh || names.en || '', names }
  })
  .filter((category) => category.name)
const shopItems = (await table('chs', 'MJIDisposalShopItem')).rows
  .map((row) => {
    const product = pouchItemName(row.Item)
    if (!product) {
      return null
    }
    return {
      id: row.key,
      itemId: product.itemId,
      icon: product.icon ?? null,
      name: product.name,
      names: product.names,
      price: num(row.Count),
      currencyId: isRef(row.Currency) ? row.Currency : '0',
      categoryId: isRef(row.Category) ? row.Category : '0'
    }
  })
  .filter(Boolean)

// ---------------------------------------------------------------------------
// Provenance 与输出
// ---------------------------------------------------------------------------

// rewards.json —— 奖励兑换商店（SpecialShop 中货币为无人岛货币的行）
const REWARD_CURRENCY_IDS = new Set(['37549', '37550', '41668'])
const rewardShopGroups = rewardGroupsFile.groups ?? {}
const rewardGroupEntries = (await table('chs', 'SpecialShop')).rows
  .filter((row) => {
    for (let index = 0; index < 60; index += 1) {
      if (REWARD_CURRENCY_IDS.has(row[`Item{Cost}[${index}][0]`])) {
        return true
      }
    }
    return false
  })
  .map((row) => {
    const items = []
    for (let index = 0; index < 60; index += 1) {
      const itemId = row[`Item{Receive}[${index}][0]`]
      if (!isFilled(itemId)) {
        continue
      }
      const names = itemNames.get(itemId)
      if (!names || !Object.keys(names).length) {
        continue
      }
      const currencyItemId = row[`Item{Cost}[${index}][0]`]
      const currencyNames = currencyItemId ? itemNames.get(currencyItemId) || {} : {}
      items.push({
        id: `${row.key}-${index}`,
        itemId,
        icon: itemIcons.get(itemId) ?? null,
        name: displayName(names),
        names,
        price: num(row[`Count{Cost}[${index}][0]`]),
        currency: currencyItemId
          ? {
              itemId: currencyItemId,
              icon: itemIcons.get(currencyItemId) ?? null,
              name: displayName(currencyNames),
              names: currencyNames
            }
          : null,
        achievementUnlock: isFilled(row[`AchievementUnlock[${index}]`])
          ? row[`AchievementUnlock[${index}]`]
          : null,
        patch: row[`PatchNumber[${index}]`] || ''
      })
    }
    return { shopId: row.key, label: rewardShopGroups[row.key] ?? null, items }
  })
  .filter((group) => group.items.length > 0)

// achievements.json —— 无人岛成就 + 称号 + 商店解锁反查
const titleNames = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'Title')).rows]))),
  'Masculine'
)
const achievementNames = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'Achievement')).rows]))),
  'Name'
)
const achievementDescriptions = localizedColumn(
  new Map(await Promise.all(BATCH_LOCALES.map(async (locale) => [locale, (await table(locale, 'Achievement')).rows]))),
  'Description'
)
const unlockedByAchievement = new Map()
for (const group of rewardGroupEntries) {
  for (const item of group.items) {
    if (!item.achievementUnlock) {
      continue
    }
    const list = unlockedByAchievement.get(item.achievementUnlock) ?? []
    list.push({ shopId: group.shopId, itemId: item.itemId })
    unlockedByAchievement.set(item.achievementUnlock, list)
  }
}
const achievementEntries = (await table('chs', 'Achievement')).rows
  .filter((row) => (row.Name || '').includes('无人岛') || (row.Description || '').includes('无人岛'))
  .map((row) => {
    const names = achievementNames.get(row.key) || {}
    const descriptions = achievementDescriptions.get(row.key) || {}
    const title = titleNames.get(row.Title)
    return {
      id: row.key,
      name: displayName(names),
      names,
      description: displayName(descriptions),
      descriptions,
      points: num(row.Points),
      title: title
        ? { id: row.Title, name: displayName(title), names: title }
        : null,
      unlockedItems: unlockedByAchievement.get(row.key) ?? []
    }
  })

// granary.json —— 谷仓目的地候选产出（Area 1..6 → MJIText 39..43/71，顺序映射）
const GRANARY_AREA_TEXT_IDS = { 1: '39', 2: '40', 3: '41', 4: '42', 5: '43', 6: '71' }
const granaryAreaRows = (await table('chs', 'MJIStockyardManagementArea')).rows
const granaryTableRows = (await table('chs', 'MJIStockyardManagementTable')).rows
const granaryDestinations = new Map()
for (const row of granaryAreaRows) {
  const area = num(row.Area)
  const textId = GRANARY_AREA_TEXT_IDS[area]
  const names = textId ? mjiTextNames.get(textId) || {} : {}
  const rare = pouchItemName(row['Rare Material'])
  if (!rare) {
    continue
  }
  const entry = granaryDestinations.get(area) ?? {
    area,
    areaNames: names,
    name: displayName(names) || `Area ${area}`,
    rareMaterials: [],
    materials: []
  }
  entry.rareMaterials.push(rare)
  granaryDestinations.set(area, entry)
}
for (const row of granaryTableRows) {
  // ManagementTable 行 key 形如 0.0~5.10（区域 1~6 的 0 基序号），Area 列为 1 基。
  const area = num(String(row.key).split('.')[0]) + 1
  const material = pouchItemName(row.Material)
  if (!material) {
    continue
  }
  const entry = granaryDestinations.get(area)
  if (entry) {
    entry.materials.push(material)
  }
}
const granary = [...granaryDestinations.values()].sort((a, b) => a.area - b.area)

// ---------------------------------------------------------------------------
// Provenance 与输出
// ---------------------------------------------------------------------------

const primaryRecord = batch.sources.get(`chs/${PRIMARY_SHEET}`)
const perLocaleUrl = {}
for (const locale of BATCH_LOCALES) {
  const record = batch.sources.get(`${locale}/${PRIMARY_SHEET}`)
  perLocaleUrl[OUT_LOCALE[locale]] = record?.url || record?.path || ''
}
const filesDetail = {}
for (const locale of BATCH_LOCALES) {
  const localeFiles = {}
  for (const sheet of ALL_SHEETS) {
    const record = batch.sources.get(`${locale}/${sheet}`)
    if (record) {
      localeFiles[sheet] = publicSource(record)
    }
  }
  filesDetail[OUT_LOCALE[locale]] = localeFiles
}

const sharedSource = {
  url: primaryRecord?.url || primaryRecord?.path,
  locale: 'zh',
  locales: BATCH_LOCALES.map((locale) => OUT_LOCALE[locale]),
  urls: perLocaleUrl,
  ...(batch.batchId
    ? {
        source_batch_id: batch.batchId,
        source_mode: batch.sourceMode
      }
    : {})
}

const generatedAt = new Date().toISOString()

async function writeJson(name, payload) {
  const file = path.join(path.resolve(outputDir), name)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${name}`)
}

await writeJson('island-sources.json', {
  schemaVersion: 'ffxiv.island.sources.v1',
  version: 1,
  source: sharedSource,
  generatedAt,
  files: filesDetail,
  // 参考文献（社区攻略/维基）。
  references: ISLAND_REFERENCES,
  // 游戏数据之外的手工桥接登记（动物名/刷新时段/解锁等级/采集坐标/等级解锁清单/岛建路线/商店分组/农田常量）。
  bridges: [animalNameMapFile, animalSpawnMapFile, unlockRanksFile, gatheringCoordsFile, rankUnlocksFile, phaseRoutesFile, cropCycleFile, rewardGroupsFile].map((bridge) => ({
    schemaVersion: bridge.schemaVersion,
    note: bridge.note,
    source: bridge.source
  }))
})

await writeJson('materials.json', {
  schemaVersion: 'ffxiv.island.materials.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  materials,
  tools,
  categories,
  manualRecipes
})

await writeJson('workshop.json', {
  schemaVersion: 'ffxiv.island.workshop.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  currency: currencyInfo(CURRENCY_ITEM_IDS.seafarer),
  products: workshopProducts,
  themes: workshopThemes,
  // 岛建阶段固定作业参考路线（NGA 桥接，含 notes 摘录）。
  phaseRoutes: {
    notes: phaseRoutesFile.notes ?? [],
    source: phaseRoutesFile.source ?? null,
    ranks: phaseRoutes
  },
  popularityTypes,
  supplyDefines,
  rankRatios,
  tensionLevels
})

await writeJson('weekly.json', {
  schemaVersion: 'ffxiv.island.weekly.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  rotation: weeklyRotation
})

await writeJson('animals.json', {
  schemaVersion: 'ffxiv.island.animals.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  // 动物名 MJIAnimals→BNpcName 桥接的登记来源（游戏 CSV 无直接外键）。
  nameBridge: animalNameMapFile.source ?? null,
  animals
})

await writeJson('crops.json', {
  schemaVersion: 'ffxiv.island.crops.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  // 农田生长/收获常量（客户端无字段，wiki 桥接）。
  growth: cropCycleFile.growth ?? null,
  crops
})

await writeJson('buildings.json', {
  schemaVersion: 'ffxiv.island.buildings.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  buildings,
  landmarks
})

await writeJson('ranks.json', {
  schemaVersion: 'ffxiv.island.ranks.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  ranks,
  progress,
  // 逐级解锁（桥接清单解析；feature 文案为 AI 依据 wiki 起草待审校）
  unlocks: rankUnlocks
})

await writeJson('shop.json', {
  schemaVersion: 'ffxiv.island.shop.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  currencies: {
    '0': currencyInfo(CURRENCY_ITEM_IDS.islander),
    '1': currencyInfo(CURRENCY_ITEM_IDS.seafarer)
  },
  categories: shopCategories,
  items: shopItems
})

await writeJson('rewards.json', {
  schemaVersion: 'ffxiv.island.rewards.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  shops: rewardGroupEntries
})

await writeJson('achievements.json', {
  schemaVersion: 'ffxiv.island.achievements.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  achievements: achievementEntries
})

await writeJson('granary.json', {
  schemaVersion: 'ffxiv.island.granary.v1',
  version: 1,
  source: { ...sharedSource, detail: 'island-sources.json' },
  generatedAt,
  destinations: granary
})

console.log(
  `Island catalog: ${materials.length} materials, ${workshopProducts.length} workshop products, ` +
    `${animals.length} animals, ${crops.length} crops, ${buildings.length} buildings, ` +
    `${landmarks.length} landmarks, ${ranks.length} ranks, ${shopItems.length} shop items, ` +
    `${weeklyRotation.length} rotation rows`
)
