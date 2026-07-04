export const ARMOIRE_SNAPSHOT_SCHEMA_VERSION = 'nsarmoire.snapshot.v1' as const
export const ARMOIRE_CATALOG_SCHEMA_VERSION = 'nsarmoire.catalog.v1' as const

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
  sets: ArmoireGlamourSetState[]
}

export type ArmoireRiskLevel = 'warning' | 'danger'
export type ArmoireDyeResetReason = 'cabinetStorage' | 'glamourSetBasket' | 'preservedStorage'

export interface ArmoireDyeRiskItem {
  itemId: number
  container: ArmoireContainerKind
  containerName?: string
  dyeIds: [number, number]
  dyedSlotCount: number
  clearsDyeOnStorage: boolean
  resetReasons: ArmoireDyeResetReason[]
  riskLevel: ArmoireRiskLevel
}

export interface ArmoireDyeRiskAnalysis {
  riskItemCount: number
  clearDyeRiskItemCount: number
  highRiskItemCount: number
  items: ArmoireDyeRiskItem[]
}

export interface ArmoireIdenticalModelGroupState {
  key: string
  ownedItemIds: number[]
  ownedEntryCount: number
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
