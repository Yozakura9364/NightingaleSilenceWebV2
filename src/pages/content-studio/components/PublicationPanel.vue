<template>
  <div class="ns-workbench-panel ns-workbench-panel--compact publication-panel">
    <div class="publication-panel__row">
      <span class="publication-panel__title">{{ t(keys.publicationTitle) }}</span>
      <span
        class="publication-status"
        :class="`publication-status--${statusClass}`"
        :data-status="status"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div
      v-if="status === 'PUBLISHED' && publicId"
      class="publication-panel__row publication-panel__meta"
    >
      <span>{{ t(keys.publicationPublishedAt) }}: {{ publishedAtLabel }}</span>
      <RouterLink class="publication-panel__link" :to="`/blog/${publicId}`" target="_blank">
        {{ t(keys.publicationViewPublic) }}
      </RouterLink>
    </div>

    <p v-if="error" class="publication-panel__error">{{ error }}</p>

    <div class="publication-panel__actions">
      <AppButton size="compact" :disabled="busy" @click="$emit('preview')">
        {{ t(keys.publicationPreview) }}
      </AppButton>
      <AppButton
        v-if="status === 'DRAFT'"
        variant="primary"
        size="compact"
        :disabled="busy"
        @click="$emit('publish')"
      >
        {{ t(keys.publicationPublish) }}
      </AppButton>
      <AppButton
        v-if="status === 'PUBLISHED'"
        size="compact"
        :disabled="busy"
        @click="$emit('withdraw')"
      >
        {{ t(keys.publicationWithdraw) }}
      </AppButton>
      <AppButton
        v-if="status !== 'ARCHIVED'"
        size="compact"
        :disabled="busy"
        @click="$emit('archive')"
      >
        {{ t(keys.publicationArchive) }}
      </AppButton>
      <AppButton
        v-if="status === 'ARCHIVED'"
        size="compact"
        :disabled="busy"
        @click="$emit('restore')"
      >
        {{ t(keys.publicationRestore) }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import AppButton from '@/components/AppButton.vue'

const { t } = useLocale()
const keys = {
  publicationTitle: contentStudioKeys.publicationTitle,
  statusDraft: contentStudioKeys.statusDraft,
  statusPublished: contentStudioKeys.statusPublished,
  statusArchived: contentStudioKeys.statusArchived,
  publicationPreview: contentStudioKeys.publicationPreview,
  publicationPublish: contentStudioKeys.publicationPublish,
  publicationWithdraw: contentStudioKeys.publicationWithdraw,
  publicationArchive: contentStudioKeys.publicationArchive,
  publicationRestore: contentStudioKeys.publicationRestore,
  publicationViewPublic: contentStudioKeys.publicationViewPublic,
  publicationPublishedAt: contentStudioKeys.publicationPublishedAt
}

const props = defineProps<{
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publicId: number | null
  publishedAt: string | null
  busy: boolean
  error: string | null
}>()

defineEmits<{
  (e: 'preview'): void
  (e: 'publish'): void
  (e: 'withdraw'): void
  (e: 'archive'): void
  (e: 'restore'): void
}>()

const statusClass = computed(() => props.status.toLowerCase())
const statusLabel = computed(() => {
  if (props.status === 'PUBLISHED') return t(keys.statusPublished)
  if (props.status === 'ARCHIVED') return t(keys.statusArchived)
  return t(keys.statusDraft)
})

const publishedAtLabel = computed(() => {
  if (!props.publishedAt) return '-'
  const d = new Date(props.publishedAt)
  if (Number.isNaN(d.getTime())) return props.publishedAt
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
})
</script>

<style scoped>
.publication-panel {
  gap: 10px;
}
.publication-panel__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.publication-panel__title {
  font-size: 13px;
  font-weight: 950;
}
.publication-panel__meta {
  font-size: 12px;
  color: var(--ns-color-text-muted);
}
.publication-panel__link {
  color: var(--ns-color-accent-strong);
  text-decoration: underline;
}
.publication-status {
  padding: 2px 10px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-pill);
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
}
.publication-status--published {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
  color: var(--ns-color-success);
}
.publication-status--archived {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
  color: var(--ns-status-warning-text);
}
.publication-panel__error {
  margin: 0;
  padding: 8px 10px;
  border: var(--ns-line-width) solid var(--ns-status-danger-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-status-danger-bg);
  color: var(--ns-status-danger-text);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.publication-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
