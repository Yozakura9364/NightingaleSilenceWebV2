<template>
  <section class="nsplate-canvas-area">
    <div ref="viewportRef" class="nsplate-canvas-viewport">
      <div class="nsplate-canvas-frame" :class="canvasClass" :style="frameStyle">
        <canvas ref="canvasRef" class="nsplate-canvas-frame__canvas" :aria-label="canvasLabel" />
      </div>
    </div>

    <footer class="nsplate-canvas-footer">
      <div class="nsplate-canvas-status" role="toolbar" :aria-label="t(textKeys.nsplateCanvasAria)">
        <button
          class="nsplate-canvas-status__button"
          type="button"
          :disabled="!canClearCustomPortrait"
          @click="emit('clear-custom-portrait')"
        >
          {{ t(textKeys.nsplateCustomPortraitClear) }}
        </button>
        <button
          class="nsplate-canvas-status__button"
          type="button"
          :disabled="!canClearAll"
          @click="emit('clear-all')"
        >
          {{ t(textKeys.nsplateClearAllSelections) }}
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import {
  renderNameplateToCanvas,
  type NSPlateImageCache
} from '@/lib/plate/canvasRenderer'
import {
  NSPLATE_CANVAS_DIMENSIONS,
  createNameplateRenderPlan
} from '@/lib/plate/render'
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'

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
const frameStyle = computed(() => {
  if (frameSize.value.width <= 0 || frameSize.value.height <= 0) {
    return undefined
  }

  return {
    width: `${frameSize.value.width}px`,
    height: `${frameSize.value.height}px`
  }
})

const viewportRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const frameSize = ref({ width: 0, height: 0 })
const imageCache: NSPlateImageCache = new Map()
let resizeObserver: ResizeObserver | null = null
let renderSerial = 0

onMounted(() => {
  updateCanvasFrameSize()
  observeCanvasViewport()
  void renderCanvas()
})

onBeforeUnmount(() => {
  renderSerial += 1
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateCanvasFrameSize)
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

function observeCanvasViewport() {
  if (!viewportRef.value) {
    return
  }

  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', updateCanvasFrameSize)
    return
  }

  resizeObserver = new ResizeObserver(updateCanvasFrameSize)
  resizeObserver.observe(viewportRef.value)
}

function updateCanvasFrameSize() {
  const viewport = viewportRef.value

  if (!viewport) {
    return
  }

  const viewportWidth = viewport.clientWidth
  const viewportHeight = viewport.clientHeight

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return
  }

  const ratio =
    NSPLATE_CANVAS_DIMENSIONS.nameplate.width / NSPLATE_CANVAS_DIMENSIONS.nameplate.height
  const width = Math.floor(Math.min(viewportWidth, viewportHeight * ratio))
  const height = Math.floor(width / ratio)

  if (frameSize.value.width === width && frameSize.value.height === height) {
    return
  }

  frameSize.value = { width, height }
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

.nsplate-canvas-footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  padding-top: 10px;
}

.nsplate-canvas-status {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0;
  max-width: min(760px, calc(100% - 32px));
  margin: 0;
  padding: 0;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsplate-canvas-status__button {
  min-width: 0;
  min-height: 36px;
  padding: 0 18px;
  overflow: hidden;
  border: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.nsplate-canvas-status__button + .nsplate-canvas-status__button {
  border-left: 2px solid var(--ns-pixel-border);
}

.nsplate-canvas-status__button:hover:not(:disabled) {
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-danger);
}

.nsplate-canvas-status__button:disabled {
  opacity: 0.46;
  cursor: not-allowed;
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

  .nsplate-canvas-status {
    display: grid;
    grid-template-columns: 1fr;
    width: min(260px, calc(100% - 24px));
    max-width: none;
  }

  .nsplate-canvas-status__button + .nsplate-canvas-status__button {
    border-top: 2px solid var(--ns-pixel-border);
    border-left: 0;
  }
}
</style>
