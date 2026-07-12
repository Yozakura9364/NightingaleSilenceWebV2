import type { ArmoireCatalog, ArmoireOwnedItem, ArmoireSnapshot } from '@/lib/armoire/types'

export const ARMOIRE_RETAINER_MARKET_INVENTORY_TYPE = 12002
export const ARMOIRE_RETAINER_EQUIPPED_INVENTORY_TYPE = 11000

export function hasArmoireCatalogItems(catalog: ArmoireCatalog): boolean {
  for (const _itemId in catalog.items) {
    return true
  }

  return false
}

export function isArmoireCatalogItem(catalog: ArmoireCatalog, itemId: number): boolean {
  return Boolean(catalog.items[itemId])
}

export function isArmoireAppearanceItem(
  catalog: ArmoireCatalog,
  item: Pick<ArmoireOwnedItem, 'itemId'>
): boolean {
  return isArmoireCatalogItem(catalog, item.itemId)
}

export function filterArmoireSnapshotForCatalog(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog
): ArmoireSnapshot {
  if (!hasArmoireCatalogItems(catalog)) {
    return { ...snapshot, items: [] }
  }

  const items = snapshot.items.filter((item) => isArmoireCatalogItem(catalog, item.itemId))
  return items.length === snapshot.items.length ? snapshot : { ...snapshot, items }
}

export function isArmoireRetainerMarketItem(
  item: Pick<ArmoireOwnedItem, 'container' | 'containerName' | 'inventoryType'>
): boolean {
  if (item.container !== 'retainer') {
    return false
  }

  if (item.inventoryType === ARMOIRE_RETAINER_MARKET_INVENTORY_TYPE) {
    return true
  }

  return item.containerName?.trim().endsWith('市场') === true
}

export function isArmoireRetainerEquippedItem(
  item: Pick<ArmoireOwnedItem, 'container' | 'containerName' | 'inventoryType'>
): boolean {
  if (item.container !== 'retainer') {
    return false
  }

  if (item.inventoryType === ARMOIRE_RETAINER_EQUIPPED_INVENTORY_TYPE) {
    return true
  }

  return item.containerName?.trim().endsWith('已装备') === true
}

export function filterArmoireSnapshotForActionableItems(
  snapshot: ArmoireSnapshot
): ArmoireSnapshot {
  const items = snapshot.items.filter(
    (item) => !isArmoireRetainerMarketItem(item) && !isArmoireRetainerEquippedItem(item)
  )

  return items.length === snapshot.items.length ? snapshot : { ...snapshot, items }
}

export function filterArmoireSnapshotForDuplicateSuggestions(
  snapshot: ArmoireSnapshot
): ArmoireSnapshot {
  const items = snapshot.items.filter((item) => !isArmoireRetainerEquippedItem(item))

  return items.length === snapshot.items.length ? snapshot : { ...snapshot, items }
}
