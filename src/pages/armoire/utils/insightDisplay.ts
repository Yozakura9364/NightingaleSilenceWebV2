import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
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
  formatArmoireDyeSlotNames,
  formatArmoireDyeResetReasons,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'

export const ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT = 4

type Translate = (key: string) => string
type ItemLocationMapGetter = () => Map<number, string[]>

interface InsightDisplaySource {
  catalog: ArmoireCatalog
}

export interface ArmoireReadableItemView {
  key: string
  name: string
  context: string
  iconUrl: string
  tone?: ArmoireRiskLevel
  details?: ArmoireReadableItemDetailView[]
  relatedItems?: ArmoireReadableItemRelatedView[]
}

export interface ArmoireReadableItemDetailView {
  key: string
  title: string
  lines: string[]
}

export interface ArmoireReadableItemRelatedView {
  key: string
  name: string
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
  glamourSetSummary: string
  duplicateItemSummary: string
  duplicateSummary: string
  dyeSummary: string
}

export interface ArmoireDuplicateGroupView {
  key: string
  storageSpaceEntryCount: number
  names: string[]
  itemIds: number[]
  armoireItemIds: number[]
  iconUrl: string
}

export interface ArmoireIncompleteSetView {
  setItemId: number
  name: string
  pieceItemIds: number[]
  storedPieceItemIds: number[]
  missingPieceItemIds: number[]
  iconUrl: string
}

export interface ArmoireDuplicateItemView {
  itemId: number
  name: string
  ownedEntryCount: number
  iconUrl: string
  entries: ArmoireOwnedItem[]
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
    analysis.glamourSetProgress.incompleteStoredSetCount > 0
  ) {
    hints.push({
      key: 'sets',
      title: t(textKeys.nsarmoireRecommendationSets),
      message: text.glamourSetSummary
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

  if (analysis.dyeRisk.clearDyeRiskItemCount > 0) {
    hints.push({
      key: 'dyes',
      title: t(textKeys.nsarmoireRecommendationDyes),
      message: text.dyeSummary
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
    return formatText(textKeys.nsarmoireHintOwnedEntries, { count: item.ownedEntryCount })
  }

  function toDuplicateItemDetail(
    item: ArmoireOwnedItem,
    index: number
  ): ArmoireReadableItemDetailView {
    return {
      key: `duplicate-entry-${item.itemId}-${index}-${item.container}-${item.slotIndex ?? ''}`,
      title: formatText(textKeys.nsarmoireHintDuplicateEntryLocation, {
        index: index + 1,
        location: getArmoireContainerLabel(item, t)
      }),
      lines: [
        formatText(textKeys.nsarmoireHintDuplicateEntryDyes, {
          dyes: formatArmoireDyeSlotNames(source.catalog, item.dyes, t)
        })
      ]
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
  }

  function formatDyeRiskContext(
    item: Pick<ArmoireDyeRiskItem, 'itemId' | 'container' | 'containerName'> & {
      dyeNames: string
      resetReasonLabel: string
    }
  ): string {
    return [getArmoireContainerLabel(item, t), item.dyeNames, item.resetReasonLabel].join(' / ')
  }

  function toRelatedItem(itemId: number): ArmoireReadableItemRelatedView {
    return {
      key: `related-${itemId}`,
      name: getItemName(itemId),
      iconUrl: getItemIconUrl(itemId)
    }
  }

  function toSetPieceRelatedItem(
    itemId: number,
    storedPieceItemIds: Set<number>
  ): ArmoireReadableItemRelatedView {
    const isStored = storedPieceItemIds.has(itemId)
    const locations = getItemLocationsByItemId().get(itemId) ?? []
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

  function toTransferableItem(itemId: number): ArmoireReadableItemView {
    return {
      key: `cabinet-${itemId}`,
      name: getItemName(itemId),
      context: formatItemContext(itemId),
      iconUrl: getItemIconUrl(itemId)
    }
  }

  function toIncompleteSetView(set: ArmoireGlamourSetState): ArmoireIncompleteSetView {
    return {
      setItemId: set.setItemId,
      name: set.setName ?? getItemName(set.setItemId),
      pieceItemIds: set.pieceItemIds,
      storedPieceItemIds: set.storedPieceItemIds,
      missingPieceItemIds: set.missingPieceItemIds,
      iconUrl: getItemIconUrl(set.setItemId)
    }
  }

  function toIncompleteSetItem(set: ArmoireIncompleteSetView): ArmoireReadableItemView {
    const storedPieceItemIds = new Set(set.storedPieceItemIds)

    return {
      key: `set-${set.setItemId}`,
      name: set.name,
      context: formatSetContext(set),
      iconUrl: set.iconUrl,
      relatedItems: set.pieceItemIds.map((itemId) =>
        toSetPieceRelatedItem(itemId, storedPieceItemIds)
      )
    }
  }

  function toSetBucketLoosePieceItem(itemId: number): ArmoireReadableItemView {
    return {
      key: `set-bucket-piece-${itemId}`,
      name: getItemName(itemId),
      context: formatItemContext(itemId),
      iconUrl: getItemIconUrl(itemId)
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
      entries
    }
  }

  function toDuplicateItem(item: ArmoireDuplicateItemView): ArmoireReadableItemView {
    return {
      key: `duplicate-item-${item.itemId}`,
      name: item.name,
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
      iconUrl: firstItemId ? getItemIconUrl(firstItemId) : ''
    }
  }

  function toDuplicateModelItem(group: ArmoireDuplicateGroupView): ArmoireReadableItemView {
    return {
      key: `duplicate-model-${group.key}`,
      name: group.names.join(' / '),
      context: formatDuplicateGroupContext(group),
      iconUrl: group.iconUrl,
      relatedItems: group.itemIds.map(toRelatedItem)
    }
  }

  function toDyeRiskItem(item: ArmoireDyeRiskItem, index: number): ArmoireReadableItemView {
    const dyeNames = formatDyeNames(item.dyeIds)
    const resetReasonLabel = formatArmoireDyeResetReasons(item.resetReasons, t)

    return {
      key: `dye-${item.itemId}-${item.container}-${item.containerName ?? ''}-${index}`,
      name: getItemName(item.itemId),
      context: formatDyeRiskContext({ ...item, dyeNames, resetReasonLabel }),
      iconUrl: getItemIconUrl(item.itemId),
      tone: item.riskLevel
    }
  }

  return {
    formatText,
    formatItemPreview,
    toTransferableItem,
    toIncompleteSetView,
    toIncompleteSetItem,
    toSetBucketLoosePieceItem,
    toDuplicateItemView,
    toDuplicateItem,
    toDuplicateGroupView,
    toDuplicateModelItem,
    toDyeRiskItem
  }
}
