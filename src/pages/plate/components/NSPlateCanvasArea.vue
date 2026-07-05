<template>
  <section class="nsplate-canvas-area">
    <div
      ref="viewportRef"
      class="nsplate-canvas-viewport"
      :data-dragging="isDragging"
      :data-pannable="isPannable"
      @pointerdown="handleViewportPointerDown"
      @pointermove="handleViewportPointerMove"
      @pointerup="handleViewportPointerUp"
      @pointercancel="handleViewportPointerCancel"
    >
      <NSPlateSelectionNote
        v-if="selectionNoteItems.length"
        :title="selectionNoteTitle"
        :items="selectionNoteItems"
        @focus-item="emit('focus-asset-section', $event)"
      />

      <div
        class="nsplate-canvas-frame"
        :class="canvasClass"
        :style="[frameStyle, viewportTransformStyle]"
      >
        <canvas ref="canvasRef" class="nsplate-canvas-frame__canvas" :aria-label="canvasLabel" />
      </div>
    </div>

    <NSPlateCanvasActions
      :can-zoom-in="canZoomIn"
      :can-zoom-out="canZoomOut"
      :zoom-label="zoomPercentLabel"
      :can-clear-custom-portrait="canClearCustomPortrait"
      :can-clear-materials="canClearMaterials"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-view="resetView"
      @clear-custom-portrait="emit('clear-custom-portrait')"
      @clear-materials="emit('clear-materials')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import { renderNameplateToCanvas, type NSPlateImageCache } from '@/lib/plate/canvasRenderer'
import type { NSPlateLayeredExportDataSource } from '@/lib/plate/dataSource'
import { getNSPlateInfoGraphicAssetSignature } from '@/lib/plate/infoLayerRenderDefinitions'
import type { NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import { NSPLATE_CANVAS_DIMENSIONS, createNameplateRenderPlan } from '@/lib/plate/render'
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage,
  NSPlatePortraitSide,
  NSPlateSelectionNoteItem
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import NSPlateCanvasActions from '@/pages/plate/components/NSPlateCanvasActions.vue'
import NSPlateSelectionNote from '@/pages/plate/components/NSPlateSelectionNote.vue'
import { useNSPlateCanvasExport } from '@/pages/plate/composables/useNSPlateCanvasExport'
import { useNSPlateCanvasFrame } from '@/pages/plate/composables/useNSPlateCanvasFrame'
import { useNSPlateCanvasViewport } from '@/pages/plate/composables/useNSPlateCanvasViewport'

const props = defineProps<{
  layeredExportDataSource?: NSPlateLayeredExportDataSource
  mode: NSPlateCanvasMode
  portraitSide: NSPlatePortraitSide
  selectedAssets: NSPlateAssetSummary[]
  assetGroups: NSPlateAssetGroup[]
  customPortrait: NSPlateCustomPortraitImage | null
  infoDraft: NSPlateInfoDraft
  selectionNoteTitle: string
  selectionNoteItems: NSPlateSelectionNoteItem[]
  canClearCustomPortrait: boolean
  canClearMaterials: boolean
  createConfigJson?: () => string
}>()

const emit = defineEmits<{
  'focus-asset-section': [value: NSPlateSelectionNoteItem]
  'clear-custom-portrait': []
  'clear-materials': []
}>()

const { t } = useLocale()
const canvasClass = 'nsplate-canvas-frame--nameplate'
const modeLabel = computed(() =>
  props.mode === 'portrait' ? t(textKeys.nsplatePortrait) : t(textKeys.nsplateNameplate)
)
const canvasLabel = computed(() => `${t(textKeys.nsplateCanvasAria)}${modeLabel.value}`)
const renderPlan = computed(() =>
  createNameplateRenderPlan(
    props.selectedAssets,
    props.portraitSide,
    undefined,
    props.customPortrait,
    props.infoDraft,
    props.assetGroups
  )
)
const renderSignature = computed(() =>
  [
    props.mode,
    props.portraitSide,
    props.customPortrait?.id ?? '',
    props.customPortrait?.mode ?? '',
    props.customPortrait?.popoutLayerAnchor ?? '',
    props.customPortrait?.dataUrl ?? '',
    props.customPortrait?.sourceDataUrl ?? '',
    props.customPortrait?.splitY ?? '',
    props.selectedAssets
      .map((asset) =>
        [asset.id, asset.category, asset.imageUrl ?? '', asset.previewUrl ?? ''].join(':')
      )
      .join('|'),
    getNSPlateInfoGraphicAssetSignature(props.assetGroups),
    JSON.stringify(props.infoDraft)
  ].join('::')
)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { viewportRef, frameSize, frameStyle } = useNSPlateCanvasFrame(
  NSPLATE_CANVAS_DIMENSIONS.nameplate
)
const {
  zoomPercentLabel,
  canZoomIn,
  canZoomOut,
  isDragging,
  isPannable,
  viewportTransformStyle,
  zoomIn,
  zoomOut,
  resetView,
  handleViewportPointerDown,
  handleViewportPointerMove,
  handleViewportPointerUp,
  handleViewportPointerCancel
} = useNSPlateCanvasViewport({
  viewportRef,
  frameSize
})
const isCanvasReady = ref(false)
const imageCache: NSPlateImageCache = new Map()
let renderSerial = 0
const { canExport, exportErrorText, exportImage, exportLayeredZip } = useNSPlateCanvasExport({
  layeredExportDataSource: props.layeredExportDataSource,
  canvasRef,
  renderPlan,
  isCanvasReady,
  createConfigJson: props.createConfigJson
})

defineExpose({
  canExport,
  exportErrorText,
  exportImage,
  exportLayeredZip
})

onMounted(() => {
  void renderCanvas()
})

onBeforeUnmount(() => {
  renderSerial += 1
})

watch(
  renderSignature,
  () => {
    void renderCanvas()
  },
  { flush: 'post' }
)

async function renderCanvas() {
  const canvas = canvasRef.value

  if (!canvas) {
    isCanvasReady.value = false
    return
  }

  const serial = ++renderSerial
  isCanvasReady.value = false

  await renderNameplateToCanvas(canvas, renderPlan.value, {
    imageCache,
    isCurrent: () => isCurrentRender(serial)
  })

  if (isCurrentRender(serial)) {
    isCanvasReady.value = true
  }
}

function isCurrentRender(serial: number) {
  return serial === renderSerial
}
</script>

<style scoped>
.nsplate-canvas-area {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 8px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px),
    color-mix(in srgb, var(--ns-color-bg-soft) 88%, var(--ns-color-cyan-soft));
  background-size:
    44px 44px,
    44px 44px,
    auto;
}

.nsplate-canvas-viewport {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
}

.nsplate-canvas-viewport[data-pannable='true'] {
  cursor: grab;
  touch-action: none;
}

.nsplate-canvas-viewport[data-dragging='true'] {
  cursor: grabbing;
}

.nsplate-canvas-frame {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  max-width: 100%;
  max-height: 100%;
  border: 1px solid var(--ns-color-border-strong);
  background:
    linear-gradient(45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    var(--ns-color-surface-solid);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
  box-shadow: 0 10px 32px rgba(42, 33, 56, 0.1);
  transition: transform 120ms ease-out;
  will-change: transform;
}

.nsplate-canvas-viewport[data-dragging='true'] .nsplate-canvas-frame {
  transition: none;
}

.nsplate-canvas-frame--nameplate {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.nsplate-canvas-frame__canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;
}

@media (max-width: 560px) {
  .nsplate-canvas-area {
    min-height: 46vh;
  }

  .nsplate-canvas-viewport {
    padding: 10px 0 4px;
  }

  .nsplate-canvas-frame--nameplate {
    width: 100%;
  }
}
</style>
