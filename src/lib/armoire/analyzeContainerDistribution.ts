import {
  getOwnedItemQuantity,
  isDyedOwnedItem
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireBasicAnalysis,
  ArmoireContainerKind,
  ArmoireContainerDistributionEntry,
  ArmoireOwnedItem,
  ArmoireSnapshot
} from '@/lib/armoire/types'

const CORE_CONTAINER_ORDER: Partial<Record<ArmoireContainerKind, number>> = {
  armoury: 0,
  inventory: 1,
  saddlebag: 2,
  armoire: 3,
  glamourDresser: 4
}

function getDistributionKey(item: ArmoireOwnedItem): string {
  return `${item.container}::${item.containerName ?? ''}`
}

function createDistributionEntry(item: ArmoireOwnedItem): ArmoireContainerDistributionEntry {
  return {
    key: getDistributionKey(item),
    container: item.container,
    containerName: item.containerName,
    retainerId: item.retainerId,
    retainerName: item.retainerName,
    retainerSlot: item.retainerSlot,
    entryCount: 0,
    totalQuantity: 0,
    dyedEntryCount: 0,
    uniqueItemCount: 0
  }
}

function getRetainerOwnerName(
  item: Pick<ArmoireOwnedItem | ArmoireContainerDistributionEntry, 'containerName' | 'retainerName'>
): string | undefined {
  const explicitName = item.retainerName?.trim()
  if (explicitName) {
    return explicitName
  }

  const containerName = item.containerName?.trim()
  if (!containerName) {
    return undefined
  }

  const match = containerName.match(/^(.*?)\s+(?:背包\s*\d+|已装备|市场)$/u)
  return match?.[1]?.trim() || containerName
}

function getRetainerOrderKey(item: ArmoireOwnedItem): string | undefined {
  if (item.container !== 'retainer') {
    return undefined
  }

  return (
    getRetainerSlotKey(item.retainerSlot) ||
    item.retainerId?.trim() ||
    getRetainerOwnerName(item)
  )
}

function getRetainerSlotKey(slot: number | undefined): string | undefined {
  return slot === undefined ? undefined : `slot:${slot}`
}

function getRetainerContainerOrder(entry: ArmoireContainerDistributionEntry): number {
  const containerName = entry.containerName?.trim() ?? ''
  const bagMatch = containerName.match(/背包\s*(\d+)/u)

  if (bagMatch) {
    return Number(bagMatch[1])
  }

  if (containerName.endsWith('已装备')) {
    return 20
  }

  if (containerName.endsWith('市场')) {
    return 30
  }

  return 40
}

function getDistributionGroupOrder(entry: ArmoireContainerDistributionEntry): number {
  const coreOrder = CORE_CONTAINER_ORDER[entry.container]

  if (coreOrder !== undefined) {
    return coreOrder
  }

  if (entry.container === 'retainer') {
    return 100
  }

  return 900
}

function compareDistributionEntries(
  left: ArmoireContainerDistributionEntry,
  right: ArmoireContainerDistributionEntry,
  retainerOrder: ReadonlyMap<string, number>
): number {
  const leftGroupOrder = getDistributionGroupOrder(left)
  const rightGroupOrder = getDistributionGroupOrder(right)

  if (leftGroupOrder !== rightGroupOrder) {
    return leftGroupOrder - rightGroupOrder
  }

  if (left.container === 'retainer' && right.container === 'retainer') {
    if (
      left.retainerSlot !== undefined &&
      right.retainerSlot !== undefined &&
      left.retainerSlot !== right.retainerSlot
    ) {
      return left.retainerSlot - right.retainerSlot
    }

    const leftRetainerKey =
      getRetainerSlotKey(left.retainerSlot) ||
      left.retainerId?.trim() ||
      getRetainerOwnerName(left) ||
      left.key
    const rightRetainerKey =
      getRetainerSlotKey(right.retainerSlot) ||
      right.retainerId?.trim() ||
      getRetainerOwnerName(right) ||
      right.key
    const leftRetainerOrder = retainerOrder.get(leftRetainerKey) ?? Number.MAX_SAFE_INTEGER
    const rightRetainerOrder = retainerOrder.get(rightRetainerKey) ?? Number.MAX_SAFE_INTEGER

    if (leftRetainerOrder !== rightRetainerOrder) {
      return leftRetainerOrder - rightRetainerOrder
    }

    const leftContainerOrder = getRetainerContainerOrder(left)
    const rightContainerOrder = getRetainerContainerOrder(right)

    if (leftContainerOrder !== rightContainerOrder) {
      return leftContainerOrder - rightContainerOrder
    }
  }

  return left.key.localeCompare(right.key)
}

export function analyzeContainerDistribution(
  snapshot: ArmoireSnapshot
): ArmoireContainerDistributionEntry[] {
  const distribution = new Map<string, ArmoireContainerDistributionEntry>()
  const itemIdsByContainer = new Map<string, Set<number>>()
  const retainerOrder = new Map<string, number>()

  for (const item of snapshot.items) {
    const key = getDistributionKey(item)
    const entry = distribution.get(key) ?? createDistributionEntry(item)
    const itemIds = itemIdsByContainer.get(key) ?? new Set<number>()
    const retainerOrderKey = getRetainerOrderKey(item)

    if (retainerOrderKey && !retainerOrder.has(retainerOrderKey)) {
      retainerOrder.set(retainerOrderKey, retainerOrder.size)
    }

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

  return Array.from(distribution.values()).sort((left, right) =>
    compareDistributionEntries(left, right, retainerOrder)
  )
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
