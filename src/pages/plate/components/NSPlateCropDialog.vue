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
          <div class="nsplate-crop-dialog__setup">
            <div
              class="nsplate-crop-dialog__modes"
              role="group"
              :aria-label="t(textKeys.nsplateCustomPortraitCropMode)"
            >
              <button
                v-for="option in modeOptions"
                :key="option.value"
                type="button"
                :data-active="selectedMode === option.value"
                :aria-pressed="selectedMode === option.value"
                @click="chooseMode(option.value)"
              >
                {{ t(option.labelKey) }}
              </button>
            </div>

            <div class="nsplate-crop-dialog__files" :data-paired="usesPairedFiles">
              <label class="nsplate-crop-dialog__file" :data-has-file="hasBaseImage">
                <span>
                  <small>{{ t(baseImageLabelKey) }}</small>
                  <strong>{{ baseFileName || t(textKeys.nsplateCustomPortraitUpload) }}</strong>
                </span>
                <em v-if="hasBaseImage">{{ baseDimensions }}</em>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  :aria-label="t(textKeys.nsplateCustomPortraitInput)"
                  @change="onBaseFileChange"
                />
              </label>

              <label
                v-if="usesPairedFiles"
                class="nsplate-crop-dialog__file"
                :data-has-file="hasOverlayImage"
                :data-disabled="!hasBaseImage"
              >
                <span>
                  <small>{{ t(textKeys.nsplateCustomPortraitCropPairedOverlay) }}</small>
                  <strong>
                    {{
                      overlayFileName ||
                      (hasBaseImage
                        ? t(textKeys.nsplateCustomPortraitCropPairedUpload)
                        : t(textKeys.nsplateCustomPortraitCropPairedRequired))
                    }}
                  </strong>
                </span>
                <em v-if="hasOverlayImage">{{ baseDimensions }}</em>
                <input
                  type="file"
                  accept="image/png,image/webp"
                  :disabled="!hasBaseImage"
                  :aria-label="t(textKeys.nsplateCustomPortraitCropPairedInput)"
                  @change="onPairedOverlayChange"
                />
              </label>
            </div>
          </div>

          <p v-if="fileErrorText" class="nsplate-crop-dialog__error" role="alert">
            {{ fileErrorText }}
          </p>

          <div
            class="nsplate-crop-dialog__canvas-shell"
            :data-empty="!hasBaseImage"
            :data-mode="localCropState?.mode ?? selectedMode"
            :aria-busy="isLoadingImage"
          >
            <canvas
              ref="canvasRef"
              class="nsplate-crop-dialog__canvas"
              :data-mode="localCropState?.mode ?? selectedMode"
              :width="previewDimensions.width"
              :height="previewDimensions.height"
              :aria-label="t(textKeys.nsplateCustomPortraitCropCanvas)"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
              @wheel="onWheel"
            />
            <AppLoading
              v-if="isLoadingImage"
              class="nsplate-crop-dialog__loading"
              size="md"
              :aria-label="t(textKeys.nsplateCustomPortraitCropLoading)"
            />
          </div>

          <div
            v-if="hasBaseImage"
            class="nsplate-crop-dialog__controls"
            :data-mode="localCropState?.mode ?? selectedMode"
          >
            <label class="nsplate-crop-dialog__control">
              <span>{{ t(textKeys.nsplateCustomPortraitCropZoom) }}</span>
              <input
                class="ns-range ns-range--pixel"
                type="range"
                :min="isFullMode ? cropLimits.minFreeScale : cropMinZoom"
                :max="isFullMode ? cropLimits.maxFreeScale : cropLimits.maxZoom"
                step="0.02"
                :value="
                  isFullMode ? localCropState?.freeScale : (localCropState?.scaleMultiplier ?? 1)
                "
                @input="onZoomInput"
              />
              <output>{{ isFullMode ? freeScaleLabel : zoomLabel }}</output>
            </label>

            <div class="nsplate-crop-dialog__control nsplate-crop-dialog__control--editable">
              <span>{{ t(textKeys.nsplateCustomPortraitCropRotation) }}</span>
              <input
                class="ns-range ns-range--pixel"
                type="range"
                min="-180"
                max="180"
                step="1"
                :value="rotation"
                :aria-label="t(textKeys.nsplateCustomPortraitCropRotation)"
                @input="onRotationInput"
              />
              <span class="nsplate-crop-dialog__number-input">
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  :value="rotation"
                  :aria-label="t(textKeys.nsplateCustomPortraitCropRotation)"
                  @input="onRotationInput"
                />
                <span aria-hidden="true">°</span>
              </span>
              <button type="button" @click="resetRotation">
                {{ t(textKeys.nsplateCustomPortraitCropAngleReset) }}
              </button>
            </div>

            <label v-if="localCropState?.mode === 'popout'" class="nsplate-crop-dialog__control">
              <span>{{ t(textKeys.nsplateCustomPortraitCropSplit) }}</span>
              <input
                class="ns-range ns-range--pixel"
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
              class="nsplate-crop-dialog__control nsplate-crop-dialog__control--editable"
            >
              <span>{{ t(textKeys.nsplateCustomPortraitCropAngle) }}</span>
              <input
                class="ns-range ns-range--pixel"
                type="range"
                min="-89"
                max="89"
                step="0.1"
                :value="splitAngle"
                :aria-label="t(textKeys.nsplateCustomPortraitCropAngle)"
                @input="onSplitAngleInput"
              />
              <span class="nsplate-crop-dialog__number-input">
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
              <button type="button" @click="resetSplitAngle">
                {{ t(textKeys.nsplateCustomPortraitCropAngleReset) }}
              </button>
            </div>
          </div>

          <div class="nsplate-crop-dialog__actions">
            <AppButton @click="emit('cancel')">
              {{ t(textKeys.nsplateCustomPortraitCropCancel) }}
            </AppButton>
            <AppButton variant="primary" :disabled="!canApply" @click="confirmCrop">
              {{ t(textKeys.nsplateCustomPortraitCropApply) }}
            </AppButton>
          </div>
        </div>
      </AppPixelWindow>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppLoading from '@/components/AppLoading.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import {
  createCustomPortraitCropStateFromFile,
  createCustomPortraitCropStateFromImage,
  setCustomPortraitCropMode
} from '@/lib/plate/customPortrait'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode,
  NSPlatePortraitSide
} from '@/lib/plate/types'
import { useNSPlateCropInteraction } from '@/pages/plate/composables/useNSPlateCropInteraction'
import { useLocale } from '@/stores/locale'

type SelectableMode = Exclude<NSPlateCustomPortraitMode, 'free'>

const props = defineProps<{
  initialImage: NSPlateCustomPortraitImage | null
  portraitSide: NSPlatePortraitSide
}>()

const emit = defineEmits<{
  apply: [cropState: NSPlateCustomPortraitCropState]
  cancel: []
}>()

const { t } = useLocale()
const sourceCropState = ref<NSPlateCustomPortraitCropState | null>(null)
const selectedMode = ref<SelectableMode>(getSelectableMode(props.initialImage?.mode))
const isLoadingImage = ref(Boolean(props.initialImage))
const fileErrorText = ref('')

const modeOptions = [
  {
    value: 'standard',
    labelKey: textKeys.nsplateCustomPortraitCropModeStandard
  },
  {
    value: 'popout',
    labelKey: textKeys.nsplateCustomPortraitCropModePopout
  },
  {
    value: 'paired',
    labelKey: textKeys.nsplateCustomPortraitCropModeFree
  }
] as const satisfies ReadonlyArray<{
  value: SelectableMode
  labelKey: string
}>

const {
  canvasRef,
  cloneCurrentCropState,
  cropMinZoom,
  cropLimits,
  freeScaleLabel,
  localCropState,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRotationInput,
  onSplitAngleInput,
  onSplitInput,
  onWheel,
  onZoomInput,
  previewDimensions,
  resetRotation,
  resetSplitAngle,
  rotation,
  setPairedOverlayFile,
  setCropMode,
  splitAngle,
  splitLabel,
  zoomLabel
} = useNSPlateCropInteraction(
  sourceCropState,
  computed(() => props.portraitSide)
)

const isFullMode = computed(
  () => localCropState.value?.mode === 'paired' || localCropState.value?.mode === 'free'
)
const usesPairedFiles = computed(() => selectedMode.value === 'paired')
const hasBaseImage = computed(() => Boolean(localCropState.value))
const hasOverlayImage = computed(() => Boolean(localCropState.value?.overlayImage))
const baseFileName = computed(() => localCropState.value?.fileName ?? '')
const overlayFileName = computed(() => localCropState.value?.overlayFileName ?? '')
const baseDimensions = computed(() =>
  localCropState.value
    ? `${localCropState.value.sourceWidth} x ${localCropState.value.sourceHeight}`
    : ''
)
const baseImageLabelKey = computed(() =>
  usesPairedFiles.value
    ? textKeys.nsplateCustomPortraitCropPairedBase
    : textKeys.nsplateCustomPortraitCropImage
)
const canApply = computed(() => {
  const cropState = localCropState.value

  if (!cropState) {
    return false
  }

  return cropState.mode !== 'paired' || hasOverlayImage.value
})

onMounted(async () => {
  if (!props.initialImage) {
    return
  }

  try {
    sourceCropState.value = await createCustomPortraitCropStateFromImage(props.initialImage)
  } catch {
    fileErrorText.value = t(textKeys.nsplateCustomPortraitError)
  } finally {
    isLoadingImage.value = false
  }
})

function chooseMode(mode: SelectableMode) {
  selectedMode.value = mode
  fileErrorText.value = ''

  const currentCropState = localCropState.value
  if (!currentCropState) {
    return
  }

  if (currentCropState.mode === 'free' && mode === 'paired') {
    return
  }

  setCropMode(mode)
}

async function onBaseFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  fileErrorText.value = ''
  isLoadingImage.value = true

  try {
    const nextCropState = await createCustomPortraitCropStateFromFile(file)
    setCustomPortraitCropMode(nextCropState, selectedMode.value, props.portraitSide)
    sourceCropState.value = nextCropState
  } catch {
    fileErrorText.value = t(textKeys.nsplateCustomPortraitError)
  } finally {
    isLoadingImage.value = false
  }
}

async function onPairedOverlayChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  fileErrorText.value = ''
  isLoadingImage.value = true

  try {
    await setPairedOverlayFile(file)
  } catch (error) {
    fileErrorText.value =
      error instanceof Error && error.message === 'image-size-mismatch'
        ? t(textKeys.nsplateCustomPortraitCropPairedMismatch)
        : t(textKeys.nsplateCustomPortraitError)
  } finally {
    isLoadingImage.value = false
  }
}

function confirmCrop() {
  const cropState = cloneCurrentCropState()

  if (cropState && canApply.value) {
    emit('apply', cropState)
  }
}

function getSelectableMode(mode: NSPlateCustomPortraitMode | undefined): SelectableMode {
  return mode === 'popout' || mode === 'paired' || mode === 'free'
    ? mode === 'free'
      ? 'paired'
      : mode
    : 'standard'
}
</script>

<style scoped>
.nsplate-crop-dialog {
  position: fixed;
  z-index: 1000;
  display: grid;
  inset: 0;
  place-items: center;
  padding: 14px;
  background: rgba(28, 22, 36, 0.48);
}

.nsplate-crop-dialog__window {
  width: min(1180px, 100%);
  max-height: 94vh;
  overflow: hidden;
}

.nsplate-crop-dialog__body {
  display: grid;
  max-height: calc(94vh - 48px);
  min-height: 0;
  gap: 8px;
  overflow: auto;
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__setup {
  display: grid;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__modes button {
  min-width: 0;
  min-height: 34px;
  padding: 4px 8px;
  border: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.nsplate-crop-dialog__modes button + button {
  border-left: var(--ns-line-width) solid var(--ns-color-border);
}

.nsplate-crop-dialog__modes button:hover,
.nsplate-crop-dialog__modes button[data-active='true'] {
  background: color-mix(in srgb, var(--ns-color-cyan) 24%, var(--ns-color-surface-solid));
  color: var(--ns-color-accent-strong);
}

.nsplate-crop-dialog__files {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-top: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__files[data-paired='true'] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.nsplate-crop-dialog__file {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 46px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  cursor: pointer;
}

.nsplate-crop-dialog__file + .nsplate-crop-dialog__file {
  border-left: var(--ns-line-width) solid var(--ns-color-border);
}

.nsplate-crop-dialog__file:hover,
.nsplate-crop-dialog__file:focus-within {
  background: color-mix(in srgb, var(--ns-color-cyan) 12%, var(--ns-color-surface-solid));
}

.nsplate-crop-dialog__file[data-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.48;
}

.nsplate-crop-dialog__file > span {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.nsplate-crop-dialog__file small,
.nsplate-crop-dialog__file strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-crop-dialog__file small {
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 750;
}

.nsplate-crop-dialog__file strong {
  font-size: 12px;
  font-weight: 850;
}

.nsplate-crop-dialog__file em {
  flex: none;
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-style: normal;
  font-variant-numeric: tabular-nums;
}

.nsplate-crop-dialog__file input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.nsplate-crop-dialog__error {
  margin: 0;
  color: var(--ns-color-danger);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 850;
}

.nsplate-crop-dialog__canvas-shell {
  position: relative;
  display: grid;
  width: min(100%, 960px);
  aspect-ratio: 16 / 9;
  place-self: center;
  place-items: center;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
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
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.nsplate-crop-dialog__canvas-shell[data-empty='true'] .nsplate-crop-dialog__canvas {
  cursor: default;
}

.nsplate-crop-dialog__canvas:active {
  cursor: grabbing;
}

.nsplate-crop-dialog__loading {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
}

.nsplate-crop-dialog__controls {
  display: grid;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px 18px;
  padding: 8px 10px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__controls[data-mode='popout'] {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.nsplate-crop-dialog__control {
  display: grid;
  min-width: 0;
  grid-template-columns: max-content minmax(90px, 1fr) 48px;
  grid-template-rows: 30px;
  align-items: center;
  gap: 6px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 850;
}

.nsplate-crop-dialog__control > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-crop-dialog__control--editable {
  grid-template-columns: max-content minmax(64px, 1fr) 62px auto;
}

.nsplate-crop-dialog__control input {
  width: 100%;
  accent-color: var(--ns-color-accent);
}

.nsplate-crop-dialog__control > input[type='range'] {
  min-width: 0;
}

.nsplate-crop-dialog__control output {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.nsplate-crop-dialog__number-input {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 30px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
}

.nsplate-crop-dialog__number-input input {
  box-sizing: border-box;
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
  appearance: textfield;
  -moz-appearance: textfield;
}

.nsplate-crop-dialog__number-input input::-webkit-inner-spin-button,
.nsplate-crop-dialog__number-input input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.nsplate-crop-dialog__number-input > span {
  padding-right: 8px;
  color: var(--ns-color-text-muted);
}

.nsplate-crop-dialog__control > button {
  min-height: 30px;
  padding: 0 6px;
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

@media (min-width: 701px) and (max-height: 900px) {
  .nsplate-crop-dialog {
    padding: 8px;
  }

  .nsplate-crop-dialog__window {
    max-height: calc(100dvh - 16px);
  }

  .nsplate-crop-dialog__body {
    max-height: calc(100dvh - 64px);
    gap: 6px;
  }

  .nsplate-crop-dialog__canvas-shell {
    width: min(100%, 960px, calc((100dvh - 276px) * 16 / 9));
  }

  .nsplate-crop-dialog__controls {
    gap: 6px 14px;
    padding-block: 6px;
  }
}

@media (max-width: 700px) {
  .nsplate-crop-dialog {
    padding: 8px;
  }

  .nsplate-crop-dialog__modes button {
    min-height: 38px;
    padding-inline: 4px;
    font-size: 11px;
  }

  .nsplate-crop-dialog__files[data-paired='true'] {
    grid-template-columns: 1fr;
  }

  .nsplate-crop-dialog__file + .nsplate-crop-dialog__file {
    border-top: var(--ns-line-width) solid var(--ns-color-border);
    border-left: 0;
  }

  .nsplate-crop-dialog__file em {
    display: none;
  }

  .nsplate-crop-dialog__canvas-shell {
    width: 100%;
  }

  .nsplate-crop-dialog__controls,
  .nsplate-crop-dialog__controls[data-mode='popout'] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 8px;
  }

  .nsplate-crop-dialog__control {
    width: 100%;
    grid-template-columns: minmax(48px, 1fr) 48px;
    grid-template-rows: auto 30px;
    gap: 4px 6px;
    font-size: 10px;
  }

  .nsplate-crop-dialog__control > span:first-child {
    grid-column: 1 / -1;
  }

  .nsplate-crop-dialog__control--editable {
    grid-template-columns: minmax(0, 1fr) 54px auto;
    column-gap: 4px;
  }

  .nsplate-crop-dialog__control > button {
    padding-inline: 5px;
  }

  .nsplate-crop-dialog__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
