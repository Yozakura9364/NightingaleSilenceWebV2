export const ARMOIRE_SNAPSHOT_SCHEMA_VERSION = 'nsarmoire.snapshot.v1' as const
export const ARMOIRE_CATALOG_SCHEMA_VERSION = 'nsarmoire.catalog.v1' as const
export const ARMOIRE_STORE_CATALOG_SCHEMA_VERSION = 'nsarmoire.storeCatalog.v1' as const

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

export const ARMOIRE_STORE_TAGS = [
  'npcCostume',
  'bonusCostume',
  'replicaCostume',
  'fanFestivalCostume',
  'crossoverCostume',
  'moonfireFaire',
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

export const DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES: readonly ArmoireDyeValueCategory[] = [
  'extra1',
  'extra2',
  'storeSpecial'
] as const

export type ArmoireSnapshotSource = 'manual-import' | 'local-helper' | 'asvel-compatible'

export interface ArmoireOwnedItem {
  itemId: number
  hq?: boolean
  quantity?: number
  dyes?: [number, number]
  spiritbond?: number
  container: ArmoireContainerKind
  containerName?: string
  slotIndex?: number
  inventoryType?: number
  retainerId?: string
  retainerName?: string
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

export interface ArmoireCatalogItem {
  itemId: number
  name?: string
  iconId?: number
  itemUiCategoryId?: number
  equipSlotCategoryId?: number
  isGlamourous?: boolean
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
  pieceItemIds: number[]
}

export interface ArmoireCabinetEntry {
  cabinetId: number
  itemId: number
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
}

export type ArmoireStoreRegion = 'cn' | 'global'
export type ArmoireStoreLinkRegion = 'cn' | 'global' | 'tw' | 'kr'
export type ArmoireStoreRegionalUrls = Partial<Record<ArmoireStoreLinkRegion, string>>
export type ArmoireStoreMappingSource = 'cn-store' | 'global-store' | 'manual'

export interface ArmoireStoreCatalogSource {
  region: ArmoireStoreLinkRegion
  url: string
  note?: string
}

export interface ArmoireStoreOutfit {
  id: string
  region: ArmoireStoreRegion
  name: string
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

export type ArmoireStoreOutfitStatus = 'complete' | 'partial' | 'missing' | 'needsMapping'

export interface ArmoireStoreOutfitState {
  outfit: ArmoireStoreOutfit
  status: ArmoireStoreOutfitStatus
  ownedItemIds: number[]
  missingItemIds: number[]
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
  missingCabinetItemIds: number[]
}

export interface ArmoireGlamourSetState {
  setItemId: number
  setName?: string
  isStoredAsSet: boolean
  pieceItemIds: number[]
  storedPieceItemIds: number[]
  missingPieceItemIds: number[]
}

export interface ArmoireGlamourSetProgress {
  status: ArmoireCatalogAnalysisStatus
  storedSetCount: number
  availableSetCount: number
  incompleteStoredSetCount: number
  bucketStorableLoosePieceItemIds: number[]
  sets: ArmoireGlamourSetState[]
}

export type ArmoireRiskLevel = 'warning' | 'danger'
export type ArmoireDyeResetReason = 'cabinetStorage' | 'glamourSetBasket' | 'preservedStorage'

export interface ArmoireDyeRiskOptions {
  valuableDyeCategories?: readonly ArmoireDyeValueCategory[]
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
  items: ArmoireDyeRiskItem[]
}

export interface ArmoireIdenticalModelGroupState {
  key: string
  ownedItemIds: number[]
  ownedEntryCount: number
  armoireItemIds: number[]
  armoireEntryCount: number
  storageSpaceItemIds: number[]
  storageSpaceEntryCount: number
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
  duplicateItems: ArmoireDuplicateItemAnalysis
  identicalModels: ArmoireIdenticalModelAnalysis
}
