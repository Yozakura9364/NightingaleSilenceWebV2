import { isDyedOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireDyeRiskAnalysis,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem,
  ArmoireRiskLevel,
  ArmoireSnapshot
} from '@/lib/armoire/types'

function getDyedSlotCount(item: ArmoireOwnedItem): number {
  return item.dyes?.filter((dyeId) => dyeId > 0).length ?? 0
}

function getRiskLevel(dyedSlotCount: number): ArmoireRiskLevel {
  return dyedSlotCount > 1 ? 'danger' : 'warning'
}

function toDyeRiskItem(item: ArmoireOwnedItem): ArmoireDyeRiskItem {
  const dyeIds = item.dyes ?? [0, 0]
  const dyedSlotCount = getDyedSlotCount(item)

  return {
    itemId: item.itemId,
    container: item.container,
    containerName: item.containerName,
    dyeIds,
    dyedSlotCount,
    riskLevel: getRiskLevel(dyedSlotCount)
  }
}

export function analyzeDyeRisk(snapshot: ArmoireSnapshot): ArmoireDyeRiskAnalysis {
  const items = snapshot.items
    .filter(isDyedOwnedItem)
    .map(toDyeRiskItem)
    .sort((left, right) => {
      if (right.dyedSlotCount !== left.dyedSlotCount) {
        return right.dyedSlotCount - left.dyedSlotCount
      }

      return left.itemId - right.itemId
    })

  return {
    riskItemCount: items.length,
    highRiskItemCount: items.filter((item) => item.riskLevel === 'danger').length,
    items
  }
}
