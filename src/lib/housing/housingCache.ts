import type { HousingRegionKey, HousingServerData } from './types'

/**
 * 看房页轻量缓存：
 * - 地块数据放 sessionStorage（60s TTL，会话结束自然过期，切服/手动刷新才发请求）
 * - 上次选择的服务器放 localStorage（跨会话记住）
 */

const PLOTS_TTL_MS = 60_000
const PLOTS_KEY_PREFIX = 'ns-housing:plots:'
const SERVER_KEY_PREFIX = 'ns-housing:server:'

interface CachedPlots {
  savedAt: number
  data: HousingServerData
}

export function loadCachedPlots(region: HousingRegionKey, serverId: number): HousingServerData | null {
  try {
    const raw = sessionStorage.getItem(`${PLOTS_KEY_PREFIX}${region}:${serverId}`)
    if (!raw) {
      return null
    }
    const cached = JSON.parse(raw) as CachedPlots
    if (!cached || typeof cached.savedAt !== 'number' || !cached.data) {
      return null
    }
    if (Date.now() - cached.savedAt > PLOTS_TTL_MS) {
      sessionStorage.removeItem(`${PLOTS_KEY_PREFIX}${region}:${serverId}`)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}

export function saveCachedPlots(data: HousingServerData): void {
  try {
    const payload: CachedPlots = { savedAt: Date.now(), data }
    sessionStorage.setItem(`${PLOTS_KEY_PREFIX}${data.region}:${data.serverId}`, JSON.stringify(payload))
  } catch {
    // 存储不可用（隐私模式等）时静默跳过，功能不受影响
  }
}

export function clearCachedPlots(region: HousingRegionKey, serverId: number): void {
  try {
    sessionStorage.removeItem(`${PLOTS_KEY_PREFIX}${region}:${serverId}`)
  } catch {
    // ignore
  }
}

export function loadSelectedServer(region: HousingRegionKey): number | null {
  try {
    const raw = localStorage.getItem(`${SERVER_KEY_PREFIX}${region}`)
    const parsed = raw === null ? Number.NaN : Number(raw)
    return Number.isInteger(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveSelectedServer(region: HousingRegionKey, serverId: number): void {
  try {
    localStorage.setItem(`${SERVER_KEY_PREFIX}${region}`, String(serverId))
  } catch {
    // ignore
  }
}

const PREFERENCES_KEY = 'ns-housing:preferences'

/** 心仪地块偏好：district 为区名 slug（mist/lavenderBeds/...），ward 为 null 时匹配所有小区 */
export interface PlotPreference {
  district: string
  ward: number | null
  plot: number
}

export function loadPreferences(): PlotPreference[] {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter(
        (item) =>
          item && typeof item.district === 'string' && typeof item.plot === 'number'
      )
      .map((item) => ({
        district: item.district,
        ward: typeof item.ward === 'number' ? item.ward : null,
        plot: item.plot
      }))
  } catch {
    return []
  }
}

export function savePreferences(preferences: PlotPreference[]): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  } catch {
    // ignore
  }
}
