<template>
  <NSPlateCanvasArea
    :api-base="plateApiBase"
    :mode="props.mode"
    :portrait-side="props.portraitSide"
    :selected-assets="props.selectedAssets"
    :asset-groups="emptyAssetGroups"
    :custom-portrait="props.customPortrait"
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
  NSPlateCustomPortraitImage,
  NSPlatePortraitSide
} from '@/lib/plate/types'
import { getRequiredFfxivTool } from '@/config/site'
import { createNSPlateInfoDraft } from '@/lib/plate/infoLayers'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'

const plateApiBase = getRequiredFfxivTool('plate').apiBase ?? '/api/plate'
const infoDraft = createNSPlateInfoDraft()
const emptyAssetGroups: NSPlateAssetGroup[] = []

const props = withDefaults(
  defineProps<{
    mode: NSPlateCanvasMode
    portraitSide?: NSPlatePortraitSide
    selectedAssets: NSPlateAssetSummary[]
    customPortrait: NSPlateCustomPortraitImage | null
  }>(),
  {
    portraitSide: 'right'
  }
)
</script>
