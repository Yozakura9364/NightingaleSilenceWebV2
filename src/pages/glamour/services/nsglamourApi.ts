import { useFetch } from '@/composables/useFetch'
import type { GlamourCandidate, GlamourImportPayload, GlamourStain } from '@/lib/glamour/types'
import type { GlamourEquipmentSearchRequest } from '@/pages/glamour/types/equipmentEditor'
import type { ApiBoundary } from '@/services/apiBoundaries'

export interface ParseGlamourTextOptions {
  text: string
  sourceLocale: string
  locale?: string
}

export interface ImportGlamourLinkOptions {
  url: string
}

export type SearchGlamourItemsOptions = GlamourEquipmentSearchRequest

export interface SearchGlamourItemsResponse {
  results?: GlamourCandidate[]
}

export interface LoadGlamourStainsResponse {
  results?: GlamourStain[]
}

export function useNSGlamourApi(boundary: ApiBoundary) {
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
      signal: options.signal,
      cache: 'no-store'
    })

    return Array.isArray(data.results) ? data.results : []
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
    loadStains
  }
}
