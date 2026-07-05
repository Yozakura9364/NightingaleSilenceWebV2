import { buildOwnedIndex, hasOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireSnapshot,
  ArmoireStoreCatalog,
  ArmoireStoreOutfit,
  ArmoireStoreOutfitAnalysis,
  ArmoireStoreOutfitState,
  ArmoireStoreOutfitStatus
} from '@/lib/armoire/types'

function getUniqueSortedItemIds(itemIds: number[]): number[] {
  return Array.from(new Set(itemIds)).sort((left, right) => left - right)
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
  const index = buildOwnedIndex(snapshot)
  const outfits: ArmoireStoreOutfitState[] = storeCatalog.outfits.map((outfit) => {
    const itemIds = getUniqueSortedItemIds(outfit.itemIds)
    const ownedItemIds = itemIds.filter((itemId) => hasOwnedItem(index, itemId))
    const missingItemIds = itemIds.filter((itemId) => !hasOwnedItem(index, itemId))

    return {
      outfit,
      status: getOutfitStatus({ ...outfit, itemIds }, ownedItemIds),
      ownedItemIds,
      missingItemIds,
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
