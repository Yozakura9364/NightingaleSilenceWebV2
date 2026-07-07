import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromCrafterGathererReplicaCatalog,
  EMPTY_ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG,
  isArmoireCrafterGathererReplicaCatalog
} from '@/lib/armoire/crafterGathererReplicaCatalog'
import type { ArmoireCrafterGathererReplicaCatalog } from '@/lib/armoire/types'

export type ArmoireCrafterGathererReplicaCatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

const replicaCatalogUrl = `${import.meta.env.BASE_URL.replace(
  /\/?$/,
  '/'
)}data/armoire-crafter-gatherer-replica-catalog.json`

export function useArmoireCrafterGathererReplicaCatalog() {
  const replicaCatalog = shallowRef<ArmoireCrafterGathererReplicaCatalog>(
    EMPTY_ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG
  )
  const status = ref<ArmoireCrafterGathererReplicaCatalogStatus>('idle')
  const error = ref<string | null>(null)
  const catalog = computed(() =>
    createArmoireCatalogFromCrafterGathererReplicaCatalog(replicaCatalog.value)
  )

  async function loadCrafterGathererReplicaCatalog(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await fetch(replicaCatalogUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireCrafterGathererReplicaCatalog(payload)) {
        throw new Error('invalid armoire crafter gatherer replica catalog')
      }

      replicaCatalog.value = payload
      status.value = 'ready'
    } catch (catalogError) {
      replicaCatalog.value = EMPTY_ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG
      status.value = 'error'
      error.value = catalogError instanceof Error ? catalogError.message : String(catalogError)
    }
  }

  return {
    replicaCatalog,
    catalog,
    status,
    error,
    loadCrafterGathererReplicaCatalog
  }
}
