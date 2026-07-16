<template>
  <section class="nsarmoire-workspace">
    <div
      class="nsarmoire-workspace__body"
      :class="{
        'nsarmoire-workspace__body--empty': !snapshot && activeSection !== 'characters'
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
            :mode="snapshot || activeSection === 'characters' ? 'compact' : 'hero'"
            :snapshot="snapshot"
            :error-key="errorKey"
            :error-detail="errorDetail"
            :helper-status-tone="helperTone"
            :helper-status-title-key="helperTitleKey"
            :helper-status-message-key="helperMessageKey"
            :helper-error-detail="helperDetail"
            :helper-endpoint="helperEndpoint"
            :helper-health="helperHealth"
            :helper-probe="helperProbe"
            :helper-busy="helperBusy"
            :helper-can-select-process="helperCanSelectProcess"
            @select-process="openHelperProcessPicker"
          />

          <div v-if="snapshot || activeSection === 'characters'" class="nsarmoire-workspace__main">
            <section
              v-if="snapshot"
              v-show="activeSection === 'cleanup'"
              class="nsarmoire-workspace__section"
              aria-labelledby="nsarmoire-cleanup-heading"
            >
              <div class="nsarmoire-workspace__section-header">
                <h2 id="nsarmoire-cleanup-heading" class="ns-heading-bloom">
                  {{ t(textKeys.nsarmoireSectionCleanup) }}
                </h2>
              </div>

              <NSArmoireInsightPanel
                :analysis="cleanupAnalysis"
                :catalog="catalog"
                :snapshot="snapshot"
                :has-pending-catalog-checks="cleanupHasPendingCatalogChecks"
                :ignored-item-views="ignoredItemViews"
                @ignore-item="ignoreCleanupItem"
                @unignore-item="unignoreCleanupItem"
                @load-identical-model-catalog="loadIdenticalModelCatalogForCleanup"
              />
            </section>

            <section
              v-if="snapshot && shouldRenderCollectionSection"
              v-show="activeSection === 'collection'"
              class="nsarmoire-workspace__section nsarmoire-workspace__section--reference"
              aria-labelledby="nsarmoire-collection-heading"
            >
              <div
                class="nsarmoire-workspace__section-header nsarmoire-workspace__section-header--tabs"
              >
                <h2 id="nsarmoire-collection-heading" class="ns-heading-bloom">
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

              <div class="nsarmoire-workspace__reference-body">
                <NSArmoireStorePanel
                  v-if="activeDetailTab === 'store'"
                  :armoire-catalog="catalog"
                  :error="storeCatalogError"
                  :snapshot="snapshot"
                  :status="storeCatalogStatus"
                  :store-catalog="storeCatalog"
                  :store-item-display-index="storeItemDisplayIndex"
                  @ignore-item="ignoreCleanupItem"
                  @reload="reloadStoreCatalog"
                />
                <NSArmoireCabinetStatsPanel
                  v-else-if="activeDetailTab === 'cabinet'"
                  :analysis="cabinetAnalysis"
                  :catalog="catalog"
                  @ignore-item="ignoreCleanupItem"
                />
                <NSArmoireGlamourSetStatsPanel
                  v-else-if="activeDetailTab === 'sets'"
                  :analysis="analysis"
                  :catalog="catalog"
                  @ignore-item="ignoreCleanupItem"
                />
                <NSArmoireOverview
                  v-else
                  :analysis="analysis?.basic ?? null"
                  :catalog="catalog"
                  :snapshot="snapshot"
                  :title-key="textKeys.nsarmoireCollectionCatalog"
                  @ignore-item="ignoreCleanupItem"
                />
              </div>
            </section>

            <NSArmoireCharacterPanel
              v-if="activeSection === 'characters'"
              :snapshot="snapshot"
              :profiles="characterProfiles"
              :active-profile-key="activeProfileKey"
              :profile-action-status-key="profileActionStatusKey"
              :profile-storage-status="profileStorageStatus"
              :profile-storage-error="profileStorageError"
              :switching-profile-key="switchingProfileKey"
              :deleting-profile-key="deletingProfileKey"
              :helper-endpoint="helperEndpoint"
              :helper-health="helperHealth"
              :catalog="catalog"
              :catalog-status="catalogStatus"
              :catalog-error="catalogError"
              :selected-dye-value-categories="selectedDyeValueCategories"
              :selected-valuable-dye-ids="selectedValuableDyeIds"
              :ignored-item-views="ignoredItemViews"
              :ignored-item-storage-error="ignoredItemStorageError"
              @import-file="importSnapshotFile"
              @toggle-dye-value-category="toggleDyeValueCategory"
              @toggle-valuable-dye-id="toggleValuableDyeId"
              @unignore-item="unignoreCleanupItem"
              @clear-ignored-items="clearIgnoredItems"
              @switch-profile="switchCharacterProfile"
              @delete-profile="deleteCharacterProfile"
              @clear-current-profile="clearCurrentProfileData"
              @reload-catalog="reloadCatalog"
            />
          </div>
        </div>
      </div>
    </div>

    <AppLoading
      v-if="isWorkspaceLoadingOverlayVisible"
      class="nsarmoire-workspace__loading-overlay"
      overlay
      compact
      :message="t(workspaceLoadingMessageKey)"
      :aria-label="t(workspaceLoadingMessageKey)"
    />

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
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { armoireTextKeys as textKeys } from '@/locales/keys/armoire'
import { analyzeArmoireSnapshot } from '@/lib/armoire/analyzeSnapshot'
import { mergeArmoireCatalogs } from '@/lib/armoire/catalog'
import type { ArmoireCatalogStatus } from '@/pages/armoire/composables/useArmoireCatalog'
import { useArmoireAnalysis } from '@/pages/armoire/composables/useArmoireAnalysis'
import { useArmoireCabinetCatalog } from '@/pages/armoire/composables/useArmoireCabinetCatalog'
import { useArmoireCabinetItemChunks } from '@/pages/armoire/composables/useArmoireCabinetItemChunks'
import { useArmoireCharacterProfiles } from '@/pages/armoire/composables/useArmoireCharacterProfiles'
import { useArmoireCrafterGathererReplicaCatalog } from '@/pages/armoire/composables/useArmoireCrafterGathererReplicaCatalog'
import { useArmoireDyeCatalog } from '@/pages/armoire/composables/useArmoireDyeCatalog'
import { useArmoireDyePreferences } from '@/pages/armoire/composables/useArmoireDyePreferences'
import { useArmoireGlamourSetCatalog } from '@/pages/armoire/composables/useArmoireGlamourSetCatalog'
import { useArmoireGlamourSetChunks } from '@/pages/armoire/composables/useArmoireGlamourSetChunks'
import { useArmoireHelper } from '@/pages/armoire/composables/useArmoireHelper'
import { useArmoireIgnoredItems } from '@/pages/armoire/composables/useArmoireIgnoredItems'
import { useArmoireIdenticalModelCatalog } from '@/pages/armoire/composables/useArmoireIdenticalModelCatalog'
import { useArmoireItemDisplayChunks } from '@/pages/armoire/composables/useArmoireItemDisplayChunks'
import { useArmoireSnapshot } from '@/pages/armoire/composables/useArmoireSnapshot'
import { useArmoireStoreCatalog } from '@/pages/armoire/composables/useArmoireStoreCatalog'
import { useArmoireStoreItemDisplayIndex } from '@/pages/armoire/composables/useArmoireStoreItemDisplayIndex'
import {
  useArmoireWorkspaceCatalogLoading,
  type ArmoireCollectionDetailTab,
  type ArmoireWorkspaceSection
} from '@/pages/armoire/composables/useArmoireWorkspaceCatalogLoading'
import AppLoading from '@/components/AppLoading.vue'
import NSArmoireImportPanel from '@/pages/armoire/components/NSArmoireImportPanel.vue'
import NSArmoireSectionRail from '@/pages/armoire/components/NSArmoireSectionRail.vue'
import { getArmoireItemIconUrl, getArmoireItemName } from '@/pages/armoire/utils/itemDisplay'
import type { ArmoireReadableItemView } from '@/pages/armoire/utils/insightDisplay'
import { useLocale } from '@/stores/locale'

const AppTabs = defineAsyncComponent(() => import('@/components/AppTabs.vue'))
const NSArmoireCabinetStatsPanel = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireCabinetStatsPanel.vue')
)
const NSArmoireCharacterPanel = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireCharacterPanel.vue')
)
const NSArmoireGlamourSetStatsPanel = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireGlamourSetStatsPanel.vue')
)
const NSArmoireInsightPanel = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireInsightPanel.vue')
)
const NSArmoireOverview = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireOverview.vue')
)
const NSArmoireProcessDialog = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireProcessDialog.vue')
)
const NSArmoireStorePanel = defineAsyncComponent(
  () => import('@/pages/armoire/components/NSArmoireStorePanel.vue')
)

const route = useRoute()
const { t } = useLocale()
const activeSection = ref<ArmoireWorkspaceSection>('cleanup')
const activeDetailTab = ref<ArmoireCollectionDetailTab>('store')
const profileActionStatusKey = ref<string | null>(null)
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
    value: 'storage',
    label: t(textKeys.nsarmoireCollectionCatalog)
  }
])

const {
  snapshot,
  errorKey,
  errorDetail,
  importSnapshotPayload,
  importSnapshotFile,
  replaceSnapshotFromCache,
  forgetStoredSnapshot,
  clearSnapshot
} = useArmoireSnapshot()
const {
  profiles: characterProfiles,
  activeProfileKey,
  storageStatus: profileStorageStatus,
  storageError: profileStorageError,
  switchingProfileKey,
  deletingProfileKey,
  loadProfileSnapshot,
  deleteProfile
} = useArmoireCharacterProfiles(snapshot)

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
  catalog: crafterGathererReplicaCatalog,
  status: crafterGathererReplicaCatalogStatus,
  error: crafterGathererReplicaCatalogError,
  loadCrafterGathererReplicaCatalog
} = useArmoireCrafterGathererReplicaCatalog()
const {
  storeCatalog,
  status: storeCatalogStatus,
  error: storeCatalogError,
  loadStoreCatalog
} = useArmoireStoreCatalog()
const { storeItemDisplayIndex, loadStoreItemDisplayIndex } = useArmoireStoreItemDisplayIndex()
const {
  mountedCollectionSection,
  loadIdenticalModelCatalogForCleanup,
  reloadCatalog,
  reloadStoreCatalog
} = useArmoireWorkspaceCatalogLoading({
  snapshot,
  activeSection,
  activeDetailTab,
  identicalModelCatalogStatus,
  loadItemDisplayChunksForItemIds,
  loadCabinetItemChunksForItemIds,
  loadGlamourSetChunksForItemIds,
  loadCabinetCatalog,
  loadGlamourSetCatalog,
  loadIdenticalModelCatalog,
  loadDyeCatalog,
  loadCrafterGathererReplicaCatalog,
  loadStoreCatalog,
  loadStoreItemDisplayIndex
})
const catalog = computed(() =>
  mergeArmoireCatalogs(
    itemDisplayCatalog.value,
    cabinetItemChunkCatalog.value,
    cabinetCatalog.value,
    glamourSetChunkCatalog.value,
    glamourSetCatalog.value,
    identicalModelCatalog.value,
    dyeCatalog.value,
    crafterGathererReplicaCatalog.value
  )
)

const {
  selectedDyeValueCategories,
  selectedValuableDyeIds,
  toggleDyeValueCategory,
  toggleValuableDyeId
} = useArmoireDyePreferences()
const {
  ignoredItemIds,
  ignoredItemStorageError,
  ignoreItem: ignoreCleanupItem,
  unignoreItem: unignoreCleanupItem,
  clearIgnoredItems
} = useArmoireIgnoredItems(activeProfileKey)
const shouldFilterSnapshotToItemDisplayCatalog = computed(
  () => itemDisplayChunkStatus.value === 'ready'
)
const { analysis } = useArmoireAnalysis(
  snapshot,
  catalog,
  selectedDyeValueCategories,
  selectedValuableDyeIds,
  shouldFilterSnapshotToItemDisplayCatalog
)
const { analysis: cleanupAnalysis, hasPendingCatalogChecks: cleanupHasPendingCatalogChecks } =
  useArmoireAnalysis(
    snapshot,
    catalog,
    selectedDyeValueCategories,
    selectedValuableDyeIds,
    shouldFilterSnapshotToItemDisplayCatalog,
    ignoredItemIds
  )
const ignoredItemViews = computed<ArmoireReadableItemView[]>(() =>
  ignoredItemIds.value.map((itemId) => {
    const name = getArmoireItemName(catalog.value, itemId, t)

    return {
      key: `ignored-${itemId}`,
      itemId,
      name,
      wikiItemName: name,
      context: t(textKeys.nsarmoireIgnoredItemContext),
      iconUrl: getArmoireItemIconUrl(catalog.value, itemId)
    }
  })
)
const cabinetAnalysis = computed(() =>
  snapshot.value
    ? analyzeArmoireSnapshot(snapshot.value, catalog.value, {
        valuableDyeCategories: selectedDyeValueCategories.value,
        valuableDyeIds: selectedValuableDyeIds.value,
        filterToCatalogItems: true
      })
    : null
)
const {
  busy: helperBusy,
  detail: helperDetail,
  endpoint: helperEndpoint,
  health: helperHealth,
  probe: helperProbe,
  titleKey: helperTitleKey,
  messageKey: helperMessageKey,
  tone: helperTone,
  canSelectProcess: helperCanSelectProcess,
  connectHelper,
  processes: helperProcesses,
  processPickerOpen: helperProcessPickerOpen,
  processBusy: helperProcessBusy,
  processError: helperProcessError,
  openProcessPicker: openHelperProcessPicker,
  loadProcesses: loadHelperProcesses,
  selectProcess: selectHelperProcess,
  closeProcessPicker: closeHelperProcessPicker
} = useArmoireHelper(importSnapshotPayload)

const shouldRenderCollectionSection = computed(
  () => activeSection.value === 'collection' || mountedCollectionSection.value
)
const isRestoringProfile = computed(
  () => profileStorageStatus.value === 'loading' && !snapshot.value
)
const isWorkspaceLoadingOverlayVisible = computed(() => isRestoringProfile.value)
const workspaceLoadingMessageKey = textKeys.nsarmoireCharacterLocalProfileLoading
const catalogStatus = computed<ArmoireCatalogStatus>(() => {
  const statuses = [
    itemDisplayChunkStatus.value,
    cabinetItemChunkStatus.value,
    cabinetCatalogStatus.value,
    glamourSetChunkStatus.value,
    glamourSetCatalogStatus.value,
    identicalModelCatalogStatus.value,
    dyeCatalogStatus.value,
    crafterGathererReplicaCatalogStatus.value
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
      dyeCatalogError.value,
      crafterGathererReplicaCatalogError.value
    ]
      .filter(Boolean)
      .join(' / ') || null
)

async function switchCharacterProfile(profileKey: string): Promise<void> {
  profileActionStatusKey.value = null
  const cachedSnapshot = await loadProfileSnapshot(profileKey)

  if (!cachedSnapshot) {
    return
  }

  replaceSnapshotFromCache(cachedSnapshot)
  profileActionStatusKey.value = textKeys.nsarmoireCharacterLocalProfileSwitchSuccess
  activeSection.value = 'cleanup'
}

async function deleteCharacterProfile(profileKey: string): Promise<void> {
  profileActionStatusKey.value = null
  const isDeletingCurrentProfile = activeProfileKey.value === profileKey

  await deleteProfile(profileKey)

  if (profileStorageStatus.value === 'error') {
    return
  }

  if (isDeletingCurrentProfile) {
    forgetStoredSnapshot()
    profileActionStatusKey.value = textKeys.nsarmoireCharacterLocalProfileDeleteCurrentSuccess
    return
  }

  profileActionStatusKey.value = textKeys.nsarmoireCharacterLocalProfileDeleteSuccess
}

function clearCurrentProfileData(): void {
  clearSnapshot()
  profileActionStatusKey.value = textKeys.nsarmoireCharacterLocalProfileClearCurrentSuccess
  activeSection.value = 'characters'
}

onMounted(() => {
  if (route.query.connect === '1') {
    void connectHelper()
  }
})
</script>

<style scoped>
.nsarmoire-workspace {
  --ns-font-decorative: var(--ns-font-sans);
  --ns-font-mono: var(--ns-font-sans);

  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--ns-color-bg);
  font-family: var(--ns-font-sans);
  overflow: auto;
}

.nsarmoire-workspace__body {
  display: grid;
  width: 100%;
  min-width: 0;
  background: var(--ns-color-bg);
}

.nsarmoire-workspace__shell {
  --nsarmoire-import-compact-max: 820px;
  --nsarmoire-import-hero-max: 680px;

  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  align-items: stretch;
  min-width: 0;
  min-height: calc(100vh - 58px);
  transition: none;
}

.nsarmoire-workspace__content {
  position: relative;
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
  justify-self: stretch;
  width: 100%;
}

.nsarmoire-workspace__body--empty .nsarmoire-workspace__import {
  width: min(var(--nsarmoire-import-hero-max), 100%);
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
  background: var(--ns-color-surface);
}

.nsarmoire-workspace__content :deep(.nsarmoire-panel),
.nsarmoire-workspace__content :deep(.nsarmoire-action-card) {
  border-color: var(--ns-pixel-border);
  box-shadow: none;
}

@media (min-width: 981px) {
  .nsarmoire-workspace__shell {
    --nsarmoire-import-compact-max: 752px;
    --nsarmoire-import-hero-max: 692px;
  }

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
