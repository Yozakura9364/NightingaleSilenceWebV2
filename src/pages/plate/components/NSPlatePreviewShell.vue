<template>
  <NSPlateCanvasArea
    :mode="mode"
    :selected-preset="selectedPreset"
    :selected-asset="selectedAsset"
  />
</template>

<script setup lang="ts">
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlatePresetSummary
} from '@/pages/plate/types'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'

defineProps<{
  mode: NSPlateCanvasMode
  selectedPreset: NSPlatePresetSummary | null
  selectedAsset: NSPlateAssetSummary | null
}>()
</script>
