import type { HousingRegionKey, HousingWorld } from './types'

/**
 * 国服服名与数据中心固定中文原文（国服专有名词，不做多语言）。
 * serverID 来自售楼中心前端官方映射（游戏内服务器 ID，非下拉索引）：
 * 陆行鸟 / 莫古力 / 猫小胖 / 豆豆柴 四个数据中心共 28 服。
 */
export interface CnServer {
  id: number
  name: string
  datacenter: string
}

export const cnServers: readonly CnServer[] = [
  { id: 1167, name: '红玉海', datacenter: '陆行鸟' },
  { id: 1081, name: '神意之地', datacenter: '陆行鸟' },
  { id: 1042, name: '拉诺西亚', datacenter: '陆行鸟' },
  { id: 1044, name: '幻影群岛', datacenter: '陆行鸟' },
  { id: 1060, name: '萌芽池', datacenter: '陆行鸟' },
  { id: 1173, name: '宇宙和音', datacenter: '陆行鸟' },
  { id: 1174, name: '沃仙曦染', datacenter: '陆行鸟' },
  { id: 1175, name: '晨曦王座', datacenter: '陆行鸟' },
  { id: 1172, name: '白银乡', datacenter: '莫古力' },
  { id: 1076, name: '白金幻象', datacenter: '莫古力' },
  { id: 1171, name: '神拳痕', datacenter: '莫古力' },
  { id: 1170, name: '潮风亭', datacenter: '莫古力' },
  { id: 1113, name: '旅人栈桥', datacenter: '莫古力' },
  { id: 1121, name: '拂晓之间', datacenter: '莫古力' },
  { id: 1166, name: '龙巢神殿', datacenter: '莫古力' },
  { id: 1176, name: '梦羽宝境', datacenter: '莫古力' },
  { id: 1043, name: '紫水栈桥', datacenter: '猫小胖' },
  { id: 1169, name: '延夏', datacenter: '猫小胖' },
  { id: 1106, name: '静语庄园', datacenter: '猫小胖' },
  { id: 1045, name: '摩杜纳', datacenter: '猫小胖' },
  { id: 1177, name: '海猫茶屋', datacenter: '猫小胖' },
  { id: 1178, name: '柔风海湾', datacenter: '猫小胖' },
  { id: 1179, name: '琥珀原', datacenter: '猫小胖' },
  { id: 1192, name: '水晶塔', datacenter: '豆豆柴' },
  { id: 1183, name: '银泪湖', datacenter: '豆豆柴' },
  { id: 1180, name: '太阳海岸', datacenter: '豆豆柴' },
  { id: 1186, name: '伊修加德', datacenter: '豆豆柴' },
  { id: 1201, name: '红茶川', datacenter: '豆豆柴' }
]

/** 国服数据中心展示顺序 */
export const cnDataCenterOrder: readonly string[] = ['陆行鸟', '莫古力', '猫小胖', '豆豆柴']

export function getCnServer(id: number): CnServer {
  const server = cnServers.find((item) => item.id === id)
  if (!server) {
    throw new Error(`Unknown CN housing server id: ${id}`)
  }
  return server
}

export function getCnServerOrDefault(id: number): CnServer {
  return cnServers.find((item) => item.id === id) ?? cnServers[2]
}

/** 国服按数据中心分组（服务器选择器 optgroup 用） */
export function groupCnServersByDataCenter(): Array<{
  dataCenterName: string
  servers: CnServer[]
}> {
  return cnDataCenterOrder.map((dataCenterName) => ({
    dataCenterName,
    servers: cnServers.filter((server) => server.datacenter === dataCenterName)
  }))
}

export const defaultServerIdByRegion: Record<HousingRegionKey, number> = {
  cn: 1042, // 拉诺西亚
  global: 44 // Anima (Mana)
}

/** 各地区共享的住宅区名本地化 key（国服 Area 与国际服 district_name 均映射到此） */
export const districtNameKeyBySlug: Record<string, string> = {
  mist: 'housing.district.mist',
  'the-lavender-beds': 'housing.district.lavenderBeds',
  lavender_beds: 'housing.district.lavenderBeds',
  'the-goblet': 'housing.district.goblet',
  goblet: 'housing.district.goblet',
  shirogane: 'housing.district.shirogane',
  empyreum: 'housing.district.empyreum'
}

export function resolveDistrictNameKey(name: string): string | null {
  const slug = name.trim().toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, '-')
  if (slug === 'lavender-beds') {
    return districtNameKeyBySlug['the-lavender-beds']
  }
  return districtNameKeyBySlug[slug] ?? null
}

/** 国际服数据中心展示排序（其余数据中心按 API 返回顺序排在后面） */
export const preferredDataCenterOrder: readonly string[] = [
  'Mana',
  'Elemental',
  'Gaia',
  'Meteor'
]

export function groupWorldsByDataCenter(worlds: readonly HousingWorld[]): Array<{
  datacenterName: string
  worlds: HousingWorld[]
}> {
  const groups = new Map<string, HousingWorld[]>()
  for (const world of worlds) {
    const list = groups.get(world.datacenterName) ?? []
    list.push(world)
    groups.set(world.datacenterName, list)
  }
  const preferred = preferredDataCenterOrder.filter((name) => groups.has(name))
  const rest = [...groups.keys()]
    .filter((name) => !preferredDataCenterOrder.includes(name))
    .sort((a, b) => a.localeCompare(b))
  return [...preferred, ...rest].map((datacenterName) => ({
    datacenterName,
    worlds: groups.get(datacenterName) ?? []
  }))
}
