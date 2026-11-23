// 无人岛公开数据类型。字段契约以 scripts/build-island-catalog.mjs 产物为准，
// 表映射见 docs/ai/MODULES/island.md。

export type IslandLocaleNames = Partial<
  Record<'zh' | 'en' | 'ja' | 'ko' | 'tc' | 'fr' | 'de', string>
>

export interface IslandSourceProvenance {
  url?: string
  locales?: string[]
  urls?: Record<string, string>
  source_batch_id?: string
  source_mode?: string
  detail?: string
}

export interface IslandDataFileBase {
  version: number
  schemaVersion: string
  generatedAt: string
  source: IslandSourceProvenance
}

/** 口袋物品引用（材料、产物、奖励等的公共形态） */
export interface IslandNamedRef {
  id?: string
  itemId: string
  /** Item.csv 图标 id（经幻化共享图标服务渲染） */
  icon?: number | null
  name: string
  names: IslandLocaleNames
}

export interface IslandMaterialEntry extends IslandNamedRef {
  amount: number
}

/** 素材图鉴（materials.json） */
export interface IslandMaterial {
  id: string
  itemId: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  categoryId: string
  toolId: string | null
  tool: {
    id: string
    keyItemId: string
    itemId: string
    icon: number | null
    name: string
    names: IslandLocaleNames
    unlockRank: number | null
  } | null
  gathering: {
    /** MJIGatheringItem.Map（0 主岛 / 1 洞窟区域），仅作分组参考 */
    map: number
    /** 游戏内 0-42 地图刻度坐标（社区换算桥接；null = 无坐标） */
    x: number | null
    y: number | null
    radius: number | null
  } | null
}

export interface IslandTool {
  id: string
  keyItemId: string
  itemId: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  /** 解锁开拓等级（社区桥接；null = 无门槛数据） */
  unlockRank: number | null
}

export interface IslandPouchCategory {
  id: string
  name: string
  names: IslandLocaleNames
}

export interface IslandManualRecipe {
  id: string
  product: IslandNamedRef | null
  keyItem: IslandNamedRef | null
  materials: IslandMaterialEntry[]
}

export interface IslandMaterialsFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.materials.v1'
  materials: IslandMaterial[]
  tools: IslandTool[]
  categories: IslandPouchCategory[]
  manualRecipes: IslandManualRecipe[]
}

/** 工房配方（workshop.json） */
export interface IslandWorkshopProduct {
  id: string
  itemId: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  themeIds: string[]
  materials: IslandMaterialEntry[]
  levelReq: number
  hours: number
  value: number
}

export interface IslandWorkshopTheme {
  id: string
  name: string
  names: IslandLocaleNames
}

export interface IslandMultiplierEntry {
  id: string
  supply?: number
  ratio: number
}

export interface IslandTensionLevel {
  id: string
  bonus: number
}

/** 岛建阶段固定作业参考路线（NGA 桥接解析后的制品条目） */
export interface IslandPhaseRouteProduct {
  id: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  hours?: number
  value?: number
}

export interface IslandPhaseRouteRank {
  rank: number
  newProducts: IslandPhaseRouteProduct[]
  routes: IslandPhaseRouteProduct[][]
}

export interface IslandWorkshopFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.workshop.v1'
  /** 工房产出货币（青船币 Seafarer's Cowrie） */
  currency: IslandCurrency
  products: IslandWorkshopProduct[]
  themes: IslandWorkshopTheme[]
  /** 岛建阶段固定作业参考路线（NGA 桥接） */
  phaseRoutes: {
    notes: string[]
    source: { url: string; role: string; fetchedAt: string }[] | null
    ranks: IslandPhaseRouteRank[]
  }
  popularityTypes: IslandMultiplierEntry[]
  supplyDefines: IslandMultiplierEntry[]
  rankRatios: IslandMultiplierEntry[]
  tensionLevels: IslandTensionLevel[]
}

/** 每周轮换（weekly.json）：100 行人气轮换表；行→周映射为服务器侧逻辑。 */
export interface IslandRotationRow {
  id: string
  /** 工房制品 id → 人气档位（1 非常高 … 4 低） */
  values: Record<string, number>
}

export interface IslandWeeklyFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.weekly.v1'
  rotation: IslandRotationRow[]
}

/** 动物刷新信息（来自登记来源的手工桥接；时段为艾欧泽亚时间） */
export interface IslandAnimalSpawn {
  x: number
  y: number
  weather?: { id: number; name: string; names: IslandLocaleNames }
  /** 出现的 ET 整点（0-23），与 durationHours 成对出现 */
  spawnHour?: number
  /** 持续 ET 小时数 */
  durationHours?: number
}

/** 牧场动物（animals.json） */
export interface IslandAnimal {
  id: string
  bnpcBaseId: string
  /** MJIAnimals.Icon 图鉴图标 */
  icon: number | null
  name: string
  names: IslandLocaleNames
  size: number
  rarity: number
  rewards: IslandNamedRef[]
  spawn: IslandAnimalSpawn | null
}

export interface IslandAnimalsFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.animals.v1'
  animals: IslandAnimal[]
}

/** 农田作物（crops.json） */
export interface IslandCrop {
  id: string
  /** 商店种子物品（MJIItemPouch.Crop 反查），不是 MJICropSeed.Item 的收获作物 */
  seedItemId: string
  seedIcon: number | null
  seedName: string
  seedNames: IslandLocaleNames
  /** 种子可购买的开拓等级（社区桥接；null = 无门槛数据） */
  seedUnlockRank: number | null
  /** 收获作物（MJICropSeed.Item） */
  crop: IslandNamedRef | null
  fieldNames: IslandLocaleNames
}

export interface IslandCropsFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.crops.v1'
  /** 农田生长/收获常量（wiki 桥接，客户端无字段） */
  growth: { hoursPerCycle: number; yieldPerPlot: number; noteZh: string; noteEn: string } | null
  crops: IslandCrop[]
}

/** 建筑与地标（buildings.json） */
export interface IslandStructure {
  id: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  materials: IslandMaterialEntry[]
}

export interface IslandBuildingsFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.buildings.v1'
  buildings: IslandStructure[]
  landmarks: IslandStructure[]
}

/** 开发等级（ranks.json） */
export interface IslandRank {
  rank: number
  expToNext: number
}

export interface IslandProgressStep {
  id: string
  vision: string
  objective: string
  names: { vision: IslandLocaleNames; objective: IslandLocaleNames }
}

/** 逐级解锁条目（feature 为事实性说明文本，其余为数据解析出的物品/设施） */
export interface IslandRankUnlock {
  kind: 'tool' | 'seed' | 'gather' | 'build' | 'feature'
  icon: number | null
  name?: string
  names?: IslandLocaleNames
  text?: { zh: string; en: string }
}

export interface IslandRanksFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.ranks.v1'
  ranks: IslandRank[]
  progress: IslandProgressStep[]
  /** 等级 → 具体解锁内容（'1'..'20'） */
  unlocks: Record<string, IslandRankUnlock[]>
}

/** 无人岛货币物品（青船币/绿岛币，名称图标直出 Item.csv） */
export interface IslandCurrency {
  itemId: string
  icon: number | null
  name: string
  names: IslandLocaleNames
}

/** 奖励兑换商店物品（rewards.json，SpecialShop 逐物品数组列解析） */
export interface IslandRewardItem {
  id: string
  itemId: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  price: number
  currency: IslandCurrency | null
  /** AchievementUnlock[i]：解锁该物品兑换资格的成就 id */
  achievementUnlock: string | null
  /** PatchNumber[i]：加入版本（如 620 = 6.2） */
  patch: string
}

export interface IslandRewardShop {
  shopId: string
  label: { zh: string; en: string } | null
  items: IslandRewardItem[]
}

export interface IslandRewardsFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.rewards.v1'
  shops: IslandRewardShop[]
}

/** 无人岛成就（achievements.json） */
export interface IslandAchievement {
  id: string
  name: string
  names: IslandLocaleNames
  description: string
  descriptions: IslandLocaleNames
  points: number
  title: { id: string; name: string; names: IslandLocaleNames } | null
  /** SpecialShop.AchievementUnlock 反查：该成就解锁的兑换物品 */
  unlockedItems: { shopId: string; itemId: string }[]
}

export interface IslandAchievementsFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.achievements.v1'
  achievements: IslandAchievement[]
}

/** 谷仓目的地（granary.json） */
export interface IslandGranaryDestination {
  area: number
  name: string
  areaNames: IslandLocaleNames
  rareMaterials: IslandNamedRef[]
  materials: IslandNamedRef[]
}

export interface IslandGranaryFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.granary.v1'
  destinations: IslandGranaryDestination[]
}

/** 珊瑚贝商店（shop.json） */
export interface IslandShopItem {
  id: string
  itemId: string
  icon: number | null
  name: string
  names: IslandLocaleNames
  price: number
  /** MJIDisposalShopItem.Currency：'0'=青船币 '1'=绿岛币 */
  currencyId: string
  categoryId: string
}

export interface IslandShopFile extends IslandDataFileBase {
  schemaVersion: 'ffxiv.island.shop.v1'
  currencies: Record<string, IslandCurrency>
  categories: IslandPouchCategory[]
  items: IslandShopItem[]
}
