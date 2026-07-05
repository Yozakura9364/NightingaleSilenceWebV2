import type { ArmoireCatalog, ArmoireOwnedItem, ArmoireSnapshot } from '@/lib/armoire/types'

export function hasArmoireCatalogItems(catalog: ArmoireCatalog): boolean {
  return Object.keys(catalog.items).length > 0
}

export function isArmoireCatalogItem(catalog: ArmoireCatalog, itemId: number): boolean {
  return Boolean(catalog.items[itemId])
}

export function isArmoireAppearanceItem(
  catalog: ArmoireCatalog,
  item: Pick<ArmoireOwnedItem, 'itemId'>
): boolean {
  if (!hasArmoireCatalogItems(catalog)) {
    return false
  }

  return isArmoireCatalogItem(catalog, item.itemId)
}

export function filterArmoireSnapshotForCatalog(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog
): ArmoireSnapshot {
  if (!hasArmoireCatalogItems(catalog)) {
    return { ...snapshot, items: [] }
  }

  const items = snapshot.items.filter((item) => isArmoireAppearanceItem(catalog, item))
  return items.length === snapshot.items.length ? snapshot : { ...snapshot, items }
}
