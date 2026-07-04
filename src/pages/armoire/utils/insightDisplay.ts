import { textKeys } from '@/config/site'
import { getArmoireIconUrl } from '@/lib/armoire/catalog'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireDuplicateItemGroupState,
  ArmoireDyeRiskItem,
  ArmoireIdenticalModelGroupState,
  ArmoireOwnedItem,
  ArmoireRiskLevel,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

export const ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT = 4

type Translate = (key: string) => string

interface InsightDisplaySource {
  catalog: ArmoireCatalog
}

export interface ArmoireReadableItemView {
  key: string
  name: string
  context: string
  iconUrl: string
  tone?: ArmoireRiskLevel
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
  ownedEntryCount: number
  names: string[]
  itemIds: number[]
  iconUrl: string
}

export interface ArmoireIncompleteSetView {
  setItemId: number
  name: string
  missingPieceItemIds: number[]
  iconUrl: string
}

export interface ArmoireDuplicateItemView {
  itemId: number
  name: string
  ownedEntryCount: number
  iconUrl: string
}

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}

export function getArmoireContainerLabel(
  item: Pick<ArmoireDyeRiskItem | ArmoireOwnedItem, 'container' | 'containerName'>,
  t: Translate
): string {
  const baseLabel = t(containerLabelKeys[item.container])
  return item.containerName ? `${baseLabel} / ${item.containerName}` : baseLabel
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

  if (analysis.dyeRisk.riskItemCount > 0) {
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
  getItemLocationsByItemId: () => Map<number, string[]>
) {
  function formatText(key: string, values: Record<string, string | number>): string {
    return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
  }

  function formatItemId(itemId: number): string {
    return `${t(textKeys.nsarmoireItemId)} ${itemId}`
  }

  function getItemName(itemId: number): string {
    return source.catalog.items[itemId]?.name ?? formatItemId(itemId)
  }

  function getItemIconUrl(itemId: number): string {
    return getArmoireIconUrl(source.catalog.items[itemId]?.iconId)
  }

  function getDyeName(dyeId: number): string {
    return source.catalog.dyes[dyeId]?.name ?? String(dyeId)
  }

  function formatDyeNames(dyeIds: [number, number]): string {
    const names = dyeIds.filter((dyeId) => dyeId > 0).map(getDyeName)
    return names.length > 0 ? names.join(' / ') : t(textKeys.nsarmoireNoDyeRisk)
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
    return [formatItemLocations(itemId), formatItemId(itemId)].filter(Boolean).join(' / ')
  }

  function formatItemPreview(itemIds: number[]): string {
    const names = itemIds
      .slice(0, ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT)
      .map(getItemName)
      .join(' / ')

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
    return [
      formatMissingPieces(set.missingPieceItemIds),
      formatItemLocations(set.setItemId),
      formatItemId(set.setItemId)
    ]
      .filter(Boolean)
      .join(' / ')
  }

  function formatDuplicateItemContext(item: ArmoireDuplicateItemView): string {
    return [
      formatText(textKeys.nsarmoireHintOwnedEntries, { count: item.ownedEntryCount }),
      formatItemLocations(item.itemId),
      formatItemId(item.itemId)
    ]
      .filter(Boolean)
      .join(' / ')
  }

  function formatDuplicateGroupContext(group: ArmoireDuplicateGroupView): string {
    const itemLocations = group.itemIds
      .map((itemId) => {
        const locations = getItemLocationsByItemId().get(itemId)

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
    return [getArmoireContainerLabel(item, t), item.dyeNames, formatItemId(item.itemId)].join(
      ' / '
    )
  }

  function toTransferableItem(itemId: number): ArmoireReadableItemView {
    return {
      key: `cabinet-${itemId}`,
      name: getItemName(itemId),
      context: formatItemContext(itemId),
      iconUrl: getItemIconUrl(itemId)
    }
  }

  function toIncompleteSetView(set: {
    setItemId: number
    setName?: string
    missingPieceItemIds: number[]
  }): ArmoireIncompleteSetView {
    return {
      setItemId: set.setItemId,
      name: set.setName ?? getItemName(set.setItemId),
      missingPieceItemIds: set.missingPieceItemIds,
      iconUrl: getItemIconUrl(set.setItemId)
    }
  }

  function toIncompleteSetItem(set: ArmoireIncompleteSetView): ArmoireReadableItemView {
    return {
      key: `set-${set.setItemId}`,
      name: set.name,
      context: formatSetContext(set),
      iconUrl: set.iconUrl
    }
  }

  function toDuplicateItemView(group: ArmoireDuplicateItemGroupState): ArmoireDuplicateItemView {
    return {
      itemId: group.itemId,
      name: getItemName(group.itemId),
      ownedEntryCount: group.ownedEntryCount,
      iconUrl: getItemIconUrl(group.itemId)
    }
  }

  function toDuplicateItem(item: ArmoireDuplicateItemView): ArmoireReadableItemView {
    return {
      key: `duplicate-item-${item.itemId}`,
      name: item.name,
      context: formatDuplicateItemContext(item),
      iconUrl: item.iconUrl
    }
  }

  function toDuplicateGroupView(
    group: ArmoireIdenticalModelGroupState
  ): ArmoireDuplicateGroupView {
    const firstItemId = group.ownedItemIds[0]

    return {
      key: group.key,
      ownedEntryCount: group.ownedEntryCount,
      names: group.ownedItemIds.map(getItemName),
      itemIds: group.ownedItemIds,
      iconUrl: firstItemId ? getItemIconUrl(firstItemId) : ''
    }
  }

  function toDuplicateModelItem(group: ArmoireDuplicateGroupView): ArmoireReadableItemView {
    return {
      key: `duplicate-model-${group.key}`,
      name: group.names.join(' / '),
      context: formatDuplicateGroupContext(group),
      iconUrl: group.iconUrl
    }
  }

  function toDyeRiskItem(item: ArmoireDyeRiskItem, index: number): ArmoireReadableItemView {
    const dyeNames = formatDyeNames(item.dyeIds)

    return {
      key: `dye-${item.itemId}-${item.container}-${item.containerName ?? ''}-${index}`,
      name: getItemName(item.itemId),
      context: formatDyeRiskContext({ ...item, dyeNames }),
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
    toDuplicateItemView,
    toDuplicateItem,
    toDuplicateGroupView,
    toDuplicateModelItem,
    toDyeRiskItem
  }
}
