import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromDyeCatalog,
  EMPTY_ARMOIRE_DYE_CATALOG,
  isArmoireDyeCatalog
} from '@/lib/armoire/dyeCatalog'
import type { ArmoireDyeCatalog } from '@/lib/armoire/types'

export type ArmoireDyeCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const dyeCatalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-dye-catalog.json`

export function useArmoireDyeCatalog() {
  const dyeCatalog = shallowRef<ArmoireDyeCatalog>(EMPTY_ARMOIRE_DYE_CATALOG)
  const status = ref<ArmoireDyeCatalogStatus>('idle')
  const error = ref<string | null>(null)
  const catalog = computed(() => createArmoireCatalogFromDyeCatalog(dyeCatalog.value))

  async function loadDyeCatalog(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(dyeCatalogUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireDyeCatalog(payload)) {
        throw new Error('invalid armoire dye catalog')
      }

      dyeCatalog.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      dyeCatalog.value = EMPTY_ARMOIRE_DYE_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    dyeCatalog,
    catalog,
    status,
    error,
    loadDyeCatalog
  }
}
