import { hasCabinetCatalog } from '@/lib/armoire/catalog'
import {
  buildOwnedIndex,
  getOwnedItems,
  hasOwnedItem,
  hasOwnedItemInContainer,
  isDyedOwnedItem
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCabinetProgress,
  ArmoireCatalog,
  ArmoireSnapshot
} from '@/lib/armoire/types'

export function analyzeCabinetProgress(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog
): ArmoireCabinetProgress {
  const index = buildOwnedIndex(snapshot)

  if (!hasCabinetCatalog(catalog)) {
    return {
      status: 'missingCatalog',
      storedCount: snapshot.items.filter((item) => item.container === 'armoire').length,
      storableCount: 0,
      transferableItemIds: [],
      ownedCabinetItemIds: [],
      dyedOwnedCabinetItemIds: [],
      missingCabinetItemIds: []
    }
  }

  const cabinetItemIds = Array.from(new Set(catalog.cabinetItemIds)).sort((left, right) => left - right)
  const storedItemIds = cabinetItemIds.filter((itemId) =>
    hasOwnedItemInContainer(index, itemId, 'armoire')
  )
  const ownedCabinetItemIds = cabinetItemIds.filter(
    (itemId) => hasOwnedItem(index, itemId) && !hasOwnedItemInContainer(index, itemId, 'armoire')
  )
  const dyedOwnedCabinetItemIds = ownedCabinetItemIds.filter((itemId) =>
    getOwnedItems(index, itemId).some(isDyedOwnedItem)
  )
  const transferableItemIds = ownedCabinetItemIds.filter((itemId) =>
    getOwnedItems(index, itemId).some((item) => !isDyedOwnedItem(item))
  )
  const missingCabinetItemIds = cabinetItemIds.filter(
    (itemId) => !hasOwnedItemInContainer(index, itemId, 'armoire')
  )

  return {
    status: 'ready',
    storedCount: storedItemIds.length,
    storableCount: cabinetItemIds.length,
    transferableItemIds,
    ownedCabinetItemIds,
    dyedOwnedCabinetItemIds,
    missingCabinetItemIds
  }
}
