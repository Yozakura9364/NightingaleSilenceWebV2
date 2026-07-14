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
            <button
              type="button"
              :data-active="localCropState?.mode === 'free'"
              @click="setCropMode('free')"
            >
              {{ t(textKeys.nsplateCustomPortraitCropModeFree) }}
            </button>
          </div>

          <div
            v-if="localCropState?.mode === 'popout'"
            class="nsplate-crop-dialog__hints"
          >
            <span>{{ t(textKeys.nsplateCustomPortraitCropHintMoveImage) }}</span>
            <span>{{ t(textKeys.nsplateCustomPortraitCropHintAdjustAngle) }}</span>
            <span>{{ t(textKeys.nsplateCustomPortraitCropHintSliderOnly) }}</span>
          </div>

          <label class="nsplate-crop-dialog__control">
            <span>{{ t(textKeys.nsplateCustomPortraitCropZoom) }}</span>
            <input
              type="range"
              :min="localCropState?.mode === 'free' ? cropLimits.minFreeScale : cropLimits.minZoom"
              :max="localCropState?.mode === 'free' ? cropLimits.maxFreeScale : cropLimits.maxZoom"
              step="0.02"
              :value="localCropState?.mode === 'free' ? localCropState.freeScale : localCropState?.scaleMultiplier ?? 1"
              @input="onZoomInput"
            />
            <output>{{ localCropState?.mode === 'free' ? freeScaleLabel : zoomLabel }}</output>
          </label>

          <div v-if="localCropState?.mode === 'free'" class="nsplate-crop-dialog__angle-control">
            <label>
              <span>{{ t(textKeys.nsplateCustomPortraitCropRotation) }}</span>
              <span class="nsplate-crop-dialog__angle-input">
                <input type="number" min="-180" max="180" step="1" :value="localCropState.freeRotation" @input="onFreeRotationInput" />
                <span aria-hidden="true">°</span>
              </span>
            </label>
            <button type="button" @click="resetFreeTransform">{{ t(textKeys.nsplateCustomPortraitCropTransformReset) }}</button>
          </div>

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

          <div
            v-if="localCropState?.mode === 'popout'"
            class="nsplate-crop-dialog__angle-control"
          >
            <label>
              <span>{{ t(textKeys.nsplateCustomPortraitCropAngle) }}</span>
              <span class="nsplate-crop-dialog__angle-input">
                <input
                  type="number"
                  min="-89"
                  max="89"
                  step="0.1"
                  :value="splitAngle"
                  :aria-label="t(textKeys.nsplateCustomPortraitCropAngle)"
                  @input="onSplitAngleInput"
                />
                <span aria-hidden="true">°</span>
              </span>
            </label>
            <button type="button" @click="resetSplitAngle">
              {{ t(textKeys.nsplateCustomPortraitCropAngleReset) }}
            </button>
          </div>

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
import { toRef } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import type { NSPlateCustomPortraitCropState, NSPlatePortraitSide } from '@/lib/plate/types'
import { useNSPlateCropInteraction } from '@/pages/plate/composables/useNSPlateCropInteraction'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  cropState: NSPlateCustomPortraitCropState
  portraitSide: NSPlatePortraitSide
}>()

const emit = defineEmits<{
  apply: [cropState: NSPlateCustomPortraitCropState]
  cancel: []
}>()

const { t } = useLocale()
const {
  canvasRef,
  cloneCurrentCropState,
  cropLimits,
  freeScaleLabel,
  localCropState,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onFreeRotationInput,
  onSplitAngleInput,
  onSplitInput,
  onWheel,
  onZoomInput,
  previewDimensions,
  resetSplitAngle,
  resetFreeTransform,
  setCropMode,
  splitAngle,
  splitLabel,
  zoomLabel
} = useNSPlateCropInteraction(toRef(props, 'cropState'), toRef(props, 'portraitSide'))

function confirmCrop() {
  const cropState = cloneCurrentCropState()

  if (!cropState) {
    return
  }

  emit('apply', cropState)
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
  width: min(1120px, 100%);
  max-height: min(92vh, 860px);
  overflow: hidden;
}

.nsplate-crop-dialog__body {
  display: grid;
  min-height: 0;
  gap: 8px;
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
  height: min(64vh, 640px);
}

.nsplate-crop-dialog__canvas[data-mode='popout'],
.nsplate-crop-dialog__canvas[data-mode='free'] {
  width: min(100%, 900px);
  height: auto;
}

.nsplate-crop-dialog__canvas:active {
  cursor: grabbing;
}

.nsplate-crop-dialog__mode {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__mode button {
  min-height: 30px;
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

.nsplate-crop-dialog__hints {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-sans);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.3;
}

.nsplate-crop-dialog__control {
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr) 52px;
  align-items: center;
  gap: 8px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 11px;
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

.nsplate-crop-dialog__angle-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 6px;
  font-family: var(--ns-font-sans);
  font-size: 11px;
  font-weight: 850;
}

.nsplate-crop-dialog__angle-control label {
  display: grid;
  grid-template-columns: auto 96px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.nsplate-crop-dialog__angle-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 30px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__angle-input input {
  width: 100%;
  min-width: 0;
  height: 28px;
  padding: 0 4px 0 8px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.nsplate-crop-dialog__angle-input > span {
  padding-right: 8px;
  color: var(--ns-color-text-muted);
}

.nsplate-crop-dialog__angle-control > button {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  cursor: pointer;
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

  .nsplate-crop-dialog__angle-control label {
    grid-template-columns: 1fr 96px;
  }
}
</style>
