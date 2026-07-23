import {
  GLAMOUR_DEFAULT_LOCALE,
  GLAMOUR_SLOT_DEFINITIONS,
  ITEM_CARD_GENERIC_SLOT,
  createItemCardRowId,
  createDyeEntryFromStain,
  getCandidateDyeCount,
  getDisplayDyeEntries,
  getItemCardRowId,
  getVisibleEquipmentEntries,
  makeEmptyEquipmentEntry,
  normalizeGlamourLocale,
  updateCandidateDyeDisplay
} from '@/pages/item-card/lib/equipment'
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
} from '@/pages/item-card/lib/types'

export const GLAMOUR_CARD_DRAFT_STORAGE_KEY = 'nsitemcard.cardDraft.v2'
export const GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY = 'nsitemcard.store.equipment'
const GLAMOUR_LOCALE_ORDER: GlamourLocale[] = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeLocaleList(payload: GlamourImportPayload | undefined): GlamourLocale[] {
  const locales = Array.isArray(payload?.locales) ? payload.locales : []
  const normalized = locales.map(normalizeGlamourLocale).filter(Boolean)
  const fallback = normalizeGlamourLocale(payload?.source_locale || payload?.default_locale)
  const values = [...normalized, fallback, GLAMOUR_DEFAULT_LOCALE]
  return orderGlamourLocales(Array.from(new Set(values)))
}

function orderGlamourLocales(locales: GlamourLocale[]): GlamourLocale[] {
  return [...locales].sort((left, right) => {
    const leftIndex = GLAMOUR_LOCALE_ORDER.indexOf(left)
    const rightIndex = GLAMOUR_LOCALE_ORDER.indexOf(right)
    const normalizedLeftIndex = leftIndex === -1 ? GLAMOUR_LOCALE_ORDER.length : leftIndex
    const normalizedRightIndex = rightIndex === -1 ? GLAMOUR_LOCALE_ORDER.length : rightIndex

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex
    }

    return left.localeCompare(right)
  })
}

function normalizeWarnings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
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

export function storedGlamourValueToPayload(value: unknown): GlamourImportPayload | undefined {
  if (!isRecord(value) || !Array.isArray(value.resolved_equipment)) {
    return undefined
  }
  return value as GlamourImportPayload
}

export function createEmptyGlamourDraft(preferredLocale = GLAMOUR_DEFAULT_LOCALE): GlamourDraft {
  const locale = normalizeGlamourLocale(preferredLocale)

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
    locales: [...GLAMOUR_LOCALE_ORDER],
    localeLabels: {},
    slotNames: {},
    dyeLabels: {},
    noDyeLabels: {},
    warnings: [],
    entries: []
  }
}

export function createGlamourDraftFromPayload(
  payload: GlamourImportPayload,
  options: { preferredLocale?: string; importedAt?: string } = {}
): GlamourDraft {
  const locale = selectDraftLocale(payload, options.preferredLocale)
  const locales = normalizeLocaleList(payload)
  const slotNames = payload.slot_names ?? {}
  const author =
    payload.author && typeof payload.author === 'object' && !Array.isArray(payload.author)
      ? (payload.author as Record<string, unknown>)
      : {}
  const sourceUrl = String(payload.source_url || '').trim()
  const sourceIdMatch = sourceUrl.match(/(?:detail\/|[?&](?:id|glamour_id|glamourId)=)(\d+)/i)
  const sourceId =
    String(payload.source_id || payload.sourceId || '').trim() ||
    (sourceIdMatch ? sourceIdMatch[1] : '')

  return {
    version: 1,
    source: {
      type: payload.file_type || '',
      name:
        typeof payload._storeDisplayName === 'string' && payload._storeDisplayName.trim()
          ? payload._storeDisplayName.trim()
          : payload.source_name || '',
      title: payload.source_title || '',
      locale: normalizeGlamourLocale(payload.source_locale || payload.default_locale || locale),
      importedAt: options.importedAt || new Date().toISOString(),
      url: sourceUrl,
      sourceId,
      authorName: String(author.name || '').trim(),
      authorWorld: String(author.world || '').trim(),
      authorLabel: String(author.label || payload.source_author || '').trim(),
      race: String(payload.race || '').trim(),
      gender: String(payload.gender || '').trim()
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
  const locales = orderGlamourLocales(
    draft.locales.includes(normalized) ? draft.locales : [...draft.locales, normalized]
  )

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
  candidate: GlamourCandidate,
  row: Pick<GlamourEquipmentEntry, 'cardRowId' | 'cardDuplicate'>
): GlamourEquipmentEntry {
  const dyeEntries = Array.isArray(candidate.dye_entries) ? candidate.dye_entries : []

  return {
    ...makeEmptyEquipmentEntry(slot, { slot_names: draft.slotNames }, row),
    lookup_key: `SEARCH|${slot}|${candidate.key ?? ''}`,
    dye_id: dyeEntries[0]?.id ?? 0,
    dye_id_2: dyeEntries[1]?.id ?? 0,
    candidate_count: 1,
    candidates: [candidate],
    __emptySlot: false
  }
}

export function addItemCardCatalogItem(
  draft: GlamourDraft,
  candidate: GlamourCandidate
): GlamourDraft {
  const candidateLocales = Object.keys(candidate.names || {}).map(normalizeGlamourLocale)
  const slot = candidate.item_card_slot

  if (candidate.item_kind === 'equipment' && slot && isKnownGlamourSlot(slot)) {
    const equipmentCandidate: GlamourCandidate = {
      ...candidate,
      item_kind: 'equipment'
    }
    const dyeEntries = getDisplayDyeEntries(
      equipmentCandidate,
      slot,
      draft.noDyeLabels,
      draft.locale
    )
    const normalizedCandidate = updateCandidateDyeDisplay(
      equipmentCandidate,
      dyeEntries,
      draft.locale,
      draft.noDyeLabels
    )
    const entry = {
      ...createDraftSlotEntry(draft, slot, normalizedCandidate, {
        cardRowId: createItemCardRowId(slot),
        cardDuplicate: true
      }),
      cardKind: 'equipment' as const
    }

    return {
      ...draft,
      locales: orderGlamourLocales(Array.from(new Set([...draft.locales, ...candidateLocales]))),
      entries: [...draft.entries, entry]
    }
  }

  const normalizedCandidate: GlamourCandidate = {
    ...candidate,
    item_kind: 'item',
    dye_count: 0,
    dye_display: '',
    dye_display_by_locale: {},
    dye_entries: []
  }
  const entry: GlamourEquipmentEntry = {
    slot: ITEM_CARD_GENERIC_SLOT,
    cardKind: 'item',
    cardRowId: createItemCardRowId(ITEM_CARD_GENERIC_SLOT),
    cardDuplicate: true,
    slot_label: '',
    slot_names: {},
    slot_display: '',
    lookup_key: `ITEM|${candidate.key ?? ''}`,
    model: {},
    dye_id: 0,
    dye_id_2: 0,
    candidate_count: 1,
    candidates: [normalizedCandidate],
    __emptySlot: false
  }
  return {
    ...draft,
    locales: orderGlamourLocales(Array.from(new Set([...draft.locales, ...candidateLocales]))),
    entries: [...draft.entries, entry]
  }
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

  const previousDyes = getDisplayDyeEntries(
    previousCandidate,
    entry.slot,
    draft.noDyeLabels,
    draft.locale
  )
  const selectedDyes = getDisplayDyeEntries(
    selectedCandidate,
    entry.slot,
    draft.noDyeLabels,
    draft.locale
  )
  const sourceDyes = previousDyes.length ? previousDyes : selectedDyes

  if (!sourceDyes.length) {
    return selectedDyes
  }

  const nextDyes = sourceDyes.slice(0, selectedDyeCount)

  while (nextDyes.length < selectedDyeCount) {
    nextDyes.push(
      selectedDyes[nextDyes.length] ??
        getDisplayDyeEntries(selectedCandidate, entry.slot, draft.noDyeLabels, draft.locale)[
          nextDyes.length
        ]
    )
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

export function selectGlamourDraftEntryCandidate(
  draft: GlamourDraft,
  rowId: string,
  candidateKey: string | number | undefined
): GlamourDraft {
  const normalizedKey = String(candidateKey ?? '')
  const nextEntries = draft.entries.map((entry) => {
    if (
      getItemCardRowId(entry) !== rowId ||
      !Array.isArray(entry.candidates) ||
      entry.candidates.length <= 1
    ) {
      return entry
    }

    const selectedIndex = entry.candidates.findIndex(
      (candidate) => String(candidate.key ?? '') === normalizedKey
    )

    if (selectedIndex <= 0) {
      return entry
    }

    const candidates = [...entry.candidates]
    const [selected] = candidates.splice(selectedIndex, 1)
    const previousCandidate = candidates[0]
    const dyeEntries = getCandidateSwitchDyeEntries(draft, entry, previousCandidate, selected)
    const nextSelected = updateCandidateDyeDisplay(
      selected,
      dyeEntries,
      draft.locale,
      draft.noDyeLabels
    )
    const nextCandidates = [nextSelected, ...candidates]

    return updateEntryDyeIds(
      {
        ...entry,
        lookup_key: nextSelected.model_main?.raw
          ? `${entry.slot_label || entry.slot || 'SEARCH'}|${nextSelected.model_main.raw}`
          : entry.lookup_key,
        candidate_count: nextCandidates.length,
        candidates: nextCandidates,
        __emptySlot: false
      },
      dyeEntries,
      false
    )
  })

  return {
    ...draft,
    entries: nextEntries
  }
}

export function setGlamourDraftEntryDye(
  draft: GlamourDraft,
  rowId: string,
  dyeIndex: number,
  stain: GlamourStain
): GlamourDraft {
  const nextEntries = draft.entries.map((entry) => {
    if (
      getItemCardRowId(entry) !== rowId ||
      !Array.isArray(entry.candidates) ||
      !entry.candidates[0]
    ) {
      return entry
    }

    const candidate = entry.candidates[0]
    const dyeCount = getCandidateDyeCount(candidate, entry.slot)

    if (dyeIndex < 0 || dyeIndex >= dyeCount) {
      return entry
    }

    const dyeEntries = getDisplayDyeEntries(candidate, entry.slot, draft.noDyeLabels, draft.locale)
    dyeEntries[dyeIndex] = createDyeEntryFromStain(stain, draft.locale)
    const nextCandidate = updateCandidateDyeDisplay(
      candidate,
      dyeEntries,
      draft.locale,
      draft.noDyeLabels
    )

    return updateEntryDyeIds(
      {
        ...entry,
        candidates: [nextCandidate, ...entry.candidates.slice(1)],
        __emptySlot: false
      },
      dyeEntries,
      true
    )
  })

  return {
    ...draft,
    entries: nextEntries
  }
}

export function clearGlamourDraftEntry(draft: GlamourDraft, rowId: string): GlamourDraft {
  const target = draft.entries.find((entry) => getItemCardRowId(entry) === rowId)

  if (!target) {
    return draft
  }
  return {
    ...draft,
    entries: draft.entries.filter((entry) => getItemCardRowId(entry) !== rowId)
  }
}

export function draftToGlamourPayload(draft: GlamourDraft): GlamourImportPayload {
  return {
    file_type: draft.source.type,
    source_name: draft.source.name,
    source_title: draft.source.title,
    source_url: draft.source.url,
    source_id: draft.source.sourceId,
    source_author: draft.source.authorLabel,
    race: draft.source.race,
    gender: draft.source.gender,
    source_locale: draft.source.locale,
    default_locale: draft.locale,
    locales: draft.locales,
    locale_labels: draft.localeLabels,
    author: {
      name: draft.source.authorName,
      world: draft.source.authorWorld,
      label: draft.source.authorLabel
    },
    slot_names: draft.slotNames,
    dye_labels: draft.dyeLabels,
    no_dye_labels: draft.noDyeLabels,
    warnings: draft.warnings,
    resolved_equipment: draft.entries.filter((entry) => !entry.__emptySlot),
    _itemCardRowsVersion: 1,
    _cardRows: draft.entries
  }
}

function getDraftSourceName(draft: GlamourDraft): string {
  return draft.source.name || draft.source.title || '手动编辑'
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
