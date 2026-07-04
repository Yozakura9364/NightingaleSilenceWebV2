<template>
  <section class="nsarmoire-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireImport) }}</h2>
    </div>

    <AppStatus
      class="nsarmoire-import-panel__status"
      :tone="statusTone"
      :title="statusTitle"
      :message="t(textKeys.placeholder)"
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
      v-if="errorKey"
      class="nsarmoire-import-panel__error"
      tone="danger"
      :title="t(textKeys.nsarmoireSnapshotError)"
      :message="errorMessage"
    />

    <dl v-if="snapshot" class="nsarmoire-snapshot-meta">
      <div>
        <dt>{{ t(textKeys.nsarmoireGeneratedAt) }}</dt>
        <dd>{{ snapshot.generatedAt }}</dd>
      </div>
      <div>
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

const props = defineProps<{
  snapshot: ArmoireSnapshot | null
  errorKey: string | null
  errorDetail: string | null
  importedFileName: string | null
}>()

const emit = defineEmits<{
  'import-file': [file: File]
  'load-example': []
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
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
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
  min-width: 0;
}

.nsarmoire-import-panel__status {
  flex-wrap: wrap;
}

.nsarmoire-import-panel__status :deep(.app-status__content) {
  flex: 1 1 0;
}

.nsarmoire-import-panel__status :deep(.app-status__actions) {
  flex: 1 1 100%;
  flex-wrap: wrap;
  min-width: 0;
  margin-left: 0;
}

.nsarmoire-import-panel__status :deep(.ns-button) {
  flex: 1 1 100%;
  min-width: 0;
  justify-content: center;
  white-space: normal;
}

.nsarmoire-snapshot-meta {
  display: grid;
  gap: 8px;
  margin: 0;
  font-size: 12px;
}

.nsarmoire-snapshot-meta div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
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

@media (max-width: 640px) {
  .nsarmoire-import-panel__status :deep(.app-status__title) {
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .nsarmoire-snapshot-meta div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
