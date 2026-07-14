import { getOwnedItems, isDyedOwnedItem } from '@/lib/armoire/buildOwnedIndex'
import { buildArmoireCabinetEntryByItemId } from '@/lib/armoire/cabinetDomain'
import type { ArmoireCabinetCatalogView } from '@/lib/armoire/cabinetDomain'
import type {
  ArmoireCabinetProgress,
  ArmoireOwnedIndex,
  ArmoireSnapshot
} from '@/lib/armoire/types'

export function analyzeCabinetProgress(
  snapshot: ArmoireSnapshot,
  cabinetCatalog: ArmoireCabinetCatalogView,
  index: ArmoireOwnedIndex
): ArmoireCabinetProgress {
  if (cabinetCatalog.cabinetItemIds.length === 0) {
    return {
      status: 'missingCatalog',
      storedCount: snapshot.items.filter((item) => item.container === 'armoire').length,
      storableCount: 0,
      transferableItemIds: [],
      transferableEntriesByItemId: {},
      ownedCabinetItemIds: [],
      dyedOwnedCabinetItemIds: [],
      missingCabinetItemIds: []
    }
  }

  const cabinetItemIds = cabinetCatalog.cabinetItemIds
  const cabinetEntries = cabinetCatalog.cabinetEntries
  const cabinetEntryByItemId = buildArmoireCabinetEntryByItemId(cabinetEntries)
  const storedCabinetIds = new Set(
    snapshot.items
      .filter((item) => item.container === 'armoire' && typeof item.cabinetId === 'number')
      .map((item) => item.cabinetId as number)
  )
  const storedItemIds = new Set(
    snapshot.items.filter((item) => item.container === 'armoire').map((item) => item.itemId)
  )
  const ownedCabinetItemIds: number[] = []
  const dyedOwnedCabinetItemIds: number[] = []
  const transferableItemIds: number[] = []
  const transferableEntriesByItemId: Record<number, typeof snapshot.items> = {}
  const missingCabinetItemIds: number[] = []
  const missingCabinetItemIdSet = new Set<number>()

  for (const entry of cabinetEntries) {
    if (storedCabinetIds.has(entry.cabinetId) || storedItemIds.has(entry.itemId)) {
      storedItemIds.add(entry.itemId)
    } else {
      missingCabinetItemIdSet.add(entry.itemId)
    }
  }

  for (const itemId of cabinetItemIds) {
    const ownedItems = getOwnedItems(index, itemId)
    const cabinetEntry = cabinetEntryByItemId.get(itemId)
    const isStoredInArmoire =
      storedItemIds.has(itemId) ||
      (cabinetEntry
        ? storedCabinetIds.has(cabinetEntry.cabinetId)
        : ownedItems.some((item) => item.container === 'armoire'))

    if (cabinetEntries.length === 0) {
      if (isStoredInArmoire) {
        storedItemIds.add(itemId)
      } else {
        missingCabinetItemIdSet.add(itemId)
      }
    }

    if (ownedItems.length === 0 || isStoredInArmoire) {
      continue
    }

    ownedCabinetItemIds.push(itemId)

    let hasDyedItem = false

    for (const item of ownedItems) {
      if (isDyedOwnedItem(item)) {
        hasDyedItem = true
      }
    }

    if (hasDyedItem) {
      dyedOwnedCabinetItemIds.push(itemId)
    }

    transferableItemIds.push(itemId)
    transferableEntriesByItemId[itemId] = ownedItems.filter((item) => item.container !== 'armoire')
  }

  missingCabinetItemIds.push(...missingCabinetItemIdSet)

  return {
    status: 'ready',
    storedCount:
      storedCabinetIds.size > 0
        ? Math.max(storedCabinetIds.size, storedItemIds.size)
        : storedItemIds.size,
    storableCount: cabinetEntries.length > 0 ? cabinetEntries.length : cabinetItemIds.length,
    transferableItemIds,
    transferableEntriesByItemId,
    ownedCabinetItemIds,
    dyedOwnedCabinetItemIds,
    missingCabinetItemIds
  }
}
