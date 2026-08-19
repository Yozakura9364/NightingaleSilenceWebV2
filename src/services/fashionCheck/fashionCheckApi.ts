// 时尚品鉴公开数据服务 — 当前周切片 / 四语目录 / 染剂色图。
// 页面只依赖本服务，不直接 useFetch；缓存键与 TTL 保持旧行为。

import { useFetch } from '@/composables/useFetch'
import { safeSetSessionItem } from '@/services/browserStorage'
import { resolvePublicDataPath } from '@/services/dataAccess'
import { buildDyeColorMap, type FfxivDyeCatalog } from '@/lib/fashion-check/dyeCatalog'
import type { FashionCheckLocaleCatalog, FashionCheckTagDatabase, FashionCheckWeek } from '@/lib/fashion-check/types'

const WEEK_CACHE_KEY = 'ns_fashion_check_week'
const CATALOG_CACHE_KEY = 'ns_fashion_check_catalog'
const CACHE_TTL_MS = 30 * 60 * 1000

export interface FashionCheckWeekBundle {
  week: FashionCheckWeek
  localeCatalog: FashionCheckLocaleCatalog
}

/** 读取 30 分钟内的 sessionStorage 缓存；无缓存/过期/损坏一律返回 null。 */
export function readFashionCheckWeekCache(): FashionCheckWeekBundle | null {
  try {
    const cached = sessionStorage.getItem(WEEK_CACHE_KEY)
    const cachedCatalog = sessionStorage.getItem(CATALOG_CACHE_KEY)

    if (!cached || !cachedCatalog) {
      return null
    }

    const weekEntry = JSON.parse(cached) as { data: FashionCheckWeek; timestamp: number }
    const catalogEntry = JSON.parse(cachedCatalog) as { data: FashionCheckLocaleCatalog }

    if (!weekEntry?.data || !catalogEntry?.data) {
      return null
    }

    if (Date.now() - Number(weekEntry.timestamp) >= CACHE_TTL_MS) {
      return null
    }

    return { week: weekEntry.data, localeCatalog: catalogEntry.data }
  } catch {
    return null
  }
}

/** 拉取当前周切片与四语目录（no-store + 版本参数），成功后回写缓存。 */
export async function loadFashionCheckWeekBundle(signal?: AbortSignal): Promise<FashionCheckWeekBundle> {
  const { api } = useFetch()
  const dataVersion = Date.now()

  const [week, localeCatalog] = await Promise.all([
    api<FashionCheckWeek>(resolvePublicDataPath('fashion-check/current.json'), {
      cache: 'no-store',
      query: { v: dataVersion },
      signal
    }),
    api<FashionCheckLocaleCatalog>(resolvePublicDataPath('fashion-check/current-locales.json'), {
      cache: 'no-store',
      query: { v: dataVersion },
      signal
    })
  ])

  safeSetSessionItem(WEEK_CACHE_KEY, JSON.stringify({ data: week, timestamp: dataVersion }))
  safeSetSessionItem(CATALOG_CACHE_KEY, JSON.stringify({ data: localeCatalog }))

  return { week, localeCatalog }
}

/** 加载染剂目录并构建色图；失败返回 undefined（与旧行为一致：不阻塞页面）。 */
export async function loadFashionCheckDyeColorMap(): Promise<ReadonlyMap<number, string> | undefined> {
  try {
    const catalog = await useFetch().api<FfxivDyeCatalog>(resolvePublicDataPath('ffxiv/dye-catalog.json'))
    return buildDyeColorMap(catalog)
  } catch {
    return undefined
  }
}

/** 加载金牌查询标签库（no-store + 版本参数，与旧行为一致）。 */
export async function loadFashionCheckTagDatabase(): Promise<FashionCheckTagDatabase> {
  return useFetch().api<FashionCheckTagDatabase>(resolvePublicDataPath('fashion-check/tag-database.json'), {
    cache: 'no-store',
    query: { v: Date.now() }
  })
}

export interface FashionCheckSource {
  author: string
  title: string
  url: string
}

/** 加载来源清单；错误按 useFetch 语义抛出，由调用方决定错误态。 */
export async function loadFashionCheckSources(): Promise<FashionCheckSource[]> {
  const payload = await useFetch().api<{ sources: FashionCheckSource[] }>(
    resolvePublicDataPath('fashion-check/sources.json')
  )
  return payload.sources
}
