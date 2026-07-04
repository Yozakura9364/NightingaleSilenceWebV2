import { EMPTY_ARMOIRE_CATALOG } from '@/lib/armoire/catalog'
import { analyzeArmoireBasics } from '@/lib/armoire/analyzeContainerDistribution'
import { analyzeCabinetProgress } from '@/lib/armoire/analyzeCabinetProgress'
import { analyzeDuplicateItems } from '@/lib/armoire/analyzeDuplicateItems'
import { analyzeDyeRisk } from '@/lib/armoire/analyzeDyeRisk'
import { analyzeGlamourSets } from '@/lib/armoire/analyzeGlamourSets'
import { analyzeIdenticalModels } from '@/lib/armoire/analyzeIdenticalModels'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

export function analyzeArmoireSnapshot(
  snapshot: ArmoireSnapshot,
  catalog: ArmoireCatalog = EMPTY_ARMOIRE_CATALOG
): ArmoireSnapshotAnalysis {
  return {
    basic: analyzeArmoireBasics(snapshot),
    cabinetProgress: analyzeCabinetProgress(snapshot, catalog),
    glamourSetProgress: analyzeGlamourSets(snapshot, catalog),
    dyeRisk: analyzeDyeRisk(snapshot, catalog),
    duplicateItems: analyzeDuplicateItems(snapshot),
    identicalModels: analyzeIdenticalModels(snapshot, catalog)
  }
}
