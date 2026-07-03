import { textKeys } from '@/config/site'

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

const testProfileRows: SilenceCharacterProfileField[] = [
  {
    id: 'status',
    labelKey: textKeys.silenceCharacterDraftStatus,
    valueKey: textKeys.placeholder
  },
  {
    id: 'color',
    labelKey: textKeys.silenceCharacterColor,
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

const testWorlds: SilenceCharacterWorld[] = [
  {
    id: 'main',
    labelKey: textKeys.placeholder,
    summaryKey: textKeys.placeholder
  },
  {
    id: 'variant',
    labelKey: textKeys.placeholder,
    summaryKey: textKeys.placeholder
  }
]

const testGallery: SilenceCharacterGalleryItem[] = [
  {
    id: 'full-body',
    titleKey: textKeys.silenceCharacterVisual,
    captionKey: textKeys.placeholder
  },
  {
    id: 'expressions',
    titleKey: textKeys.silenceCharacterPreview,
    captionKey: textKeys.placeholder
  },
  {
    id: 'archive',
    titleKey: textKeys.silenceCharacterArchive,
    captionKey: textKeys.placeholder
  }
]

const testNotes: SilenceCharacterTextBlock[] = [
  {
    id: 'concept',
    titleKey: textKeys.silenceCharacterNotes,
    bodyKey: textKeys.placeholder
  },
  {
    id: 'archive',
    titleKey: textKeys.silenceCharacterArchive,
    bodyKey: textKeys.placeholder
  }
]

const testSpoilers: SilenceCharacterTextBlock[] = [
  {
    id: 'spoiler-placeholder',
    titleKey: textKeys.silenceCharacterSpoiler,
    bodyKey: textKeys.placeholder
  }
]

const localPreviewPortraits = import.meta.env.DEV
  ? {
      goelia: '/goelia-art-1.png',
      glynne: '/glynne-art-1.png',
      chihaya: '/chihaya-art-1.png',
      ney: '/ney-art-1.png',
      nightingale: '/nightingale-art-1.png',
      salvance: '/salvance-art-1.png'
    }
  : {}

const silenceCharactersSeed = [
  {
    id: 'goelia',
    name: 'Goelia',
    color: '#ef6fb2',
    portraitSrc: localPreviewPortraits.goelia
  },
  {
    id: 'glynne',
    name: 'Glynne',
    color: '#63d9dc',
    portraitSrc: localPreviewPortraits.glynne
  },
  {
    id: 'chihaya',
    name: 'Chihaya',
    color: '#f3b35d',
    portraitSrc: localPreviewPortraits.chihaya
  },
  {
    id: 'ney',
    name: 'Ney',
    color: '#9b8cff',
    portraitSrc: localPreviewPortraits.ney
  },
  {
    id: 'nightingale',
    name: 'Nightingale',
    color: '#6fcf97',
    portraitSrc: localPreviewPortraits.nightingale
  },
  {
    id: 'salvance',
    name: 'Salvance',
    color: '#e66a6a',
    portraitSrc: localPreviewPortraits.salvance
  }
] as const

export const silenceCharacters: SilenceCharacter[] = silenceCharactersSeed.map(
  (character, index) =>
    createAngelCharacter(
      character.id,
      character.name,
      index + 1,
      character.color,
      character.portraitSrc
    )
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

function createAngelCharacter(
  id: string,
  name: string,
  order: number,
  color: string,
  portraitSrc?: string
): SilenceCharacter {
  return {
    id,
    name,
    aliases: [],
    groupId: 'angel',
    order,
    color,
    portraitSrc,
    summaryKey: textKeys.placeholder,
    tagKeys: [textKeys.placeholder, textKeys.placeholder, textKeys.placeholder],
    profile: testProfileRows,
    worlds: testWorlds,
    gallery: testGallery,
    relationships: createTestRelationships(id),
    notes: testNotes,
    spoilers: testSpoilers
  }
}

function createTestRelationships(characterId: string): SilenceCharacterRelationship[] {
  return silenceCharactersSeed
    .filter((character) => character.id !== characterId)
    .slice(0, 2)
    .map((character) => ({
      id: character.id,
      characterId: character.id,
      labelKey: textKeys.placeholder,
      summaryKey: textKeys.placeholder
    }))
}
