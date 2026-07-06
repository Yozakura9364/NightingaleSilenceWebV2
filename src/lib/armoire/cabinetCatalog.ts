import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  ARMOIRE_CABINET_CATALOG_SCHEMA_VERSION,
  type ArmoireCabinetCatalog,
  type ArmoireCatalog
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_CABINET_CATALOG: ArmoireCabinetCatalog = {
  schemaVersion: ARMOIRE_CABINET_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  items: {},
  cabinetItemIds: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isCabinetDisplayItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    isPositiveInteger(value.itemId) &&
    (value.name === undefined || typeof value.name === 'string') &&
    (value.iconId === undefined || isPositiveInteger(value.iconId))
  )
}

function isCabinetEntry(value: unknown): boolean {
  return isRecord(value) && isPositiveInteger(value.cabinetId) && isPositiveInteger(value.itemId)
}

function isPositiveIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isPositiveInteger)
}

export function isArmoireCabinetCatalog(value: unknown): value is ArmoireCabinetCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_CABINET_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isRecord(value.items) &&
    Object.values(value.items).every(isCabinetDisplayItem) &&
    isPositiveIntegerArray(value.cabinetItemIds) &&
    (value.cabinetEntries === undefined ||
      (Array.isArray(value.cabinetEntries) && value.cabinetEntries.every(isCabinetEntry))) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromCabinetCatalog(
  cabinetCatalog: ArmoireCabinetCatalog
): ArmoireCatalog {
  if (cabinetCatalog.generatedAt === '' && cabinetCatalog.cabinetItemIds.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: cabinetCatalog.generatedAt,
    items: Object.fromEntries(
      Object.values(cabinetCatalog.items).map((item) => [
        item.itemId,
        {
          ...item,
          isCabinetStorable: true
        }
      ])
    ),
    cabinetItemIds: cabinetCatalog.cabinetItemIds,
    cabinetEntries: cabinetCatalog.cabinetEntries,
    glamourSetItems: [],
    identicalGroups: [],
    dyes: {}
  }
}
