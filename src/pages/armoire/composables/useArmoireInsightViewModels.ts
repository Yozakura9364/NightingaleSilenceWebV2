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

export function useArmoireInsightViewModels(source: InsightSource, t: Translate) {
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

  const transferableItems = computed(() => {
    if (!source.analysis || source.analysis.cabinetProgress.status !== 'ready') {
      return []
    }

    return source.analysis.cabinetProgress.transferableItemIds.map(display.toTransferableItem)
  })

  const incompleteSets = computed(() => {
    if (!source.analysis || source.analysis.glamourSetProgress.status !== 'ready') {
      return []
    }

    return source.analysis.glamourSetProgress.sets
      .filter((set) => set.isStoredAsSet && set.missingPieceItemIds.length > 0)
      .map(display.toIncompleteSetView)
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

    return source.analysis.glamourSetProgress.bucketStorableLoosePieceItemIds.map(
      display.toSetBucketLoosePieceItem
    )
  })

  const duplicateItemGroups = computed(() => {
    if (!source.analysis) {
      return []
    }

    return source.analysis.duplicateItems.groups.map((group) =>
      display.toDuplicateItemView(
        group,
        source.snapshot?.items.filter((item) => item.itemId === group.itemId) ?? []
      )
    )
  })

  const duplicateItemItems = computed(() => duplicateItemGroups.value.map(display.toDuplicateItem))

  const duplicateGroups = computed(() => {
    if (!source.analysis || source.analysis.identicalModels.status !== 'ready') {
      return []
    }

    return source.analysis.identicalModels.groups.map(display.toDuplicateGroupView)
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

    return source.analysis.dyeRisk.items
      .filter((item) => item.clearsDyeOnStorage && item.hasValuableDye)
      .map(display.toDyeRiskItem)
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
      items: display.formatItemPreview(source.analysis.cabinetProgress.transferableItemIds)
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
        glamourSetSummary: glamourSetSummary.value,
        duplicateItemSummary: duplicateItemSummary.value,
        duplicateSummary: duplicateSummary.value,
        dyeSummary: dyeSummary.value
      },
      source.hasPendingCatalogChecks === true
    )
  })

  return {
    actionHints,
    cabinetCount,
    incompleteSetCount,
    setBucketLoosePieceCount,
    duplicateItemCount,
    duplicateModelCount,
    dyeRiskCount: dyeClearRiskCount,
    isCabinetCatalogMissing,
    isSetCatalogMissing,
    isSetBucketLoosePieceCatalogMissing,
    isIdenticalModelCatalogMissing,
    cabinetSummary,
    glamourSetSummary,
    duplicateItemSummary,
    duplicateSummary,
    dyeSummary,
    transferableItems,
    incompleteSetItems,
    setBucketLoosePieceItems,
    duplicateItemItems,
    duplicateModelItems,
    dyeRiskItems: dyeClearRiskItems
  }
}
