// 无人岛底图（用户提供 h1m213_m.png 压缩版，本地预览资产、gitignore，未授权前不构建外发）。
// 坐标→底图换算采用社区通用公式（与 ffxiv-teamcraft map.service 一致，map 772 size_factor=100）：
// percent = (coord - 1) × 50 × (sizeFactor/100) / 20.48；x/y 同式无翻转（y+ 朝南）。
export const ISLAND_MAP_BACKGROUND = '/data/ffxiv/island/map-island.webp'

export const ISLAND_MAP_SIZE_FACTOR = 100

export function islandCoordToPercent(coord: number, sizeFactor = ISLAND_MAP_SIZE_FACTOR): number {
  return ((coord - 1) * 50 * (sizeFactor / 100)) / 20.48
}
