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
    </div>

    <p v-if="errorText" class="nsplate-portrait-upload__error">
      {{ errorText }}
    </p>

    <div v-if="modelValue" class="nsplate-portrait-upload__actions">
      <button type="button" @click="adjustCurrentImage">
        {{ t(textKeys.nsplateCustomPortraitAdjust) }}
      </button>
    </div>
  </NSPlatePanel>

  <NSPlateCropDialog
    v-if="cropState"
    :crop-state="cropState"
    :portrait-side="portraitSide"
    @apply="applyCrop"
    @cancel="cropState = null"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, type CSSProperties } from 'vue'

const NSPlateCropDialog = defineAsyncComponent(
  () => import('@/pages/plate/components/NSPlateCropDialog.vue')
)
import image2PlusIcon from '@/assets/icons/image-2-plus.svg'
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import {
  createCustomPortraitCropStateFromFile,
  createCustomPortraitCropStateFromImage,
  createCustomPortraitImageFromCropState
} from '@/lib/plate/customPortrait'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitImage,
  NSPlatePortraitSide
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  modelValue: NSPlateCustomPortraitImage | null
  portraitSide: NSPlatePortraitSide
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

async function adjustCurrentImage() {
  if (!props.modelValue) {
    return
  }

  errorText.value = ''

  try {
    cropState.value = await createCustomPortraitCropStateFromImage(props.modelValue)
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

.nsplate-portrait-upload__error {
  margin: 0;
  color: var(--ns-color-danger);
  font-size: 12px;
  font-weight: 800;
}

.nsplate-portrait-upload__actions {
  display: flex;
  justify-content: flex-end;
}

.nsplate-portrait-upload__actions button {
  min-height: 32px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 850;
}

.nsplate-portrait-upload__actions button {
  padding: 0 10px;
  cursor: pointer;
}
</style>
