import { ref, shallowRef } from 'vue'
import {
  ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION,
  type ArmoireStoreItemDisplayIndex
} from '@/lib/armoire/types'

export type ArmoireStoreItemDisplayIndexStatus = 'idle' | 'loading' | 'ready' | 'error'

const storeItemDisplayIndexUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}data/armoire-store-item-display-index.json`
const EMPTY_STORE_ITEM_DISPLAY_INDEX: ArmoireStoreItemDisplayIndex = {
  schemaVersion: ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION,
  generatedAt: '',
  items: {}
}

export function useArmoireStoreItemDisplayIndex() {
  const storeItemDisplayIndex = shallowRef<ArmoireStoreItemDisplayIndex>(
    EMPTY_STORE_ITEM_DISPLAY_INDEX
  )
  const status = ref<ArmoireStoreItemDisplayIndexStatus>('idle')
  const error = ref<string | null>(null)

  async function loadStoreItemDisplayIndex(options: { force?: boolean } = {}) {
    if (status.value === 'loading' || (status.value === 'ready' && options.force !== true)) {
      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const { isArmoireStoreItemDisplayIndex } = await import('@/lib/armoire/storeItemDisplayIndex')
      const response = await fetch(storeItemDisplayIndexUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const payload = (await response.json()) as unknown

      if (!isArmoireStoreItemDisplayIndex(payload)) {
        throw new Error('invalid armoire store item display index')
      }

      storeItemDisplayIndex.value = payload
      status.value = 'ready'
    } catch (indexError) {
      storeItemDisplayIndex.value = EMPTY_STORE_ITEM_DISPLAY_INDEX
      status.value = 'error'
      error.value = indexError instanceof Error ? indexError.message : String(indexError)
    }
  }

  return {
    storeItemDisplayIndex,
    status,
    error,
    loadStoreItemDisplayIndex
  }
}
