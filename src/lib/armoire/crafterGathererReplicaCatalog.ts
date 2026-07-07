import {
  createCatalogItemsFromCompactDisplayItems,
  EMPTY_ARMOIRE_CATALOG,
  isArmoireCompactDisplayItemArray,
  isPositiveIntegerArray
} from '@/lib/armoire/catalog'
import {
  ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireCrafterGathererReplicaCatalog
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG: ArmoireCrafterGathererReplicaCatalog =
  {
    schemaVersion: ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION,
    generatedAt: '',
    items: [],
    itemIds: [],
    excludedItemIds: [],
    missingItemIds: []
  }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArmoireCrafterGathererReplicaCatalog(
  value: unknown
): value is ArmoireCrafterGathererReplicaCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isArmoireCompactDisplayItemArray(value.items) &&
    isPositiveIntegerArray(value.itemIds) &&
    (value.excludedItemIds === undefined || isPositiveIntegerArray(value.excludedItemIds)) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromCrafterGathererReplicaCatalog(
  catalog: ArmoireCrafterGathererReplicaCatalog
): ArmoireCatalog {
  if (catalog.generatedAt === '' && catalog.itemIds.length === 0 && catalog.items.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: catalog.generatedAt,
    items: createCatalogItemsFromCompactDisplayItems(catalog.items),
    cabinetItemIds: [],
    glamourSetItems: [],
    identicalGroups: [],
    dyes: {},
    crafterGathererReplicaItemIds: catalog.itemIds
  }
}
