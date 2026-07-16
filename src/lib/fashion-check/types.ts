export interface FashionCheckItem {
  itemId: number
  name: string
  iconId: number
  rarity: number
}

export type FashionCheckLocalizedNames = Partial<Record<'zh-CN' | 'en' | 'ja' | 'ko', string>>

export interface FashionCheckLocaleCatalog {
  items: Record<string, FashionCheckLocalizedNames>
  dyes: Record<string, FashionCheckLocalizedNames>
}

export interface FashionCheckDyeStep {
  slotId: string
  points: number
}

export interface FashionCheckSolutionItem {
  slotId: string
  itemId: number
  points: number
}

export interface FashionCheckReferenceEntry {
  slotId: string
  item?: FashionCheckItem
  iconId?: number
  label?: string
  labelKey?: string
  points?: number
  dye?: { dyeId?: number; name: string; points?: number }
}

export interface FashionCheckReferenceShowcase {
  globalIssue: number
  theme: string
  solutions: Array<{
    id: '80' | '100'
    score: number
    entries: FashionCheckReferenceEntry[]
  }>
  dyes: Array<{
    slotId: string
    family: { id?: 'black' | 'red'; name: string; color: string; points: 1 }
    exact: {
      dyeId?: number
      name: string
      color: string
      points: 2
      declaration: string
      declarationKey?: string
    }
  }>
}

export interface FashionCheckWeek {
  theme: string
  challengeWindow?: { startsAt: string; endsAt: string }
  referenceShowcase?: FashionCheckReferenceShowcase
  solutions: Array<{
    id: '80' | '100'
    score: number
    items: FashionCheckSolutionItem[]
    dyes?: FashionCheckDyeStep[]
  }>
  slots: Array<{
    slotId: string
    label: string
    tag: string
    gold: { points: number; items: FashionCheckItem[] }
  }>
}
