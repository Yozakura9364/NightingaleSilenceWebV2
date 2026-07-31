<template>
  <div class="media-dialog-backdrop" @click.self="$emit('close')">
    <div class="media-dialog">
      <h3>{{ t(keys.insertImage) }}</h3>
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="onFileSelect" />
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="uploading">{{ t(keys.uploading) }}</p>
      <div v-if="uploadedMedia" class="uploaded-info">
        <p>{{ t(keys.uploadedLabel) }}: {{ uploadedMedia.publicObjectKey }} ({{ uploadedMedia.width }}×{{ uploadedMedia.height }})</p>
        <label>{{ t(keys.imageAlt) }} <input v-model="imageAlt" /></label>
        <label>{{ t(keys.imageCaption) }} <input v-model="imageCaption" /></label>
        <label>{{ t(keys.imageAlign) }}
          <select v-model="imageAlign">
            <option value="left">⇤ {{ t(keys.alignLeft) }}</option>
            <option value="center">⇔ {{ t(keys.alignCenter) }}</option>
            <option value="right">⇥ {{ t(keys.alignRight) }}</option>
          </select>
        </label>
        <label>{{ t(keys.imageWidth) }}
          <select v-model.number="imageWidth">
            <option :value="25">25%</option>
            <option :value="50">50%</option>
            <option :value="75">75%</option>
            <option :value="100">100%</option>
          </select>
        </label>
        <div class="insert-actions">
          <button @click="insertSingleImage">{{ t(keys.insertToEditor) }}</button>
          <button @click="addToGallery">{{ t(keys.addToGallery) }}</button>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="retryUpload" v-if="error && !uploading">{{ t(keys.retry) }}</button>
        <button @click="$emit('close')">{{ t(keys.cancel) }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'

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
  alignRight: contentStudioKeys.alignRight,
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insertImage', mediaId: string, attrs: Record<string, unknown>): void
  (e: 'addToGallery', mediaId: string, attrs: Record<string, unknown>): void
}>()

const token = import.meta.env.VITE_CONTENT_STUDIO_TOKEN || ''
const error = ref('')
const uploading = ref(false)
const uploadedMedia = ref<any>(null)
const imageAlt = ref('')
const imageCaption = ref('')
const imageAlign = ref('center')
const imageWidth = ref(75)
let lastFile: File | null = null

async function uploadFile(file: File) {
  uploading.value = true
  error.value = ''
  try {
    const data = await file.arrayBuffer()
    const resp = await fetch('/api/content-studio/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': file.name,
        'X-Content-Studio-Token': token
      },
      body: data
    })
    if (!resp.ok) {
      const err = await resp.json()
      error.value = err?.error?.message || t(keys.retry)
      return
    }
    const obj = await resp.json()
    uploadedMedia.value = obj
    imageAlt.value = obj.publicObjectKey || ''
    imageCaption.value = ''
    imageAlign.value = 'center'
    imageWidth.value = 75
  } catch (e: any) {
    error.value = e?.message || t(keys.retry)
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
    displayWidth: imageWidth.value,
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
.media-dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 100; }
.media-dialog { background: var(--bg-primary,#fff); padding: 24px; border-radius: 8px; min-width: 380px; max-height: 90vh; overflow-y: auto; }
.error { color: red; font-size: 13px; }
.uploaded-info { margin-top: 12px; padding: 8px; background: #f0f0f0; border-radius: 4px; }
.uploaded-info label { display: block; margin: 4px 0; font-size: 13px; }
.uploaded-info input, .uploaded-info select { padding: 4px; border: 1px solid #ccc; border-radius: 3px; width: 100%; }
.insert-actions { margin-top: 8px; display: flex; gap: 4px; }
.dialog-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
button:hover { background: #f5f5f5; }
</style>
