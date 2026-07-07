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
  filterArmoireSnapshotForActionableItems,
  filterArmoireSnapshotForCatalog,
  hasArmoireCatalogItems
} from '@/lib/armoire/filterSnapshot'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysisOptions,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

export function analyzeArmoireSnapshot(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog = EMPTY_ARMOIRE_CATALOG,
  options: ArmoireSnapshotAnalysisOptions = {}
): ArmoireSnapshotAnalysis {
  const hasCatalogItems = options.filterToCatalogItems === true && hasArmoireCatalogItems(catalog)
  const analysisSnapshot = hasCatalogItems
    ? filterArmoireSnapshotForCatalog(snapshot, catalog)
    : snapshot
  const actionableSnapshot = filterArmoireSnapshotForActionableItems(analysisSnapshot)
  const actionableIndex = buildOwnedIndex(actionableSnapshot)

  return {
    basic: analyzeArmoireBasics(analysisSnapshot),
    cabinetProgress: analyzeCabinetProgress(actionableSnapshot, catalog, actionableIndex),
    glamourSetProgress: analyzeGlamourSets(actionableIndex, catalog),
    dyeRisk: analyzeDyeRisk(actionableSnapshot, catalog, options),
    tradableItems: analyzeTradableItems(actionableIndex, catalog),
    crafterGathererReplicas: analyzeCrafterGathererReplicas(actionableIndex, catalog),
    duplicateItems: analyzeDuplicateItems(actionableIndex),
    identicalModels: analyzeIdenticalModels(actionableIndex, catalog)
  }
}
