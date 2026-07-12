import { textKeys } from '@/config/site'
import { getEffectiveOwnedItemDyes } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireCrafterGathererReplicaAnalysis,
  ArmoireCrafterGathererReplicaEntry,
  ArmoireDuplicateItemGroupState,
  ArmoireDyeRiskItem,
  ArmoireGlamourSetState,
  ArmoireIdenticalModelGroupState,
  ArmoireOwnedItem,
  ArmoireRiskLevel,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import {
  formatArmoireText,
  formatArmoireDyeNames,
  formatArmoireDyeResetReasons,
  getArmoireDyeSlotViews,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import type { ArmoireDyeSlotView } from '@/pages/armoire/utils/itemDisplay'

export const ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT = 4

type Translate = (key: string) => string
type ItemLocationMapGetter = () => Map<number, string[]>
type ArmoireReadableItemTone = ArmoireRiskLevel | 'muted'

interface InsightDisplaySource {
  catalog: ArmoireCatalog
}

export interface ArmoireReadableItemView {
  key: string
  itemId: number
  name: string
  wikiItemName?: string
  context: string
  iconUrl: string
  tone?: ArmoireReadableItemTone
  details?: ArmoireReadableItemDetailView[]
  relatedItems?: ArmoireReadableItemRelatedView[]
}

export interface ArmoireReadableItemDetailView {
  key: string
  title: string
  lines: string[]
  dyeLine?: ArmoireReadableItemDyeLineView
}

export interface ArmoireReadableItemDyeLineView {
  label: string
  slots: ArmoireDyeSlotView[]
  suffix?: string
}

export interface ArmoireReadableItemRelatedView {
  key: string
  itemId: number
  name: string
  wikiItemName?: string
  iconUrl: string
  status?: 'stored' | 'unstored'
  statusLabel?: string
}

export interface ArmoireActionHintView {
  key: string
  title: string
  message: string
}

interface ArmoireActionHintText {
  cabinetSummary: string
  tradableSummary: string
  replicaSummary: string
  duplicateItemSummary: string
  duplicateSummary: string
}

export interface ArmoireDuplicateGroupView {
  key: string
  storageSpaceEntryCount: number
  names: string[]
  itemIds: number[]
  armoireItemIds: number[]
  iconUrl: string
  isStoreRelated: boolean
}

export interface ArmoireIncompleteSetView {
  setItemId: number
  name: string
  pieceItemIds: number[]
  storedPieceItemIds: number[]
  storedByBucketPieceItemIds: number[]
  missingPieceItemIds: number[]
  iconUrl: string
}

export interface ArmoireDuplicateItemView {
  itemId: number
  name: string
  ownedEntryCount: number
  iconUrl: string
  entries: ArmoireOwnedItem[]
  isStoreRelated: boolean
}

export function buildArmoireActionHints(
  analysis: ArmoireSnapshotAnalysis,
  t: Translate,
  text: ArmoireActionHintText,
  hasPendingCatalogChecks = false
): ArmoireActionHintView[] {
  const hints: ArmoireActionHintView[] = []

  if (
    analysis.cabinetProgress.status === 'ready' &&
    analysis.cabinetProgress.transferableItemIds.length > 0
  ) {
    hints.push({
      key: 'cabinet',
      title: t(textKeys.nsarmoireRecommendationCabinet),
      message: text.cabinetSummary
    })
  }

  if (
    analysis.glamourSetProgress.status === 'ready' &&
    analysis.glamourSetProgress.bucketStorableLoosePieceItemIds.length > 0
  ) {
    hints.push({
      key: 'set-pieces',
      title: t(textKeys.nsarmoireRecommendationSetPieces),
      message: t(textKeys.nsarmoireHintSetPiecesSummary)
    })
  }

  if (
    analysis.tradableItems.status === 'ready' &&
    analysis.tradableItems.unboundTradableEntryCount > 0
  ) {
    hints.push({
      key: 'tradable-items',
      title: t(textKeys.nsarmoireRecommendationTradableItems),
      message: text.tradableSummary
    })
  }

  if (
    analysis.crafterGathererReplicas.status === 'ready' &&
    analysis.crafterGathererReplicas.entryCount > 0
  ) {
    hints.push({
      key: 'crafter-gatherer-replicas',
      title: t(textKeys.nsarmoireRecommendationCrafterGathererReplicas),
      message: text.replicaSummary
    })
  }

  if (analysis.duplicateItems.duplicateItemCount > 0) {
    hints.push({
      key: 'duplicate-items',
      title: t(textKeys.nsarmoireRecommendationDuplicateItems),
      message: text.duplicateItemSummary
    })
  }

  if (
    analysis.identicalModels.status === 'ready' &&
    analysis.identicalModels.duplicateGroupCount > 0
  ) {
    hints.push({
      key: 'duplicates',
      title: t(textKeys.nsarmoireRecommendationDuplicates),
      message: text.duplicateSummary
    })
  }

  if (hasPendingCatalogChecks) {
    hints.push({
      key: 'catalog-pending',
      title: t(textKeys.nsarmoireHintCatalogPendingTitle),
      message: t(textKeys.nsarmoireHintCatalogPendingMessage)
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
}

export function createArmoireInsightDisplay(
  source: InsightDisplaySource,
  t: Translate,
  getItemLocationsByItemId: ItemLocationMapGetter,
  getStorageSpaceItemLocationsByItemId: ItemLocationMapGetter = getItemLocationsByItemId
) {
  function formatText(key: string, values: Record<string, string | number>): string {
    return formatArmoireText(t, key, values)
  }

  function getItemName(itemId: number): string {
    return getArmoireItemName(source.catalog, itemId, t)
  }

  function getItemIconUrl(itemId: number): string {
    return getArmoireItemIconUrl(source.catalog, itemId)
  }

  function formatDyeNames(dyeIds: [number, number]): string {
    return formatArmoireDyeNames(source.catalog, dyeIds, t)
  }

  function getDyeName(dyeId: number): string {
    return source.catalog.dyes[dyeId]?.name ?? `#${dyeId}`
  }

  function getItemDyeSlotCount(itemId: number): number | undefined {
    return source.catalog.items[itemId]?.dyeSlotCount
  }

  function getValuableDyeSlotViews(item: ArmoireDyeRiskItem): ArmoireDyeSlotView[] {
    const valuableDyeIds = new Set(item.valuableDyeIds.map(String))

    return getArmoireDyeSlotViews(source.catalog, item.dyeIds, getItemDyeSlotCount(item.itemId), t)
      .filter((slot) => {
        const keyParts = slot.key.split('-')
        return valuableDyeIds.has(keyParts[keyParts.length - 1] ?? '')
      })
  }

  function getValuableDyeDeferredDetails(
    itemId: number,
    valuableDyeItem?: ArmoireDyeRiskItem
  ): ArmoireReadableItemDetailView[] | undefined {
    const valuableDyeSlots = valuableDyeItem ? getValuableDyeSlotViews(valuableDyeItem) : []

    if (valuableDyeSlots.length === 0) {
      return undefined
    }

    return [
      {
        key: `valuable-dye-${itemId}`,
        title: '',
        lines: [],
        dyeLine: {
          label: t(textKeys.nsarmoireHintDyed),
          slots: valuableDyeSlots,
          suffix: t(textKeys.nsarmoireHintValuableDyeDeferredSuffix)
        }
      }
    ]
  }

  function formatItemLocations(itemId: number): string {
    const locations = getItemLocationsByItemId().get(itemId)

    if (!locations?.length) {
      return ''
    }

    return formatText(textKeys.nsarmoireHintCurrentLocation, {
      locations: locations.join(' / ')
    })
  }

  function formatItemContext(itemId: number): string {
    return formatItemLocations(itemId)
  }

  function formatItemPreview(itemIds: number[]): string {
    const names = itemIds.slice(0, ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT).map(getItemName).join(' / ')

    if (itemIds.length <= ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT) {
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

  function formatSetContext(set: ArmoireIncompleteSetView): string {
    return [formatMissingPieces(set.missingPieceItemIds), formatItemLocations(set.setItemId)]
      .filter(Boolean)
      .join(' / ')
  }

  function formatDuplicateItemContext(item: ArmoireDuplicateItemView): string {
    return [
      formatText(textKeys.nsarmoireHintOwnedEntries, { count: item.ownedEntryCount }),
      item.isStoreRelated ? t(textKeys.nsarmoireHintStoreRelated) : ''
    ]
      .filter(Boolean)
      .join(' / ')
  }

  function toDuplicateItemDetail(
    item: ArmoireOwnedItem,
    index: number
  ): ArmoireReadableItemDetailView {
    const dyeSlots = getArmoireDyeSlotViews(
      source.catalog,
      getEffectiveOwnedItemDyes(item),
      getItemDyeSlotCount(item.itemId),
      t
    )
    const dyeLine =
      dyeSlots.length > 0
        ? {
            label: formatText(textKeys.nsarmoireHintDuplicateEntryDyes, { dyes: '' }),
            slots: dyeSlots
          }
        : undefined

    return {
      key: `duplicate-entry-${item.itemId}-${index}-${item.container}-${item.slotIndex ?? ''}`,
      title: formatText(textKeys.nsarmoireHintDuplicateEntryLocation, {
        index: index + 1,
        location: getArmoireContainerLabel(item, t)
      }),
      lines: [],
      dyeLine
    }
  }

  function formatDuplicateGroupContext(group: ArmoireDuplicateGroupView): string {
    const itemLocations = group.itemIds
      .map((itemId) => {
        const locations = getStorageSpaceItemLocationsByItemId().get(itemId)

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

    return itemLocations
      ? [
          itemLocations,
          group.isStoreRelated ? t(textKeys.nsarmoireHintStoreRelated) : ''
        ]
          .filter(Boolean)
          .join(' / ')
      : group.isStoreRelated
        ? t(textKeys.nsarmoireHintStoreRelated)
        : ''
  }

  function formatDyeRiskContext(
    item: Pick<ArmoireDyeRiskItem, 'itemId' | 'container' | 'containerName'> & {
      dyeNames: string
      resetReasonLabel: string
    }
  ): string {
    return [getArmoireContainerLabel(item, t), item.dyeNames, item.resetReasonLabel]
      .filter(Boolean)
      .join(' / ')
  }

  function toRelatedItem(itemId: number): ArmoireReadableItemRelatedView {
    const name = getItemName(itemId)

    return {
      key: `related-${itemId}`,
      itemId,
      name,
      wikiItemName: name,
      iconUrl: getItemIconUrl(itemId)
    }
  }

  function formatRelatedItemLocation(itemId: number): string {
    const locations =
      getStorageSpaceItemLocationsByItemId().get(itemId) ?? getItemLocationsByItemId().get(itemId)

    if (!locations?.length) {
      return ''
    }

    return formatText(textKeys.nsarmoireHintCurrentLocation, {
      locations: locations.join(' / ')
    })
  }

  function toDuplicateModelRelatedItem(itemId: number): ArmoireReadableItemRelatedView {
    return {
      ...toRelatedItem(itemId),
      key: `duplicate-model-related-${itemId}`,
      statusLabel: formatRelatedItemLocation(itemId)
    }
  }

  function toSetPieceRelatedItem(
    itemId: number,
    storedPieceItemIds: Set<number>,
    storedByBucketPieceItemIds: Set<number>
  ): ArmoireReadableItemRelatedView {
    const isStored = storedPieceItemIds.has(itemId)
    const isStoredByBucket = storedByBucketPieceItemIds.has(itemId)
    const locations = isStoredByBucket ? [] : getItemLocationsByItemId().get(itemId) ?? []
    const statusLabel =
      isStored && locations.length > 0
        ? formatText(textKeys.nsarmoireStatusFoundOutsideSet, {
            locations: locations.join(' / ')
          })
        : t(isStored ? textKeys.nsarmoireStatusStored : textKeys.nsarmoireStatusUnstored)

    return {
      ...toRelatedItem(itemId),
      key: `set-piece-${itemId}`,
      status: isStored ? 'stored' : 'unstored',
      statusLabel
    }
  }

  function toTransferableItem(
    itemId: number,
    valuableDyeItem?: ArmoireDyeRiskItem
  ): ArmoireReadableItemView {
    const name = getItemName(itemId)

    return {
      key: `cabinet-${itemId}`,
      itemId,
      name,
      wikiItemName: name,
      context: formatItemContext(itemId),
      iconUrl: getItemIconUrl(itemId),
      tone: valuableDyeItem ? 'muted' : undefined,
      details: getValuableDyeDeferredDetails(itemId, valuableDyeItem)
    }
  }

  function toIncompleteSetView(set: ArmoireGlamourSetState): ArmoireIncompleteSetView {
    return {
      setItemId: set.setItemId,
      name: set.setName ?? getItemName(set.setItemId),
      pieceItemIds: set.pieceItemIds,
      storedPieceItemIds: set.storedPieceItemIds,
      storedByBucketPieceItemIds: set.storedByBucketPieceItemIds,
      missingPieceItemIds: set.missingPieceItemIds,
      iconUrl: getItemIconUrl(set.setItemId)
    }
  }

  function toIncompleteSetItem(set: ArmoireIncompleteSetView): ArmoireReadableItemView {
    const storedPieceItemIds = new Set(set.storedPieceItemIds)
    const storedByBucketPieceItemIds = new Set(set.storedByBucketPieceItemIds)

    return {
      key: `set-${set.setItemId}`,
      itemId: set.setItemId,
      name: set.name,
      wikiItemName: set.name,
      context: formatSetContext(set),
      iconUrl: set.iconUrl,
      relatedItems: set.pieceItemIds.map((itemId) =>
        toSetPieceRelatedItem(itemId, storedPieceItemIds, storedByBucketPieceItemIds)
      )
    }
  }

  function toSetBucketLoosePieceItem(
    itemId: number,
    valuableDyeItem?: ArmoireDyeRiskItem
  ): ArmoireReadableItemView {
    const name = getItemName(itemId)

    return {
      key: `set-bucket-piece-${itemId}`,
      itemId,
      name,
      wikiItemName: name,
      context: formatItemContext(itemId),
      iconUrl: getItemIconUrl(itemId),
      tone: valuableDyeItem ? 'muted' : undefined,
      details: getValuableDyeDeferredDetails(itemId, valuableDyeItem)
    }
  }

  function toTradableItem(item: ArmoireOwnedItem, index: number): ArmoireReadableItemView {
    const name = getItemName(item.itemId)

    return {
      key: `tradable-${item.itemId}-${item.container}-${item.containerName ?? ''}-${item.slotIndex ?? index}`,
      itemId: item.itemId,
      name,
      wikiItemName: name,
      context: [
        getArmoireContainerLabel(item, t),
        t(textKeys.nsarmoireHintTradableUnbound)
      ].join(' / '),
      iconUrl: getItemIconUrl(item.itemId)
    }
  }

  function formatReplicaRecycleSummary(analysis: ArmoireCrafterGathererReplicaAnalysis): string {
    if (analysis.entryCount === 0) {
      return t(textKeys.nsarmoireHintReplicaRecycleNone)
    }

    const returnedDyes =
      analysis.returnedDyes.length > 0
        ? analysis.returnedDyes
            .map((dye) => `${getDyeName(dye.dyeId)} x${dye.count}`)
            .join(' / ')
        : t(textKeys.nsarmoireHintReplicaRecycleNoReturnedDyes)

    return formatText(textKeys.nsarmoireHintReplicaRecycleSummary, {
      count: analysis.totalQuantity,
      vouchers: analysis.voucherCount,
      dyes: returnedDyes
    })
  }

  function toCrafterGathererReplicaItem(
    entry: ArmoireCrafterGathererReplicaEntry,
    index: number
  ): ArmoireReadableItemView {
    const name = getItemName(entry.item.itemId)
    const dyeSlots = getArmoireDyeSlotViews(
      source.catalog,
      entry.dyeIds,
      getItemDyeSlotCount(entry.item.itemId),
      t
    )
    const returnedDyeSlots = dyeSlots.filter((slot) => {
      const keyParts = slot.key.split('-')
      const dyeId = Number(keyParts[keyParts.length - 1] ?? 0)
      return entry.returnedDyeIds.includes(dyeId)
    })
    const details: ArmoireReadableItemDetailView[] = [
      {
        key: `replica-reward-${entry.item.itemId}-${index}`,
        title: '',
        lines: [
          formatText(textKeys.nsarmoireHintReplicaRecycleReward, {
            count: entry.voucherCount
          })
        ]
      }
    ]

    if (returnedDyeSlots.length > 0) {
      details.push({
        key: `replica-dyes-${entry.item.itemId}-${index}`,
        title: '',
        lines: [],
        dyeLine: {
          label: t(textKeys.nsarmoireHintReplicaRecycleDyes),
          slots: returnedDyeSlots
        }
      })
    }

    return {
      key: `crafter-gatherer-replica-${entry.item.itemId}-${entry.item.container}-${entry.item.containerName ?? ''}-${entry.item.slotIndex ?? index}`,
      itemId: entry.item.itemId,
      name,
      wikiItemName: name,
      context: getArmoireContainerLabel(entry.item, t),
      iconUrl: getItemIconUrl(entry.item.itemId),
      details
    }
  }

  function toDuplicateItemView(
    group: ArmoireDuplicateItemGroupState,
    entries: ArmoireOwnedItem[] = []
  ): ArmoireDuplicateItemView {
    return {
      itemId: group.itemId,
      name: getItemName(group.itemId),
      ownedEntryCount: group.ownedEntryCount,
      iconUrl: getItemIconUrl(group.itemId),
      entries,
      isStoreRelated: group.isStoreRelated
    }
  }

  function toDuplicateItem(item: ArmoireDuplicateItemView): ArmoireReadableItemView {
    return {
      key: `duplicate-item-${item.itemId}`,
      itemId: item.itemId,
      name: item.name,
      wikiItemName: item.name,
      context: formatDuplicateItemContext(item),
      iconUrl: item.iconUrl,
      details: item.entries.map(toDuplicateItemDetail)
    }
  }

  function toDuplicateGroupView(group: ArmoireIdenticalModelGroupState): ArmoireDuplicateGroupView {
    const firstItemId = group.storageSpaceItemIds[0]

    return {
      key: group.key,
      storageSpaceEntryCount: group.storageSpaceEntryCount,
      names: group.storageSpaceItemIds.map(getItemName),
      itemIds: group.storageSpaceItemIds,
      armoireItemIds: group.armoireItemIds,
      iconUrl: firstItemId ? getItemIconUrl(firstItemId) : '',
      isStoreRelated: group.isStoreRelated
    }
  }

  function toDuplicateModelItem(group: ArmoireDuplicateGroupView): ArmoireReadableItemView {
    return {
      key: `duplicate-model-${group.key}`,
      itemId: group.itemIds[0] ?? 0,
      name: group.names.join(' / '),
      wikiItemName: group.names[0],
      context: formatDuplicateGroupContext(group),
      iconUrl: group.iconUrl,
      relatedItems: group.itemIds.map(toDuplicateModelRelatedItem)
    }
  }

  function toDyeRiskItem(item: ArmoireDyeRiskItem, index: number): ArmoireReadableItemView {
    const name = getItemName(item.itemId)
    const dyeNames = formatDyeNames(item.dyeIds)
    const resetReasonLabel = formatArmoireDyeResetReasons(item.resetReasons, t)

    return {
      key: `dye-${item.itemId}-${item.container}-${item.containerName ?? ''}-${index}`,
      itemId: item.itemId,
      name,
      wikiItemName: name,
      context: formatDyeRiskContext({ ...item, dyeNames, resetReasonLabel }),
      iconUrl: getItemIconUrl(item.itemId),
      tone: item.riskLevel
    }
  }

  return {
    formatText,
    formatItemPreview,
    formatReplicaRecycleSummary,
    toTransferableItem,
    toIncompleteSetView,
    toIncompleteSetItem,
    toSetBucketLoosePieceItem,
    toTradableItem,
    toCrafterGathererReplicaItem,
    toDuplicateItemView,
    toDuplicateItem,
    toDuplicateGroupView,
    toDuplicateModelItem,
    toDyeRiskItem
  }
}
