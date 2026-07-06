import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  createCatalogItemsFromCompactDisplayItems,
  isArmoireCompactDisplayItemArray,
  isPositiveIntegerArray
} from '@/lib/armoire/catalog'
import { ARMOIRE_ITEM_ID_CHUNK_SIZE } from '@/lib/armoire/itemIdChunk'
import {
  ARMOIRE_CABINET_ITEM_CHUNK_SCHEMA_VERSION,
  type ArmoireCabinetEntry,
  type ArmoireCabinetItemChunk,
  type ArmoireCatalog
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_CABINET_ITEM_CHUNK: ArmoireCabinetItemChunk = {
  schemaVersion: ARMOIRE_CABINET_ITEM_CHUNK_SCHEMA_VERSION,
  generatedAt: '',
  chunkKey: '',
  chunkSize: ARMOIRE_ITEM_ID_CHUNK_SIZE,
  items: [],
  cabinetItemIds: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isCabinetEntry(value: unknown): value is ArmoireCabinetEntry {
  return isRecord(value) && isPositiveInteger(value.cabinetId) && isPositiveInteger(value.itemId)
}

function uniqueSortedNumbers(values: readonly number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

export function isArmoireCabinetItemChunk(value: unknown): value is ArmoireCabinetItemChunk {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_CABINET_ITEM_CHUNK_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    typeof value.chunkKey === 'string' &&
    value.chunkSize === ARMOIRE_ITEM_ID_CHUNK_SIZE &&
    isArmoireCompactDisplayItemArray(value.items) &&
    isPositiveIntegerArray(value.cabinetItemIds) &&
    (value.cabinetEntries === undefined ||
      (Array.isArray(value.cabinetEntries) && value.cabinetEntries.every(isCabinetEntry))) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromCabinetItemChunks(
  chunks: readonly ArmoireCabinetItemChunk[]
): ArmoireCatalog {
  if (chunks.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  const generatedAtValues = chunks
    .map((chunk) => chunk.generatedAt)
    .filter(Boolean)
    .sort()
  const items = createCatalogItemsFromCompactDisplayItems(chunks.flatMap((chunk) => chunk.items))

  for (const item of Object.values(items)) {
    item.isCabinetStorable = true
  }

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: generatedAtValues[generatedAtValues.length - 1] ?? '',
    items,
    cabinetItemIds: uniqueSortedNumbers(chunks.flatMap((chunk) => chunk.cabinetItemIds)),
    cabinetEntries: chunks.flatMap((chunk) => chunk.cabinetEntries ?? []),
    glamourSetItems: [],
    identicalGroups: [],
    dyes: {}
  }
}
