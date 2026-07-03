<template>
  <section class="nsarmoire-workspace">
    <div class="nsarmoire-workspace__body">
      <NSArmoireImportPanel
        :snapshot="snapshot"
        :error-key="errorKey"
        :error-detail="errorDetail"
        :imported-file-name="importedFileName"
        @import-file="importSnapshotFile"
        @clear="clearSnapshot"
      />

      <NSArmoireOverview :analysis="analysis" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { analyzeArmoireBasics } from '@/lib/armoire/analyzeContainerDistribution'
import { useArmoireSnapshot } from '@/pages/armoire/composables/useArmoireSnapshot'
import NSArmoireImportPanel from '@/pages/armoire/components/NSArmoireImportPanel.vue'
import NSArmoireOverview from '@/pages/armoire/components/NSArmoireOverview.vue'

const {
  snapshot,
  errorKey,
  errorDetail,
  importedFileName,
  importSnapshotFile,
  clearSnapshot
} = useArmoireSnapshot()

const analysis = computed(() => (snapshot.value ? analyzeArmoireBasics(snapshot.value) : null))
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

@media (max-width: 980px) {
  .nsarmoire-workspace {
    overflow: visible;
  }

  .nsarmoire-workspace__body {
    grid-template-columns: 1fr;
  }
}
</style>
