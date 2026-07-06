import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromCabinetCatalog,
  EMPTY_ARMOIRE_CABINET_CATALOG,
  isArmoireCabinetCatalog
} from '@/lib/armoire/cabinetCatalog'
import type { ArmoireCabinetCatalog } from '@/lib/armoire/types'

export type ArmoireCabinetCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const cabinetCatalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-cabinet-catalog.json`

export function useArmoireCabinetCatalog() {
  const cabinetCatalog = shallowRef<ArmoireCabinetCatalog>(EMPTY_ARMOIRE_CABINET_CATALOG)
  const status = ref<ArmoireCabinetCatalogStatus>('idle')
  const error = ref<string | null>(null)
  const catalog = computed(() => createArmoireCatalogFromCabinetCatalog(cabinetCatalog.value))

  async function loadCabinetCatalog(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(cabinetCatalogUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireCabinetCatalog(payload)) {
        throw new Error('invalid armoire cabinet catalog')
      }

      cabinetCatalog.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      cabinetCatalog.value = EMPTY_ARMOIRE_CABINET_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    cabinetCatalog,
    catalog,
    status,
    error,
    loadCabinetCatalog
  }
}
