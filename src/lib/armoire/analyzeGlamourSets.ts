import { hasGlamourSetCatalog } from '@/lib/armoire/catalog'
import {
  buildOwnedIndex,
  hasOwnedItem,
  hasOwnedItemInContainer
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireGlamourSetProgress,
  ArmoireGlamourSetState,
  ArmoireOwnedIndex,
  ArmoireSnapshot
} from '@/lib/armoire/types'

function analyzeGlamourSetState(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog,
  setItemId: number,
  pieceItemIds: number[],
  setName?: string
): ArmoireGlamourSetState {
  const uniquePieceItemIds = Array.from(new Set(pieceItemIds)).filter((itemId) => itemId > 0)
  const storedPieceItemIds = uniquePieceItemIds.filter((itemId) => hasOwnedItem(index, itemId))
  const missingPieceItemIds = uniquePieceItemIds.filter((itemId) => !hasOwnedItem(index, itemId))
  const catalogItem = catalog.items[setItemId]

  return {
    setItemId,
    setName: setName ?? catalogItem?.name,
    isStoredAsSet: hasOwnedItemInContainer(index, setItemId, 'glamourDresser'),
    pieceItemIds: uniquePieceItemIds,
    storedPieceItemIds,
    missingPieceItemIds
  }
}

export function analyzeGlamourSets(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog
): ArmoireGlamourSetProgress {
  if (!hasGlamourSetCatalog(catalog)) {
    return {
      status: 'missingCatalog',
      storedSetCount: 0,
      availableSetCount: 0,
      incompleteStoredSetCount: 0,
      sets: []
    }
  }

  const index = buildOwnedIndex(snapshot)
  const sets = catalog.glamourSetItems
    .map((set) =>
      analyzeGlamourSetState(
        index,
        catalog,
        set.setItemId,
        set.pieceItemIds,
        set.setName
      )
    )
    .sort((left, right) => {
      if (Number(right.isStoredAsSet) !== Number(left.isStoredAsSet)) {
        return Number(right.isStoredAsSet) - Number(left.isStoredAsSet)
      }

      return left.setItemId - right.setItemId
    })

  return {
    status: 'ready',
    storedSetCount: sets.filter((set) => set.isStoredAsSet).length,
    availableSetCount: sets.length,
    incompleteStoredSetCount: sets.filter(
      (set) => set.isStoredAsSet && set.missingPieceItemIds.length > 0
    ).length,
    sets
  }
}
