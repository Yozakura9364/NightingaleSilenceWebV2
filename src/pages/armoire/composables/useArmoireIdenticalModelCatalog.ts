import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromIdenticalModelCatalog,
  EMPTY_ARMOIRE_IDENTICAL_MODEL_CATALOG,
  isArmoireIdenticalModelCatalog
} from '@/lib/armoire/identicalModelCatalog'
import type { ArmoireIdenticalModelCatalog } from '@/lib/armoire/types'

export type ArmoireIdenticalModelCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const identicalModelCatalogUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-identical-model-catalog.json`

export function useArmoireIdenticalModelCatalog() {
  const identicalModelCatalog = shallowRef<ArmoireIdenticalModelCatalog>(
    EMPTY_ARMOIRE_IDENTICAL_MODEL_CATALOG
  )
  const status = ref<ArmoireIdenticalModelCatalogStatus>('idle')
  const error = ref<string | null>(null)
  const catalog = computed(() =>
    createArmoireCatalogFromIdenticalModelCatalog(identicalModelCatalog.value)
  )

  async function loadIdenticalModelCatalog(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(identicalModelCatalogUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireIdenticalModelCatalog(payload)) {
        throw new Error('invalid armoire identical model catalog')
      }

      identicalModelCatalog.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      identicalModelCatalog.value = EMPTY_ARMOIRE_IDENTICAL_MODEL_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    identicalModelCatalog,
    catalog,
    status,
    error,
    loadIdenticalModelCatalog
  }
}
