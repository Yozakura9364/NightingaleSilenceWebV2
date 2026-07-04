import {
  assetMatchesSelectionId,
  createEmptyAssetSelection,
  getPlateAssetSectionKey,
  type NSPlateAssetSelectionMap
} from '@/lib/plate/draft'
import { normalizeNSPlateInfoDraft, type NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import {
  importNSPlateLegacyConfigText,
  type NSPlateLegacyConfigImportContext
} from '@/lib/plate/legacyConfig'
import type {
  NSPlateAssetGroup,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode,
  NSPlatePanelTab,
  NSPlatePortraitSide,
  NSPlatePresetKind,
  NSPlatePresetSummary
} from '@/lib/plate/types'

export interface NSPlateConfigTransferState {
  portraitSide: NSPlatePortraitSide
  selectedPresetIdsByKind: Record<NSPlatePresetKind, string | null>
  selectedAssetIdsByCategory: NSPlateAssetSelectionMap
  customPortrait: NSPlateCustomPortraitImage | null
  infoDraft: NSPlateInfoDraft
}

export interface NSPlateConfigImportResult extends NSPlateConfigTransferState {
  activePanel: NSPlatePanelTab | null
  matchedAssetCount: number
  missingAssetCount: number
  ignoredInfoLayerCount: number
  source: 'v2' | 'legacy'
}

interface NSPlateV2ConfigPayload {
  app: 'NSPlate'
  format: 'nsplate-v2-config'
  version: 1
  exportedAt: string
  draft: NSPlateConfigTransferState
}

const NSPLATE_V2_CONFIG_FORMAT = 'nsplate-v2-config'
const NSPLATE_V2_CONFIG_VERSION = 1

export function createNSPlateConfigJson(state: NSPlateConfigTransferState): string {
  const payload: NSPlateV2ConfigPayload = {
    app: 'NSPlate',
    format: NSPLATE_V2_CONFIG_FORMAT,
    version: NSPLATE_V2_CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    draft: {
      portraitSide: normalizePortraitSide(state.portraitSide),
      selectedPresetIdsByKind: normalizePresetSelection(state.selectedPresetIdsByKind),
      selectedAssetIdsByCategory: normalizeAssetSelectionMap(state.selectedAssetIdsByCategory),
      customPortrait: normalizeCustomPortrait(state.customPortrait),
      infoDraft: normalizeNSPlateInfoDraft(state.infoDraft)
    }
  }

  return JSON.stringify(payload, null, 2)
}

export async function importNSPlateConfigText(
  rawText: string,
  context: NSPlateLegacyConfigImportContext
): Promise<NSPlateConfigImportResult> {
  const v2Config = tryParseNSPlateV2Config(rawText, context)

  if (v2Config) {
    return v2Config
  }

  const legacyResult = await importNSPlateLegacyConfigText(rawText, context)

  return {
    ...legacyResult,
    source: 'legacy'
  }
}

export function createNSPlateConfigFilename() {
  return `nsplate-config-${Date.now()}.json`
}

function tryParseNSPlateV2Config(
  rawText: string,
  context: NSPlateLegacyConfigImportContext
): NSPlateConfigImportResult | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawText.trim())
  } catch {
    return null
  }

  if (!isNSPlateV2ConfigPayload(parsed)) {
    return null
  }

  const { selection, matchedAssetCount, missingAssetCount } = normalizeImportedAssetSelection(
    parsed.draft.selectedAssetIdsByCategory,
    context.assetGroups
  )

  return {
    portraitSide: normalizePortraitSide(parsed.draft.portraitSide),
    selectedPresetIdsByKind: normalizeImportedPresetSelection(
      parsed.draft.selectedPresetIdsByKind,
      context.presets
    ),
    selectedAssetIdsByCategory: selection,
    customPortrait: normalizeCustomPortrait(parsed.draft.customPortrait),
    infoDraft: normalizeNSPlateInfoDraft(parsed.draft.infoDraft),
    activePanel: 'info',
    matchedAssetCount,
    missingAssetCount,
    ignoredInfoLayerCount: 0,
    source: 'v2'
  }
}

function isNSPlateV2ConfigPayload(value: unknown): value is NSPlateV2ConfigPayload {
  return (
    isRecord(value) &&
    value.app === 'NSPlate' &&
    value.format === NSPLATE_V2_CONFIG_FORMAT &&
    value.version === NSPLATE_V2_CONFIG_VERSION &&
    isRecord(value.draft)
  )
}

function normalizeImportedPresetSelection(
  value: unknown,
  presets: NSPlatePresetSummary[]
): Record<NSPlatePresetKind, string | null> {
  const raw = isRecord(value) ? value : {}

  return {
    banner: findPresetId(presets, 'banner', raw.banner),
    charcard: findPresetId(presets, 'charcard', raw.charcard)
  }
}

function normalizePresetSelection(value: unknown): Record<NSPlatePresetKind, string | null> {
  const raw = isRecord(value) ? value : {}

  return {
    banner: normalizeNullableString(raw.banner),
    charcard: normalizeNullableString(raw.charcard)
  }
}

function findPresetId(presets: NSPlatePresetSummary[], kind: NSPlatePresetKind, value: unknown) {
  const id = normalizeNullableString(value)

  if (!id) {
    return null
  }

  return presets.some((preset) => preset.kind === kind && preset.id === id) ? id : null
}

function normalizePortraitSide(value: unknown): NSPlatePortraitSide {
  return value === 'left' ? 'left' : 'right'
}

function normalizeImportedAssetSelection(value: unknown, assetGroups: NSPlateAssetGroup[]) {
  const output = createEmptyAssetSelection(assetGroups)
  const raw = isRecord(value) ? value : {}
  let matchedAssetCount = 0
  let missingAssetCount = 0

  for (const [rawSectionKey, rawSelectedId] of Object.entries(raw)) {
    const selectedId = normalizeNullableString(rawSelectedId)

    if (!selectedId) {
      continue
    }

    const group = findAssetGroupForSectionKey(assetGroups, rawSectionKey)

    if (!group) {
      missingAssetCount += 1
      continue
    }

    const asset = group.assets.find((item) => assetMatchesSelectionId(item, selectedId))

    if (!asset) {
      missingAssetCount += 1
      continue
    }

    output[getPlateAssetSectionKey(group.scope, group.category)] = asset.id
    matchedAssetCount += 1
  }

  return {
    selection: output,
    matchedAssetCount,
    missingAssetCount
  }
}

function normalizeAssetSelectionMap(value: unknown): NSPlateAssetSelectionMap {
  const raw = isRecord(value) ? value : {}

  return Object.fromEntries(
    Object.entries(raw)
      .map(
        ([sectionKey, selectedId]) =>
          [sectionKey.trim(), normalizeNullableString(selectedId)] as const
      )
      .filter(([sectionKey]) => sectionKey.length > 0)
  )
}

function findAssetGroupForSectionKey(assetGroups: NSPlateAssetGroup[], sectionKey: string) {
  const normalized = sectionKey.trim()

  return (
    assetGroups.find(
      (group) => getPlateAssetSectionKey(group.scope, group.category) === normalized
    ) ??
    assetGroups.find((group) => group.category === normalized) ??
    null
  )
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

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  return normalizeString(value)
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
