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
        goelia: '/local-assets/goelia-art-1.png',
        glynne: '/local-assets/glynne-art-1.png',
        chihaya: '/local-assets/chihaya-art-1.png',
        ney: '/local-assets/ney-art-1.png',
        nightingale: '/local-assets/nightingale-art-1.png',
        salvance: '/local-assets/salvance-art-1.png'
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
