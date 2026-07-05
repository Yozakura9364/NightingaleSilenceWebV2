import { isDyedOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import { getArmoireDyeValueCategories } from '@/lib/armoire/dyeValue'
import type {
  ArmoireCatalog,
  ArmoireDyeRiskOptions,
  ArmoireDyeResetReason,
  ArmoireDyeRiskAnalysis,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem,
  ArmoireRiskLevel,
  ArmoireSnapshot
} from '@/lib/armoire/types'
import { DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES } from '@/lib/armoire/types'

function getDyedSlotCount(item: ArmoireOwnedItem): number {
  return item.dyes?.filter((dyeId) => dyeId > 0).length ?? 0
}

function getRiskLevel(clearsDyeOnStorage: boolean, hasValuableDye: boolean): ArmoireRiskLevel {
  return clearsDyeOnStorage && hasValuableDye ? 'danger' : 'warning'
}

function buildGlamourSetPieceItemIds(catalog: ArmoireCatalog): Set<number> {
  const itemIds = new Set<number>()

  for (const set of catalog.glamourSetItems) {
    for (const itemId of set.pieceItemIds) {
      if (itemId > 0) {
        itemIds.add(itemId)
      }
    }
  }

  return itemIds
}

function isCabinetStorable(item: ArmoireOwnedItem, catalog: ArmoireCatalog): boolean {
  return (
    item.container === 'armoire' ||
    catalog.cabinetItemIds.includes(item.itemId) ||
    catalog.items[item.itemId]?.isCabinetStorable === true
  )
}

function getDyeResetReasons(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog,
  glamourSetPieceItemIds: Set<number>
): ArmoireDyeResetReason[] {
  const reasons: ArmoireDyeResetReason[] = []

  if (isCabinetStorable(item, catalog)) {
    reasons.push('cabinetStorage')
  }

  if (glamourSetPieceItemIds.has(item.itemId)) {
    reasons.push('glamourSetBasket')
  }

  return reasons.length > 0 ? reasons : ['preservedStorage']
}

function toDyeRiskItem(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog,
  glamourSetPieceItemIds: Set<number>,
  valuableDyeCategories: Set<string>
): ArmoireDyeRiskItem {
  const dyeIds = item.dyes ?? [0, 0]
  const dyedSlotCount = getDyedSlotCount(item)
  const resetReasons = getDyeResetReasons(item, catalog, glamourSetPieceItemIds)
  const clearsDyeOnStorage = resetReasons.some((reason) => reason !== 'preservedStorage')
  const itemDyeCategories = getArmoireDyeValueCategories(dyeIds, catalog)
  const matchedDyeCategories = itemDyeCategories.filter((category) =>
    valuableDyeCategories.has(category)
  )
  const matchedDyeCategorySet = new Set(matchedDyeCategories)
  const valuableDyeIds = dyeIds.filter((dyeId) => {
    if (dyeId <= 0) {
      return false
    }

    return getArmoireDyeValueCategories([dyeId], catalog).some((category) =>
      valuableDyeCategories.has(category)
    )
  })
  const hasValuableDye = valuableDyeIds.length > 0

  return {
    itemId: item.itemId,
    container: item.container,
    containerName: item.containerName,
    dyeIds,
    dyedSlotCount,
    valuableDyeIds,
    valuableDyeCategories: Array.from(matchedDyeCategorySet),
    hasValuableDye,
    clearsDyeOnStorage,
    resetReasons,
    riskLevel: getRiskLevel(clearsDyeOnStorage, hasValuableDye)
  }
}

export function analyzeDyeRisk(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog,
  options: ArmoireDyeRiskOptions = {}
): ArmoireDyeRiskAnalysis {
  const glamourSetPieceItemIds = buildGlamourSetPieceItemIds(catalog)
  const selectedValuableDyeCategories = [
    ...(options.valuableDyeCategories ?? DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES)
  ]
  const valuableDyeCategories = new Set<string>(selectedValuableDyeCategories)
  const items = snapshot.items
    .filter(isDyedOwnedItem)
    .map((item) => toDyeRiskItem(item, catalog, glamourSetPieceItemIds, valuableDyeCategories))
    .sort((left, right) => {
      if (Number(right.riskLevel === 'danger') !== Number(left.riskLevel === 'danger')) {
        return Number(right.riskLevel === 'danger') - Number(left.riskLevel === 'danger')
      }

      if (Number(right.clearsDyeOnStorage) !== Number(left.clearsDyeOnStorage)) {
        return Number(right.clearsDyeOnStorage) - Number(left.clearsDyeOnStorage)
      }

      if (right.dyedSlotCount !== left.dyedSlotCount) {
        return right.dyedSlotCount - left.dyedSlotCount
      }

      return left.itemId - right.itemId
    })

  return {
    riskItemCount: items.length,
    clearDyeRiskItemCount: items.filter((item) => item.clearsDyeOnStorage).length,
    valuableDyeRiskItemCount: items.filter((item) => item.hasValuableDye).length,
    valuableClearDyeRiskItemCount: items.filter(
      (item) => item.clearsDyeOnStorage && item.hasValuableDye
    ).length,
    highRiskItemCount: items.filter((item) => item.riskLevel === 'danger').length,
    selectedValuableDyeCategories,
    items
  }
}
