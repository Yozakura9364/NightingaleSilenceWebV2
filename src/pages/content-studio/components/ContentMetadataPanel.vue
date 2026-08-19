<template>
  <div class="ns-workbench-panel ns-workbench-panel--compact metadata-panel">
    <AppField :label="t(keys.draftTitle)" for-id="studio-meta-title" density="compact">
      <input
        id="studio-meta-title"
        v-model="title"
        :placeholder="t(keys.titlePlaceholder)"
        maxlength="120"
      />
    </AppField>
    <AppField :label="t(keys.draftSummary)" for-id="studio-meta-summary" density="compact">
      <textarea
        id="studio-meta-summary"
        v-model="summary"
        :placeholder="t(keys.summaryPlaceholder)"
        maxlength="300"
        rows="2"
      />
    </AppField>
    <AppField :label="t(keys.draftTags)" for-id="studio-meta-tags" density="compact">
      <input id="studio-meta-tags" v-model="tagsInput" :placeholder="t(keys.tagsPlaceholder)" />
    </AppField>
    <AppField :label="t(keys.coverMediaId)" for-id="studio-meta-cover" density="compact">
      <input
        id="studio-meta-cover"
        v-model="coverMediaId"
        :placeholder="t(keys.coverPlaceholder)"
      />
    </AppField>
    <p v-if="publicId" class="public-id">{{ t(keys.publicIdLabel) }}: #{{ publicId }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import AppField from '@/components/AppField.vue'

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
  publicIdLabel: contentStudioKeys.publicIdLabel
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

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      title.value = val.title || ''
      summary.value = val.summary || ''
      tagsInput.value = (val.tags || []).join(', ')
      coverMediaId.value = val.coverMediaId || ''
    }
  },
  { immediate: true }
)

watch([title, summary, tagsInput, coverMediaId], () => {
  emit('update:modelValue', {
    title: title.value,
    summary: summary.value || undefined,
    tags: tagsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    coverMediaId: coverMediaId.value || undefined
  })
})
</script>

<style scoped>
.metadata-panel {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}
.metadata-panel > *:nth-child(1),
.metadata-panel > *:nth-child(2) {
  grid-column: 1 / -1;
}
.public-id {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}
@media (max-width: 720px) {
  .metadata-panel {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
