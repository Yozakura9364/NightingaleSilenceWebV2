import {
  buildOwnedIndex,
  getOwnedItemQuantity
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireDuplicateItemAnalysis,
  ArmoireDuplicateItemGroupState,
  ArmoireSnapshot
} from '@/lib/armoire/types'

export function analyzeDuplicateItems(snapshot: ArmoireSnapshot): ArmoireDuplicateItemAnalysis {
  const index = buildOwnedIndex(snapshot)
  const groups: ArmoireDuplicateItemGroupState[] = []

  for (const [itemId, entries] of index.byItemId.entries()) {
    if (entries.length <= 1) {
      continue
    }

    groups.push({
      itemId,
      ownedEntryCount: entries.length,
      totalQuantity: entries.reduce((total, item) => total + getOwnedItemQuantity(item), 0)
    })
  }

  groups.sort((left, right) => {
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
