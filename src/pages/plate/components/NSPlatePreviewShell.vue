<template>
  <NSPlateCanvasArea
    :api-base="plateApiBase"
    :mode="mode"
    :selected-assets="selectedAssets"
    :custom-portrait="customPortrait"
    :can-clear-custom-portrait="false"
    :can-clear-all="false"
    selection-note-title=""
    :selection-note-items="[]"
  />
</template>

<script setup lang="ts">
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/lib/plate/types'
import { getRequiredFfxivTool } from '@/config/site'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'

const plateApiBase = getRequiredFfxivTool('plate').apiBase ?? '/api/plate'

defineProps<{
  mode: NSPlateCanvasMode
  selectedAssets: NSPlateAssetSummary[]
  customPortrait: NSPlateCustomPortraitImage | null
}>()
</script>
