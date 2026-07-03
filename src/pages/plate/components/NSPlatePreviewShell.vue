<template>
  <NSPlateCanvasArea
    :mode="mode"
    :selected-assets="selectedAssets"
    :custom-portrait="customPortrait"
  />
</template>

<script setup lang="ts">
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/pages/plate/types'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'

defineProps<{
  mode: NSPlateCanvasMode
  selectedAssets: NSPlateAssetSummary[]
  customPortrait: NSPlateCustomPortraitImage | null
}>()
</script>
