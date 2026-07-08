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

      <section class="nsarmoire-distribution" :aria-label="t(textKeys.nsarmoireDistribution)">
        <h3>{{ t(textKeys.nsarmoireDistribution) }}</h3>

        <div class="nsarmoire-distribution__table">
          <details
            v-for="entry in analysis.distribution"
            :key="entry.key"
            class="nsarmoire-distribution__row"
            :open="expandedContainerKeys.has(entry.key)"
            @toggle="handleContainerToggle(entry.key, $event)"
          >
            <summary>
              <span>{{ getContainerLabel(entry) }}</span>
              <strong>{{ entry.entryCount }}</strong>
            </summary>

            <div v-if="expandedContainerKeys.has(entry.key)" class="nsarmoire-distribution__items">
              <span
                v-for="(item, index) in getContainerItems(entry)"
                :key="getContainerItemKey(entry, item, index)"
                class="nsarmoire-distribution__item"
                :title="getContainerItemTitle(item)"
              >
                <img
                  v-if="getContainerItemIconUrl(item)"
                  :src="getContainerItemIconUrl(item)"
                  :alt="getContainerItemName(item)"
                  loading="lazy"
                  @error="hideBrokenImage"
                />
                <span v-else aria-hidden="true"></span>
                <b v-if="getContainerItemQuantity(item) > 1">
                  {{ getContainerItemQuantity(item) }}
                </b>
              </span>
            </div>
          </details>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { getOwnedItemQuantity } from '@/lib/armoire/buildOwnedIndex'
import { useLocale } from '@/stores/locale'
import type {
  ArmoireBasicAnalysis,
  ArmoireCatalog,
  ArmoireContainerDistributionEntry,
  ArmoireOwnedItem,
  ArmoireSnapshot
} from '@/lib/armoire/types'
import {
  canShowArmoireBindState,
  formatArmoireDyeNames,
  formatArmoireText,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'

const props = defineProps<{
  analysis: ArmoireBasicAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
  titleKey?: string
}>()

const { t } = useLocale()
const titleKey = computed(() => props.titleKey ?? textKeys.nsarmoireOverview)
const expandedContainerKeys = ref(new Set<string>())

function formatText(key: string, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
}

const summaries = computed(() => {
  if (!props.analysis) {
    return []
  }

  return [
    {
      key: 'inventory',
      text: formatText(textKeys.nsarmoireSummaryInventory, {
        entries: props.analysis.entryCount,
        containers: props.analysis.distribution.length
      })
    }
  ]
})

const itemsByContainerKey = computed(() => {
  const groups = new Map<string, ArmoireOwnedItem[]>()

  for (const item of props.snapshot?.items ?? []) {
    const key = getContainerKey(item)
    const items = groups.get(key)

    if (items) {
      items.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return groups
})

watch(
  () => props.analysis?.distribution.map((entry) => entry.key).join('\u0000') ?? '',
  () => {
    if (!props.analysis) {
      expandedContainerKeys.value = new Set()
      return
    }

    const availableKeys = new Set(props.analysis.distribution.map((entry) => entry.key))
    expandedContainerKeys.value = new Set(
      [...expandedContainerKeys.value].filter((key) => availableKeys.has(key))
    )
  }
)

function getContainerLabel(entry: ArmoireContainerDistributionEntry): string {
  return getArmoireContainerLabel(entry, t)
}

function getContainerKey(item: ArmoireOwnedItem): string {
  return `${item.container}::${item.containerName ?? ''}`
}

function getContainerItems(entry: ArmoireContainerDistributionEntry): ArmoireOwnedItem[] {
  return itemsByContainerKey.value.get(entry.key) ?? []
}

function getContainerItemKey(
  entry: ArmoireContainerDistributionEntry,
  item: ArmoireOwnedItem,
  index: number
): string {
  return `${entry.key}-${item.itemId}-${item.slotIndex ?? index}-${item.containerName ?? ''}`
}

function getContainerItemName(item: ArmoireOwnedItem): string {
  return getArmoireItemName(props.catalog, item.itemId, t)
}

function getContainerItemIconUrl(item: ArmoireOwnedItem): string {
  return getArmoireItemIconUrl(props.catalog, item.itemId)
}

function getContainerItemQuantity(item: ArmoireOwnedItem): number {
  return getOwnedItemQuantity(item)
}

function getContainerItemTitle(item: ArmoireOwnedItem): string {
  const quantity = getContainerItemQuantity(item)
  const quantityLabel = quantity > 1 ? ` x${quantity}` : ''
  const lines = [
    `${getContainerItemName(item)}${quantityLabel}`,
    formatArmoireText(t, textKeys.nsarmoireStorePieceLocation, {
      location: getArmoireContainerLabel(item, t)
    }),
    formatArmoireText(t, textKeys.nsarmoireStorePieceDye, {
      dyes: formatArmoireDyeNames(props.catalog, item.dyes, t)
    })
  ]
  const bindText = getContainerItemBindText(item)

  if (bindText) {
    lines.push(bindText)
  }

  return lines.join('\n')
}

function getContainerItemBindText(item: ArmoireOwnedItem): string | undefined {
  if (!canShowArmoireBindState(props.catalog, item)) {
    return undefined
  }

  return formatArmoireText(t, textKeys.nsarmoireStorePieceBind, {
    state:
      item.spiritbond > 0
        ? t(textKeys.nsarmoireStorePieceBound)
        : t(textKeys.nsarmoireStorePieceUnbound)
  })
}

function handleContainerToggle(key: string, event: Event): void {
  const target = event.currentTarget

  if (!(target instanceof HTMLDetailsElement)) {
    return
  }

  const nextKeys = new Set(expandedContainerKeys.value)

  if (target.open) {
    nextKeys.add(key)
  } else {
    nextKeys.delete(key)
  }

  expandedContainerKeys.value = nextKeys
}

function hideBrokenImage(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.visibility = 'hidden'
  }
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
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-distribution__row summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 34px;
  padding: 7px 10px;
  cursor: pointer;
  list-style: none;
}

.nsarmoire-distribution__row summary::-webkit-details-marker {
  display: none;
}

.nsarmoire-distribution__row summary::before {
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid var(--ns-color-text-muted);
  content: '';
}

.nsarmoire-distribution__row[open] summary::before {
  transform: rotate(90deg);
}

.nsarmoire-distribution__row summary span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-distribution__row summary strong {
  font-family: var(--ns-font-mono);
}

.nsarmoire-distribution__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 38px));
  gap: 6px;
  padding: 0 10px 10px;
}

.nsarmoire-distribution__item {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
}

.nsarmoire-distribution__item img,
.nsarmoire-distribution__item > span {
  display: block;
  width: 32px;
  height: 32px;
  image-rendering: auto;
  object-fit: cover;
}

.nsarmoire-distribution__item > span {
  background: var(--ns-color-surface);
}

.nsarmoire-distribution__item b {
  position: absolute;
  right: -1px;
  bottom: -1px;
  min-width: 15px;
  padding: 0 2px;
  border: 1px solid var(--ns-pixel-border);
  background: #ffffff;
  color: var(--ns-color-text);
  font-family: var(--ns-font-mono);
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
}
</style>
