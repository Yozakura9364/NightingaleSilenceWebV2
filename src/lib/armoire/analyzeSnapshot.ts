import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import { analyzeArmoireBasics } from '@/lib/armoire/analyzeContainerDistribution'
import { analyzeCabinetProgress } from '@/lib/armoire/analyzeCabinetProgress'
import { analyzeCrafterGathererReplicas } from '@/lib/armoire/analyzeCrafterGathererReplicas'
import { analyzeDuplicateItems } from '@/lib/armoire/analyzeDuplicateItems'
import { analyzeDyeRisk } from '@/lib/armoire/analyzeDyeRisk'
import { analyzeGlamourSets } from '@/lib/armoire/analyzeGlamourSets'
import { analyzeIdenticalModels } from '@/lib/armoire/analyzeIdenticalModels'
import { analyzeTradableItems } from '@/lib/armoire/analyzeTradableItems'
import { buildOwnedIndex } from '@/lib/armoire/buildOwnedIndex'
import {
  filterArmoireSnapshotForDuplicateSuggestions,
  filterArmoireSnapshotForActionableItems,
  filterArmoireSnapshotForCatalog,
  hasArmoireCatalogItems
} from '@/lib/armoire/filterSnapshot'
import type {
  ArmoireCatalog,
  ArmoireOwnedItem,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysisOptions,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

function isIgnoredItem(item: ArmoireOwnedItem, ignoredItemIds: ReadonlySet<number>): boolean {
  return ignoredItemIds.has(item.itemId)
}

function filterIgnoredItems(
  snapshot: ArmoireSnapshot,
  ignoredItemIds: readonly number[] | undefined
): ArmoireSnapshot {
  if (!ignoredItemIds?.length) {
    return snapshot
  }

  const ignoredItemIdSet = new Set(
    ignoredItemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0)
  )

  if (ignoredItemIdSet.size === 0) {
    return snapshot
  }

  const items = snapshot.items.filter((item) => !isIgnoredItem(item, ignoredItemIdSet))

  return items.length === snapshot.items.length ? snapshot : { ...snapshot, items }
}

export function analyzeArmoireSnapshot(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog = EMPTY_ARMOIRE_CATALOG,
  options: ArmoireSnapshotAnalysisOptions = {}
): ArmoireSnapshotAnalysis {
  const hasCatalogItems = options.filterToCatalogItems === true && hasArmoireCatalogItems(catalog)
  const analysisSnapshot = hasCatalogItems
    ? filterArmoireSnapshotForCatalog(snapshot, catalog)
    : snapshot
  const featureSnapshot = filterArmoireSnapshotForActionableItems(analysisSnapshot)
  const actionableSnapshot = filterIgnoredItems(
    featureSnapshot,
    options.ignoredItemIds
  )
  const actionableIndex = buildOwnedIndex(actionableSnapshot)
  const glamourSetProgress = analyzeGlamourSets(actionableIndex, catalog, options)
  const duplicateSuggestionSnapshot = filterArmoireSnapshotForDuplicateSuggestions(actionableSnapshot)
  const duplicateSuggestionIndex =
    duplicateSuggestionSnapshot === actionableSnapshot
      ? actionableIndex
      : buildOwnedIndex(duplicateSuggestionSnapshot)

  return {
    basic: analyzeArmoireBasics(featureSnapshot),
    cabinetProgress: analyzeCabinetProgress(actionableSnapshot, catalog, actionableIndex),
    glamourSetProgress,
    dyeRisk: analyzeDyeRisk(actionableSnapshot, catalog, options),
    tradableItems: analyzeTradableItems(actionableIndex, catalog),
    crafterGathererReplicas: analyzeCrafterGathererReplicas(actionableIndex, catalog),
    duplicateItems: analyzeDuplicateItems(duplicateSuggestionIndex),
    identicalModels: analyzeIdenticalModels(duplicateSuggestionIndex, catalog)
  }
}
