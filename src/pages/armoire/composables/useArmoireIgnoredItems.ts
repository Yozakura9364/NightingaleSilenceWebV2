import { computed, ref, watch, type Ref } from 'vue'
import {
  getArmoireSnapshotRecord,
  updateArmoireSnapshotIgnoredItemIds
} from '@/pages/armoire/services/armoireSnapshotStore'

const LEGACY_STORAGE_KEY_PREFIX = 'nsarmoire.ignoredItems.v1:'

interface StoredIgnoredItems {
  profileKey: string
  itemIds: number[]
  updatedAt: string
}

function getStorageKey(profileKey: string): string {
  return `${LEGACY_STORAGE_KEY_PREFIX}${encodeURIComponent(profileKey)}`
}

function normalizeItemIds(itemIds: readonly number[]): number[] {
  return Array.from(
    new Set(itemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0))
  ).sort((left, right) => left - right)
}

function readIgnoredItemIds(profileKey: string): number[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(profileKey))

    if (!rawValue) {
      return []
    }

    const payload = JSON.parse(rawValue) as Partial<StoredIgnoredItems>

    if (payload.profileKey !== profileKey || !Array.isArray(payload.itemIds)) {
      return []
    }

    return normalizeItemIds(payload.itemIds)
  } catch {
    return []
  }
}

function removeLegacyIgnoredItemIds(profileKey: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(getStorageKey(profileKey))
  } catch {
    // Legacy cleanup is best-effort; the IndexedDB profile remains authoritative.
  }
}

export function useArmoireIgnoredItems(activeProfileKey: Ref<string | null>) {
  const ignoredItemIds = ref<number[]>([])
  const storageError = ref<string | null>(null)
  let requestVersion = 0

  async function loadIgnoredItems(profileKey: string): Promise<void> {
    const version = ++requestVersion

    try {
      const record = await getArmoireSnapshotRecord(profileKey)
      const legacyItemIds = readIgnoredItemIds(profileKey)
      const mergedItemIds = normalizeItemIds([
        ...(record?.ignoredItemIds ?? []),
        ...legacyItemIds
      ])

      if (version !== requestVersion) {
        return
      }

      ignoredItemIds.value = mergedItemIds
      storageError.value = null

      if (legacyItemIds.length > 0 && record) {
        await updateArmoireSnapshotIgnoredItemIds(profileKey, mergedItemIds)
        removeLegacyIgnoredItemIds(profileKey)
      }
    } catch (error) {
      if (version !== requestVersion) {
        return
      }

      storageError.value = error instanceof Error ? error.message : String(error)
    }
  }

  async function persist(nextItemIds: readonly number[]): Promise<void> {
    const profileKey = activeProfileKey.value

    ignoredItemIds.value = normalizeItemIds(nextItemIds)
    requestVersion += 1

    if (!profileKey) {
      return
    }

    try {
      await updateArmoireSnapshotIgnoredItemIds(profileKey, ignoredItemIds.value)
      removeLegacyIgnoredItemIds(profileKey)
      storageError.value = null
    } catch (error) {
      storageError.value = error instanceof Error ? error.message : String(error)
    }
  }

  function ignoreItem(itemId: number): void {
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return
    }

    void persist([...ignoredItemIds.value, itemId])
  }

  function unignoreItem(itemId: number): void {
    void persist(ignoredItemIds.value.filter((ignoredItemId) => ignoredItemId !== itemId))
  }

  function clearIgnoredItems(): void {
    void persist([])
  }

  watch(
    activeProfileKey,
    (profileKey) => {
      if (!profileKey) {
        requestVersion += 1
        ignoredItemIds.value = []
        storageError.value = null
        return
      }

      void loadIgnoredItems(profileKey)
    },
    { immediate: true }
  )

  const ignoredItemIdSet = computed(() => new Set(ignoredItemIds.value))

  return {
    ignoredItemIds,
    ignoredItemIdSet,
    ignoredItemStorageError: storageError,
    ignoreItem,
    unignoreItem,
    clearIgnoredItems
  }
}
