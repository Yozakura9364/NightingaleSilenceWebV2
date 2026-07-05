import { computed, type Ref } from 'vue'
import { textKeys } from '@/config/site'
import { isArmoireAppearanceItem } from '@/lib/armoire/filterSnapshot'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireOwnedItem,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import {
  formatArmoireDyeNames,
  formatArmoireText,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'

type Translate = (key: string) => string

export type ArmoireCatalogGridFilter =
  'all' | 'cabinet' | 'duplicateItems' | 'duplicateModels' | 'glamourDresser' | 'armoire'

export type ArmoireCatalogGridSort = 'risk' | 'container' | 'name'

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

interface CatalogGridSource {
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
}

interface ArmoireCatalogItemGroup {
  itemId: number
  entries: ArmoireOwnedItem[]
}

function createCatalogItemGroups(items: ArmoireOwnedItem[]): ArmoireCatalogItemGroup[] {
  const groups = new Map<number, ArmoireOwnedItem[]>()

  for (const item of items) {
    const group = groups.get(item.itemId)

    if (group) {
      group.push(item)
    } else {
      groups.set(item.itemId, [item])
    }
  }

  return Array.from(groups, ([itemId, entries]) => ({ itemId, entries }))
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

  return createIdSet(analysis.identicalModels.groups.flatMap((group) => group.storageSpaceItemIds))
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

function getTotalQuantity(items: ArmoireOwnedItem[]): number {
  return items.reduce((total, item) => total + (item.quantity ?? 1), 0)
}

function getUniqueLabels(labels: string[]): string[] {
  return Array.from(new Set(labels.filter(Boolean)))
}

function getGroupContainerLabel(items: ArmoireOwnedItem[], t: Translate): string {
  return getUniqueLabels(items.map((item) => getArmoireContainerLabel(item, t))).join(' / ')
}

function getGroupDyeLabel(
  catalog: ArmoireCatalog,
  items: ArmoireOwnedItem[],
  t: Translate
): string {
  return getUniqueLabels(items.map((item) => formatArmoireDyeNames(catalog, item.dyes, t))).join(
    ' / '
  )
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
    createCatalogItemGroups(
      (source.snapshot?.items ?? []).filter((item) => isArmoireAppearanceItem(source.catalog, item))
    ).map((group) => {
      const filterKeys = new Set<ArmoireCatalogGridFilter>(['all'])
      const tags: ArmoireCatalogCardTagView[] = []
      const groupItems = group.entries

      if (transferableItemIds.value.has(group.itemId)) {
        filterKeys.add('cabinet')
        tags.push({
          key: 'cabinet',
          label: t(textKeys.nsarmoireRecommendationCabinet),
          tone: 'success'
        })
      }

      if (duplicateItemIds.value.has(group.itemId)) {
        filterKeys.add('duplicateItems')
        tags.push({
          key: 'duplicate-items',
          label: t(textKeys.nsarmoireRecommendationDuplicateItems),
          tone: 'warning'
        })
      }

      if (duplicateModelItemIds.value.has(group.itemId)) {
        filterKeys.add('duplicateModels')
        tags.push({
          key: 'duplicate-models',
          label: t(textKeys.nsarmoireRecommendationDuplicates),
          tone: 'warning'
        })
      }

      if (groupItems.some((item) => matchesContainer(item, 'glamourDresser'))) {
        filterKeys.add('glamourDresser')
      }

      if (groupItems.some((item) => matchesContainer(item, 'armoire'))) {
        filterKeys.add('armoire')
      }

      const name = getArmoireItemName(source.catalog, group.itemId, t)
      const containerLabel = getGroupContainerLabel(groupItems, t)
      const quantityLabel = formatArmoireText(t, textKeys.nsarmoireCatalogQuantity, {
        count: getTotalQuantity(groupItems)
      })
      const dyeLabel = getGroupDyeLabel(source.catalog, groupItems, t)
      const card: ArmoireCatalogCardView = {
        key: `catalog-item-${group.itemId}`,
        itemId: group.itemId,
        name,
        iconUrl: getArmoireItemIconUrl(source.catalog, group.itemId),
        iconFallbackLabel: t(textKeys.nsarmoireCatalogIconFallback),
        iconAlt: name,
        containerLabel,
        quantityLabel,
        dyeLabel,
        tags,
        filterKeys,
        searchText: normalizeSearchText(
          [name, containerLabel, quantityLabel, dyeLabel]
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
    { key: 'name' as const, label: t(textKeys.nsarmoireCatalogSortName) }
  ])

  return {
    filterOptions,
    filteredItems,
    sortOptions,
    summary,
    totalItemCount: computed(() => items.value.length)
  }
}
