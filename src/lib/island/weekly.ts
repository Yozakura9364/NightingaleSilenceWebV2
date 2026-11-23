// 工房人气轮换的运行时推导。
//
// 背景（2026-11-22 分析，证据与过程见 docs/ai/MODULES/island.md）：
// - MJICraftworksPopularity 共 100 行，即完整 100 周轮换表；与 2022 年社区硬编码
//   副本逐行比对 100/100 一致，且与无人岛最初 6 周的社区逐制品记录匹配
//   （5 周 50/50 完全一致、1 周 47/50）。
// - 但"周 → 行"的映射由服务器下发（FFXIVClientStructs MJIManager.CurrentPopularity
//   为服务器值），非线性、非经典 LCG，无法从客户端数据推导任意周。
// 因此一期不自动判定"本周"；这里提供按游戏内面板状态识别当前行的工具逻辑，
// 以及经历史周样本核对的锚点（仅作参考标注，不用于预测未来周）。
import type { IslandRotationRow } from './types'

/** 人气档位：1 非常高 … 4 低（与 MJICraftworksPopularityType 倍率对应）。 */
export type IslandPopularityLevel = 1 | 2 | 3 | 4

/**
 * 已核对的历史周锚点：无人岛第 1~6 周（2022-08-23 起）对应的轮换行。
 * 来源：rosella500/IslandWorkshopSolver 仓库 Week1-6Supply.csv 社区记录，
 * 与本表逐制品比对（第 1 周 3/50 条目与当前表不一致，历史版本调整所致）。
 */
export const ISLAND_ROTATION_ANCHORS: ReadonlyArray<{
  week: number
  weekStart: string
  rotationId: string
  confidence: 'perfect' | 'partial'
}> = [
  { week: 1, weekStart: '2022-08-23', rotationId: '25', confidence: 'partial' },
  { week: 2, weekStart: '2022-08-30', rotationId: '83', confidence: 'perfect' },
  { week: 3, weekStart: '2022-09-06', rotationId: '31', confidence: 'perfect' },
  { week: 4, weekStart: '2022-09-13', rotationId: '51', confidence: 'perfect' },
  { week: 5, weekStart: '2022-09-20', rotationId: '96', confidence: 'perfect' },
  { week: 6, weekStart: '2022-09-27', rotationId: '32', confidence: 'perfect' }
]

/**
 * 按游戏内"供需确认"面板看到的人气状态识别当前轮换行。
 * constraints：制品 id → 人气档位（只需几件即可唯一定位）。
 * 返回满足全部约束的行；空约束返回空数组。
 */
export function identifyRotationRows(
  rotation: IslandRotationRow[],
  constraints: Record<string, IslandPopularityLevel>
): IslandRotationRow[] {
  const entries = Object.entries(constraints).filter(([, level]) => level >= 1 && level <= 4)
  if (!entries.length) {
    return []
  }
  return rotation.filter((row) => entries.every(([productId, level]) => row.values[productId] === level))
}
