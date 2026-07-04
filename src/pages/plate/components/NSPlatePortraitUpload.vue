<template>
  <NSPlatePanel :title="t(textKeys.nsplateCustomPortrait)">
    <div class="nsplate-portrait-upload" :data-has-image="modelValue !== null">
      <label class="nsplate-portrait-upload__pick">
        <span class="nsplate-portrait-upload__thumb" aria-hidden="true">
          <img v-if="modelValue" :src="modelValue.dataUrl" :alt="modelValue.fileName" />
          <span v-else class="nsplate-portrait-upload__empty-icon" :style="emptyIconStyle" />
        </span>
        <span class="nsplate-portrait-upload__text">
          <strong>{{ t(textKeys.nsplateCustomPortraitUpload) }}</strong>
          <small v-if="modelValue">{{ modelValue.fileName }}</small>
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          :aria-label="t(textKeys.nsplateCustomPortraitInput)"
          @change="onFileChange"
        />
      </label>

      <div v-if="modelValue?.mode === 'popout'" class="nsplate-portrait-upload__layer">
        <span>{{ t(textKeys.nsplateCustomPortraitPopoutLayer) }}</span>
        <div
          class="nsplate-portrait-upload__layer-options"
          role="toolbar"
          :aria-label="t(textKeys.nsplateCustomPortraitPopoutLayer)"
        >
          <button
            v-for="option in popoutLayerOptions"
            :key="option.value"
            type="button"
            :data-active="popoutLayerAnchor === option.value"
            :aria-pressed="popoutLayerAnchor === option.value"
            @click="setPopoutLayerAnchor(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="errorText" class="nsplate-portrait-upload__error">
      {{ errorText }}
    </p>
  </NSPlatePanel>

  <NSPlateCropDialog
    v-if="cropState"
    :crop-state="cropState"
    @apply="applyCrop"
    @cancel="cropState = null"
  />
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import image2PlusIcon from '@/assets/icons/image-2-plus.svg'
import { textKeys } from '@/config/site'
import {
  createCustomPortraitCropStateFromFile,
  createCustomPortraitImageFromCropState
} from '@/lib/plate/customPortrait'
import {
  NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR,
  NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS
} from '@/lib/plate/types'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitPopoutLayerAnchor
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import NSPlateCropDialog from '@/pages/plate/components/NSPlateCropDialog.vue'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  modelValue: NSPlateCustomPortraitImage | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NSPlateCustomPortraitImage | null]
}>()

const { t } = useLocale()
const errorText = ref('')
const cropState = ref<NSPlateCustomPortraitCropState | null>(null)
const emptyIconStyle = {
  '--nsplate-portrait-upload-empty-icon': `url("${image2PlusIcon}")`
} as CSSProperties
const popoutLayerOptions = computed(
  () =>
    [
      {
        value: 'behindFrames',
        label: t(textKeys.nsplateCustomPortraitPopoutLayerBehindFrames)
      },
      {
        value: 'aboveFrames',
        label: t(textKeys.nsplateCustomPortraitPopoutLayerAboveFrames)
      },
      {
        value: 'aboveDecorations',
        label: t(textKeys.nsplateCustomPortraitPopoutLayerAboveDecorations)
      },
      {
        value: 'front',
        label: t(textKeys.nsplateCustomPortraitPopoutLayerFront)
      }
    ] satisfies { value: NSPlateCustomPortraitPopoutLayerAnchor; label: string }[]
)
const popoutLayerAnchor = computed(() =>
  normalizePopoutLayerAnchor(props.modelValue?.popoutLayerAnchor)
)

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''

  if (!file) {
    return
  }

  errorText.value = ''

  try {
    cropState.value = await createCustomPortraitCropStateFromFile(file)
  } catch {
    errorText.value = t(textKeys.nsplateCustomPortraitError)
  }
}

async function applyCrop(nextCropState: NSPlateCustomPortraitCropState) {
  errorText.value = ''

  try {
    emit('update:modelValue', await createCustomPortraitImageFromCropState(nextCropState))
    cropState.value = null
  } catch {
    errorText.value = t(textKeys.nsplateCustomPortraitError)
  }
}

function setPopoutLayerAnchor(anchor: NSPlateCustomPortraitPopoutLayerAnchor) {
  if (!props.modelValue || props.modelValue.mode !== 'popout') {
    return
  }

  emit('update:modelValue', {
    ...props.modelValue,
    popoutLayerAnchor: anchor
  })
}

function normalizePopoutLayerAnchor(
  value: NSPlateCustomPortraitImage['popoutLayerAnchor']
): NSPlateCustomPortraitPopoutLayerAnchor {
  return value && NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS.includes(value)
    ? value
    : NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR
}
</script>

<style scoped>
.nsplate-portrait-upload {
  display: grid;
  gap: var(--nsplate-control-stack-gap);
  min-width: 0;
}

.nsplate-portrait-upload__pick {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ns-color-border);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 78%, transparent);
  cursor: pointer;
}

.nsplate-portrait-upload__pick:hover {
  border-color: color-mix(in srgb, var(--ns-color-cyan) 58%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 10%, var(--ns-color-surface-solid));
}

.nsplate-portrait-upload__thumb {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--ns-color-border-strong);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text-muted);
  image-rendering: pixelated;
  transition:
    border-color var(--ns-transition-fast),
    color var(--ns-transition-fast);
}

.nsplate-portrait-upload__pick:hover .nsplate-portrait-upload__thumb {
  border-color: color-mix(in srgb, var(--ns-color-cyan) 66%, var(--ns-color-border-strong));
  color: var(--ns-color-cyan);
}

.nsplate-portrait-upload__empty-icon {
  width: 28px;
  height: 28px;
  background: currentColor;
  mask: var(--nsplate-portrait-upload-empty-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-portrait-upload-empty-icon) center / contain no-repeat;
}

.nsplate-portrait-upload__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nsplate-portrait-upload__text {
  display: grid;
  min-width: 0;
  gap: 2px;
  font-family: var(--ns-font-sans);
}

.nsplate-portrait-upload__text strong,
.nsplate-portrait-upload__text small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-portrait-upload__text strong {
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 850;
}

.nsplate-portrait-upload__text small {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.nsplate-portrait-upload__pick input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.nsplate-portrait-upload__layer {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.nsplate-portrait-upload__layer > span {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
}

.nsplate-portrait-upload__layer-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
  border: 1px solid var(--ns-color-border-strong);
  background: var(--ns-color-surface-solid);
}

.nsplate-portrait-upload__layer-options button {
  min-width: 0;
  min-height: 30px;
  padding: 0 4px;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 11px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.nsplate-portrait-upload__layer-options button + button {
  border-left: 1px solid var(--ns-color-border-strong);
}

.nsplate-portrait-upload__layer-options button[data-active='true'] {
  background: color-mix(in srgb, var(--ns-color-cyan) 22%, var(--ns-color-surface-solid));
  color: var(--ns-color-accent-strong);
}

.nsplate-portrait-upload__error {
  margin: 0;
  color: var(--ns-color-danger);
  font-size: 12px;
  font-weight: 800;
}
</style>
