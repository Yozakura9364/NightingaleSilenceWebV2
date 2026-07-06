import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromCabinetItemChunks,
  EMPTY_ARMOIRE_CABINET_ITEM_CHUNK,
  isArmoireCabinetItemChunk
} from '@/lib/armoire/cabinetItemChunk'
import { getArmoireItemIdChunkKeys } from '@/lib/armoire/itemIdChunk'
import type { ArmoireCabinetItemChunk } from '@/lib/armoire/types'

export type ArmoireCabinetItemChunkStatus = 'idle' | 'loading' | 'ready' | 'error'

const chunkBaseUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-cabinet-item-chunks`

function getChunkUrl(chunkKey: string): string {
  return `${chunkBaseUrl}/${chunkKey}.json`
}

export function useArmoireCabinetItemChunks() {
  const chunksByKey = shallowRef<Record<string, ArmoireCabinetItemChunk>>({})
  const status = ref<ArmoireCabinetItemChunkStatus>('idle')
  const error = ref<string | null>(null)
  const loadingKeys = new Map<string, Promise<void>>()
  const catalog = computed(() =>
    createArmoireCatalogFromCabinetItemChunks(Object.values(chunksByKey.value))
  )

  async function loadChunk(chunkKey: string, options: { force?: boolean } = {}): Promise<void> {
    if (chunksByKey.value[chunkKey] && options.force !== true) {
      return
    }

    const existingLoad = loadingKeys.get(chunkKey)
    if (existingLoad && options.force !== true) {
      return existingLoad
    }

    const loadPromise = (async () => {
      const response = await fetch(getChunkUrl(chunkKey))

      if (response.status === 404) {
        chunksByKey.value = {
          ...chunksByKey.value,
          [chunkKey]: {
            ...EMPTY_ARMOIRE_CABINET_ITEM_CHUNK,
            generatedAt: new Date(0).toISOString(),
            chunkKey
          }
        }
        return
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireCabinetItemChunk(payload) || payload.chunkKey !== chunkKey) {
        throw new Error(`invalid armoire cabinet item chunk: ${chunkKey}`)
      }

      chunksByKey.value = {
        ...chunksByKey.value,
        [chunkKey]: payload
      }
    })()

    loadingKeys.set(chunkKey, loadPromise)

    try {
      await loadPromise
    } finally {
      loadingKeys.delete(chunkKey)
    }
  }

  async function loadCabinetItemChunksForItemIds(
    itemIds: readonly number[],
    options: { force?: boolean } = {}
  ) {
    const chunkKeys = getArmoireItemIdChunkKeys(itemIds)

    if (chunkKeys.length === 0) {
      status.value = 'ready'
      error.value = null
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      await Promise.all(chunkKeys.map((chunkKey) => loadChunk(chunkKey, options)))
      status.value = 'ready'
    } catch (chunkError) {
      status.value = 'error'
      error.value = chunkError instanceof Error ? chunkError.message : String(chunkError)
    }
  }

  return {
    catalog,
    chunksByKey,
    status,
    error,
    loadCabinetItemChunksForItemIds
  }
}
