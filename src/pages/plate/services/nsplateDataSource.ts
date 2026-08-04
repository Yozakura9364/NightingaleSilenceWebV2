import type { NSPlateDataSource } from '@/lib/plate/dataSource'
import type { NSPlateFilesResponse, NSPlatePresetsResponse } from '@/lib/plate/types'
import { useFetch } from '@/composables/useFetch'
import { useNSPlateApi } from '@/pages/plate/services/nsplateApi'

const STATIC_MANIFEST_SOURCE = 'static-manifest'
const LEGACY_API_SOURCE = 'legacy-api'
const DEFAULT_STATIC_MANIFEST_BASE = '/data/plate'

export function useNSPlateDataSource(apiBase: string): NSPlateDataSource {
  const sourceMode = normalizeNSPlateDataSourceMode(import.meta.env.VITE_NSPLATE_DATA_SOURCE)

  if (sourceMode === LEGACY_API_SOURCE) {
    return useLegacyNSPlateApiDataSource(apiBase)
  }

  return useStaticNSPlateManifestDataSource(
    String(import.meta.env.VITE_NSPLATE_MANIFEST_BASE ?? DEFAULT_STATIC_MANIFEST_BASE)
  )
}

export function useLegacyNSPlateApiDataSource(apiBase: string): NSPlateDataSource {
  const api = useNSPlateApi(apiBase)

  return {
    kind: 'legacy-api',
    fetchPresets: api.fetchPresets,
    fetchFiles: api.fetchFiles,
    exportLayeredZip: api.exportLayeredZip
  }
}

// 会话级清单缓存：静态清单内容按构建发布，同一会话内重复进入页面无需重新请求
const manifestCache = new Map<string, Promise<unknown>>()

interface ManifestClient {
  basePath: string
  api: <T = unknown>(path: string) => Promise<T>
}

function fetchManifestCached<T>(client: ManifestClient, path: string): Promise<T> {
  const key = `${client.basePath}${path}`
  let pending = manifestCache.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = client.api<T>(path).catch((error) => {
      manifestCache.delete(key)
      throw error
    })
    manifestCache.set(key, pending)
  }
  return pending
}

export function useStaticNSPlateManifestDataSource(manifestBase: string): NSPlateDataSource {
  const { createClient } = useFetch()
  const client = createClient(manifestBase)

  return {
    kind: STATIC_MANIFEST_SOURCE,
    // 静态清单走浏览器 HTTP 缓存（静态托管自带 ETag/Last-Modified），不再强制 no-store
    fetchPresets: () => fetchManifestCached<NSPlatePresetsResponse>(client, '/presets.json'),
    fetchFiles: () => fetchManifestCached<NSPlateFilesResponse>(client, '/files.json')
  }
}

function normalizeNSPlateDataSourceMode(
  value: unknown
): typeof STATIC_MANIFEST_SOURCE | typeof LEGACY_API_SOURCE {
  const sourceMode = String(value ?? STATIC_MANIFEST_SOURCE).trim()

  return sourceMode === LEGACY_API_SOURCE ? LEGACY_API_SOURCE : STATIC_MANIFEST_SOURCE
}
