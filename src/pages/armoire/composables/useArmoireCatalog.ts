import { onMounted, ref, shallowRef } from 'vue'
import {
  EMPTY_ARMOIRE_CATALOG,
  isArmoireCatalog
} from '@/lib/armoire/catalog'
import type { ArmoireCatalog } from '@/lib/armoire/types'
import { fetchArmoireHelperCatalog } from '@/pages/armoire/services/nsarmoireHelperApi'

export type ArmoireCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const catalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-catalog.json`

export function useArmoireCatalog() {
  const catalog = shallowRef<ArmoireCatalog>(EMPTY_ARMOIRE_CATALOG)
  const status = ref<ArmoireCatalogStatus>('idle')
  const error = ref<string | null>(null)

  async function loadStaticCatalog(): Promise<ArmoireCatalog> {
    const response = await fetch(catalogUrl)

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    const payload = (await response.json()) as unknown

    if (!isArmoireCatalog(payload)) {
      throw new Error('invalid armoire catalog')
    }

    return payload
  }

  async function loadCatalog() {
    status.value = 'loading'
    error.value = null

    try {
      catalog.value = await loadStaticCatalog()
      status.value = 'ready'
    } catch (staticError) {
      try {
        catalog.value = await fetchArmoireHelperCatalog()
        status.value = 'ready'
      } catch (helperError) {
        catalog.value = EMPTY_ARMOIRE_CATALOG
        status.value = 'error'
        error.value = [
          `static: ${staticError instanceof Error ? staticError.message : String(staticError)}`,
          `helper: ${helperError instanceof Error ? helperError.message : String(helperError)}`
        ].join('; ')
      }
    }
  }

  onMounted(() => {
    void loadCatalog()
  })

  return {
    catalog,
    status,
    error,
    loadCatalog
  }
}
