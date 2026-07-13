import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { ArmoireSnapshot } from '@/lib/armoire/types'

export type ArmoireWorkspaceSection = 'cleanup' | 'collection' | 'characters'
export type ArmoireCollectionDetailTab = 'store' | 'cabinet' | 'sets' | 'storage'

type CatalogLoadOptions = { force?: boolean }
type CatalogLoader = (options?: CatalogLoadOptions) => void | Promise<void>
type ItemChunkLoader = (
  itemIds: readonly number[],
  options?: CatalogLoadOptions
) => void | Promise<void>

interface UseArmoireWorkspaceCatalogLoadingOptions {
  snapshot: Ref<ArmoireSnapshot | null>
  activeSection: Ref<ArmoireWorkspaceSection>
  activeDetailTab: Ref<ArmoireCollectionDetailTab>
  identicalModelCatalogStatus: Ref<'idle' | 'loading' | 'ready' | 'error'>
  loadItemDisplayChunksForItemIds: ItemChunkLoader
  loadCabinetItemChunksForItemIds: ItemChunkLoader
  loadGlamourSetChunksForItemIds: ItemChunkLoader
  loadCabinetCatalog: CatalogLoader
  loadGlamourSetCatalog: CatalogLoader
  loadIdenticalModelCatalog: CatalogLoader
  loadDyeCatalog: CatalogLoader
  loadCrafterGathererReplicaCatalog: CatalogLoader
  loadStoreCatalog: CatalogLoader
  loadStoreItemDisplayIndex: CatalogLoader
}

const CLEANUP_IDENTICAL_MODEL_CATALOG_LOAD_DELAY_MS = 180

export function useArmoireWorkspaceCatalogLoading(
  options: UseArmoireWorkspaceCatalogLoadingOptions
) {
  const mountedCollectionSection = ref(false)
  let cleanupIdenticalModelCatalogTimer = 0

  function queueCollectionSectionMount(): void {
    mountedCollectionSection.value = true
  }

  function getSnapshotItemIds(): number[] {
    return options.snapshot.value?.items.map((item) => item.itemId) ?? []
  }

  function loadSnapshotItemChunks(loadOptions: CatalogLoadOptions = {}): void {
    const itemIds = getSnapshotItemIds()

    if (itemIds.length === 0) {
      return
    }

    void options.loadItemDisplayChunksForItemIds(itemIds, loadOptions)
  }

  function loadCleanupItemChunks(loadOptions: CatalogLoadOptions = {}): void {
    const itemIds = getSnapshotItemIds()

    if (itemIds.length === 0) {
      return
    }

    void options.loadCabinetItemChunksForItemIds(itemIds, loadOptions)
    void options.loadGlamourSetChunksForItemIds(itemIds, loadOptions)
  }

  function shouldQueueIdenticalModelCatalogForCleanup(): boolean {
    return Boolean(
      options.snapshot.value &&
      options.activeSection.value === 'cleanup' &&
      options.identicalModelCatalogStatus.value === 'idle'
    )
  }

  function cancelCleanupIdenticalModelCatalogLoad(): void {
    if (typeof window === 'undefined') {
      cleanupIdenticalModelCatalogTimer = 0
      return
    }

    if (cleanupIdenticalModelCatalogTimer !== 0) {
      window.clearTimeout(cleanupIdenticalModelCatalogTimer)
      cleanupIdenticalModelCatalogTimer = 0
    }
  }

  function queueIdenticalModelCatalogForCleanup(): void {
    if (!shouldQueueIdenticalModelCatalogForCleanup()) {
      cancelCleanupIdenticalModelCatalogLoad()
      return
    }

    if (typeof window === 'undefined') {
      void options.loadIdenticalModelCatalog()
      return
    }

    if (cleanupIdenticalModelCatalogTimer !== 0) {
      return
    }

    cleanupIdenticalModelCatalogTimer = window.setTimeout(() => {
      cleanupIdenticalModelCatalogTimer = 0

      if (shouldQueueIdenticalModelCatalogForCleanup()) {
        void options.loadIdenticalModelCatalog()
      }
    }, CLEANUP_IDENTICAL_MODEL_CATALOG_LOAD_DELAY_MS)
  }

  function loadCatalogsForCurrentView(): void {
    const hasSnapshot = Boolean(options.snapshot.value)
    const section = options.activeSection.value
    const detailTab = options.activeDetailTab.value

    if (hasSnapshot && section === 'collection' && detailTab === 'cabinet') {
      void options.loadCabinetCatalog()
    }

    if (hasSnapshot && section === 'cleanup') {
      loadCleanupItemChunks()
    }

    if (
      hasSnapshot &&
      (section === 'cleanup' || (section === 'collection' && detailTab === 'storage'))
    ) {
      loadSnapshotItemChunks()
    }

    if (hasSnapshot && section === 'collection' && detailTab === 'sets') {
      void options.loadGlamourSetCatalog()
    }

    queueIdenticalModelCatalogForCleanup()

    if (
      hasSnapshot &&
      (section === 'cleanup' ||
        section === 'characters' ||
        (section === 'collection' && (detailTab === 'store' || detailTab === 'storage')))
    ) {
      void options.loadDyeCatalog()
    }

    if (hasSnapshot && (section === 'cleanup' || section === 'characters')) {
      void options.loadCrafterGathererReplicaCatalog()
    }

    if (hasSnapshot && section === 'collection' && detailTab === 'store') {
      void options.loadStoreCatalog()
      void options.loadStoreItemDisplayIndex()
    }
  }

  function loadIdenticalModelCatalogForCleanup(): void {
    if (!options.snapshot.value) {
      return
    }

    void options.loadIdenticalModelCatalog()
  }

  function reloadCatalog(): void {
    loadSnapshotItemChunks({ force: true })
    loadCleanupItemChunks({ force: true })
    void options.loadCabinetCatalog({ force: true })
    void options.loadGlamourSetCatalog({ force: true })
    void options.loadIdenticalModelCatalog({ force: true })
    void options.loadDyeCatalog({ force: true })
    void options.loadCrafterGathererReplicaCatalog({ force: true })
  }

  function reloadStoreCatalog(): void {
    void options.loadStoreCatalog({ force: true })
    void options.loadStoreItemDisplayIndex({ force: true })
  }

  watch(
    options.activeSection,
    (section) => {
      if (section === 'collection') {
        queueCollectionSectionMount()
        return
      }

      loadCatalogsForCurrentView()
    },
    { flush: 'pre' }
  )

  watch(
    [options.snapshot, options.activeSection, options.activeDetailTab],
    loadCatalogsForCurrentView,
    { flush: 'post', immediate: true }
  )

  onBeforeUnmount(cancelCleanupIdenticalModelCatalogLoad)

  return {
    mountedCollectionSection,
    loadIdenticalModelCatalogForCleanup,
    reloadCatalog,
    reloadStoreCatalog
  }
}
