import { describe, expect, it } from 'vitest'
import { getGlamourTemplateDefinition } from '@/lib/glamour/templates/definitions'
import {
  GLAMOUR_TEMPLATE_SETTINGS_VERSION,
  normalizeGlamourTemplateDyeLocales,
  normalizeGlamourTemplateItemLocales,
  normalizeGlamourTemplateOutputLanguageMode,
  normalizeGlamourTemplateWorkspaceSettings
} from '@/lib/glamour/templates/settings'
import { mergeGlamourTemplateDyes } from '@/lib/glamour/templates/rows'

describe('NSGlamour template custom languages', () => {
  it('keeps Chinese-only templates in single-language mode', () => {
    const template = getGlamourTemplateDefinition('eorzea')

    expect(normalizeGlamourTemplateOutputLanguageMode('custom', template, ['zh', 'tc'])).toBe(
      'single'
    )
    expect(normalizeGlamourTemplateItemLocales(['zh', 'tc'], template, 'custom')).toEqual(['zh'])
    expect(normalizeGlamourTemplateDyeLocales(['zh', 'tc'], template, 'custom')).toEqual(['zh'])
  })

  it('fills a distinct second equipment language in custom mode', () => {
    const template = getGlamourTemplateDefinition('horizontal')

    expect(normalizeGlamourTemplateItemLocales(['zh'], template, 'custom')).toEqual(['zh', 'en'])
    expect(normalizeGlamourTemplateItemLocales(['en'], template, 'custom')).toEqual(['en', 'ja'])
  })

  it('allows all seven output locales in Silence custom mode', () => {
    const template = getGlamourTemplateDefinition('silence-fashion')

    expect(template.localeOrder).toEqual(['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko'])
    expect(normalizeGlamourTemplateItemLocales(['fr', 'de'], template, 'custom')).toEqual([
      'fr',
      'de'
    ])
  })

  it('allows one or two dye languages and removes duplicates', () => {
    const template = getGlamourTemplateDefinition('risingstones')

    expect(normalizeGlamourTemplateDyeLocales(['zh'], template, 'custom')).toEqual(['zh'])
    expect(normalizeGlamourTemplateDyeLocales(['zh', 'en', 'zh'], template, 'custom')).toEqual([
      'zh',
      'en'
    ])
  })

  it('migrates the legacy Silence en-ja preset to custom mode', () => {
    const settings = normalizeGlamourTemplateWorkspaceSettings({
      version: 3,
      templateId: 'silence-fashion',
      templates: {
        'silence-fashion': { locales: ['en', 'ja'] }
      }
    })

    expect(settings.version).toBe(GLAMOUR_TEMPLATE_SETTINGS_VERSION)
    expect(settings.templates['silence-fashion'].outputLanguageMode).toBe('custom')
    expect(settings.templates['silence-fashion'].locales).toEqual(['ja', 'en'])
    expect(settings.templates['silence-fashion'].dyeLocales).toEqual(['en'])
  })

  it('merges localized dye names per slot without duplicating the swatch', () => {
    const merged = mergeGlamourTemplateDyes([
      [{ id: 1, name: '煤玉黑', hex: '#111111', isEmpty: false }],
      [{ id: 1, name: 'Jet Black', hex: '#111111', isEmpty: false }],
      [{ id: 1, name: 'Jet Black', hex: '#111111', isEmpty: false }]
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ id: 1, name: '煤玉黑 Jet Black', hex: '#111111' })
  })
})
