import { watch, type Ref } from 'vue'
import type { NSPlateAssetSelectionMap } from '@/lib/plate/draft'
import { normalizeNSPlateInfoDraft, type NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import type {
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode,
  NSPlatePortraitSide,
  NSPlatePresetKind
} from '@/lib/plate/types'

export const NSPLATE_DRAFT_STORAGE_KEY = 'nsplate.draft.v1'

const NSPLATE_DRAFT_VERSION = 1
const MAX_CUSTOM_PORTRAIT_STORAGE_CHARS = 3_000_000

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

  if (draft) {
    options.portraitSide.value = draft.portraitSide
    options.selectedPresetIdsByKind.value = draft.selectedPresetIdsByKind
    options.selectedAssetIdsByCategory.value = draft.selectedAssetIdsByCategory
    options.customPortrait.value = draft.customPortrait
    options.infoDraft.value = draft.infoDraft
  }

  watch(
    () => ({
      portraitSide: options.portraitSide.value,
      selectedPresetIdsByKind: options.selectedPresetIdsByKind.value,
      selectedAssetIdsByCategory: options.selectedAssetIdsByCategory.value,
      customPortrait: options.customPortrait.value,
      infoDraft: options.infoDraft.value
    }),
    (nextDraft) => {
      writeNSPlateDraft(nextDraft)
    }
  )
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

  return JSON.stringify(normalized).length <= MAX_CUSTOM_PORTRAIT_STORAGE_CHARS ? normalized : null
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

  if (!id || !mode || !fileName || !dataUrl || !width || !height || !scale) {
    return null
  }

  return {
    id,
    mode,
    fileName,
    dataUrl,
    width,
    height,
    scale,
    ...pickOptionalString(value, 'sourceDataUrl'),
    ...pickOptionalNumber(value, 'sourceWidth'),
    ...pickOptionalNumber(value, 'sourceHeight'),
    ...pickOptionalNumber(value, 'baseScale'),
    ...pickOptionalNumber(value, 'scaleMultiplier'),
    ...pickOptionalNumber(value, 'offsetX'),
    ...pickOptionalNumber(value, 'offsetY'),
    ...pickOptionalNumber(value, 'splitY')
  }
}

function normalizeCustomPortraitMode(value: unknown): NSPlateCustomPortraitMode | null {
  return value === 'standard' || value === 'popout' ? value : null
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

function pickOptionalNumber(
  record: Record<string, unknown>,
  key: keyof NSPlateCustomPortraitImage
) {
  const value = normalizeFiniteNumber(record[key])
  return value === null ? {} : { [key]: value }
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
