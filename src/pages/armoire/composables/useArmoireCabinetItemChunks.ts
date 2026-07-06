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
  const loadingKeys = new Map<string, Promise<ArmoireCabinetItemChunk>>()
  const catalog = computed(() =>
    createArmoireCatalogFromCabinetItemChunks(Object.values(chunksByKey.value))
  )

  async function loadChunk(
    chunkKey: string,
    options: { force?: boolean } = {}
  ): Promise<ArmoireCabinetItemChunk> {
    if (chunksByKey.value[chunkKey] && options.force !== true) {
      return chunksByKey.value[chunkKey]
    }

    const existingLoad = loadingKeys.get(chunkKey)
    if (existingLoad && options.force !== true) {
      return existingLoad
    }

    const loadPromise = (async () => {
      const response = await fetch(getChunkUrl(chunkKey))

      if (response.status === 404) {
        return {
          ...EMPTY_ARMOIRE_CABINET_ITEM_CHUNK,
          generatedAt: new Date(0).toISOString(),
          chunkKey
        }
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireCabinetItemChunk(payload) || payload.chunkKey !== chunkKey) {
        throw new Error(`invalid armoire cabinet item chunk: ${chunkKey}`)
      }

      return payload
    })()

    loadingKeys.set(chunkKey, loadPromise)

    try {
      return await loadPromise
    } finally {
      if (loadingKeys.get(chunkKey) === loadPromise) {
        loadingKeys.delete(chunkKey)
      }
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
      const chunks = await Promise.all(chunkKeys.map((chunkKey) => loadChunk(chunkKey, options)))
      const nextChunksByKey = { ...chunksByKey.value }
      let hasChanged = false

      for (const chunk of chunks) {
        if (nextChunksByKey[chunk.chunkKey] !== chunk) {
          nextChunksByKey[chunk.chunkKey] = chunk
          hasChanged = true
        }
      }

      if (hasChanged) {
        chunksByKey.value = nextChunksByKey
      }

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
