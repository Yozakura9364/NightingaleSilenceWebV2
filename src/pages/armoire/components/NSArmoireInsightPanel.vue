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

    <div v-else class="nsarmoire-insight-stack">
      <article class="nsarmoire-action-card nsarmoire-action-card--primary">
        <div class="nsarmoire-action-card__header">
          <h3>{{ t(textKeys.nsarmoireActionHints) }}</h3>
        </div>

        <ul class="nsarmoire-hint-list">
          <li v-for="hint in actionHints" :key="hint.key">
            <strong>{{ hint.title }}</strong>
            <span>{{ hint.message }}</span>
          </li>
        </ul>
      </article>

      <article class="nsarmoire-action-card">
        <div class="nsarmoire-action-card__header">
          <h3>{{ t(textKeys.nsarmoireRecommendationCabinet) }}</h3>
          <strong v-if="analysis.cabinetProgress.status === 'ready'">
            {{ analysis.cabinetProgress.transferableItemIds.length }}
          </strong>
        </div>

        <AppStatus
          v-if="analysis.cabinetProgress.status === 'missingCatalog'"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />

        <template v-else>
          <p class="nsarmoire-action-card__summary">
            {{ cabinetSummary }}
          </p>
          <ul v-if="hasTransferableItems" class="nsarmoire-readable-list">
            <li v-for="item in transferableItems" :key="item.itemId" class="nsarmoire-readable-list__item">
              <span class="nsarmoire-readable-list__icon" aria-hidden="true">
                <img
                  v-if="item.iconUrl"
                  :src="item.iconUrl"
                  alt=""
                  loading="eager"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  @error="hideBrokenIcon"
                />
              </span>
              <span class="nsarmoire-readable-list__body">
                <span class="nsarmoire-readable-list__name">{{ item.name }}</span>
                <small>{{ formatItemContext(item.itemId) }}</small>
              </span>
            </li>
          </ul>
        </template>
      </article>

      <article class="nsarmoire-action-card">
        <div class="nsarmoire-action-card__header">
          <h3>{{ t(textKeys.nsarmoireRecommendationSets) }}</h3>
          <strong v-if="analysis.glamourSetProgress.status === 'ready'">
            {{ analysis.glamourSetProgress.incompleteStoredSetCount }}
          </strong>
        </div>

        <AppStatus
          v-if="analysis.glamourSetProgress.status === 'missingCatalog'"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />

        <template v-else>
          <p class="nsarmoire-action-card__summary">
            {{ glamourSetSummary }}
          </p>
          <ul v-if="hasIncompleteSets" class="nsarmoire-readable-list">
            <li v-for="set in incompleteSets" :key="set.setItemId" class="nsarmoire-readable-list__item">
              <span class="nsarmoire-readable-list__icon" aria-hidden="true">
                <img
                  v-if="set.iconUrl"
                  :src="set.iconUrl"
                  alt=""
                  loading="eager"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  @error="hideBrokenIcon"
                />
              </span>
              <span class="nsarmoire-readable-list__body">
                <span class="nsarmoire-readable-list__name">{{ set.name }}</span>
                <small>{{ formatSetContext(set) }}</small>
              </span>
            </li>
          </ul>
        </template>
      </article>

      <article class="nsarmoire-action-card">
        <div class="nsarmoire-action-card__header">
          <h3>{{ t(textKeys.nsarmoireRecommendationDuplicateItems) }}</h3>
          <strong>{{ analysis.duplicateItems.duplicateItemCount }}</strong>
        </div>

        <p class="nsarmoire-action-card__summary">
          {{ duplicateItemSummary }}
        </p>
        <ul v-if="hasDuplicateItemGroups" class="nsarmoire-readable-list">
          <li
            v-for="item in duplicateItemGroups"
            :key="item.itemId"
            class="nsarmoire-readable-list__item"
          >
            <span class="nsarmoire-readable-list__icon" aria-hidden="true">
              <img
                v-if="item.iconUrl"
                :src="item.iconUrl"
                alt=""
                loading="eager"
                decoding="async"
                referrerpolicy="no-referrer"
                @error="hideBrokenIcon"
              />
            </span>
            <span class="nsarmoire-readable-list__body">
              <span class="nsarmoire-readable-list__name">{{ item.name }}</span>
              <small>{{ formatDuplicateItemContext(item) }}</small>
            </span>
          </li>
        </ul>
      </article>

      <article class="nsarmoire-action-card">
        <div class="nsarmoire-action-card__header">
          <h3>{{ t(textKeys.nsarmoireRecommendationDuplicates) }}</h3>
          <strong v-if="analysis.identicalModels.status === 'ready'">
            {{ analysis.identicalModels.duplicateGroupCount }}
          </strong>
        </div>

        <AppStatus
          v-if="analysis.identicalModels.status === 'missingCatalog'"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />

        <template v-else>
          <p class="nsarmoire-action-card__summary">
            {{ duplicateSummary }}
          </p>
          <ul v-if="hasDuplicateGroups" class="nsarmoire-readable-list">
            <li v-for="group in duplicateGroups" :key="group.key" class="nsarmoire-readable-list__item">
              <span class="nsarmoire-readable-list__icon" aria-hidden="true">
                <img
                  v-if="group.iconUrl"
                  :src="group.iconUrl"
                  alt=""
                  loading="eager"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  @error="hideBrokenIcon"
                />
              </span>
              <span class="nsarmoire-readable-list__body">
                <span class="nsarmoire-readable-list__name">{{ group.names.join(' / ') }}</span>
                <small>{{ formatDuplicateGroupContext(group) }}</small>
              </span>
            </li>
          </ul>
        </template>
      </article>

      <article class="nsarmoire-action-card">
        <div class="nsarmoire-action-card__header">
          <h3>{{ t(textKeys.nsarmoireRecommendationDyes) }}</h3>
          <strong>{{ analysis.dyeRisk.riskItemCount }}</strong>
        </div>

        <p class="nsarmoire-action-card__summary">
          {{ dyeSummary }}
        </p>
        <ul v-if="hasDyeRiskItems" class="nsarmoire-readable-list">
          <li
            v-for="item in dyeRiskItems"
            :key="`${item.itemId}-${item.container}-${item.containerName ?? ''}`"
            class="nsarmoire-readable-list__item"
            :class="`nsarmoire-readable-list__item--${item.riskLevel}`"
          >
            <span class="nsarmoire-readable-list__icon" aria-hidden="true">
              <img
                v-if="item.iconUrl"
                :src="item.iconUrl"
                alt=""
                loading="eager"
                decoding="async"
                referrerpolicy="no-referrer"
                @error="hideBrokenIcon"
              />
            </span>
            <span class="nsarmoire-readable-list__body">
              <span class="nsarmoire-readable-list__name">{{ item.name }}</span>
              <small>{{ formatDyeRiskContext(item) }}</small>
            </span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { getArmoireIconUrl } from '@/lib/armoire/catalog'
import { useLocale } from '@/stores/locale'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireDuplicateItemGroupState,
  ArmoireDyeRiskItem,
  ArmoireIdenticalModelGroupState,
  ArmoireOwnedItem,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

const props = defineProps<{
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
}>()

const { t } = useLocale()
const listPreviewLimit = 4

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}

interface DuplicateGroupView {
  key: string
  ownedEntryCount: number
  names: string[]
  itemIds: number[]
  iconUrl: string
}

interface IncompleteSetView {
  setItemId: number
  name: string
  missingPieceItemIds: number[]
  iconUrl: string
}

interface DuplicateItemView {
  itemId: number
  name: string
  ownedEntryCount: number
  totalQuantity: number
  iconUrl: string
}

const transferableItems = computed(() => {
  if (!props.analysis || props.analysis.cabinetProgress.status !== 'ready') {
    return []
  }

  return props.analysis.cabinetProgress.transferableItemIds
    .slice(0, listPreviewLimit)
    .map((itemId) => ({
      itemId,
      name: getItemName(itemId),
      iconUrl: getItemIconUrl(itemId)
    }))
})

const incompleteSets = computed(() => {
  if (!props.analysis || props.analysis.glamourSetProgress.status !== 'ready') {
    return []
  }

  return props.analysis.glamourSetProgress.sets
    .filter((set) => set.isStoredAsSet && set.missingPieceItemIds.length > 0)
    .slice(0, listPreviewLimit)
    .map((set) => ({
      setItemId: set.setItemId,
      name: set.setName ?? getItemName(set.setItemId),
      missingPieceItemIds: set.missingPieceItemIds,
      iconUrl: getItemIconUrl(set.setItemId)
    }))
})

const duplicateItemGroups = computed(() => {
  if (!props.analysis) {
    return []
  }

  return props.analysis.duplicateItems.groups
    .slice(0, listPreviewLimit)
    .map((group) => toDuplicateItemView(group))
})

const duplicateGroups = computed(() => {
  if (!props.analysis || props.analysis.identicalModels.status !== 'ready') {
    return []
  }

  return props.analysis.identicalModels.groups
    .slice(0, listPreviewLimit)
    .map((group) => toDuplicateGroupView(group))
})

const dyeRiskItems = computed(() => {
  if (!props.analysis) {
    return []
  }

  return props.analysis.dyeRisk.items.slice(0, listPreviewLimit).map((item) => ({
    itemId: item.itemId,
    name: getItemName(item.itemId),
    iconUrl: getItemIconUrl(item.itemId),
    container: item.container,
    containerName: item.containerName,
    containerLabel: getContainerLabel(item),
    dyeNames: formatDyeNames(item.dyeIds),
    riskLevel: item.riskLevel
  }))
})

const itemLocationsByItemId = computed(() => {
  const locations = new Map<number, string[]>()

  for (const item of props.snapshot?.items ?? []) {
    const label = getContainerLabel(item)
    const itemLocations = locations.get(item.itemId) ?? []

    if (!itemLocations.includes(label)) {
      itemLocations.push(label)
    }

    locations.set(item.itemId, itemLocations)
  }

  return locations
})

const hasTransferableItems = computed(() => transferableItems.value.length > 0)
const hasIncompleteSets = computed(() => incompleteSets.value.length > 0)
const hasDuplicateItemGroups = computed(() => duplicateItemGroups.value.length > 0)
const hasDuplicateGroups = computed(() => duplicateGroups.value.length > 0)
const hasDyeRiskItems = computed(() => dyeRiskItems.value.length > 0)

const cabinetSummary = computed(() => {
  if (!props.analysis || props.analysis.cabinetProgress.status !== 'ready') {
    return ''
  }

  const count = props.analysis.cabinetProgress.transferableItemIds.length

  if (count === 0) {
    return t(textKeys.nsarmoireHintCabinetNone)
  }

  return formatText(textKeys.nsarmoireHintCabinetSummary, {
    count,
    items: formatItemPreview(props.analysis.cabinetProgress.transferableItemIds)
  })
})

const glamourSetSummary = computed(() => {
  if (!props.analysis || props.analysis.glamourSetProgress.status !== 'ready') {
    return ''
  }

  const count = props.analysis.glamourSetProgress.incompleteStoredSetCount

  if (count === 0) {
    return t(textKeys.nsarmoireHintSetsNone)
  }

  return formatText(textKeys.nsarmoireHintSetsSummary, {
    count,
    items: incompleteSets.value.map((set) => set.name).join(' / ')
  })
})

const duplicateItemSummary = computed(() => {
  if (!props.analysis) {
    return ''
  }

  const count = props.analysis.duplicateItems.duplicateItemCount

  if (count === 0) {
    return t(textKeys.nsarmoireHintDuplicateItemsNone)
  }

  return formatText(textKeys.nsarmoireHintDuplicateItemsSummary, {
    count,
    items: formatItemPreview(props.analysis.duplicateItems.groups.map((group) => group.itemId))
  })
})

const duplicateSummary = computed(() => {
  if (!props.analysis || props.analysis.identicalModels.status !== 'ready') {
    return ''
  }

  const count = props.analysis.identicalModels.duplicateGroupCount

  if (count === 0) {
    return t(textKeys.nsarmoireHintDuplicatesNone)
  }

  return formatText(textKeys.nsarmoireHintDuplicatesSummary, {
    count,
    items: duplicateGroups.value.map((group) => group.names.join(' / ')).join('；')
  })
})

const dyeSummary = computed(() => {
  if (!props.analysis) {
    return ''
  }

  const count = props.analysis.dyeRisk.riskItemCount

  if (count === 0) {
    return t(textKeys.nsarmoireNoDyeRisk)
  }

  return formatText(textKeys.nsarmoireHintDyesSummary, {
    count,
    items: dyeRiskItems.value.map((item) => item.name).join(' / ')
  })
})

const actionHints = computed(() => {
  if (!props.analysis) {
    return []
  }

  const hints: { key: string; title: string; message: string }[] = []

  if (
    props.analysis.cabinetProgress.status === 'ready' &&
    props.analysis.cabinetProgress.transferableItemIds.length > 0
  ) {
    hints.push({
      key: 'cabinet',
      title: t(textKeys.nsarmoireRecommendationCabinet),
      message: cabinetSummary.value
    })
  }

  if (
    props.analysis.glamourSetProgress.status === 'ready' &&
    props.analysis.glamourSetProgress.incompleteStoredSetCount > 0
  ) {
    hints.push({
      key: 'sets',
      title: t(textKeys.nsarmoireRecommendationSets),
      message: glamourSetSummary.value
    })
  }

  if (props.analysis.duplicateItems.duplicateItemCount > 0) {
    hints.push({
      key: 'duplicate-items',
      title: t(textKeys.nsarmoireRecommendationDuplicateItems),
      message: duplicateItemSummary.value
    })
  }

  if (
    props.analysis.identicalModels.status === 'ready' &&
    props.analysis.identicalModels.duplicateGroupCount > 0
  ) {
    hints.push({
      key: 'duplicates',
      title: t(textKeys.nsarmoireRecommendationDuplicates),
      message: duplicateSummary.value
    })
  }

  if (props.analysis.dyeRisk.riskItemCount > 0) {
    hints.push({
      key: 'dyes',
      title: t(textKeys.nsarmoireRecommendationDyes),
      message: dyeSummary.value
    })
  }

  if (hints.length === 0) {
    hints.push({
      key: 'empty',
      title: t(textKeys.nsarmoireHintAllClearTitle),
      message: t(textKeys.nsarmoireHintAllClearMessage)
    })
  }

  return hints
})

function formatText(key: string, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
}

function formatItemId(itemId: number): string {
  return `${t(textKeys.nsarmoireItemId)} ${itemId}`
}

function formatItemContext(itemId: number): string {
  return [formatItemLocations(itemId), formatItemId(itemId)].filter(Boolean).join(' / ')
}

function getItemName(itemId: number): string {
  return props.catalog.items[itemId]?.name ?? formatItemId(itemId)
}

function getItemIconUrl(itemId: number): string {
  return getArmoireIconUrl(props.catalog.items[itemId]?.iconId)
}

function getDyeName(dyeId: number): string {
  return props.catalog.dyes[dyeId]?.name ?? String(dyeId)
}

function formatDyeNames(dyeIds: [number, number]): string {
  const names = dyeIds.filter((dyeId) => dyeId > 0).map(getDyeName)
  return names.length > 0 ? names.join(' / ') : t(textKeys.nsarmoireNoDyeRisk)
}

function formatItemPreview(itemIds: number[]): string {
  const names = itemIds.slice(0, listPreviewLimit).map(getItemName).join(' / ')

  if (itemIds.length <= listPreviewLimit) {
    return names
  }

  return formatText(textKeys.nsarmoireHintMoreItems, {
    items: names,
    count: itemIds.length
  })
}

function formatMissingPieces(itemIds: number[]): string {
  return formatText(textKeys.nsarmoireHintMissingPieces, {
    items: formatItemPreview(itemIds)
  })
}

function formatItemLocations(itemId: number): string {
  const locations = itemLocationsByItemId.value.get(itemId)

  if (!locations?.length) {
    return ''
  }

  return formatText(textKeys.nsarmoireHintCurrentLocation, {
    locations: locations.join(' / ')
  })
}

function formatSetContext(set: IncompleteSetView): string {
  return [
    formatMissingPieces(set.missingPieceItemIds),
    formatItemLocations(set.setItemId),
    formatItemId(set.setItemId)
  ]
    .filter(Boolean)
    .join(' / ')
}

function formatDuplicateItemContext(item: DuplicateItemView): string {
  return [
    formatText(textKeys.nsarmoireHintOwnedEntries, { count: item.ownedEntryCount }),
    formatItemLocations(item.itemId),
    formatItemId(item.itemId)
  ]
    .filter(Boolean)
    .join(' / ')
}

function formatDuplicateGroupContext(group: DuplicateGroupView): string {
  const itemLocations = group.itemIds
    .map((itemId) => {
      const locations = itemLocationsByItemId.value.get(itemId)

      if (!locations?.length) {
        return ''
      }

      return formatText(textKeys.nsarmoireHintNamedLocations, {
        item: getItemName(itemId),
        locations: locations.join(' / ')
      })
    })
    .filter(Boolean)
    .join('；')

  return [
    formatText(textKeys.nsarmoireHintOwnedEntries, { count: group.ownedEntryCount }),
    itemLocations
  ]
    .filter(Boolean)
    .join(' / ')
}

function formatDyeRiskContext(
  item: Pick<ArmoireDyeRiskItem, 'itemId' | 'container' | 'containerName'> & {
    dyeNames: string
  }
): string {
  return [getContainerLabel(item), item.dyeNames, formatItemId(item.itemId)].join(' / ')
}

function getContainerLabel(
  item: Pick<ArmoireDyeRiskItem | ArmoireOwnedItem, 'container' | 'containerName'>
): string {
  const baseLabel = t(containerLabelKeys[item.container])
  return item.containerName ? `${baseLabel} / ${item.containerName}` : baseLabel
}

function toDuplicateGroupView(group: ArmoireIdenticalModelGroupState): DuplicateGroupView {
  const firstItemId = group.ownedItemIds[0]

  return {
    key: group.key,
    ownedEntryCount: group.ownedEntryCount,
    names: group.ownedItemIds.map(getItemName),
    itemIds: group.ownedItemIds,
    iconUrl: firstItemId ? getItemIconUrl(firstItemId) : ''
  }
}

function toDuplicateItemView(group: ArmoireDuplicateItemGroupState): DuplicateItemView {
  return {
    itemId: group.itemId,
    name: getItemName(group.itemId),
    ownedEntryCount: group.ownedEntryCount,
    totalQuantity: group.totalQuantity,
    iconUrl: getItemIconUrl(group.itemId)
  }
}

function hideBrokenIcon(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.display = 'none'
    image.parentElement?.classList.add('nsarmoire-readable-list__icon--empty')
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
.nsarmoire-action-card h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-weight: 950;
}

.nsarmoire-panel h2 {
  font-size: 16px;
}

.nsarmoire-action-card h3 {
  font-size: 14px;
}

.nsarmoire-insight-stack {
  display: grid;
  gap: 10px;
}

.nsarmoire-action-card {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-action-card--primary {
  background: var(--ns-pixel-window-bg);
}

.nsarmoire-action-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.nsarmoire-action-card__header strong {
  font-family: var(--ns-font-decorative);
  font-size: 20px;
}

.nsarmoire-action-card__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-hint-list,
.nsarmoire-readable-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-hint-list li {
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-hint-list strong {
  font-family: var(--ns-font-decorative);
  font-size: 13px;
}

.nsarmoire-hint-list span {
  line-height: 1.7;
}

.nsarmoire-readable-list__item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-readable-list__item--danger {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-readable-list__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
  image-rendering: auto;
}

.nsarmoire-readable-list__icon img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.nsarmoire-readable-list__icon--empty {
  display: none;
}

.nsarmoire-readable-list__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.nsarmoire-readable-list__name,
.nsarmoire-readable-list small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-readable-list__name {
  font-weight: 900;
}

.nsarmoire-readable-list small {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 12px;
  line-height: 1.5;
}
</style>
