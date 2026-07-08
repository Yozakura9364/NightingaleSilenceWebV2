<template>
  <section class="nsarmoire-panel">
    <div class="nsarmoire-panel__header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsarmoireCatalogGrid) }}</h2>
    </div>

    <AppStatus
      v-if="!snapshot"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <template v-else>
      <p class="nsarmoire-catalog-panel__summary">{{ summary }}</p>

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
        <NSArmoireCatalogGrid
          :items="visibleCatalogItems"
          @ignore-item="$emit('ignore-item', $event)"
        />

        <div v-if="hasMoreCatalogItems" class="nsarmoire-catalog-panel__more">
          <AppButton :disabled="isCatalogBatchPending" @click="showMoreCatalogItems">
            {{ loadMoreCatalogLabel }}
          </AppButton>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type { ArmoireCatalog, ArmoireSnapshot, ArmoireSnapshotAnalysis } from '@/lib/armoire/types'
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

defineEmits<{
  'ignore-item': [itemId: number]
}>()

const { t } = useLocale()
const selectedFilter = ref<ArmoireCatalogGridFilter>('all')
const selectedSort = ref<ArmoireCatalogGridSort>('risk')
const searchQuery = ref('')
const searchInputId = 'nsarmoire-catalog-search'
const sortSelectId = 'nsarmoire-catalog-sort'
const CATALOG_INITIAL_BATCH_SIZE = 24
const CATALOG_LOAD_STEP = 16
const visibleCatalogCount = ref(CATALOG_INITIAL_BATCH_SIZE)
const isCatalogBatchPending = ref(false)
let catalogBatchFrameId: number | null = null

const { filterOptions, filteredItems, sortOptions, summary } = useArmoireCatalogGrid(
  props,
  selectedFilter,
  searchQuery,
  selectedSort,
  t
)

const visibleCatalogItems = computed(() =>
  filteredItems.value.slice(0, Math.min(filteredItems.value.length, visibleCatalogCount.value))
)

const hasMoreCatalogItems = computed(
  () => visibleCatalogItems.value.length < filteredItems.value.length
)

const nextCatalogBatchCount = computed(() =>
  Math.min(
    CATALOG_LOAD_STEP,
    Math.max(filteredItems.value.length - visibleCatalogItems.value.length, 0)
  )
)

const loadMoreCatalogLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextCatalogBatchCount.value })
)

watch(
  () =>
    [
      selectedFilter.value,
      selectedSort.value,
      searchQuery.value,
      props.catalog.generatedAt,
      props.snapshot?.generatedAt,
      props.snapshot?.items.length
    ] as const,
  () => {
    resetCatalogBatch()
  }
)

onBeforeUnmount(() => {
  cancelCatalogBatchFrame()
})

function showMoreCatalogItems(): void {
  if (isCatalogBatchPending.value) {
    return
  }

  const nextCount = Math.min(
    filteredItems.value.length,
    visibleCatalogCount.value + CATALOG_LOAD_STEP
  )

  if (nextCount <= visibleCatalogCount.value) {
    return
  }

  isCatalogBatchPending.value = true

  if (typeof window === 'undefined') {
    visibleCatalogCount.value = nextCount
    isCatalogBatchPending.value = false
    return
  }

  catalogBatchFrameId = window.requestAnimationFrame(() => {
    catalogBatchFrameId = null
    visibleCatalogCount.value = nextCount
    isCatalogBatchPending.value = false
  })
}

function resetCatalogBatch(): void {
  cancelCatalogBatchFrame()
  visibleCatalogCount.value = CATALOG_INITIAL_BATCH_SIZE
}

function cancelCatalogBatchFrame(): void {
  if (catalogBatchFrameId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(catalogBatchFrameId)
  }

  catalogBatchFrameId = null
  isCatalogBatchPending.value = false
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
  .nsarmoire-catalog-panel__controls {
    grid-template-columns: 1fr;
  }
}
</style>
