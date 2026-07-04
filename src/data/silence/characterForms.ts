import type { SilenceCharacterForm } from '@/data/silence/characters'

const salvanceForms: SilenceCharacterForm[] = [
  {
    id: 'base',
    label: '沙乐万',
    subtitle: '常态',
    summary: '光之战士。',
    points: [],
    visibility: 'public'
  },
  {
    id: 'sorence',
    label: '索伦斯',
    subtitle: '痛楚 / 异化状态',
    summary: '占位用，待编辑',
    points: [],
    color: '#8f8a9b',
    visibility: 'draft'
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
    points: [...form.points]
  }
}
