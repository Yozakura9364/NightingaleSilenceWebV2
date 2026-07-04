import { textKeys } from '@/config/site'
import type { SilenceCharacterForm } from '@/data/silence/characters'

const salvanceForms: SilenceCharacterForm[] = [
  {
    id: 'sorence',
    name: 'Sorence',
    aliases: ['索伦斯', '痛楚'],
    color: '#8f8a9b',
    summaryKey: textKeys.placeholder,
    tagKeys: [textKeys.placeholder, textKeys.placeholder, textKeys.placeholder],
    profile: [
      {
        id: 'status',
        labelKey: textKeys.silenceCharacterDraftStatus,
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
      },
      {
        id: 'color',
        labelKey: textKeys.silenceCharacterColor,
        valueKey: textKeys.placeholder
      }
    ]
  }
]

const characterFormsById: Partial<Record<string, SilenceCharacterForm[]>> = {
  salvance: salvanceForms
}

export function getSilenceCharacterForms(characterId: string): SilenceCharacterForm[] {
  return characterFormsById[characterId]?.map(cloneSilenceCharacterForm) ?? []
}

function cloneSilenceCharacterForm(form: SilenceCharacterForm): SilenceCharacterForm {
  return {
    ...form,
    aliases: [...form.aliases],
    tagKeys: [...form.tagKeys],
    profile: form.profile.map((field) => ({ ...field }))
  }
}
