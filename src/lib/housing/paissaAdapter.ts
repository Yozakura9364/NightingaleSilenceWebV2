import { useFetch } from '@/composables/useFetch'
import { getHousingCycleStatus, housingCycleProfiles } from '@/lib/ffxiv/time/housingCycle'
import { resolveDistrictNameKey } from './regions'
import type {
  HousingPlot,
  HousingServerData,
  HousingWorld,
  PlotAudience,
  PlotPhase,
  PlotSize,
  PurchaseMethod
} from './types'

/**
 * PaissaDB（https://paissadb.zhu.codes）是国际服空地数据的公开 FastAPI，
 * 也是 xiv-housing.com 的数据底层。CORS 允许任意来源，可浏览器直连。
 */

const PAISSA_BASE = 'https://paissadb.zhu.codes'

interface PaissaWorld {
  id: number
  name: string
  datacenter_id: number
  datacenter_name: string
}

interface PaissaOpenPlot {
  world_id: number
  district_id: number
  district_name?: string
  ward_number: number
  plot_number: number
  size: number
  price: number
  purchase_system: number
  last_updated_time: number
  first_seen_time: number
  lotto_entries?: number | null
  lotto_phase?: number | null
  lotto_phase_until?: number | null
}

interface PaissaDistrict {
  id: number
  name: string
  num_open_plots: number
  open_plots: PaissaOpenPlot[]
}

interface PaissaWorldDetail {
  id: number
  name: string
  districts: PaissaDistrict[]
}

const PURCHASE_LOTTERY = 1
const PURCHASE_FREE_COMPANY = 2
const PURCHASE_INDIVIDUAL = 4

function mapSize(size: number): PlotSize {
  if (size === 1) {
    return 'medium'
  }
  if (size === 2) {
    return 'large'
  }
  return 'small'
}

function mapAudience(purchaseSystem: number): PlotAudience {
  const fc = (purchaseSystem & PURCHASE_FREE_COMPANY) !== 0
  const individual = (purchaseSystem & PURCHASE_INDIVIDUAL) !== 0
  if (fc && individual) {
    return 'both'
  }
  return fc ? 'freeCompany' : 'individual'
}

function mapPurchase(purchaseSystem: number): PurchaseMethod {
  return (purchaseSystem & PURCHASE_LOTTERY) !== 0 ? 'lottery' : 'firstCome'
}

function mapPhase(lottoPhase: number | null | undefined): PlotPhase {
  if (lottoPhase === 1) {
    return 'entry'
  }
  if (lottoPhase === 2) {
    return 'results'
  }
  if (lottoPhase === 3) {
    return 'upcoming'
  }
  return 'unknown'
}

function secondsToMs(seconds: number | null | undefined): number | null {
  return typeof seconds === 'number' && Number.isFinite(seconds) ? Math.round(seconds * 1000) : null
}

/**
 * 地块“是否仍在售”的判定依据优先级（2026-11-23 用 PaissaDB 全库导出验证）：
 * - 小区扫描新鲜（last_updated_time ≤ 24h）= 扫描时该地未被标记为已持有，仍在售；
 * - 轮次信息过期（lotto_phase_until 已过）≠ 已成交，只说明该地的抽签信息没人更新；
 *   此时用项目已有的全球周期日历（报名 5 天 + 公示 4 天，与导出数据完全吻合）推断当前轮次；
 * - 两者都过期（轮次过期且小区 24h 无人扫描）才视为僵尸，可能是已成交但未上报。
 */
function mapPlot(plot: PaissaOpenPlot, districtName: string, nowMs: number): HousingPlot | null {
  const lastUpdatedAtMs = secondsToMs(plot.last_updated_time)
  const phaseUntilMs = secondsToMs(plot.lotto_phase_until)
  const cycleInfoCurrent = phaseUntilMs !== null && phaseUntilMs >= nowMs
  const wardScanFresh =
    lastUpdatedAtMs !== null && nowMs - lastUpdatedAtMs <= 24 * 60 * 60 * 1000

  const hasCycleInfo = plot.lotto_phase !== null && plot.lotto_phase !== undefined
  if (hasCycleInfo) {
    // 轮次信息过期且小区 24h 无人扫描：疑似已成交但未上报
    if (!cycleInfoCurrent && !wardScanFresh) {
      return null
    }
  } else if (lastUpdatedAtMs !== null && nowMs - lastUpdatedAtMs > 7 * 24 * 60 * 60 * 1000) {
    // 无轮次信息（先到先得或未扫描到轮次）：只按 7 天未更新丢弃
    return null
  }

  let phase = mapPhase(plot.lotto_phase)
  let phaseEndsAt = phaseUntilMs
  let entries: number | null =
    typeof plot.lotto_entries === 'number' && Number.isFinite(plot.lotto_entries)
      ? plot.lotto_entries
      : null
  if (!cycleInfoCurrent && phase !== 'unknown') {
    const cycle = getHousingCycleStatus(nowMs, housingCycleProfiles.global)
    phase = cycle.phase === 'entry' ? 'entry' : 'results'
    phaseEndsAt = cycle.phase === 'entry' ? cycle.entryClosesAt : cycle.resultsEndAt
    // 报名数属于上一轮，已不可信
    entries = null
  }

  return {
    key: `global:${plot.world_id}:${plot.district_id}:${plot.ward_number}-${plot.plot_number}`,
    districtId: plot.district_id,
    districtNameKey: resolveDistrictNameKey(districtName),
    districtNameFallback: districtName,
    // PaissaDB 的小区号从 0 开始，展示时归一化为 1 开始
    ward: plot.ward_number + 1,
    plot: plot.plot_number,
    size: mapSize(plot.size),
    price: plot.price,
    audience: mapAudience(plot.purchase_system),
    purchase: mapPurchase(plot.purchase_system),
    phase,
    entries,
    phaseEndsAt,
    lastUpdatedAt: lastUpdatedAtMs,
    firstSeenAt: secondsToMs(plot.first_seen_time)
  }
}

let worldsCache: Promise<HousingWorld[]> | null = null

export async function fetchPaissaWorlds(): Promise<HousingWorld[]> {
  if (!worldsCache) {
    worldsCache = (async () => {
      const { api } = useFetch()
      const worlds = await api<PaissaWorld[]>(`${PAISSA_BASE}/worlds`, { timeoutMs: 15000 })
      return worlds.map((world) => ({
        id: world.id,
        name: world.name,
        datacenterId: world.datacenter_id,
        datacenterName: world.datacenter_name
      }))
    })()
    worldsCache.catch(() => {
      // 请求失败时不缓存 rejected promise，允许后续重试
      worldsCache = null
    })
  }
  return worldsCache
}

export async function fetchPaissaWorldPlots(worldId: number): Promise<HousingServerData> {
  const { api } = useFetch()
  const detail = await api<PaissaWorldDetail>(`${PAISSA_BASE}/worlds/${worldId}`, {
    timeoutMs: 20000
  })

  const plots: HousingPlot[] = []
  let latestUpdatedAt: number | null = null
  const nowMs = Date.now()
  for (const district of detail.districts) {
    for (const openPlot of district.open_plots) {
      const mapped = mapPlot(openPlot, district.name, nowMs)
      if (!mapped) {
        continue
      }
      plots.push(mapped)
      if (mapped.lastUpdatedAt !== null) {
        latestUpdatedAt =
          latestUpdatedAt === null ? mapped.lastUpdatedAt : Math.max(latestUpdatedAt, mapped.lastUpdatedAt)
      }
    }
  }

  return {
    region: 'global',
    serverId: worldId,
    serverName: detail.name,
    plots,
    updatedAt: latestUpdatedAt
  }
}
