import { getOwnedItemQuantity } from '@/lib/armoire/buildOwnedIndex'
import { isArmoireStoreEquivalentItem } from '@/lib/armoire/storeItemEquivalents'
import type {
  ArmoireDuplicateItemAnalysis,
  ArmoireDuplicateItemGroupState,
  ArmoireOwnedIndex
} from '@/lib/armoire/types'

export function analyzeDuplicateItems(index: ArmoireOwnedIndex): ArmoireDuplicateItemAnalysis {
  const groups: ArmoireDuplicateItemGroupState[] = []

  for (const [itemId, entries] of index.byItemId.entries()) {
    if (entries.length <= 1) {
      continue
    }

    groups.push({
      itemId,
      ownedEntryCount: entries.length,
      totalQuantity: entries.reduce((total, item) => total + getOwnedItemQuantity(item), 0),
      isStoreRelated: isArmoireStoreEquivalentItem(itemId)
    })
  }

  groups.sort((left, right) => {
    if (Number(left.isStoreRelated) !== Number(right.isStoreRelated)) {
      return Number(left.isStoreRelated) - Number(right.isStoreRelated)
    }

    if (right.ownedEntryCount !== left.ownedEntryCount) {
      return right.ownedEntryCount - left.ownedEntryCount
    }

    if (right.totalQuantity !== left.totalQuantity) {
      return right.totalQuantity - left.totalQuantity
    }

    return left.itemId - right.itemId
  })

  return {
    duplicateItemCount: groups.length,
    groups
  }
}
