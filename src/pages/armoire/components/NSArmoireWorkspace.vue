<template>
  <section class="nsarmoire-workspace">
    <div class="nsarmoire-workspace__body">
      <NSArmoireImportPanel
        :snapshot="snapshot"
        :error-key="errorKey"
        :error-detail="errorDetail"
        :imported-file-name="importedFileName"
        @import-file="importSnapshotFile"
        @load-example="loadExampleSnapshot"
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
        <NSArmoireInsightPanel
          :analysis="analysis"
          :catalog="catalog"
          :snapshot="snapshot"
          :has-pending-catalog-checks="hasPendingCatalogChecks"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import NSArmoireCatalogStatus from '@/pages/armoire/components/NSArmoireCatalogStatus.vue'
import { useArmoireCatalog } from '@/pages/armoire/composables/useArmoireCatalog'
import { useArmoireAnalysis } from '@/pages/armoire/composables/useArmoireAnalysis'
import { useArmoireSnapshot } from '@/pages/armoire/composables/useArmoireSnapshot'
import NSArmoireInsightPanel from '@/pages/armoire/components/NSArmoireInsightPanel.vue'
import NSArmoireImportPanel from '@/pages/armoire/components/NSArmoireImportPanel.vue'
import NSArmoireOverview from '@/pages/armoire/components/NSArmoireOverview.vue'

const {
  snapshot,
  errorKey,
  errorDetail,
  importedFileName,
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
  grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.22fr);
  align-items: start;
  gap: 14px;
  width: 100%;
  min-width: 0;
  padding: 14px;
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
