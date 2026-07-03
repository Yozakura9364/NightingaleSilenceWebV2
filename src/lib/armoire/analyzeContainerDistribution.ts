import {
  getOwnedItemQuantity,
  isDyedOwnedItem
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireBasicAnalysis,
  ArmoireContainerDistributionEntry,
  ArmoireOwnedItem,
  ArmoireSnapshot
} from '@/lib/armoire/types'

function getDistributionKey(item: ArmoireOwnedItem): string {
  return `${item.container}::${item.containerName ?? ''}`
}

function createDistributionEntry(item: ArmoireOwnedItem): ArmoireContainerDistributionEntry {
  return {
    key: getDistributionKey(item),
    container: item.container,
    containerName: item.containerName,
    entryCount: 0,
    totalQuantity: 0,
    dyedEntryCount: 0,
    uniqueItemCount: 0
  }
}

export function analyzeContainerDistribution(
  snapshot: ArmoireSnapshot
): ArmoireContainerDistributionEntry[] {
  const distribution = new Map<string, ArmoireContainerDistributionEntry>()
  const itemIdsByContainer = new Map<string, Set<number>>()

  for (const item of snapshot.items) {
    const key = getDistributionKey(item)
    const entry = distribution.get(key) ?? createDistributionEntry(item)
    const itemIds = itemIdsByContainer.get(key) ?? new Set<number>()

    entry.entryCount += 1
    entry.totalQuantity += getOwnedItemQuantity(item)

    if (isDyedOwnedItem(item)) {
      entry.dyedEntryCount += 1
    }

    itemIds.add(item.itemId)
    entry.uniqueItemCount = itemIds.size
    distribution.set(key, entry)
    itemIdsByContainer.set(key, itemIds)
  }

  return Array.from(distribution.values()).sort((left, right) => {
    if (right.entryCount !== left.entryCount) {
      return right.entryCount - left.entryCount
    }

    return left.key.localeCompare(right.key)
  })
}

export function analyzeArmoireBasics(snapshot: ArmoireSnapshot): ArmoireBasicAnalysis {
  const uniqueItemIds = new Set<number>()
  let totalQuantity = 0
  let dyedEntryCount = 0
  let glamourDresserEntryCount = 0
  let armoireEntryCount = 0

  for (const item of snapshot.items) {
    uniqueItemIds.add(item.itemId)
    totalQuantity += getOwnedItemQuantity(item)

    if (isDyedOwnedItem(item)) {
      dyedEntryCount += 1
    }

    if (item.container === 'glamourDresser') {
      glamourDresserEntryCount += 1
    }

    if (item.container === 'armoire') {
      armoireEntryCount += 1
    }
  }

  return {
    entryCount: snapshot.items.length,
    totalQuantity,
    uniqueItemCount: uniqueItemIds.size,
    dyedEntryCount,
    glamourDresserEntryCount,
    armoireEntryCount,
    distribution: analyzeContainerDistribution(snapshot)
  }
}
