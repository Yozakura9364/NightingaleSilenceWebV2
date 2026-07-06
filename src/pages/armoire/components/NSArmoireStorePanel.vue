<template>
  <section class="nsarmoire-store-panel">
    <div class="nsarmoire-store-panel__header">
      <h2>{{ t(textKeys.nsarmoireStoreOutfits) }}</h2>
    </div>

    <AppStatus
      v-if="status === 'loading'"
      compact
      tone="loading"
      :message="t(textKeys.nsarmoireStoreCatalogLoading)"
    />

    <AppStatus
      v-else-if="status === 'error'"
      compact
      tone="danger"
      :title="t(textKeys.nsarmoireStoreCatalogError)"
      :message="error ?? undefined"
    >
      <template #actions>
        <AppButton @click="$emit('reload')">
          {{ t(textKeys.nsarmoireStoreCatalogRetry) }}
        </AppButton>
      </template>
    </AppStatus>

    <template v-else>
      <p class="nsarmoire-store-panel__summary">{{ t(textKeys.nsarmoireStoreSummary) }}</p>

      <div class="nsarmoire-store-panel__controls">
        <AppField
          :label="t(textKeys.nsarmoireStoreSearchLabel)"
          for-id="nsarmoire-store-search"
          density="compact"
        >
          <input
            id="nsarmoire-store-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :placeholder="t(textKeys.nsarmoireStoreSearchPlaceholder)"
          />
        </AppField>

        <AppField
          :label="t(textKeys.nsarmoireStoreFilterLabel)"
          for-id="nsarmoire-store-filter"
          density="compact"
        >
          <select id="nsarmoire-store-filter" v-model="selectedStatus">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </AppField>
      </div>

      <AppStatus
        v-if="visibleOutfits.length === 0"
        compact
        tone="info"
        :message="t(textKeys.nsarmoireStoreEmpty)"
      />

      <template v-else>
        <ol class="nsarmoire-store-panel__list">
          <li
            v-for="state in visibleOutfits"
            :key="state.outfit.id"
            class="nsarmoire-store-card"
            :class="`nsarmoire-store-card--${state.status}`"
          >
            <div class="nsarmoire-store-card__cover">
              <img
                v-if="getCoverIconUrl(state)"
                :src="getCoverIconUrl(state)"
                :alt="state.outfit.name"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span v-else aria-hidden="true"></span>
            </div>

            <div class="nsarmoire-store-card__main">
              <div class="nsarmoire-store-card__title-row">
                <h3>{{ state.outfit.name }}</h3>
                <span class="nsarmoire-store-card__status">
                  {{ getStatusLabel(state.status) }}
                </span>
              </div>

              <div class="nsarmoire-store-card__meta">
                <span>{{ getRegionLabel(state.outfit.region) }}</span>
                <span v-if="state.outfit.priceLabel">{{ state.outfit.priceLabel }}</span>
                <span>{{ state.ownedItemIds.length }}/{{ state.mappedItemCount }}</span>
              </div>

              <ul v-if="getTagLabels(state.outfit).length > 0" class="nsarmoire-store-card__tags">
                <li v-for="tag in getTagLabels(state.outfit)" :key="tag">{{ tag }}</li>
              </ul>
            </div>

            <div class="nsarmoire-store-card__items">
              <span class="nsarmoire-store-card__items-label">
                {{ t(textKeys.nsarmoireStoreItemsLabel) }}
              </span>

              <ul v-if="getPieceViews(state).length > 0">
                <li
                  v-for="piece in getPieceViews(state)"
                  :key="piece.key"
                  :class="{ 'nsarmoire-store-card__piece--owned': piece.owned }"
                >
                  <img v-if="piece.iconUrl" :src="piece.iconUrl" :alt="piece.name" loading="lazy" />
                  <span
                    v-else
                    class="nsarmoire-store-card__piece-fallback"
                    aria-hidden="true"
                  ></span>
                  <span>{{ piece.name }}</span>
                </li>
              </ul>

              <span v-else class="nsarmoire-store-card__empty">
                {{ t(textKeys.nsarmoireStoreNoItems) }}
              </span>
            </div>

            <a
              class="nsarmoire-store-card__link"
              :href="state.outfit.storeUrl"
              target="_blank"
              rel="noreferrer"
            >
              {{ t(textKeys.nsarmoireStoreOpenLink) }}
            </a>
          </li>
        </ol>

        <div v-if="hasMoreOutfits" class="nsarmoire-store-panel__more">
          <AppButton @click="showMoreOutfits">
            {{ loadMoreLabel }}
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
import { analyzeArmoireStoreOutfits } from '@/lib/armoire/analyzeStoreOutfits'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireStoreCatalog,
  ArmoireStoreOutfit,
  ArmoireStoreOutfitState,
  ArmoireStoreOutfitStatus,
  ArmoireStoreRegion
} from '@/lib/armoire/types'
import type { ArmoireStoreCatalogStatus } from '@/pages/armoire/composables/useArmoireStoreCatalog'
import {
  formatArmoireText,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import { getArmoireStoreTagLabels } from '@/pages/armoire/utils/storeTagDisplay'
import { useLocale } from '@/stores/locale'

type StoreStatusFilter = ArmoireStoreOutfitStatus | 'all'

interface StorePieceView {
  key: string
  name: string
  iconUrl: string
  owned: boolean
}

const props = defineProps<{
  armoireCatalog: ArmoireCatalog
  error: string | null
  snapshot: ArmoireSnapshot
  status: ArmoireStoreCatalogStatus
  storeCatalog: ArmoireStoreCatalog
}>()

defineEmits<{
  reload: []
}>()

const { t } = useLocale()
const STORE_BATCH_SIZE = 48
const searchQuery = ref('')
const selectedStatus = ref<StoreStatusFilter>('all')
const visibleCount = ref(STORE_BATCH_SIZE)

const analysis = computed(() => analyzeArmoireStoreOutfits(props.snapshot, props.storeCatalog))

const statusOptions = computed<Array<{ value: StoreStatusFilter; label: string }>>(() => [
  { value: 'all', label: t(textKeys.nsarmoireStoreFilterAll) },
  { value: 'complete', label: t(textKeys.nsarmoireStoreStatusComplete) },
  { value: 'partial', label: t(textKeys.nsarmoireStoreStatusPartial) },
  { value: 'missing', label: t(textKeys.nsarmoireStoreStatusMissing) },
  { value: 'needsMapping', label: t(textKeys.nsarmoireStoreStatusNeedsMapping) }
])

const filteredOutfits = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  return analysis.value.outfits.filter((state) => {
    if (selectedStatus.value !== 'all' && state.status !== selectedStatus.value) {
      return false
    }

    if (!query) {
      return true
    }

    return [
      state.outfit.name,
      state.outfit.priceLabel ?? '',
      getRegionLabel(state.outfit.region),
      ...getTagLabels(state.outfit),
      ...state.outfit.itemNames
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
})

const visibleOutfits = computed(() => filteredOutfits.value.slice(0, visibleCount.value))
const hasMoreOutfits = computed(() => visibleOutfits.value.length < filteredOutfits.value.length)
const nextBatchCount = computed(() =>
  Math.min(STORE_BATCH_SIZE, filteredOutfits.value.length - visibleOutfits.value.length)
)
const loadMoreLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextBatchCount.value })
)

watch(
  () => [selectedStatus.value, searchQuery.value, props.storeCatalog.generatedAt] as const,
  () => {
    visibleCount.value = STORE_BATCH_SIZE
  }
)

function getStatusLabel(status: ArmoireStoreOutfitStatus): string {
  const labelKeys: Record<ArmoireStoreOutfitStatus, string> = {
    complete: textKeys.nsarmoireStoreStatusComplete,
    partial: textKeys.nsarmoireStoreStatusPartial,
    missing: textKeys.nsarmoireStoreStatusMissing,
    needsMapping: textKeys.nsarmoireStoreStatusNeedsMapping
  }

  return t(labelKeys[status])
}

function getRegionLabel(region: ArmoireStoreRegion): string {
  const labelKeys: Record<ArmoireStoreRegion, string> = {
    cn: textKeys.nsarmoireStoreRegionCn,
    global: textKeys.nsarmoireStoreRegionGlobal,
    tw: textKeys.nsarmoireStoreRegionTw
  }

  return t(labelKeys[region])
}

function getTagLabels(outfit: ArmoireStoreOutfit): string[] {
  return getArmoireStoreTagLabels(t, outfit.tags, outfit.detailTags)
}

function getCoverIconUrl(state: ArmoireStoreOutfitState): string {
  const coverItemId = state.outfit.coverItemId ?? state.outfit.itemIds[0]

  return coverItemId ? getArmoireItemIconUrl(props.armoireCatalog, coverItemId) : ''
}

function getPieceViews(state: ArmoireStoreOutfitState): StorePieceView[] {
  if (state.status === 'needsMapping' && state.outfit.itemNames.length > 0) {
    const ownedItemIds = new Set(state.ownedItemIds)

    return state.outfit.itemNames.map((name, index) => {
      const matchedItemId = getMatchedItemIdByName(state, name)

      return {
        key: `${state.outfit.id}-name-${index}`,
        name,
        iconUrl: matchedItemId ? getArmoireItemIconUrl(props.armoireCatalog, matchedItemId) : '',
        owned: matchedItemId ? ownedItemIds.has(matchedItemId) : false
      }
    })
  }

  const ownedItemIds = new Set(state.ownedItemIds)

  return state.outfit.itemIds.map((itemId, index) => ({
    key: `${state.outfit.id}-${itemId}-${index}`,
    name: getArmoireItemName(props.armoireCatalog, itemId, t),
    iconUrl: getArmoireItemIconUrl(props.armoireCatalog, itemId),
    owned: ownedItemIds.has(itemId)
  }))
}

function getMatchedItemIdByName(state: ArmoireStoreOutfitState, name: string): number | undefined {
  return state.outfit.itemIds.find(
    (itemId) => props.armoireCatalog.items[itemId]?.name?.trim() === name.trim()
  )
}

function showMoreOutfits(): void {
  visibleCount.value = Math.min(filteredOutfits.value.length, visibleCount.value + STORE_BATCH_SIZE)
}

function hideBrokenImage(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.visibility = 'hidden'
  }
}
</script>

<style scoped>
.nsarmoire-store-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: #ffffff;
}

.nsarmoire-store-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-store-panel h2,
.nsarmoire-store-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-store-panel__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-store-panel__controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px);
  gap: 10px;
  min-width: 0;
}

.nsarmoire-store-panel__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-card {
  display: grid;
  grid-template-columns: 52px minmax(180px, 0.95fr) minmax(260px, 1.35fr) auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: #ffffff;
}

.nsarmoire-store-card__cover {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-card__cover img,
.nsarmoire-store-card__cover span {
  display: block;
  width: 44px;
  height: 44px;
  image-rendering: auto;
  object-fit: cover;
}

.nsarmoire-store-card__cover span {
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
}

.nsarmoire-store-card--complete {
  border-color: var(--ns-status-success-border);
}

.nsarmoire-store-card--partial {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-store-card--needsMapping {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-store-card__main,
.nsarmoire-store-card__items {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.nsarmoire-store-card__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.nsarmoire-store-card h3 {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-card__status {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-surface);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-store-card__meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsarmoire-store-card__tags {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-card__tags li {
  padding: 2px 5px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-size: 11px;
  font-weight: 800;
}

.nsarmoire-store-card__items-label,
.nsarmoire-store-card__empty {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-store-card__items ul {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-card__items li {
  display: inline-flex;
  max-width: 220px;
  min-width: 0;
  align-items: center;
  gap: 5px;
  padding: 3px 6px 3px 3px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsarmoire-store-card__piece--owned {
  border-color: var(--ns-status-success-border);
  color: var(--ns-color-text);
}

.nsarmoire-store-card__items img,
.nsarmoire-store-card__piece-fallback {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: 1px solid var(--ns-pixel-border-soft);
  image-rendering: auto;
  object-fit: cover;
}

.nsarmoire-store-card__piece-fallback {
  background: var(--ns-color-surface);
}

.nsarmoire-store-card__items li span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-card__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: #ffffff;
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.nsarmoire-store-card__link:hover {
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0 var(--ns-pixel-border);
}

.nsarmoire-store-panel__more {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 920px) {
  .nsarmoire-store-panel__controls,
  .nsarmoire-store-card {
    grid-template-columns: 1fr;
  }

  .nsarmoire-store-card__cover {
    justify-self: start;
  }

  .nsarmoire-store-card__link {
    justify-self: start;
  }
}
</style>
