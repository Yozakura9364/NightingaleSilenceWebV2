import { getEffectiveOwnedItemDyes, getOwnedItemQuantity } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireCrafterGathererReplicaAnalysis,
  ArmoireOwnedIndex,
  ArmoireOwnedItem,
  ArmoireReplicaDyeReturn
} from '@/lib/armoire/types'

const REPLICA_RECYCLE_VOUCHERS_PER_ITEM = 4

function hasCrafterGathererReplicaCatalog(catalog: ArmoireCatalog): boolean {
  return (catalog.crafterGathererReplicaItemIds?.length ?? 0) > 0
}

function getReturnedDyeIds(item: ArmoireOwnedItem): number[] {
  return getEffectiveOwnedItemDyes(item).filter((dyeId) => dyeId > 0)
}

function countReturnedDyes(items: ArmoireOwnedItem[]): ArmoireReplicaDyeReturn[] {
  const counts = new Map<number, number>()

  for (const item of items) {
    const quantity = getOwnedItemQuantity(item)

    for (const dyeId of getReturnedDyeIds(item)) {
      counts.set(dyeId, (counts.get(dyeId) ?? 0) + quantity)
    }
  }

  return Array.from(counts.entries())
    .map(([dyeId, count]) => ({ dyeId, count }))
    .sort((left, right) => left.dyeId - right.dyeId)
}

export function analyzeCrafterGathererReplicas(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog
): ArmoireCrafterGathererReplicaAnalysis {
  if (!hasCrafterGathererReplicaCatalog(catalog)) {
    return {
      status: 'missingCatalog',
      entryCount: 0,
      totalQuantity: 0,
      voucherCount: 0,
      returnedDyes: [],
      items: []
    }
  }

  const replicaItemIds = new Set(catalog.crafterGathererReplicaItemIds)
  const ownedReplicas = index.entries
    .filter((item) => replicaItemIds.has(item.itemId))
    .sort((left, right) => {
      if (left.itemId !== right.itemId) {
        return left.itemId - right.itemId
      }

      return (left.slotIndex ?? 0) - (right.slotIndex ?? 0)
    })
  const totalQuantity = ownedReplicas.reduce(
    (total, item) => total + getOwnedItemQuantity(item),
    0
  )

  return {
    status: 'ready',
    entryCount: ownedReplicas.length,
    totalQuantity,
    voucherCount: totalQuantity * REPLICA_RECYCLE_VOUCHERS_PER_ITEM,
    returnedDyes: countReturnedDyes(ownedReplicas),
    items: ownedReplicas.map((item) => ({
      item,
      voucherCount: getOwnedItemQuantity(item) * REPLICA_RECYCLE_VOUCHERS_PER_ITEM,
      dyeIds: getEffectiveOwnedItemDyes(item),
      returnedDyeIds: getReturnedDyeIds(item)
    }))
  }
}
