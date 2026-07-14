import { reactive, ref, type ComputedRef } from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import {
  getDyeEntryName,
  groupGlamourStains,
  isNoDyeEntry,
  resolveLocalized,
  stainMatchesQuery
} from '@/lib/glamour/equipment'
import type {
  GlamourDraft,
  GlamourDyeEntry,
  GlamourLocale,
  GlamourStain,
  GlamourStainGroup
} from '@/lib/glamour/types'
import type {
  GlamourEquipmentEditorRow,
  GlamourStainLoader
} from '@/pages/glamour/types/equipmentEditor'

interface GlamourDyePickerOptions {
  draft: ComputedRef<GlamourDraft>
  editorLocale: ComputedRef<GlamourLocale>
  loadStains: GlamourStainLoader
  t: (key: string) => string
  beforeOpen?: () => void
}

const sharedStainLists = new Map<string, GlamourStain[]>()
const sharedStainRequests = new Map<string, Promise<GlamourStain[]>>()

export function useGlamourDyePicker(options: GlamourDyePickerOptions) {
  const activePicker = ref<{ slot: string; index: number } | null>(null)
  const stainLists = reactive<Record<string, GlamourStain[]>>({})
  const stainLoading = reactive<Record<string, boolean>>({})
  const stainFailed = reactive<Record<string, boolean>>({})
  const searchQueries = reactive<Record<string, string>>({})

  function getDyeSearchQuery(slot: string, index: number): string {
    return searchQueries[getDyePickerKey(slot, index)] || ''
  }

  function updateDyeSearch(slot: string, index: number, event: Event): void {
    searchQueries[getDyePickerKey(slot, index)] = (event.currentTarget as HTMLInputElement).value
  }

  function isDyePickerActive(row: GlamourEquipmentEditorRow, index: number): boolean {
    return activePicker.value?.slot === row.slot && activePicker.value.index === index
  }

  function closeDyePicker(): void {
    activePicker.value = null
  }

  async function ensureStainsForCurrentLocale(): Promise<void> {
    const locale = options.editorLocale.value
    const cachedStains = sharedStainLists.get(locale)
    if (cachedStains) {
      stainLists[locale] = cachedStains
      return
    }
    if (stainLists[locale] || stainLoading[locale]) {
      return
    }

    stainLoading[locale] = true
    stainFailed[locale] = false
    try {
      let request = sharedStainRequests.get(locale)
      if (!request) {
        request = options.loadStains(locale)
        sharedStainRequests.set(locale, request)
      }
      const stains = await request
      sharedStainLists.set(locale, stains)
      stainLists[locale] = stains
    } catch {
      stainLists[locale] = []
      stainFailed[locale] = true
    } finally {
      sharedStainRequests.delete(locale)
      stainLoading[locale] = false
    }
  }

  function toggleDyePicker(row: GlamourEquipmentEditorRow, index: number): void {
    if (isDyePickerActive(row, index)) {
      closeDyePicker()
      return
    }
    options.beforeOpen?.()
    activePicker.value = { slot: row.slot, index }
    void ensureStainsForCurrentLocale()
  }

  function getDyeGroups(slot: string, index: number): GlamourStainGroup[] {
    const query = getDyeSearchQuery(slot, index)
    const stains = stainLists[options.editorLocale.value] || []
    return groupGlamourStains(stains.filter((stain) => stainMatchesQuery(stain, query)))
  }

  function shouldShowDyeEmpty(slot: string, index: number): boolean {
    return Boolean(
      activePicker.value &&
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

  return {
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
    getDyeTitle
  }
}

function getDyePickerKey(slot: string, index: number): string {
  return `${slot}:${index}`
}
