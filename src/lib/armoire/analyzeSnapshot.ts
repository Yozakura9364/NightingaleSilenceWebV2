import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import { analyzeArmoireBasics } from '@/lib/armoire/analyzeContainerDistribution'
import { analyzeCabinetProgress } from '@/lib/armoire/analyzeCabinetProgress'
import { analyzeDuplicateItems } from '@/lib/armoire/analyzeDuplicateItems'
import { analyzeDyeRisk } from '@/lib/armoire/analyzeDyeRisk'
import { analyzeGlamourSets } from '@/lib/armoire/analyzeGlamourSets'
import { analyzeIdenticalModels } from '@/lib/armoire/analyzeIdenticalModels'
import { buildOwnedIndex } from '@/lib/armoire/buildOwnedIndex'
import {
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
  const index = buildOwnedIndex(analysisSnapshot)

  return {
    basic: analyzeArmoireBasics(analysisSnapshot),
    cabinetProgress: analyzeCabinetProgress(analysisSnapshot, catalog, index),
    glamourSetProgress: analyzeGlamourSets(index, catalog),
    dyeRisk: analyzeDyeRisk(analysisSnapshot, catalog, options),
    duplicateItems: analyzeDuplicateItems(index),
    identicalModels: analyzeIdenticalModels(index, catalog)
  }
}
