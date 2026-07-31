import {
  GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID,
  GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID
} from '@/lib/glamour/templates/definitions'

export const GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES: Record<string, string[]> = {
  [GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID]: [GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID],
  [GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID]: [GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID]
}

export interface GlamourTemplateImageSessionRecord {
  imageUrl: string
  imageName: string
  sourceUrl: string
  sourceName: string
  updatedAt: number
}

export type GlamourTemplateImageSessionBackup = Record<
  string,
  Record<string, GlamourTemplateImageSessionRecord>
>

export interface GlamourTemplateImageStoreRecord {
  templateId: string
  slotId: string
  imageName: string
  imageUrl: string
  sourceUrl: string
  sourceName: string
  blob: Blob | null
  updatedAt: number
}

export interface GlamourTemplateRecentImageRecord {
  id: string
  imageName: string
  thumbnailUrl: string
  blob: Blob
  updatedAt: number
}

export function getGlamourTemplateEquivalentImageSlotIds(slotId: string): string[] {
  const normalized = String(slotId || '').trim()

  if (!normalized) {
    return []
  }

  return [normalized, ...(GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES[normalized] || [])]
}

export function isGlamourTemplatePersistentImageUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image/')
}
