import { getIdenticalModelGroups, hasIdenticalModelCatalog } from '@/lib/armoire/catalog'
import { getOwnedItems } from '@/lib/armoire/buildOwnedIndex'
import { isArmoireStoreEquivalentItem } from '@/lib/armoire/storeItemEquivalents'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireIdenticalModelAnalysis,
  ArmoireIdenticalModelGroupState,
  ArmoireOwnedIndex,
  ArmoireOwnedItem,
} from '@/lib/armoire/types'

const NO_SPACE_COST_CONTAINERS = new Set<ArmoireContainerKind>(['armoire'])

function hasStorageSpaceCost(item: ArmoireOwnedItem): boolean {
  return !NO_SPACE_COST_CONTAINERS.has(item.container)
}

function isArmoireEntry(item: ArmoireOwnedItem): boolean {
  return item.container === 'armoire'
}

export function analyzeIdenticalModels(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog
): ArmoireIdenticalModelAnalysis {
  if (!hasIdenticalModelCatalog(catalog)) {
    return {
      status: 'missingCatalog',
      duplicateGroupCount: 0,
      groups: []
    }
  }

  const groups: ArmoireIdenticalModelGroupState[] = getIdenticalModelGroups(catalog)
    .map((group) => {
      const ownedItemIds = group.itemIds.filter((itemId) => index.itemIds.has(itemId))
      const armoireItemIds = ownedItemIds.filter((itemId) =>
        getOwnedItems(index, itemId).some(isArmoireEntry)
      )
      const storageSpaceItemIds = ownedItemIds.filter((itemId) =>
        getOwnedItems(index, itemId).some(hasStorageSpaceCost)
      )
      const storeRelatedItemIds = storageSpaceItemIds.filter(isArmoireStoreEquivalentItem)
      const ownedEntryCount = ownedItemIds.reduce(
        (count, itemId) => count + getOwnedItems(index, itemId).length,
        0
      )
      const armoireEntryCount = armoireItemIds.reduce(
        (count, itemId) =>
          count + getOwnedItems(index, itemId).filter(isArmoireEntry).length,
        0
      )
      const storageSpaceEntryCount = storageSpaceItemIds.reduce(
        (count, itemId) =>
          count + getOwnedItems(index, itemId).filter(hasStorageSpaceCost).length,
        0
      )

      return {
        key: group.key,
        ownedItemIds,
        ownedEntryCount,
        armoireItemIds,
        armoireEntryCount,
        storageSpaceItemIds,
        storageSpaceEntryCount,
        storeRelatedItemIds,
        isStoreRelated: storeRelatedItemIds.length > 0
      }
    })
    .filter((group) => group.ownedItemIds.length > 1 && group.storageSpaceItemIds.length > 0)
    .sort((left, right) => {
      if (Number(left.isStoreRelated) !== Number(right.isStoreRelated)) {
        return Number(left.isStoreRelated) - Number(right.isStoreRelated)
      }

      if (right.storageSpaceEntryCount !== left.storageSpaceEntryCount) {
        return right.storageSpaceEntryCount - left.storageSpaceEntryCount
      }

      if (right.ownedEntryCount !== left.ownedEntryCount) {
        return right.ownedEntryCount - left.ownedEntryCount
      }

      return left.key.localeCompare(right.key)
    })

  return {
    status: 'ready',
    duplicateGroupCount: groups.length,
    groups
  }
}
