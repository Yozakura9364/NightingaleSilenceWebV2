export const ARMOIRE_SNAPSHOT_SCHEMA_VERSION = 'nsarmoire.snapshot.v1' as const
export const ARMOIRE_CATALOG_SCHEMA_VERSION = 'nsarmoire.catalog.v1' as const
export const ARMOIRE_CABINET_CATALOG_SCHEMA_VERSION = 'nsarmoire.cabinetCatalog.v1' as const
export const ARMOIRE_CATALOG_DISPLAY_INDEX_SCHEMA_VERSION =
  'nsarmoire.catalogDisplayIndex.v1' as const
export const ARMOIRE_ITEM_DISPLAY_CHUNK_SCHEMA_VERSION = 'nsarmoire.itemDisplayChunk.v1' as const
export const ARMOIRE_CABINET_ITEM_CHUNK_SCHEMA_VERSION = 'nsarmoire.cabinetItemChunk.v1' as const
export const ARMOIRE_GLAMOUR_SET_CATALOG_SCHEMA_VERSION = 'nsarmoire.glamourSetCatalog.v1' as const
export const ARMOIRE_GLAMOUR_SET_CHUNK_SCHEMA_VERSION = 'nsarmoire.glamourSetChunk.v1' as const
export const ARMOIRE_IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION =
  'nsarmoire.identicalModelCatalog.v1' as const
export const ARMOIRE_DYE_CATALOG_SCHEMA_VERSION = 'nsarmoire.dyeCatalog.v1' as const
export const ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION =
  'nsarmoire.crafterGathererReplicaCatalog.v1' as const
export const ARMOIRE_STORE_CATALOG_SCHEMA_VERSION = 'nsarmoire.storeCatalog.v1' as const
export const ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION =
  'nsarmoire.storeItemDisplayIndex.v1' as const

export const ARMOIRE_CONTAINER_KINDS = [
  'inventory',
  'saddlebag',
  'retainer',
  'armoury',
  'glamourDresser',
  'armoire',
  'manual'
] as const

export type ArmoireContainerKind = (typeof ARMOIRE_CONTAINER_KINDS)[number]

export const ARMOIRE_DYE_VALUE_CATEGORIES = ['general', 'extra1', 'extra2', 'storeSpecial'] as const

export type ArmoireDyeValueCategory = (typeof ARMOIRE_DYE_VALUE_CATEGORIES)[number]

export const ARMOIRE_STORE_SPECIAL_DYE_IDS = [
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120
] as const

export const ARMOIRE_STORE_TAGS = [
  'npcCostume',
  'bonusCostume',
  'collectorEditionBonus',
  'replicaCostume',
  'fanFestivalCostume',
  'crossoverCostume',
  'moonfireFaire',
  'huntingMoon',
  'hatchingTide',
  'theRising',
  'starlightCelebration',
  'valentioneDay',
  'littleLadiesDay',
  'allSaintsWake',
  'heavensturn',
  'goldSaucerFestival'
] as const

export type ArmoireStoreTag = (typeof ARMOIRE_STORE_TAGS)[number]

export const ARMOIRE_STORE_DETAIL_TAGS = ['maleOnly', 'femaleOnly'] as const

export type ArmoireStoreDetailTag = (typeof ARMOIRE_STORE_DETAIL_TAGS)[number]

export const DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES: readonly ArmoireDyeValueCategory[] =
  [] as const

export const DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS: readonly number[] = [101, 102, 103] as const

export type ArmoireSnapshotSource = 'manual-import' | 'local-helper' | 'asvel-compatible'

export interface ArmoireOwnedItem {
  itemId: number
  hq?: boolean
  quantity?: number
  dyes?: [number, number]
  glamourId?: number
  spiritbond?: number
  container: ArmoireContainerKind
  containerName?: string
  slotIndex?: number
  inventoryType?: number
  retainerId?: string
  retainerName?: string
  retainerSlot?: number
  cabinetId?: number
}

export interface ArmoireSnapshot {
  schemaVersion: typeof ARMOIRE_SNAPSHOT_SCHEMA_VERSION
  source: ArmoireSnapshotSource
  generatedAt: string
  character?: {
    id?: string
    name?: string
    world?: string
    dataCenter?: string
  }
  items: ArmoireOwnedItem[]
}

export interface ArmoireOwnedIndex {
  byItemId: Map<number, ArmoireOwnedItem[]>
  itemIds: Set<number>
  entries: ArmoireOwnedItem[]
}

export type ArmoireModelTuple = [number, number, number, number]
export type ArmoireLocalizedNames = Partial<Record<'zh-CN' | 'en' | 'ja' | 'ko', string>>

export interface ArmoireCatalogItem {
  itemId: number
  name?: string
  localizedNames?: ArmoireLocalizedNames
  iconId?: number
  itemUiCategoryId?: number
  equipSlotCategoryId?: number
  isGlamourous?: boolean
  isTradable?: boolean
  isCabinetStorable?: boolean
  isGlamourSetContainer?: boolean
  pieceItemIds?: number[]
  mainModel?: ArmoireModelTuple
  subModel?: ArmoireModelTuple
  modelKey?: string
  dyeSlotCount?: number
}

export interface ArmoireGlamourSet {
  setItemId: number
  setName?: string
  pieceSlotItemIds?: number[]
  pieceItemIds: number[]
}

export interface ArmoireCabinetEntry {
  cabinetId: number
  itemId: number
  order?: number
  sortKey?: number
  categoryId?: number
  categoryName?: string
  categoryMenuOrder?: number
  categoryHideOrder?: number
  categoryIconId?: number
  subCategoryId?: number
  subCategoryName?: string
  subCategoryOrder?: number
}

export interface ArmoireIdenticalGroup {
  key: string
  itemIds: number[]
}

export interface ArmoireDye {
  dyeId: number
  name?: string
  color?: string
  shade?: number
  subOrder?: number
  valueCategory?: ArmoireDyeValueCategory
}

export interface ArmoireCatalog {
  schemaVersion: typeof ARMOIRE_CATALOG_SCHEMA_VERSION
  generatedAt: string
  gameVersion?: string
  items: Record<number, ArmoireCatalogItem>
  cabinetItemIds: number[]
  cabinetEntries?: ArmoireCabinetEntry[]
  glamourSetItems: ArmoireGlamourSet[]
  identicalGroups: ArmoireIdenticalGroup[]
  dyes: Record<number, ArmoireDye>
  crafterGathererReplicaItemIds?: number[]
}

export type ArmoireCompactDisplayItem = [
  itemId: number,
  name?: string | null,
  iconId?: number | null,
  dyeSlotCount?: number | null,
  isTradable?: 1 | null,
  localizedNames?: ArmoireLocalizedNames | null
]

export interface ArmoireCabinetCatalog {
  schemaVersion: typeof ARMOIRE_CABINET_CATALOG_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  items: Record<number, ArmoireStoreItemDisplay>
  cabinetItemIds: number[]
  cabinetEntries?: ArmoireCabinetEntry[]
  missingItemIds?: number[]
}

export interface ArmoireCatalogDisplayIndex {
  schemaVersion: typeof ARMOIRE_CATALOG_DISPLAY_INDEX_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  items: ArmoireCompactDisplayItem[]
  missingItemIds?: number[]
}

export interface ArmoireItemDisplayChunk {
  schemaVersion: typeof ARMOIRE_ITEM_DISPLAY_CHUNK_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  chunkKey: string
  chunkSize: number
  items: ArmoireCompactDisplayItem[]
}

export interface ArmoireCabinetItemChunk {
  schemaVersion: typeof ARMOIRE_CABINET_ITEM_CHUNK_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  chunkKey: string
  chunkSize: number
  items: ArmoireCompactDisplayItem[]
  cabinetItemIds: number[]
  cabinetEntries?: ArmoireCabinetEntry[]
  missingItemIds?: number[]
}

export interface ArmoireGlamourSetCatalog {
  schemaVersion: typeof ARMOIRE_GLAMOUR_SET_CATALOG_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  items: ArmoireCompactDisplayItem[]
  cabinetItemIds: number[]
  glamourSetItems: ArmoireGlamourSet[]
  missingItemIds?: number[]
}

export interface ArmoireGlamourSetChunk {
  schemaVersion: typeof ARMOIRE_GLAMOUR_SET_CHUNK_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  chunkKey: string
  chunkSize: number
  items: ArmoireCompactDisplayItem[]
  cabinetItemIds: number[]
  glamourSetItems: ArmoireGlamourSet[]
  missingItemIds?: number[]
}

export interface ArmoireIdenticalModelCatalog {
  schemaVersion: typeof ARMOIRE_IDENTICAL_MODEL_CATALOG_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  items: ArmoireCompactDisplayItem[]
  identicalGroups: ArmoireIdenticalGroup[]
  missingItemIds?: number[]
}

export interface ArmoireDyeCatalog {
  schemaVersion: typeof ARMOIRE_DYE_CATALOG_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  dyes: Record<number, ArmoireDye>
}

export interface ArmoireCrafterGathererReplicaCatalog {
  schemaVersion: typeof ARMOIRE_CRAFTER_GATHERER_REPLICA_CATALOG_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  items: ArmoireCompactDisplayItem[]
  itemIds: number[]
  excludedItemIds?: number[]
  missingItemIds?: number[]
}

export type ArmoireStoreRegion = 'cn' | 'global' | 'tw'
export type ArmoireStoreLinkRegion = 'cn' | 'global' | 'tw' | 'kr'
export type ArmoireStoreRegionalUrls = Partial<Record<ArmoireStoreLinkRegion, string>>
export type ArmoireStoreMappingSource = 'cn-store' | 'global-store' | 'manual'
export type ArmoireStoreLocalizedNames = ArmoireLocalizedNames &
  Partial<Record<'fr' | 'de', string>>
export type ArmoireStoreRegionalPriceLabels = Partial<Record<ArmoireStoreLinkRegion, string>>

export interface ArmoireStoreCatalogSource {
  region: ArmoireStoreLinkRegion
  url: string
  note?: string
}

export interface ArmoireStoreOutfit {
  id: string
  region: ArmoireStoreRegion
  name: string
  localizedNames?: ArmoireStoreLocalizedNames
  storeUrl: string
  regionalStoreUrls?: ArmoireStoreRegionalUrls
  sourceUrl: string
  productId?: string
  skuId?: string
  globalProductId?: string
  globalProductName?: string
  globalItemNames?: string[]
  globalItemUris?: string[]
  priceLabel?: string
  regionalPriceLabels?: ArmoireStoreRegionalPriceLabels
  coverItemId?: number
  itemNames: string[]
  itemIds: number[]
  tags?: ArmoireStoreTag[]
  detailTags?: ArmoireStoreDetailTag[]
  mappingSource?: ArmoireStoreMappingSource
  corrected?: boolean
  needsMapping?: boolean
  notes?: string
}

export interface ArmoireStoreCatalog {
  schemaVersion: typeof ARMOIRE_STORE_CATALOG_SCHEMA_VERSION
  generatedAt: string
  sources: ArmoireStoreCatalogSource[]
  outfits: ArmoireStoreOutfit[]
}

export interface ArmoireStoreItemDisplay {
  itemId: number
  name?: string
  localizedNames?: ArmoireLocalizedNames
  iconId?: number
}

export interface ArmoireStoreItemDisplayIndex {
  schemaVersion: typeof ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
    storeCatalogGeneratedAt?: string
  }
  items: Record<number, ArmoireStoreItemDisplay>
  missingItemIds?: number[]
}

export type ArmoireStoreOutfitStatus = 'complete' | 'partial' | 'missing' | 'needsMapping'

export interface ArmoireStoreOutfitState {
  outfit: ArmoireStoreOutfit
  status: ArmoireStoreOutfitStatus
  ownedItemIds: number[]
  missingItemIds: number[]
  ownedItemsByItemId: Record<number, ArmoireOwnedItem[]>
  storedByBucketItemIdsByItemId: Record<number, number[]>
  mappedItemCount: number
  totalItemCount: number
}

export interface ArmoireStoreOutfitAnalysis {
  totalCount: number
  mappedCount: number
  completeCount: number
  partialCount: number
  missingCount: number
  needsMappingCount: number
  outfits: ArmoireStoreOutfitState[]
}

export interface ArmoireContainerDistributionEntry {
  key: string
  container: ArmoireContainerKind
  containerName?: string
  retainerId?: string
  retainerName?: string
  retainerSlot?: number
  entryCount: number
  totalQuantity: number
  dyedEntryCount: number
  uniqueItemCount: number
}

export interface ArmoireBasicAnalysis {
  entryCount: number
  totalQuantity: number
  uniqueItemCount: number
  dyedEntryCount: number
  glamourDresserEntryCount: number
  armoireEntryCount: number
  distribution: ArmoireContainerDistributionEntry[]
}

export type ArmoireCatalogAnalysisStatus = 'ready' | 'missingCatalog'

export interface ArmoireCabinetProgress {
  status: ArmoireCatalogAnalysisStatus
  storedCount: number
  storableCount: number
  transferableItemIds: number[]
  transferableEntriesByItemId: Record<number, ArmoireOwnedItem[]>
  ownedCabinetItemIds: number[]
  dyedOwnedCabinetItemIds: number[]
  missingCabinetItemIds: number[]
}

export interface ArmoireGlamourSetState {
  setItemId: number
  setName?: string
  isStoredAsSet: boolean
  pieceItemIds: number[]
  storedPieceItemIds: number[]
  loosePieceItemIds: number[]
  storedByBucketPieceItemIds: number[]
  loosePieceEntriesByItemId: Record<number, ArmoireGlamourSetPieceEntry[]>
  pieceOwnershipByItemId: Record<number, ArmoireGlamourSetPieceOwnership>
  missingPieceItemIds: number[]
}

export type ArmoireGlamourSetPieceStatus = 'stored' | 'loose' | 'missing'

export interface ArmoireGlamourSetPieceOwnership {
  itemId: number
  storedByBucket: boolean
  looseEntries: ArmoireGlamourSetPieceEntry[]
  status: ArmoireGlamourSetPieceStatus
}

export interface ArmoireGlamourSetPieceEntry {
  itemId: number
  container: ArmoireContainerKind
  containerName?: string
  dyeIds: [number, number]
  valuableDyeIds: number[]
  hasValuableDye: boolean
}

export interface ArmoireGlamourSetProgress {
  status: ArmoireCatalogAnalysisStatus
  storedSetCount: number
  availableSetCount: number
  incompleteStoredSetCount: number
  bucketStorableLoosePieceItemIds: number[]
  storedByBucketPieceItemIds: number[]
  sets: ArmoireGlamourSetState[]
}

export type ArmoireRiskLevel = 'warning' | 'danger'
export type ArmoireDyeResetReason = 'cabinetStorage' | 'glamourSetBasket' | 'preservedStorage'

export interface ArmoireDyeRiskOptions {
  valuableDyeCategories?: readonly ArmoireDyeValueCategory[]
  valuableDyeIds?: readonly number[]
}

export interface ArmoireSnapshotAnalysisOptions extends ArmoireDyeRiskOptions {
  filterToCatalogItems?: boolean
  ignoredItemIds?: readonly number[]
}

export interface ArmoireDyeRiskItem {
  itemId: number
  container: ArmoireContainerKind
  containerName?: string
  dyeIds: [number, number]
  dyedSlotCount: number
  valuableDyeIds: number[]
  valuableDyeCategories: ArmoireDyeValueCategory[]
  hasValuableDye: boolean
  clearsDyeOnStorage: boolean
  resetReasons: ArmoireDyeResetReason[]
  riskLevel: ArmoireRiskLevel
}

export interface ArmoireDyeRiskAnalysis {
  riskItemCount: number
  clearDyeRiskItemCount: number
  valuableDyeRiskItemCount: number
  valuableClearDyeRiskItemCount: number
  highRiskItemCount: number
  selectedValuableDyeCategories: ArmoireDyeValueCategory[]
  selectedValuableDyeIds: number[]
  items: ArmoireDyeRiskItem[]
}

export interface ArmoireTradableItemAnalysis {
  status: ArmoireCatalogAnalysisStatus
  unboundTradableEntryCount: number
  items: ArmoireOwnedItem[]
}

export interface ArmoireReplicaDyeReturn {
  dyeId: number
  count: number
}

export interface ArmoireCrafterGathererReplicaEntry {
  item: ArmoireOwnedItem
  voucherCount: number
  dyeIds: [number, number]
  returnedDyeIds: number[]
}

export interface ArmoireCrafterGathererReplicaAnalysis {
  status: ArmoireCatalogAnalysisStatus
  entryCount: number
  totalQuantity: number
  voucherCount: number
  returnedDyes: ArmoireReplicaDyeReturn[]
  items: ArmoireCrafterGathererReplicaEntry[]
}

export interface ArmoireIdenticalModelGroupState {
  key: string
  ownedItemIds: number[]
  ownedEntryCount: number
  armoireItemIds: number[]
  armoireEntryCount: number
  storageSpaceItemIds: number[]
  storageSpaceEntryCount: number
  storeRelatedItemIds: number[]
  isStoreRelated: boolean
}

export interface ArmoireIdenticalModelAnalysis {
  status: ArmoireCatalogAnalysisStatus
  duplicateGroupCount: number
  groups: ArmoireIdenticalModelGroupState[]
}

export interface ArmoireDuplicateItemGroupState {
  itemId: number
  ownedEntryCount: number
  totalQuantity: number
  isStoreRelated: boolean
}

export interface ArmoireDuplicateItemAnalysis {
  duplicateItemCount: number
  groups: ArmoireDuplicateItemGroupState[]
}

export interface ArmoireSnapshotAnalysis {
  basic: ArmoireBasicAnalysis
  cabinetProgress: ArmoireCabinetProgress
  glamourSetProgress: ArmoireGlamourSetProgress
  dyeRisk: ArmoireDyeRiskAnalysis
  tradableItems: ArmoireTradableItemAnalysis
  crafterGathererReplicas: ArmoireCrafterGathererReplicaAnalysis
  duplicateItems: ArmoireDuplicateItemAnalysis
  identicalModels: ArmoireIdenticalModelAnalysis
}
