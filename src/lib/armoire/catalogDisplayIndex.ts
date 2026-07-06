import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  createCatalogItemsFromCompactDisplayItems,
  isArmoireCompactDisplayItemArray,
  isPositiveIntegerArray
} from '@/lib/armoire/catalog'
import {
  ARMOIRE_CATALOG_DISPLAY_INDEX_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireCatalogDisplayIndex
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_CATALOG_DISPLAY_INDEX: ArmoireCatalogDisplayIndex = {
  schemaVersion: ARMOIRE_CATALOG_DISPLAY_INDEX_SCHEMA_VERSION,
  generatedAt: '',
  items: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArmoireCatalogDisplayIndex(
  value: unknown
): value is ArmoireCatalogDisplayIndex {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_CATALOG_DISPLAY_INDEX_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isArmoireCompactDisplayItemArray(value.items) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromCatalogDisplayIndex(
  index: ArmoireCatalogDisplayIndex
): ArmoireCatalog {
  if (index.generatedAt === '' && index.items.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: index.generatedAt,
    items: createCatalogItemsFromCompactDisplayItems(index.items),
    cabinetItemIds: [],
    glamourSetItems: [],
    identicalGroups: [],
    dyes: {}
  }
}
