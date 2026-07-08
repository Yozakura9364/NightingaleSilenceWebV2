import { buildOwnedIndex } from '@/lib/armoire/buildOwnedIndex'
import { filterArmoireSnapshotForActionableItems } from '@/lib/armoire/filterSnapshot'
import {
  getStoreEquivalentOwnedItems,
  hasStoreEquivalentOwnedItem
} from '@/lib/armoire/storeItemEquivalents'
import type {
  ArmoireSnapshot,
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

export function analyzeArmoireStoreOutfits(
  snapshot: ArmoireSnapshot,
  storeCatalog: ArmoireStoreCatalog
): ArmoireStoreOutfitAnalysis {
  const index = buildOwnedIndex(filterArmoireSnapshotForActionableItems(snapshot))
  const outfits: ArmoireStoreOutfitState[] = storeCatalog.outfits.map((outfit) => {
    const itemIds = getUniqueItemIds(outfit.itemIds)
    const ownedItemIds = itemIds.filter((itemId) => hasStoreEquivalentOwnedItem(index, itemId))
    const missingItemIds = itemIds.filter((itemId) => !hasStoreEquivalentOwnedItem(index, itemId))
    const ownedItemsByItemId: Record<number, ReturnType<typeof getStoreEquivalentOwnedItems>> = {}

    for (const itemId of itemIds) {
      ownedItemsByItemId[itemId] = getStoreEquivalentOwnedItems(index, itemId)
    }

    return {
      outfit,
      status: getOutfitStatus({ ...outfit, itemIds }, ownedItemIds),
      ownedItemIds,
      missingItemIds,
      ownedItemsByItemId,
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
