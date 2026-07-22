<template>
  <div
    ref="dialogEl"
    class="nsglamour-template-crop"
    aria-modal="true"
    role="dialog"
    :aria-labelledby="titleId"
    tabindex="-1"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section class="nsglamour-template-crop__dialog">
      <div class="nsglamour-template-crop__head">
        <div>
          <h2 :id="titleId" class="ns-heading-bloom">
            {{ t(textKeys.nsglamourTemplateCropTitle) }}
          </h2>
          <p>{{ t(textKeys.nsglamourTemplateCropHint) }}</p>
        </div>
        <button
          type="button"
          class="nsglamour-template__secondary ns-compact-action"
          @click="emit('close')"
        >
          {{ t(textKeys.nsglamourTemplateCropCancel) }}
        </button>
      </div>

      <div
        class="nsglamour-template-crop__stage"
        :style="canvasDisplayStyle"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @wheel.prevent="handleWheel"
      >
        <canvas
          ref="canvasEl"
          class="nsglamour-template-crop__canvas"
          :aria-label="t(textKeys.nsglamourTemplateCropCanvas)"
        ></canvas>
      </div>

      <div class="nsglamour-template-crop__footer">
        <div class="nsglamour-template-crop__zoom">
          <label for="nsglamour-template-crop-zoom-range">
            {{ t(textKeys.nsglamourTemplateCropZoom) }}
          </label>
          <input
            id="nsglamour-template-crop-zoom-range"
            type="range"
            min="10"
            max="500"
            step="1"
            :value="zoomPercent"
            @input="setZoomFromInput"
          />
          <input
            type="number"
            min="10"
            max="500"
            step="1"
            :aria-label="t(textKeys.nsglamourTemplateCropZoomPercent)"
            :value="zoomPercent"
            @input="setZoomFromInput"
          />
          <span>%</span>
        </div>

        <div class="nsglamour-template-crop__actions">
          <button
            type="button"
            class="nsglamour-template__secondary ns-compact-action"
            @click="resetCrop"
          >
            {{ t(textKeys.nsglamourTemplateCropReset) }}
          </button>
          <button type="button" class="nsglamour-template__primary" @click="applyCrop">
            {{ t(textKeys.nsglamourTemplateCropApply) }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type { GlamourTemplateImageSlot } from '@/lib/glamour/templates/definitions'
import type { TemplateImageCropRequest } from '@/pages/glamour/types/templateWorkspace'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  request: TemplateImageCropRequest
  slot: GlamourTemplateImageSlot
}>()

const emit = defineEmits<{
  apply: [imageUrl: string]
  close: []
}>()

const { t } = useLocale()
const titleId = 'nsglamour-template-crop-title'
const dialogEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const zoomPercent = ref(100)
const offset = reactive({ x: 0, y: 0 })
const drag = reactive({ active: false, pointerId: -1, x: 0, y: 0 })
const viewportSize = reactive({ width: 0, height: 0 })
const canvasDisplayStyle = computed(() => {
  const aspectRatio = getAspectRatio()
  const viewportWidth = viewportSize.width || window.innerWidth || 980
  const viewportHeight = viewportSize.height || window.innerHeight || 760
  const availableWidth = Math.max(180, Math.min(980, viewportWidth - 40) - 32)
  const maxHeight = Math.max(180, Math.min(viewportHeight * 0.62, 620))
  const width = Math.min(availableWidth, maxHeight * aspectRatio)
  const height = width / aspectRatio

  return {
    aspectRatio: String(aspectRatio),
    width: `${Math.max(1, Math.floor(width))}px`,
    height: `${Math.max(1, Math.floor(height))}px`
  }
})

watch(
  () => props.request,
  () => {
    offset.x = 0
    offset.y = 0
    zoomPercent.value = getMinimumZoomPercent()
    drag.active = false
    drag.pointerId = -1
    void nextTick(() => {
      renderCanvas()
      dialogEl.value?.focus()
    })
  },
  { immediate: true }
)

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportSize)
})

function clampNumber(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function getOutputSize() {
  return {
    width: Math.max(1, Math.round(props.slot.region.width || 1)),
    height: Math.max(1, Math.round(props.slot.region.height || 1))
  }
}

function getAspectRatio(): number {
  const size = getOutputSize()
  const ratio =
    Number(props.slot.aspectRatio) > 0 ? Number(props.slot.aspectRatio) : size.width / size.height
  return clampNumber(ratio, 0.1, 10, size.width / size.height)
}

function getBaseScale(): number {
  const size = getOutputSize()
  return Math.max(
    size.width / props.request.image.naturalWidth,
    size.height / props.request.image.naturalHeight
  )
}

function getMinimumZoomPercent(): number {
  return clampNumber(Math.ceil(getBaseScale() * 100), 10, 500, 100)
}

function getScale(): number {
  return Math.max(getBaseScale(), zoomPercent.value / 100)
}

function getDrawBox() {
  const size = getOutputSize()
  const scale = getScale()
  const width = props.request.image.naturalWidth * scale
  const height = props.request.image.naturalHeight * scale
  const centeredX = (size.width - width) / 2
  const centeredY = (size.height - height) / 2
  const minX = Math.min(0, size.width - width)
  const minY = Math.min(0, size.height - height)
  const x = width <= size.width ? centeredX : clampNumber(centeredX + offset.x, minX, 0, centeredX)
  const y =
    height <= size.height ? centeredY : clampNumber(centeredY + offset.y, minY, 0, centeredY)

  offset.x = x - centeredX
  offset.y = y - centeredY
  return { x, y, width, height }
}

function drawToContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const box = getDrawBox()
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#191919'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(props.request.image, box.x, box.y, box.width, box.height)
}

function renderCanvas() {
  const canvas = canvasEl.value
  if (!canvas) return

  const size = getOutputSize()
  const ctx = canvas.getContext('2d')
  canvas.width = size.width
  canvas.height = size.height
  if (ctx) drawToContext(ctx, size.width, size.height)
}

function setZoomFromInput(event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value)
  zoomPercent.value = clampNumber(value, getMinimumZoomPercent(), 500, 100)
  renderCanvas()
}

function resetCrop() {
  offset.x = 0
  offset.y = 0
  zoomPercent.value = getMinimumZoomPercent()
  renderCanvas()
}

function startDrag(event: PointerEvent) {
  const canvas = canvasEl.value
  if (!canvas) return
  drag.active = true
  drag.pointerId = event.pointerId
  drag.x = event.clientX
  drag.y = event.clientY
  canvas.setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  const canvas = canvasEl.value
  if (!canvas || !drag.active || drag.pointerId !== event.pointerId) return

  const rect = canvas.getBoundingClientRect()
  offset.x += (event.clientX - drag.x) * (canvas.width / Math.max(1, rect.width))
  offset.y += (event.clientY - drag.y) * (canvas.height / Math.max(1, rect.height))
  drag.x = event.clientX
  drag.y = event.clientY
  renderCanvas()
}

function endDrag(event: PointerEvent) {
  const canvas = canvasEl.value
  if (canvas && drag.pointerId === event.pointerId) canvas.releasePointerCapture(event.pointerId)
  drag.active = false
  drag.pointerId = -1
}

function handleWheel(event: WheelEvent) {
  zoomPercent.value = clampNumber(
    zoomPercent.value + (event.deltaY > 0 ? -5 : 5),
    getMinimumZoomPercent(),
    500,
    100
  )
  renderCanvas()
}

function applyCrop() {
  const size = getOutputSize()
  const output = document.createElement('canvas')
  output.width = size.width
  output.height = size.height
  const ctx = output.getContext('2d')
  if (!ctx) {
    emit('apply', '')
    return
  }

  drawToContext(ctx, size.width, size.height)
  emit('apply', output.toDataURL('image/png'))
}

function updateViewportSize() {
  viewportSize.width = window.innerWidth
  viewportSize.height = window.innerHeight
}
</script>

<style scoped>
.nsglamour-template-crop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    linear-gradient(rgba(42, 33, 56, 0.52), rgba(42, 33, 56, 0.52)), rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(1px);
}

.nsglamour-template-crop__dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: fit-content;
  min-width: min(520px, calc(100vw - 40px));
  max-width: calc(100vw - 40px);
  max-height: min(92vh, 820px);
  overflow: hidden;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-window-bg);
  box-shadow: 8px 8px 0 rgba(42, 33, 56, 0.38);
}

.nsglamour-template-crop__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  min-height: 50px;
  padding: 9px 12px;
  border-bottom: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bar-bg);
}

.nsglamour-template-crop__head h2 {
  margin: 0;
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 18px;
  font-weight: 950;
  line-height: 1.15;
}

.nsglamour-template-crop__head p {
  margin: 3px 0 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}

.nsglamour-template-crop__stage {
  display: grid;
  align-self: center;
  justify-self: center;
  max-width: calc(100vw - 64px);
  max-height: calc(92vh - 178px);
  min-height: 0;
  margin: 12px;
  overflow: hidden;
  place-items: center;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background:
    linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%), #17131f;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
  box-shadow: 4px 4px 0 rgba(42, 33, 56, 0.24);
  cursor: move;
  touch-action: none;
}

.nsglamour-template-crop__canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: #191919;
}

.nsglamour-template-crop__footer {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px 12px;
  border-top: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.nsglamour-template-crop__zoom {
  display: grid;
  grid-template-columns: auto minmax(150px, 1fr) 70px auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  font-weight: 850;
}

.nsglamour-template-crop__zoom label {
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-weight: 950;
}

.nsglamour-template-crop__zoom input[type='range'] {
  width: 100%;
  accent-color: var(--ns-color-accent);
  cursor: pointer;
}

.nsglamour-template-crop__zoom input[type='number'] {
  width: 70px;
  min-height: 34px;
  padding: 5px 8px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-weight: 850;
  text-align: right;
  box-shadow: inset 2px 2px 0 rgba(42, 33, 56, 0.08);
}

.nsglamour-template-crop__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.nsglamour-template__primary {
  min-height: 30px;
  padding: 4px 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  box-shadow: var(--ns-pixel-button-shadow);
  cursor: pointer;
}

.nsglamour-template-crop__head .ns-compact-action,
.nsglamour-template-crop__actions .ns-compact-action,
.nsglamour-template-crop__actions .nsglamour-template__primary {
  min-height: 34px;
  border-width: 2px;
  border-radius: 0;
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  box-shadow: var(--ns-pixel-button-shadow);
}

.nsglamour-template-crop__actions .nsglamour-template__primary {
  padding-inline: 16px;
  border-color: var(--ns-pixel-border);
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.nsglamour-template-crop__actions .nsglamour-template__primary:hover,
.nsglamour-template-crop__actions .nsglamour-template__primary:focus-visible {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-pink-surface);
  color: var(--ns-color-accent-strong);
  outline: none;
}

@media (max-width: 640px) {
  .nsglamour-template-crop {
    padding: 12px;
  }

  .nsglamour-template-crop__head,
  .nsglamour-template-crop__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .nsglamour-template-crop__dialog {
    min-width: 0;
    width: min(100%, calc(100vw - 24px));
    max-width: calc(100vw - 24px);
  }

  .nsglamour-template-crop__stage {
    max-width: calc(100vw - 48px);
    margin: 10px;
  }

  .nsglamour-template-crop__footer {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .nsglamour-template-crop__zoom {
    grid-template-columns: 1fr 76px auto;
  }

  .nsglamour-template-crop__zoom label {
    grid-column: 1 / -1;
  }

  .nsglamour-template-crop__actions {
    flex-direction: row;
  }

  .nsglamour-template-crop__actions .nsglamour-template__primary,
  .nsglamour-template-crop__actions .ns-compact-action {
    flex: 1 1 0;
  }
}
</style>
