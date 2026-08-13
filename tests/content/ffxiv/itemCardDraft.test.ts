import { describe, expect, it } from 'vitest'
import { createEmptyGlamourDraft, moveGlamourDraftEntry } from '@/pages/item-card/lib/draft'
import type { GlamourDraft, GlamourEquipmentEntry } from '@/pages/item-card/lib/types'

function makeEntry(rowId: string): GlamourEquipmentEntry {
  return {
    slot: 'Item',
    cardRowId: rowId,
    candidates: [{ key: rowId, name: rowId }],
    __emptySlot: false
  }
}

function makeDraft(): GlamourDraft {
  return {
    ...createEmptyGlamourDraft(),
    entries: [makeEntry('a'), makeEntry('b'), makeEntry('c')]
  }
}

describe('item card draft entry order', () => {
  it('moves an entry after a later target without mutating the source draft', () => {
    const draft = makeDraft()
    const moved = moveGlamourDraftEntry(draft, 'a', 'c', 'after')

    expect(moved.entries.map((entry) => entry.cardRowId)).toEqual(['b', 'c', 'a'])
    expect(draft.entries.map((entry) => entry.cardRowId)).toEqual(['a', 'b', 'c'])
  })

  it('moves an entry before an earlier target', () => {
    const moved = moveGlamourDraftEntry(makeDraft(), 'c', 'a', 'before')

    expect(moved.entries.map((entry) => entry.cardRowId)).toEqual(['c', 'a', 'b'])
  })

  it('returns the original draft for missing or self targets', () => {
    const draft = makeDraft()

    expect(moveGlamourDraftEntry(draft, 'missing', 'b', 'before')).toBe(draft)
    expect(moveGlamourDraftEntry(draft, 'a', 'missing', 'before')).toBe(draft)
    expect(moveGlamourDraftEntry(draft, 'a', 'a', 'after')).toBe(draft)
  })
})
