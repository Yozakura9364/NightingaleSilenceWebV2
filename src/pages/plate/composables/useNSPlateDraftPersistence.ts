import { watch, type Ref } from 'vue'
import type { NSPlateAssetSelectionMap } from '@/lib/plate/draft'
import { normalizeNSPlateInfoDraft, type NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import {
  deleteNSPlatePairedPortrait,
  loadNSPlatePairedPortrait,
  saveNSPlatePairedPortrait
} from '@/pages/plate/services/customPortraitStore'
import type {
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode,
  NSPlateCustomPortraitPopoutLayerAnchor,
  NSPlatePortraitSide,
  NSPlatePresetKind
} from '@/lib/plate/types'
import { normalizeNSPlateCustomPortraitPopoutLayerAnchor } from '@/lib/plate/types'

export const NSPLATE_DRAFT_STORAGE_KEY = 'nsplate.draft.v1'

const NSPLATE_DRAFT_VERSION = 1
const MAX_CUSTOM_PORTRAIT_STORAGE_CHARS = 4_500_000
const TRANSPARENT_IMAGE_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

interface NSPlateStoredDraftV1 {
  version: typeof NSPLATE_DRAFT_VERSION
  savedAt: string
  portraitSide: NSPlatePortraitSide
  selectedPresetIdsByKind: Record<NSPlatePresetKind, string | null>
  selectedAssetIdsByCategory: NSPlateAssetSelectionMap
  customPortrait: NSPlateCustomPortraitImage | null
  infoDraft: NSPlateInfoDraft
}

interface UseNSPlateDraftPersistenceOptions {
  portraitSide: Ref<NSPlatePortraitSide>
  selectedPresetIdsByKind: Ref<Record<NSPlatePresetKind, string | null>>
  selectedAssetIdsByCategory: Ref<NSPlateAssetSelectionMap>
  customPortrait: Ref<NSPlateCustomPortraitImage | null>
  infoDraft: Ref<NSPlateInfoDraft>
}

export function useNSPlateDraftPersistence(options: UseNSPlateDraftPersistenceOptions) {
  const draft = readNSPlateDraft()
  let persistQueue = Promise.resolve()
  let storedPairKey =
    draft?.customPortrait?.mode === 'paired' ? draft.customPortrait.storageKey : undefined

  if (draft) {
    options.portraitSide.value = draft.portraitSide
    options.selectedPresetIdsByKind.value = draft.selectedPresetIdsByKind
    options.selectedAssetIdsByCategory.value = draft.selectedAssetIdsByCategory
    options.infoDraft.value = draft.infoDraft
  }

  const startWatching = () =>
    watch(
      () => ({
        portraitSide: options.portraitSide.value,
        selectedPresetIdsByKind: options.selectedPresetIdsByKind.value,
        selectedAssetIdsByCategory: options.selectedAssetIdsByCategory.value,
        customPortrait: options.customPortrait.value,
        infoDraft: options.infoDraft.value
      }),
      (nextDraft) => {
        persistQueue = persistQueue
          .then(async () => {
            const previousPairKey = storedPairKey
            const nextPairKey = await persistNSPlateDraft(nextDraft)
            storedPairKey = nextPairKey

            if (
              nextPairKey &&
              nextDraft.customPortrait?.mode === 'paired' &&
              !nextDraft.customPortrait.storageKey &&
              options.customPortrait.value === nextDraft.customPortrait
            ) {
              options.customPortrait.value = {
                ...nextDraft.customPortrait,
                storageKey: nextPairKey
              }
            }

            if (previousPairKey && previousPairKey !== nextPairKey) {
              await deleteNSPlatePairedPortrait(previousPairKey)
            }
          })
          .catch(() => undefined)
      }
    )

  if (draft?.customPortrait?.mode === 'paired' && draft.customPortrait.storageKey) {
    options.customPortrait.value = null
    void loadNSPlatePairedPortrait(draft.customPortrait)
      .then((portrait) => {
        options.customPortrait.value = portrait
      })
      .finally(startWatching)
    return
  }

  options.customPortrait.value = draft?.customPortrait ?? null
  startWatching()
}

async function persistNSPlateDraft(draft: Omit<NSPlateStoredDraftV1, 'version' | 'savedAt'>) {
  const portrait = draft.customPortrait

  if (portrait?.mode !== 'paired') {
    writeNSPlateDraft(draft)
    return undefined
  }

  if (portrait.storageKey) {
    writeNSPlateDraft(draft)
    return portrait.storageKey
  }

  const storageKey = await saveNSPlatePairedPortrait(portrait)
  writeNSPlateDraft({
    ...draft,
    customPortrait: storageKey ? { ...portrait, storageKey } : portrait
  })
  return storageKey ?? portrait.storageKey
}

export function readNSPlateDraft(): NSPlateStoredDraftV1 | null {
  const storage = getLocalStorage()

  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(NSPLATE_DRAFT_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isRecord(parsed) || parsed.version !== NSPLATE_DRAFT_VERSION) {
      return null
    }

    return {
      version: NSPLATE_DRAFT_VERSION,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
      portraitSide: normalizePortraitSide(parsed.portraitSide),
      selectedPresetIdsByKind: normalizePresetSelection(parsed.selectedPresetIdsByKind),
      selectedAssetIdsByCategory: normalizeAssetSelection(parsed.selectedAssetIdsByCategory),
      customPortrait: normalizeCustomPortrait(parsed.customPortrait),
      infoDraft: normalizeNSPlateInfoDraft(parsed.infoDraft)
    }
  } catch {
    return null
  }
}

export function writeNSPlateDraft(
  draft: Omit<NSPlateStoredDraftV1, 'version' | 'savedAt'>
): boolean {
  const storage = getLocalStorage()

  if (!storage) {
    return false
  }

  const nextDraft: NSPlateStoredDraftV1 = {
    version: NSPLATE_DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    portraitSide: normalizePortraitSide(draft.portraitSide),
    selectedPresetIdsByKind: normalizePresetSelection(draft.selectedPresetIdsByKind),
    selectedAssetIdsByCategory: normalizeAssetSelection(draft.selectedAssetIdsByCategory),
    customPortrait: sanitizeCustomPortraitForStorage(draft.customPortrait),
    infoDraft: normalizeNSPlateInfoDraft(draft.infoDraft)
  }

  try {
    storage.setItem(NSPLATE_DRAFT_STORAGE_KEY, JSON.stringify(nextDraft))
    return true
  } catch {
    return false
  }
}

export function clearNSPlateDraft(): boolean {
  const storage = getLocalStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(NSPLATE_DRAFT_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function sanitizeCustomPortraitForStorage(
  customPortrait: NSPlateCustomPortraitImage | null
): NSPlateCustomPortraitImage | null {
  const normalized = normalizeCustomPortrait(customPortrait)

  if (!normalized) {
    return null
  }

  if (normalized.mode === 'paired' && normalized.storageKey) {
    return {
      ...normalized,
      dataUrl: TRANSPARENT_IMAGE_DATA_URL,
      overlayDataUrl: TRANSPARENT_IMAGE_DATA_URL
    }
  }

  if (JSON.stringify(normalized).length <= MAX_CUSTOM_PORTRAIT_STORAGE_CHARS) {
    return normalized
  }

  const fallback = createCustomPortraitStorageFallback(normalized)
  return JSON.stringify(fallback).length <= MAX_CUSTOM_PORTRAIT_STORAGE_CHARS ? fallback : null
}

function normalizePresetSelection(value: unknown): Record<NSPlatePresetKind, string | null> {
  const record = isRecord(value) ? value : {}

  return {
    banner: normalizeNullableString(record.banner),
    charcard: normalizeNullableString(record.charcard)
  }
}

function normalizeAssetSelection(value: unknown): NSPlateAssetSelectionMap {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, selectedId]) => [key.trim(), normalizeNullableString(selectedId)] as const)
      .filter(([key]) => key.length > 0)
  )
}

function normalizePortraitSide(value: unknown): NSPlatePortraitSide {
  return value === 'left' ? 'left' : 'right'
}

function normalizeCustomPortrait(value: unknown): NSPlateCustomPortraitImage | null {
  if (!isRecord(value)) {
    return null
  }

  const id = normalizeString(value.id)
  const mode = normalizeCustomPortraitMode(value.mode)
  const fileName = normalizeString(value.fileName)
  const dataUrl = normalizeString(value.dataUrl)
  const width = normalizeFiniteNumber(value.width)
  const height = normalizeFiniteNumber(value.height)
  const scale = normalizeFiniteNumber(value.scale)
  const overlayDataUrl = normalizeString(value.overlayDataUrl)
  const pairedPopoutLayerAnchor = normalizeCustomPortraitPopoutLayerAnchor(
    value.pairedPopoutLayerAnchor
  )

  if (
    !id ||
    !mode ||
    !fileName ||
    !dataUrl ||
    !width ||
    !height ||
    !scale ||
    (mode === 'paired' && (!overlayDataUrl || !pairedPopoutLayerAnchor))
  ) {
    return null
  }

  return {
    id,
    mode,
    ...(mode === 'popout' ? pickOptionalPopoutLayerAnchor(value) : {}),
    ...(mode === 'paired' ? { pairedPopoutLayerAnchor: pairedPopoutLayerAnchor! } : {}),
    ...(mode === 'free' ? pickOptionalFreeLayerAnchor(value) : {}),
    fileName,
    dataUrl,
    width,
    height,
    scale,
    ...pickOptionalString(value, 'sourceDataUrl'),
    ...pickOptionalString(value, 'renderDataUrl'),
    ...pickOptionalString(value, 'overlayFileName'),
    ...(overlayDataUrl ? { overlayDataUrl } : {}),
    ...pickOptionalString(value, 'storageKey'),
    ...pickOptionalNumber(value, 'overlayWidth'),
    ...pickOptionalNumber(value, 'overlayHeight'),
    ...pickOptionalNumber(value, 'sourceWidth'),
    ...pickOptionalNumber(value, 'sourceHeight'),
    ...pickOptionalNumber(value, 'renderWidth'),
    ...pickOptionalNumber(value, 'renderHeight'),
    ...pickOptionalNumber(value, 'renderOffsetX'),
    ...pickOptionalNumber(value, 'renderOffsetY'),
    ...pickOptionalNumber(value, 'baseScale'),
    ...pickOptionalNumber(value, 'scaleMultiplier'),
    ...pickOptionalNumber(value, 'offsetX'),
    ...pickOptionalNumber(value, 'offsetY'),
    ...pickOptionalNumber(value, 'rotation'),
    ...pickOptionalNumber(value, 'splitY'),
    ...pickOptionalNumber(value, 'splitLeftY'),
    ...pickOptionalNumber(value, 'splitRightY'),
    ...pickOptionalNumber(value, 'freeX'),
    ...pickOptionalNumber(value, 'freeY'),
    ...pickOptionalNumber(value, 'freeScale'),
    ...pickOptionalNumber(value, 'freeRotation')
  }
}

function normalizeCustomPortraitMode(value: unknown): NSPlateCustomPortraitMode | null {
  return value === 'standard' || value === 'popout' || value === 'paired' || value === 'free'
    ? value
    : null
}

function normalizeCustomPortraitPopoutLayerAnchor(
  value: unknown
): NSPlateCustomPortraitPopoutLayerAnchor | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return normalizeNSPlateCustomPortraitPopoutLayerAnchor(value)
}

function normalizeNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  return normalizeString(value)
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function pickOptionalString(
  record: Record<string, unknown>,
  key: keyof NSPlateCustomPortraitImage
) {
  const value = normalizeString(record[key])
  return value ? { [key]: value } : {}
}

function pickOptionalPopoutLayerAnchor(record: Record<string, unknown>) {
  const value = normalizeCustomPortraitPopoutLayerAnchor(record.popoutLayerAnchor)
  return value ? { popoutLayerAnchor: value } : {}
}

function pickOptionalFreeLayerAnchor(record: Record<string, unknown>) {
  if (record.freeLayerAnchor === 'portraitBase') return { freeLayerAnchor: 'portraitBase' as const }
  const value = normalizeCustomPortraitPopoutLayerAnchor(record.freeLayerAnchor)
  return value ? { freeLayerAnchor: value } : {}
}

function pickOptionalNumber(
  record: Record<string, unknown>,
  key: keyof NSPlateCustomPortraitImage
) {
  const value = normalizeFiniteNumber(record[key])
  return value === null ? {} : { [key]: value }
}

function createCustomPortraitStorageFallback(
  customPortrait: NSPlateCustomPortraitImage
): NSPlateCustomPortraitImage {
  if (customPortrait.mode !== 'standard' && customPortrait.mode !== 'popout') {
    return customPortrait
  }

  const renderDataUrl =
    customPortrait.mode === 'popout'
      ? (customPortrait.renderDataUrl ?? customPortrait.sourceDataUrl)
      : undefined
  const renderWidth = customPortrait.renderWidth ?? customPortrait.sourceWidth
  const renderHeight = customPortrait.renderHeight ?? customPortrait.sourceHeight
  const renderOffsetX = customPortrait.renderDataUrl
    ? customPortrait.renderOffsetX
    : customPortrait.offsetX
  const renderOffsetY = customPortrait.renderDataUrl
    ? customPortrait.renderOffsetY
    : customPortrait.offsetY

  return {
    ...customPortrait,
    sourceDataUrl: customPortrait.dataUrl,
    sourceWidth: customPortrait.width,
    sourceHeight: customPortrait.height,
    baseScale: 1,
    scaleMultiplier: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    ...(renderDataUrl
      ? {
          renderDataUrl,
          renderWidth,
          renderHeight,
          renderOffsetX,
          renderOffsetY
        }
      : {})
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getLocalStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
