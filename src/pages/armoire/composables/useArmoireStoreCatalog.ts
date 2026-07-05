import { onMounted, ref, shallowRef } from 'vue'
import {
  EMPTY_ARMOIRE_STORE_CATALOG,
  isArmoireStoreCatalog
} from '@/lib/armoire/storeCatalog'
import type { ArmoireStoreCatalog } from '@/lib/armoire/types'

export type ArmoireStoreCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const storeCatalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-store-catalog.json`

export function useArmoireStoreCatalog() {
  const storeCatalog = shallowRef<ArmoireStoreCatalog>(EMPTY_ARMOIRE_STORE_CATALOG)
  const status = ref<ArmoireStoreCatalogStatus>('idle')
  const error = ref<string | null>(null)

  async function loadStoreCatalog() {
    status.value = 'loading'
    error.value = null

    try {
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
      storeCatalog.value = EMPTY_ARMOIRE_STORE_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  onMounted(() => {
    void loadStoreCatalog()
  })

  return {
    storeCatalog,
    status,
    error,
    loadStoreCatalog
  }
}
