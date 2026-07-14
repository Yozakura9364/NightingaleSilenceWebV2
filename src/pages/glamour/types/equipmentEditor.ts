import type { GlamourCandidate, GlamourStain } from '@/lib/glamour/types'

export interface GlamourEquipmentEditorRow {
  slot: string
}

export interface GlamourEquipmentSearchRequest {
  slot: string
  query: string
  locale: string
  limit?: number
  signal?: AbortSignal
}

export type GlamourEquipmentSearch = (
  options: GlamourEquipmentSearchRequest
) => Promise<GlamourCandidate[]>

export type GlamourStainLoader = (locale: string) => Promise<GlamourStain[]>
