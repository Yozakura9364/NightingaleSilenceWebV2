import { onBeforeUnmount, reactive, type ComputedRef } from 'vue'
import { buildGlamourIconUrl, getCandidateName } from '@/lib/glamour/equipment'
import type { GlamourCandidate, GlamourDraft, GlamourLocale } from '@/lib/glamour/types'
import type { GlamourEquipmentSearch } from '@/pages/glamour/types/equipmentEditor'

interface GlamourEquipmentSearchOptions {
  apiBase: ComputedRef<string>
  draft: ComputedRef<GlamourDraft>
  editorLocale: ComputedRef<GlamourLocale>
  searchItems: GlamourEquipmentSearch
  showFailures?: boolean
}

export function useGlamourEquipmentSearch(options: GlamourEquipmentSearchOptions) {
  const queries = reactive<Record<string, string>>({})
  const results = reactive<Record<string, GlamourCandidate[]>>({})
  const touched = reactive<Record<string, boolean>>({})
  const failed = reactive<Record<string, boolean>>({})
  const busy = reactive<Record<string, boolean>>({})
  const timers = new Map<string, number>()
  const controllers = new Map<string, AbortController>()

  function getSearchQuery(slot: string): string {
    return queries[slot] || ''
  }

  function getSearchResults(slot: string): GlamourCandidate[] {
    return results[slot] || []
  }

  function shouldShowSearchPanel(slot: string): boolean {
    return Boolean(getSearchQuery(slot).trim() && (touched[slot] || failed[slot]))
  }

  function shouldShowSearchEmpty(slot: string): boolean {
    return Boolean(
      getSearchQuery(slot).trim() &&
      touched[slot] &&
      !busy[slot] &&
      !failed[slot] &&
      getSearchResults(slot).length === 0
    )
  }

  function isSearchFailed(slot: string): boolean {
    return Boolean(failed[slot])
  }

  function getSearchCandidateName(candidate: GlamourCandidate): string {
    return getCandidateName(
      candidate,
      options.editorLocale.value,
      options.draft.value.source.locale
    )
  }

  function buildSearchIconUrl(candidate: GlamourCandidate): string {
    return buildGlamourIconUrl(options.apiBase.value, candidate.icon)
  }

  function getSearchResultKey(candidate: GlamourCandidate): string {
    return String(candidate.key ?? candidate.name ?? JSON.stringify(candidate.names ?? {}))
  }

  function clearSearch(slot: string): void {
    const timer = timers.get(slot)
    if (timer) {
      window.clearTimeout(timer)
      timers.delete(slot)
    }
    controllers.get(slot)?.abort()
    controllers.delete(slot)
    queries[slot] = ''
    results[slot] = []
    touched[slot] = false
    failed[slot] = false
    busy[slot] = false
  }

  function updateSearch(slot: string, event: Event): void {
    const query = (event.currentTarget as HTMLInputElement).value
    const timer = timers.get(slot)
    if (timer) {
      window.clearTimeout(timer)
    }
    controllers.get(slot)?.abort()
    controllers.delete(slot)

    queries[slot] = query
    results[slot] = []
    touched[slot] = false
    failed[slot] = false
    busy[slot] = false
    if (!query.trim()) {
      busy[slot] = false
      timers.delete(slot)
      return
    }

    timers.set(
      slot,
      window.setTimeout(() => {
        timers.delete(slot)
        void runSearch(slot, query)
      }, 180)
    )
  }

  async function runSearch(slot: string, query: string): Promise<void> {
    const controller = new AbortController()
    controllers.get(slot)?.abort()
    controllers.set(slot, controller)
    busy[slot] = true
    failed[slot] = false

    try {
      const nextResults = await options.searchItems({
        slot,
        query: query.trim(),
        locale: options.editorLocale.value,
        limit: 20,
        signal: controller.signal
      })
      if (queries[slot] === query) {
        results[slot] = nextResults
        touched[slot] = true
      }
    } catch (error) {
      if (queries[slot] === query && !isAbortError(error)) {
        results[slot] = []
        touched[slot] = Boolean(options.showFailures)
        failed[slot] = Boolean(options.showFailures)
      }
    } finally {
      const isCurrentRequest = controllers.get(slot) === controller
      if (isCurrentRequest) {
        controllers.delete(slot)
      }
      if (queries[slot] === query && isCurrentRequest) {
        busy[slot] = false
      }
    }
  }

  onBeforeUnmount(() => {
    timers.forEach((timer) => window.clearTimeout(timer))
    controllers.forEach((controller) => controller.abort())
    timers.clear()
    controllers.clear()
  })

  return {
    getSearchQuery,
    getSearchResults,
    shouldShowSearchPanel,
    shouldShowSearchEmpty,
    isSearchFailed,
    getSearchCandidateName,
    buildSearchIconUrl,
    getSearchResultKey,
    clearSearch,
    updateSearch
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}
