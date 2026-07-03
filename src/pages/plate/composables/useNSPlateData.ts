import { computed, onMounted, ref, watch } from 'vue'
import { ApiError } from '@/composables/useFetch'
import { useLocale } from '@/stores/locale'
import type { ApiBoundary } from '@/services/apiBoundaries'
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateFilesResponse,
  NSPlatePresetGroup,
  NSPlatePresetSummary,
  NSPlatePresetsResponse
} from '@/pages/plate/types'
import { normalizeFiles, normalizePresets, useNSPlateApi } from '@/pages/plate/services/nsplateApi'

export function useNSPlateData(boundary: ApiBoundary) {
  const { current } = useLocale()
  const api = useNSPlateApi(boundary.apiBase)

  const isLoading = ref(false)
  const errorText = ref<string | null>(null)
  const presetsResponse = ref<NSPlatePresetsResponse | null>(null)
  const filesResponse = ref<NSPlateFilesResponse | null>(null)
  const selectedPresetId = ref<string | null>(null)
  const selectedAssetId = ref<string | null>(null)

  const presetGroups = computed<NSPlatePresetGroup[]>(() =>
    normalizePresets(presetsResponse.value, current.value)
  )
  const assetGroups = computed<NSPlateAssetGroup[]>(() =>
    normalizeFiles(filesResponse.value, current.value)
  )
  const presets = computed(() => presetGroups.value.flatMap((group) => group.presets))
  const assets = computed(() => assetGroups.value.flatMap((group) => group.assets))
  const selectedPreset = computed<NSPlatePresetSummary | null>(
    () => presets.value.find((preset) => preset.id === selectedPresetId.value) ?? null
  )
  const selectedAsset = computed<NSPlateAssetSummary | null>(
    () => assets.value.find((asset) => asset.id === selectedAssetId.value) ?? null
  )

  async function reload() {
    isLoading.value = true
    errorText.value = null

    try {
      const [nextPresets, nextFiles] = await Promise.all([api.fetchPresets(), api.fetchFiles()])
      presetsResponse.value = nextPresets
      filesResponse.value = nextFiles
    } catch (error) {
      errorText.value = error instanceof ApiError ? `HTTP ${error.status}` : 'NSPlate API'
    } finally {
      isLoading.value = false
    }
  }

  watch(
    presets,
    (items) => {
      if (!items.length) {
        selectedPresetId.value = null
        return
      }

      if (!selectedPresetId.value || !items.some((item) => item.id === selectedPresetId.value)) {
        selectedPresetId.value = items[0].id
      }
    },
    { immediate: true }
  )

  watch(
    assets,
    (items) => {
      if (!items.length) {
        selectedAssetId.value = null
        return
      }

      if (!selectedAssetId.value || !items.some((item) => item.id === selectedAssetId.value)) {
        selectedAssetId.value = items[0].id
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    void reload()
  })

  return {
    isLoading,
    errorText,
    reload,
    presetGroups,
    assetGroups,
    selectedPresetId,
    selectedPreset,
    selectedAssetId,
    selectedAsset
  }
}
