import { computed, ref } from 'vue'
import {
  addItemCardCatalogItem,
  clearGlamourDraftEntry,
  createEmptyGlamourDraft,
  createGlamourDraftFromPayload,
  draftToGlamourStoreEquipment,
  getFilledGlamourDraftEntries,
  GLAMOUR_CARD_DRAFT_STORAGE_KEY,
  GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY,
  selectGlamourDraftEntryCandidate,
  setGlamourDraftEntryDye,
  setGlamourDraftLocale,
  storedGlamourValueToPayload
} from '@/pages/item-card/lib/draft'
import { normalizeGlamourLocale } from '@/pages/item-card/lib/equipment'
import {
  GLAMOUR_RECENT_STORAGE_KEY,
  clearGlamourRecentSnapshots,
  createGlamourRecentSnapshot,
  readGlamourRecentSnapshots,
  removeGlamourRecentSnapshot,
  upsertGlamourRecentSnapshot
} from '@/pages/item-card/lib/recent'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourImportPayload,
  GlamourRecentSnapshot,
  GlamourStain
} from '@/pages/item-card/lib/types'
import { useLocale } from '@/stores/locale'

const initialDraft = loadStoredDraft()
const sharedDraft = ref<GlamourDraft>(initialDraft)
const updatedAt = ref(initialDraft.source.importedAt || '')
const recentSnapshots = ref<GlamourRecentSnapshot[]>(readGlamourRecentSnapshots())
let storageListenerInstalled = false
let draftStorageRefreshId: number | undefined

function readJsonStorage(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function loadStoredDraft(): GlamourDraft {
  const storePayload = storedGlamourValueToPayload(
    readJsonStorage(GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY)
  )
  const cardPayload = storedGlamourValueToPayload(readJsonStorage(GLAMOUR_CARD_DRAFT_STORAGE_KEY))
  const payload = storePayload || cardPayload

  if (!payload) {
    return createEmptyGlamourDraft()
  }

  const preferredLocale = String(
    payload._storeLocale || payload.default_locale || payload.source_locale || ''
  )
  return createGlamourDraftFromPayload(payload, {
    preferredLocale,
    importedAt: getStoredImportedAt(payload)
  })
}

function getStoredImportedAt(payload: GlamourImportPayload): string {
  const timestamp = Number(payload._storeTimestamp)

  if (Number.isFinite(timestamp) && timestamp > 0) {
    return new Date(timestamp).toISOString()
  }

  return typeof payload.createdAt === 'string' ? payload.createdAt : ''
}

function writeJsonStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function syncSharedDraftStorage(draft: GlamourDraft) {
  if (!getFilledGlamourDraftEntries(draft).length) {
    localStorage.removeItem(GLAMOUR_CARD_DRAFT_STORAGE_KEY)
    localStorage.removeItem(GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY)
    return
  }

  writeJsonStorage(GLAMOUR_CARD_DRAFT_STORAGE_KEY, draftToGlamourStoreEquipment(draft))
  writeJsonStorage(GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY, draftToGlamourStoreEquipment(draft))
}

function refreshRecentSnapshots() {
  recentSnapshots.value = readGlamourRecentSnapshots()
}

function refreshDraftFromStorage() {
  const storedDraft = loadStoredDraft()
  sharedDraft.value = storedDraft
  updatedAt.value = storedDraft.source.importedAt || ''
}

function scheduleDraftStorageRefresh() {
  if (draftStorageRefreshId !== undefined) {
    window.clearTimeout(draftStorageRefreshId)
  }

  draftStorageRefreshId = window.setTimeout(() => {
    draftStorageRefreshId = undefined
    refreshDraftFromStorage()
  }, 0)
}

function installStorageSyncListener() {
  if (storageListenerInstalled || typeof window === 'undefined') {
    return
  }

  storageListenerInstalled = true
  window.addEventListener('storage', (event) => {
    if (
      event.key === GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY ||
      event.key === GLAMOUR_CARD_DRAFT_STORAGE_KEY
    ) {
      scheduleDraftStorageRefresh()
      return
    }

    if (event.key === GLAMOUR_RECENT_STORAGE_KEY) {
      refreshRecentSnapshots()
    }
  })
}

export function useItemCardDraft() {
  installStorageSyncListener()

  const { current } = useLocale()

  const filledEntries = computed(() => getFilledGlamourDraftEntries(sharedDraft.value))
  const hasEquipment = computed(() => filledEntries.value.length > 0)

  function acceptPayload(payload: GlamourImportPayload, preferredLocale?: string) {
    sharedDraft.value = createGlamourDraftFromPayload(payload, {
      preferredLocale: preferredLocale || normalizeGlamourLocale(current.value)
    })
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function clearDraft() {
    sharedDraft.value = createEmptyGlamourDraft(normalizeGlamourLocale(current.value))
    updatedAt.value = ''
    syncSharedDraftStorage(sharedDraft.value)
  }

  function setLocale(locale: string) {
    sharedDraft.value = setGlamourDraftLocale(sharedDraft.value, locale)
    syncSharedDraftStorage(sharedDraft.value)
  }

  function addCatalogItem(candidate: GlamourCandidate) {
    sharedDraft.value = addItemCardCatalogItem(sharedDraft.value, candidate)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function clearEntry(rowId: string) {
    sharedDraft.value = clearGlamourDraftEntry(sharedDraft.value, rowId)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function selectEntryCandidate(rowId: string, candidateKey: string | number | undefined) {
    sharedDraft.value = selectGlamourDraftEntryCandidate(sharedDraft.value, rowId, candidateKey)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function setEntryDye(rowId: string, dyeIndex: number, stain: GlamourStain) {
    sharedDraft.value = setGlamourDraftEntryDye(sharedDraft.value, rowId, dyeIndex, stain)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function saveCurrentConfig(name: string): boolean {
    const snapshot = createGlamourRecentSnapshot(sharedDraft.value, { name })

    if (!snapshot) {
      return false
    }

    upsertGlamourRecentSnapshot(snapshot)
    refreshRecentSnapshots()
    return true
  }

  function restoreRecentConfig(item: GlamourRecentSnapshot) {
    const restored = createGlamourDraftFromPayload(item.parsed, {
      preferredLocale: item.locale || item.parsed.source_locale || item.parsed.default_locale,
      importedAt: item.savedAt
    })
    sharedDraft.value = restored

    localStorage.removeItem(GLAMOUR_CARD_DRAFT_STORAGE_KEY)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function deleteRecentConfig(id: string) {
    removeGlamourRecentSnapshot(id)
    refreshRecentSnapshots()
  }

  function clearRecentConfigs() {
    clearGlamourRecentSnapshots()
    refreshRecentSnapshots()
  }

  return {
    draft: sharedDraft,
    updatedAt,
    recentSnapshots,
    filledEntries,
    hasEquipment,
    acceptPayload,
    clearDraft,
    setLocale,
    addCatalogItem,
    clearEntry,
    selectEntryCandidate,
    setEntryDye,
    saveCurrentConfig,
    restoreRecentConfig,
    deleteRecentConfig,
    clearRecentConfigs
  }
}
