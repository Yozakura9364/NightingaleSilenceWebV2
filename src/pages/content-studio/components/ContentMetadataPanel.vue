<template>
  <div class="metadata-panel">
    <label>{{ t(keys.draftTitle) }} <input v-model="title" :placeholder="t(keys.titlePlaceholder)" maxlength="120" /></label>
    <label>{{ t(keys.draftSummary) }} <textarea v-model="summary" :placeholder="t(keys.summaryPlaceholder)" maxlength="300" rows="2" /></label>
    <label>{{ t(keys.draftTags) }} <input v-model="tagsInput" :placeholder="t(keys.tagsPlaceholder)" /></label>
    <label>{{ t(keys.coverMediaId) }} <input v-model="coverMediaId" :placeholder="t(keys.coverPlaceholder)" /></label>
    <p v-if="publicId" class="public-id">{{ t(keys.publicIdLabel) }}: #{{ publicId }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'

const { t } = useLocale()
const keys = {
  draftTitle: contentStudioKeys.draftTitle,
  titlePlaceholder: contentStudioKeys.titlePlaceholder,
  draftSummary: contentStudioKeys.draftSummary,
  summaryPlaceholder: contentStudioKeys.summaryPlaceholder,
  draftTags: contentStudioKeys.draftTags,
  tagsPlaceholder: contentStudioKeys.tagsPlaceholder,
  coverMediaId: contentStudioKeys.coverMediaId,
  coverPlaceholder: contentStudioKeys.coverPlaceholder,
  publicIdLabel: contentStudioKeys.publicIdLabel,
}

const props = defineProps<{
  publicId?: number | null
  modelValue?: { title: string; summary?: string; tags?: string[]; coverMediaId?: string }
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: any): void }>()

const title = ref('')
const summary = ref('')
const tagsInput = ref('')
const coverMediaId = ref('')

watch(() => props.modelValue, (val) => {
  if (val) {
    title.value = val.title || ''
    summary.value = val.summary || ''
    tagsInput.value = (val.tags || []).join(', ')
    coverMediaId.value = val.coverMediaId || ''
  }
}, { immediate: true })

watch([title, summary, tagsInput, coverMediaId], () => {
  emit('update:modelValue', {
    title: title.value,
    summary: summary.value || undefined,
    tags: tagsInput.value.split(',').map(s => s.trim()).filter(Boolean),
    coverMediaId: coverMediaId.value || undefined,
  })
})
</script>

<style scoped>
.metadata-panel label { display: block; margin: 8px 0; }
.metadata-panel input, .metadata-panel textarea { width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; }
.public-id { color: var(--text-secondary,#666); font-size: 12px; }
</style>
