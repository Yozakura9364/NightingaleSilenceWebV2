import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromCatalogDisplayIndex,
  EMPTY_ARMOIRE_CATALOG_DISPLAY_INDEX,
  isArmoireCatalogDisplayIndex
} from '@/lib/armoire/catalogDisplayIndex'
import type { ArmoireCatalogDisplayIndex } from '@/lib/armoire/types'

export type ArmoireCatalogDisplayIndexStatus = 'idle' | 'loading' | 'ready' | 'error'

const catalogDisplayIndexUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-catalog-display-index.json`

export function useArmoireCatalogDisplayIndex() {
  const catalogDisplayIndex = shallowRef<ArmoireCatalogDisplayIndex>(
    EMPTY_ARMOIRE_CATALOG_DISPLAY_INDEX
  )
  const status = ref<ArmoireCatalogDisplayIndexStatus>('idle')
  const error = ref<string | null>(null)
  const catalog = computed(() => createArmoireCatalogFromCatalogDisplayIndex(catalogDisplayIndex.value))

  async function loadCatalogDisplayIndex(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(catalogDisplayIndexUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireCatalogDisplayIndex(payload)) {
        throw new Error('invalid armoire catalog display index')
      }

      catalogDisplayIndex.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      catalogDisplayIndex.value = EMPTY_ARMOIRE_CATALOG_DISPLAY_INDEX
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    catalogDisplayIndex,
    catalog,
    status,
    error,
    loadCatalogDisplayIndex
  }
}
