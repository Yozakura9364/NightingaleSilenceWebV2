import { textKeys } from '@/config/site'

export type SilenceGroupId = 'angel' | 'glitch'

export interface SilenceCharacterProfileField {
  id: string
  labelKey: string
  valueKey: string
}

export interface SilenceCharacter {
  id: string
  name: string
  groupId: SilenceGroupId
  order: number
  color: string
  summaryKey: string
  tagKeys: string[]
  profile: SilenceCharacterProfileField[]
}

const testProfileRows: SilenceCharacterProfileField[] = [
  {
    id: 'profile',
    labelKey: textKeys.silenceCharacterProfile,
    valueKey: textKeys.placeholder
  },
  {
    id: 'visual',
    labelKey: textKeys.silenceCharacterVisual,
    valueKey: textKeys.placeholder
  },
  {
    id: 'archive',
    labelKey: textKeys.silenceCharacterArchive,
    valueKey: textKeys.placeholder
  },
  {
    id: 'notes',
    labelKey: textKeys.silenceCharacterNotes,
    valueKey: textKeys.placeholder
  }
]

export const silenceCharacters: SilenceCharacter[] = [
  createAngelCharacter('goelia', 'Goelia', 1, '#ef6fb2'),
  createAngelCharacter('glynne', 'Glynne', 2, '#63d9dc'),
  createAngelCharacter('chihaya', 'Chihaya', 3, '#f3b35d'),
  createAngelCharacter('ney', 'Ney', 4, '#9b8cff'),
  createAngelCharacter('nightingale', 'Nightingale', 5, '#6fcf97'),
  createAngelCharacter('salvance', 'Salvance', 6, '#e66a6a')
]

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

export function getSilenceCharacterRoute(character: SilenceCharacter): string {
  return `/silence/${character.groupId}/${character.id}`
}

export function isSilenceGroupId(value: string): value is SilenceGroupId {
  return value === 'angel' || value === 'glitch'
}

function createAngelCharacter(
  id: string,
  name: string,
  order: number,
  color: string
): SilenceCharacter {
  return {
    id,
    name,
    groupId: 'angel',
    order,
    color,
    summaryKey: textKeys.placeholder,
    tagKeys: [textKeys.placeholder, textKeys.placeholder, textKeys.placeholder],
    profile: testProfileRows
  }
}
