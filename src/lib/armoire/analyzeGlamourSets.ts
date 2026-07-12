import { hasGlamourSetCatalog } from '@/lib/armoire/catalog'
import { getArmoireDyeValueCategory } from '@/lib/armoire/dyeValue'
import {
  getEffectiveOwnedItemDyes,
  getOwnedItems,
  hasOwnedItemInContainer
} from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireDyeValueCategory,
  ArmoireDyeRiskOptions,
  ArmoireGlamourSetProgress,
  ArmoireGlamourSetPieceEntry,
  ArmoireGlamourSetPieceOwnership,
  ArmoireGlamourSetState,
  ArmoireOwnedIndex,
  ArmoireOwnedItem
} from '@/lib/armoire/types'
import {
  DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES,
  DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS
} from '@/lib/armoire/types'

const SET_BUCKET_STORAGE_CONTAINERS = new Set<ArmoireContainerKind>([
  'inventory',
  'saddlebag',
  'retainer',
  'armoury',
  'glamourDresser'
])

function isSetBucketStorageCandidate(item: ArmoireOwnedItem): boolean {
  return SET_BUCKET_STORAGE_CONTAINERS.has(item.container)
}

function analyzeGlamourSetState(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog,
  valuableDyeCategories: ReadonlySet<ArmoireDyeValueCategory>,
  valuableDyeIds: ReadonlySet<number>,
  setItemId: number,
  pieceSlotItemIds: number[] | undefined,
  pieceItemIds: number[],
  setName?: string
): ArmoireGlamourSetState {
  const uniquePieceItemIds = Array.from(new Set(pieceItemIds)).filter((itemId) => itemId > 0)
  const isStoredAsSet = hasOwnedItemInContainer(index, setItemId, 'glamourDresser')
  const bucketStoredPieceItemIds = getStoredByBucketGlamourSetPieceItemIds(
    index,
    setItemId,
    pieceSlotItemIds,
    uniquePieceItemIds,
    isStoredAsSet
  )
  const rawLoosePieceEntriesByItemId = getLooseGlamourSetPieceEntriesByItemId(
    index,
    catalog,
    uniquePieceItemIds,
    valuableDyeCategories,
    valuableDyeIds
  )
  const bucketStoredPieceItemIdSet = new Set(bucketStoredPieceItemIds)
  const pieceOwnershipByItemId: Record<number, ArmoireGlamourSetPieceOwnership> = {}
  const loosePieceItemIds: number[] = []
  const storedPieceItemIds: number[] = []
  const missingPieceItemIds: number[] = []

  for (const itemId of uniquePieceItemIds) {
    const looseEntries = rawLoosePieceEntriesByItemId[itemId] ?? []
    const storedByBucket = bucketStoredPieceItemIdSet.has(itemId)
    const status = storedByBucket ? 'stored' : looseEntries.length > 0 ? 'loose' : 'missing'

    pieceOwnershipByItemId[itemId] = {
      itemId,
      storedByBucket,
      looseEntries,
      status
    }

    if (status === 'stored') {
      storedPieceItemIds.push(itemId)
    } else if (status === 'loose') {
      loosePieceItemIds.push(itemId)
      storedPieceItemIds.push(itemId)
    } else {
      missingPieceItemIds.push(itemId)
    }
  }

  const storedByBucketPieceItemIds = bucketStoredPieceItemIds
  const loosePieceEntriesByItemId = rawLoosePieceEntriesByItemId
  const catalogItem = catalog.items[setItemId]

  return {
    setItemId,
    setName: setName ?? catalogItem?.name,
    isStoredAsSet,
    pieceItemIds: uniquePieceItemIds,
    storedPieceItemIds,
    loosePieceItemIds,
    storedByBucketPieceItemIds,
    loosePieceEntriesByItemId,
    pieceOwnershipByItemId,
    missingPieceItemIds
  }
}

function getLooseGlamourSetPieceEntriesByItemId(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog,
  pieceItemIds: readonly number[],
  valuableDyeCategories: ReadonlySet<ArmoireDyeValueCategory>,
  valuableDyeIds: ReadonlySet<number>
): Record<number, ArmoireGlamourSetPieceEntry[]> {
  const entriesByItemId: Record<number, ArmoireGlamourSetPieceEntry[]> = {}

  for (const itemId of pieceItemIds) {
    const entries = getOwnedItems(index, itemId)
      .filter(isSetBucketStorageCandidate)
      .map((item) => toGlamourSetPieceEntry(item, catalog, valuableDyeCategories, valuableDyeIds))

    if (entries.length > 0) {
      entriesByItemId[itemId] = entries
    }
  }

  return entriesByItemId
}

function getStoredByBucketGlamourSetPieceItemIds(
  index: ArmoireOwnedIndex,
  setItemId: number,
  pieceSlotItemIds: readonly number[] | undefined,
  pieceItemIds: readonly number[],
  isStoredAsSet: boolean
): number[] {
  const storedPieceItemIds = new Set<number>()

  if (!isStoredAsSet) {
    return []
  }

  const setEntries = getOwnedItems(index, setItemId).filter(
    (item) => item.container === 'glamourDresser'
  )
  const hasSlotItemIds = pieceSlotItemIds && pieceSlotItemIds.length > 0
  const slotItemIds = hasSlotItemIds ? pieceSlotItemIds : pieceItemIds

  for (const entry of setEntries) {
    const missingBits = getMissingGlamourSetPieceBits(entry)
    if (!hasSlotItemIds || missingBits <= 0) {
      for (const itemId of pieceItemIds) {
        storedPieceItemIds.add(itemId)
      }

      continue
    }

    for (let slot = 0; slot < slotItemIds.length; slot += 1) {
      const itemId = slotItemIds[slot]
      if (!itemId || itemId <= 0) {
        continue
      }

      if ((missingBits & (1 << slot)) === 0) {
        storedPieceItemIds.add(itemId)
      }
    }
  }

  return Array.from(storedPieceItemIds).sort((left, right) => left - right)
}

function getMissingGlamourSetPieceBits(entry: ArmoireOwnedItem): number {
  const lowBits = entry.dyes?.[0] ?? 0
  const highBits = entry.dyes?.[1] ?? 0

  return lowBits | (highBits << 8)
}

function toGlamourSetPieceEntry(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog,
  valuableDyeCategories: ReadonlySet<ArmoireDyeValueCategory>,
  selectedValuableDyeIds: ReadonlySet<number>
): ArmoireGlamourSetPieceEntry {
  const dyeIds = getEffectiveOwnedItemDyes(item)
  const matchedValuableDyeIds = dyeIds.filter((dyeId) =>
    isValuableDye(dyeId, catalog, valuableDyeCategories, selectedValuableDyeIds)
  )

  return {
    itemId: item.itemId,
    container: item.container,
    containerName: item.containerName,
    dyeIds,
    valuableDyeIds: matchedValuableDyeIds,
    hasValuableDye: matchedValuableDyeIds.length > 0
  }
}

function isValuableDye(
  dyeId: number,
  catalog: ArmoireCatalog,
  valuableDyeCategories: ReadonlySet<ArmoireDyeValueCategory>,
  selectedValuableDyeIds: ReadonlySet<number>
): boolean {
  if (dyeId <= 0) {
    return false
  }

  const category = getArmoireDyeValueCategory(dyeId, catalog)

  return selectedValuableDyeIds.has(dyeId) || Boolean(category && valuableDyeCategories.has(category))
}

function createBucketStorableLoosePieceItemIds(
  catalog: ArmoireCatalog,
  sets: ArmoireGlamourSetState[]
): number[] {
  const cabinetItemIds = new Set(catalog.cabinetItemIds)
  const pieceItemIds = new Set<number>()

  for (const set of sets) {
    if (!set.isStoredAsSet) {
      continue
    }

    for (const itemId of set.loosePieceItemIds) {
      if (cabinetItemIds.has(itemId)) {
        continue
      }

      pieceItemIds.add(itemId)
    }
  }

  return Array.from(pieceItemIds).sort((left, right) => left - right)
}

export function analyzeGlamourSets(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog,
  options: ArmoireDyeRiskOptions = {}
): ArmoireGlamourSetProgress {
  if (!hasGlamourSetCatalog(catalog)) {
    return {
      status: 'missingCatalog',
      storedSetCount: 0,
      availableSetCount: 0,
      incompleteStoredSetCount: 0,
      bucketStorableLoosePieceItemIds: [],
      storedByBucketPieceItemIds: [],
      sets: []
    }
  }

  const selectedValuableDyeCategories = new Set(
    options.valuableDyeCategories ?? DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES
  )
  const selectedValuableDyeIds = new Set(
    options.valuableDyeIds ?? DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS
  )
  const sets = catalog.glamourSetItems
    .map((set) =>
      analyzeGlamourSetState(
        index,
        catalog,
        selectedValuableDyeCategories,
        selectedValuableDyeIds,
        set.setItemId,
        set.pieceSlotItemIds,
        set.pieceItemIds,
        set.setName
      )
    )
    .sort((left, right) => {
      if (Number(right.isStoredAsSet) !== Number(left.isStoredAsSet)) {
        return Number(right.isStoredAsSet) - Number(left.isStoredAsSet)
      }

      return left.setItemId - right.setItemId
    })

  return {
    status: 'ready',
    storedSetCount: sets.filter((set) => set.isStoredAsSet).length,
    availableSetCount: sets.length,
    incompleteStoredSetCount: sets.filter(
      (set) => set.isStoredAsSet && set.missingPieceItemIds.length > 0
    ).length,
    bucketStorableLoosePieceItemIds: createBucketStorableLoosePieceItemIds(catalog, sets),
    storedByBucketPieceItemIds: Array.from(
      new Set(sets.flatMap((set) => set.storedByBucketPieceItemIds))
    ).sort((left, right) => left - right),
    sets
  }
}
