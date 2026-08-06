import type { GlamourCandidate, ItemCardEmoteRecord } from '@/pages/item-card/lib/types'
import { getFfxivItemIconUrl } from '@/lib/ffxiv/itemIcon'
import { normalizeGlamourLocale, resolveLocalized } from '@/pages/item-card/lib/equipment'

interface ItemCardEmoteData {
  items?: ItemCardEmoteRecord[]
}

let emoteDataPromise: Promise<ItemCardEmoteRecord[]> | undefined

function normalizeRecord(value: unknown): ItemCardEmoteRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  const record = value as Partial<ItemCardEmoteRecord>
  const id = String(record.id || '').trim()
  const name = String(record.name || '').trim()
  const icon = Number(record.icon)
  if (!id || !name || !Number.isFinite(icon) || icon <= 0) {
    return undefined
  }
  const names = Object.fromEntries(
    Object.entries(record.names || {}).filter(
      ([locale, localizedName]) =>
        Boolean(String(locale).trim()) && typeof localizedName === 'string' && localizedName.trim()
    )
  ) as Record<string, string>
  if (!names.zh) {
    names.zh = name
  }
  return {
    id,
    name,
    names,
    icon,
    category: String(record.category || '').trim() || undefined,
    textCommand: String(record.textCommand || '').trim() || undefined,
    unlockLink: String(record.unlockLink || '').trim() || undefined
  }
}

export function loadItemCardEmotes(): Promise<ItemCardEmoteRecord[]> {
  if (!emoteDataPromise) {
    emoteDataPromise = fetch('/data/ffxiv/item-card-emotes.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Emote data request failed: ${response.status}`)
        }
        return response.json() as Promise<ItemCardEmoteData>
      })
      .then((data) =>
        Array.isArray(data.items)
          ? data.items
              .map(normalizeRecord)
              .filter((item): item is ItemCardEmoteRecord => Boolean(item))
          : []
      )
      .catch((error) => {
        emoteDataPromise = undefined
        throw error
      })
  }
  return emoteDataPromise
}

function searchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export async function searchItemCardEmotes(
  query: string,
  locale: string,
  limit = 12
): Promise<GlamourCandidate[]> {
  const normalizedQuery = searchText(query)
  const normalizedLocale = normalizeGlamourLocale(locale)
  const records = await loadItemCardEmotes()
  return records
    .filter((item) => {
      if (!normalizedQuery) {
        return true
      }
      return [
        item.id,
        item.name,
        ...Object.values(item.names || {}),
        item.category,
        item.textCommand
      ]
        .filter(Boolean)
        .some((value) => searchText(String(value)).includes(normalizedQuery))
    })
    .slice(0, limit)
    .map((item) => {
      const names = item.names || { zh: item.name }
      return {
        key: item.id,
        name: resolveLocalized(names, normalizedLocale) || item.name,
        names,
        icon: getFfxivItemIconUrl(item.icon),
        item_kind: 'emote' as const,
        item_card_slot: 'Emote',
        emote_category: item.category,
        emote_text_command: item.textCommand,
        emote_unlock_link: item.unlockLink
      }
    })
}
