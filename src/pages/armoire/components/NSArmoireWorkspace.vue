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
        <NSArmoireOverview :analysis="analysis?.basic ?? null" />
        <NSArmoireInsightPanel :analysis="analysis" :catalog="catalog" :snapshot="snapshot" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { analyzeArmoireSnapshot } from '@/lib/armoire/analyzeSnapshot'
import { useArmoireCatalog } from '@/pages/armoire/composables/useArmoireCatalog'
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

const { catalog } = useArmoireCatalog()

const analysis = computed(() =>
  snapshot.value ? analyzeArmoireSnapshot(snapshot.value, catalog.value) : null
)
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
