import type { ItemCardCustomText } from '@/pages/item-card/lib/types'
import { safeSetLocalItem } from '@/services/browserStorage'

export const ITEM_CARD_CUSTOM_TEXT_STORAGE_KEY = 'nsitemcard.customText.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeCustomText(value: unknown): ItemCardCustomText | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = String(value.id || '').trim()
  const text = String(value.text || '')
  return id && text.trim() ? { id, text } : undefined
}

export function readItemCardCustomTexts(): ItemCardCustomText[] {
  try {
    const raw = localStorage.getItem(ITEM_CARD_CUSTOM_TEXT_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.map(normalizeCustomText).filter((item): item is ItemCardCustomText => Boolean(item))
      : []
  } catch {
    return []
  }
}

export function writeItemCardCustomTexts(items: ItemCardCustomText[]) {
  safeSetLocalItem(ITEM_CARD_CUSTOM_TEXT_STORAGE_KEY, JSON.stringify(items))
}

export function createItemCardCustomTextId(): string {
  return `text:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}

export function makeItemCardCustomTextFileName(text: string, index = 0): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || ''
  const safe = firstLine.replace(/[\\/:*?"<>|]+/g, '_').trim() || `text-${index + 1}`
  return `${String(index + 1).padStart(2, '0')}-${safe}.png`
}
