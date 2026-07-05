import type { NSPlateDataSource } from '@/lib/plate/dataSource'
import type { NSPlateFilesResponse, NSPlatePresetsResponse } from '@/lib/plate/types'
import { useFetch } from '@/composables/useFetch'
import { useNSPlateApi } from '@/pages/plate/services/nsplateApi'

const STATIC_MANIFEST_SOURCE = 'static-manifest'
const DEFAULT_STATIC_MANIFEST_BASE = '/data/plate'

export function useNSPlateDataSource(apiBase: string): NSPlateDataSource {
  const sourceMode = String(import.meta.env.VITE_NSPLATE_DATA_SOURCE ?? '').trim()

  if (sourceMode === STATIC_MANIFEST_SOURCE) {
    return useStaticNSPlateManifestDataSource(
      String(import.meta.env.VITE_NSPLATE_MANIFEST_BASE ?? DEFAULT_STATIC_MANIFEST_BASE)
    )
  }

  return useLegacyNSPlateApiDataSource(apiBase)
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

export function useStaticNSPlateManifestDataSource(manifestBase: string): NSPlateDataSource {
  const { createClient } = useFetch()
  const client = createClient(manifestBase)

  return {
    kind: STATIC_MANIFEST_SOURCE,
    fetchPresets: () => client.api<NSPlatePresetsResponse>('/presets.json', { cache: 'no-store' }),
    fetchFiles: () => client.api<NSPlateFilesResponse>('/files.json', { cache: 'no-store' })
  }
}
