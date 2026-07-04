<template>
  <section class="nsarmoire-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(titleKey) }}</h2>
    </div>

    <AppStatus
      v-if="!analysis"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <template v-else>
      <div class="nsarmoire-summary-list">
        <p v-for="summary in summaries" :key="summary.key">
          {{ summary.text }}
        </p>
      </div>

      <div class="nsarmoire-metrics">
        <article v-for="metric in metrics" :key="metric.key" class="nsarmoire-metric">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </article>
      </div>

      <section class="nsarmoire-distribution" :aria-label="t(textKeys.nsarmoireDistribution)">
        <h3>{{ t(textKeys.nsarmoireDistribution) }}</h3>

        <div class="nsarmoire-distribution__table">
          <div
            v-for="entry in analysis.distribution"
            :key="entry.key"
            class="nsarmoire-distribution__row"
          >
            <span>{{ getContainerLabel(entry) }}</span>
            <strong>{{ entry.entryCount }}</strong>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import type {
  ArmoireBasicAnalysis,
  ArmoireContainerDistributionEntry,
  ArmoireContainerKind
} from '@/lib/armoire/types'

const props = defineProps<{
  analysis: ArmoireBasicAnalysis | null
  titleKey?: string
}>()

const { t } = useLocale()
const titleKey = computed(() => props.titleKey ?? textKeys.nsarmoireOverview)

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}

function formatText(key: string, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
}

const summaries = computed(() => {
  if (!props.analysis) {
    return []
  }

  const dyeKey =
    props.analysis.dyedEntryCount > 0
      ? textKeys.nsarmoireSummaryDyeWarning
      : textKeys.nsarmoireSummaryNoDyeWarning

  return [
    {
      key: 'inventory',
      text: formatText(textKeys.nsarmoireSummaryInventory, {
        entries: props.analysis.entryCount,
        containers: props.analysis.distribution.length
      })
    },
    {
      key: 'storage',
      text: formatText(textKeys.nsarmoireSummaryStorage, {
        dresser: props.analysis.glamourDresserEntryCount,
        armoire: props.analysis.armoireEntryCount
      })
    },
    {
      key: 'dye',
      text: formatText(dyeKey, {
        count: props.analysis.dyedEntryCount
      })
    }
  ]
})

const metrics = computed(() => {
  if (!props.analysis) {
    return []
  }

  return [
    {
      key: 'entries',
      label: t(textKeys.nsarmoireMetricEntries),
      value: props.analysis.entryCount
    },
    {
      key: 'uniqueItems',
      label: t(textKeys.nsarmoireMetricUniqueItems),
      value: props.analysis.uniqueItemCount
    },
    {
      key: 'totalQuantity',
      label: t(textKeys.nsarmoireMetricTotalQuantity),
      value: props.analysis.totalQuantity
    },
    {
      key: 'dyedEntries',
      label: t(textKeys.nsarmoireMetricDyedEntries),
      value: props.analysis.dyedEntryCount
    },
    {
      key: 'glamourDresser',
      label: t(textKeys.nsarmoireMetricGlamourDresser),
      value: props.analysis.glamourDresserEntryCount
    },
    {
      key: 'armoire',
      label: t(textKeys.nsarmoireMetricArmoire),
      value: props.analysis.armoireEntryCount
    }
  ]
})

function getContainerLabel(entry: ArmoireContainerDistributionEntry): string {
  const baseLabel = t(containerLabelKeys[entry.container])
  return entry.containerName ? `${baseLabel} / ${entry.containerName}` : baseLabel
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
.nsarmoire-distribution h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-weight: 950;
}

.nsarmoire-panel h2 {
  font-size: 16px;
}

.nsarmoire-summary-list {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-summary-list p {
  margin: 0;
  line-height: 1.7;
}

.nsarmoire-distribution h3 {
  font-size: 14px;
}

.nsarmoire-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.nsarmoire-metric {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-metric span {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-metric strong {
  font-family: var(--ns-font-decorative);
  font-size: 24px;
  font-weight: 950;
}

.nsarmoire-distribution {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.nsarmoire-distribution__table {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.nsarmoire-distribution__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-distribution__row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-distribution__row strong {
  font-family: var(--ns-font-mono);
}

@media (max-width: 720px) {
  .nsarmoire-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 460px) {
  .nsarmoire-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
