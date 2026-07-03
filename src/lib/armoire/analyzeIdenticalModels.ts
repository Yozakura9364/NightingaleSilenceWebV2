import { getIdenticalModelGroups, hasIdenticalModelCatalog } from '@/lib/armoire/catalog'
import { buildOwnedIndex, getOwnedItems } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireIdenticalModelAnalysis,
  ArmoireIdenticalModelGroupState,
  ArmoireSnapshot
} from '@/lib/armoire/types'

export function analyzeIdenticalModels(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog
): ArmoireIdenticalModelAnalysis {
  const index = buildOwnedIndex(snapshot)

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
      const ownedEntryCount = ownedItemIds.reduce(
        (count, itemId) => count + getOwnedItems(index, itemId).length,
        0
      )

      return {
        key: group.key,
        ownedItemIds,
        ownedEntryCount
      }
    })
    .filter((group) => group.ownedItemIds.length > 1 || group.ownedEntryCount > 1)
    .sort((left, right) => {
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
