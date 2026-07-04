<template>
  <section class="nsarmoire-panel nsarmoire-import-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireImport) }}</h2>
    </div>

    <AppStatus
      class="nsarmoire-import-panel__status"
      compact
      :tone="statusTone"
      :title="statusTitle"
    >
      <template #actions>
        <AppButton @click="$emit('load-example')">
          {{ t(textKeys.nsarmoireLoadExampleSnapshot) }}
        </AppButton>

        <label class="ns-button ns-button--primary nsarmoire-import-button">
          <span>{{ t(textKeys.nsarmoireImportSnapshot) }}</span>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            :aria-label="t(textKeys.nsarmoireSnapshotInput)"
            @change="handleFileChange"
          />
        </label>

        <AppButton v-if="snapshot" @click="$emit('clear')">
          {{ t(textKeys.nsarmoireClearSnapshot) }}
        </AppButton>
      </template>
    </AppStatus>

    <AppStatus
      class="nsarmoire-import-panel__helper"
      compact
      :tone="helperStatusTone"
      :title="t(helperStatusTitleKey)"
      :message="helperStatusMessage"
    >
      <template #actions>
        <AppButton :disabled="helperBusy" @click="$emit('connect-helper')">
          {{ t(textKeys.nsarmoireConnectHelper) }}
        </AppButton>

        <AppButton
          :disabled="helperBusy || !helperCanRefresh"
          @click="$emit('refresh-helper')"
        >
          {{ t(textKeys.nsarmoireRefreshHelper) }}
        </AppButton>
      </template>
    </AppStatus>

    <AppStatus
      v-if="errorKey"
      class="nsarmoire-import-panel__error"
      tone="danger"
      :title="t(textKeys.nsarmoireSnapshotError)"
      :message="errorMessage"
    />

    <dl v-if="snapshot || helperHealth" class="nsarmoire-snapshot-meta">
      <div v-if="snapshot">
        <dt>{{ t(textKeys.nsarmoireGeneratedAt) }}</dt>
        <dd>{{ snapshot.generatedAt }}</dd>
      </div>
      <div v-if="snapshot">
        <dt>{{ t(textKeys.nsarmoireSource) }}</dt>
        <dd>{{ snapshot.source }}</dd>
      </div>
      <div v-if="characterLabel">
        <dt>{{ t(textKeys.nsarmoireCharacter) }}</dt>
        <dd>{{ characterLabel }}</dd>
      </div>
      <div v-if="importedFileName">
        <dt>{{ t(textKeys.details) }}</dt>
        <dd>{{ importedFileName }}</dd>
      </div>
      <div>
        <dt>{{ t(textKeys.nsarmoireHelperEndpoint) }}</dt>
        <dd>{{ helperEndpoint }}</dd>
      </div>
      <div v-if="helperHealth">
        <dt>{{ t(textKeys.nsarmoireHelperCatalog) }}</dt>
        <dd>{{ helperCatalogLabel }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import type { ArmoireSnapshot } from '@/lib/armoire/types'
import type { ArmoireHelperHealth } from '@/pages/armoire/services/nsarmoireHelperApi'
import { formatArmoireText } from '@/pages/armoire/utils/itemDisplay'

const props = defineProps<{
  snapshot: ArmoireSnapshot | null
  errorKey: string | null
  errorDetail: string | null
  importedFileName: string | null
  helperStatusTone: 'info' | 'success' | 'warning' | 'danger' | 'loading'
  helperStatusTitleKey: string
  helperStatusMessageKey: string
  helperErrorDetail: string | null
  helperEndpoint: string
  helperHealth: ArmoireHelperHealth | null
  helperBusy: boolean
  helperCanRefresh: boolean
}>()

const emit = defineEmits<{
  'import-file': [file: File]
  'load-example': []
  'connect-helper': []
  'refresh-helper': []
  clear: []
}>()

const { t } = useLocale()
const fileInput = ref<HTMLInputElement | null>(null)

const statusTone = computed(() => (props.snapshot ? 'success' : 'info'))
const statusTitle = computed(() =>
  t(props.snapshot ? textKeys.nsarmoireSnapshotReady : textKeys.nsarmoireSnapshotEmpty)
)
const errorMessage = computed(() => {
  if (!props.errorKey) {
    return ''
  }

  return props.errorDetail ? `${t(props.errorKey)}: ${props.errorDetail}` : t(props.errorKey)
})
const helperStatusMessage = computed(() =>
  props.helperErrorDetail
    ? `${t(props.helperStatusMessageKey)}: ${props.helperErrorDetail}`
    : t(props.helperStatusMessageKey)
)
const helperCatalogLabel = computed(() => {
  if (!props.helperHealth?.catalogLocated) {
    return t(textKeys.nsarmoireHelperCatalogMissing)
  }

  return formatArmoireText(t, textKeys.nsarmoireHelperCatalogReady, {
    count: props.helperHealth.catalogCabinetEntryCount ?? 0
  })
})
const characterLabel = computed(() => {
  const character = props.snapshot?.character

  if (!character) {
    return ''
  }

  return [character.name, character.world, character.dataCenter].filter(Boolean).join(' / ')
})

function handleFileChange(event: Event) {
  const input = event.target

  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
    return
  }

  emit('import-file', input.files[0])

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.nsarmoire-panel {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsarmoire-import-panel {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}

.nsarmoire-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-panel h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
  font-weight: 950;
}

.nsarmoire-import-button {
  position: relative;
  overflow: hidden;
}

.nsarmoire-import-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.nsarmoire-import-panel__error {
  grid-column: 1 / -1;
  min-width: 0;
}

.nsarmoire-import-panel__helper {
  grid-column: 1 / -1;
  min-width: 0;
}

.nsarmoire-import-panel__status {
  min-width: 0;
}

.nsarmoire-import-panel__status :deep(.app-status__content),
.nsarmoire-import-panel__helper :deep(.app-status__content) {
  flex: 0 1 auto;
}

.nsarmoire-import-panel__status :deep(.app-status__actions),
.nsarmoire-import-panel__helper :deep(.app-status__actions) {
  flex: 1 1 auto;
  flex-wrap: wrap;
  min-width: min(100%, 320px);
  margin-left: auto;
}

.nsarmoire-import-panel__status :deep(.ns-button),
.nsarmoire-import-panel__helper :deep(.ns-button) {
  flex: 0 1 auto;
  min-width: 0;
  justify-content: center;
  white-space: nowrap;
}

.nsarmoire-snapshot-meta {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin: 0;
  font-size: 12px;
}

.nsarmoire-snapshot-meta div {
  display: grid;
  gap: 2px;
}

.nsarmoire-snapshot-meta dt,
.nsarmoire-snapshot-meta dd {
  margin: 0;
  min-width: 0;
}

.nsarmoire-snapshot-meta dt {
  color: var(--ns-color-text-muted);
  font-weight: 850;
}

.nsarmoire-snapshot-meta dd {
  font-family: var(--ns-font-mono);
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .nsarmoire-import-panel {
    grid-template-columns: 1fr;
  }

  .nsarmoire-import-panel__status,
  .nsarmoire-import-panel__helper {
    flex-wrap: wrap;
  }

  .nsarmoire-import-panel__status :deep(.app-status__actions),
  .nsarmoire-import-panel__helper :deep(.app-status__actions) {
    flex: 1 1 100%;
    margin-left: 0;
  }

  .nsarmoire-import-panel__status :deep(.ns-button),
  .nsarmoire-import-panel__helper :deep(.ns-button) {
    flex: 1 1 100%;
    white-space: normal;
  }
}

@media (max-width: 640px) {
  .nsarmoire-import-panel__status :deep(.app-status__title),
  .nsarmoire-import-panel__helper :deep(.app-status__title) {
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .nsarmoire-snapshot-meta div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
