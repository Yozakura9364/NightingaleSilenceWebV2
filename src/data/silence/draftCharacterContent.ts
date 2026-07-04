import { textKeys } from '@/config/site'
import type { SilenceCharacterSeed } from '@/data/silence/characterSeeds'
import type {
  SilenceCharacter,
  SilenceCharacterGalleryItem,
  SilenceCharacterProfileField,
  SilenceCharacterRelationship,
  SilenceCharacterTextBlock,
  SilenceCharacterWorld
} from '@/data/silence/characters'

export type SilenceDraftCharacterContent = Pick<
  SilenceCharacter,
  'summaryKey' | 'tagKeys' | 'profile' | 'worlds' | 'gallery' | 'relationships' | 'notes' | 'spoilers'
>

const draftProfileRows: SilenceCharacterProfileField[] = [
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

const draftWorlds: SilenceCharacterWorld[] = [
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

const draftGallery: SilenceCharacterGalleryItem[] = [
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

const draftNotes: SilenceCharacterTextBlock[] = [
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

const draftSpoilers: SilenceCharacterTextBlock[] = [
  {
    id: 'spoiler-placeholder',
    titleKey: textKeys.silenceCharacterSpoiler,
    bodyKey: textKeys.placeholder
  }
]

export function createDraftAngelCharacterContent(
  characterId: string,
  relationshipSources: SilenceCharacterSeed[]
): SilenceDraftCharacterContent {
  return {
    summaryKey: textKeys.placeholder,
    tagKeys: [textKeys.placeholder, textKeys.placeholder, textKeys.placeholder],
    profile: cloneList(draftProfileRows),
    worlds: cloneList(draftWorlds),
    gallery: cloneList(draftGallery),
    relationships: createDraftRelationships(characterId, relationshipSources),
    notes: cloneList(draftNotes),
    spoilers: cloneList(draftSpoilers)
  }
}

function createDraftRelationships(
  characterId: string,
  relationshipSources: SilenceCharacterSeed[]
): SilenceCharacterRelationship[] {
  return relationshipSources
    .filter((character) => character.id !== characterId)
    .slice(0, 2)
    .map((character) => ({
      id: character.id,
      characterId: character.id,
      labelKey: textKeys.placeholder,
      summaryKey: textKeys.placeholder
    }))
}

function cloneList<T extends object>(items: T[]): T[] {
  return items.map((item) => ({ ...item }))
}
