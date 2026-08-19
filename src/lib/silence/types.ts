export type SilenceGroupId = 'angel' | 'glitch'

export interface SilenceCharacterProfileField {
  id: string
  labelKey: string
  valueKey: string
}

export type SilenceCharacterVisibility = 'public' | 'draft' | 'private'

export interface SilenceCharacterTextFact {
  id: string
  label: string
  value: string
  visibility?: SilenceCharacterVisibility
}

export interface SilenceCharacterProfileSource {
  kind: 'wiki-paste' | 'manual'
  title: string
  url?: string
}

export interface SilenceCharacterProfileNames {
  zh: string
  ja?: string
  en: string
  aliases: string[]
  title?: string
  titleEn?: string
  nickname?: string
}

export interface SilenceCharacterWorld {
  id: string
  labelKey: string
  summaryKey: string
}

export interface SilenceCharacterGalleryItem {
  id: string
  titleKey: string
  captionKey: string
}

export interface SilenceCharacterRelationship {
  id: string
  characterId: string
  labelKey: string
  summaryKey: string
}

export interface SilenceCharacterTextBlock {
  id: string
  titleKey: string
  bodyKey: string
}

export interface SilenceCharacterContentSection {
  id: string
  title: string
  points: string[]
}

export interface SilenceCharacterOutfit {
  id: string
  formIds: string[]
  label: string
  description: string
  equipment: string[]
  imageRef?: string
  visibility: SilenceCharacterVisibility
}

export interface SilenceCharacterStorySection {
  id: string
  title: string
  body: string[]
  spoilerLevel: 'none' | 'light' | 'major'
  visibility: SilenceCharacterVisibility
}

export interface SilenceCharacterProfileContent {
  sourceRefs: SilenceCharacterProfileSource[]
  sections: {
    overview: string
    basic: string
    forms: string
    outfits: string
    combat: string
    story: string
  }
  names: SilenceCharacterProfileNames
  overview: string[]
  facts: SilenceCharacterTextFact[]
  appearance: SilenceCharacterContentSection[]
  outfits: SilenceCharacterOutfit[]
  combat: string[]
  story: SilenceCharacterStorySection[]
  mediaRefs: string[]
}

export interface SilenceCharacterForm {
  id: string
  label: string
  subtitle?: string
  summary: string
  points: string[]
  color?: string
  portraitSrc?: string
  visibility: SilenceCharacterVisibility
}

export interface SilenceCharacter {
  id: string
  name: string
  aliases: string[]
  groupId: SilenceGroupId
  order: number
  color: string
  portraitSrc?: string
  summary?: string
  summaryKey: string
  tagLabels?: string[]
  tagKeys: string[]
  stageFacts?: SilenceCharacterTextFact[]
  profile: SilenceCharacterProfileField[]
  worlds: SilenceCharacterWorld[]
  gallery: SilenceCharacterGalleryItem[]
  relationships: SilenceCharacterRelationship[]
  notes: SilenceCharacterTextBlock[]
  spoilers: SilenceCharacterTextBlock[]
  forms: SilenceCharacterForm[]
  content?: SilenceCharacterProfileContent
}
