import { computed, type Ref } from 'vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireOwnedItem,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import {
  formatArmoireDyeNames,
  formatArmoireItemId,
  formatArmoireText,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'

type Translate = (key: string) => string

export type ArmoireCatalogGridFilter =
  | 'all'
  | 'cabinet'
  | 'duplicateItems'
  | 'duplicateModels'
  | 'dyed'
  | 'glamourDresser'
  | 'armoire'

export type ArmoireCatalogGridSort = 'risk' | 'container' | 'name' | 'itemId'

export type ArmoireCatalogCardTagTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface ArmoireCatalogCardTagView {
  key: string
  label: string
  tone: ArmoireCatalogCardTagTone
}

export interface ArmoireCatalogCardView {
  key: string
  itemId: number
  name: string
  iconUrl: string
  iconFallbackLabel: string
  iconAlt: string
  itemIdLabel: string
  containerLabel: string
  quantityLabel: string
  dyeLabel: string
  tags: ArmoireCatalogCardTagView[]
  filterKeys: Set<ArmoireCatalogGridFilter>
  searchText: string
  sortPriority: number
}

export interface ArmoireCatalogGridFilterOption {
  key: ArmoireCatalogGridFilter
  label: string
  count: number
}

export interface ArmoireCatalogMetricView {
  key: string
  label: string
  value: number
  tone: 'neutral' | 'success' | 'warning' | 'danger'
}

interface CatalogGridSource {
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
}

function hasDye(item: ArmoireOwnedItem): boolean {
  return item.dyes?.some((dyeId) => dyeId > 0) === true
}

function getDyeTone(item: ArmoireOwnedItem): ArmoireCatalogCardTagTone {
  const dyedSlotCount = item.dyes?.filter((dyeId) => dyeId > 0).length ?? 0
  return dyedSlotCount > 1 ? 'danger' : 'warning'
}

function createEntryKey(item: ArmoireOwnedItem, index: number): string {
  return [
    item.itemId,
    item.container,
    item.containerName ?? '',
    item.slotIndex ?? '',
    index
  ].join(':')
}

function createIdSet(itemIds: number[]): Set<number> {
  return new Set(itemIds)
}

function createDuplicateItemIds(analysis: ArmoireSnapshotAnalysis | null): Set<number> {
  if (!analysis) {
    return new Set()
  }

  return createIdSet(analysis.duplicateItems.groups.map((group) => group.itemId))
}

function createDuplicateModelItemIds(analysis: ArmoireSnapshotAnalysis | null): Set<number> {
  if (!analysis || analysis.identicalModels.status !== 'ready') {
    return new Set()
  }

  return createIdSet(analysis.identicalModels.groups.flatMap((group) => group.ownedItemIds))
}

function createTransferableItemIds(analysis: ArmoireSnapshotAnalysis | null): Set<number> {
  if (!analysis || analysis.cabinetProgress.status !== 'ready') {
    return new Set()
  }

  return createIdSet(analysis.cabinetProgress.transferableItemIds)
}

function matchesContainer(item: ArmoireOwnedItem, container: ArmoireContainerKind): boolean {
  return item.container === container
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function getItemRiskPriority(item: ArmoireCatalogCardView): number {
  if (item.tags.some((tag) => tag.tone === 'danger')) {
    return 0
  }

  if (item.tags.some((tag) => tag.tone === 'warning')) {
    return 1
  }

  if (item.tags.some((tag) => tag.tone === 'success')) {
    return 2
  }

  return 3
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

function compareCatalogItems(
  left: ArmoireCatalogCardView,
  right: ArmoireCatalogCardView,
  sort: ArmoireCatalogGridSort
): number {
  if (sort === 'name') {
    return compareText(left.name, right.name) || left.itemId - right.itemId
  }

  if (sort === 'itemId') {
    return left.itemId - right.itemId || compareText(left.name, right.name)
  }

  if (sort === 'container') {
    return (
      compareText(left.containerLabel, right.containerLabel) ||
      left.sortPriority - right.sortPriority ||
      compareText(left.name, right.name) ||
      left.itemId - right.itemId
    )
  }

  return (
    left.sortPriority - right.sortPriority ||
    compareText(left.containerLabel, right.containerLabel) ||
    compareText(left.name, right.name) ||
    left.itemId - right.itemId
  )
}

export function useArmoireCatalogGrid(
  source: CatalogGridSource,
  selectedFilter: Ref<ArmoireCatalogGridFilter>,
  searchQuery: Ref<string>,
  selectedSort: Ref<ArmoireCatalogGridSort>,
  t: Translate
) {
  const transferableItemIds = computed(() => createTransferableItemIds(source.analysis))
  const duplicateItemIds = computed(() => createDuplicateItemIds(source.analysis))
  const duplicateModelItemIds = computed(() => createDuplicateModelItemIds(source.analysis))

  const items = computed<ArmoireCatalogCardView[]>(() =>
    (source.snapshot?.items ?? []).map((item, index) => {
      const filterKeys = new Set<ArmoireCatalogGridFilter>(['all'])
      const tags: ArmoireCatalogCardTagView[] = []

      if (transferableItemIds.value.has(item.itemId)) {
        filterKeys.add('cabinet')
        tags.push({
          key: 'cabinet',
          label: t(textKeys.nsarmoireRecommendationCabinet),
          tone: 'success'
        })
      }

      if (duplicateItemIds.value.has(item.itemId)) {
        filterKeys.add('duplicateItems')
        tags.push({
          key: 'duplicate-items',
          label: t(textKeys.nsarmoireRecommendationDuplicateItems),
          tone: 'warning'
        })
      }

      if (duplicateModelItemIds.value.has(item.itemId)) {
        filterKeys.add('duplicateModels')
        tags.push({
          key: 'duplicate-models',
          label: t(textKeys.nsarmoireRecommendationDuplicates),
          tone: 'warning'
        })
      }

      if (hasDye(item)) {
        filterKeys.add('dyed')
        tags.push({
          key: 'dyed',
          label: t(textKeys.nsarmoireRecommendationDyes),
          tone: getDyeTone(item)
        })
      }

      if (matchesContainer(item, 'glamourDresser')) {
        filterKeys.add('glamourDresser')
      }

      if (matchesContainer(item, 'armoire')) {
        filterKeys.add('armoire')
      }

      const name = getArmoireItemName(source.catalog, item.itemId, t)
      const itemIdLabel = formatArmoireItemId(item.itemId, t)
      const containerLabel = getArmoireContainerLabel(item, t)
      const quantityLabel = formatArmoireText(t, textKeys.nsarmoireCatalogQuantity, {
        count: item.quantity ?? 1
      })
      const dyeLabel = formatArmoireDyeNames(source.catalog, item.dyes, t)
      const card: ArmoireCatalogCardView = {
        key: createEntryKey(item, index),
        itemId: item.itemId,
        name,
        iconUrl: getArmoireItemIconUrl(source.catalog, item.itemId),
        iconFallbackLabel: t(textKeys.nsarmoireCatalogIconFallback),
        iconAlt: name,
        itemIdLabel,
        containerLabel,
        quantityLabel,
        dyeLabel,
        tags,
        filterKeys,
        searchText: normalizeSearchText(
          [name, itemIdLabel, item.itemId.toString(), containerLabel, quantityLabel, dyeLabel]
            .concat(tags.map((tag) => tag.label))
            .join(' ')
        ),
        sortPriority: 0
      }

      card.sortPriority = getItemRiskPriority(card)

      return card
    })
  )

  const filterMatchedItems = computed(() =>
    items.value.filter((item) => item.filterKeys.has(selectedFilter.value))
  )

  const filteredItems = computed(() =>
    filterMatchedItems.value
      .filter((item) => {
        const query = normalizeSearchText(searchQuery.value)

        return query ? item.searchText.includes(query) : true
      })
      .slice()
      .sort((left, right) => compareCatalogItems(left, right, selectedSort.value))
  )

  const filterOptions = computed<ArmoireCatalogGridFilterOption[]>(() => {
    const filters: Array<{ key: ArmoireCatalogGridFilter; labelKey: string }> = [
      { key: 'all', labelKey: textKeys.nsarmoireCatalogFilterAll },
      { key: 'cabinet', labelKey: textKeys.nsarmoireCatalogFilterCabinet },
      { key: 'duplicateItems', labelKey: textKeys.nsarmoireCatalogFilterDuplicateItems },
      { key: 'duplicateModels', labelKey: textKeys.nsarmoireCatalogFilterDuplicateModels },
      { key: 'dyed', labelKey: textKeys.nsarmoireCatalogFilterDyed },
      { key: 'glamourDresser', labelKey: textKeys.nsarmoireCatalogFilterGlamourDresser },
      { key: 'armoire', labelKey: textKeys.nsarmoireCatalogFilterArmoire }
    ]

    return filters.map((filter) => ({
      key: filter.key,
      label: t(filter.labelKey),
      count: items.value.filter((item) => item.filterKeys.has(filter.key)).length
    }))
  })

  const summary = computed(() =>
    formatArmoireText(t, textKeys.nsarmoireCatalogGridSummary, {
      shown: filteredItems.value.length,
      total: filterMatchedItems.value.length
    })
  )

  const sortOptions = computed(() => [
    { key: 'risk' as const, label: t(textKeys.nsarmoireCatalogSortRisk) },
    { key: 'container' as const, label: t(textKeys.nsarmoireCatalogSortContainer) },
    { key: 'name' as const, label: t(textKeys.nsarmoireCatalogSortName) },
    { key: 'itemId' as const, label: t(textKeys.nsarmoireCatalogSortItemId) }
  ])

  const resultMetrics = computed<ArmoireCatalogMetricView[]>(() => {
    const currentItems = filteredItems.value
    const duplicateCount = currentItems.filter(
      (item) => item.filterKeys.has('duplicateItems') || item.filterKeys.has('duplicateModels')
    ).length
    const dyedCount = currentItems.filter((item) => item.filterKeys.has('dyed')).length
    const actionItemCount = currentItems.filter((item) => item.tags.length > 0).length

    return [
      {
        key: 'visible',
        label: t(textKeys.nsarmoireCatalogMetricVisible),
        value: currentItems.length,
        tone: 'neutral'
      },
      {
        key: 'action-items',
        label: t(textKeys.nsarmoireCatalogMetricActionItems),
        value: actionItemCount,
        tone: actionItemCount > 0 ? 'warning' : 'success'
      },
      {
        key: 'dyed',
        label: t(textKeys.nsarmoireCatalogMetricDyed),
        value: dyedCount,
        tone: dyedCount > 0 ? 'warning' : 'success'
      },
      {
        key: 'duplicates',
        label: t(textKeys.nsarmoireCatalogMetricDuplicates),
        value: duplicateCount,
        tone: duplicateCount > 0 ? 'warning' : 'success'
      }
    ]
  })

  return {
    filterOptions,
    filteredItems,
    resultMetrics,
    sortOptions,
    summary,
    totalItemCount: computed(() => items.value.length)
  }
}
