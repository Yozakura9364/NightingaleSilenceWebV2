export type GlamourSlotKey =
  | 'MainHand'
  | 'OffHand'
  | 'HeadGear'
  | 'Body'
  | 'Hands'
  | 'Legs'
  | 'Feet'
  | 'Ears'
  | 'Neck'
  | 'Wrists'
  | 'LeftRing'
  | 'RightRing'
  | 'Glasses'
  | 'FashionAccessory'

export type GlamourLocale = string

export type LocalizedTextMap = Record<string, string | undefined>

export interface GlamourSlotDefinition {
  key: GlamourSlotKey
  names: LocalizedTextMap
}

export interface GlamourDyeEntry {
  id?: number | string
  name?: string
  names?: LocalizedTextMap
  hex?: string
  rgb?: number
  isEmpty?: boolean
  [key: string]: unknown
}

export interface GlamourStain {
  id: number | string
  name: string
  names?: LocalizedTextMap
  hex?: string
  rgb?: number
  group?: number | string
  group_name?: string
  sub_order?: number | string
  [key: string]: unknown
}

export interface GlamourStainGroup {
  key: string
  order: number
  label: string
  items: GlamourStain[]
}

export interface GlamourModelMain {
  primary?: number | string
  secondary?: number | string
  tertiary?: number | string
  quaternary?: number | string
  raw?: string
  [key: string]: unknown
}

export interface GlamourCandidate {
  key?: number | string
  key_label?: string
  name?: string
  names?: LocalizedTextMap
  icon?: number | string
  rarity?: number
  slot_label?: string
  equip_slot_category?: number | string
  model_main?: GlamourModelMain
  dye_count?: number | string
  dye_display?: string
  dye_display_by_locale?: LocalizedTextMap
  dye_entries?: GlamourDyeEntry[]
  is_emperor?: boolean
  [key: string]: unknown
}

export interface GlamourEquipmentEntry {
  slot: GlamourSlotKey | string
  cardRowId?: string
  cardDuplicate?: boolean
  slot_label?: string
  slot_names?: LocalizedTextMap
  slot_display?: string
  lookup_key?: string
  model?: Record<string, unknown>
  dye_id?: number | string
  dye_id_2?: number | string
  candidate_count?: number
  candidates?: GlamourCandidate[]
  __emptySlot?: boolean
  [key: string]: unknown
}

export interface GlamourImportPayload {
  file_type?: string
  source_name?: string
  source_title?: string
  source_locale?: string
  default_locale?: string
  locales?: string[]
  locale_labels?: Record<string, string>
  slot_names?: Record<string, LocalizedTextMap>
  dye_labels?: LocalizedTextMap
  no_dye_labels?: LocalizedTextMap
  warnings?: string[]
  resolved_equipment?: GlamourEquipmentEntry[]
  [key: string]: unknown
}

export interface GlamourDraftSource {
  type: string
  name: string
  title: string
  locale: GlamourLocale
  importedAt: string
  url?: string
  sourceId?: string
  authorName?: string
  authorWorld?: string
  authorLabel?: string
  race?: string
  gender?: string
}

export interface GlamourDraft {
  version: 1
  source: GlamourDraftSource
  locale: GlamourLocale
  locales: GlamourLocale[]
  localeLabels: Record<string, string>
  slotNames: Record<string, LocalizedTextMap>
  dyeLabels: LocalizedTextMap
  noDyeLabels: LocalizedTextMap
  warnings: string[]
  entries: GlamourEquipmentEntry[]
}

export interface GlamourDyeSummary {
  kind: 'empty' | 'ignored' | 'undyeable' | 'none' | 'dyed'
  text: string
}

export interface GlamourRecentSnapshot {
  id: string
  savedAt: string
  sourceName: string
  displayName: string
  sourceUrl?: string
  parsed: GlamourImportPayload
  locale: GlamourLocale
  copyFormat?: string
  customTemplate?: string
}

export type ItemCardLayout = 'left' | 'right'
export type ItemCardMode = 'compact' | 'full'

export interface ItemCardLocaleStyle {
  fontFamily: string
  titleSize: number
  titleWeight: number
  dyeSize: number
}

export interface ItemCardRenderSettings {
  mode: ItemCardMode
  outputLocales: GlamourLocale[]
  localeStyles: Record<GlamourLocale, ItemCardLocaleStyle>
  titleOffsetX: number
  titleOffsetY: number
  dyeOffsetX: number
  dyeOffsetY: number
  fontColor: string
  rarityColorEnabled: boolean
  strokeEnabled: boolean
  strokeRatio: number
  strokeColor: string
}

export interface ItemCardStoredSettings {
  version: 1
  render: ItemCardRenderSettings
  layouts: Record<string, ItemCardLayout>
  listLayout: ItemCardLayout
}
