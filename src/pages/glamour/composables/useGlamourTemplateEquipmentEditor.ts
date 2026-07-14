import type { ComputedRef } from 'vue'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourLocale,
  GlamourStain
} from '@/lib/glamour/types'
import { useGlamourDyePicker } from '@/pages/glamour/composables/useGlamourDyePicker'
import { useGlamourEquipmentSearch } from '@/pages/glamour/composables/useGlamourEquipmentSearch'
import type {
  GlamourEquipmentSearch,
  GlamourStainLoader
} from '@/pages/glamour/types/equipmentEditor'
import type { GlamourTemplateEditorRow } from '@/pages/glamour/types/templateWorkspace'

interface GlamourTemplateEquipmentEditorOptions {
  apiBase: ComputedRef<string>
  draft: ComputedRef<GlamourDraft>
  editorLocale: ComputedRef<GlamourLocale>
  t: (key: string) => string
  searchItems: GlamourEquipmentSearch
  loadStains: GlamourStainLoader
  replaceEntry: (slot: string, candidate: GlamourCandidate) => void
  clearEntry: (slot: string) => void
  setEntryDye: (slot: string, dyeIndex: number, stain: GlamourStain) => void
}

export function useGlamourTemplateEquipmentEditor(options: GlamourTemplateEquipmentEditorOptions) {
  const search = useGlamourEquipmentSearch({
    apiBase: options.apiBase,
    draft: options.draft,
    editorLocale: options.editorLocale,
    searchItems: options.searchItems
  })
  const dyePicker = useGlamourDyePicker({
    draft: options.draft,
    editorLocale: options.editorLocale,
    loadStains: options.loadStains,
    t: options.t
  })

  function updateSearch(row: GlamourTemplateEditorRow, event: Event): void {
    search.updateSearch(row.slot, event)
  }

  function selectDye(row: GlamourTemplateEditorRow, dyeIndex: number, stain: GlamourStain): void {
    options.setEntryDye(row.slot, dyeIndex, stain)
    dyePicker.closeDyePicker()
  }

  function selectSearchResult(row: GlamourTemplateEditorRow, candidate: GlamourCandidate): void {
    options.replaceEntry(row.slot, candidate)
    search.clearSearch(row.slot)
    dyePicker.closeDyePicker()
  }

  function clearEditorEntry(row: GlamourTemplateEditorRow): void {
    options.clearEntry(row.slot)
    search.clearSearch(row.slot)
    dyePicker.closeDyePicker()
  }

  return {
    ...search,
    ...dyePicker,
    updateSearch,
    selectDye,
    selectSearchResult,
    clearEditorEntry
  }
}
