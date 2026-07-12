import { buildOwnedIndex } from '@/lib/armoire/buildOwnedIndex'
import { analyzeGlamourSets } from '@/lib/armoire/analyzeGlamourSets'
import { filterArmoireSnapshotForActionableItems } from '@/lib/armoire/filterSnapshot'
import {
  getStoreEquivalentOwnedItems,
  getStoreEquivalentItemIdsForOwnership
} from '@/lib/armoire/storeItemEquivalents'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireOwnedIndex,
  ArmoireStoreCatalog,
  ArmoireStoreOutfit,
  ArmoireStoreOutfitAnalysis,
  ArmoireStoreOutfitState,
  ArmoireStoreOutfitStatus
} from '@/lib/armoire/types'

function getUniqueItemIds(itemIds: number[]): number[] {
  return Array.from(new Set(itemIds))
}

function getOutfitStatus(
  outfit: ArmoireStoreOutfit,
  ownedItemIds: number[]
): ArmoireStoreOutfitStatus {
  if (outfit.needsMapping || outfit.itemIds.length === 0) {
    return 'needsMapping'
  }

  if (ownedItemIds.length === outfit.itemIds.length) {
    return 'complete'
  }

  if (ownedItemIds.length > 0) {
    return 'partial'
  }

  return 'missing'
}

function createStoredByBucketItemIds(
  catalog: ArmoireCatalog,
  index: ArmoireOwnedIndex
): Set<number> {
  return new Set(
    analyzeGlamourSets(index, catalog).sets.flatMap((set) => set.storedByBucketPieceItemIds)
  )
}

function getStoredByBucketEquivalentItemIds(
  storedByBucketItemIds: ReadonlySet<number>,
  itemId: number
): number[] {
  return getStoreEquivalentItemIdsForOwnership(itemId).filter((equivalentItemId) =>
    storedByBucketItemIds.has(equivalentItemId)
  )
}

export function analyzeArmoireStoreOutfits(
  snapshot: ArmoireSnapshot,
  storeCatalog: ArmoireStoreCatalog,
  catalog: ArmoireCatalog
): ArmoireStoreOutfitAnalysis {
  const index = buildOwnedIndex(filterArmoireSnapshotForActionableItems(snapshot))
  const storedByBucketItemIds = createStoredByBucketItemIds(catalog, index)
  const outfits: ArmoireStoreOutfitState[] = storeCatalog.outfits.map((outfit) => {
    const itemIds = getUniqueItemIds(outfit.itemIds)
    const ownedItemsByItemId: Record<number, ReturnType<typeof getStoreEquivalentOwnedItems>> = {}
    const storedByBucketItemIdsByItemId: Record<number, number[]> = {}

    for (const itemId of itemIds) {
      ownedItemsByItemId[itemId] = getStoreEquivalentOwnedItems(index, itemId)
      storedByBucketItemIdsByItemId[itemId] = getStoredByBucketEquivalentItemIds(
        storedByBucketItemIds,
        itemId
      )
    }

    const ownedItemIds = itemIds.filter(
      (itemId) =>
        ownedItemsByItemId[itemId].length > 0 || storedByBucketItemIdsByItemId[itemId].length > 0
    )
    const missingItemIds = itemIds.filter((itemId) => !ownedItemIds.includes(itemId))

    return {
      outfit,
      status: getOutfitStatus({ ...outfit, itemIds }, ownedItemIds),
      ownedItemIds,
      missingItemIds,
      ownedItemsByItemId,
      storedByBucketItemIdsByItemId,
      mappedItemCount: itemIds.length,
      totalItemCount: Math.max(itemIds.length, outfit.itemNames.length)
    }
  })

  return {
    totalCount: outfits.length,
    mappedCount: outfits.filter((outfit) => outfit.mappedItemCount > 0).length,
    completeCount: outfits.filter((outfit) => outfit.status === 'complete').length,
    partialCount: outfits.filter((outfit) => outfit.status === 'partial').length,
    missingCount: outfits.filter((outfit) => outfit.status === 'missing').length,
    needsMappingCount: outfits.filter((outfit) => outfit.status === 'needsMapping').length,
    outfits
  }
}
