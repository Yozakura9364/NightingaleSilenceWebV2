import type { SilenceCharacterSeed } from '@/data/silence/characterSeeds'
import type { SilenceCharacter } from '@/data/silence/characters'

export type SilenceDraftCharacterContent = Pick<
  SilenceCharacter,
  'summaryKey' | 'tagKeys' | 'profile' | 'worlds' | 'gallery' | 'relationships' | 'notes' | 'spoilers'
>

export function createDraftAngelCharacterContent(
  characterId: string,
  relationshipSources: SilenceCharacterSeed[]
): SilenceDraftCharacterContent {
  void characterId
  void relationshipSources

  return {
    summaryKey: '',
    tagKeys: [],
    profile: [],
    worlds: [],
    gallery: [],
    relationships: [],
    notes: [],
    spoilers: []
  }
}
