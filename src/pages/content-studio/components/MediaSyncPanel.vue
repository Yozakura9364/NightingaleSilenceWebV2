<template>
  <div class="ns-workbench-panel ns-workbench-panel--compact media-sync-panel">
    <div class="media-sync-panel__row">
      <span class="media-sync-panel__title">{{ t(keys.mediaSyncTitle) }}</span>
      <span v-if="summaryLabel" class="media-sync-panel__summary">{{ summaryLabel }}</span>
    </div>

    <p v-if="error" class="media-sync-panel__error">{{ error }}</p>

    <ul v-if="failedItems.length" class="media-sync-panel__failures">
      <li v-for="item in failedItems" :key="item.id">
        <span class="media-sync-panel__key">{{ item.publicObjectKey || item.id }}</span>
        <span class="media-sync-panel__detail">{{ item.detail || item.status }}</span>
      </li>
    </ul>

    <div class="media-sync-panel__actions">
      <AppButton variant="primary" size="compact" :disabled="busy" @click="onSync">
        {{ busy ? t(keys.mediaSyncBusy) : t(keys.mediaSyncButton) }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import AppButton from '@/components/AppButton.vue'
import { contentStudioToken } from '@/config/env'
import {
  syncContentStudioMedia,
  type ContentStudioMediaSyncItem
} from '@/services/contentStudio/contentStudioApi'

const { t } = useLocale()
const keys = {
  mediaSyncTitle: contentStudioKeys.mediaSyncTitle,
  mediaSyncButton: contentStudioKeys.mediaSyncButton,
  mediaSyncBusy: contentStudioKeys.mediaSyncBusy,
  mediaSyncSummaryOk: contentStudioKeys.mediaSyncSummaryOk,
  mediaSyncSummaryPartial: contentStudioKeys.mediaSyncSummaryPartial,
  mediaSyncSummaryEmpty: contentStudioKeys.mediaSyncSummaryEmpty
}

const busy = ref(false)
const error = ref('')
const summary = ref<{ ok: number; total: number } | null>(null)
const failedItems = ref<ContentStudioMediaSyncItem[]>([])

const summaryLabel = computed(() => {
  if (!summary.value) return ''
  const { ok, total } = summary.value
  if (total === 0) return t(keys.mediaSyncSummaryEmpty)
  if (ok === total) return `${ok}/${total} · ${t(keys.mediaSyncSummaryOk)}`
  return `${ok}/${total} · ${t(keys.mediaSyncSummaryPartial)}`
})

async function onSync() {
  busy.value = true
  error.value = ''
  failedItems.value = []
  summary.value = null
  try {
    const result = await syncContentStudioMedia(contentStudioToken)
    summary.value = { ok: result.uploaded, total: result.count }
    failedItems.value = result.results.filter((item) => !item.ok)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.media-sync-panel {
  gap: 10px;
}
.media-sync-panel__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.media-sync-panel__title {
  font-size: 13px;
  font-weight: 950;
}
.media-sync-panel__summary {
  color: var(--ns-color-text-muted);
  font-size: 12px;
}
.media-sync-panel__error {
  margin: 0;
  padding: 8px 10px;
  border: var(--ns-line-width) solid var(--ns-status-danger-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-status-danger-bg);
  color: var(--ns-status-danger-text);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.media-sync-panel__failures {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.media-sync-panel__failures li {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}
.media-sync-panel__key {
  color: var(--ns-color-text-muted);
  overflow-wrap: anywhere;
}
.media-sync-panel__detail {
  color: var(--ns-status-warning-text);
  overflow-wrap: anywhere;
}
.media-sync-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
