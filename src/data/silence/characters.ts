import {
  silenceAngelCharacterSeeds,
  type SilenceCharacterSeed
} from '@/data/silence/characterSeeds'
import { getSilenceCharacterForms } from '@/data/silence/characterForms'
import { getSilenceCharacterProfileContent } from '@/data/silence/characterProfiles'
import { createDraftAngelCharacterContent } from '@/data/silence/draftCharacterContent'

export type SilenceGroupId = 'angel' | 'glitch'

export interface SilenceCharacterProfileField {
  id: string
  labelKey: string
  valueKey: string
}

export interface SilenceCharacterTextFact {
  id: string
  label: string
  value: string
  visibility?: SilenceCharacterVisibility
}

export type SilenceCharacterVisibility = 'public' | 'draft' | 'private'

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

export const silenceCharacters: SilenceCharacter[] = silenceAngelCharacterSeeds.map(
  (character, index) => createAngelCharacter(character, index + 1)
)

export function getSilenceCharactersByGroup(groupId: SilenceGroupId): SilenceCharacter[] {
  return silenceCharacters
    .filter((character) => character.groupId === groupId)
    .sort((left, right) => left.order - right.order)
}

export function getSilenceCharacter(
  groupId: SilenceGroupId,
  characterId: string
): SilenceCharacter | undefined {
  return silenceCharacters.find(
    (character) => character.groupId === groupId && character.id === characterId
  )
}

export function getSilenceCharacterById(characterId: string): SilenceCharacter | undefined {
  return silenceCharacters.find((character) => character.id === characterId)
}

export function getSilenceCharacterRoute(character: SilenceCharacter): string {
  return `/silence/${character.groupId}/${character.id}`
}

export function isSilenceGroupId(value: string): value is SilenceGroupId {
  return value === 'angel' || value === 'glitch'
}

function createAngelCharacter(character: SilenceCharacterSeed, order: number): SilenceCharacter {
  const content = getSilenceCharacterProfileContent(character.id)
  const draftContent = createDraftAngelCharacterContent(character.id, silenceAngelCharacterSeeds)

  return {
    ...character,
    aliases: content?.names.aliases ?? [],
    groupId: 'angel',
    order,
    summary: content?.overview[0],
    tagLabels: createProfileTagLabels(content),
    stageFacts: createStageFacts(content),
    forms: getSilenceCharacterForms(character.id),
    ...draftContent,
    content
  }
}

function createProfileTagLabels(
  content: SilenceCharacterProfileContent | undefined
): string[] | undefined {
  if (!content) {
    return undefined
  }

  return [
    content.names.title,
    content.facts.find((fact) => fact.id === 'identity')?.value,
    content.facts.find((fact) => fact.id === 'affiliation')?.value
  ].filter((value): value is string => Boolean(value))
}

function createStageFacts(
  content: SilenceCharacterProfileContent | undefined
): SilenceCharacterTextFact[] | undefined {
  if (!content) {
    return undefined
  }

  const preferredFactIds = ['zhName', 'title', 'identity', 'height']

  return preferredFactIds
    .map((id) => content.facts.find((fact) => fact.id === id))
    .filter((fact): fact is SilenceCharacterTextFact => Boolean(fact))
}
