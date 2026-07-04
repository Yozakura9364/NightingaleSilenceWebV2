import { computed, type Ref } from 'vue'
import { analyzeArmoireSnapshot } from '@/lib/armoire/analyzeSnapshot'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'

function hasMissingCatalogCheck(analysis: ArmoireSnapshotAnalysis): boolean {
  return (
    analysis.cabinetProgress.status === 'missingCatalog' ||
    analysis.glamourSetProgress.status === 'missingCatalog' ||
    analysis.identicalModels.status === 'missingCatalog'
  )
}

export function useArmoireAnalysis(
  snapshot: Ref<ArmoireSnapshot | null>,
  catalog: Ref<ArmoireCatalog>
) {
  const analysis = computed(() =>
    snapshot.value ? analyzeArmoireSnapshot(snapshot.value, catalog.value) : null
  )

  const hasPendingCatalogChecks = computed(() =>
    analysis.value ? hasMissingCatalogCheck(analysis.value) : false
  )

  return {
    analysis,
    hasPendingCatalogChecks
  }
}
