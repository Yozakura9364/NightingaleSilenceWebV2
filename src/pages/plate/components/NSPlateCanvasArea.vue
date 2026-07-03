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
  NSPLATE_CANVAS_DIMENSIONS,
  createNameplateRenderPlan,
  getPlateLayerImageUrl,
  type NSPlateNameplateRenderPlan,
  type NSPlateRenderImageLayer
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
const imageCache = new Map<string, Promise<HTMLImageElement | null>>()
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
  const plan = renderPlan.value
  const context = prepareCanvas(canvas, plan.dimensions.width, plan.dimensions.height)

  if (!context) {
    return
  }

  await renderNameplatePlan(context, plan, serial)
}

async function renderNameplatePlan(
  context: CanvasRenderingContext2D,
  plan: NSPlateNameplateRenderPlan,
  serial: number
) {
  await drawLayers(context, plan.baseLayers, serial)

  if (!isCurrentRender(serial)) {
    return
  }

  const portraitCanvas = document.createElement('canvas')
  const portraitContext = prepareCanvas(
    portraitCanvas,
    NSPLATE_CANVAS_DIMENSIONS.portrait.width,
    NSPLATE_CANVAS_DIMENSIONS.portrait.height
  )

  if (portraitContext) {
    await drawLayers(portraitContext, plan.portraitBaseLayers, serial)

    if (!isCurrentRender(serial)) {
      return
    }

    await drawCustomPortrait(portraitContext, plan.customPortrait, serial)

    if (!isCurrentRender(serial)) {
      return
    }

    await drawLayers(portraitContext, plan.portraitOverlayLayers, serial)

    if (!isCurrentRender(serial)) {
      return
    }

    context.drawImage(portraitCanvas, plan.portraitEmbed.x, plan.portraitEmbed.y)
  }

  await drawLayers(context, plan.overlayLayers.slice(0, 1), serial)

  if (plan.portraitFrameLayer) {
    await drawLayer(context, plan.portraitFrameLayer, serial)
  }

  await drawLayers(context, plan.overlayLayers.slice(1), serial)
}

async function drawLayers(
  context: CanvasRenderingContext2D,
  layers: NSPlateRenderImageLayer[],
  serial: number
) {
  for (const layer of layers) {
    await drawLayer(context, layer, serial)

    if (!isCurrentRender(serial)) {
      return
    }
  }
}

async function drawLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateRenderImageLayer,
  serial: number
) {
  const source = getPlateLayerImageUrl(layer)

  if (!source) {
    return
  }

  const image = await loadImage(source)

  if (!image || !isCurrentRender(serial)) {
    return
  }

  const width = Math.round(image.naturalWidth * (layer.position.scale ?? 1))
  const height = Math.round(image.naturalHeight * (layer.position.scale ?? 1))
  const x =
    layer.placement === 'center' && width <= context.canvas.width
      ? (context.canvas.width - width) / 2
      : layer.position.x
  const y =
    layer.placement === 'center' && height <= context.canvas.height
      ? (context.canvas.height - height) / 2
      : layer.position.y

  context.drawImage(image, x, y, width, height)
}

async function drawCustomPortrait(
  context: CanvasRenderingContext2D,
  customPortrait: NSPlateCustomPortraitImage | null,
  serial: number
) {
  if (!customPortrait) {
    return
  }

  const image = await loadImage(customPortrait.dataUrl)

  if (!image || !isCurrentRender(serial)) {
    return
  }

  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height)
}

function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false

  return context
}

function loadImage(source: string) {
  const cached = imageCache.get(source)

  if (cached) {
    return cached
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const finish = () => resolve(image)

      if (typeof image.decode === 'function') {
        void image.decode().then(finish).catch(finish)
      } else {
        finish()
      }
    }
    image.onerror = () => {
      imageCache.delete(source)
      resolve(null)
    }
    image.src = source
  })

  imageCache.set(source, promise)
  return promise
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
