import type { ArmoireOwnedIndex, ArmoireOwnedItem, ArmoireSnapshot } from '@/lib/armoire/types'

export function getOwnedItemQuantity(item: ArmoireOwnedItem): number {
  return item.quantity ?? 1
}

export function isDyedOwnedItem(item: ArmoireOwnedItem): boolean {
  return Boolean(item.dyes?.some((dyeId) => dyeId > 0))
}

export function buildOwnedIndex(snapshot: ArmoireSnapshot): ArmoireOwnedIndex {
  const byItemId = new Map<number, ArmoireOwnedItem[]>()
  const itemIds = new Set<number>()

  for (const item of snapshot.items) {
    itemIds.add(item.itemId)

    const entries = byItemId.get(item.itemId)

    if (entries) {
      entries.push(item)
    } else {
      byItemId.set(item.itemId, [item])
    }
  }

  return {
    byItemId,
    itemIds,
    entries: snapshot.items
  }
}

export function hasOwnedItem(index: ArmoireOwnedIndex, itemId: number): boolean {
  return index.itemIds.has(itemId)
}

export function hasOwnedItemInContainer(
  index: ArmoireOwnedIndex,
  itemId: number,
  container: ArmoireOwnedItem['container']
): boolean {
  return Boolean(index.byItemId.get(itemId)?.some((item) => item.container === container))
}

export function getOwnedItems(index: ArmoireOwnedIndex, itemId: number): ArmoireOwnedItem[] {
  return index.byItemId.get(itemId) ?? []
}
