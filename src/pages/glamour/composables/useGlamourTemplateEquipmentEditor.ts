import { onBeforeUnmount, reactive, ref, type ComputedRef } from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import {
  buildGlamourIconUrl,
  getCandidateName,
  getDyeEntryName,
  groupGlamourStains,
  isNoDyeEntry,
  resolveLocalized,
  stainMatchesQuery
} from '@/lib/glamour/equipment'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeEntry,
  GlamourLocale,
  GlamourStain,
  GlamourStainGroup
} from '@/lib/glamour/types'
import type { GlamourTemplateEditorRow } from '@/pages/glamour/types/templateWorkspace'

interface GlamourTemplateEquipmentEditorOptions {
  apiBase: ComputedRef<string>
  draft: ComputedRef<GlamourDraft>
  editorLocale: ComputedRef<GlamourLocale>
  t: (key: string) => string
  searchItems: (options: {
    slot: string
    query: string
    locale: string
    limit?: number
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
  replaceEntry: (slot: string, candidate: GlamourCandidate) => void
  clearEntry: (slot: string) => void
  setEntryDye: (slot: string, dyeIndex: number, stain: GlamourStain) => void
}

export function useGlamourTemplateEquipmentEditor(options: GlamourTemplateEquipmentEditorOptions) {
  const searchQueries = reactive<Record<string, string>>({})
  const searchResults = reactive<Record<string, GlamourCandidate[]>>({})
  const searchTouched = reactive<Record<string, boolean>>({})
  const searchBusy = reactive<Record<string, boolean>>({})
  const searchTimers = new Map<string, number>()
  const activeDyePicker = ref<{ slot: string; index: number } | null>(null)
  const stainLists = reactive<Record<string, GlamourStain[]>>({})
  const stainLoading = reactive<Record<string, boolean>>({})
  const stainFailed = reactive<Record<string, boolean>>({})
  const dyeSearchQueries = reactive<Record<string, string>>({})

  function getSearchQuery(slot: string): string {
    return searchQueries[slot] || ''
  }

  function getSearchResults(slot: string): GlamourCandidate[] {
    return searchResults[slot] || []
  }

  function shouldShowSearchPanel(slot: string): boolean {
    return Boolean(getSearchQuery(slot).trim() && searchTouched[slot])
  }

  function shouldShowSearchEmpty(slot: string): boolean {
    return Boolean(
      getSearchQuery(slot).trim() &&
      searchTouched[slot] &&
      !searchBusy[slot] &&
      getSearchResults(slot).length === 0
    )
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
    const timer = searchTimers.get(slot)
    if (timer) {
      window.clearTimeout(timer)
      searchTimers.delete(slot)
    }
    searchQueries[slot] = ''
    searchResults[slot] = []
    searchTouched[slot] = false
    searchBusy[slot] = false
  }

  function getDyePickerKey(slot: string, index: number): string {
    return `${slot}:${index}`
  }

  function getDyeSearchQuery(slot: string, index: number): string {
    return dyeSearchQueries[getDyePickerKey(slot, index)] || ''
  }

  function updateDyeSearch(slot: string, index: number, event: Event): void {
    dyeSearchQueries[getDyePickerKey(slot, index)] = (event.currentTarget as HTMLInputElement).value
  }

  function isDyePickerActive(row: GlamourTemplateEditorRow, index: number): boolean {
    return activeDyePicker.value?.slot === row.slot && activeDyePicker.value.index === index
  }

  function closeDyePicker(): void {
    activeDyePicker.value = null
  }

  async function ensureStainsForCurrentLocale(): Promise<void> {
    const locale = options.editorLocale.value
    if (stainLists[locale] || stainLoading[locale]) {
      return
    }

    stainLoading[locale] = true
    stainFailed[locale] = false
    try {
      stainLists[locale] = await options.loadStains(locale)
    } catch {
      stainLists[locale] = []
      stainFailed[locale] = true
    } finally {
      stainLoading[locale] = false
    }
  }

  function toggleDyePicker(row: GlamourTemplateEditorRow, index: number): void {
    if (isDyePickerActive(row, index)) {
      closeDyePicker()
      return
    }
    activeDyePicker.value = { slot: row.slot, index }
    void ensureStainsForCurrentLocale()
  }

  function getDyeGroups(slot: string, index: number): GlamourStainGroup[] {
    const query = getDyeSearchQuery(slot, index)
    const stains = stainLists[options.editorLocale.value] || []
    return groupGlamourStains(stains.filter((stain) => stainMatchesQuery(stain, query)))
  }

  function shouldShowDyeEmpty(slot: string, index: number): boolean {
    return Boolean(
      activeDyePicker.value &&
      !isDyeLoading() &&
      !isDyeFailed() &&
      getDyeGroups(slot, index).length === 0
    )
  }

  function isDyeLoading(): boolean {
    return Boolean(stainLoading[options.editorLocale.value])
  }

  function isDyeFailed(): boolean {
    return Boolean(stainFailed[options.editorLocale.value])
  }

  function getDyeEntryLabel(dye: GlamourDyeEntry): string {
    return getDyeEntryName(dye, options.draft.value.noDyeLabels, options.editorLocale.value)
  }

  function isNoDye(dye: GlamourDyeEntry): boolean {
    return isNoDyeEntry(dye)
  }

  function getDyeColor(dye: GlamourDyeEntry): string {
    return isNoDye(dye) ? 'transparent' : dye.hex || '#000000'
  }

  function getStainName(stain: GlamourStain): string {
    return (
      resolveLocalized(
        stain.names,
        options.editorLocale.value,
        options.draft.value.source.locale
      ) || stain.name
    )
  }

  function getDyeTitle(index: number, count: number): string {
    if (count > 1) {
      return options
        .t(textKeys.nsglamourEquipmentDyeSlotNumber)
        .replace(/\{number\}/g, String(index + 1))
    }
    return options.t(textKeys.nsglamourEquipmentDyeSlot)
  }

  function selectDye(row: GlamourTemplateEditorRow, dyeIndex: number, stain: GlamourStain): void {
    options.setEntryDye(row.slot, dyeIndex, stain)
    closeDyePicker()
  }

  function updateSearch(row: GlamourTemplateEditorRow, event: Event): void {
    const slot = row.slot
    const query = (event.currentTarget as HTMLInputElement).value
    const timer = searchTimers.get(slot)
    if (timer) {
      window.clearTimeout(timer)
    }

    searchQueries[slot] = query
    searchResults[slot] = []
    searchTouched[slot] = false
    if (!query.trim()) {
      searchBusy[slot] = false
      searchTimers.delete(slot)
      return
    }

    searchTimers.set(
      slot,
      window.setTimeout(() => {
        void runSearch(slot, query)
      }, 180)
    )
  }

  async function runSearch(slot: string, query: string): Promise<void> {
    searchBusy[slot] = true
    try {
      const results = await options.searchItems({
        slot,
        query: query.trim(),
        locale: options.editorLocale.value,
        limit: 20
      })
      if (searchQueries[slot] === query) {
        searchResults[slot] = results
        searchTouched[slot] = true
      }
    } catch {
      if (searchQueries[slot] === query) {
        searchResults[slot] = []
        searchTouched[slot] = false
      }
    } finally {
      if (searchQueries[slot] === query) {
        searchBusy[slot] = false
      }
    }
  }

  function selectSearchResult(row: GlamourTemplateEditorRow, candidate: GlamourCandidate): void {
    options.replaceEntry(row.slot, candidate)
    clearSearch(row.slot)
    closeDyePicker()
  }

  function clearEditorEntry(row: GlamourTemplateEditorRow): void {
    options.clearEntry(row.slot)
    clearSearch(row.slot)
    closeDyePicker()
  }

  onBeforeUnmount(() => {
    searchTimers.forEach((timer) => window.clearTimeout(timer))
    searchTimers.clear()
  })

  return {
    getSearchQuery,
    getSearchResults,
    shouldShowSearchPanel,
    shouldShowSearchEmpty,
    getSearchCandidateName,
    buildSearchIconUrl,
    getSearchResultKey,
    getDyeSearchQuery,
    updateDyeSearch,
    isDyePickerActive,
    closeDyePicker,
    toggleDyePicker,
    getDyeGroups,
    shouldShowDyeEmpty,
    isDyeLoading,
    isDyeFailed,
    getDyeEntryLabel,
    getDyeColor,
    isNoDye,
    getStainName,
    getDyeTitle,
    selectDye,
    updateSearch,
    selectSearchResult,
    clearEditorEntry
  }
}
