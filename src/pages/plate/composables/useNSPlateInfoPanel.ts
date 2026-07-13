import { computed, ref, type Ref } from 'vue'
import { textKeys } from '@/config/site'
import {
  getNSPlateInfoAssetItemId,
  normalizeNSPlateInfoAssetValues,
  nsPlateInfoAssetMatchesValue
} from '@/lib/plate/infoLayerAssetMatching'
import type { NSPlateInfoPresetId } from '@/lib/plate/infoLayerFields'
import { nsPlateInfoGraphicRenderDefinitions } from '@/lib/plate/infoLayerRenderDefinitions'
import {
  NSPLATE_INFO_ACTIVITY_ICON_CATEGORY,
  NSPLATE_INFO_SPECIAL_BG_CATEGORY,
  NSPLATE_INFO_SPECIAL_DEFAULT_SYMBOL_ITEM_ID,
  NSPLATE_INFO_SPECIAL_MASK_CATEGORY,
  NSPLATE_INFO_SPECIAL_SYMBOL_CATEGORY,
  type NSPlateInfoIconRenderDefinition
} from '@/lib/plate/infoLayerRenderTypes'
import {
  NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT,
  getNSPlateInfoActiveLayers,
  resetNSPlateInfoActivePreset,
  setNSPlateInfoActivePreset,
  setNSPlateInfoActivePresetLayersEnabled,
  setNSPlateInfoBar48All,
  toggleNSPlateInfoActivityIconMaterial,
  toggleNSPlateInfoBar48Cell,
  updateNSPlateInfoIconMaterial,
  updateNSPlateInfoLayerEnabled,
  updateNSPlateInfoSpecialMaterial,
  updateNSPlateInfoText,
  type NSPlateInfoBar48LayerState,
  type NSPlateInfoDraft,
  type NSPlateInfoIconLayerState,
  type NSPlateInfoLayerState,
  type NSPlateInfoSpecialLayerState,
  type NSPlateInfoSpecialMaterialKind
} from '@/lib/plate/infoLayers'
import type { NSPlateAssetGroup, NSPlateAssetSummary } from '@/lib/plate/types'

interface UseNSPlateInfoPanelOptions {
  modelValue: Readonly<Ref<NSPlateInfoDraft>>
  assetGroups: Readonly<Ref<NSPlateAssetGroup[]>>
  t: (key: string) => string
  updateModelValue: (value: NSPlateInfoDraft) => void
}

const BAR48_KEYS = {
  actions: 'plate.info.bar48.actions',
  allEmpty: 'plate.info.bar48.allEmpty',
  allOn: 'plate.info.bar48.allOn',
  stateSelect: 'plate.info.bar48.stateSelect',
  cellPrefix: 'plate.info.bar48.cellPrefix',
  cellSeparator: 'plate.info.bar48.cellSeparator',
  cellOn: 'plate.info.bar48.cellOn',
  cellOff: 'plate.info.bar48.cellOff'
} as const

const ICON_KEYS = {
  material: 'plate.info.icon.material',
  selectedCount: 'plate.info.icon.selectedCount'
} as const

const SPECIAL_KEYS = {
  background: 'plate.info.special.background',
  mask: 'plate.info.special.mask',
  symbol: 'plate.info.special.symbol',
  noBackground: 'plate.info.special.noBackground',
  noMask: 'plate.info.special.noMask',
  maskNeedsBackground: 'plate.info.special.maskNeedsBackground'
} as const

const ACTION_KEYS = {
  group: 'plate.info.actions.group',
  showAll: 'plate.info.actions.showAll',
  hideAll: 'plate.info.actions.hideAll',
  reset: 'plate.info.actions.reset',
  resetConfirm: 'plate.info.actions.resetConfirm'
} as const

const VISIBILITY_KEYS = {
  show: textKeys.nsplateInfoLayerShow,
  hide: textKeys.nsplateInfoLayerHide
} as const

const SPECIAL_MATERIAL_SECTIONS = [
  {
    kind: 'background',
    category: NSPLATE_INFO_SPECIAL_BG_CATEGORY,
    labelKey: SPECIAL_KEYS.background,
    noneLabelKey: SPECIAL_KEYS.noBackground,
    allowNone: true
  },
  {
    kind: 'mask',
    category: NSPLATE_INFO_SPECIAL_MASK_CATEGORY,
    labelKey: SPECIAL_KEYS.mask,
    noneLabelKey: SPECIAL_KEYS.noMask,
    allowNone: true
  },
  {
    kind: 'symbol',
    category: NSPLATE_INFO_SPECIAL_SYMBOL_CATEGORY,
    labelKey: SPECIAL_KEYS.symbol,
    noneLabelKey: '',
    allowNone: false
  }
] satisfies {
  kind: NSPlateInfoSpecialMaterialKind
  category: string
  labelKey: string
  noneLabelKey: string
  allowNone: boolean
}[]

export function useNSPlateInfoPanel(options: UseNSPlateInfoPanelOptions) {
  const activeLayers = computed(() => getNSPlateInfoActiveLayers(options.modelValue.value))
  const openLayerIds = ref<Record<string, boolean>>({})
  const openIconMaterialSectionIds = ref<Record<string, boolean>>({})
  const openSpecialSectionIds = ref<Record<string, boolean>>({})

  function setActivePreset(event: Event) {
    options.updateModelValue(
      setNSPlateInfoActivePreset(
        options.modelValue.value,
        (event.target as HTMLSelectElement).value as NSPlateInfoPresetId
      )
    )
  }

  function getLayerOpenKey(slotId: string) {
    return `${options.modelValue.value.activePresetId}:${slotId}`
  }

  function getLayerPanelId(slotId: string) {
    return `nsplate-info-layer-${options.modelValue.value.activePresetId}-${slotId}`
  }

  function isLayerOpen(slotId: string) {
    return openLayerIds.value[getLayerOpenKey(slotId)] === true
  }

  function isLayerExpandable(state: NSPlateInfoLayerState) {
    return (
      state.type === 'text' ||
      state.type === 'icon' ||
      state.type === 'bar48' ||
      state.type === 'special'
    )
  }

  function toggleLayerOpen(slotId: string) {
    const key = getLayerOpenKey(slotId)
    openLayerIds.value = {
      ...openLayerIds.value,
      [key]: !openLayerIds.value[key]
    }
  }

  function setLayerEnabled(slotId: string, enabled: boolean) {
    options.updateModelValue(
      updateNSPlateInfoLayerEnabled(options.modelValue.value, slotId, enabled)
    )
  }

  function getLayerVisibilityLabel(enabled: boolean) {
    return options.t(enabled ? VISIBILITY_KEYS.hide : VISIBILITY_KEYS.show)
  }

  function setTextLayerValue(slotId: string, event: Event) {
    options.updateModelValue(
      updateNSPlateInfoText(
        options.modelValue.value,
        slotId,
        (event.target as HTMLTextAreaElement).value
      )
    )
  }

  function toggleBar48Cell(slotId: string, cellIndex: number) {
    options.updateModelValue(
      toggleNSPlateInfoBar48Cell(options.modelValue.value, slotId, cellIndex)
    )
  }

  function setBar48All(slotId: string, enabled: boolean) {
    options.updateModelValue(setNSPlateInfoBar48All(options.modelValue.value, slotId, enabled))
  }

  function setAllLayersEnabled(enabled: boolean) {
    options.updateModelValue(
      setNSPlateInfoActivePresetLayersEnabled(options.modelValue.value, enabled)
    )
  }

  function resetActivePreset() {
    if (!window.confirm(options.t(ACTION_KEYS.resetConfirm))) {
      return
    }

    options.updateModelValue(resetNSPlateInfoActivePreset(options.modelValue.value))
  }

  function getIconMaterialSectionOpenKey(slotId: string) {
    return `${options.modelValue.value.activePresetId}:${slotId}:icon-material`
  }

  function getIconMaterialSectionPanelId(slotId: string) {
    return `nsplate-info-icon-material-${options.modelValue.value.activePresetId}-${slotId}`
  }

  function isIconMaterialSectionOpen(slotId: string) {
    return openIconMaterialSectionIds.value[getIconMaterialSectionOpenKey(slotId)] === true
  }

  function toggleIconMaterialSection(slotId: string) {
    const key = getIconMaterialSectionOpenKey(slotId)
    openIconMaterialSectionIds.value = {
      ...openIconMaterialSectionIds.value,
      [key]: !openIconMaterialSectionIds.value[key]
    }
  }

  function getIconRenderDefinition(slotId: string): NSPlateInfoIconRenderDefinition | null {
    const definition = nsPlateInfoGraphicRenderDefinitions[
      options.modelValue.value.activePresetId
    ].find((item) => item.slotId === slotId)

    return definition?.type === 'icon' ? definition : null
  }

  function isIconRenderDefinitionActivity(definition: NSPlateInfoIconRenderDefinition | null) {
    return (
      definition?.isActivity === true ||
      definition?.sourceCat === NSPLATE_INFO_ACTIVITY_ICON_CATEGORY
    )
  }

  function isActivityIconLayer(state: NSPlateInfoIconLayerState) {
    return isIconRenderDefinitionActivity(getIconRenderDefinition(state.slotId))
  }

  function getIconRenderDefinitionSourceCats(
    definition: NSPlateInfoIconRenderDefinition | null
  ) {
    if (!definition) {
      return []
    }

    const sourceCats = definition.sourceCats?.length
      ? definition.sourceCats
      : [definition.sourceCat]

    return Array.from(new Set(sourceCats.map((sourceCat) => sourceCat.trim()).filter(Boolean)))
  }

  function getIconMaterialAssets(state: NSPlateInfoIconLayerState) {
    const definition = getIconRenderDefinition(state.slotId)
    const sourceCats = getIconRenderDefinitionSourceCats(definition)

    if (!definition || sourceCats.length === 0) {
      return []
    }

    return sourceCats.flatMap((category) =>
      options.assetGroups.value
        .filter((group) => group.scope === 'nameplate' && group.category === category)
        .flatMap((group) => group.assets)
    )
  }

  function getIconSelectedValues(state: NSPlateInfoIconLayerState) {
    const definition = getIconRenderDefinition(state.slotId)

    if (isIconRenderDefinitionActivity(definition)) {
      return normalizeNSPlateInfoAssetValues(
        state.itemIds.length > 0
          ? state.itemIds
          : state.itemId
            ? [state.itemId]
            : definition?.itemIds.length
              ? definition.itemIds
              : definition?.itemId
                ? [definition.itemId]
                : [],
        NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT
      )
    }

    const value = state.itemId || definition?.itemId || ''
    return value ? [value] : []
  }

  function getIconSummary(state: NSPlateInfoIconLayerState) {
    return getIconMaterialSelectionLabel(state)
  }

  function getIconMaterialSelectionLabel(state: NSPlateInfoIconLayerState) {
    const selectedValues = getIconSelectedValues(state)

    if (isActivityIconLayer(state)) {
      return getIconSelectedCountText(selectedValues.length)
    }

    const selectedValue = selectedValues[0] ?? ''
    const asset = selectedValue ? findIconAssetByValue(state, selectedValue) : null

    return asset?.label ?? selectedValue ?? options.t(textKeys.notSelected)
  }

  function getIconSelectedCountLabel(state: NSPlateInfoIconLayerState) {
    return getIconSelectedCountText(getIconSelectedValues(state).length)
  }

  function getIconSelectedCountText(selectedCount: number) {
    return `${options.t(ICON_KEYS.selectedCount)} ${selectedCount}/${NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT}`
  }

  function selectIconMaterial(state: NSPlateInfoIconLayerState, asset: NSPlateAssetSummary) {
    const selectedValue = getIconSelectedValues(state).find((value) =>
      nsPlateInfoAssetMatchesValue(asset, value)
    )
    const itemId = selectedValue || getNSPlateInfoAssetItemId(asset)

    options.updateModelValue(
      isActivityIconLayer(state)
        ? toggleNSPlateInfoActivityIconMaterial(options.modelValue.value, state.slotId, itemId)
        : updateNSPlateInfoIconMaterial(options.modelValue.value, state.slotId, itemId)
    )
  }

  function isIconAssetSelected(state: NSPlateInfoIconLayerState, asset: NSPlateAssetSummary) {
    return getIconSelectedValues(state).some((value) => nsPlateInfoAssetMatchesValue(asset, value))
  }

  function findIconAssetByValue(state: NSPlateInfoIconLayerState, value: string) {
    return getIconMaterialAssets(state).find((asset) => nsPlateInfoAssetMatchesValue(asset, value))
  }

  function getSpecialSectionOpenKey(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
    return `${options.modelValue.value.activePresetId}:${slotId}:${kind}`
  }

  function getSpecialSectionPanelId(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
    return `nsplate-info-special-${options.modelValue.value.activePresetId}-${slotId}-${kind}`
  }

  function isSpecialSectionOpen(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
    return openSpecialSectionIds.value[getSpecialSectionOpenKey(slotId, kind)] === true
  }

  function toggleSpecialSection(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
    const key = getSpecialSectionOpenKey(slotId, kind)
    openSpecialSectionIds.value = {
      ...openSpecialSectionIds.value,
      [key]: !openSpecialSectionIds.value[key]
    }
  }

  function getSpecialMaterialAssets(kind: NSPlateInfoSpecialMaterialKind) {
    const section = SPECIAL_MATERIAL_SECTIONS.find((item) => item.kind === kind)

    if (!section) {
      return []
    }

    return (
      options.assetGroups.value.find(
        (group) => group.scope === 'nameplate' && group.category === section.category
      )?.assets ?? []
    )
  }

  function getSpecialMaterialValue(
    state: NSPlateInfoSpecialLayerState,
    kind: NSPlateInfoSpecialMaterialKind
  ) {
    if (kind === 'background') {
      return state.bgItemId
    }

    if (kind === 'mask') {
      return state.maskItemId
    }

    return state.symbolItemId || NSPLATE_INFO_SPECIAL_DEFAULT_SYMBOL_ITEM_ID
  }

  function getSpecialSummary(state: NSPlateInfoSpecialLayerState) {
    return getSpecialSelectionLabel(state, 'symbol')
  }

  function getSpecialSelectionLabel(
    state: NSPlateInfoSpecialLayerState,
    kind: NSPlateInfoSpecialMaterialKind
  ) {
    const value = getSpecialMaterialValue(state, kind)

    if (!value && kind === 'background') {
      return options.t(SPECIAL_KEYS.noBackground)
    }

    if (!value && kind === 'mask') {
      return options.t(SPECIAL_KEYS.noMask)
    }

    const asset = findSpecialAssetByValue(kind, value)
    return asset?.label ?? value ?? options.t(textKeys.notSelected)
  }

  function hasSpecialBackground(state: NSPlateInfoSpecialLayerState) {
    return getSpecialMaterialValue(state, 'background').length > 0
  }

  function clearSpecialMaterial(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
    if (kind === 'symbol') {
      return
    }

    options.updateModelValue(
      updateNSPlateInfoSpecialMaterial(options.modelValue.value, slotId, kind, '')
    )
  }

  function selectSpecialMaterial(
    slotId: string,
    kind: NSPlateInfoSpecialMaterialKind,
    asset: NSPlateAssetSummary
  ) {
    options.updateModelValue(
      updateNSPlateInfoSpecialMaterial(
        options.modelValue.value,
        slotId,
        kind,
        getNSPlateInfoAssetItemId(asset)
      )
    )
  }

  function isSpecialAssetSelected(
    state: NSPlateInfoSpecialLayerState,
    kind: NSPlateInfoSpecialMaterialKind,
    asset: NSPlateAssetSummary
  ) {
    return nsPlateInfoAssetMatchesValue(asset, getSpecialMaterialValue(state, kind))
  }

  function findSpecialAssetByValue(kind: NSPlateInfoSpecialMaterialKind, value: string) {
    return getSpecialMaterialAssets(kind).find((asset) =>
      nsPlateInfoAssetMatchesValue(asset, value)
    )
  }

  function getBar48Summary(state: NSPlateInfoBar48LayerState) {
    return `${state.states.filter((item) => item === 1).length}/${state.states.length}`
  }

  function getBar48CellLabel(cellIndex: number, enabled: boolean) {
    return `${options.t(BAR48_KEYS.cellPrefix)}${cellIndex + 1}${options.t(BAR48_KEYS.cellSeparator)}${options.t(enabled ? BAR48_KEYS.cellOn : BAR48_KEYS.cellOff)}`
  }

  return {
    ACTION_KEYS,
    BAR48_KEYS,
    ICON_KEYS,
    SPECIAL_KEYS,
    SPECIAL_MATERIAL_SECTIONS,
    activeLayers,
    clearSpecialMaterial,
    getBar48CellLabel,
    getBar48Summary,
    getIconMaterialAssets,
    getIconMaterialSectionPanelId,
    getIconMaterialSelectionLabel,
    getIconSelectedCountLabel,
    getIconSummary,
    getLayerPanelId,
    getLayerVisibilityLabel,
    getSpecialMaterialAssets,
    getSpecialMaterialValue,
    getSpecialSectionPanelId,
    getSpecialSelectionLabel,
    getSpecialSummary,
    hasSpecialBackground,
    isActivityIconLayer,
    isIconAssetSelected,
    isIconMaterialSectionOpen,
    isLayerExpandable,
    isLayerOpen,
    isSpecialAssetSelected,
    isSpecialSectionOpen,
    resetActivePreset,
    selectIconMaterial,
    selectSpecialMaterial,
    setActivePreset,
    setAllLayersEnabled,
    setBar48All,
    setLayerEnabled,
    setTextLayerValue,
    toggleBar48Cell,
    toggleIconMaterialSection,
    toggleLayerOpen,
    toggleSpecialSection
  }
}
