import type { GlamourDyeEntry, GlamourSlotKey } from '@/lib/glamour/types'

export interface GlamourTemplateEditorRow {
  slot: GlamourSlotKey
  slotName: string
  itemName: string
  iconUrl: string
  dyeEntries: GlamourDyeEntry[]
  dyeStatusText: string
}

export interface TemplateImageCropRequest {
  slotId: string
  image: HTMLImageElement
  imageUrl: string
  imageName: string
  sourceUrl: string
  sourceName: string
}

export interface GlamourTemplateWorkspaceImage {
  image: HTMLImageElement
  imageUrl: string
  name: string
  sourceUrl: string
  sourceName: string
  backupOnly: boolean
}
