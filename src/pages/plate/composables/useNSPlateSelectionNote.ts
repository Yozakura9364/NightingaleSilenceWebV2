import { computed, ref, type Ref } from 'vue'
import { textKeys } from '@/config/site'
import {
  NSPLATE_NAMEPLATE_PRESET_CATEGORIES,
  NSPLATE_PORTRAIT_CATEGORIES,
  getPlateAssetSectionKey,
  getScopeForCategory,
  selectedAssetForGroup,
  type NSPlateAssetSelectionMap
} from '@/lib/plate/draft'
import { useLocale } from '@/stores/locale'
import type {
  NSPlateAssetGroup,
  NSPlateCanvasMode,
  NSPlatePanelTab,
  NSPlateSelectionNoteItem
} from '@/lib/plate/types'

interface UseNSPlateSelectionNoteOptions {
  assetGroups: Ref<NSPlateAssetGroup[]>
  selectedAssetIdsByCategory: Ref<NSPlateAssetSelectionMap>
  activeTab: Ref<NSPlatePanelTab>
  activeCanvasMode: Ref<NSPlateCanvasMode>
}

const SELECTION_NOTE_CATEGORIES = [
  ...NSPLATE_PORTRAIT_CATEGORIES,
  ...NSPLATE_NAMEPLATE_PRESET_CATEGORIES
] as readonly string[]

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

    return SELECTION_NOTE_CATEGORIES.map((category) => {
      const scope = getScopeForCategory(category)
      const sectionKey = getPlateAssetSectionKey(scope, category)
      const group = groupByKey.get(sectionKey)

      if (!group) {
        return null
      }

      const selectedAsset = selectedAssetForGroup(options.selectedAssetIdsByCategory.value, group)

      return {
        sectionKey,
        scope,
        category,
        label: group.label,
        valueLabel: selectedAsset?.label ?? t(textKeys.notSelected),
        selected: selectedAsset !== null
      }
    }).filter((item): item is NSPlateSelectionNoteItem => item !== null)
  })

  function focusAssetSection(item: NSPlateSelectionNoteItem) {
    options.activeTab.value = item.scope
    options.activeCanvasMode.value = item.scope
    assetPanelFocusRequest.value = {
      sectionKey: item.sectionKey,
      requestId: (assetPanelFocusRequest.value?.requestId ?? 0) + 1
    }
  }

  return {
    selectionNoteItems,
    assetPanelFocusRequest,
    focusAssetSection
  }
}
