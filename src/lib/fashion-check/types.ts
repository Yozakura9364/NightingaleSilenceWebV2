export interface FashionCheckItem {
  itemId: number
  name: string
  iconId: number
  rarity: number
}

export type FashionCheckLocalizedNames = Partial<Record<'zh-CN' | 'en' | 'ja' | 'ko', string>>

export interface FashionCheckDyeItem {
  itemId: number
  iconId: number
  names: FashionCheckLocalizedNames
}

export interface FashionCheckLocaleCatalog {
  items: Record<string, FashionCheckLocalizedNames>
  dyes: Record<string, FashionCheckLocalizedNames>
  dyeItems?: Record<string, FashionCheckDyeItem>
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

export interface FashionCheckReferenceVariant {
  id: string
  label?: string
  labelKey?: string
  description?: string
  descriptionKey?: string
  entries: FashionCheckReferenceEntry[]
}

export interface FashionCheckReferenceSolution {
  id: '80' | '100'
  score: number
  entries?: FashionCheckReferenceEntry[]
  variants?: FashionCheckReferenceVariant[]
}

export type FashionCheckDyeFamilyId = 'black' | 'red' | 'brown' | 'green' | 'blue'

export interface FashionCheckReferenceShowcase {
  globalIssue: number
  theme: string
  dyeProvider?: string
  solutions: FashionCheckReferenceSolution[]
  dyes: Array<{
    slotId: string
    family: { id?: FashionCheckDyeFamilyId; name: string; color: string; points: 1 }
    exact: {
      dyeId?: number
      name: string
      color: string
      points: 2
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
