import { computed, ref } from 'vue'
import {
  buildGlamourCopyText,
  DEFAULT_GLAMOUR_COPY_TEMPLATE,
  normalizeGlamourCopyFormat,
  type GlamourCopyFormat
} from '@/lib/glamour/copyText'
import {
  clearGlamourDraftEntry,
  createEmptyGlamourDraft,
  createGlamourDraftFromPayload,
  draftToGlamourStoreEquipment,
  draftToGlamourTemplateDraft,
  getFilledGlamourDraftEntries,
  GLAMOUR_CARD_DRAFT_STORAGE_KEY,
  GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY,
  replaceGlamourDraftEntryCandidate,
  selectGlamourDraftEntryCandidate,
  setGlamourDraftEntryDye,
  setGlamourDraftLocale,
  storedGlamourValueToPayload
} from '@/lib/glamour/draft'
import { normalizeGlamourLocale } from '@/lib/glamour/equipment'
import {
  GLAMOUR_RECENT_STORAGE_KEY,
  clearGlamourRecentSnapshots,
  createGlamourRecentSnapshot,
  readGlamourRecentSnapshots,
  removeGlamourRecentSnapshot,
  upsertGlamourRecentSnapshot
} from '@/lib/glamour/recent'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourImportPayload,
  GlamourRecentSnapshot,
  GlamourStain
} from '@/lib/glamour/types'
import { useLocale } from '@/stores/locale'

const COPY_FORMAT_KEY = 'nsglamour.copyFormat'
const CUSTOM_TEMPLATE_KEY = 'nsglamour.copyTemplate'

const initialDraft = loadStoredDraft()
const sharedDraft = ref<GlamourDraft>(initialDraft)
const updatedAt = ref(initialDraft.source.importedAt || '')
const copyFormat = ref<GlamourCopyFormat>(loadCopyFormat())
const customCopyTemplate = ref(loadCustomCopyTemplate())
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
  const storePayload = storedGlamourValueToPayload(readJsonStorage(GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY))
  const cardPayload = storedGlamourValueToPayload(readJsonStorage(GLAMOUR_CARD_DRAFT_STORAGE_KEY))
  const payload = storePayload || cardPayload

  if (!payload) {
    return createEmptyGlamourDraft()
  }

  const preferredLocale = String(payload._storeLocale || payload.default_locale || payload.source_locale || '')
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

function loadCopyFormat(): GlamourCopyFormat {
  return normalizeGlamourCopyFormat(localStorage.getItem(COPY_FORMAT_KEY) || undefined)
}

function loadCustomCopyTemplate(): string {
  return localStorage.getItem(CUSTOM_TEMPLATE_KEY) || DEFAULT_GLAMOUR_COPY_TEMPLATE
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

  writeJsonStorage(GLAMOUR_CARD_DRAFT_STORAGE_KEY, draftToGlamourTemplateDraft(draft))
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

export function useGlamourDraft() {
  installStorageSyncListener()

  const { current } = useLocale()

  const filledEntries = computed(() => getFilledGlamourDraftEntries(sharedDraft.value))
  const hasEquipment = computed(() => filledEntries.value.length > 0)
  const copyText = computed(() =>
    buildGlamourCopyText(sharedDraft.value, {
      format: copyFormat.value,
      customTemplate: customCopyTemplate.value
    })
  )

  function acceptPayload(
    payload: GlamourImportPayload,
    preferredLocale?: string,
    options: { importMode?: 'template-link' | '' } = {}
  ) {
    sharedDraft.value = createGlamourDraftFromPayload(payload, {
      preferredLocale: preferredLocale || normalizeGlamourLocale(current.value),
      importMode: options.importMode || ''
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

  function replaceEntry(slot: string, candidate: GlamourCandidate) {
    sharedDraft.value = replaceGlamourDraftEntryCandidate(sharedDraft.value, slot, candidate)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function clearEntry(slot: string) {
    sharedDraft.value = clearGlamourDraftEntry(sharedDraft.value, slot)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function selectEntryCandidate(slot: string, candidateKey: string | number | undefined) {
    sharedDraft.value = selectGlamourDraftEntryCandidate(sharedDraft.value, slot, candidateKey)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function setEntryDye(slot: string, dyeIndex: number, stain: GlamourStain) {
    sharedDraft.value = setGlamourDraftEntryDye(sharedDraft.value, slot, dyeIndex, stain)
    updatedAt.value = new Date().toISOString()
    syncSharedDraftStorage(sharedDraft.value)
  }

  function setCopyFormat(format: string) {
    copyFormat.value = normalizeGlamourCopyFormat(format)
    localStorage.setItem(COPY_FORMAT_KEY, copyFormat.value)
  }

  function setCustomCopyTemplate(template: string) {
    customCopyTemplate.value = template
    localStorage.setItem(CUSTOM_TEMPLATE_KEY, template)
  }

  function resetCustomCopyTemplate() {
    setCustomCopyTemplate(DEFAULT_GLAMOUR_COPY_TEMPLATE)
  }

  function saveCurrentConfig(name: string): boolean {
    const snapshot = createGlamourRecentSnapshot(sharedDraft.value, {
      name,
      copyFormat: copyFormat.value,
      customTemplate: customCopyTemplate.value
    })

    if (!snapshot) {
      return false
    }

    upsertGlamourRecentSnapshot(snapshot)
    refreshRecentSnapshots()
    return true
  }

  function restoreRecentConfig(item: GlamourRecentSnapshot, options: { mode?: 'template' | 'equipinfo' } = {}) {
    const restored = createGlamourDraftFromPayload(item.parsed, {
      preferredLocale: item.locale || item.parsed.source_locale || item.parsed.default_locale,
      importedAt: item.savedAt
    })
    const displayName = item.displayName || item.sourceName || restored.source.name
    const templateMode = options.mode === 'template'

    sharedDraft.value = {
      ...restored,
      source: {
        ...restored.source,
        type: templateMode ? '' : restored.source.type,
        name: templateMode ? '手动编辑' : displayName,
        title: templateMode ? '' : restored.source.title,
        url: templateMode ? '' : restored.source.url,
        sourceId: templateMode ? '' : restored.source.sourceId,
        authorName: templateMode ? '' : restored.source.authorName,
        authorWorld: templateMode ? '' : restored.source.authorWorld,
        authorLabel: templateMode ? '' : restored.source.authorLabel,
        race: templateMode ? '' : restored.source.race,
        gender: templateMode ? '' : restored.source.gender,
        importMode: ''
      }
    }

    if (!templateMode) {
      copyFormat.value = normalizeGlamourCopyFormat(item.copyFormat)
      customCopyTemplate.value =
        typeof item.customTemplate === 'string' ? item.customTemplate : loadCustomCopyTemplate()
    }

    localStorage.removeItem(GLAMOUR_CARD_DRAFT_STORAGE_KEY)
    localStorage.setItem(COPY_FORMAT_KEY, copyFormat.value)
    localStorage.setItem(CUSTOM_TEMPLATE_KEY, customCopyTemplate.value)
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
    copyFormat,
    customCopyTemplate,
    filledEntries,
    hasEquipment,
    copyText,
    acceptPayload,
    clearDraft,
    setLocale,
    replaceEntry,
    clearEntry,
    selectEntryCandidate,
    setEntryDye,
    setCopyFormat,
    setCustomCopyTemplate,
    resetCustomCopyTemplate,
    saveCurrentConfig,
    restoreRecentConfig,
    deleteRecentConfig,
    clearRecentConfigs
  }
}
