import { isDyedOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireDyeResetReason,
  ArmoireDyeRiskAnalysis,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem,
  ArmoireRiskLevel,
  ArmoireSnapshot
} from '@/lib/armoire/types'

function getDyedSlotCount(item: ArmoireOwnedItem): number {
  return item.dyes?.filter((dyeId) => dyeId > 0).length ?? 0
}

function getRiskLevel(clearsDyeOnStorage: boolean): ArmoireRiskLevel {
  return clearsDyeOnStorage ? 'danger' : 'warning'
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
  glamourSetPieceItemIds: Set<number>
): ArmoireDyeRiskItem {
  const dyeIds = item.dyes ?? [0, 0]
  const dyedSlotCount = getDyedSlotCount(item)
  const resetReasons = getDyeResetReasons(item, catalog, glamourSetPieceItemIds)
  const clearsDyeOnStorage = resetReasons.some((reason) => reason !== 'preservedStorage')

  return {
    itemId: item.itemId,
    container: item.container,
    containerName: item.containerName,
    dyeIds,
    dyedSlotCount,
    clearsDyeOnStorage,
    resetReasons,
    riskLevel: getRiskLevel(clearsDyeOnStorage)
  }
}

export function analyzeDyeRisk(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog
): ArmoireDyeRiskAnalysis {
  const glamourSetPieceItemIds = buildGlamourSetPieceItemIds(catalog)
  const items = snapshot.items
    .filter(isDyedOwnedItem)
    .map((item) => toDyeRiskItem(item, catalog, glamourSetPieceItemIds))
    .sort((left, right) => {
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
    highRiskItemCount: items.filter((item) => item.riskLevel === 'danger').length,
    items
  }
}
