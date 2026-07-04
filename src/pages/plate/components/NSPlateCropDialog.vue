<template>
  <Teleport to="body">
    <div class="nsplate-crop-dialog" @click.self="emit('cancel')">
      <AppPixelWindow
        class="nsplate-crop-dialog__window"
        :title="t(textKeys.nsplateCustomPortraitCropTitle)"
        :close-label="t(textKeys.nsplateCustomPortraitCropCancel)"
        @close="emit('cancel')"
      >
        <div class="nsplate-crop-dialog__body">
          <div class="nsplate-crop-dialog__canvas-shell">
            <canvas
              ref="canvasRef"
              class="nsplate-crop-dialog__canvas"
              :data-mode="localCropState?.mode ?? 'standard'"
              :width="previewDimensions.width"
              :height="previewDimensions.height"
              :aria-label="t(textKeys.nsplateCustomPortraitCropCanvas)"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
              @wheel="onWheel"
            />
          </div>

          <div class="nsplate-crop-dialog__mode" role="group" :aria-label="t(textKeys.nsplateCustomPortraitCropMode)">
            <button
              type="button"
              :data-active="localCropState?.mode === 'standard'"
              @click="setCropMode('standard')"
            >
              {{ t(textKeys.nsplateCustomPortraitCropModeStandard) }}
            </button>
            <button
              type="button"
              :data-active="localCropState?.mode === 'popout'"
              @click="setCropMode('popout')"
            >
              {{ t(textKeys.nsplateCustomPortraitCropModePopout) }}
            </button>
          </div>

          <label class="nsplate-crop-dialog__control">
            <span>{{ t(textKeys.nsplateCustomPortraitCropZoom) }}</span>
            <input
              type="range"
              :min="cropLimits.minZoom"
              :max="cropLimits.maxZoom"
              step="0.02"
              :value="localCropState?.scaleMultiplier ?? 1"
              @input="onZoomInput"
            />
            <output>{{ zoomLabel }}</output>
          </label>

          <label v-if="localCropState?.mode === 'popout'" class="nsplate-crop-dialog__control">
            <span>{{ t(textKeys.nsplateCustomPortraitCropSplit) }}</span>
            <input
              type="range"
              :min="cropLimits.minSplitY"
              :max="cropLimits.maxSplitY"
              step="1"
              :value="localCropState.splitY"
              @input="onSplitInput"
            />
            <output>{{ splitLabel }}</output>
          </label>

          <div class="nsplate-crop-dialog__actions">
            <AppButton @click="emit('cancel')">
              {{ t(textKeys.nsplateCustomPortraitCropCancel) }}
            </AppButton>
            <AppButton variant="primary" @click="confirmCrop">
              {{ t(textKeys.nsplateCustomPortraitCropApply) }}
            </AppButton>
          </div>
        </div>
      </AppPixelWindow>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { textKeys } from '@/config/site'
import {
  clampCustomPortraitCropState,
  drawCustomPortraitCropPreview,
  getCustomPortraitCropPreviewDimensions,
  getCustomPortraitCropLimits,
  setCustomPortraitCropMode
} from '@/lib/plate/customPortrait'
import { NSPLATE_CANVAS_DIMENSIONS, NSPLATE_PORTRAIT_EMBED } from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitMode
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  cropState: NSPlateCustomPortraitCropState
}>()

const emit = defineEmits<{
  apply: [cropState: NSPlateCustomPortraitCropState]
  cancel: []
}>()

const { t } = useLocale()
const cropLimits = getCustomPortraitCropLimits()
const portraitHeight = NSPLATE_CANVAS_DIMENSIONS.portrait.height
const portraitOrigin = NSPLATE_PORTRAIT_EMBED.right
const canvasRef = ref<HTMLCanvasElement | null>(null)
const localCropState = ref<NSPlateCustomPortraitCropState | null>(null)
let isDragging = false
let lastPointerX = 0
let lastPointerY = 0
let dragTarget: 'image' | 'split' = 'image'

const zoomLabel = computed(() => {
  const zoom = localCropState.value?.scaleMultiplier ?? 1
  return `${Math.round(zoom * 100)}%`
})
const splitLabel = computed(() => {
  const splitY = localCropState.value?.splitY ?? 0
  return `${Math.round((splitY / portraitHeight) * 100)}%`
})
const previewDimensions = computed(() => {
  const cropState = localCropState.value
  return cropState
    ? getCustomPortraitCropPreviewDimensions(cropState)
    : NSPLATE_CANVAS_DIMENSIONS.portrait
})

watch(
  () => props.cropState,
  (cropState) => {
    localCropState.value = cloneCropState(cropState)
    void nextTick(renderPreview)
  },
  { immediate: true }
)

function cloneCropState(cropState: NSPlateCustomPortraitCropState) {
  return { ...cropState }
}

function renderPreview() {
  const canvas = canvasRef.value
  const cropState = localCropState.value

  if (!canvas || !cropState) {
    return
  }

  drawCustomPortraitCropPreview(canvas, cropState)
}

function onZoomInput(event: Event) {
  const cropState = localCropState.value

  if (!cropState) {
    return
  }

  cropState.scaleMultiplier = Number((event.target as HTMLInputElement).value)
  clampCustomPortraitCropState(cropState)
  renderPreview()
}

function onSplitInput(event: Event) {
  const cropState = localCropState.value

  if (!cropState) {
    return
  }

  cropState.splitY = Number((event.target as HTMLInputElement).value)
  clampCustomPortraitCropState(cropState)
  renderPreview()
}

function onWheel(event: WheelEvent) {
  const cropState = localCropState.value

  if (!cropState) {
    return
  }

  event.preventDefault()
  cropState.scaleMultiplier += event.deltaY > 0 ? -0.06 : 0.06
  clampCustomPortraitCropState(cropState)
  renderPreview()
}

function onPointerDown(event: PointerEvent) {
  const cropState = localCropState.value
  const canvas = canvasRef.value

  if (!cropState || !canvas) {
    return
  }

  const splitPointerY = getSplitPointerY(event, canvas, cropState)
  dragTarget =
    cropState.mode === 'popout' && Math.abs(splitPointerY - cropState.splitY) <= 36
      ? 'split'
      : 'image'
  isDragging = true
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  const cropState = localCropState.value
  const canvas = canvasRef.value

  if (!isDragging || !cropState || !canvas) {
    return
  }

  if (dragTarget === 'split') {
    cropState.splitY = getSplitPointerY(event, canvas, cropState)
    clampCustomPortraitCropState(cropState)
    renderPreview()
    return
  }

  const rect = canvas.getBoundingClientRect()
  const dimensions = previewDimensions.value
  const scaleX = dimensions.width / rect.width
  const scaleY = dimensions.height / rect.height
  cropState.offsetX += (event.clientX - lastPointerX) * scaleX
  cropState.offsetY += (event.clientY - lastPointerY) * scaleY
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  clampCustomPortraitCropState(cropState)
  renderPreview()
}

function onPointerUp(event: PointerEvent) {
  isDragging = false
  dragTarget = 'image'

  try {
    ;(event.currentTarget as HTMLCanvasElement).releasePointerCapture(event.pointerId)
  } catch {
    // Pointer capture may already be released by the browser.
  }
}

function setCropMode(mode: NSPlateCustomPortraitMode) {
  const cropState = localCropState.value

  if (!cropState) {
    return
  }

  setCustomPortraitCropMode(cropState, mode)
  void nextTick(renderPreview)
}

function confirmCrop() {
  const cropState = localCropState.value

  if (!cropState) {
    return
  }

  emit('apply', cloneCropState(cropState))
}

function getPreviewPointerPosition(event: PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const dimensions = previewDimensions.value
  return {
    x: ((event.clientX - rect.left) * dimensions.width) / rect.width,
    y: ((event.clientY - rect.top) * dimensions.height) / rect.height
  }
}

function getSplitPointerY(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState
) {
  const pointer = getPreviewPointerPosition(event, canvas)
  return cropState.mode === 'popout' ? pointer.y - portraitOrigin.y : pointer.y
}
</script>

<style scoped>
.nsplate-crop-dialog {
  position: fixed;
  z-index: 80;
  display: grid;
  inset: 0;
  place-items: center;
  padding: 18px;
  background: rgba(28, 22, 36, 0.48);
}

.nsplate-crop-dialog__window {
  width: min(960px, 100%);
  max-height: min(92vh, 860px);
  overflow: hidden;
}

.nsplate-crop-dialog__body {
  display: grid;
  min-height: 0;
  gap: 12px;
}

.nsplate-crop-dialog__canvas-shell {
  display: grid;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  border: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(45deg, rgba(88, 68, 105, 0.13) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(88, 68, 105, 0.13) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(88, 68, 105, 0.13) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(88, 68, 105, 0.13) 75%),
    var(--ns-color-surface-solid);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
}

.nsplate-crop-dialog__canvas {
  display: block;
  max-width: 100%;
  cursor: grab;
  touch-action: none;
}

.nsplate-crop-dialog__canvas[data-mode='standard'] {
  width: auto;
  height: min(58vh, 560px);
}

.nsplate-crop-dialog__canvas[data-mode='popout'] {
  width: min(100%, 900px);
  height: auto;
}

.nsplate-crop-dialog__canvas:active {
  cursor: grabbing;
}

.nsplate-crop-dialog__mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__mode button {
  min-height: 34px;
  border: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.nsplate-crop-dialog__mode button + button {
  border-left: 2px solid var(--ns-pixel-border);
}

.nsplate-crop-dialog__mode button[data-active='true'] {
  background: color-mix(in srgb, var(--ns-color-cyan) 26%, var(--ns-color-surface-solid));
  color: var(--ns-color-accent-strong);
}

.nsplate-crop-dialog__control {
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr) 52px;
  align-items: center;
  gap: 10px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
}

.nsplate-crop-dialog__control input {
  width: 100%;
  accent-color: var(--ns-color-accent);
}

.nsplate-crop-dialog__control output {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.nsplate-crop-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 560px) {
  .nsplate-crop-dialog {
    padding: 10px;
  }

  .nsplate-crop-dialog__canvas[data-mode='standard'] {
    height: min(56vh, 520px);
  }

  .nsplate-crop-dialog__control {
    grid-template-columns: 1fr 52px;
  }

  .nsplate-crop-dialog__control span {
    grid-column: 1 / -1;
  }

  .nsplate-crop-dialog__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
