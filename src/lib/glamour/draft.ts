import {
  GLAMOUR_DEFAULT_LOCALE,
  GLAMOUR_SLOT_DEFINITIONS,
  createDyeEntryFromStain,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getSelectedCandidate,
  getVisibleEquipmentEntries,
  makeEmptyEquipmentEntry,
  normalizeGlamourLocale,
  resolveLocalized,
  updateCandidateDyeDisplay
} from '@/lib/glamour/equipment'
import type {
  GlamourCandidate,
  GlamourDyeEntry,
  GlamourDraft,
  GlamourEquipmentEntry,
  GlamourImportPayload,
  GlamourLocale,
  GlamourStain,
  GlamourSlotKey,
  LocalizedTextMap
} from '@/lib/glamour/types'

export const GLAMOUR_CARD_DRAFT_STORAGE_KEY = 'nsglamour.cardDraft.v2'
export const GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY = 'nsglamour.store.equipment'

export interface GlamourTemplateDraftEntry {
  slot: string
  item: GlamourCandidate
}

export interface GlamourTemplateDraft {
  version: 1
  sourceName: string
  locale: GlamourLocale
  createdAt: string
  entries: GlamourTemplateDraftEntry[]
}

function normalizeLocaleList(payload: GlamourImportPayload | undefined): GlamourLocale[] {
  const locales = Array.isArray(payload?.locales) ? payload.locales : []
  const normalized = locales.map(normalizeGlamourLocale).filter(Boolean)
  const fallback = normalizeGlamourLocale(payload?.source_locale || payload?.default_locale)
  const values = [...normalized, fallback, GLAMOUR_DEFAULT_LOCALE]
  return Array.from(new Set(values))
}

function normalizeWarnings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeLocalizedMap(value: unknown): LocalizedTextMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, text]) => typeof text === 'string')
  ) as LocalizedTextMap
}

function selectDraftLocale(
  payload: GlamourImportPayload | undefined,
  preferredLocale: string | undefined
): GlamourLocale {
  const locales = normalizeLocaleList(payload)
  const preferred = normalizeGlamourLocale(
    preferredLocale || payload?.source_locale || payload?.default_locale || GLAMOUR_DEFAULT_LOCALE
  )

  return locales.includes(preferred) ? preferred : locales[0] || GLAMOUR_DEFAULT_LOCALE
}

export function createEmptyGlamourDraft(preferredLocale = GLAMOUR_DEFAULT_LOCALE): GlamourDraft {
  const locale = normalizeGlamourLocale(preferredLocale)
  const payload: GlamourImportPayload = {
    source_locale: locale,
    default_locale: locale,
    locales: [locale]
  }

  return {
    version: 1,
    source: {
      type: '',
      name: '',
      title: '',
      locale,
      importedAt: ''
    },
    locale,
    locales: [locale],
    localeLabels: {},
    slotNames: {},
    dyeLabels: {},
    noDyeLabels: {},
    warnings: [],
    entries: getVisibleEquipmentEntries(payload)
  }
}

export function createGlamourDraftFromPayload(
  payload: GlamourImportPayload,
  options: { preferredLocale?: string; importedAt?: string } = {}
): GlamourDraft {
  const locale = selectDraftLocale(payload, options.preferredLocale)
  const locales = normalizeLocaleList(payload)
  const slotNames = payload.slot_names ?? {}

  return {
    version: 1,
    source: {
      type: payload.file_type || '',
      name: payload.source_name || '',
      title: payload.source_title || '',
      locale: normalizeGlamourLocale(payload.source_locale || payload.default_locale || locale),
      importedAt: options.importedAt || new Date().toISOString()
    },
    locale,
    locales,
    localeLabels: payload.locale_labels ?? {},
    slotNames,
    dyeLabels: normalizeLocalizedMap(payload.dye_labels),
    noDyeLabels: normalizeLocalizedMap(payload.no_dye_labels),
    warnings: normalizeWarnings(payload.warnings),
    entries: getVisibleEquipmentEntries(payload)
  }
}

export function setGlamourDraftLocale(draft: GlamourDraft, locale: string): GlamourDraft {
  const normalized = normalizeGlamourLocale(locale)
  const locales = draft.locales.includes(normalized) ? draft.locales : [...draft.locales, normalized]

  return {
    ...draft,
    locale: normalized,
    locales
  }
}

export function getFilledGlamourDraftEntries(draft: GlamourDraft): GlamourEquipmentEntry[] {
  return draft.entries.filter(
    (entry) => !entry.__emptySlot && Array.isArray(entry.candidates) && Boolean(entry.candidates[0])
  )
}

function isKnownGlamourSlot(slot: string): slot is GlamourSlotKey {
  return GLAMOUR_SLOT_DEFINITIONS.some((definition) => definition.key === slot)
}

function createDraftSlotEntry(
  draft: GlamourDraft,
  slot: GlamourSlotKey,
  candidate: GlamourCandidate
): GlamourEquipmentEntry {
  const dyeEntries = Array.isArray(candidate.dye_entries) ? candidate.dye_entries : []

  return {
    ...makeEmptyEquipmentEntry(slot, { slot_names: draft.slotNames }),
    lookup_key: `SEARCH|${slot}|${candidate.key ?? ''}`,
    dye_id: dyeEntries[0]?.id ?? 0,
    dye_id_2: dyeEntries[1]?.id ?? 0,
    candidate_count: 1,
    candidates: [candidate],
    __emptySlot: false
  }
}

function normalizeDraftSlotList(draft: GlamourDraft, entries: GlamourEquipmentEntry[]): GlamourEquipmentEntry[] {
  const mainHand = entries.find((entry) => entry.slot === 'MainHand')
  const mainHandCandidate = getSelectedCandidate(mainHand)

  if (Number(mainHandCandidate?.equip_slot_category || 0) !== 13) {
    return entries
  }

  return entries.map((entry) =>
    entry.slot === 'OffHand' ? makeEmptyEquipmentEntry('OffHand', { slot_names: draft.slotNames }) : entry
  )
}

function getCandidateSwitchDyeEntries(
  draft: GlamourDraft,
  entry: GlamourEquipmentEntry,
  previousCandidate: GlamourCandidate | undefined,
  selectedCandidate: GlamourCandidate
): GlamourDyeEntry[] {
  const selectedDyeCount = getCandidateDyeCount(selectedCandidate, entry.slot)

  if (selectedDyeCount <= 0) {
    return []
  }

  const previousDyes = getDisplayDyeEntries(previousCandidate, entry.slot, draft.noDyeLabels, draft.locale)
  const selectedDyes = getDisplayDyeEntries(selectedCandidate, entry.slot, draft.noDyeLabels, draft.locale)
  const sourceDyes = previousDyes.length ? previousDyes : selectedDyes

  if (!sourceDyes.length) {
    return selectedDyes
  }

  const nextDyes = sourceDyes.slice(0, selectedDyeCount)

  while (nextDyes.length < selectedDyeCount) {
    nextDyes.push(selectedDyes[nextDyes.length] ?? getDisplayDyeEntries(selectedCandidate, entry.slot, draft.noDyeLabels, draft.locale)[nextDyes.length])
  }

  return nextDyes.filter(Boolean)
}

function updateEntryDyeIds(
  entry: GlamourEquipmentEntry,
  dyeEntries: GlamourDyeEntry[],
  userDyeOverride: boolean
): GlamourEquipmentEntry {
  return {
    ...entry,
    dye_id: dyeEntries[0]?.id ?? 0,
    dye_id_2: dyeEntries[1]?.id ?? 0,
    active_dye_entries: dyeEntries,
    active_dye_id: dyeEntries[0]?.id ?? 0,
    active_dye_id_2: dyeEntries[1]?.id ?? 0,
    user_dye_override: userDyeOverride || entry.user_dye_override === true
  }
}

export function replaceGlamourDraftEntryCandidate(
  draft: GlamourDraft,
  slot: string,
  candidate: GlamourCandidate
): GlamourDraft {
  if (!isKnownGlamourSlot(slot)) {
    return draft
  }

  const nextEntries = draft.entries.map((entry) =>
    entry.slot === slot ? createDraftSlotEntry(draft, slot, candidate) : entry
  )

  return {
    ...draft,
    entries: normalizeDraftSlotList(draft, nextEntries)
  }
}

export function selectGlamourDraftEntryCandidate(
  draft: GlamourDraft,
  slot: string,
  candidateKey: string | number | undefined
): GlamourDraft {
  if (!isKnownGlamourSlot(slot)) {
    return draft
  }

  const normalizedKey = String(candidateKey ?? '')
  const nextEntries = draft.entries.map((entry) => {
    if (entry.slot !== slot || !Array.isArray(entry.candidates) || entry.candidates.length <= 1) {
      return entry
    }

    const selectedIndex = entry.candidates.findIndex((candidate) => String(candidate.key ?? '') === normalizedKey)

    if (selectedIndex <= 0) {
      return entry
    }

    const candidates = [...entry.candidates]
    const [selected] = candidates.splice(selectedIndex, 1)
    const previousCandidate = candidates[0]
    const dyeEntries = getCandidateSwitchDyeEntries(draft, entry, previousCandidate, selected)
    const nextSelected = updateCandidateDyeDisplay(selected, dyeEntries, draft.locale, draft.noDyeLabels)
    const nextCandidates = [nextSelected, ...candidates]

    return updateEntryDyeIds({
      ...entry,
      lookup_key: nextSelected.model_main?.raw
        ? `${entry.slot_label || entry.slot || 'SEARCH'}|${nextSelected.model_main.raw}`
        : entry.lookup_key,
      candidate_count: nextCandidates.length,
      candidates: nextCandidates,
      __emptySlot: false
    }, dyeEntries, false)
  })

  return {
    ...draft,
    entries: normalizeDraftSlotList(draft, nextEntries)
  }
}

export function setGlamourDraftEntryDye(
  draft: GlamourDraft,
  slot: string,
  dyeIndex: number,
  stain: GlamourStain
): GlamourDraft {
  if (!isKnownGlamourSlot(slot)) {
    return draft
  }

  const nextEntries = draft.entries.map((entry) => {
    if (entry.slot !== slot || !Array.isArray(entry.candidates) || !entry.candidates[0]) {
      return entry
    }

    const candidate = entry.candidates[0]
    const dyeCount = getCandidateDyeCount(candidate, entry.slot)

    if (dyeIndex < 0 || dyeIndex >= dyeCount) {
      return entry
    }

    const dyeEntries = getDisplayDyeEntries(candidate, entry.slot, draft.noDyeLabels, draft.locale)
    dyeEntries[dyeIndex] = createDyeEntryFromStain(stain, draft.locale)
    const nextCandidate = updateCandidateDyeDisplay(candidate, dyeEntries, draft.locale, draft.noDyeLabels)

    return updateEntryDyeIds({
      ...entry,
      candidates: [nextCandidate, ...entry.candidates.slice(1)],
      __emptySlot: false
    }, dyeEntries, true)
  })

  return {
    ...draft,
    entries: normalizeDraftSlotList(draft, nextEntries)
  }
}

export function clearGlamourDraftEntry(draft: GlamourDraft, slot: string): GlamourDraft {
  if (!isKnownGlamourSlot(slot)) {
    return draft
  }

  return {
    ...draft,
    entries: draft.entries.map((entry) =>
      entry.slot === slot ? makeEmptyEquipmentEntry(slot, { slot_names: draft.slotNames }) : entry
    )
  }
}

export function draftToGlamourPayload(draft: GlamourDraft): GlamourImportPayload {
  return {
    file_type: draft.source.type,
    source_name: draft.source.name,
    source_title: draft.source.title,
    source_locale: draft.source.locale,
    default_locale: draft.locale,
    locales: draft.locales,
    locale_labels: draft.localeLabels,
    slot_names: draft.slotNames,
    dye_labels: draft.dyeLabels,
    no_dye_labels: draft.noDyeLabels,
    warnings: draft.warnings,
    resolved_equipment: draft.entries.filter((entry) => !entry.__emptySlot)
  }
}

function getDraftSourceName(draft: GlamourDraft): string {
  return draft.source.name || draft.source.title || '手动编辑'
}

export function draftToGlamourTemplateDraft(draft: GlamourDraft): GlamourTemplateDraft {
  const entries: GlamourTemplateDraftEntry[] = []

  for (const entry of getFilledGlamourDraftEntries(draft)) {
    const candidate = getSelectedCandidate(entry)

    if (!candidate) {
      continue
    }

    const dyeCount = getCandidateDyeCount(candidate, entry.slot)
    const itemName = getCandidateName(candidate, draft.locale, draft.source.locale)

    entries.push({
      slot: entry.slot,
      item: {
        ...candidate,
        name: itemName,
        dye_count: dyeCount,
        dye_display:
          dyeCount > 0
            ? resolveLocalized(candidate.dye_display_by_locale, draft.locale, draft.source.locale) ||
              candidate.dye_display ||
              ''
            : '',
        dye_display_by_locale: candidate.dye_display_by_locale || {},
        dye_entries: getDisplayDyeEntries(candidate, entry.slot, draft.noDyeLabels, draft.locale)
      }
    })
  }

  return {
    version: 1,
    sourceName: getDraftSourceName(draft),
    locale: draft.locale,
    createdAt: new Date().toISOString(),
    entries
  }
}

export function draftToGlamourStoreEquipment(draft: GlamourDraft): GlamourImportPayload {
  return {
    ...draftToGlamourPayload(draft),
    _storeLocale: draft.locale,
    _storeDisplayName: getDraftSourceName(draft),
    _storeTimestamp: Date.now()
  }
}

export function getGlamourDraftSlotCount(): number {
  return GLAMOUR_SLOT_DEFINITIONS.length
}
