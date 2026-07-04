<template>
  <section class="nsarmoire-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireCatalogGrid) }}</h2>
    </div>

    <AppStatus
      v-if="!snapshot"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <template v-else>
      <p class="nsarmoire-catalog-panel__summary">{{ summary }}</p>

      <ul
        class="nsarmoire-catalog-panel__metrics"
        :aria-label="t(textKeys.nsarmoireCatalogMetricLabel)"
      >
        <li
          v-for="metric in resultMetrics"
          :key="metric.key"
          :class="`nsarmoire-catalog-panel__metric--${metric.tone}`"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </li>
      </ul>

      <div class="nsarmoire-catalog-panel__controls">
        <AppField
          :label="t(textKeys.nsarmoireCatalogSearchLabel)"
          :for-id="searchInputId"
          density="compact"
        >
          <input
            :id="searchInputId"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :placeholder="t(textKeys.nsarmoireCatalogSearchPlaceholder)"
          />
        </AppField>

        <AppField
          :label="t(textKeys.nsarmoireCatalogSortLabel)"
          :for-id="sortSelectId"
          density="compact"
        >
          <select :id="sortSelectId" v-model="selectedSort">
            <option v-for="option in sortOptions" :key="option.key" :value="option.key">
              {{ option.label }}
            </option>
          </select>
        </AppField>
      </div>

      <NSArmoireCatalogFilters
        v-model:selected="selectedFilter"
        :options="filterOptions"
        :label="t(textKeys.nsarmoireCatalogFilterLabel)"
      />

      <AppStatus
        v-if="filteredItems.length === 0"
        compact
        tone="info"
        :message="t(textKeys.nsarmoireCatalogGridEmpty)"
      />

      <template v-else>
        <NSArmoireCatalogGrid :items="visibleCatalogItems" />

        <div v-if="hasMoreCatalogItems" class="nsarmoire-catalog-panel__more">
          <AppButton @click="showMoreCatalogItems">
            {{ loadMoreCatalogLabel }}
          </AppButton>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import NSArmoireCatalogFilters from '@/pages/armoire/components/NSArmoireCatalogFilters.vue'
import NSArmoireCatalogGrid from '@/pages/armoire/components/NSArmoireCatalogGrid.vue'
import {
  useArmoireCatalogGrid,
  type ArmoireCatalogGridFilter,
  type ArmoireCatalogGridSort
} from '@/pages/armoire/composables/useArmoireCatalogGrid'
import { formatArmoireText } from '@/pages/armoire/utils/itemDisplay'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
}>()

const { t } = useLocale()
const selectedFilter = ref<ArmoireCatalogGridFilter>('all')
const selectedSort = ref<ArmoireCatalogGridSort>('risk')
const searchQuery = ref('')
const searchInputId = 'nsarmoire-catalog-search'
const sortSelectId = 'nsarmoire-catalog-sort'
const CATALOG_BATCH_SIZE = 48
const visibleCatalogCount = ref(CATALOG_BATCH_SIZE)

const { filterOptions, filteredItems, resultMetrics, sortOptions, summary } = useArmoireCatalogGrid(
  props,
  selectedFilter,
  searchQuery,
  selectedSort,
  t
)

const visibleCatalogItems = computed(() =>
  filteredItems.value.slice(0, Math.min(filteredItems.value.length, visibleCatalogCount.value))
)

const hasMoreCatalogItems = computed(() => visibleCatalogItems.value.length < filteredItems.value.length)

const nextCatalogBatchCount = computed(() =>
  Math.min(CATALOG_BATCH_SIZE, Math.max(filteredItems.value.length - visibleCatalogItems.value.length, 0))
)

const loadMoreCatalogLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextCatalogBatchCount.value })
)

watch(
  () => [selectedFilter.value, selectedSort.value, searchQuery.value, props.snapshot?.items.length] as const,
  () => {
    visibleCatalogCount.value = CATALOG_BATCH_SIZE
  }
)

function showMoreCatalogItems(): void {
  visibleCatalogCount.value = Math.min(
    filteredItems.value.length,
    visibleCatalogCount.value + CATALOG_BATCH_SIZE
  )
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

.nsarmoire-panel h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
  font-weight: 950;
}

.nsarmoire-catalog-panel__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-catalog-panel__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-catalog-panel__metrics li {
  display: grid;
  min-width: 0;
  gap: 5px;
  padding: 9px 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-catalog-panel__metrics span {
  min-width: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-catalog-panel__metrics strong {
  font-family: var(--ns-font-mono);
  font-size: 18px;
  line-height: 1;
}

.nsarmoire-catalog-panel__metric--success {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.nsarmoire-catalog-panel__metric--warning {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.nsarmoire-catalog-panel__metric--danger {
  border-color: var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
}

.nsarmoire-catalog-panel__controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 240px);
  gap: 10px;
  min-width: 0;
}

.nsarmoire-catalog-panel__more {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 760px) {
  .nsarmoire-catalog-panel__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .nsarmoire-catalog-panel__controls {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .nsarmoire-catalog-panel__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
