<template>
  <section class="nsarmoire-panel nsarmoire-import-panel" :class="`nsarmoire-import-panel--${mode}`">
    <div v-if="mode === 'hero'" class="nsarmoire-panel__header">
      <h2>{{ cleanT(textKeys.nsarmoireImport) }}</h2>
    </div>

    <div
      v-if="mode === 'compact' && snapshot"
      class="nsarmoire-import-panel__summary"
      :aria-label="compactSummaryAriaLabel"
      :title="compactSummaryAriaLabel"
    >
      <span class="nsarmoire-import-panel__summary-line">
        <span>
          <b>{{ cleanT(textKeys.nsarmoireCharacter) }}：</b>
          <strong>{{ characterLabel }}</strong>
        </span>
        <span>
          <b>{{ cleanT(textKeys.nsarmoireGeneratedAt) }}：</b>
          <span>{{ generatedAtLabel }}</span>
        </span>
      </span>
      <span class="nsarmoire-import-panel__summary-line">
        <span>
          <b>{{ cleanT(textKeys.nsarmoireReadContainers) }}：</b>
          <span>{{ readContainersLabel }}</span>
        </span>
      </span>
    </div>

    <div v-if="shouldShowStatusRow" class="nsarmoire-import-panel__status-row">
      <span
        v-if="mode === 'hero' || !snapshot"
        class="nsarmoire-import-panel__chip"
        :class="`nsarmoire-import-panel__chip--${statusTone}`"
      >
        <span class="nsarmoire-import-panel__chip-mark" aria-hidden="true"></span>
        <span>{{ statusTitle }}</span>
      </span>

      <span
        v-if="mode === 'hero' || shouldShowCompactHelperStatus"
        class="nsarmoire-import-panel__chip"
        :class="`nsarmoire-import-panel__chip--${helperStatusTone}`"
      >
        <span class="nsarmoire-import-panel__chip-mark" aria-hidden="true"></span>
        <span>{{ cleanT(helperStatusTitleKey) }}</span>
      </span>
    </div>

    <div class="nsarmoire-import-panel__actions">
      <AppButton v-if="mode === 'hero'" @click="$emit('load-example')">
        {{ cleanT(textKeys.nsarmoireLoadExampleSnapshot) }}
      </AppButton>

      <label class="ns-button ns-button--primary nsarmoire-import-button">
        <span>{{ cleanT(mode === 'compact' ? textKeys.import : textKeys.nsarmoireImportSnapshot) }}</span>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          :aria-label="cleanT(textKeys.nsarmoireSnapshotInput)"
          @change="handleFileChange"
        />
      </label>

      <AppButton v-if="snapshot" @click="$emit('clear')">
        {{ cleanT(textKeys.nsarmoireClearSnapshot) }}
      </AppButton>

      <a
        v-if="mode === 'hero' || !helperHealth"
        class="ns-button ns-button--secondary nsarmoire-helper-download"
        :href="HELPER_RELEASE_URL"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ cleanT(textKeys.nsarmoireDownloadHelper) }}
      </a>

      <AppButton :disabled="helperBusy" @click="$emit('connect-helper')">
        {{ cleanT(textKeys.nsarmoireConnectHelper) }}
      </AppButton>

      <AppButton
        v-if="mode === 'hero' || helperCanRefresh"
        :disabled="helperBusy || !helperCanRefresh"
        @click="$emit('refresh-helper')"
      >
        {{ cleanT(textKeys.nsarmoireRefreshHelper) }}
      </AppButton>

      <AppButton
        v-if="helperCanShutdown"
        variant="secondary"
        :disabled="helperBusy"
        @click="$emit('shutdown-helper')"
      >
        {{ cleanT(textKeys.nsarmoireShutdownHelper) }}
      </AppButton>
    </div>

    <p v-if="helperErrorDetail" class="nsarmoire-import-panel__helper-error">
      {{ helperStatusMessage }}
    </p>

    <AppStatus
      v-if="errorKey"
      class="nsarmoire-import-panel__error"
      tone="danger"
      :title="cleanT(textKeys.nsarmoireSnapshotError)"
      :message="errorMessage"
    />

    <dl v-if="mode === 'hero' && (snapshot || helperHealth)" class="nsarmoire-snapshot-meta">
      <div v-if="snapshot">
        <dt>{{ cleanT(textKeys.nsarmoireGeneratedAt) }}</dt>
        <dd>{{ snapshot.generatedAt }}</dd>
      </div>
      <div v-if="snapshot">
        <dt>{{ cleanT(textKeys.nsarmoireSource) }}</dt>
        <dd>{{ snapshot.source }}</dd>
      </div>
      <div v-if="characterLabel">
        <dt>{{ cleanT(textKeys.nsarmoireCharacter) }}</dt>
        <dd>{{ characterLabel }}</dd>
      </div>
      <div v-if="importedFileName">
        <dt>{{ cleanT(textKeys.details) }}</dt>
        <dd>{{ importedFileName }}</dd>
      </div>
      <div>
        <dt>{{ cleanT(textKeys.nsarmoireHelperEndpoint) }}</dt>
        <dd>{{ helperEndpoint }}</dd>
      </div>
      <div v-if="helperHealth">
        <dt>{{ cleanT(textKeys.nsarmoireHelperCatalog) }}</dt>
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
import type { ArmoireContainerKind, ArmoireSnapshot } from '@/lib/armoire/types'
import type { ArmoireHelperHealth } from '@/pages/armoire/services/nsarmoireHelperApi'

const props = defineProps<{
  mode: 'hero' | 'compact'
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
  helperCanShutdown: boolean
}>()

const emit = defineEmits<{
  'import-file': [file: File]
  'load-example': []
  'connect-helper': []
  'refresh-helper': []
  'shutdown-helper': []
  clear: []
}>()

const { current, t } = useLocale()
const fileInput = ref<HTMLInputElement | null>(null)
const HELPER_RELEASE_URL = 'https://github.com/Yozakura9364/NightingaleSilenceWebV2/releases/latest'
const DRAFT_SUFFIX_PATTERN = /（占位用，待编辑）/g
const READ_CONTAINER_PREVIEW_LIMIT = 6

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}
const CONTAINER_DISPLAY_ORDER: ArmoireContainerKind[] = [
  'armoire',
  'inventory',
  'armoury',
  'glamourDresser',
  'saddlebag',
  'manual'
]

function cleanText(value: string): string {
  return value.replace(DRAFT_SUFFIX_PATTERN, '')
}

function cleanT(key: string): string {
  return cleanText(t(key))
}

function formatPanelText(key: string, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
}

const statusTone = computed(() => (props.snapshot ? 'success' : 'info'))
const statusTitle = computed(() =>
  cleanT(props.snapshot ? textKeys.nsarmoireSnapshotReady : textKeys.nsarmoireSnapshotEmpty)
)
const errorMessage = computed(() => {
  if (!props.errorKey) {
    return ''
  }

  return props.errorDetail ? `${cleanT(props.errorKey)}: ${props.errorDetail}` : cleanT(props.errorKey)
})
const helperStatusMessage = computed(() =>
  props.helperErrorDetail
    ? `${cleanT(props.helperStatusMessageKey)}: ${props.helperErrorDetail}`
    : cleanT(props.helperStatusMessageKey)
)
const shouldShowCompactHelperStatus = computed(() =>
  props.helperBusy || Boolean(props.helperErrorDetail) || ['warning', 'danger'].includes(props.helperStatusTone)
)
const shouldShowStatusRow = computed(() =>
  props.mode === 'hero' || !props.snapshot || shouldShowCompactHelperStatus.value
)
const helperCatalogLabel = computed(() => {
  if (!props.helperHealth?.catalogLocated) {
    return cleanT(textKeys.nsarmoireHelperCatalogMissing)
  }

  return cleanText(formatPanelText(textKeys.nsarmoireHelperCatalogReady, {
    count: props.helperHealth.catalogCabinetEntryCount ?? 0
  }))
})
const characterLabel = computed(() => {
  const character = props.snapshot?.character

  if (!character) {
    return cleanT(textKeys.nsarmoireCharacterUnknown)
  }

  return [character.name || cleanT(textKeys.nsarmoireCharacterUnknown), character.world]
    .filter(Boolean)
    .join(' @ ')
})
const generatedAtLabel = computed(() => {
  const value = props.snapshot?.generatedAt

  if (!value) {
    return cleanT(textKeys.nsarmoireCharacterGeneratedAtEmpty)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(current.value, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
})
const readContainerLabels = computed(() => {
  const containers = new Set<ArmoireContainerKind>()
  const retainerLabels: string[] = []

  for (const item of props.snapshot?.items ?? []) {
    if (item.container === 'retainer') {
      const retainerLabel = item.retainerName?.trim() || item.containerName?.trim()

      if (retainerLabel && !retainerLabels.includes(retainerLabel)) {
        retainerLabels.push(retainerLabel)
      }

      continue
    }

    if (containerLabelKeys[item.container]) {
      containers.add(item.container)
    }
  }

  const containerLabels = CONTAINER_DISPLAY_ORDER
    .filter((container) => containers.has(container))
    .map((container) => cleanT(containerLabelKeys[container]))

  if (!retainerLabels.length && props.snapshot?.items.some((item) => item.container === 'retainer')) {
    retainerLabels.push(cleanT(containerLabelKeys.retainer))
  }

  return [...containerLabels, ...retainerLabels]
})
const fullReadContainersLabel = computed(() => readContainerLabels.value.join(' / '))
const readContainersLabel = computed(() => {
  const labels = readContainerLabels.value

  if (labels.length <= READ_CONTAINER_PREVIEW_LIMIT) {
    return fullReadContainersLabel.value
  }

  return cleanText(
    formatPanelText(textKeys.nsarmoireReadContainersMore, {
      items: labels.slice(0, READ_CONTAINER_PREVIEW_LIMIT).join(' / '),
      count: labels.length
    })
  )
})
const compactSummaryAriaLabel = computed(() =>
  [
    `${cleanT(textKeys.nsarmoireCharacter)}: ${characterLabel.value}`,
    `${cleanT(textKeys.nsarmoireGeneratedAt)}: ${generatedAtLabel.value}`,
    `${cleanT(textKeys.nsarmoireReadContainers)}: ${fullReadContainersLabel.value}`
  ].join('；')
)

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
  gap: 6px;
  padding: 6px 8px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsarmoire-import-panel {
  grid-template-columns: auto minmax(240px, 0.8fr) minmax(420px, 1.2fr);
  align-items: center;
}

.nsarmoire-import-panel--hero {
  min-height: 260px;
  grid-template-columns: 1fr;
  align-content: center;
  justify-items: start;
  gap: 16px;
  padding: 34px;
  background: #ffffff;
}

.nsarmoire-import-panel--compact {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  padding: 6px 8px;
  background: #ffffff;
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
  font-size: 14px;
  font-weight: 950;
  white-space: nowrap;
}

.nsarmoire-import-panel--hero h2 {
  font-size: 24px;
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

.nsarmoire-import-panel__status-row {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.nsarmoire-import-panel--compact .nsarmoire-import-panel__status-row {
  grid-column: 1 / -1;
}

.nsarmoire-import-panel__chip {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-pixel-window-bg);
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.nsarmoire-import-panel__chip span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-import-panel__chip-mark {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-muted);
}

.nsarmoire-import-panel__chip--info .nsarmoire-import-panel__chip-mark,
.nsarmoire-import-panel__chip--loading .nsarmoire-import-panel__chip-mark {
  background: var(--ns-color-cyan);
}

.nsarmoire-import-panel__chip--success .nsarmoire-import-panel__chip-mark {
  background: var(--ns-color-success);
}

.nsarmoire-import-panel__chip--warning .nsarmoire-import-panel__chip-mark {
  background: var(--ns-color-warning);
}

.nsarmoire-import-panel__chip--danger .nsarmoire-import-panel__chip-mark {
  background: var(--ns-color-danger);
}

.nsarmoire-import-panel__actions {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.nsarmoire-import-panel__summary {
  display: grid;
  min-width: 0;
  gap: 4px;
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
}

.nsarmoire-import-panel__summary-line {
  display: flex;
  min-width: 0;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 18px;
}

.nsarmoire-import-panel__summary-line > span {
  min-width: 0;
}

.nsarmoire-import-panel__summary b {
  color: var(--ns-color-text-muted);
  font-weight: 850;
}

.nsarmoire-import-panel__summary strong,
.nsarmoire-import-panel__summary-line span span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-import-panel__summary strong {
  color: var(--ns-color-text);
  font-weight: 950;
}

.nsarmoire-import-panel--hero .nsarmoire-import-panel__actions {
  justify-content: flex-start;
}

.nsarmoire-import-panel__actions :deep(.ns-button),
.nsarmoire-import-panel__actions .ns-button {
  flex: 0 1 auto;
  min-width: 0;
  justify-content: center;
  padding: 6px 10px;
  white-space: nowrap;
}

.nsarmoire-import-panel--compact .nsarmoire-import-panel__actions :deep(.ns-button),
.nsarmoire-import-panel--compact .nsarmoire-import-panel__actions .ns-button {
  padding: 5px 8px;
  font-size: 12px;
}

.nsarmoire-import-panel__helper-error {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--ns-color-danger);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-snapshot-meta {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 4px 10px;
  margin: 0;
  font-size: 11px;
}

.nsarmoire-snapshot-meta div {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 4px;
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

@media (max-width: 1280px) {
  .nsarmoire-import-panel--compact {
    grid-template-columns: minmax(0, 1fr);
  }

  .nsarmoire-import-panel--compact .nsarmoire-import-panel__actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .nsarmoire-import-panel {
    grid-template-columns: 1fr;
  }

  .nsarmoire-import-panel--hero {
    min-height: 220px;
    padding: 20px;
  }

  .nsarmoire-import-panel__actions {
    justify-content: stretch;
  }

  .nsarmoire-import-panel__summary {
    gap: 3px;
  }

  .nsarmoire-import-panel__actions :deep(.ns-button),
  .nsarmoire-import-panel__actions .ns-button {
    flex: 1 1 160px;
    white-space: normal;
  }
}

@media (max-width: 640px) {
  .nsarmoire-import-panel__status-row {
    grid-column: 1 / -1;
  }

  .nsarmoire-snapshot-meta div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
