import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  createCatalogItemsFromCompactDisplayItems,
  isArmoireCompactDisplayItemArray,
  isNonNegativeIntegerArray,
  isPositiveIntegerArray
} from '@/lib/armoire/catalog'
import {
  ARMOIRE_GLAMOUR_SET_CATALOG_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireGlamourSetCatalog
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_GLAMOUR_SET_CATALOG: ArmoireGlamourSetCatalog = {
  schemaVersion: ARMOIRE_GLAMOUR_SET_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  items: [],
  cabinetItemIds: [],
  glamourSetItems: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isGlamourSet(value: unknown): boolean {
  return (
    isRecord(value) &&
    isPositiveInteger(value.setItemId) &&
    (value.setName === undefined || typeof value.setName === 'string') &&
    (value.pieceSlotItemIds === undefined || isNonNegativeIntegerArray(value.pieceSlotItemIds)) &&
    isPositiveIntegerArray(value.pieceItemIds)
  )
}

export function isArmoireGlamourSetCatalog(value: unknown): value is ArmoireGlamourSetCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_GLAMOUR_SET_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isArmoireCompactDisplayItemArray(value.items) &&
    isPositiveIntegerArray(value.cabinetItemIds) &&
    Array.isArray(value.glamourSetItems) &&
    value.glamourSetItems.every(isGlamourSet) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromGlamourSetCatalog(
  catalog: ArmoireGlamourSetCatalog
): ArmoireCatalog {
  if (catalog.generatedAt === '' && catalog.glamourSetItems.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: catalog.generatedAt,
    items: createCatalogItemsFromCompactDisplayItems(catalog.items),
    cabinetItemIds: catalog.cabinetItemIds,
    glamourSetItems: catalog.glamourSetItems,
    identicalGroups: [],
    dyes: {}
  }
}
