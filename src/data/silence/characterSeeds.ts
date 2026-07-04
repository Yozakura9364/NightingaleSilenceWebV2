type SilenceAngelCharacterId =
  | 'goelia'
  | 'glynne'
  | 'chihaya'
  | 'ney'
  | 'nightingale'
  | 'salvance'

export interface SilenceCharacterSeed {
  id: SilenceAngelCharacterId
  name: string
  color: string
  portraitSrc?: string
}

const localPreviewPortraits: Partial<Record<SilenceAngelCharacterId, string>> =
  import.meta.env.DEV
    ? {
        goelia: '/goelia-art-1.png',
        glynne: '/glynne-art-1.png',
        chihaya: '/chihaya-art-1.png',
        ney: '/ney-art-1.png',
        nightingale: '/nightingale-art-1.png',
        salvance: '/salvance-art-1.png'
      }
    : {}

export const silenceAngelCharacterSeeds: SilenceCharacterSeed[] = [
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
]
