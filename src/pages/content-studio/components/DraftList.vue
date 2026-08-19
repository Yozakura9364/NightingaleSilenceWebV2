<template>
  <aside class="draft-list">
    <AppButton block size="compact" @click="$emit('create')">+ {{ t(keys.createDraft) }}</AppButton>
    <div
      v-for="d in drafts"
      :key="d.id"
      class="draft-item"
      :class="{ active: selectedId === d.id }"
      @click="$emit('select', d.id)"
    >
      <div class="draft-head">
        <span class="draft-status" :class="`draft-status--${statusClass(d.status)}`">{{
          statusLabel(d.status)
        }}</span>
        <button
          v-if="d.status !== 'PUBLISHED'"
          class="draft-delete"
          type="button"
          :aria-label="t(keys.deleteDraft)"
          :title="t(keys.deleteDraft)"
          @click.stop="$emit('remove', d.id)"
        >
          ✕
        </button>
      </div>
      <div class="draft-title">{{ d.title || t(keys.untitled) }}</div>
      <div class="draft-meta">{{ d.updatedAt?.slice(0, 10) }}</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import AppButton from '@/components/AppButton.vue'

const { t } = useLocale()
const keys = {
  createDraft: contentStudioKeys.createDraft,
  untitled: contentStudioKeys.untitled,
  deleteDraft: contentStudioKeys.deleteDraft,
  statusDraft: contentStudioKeys.statusDraft,
  statusPublished: contentStudioKeys.statusPublished,
  statusArchived: contentStudioKeys.statusArchived
}

defineProps<{
  drafts: Array<{ id: string; title?: string; status?: string; updatedAt?: string }>
  selectedId?: string | null
}>()

defineEmits<{
  (e: 'create'): void
  (e: 'select', id: string): void
  (e: 'remove', id: string): void
}>()

function statusClass(status?: string): string {
  return (status ?? 'DRAFT').toLowerCase()
}

function statusLabel(status?: string): string {
  if (status === 'PUBLISHED') return t(keys.statusPublished)
  if (status === 'ARCHIVED') return t(keys.statusArchived)
  return t(keys.statusDraft)
}
</script>

<style scoped>
.draft-list {
  display: flex;
  flex: 0 0 240px;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: 12px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-panel);
}
.draft-item {
  display: grid;
  gap: 3px;
  padding: 8px 10px;
  cursor: pointer;
  border: var(--ns-line-width) solid transparent;
  border-radius: var(--ns-radius-sm);
  transition:
    background var(--ns-transition-fast),
    border-color var(--ns-transition-fast);
}
.draft-item:hover {
  background: var(--ns-color-surface-tint);
}
.draft-item.active {
  border-color: var(--ns-color-border);
  background: var(--ns-color-accent-soft);
}
.draft-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.draft-status {
  padding: 1px 8px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-pill);
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 700;
  align-self: start;
}
.draft-status--published {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
  color: var(--ns-color-success);
}
.draft-status--archived {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
  color: var(--ns-status-warning-text);
}
.draft-delete {
  padding: 0 6px;
  border: none;
  border-radius: var(--ns-radius-xs);
  background: transparent;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity var(--ns-transition-fast),
    background var(--ns-transition-fast),
    color var(--ns-transition-fast);
}
.draft-item:hover .draft-delete,
.draft-item.active .draft-delete {
  opacity: 1;
}
.draft-delete:hover {
  background: var(--ns-status-danger-bg);
  color: var(--ns-status-danger-text);
}
.draft-title {
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.draft-meta {
  font-size: 11px;
  color: var(--ns-color-text-muted);
}
</style>
