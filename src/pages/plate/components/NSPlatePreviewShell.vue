<template>
  <NSPlateCanvasArea
    :api-base="plateApiBase"
    :mode="mode"
    :selected-assets="selectedAssets"
    :asset-groups="emptyAssetGroups"
    :custom-portrait="customPortrait"
    :info-draft="infoDraft"
    :can-clear-custom-portrait="false"
    :can-clear-all="false"
    :can-import-config="false"
    selection-note-title=""
    :selection-note-items="[]"
  />
</template>

<script setup lang="ts">
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/lib/plate/types'
import { getRequiredFfxivTool } from '@/config/site'
import { createNSPlateInfoDraft } from '@/lib/plate/infoLayers'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'

const plateApiBase = getRequiredFfxivTool('plate').apiBase ?? '/api/plate'
const infoDraft = createNSPlateInfoDraft()
const emptyAssetGroups: NSPlateAssetGroup[] = []

defineProps<{
  mode: NSPlateCanvasMode
  selectedAssets: NSPlateAssetSummary[]
  customPortrait: NSPlateCustomPortraitImage | null
}>()
</script>
