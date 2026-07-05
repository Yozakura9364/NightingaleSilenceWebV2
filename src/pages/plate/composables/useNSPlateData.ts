import { computed, onMounted, ref, watch } from 'vue'
import { ApiError } from '@/composables/useFetch'
import { useLocale } from '@/stores/locale'
import {
  applyPresetToAssetSelection,
  createEmptyAssetSelection,
  findAssetBySelectionId,
  getSelectedAssetsByCategory,
  toggleAssetInSelection,
  type NSPlateAssetSelectionMap
} from '@/lib/plate/draft'
import type { NSPlateCatalogDataSource } from '@/lib/plate/dataSource'
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateFilesResponse,
  NSPlatePresetKind,
  NSPlatePresetGroup,
  NSPlatePresetSummary,
  NSPlatePresetsResponse
} from '@/lib/plate/types'
import { normalizeFiles, normalizePresets } from '@/pages/plate/services/nsplateAdapters'

export function useNSPlateData(dataSource: NSPlateCatalogDataSource) {
  const { current } = useLocale()

  const isLoading = ref(false)
  const errorText = ref<string | null>(null)
  const presetsResponse = ref<NSPlatePresetsResponse | null>(null)
  const filesResponse = ref<NSPlateFilesResponse | null>(null)
  const selectedPresetIdsByKind = ref<Record<NSPlatePresetKind, string | null>>({
    banner: null,
    charcard: null
  })
  const selectedAssetIdsByCategory = ref<NSPlateAssetSelectionMap>({})
  const lastPresetMatchedCount = ref(0)
  const lastPresetMissingCount = ref(0)

  const presetGroups = computed<NSPlatePresetGroup[]>(() =>
    normalizePresets(presetsResponse.value, current.value)
  )
  const assetGroups = computed<NSPlateAssetGroup[]>(() =>
    normalizeFiles(filesResponse.value, current.value)
  )
  const presets = computed(() => presetGroups.value.flatMap((group) => group.presets))
  const selectedPresetsByKind = computed<Record<NSPlatePresetKind, NSPlatePresetSummary | null>>(
    () => ({
      banner:
        presets.value.find((preset) => preset.id === selectedPresetIdsByKind.value.banner) ?? null,
      charcard:
        presets.value.find((preset) => preset.id === selectedPresetIdsByKind.value.charcard) ?? null
    })
  )
  const selectedAssets = computed<NSPlateAssetSummary[]>(() =>
    getSelectedAssetsByCategory(assetGroups.value, selectedAssetIdsByCategory.value)
  )

  async function reload() {
    isLoading.value = true
    errorText.value = null

    try {
      const [nextPresets, nextFiles] = await Promise.all([
        dataSource.fetchPresets(),
        dataSource.fetchFiles()
      ])
      presetsResponse.value = nextPresets
      filesResponse.value = nextFiles
    } catch (error) {
      errorText.value = error instanceof ApiError ? `HTTP ${error.status}` : 'NSPlate API'
    } finally {
      isLoading.value = false
    }
  }

  watch(
    presetGroups,
    (groups) => {
      const nextIds: Record<NSPlatePresetKind, string | null> = { ...selectedPresetIdsByKind.value }

      for (const group of groups) {
        const selectedId = nextIds[group.kind]
        nextIds[group.kind] =
          selectedId && group.presets.some((preset) => preset.id === selectedId) ? selectedId : null
      }

      selectedPresetIdsByKind.value = nextIds
    },
    { immediate: true }
  )

  watch(assetGroups, syncAssetSelectionKeys, { immediate: true })

  function syncAssetSelectionKeys(groups: NSPlateAssetGroup[]) {
    const emptySelection = createEmptyAssetSelection(groups)
    const nextSelection: NSPlateAssetSelectionMap = { ...emptySelection }

    for (const group of groups) {
      const key = `${group.scope}:${group.category}`
      const selectedId = selectedAssetIdsByCategory.value[key]
      const selectedAsset = selectedId ? findAssetBySelectionId(group, selectedId) : null

      nextSelection[key] = selectedAsset?.id ?? null
    }

    selectedAssetIdsByCategory.value = nextSelection
  }

  function toggleAsset(asset: NSPlateAssetSummary) {
    selectedAssetIdsByCategory.value = toggleAssetInSelection(
      selectedAssetIdsByCategory.value,
      asset
    )
  }

  function applyPreset(preset: NSPlatePresetSummary) {
    selectedPresetIdsByKind.value = {
      ...selectedPresetIdsByKind.value,
      [preset.kind]: preset.id
    }

    const result = applyPresetToAssetSelection(
      selectedAssetIdsByCategory.value,
      assetGroups.value,
      preset
    )

    selectedAssetIdsByCategory.value = result.selection
    lastPresetMatchedCount.value = result.matchedCount
    lastPresetMissingCount.value = result.missingCount
  }

  function clearAllSelections() {
    selectedPresetIdsByKind.value = {
      banner: null,
      charcard: null
    }
    selectedAssetIdsByCategory.value = createEmptyAssetSelection(assetGroups.value)
    lastPresetMatchedCount.value = 0
    lastPresetMissingCount.value = 0
  }

  onMounted(() => {
    void reload()
  })

  return {
    isLoading,
    errorText,
    reload,
    presetGroups,
    presets,
    assetGroups,
    selectedPresetIdsByKind,
    selectedPresetsByKind,
    selectedAssetIdsByCategory,
    selectedAssets,
    lastPresetMatchedCount,
    lastPresetMissingCount,
    toggleAsset,
    applyPreset,
    clearAllSelections
  }
}
