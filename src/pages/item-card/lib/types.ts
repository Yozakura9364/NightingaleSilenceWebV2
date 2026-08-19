// 共享 glamour 类型统一维护在 src/lib/glamour/types.ts，本文件只做 re-export，
// 并保留 item-card 专有的类型与字段扩展，避免双份定义漂移。
import type {
  GlamourCandidate as SharedGlamourCandidate,
  GlamourEquipmentEntry as SharedGlamourEquipmentEntry,
  GlamourLocale,
  GlamourSlotKey,
  LocalizedTextMap
} from '@/lib/glamour/types'

export type {
  GlamourSlotKey,
  GlamourLocale,
  LocalizedTextMap,
  GlamourSlotDefinition,
  GlamourDyeEntry,
  GlamourStain,
  GlamourStainGroup,
  GlamourModelMain,
  GlamourImportPayload,
  GlamourDraftSource,
  GlamourDraft,
  GlamourDyeSummary,
  GlamourRecentSnapshot
} from '@/lib/glamour/types'

export type ItemCardCatalogCategory =
  | 'equipment'
  | 'facewear'
  | 'fashion'
  | 'other'
  | 'furniture'
  | 'mount'
export type ItemCardSearchCategory = ItemCardCatalogCategory | 'emote'

export interface GlamourCandidate extends SharedGlamourCandidate {
  item_kind?: 'equipment' | 'item' | 'emote'
  item_category?: 'furniture' | 'mount'
  item_card_slot?: GlamourSlotKey | 'Emote'
}

export interface GlamourEquipmentEntry extends SharedGlamourEquipmentEntry {
  cardKind?: 'equipment' | 'item' | 'emote'
  cardRowId?: string
  cardDuplicate?: boolean
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
}

export interface ItemCardCustomText {
  id: string
  text: string
}

export interface ItemCardEmoteRecord {
  id: string
  name: string
  names?: LocalizedTextMap
  icon: number
  category?: string
  textCommand?: string
  unlockLink?: string
}
