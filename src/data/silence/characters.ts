import {
  silenceAngelCharacterSeeds,
  type SilenceCharacterSeed
} from '@/data/silence/characterSeeds'
import { getSilenceCharacterForms } from '@/data/silence/characterForms'
import { getSilenceCharacterProfileContent } from '@/data/silence/characterProfiles'
import { createDraftAngelCharacterContent } from '@/data/silence/draftCharacterContent'
import type {
  SilenceCharacter,
  SilenceCharacterProfileContent,
  SilenceCharacterTextFact,
  SilenceGroupId
} from '@/data/silence/types'

export type {
  SilenceCharacter,
  SilenceCharacterContentSection,
  SilenceCharacterForm,
  SilenceCharacterGalleryItem,
  SilenceCharacterOutfit,
  SilenceCharacterProfileContent,
  SilenceCharacterProfileField,
  SilenceCharacterProfileNames,
  SilenceCharacterProfileSource,
  SilenceCharacterRelationship,
  SilenceCharacterStorySection,
  SilenceCharacterTextBlock,
  SilenceCharacterTextFact,
  SilenceCharacterVisibility,
  SilenceCharacterWorld,
  SilenceGroupId
} from '@/data/silence/types'

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
