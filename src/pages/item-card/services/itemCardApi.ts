import { useFetch } from '@/composables/useFetch'
import { getCandidateName, GLAMOUR_SLOT_DEFINITIONS } from '@/pages/item-card/lib/equipment'
import {
  getNumericItemIdsFromImportText,
  replaceNumericItemIdsInImportText
} from '@/pages/item-card/lib/textImport'
import type {
  GlamourCandidate,
  GlamourImportPayload,
  GlamourStain,
  ItemCardCatalogCategory
} from '@/pages/item-card/lib/types'
import type { ApiBoundary } from '@/services/apiBoundaries'

export interface ParseGlamourTextOptions {
  text: string
  sourceLocale: string
  locale?: string
}

export interface ImportGlamourLinkOptions {
  url: string
}

export interface SearchGlamourItemsOptions {
  slot: string
  query: string
  locale: string
  limit?: number
}

export interface SearchGlamourItemsResponse {
  results?: GlamourCandidate[]
}

export interface SearchCatalogItemsOptions {
  query: string
  locale: string
  category: ItemCardCatalogCategory
  limit?: number
  signal?: AbortSignal
}

export interface LoadGlamourStainsResponse {
  results?: GlamourStain[]
}

const NUMERIC_ITEM_SEARCH_SLOTS = GLAMOUR_SLOT_DEFINITIONS.map(
  (definition) => definition.key
).filter((slot) => !['RightRing', 'Glasses', 'FashionAccessory'].includes(slot))

export function useItemCardApi(boundary: ApiBoundary) {
  const client = useFetch().createClient(boundary.apiBase)
  const stainsByLocale = new Map<string, Promise<GlamourStain[]>>()

  function importLink(options: ImportGlamourLinkOptions): Promise<GlamourImportPayload> {
    return client.api<GlamourImportPayload>('/import-glamour-link', {
      method: 'POST',
      json: {
        url: options.url
      }
    })
  }

  function parseText(options: ParseGlamourTextOptions): Promise<GlamourImportPayload> {
    return client.api<GlamourImportPayload>('/equipinfo/parse-text', {
      method: 'POST',
      json: {
        text: options.text,
        source_locale: options.sourceLocale,
        locale: options.locale
      }
    })
  }

  function parseChara(file: File): Promise<GlamourImportPayload> {
    const body = new FormData()
    body.append('file', file)

    return client.api<GlamourImportPayload>('/parse-chara', {
      method: 'POST',
      body
    })
  }

  async function searchItems(options: SearchGlamourItemsOptions): Promise<GlamourCandidate[]> {
    const data = await client.api<SearchGlamourItemsResponse>('/search-items', {
      query: {
        slot: options.slot,
        q: options.query,
        locale: options.locale,
        limit: options.limit ?? 20
      },
      cache: 'no-store'
    })

    return Array.isArray(data.results) ? data.results : []
  }

  async function searchCatalogItems(
    options: SearchCatalogItemsOptions
  ): Promise<GlamourCandidate[]> {
    const data = await client.api<SearchGlamourItemsResponse>('/search-catalog-items', {
      query: {
        q: options.query,
        locale: options.locale,
        category: options.category,
        limit: options.limit ?? 20
      },
      cache: 'no-store',
      signal: options.signal
    })

    return Array.isArray(data.results) ? data.results : []
  }

  async function resolveNumericItemText(text: string, locale: string): Promise<string> {
    const itemIds = getNumericItemIdsFromImportText(text)
    if (!itemIds.length) {
      return text
    }

    const namesById = new Map<string, string>()
    const queue = [...itemIds]
    const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (queue.length) {
        const itemId = queue.shift()
        if (!itemId) {
          continue
        }
        const itemName = await resolveNumericItemName(itemId, locale)
        if (itemName) {
          namesById.set(itemId, itemName)
        }
      }
    })

    await Promise.all(workers)
    return replaceNumericItemIdsInImportText(text, namesById)
  }

  async function resolveNumericItemName(itemId: string, locale: string): Promise<string> {
    for (const slot of NUMERIC_ITEM_SEARCH_SLOTS) {
      const candidates = await searchItems({ slot, query: itemId, locale, limit: 5 })
      const candidate = candidates.find((item) => String(item.key ?? '') === itemId)
      if (candidate) {
        return getCandidateName(candidate, locale) || String(candidate.name || '').trim()
      }
    }
    return ''
  }

  async function loadStains(locale: string): Promise<GlamourStain[]> {
    const normalizedLocale = locale || 'zh'

    if (!stainsByLocale.has(normalizedLocale)) {
      stainsByLocale.set(
        normalizedLocale,
        client
          .api<LoadGlamourStainsResponse>('/stains', {
            query: { locale: normalizedLocale },
            cache: 'no-store'
          })
          .then((data) => (Array.isArray(data.results) ? data.results : []))
          .catch((error) => {
            stainsByLocale.delete(normalizedLocale)
            throw error
          })
      )
    }

    return stainsByLocale.get(normalizedLocale) ?? Promise.resolve([])
  }

  return {
    importLink,
    parseText,
    parseChara,
    searchItems,
    searchCatalogItems,
    resolveNumericItemText,
    loadStains
  }
}
