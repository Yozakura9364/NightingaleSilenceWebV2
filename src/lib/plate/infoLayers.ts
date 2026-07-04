import {
  getNSPlateInfoDefaultText,
  nsPlateInfoPresetDefinitions,
  type NSPlateInfoFieldDefinition,
  type NSPlateInfoLayerType,
  type NSPlateInfoPresetId
} from '@/lib/plate/infoLayerFields'

export const NSPLATE_DEFAULT_INFO_PRESET_ID: NSPlateInfoPresetId = 'phantom-tide'

export interface NSPlateInfoDraft {
  activePresetId: NSPlateInfoPresetId
  layersByPresetId: Record<NSPlateInfoPresetId, NSPlateInfoLayerStateMap>
}

export type NSPlateInfoLayerState =
  | NSPlateInfoTextLayerState
  | NSPlateInfoIconLayerState
  | NSPlateInfoSpecialLayerState
  | NSPlateInfoFixedLayerState
  | NSPlateInfoBar48LayerState

export type NSPlateInfoLayerStateMap = Record<string, NSPlateInfoLayerState>

export interface NSPlateInfoLayerViewModel {
  definition: NSPlateInfoFieldDefinition
  state: NSPlateInfoLayerState
}

export const NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT = 6
export type NSPlateInfoSpecialMaterialKind = 'background' | 'mask' | 'symbol'

interface NSPlateInfoLayerStateBase {
  slotId: string
  type: NSPlateInfoLayerType
  enabled: boolean
}

export interface NSPlateInfoTextLayerState extends NSPlateInfoLayerStateBase {
  type: 'text'
  text: string
}

export interface NSPlateInfoIconLayerState extends NSPlateInfoLayerStateBase {
  type: 'icon'
  itemId: string
  itemIds: string[]
}

export interface NSPlateInfoSpecialLayerState extends NSPlateInfoLayerStateBase {
  type: 'special'
  bgItemId: string
  maskItemId: string
  symbolItemId: string
  maskDarkColor: string
  maskLightColor: string
}

export interface NSPlateInfoFixedLayerState extends NSPlateInfoLayerStateBase {
  type: 'fixed'
  path: string
}

export interface NSPlateInfoBar48LayerState extends NSPlateInfoLayerStateBase {
  type: 'bar48'
  states: number[]
}

const INFO_BAR48_COUNT = 48

export function createNSPlateInfoDraft(
  activePresetId: NSPlateInfoPresetId = NSPLATE_DEFAULT_INFO_PRESET_ID
): NSPlateInfoDraft {
  return normalizeNSPlateInfoDraft({ activePresetId })
}

export function normalizeNSPlateInfoDraft(value: unknown): NSPlateInfoDraft {
  const source = isRecord(value) ? value : {}
  const activePresetId = normalizeInfoPresetId(source.activePresetId)
  const rawLayersByPresetId = isRecord(source.layersByPresetId) ? source.layersByPresetId : {}

  return {
    activePresetId,
    layersByPresetId: Object.fromEntries(
      nsPlateInfoPresetDefinitions.map((preset) => [
        preset.id,
        normalizeInfoLayerMap(preset.id, rawLayersByPresetId[preset.id])
      ])
    ) as Record<NSPlateInfoPresetId, NSPlateInfoLayerStateMap>
  }
}

export function setNSPlateInfoActivePreset(
  draft: NSPlateInfoDraft,
  presetId: NSPlateInfoPresetId
): NSPlateInfoDraft {
  return normalizeNSPlateInfoDraft({
    ...draft,
    activePresetId: presetId
  })
}

export function updateNSPlateInfoLayerEnabled(
  draft: NSPlateInfoDraft,
  slotId: string,
  enabled: boolean
): NSPlateInfoDraft {
  return updateNSPlateInfoLayerState(draft, slotId, (state) => ({
    ...state,
    enabled
  }))
}

export function updateNSPlateInfoText(
  draft: NSPlateInfoDraft,
  slotId: string,
  text: string
): NSPlateInfoDraft {
  return updateNSPlateInfoLayerState(draft, slotId, (state) =>
    state.type === 'text'
      ? {
          ...state,
          text: normalizeText(text)
        }
      : state
  )
}

export function toggleNSPlateInfoBar48Cell(
  draft: NSPlateInfoDraft,
  slotId: string,
  cellIndex: number
): NSPlateInfoDraft {
  const index = Math.trunc(Number(cellIndex))

  if (!Number.isInteger(index) || index < 0 || index >= INFO_BAR48_COUNT) {
    return normalizeNSPlateInfoDraft(draft)
  }

  return updateNSPlateInfoLayerState(draft, slotId, (state) => {
    if (state.type !== 'bar48') {
      return state
    }

    const states = normalizeBar48States(state.states)
    states[index] = states[index] ? 0 : 1

    return {
      ...state,
      states
    }
  })
}

export function setNSPlateInfoBar48All(
  draft: NSPlateInfoDraft,
  slotId: string,
  enabled: boolean
): NSPlateInfoDraft {
  return updateNSPlateInfoLayerState(draft, slotId, (state) =>
    state.type === 'bar48'
      ? {
          ...state,
          states: Array.from({ length: INFO_BAR48_COUNT }, () => (enabled ? 1 : 0))
        }
      : state
  )
}

export function updateNSPlateInfoIconMaterial(
  draft: NSPlateInfoDraft,
  slotId: string,
  itemId: string
): NSPlateInfoDraft {
  return updateNSPlateInfoLayerState(draft, slotId, (state) =>
    state.type === 'icon'
      ? {
          ...state,
          itemId: normalizeString(itemId),
          itemIds: []
        }
      : state
  )
}

export function toggleNSPlateInfoActivityIconMaterial(
  draft: NSPlateInfoDraft,
  slotId: string,
  itemId: string,
  maxCount = NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT
): NSPlateInfoDraft {
  const targetId = normalizeString(itemId)

  if (!targetId) {
    return normalizeNSPlateInfoDraft(draft)
  }

  return updateNSPlateInfoLayerState(draft, slotId, (state) => {
    if (state.type !== 'icon') {
      return state
    }

    const currentIds = normalizeIconItemIds(
      state.itemIds.length > 0 ? state.itemIds : state.itemId ? [state.itemId] : [],
      maxCount
    )
    const nextIds = currentIds.includes(targetId)
      ? currentIds.filter((currentId) => currentId !== targetId)
      : currentIds.length >= maxCount
        ? currentIds
        : [...currentIds, targetId]

    return {
      ...state,
      itemId: nextIds[0] ?? '',
      itemIds: normalizeIconItemIds(nextIds, maxCount)
    }
  })
}

export function updateNSPlateInfoSpecialMaterial(
  draft: NSPlateInfoDraft,
  slotId: string,
  kind: NSPlateInfoSpecialMaterialKind,
  itemId: string
): NSPlateInfoDraft {
  return updateNSPlateInfoLayerState(draft, slotId, (state) => {
    if (state.type !== 'special') {
      return state
    }

    const normalizedItemId = normalizeString(itemId)

    if (kind === 'background') {
      return {
        ...state,
        bgItemId: normalizedItemId
      }
    }

    if (kind === 'mask') {
      return {
        ...state,
        maskItemId: normalizedItemId
      }
    }

    return {
      ...state,
      symbolItemId: normalizedItemId
    }
  })
}

export function setNSPlateInfoActivePresetLayersEnabled(
  draft: NSPlateInfoDraft,
  enabled: boolean
): NSPlateInfoDraft {
  const normalized = normalizeNSPlateInfoDraft(draft)
  const activePreset = nsPlateInfoPresetDefinitions.find(
    (preset) => preset.id === normalized.activePresetId
  )

  if (!activePreset) {
    return normalized
  }

  const currentMap = normalized.layersByPresetId[activePreset.id]

  return normalizeNSPlateInfoDraft({
    ...normalized,
    layersByPresetId: {
      ...normalized.layersByPresetId,
      [activePreset.id]: Object.fromEntries(
        activePreset.fields.map((field) => {
          const state =
            currentMap[field.slotId] ?? createDefaultInfoLayerState(activePreset.id, field)
          return [
            field.slotId,
            {
              ...state,
              enabled
            }
          ]
        })
      )
    }
  })
}

export function resetNSPlateInfoActivePreset(draft: NSPlateInfoDraft): NSPlateInfoDraft {
  const normalized = normalizeNSPlateInfoDraft(draft)
  const activePreset = nsPlateInfoPresetDefinitions.find(
    (preset) => preset.id === normalized.activePresetId
  )

  if (!activePreset) {
    return normalized
  }

  return normalizeNSPlateInfoDraft({
    ...normalized,
    layersByPresetId: {
      ...normalized.layersByPresetId,
      [activePreset.id]: normalizeInfoLayerMap(activePreset.id, {})
    }
  })
}

export function getNSPlateInfoActiveLayers(draft: NSPlateInfoDraft): NSPlateInfoLayerViewModel[] {
  const normalized = normalizeNSPlateInfoDraft(draft)
  const definition = nsPlateInfoPresetDefinitions.find(
    (preset) => preset.id === normalized.activePresetId
  )

  if (!definition) {
    return []
  }

  const layerMap = normalized.layersByPresetId[definition.id]
  return definition.fields.map((field) => ({
    definition: field,
    state: layerMap[field.slotId] ?? createDefaultInfoLayerState(definition.id, field)
  }))
}

export function getNSPlateInfoLayerTypeKey(type: NSPlateInfoLayerType) {
  return `plate.info.layerType.${type}`
}

function updateNSPlateInfoLayerState(
  draft: NSPlateInfoDraft,
  slotId: string,
  update: (state: NSPlateInfoLayerState) => NSPlateInfoLayerState
): NSPlateInfoDraft {
  const normalized = normalizeNSPlateInfoDraft(draft)
  const activePreset = nsPlateInfoPresetDefinitions.find(
    (preset) => preset.id === normalized.activePresetId
  )
  const field = activePreset?.fields.find((item) => item.slotId === slotId)

  if (!activePreset || !field) {
    return normalized
  }

  const currentMap = normalized.layersByPresetId[activePreset.id]
  const currentState = currentMap[slotId] ?? createDefaultInfoLayerState(activePreset.id, field)

  return normalizeNSPlateInfoDraft({
    ...normalized,
    layersByPresetId: {
      ...normalized.layersByPresetId,
      [activePreset.id]: {
        ...currentMap,
        [slotId]: update(currentState)
      }
    }
  })
}

function normalizeInfoLayerMap(
  presetId: NSPlateInfoPresetId,
  value: unknown
): NSPlateInfoLayerStateMap {
  const source = isRecord(value) ? value : {}
  const preset = nsPlateInfoPresetDefinitions.find((item) => item.id === presetId)

  if (!preset) {
    return {}
  }

  const shouldBackfillTextDefaults = shouldBackfillPresetDefaultTexts(preset, source)

  return Object.fromEntries(
    preset.fields.map((field) => [
      field.slotId,
      normalizeInfoLayerState(presetId, field, source[field.slotId], shouldBackfillTextDefaults)
    ])
  )
}

function normalizeInfoLayerState(
  presetId: NSPlateInfoPresetId,
  definition: NSPlateInfoFieldDefinition,
  value: unknown,
  shouldBackfillTextDefault: boolean
): NSPlateInfoLayerState {
  const source = isRecord(value) ? value : {}
  const base = {
    slotId: definition.slotId,
    type: definition.type,
    enabled: source.enabled === false ? false : true
  }

  if (definition.type === 'icon') {
    return {
      ...base,
      type: 'icon',
      itemId: normalizeString(source.itemId),
      itemIds: normalizeIconItemIds(source.itemIds)
    }
  }

  if (definition.type === 'special') {
    return {
      ...base,
      type: 'special',
      bgItemId: normalizeString(source.bgItemId),
      maskItemId: normalizeString(source.maskItemId),
      symbolItemId: normalizeString(source.symbolItemId),
      maskDarkColor: normalizeHexColor(source.maskDarkColor, '#5f3c22'),
      maskLightColor: normalizeHexColor(source.maskLightColor, '#f6d9a7')
    }
  }

  if (definition.type === 'fixed') {
    return {
      ...base,
      type: 'fixed',
      path: normalizeString(source.path)
    }
  }

  if (definition.type === 'bar48') {
    return {
      ...base,
      type: 'bar48',
      states: normalizeBar48States(source.states)
    }
  }

  return {
    ...base,
    type: 'text',
    text: shouldBackfillTextDefault
      ? getNSPlateInfoDefaultText(presetId, definition.slotId)
      : normalizeText(source.text)
  }
}

function createDefaultInfoLayerState(
  presetId: NSPlateInfoPresetId,
  definition: NSPlateInfoFieldDefinition
): NSPlateInfoLayerState {
  return normalizeInfoLayerState(presetId, definition, {}, true)
}

function shouldBackfillPresetDefaultTexts(
  preset: { id: NSPlateInfoPresetId; fields: NSPlateInfoFieldDefinition[] },
  source: Record<string, unknown>
) {
  return preset.fields
    .filter((field) => field.type === 'text')
    .every((field) => {
      const state = source[field.slotId]

      if (!isRecord(state) || !Object.prototype.hasOwnProperty.call(state, 'text')) {
        return true
      }

      return normalizeText(state.text).length === 0
    })
}

function normalizeInfoPresetId(value: unknown): NSPlateInfoPresetId {
  return nsPlateInfoPresetDefinitions.some((preset) => preset.id === value)
    ? (value as NSPlateInfoPresetId)
    : NSPLATE_DEFAULT_INFO_PRESET_ID
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.slice(0, 2000) : ''
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 300) : ''
}

function normalizeIconItemIds(value: unknown, maxCount = NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT) {
  const normalizedMaxCount = Math.max(0, Math.trunc(Number(maxCount) || 0))
  const source = Array.isArray(value)
    ? value
    : value === null || value === undefined || value === ''
      ? []
      : [value]
  const seen = new Set<string>()
  const output: string[] = []

  for (const item of source) {
    if (output.length >= normalizedMaxCount) {
      break
    }

    const normalized = normalizeString(item)

    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    output.push(normalized)
  }

  return output
}

function normalizeBar48States(value: unknown) {
  const states = Array.isArray(value)
    ? value.map((item) => (item ? 1 : 0))
    : typeof value === 'string'
      ? value.split('').map((item) => (item === '1' ? 1 : 0))
      : []

  while (states.length < INFO_BAR48_COUNT) {
    states.push(0)
  }

  return states.slice(0, INFO_BAR48_COUNT)
}

function normalizeHexColor(value: unknown, fallback: string) {
  const text = normalizeString(value)

  return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
