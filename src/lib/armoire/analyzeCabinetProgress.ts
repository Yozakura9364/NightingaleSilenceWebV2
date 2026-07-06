import { hasCabinetCatalog } from '@/lib/armoire/catalog'
import { getOwnedItems, isDyedOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCabinetProgress,
  ArmoireCatalog,
  ArmoireOwnedIndex,
  ArmoireSnapshot
} from '@/lib/armoire/types'

export function analyzeCabinetProgress(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog,
  index: ArmoireOwnedIndex
): ArmoireCabinetProgress {
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

  const cabinetItemIds = Array.from(new Set(catalog.cabinetItemIds)).sort(
    (left, right) => left - right
  )
  const storedItemIds: number[] = []
  const ownedCabinetItemIds: number[] = []
  const dyedOwnedCabinetItemIds: number[] = []
  const transferableItemIds: number[] = []
  const missingCabinetItemIds: number[] = []

  for (const itemId of cabinetItemIds) {
    const ownedItems = getOwnedItems(index, itemId)
    const isStoredInArmoire = ownedItems.some((item) => item.container === 'armoire')

    if (isStoredInArmoire) {
      storedItemIds.push(itemId)
    } else {
      missingCabinetItemIds.push(itemId)
    }

    if (ownedItems.length === 0 || isStoredInArmoire) {
      continue
    }

    ownedCabinetItemIds.push(itemId)

    let hasDyedItem = false
    let hasUndyedItem = false

    for (const item of ownedItems) {
      if (isDyedOwnedItem(item)) {
        hasDyedItem = true
      } else {
        hasUndyedItem = true
      }
    }

    if (hasDyedItem) {
      dyedOwnedCabinetItemIds.push(itemId)
    }

    if (hasUndyedItem) {
      transferableItemIds.push(itemId)
    }
  }

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
