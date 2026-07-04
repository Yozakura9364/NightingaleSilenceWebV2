import {
  silenceAngelCharacterSeeds,
  type SilenceCharacterSeed
} from '@/data/silence/characterSeeds'
import { createDraftAngelCharacterContent } from '@/data/silence/draftCharacterContent'

export type SilenceGroupId = 'angel' | 'glitch'

export interface SilenceCharacterProfileField {
  id: string
  labelKey: string
  valueKey: string
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

export interface SilenceCharacter {
  id: string
  name: string
  aliases: string[]
  groupId: SilenceGroupId
  order: number
  color: string
  portraitSrc?: string
  summaryKey: string
  tagKeys: string[]
  profile: SilenceCharacterProfileField[]
  worlds: SilenceCharacterWorld[]
  gallery: SilenceCharacterGalleryItem[]
  relationships: SilenceCharacterRelationship[]
  notes: SilenceCharacterTextBlock[]
  spoilers: SilenceCharacterTextBlock[]
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
  return {
    ...character,
    aliases: [],
    groupId: 'angel',
    order,
    ...createDraftAngelCharacterContent(character.id, silenceAngelCharacterSeeds)
  }
}
