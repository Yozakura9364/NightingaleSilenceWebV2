import { getEffectiveOwnedItemDyes, isDyedOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import { getArmoireDyeValueCategory } from '@/lib/armoire/dyeValue'
import type {
  ArmoireCatalog,
  ArmoireDyeValueCategory,
  ArmoireDyeRiskOptions,
  ArmoireDyeResetReason,
  ArmoireDyeRiskAnalysis,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem,
  ArmoireRiskLevel,
  ArmoireSnapshot
} from '@/lib/armoire/types'
import { DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES } from '@/lib/armoire/types'
import { DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS } from '@/lib/armoire/types'

interface DyeRiskContext {
  cabinetItemIds: ReadonlySet<number>
  glamourSetPieceItemIds: ReadonlySet<number>
  valuableDyeCategories: ReadonlySet<ArmoireDyeValueCategory>
  valuableDyeIds: ReadonlySet<number>
}

function getDyedSlotCount(item: ArmoireOwnedItem): number {
  return getEffectiveOwnedItemDyes(item).filter((dyeId) => dyeId > 0).length
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

function isCabinetStorable(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog,
  cabinetItemIds: ReadonlySet<number>
): boolean {
  return (
    item.container === 'armoire' ||
    cabinetItemIds.has(item.itemId) ||
    catalog.items[item.itemId]?.isCabinetStorable === true
  )
}

function getDyeResetReasons(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog,
  context: DyeRiskContext
): ArmoireDyeResetReason[] {
  const reasons: ArmoireDyeResetReason[] = []

  if (isCabinetStorable(item, catalog, context.cabinetItemIds)) {
    reasons.push('cabinetStorage')
  }

  if (context.glamourSetPieceItemIds.has(item.itemId)) {
    reasons.push('glamourSetBasket')
  }

  return reasons.length > 0 ? reasons : ['preservedStorage']
}

function getDyeRiskCategories(
  dyeIds: readonly number[],
  catalog: ArmoireCatalog,
  valuableDyeCategories: ReadonlySet<ArmoireDyeValueCategory>,
  selectedValuableDyeIds: ReadonlySet<number>
): Pick<ArmoireDyeRiskItem, 'valuableDyeIds' | 'valuableDyeCategories' | 'hasValuableDye'> {
  const matchedDyeCategories = new Set<ArmoireDyeValueCategory>()
  const matchedValuableDyeIds: number[] = []

  for (const dyeId of dyeIds) {
    if (dyeId <= 0) {
      continue
    }

    const category = getArmoireDyeValueCategory(dyeId, catalog)

    if (
      !valuableDyeCategories.has(category as ArmoireDyeValueCategory) &&
      !selectedValuableDyeIds.has(dyeId)
    ) {
      continue
    }

    if (category) {
      matchedDyeCategories.add(category)
    }
    matchedValuableDyeIds.push(dyeId)
  }

  return {
    valuableDyeIds: matchedValuableDyeIds,
    valuableDyeCategories: Array.from(matchedDyeCategories),
    hasValuableDye: matchedValuableDyeIds.length > 0
  }
}

function toDyeRiskItem(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog,
  context: DyeRiskContext
): ArmoireDyeRiskItem {
  const dyeIds = getEffectiveOwnedItemDyes(item)
  const dyedSlotCount = getDyedSlotCount(item)
  const resetReasons = getDyeResetReasons(item, catalog, context)
  const clearsDyeOnStorage = resetReasons.some((reason) => reason !== 'preservedStorage')
  const dyeRiskCategories = getDyeRiskCategories(
    dyeIds,
    catalog,
    context.valuableDyeCategories,
    context.valuableDyeIds
  )

  return {
    itemId: item.itemId,
    container: item.container,
    containerName: item.containerName,
    dyeIds,
    dyedSlotCount,
    ...dyeRiskCategories,
    clearsDyeOnStorage,
    resetReasons,
    riskLevel: getRiskLevel(clearsDyeOnStorage, dyeRiskCategories.hasValuableDye)
  }
}

export function analyzeDyeRisk(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog,
  options: ArmoireDyeRiskOptions = {}
): ArmoireDyeRiskAnalysis {
  const selectedValuableDyeCategories = [
    ...(options.valuableDyeCategories ?? DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES)
  ]
  const selectedValuableDyeIds = [...(options.valuableDyeIds ?? DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS)]
  const dyedItems = snapshot.items.filter(isDyedOwnedItem)

  if (dyedItems.length === 0) {
    return {
      riskItemCount: 0,
      clearDyeRiskItemCount: 0,
      valuableDyeRiskItemCount: 0,
      valuableClearDyeRiskItemCount: 0,
      highRiskItemCount: 0,
      selectedValuableDyeCategories,
      selectedValuableDyeIds,
      items: []
    }
  }

  const context: DyeRiskContext = {
    cabinetItemIds: new Set(catalog.cabinetItemIds),
    glamourSetPieceItemIds: buildGlamourSetPieceItemIds(catalog),
    valuableDyeCategories: new Set(selectedValuableDyeCategories),
    valuableDyeIds: new Set(selectedValuableDyeIds)
  }
  const items = dyedItems
    .map((item) => toDyeRiskItem(item, catalog, context))
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
    selectedValuableDyeIds,
    items
  }
}
