import type {
  GlamourCandidate,
  GlamourDyeEntry,
  GlamourDyeSummary,
  GlamourEquipmentEntry,
  GlamourImportPayload,
  GlamourLocale,
  GlamourStain,
  GlamourStainGroup,
  GlamourSlotDefinition,
  GlamourSlotKey,
  LocalizedTextMap
} from '@/pages/item-card/lib/types'

export const GLAMOUR_DEFAULT_LOCALE = 'zh'
export const ITEM_CARD_GENERIC_SLOT = 'Item'

export const GLAMOUR_SLOT_DEFINITIONS: GlamourSlotDefinition[] = [
  {
    key: 'MainHand',
    names: {
      zh: '主手',
      en: 'Main Hand',
      ja: 'メインアーム',
      ko: '주 무기',
      tc: '主手',
      fr: 'Main directrice',
      de: 'Haupthand'
    }
  },
  {
    key: 'OffHand',
    names: {
      zh: '副手',
      en: 'Off Hand',
      ja: 'サブアーム',
      ko: '보조 무기',
      tc: '副手',
      fr: 'Main non directrice',
      de: 'Nebenhand'
    }
  },
  {
    key: 'HeadGear',
    names: { zh: '头部', en: 'Head', ja: '頭', ko: '머리', tc: '頭部', fr: 'Tête', de: 'Kopf' }
  },
  {
    key: 'Body',
    names: { zh: '身体', en: 'Body', ja: '胴', ko: '몸통', tc: '身體', fr: 'Torse', de: 'Rumpf' }
  },
  {
    key: 'Hands',
    names: { zh: '手臂', en: 'Hands', ja: '手', ko: '손', tc: '手臂', fr: 'Mains', de: 'Hände' }
  },
  {
    key: 'Legs',
    names: { zh: '腿部', en: 'Legs', ja: '脚', ko: '다리', tc: '腿部', fr: 'Jambes', de: 'Beine' }
  },
  {
    key: 'Feet',
    names: { zh: '脚部', en: 'Feet', ja: '足', ko: '발', tc: '腳部', fr: 'Pieds', de: 'Füße' }
  },
  {
    key: 'Ears',
    names: { zh: '耳部', en: 'Ears', ja: '耳', ko: '귀', tc: '耳部', fr: 'Oreilles', de: 'Ohren' }
  },
  {
    key: 'Neck',
    names: { zh: '颈部', en: 'Neck', ja: '首', ko: '목', tc: '頸部', fr: 'Cou', de: 'Hals' }
  },
  {
    key: 'Wrists',
    names: {
      zh: '腕部',
      en: 'Wrists',
      ja: '腕',
      ko: '손목',
      tc: '腕部',
      fr: 'Poignets',
      de: 'Handgelenke'
    }
  },
  {
    key: 'LeftRing',
    names: {
      zh: '左指',
      en: 'Left Ring',
      ja: '左指',
      ko: '왼쪽 손가락',
      tc: '左指',
      fr: 'Bague gauche',
      de: 'Finger (links)'
    }
  },
  {
    key: 'RightRing',
    names: {
      zh: '右指',
      en: 'Right Ring',
      ja: '右指',
      ko: '오른쪽 손가락',
      tc: '右指',
      fr: 'Bague droite',
      de: 'Finger (rechts)'
    }
  },
  {
    key: 'Glasses',
    names: {
      zh: '面部配饰',
      en: 'Facewear',
      ja: 'フェイスアクセサリー',
      ko: '얼굴 소품',
      tc: '臉部配件',
      fr: 'Accessoires de visage',
      de: 'Gesichtsaccessoires'
    }
  },
  {
    key: 'FashionAccessory',
    names: {
      zh: '时尚配饰',
      en: 'Fashion Accessory',
      ja: 'FASHION ACCESSORIES',
      ko: '패션 소품',
      tc: '時尚配件',
      fr: 'Accessoires de mode',
      de: 'MODEACCESSOIRES'
    }
  }
]

export const GLAMOUR_ACCESSORY_SLOTS = new Set<string>([
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'Glasses',
  'FashionAccessory'
])

const GLAMOUR_NO_DYE_FALLBACK_LABELS: LocalizedTextMap = {
  zh: '无染色',
  en: 'No Dye',
  ja: '染色なし',
  ko: '염색 없음',
  tc: '無染色',
  fr: 'Sans teinture',
  de: 'Keine Färbung'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export function cleanGlamourText(value: unknown): string {
  return String(value ?? '').replace(/<(?:SoftHyphen|Indent)\s*\/>/gi, '')
}

export function normalizeGlamourLocale(locale: string | undefined): GlamourLocale {
  const normalized = String(locale || GLAMOUR_DEFAULT_LOCALE).trim()
  const normalizedLower = normalized.toLowerCase()

  if (['zh-cn', 'zh-hans', 'chs', 'cn'].includes(normalizedLower)) {
    return 'zh'
  }

  if (['zh-tw', 'zh-hant', 'cht'].includes(normalizedLower)) {
    return 'tc'
  }

  return normalized || GLAMOUR_DEFAULT_LOCALE
}

export function resolveLocalized(
  values: LocalizedTextMap | undefined,
  locale: GlamourLocale = GLAMOUR_DEFAULT_LOCALE,
  fallbackLocale: GlamourLocale = GLAMOUR_DEFAULT_LOCALE
): string {
  if (!values || typeof values !== 'object') {
    return ''
  }

  const normalizedLocale = normalizeGlamourLocale(locale)
  const candidates = [
    normalizedLocale,
    fallbackLocale,
    GLAMOUR_DEFAULT_LOCALE,
    'zh',
    'en',
    'ja',
    'ko',
    'tc',
    'fr',
    'de'
  ]

  for (const key of candidates) {
    const value = values[key]

    if (typeof value === 'string' && value.trim()) {
      return cleanGlamourText(value)
    }
  }

  const firstValue = Object.values(values).find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  )
  return cleanGlamourText(firstValue || '')
}

export function getSlotDefinition(slotKey: string): GlamourSlotDefinition | undefined {
  return GLAMOUR_SLOT_DEFINITIONS.find((slot) => slot.key === slotKey)
}

export function getDefaultSlotNames(slotKey: string): LocalizedTextMap {
  return { ...(getSlotDefinition(slotKey)?.names ?? { [GLAMOUR_DEFAULT_LOCALE]: slotKey }) }
}

export function getSlotTitle(
  entry: GlamourEquipmentEntry,
  locale: GlamourLocale,
  payload?: Pick<GlamourImportPayload, 'slot_names' | 'default_locale'>
): string {
  const parsedNames = entry.slot ? payload?.slot_names?.[entry.slot] : undefined
  return (
    resolveLocalized(entry.slot_names, locale, payload?.default_locale) ||
    resolveLocalized(parsedNames, locale, payload?.default_locale) ||
    resolveLocalized(getDefaultSlotNames(entry.slot), locale, payload?.default_locale) ||
    cleanGlamourText(entry.slot_display) ||
    cleanGlamourText(entry.slot) ||
    ''
  )
}

export function getCandidateName(
  candidate: GlamourCandidate | undefined,
  locale: GlamourLocale,
  fallbackLocale: GlamourLocale = GLAMOUR_DEFAULT_LOCALE
): string {
  return (
    resolveLocalized(candidate?.names, locale, fallbackLocale) ||
    cleanGlamourText(candidate?.name) ||
    ''
  )
}

export function getSelectedCandidate(
  entry: GlamourEquipmentEntry | undefined
): GlamourCandidate | undefined {
  return Array.isArray(entry?.candidates) ? entry.candidates[0] : undefined
}

export function isFilledEquipmentEntry(entry: GlamourEquipmentEntry | undefined): boolean {
  return Boolean(entry && !entry.__emptySlot && getSelectedCandidate(entry))
}

export function getCandidateDyeCount(
  candidate: GlamourCandidate | undefined,
  slot: string | undefined
): number {
  if (!candidate || GLAMOUR_ACCESSORY_SLOTS.has(String(slot || ''))) {
    return 0
  }

  return Math.max(0, Math.min(toNumber(candidate.dye_count), 2))
}

export function getNoDyeLabel(
  noDyeLabels: LocalizedTextMap | undefined,
  locale: GlamourLocale = GLAMOUR_DEFAULT_LOCALE
): string {
  return (
    resolveLocalized(noDyeLabels, locale, locale) ||
    resolveLocalized(GLAMOUR_NO_DYE_FALLBACK_LABELS, locale, locale) ||
    GLAMOUR_NO_DYE_FALLBACK_LABELS.zh ||
    ''
  )
}

export function makeNoDyeEntry(
  noDyeLabels?: LocalizedTextMap,
  locale: GlamourLocale = GLAMOUR_DEFAULT_LOCALE
): GlamourDyeEntry {
  const name = getNoDyeLabel(noDyeLabels, locale)
  return {
    id: 0,
    name,
    names: noDyeLabels ? { ...noDyeLabels } : { [locale]: name },
    hex: 'transparent',
    isEmpty: true
  }
}

export function getDisplayDyeEntries(
  candidate: GlamourCandidate | undefined,
  slot: string | undefined,
  noDyeLabels?: LocalizedTextMap,
  locale: GlamourLocale = GLAMOUR_DEFAULT_LOCALE
): GlamourDyeEntry[] {
  const dyeCount = getCandidateDyeCount(candidate, slot)
  const entries = (Array.isArray(candidate?.dye_entries) ? candidate.dye_entries : [])
    .filter(Boolean)
    .slice(0, dyeCount)

  while (entries.length < dyeCount) {
    entries.push(makeNoDyeEntry(noDyeLabels, locale))
  }

  return entries.map((entry) => entry || makeNoDyeEntry(noDyeLabels, locale))
}

export function isNoDyeEntry(entry: GlamourDyeEntry | undefined): boolean {
  return Boolean(entry?.isEmpty || toNumber(entry?.id) === 0)
}

export function getDyeEntryName(
  entry: GlamourDyeEntry | undefined,
  noDyeLabels: LocalizedTextMap | undefined,
  locale: GlamourLocale
): string {
  if (isNoDyeEntry(entry)) {
    return getNoDyeLabel(noDyeLabels, locale)
  }

  return resolveLocalized(entry?.names, locale) || cleanGlamourText(entry?.name)
}

export function createDyeEntryFromStain(
  stain: GlamourStain,
  locale: GlamourLocale
): GlamourDyeEntry {
  const id = Number(stain.id || 0)
  const name = resolveLocalized(stain.names, locale) || cleanGlamourText(stain.name)

  return {
    id,
    name,
    names: stain.names ? { ...stain.names, [locale]: name } : { [locale]: name },
    hex: stain.hex || (id > 0 ? '#000000' : 'transparent'),
    rgb: stain.rgb,
    group: stain.group,
    group_name: stain.group_name,
    sub_order: stain.sub_order,
    isEmpty: id <= 0
  }
}

export function updateCandidateDyeDisplay(
  candidate: GlamourCandidate,
  dyeEntries: GlamourDyeEntry[],
  locale: GlamourLocale,
  noDyeLabels?: LocalizedTextMap
): GlamourCandidate {
  const dyeDisplay = dyeEntries
    .map((entry) => getDyeEntryName(entry, noDyeLabels, locale))
    .filter(Boolean)
    .join(' | ')

  return {
    ...candidate,
    dye_entries: dyeEntries,
    dye_display: dyeDisplay,
    dye_display_by_locale: {
      ...(candidate.dye_display_by_locale || {}),
      [locale]: dyeDisplay
    }
  }
}

export function getCopyDyeEntries(dyeEntries: GlamourDyeEntry[]): GlamourDyeEntry[] {
  const entries = dyeEntries.filter(Boolean)

  if (!entries.length) {
    return []
  }

  if (entries.length >= 2) {
    const firstEmpty = isNoDyeEntry(entries[0])
    const secondEmpty = isNoDyeEntry(entries[1])

    if (firstEmpty && !secondEmpty) {
      return entries.slice(0, 2)
    }

    return entries.filter((entry) => !isNoDyeEntry(entry))
  }

  return isNoDyeEntry(entries[0]) ? [] : [entries[0]]
}

export function getCandidateCopyDyeText(
  candidate: GlamourCandidate | undefined,
  slot: string | undefined,
  locale: GlamourLocale,
  noDyeLabels?: LocalizedTextMap
): string {
  return getCopyDyeEntries(getDisplayDyeEntries(candidate, slot, noDyeLabels, locale))
    .map((entry) => getDyeEntryName(entry, noDyeLabels, locale))
    .filter(Boolean)
    .join(' | ')
}

export function getEquipmentDyeSummary(
  entry: GlamourEquipmentEntry,
  locale: GlamourLocale,
  noDyeLabels?: LocalizedTextMap
): GlamourDyeSummary {
  const candidate = getSelectedCandidate(entry)

  if (!candidate) {
    return { kind: 'empty', text: '' }
  }

  if (GLAMOUR_ACCESSORY_SLOTS.has(entry.slot)) {
    return { kind: 'ignored', text: '' }
  }

  const dyeCount = getCandidateDyeCount(candidate, entry.slot)

  if (dyeCount <= 0) {
    const text =
      resolveLocalized(candidate.dye_display_by_locale, locale) ||
      cleanGlamourText(candidate.dye_display)
    return { kind: 'undyeable', text }
  }

  const dyeText = getDisplayDyeEntries(candidate, entry.slot, noDyeLabels, locale)
    .map((dye) => getDyeEntryName(dye, noDyeLabels, locale))
    .filter(Boolean)
    .join(' | ')

  if (
    !dyeText ||
    getCopyDyeEntries(getDisplayDyeEntries(candidate, entry.slot, noDyeLabels, locale)).length === 0
  ) {
    return { kind: 'none', text: dyeText || getNoDyeLabel(noDyeLabels, locale) }
  }

  return { kind: 'dyed', text: dyeText }
}

export function groupGlamourStains(stains: GlamourStain[]): GlamourStainGroup[] {
  const groups = new Map<string, GlamourStainGroup>()

  for (const stain of stains) {
    const key = String(stain.group || 0)

    if (!groups.has(key)) {
      const order = Number(stain.group || 0)

      groups.set(key, {
        key,
        order: Number.isFinite(order) ? order : 0,
        label: stain.group_name || String(stain.group || ''),
        items: []
      })
    }

    groups.get(key)?.items.push(stain)
  }

  return Array.from(groups.values()).sort((a, b) => a.order - b.order)
}

function normalizeDyeSearchText(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function stainMatchesQuery(stain: GlamourStain, query: string): boolean {
  const normalizedQuery = normalizeDyeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  const fields = [
    stain.id,
    stain.name,
    stain.hex,
    stain.group_name,
    stain.group,
    ...(stain.names && typeof stain.names === 'object' ? Object.values(stain.names) : [])
  ]

  return fields.some((field) => normalizeDyeSearchText(field).includes(normalizedQuery))
}

export function getEquipmentModelCode(entry: GlamourEquipmentEntry): string {
  const raw = getSelectedCandidate(entry)?.model_main?.raw

  if (raw) {
    return String(raw).replace(/\s*,\s*/g, ',')
  }

  const model = isRecord(entry.model) ? entry.model : {}

  if (Number.isFinite(Number(model.id))) {
    return String(Number(model.id))
  }

  if (Number.isFinite(Number(model.set))) {
    return [model.set, model.base, model.variant, 0].map((value) => Number(value) || 0).join(',')
  }

  if (Number.isFinite(Number(model.base))) {
    return [model.base, model.variant, 0, 0].map((value) => Number(value) || 0).join(',')
  }

  return ''
}

export function buildGlamourIconUrl(apiBase: string, iconId: unknown): string {
  const numericId = Number(iconId)

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return ''
  }

  return `${apiBase.replace(/\/+$/, '')}/icon/${numericId}`
}

function normalizeLocalizedTextMap(value: unknown): LocalizedTextMap | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, text]) => typeof text === 'string')
      .map(([locale, text]) => [locale, cleanGlamourText(text)])
  )
}

function normalizeDyeEntries(value: unknown): GlamourDyeEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((entry) => ({
    ...entry,
    name: cleanGlamourText(entry.name),
    names: normalizeLocalizedTextMap(entry.names)
  }))
}

function normalizeCandidate(value: unknown): GlamourCandidate | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const names = normalizeLocalizedTextMap(value.names)
  const dyeDisplayByLocale = normalizeLocalizedTextMap(value.dye_display_by_locale)
  const modelMain = isRecord(value.model_main) ? { ...value.model_main } : undefined

  return {
    ...value,
    name: cleanGlamourText(value.name),
    names,
    dye_display: cleanGlamourText(value.dye_display),
    dye_display_by_locale: dyeDisplayByLocale,
    dye_entries: normalizeDyeEntries(value.dye_entries),
    model_main: modelMain,
    is_emperor: value.is_emperor === true
  }
}

export function makeEmptyEquipmentEntry(
  slotKey: GlamourSlotKey,
  payload?: Pick<GlamourImportPayload, 'slot_names'>,
  options: { cardRowId?: string; cardDuplicate?: boolean } = {}
): GlamourEquipmentEntry {
  return {
    slot: slotKey,
    cardRowId: options.cardRowId || `base:${slotKey}`,
    cardDuplicate: options.cardDuplicate === true,
    slot_label: slotKey,
    slot_names: payload?.slot_names?.[slotKey] ?? getDefaultSlotNames(slotKey),
    slot_display: resolveLocalized(payload?.slot_names?.[slotKey] ?? getDefaultSlotNames(slotKey)),
    lookup_key: '',
    model: {},
    dye_id: 0,
    dye_id_2: 0,
    candidate_count: 0,
    candidates: [],
    __emptySlot: true
  }
}

export function isItemCardPlainItem(entry: GlamourEquipmentEntry | undefined): boolean {
  return entry?.cardKind === 'item' || entry?.slot === ITEM_CARD_GENERIC_SLOT
}

function normalizeEquipmentEntry(value: unknown): GlamourEquipmentEntry | undefined {
  if (!isRecord(value) || typeof value.slot !== 'string') {
    return undefined
  }

  const candidates = Array.isArray(value.candidates)
    ? value.candidates
        .map(normalizeCandidate)
        .filter((candidate): candidate is GlamourCandidate => Boolean(candidate))
    : []

  return {
    ...value,
    slot: value.slot,
    cardKind:
      value.cardKind === 'item' || value.slot === ITEM_CARD_GENERIC_SLOT ? 'item' : 'equipment',
    cardRowId: typeof value.cardRowId === 'string' ? value.cardRowId.trim() : undefined,
    cardDuplicate: value.cardDuplicate === true,
    slot_label: typeof value.slot_label === 'string' ? value.slot_label : undefined,
    slot_names: normalizeLocalizedTextMap(value.slot_names),
    slot_display: cleanGlamourText(value.slot_display),
    lookup_key: typeof value.lookup_key === 'string' ? value.lookup_key : undefined,
    model: isRecord(value.model) ? { ...value.model } : {},
    dye_id: value.dye_id as number | string | undefined,
    dye_id_2: value.dye_id_2 as number | string | undefined,
    candidate_count: Math.max(0, toNumber(value.candidate_count || candidates.length)),
    candidates
  }
}

function mainHandBlocksOffHand(candidate: GlamourCandidate | undefined): boolean {
  return toNumber(candidate?.equip_slot_category) === 13
}

let cachedIgnoreEmperor: boolean | null = null

function shouldIgnoreEmperorItems(): boolean {
  if (cachedIgnoreEmperor === null) {
    cachedIgnoreEmperor =
      typeof localStorage !== 'undefined' && localStorage.getItem('nsitemcard.ignoreEmperor') === '1'
  }
  return cachedIgnoreEmperor
}

export function getVisibleEquipmentEntries(
  payload: GlamourImportPayload | undefined
): GlamourEquipmentEntry[] {
  const entriesBySlot = new Map<string, GlamourEquipmentEntry>()
  const duplicateEntriesBySlot = new Map<string, GlamourEquipmentEntry[]>()
  const plainItemEntries: GlamourEquipmentEntry[] = []
  const storedEntries: GlamourEquipmentEntry[] = []
  const storedRows =
    payload?._itemCardRowsVersion === 1 && Array.isArray(payload._cardRows)
      ? payload._cardRows
      : undefined
  const rawEntries =
    storedRows || (Array.isArray(payload?.resolved_equipment) ? payload.resolved_equipment : [])
  const preserveDuplicateRows = Boolean(storedRows)
  const knownSlots = new Set<string>(GLAMOUR_SLOT_DEFINITIONS.map((definition) => definition.key))
  const usedRowIds = new Set<string>()
  const ignoreEmperor = shouldIgnoreEmperorItems()

  for (const rawEntry of rawEntries) {
    const entry = normalizeEquipmentEntry(rawEntry)

    if (!entry) {
      continue
    }

    if (isItemCardPlainItem(entry)) {
      if (!preserveDuplicateRows || !getSelectedCandidate(entry)) {
        continue
      }
      const preferredRowId = entry.cardRowId
      const cardRowId =
        preferredRowId && !usedRowIds.has(preferredRowId)
          ? preferredRowId
          : createItemCardRowId(ITEM_CARD_GENERIC_SLOT)
      usedRowIds.add(cardRowId)
      plainItemEntries.push({
        ...entry,
        slot: ITEM_CARD_GENERIC_SLOT,
        cardKind: 'item',
        cardRowId,
        cardDuplicate: true,
        __emptySlot: false
      })
      if (preserveDuplicateRows) {
        storedEntries.push(plainItemEntries[plainItemEntries.length - 1])
      }
      continue
    }

    if (!knownSlots.has(entry.slot)) {
      continue
    }

    if (!getSelectedCandidate(entry)) {
      continue
    }

    if (ignoreEmperor && getSelectedCandidate(entry)?.is_emperor === true) {
      continue
    }

    if (preserveDuplicateRows) {
      const preferredRowId = entry.cardRowId
      const cardRowId =
        preferredRowId && !usedRowIds.has(preferredRowId)
          ? preferredRowId
          : createItemCardRowId(entry.slot)
      usedRowIds.add(cardRowId)
      storedEntries.push({
        ...entry,
        cardKind: 'equipment',
        cardRowId,
        cardDuplicate: true,
        __emptySlot: false
      })
      continue
    }

    const shouldDuplicate =
      preserveDuplicateRows && (entry.cardDuplicate === true || entriesBySlot.has(entry.slot))

    if (!shouldDuplicate && entriesBySlot.has(entry.slot)) {
      continue
    }

    const preferredRowId = shouldDuplicate ? entry.cardRowId : `base:${entry.slot}`
    const cardRowId =
      preferredRowId && !usedRowIds.has(preferredRowId)
        ? preferredRowId
        : createItemCardRowId(entry.slot)
    usedRowIds.add(cardRowId)
    const normalizedEntry = {
      ...entry,
      cardRowId,
      cardDuplicate: shouldDuplicate
    }

    if (shouldDuplicate) {
      duplicateEntriesBySlot.set(entry.slot, [
        ...(duplicateEntriesBySlot.get(entry.slot) || []),
        normalizedEntry
      ])
    } else {
      entriesBySlot.set(entry.slot, normalizedEntry)
    }
  }

  if (preserveDuplicateRows) {
    return storedEntries
  }

  if (mainHandBlocksOffHand(getSelectedCandidate(entriesBySlot.get('MainHand')))) {
    entriesBySlot.delete('OffHand')
    duplicateEntriesBySlot.delete('OffHand')
  }

  return [
    ...GLAMOUR_SLOT_DEFINITIONS.flatMap((slot) => [
      ...(entriesBySlot.has(slot.key) ? [entriesBySlot.get(slot.key)!] : []),
      ...(duplicateEntriesBySlot.get(slot.key) || [])
    ]),
    ...plainItemEntries
  ]
}

let itemCardRowSequence = 0

export function createItemCardRowId(slot: string): string {
  itemCardRowSequence += 1
  return `row:${slot}:${Date.now().toString(36)}:${itemCardRowSequence.toString(36)}`
}

export function getItemCardRowId(entry: GlamourEquipmentEntry): string {
  return entry.cardRowId || `base:${entry.slot}`
}
