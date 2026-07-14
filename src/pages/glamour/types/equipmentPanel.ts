import type { GlamourCandidate, GlamourDyeEntry } from '@/lib/glamour/types'
import type { GlamourEquipmentEditorRow } from '@/pages/glamour/types/equipmentEditor'

export interface GlamourEquipmentEntryView extends GlamourEquipmentEditorRow {
  slotName: string
  itemName: string
  iconUrl: string
  dyeStatusText: string
  dyeEntries: GlamourDyeEntry[]
  candidates: GlamourCandidate[]
  hasCandidateOptions: boolean
}
