import { ref, type ComputedRef } from 'vue'
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
import type { GlamourEquipmentEntryView } from '@/pages/glamour/types/equipmentPanel'

interface GlamourEquipInfoEditorOptions {
  apiBase: ComputedRef<string>
  draft: ComputedRef<GlamourDraft>
  editorLocale: ComputedRef<GlamourLocale>
  t: (key: string) => string
  searchItems: GlamourEquipmentSearch
  loadStains: GlamourStainLoader
  replaceEntry: (slot: string, candidate: GlamourCandidate) => void
  clearEntry: (slot: string) => void
  selectEntryCandidate: (slot: string, candidateKey: string | number | undefined) => void
  setEntryDye: (slot: string, dyeIndex: number, stain: GlamourStain) => void
}

export function useGlamourEquipInfoEditor(options: GlamourEquipInfoEditorOptions) {
  const activeCandidateSlot = ref('')
  const search = useGlamourEquipmentSearch({
    apiBase: options.apiBase,
    draft: options.draft,
    editorLocale: options.editorLocale,
    searchItems: options.searchItems,
    showFailures: true
  })
  const dyePicker = useGlamourDyePicker({
    draft: options.draft,
    editorLocale: options.editorLocale,
    loadStains: options.loadStains,
    t: options.t,
    beforeOpen: closeCandidatePicker
  })

  function updateSearch(entry: GlamourEquipmentEntryView, event: Event): void {
    search.updateSearch(entry.slot, event)
  }

  function selectSearchResult(entry: GlamourEquipmentEntryView, candidate: GlamourCandidate): void {
    options.replaceEntry(entry.slot, candidate)
    search.clearSearch(entry.slot)
    closeCandidatePicker()
    dyePicker.closeDyePicker()
  }

  function clearEntry(entry: GlamourEquipmentEntryView): void {
    options.clearEntry(entry.slot)
    search.clearSearch(entry.slot)
    closeCandidatePicker()
    dyePicker.closeDyePicker()
  }

  function isCandidatePickerActive(entry: GlamourEquipmentEntryView): boolean {
    return activeCandidateSlot.value === entry.slot
  }

  function toggleCandidatePicker(entry: GlamourEquipmentEntryView): void {
    dyePicker.closeDyePicker()
    activeCandidateSlot.value = isCandidatePickerActive(entry) ? '' : entry.slot
  }

  function closeCandidatePicker(): void {
    activeCandidateSlot.value = ''
  }

  function isSelectedCandidate(
    entry: GlamourEquipmentEntryView,
    candidate: GlamourCandidate
  ): boolean {
    return String(entry.candidates[0]?.key ?? '') === String(candidate.key ?? '')
  }

  function selectCandidate(entry: GlamourEquipmentEntryView, candidate: GlamourCandidate): void {
    options.selectEntryCandidate(entry.slot, candidate.key)
    closeCandidatePicker()
  }

  function selectDye(
    entry: GlamourEquipmentEntryView,
    dyeIndex: number,
    stain: GlamourStain
  ): void {
    options.setEntryDye(entry.slot, dyeIndex, stain)
    dyePicker.closeDyePicker()
  }

  return {
    ...search,
    ...dyePicker,
    updateSearch,
    selectSearchResult,
    clearEntry,
    isCandidatePickerActive,
    toggleCandidatePicker,
    isSelectedCandidate,
    selectCandidate,
    selectDye
  }
}
