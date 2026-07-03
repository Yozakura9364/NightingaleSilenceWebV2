<template>
  <section class="nsplate-canvas-area">
    <div ref="viewportRef" class="nsplate-canvas-viewport">
      <div class="nsplate-canvas-frame" :class="canvasClass" :style="frameStyle">
        <canvas ref="canvasRef" class="nsplate-canvas-frame__canvas" :aria-label="canvasLabel" />
      </div>
    </div>

    <NSPlateCanvasActions
      :can-clear-custom-portrait="canClearCustomPortrait"
      :can-clear-all="canClearAll"
      @clear-custom-portrait="emit('clear-custom-portrait')"
      @clear-all="emit('clear-all')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import { renderNameplateToCanvas, type NSPlateImageCache } from '@/lib/plate/canvasRenderer'
import { NSPLATE_CANVAS_DIMENSIONS, createNameplateRenderPlan } from '@/lib/plate/render'
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import NSPlateCanvasActions from '@/pages/plate/components/NSPlateCanvasActions.vue'
import { useNSPlateCanvasFrame } from '@/pages/plate/composables/useNSPlateCanvasFrame'

const props = defineProps<{
  mode: NSPlateCanvasMode
  selectedAssets: NSPlateAssetSummary[]
  customPortrait: NSPlateCustomPortraitImage | null
  canClearCustomPortrait: boolean
  canClearAll: boolean
}>()

const emit = defineEmits<{
  'clear-custom-portrait': []
  'clear-all': []
}>()

const { t } = useLocale()
const canvasClass = 'nsplate-canvas-frame--nameplate'
const modeLabel = computed(() =>
  props.mode === 'portrait' ? t(textKeys.nsplatePortrait) : t(textKeys.nsplateNameplate)
)
const canvasLabel = computed(() => `${t(textKeys.nsplateCanvasAria)}${modeLabel.value}`)
const renderPlan = computed(() =>
  createNameplateRenderPlan(props.selectedAssets, 'right', undefined, props.customPortrait)
)
const renderSignature = computed(() =>
  [
    props.mode,
    props.customPortrait?.id ?? '',
    props.customPortrait?.dataUrl ?? '',
    props.selectedAssets
      .map((asset) =>
        [asset.id, asset.category, asset.imageUrl ?? '', asset.previewUrl ?? ''].join(':')
      )
      .join('|')
  ].join('::')
)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { viewportRef, frameStyle } = useNSPlateCanvasFrame(NSPLATE_CANVAS_DIMENSIONS.nameplate)
const imageCache: NSPlateImageCache = new Map()
let renderSerial = 0

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
    return
  }

  const serial = ++renderSerial

  await renderNameplateToCanvas(canvas, renderPlan.value, {
    imageCache,
    isCurrent: () => isCurrentRender(serial)
  })
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
