export interface FashionCheckItem {
  itemId: number
  name: string
  iconId: number
  rarity: number
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
  points?: number
  dye?: { name: string; points?: number }
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
    family: { name: string; color: string; points: 1 }
    exact: { name: string; color: string; points: 2; declaration: string }
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
