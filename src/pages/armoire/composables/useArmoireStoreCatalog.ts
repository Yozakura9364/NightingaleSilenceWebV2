import { ref, shallowRef } from 'vue'
import { ARMOIRE_STORE_CATALOG_SCHEMA_VERSION, type ArmoireStoreCatalog } from '@/lib/armoire/types'

export type ArmoireStoreCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const storeCatalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-store-catalog.json`
const EMPTY_STORE_CATALOG: ArmoireStoreCatalog = {
  schemaVersion: ARMOIRE_STORE_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  sources: [],
  outfits: []
}

export function useArmoireStoreCatalog() {
  const storeCatalog = shallowRef<ArmoireStoreCatalog>(EMPTY_STORE_CATALOG)
  const status = ref<ArmoireStoreCatalogStatus>('idle')
  const error = ref<string | null>(null)

  async function loadStoreCatalog(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const { isArmoireStoreCatalog } = await import('@/lib/armoire/storeCatalog')
      const response = await fetch(storeCatalogUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireStoreCatalog(payload)) {
        throw new Error('invalid armoire store catalog')
      }

      storeCatalog.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      storeCatalog.value = EMPTY_STORE_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    storeCatalog,
    status,
    error,
    loadStoreCatalog
  }
}
