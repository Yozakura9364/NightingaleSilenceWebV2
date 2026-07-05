import { hasGlamourSetCatalog } from '@/lib/armoire/catalog'
import {
  buildOwnedIndex,
  getOwnedItems,
  hasOwnedItem,
  hasOwnedItemInContainer
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireGlamourSetProgress,
  ArmoireGlamourSetState,
  ArmoireOwnedIndex,
  ArmoireOwnedItem,
  ArmoireSnapshot
} from '@/lib/armoire/types'

const SET_BUCKET_STORAGE_CONTAINERS = new Set<ArmoireContainerKind>([
  'inventory',
  'saddlebag',
  'retainer',
  'armoury',
  'glamourDresser'
])

function isSetBucketStorageCandidate(item: ArmoireOwnedItem): boolean {
  return SET_BUCKET_STORAGE_CONTAINERS.has(item.container)
}

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

function createBucketStorableLoosePieceItemIds(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog,
  sets: ArmoireGlamourSetState[]
): number[] {
  const cabinetItemIds = new Set(catalog.cabinetItemIds)
  const pieceItemIds = new Set<number>()

  for (const set of sets) {
    if (!set.isStoredAsSet) {
      continue
    }

    for (const itemId of set.pieceItemIds) {
      if (cabinetItemIds.has(itemId)) {
        continue
      }

      if (getOwnedItems(index, itemId).some(isSetBucketStorageCandidate)) {
        pieceItemIds.add(itemId)
      }
    }
  }

  return Array.from(pieceItemIds).sort((left, right) => left - right)
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
      bucketStorableLoosePieceItemIds: [],
      sets: []
    }
  }

  const index = buildOwnedIndex(snapshot)
  const sets = catalog.glamourSetItems
    .map((set) =>
      analyzeGlamourSetState(index, catalog, set.setItemId, set.pieceItemIds, set.setName)
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
    bucketStorableLoosePieceItemIds: createBucketStorableLoosePieceItemIds(index, catalog, sets),
    sets
  }
}
