import { describe, expect, it } from 'vitest'

import {
  getOsShellToolPresentation,
  osShellDesktopPresentation,
  osShellPrimaryPresentations
} from '@/pages/style-lab/osShellPresentation'

describe('OS shell prototype presentation', () => {
  it('uses the site identity for the prototype desktop', () => {
    expect(osShellDesktopPresentation).toMatchObject({
      id: 'home',
      route: '/'
    })
  })

  it('exposes the FFXIV workshop and About as routed desktop entries', () => {
    expect(osShellPrimaryPresentations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ffxiv', route: '/ffxiv' }),
        expect.objectContaining({ id: 'about', route: '/about' })
      ])
    )
  })

  it('maps the commissioned tool icons to their localized titles', () => {
    expect(getOsShellToolPresentation('glamour')).toMatchObject({
      id: 'glamour',
      titleKey: 'ffxiv.tool.glamour.title',
      route: '/ffxiv/glamour'
    })
    expect(getOsShellToolPresentation('fashionCheck')).toMatchObject({
      id: 'fashionCheck',
      titleKey: 'ffxiv.tool.fashionCheck.title'
    })
  })

  it('does not invent a prototype application for an unknown tool', () => {
    expect(getOsShellToolPresentation('unknown')).toBeUndefined()
  })
})
