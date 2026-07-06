import { computed, ref, shallowRef } from 'vue'
import {
  createArmoireCatalogFromGlamourSetChunks,
  EMPTY_ARMOIRE_GLAMOUR_SET_CHUNK,
  isArmoireGlamourSetChunk
} from '@/lib/armoire/glamourSetChunk'
import { getArmoireItemIdChunkKeys } from '@/lib/armoire/itemIdChunk'
import type { ArmoireGlamourSetChunk } from '@/lib/armoire/types'

export type ArmoireGlamourSetChunkStatus = 'idle' | 'loading' | 'ready' | 'error'

const chunkBaseUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-glamour-set-chunks`

function getChunkUrl(chunkKey: string): string {
  return `${chunkBaseUrl}/${chunkKey}.json`
}

export function useArmoireGlamourSetChunks() {
  const chunksByKey = shallowRef<Record<string, ArmoireGlamourSetChunk>>({})
  const status = ref<ArmoireGlamourSetChunkStatus>('idle')
  const error = ref<string | null>(null)
  const loadingKeys = new Map<string, Promise<void>>()
  const catalog = computed(() =>
    createArmoireCatalogFromGlamourSetChunks(Object.values(chunksByKey.value))
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
            ...EMPTY_ARMOIRE_GLAMOUR_SET_CHUNK,
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

      if (!isArmoireGlamourSetChunk(payload) || payload.chunkKey !== chunkKey) {
        throw new Error(`invalid armoire glamour set chunk: ${chunkKey}`)
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

  async function loadGlamourSetChunksForItemIds(
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
    loadGlamourSetChunksForItemIds
  }
}
