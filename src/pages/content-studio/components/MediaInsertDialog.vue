<template>
  <div class="media-dialog-backdrop" @click.self="$emit('close')">
    <section class="media-dialog" role="dialog" aria-modal="true" :aria-label="t(keys.insertImage)">
      <header class="media-dialog__bar">
        <span class="media-dialog__title">{{ t(keys.insertImage) }}</span>
      </header>
      <div class="media-dialog__body">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="onFileSelect"
        />
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="uploading" class="uploading">{{ t(keys.uploading) }}</p>
        <div v-if="uploadedMedia" class="uploaded-info">
          <p class="uploaded-info__meta">
            {{ t(keys.uploadedLabel) }}: {{ uploadedMedia.publicObjectKey }} ({{
              uploadedMedia.width
            }}×{{ uploadedMedia.height }})
          </p>
          <AppField :label="t(keys.imageAlt)" for-id="media-dialog-alt" density="compact">
            <input id="media-dialog-alt" v-model="imageAlt" />
          </AppField>
          <AppField :label="t(keys.imageCaption)" for-id="media-dialog-caption" density="compact">
            <input id="media-dialog-caption" v-model="imageCaption" />
          </AppField>
          <AppField :label="t(keys.imageAlign)" for-id="media-dialog-align" density="compact">
            <select id="media-dialog-align" v-model="imageAlign">
              <option value="left">⇤ {{ t(keys.alignLeft) }}</option>
              <option value="center">⇔ {{ t(keys.alignCenter) }}</option>
              <option value="right">⇥ {{ t(keys.alignRight) }}</option>
            </select>
          </AppField>
          <AppField :label="t(keys.imageWidth)" for-id="media-dialog-width" density="compact">
            <select id="media-dialog-width" v-model.number="imageWidth">
              <option :value="25">25%</option>
              <option :value="50">50%</option>
              <option :value="75">75%</option>
              <option :value="100">100%</option>
            </select>
          </AppField>
          <div class="insert-actions">
            <AppButton size="compact" @click="insertSingleImage">{{
              t(keys.insertToEditor)
            }}</AppButton>
            <AppButton variant="primary" size="compact" @click="addToGallery">{{
              t(keys.addToGallery)
            }}</AppButton>
          </div>
        </div>
        <div class="dialog-actions">
          <AppButton v-if="error && !uploading" size="compact" @click="retryUpload">{{
            t(keys.retry)
          }}</AppButton>
          <AppButton size="compact" @click="$emit('close')">{{ t(keys.cancel) }}</AppButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLocale } from '@/stores/locale'
import { ApiError } from '@/composables/useFetch'
import { contentStudioToken } from '@/config/env'
import {
  uploadContentStudioMedia,
  type ContentStudioMediaUpload
} from '@/services/contentStudio/contentStudioApi'
import { contentStudioKeys } from '@/locales/keys/content'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'

const { t } = useLocale()
const keys = {
  insertImage: contentStudioKeys.insertImage,
  uploading: contentStudioKeys.uploading,
  uploadedLabel: contentStudioKeys.uploadedLabel,
  insertToEditor: contentStudioKeys.insertToEditor,
  retry: contentStudioKeys.retry,
  cancel: contentStudioKeys.cancel,
  imageAlt: contentStudioKeys.imageAlt,
  imageCaption: contentStudioKeys.imageCaption,
  imageAlign: contentStudioKeys.imageAlign,
  imageWidth: contentStudioKeys.imageWidth,
  addToGallery: contentStudioKeys.addToGallery,
  alignLeft: contentStudioKeys.alignLeft,
  alignCenter: contentStudioKeys.alignCenter,
  alignRight: contentStudioKeys.alignRight
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insertImage', mediaId: string, attrs: Record<string, unknown>): void
  (e: 'addToGallery', mediaId: string, attrs: Record<string, unknown>): void
}>()

const token = contentStudioToken
const error = ref('')
const uploading = ref(false)
const uploadedMedia = ref<ContentStudioMediaUpload | null>(null)
const imageAlt = ref('')
const imageCaption = ref('')
const imageAlign = ref('center')
const imageWidth = ref(75)
let lastFile: File | null = null

async function uploadFile(file: File) {
  uploading.value = true
  error.value = ''
  try {
    const obj = await uploadContentStudioMedia(file, token)
    uploadedMedia.value = obj
    imageAlt.value = obj.publicObjectKey || ''
    imageCaption.value = ''
    imageAlign.value = 'center'
    imageWidth.value = 75
  } catch (e: any) {
    if (e instanceof ApiError) {
      try {
        const errBody = JSON.parse(e.bodyText)
        error.value = errBody?.error?.message || t(keys.retry)
      } catch {
        error.value = t(keys.retry)
      }
    } else {
      error.value = e?.message || t(keys.retry)
    }
  } finally {
    uploading.value = false
  }
}

function onFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  lastFile = file
  uploadFile(file)
}

function retryUpload() {
  if (lastFile) uploadFile(lastFile)
}

function buildAttrs(): Record<string, unknown> {
  return {
    alt: imageAlt.value,
    caption: imageCaption.value || undefined,
    align: imageAlign.value,
    displayWidth: imageWidth.value
  }
}

function insertSingleImage() {
  if (!uploadedMedia.value) return
  emit('insertImage', uploadedMedia.value.id, buildAttrs())
  uploadedMedia.value = null
}

function addToGallery() {
  if (!uploadedMedia.value) return
  emit('addToGallery', uploadedMedia.value.id, buildAttrs())
  uploadedMedia.value = null
}
</script>

<style scoped>
.media-dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: color-mix(in srgb, var(--ns-color-bg) 62%, transparent);
  backdrop-filter: blur(4px);
}
.media-dialog {
  display: flex;
  flex-direction: column;
  min-width: 380px;
  max-width: min(480px, 92vw);
  max-height: 90vh;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-panel);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
}
.media-dialog__bar {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 14px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface);
}
.media-dialog__title {
  font-size: 13px;
  font-weight: 950;
}
.media-dialog__body {
  display: grid;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}
.error {
  margin: 0;
  color: var(--ns-status-danger-text);
  font-size: 13px;
}
.uploading {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.uploaded-info {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface-tint);
}
.uploaded-info__meta {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.insert-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
