export type SilenceGlitchMemberId = 'yoin' | 'yoine'

export interface SilenceGlitchDuoMember {
  id: SilenceGlitchMemberId
  name: string
  reading: string
  romanization: string
  color: string
  signal: string
}

export interface SilenceGlitchConceptNote {
  id: string
  label: string
  value: string
}

export const silenceGlitchDuoMembers: SilenceGlitchDuoMember[] = [
  {
    id: 'yoin',
    name: 'ヨイン',
    reading: 'Yoin',
    romanization: 'Yoin',
    color: '#77fff4',
    signal: '显示器里的残响'
  },
  {
    id: 'yoine',
    name: '宵音',
    reading: 'よいね / Yoine',
    romanization: 'Yoine',
    color: '#ff72bd',
    signal: '屏幕里的声音'
  }
]

export const silenceGlitchConceptNotes: SilenceGlitchConceptNote[] = [
  {
    id: 'layer',
    label: '所在层',
    value: '电脑屏幕 / 电脑内容 / 电子元器件之间'
  },
  {
    id: 'state',
    label: '状态',
    value: '卡在显示器和画面内容中间'
  },
  {
    id: 'effect',
    label: '可见效果',
    value: '可以篡改屏幕外的人看到的东西'
  }
]
