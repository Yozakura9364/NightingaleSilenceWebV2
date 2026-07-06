import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  createCatalogItemsFromCompactDisplayItems,
  isArmoireCompactDisplayItemArray,
  isPositiveIntegerArray
} from '@/lib/armoire/catalog'
import {
  ARMOIRE_IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireIdenticalModelCatalog
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_IDENTICAL_MODEL_CATALOG: ArmoireIdenticalModelCatalog = {
  schemaVersion: ARMOIRE_IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  items: [],
  identicalGroups: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIdenticalGroup(value: unknown): boolean {
  return isRecord(value) && typeof value.key === 'string' && isPositiveIntegerArray(value.itemIds)
}

export function isArmoireIdenticalModelCatalog(
  value: unknown
): value is ArmoireIdenticalModelCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isArmoireCompactDisplayItemArray(value.items) &&
    Array.isArray(value.identicalGroups) &&
    value.identicalGroups.every(isIdenticalGroup) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromIdenticalModelCatalog(
  catalog: ArmoireIdenticalModelCatalog
): ArmoireCatalog {
  if (catalog.generatedAt === '' && catalog.identicalGroups.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: catalog.generatedAt,
    items: createCatalogItemsFromCompactDisplayItems(catalog.items),
    cabinetItemIds: [],
    glamourSetItems: [],
    identicalGroups: catalog.identicalGroups,
    dyes: {}
  }
}
