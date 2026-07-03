<template>
  <NSPlatePanel :title="t(textKeys.nsplateCustomPortrait)">
    <div class="nsplate-portrait-upload" :data-has-image="modelValue !== null">
      <label class="nsplate-portrait-upload__pick">
        <span class="nsplate-portrait-upload__thumb" aria-hidden="true">
          <img v-if="modelValue" :src="modelValue.dataUrl" :alt="modelValue.fileName" />
          <span v-else>+</span>
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
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { textKeys } from '@/config/site'
import { createCustomPortraitImageFromFile } from '@/lib/plate/customPortrait'
import type { NSPlateCustomPortraitImage } from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

defineProps<{
  modelValue: NSPlateCustomPortraitImage | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NSPlateCustomPortraitImage | null]
}>()

const { t } = useLocale()
const errorText = ref('')

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''

  if (!file) {
    return
  }

  errorText.value = ''

  try {
    emit('update:modelValue', await createCustomPortraitImageFromFile(file))
  } catch {
    errorText.value = t(textKeys.nsplateCustomPortraitError)
  }
}
</script>

<style scoped>
.nsplate-portrait-upload {
  display: grid;
  gap: 8px;
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
  border-color: rgba(57, 168, 135, 0.52);
  background: color-mix(in srgb, var(--ns-color-success) 10%, var(--ns-color-surface-solid));
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
  font-family: var(--ns-font-decorative);
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
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
</style>
