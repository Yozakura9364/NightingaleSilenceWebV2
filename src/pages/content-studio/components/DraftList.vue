<template>
  <div class="draft-list">
    <button @click="$emit('create')" class="btn-create">+ {{ t(keys.createDraft) }}</button>
    <div v-for="d in drafts" :key="d.id" class="draft-item" :class="{ active: selectedId === d.id }" @click="$emit('select', d.id)">
      <div class="draft-title">{{ d.title || t(keys.untitled) }}</div>
      <div class="draft-meta">{{ d.status }} · {{ d.updatedAt?.slice(0, 10) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'

const { t } = useLocale()
const keys = {
  createDraft: contentStudioKeys.createDraft,
  untitled: contentStudioKeys.untitled,
}

defineProps<{
  drafts: Array<{ id: string; title?: string; status?: string; updatedAt?: string }>
  selectedId?: string | null
}>()

defineEmits<{
  (e: 'create'): void
  (e: 'select', id: string): void
}>()
</script>

<style scoped>
.draft-list { width: 240px; border-right: 1px solid var(--border-color,#e0e0e0); overflow-y: auto; padding: 8px; }
.btn-create { width: 100%; padding: 8px; border: 1px dashed var(--border-color,#ccc); background: transparent; cursor: pointer; border-radius: 4px; margin-bottom: 8px; }
.draft-item { padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 2px; }
.draft-item:hover { background: var(--bg-hover,#f0f0f0); }
.draft-item.active { background: var(--bg-active,#e0e0e0); }
.draft-title { font-weight: 500; }
.draft-meta { font-size: 11px; color: var(--text-secondary,#999); }
</style>
