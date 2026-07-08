import {
  GLAMOUR_ACCESSORY_SLOTS,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getDyeEntryName,
  getNoDyeLabel,
  getSelectedCandidate,
  getSlotTitle,
  isNoDyeEntry
} from '@/lib/glamour/equipment'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeEntry,
  GlamourEquipmentEntry,
  GlamourLocale,
  GlamourSlotKey
} from '@/lib/glamour/types'
import {
  getGlamourTemplateDefinition,
  type GlamourTemplateDefinition,
  type GlamourTemplateDyeFormat
} from '@/lib/glamour/templates/definitions'

export const GLAMOUR_TEMPLATE_SLOT_ORDER: GlamourSlotKey[] = [
  'MainHand',
  'OffHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'Glasses',
  'FashionAccessory'
]

export interface GlamourTemplateItem {
  key?: number | string
  name: string
  names?: Record<string, string | undefined>
  icon?: number | string
  rarity?: number
  dyeCount: number
  isEmperor: boolean
  equipSlotCategory?: number | string
  ecVariantLabel?: string
  ecVariantKind?: string
}

export interface GlamourTemplateDye {
  id?: number | string
  name: string
  names?: Record<string, string | undefined>
  hex?: string
  rgb?: number
  isEmpty: boolean
}

export interface GlamourTemplateRow {
  slot: GlamourSlotKey
  slotName: string
  itemName: string
  item: GlamourTemplateItem
  dyes: GlamourTemplateDye[]
  dyeText: string
  hasDyeLine: boolean
}

function isKnownTemplateSlot(slot: string): slot is GlamourSlotKey {
  return GLAMOUR_TEMPLATE_SLOT_ORDER.includes(slot as GlamourSlotKey)
}

function clampDyeSlotCount(value: unknown, fallback = 0): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? Math.max(0, Math.min(Math.floor(numberValue), 2)) : fallback
}

function resolveTemplateDyeOptions(format: GlamourTemplateDyeFormat) {
  return {
    includeAccessories: format.includeAccessories === true,
    showWhenDyeCountZero: format.showWhenDyeCountZero !== false,
    showEmptySlots: format.showEmptySlots !== false,
    maxSlots: clampDyeSlotCount(format.maxSlots, 2),
    forceSlotCount: clampDyeSlotCount(format.forceSlotCount, 0),
    separator: format.separator ?? ' / ',
    stripDyeSuffix: format.stripDyeSuffix === true,
    reserveLineHeight: format.reserveLineHeight === true
  }
}

function isTemplateDyeExcludedSlot(entry: GlamourEquipmentEntry, format: GlamourTemplateDyeFormat): boolean {
  return format.includeAccessories !== true && GLAMOUR_ACCESSORY_SLOTS.has(entry.slot)
}

function normalizeTemplateDyeName(name: string): string {
  return String(name || '').trim().replace(/^【(.+)】$/u, '$1').replace(/[【】]/gu, '')
}

function makeTemplateNoDye(locale: GlamourLocale, draft: GlamourDraft): GlamourTemplateDye {
  const name = getNoDyeLabel(draft.noDyeLabels, locale)
  return {
    id: 0,
    name,
    names: draft.noDyeLabels ? { ...draft.noDyeLabels } : { [locale]: name },
    hex: 'transparent',
    isEmpty: true
  }
}

function getTemplateDyeSlotCount(
  entry: GlamourEquipmentEntry,
  candidate: GlamourCandidate,
  format: GlamourTemplateDyeFormat
): number {
  const options = resolveTemplateDyeOptions(format)

  if (isTemplateDyeExcludedSlot(entry, format)) {
    return 0
  }

  const actualCount = getCandidateDyeCount(candidate, entry.slot)
  const count = options.forceSlotCount > 0 ? options.forceSlotCount : actualCount
  return Math.min(count, options.maxSlots || 2)
}

function toTemplateDye(
  dye: GlamourDyeEntry,
  draft: GlamourDraft,
  locale: GlamourLocale
): GlamourTemplateDye {
  const isEmpty = isNoDyeEntry(dye)
  const sourceName = getDyeEntryName(dye, draft.noDyeLabels, locale)
  return {
    id: dye.id,
    name: isEmpty ? getNoDyeLabel(draft.noDyeLabels, locale) : normalizeTemplateDyeName(sourceName),
    names: dye.names,
    hex: dye.hex,
    rgb: dye.rgb,
    isEmpty
  }
}

function getTemplateDyes(
  entry: GlamourEquipmentEntry,
  candidate: GlamourCandidate,
  draft: GlamourDraft,
  locale: GlamourLocale,
  format: GlamourTemplateDyeFormat
): GlamourTemplateDye[] {
  const options = resolveTemplateDyeOptions(format)

  if (isTemplateDyeExcludedSlot(entry, format)) {
    return []
  }

  const dyeSlotCount = getTemplateDyeSlotCount(entry, candidate, format)

  if (dyeSlotCount <= 0) {
    return options.showWhenDyeCountZero ? [makeTemplateNoDye(locale, draft)] : []
  }

  const dyes = getDisplayDyeEntries(candidate, entry.slot, draft.noDyeLabels, locale)
    .slice(0, dyeSlotCount)
    .map((dye) => toTemplateDye(dye, draft, locale))

  while (dyes.length < dyeSlotCount) {
    dyes.push(makeTemplateNoDye(locale, draft))
  }

  return options.showEmptySlots ? dyes : dyes.filter((dye) => !dye.isEmpty)
}

function toTemplateItem(
  candidate: GlamourCandidate,
  entry: GlamourEquipmentEntry,
  draft: GlamourDraft,
  locale: GlamourLocale
): GlamourTemplateItem {
  const ecVariantLabel = String(candidate.ec_variant_label || '').trim()
  const ecVariantKind = String(candidate.ec_variant_kind || '').trim()

  return {
    key: candidate.key,
    name: getCandidateName(candidate, locale, draft.source.locale),
    names: candidate.names,
    icon: candidate.icon,
    rarity: candidate.rarity,
    dyeCount: getCandidateDyeCount(candidate, entry.slot),
    isEmperor: candidate.is_emperor === true,
    equipSlotCategory: candidate.equip_slot_category,
    ecVariantLabel,
    ecVariantKind
  }
}

function getOrderedFilledEntries(draft: GlamourDraft): GlamourEquipmentEntry[] {
  const bySlot = new Map<string, GlamourEquipmentEntry>()

  for (const entry of draft.entries) {
    if (isKnownTemplateSlot(entry.slot) && getSelectedCandidate(entry)) {
      bySlot.set(entry.slot, entry)
    }
  }

  return GLAMOUR_TEMPLATE_SLOT_ORDER.map((slot) => bySlot.get(slot)).filter(
    (entry): entry is GlamourEquipmentEntry => Boolean(entry)
  )
}

export function createGlamourTemplateRows(
  draft: GlamourDraft,
  options: {
    template?: GlamourTemplateDefinition | string
    locale?: GlamourLocale
    locales?: GlamourLocale[]
  } = {}
): GlamourTemplateRow[] {
  const template =
    typeof options.template === 'string' || !options.template
      ? getGlamourTemplateDefinition(options.template)
      : options.template
  const locales = options.locales?.length ? options.locales : [options.locale || draft.locale]
  const locale = options.locale || locales[0] || draft.locale
  const maxRows = Math.max(0, Number(template.equipmentFormat.maxRows || 0))
  const format = template.equipmentFormat.dye
  const sourceEntries = getOrderedFilledEntries(draft).filter((entry) => {
    const candidate = getSelectedCandidate(entry)

    return Boolean(
      candidate &&
        locales.some((candidateLocale) =>
          getCandidateName(candidate, candidateLocale, draft.source.locale).trim()
        )
    )
  })
  const limitedEntries = maxRows > 0 ? sourceEntries.slice(0, maxRows) : sourceEntries
  const rows = limitedEntries
    .map((entry) => {
      const candidate = getSelectedCandidate(entry)

      if (!candidate) {
        return null
      }

      const itemName = getCandidateName(candidate, locale, draft.source.locale).trim()

      if (!itemName) {
        return null
      }

      const dyes = getTemplateDyes(entry, candidate, draft, locale, format)
      const separator = resolveTemplateDyeOptions(format).separator
      const dyeText = dyes.map((dye) => dye.name).filter(Boolean).join(separator)

      return {
        slot: entry.slot as GlamourSlotKey,
        slotName: getSlotTitle(entry, locale, {
          slot_names: draft.slotNames,
          default_locale: draft.source.locale
        }),
        itemName,
        item: toTemplateItem(candidate, entry, draft, locale),
        dyes,
        dyeText,
        hasDyeLine: resolveTemplateDyeOptions(format).reserveLineHeight || Boolean(dyeText)
      }
    })
    .filter((row): row is GlamourTemplateRow => Boolean(row))

  return rows
}
