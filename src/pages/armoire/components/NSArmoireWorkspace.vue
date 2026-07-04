<template>
  <section class="nsarmoire-workspace">
    <div class="nsarmoire-workspace__body">
      <NSArmoireImportPanel
        class="nsarmoire-workspace__import"
        :snapshot="snapshot"
        :error-key="errorKey"
        :error-detail="errorDetail"
        :imported-file-name="importedFileName"
        :helper-status-tone="helperTone"
        :helper-status-title-key="helperTitleKey"
        :helper-status-message-key="helperMessageKey"
        :helper-error-detail="helperDetail"
        :helper-endpoint="helperEndpoint"
        :helper-busy="helperBusy"
        :helper-can-refresh="helperCanRefresh"
        @import-file="importSnapshotFile"
        @load-example="loadExampleSnapshot"
        @connect-helper="connectHelper"
        @refresh-helper="refreshHelper"
        @clear="clearSnapshot"
      />

      <div class="nsarmoire-workspace__main">
        <section
          class="nsarmoire-workspace__section"
          aria-labelledby="nsarmoire-actions-heading"
        >
          <div class="nsarmoire-workspace__section-header">
            <h2 id="nsarmoire-actions-heading">
              {{ t(textKeys.nsarmoireSectionActions) }}
            </h2>
          </div>

          <NSArmoireInsightPanel
            :analysis="analysis"
            :catalog="catalog"
            :snapshot="snapshot"
            :has-pending-catalog-checks="hasPendingCatalogChecks"
          />
        </section>

        <NSArmoireOverview
          :analysis="analysis?.basic ?? null"
          :title-key="textKeys.nsarmoireSectionStorage"
        />

        <section
          class="nsarmoire-workspace__section nsarmoire-workspace__section--reference"
          aria-labelledby="nsarmoire-reference-heading"
        >
          <div class="nsarmoire-workspace__section-header nsarmoire-workspace__section-header--tabs">
            <h2 id="nsarmoire-reference-heading">
              {{ t(textKeys.nsarmoireSectionReference) }}
            </h2>

            <AppTabs
              v-model="activeDetailTab"
              class="nsarmoire-workspace__reference-tabs"
              :items="detailTabs"
              :aria-label="t(textKeys.nsarmoireSectionReference)"
              id-prefix="nsarmoire-reference-tab"
              density="compact"
            />
          </div>

          <div class="nsarmoire-workspace__reference-body">
            <NSArmoireCatalogPanel
              v-if="activeDetailTab === 'catalog'"
              :analysis="analysis"
              :catalog="catalog"
              :snapshot="snapshot"
            />
            <NSArmoireValidationPanel
              v-else-if="activeDetailTab === 'validation'"
              :analysis="analysis"
              :catalog="catalog"
              :snapshot="snapshot"
            />
            <NSArmoireCatalogStatus
              v-else
              :catalog="catalog"
              :status="catalogStatus"
              :error="catalogError"
              @reload="loadCatalog"
            />
          </div>
        </section>
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
import { computed, ref } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import { textKeys } from '@/config/site'
import NSArmoireCatalogPanel from '@/pages/armoire/components/NSArmoireCatalogPanel.vue'
import NSArmoireCatalogStatus from '@/pages/armoire/components/NSArmoireCatalogStatus.vue'
import { useArmoireCatalog } from '@/pages/armoire/composables/useArmoireCatalog'
import { useArmoireAnalysis } from '@/pages/armoire/composables/useArmoireAnalysis'
import { useArmoireHelper } from '@/pages/armoire/composables/useArmoireHelper'
import { useArmoireSnapshot } from '@/pages/armoire/composables/useArmoireSnapshot'
import NSArmoireInsightPanel from '@/pages/armoire/components/NSArmoireInsightPanel.vue'
import NSArmoireImportPanel from '@/pages/armoire/components/NSArmoireImportPanel.vue'
import NSArmoireOverview from '@/pages/armoire/components/NSArmoireOverview.vue'
import NSArmoireProcessDialog from '@/pages/armoire/components/NSArmoireProcessDialog.vue'
import NSArmoireValidationPanel from '@/pages/armoire/components/NSArmoireValidationPanel.vue'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const activeDetailTab = ref('catalog')
const detailTabs = computed(() => [
  {
    value: 'catalog',
    label: t(textKeys.nsarmoireCatalogGrid)
  },
  {
    value: 'validation',
    label: t(textKeys.nsarmoireValidation)
  },
  {
    value: 'data',
    label: t(textKeys.nsarmoireSectionCatalogData)
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

const {
  catalog,
  status: catalogStatus,
  error: catalogError,
  loadCatalog
} = useArmoireCatalog()

const { analysis, hasPendingCatalogChecks } = useArmoireAnalysis(snapshot, catalog)
const {
  busy: helperBusy,
  detail: helperDetail,
  endpoint: helperEndpoint,
  titleKey: helperTitleKey,
  messageKey: helperMessageKey,
  tone: helperTone,
  canRefresh: helperCanRefresh,
  connectHelper,
  refreshHelper,
  processes: helperProcesses,
  processPickerOpen: helperProcessPickerOpen,
  processBusy: helperProcessBusy,
  processError: helperProcessError,
  loadProcesses: loadHelperProcesses,
  selectProcess: selectHelperProcess,
  closeProcessPicker: closeHelperProcessPicker
} = useArmoireHelper(importSnapshotPayload)
</script>

<style scoped>
.nsarmoire-workspace {
  --ns-font-decorative: var(--ns-font-sans);
  --ns-font-mono: var(--ns-font-sans);

  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--ns-color-bg-soft);
  font-family: var(--ns-font-sans);
  overflow: auto;
}

.nsarmoire-workspace__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 14px;
}

.nsarmoire-workspace__import {
  min-width: 0;
}

.nsarmoire-workspace__main {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.nsarmoire-workspace__section {
  display: grid;
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
  align-items: end;
}

.nsarmoire-workspace__reference-tabs {
  flex: 0 1 auto;
  min-width: min(100%, 360px);
}

.nsarmoire-workspace__reference-body {
  display: grid;
  min-width: 0;
}

@media (max-width: 980px) {
  .nsarmoire-workspace {
    overflow: visible;
  }

  .nsarmoire-workspace__body {
    grid-template-columns: 1fr;
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
