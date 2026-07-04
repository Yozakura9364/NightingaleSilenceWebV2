<template>
  <section class="nsplate-canvas-area">
    <div ref="viewportRef" class="nsplate-canvas-viewport">
      <NSPlateSelectionNote
        v-if="selectionNoteItems.length"
        :title="selectionNoteTitle"
        :items="selectionNoteItems"
        @focus-item="emit('focus-asset-section', $event)"
      />

      <div class="nsplate-canvas-frame" :class="canvasClass" :style="frameStyle">
        <canvas ref="canvasRef" class="nsplate-canvas-frame__canvas" :aria-label="canvasLabel" />
      </div>
    </div>

    <NSPlateCanvasActions
      :can-clear-custom-portrait="canClearCustomPortrait"
      :can-clear-all="canClearAll"
      :can-import-config="canImportConfig"
      :can-export="canExport"
      @clear-custom-portrait="emit('clear-custom-portrait')"
      @clear-all="emit('clear-all')"
      @import-config="emit('import-config')"
      @paste-config="emit('paste-config')"
      @copy-config="emit('copy-config')"
      @export-config="emit('export-config')"
      @export-image="exportImage"
      @export-layered-zip="exportLayeredZip"
    />

    <p v-if="exportErrorText" class="nsplate-canvas-area__error">
      {{ exportErrorText }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import { renderNameplateToCanvas, type NSPlateImageCache } from '@/lib/plate/canvasRenderer'
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

const props = defineProps<{
  apiBase: string
  mode: NSPlateCanvasMode
  portraitSide: NSPlatePortraitSide
  selectedAssets: NSPlateAssetSummary[]
  assetGroups: NSPlateAssetGroup[]
  customPortrait: NSPlateCustomPortraitImage | null
  infoDraft: NSPlateInfoDraft
  canClearCustomPortrait: boolean
  canClearAll: boolean
  canImportConfig: boolean
  selectionNoteTitle: string
  selectionNoteItems: NSPlateSelectionNoteItem[]
  createConfigJson?: () => string
}>()

const emit = defineEmits<{
  'clear-custom-portrait': []
  'clear-all': []
  'import-config': []
  'paste-config': []
  'copy-config': []
  'export-config': []
  'focus-asset-section': [value: NSPlateSelectionNoteItem]
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
    props.customPortrait?.dataUrl ?? '',
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
const { viewportRef, frameStyle } = useNSPlateCanvasFrame(NSPLATE_CANVAS_DIMENSIONS.nameplate)
const isCanvasReady = ref(false)
const imageCache: NSPlateImageCache = new Map()
let renderSerial = 0
const { canExport, exportErrorText, exportImage, exportLayeredZip } = useNSPlateCanvasExport({
  apiBase: props.apiBase,
  canvasRef,
  renderPlan,
  isCanvasReady,
  createConfigJson: props.createConfigJson
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

.nsplate-canvas-area__error {
  margin: 8px 0 0;
  color: var(--ns-color-danger);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
  text-align: center;
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
