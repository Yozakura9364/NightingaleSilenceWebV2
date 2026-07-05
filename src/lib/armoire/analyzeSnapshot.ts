import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import { analyzeArmoireBasics } from '@/lib/armoire/analyzeContainerDistribution'
import { analyzeCabinetProgress } from '@/lib/armoire/analyzeCabinetProgress'
import { analyzeDuplicateItems } from '@/lib/armoire/analyzeDuplicateItems'
import { analyzeDyeRisk } from '@/lib/armoire/analyzeDyeRisk'
import { analyzeGlamourSets } from '@/lib/armoire/analyzeGlamourSets'
import { analyzeIdenticalModels } from '@/lib/armoire/analyzeIdenticalModels'
import { filterArmoireSnapshotForCatalog } from '@/lib/armoire/filterSnapshot'
import type {
  ArmoireCatalog,
  ArmoireDyeRiskOptions,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

export function analyzeArmoireSnapshot(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog = EMPTY_ARMOIRE_CATALOG,
  options: ArmoireDyeRiskOptions = {}
): ArmoireSnapshotAnalysis {
  const catalogSnapshot = filterArmoireSnapshotForCatalog(snapshot, catalog)

  return {
    basic: analyzeArmoireBasics(catalogSnapshot),
    cabinetProgress: analyzeCabinetProgress(catalogSnapshot, catalog),
    glamourSetProgress: analyzeGlamourSets(catalogSnapshot, catalog),
    dyeRisk: analyzeDyeRisk(catalogSnapshot, catalog, options),
    duplicateItems: analyzeDuplicateItems(catalogSnapshot),
    identicalModels: analyzeIdenticalModels(catalogSnapshot, catalog)
  }
}
