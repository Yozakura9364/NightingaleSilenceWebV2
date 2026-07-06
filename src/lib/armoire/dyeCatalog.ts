import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  ARMOIRE_DYE_CATALOG_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireDyeCatalog
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_DYE_CATALOG: ArmoireDyeCatalog = {
  schemaVersion: ARMOIRE_DYE_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  dyes: {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDye(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.dyeId === 'number' &&
    Number.isInteger(value.dyeId) &&
    value.dyeId >= 0 &&
    (value.name === undefined || typeof value.name === 'string') &&
    (value.color === undefined || typeof value.color === 'string') &&
    (value.shade === undefined || typeof value.shade === 'number') &&
    (value.subOrder === undefined || typeof value.subOrder === 'number') &&
    (value.valueCategory === undefined ||
      ['general', 'extra1', 'extra2', 'storeSpecial'].includes(String(value.valueCategory)))
  )
}

export function isArmoireDyeCatalog(value: unknown): value is ArmoireDyeCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_DYE_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isRecord(value.dyes) &&
    Object.values(value.dyes).every(isDye)
  )
}

export function createArmoireCatalogFromDyeCatalog(catalog: ArmoireDyeCatalog): ArmoireCatalog {
  if (catalog.generatedAt === '' && Object.keys(catalog.dyes).length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: catalog.generatedAt,
    items: {},
    cabinetItemIds: [],
    glamourSetItems: [],
    identicalGroups: [],
    dyes: catalog.dyes
  }
}
