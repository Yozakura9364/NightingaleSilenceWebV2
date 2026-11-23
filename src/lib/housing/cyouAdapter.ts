import { useFetch } from '@/composables/useFetch'
import { resolveDistrictNameKey } from './regions'
import type {
  HousingPlot,
  HousingServerData,
  PlotAudience,
  PlotPhase,
  PlotSize,
  PurchaseMethod
} from './types'

/**
 * 国服数据来自「艾欧泽亚售楼中心」（house.ffxiv.cyou，镜像 househelper.ffxiv.cyou），
 * 由玩家上报众包。API 要求标注数据来源并避免高频请求；
 * 浏览器无法自定义 User-Agent，因此仅以低频请求 + 页面来源标注遵守其规范。
 */

const CN_HOSTS = ['https://house.ffxiv.cyou', 'https://househelper.ffxiv.cyou'] as const

interface CnSaleItem {
  Server: number
  Area: number
  Slot: number
  ID: number
  Price: number
  Size: number
  FirstSeen: number
  LastSeen: number
  PurchaseType: number
  RegionType: number
  State: number
  Participate: number
  Winner: number
  EndTime: number
  UpdateTime: number
}

interface CnUpdateTime {
  Time: number
}

/** 国服区域 ID → 本地化 key 的 slug（与 districtNameKeyBySlug 对应） */
const cnAreaSlugById: Record<number, string> = {
  0: 'mist',
  1: 'lavender_beds',
  2: 'goblet',
  3: 'shirogane',
  4: 'empyreum'
}

const cnDistrictFallbackNames: Record<number, string> = {
  0: '海雾村',
  1: '薰衣草苗圃',
  2: '高脚孤丘',
  3: '白银乡',
  4: '穹顶皓天'
}

function mapSize(size: number): PlotSize {
  if (size === 1) {
    return 'medium'
  }
  if (size === 2) {
    return 'large'
  }
  return 'small'
}

function mapAudience(regionType: number): PlotAudience {
  if (regionType === 1) {
    return 'freeCompany'
  }
  if (regionType === 2) {
    return 'individual'
  }
  return 'both'
}

function mapPurchase(purchaseType: number): PurchaseMethod {
  if (purchaseType === 1) {
    return 'firstCome'
  }
  if (purchaseType === 2) {
    return 'lottery'
  }
  return 'unknown'
}

/** 国服 State：0=未知 1=可供购买（本轮报名中） 2=结果公示 3=准备中（下一轮） */
function mapPhase(purchaseType: number, state: number): PlotPhase {
  if (purchaseType !== 2) {
    return 'unknown'
  }
  if (state === 1) {
    return 'entry'
  }
  if (state === 2) {
    return 'results'
  }
  if (state === 3) {
    return 'upcoming'
  }
  return 'unknown'
}

/**
 * 国服抽签周期推算（复刻售楼中心前端逻辑）：
 * - 完整周期 9 天 = 报名期 4 天 + 公示/准备期 5 天；
 * - 锚点 2022-08-08 23:00 +0800 为某轮公示期结束时刻；
 * - 上报缺少轮次信息（State=0/EndTime=0）时按 FirstSeen 对齐周期网格推算；
 * - 上报轮次已过期时按状态机推进到当前周期（过期公示的报名数视为失效）。
 * 状态机阶段顺序：报名中(entry) → 公示(results) → 准备中(upcoming) → 报名中……
 */
const CN_CYCLE_ANCHOR_SEC = 1659970800 // 2022-08-08 23:00:00 +0800，公示期结束
const CN_RESULTS_READY_SEC = 5 * 24 * 60 * 60 // 公示+准备期 5 天
const CN_ENTRY_SEC = 4 * 24 * 60 * 60 // 报名期 4 天
const CN_CYCLE_SEC = CN_ENTRY_SEC + CN_RESULTS_READY_SEC // 完整周期 9 天

/** 一个完整周期内没有任何确认上报的地块视为僵尸数据，不再展示 */
const CN_STALE_AFTER_SEC = CN_CYCLE_SEC

interface CnCyclePhase {
  phase: PlotPhase
  phaseEndsAt: number | null
}

/** 按周期网格推算（售楼中心 D() 无轮次分支）：先对齐 FirstSeen，再推进到当前 */
function inferCnCycleFromFirstSeen(firstSeenSec: number, nowSec: number): CnCyclePhase {
  let boundary = CN_CYCLE_ANCHOR_SEC
  while (boundary > firstSeenSec + CN_CYCLE_SEC) {
    boundary -= CN_CYCLE_SEC
  }
  while (boundary < firstSeenSec) {
    boundary += CN_CYCLE_SEC
  }
  if (nowSec < boundary) {
    // 处于准备期：boundary 是下一轮报名开始时刻
    return { phase: 'upcoming', phaseEndsAt: boundary * 1000 }
  }
  while (nowSec > boundary + CN_CYCLE_SEC) {
    boundary += CN_CYCLE_SEC
  }
  if (nowSec < boundary + CN_ENTRY_SEC) {
    return { phase: 'entry', phaseEndsAt: (boundary + CN_ENTRY_SEC) * 1000 }
  }
  return { phase: 'results', phaseEndsAt: (boundary + CN_CYCLE_SEC) * 1000 }
}

/** 按状态机推进（售楼中心 D() 轮次过期分支）：报名中→公示→准备中→报名中…… */
function advanceCnCycle(state: number, endTimeSec: number, nowSec: number): CnCyclePhase {
  let boundary = endTimeSec
  let current = state
  while (boundary > 0 && nowSec >= boundary) {
    if (current === 1) {
      boundary += CN_ENTRY_SEC
      current = 2
    } else if (current === 2) {
      // 公示期结束：旧报名数失效，进入准备期
      current = 3
    } else {
      boundary += CN_RESULTS_READY_SEC
      current = 1
    }
  }
  const phase: PlotPhase = current === 1 ? 'entry' : current === 2 ? 'results' : 'upcoming'
  return { phase, phaseEndsAt: boundary > 0 ? boundary * 1000 : null }
}

interface CnCycleInput {
  purchaseType: number
  state: number
  firstSeenSec: number | null
  endTimeSec: number | null
}

function resolveCnCycle(input: CnCycleInput, nowSec: number): CnCyclePhase {
  const { purchaseType, state, firstSeenSec, endTimeSec } = input
  const hasReportedCycle =
    state > 0 && endTimeSec !== null && endTimeSec > 0 && purchaseType === 2
  if (!hasReportedCycle) {
    // 无轮次信息（旧快照/无上报轮次）：按周期网格从 FirstSeen 推算
    if (firstSeenSec !== null && firstSeenSec > 0) {
      return inferCnCycleFromFirstSeen(firstSeenSec, nowSec)
    }
    return { phase: 'unknown', phaseEndsAt: null }
  }
  if (nowSec < endTimeSec) {
    // 上报轮次仍处于未来/当前：直接采用
    return { phase: mapPhase(purchaseType, state), phaseEndsAt: endTimeSec * 1000 }
  }
  // 上报轮次已过期：状态机推进到当前周期
  return advanceCnCycle(state, endTimeSec, nowSec)
}

function secondsToMs(seconds: number): number | null {
  return seconds > 0 ? seconds * 1000 : null
}

function mapSaleItem(item: CnSaleItem, nowSec: number): HousingPlot | null {
  // Area -1、无价格与"不可购买"(PurchaseType=0) 属于无效或无意义上报，直接过滤
  if (item.Area < 0 || !Number.isFinite(item.Price) || item.Price <= 0 || item.PurchaseType === 0) {
    return null
  }
  // 超过一个完整周期（9 天）没有确认上报的地块视为僵尸数据（大概率已成交但无人上报），
  // 其"当期/下期"状态推算不再可信，直接不展示
  if (item.LastSeen > 0 && nowSec - item.LastSeen > CN_STALE_AFTER_SEC) {
    return null
  }
  const slug = cnAreaSlugById[item.Area]
  const districtName = cnDistrictFallbackNames[item.Area] ?? `Area ${item.Area}`
  const cycle = resolveCnCycle(
    {
      purchaseType: item.PurchaseType,
      state: item.State,
      firstSeenSec: item.FirstSeen > 0 ? item.FirstSeen : null,
      endTimeSec: item.EndTime > 0 ? item.EndTime : null
    },
    nowSec
  )
  // 过期公示阶段（原数据被状态机推进过）报名数视为失效
  const entriesInvalid = item.State > 0 && item.EndTime > 0 && nowSec >= item.EndTime
  return {
    key: `cn:${item.Server}:${item.Area}:${item.Slot}-${item.ID}`,
    districtId: item.Area,
    districtNameKey: slug ? resolveDistrictNameKey(slug) : null,
    districtNameFallback: districtName,
    // 国服 Slot 从 0 开始、房号从 1 开始，展示时小区号归一化为 1 开始
    ward: item.Slot + 1,
    plot: item.ID,
    size: mapSize(item.Size),
    price: item.Price,
    audience: mapAudience(item.RegionType),
    purchase: mapPurchase(item.PurchaseType),
    phase: cycle.phase,
    entries:
      entriesInvalid ||
      !Number.isFinite(item.Participate) ||
      item.Participate <= 0
        ? null
        : item.Participate,
    phaseEndsAt: cycle.phaseEndsAt,
    lastUpdatedAt: secondsToMs(item.LastSeen),
    firstSeenAt: secondsToMs(item.FirstSeen)
  }
}

async function fetchWithHostFallback<T>(path: string): Promise<{ data: T; host: string }> {
  const { api } = useFetch()
  let lastError: unknown = new Error('No CN housing host attempted')
  for (const host of CN_HOSTS) {
    try {
      const data = await api<T>(`${host}${path}`, { timeoutMs: 20000 })
      return { data, host }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

export async function fetchCnServerPlots(
  serverIndex: number,
  serverName: string
): Promise<HousingServerData> {
  const [salesResult, updateTimeResult] = await Promise.allSettled([
    fetchWithHostFallback<CnSaleItem[]>(`/api/sales?server=${serverIndex}`),
    fetchWithHostFallback<CnUpdateTime>(`/api/update_time?server=${serverIndex}`)
  ])

  if (salesResult.status === 'rejected') {
    throw salesResult.reason
  }

  const plots: HousingPlot[] = []
  const nowSec = Date.now() / 1000
  for (const item of salesResult.value.data) {
    const mapped = mapSaleItem(item, nowSec)
    if (mapped) {
      plots.push(mapped)
    }
  }

  const updatedAt =
    updateTimeResult.status === 'fulfilled'
      ? secondsToMs(updateTimeResult.value.data.Time)
      : null

  return {
    region: 'cn',
    serverId: serverIndex,
    serverName,
    plots,
    updatedAt
  }
}
