export const ARMOIRE_SNAPSHOT_SCHEMA_VERSION = 'nsarmoire.snapshot.v1' as const

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
}

export interface ArmoireSnapshot {
  schemaVersion: typeof ARMOIRE_SNAPSHOT_SCHEMA_VERSION
  source: ArmoireSnapshotSource
  generatedAt: string
  character?: {
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
