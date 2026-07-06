import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import {
  createCatalogItemsFromCompactDisplayItems,
  isArmoireCompactDisplayItemArray
} from '@/lib/armoire/catalog'
import {
  ARMOIRE_ITEM_DISPLAY_CHUNK_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireItemDisplayChunk
} from '@/lib/armoire/types'
import { ARMOIRE_ITEM_ID_CHUNK_SIZE, getArmoireItemIdChunkKey } from '@/lib/armoire/itemIdChunk'

export const ARMOIRE_ITEM_DISPLAY_CHUNK_SIZE = ARMOIRE_ITEM_ID_CHUNK_SIZE

export const EMPTY_ARMOIRE_ITEM_DISPLAY_CHUNK: ArmoireItemDisplayChunk = {
  schemaVersion: ARMOIRE_ITEM_DISPLAY_CHUNK_SCHEMA_VERSION,
  generatedAt: '',
  chunkKey: '',
  chunkSize: ARMOIRE_ITEM_DISPLAY_CHUNK_SIZE,
  items: []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getArmoireItemDisplayChunkKey(itemId: number): string {
  return getArmoireItemIdChunkKey(itemId)
}

export function isArmoireItemDisplayChunk(value: unknown): value is ArmoireItemDisplayChunk {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_ITEM_DISPLAY_CHUNK_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    typeof value.chunkKey === 'string' &&
    value.chunkSize === ARMOIRE_ITEM_DISPLAY_CHUNK_SIZE &&
    isArmoireCompactDisplayItemArray(value.items)
  )
}

export function createArmoireCatalogFromItemDisplayChunks(
  chunks: readonly ArmoireItemDisplayChunk[]
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
    cabinetItemIds: [],
    glamourSetItems: [],
    identicalGroups: [],
    dyes: {}
  }
}
