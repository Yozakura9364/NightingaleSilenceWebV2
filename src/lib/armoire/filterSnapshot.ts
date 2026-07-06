import type { ArmoireCatalog, ArmoireOwnedItem, ArmoireSnapshot } from '@/lib/armoire/types'

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
