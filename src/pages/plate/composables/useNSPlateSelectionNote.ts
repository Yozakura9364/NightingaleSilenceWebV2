import { computed, ref, type Ref } from 'vue'
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import {
  getPlateAssetSectionKey,
  getScopeForCategory,
  selectedAssetForGroup,
  type NSPlateAssetSelectionMap
} from '@/lib/plate/draft'
import { getNSPlateInfoActiveLayers, type NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import { getNameplateLayerOrderSlots } from '@/lib/plate/render'
import { useLocale } from '@/stores/locale'
import type {
  NSPlateAssetGroup,
  NSPlateCanvasMode,
  NSPlateCustomPortraitFreeLayerAnchor,
  NSPlateCustomPortraitImage,
  NSPlatePanelTab,
  NSPlateSelectionNoteItem
} from '@/lib/plate/types'
import {
  NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS,
  normalizeNSPlateCustomPortraitFreeLayerAnchor,
  normalizeNSPlateCustomPortraitPopoutLayerAnchor
} from '@/lib/plate/types'

interface UseNSPlateSelectionNoteOptions {
  assetGroups: Ref<NSPlateAssetGroup[]>
  selectedAssetIdsByCategory: Ref<NSPlateAssetSelectionMap>
  customPortrait: Ref<NSPlateCustomPortraitImage | null>
  infoDraft: Ref<NSPlateInfoDraft>
  activeTab: Ref<NSPlatePanelTab>
  activeCanvasMode: Ref<NSPlateCanvasMode>
}

export function useNSPlateSelectionNote(options: UseNSPlateSelectionNoteOptions) {
  const { t } = useLocale()
  const assetPanelFocusRequest = ref<{ sectionKey: string; requestId: number } | null>(null)

  const selectionNoteItems = computed<NSPlateSelectionNoteItem[]>(() => {
    const groupByKey = new Map(
      options.assetGroups.value.map((group) => [
        getPlateAssetSectionKey(group.scope, group.category),
        group
      ])
    )
    const items: NSPlateSelectionNoteItem[] = []

    for (const slot of [...getNameplateLayerOrderSlots(options.customPortrait.value)].reverse()) {
      if (slot.type === 'asset') {
        items.push(createAssetLayerOrderItem(slot.category, groupByKey))
        continue
      }

      if (slot.type === 'customPortraitInFrame') {
        items.push(createCustomPortraitInFrameItem())
        continue
      }

      if (slot.type === 'customPortraitPopout') {
        items.push(createCustomPortraitPopoutItem())
        continue
      }

      items.push(createInfoLayerOrderItem())
    }

    return items
  })

  function focusAssetSection(item: NSPlateSelectionNoteItem) {
    if (item.target === 'customPortrait') {
      options.activeTab.value = 'portrait'
      options.activeCanvasMode.value = 'portrait'
      return
    }

    if (item.target === 'info') {
      options.activeTab.value = 'info'
      options.activeCanvasMode.value = 'nameplate'
      return
    }

    if (!item.scope || !item.sectionKey) {
      return
    }

    options.activeTab.value = item.scope
    options.activeCanvasMode.value = item.scope
    assetPanelFocusRequest.value = {
      sectionKey: item.sectionKey,
      requestId: (assetPanelFocusRequest.value?.requestId ?? 0) + 1
    }
  }

  function createAssetLayerOrderItem(
    category: string,
    groupByKey: Map<string, NSPlateAssetGroup>
  ): NSPlateSelectionNoteItem {
    const scope = getScopeForCategory(category)
    const sectionKey = getPlateAssetSectionKey(scope, category)
    const group = groupByKey.get(sectionKey)
    const selectedAsset = group
      ? selectedAssetForGroup(options.selectedAssetIdsByCategory.value, group)
      : null

    return {
      id: sectionKey,
      target: 'asset',
      sectionKey,
      scope,
      category,
      label: group?.label ?? category,
      valueLabel: selectedAsset?.label ?? t(textKeys.notSelected),
      selected: selectedAsset !== null
    }
  }

  function createCustomPortraitInFrameItem(): NSPlateSelectionNoteItem {
    return {
      id: 'customPortrait:inFrame',
      target: 'customPortrait',
      label: t(textKeys.nsplateCustomPortrait),
      valueLabel: options.customPortrait.value?.fileName ?? t(textKeys.notSelected),
      selected: options.customPortrait.value !== null
    }
  }

  function createCustomPortraitPopoutItem(): NSPlateSelectionNoteItem {
    const portrait = options.customPortrait.value
    const isFree = portrait?.mode === 'free'
    const isEnabled = portrait?.mode === 'popout' || isFree
    const currentAnchor = isFree
      ? normalizeNSPlateCustomPortraitFreeLayerAnchor(portrait.freeLayerAnchor)
      : normalizeNSPlateCustomPortraitPopoutLayerAnchor(portrait?.popoutLayerAnchor)
    const layerAnchors: readonly NSPlateCustomPortraitFreeLayerAnchor[] = isFree
      ? (['portraitBase', ...NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS] as const)
      : NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS
    const anchorIndex = layerAnchors.indexOf(currentAnchor)

    return {
      id: 'customPortrait:popout',
      target: 'customPortrait',
      label: t(textKeys.nsplateLayerOrderCustomPortraitPopout),
      valueLabel: isEnabled
        ? (portrait?.fileName ?? t(textKeys.notSelected))
        : t(textKeys.nsplateLayerOrderNotEnabled),
      selected: isEnabled,
      movable: isEnabled,
      canMoveUp: isEnabled && anchorIndex >= 0 && anchorIndex < layerAnchors.length - 1,
      canMoveDown: isEnabled && anchorIndex > 0
    }
  }

  function createInfoLayerOrderItem(): NSPlateSelectionNoteItem {
    const activeLayers = getNSPlateInfoActiveLayers(options.infoDraft.value)
    const hasEnabledLayer = activeLayers.some((entry) => entry.state.enabled)

    return {
      id: `info:${options.infoDraft.value.activePresetId}`,
      target: 'info',
      label: t(textKeys.nsplateLayerOrderInfoLayers),
      valueLabel: hasEnabledLayer
        ? t(textKeys.nsplateLayerOrderEnabled)
        : t(textKeys.nsplateLayerOrderNotEnabled),
      selected: hasEnabledLayer
    }
  }

  return {
    selectionNoteItems,
    assetPanelFocusRequest,
    focusAssetSection
  }
}
