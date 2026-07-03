import { useFetch } from '@/composables/useFetch'
import type { NSPlateFilesResponse, NSPlatePresetsResponse } from '@/lib/plate/types'

export function useNSPlateApi(apiBase: string) {
  const { createClient } = useFetch()
  const client = createClient(apiBase)

  return {
    fetchPresets: () => client.api<NSPlatePresetsResponse>('/presets', { cache: 'no-store' }),
    fetchFiles: () => client.api<NSPlateFilesResponse>('/files', { cache: 'no-store' })
  }
}
