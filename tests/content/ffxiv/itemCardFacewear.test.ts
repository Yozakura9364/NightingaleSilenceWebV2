import { describe, expect, it } from 'vitest'
import { shouldRenderItemCardDyeDetails } from '@/pages/item-card/lib/equipment'

describe('item card facewear', () => {
  it('does not render dye details for the Glasses catalog slot', () => {
    expect(shouldRenderItemCardDyeDetails('Glasses')).toBe(false)
    expect(shouldRenderItemCardDyeDetails('FashionAccessory')).toBe(true)
    expect(shouldRenderItemCardDyeDetails('HeadGear')).toBe(true)
  })
})
