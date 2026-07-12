import { getOwnedItems } from '@/lib/armoire/buildOwnedIndex'
import type { ArmoireOwnedIndex, ArmoireOwnedItem } from '@/lib/armoire/types'

interface ArmoireStoreEquivalentItemGroup {
  itemIds: readonly number[]
  completeItemIds?: readonly number[]
}

const STORE_EQUIVALENT_ITEM_GROUPS: readonly ArmoireStoreEquivalentItemGroup[] = [
  { itemIds: [14972, 20489], completeItemIds: [45198, 45285] },
  { itemIds: [14973, 20490], completeItemIds: [45198, 45285] },
  { itemIds: [14974, 20491], completeItemIds: [45198, 45285] },
  { itemIds: [14975, 20492], completeItemIds: [45198, 45285] },
  { itemIds: [14976, 20493], completeItemIds: [45198, 45285] },
  { itemIds: [14977, 20494], completeItemIds: [45199, 45286] },
  { itemIds: [14978, 20495], completeItemIds: [45199, 45286] },
  { itemIds: [14979, 20496], completeItemIds: [45199, 45286] },
  { itemIds: [14980, 20497], completeItemIds: [45199, 45286] },
  { itemIds: [14981, 20498], completeItemIds: [45199, 45286] },
  { itemIds: [14983, 25055] },
  { itemIds: [15487, 17718], completeItemIds: [45233, 45273] },
  { itemIds: [15488, 17719], completeItemIds: [45233, 45273] },
  { itemIds: [15489, 17720], completeItemIds: [45233, 45273] },
  { itemIds: [15490, 17721], completeItemIds: [45233, 45273] },
  { itemIds: [15491, 17722], completeItemIds: [45233, 45273] }
] as const

const STORE_EQUIVALENT_ITEMS_BY_ITEM_ID = new Map<number, ArmoireStoreEquivalentItemGroup>()
const STORE_RELATED_ITEM_IDS = new Set<number>()

for (const group of STORE_EQUIVALENT_ITEM_GROUPS) {
  for (const itemId of group.itemIds) {
    STORE_EQUIVALENT_ITEMS_BY_ITEM_ID.set(itemId, group)
    STORE_RELATED_ITEM_IDS.add(itemId)
  }

  for (const itemId of group.completeItemIds ?? []) {
    STORE_RELATED_ITEM_IDS.add(itemId)
  }
}

function getStoreEquivalentItemIds(itemId: number): readonly number[] {
  return STORE_EQUIVALENT_ITEMS_BY_ITEM_ID.get(itemId)?.itemIds ?? [itemId]
}

function getStoreCompleteItemIds(itemId: number): readonly number[] {
  return STORE_EQUIVALENT_ITEMS_BY_ITEM_ID.get(itemId)?.completeItemIds ?? []
}

export function getStoreEquivalentItemIdsForOwnership(itemId: number): readonly number[] {
  return [...getStoreEquivalentItemIds(itemId), ...getStoreCompleteItemIds(itemId)]
}

export function getStoreEquivalentOwnedItems(
  index: ArmoireOwnedIndex,
  itemId: number
): ArmoireOwnedItem[] {
  return getStoreEquivalentItemIdsForOwnership(itemId).flatMap((equivalentItemId) =>
    getOwnedItems(index, equivalentItemId)
  )
}

export function hasStoreEquivalentOwnedItem(index: ArmoireOwnedIndex, itemId: number): boolean {
  return getStoreEquivalentOwnedItems(index, itemId).length > 0
}

export function isArmoireStoreEquivalentItem(itemId: number): boolean {
  return STORE_RELATED_ITEM_IDS.has(itemId)
}
