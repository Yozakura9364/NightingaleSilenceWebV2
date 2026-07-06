<template>
  <section class="nsarmoire-workspace">
    <div
      class="nsarmoire-workspace__body"
      :class="{
        'nsarmoire-workspace__body--empty': !snapshot
      }"
    >
      <div class="nsarmoire-workspace__shell">
        <NSArmoireSectionRail
          v-model:active-section="activeSection"
          class="nsarmoire-workspace__rail"
          :items="sectionItems"
        />

        <div class="nsarmoire-workspace__content">
          <NSArmoireImportPanel
            class="nsarmoire-workspace__import"
            :mode="snapshot ? 'compact' : 'hero'"
            :snapshot="snapshot"
            :error-key="errorKey"
            :error-detail="errorDetail"
            :imported-file-name="importedFileName"
            :helper-status-tone="helperTone"
            :helper-status-title-key="helperTitleKey"
            :helper-status-message-key="helperMessageKey"
            :helper-error-detail="helperDetail"
            :helper-endpoint="helperEndpoint"
            :helper-health="helperHealth"
            :helper-busy="helperBusy"
            :helper-can-refresh="helperCanRefresh"
            :helper-can-shutdown="helperCanShutdown"
            @import-file="importSnapshotFile"
            @load-example="loadExampleSnapshot"
            @connect-helper="connectHelper"
            @refresh-helper="refreshHelper"
            @shutdown-helper="shutdownHelper"
            @clear="clearSnapshot"
          />

          <div v-if="snapshot" class="nsarmoire-workspace__main">
            <section
              v-show="activeSection === 'cleanup'"
              class="nsarmoire-workspace__section"
              aria-labelledby="nsarmoire-cleanup-heading"
            >
              <div class="nsarmoire-workspace__section-header">
                <h2 id="nsarmoire-cleanup-heading">
                  {{ t(textKeys.nsarmoireSectionCleanup) }}
                </h2>
              </div>

              <NSArmoireInsightPanel
                :analysis="analysis"
                :catalog="catalog"
                :snapshot="snapshot"
                :selected-dye-value-categories="selectedDyeValueCategories"
                :has-pending-catalog-checks="hasPendingCatalogChecks"
                @toggle-dye-value-category="toggleDyeValueCategory"
              />

              <NSArmoireOverview
                :analysis="analysis?.basic ?? null"
                :title-key="textKeys.nsarmoireSectionStorage"
              />
            </section>

            <section
              v-if="shouldRenderCollectionSection"
              v-show="activeSection === 'collection'"
              class="nsarmoire-workspace__section nsarmoire-workspace__section--reference"
              aria-labelledby="nsarmoire-collection-heading"
            >
              <div
                class="nsarmoire-workspace__section-header nsarmoire-workspace__section-header--tabs"
              >
                <h2 id="nsarmoire-collection-heading">
                  {{ t(textKeys.nsarmoireSectionCollection) }}
                </h2>

                <AppTabs
                  v-model="activeDetailTab"
                  class="nsarmoire-workspace__reference-tabs"
                  :items="detailTabs"
                  :aria-label="t(textKeys.nsarmoireSectionCollection)"
                  id-prefix="nsarmoire-reference-tab"
                  density="compact"
                  stretch
                />
              </div>

              <div v-if="!isCollectionLoading" class="nsarmoire-workspace__reference-body">
                <NSArmoireStorePanel
                  v-if="activeDetailTab === 'store'"
                  :armoire-catalog="catalog"
                  :error="storeCatalogError"
                  :snapshot="snapshot"
                  :status="storeCatalogStatus"
                  :store-catalog="storeCatalog"
                  :store-item-display-index="storeItemDisplayIndex"
                  @reload="reloadStoreCatalog"
                />
                <NSArmoireCabinetStatsPanel
                  v-else-if="activeDetailTab === 'cabinet'"
                  :analysis="cabinetAnalysis"
                  :catalog="cabinetCatalog"
                />
                <NSArmoireGlamourSetStatsPanel
                  v-else-if="activeDetailTab === 'sets'"
                  :analysis="analysis"
                  :catalog="catalog"
                />
                <NSArmoireCatalogPanel
                  v-else
                  :analysis="analysis"
                  :catalog="catalog"
                  :snapshot="snapshot"
                />
              </div>
            </section>

            <NSArmoireCharacterPanel
              v-if="activeSection === 'characters'"
              :snapshot="snapshot"
              :profiles="characterProfiles"
              :active-profile-key="activeProfileKey"
              :helper-endpoint="helperEndpoint"
              :helper-health="helperHealth"
              :catalog="catalog"
              :catalog-status="catalogStatus"
              :catalog-error="catalogError"
              @reload-catalog="reloadCatalog"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isCollectionLoading"
      class="nsarmoire-workspace__loading-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="nsarmoire-workspace__loading-card">
        <span class="nsarmoire-workspace__loading-pixels" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>{{ t(textKeys.nsarmoireCollectionLoading) }}</span>
      </div>
    </div>

    <NSArmoireProcessDialog
      v-if="helperProcessPickerOpen"
      :processes="helperProcesses"
      :busy="helperProcessBusy"
      :error="helperProcessError"
      @close="closeHelperProcessPicker"
      @refresh="loadHelperProcesses"
      @select="selectHelperProcess"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import { textKeys } from '@/config/site'
import { analyzeArmoireSnapshot } from '@/lib/armoire/analyzeSnapshot'
import { mergeArmoireCatalogs } from '@/lib/armoire/catalog'
import NSArmoireCabinetStatsPanel from '@/pages/armoire/components/NSArmoireCabinetStatsPanel.vue'
import NSArmoireCatalogPanel from '@/pages/armoire/components/NSArmoireCatalogPanel.vue'
import NSArmoireCharacterPanel from '@/pages/armoire/components/NSArmoireCharacterPanel.vue'
import NSArmoireGlamourSetStatsPanel from '@/pages/armoire/components/NSArmoireGlamourSetStatsPanel.vue'
import type { ArmoireCatalogStatus } from '@/pages/armoire/composables/useArmoireCatalog'
import { useArmoireAnalysis } from '@/pages/armoire/composables/useArmoireAnalysis'
import { useArmoireCabinetCatalog } from '@/pages/armoire/composables/useArmoireCabinetCatalog'
import { useArmoireCabinetItemChunks } from '@/pages/armoire/composables/useArmoireCabinetItemChunks'
import { useArmoireCharacterProfiles } from '@/pages/armoire/composables/useArmoireCharacterProfiles'
import { useArmoireDyeCatalog } from '@/pages/armoire/composables/useArmoireDyeCatalog'
import { useArmoireDyePreferences } from '@/pages/armoire/composables/useArmoireDyePreferences'
import { useArmoireGlamourSetCatalog } from '@/pages/armoire/composables/useArmoireGlamourSetCatalog'
import { useArmoireGlamourSetChunks } from '@/pages/armoire/composables/useArmoireGlamourSetChunks'
import { useArmoireHelper } from '@/pages/armoire/composables/useArmoireHelper'
import { useArmoireIdenticalModelCatalog } from '@/pages/armoire/composables/useArmoireIdenticalModelCatalog'
import { useArmoireItemDisplayChunks } from '@/pages/armoire/composables/useArmoireItemDisplayChunks'
import { useArmoireStoreCatalog } from '@/pages/armoire/composables/useArmoireStoreCatalog'
import { useArmoireStoreItemDisplayIndex } from '@/pages/armoire/composables/useArmoireStoreItemDisplayIndex'
import { useArmoireSnapshot } from '@/pages/armoire/composables/useArmoireSnapshot'
import NSArmoireInsightPanel from '@/pages/armoire/components/NSArmoireInsightPanel.vue'
import NSArmoireImportPanel from '@/pages/armoire/components/NSArmoireImportPanel.vue'
import NSArmoireOverview from '@/pages/armoire/components/NSArmoireOverview.vue'
import NSArmoireProcessDialog from '@/pages/armoire/components/NSArmoireProcessDialog.vue'
import NSArmoireSectionRail from '@/pages/armoire/components/NSArmoireSectionRail.vue'
import NSArmoireStorePanel from '@/pages/armoire/components/NSArmoireStorePanel.vue'
import { useLocale } from '@/stores/locale'

type ArmoireWorkspaceSection = 'cleanup' | 'collection' | 'characters'
type ArmoireCollectionDetailTab = 'store' | 'cabinet' | 'sets' | 'catalog'

const { t } = useLocale()
const activeSection = ref<ArmoireWorkspaceSection>('cleanup')
const activeDetailTab = ref<ArmoireCollectionDetailTab>('store')
const mountedCollectionSection = ref(false)
const isCollectionLoading = ref(false)
let collectionLoadFrame = 0
let collectionLoadTimer = 0
const COLLECTION_LOADING_MIN_MS = 420
const sectionItems = computed(() => [
  {
    id: 'cleanup',
    labelKey: textKeys.nsarmoireSectionCleanup,
    shortLabelKey: textKeys.nsarmoireSectionCleanupShort
  },
  {
    id: 'collection',
    labelKey: textKeys.nsarmoireSectionCollection,
    shortLabelKey: textKeys.nsarmoireSectionCollectionShort
  },
  {
    id: 'characters',
    labelKey: textKeys.nsarmoireSectionCharacters,
    shortLabelKey: textKeys.nsarmoireSectionCharactersShort
  }
])
const detailTabs = computed(() => [
  {
    value: 'store',
    label: t(textKeys.nsarmoireCollectionStoreStats)
  },
  {
    value: 'cabinet',
    label: t(textKeys.nsarmoireCollectionCabinetStats)
  },
  {
    value: 'sets',
    label: t(textKeys.nsarmoireCollectionGlamourSetStats)
  },
  {
    value: 'catalog',
    label: t(textKeys.nsarmoireCollectionCatalog)
  }
])

const {
  snapshot,
  errorKey,
  errorDetail,
  importedFileName,
  importSnapshotPayload,
  importSnapshotFile,
  loadExampleSnapshot,
  clearSnapshot
} = useArmoireSnapshot()
const { profiles: characterProfiles, activeProfileKey } = useArmoireCharacterProfiles(snapshot)

const {
  catalog: itemDisplayCatalog,
  status: itemDisplayChunkStatus,
  error: itemDisplayChunkError,
  loadItemDisplayChunksForItemIds
} = useArmoireItemDisplayChunks()
const {
  catalog: cabinetItemChunkCatalog,
  status: cabinetItemChunkStatus,
  error: cabinetItemChunkError,
  loadCabinetItemChunksForItemIds
} = useArmoireCabinetItemChunks()
const {
  catalog: cabinetCatalog,
  status: cabinetCatalogStatus,
  error: cabinetCatalogError,
  loadCabinetCatalog
} = useArmoireCabinetCatalog()
const {
  catalog: glamourSetCatalog,
  status: glamourSetCatalogStatus,
  error: glamourSetCatalogError,
  loadGlamourSetCatalog
} = useArmoireGlamourSetCatalog()
const {
  catalog: glamourSetChunkCatalog,
  status: glamourSetChunkStatus,
  error: glamourSetChunkError,
  loadGlamourSetChunksForItemIds
} = useArmoireGlamourSetChunks()
const {
  catalog: identicalModelCatalog,
  status: identicalModelCatalogStatus,
  error: identicalModelCatalogError,
  loadIdenticalModelCatalog
} = useArmoireIdenticalModelCatalog()
const {
  catalog: dyeCatalog,
  status: dyeCatalogStatus,
  error: dyeCatalogError,
  loadDyeCatalog
} = useArmoireDyeCatalog()
const {
  storeCatalog,
  status: storeCatalogStatus,
  error: storeCatalogError,
  loadStoreCatalog
} = useArmoireStoreCatalog()
const { storeItemDisplayIndex, loadStoreItemDisplayIndex } = useArmoireStoreItemDisplayIndex()
const catalog = computed(() =>
  mergeArmoireCatalogs(
    itemDisplayCatalog.value,
    cabinetItemChunkCatalog.value,
    cabinetCatalog.value,
    glamourSetChunkCatalog.value,
    glamourSetCatalog.value,
    identicalModelCatalog.value,
    dyeCatalog.value
  )
)

const { selectedDyeValueCategories, toggleDyeValueCategory } = useArmoireDyePreferences()
const shouldFilterSnapshotToItemDisplayCatalog = computed(
  () => itemDisplayChunkStatus.value === 'ready'
)
const { analysis, hasPendingCatalogChecks } = useArmoireAnalysis(
  snapshot,
  catalog,
  selectedDyeValueCategories,
  shouldFilterSnapshotToItemDisplayCatalog
)
const cabinetAnalysis = computed(() =>
  snapshot.value
    ? analyzeArmoireSnapshot(snapshot.value, cabinetCatalog.value, {
        valuableDyeCategories: selectedDyeValueCategories.value,
        filterToCatalogItems: true
      })
    : null
)
const {
  busy: helperBusy,
  detail: helperDetail,
  endpoint: helperEndpoint,
  health: helperHealth,
  titleKey: helperTitleKey,
  messageKey: helperMessageKey,
  tone: helperTone,
  canRefresh: helperCanRefresh,
  canShutdown: helperCanShutdown,
  connectHelper,
  refreshHelper,
  shutdownHelper,
  processes: helperProcesses,
  processPickerOpen: helperProcessPickerOpen,
  processBusy: helperProcessBusy,
  processError: helperProcessError,
  loadProcesses: loadHelperProcesses,
  selectProcess: selectHelperProcess,
  closeProcessPicker: closeHelperProcessPicker
} = useArmoireHelper(importSnapshotPayload)

const shouldRenderCollectionSection = computed(
  () => activeSection.value === 'collection' || mountedCollectionSection.value
)
const catalogStatus = computed<ArmoireCatalogStatus>(() => {
  const statuses = [
    itemDisplayChunkStatus.value,
    cabinetItemChunkStatus.value,
    cabinetCatalogStatus.value,
    glamourSetChunkStatus.value,
    glamourSetCatalogStatus.value,
    identicalModelCatalogStatus.value,
    dyeCatalogStatus.value
  ]

  if (statuses.includes('loading')) {
    return 'loading'
  }

  if (statuses.includes('error')) {
    return 'error'
  }

  if (statuses.includes('ready')) {
    return 'ready'
  }

  return 'idle'
})
const catalogError = computed(
  () =>
    [
      itemDisplayChunkError.value,
      cabinetItemChunkError.value,
      cabinetCatalogError.value,
      glamourSetChunkError.value,
      glamourSetCatalogError.value,
      identicalModelCatalogError.value,
      dyeCatalogError.value
    ]
      .filter(Boolean)
      .join(' / ') || null
)

function cancelCollectionLoadFrame(): void {
  if (typeof window === 'undefined') {
    collectionLoadFrame = 0
    collectionLoadTimer = 0
    return
  }

  if (collectionLoadFrame !== 0) {
    window.cancelAnimationFrame(collectionLoadFrame)
    collectionLoadFrame = 0
  }

  if (collectionLoadTimer !== 0) {
    window.clearTimeout(collectionLoadTimer)
    collectionLoadTimer = 0
  }
}

function queueCollectionSectionMount(): void {
  isCollectionLoading.value = true

  if (typeof window === 'undefined') {
    mountedCollectionSection.value = true
    isCollectionLoading.value = false
    return
  }

  cancelCollectionLoadFrame()
  collectionLoadFrame = window.requestAnimationFrame(() => {
    collectionLoadFrame = window.requestAnimationFrame(() => {
      collectionLoadTimer = window.setTimeout(() => {
        mountedCollectionSection.value = true
        isCollectionLoading.value = false
        collectionLoadTimer = 0
      }, COLLECTION_LOADING_MIN_MS)
      collectionLoadFrame = 0
    })
  })
}

function shouldLoadCabinetCatalogForCurrentView(): boolean {
  return Boolean(
    snapshot.value &&
    activeSection.value === 'collection' &&
    ['cabinet', 'catalog'].includes(activeDetailTab.value)
  )
}

function shouldLoadCleanupItemChunksForCurrentView(): boolean {
  return Boolean(snapshot.value && activeSection.value === 'cleanup')
}

function getSnapshotItemIds(): number[] {
  return snapshot.value?.items.map((item) => item.itemId) ?? []
}

function loadSnapshotItemChunks(options: { force?: boolean } = {}): void {
  const itemIds = getSnapshotItemIds()

  if (itemIds.length === 0) {
    return
  }

  void loadItemDisplayChunksForItemIds(itemIds, options)
}

function loadCleanupItemChunks(options: { force?: boolean } = {}): void {
  const itemIds = getSnapshotItemIds()

  if (itemIds.length === 0) {
    return
  }

  void loadCabinetItemChunksForItemIds(itemIds, options)
  void loadGlamourSetChunksForItemIds(itemIds, options)
}

function shouldLoadItemDisplayChunksForCurrentView(): boolean {
  return Boolean(
    snapshot.value &&
    (activeSection.value === 'cleanup' ||
      (activeSection.value === 'collection' && activeDetailTab.value === 'catalog'))
  )
}

function shouldLoadGlamourSetCatalogForCurrentView(): boolean {
  return Boolean(
    snapshot.value && activeSection.value === 'collection' && activeDetailTab.value === 'sets'
  )
}

function shouldLoadIdenticalModelCatalogForCurrentView(): boolean {
  return Boolean(
    snapshot.value && activeSection.value === 'collection' && activeDetailTab.value === 'catalog'
  )
}

function shouldLoadDyeCatalogForCurrentView(): boolean {
  return Boolean(
    snapshot.value &&
    (activeSection.value === 'cleanup' ||
      (activeSection.value === 'collection' && activeDetailTab.value === 'catalog'))
  )
}

function shouldLoadStoreCatalogForCurrentView(): boolean {
  return Boolean(
    snapshot.value && activeSection.value === 'collection' && activeDetailTab.value === 'store'
  )
}

function loadCatalogsForCurrentView(): void {
  if (shouldLoadCabinetCatalogForCurrentView()) {
    void loadCabinetCatalog()
  }

  if (shouldLoadCleanupItemChunksForCurrentView()) {
    loadCleanupItemChunks()
  }

  if (shouldLoadItemDisplayChunksForCurrentView()) {
    loadSnapshotItemChunks()
  }

  if (shouldLoadGlamourSetCatalogForCurrentView()) {
    void loadGlamourSetCatalog()
  }

  if (shouldLoadIdenticalModelCatalogForCurrentView()) {
    void loadIdenticalModelCatalog()
  }

  if (shouldLoadDyeCatalogForCurrentView()) {
    void loadDyeCatalog()
  }

  if (shouldLoadStoreCatalogForCurrentView()) {
    void loadStoreCatalog()
    void loadStoreItemDisplayIndex()
  }
}

function reloadCatalog(): void {
  loadSnapshotItemChunks({ force: true })
  loadCleanupItemChunks({ force: true })
  void loadCabinetCatalog({ force: true })
  void loadGlamourSetCatalog({ force: true })
  void loadIdenticalModelCatalog({ force: true })
  void loadDyeCatalog({ force: true })
}

function reloadStoreCatalog(): void {
  void loadStoreCatalog({ force: true })
  void loadStoreItemDisplayIndex({ force: true })
}

watch(
  activeSection,
  (section) => {
    if (section === 'collection') {
      queueCollectionSectionMount()
      return
    }

    cancelCollectionLoadFrame()
    isCollectionLoading.value = false
    loadCatalogsForCurrentView()
  },
  { flush: 'pre' }
)

watch(
  [snapshot, activeSection, activeDetailTab],
  () => {
    loadCatalogsForCurrentView()
  },
  { flush: 'post', immediate: true }
)

onBeforeUnmount(() => {
  cancelCollectionLoadFrame()
})
</script>

<style scoped>
.nsarmoire-workspace {
  --ns-font-decorative: var(--ns-font-sans);
  --ns-font-mono: var(--ns-font-sans);

  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--ns-color-bg-soft);
  background: #ffffff;
  font-family: var(--ns-font-sans);
  overflow: auto;
}

.nsarmoire-workspace__body {
  display: grid;
  width: 100%;
  min-width: 0;
  background: #ffffff;
}

.nsarmoire-workspace__shell {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: stretch;
  min-width: 0;
  min-height: calc(100vh - 58px);
}

.nsarmoire-workspace__content {
  display: grid;
  grid-template-rows: auto 1fr;
  align-content: start;
  gap: 12px;
  min-width: 0;
  padding: 20px;
}

.nsarmoire-workspace__body--empty .nsarmoire-workspace__content {
  grid-template-rows: 1fr;
  align-items: center;
  justify-items: center;
  min-height: calc(100vh - 58px);
}

.nsarmoire-workspace__import {
  min-width: 0;
  width: 100%;
}

.nsarmoire-workspace__import.nsarmoire-import-panel--compact {
  justify-self: start;
  width: min(820px, 100%);
}

.nsarmoire-workspace__body--empty .nsarmoire-workspace__import {
  width: min(760px, 100%);
}

.nsarmoire-workspace__main {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
}

.nsarmoire-workspace__section {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
}

.nsarmoire-workspace__section-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-workspace__section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-workspace :deep(.ns-button),
.nsarmoire-workspace :deep(.app-tabs__tab),
.nsarmoire-workspace :deep(.app-status__title),
.nsarmoire-workspace :deep(h2),
.nsarmoire-workspace :deep(h3),
.nsarmoire-workspace :deep(strong),
.nsarmoire-workspace :deep(dt),
.nsarmoire-workspace :deep(dd) {
  font-family: var(--ns-font-sans);
  letter-spacing: 0;
}

.nsarmoire-workspace :deep(.ns-button),
.nsarmoire-workspace :deep(.app-tabs__tab),
.nsarmoire-workspace :deep(.app-status__title),
.nsarmoire-workspace :deep(h2),
.nsarmoire-workspace :deep(h3) {
  font-weight: 800;
}

.nsarmoire-workspace__section-header--tabs {
  align-items: stretch;
  flex-direction: column;
  justify-content: flex-start;
}

.nsarmoire-workspace__reference-tabs {
  width: 100%;
}

.nsarmoire-workspace__reference-body {
  display: grid;
  width: 100%;
  min-width: 0;
}

.nsarmoire-workspace__loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 12, 20, 0.52);
}

.nsarmoire-workspace__loading-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  max-width: min(360px, 100%);
  padding: 14px 18px;
  border: 2px solid var(--ns-pixel-border);
  background: #ffffff;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 850;
  box-shadow: 5px 5px 0 var(--ns-pixel-shadow);
}

.nsarmoire-workspace__loading-pixels {
  display: grid;
  grid-template-columns: repeat(2, 8px);
  grid-template-rows: repeat(2, 8px);
  gap: 3px;
}

.nsarmoire-workspace__loading-pixels span {
  display: block;
  width: 8px;
  height: 8px;
  background: var(--ns-color-accent);
  image-rendering: pixelated;
  animation: nsarmoire-loading-pixel 0.8s steps(1, end) infinite;
}

.nsarmoire-workspace__loading-pixels span:nth-child(2) {
  animation-delay: 0.1s;
}

.nsarmoire-workspace__loading-pixels span:nth-child(3) {
  animation-delay: 0.2s;
}

.nsarmoire-workspace__loading-pixels span:nth-child(4) {
  animation-delay: 0.3s;
}

@keyframes nsarmoire-loading-pixel {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}

.nsarmoire-workspace__content :deep(.nsarmoire-panel),
.nsarmoire-workspace__content :deep(.nsarmoire-action-card),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-item),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-item__related-item),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-list__item),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-list__icon),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-list__related li),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-list__related-icon),
.nsarmoire-workspace__content :deep(.nsarmoire-readable-list__related-more-count),
.nsarmoire-workspace__content :deep(.nsarmoire-summary-list),
.nsarmoire-workspace__content :deep(.nsarmoire-metric),
.nsarmoire-workspace__content :deep(.nsarmoire-distribution__row),
.nsarmoire-workspace__content :deep(.nsarmoire-catalog-card),
.nsarmoire-workspace__content :deep(.nsarmoire-catalog-card__icon),
.nsarmoire-workspace__content :deep(.nsarmoire-character-panel__block),
.nsarmoire-workspace__content :deep(.nsarmoire-character-panel__rows div),
.nsarmoire-workspace__content :deep(.nsarmoire-validation-case),
.nsarmoire-workspace__content :deep(.nsarmoire-validation-case__row),
.nsarmoire-workspace__content :deep(.nsarmoire-catalog-status__summary) {
  background: #ffffff;
}

.nsarmoire-workspace__content :deep(.nsarmoire-panel),
.nsarmoire-workspace__content :deep(.nsarmoire-action-card) {
  border-color: var(--ns-pixel-border);
  box-shadow: none;
}

@media (min-width: 981px) {
  .nsarmoire-workspace__content {
    grid-column: 2;
  }
}

@media (max-width: 980px) {
  .nsarmoire-workspace {
    overflow: visible;
  }

  .nsarmoire-workspace__body {
    grid-template-columns: 1fr;
  }

  .nsarmoire-workspace__shell {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .nsarmoire-workspace__content {
    padding: 8px;
  }

  .nsarmoire-workspace__body--empty .nsarmoire-workspace__content {
    align-items: start;
    min-height: 0;
  }

  .nsarmoire-workspace__section-header--tabs {
    align-items: stretch;
    flex-direction: column;
  }

  .nsarmoire-workspace__reference-tabs {
    width: 100%;
  }
}
</style>
