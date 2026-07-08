<template>
  <section
    class="nsarmoire-panel nsarmoire-import-panel"
    :class="`nsarmoire-import-panel--${mode}`"
  >
    <div v-if="mode === 'hero'" class="nsarmoire-panel__header">
      <h2 class="ns-heading-bloom">{{ cleanT(textKeys.nsarmoireImport) }}</h2>
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

      <span class="nsarmoire-import-panel__summary-line nsarmoire-import-panel__summary-line--progress">
        <span
          class="nsarmoire-import-panel__progress-item"
          :class="{ 'nsarmoire-import-panel__progress-item--incomplete': !isCoreStorageComplete }"
        >
          <b>{{ cleanT(textKeys.nsarmoireBasicStorageProgress) }}：</b>
          <strong>{{ coreStorageProgressLabel }}</strong>
        </span>
        <span
          class="nsarmoire-import-panel__progress-item"
          :class="{ 'nsarmoire-import-panel__progress-item--incomplete': !isRetainerReadComplete }"
        >
          <b>{{ cleanT(textKeys.nsarmoireRetainerProgress) }}：</b>
          <strong>{{ retainerProgressLabel }}</strong>
        </span>
      </span>
    </div>

    <div
      v-if="shouldRenderStatusRow"
      class="nsarmoire-import-panel__status-row"
      :class="{
        'nsarmoire-import-panel__status-row--reserved': !shouldShowStatusRow
      }"
    >
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
      <a
        class="nsarmoire-import-panel__download-helper"
        :href="HELPER_RELEASE_URL"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="cleanT(textKeys.nsarmoireDownloadHelper)"
        :title="cleanT(textKeys.nsarmoireDownloadHelper)"
      >
        <span>{{ cleanT(textKeys.nsarmoireDownloadHelperShort) }}</span>
        <span class="nsarmoire-import-panel__download-helper-icon" aria-hidden="true"></span>
      </a>

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
import { computed } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import type { ArmoireContainerKind, ArmoireSnapshot } from '@/lib/armoire/types'
import githubIcon from '@/assets/icons/pixelarticons/github.svg'
import type {
  ArmoireHelperHealth,
  ArmoireHelperProbe
} from '@/pages/armoire/services/nsarmoireHelperApi'
import { NSARMOIRE_BUTLER_RELEASE_URL } from '@/pages/armoire/services/nsarmoireHelperApi'

const props = defineProps<{
  mode: 'hero' | 'compact'
  snapshot: ArmoireSnapshot | null
  errorKey: string | null
  errorDetail: string | null
  helperStatusTone: 'info' | 'success' | 'warning' | 'danger' | 'loading'
  helperStatusTitleKey: string
  helperStatusMessageKey: string
  helperErrorDetail: string | null
  helperEndpoint: string
  helperHealth: ArmoireHelperHealth | null
  helperProbe: ArmoireHelperProbe | null
  helperBusy: boolean
}>()

const { current, t } = useLocale()
const HELPER_RELEASE_URL = NSARMOIRE_BUTLER_RELEASE_URL
const HELPER_DOWNLOAD_ICON_MASK = `url("${githubIcon}")`

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}
const CORE_CONTAINER_DISPLAY_ORDER: ArmoireContainerKind[] = [
  'armoury',
  'inventory',
  'saddlebag',
  'armoire',
  'glamourDresser'
]

interface ReadStatusItem {
  key: string
  label: string
  name?: string
  read: boolean
  statusLabel: string
}

function cleanText(value: string): string {
  return value
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

  return props.errorDetail
    ? `${cleanT(props.errorKey)}: ${props.errorDetail}`
    : cleanT(props.errorKey)
})
const helperStatusMessage = computed(() =>
  props.helperErrorDetail
    ? `${cleanT(props.helperStatusMessageKey)}: ${props.helperErrorDetail}`
    : cleanT(props.helperStatusMessageKey)
)
const shouldShowCompactHelperStatus = computed(
  () =>
    props.helperBusy ||
    Boolean(props.helperErrorDetail) ||
    ['warning', 'danger'].includes(props.helperStatusTone)
)
const shouldRenderStatusRow = computed(() => props.mode === 'hero' || props.mode === 'compact')
const shouldShowStatusRow = computed(
  () => props.mode === 'hero' || !props.snapshot || shouldShowCompactHelperStatus.value
)
const helperCatalogLabel = computed(() => {
  if (!props.helperHealth?.catalogLocated) {
    return cleanT(textKeys.nsarmoireHelperCatalogMissing)
  }

  return cleanText(
    formatPanelText(textKeys.nsarmoireHelperCatalogReady, {
      count: props.helperHealth.catalogCabinetEntryCount ?? 0
    })
  )
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
const readStatusLabels = computed(() => ({
  read: cleanT(textKeys.nsarmoireReadStatusRead),
  unread: cleanT(textKeys.nsarmoireReadStatusUnread)
}))
const readContainersFromSnapshot = computed(() => {
  const containers = new Set<ArmoireContainerKind>()

  for (const item of props.snapshot?.items ?? []) {
    if (containerLabelKeys[item.container]) {
      containers.add(item.container)
    }
  }

  return containers
})
const containerReadItems = computed<ReadStatusItem[]>(() => {
  const probeContainers = props.helperProbe?.containers ?? []
  const hasProbeContainers = probeContainers.length > 0
  const normalizedProbeKeys = new Set(
    probeContainers
      .filter((container) => container.loaded)
      .flatMap((container) => [container.key, container.container, container.containerName ?? ''])
      .map((value) => value.toLowerCase())
  )

  return CORE_CONTAINER_DISPLAY_ORDER.map((container) => {
    const probeRead = isCoreContainerReadFromProbe(container, normalizedProbeKeys)
    const snapshotRead = readContainersFromSnapshot.value.has(container)
    const read = hasProbeContainers ? probeRead || snapshotRead : snapshotRead

    return {
      key: container,
      label: cleanT(containerLabelKeys[container]),
      read,
      statusLabel: read ? readStatusLabels.value.read : readStatusLabels.value.unread
    }
  })
})
const cachedRetainerNamesFromSnapshot = computed(() => {
  const names: string[] = []

  for (const item of props.snapshot?.items ?? []) {
    if (item.container !== 'retainer') {
      continue
    }

    const retainerName = item.retainerName?.trim()
    if (retainerName && !names.includes(retainerName)) {
      names.push(retainerName)
    }
  }

  return names
})
const retainerReadItems = computed<ReadStatusItem[]>(() => {
  const probeRetainers = props.helperProbe?.retainers
    .filter((retainer) => retainer.available)
    .sort((a, b) => a.slot - b.slot)

  if (probeRetainers?.length) {
    return probeRetainers.map((retainer, index) => {
      const read = retainer.inventoryCached

      return {
        key: String(retainer.retainerId || retainer.slot || index),
        label: formatPanelText(textKeys.nsarmoireRetainerIndex, { index: index + 1 }),
        name: retainer.name,
        read,
        statusLabel: read ? readStatusLabels.value.read : readStatusLabels.value.unread
      }
    })
  }

  return cachedRetainerNamesFromSnapshot.value.map((name, index) => ({
    key: `${index}-${name}`,
    label: formatPanelText(textKeys.nsarmoireRetainerIndex, { index: index + 1 }),
    name,
    read: true,
    statusLabel: readStatusLabels.value.read
  }))
})
const coreStorageTotal = computed(() => CORE_CONTAINER_DISPLAY_ORDER.length)
const coreStorageReadCount = computed(
  () => containerReadItems.value.filter((item) => item.read).length
)
const coreStorageProgressLabel = computed(
  () => `${coreStorageReadCount.value}/${coreStorageTotal.value}`
)
const isCoreStorageComplete = computed(
  () => coreStorageReadCount.value >= coreStorageTotal.value && coreStorageTotal.value > 0
)
const retainerReadCount = computed(() => retainerReadItems.value.filter((item) => item.read).length)
const retainerTotalCount = computed(() => retainerReadItems.value.length)
const retainerProgressLabel = computed(() => `${retainerReadCount.value}/${retainerTotalCount.value}`)
const isRetainerReadComplete = computed(
  () => retainerReadCount.value >= retainerTotalCount.value
)

function isCoreContainerReadFromProbe(
  container: ArmoireContainerKind,
  normalizedProbeKeys: ReadonlySet<string>
): boolean {
  if (container === 'armoire') {
    return props.helperProbe?.cabinet?.loaded === true || readContainersFromSnapshot.value.has('armoire')
  }

  if (container === 'glamourDresser') {
    return props.helperProbe?.dresserLoaded === true || readContainersFromSnapshot.value.has('glamourDresser')
  }

  const aliases: Record<ArmoireContainerKind, readonly string[]> = {
    inventory: ['inventory', 'bag', 'backpack', 'inventry'],
    saddlebag: ['saddlebag', 'chocobo'],
    retainer: ['retainer'],
    armoury: ['armoury', 'armory'],
    glamourDresser: ['glamourdresser', 'dresser'],
    armoire: ['armoire', 'cabinet'],
    manual: ['manual']
  }
  const keys = Array.from(normalizedProbeKeys)

  return aliases[container].some((alias) => keys.some((key) => key.includes(alias)))
}
const compactSummaryAriaLabel = computed(() =>
  [
    `${cleanT(textKeys.nsarmoireCharacter)}: ${characterLabel.value}`,
    `${cleanT(textKeys.nsarmoireGeneratedAt)}: ${generatedAtLabel.value}`,
    `${cleanT(textKeys.nsarmoireReadContainers)}: ${containerReadItems.value
      .map((item) => `${item.label} ${item.statusLabel}`)
      .join(' / ')}`,
    `${cleanT(textKeys.nsarmoireBasicStorageProgress)}: ${coreStorageProgressLabel.value}`,
    `${cleanT(textKeys.nsarmoireRetainerProgress)}: ${retainerProgressLabel.value}`
  ].join('；')
)

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
  min-height: 228px;
  grid-template-columns: 1fr;
  align-content: center;
  justify-items: start;
  gap: 14px;
  padding: 28px;
  background: var(--ns-color-surface);
}

.nsarmoire-import-panel--compact {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: minmax(30px, auto) auto;
  gap: 8px 12px;
  min-height: 104px;
  padding: 12px 14px;
  align-items: start;
  background: var(--ns-color-surface);
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
  font-size: 20px;
}

.nsarmoire-import-panel__error {
  grid-column: 1 / -1;
  min-width: 0;
}

.nsarmoire-import-panel__status-row {
  display: flex;
  min-width: 0;
  min-height: 30px;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.nsarmoire-import-panel--compact .nsarmoire-import-panel__status-row {
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
}

.nsarmoire-import-panel--compact .nsarmoire-import-panel__status-row--reserved {
  visibility: hidden;
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

.nsarmoire-import-panel__download-helper {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 12px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: var(--ns-radius-pill);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 850;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: var(--ns-pixel-soft-shadow);
  transition:
    transform var(--ns-transition-fast),
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.nsarmoire-import-panel__download-helper:hover,
.nsarmoire-import-panel__download-helper:focus-visible {
  transform: translate(-1px, -1px);
  border-color: var(--ns-pixel-border-accent);
  background: var(--ns-color-cyan-soft);
  outline: none;
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.nsarmoire-import-panel__download-helper:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(42, 33, 56, 0.16);
}

.nsarmoire-import-panel__download-helper-icon {
  display: block;
  width: 16px;
  height: 16px;
  background: currentColor;
  mask: v-bind('HELPER_DOWNLOAD_ICON_MASK') center / contain no-repeat;
  -webkit-mask: v-bind('HELPER_DOWNLOAD_ICON_MASK') center / contain no-repeat;
}

.nsarmoire-import-panel__summary {
  display: grid;
  min-width: 0;
  gap: 8px;
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.nsarmoire-import-panel--compact .nsarmoire-import-panel__summary {
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
}

.nsarmoire-import-panel__summary-line {
  display: flex;
  min-width: 0;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 20px;
}

.nsarmoire-import-panel__summary-line--progress {
  gap: 8px 16px;
}

.nsarmoire-import-panel__summary-line > span {
  min-width: 0;
}

.nsarmoire-import-panel__summary b {
  color: var(--ns-color-text-muted);
  font-size: 13px;
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

.nsarmoire-import-panel__progress-item {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  color: var(--ns-color-text);
  font-size: 14px;
  line-height: 1.2;
}

.nsarmoire-import-panel__progress-item::before {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border: 1px solid var(--ns-status-success-border);
  background: var(--ns-color-success);
  content: '';
}

.nsarmoire-import-panel__progress-item--incomplete::before {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-color-warning);
}

.nsarmoire-import-panel--hero .nsarmoire-import-panel__actions {
  justify-content: flex-start;
}

.nsarmoire-import-panel--hero .nsarmoire-import-panel__actions :deep(.ns-button),
.nsarmoire-import-panel--hero .nsarmoire-import-panel__actions .ns-button {
  min-height: 38px;
}

.nsarmoire-import-panel--compact .nsarmoire-import-panel__actions {
  grid-column: 2;
  grid-row: 2;
  align-self: end;
  justify-self: end;
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
    grid-template-rows: auto minmax(30px, auto) auto;
  }

  .nsarmoire-import-panel--compact .nsarmoire-import-panel__summary,
  .nsarmoire-import-panel--compact .nsarmoire-import-panel__status-row,
  .nsarmoire-import-panel--compact .nsarmoire-import-panel__actions {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .nsarmoire-import-panel--compact .nsarmoire-import-panel__status-row {
    justify-self: start;
  }

  .nsarmoire-import-panel--compact .nsarmoire-import-panel__actions {
    justify-self: stretch;
  }
}

@media (max-width: 760px) {
  .nsarmoire-import-panel {
    grid-template-columns: 1fr;
  }

  .nsarmoire-import-panel--hero {
    min-height: 0;
    padding: 20px;
  }

  .nsarmoire-import-panel__actions {
    justify-content: stretch;
  }

  .nsarmoire-import-panel__summary {
    gap: 3px;
  }

  .nsarmoire-import-panel__download-helper,
  .nsarmoire-import-panel__actions :deep(.ns-button),
  .nsarmoire-import-panel__actions .ns-button {
    flex: 1 1 0;
    min-width: 0;
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
