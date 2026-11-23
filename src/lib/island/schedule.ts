// 无人岛工房排程规划器（纯逻辑，不碰 DOM/存储/网络）。
//
// 机制口径：
// - 一周 7 个周期（cycle），每周期最多 4 个工房、各排满 24 小时；周期 1 固定休息
//   （周重置当天），其余周期再选一个休息周期，共 5 个制作周期。
// - 制品耗时 4/6/8 小时，按工房等级（LevelReq）过滤。
// - 收益估算 = 基础价值 × 人气倍率 × 干劲加成。供需倍率随玩家制作动态变化，
//   无法离线推导，估算按中性处理，由 UI 说明。
// - 干劲（groove）：同一工房当日内按制作位置递增加成（表值 10..45 对应第 2..N 个）。
// - 规划策略（确定性贪心，供对照游戏内供需后微调）：按分数降序轮换取队内未制作过
//   的制品填满 24h（避免相邻重复以吃满干劲）；工房 1-3 共用队列，工房 4 完全错开，
//   降低材料挤兑。

import type { IslandLocaleNames } from './types'

export type IslandPopularityLevel = 1 | 2 | 3 | 4

export interface ScheduleProduct {
  id: string
  name: string
  names: IslandLocaleNames
  icon: number | null
  hours: number
  value: number
  levelReq: number
  materials: { name: string; amount: number }[]
}

export interface PlannedCraft {
  productId: string
  name: string
  icon: number | null
  hours: number
  /** 期望价值（基础价值 × 人气倍率 × 干劲加成，已取整） */
  estimatedValue: number
}

export interface PlannedWorkshop {
  workshop: number
  crafts: PlannedCraft[]
  totalHours: number
  estimatedTotal: number
}

export interface PlannedCycle {
  cycle: number
  rest: boolean
  workshops: PlannedWorkshop[]
  /** 本周期全部工房的材料消耗合计（材料名 → 数量） */
  materialTotals: Record<string, number>
  estimatedTotal: number
}

export interface WeeklyPlan {
  cycles: PlannedCycle[]
  weeklyEstimatedTotal: number
}

export interface WeeklyPlanOptions {
  /** 人气档位（制品 id → 1..4）；固定模式传全 3 */
  popularity: Record<string, IslandPopularityLevel>
  /** 人气档位倍率（来自 MJICraftworksPopularityType） */
  popularityRatios: Record<IslandPopularityLevel, number>
  /** 干劲加成表（第 2..N 个制品的加成百分数，如 [10,15,20,25,35,45]） */
  grooveBonuses: number[]
  /** 工房等级（1-4，过滤 LevelReq） */
  workshopLevel: number
  /** 第二个休息周期（2-7；周期 1 固定休息） */
  restCycle: number
  /** 一周周期数（默认 7） */
  cycles?: number
  /** 工房数量（默认 4） */
  workshops?: number
}

function grooveBonusAt(grooveBonuses: number[], position: number): number {
  if (position <= 0) {
    return 0
  }
  const index = position - 1
  if (index < grooveBonuses.length) {
    return grooveBonuses[index]
  }
  return grooveBonuses.length ? grooveBonuses[grooveBonuses.length - 1] : 0
}

/**
 * 贪心组装一条 24h 队列：按分数序取“队内尚未制作过”的制品，凑不出时才允许
 * 复用（只要不与上一个相邻）。skipIds 的制品完全避开（用于工房 4 错开）。
 */
function buildQueue(
  sorted: ScheduleProduct[],
  scores: Map<string, number>,
  skipIds: Set<string>,
  hoursPerCycle = 24
): PlannedCraft[] {
  const crafts: PlannedCraft[] = []
  let remaining = hoursPerCycle
  let lastId = ''
  while (remaining > 0) {
    const usable = sorted.filter(
      (product) => product.hours <= remaining && !skipIds.has(product.id) && product.id !== lastId
    )
    if (!usable.length) {
      // 兜底：放宽 skip 与相邻限制，尽量填满
      const fallback = sorted.filter((product) => product.hours <= remaining)
      if (!fallback.length) {
        break
      }
      const pick = fallback[0]
      crafts.push({
        productId: pick.id,
        name: pick.name,
        icon: pick.icon,
        hours: pick.hours,
        estimatedValue: 0
      })
      remaining -= pick.hours
      lastId = pick.id
      continue
    }
    const fresh = usable.filter((product) => !crafts.some((craft) => craft.productId === product.id))
    const pick = (fresh.length ? fresh : usable)[0]
    crafts.push({
      productId: pick.id,
      name: pick.name,
      icon: pick.icon,
      hours: pick.hours,
      estimatedValue: 0
    })
    remaining -= pick.hours
    lastId = pick.id
  }
  // 分数仅用于排序，这里按最终位置补上收益估算
  void scores
  return crafts
}

export function planWeeklySchedule(
  products: ScheduleProduct[],
  options: WeeklyPlanOptions
): WeeklyPlan {
  const {
    popularity,
    popularityRatios,
    grooveBonuses,
    workshopLevel,
    restCycle,
    cycles: cycleCount = 7,
    workshops: workshopCount = 4
  } = options

  const ratioOf = (productId: string) =>
    popularityRatios[popularity[productId] ?? 3] ?? 1

  const eligible = products.filter((product) => product.levelReq <= workshopLevel && product.value > 0)
  const sorted = [...eligible].sort((a, b) => {
    const scoreA = a.value * ratioOf(a.id)
    const scoreB = b.value * ratioOf(b.id)
    return scoreB - scoreA || b.hours - a.hours
  })
  const byId = new Map(eligible.map((product) => [product.id, product]))
  const scores = new Map(sorted.map((product) => [product.id, product.value * ratioOf(product.id)]))

  const primaryQueue = buildQueue(sorted, scores, new Set())
  const skipForLast = new Set(primaryQueue.map((craft) => craft.productId))
  const secondaryQueue = buildQueue(sorted, scores, skipForLast)

  const restCycles = new Set([1, restCycle].filter((cycle) => cycle >= 1 && cycle <= cycleCount))
  const cycles: PlannedCycle[] = []
  let weeklyEstimatedTotal = 0

  for (let cycle = 1; cycle <= cycleCount; cycle += 1) {
    if (restCycles.has(cycle)) {
      cycles.push({ cycle, rest: true, workshops: [], materialTotals: {}, estimatedTotal: 0 })
      continue
    }
    const queues = Array.from({ length: workshopCount }, (_, index) =>
      index === workshopCount - 1 ? secondaryQueue : primaryQueue
    )
    const materialTotals: Record<string, number> = {}
    let estimatedTotal = 0
    const workshops: PlannedWorkshop[] = queues.map((crafts, index) => {
      let workshopTotal = 0
      const planned: PlannedCraft[] = crafts.map((craft, position) => {
        const product = byId.get(craft.productId)
        const groove = grooveBonusAt(grooveBonuses, position)
        const estimatedValue = Math.round(
          (product?.value ?? 0) * ratioOf(craft.productId) * (1 + groove / 100)
        )
        workshopTotal += estimatedValue
        for (const material of product?.materials ?? []) {
          materialTotals[material.name] = (materialTotals[material.name] ?? 0) + material.amount
        }
        return { ...craft, estimatedValue }
      })
      return {
        workshop: index + 1,
        crafts: planned,
        totalHours: planned.reduce((sum, craft) => sum + craft.hours, 0),
        estimatedTotal: workshopTotal
      }
    })
    estimatedTotal = workshops.reduce((sum, workshop) => sum + workshop.estimatedTotal, 0)
    weeklyEstimatedTotal += estimatedTotal
    cycles.push({ cycle, rest: false, workshops, materialTotals, estimatedTotal })
  }

  return { cycles, weeklyEstimatedTotal: Math.round(weeklyEstimatedTotal) }
}
