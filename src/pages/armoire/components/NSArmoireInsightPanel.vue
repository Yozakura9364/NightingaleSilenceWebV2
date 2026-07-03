<template>
  <section class="nsarmoire-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireInsights) }}</h2>
    </div>

    <AppStatus
      v-if="!analysis"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <div v-else class="nsarmoire-insight-grid">
      <article class="nsarmoire-insight-card">
        <h3>{{ t(textKeys.nsarmoireCabinetProgress) }}</h3>
        <AppStatus
          v-if="analysis.cabinetProgress.status === 'missingCatalog'"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <div v-else class="nsarmoire-mini-metrics">
          <div>
            <span>{{ t(textKeys.nsarmoireMetricStored) }}</span>
            <strong>{{ analysis.cabinetProgress.storedCount }}</strong>
          </div>
          <div>
            <span>{{ t(textKeys.nsarmoireMetricStorable) }}</span>
            <strong>{{ analysis.cabinetProgress.storableCount }}</strong>
          </div>
          <div>
            <span>{{ t(textKeys.nsarmoireMetricTransferable) }}</span>
            <strong>{{ analysis.cabinetProgress.transferableItemIds.length }}</strong>
          </div>
          <div>
            <span>{{ t(textKeys.nsarmoireMetricMissing) }}</span>
            <strong>{{ analysis.cabinetProgress.missingCabinetItemIds.length }}</strong>
          </div>
        </div>
      </article>

      <article class="nsarmoire-insight-card">
        <h3>{{ t(textKeys.nsarmoireGlamourSetProgress) }}</h3>
        <AppStatus
          v-if="analysis.glamourSetProgress.status === 'missingCatalog'"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <div v-else class="nsarmoire-mini-metrics">
          <div>
            <span>{{ t(textKeys.nsarmoireMetricStoredSets) }}</span>
            <strong>{{ analysis.glamourSetProgress.storedSetCount }}</strong>
          </div>
          <div>
            <span>{{ t(textKeys.nsarmoireMetricAvailableSets) }}</span>
            <strong>{{ analysis.glamourSetProgress.availableSetCount }}</strong>
          </div>
          <div>
            <span>{{ t(textKeys.nsarmoireMetricIncompleteSets) }}</span>
            <strong>{{ analysis.glamourSetProgress.incompleteStoredSetCount }}</strong>
          </div>
        </div>
      </article>

      <article class="nsarmoire-insight-card">
        <h3>{{ t(textKeys.nsarmoireDyeRisk) }}</h3>
        <div class="nsarmoire-mini-metrics">
          <div>
            <span>{{ t(textKeys.nsarmoireMetricDyedEntries) }}</span>
            <strong>{{ analysis.dyeRisk.riskItemCount }}</strong>
          </div>
          <div>
            <span>{{ t(textKeys.nsarmoireMetricHighRisk) }}</span>
            <strong>{{ analysis.dyeRisk.highRiskItemCount }}</strong>
          </div>
        </div>

        <AppStatus
          v-if="analysis.dyeRisk.items.length === 0"
          compact
          tone="success"
          :message="t(textKeys.nsarmoireNoDyeRisk)"
        />

        <ul v-else class="nsarmoire-risk-list">
          <li
            v-for="item in visibleDyeRiskItems"
            :key="`${item.itemId}-${item.container}-${item.containerName ?? ''}`"
            :class="`nsarmoire-risk-list__item--${item.riskLevel}`"
          >
            <span>{{ formatItemId(item.itemId) }}</span>
            <span>{{ getContainerLabel(item) }}</span>
            <strong>{{ t(textKeys.nsarmoireDyes) }} {{ formatDyes(item.dyeIds) }}</strong>
          </li>
        </ul>
      </article>

      <article class="nsarmoire-insight-card">
        <h3>{{ t(textKeys.nsarmoireIdenticalModels) }}</h3>
        <AppStatus
          v-if="analysis.identicalModels.status === 'missingCatalog'"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <div v-else class="nsarmoire-mini-metrics">
          <div>
            <span>{{ t(textKeys.nsarmoireMetricDuplicateGroups) }}</span>
            <strong>{{ analysis.identicalModels.duplicateGroupCount }}</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import type {
  ArmoireContainerKind,
  ArmoireDyeRiskItem,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

const props = defineProps<{
  analysis: ArmoireSnapshotAnalysis | null
}>()

const { t } = useLocale()

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}

const visibleDyeRiskItems = computed(() => props.analysis?.dyeRisk.items.slice(0, 6) ?? [])

function formatItemId(itemId: number): string {
  return `${t(textKeys.nsarmoireItemId)} ${itemId}`
}

function formatDyes(dyeIds: [number, number]): string {
  return dyeIds.join(' / ')
}

function getContainerLabel(item: ArmoireDyeRiskItem): string {
  const baseLabel = t(containerLabelKeys[item.container])
  return item.containerName ? `${baseLabel} / ${item.containerName}` : baseLabel
}
</script>

<style scoped>
.nsarmoire-panel {
  display: grid;
  gap: 14px;
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

.nsarmoire-panel h2,
.nsarmoire-insight-card h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-weight: 950;
}

.nsarmoire-panel h2 {
  font-size: 16px;
}

.nsarmoire-insight-card h3 {
  font-size: 14px;
}

.nsarmoire-insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.nsarmoire-insight-card {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-mini-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.nsarmoire-mini-metrics div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.nsarmoire-mini-metrics span {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-mini-metrics strong {
  font-family: var(--ns-font-decorative);
  font-size: 20px;
  font-weight: 950;
}

.nsarmoire-risk-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-risk-list li {
  display: grid;
  grid-template-columns: minmax(92px, auto) minmax(0, 1fr);
  gap: 4px 10px;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-risk-list__item--danger {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-risk-list span,
.nsarmoire-risk-list strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-risk-list span {
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsarmoire-risk-list strong {
  grid-column: 1 / -1;
  font-family: var(--ns-font-mono);
  font-size: 12px;
}

@media (max-width: 720px) {
  .nsarmoire-insight-grid,
  .nsarmoire-mini-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
