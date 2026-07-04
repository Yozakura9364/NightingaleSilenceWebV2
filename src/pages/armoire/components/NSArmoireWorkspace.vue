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
        <NSArmoireCatalogStatus
          :catalog="catalog"
          :status="catalogStatus"
          :error="catalogError"
          @reload="loadCatalog"
        />
        <NSArmoireOverview :analysis="analysis?.basic ?? null" />
        <NSArmoireValidationPanel
          :analysis="analysis"
          :catalog="catalog"
          :snapshot="snapshot"
        />
        <NSArmoireInsightPanel
          :analysis="analysis"
          :catalog="catalog"
          :snapshot="snapshot"
          :has-pending-catalog-checks="hasPendingCatalogChecks"
        />
        <NSArmoireCatalogPanel :analysis="analysis" :catalog="catalog" :snapshot="snapshot" />
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
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--ns-color-bg-soft);
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
  gap: 14px;
  min-width: 0;
}

@media (max-width: 980px) {
  .nsarmoire-workspace {
    overflow: visible;
  }

  .nsarmoire-workspace__body {
    grid-template-columns: 1fr;
  }
}
</style>
