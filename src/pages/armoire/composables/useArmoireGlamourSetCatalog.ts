import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromGlamourSetCatalog,
  EMPTY_ARMOIRE_GLAMOUR_SET_CATALOG,
  isArmoireGlamourSetCatalog
} from '@/lib/armoire/glamourSetCatalog'
import type { ArmoireGlamourSetCatalog } from '@/lib/armoire/types'

export type ArmoireGlamourSetCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const glamourSetCatalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-glamour-set-catalog.json`

export function useArmoireGlamourSetCatalog() {
  const glamourSetCatalog = shallowRef<ArmoireGlamourSetCatalog>(
    EMPTY_ARMOIRE_GLAMOUR_SET_CATALOG
  )
  const status = ref<ArmoireGlamourSetCatalogStatus>('idle')
  const error = ref<string | null>(null)
  const catalog = computed(() => createArmoireCatalogFromGlamourSetCatalog(glamourSetCatalog.value))

  async function loadGlamourSetCatalog(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(glamourSetCatalogUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireGlamourSetCatalog(payload)) {
        throw new Error('invalid armoire glamour set catalog')
      }

      glamourSetCatalog.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      glamourSetCatalog.value = EMPTY_ARMOIRE_GLAMOUR_SET_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    glamourSetCatalog,
    catalog,
    status,
    error,
    loadGlamourSetCatalog
  }
}
