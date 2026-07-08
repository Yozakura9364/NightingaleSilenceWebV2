import { computed } from 'vue'
import { textKeys } from '@/config/site'
import type { ArmoireCatalog, ArmoireSnapshot, ArmoireSnapshotAnalysis } from '@/lib/armoire/types'
import {
  buildArmoireActionHints,
  createArmoireInsightDisplay
} from '@/pages/armoire/utils/insightDisplay'
import { getArmoireContainerLabel } from '@/pages/armoire/utils/itemDisplay'

type Translate = (key: string) => string
const NO_SPACE_COST_CONTAINERS = new Set(['armoire'])

interface InsightSource {
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
  hasPendingCatalogChecks?: boolean
}

type InsightListKey =
  | 'cabinet'
  | 'sets'
  | 'setPieces'
  | 'tradableItems'
  | 'crafterGathererReplicas'
  | 'duplicateItems'
  | 'duplicateModels'
  | 'dyes'

interface InsightViewOptions {
  getListLimit?: (key: InsightListKey) => number | undefined
}

export function useArmoireInsightViewModels(
  source: InsightSource,
  t: Translate,
  options: InsightViewOptions = {}
) {
  function limitItems<T>(key: InsightListKey, items: readonly T[]): readonly T[] {
    const limit = options.getListLimit?.(key)

    if (typeof limit !== 'number') {
      return items
    }

    return items.slice(0, Math.max(0, limit))
  }

  function addItemLocation(
    locations: Map<number, string[]>,
    item: ArmoireSnapshot['items'][number]
  ) {
    const label = getArmoireContainerLabel(item, t)
    const itemLocations = locations.get(item.itemId) ?? []

    if (!itemLocations.includes(label)) {
      itemLocations.push(label)
    }

    locations.set(item.itemId, itemLocations)
  }

  const itemLocationsByItemId = computed(() => {
    const locations = new Map<number, string[]>()

    for (const item of source.snapshot?.items ?? []) {
      addItemLocation(locations, item)
    }

    return locations
  })

  const ownedEntriesByItemId = computed(() => {
    const entries = new Map<number, ArmoireSnapshot['items']>()

    for (const item of source.snapshot?.items ?? []) {
      const itemEntries = entries.get(item.itemId)

      if (itemEntries) {
        itemEntries.push(item)
      } else {
        entries.set(item.itemId, [item])
      }
    }

    return entries
  })

  const storageSpaceItemLocationsByItemId = computed(() => {
    const locations = new Map<number, string[]>()

    for (const item of source.snapshot?.items ?? []) {
      if (NO_SPACE_COST_CONTAINERS.has(item.container)) {
        continue
      }

      addItemLocation(locations, item)
    }

    return locations
  })

  const display = createArmoireInsightDisplay(
    source,
    t,
    () => itemLocationsByItemId.value,
    () => storageSpaceItemLocationsByItemId.value
  )

  const valuableClearDyeItemsByItemId = computed(() => {
    const items = new Map<number, NonNullable<ArmoireSnapshotAnalysis['dyeRisk']['items'][number]>>()

    for (const item of source.analysis?.dyeRisk.items ?? []) {
      if (item.hasValuableDye && item.clearsDyeOnStorage && !items.has(item.itemId)) {
        items.set(item.itemId, item)
      }
    }

    return items
  })

  function sortByValuableClearDyeRisk(itemIds: readonly number[]): number[] {
    return itemIds.slice().sort((left, right) => {
      const leftHasValuableDye = valuableClearDyeItemsByItemId.value.has(left)
      const rightHasValuableDye = valuableClearDyeItemsByItemId.value.has(right)

      if (Number(leftHasValuableDye) !== Number(rightHasValuableDye)) {
        return Number(leftHasValuableDye) - Number(rightHasValuableDye)
      }

      return left - right
    })
  }

  const sortedTransferableItemIds = computed(() => {
    if (!source.analysis || source.analysis.cabinetProgress.status !== 'ready') {
      return []
    }

    return sortByValuableClearDyeRisk(source.analysis.cabinetProgress.transferableItemIds)
  })

  const transferableItems = computed(() => {
    if (!source.analysis || source.analysis.cabinetProgress.status !== 'ready') {
      return []
    }

    return limitItems('cabinet', sortedTransferableItemIds.value).map((itemId) =>
      display.toTransferableItem(itemId, valuableClearDyeItemsByItemId.value.get(itemId))
    )
  })

  const incompleteSets = computed(() => {
    if (!source.analysis || source.analysis.glamourSetProgress.status !== 'ready') {
      return []
    }

    const sets = source.analysis.glamourSetProgress.sets.filter(
      (set) => set.isStoredAsSet && set.missingPieceItemIds.length > 0
    )

    return limitItems('sets', sets).map(display.toIncompleteSetView)
  })

  const incompleteSetItems = computed(() => incompleteSets.value.map(display.toIncompleteSetItem))

  const setBucketLoosePieceItems = computed(() => {
    if (
      !source.analysis ||
      source.analysis.glamourSetProgress.status !== 'ready' ||
      source.analysis.cabinetProgress.status !== 'ready'
    ) {
      return []
    }

    const itemIds = sortByValuableClearDyeRisk(
      source.analysis.glamourSetProgress.bucketStorableLoosePieceItemIds
    )

    return limitItems('setPieces', itemIds).map((itemId) =>
      display.toSetBucketLoosePieceItem(itemId, valuableClearDyeItemsByItemId.value.get(itemId))
    )
  })

  const tradableItems = computed(() => {
    if (!source.analysis || source.analysis.tradableItems.status !== 'ready') {
      return []
    }

    return limitItems('tradableItems', source.analysis.tradableItems.items).map(
      display.toTradableItem
    )
  })

  const crafterGathererReplicaItems = computed(() => {
    if (!source.analysis || source.analysis.crafterGathererReplicas.status !== 'ready') {
      return []
    }

    return limitItems(
      'crafterGathererReplicas',
      source.analysis.crafterGathererReplicas.items
    ).map(display.toCrafterGathererReplicaItem)
  })

  const duplicateItemGroups = computed(() => {
    if (!source.analysis) {
      return []
    }

    return limitItems('duplicateItems', source.analysis.duplicateItems.groups).map((group) =>
      display.toDuplicateItemView(group, ownedEntriesByItemId.value.get(group.itemId) ?? [])
    )
  })

  const duplicateItemItems = computed(() => duplicateItemGroups.value.map(display.toDuplicateItem))

  const duplicateGroups = computed(() => {
    if (!source.analysis || source.analysis.identicalModels.status !== 'ready') {
      return []
    }

    return limitItems('duplicateModels', source.analysis.identicalModels.groups).map(
      display.toDuplicateGroupView
    )
  })

  const duplicateModelItems = computed(() =>
    duplicateGroups.value.map(display.toDuplicateModelItem)
  )

  const allDyeRiskItems = computed(() => {
    if (!source.analysis) {
      return []
    }

    return source.analysis.dyeRisk.items.map(display.toDyeRiskItem)
  })

  const dyeClearRiskItems = computed(() => {
    if (!source.analysis) {
      return []
    }

    const items = source.analysis.dyeRisk.items.filter(
      (item) => item.clearsDyeOnStorage && item.hasValuableDye
    )

    return limitItems('dyes', items).map(display.toDyeRiskItem)
  })

  const cabinetCount = computed(() =>
    source.analysis?.cabinetProgress.status === 'ready'
      ? source.analysis.cabinetProgress.transferableItemIds.length
      : null
  )

  const incompleteSetCount = computed(() =>
    source.analysis?.glamourSetProgress.status === 'ready'
      ? source.analysis.glamourSetProgress.incompleteStoredSetCount
      : null
  )

  const setBucketLoosePieceCount = computed(() =>
    source.analysis?.glamourSetProgress.status === 'ready' &&
    source.analysis.cabinetProgress.status === 'ready'
      ? source.analysis.glamourSetProgress.bucketStorableLoosePieceItemIds.length
      : null
  )

  const tradableItemCount = computed(() =>
    source.analysis?.tradableItems.status === 'ready'
      ? source.analysis.tradableItems.unboundTradableEntryCount
      : null
  )

  const crafterGathererReplicaCount = computed(() =>
    source.analysis?.crafterGathererReplicas.status === 'ready'
      ? source.analysis.crafterGathererReplicas.entryCount
      : null
  )

  const duplicateItemCount = computed(() => source.analysis?.duplicateItems.duplicateItemCount ?? 0)

  const duplicateModelCount = computed(() =>
    source.analysis?.identicalModels.status === 'ready'
      ? source.analysis.identicalModels.duplicateGroupCount
      : null
  )

  const dyeClearRiskCount = computed(() => source.analysis?.dyeRisk.highRiskItemCount ?? 0)

  const isCabinetCatalogMissing = computed(
    () => source.analysis?.cabinetProgress.status === 'missingCatalog'
  )

  const isSetCatalogMissing = computed(
    () => source.analysis?.glamourSetProgress.status === 'missingCatalog'
  )

  const isSetBucketLoosePieceCatalogMissing = computed(
    () =>
      source.analysis?.glamourSetProgress.status === 'missingCatalog' ||
      source.analysis?.cabinetProgress.status === 'missingCatalog'
  )

  const isTradableCatalogMissing = computed(
    () => source.analysis?.tradableItems.status === 'missingCatalog'
  )

  const isCrafterGathererReplicaCatalogMissing = computed(
    () => source.analysis?.crafterGathererReplicas.status === 'missingCatalog'
  )

  const isIdenticalModelCatalogMissing = computed(
    () => source.analysis?.identicalModels.status === 'missingCatalog'
  )

  const cabinetSummary = computed(() => {
    if (!source.analysis || source.analysis.cabinetProgress.status !== 'ready') {
      return ''
    }

    const count = source.analysis.cabinetProgress.transferableItemIds.length

    if (count === 0) {
      return t(textKeys.nsarmoireHintCabinetNone)
    }

    return display.formatText(textKeys.nsarmoireHintCabinetSummary, {
      count,
      items: display.formatItemPreview(sortedTransferableItemIds.value)
    })
  })

  const glamourSetSummary = computed(() => {
    if (!source.analysis || source.analysis.glamourSetProgress.status !== 'ready') {
      return ''
    }

    const count = source.analysis.glamourSetProgress.incompleteStoredSetCount

    if (count === 0) {
      return t(textKeys.nsarmoireHintSetsNone)
    }

    return display.formatText(textKeys.nsarmoireHintSetsSummary, {
      count,
      items: incompleteSets.value.map((set) => set.name).join(' / ')
    })
  })

  const duplicateItemSummary = computed(() => {
    if (!source.analysis) {
      return ''
    }

    const count = source.analysis.duplicateItems.duplicateItemCount

    if (count === 0) {
      return t(textKeys.nsarmoireHintDuplicateItemsNone)
    }

    return display.formatText(textKeys.nsarmoireHintDuplicateItemsSummary, {
      count,
      items: display.formatItemPreview(
        source.analysis.duplicateItems.groups.map((group) => group.itemId)
      )
    })
  })

  const tradableSummary = computed(() => {
    if (!source.analysis || source.analysis.tradableItems.status !== 'ready') {
      return ''
    }

    const count = source.analysis.tradableItems.unboundTradableEntryCount

    if (count === 0) {
      return t(textKeys.nsarmoireHintTradableItemsNone)
    }

    return display.formatText(textKeys.nsarmoireHintTradableItemsSummary, {
      count,
      items: display.formatItemPreview(source.analysis.tradableItems.items.map((item) => item.itemId))
    })
  })

  const crafterGathererReplicaSummary = computed(() => {
    if (!source.analysis || source.analysis.crafterGathererReplicas.status !== 'ready') {
      return ''
    }

    return display.formatReplicaRecycleSummary(source.analysis.crafterGathererReplicas)
  })

  const duplicateSummary = computed(() => {
    if (!source.analysis || source.analysis.identicalModels.status !== 'ready') {
      return ''
    }

    const count = source.analysis.identicalModels.duplicateGroupCount

    if (count === 0) {
      return t(textKeys.nsarmoireHintDuplicatesNone)
    }

    return display.formatText(textKeys.nsarmoireHintDuplicatesSummary, {
      count,
      items: duplicateGroups.value.map((group) => group.names.join(' / ')).join('；')
    })
  })

  const dyeSummary = computed(() => {
    if (!source.analysis) {
      return ''
    }

    const count = source.analysis.dyeRisk.riskItemCount
    const clearRiskCount = source.analysis.dyeRisk.highRiskItemCount

    if (count === 0) {
      return t(textKeys.nsarmoireNoDyeRisk)
    }

    if (clearRiskCount === 0) {
      return display.formatText(textKeys.nsarmoireHintDyesPreserved, {
        count,
        items: allDyeRiskItems.value.map((item) => item.name).join(' / ')
      })
    }

    return display.formatText(textKeys.nsarmoireHintDyesSummary, {
      count: clearRiskCount,
      items: dyeClearRiskItems.value.map((item) => item.name).join(' / ')
    })
  })

  const actionHints = computed(() => {
    if (!source.analysis) {
      return []
    }

    return buildArmoireActionHints(
      source.analysis,
      t,
      {
        cabinetSummary: cabinetSummary.value,
        tradableSummary: tradableSummary.value,
        replicaSummary: crafterGathererReplicaSummary.value,
        duplicateItemSummary: duplicateItemSummary.value,
        duplicateSummary: duplicateSummary.value
      },
      source.hasPendingCatalogChecks === true
    )
  })

  return {
    actionHints,
    cabinetCount,
    incompleteSetCount,
    setBucketLoosePieceCount,
    tradableItemCount,
    crafterGathererReplicaCount,
    duplicateItemCount,
    duplicateModelCount,
    dyeRiskCount: dyeClearRiskCount,
    isCabinetCatalogMissing,
    isSetCatalogMissing,
    isSetBucketLoosePieceCatalogMissing,
    isTradableCatalogMissing,
    isCrafterGathererReplicaCatalogMissing,
    isIdenticalModelCatalogMissing,
    cabinetSummary,
    glamourSetSummary,
    duplicateItemSummary,
    tradableSummary,
    crafterGathererReplicaSummary,
    duplicateSummary,
    dyeSummary,
    transferableItems,
    incompleteSetItems,
    setBucketLoosePieceItems,
    tradableItems,
    crafterGathererReplicaItems,
    duplicateItemItems,
    duplicateModelItems,
    dyeRiskItems: dyeClearRiskItems
  }
}
