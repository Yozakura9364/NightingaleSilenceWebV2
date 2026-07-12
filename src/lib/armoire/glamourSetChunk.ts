import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  createCatalogItemsFromCompactDisplayItems,
  isArmoireCompactDisplayItemArray,
  isNonNegativeIntegerArray,
  isPositiveIntegerArray
} from '@/lib/armoire/catalog'
import { ARMOIRE_ITEM_ID_CHUNK_SIZE } from '@/lib/armoire/itemIdChunk'
import {
  ARMOIRE_GLAMOUR_SET_CHUNK_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireGlamourSet,
  type ArmoireGlamourSetChunk
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_GLAMOUR_SET_CHUNK: ArmoireGlamourSetChunk = {
  schemaVersion: ARMOIRE_GLAMOUR_SET_CHUNK_SCHEMA_VERSION,
  generatedAt: '',
  chunkKey: '',
  chunkSize: ARMOIRE_ITEM_ID_CHUNK_SIZE,
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

function isGlamourSet(value: unknown): value is ArmoireGlamourSet {
  return (
    isRecord(value) &&
    isPositiveInteger(value.setItemId) &&
    (value.setName === undefined || typeof value.setName === 'string') &&
    (value.pieceSlotItemIds === undefined || isNonNegativeIntegerArray(value.pieceSlotItemIds)) &&
    isPositiveIntegerArray(value.pieceItemIds)
  )
}

function uniqueSortedNumbers(values: readonly number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function mergeGlamourSets(sets: readonly ArmoireGlamourSet[]): ArmoireGlamourSet[] {
  const mergedSets = new Map<number, ArmoireGlamourSet>()

  for (const set of sets) {
    const existingSet = mergedSets.get(set.setItemId)

    mergedSets.set(set.setItemId, {
      setItemId: set.setItemId,
      setName: set.setName ?? existingSet?.setName,
      pieceSlotItemIds: set.pieceSlotItemIds ?? existingSet?.pieceSlotItemIds,
      pieceItemIds: uniqueSortedNumbers([...(existingSet?.pieceItemIds ?? []), ...set.pieceItemIds])
    })
  }

  return Array.from(mergedSets.values()).sort((left, right) => left.setItemId - right.setItemId)
}

export function isArmoireGlamourSetChunk(value: unknown): value is ArmoireGlamourSetChunk {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_GLAMOUR_SET_CHUNK_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    typeof value.chunkKey === 'string' &&
    value.chunkSize === ARMOIRE_ITEM_ID_CHUNK_SIZE &&
    isArmoireCompactDisplayItemArray(value.items) &&
    isPositiveIntegerArray(value.cabinetItemIds) &&
    Array.isArray(value.glamourSetItems) &&
    value.glamourSetItems.every(isGlamourSet) &&
    (value.missingItemIds === undefined || isPositiveIntegerArray(value.missingItemIds))
  )
}

export function createArmoireCatalogFromGlamourSetChunks(
  chunks: readonly ArmoireGlamourSetChunk[]
): ArmoireCatalog {
  if (chunks.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  const generatedAtValues = chunks
    .map((chunk) => chunk.generatedAt)
    .filter(Boolean)
    .sort()

  return {
    schemaVersion: EMPTY_ARMOIRE_CATALOG.schemaVersion,
    generatedAt: generatedAtValues[generatedAtValues.length - 1] ?? '',
    items: createCatalogItemsFromCompactDisplayItems(chunks.flatMap((chunk) => chunk.items)),
    cabinetItemIds: uniqueSortedNumbers(chunks.flatMap((chunk) => chunk.cabinetItemIds)),
    glamourSetItems: mergeGlamourSets(chunks.flatMap((chunk) => chunk.glamourSetItems)),
    identicalGroups: [],
    dyes: {}
  }
}
