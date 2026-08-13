import { describe, expect, it } from 'vitest'
import { formatWindowTitle } from '@/config/site'

describe('formatWindowTitle', () => {
  it('uses only the site name for the desktop', () => {
    expect(formatWindowTitle('夜莺不语')).toBe('夜莺不语')
  })

  it('places the site name before a localized page title', () => {
    expect(formatWindowTitle('夜莺不语', '幻化工房')).toBe('夜莺不语 - 幻化工房')
  })

  it('does not repeat the site name', () => {
    expect(formatWindowTitle('夜莺不语', '夜莺不语')).toBe('夜莺不语')
  })
})
