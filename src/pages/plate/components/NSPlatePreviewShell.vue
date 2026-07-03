<template>
  <NSPlateCanvasArea
    :mode="mode"
    :selected-assets="selectedAssets"
    :custom-portrait="customPortrait"
    :can-clear-custom-portrait="false"
    :can-clear-all="false"
  />
</template>

<script setup lang="ts">
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/lib/plate/types'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'

defineProps<{
  mode: NSPlateCanvasMode
  selectedAssets: NSPlateAssetSummary[]
  customPortrait: NSPlateCustomPortraitImage | null
}>()
</script>
