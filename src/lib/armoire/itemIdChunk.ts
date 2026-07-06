export const ARMOIRE_ITEM_ID_CHUNK_SIZE = 2000

export function getArmoireItemIdChunkKey(itemId: number): string {
  const chunkStart =
    Math.floor(Math.max(0, Math.trunc(itemId)) / ARMOIRE_ITEM_ID_CHUNK_SIZE) *
    ARMOIRE_ITEM_ID_CHUNK_SIZE

  return String(chunkStart).padStart(6, '0')
}

export function getArmoireItemIdChunkKeys(itemIds: readonly number[]): string[] {
  return Array.from(
    new Set(
      itemIds
        .filter((itemId) => Number.isInteger(itemId) && itemId > 0)
        .map(getArmoireItemIdChunkKey)
    )
  ).sort()
}
