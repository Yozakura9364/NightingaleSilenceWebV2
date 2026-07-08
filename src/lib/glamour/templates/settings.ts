import { normalizeGlamourLocale } from '@/lib/glamour/equipment'
import type { GlamourDraft, GlamourDraftSource, GlamourLocale } from '@/lib/glamour/types'
import {
  GLAMOUR_TEMPLATE_DEFINITIONS,
  GLAMOUR_TEMPLATE_DEFAULT_ID,
  GLAMOUR_TEMPLATE_SELECT_ORDER,
  getGlamourTemplateDefinition,
  normalizeGlamourTemplateId,
  type GlamourTemplateDefinition,
  type GlamourTemplateId
} from '@/lib/glamour/templates/definitions'
import { getGlamourTemplateRenderProfile } from '@/lib/glamour/templates/renderProfiles'

export const GLAMOUR_TEMPLATE_SETTINGS_STORAGE_KEY = 'nsglamour.templateWorkspaceSettings'
export const GLAMOUR_TEMPLATE_SETTINGS_VERSION = 3

export interface GlamourTemplateSettings {
  templateId: GlamourTemplateId
  topText: string
  characterName: string
  bottomText: string
  ecSubtitleText: string
  ecSubtitleLeftText: string
  ecSubtitleSymbolText: string
  ecSubtitleRightText: string
  ecSubtitleTouched: boolean
  ecSubtitleAutoText: string
  importedTitleAutoText: string
  aspect: '1:1'
  infoWidth: number
  padding: number
  nameSize: number
  dyeSize: number
  showIcons: boolean
  dyeFrameMode: 'psd' | 'color'
  locales: GlamourLocale[]
  textColor: string
  panelColor: string
  storySwatchColors: string[]
}

export interface GlamourTemplateWorkspaceSettings {
  version: typeof GLAMOUR_TEMPLATE_SETTINGS_VERSION
  templateId: GlamourTemplateId
  templates: Record<GlamourTemplateId, GlamourTemplateSettings>
}

const DEFAULT_STORY_SWATCH_COLORS = ['#40417a', '#eeeeee', '#968169']
const EC_TEMPLATE_SUBTITLE_SYMBOLS = ['♦', '◆', '·', '・', '|', '/', '-']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeText(value: unknown, fallback = ''): string {
  return String(value ?? fallback).slice(0, 120)
}

function normalizeSubtitleText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

function normalizeSubtitlePart(value: unknown, maxLength = 80): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function normalizeSubtitleSymbol(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 4)
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim()
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback
}

function normalizeTemplateAspect(value: unknown): '1:1' {
  return value === '1:1' ? '1:1' : '1:1'
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? Math.max(min, Math.min(numberValue, max)) : fallback
}

function getDefaultTopText(template: GlamourTemplateDefinition): string {
  return getGlamourTemplateRenderProfile(template.renderMode).defaultTopText
}

function getSubtitlePartsFromSettings(settings: GlamourTemplateSettings) {
  const left = normalizeSubtitlePart(settings.ecSubtitleLeftText)
  const symbol = normalizeSubtitleSymbol(settings.ecSubtitleSymbolText)
  const right = normalizeSubtitlePart(settings.ecSubtitleRightText)

  if (left || symbol || right || settings.ecSubtitleTouched) {
    return { left, symbol, right }
  }

  const configured = normalizeSubtitleText(settings.ecSubtitleText)
  return configured ? splitGlamourTemplateSubtitleText(configured) || { full: configured } : null
}

function getSubtitleTextFromSettings(settings: GlamourTemplateSettings): string {
  return formatGlamourTemplateSubtitleParts(getSubtitlePartsFromSettings(settings))
}

export function getGlamourTemplateSubtitleParts(settings: GlamourTemplateSettings) {
  const parts = getSubtitlePartsFromSettings(settings)

  if (!parts) {
    return null
  }

  return { ...parts }
}

export function getGlamourTemplateSubtitleText(settings: GlamourTemplateSettings): string {
  return getSubtitleTextFromSettings(settings)
}

function getImportedTitleText(source: GlamourDraftSource): string {
  if (source.importMode !== 'template-link') {
    return ''
  }

  const title = normalizeSubtitleText(source.title || source.name).slice(0, 80)

  if (!title || /^https?:\/\//i.test(title)) {
    return ''
  }

  if (['幻化站导入', '手动编辑', '第一页导入'].includes(title)) {
    return ''
  }

  return title
}

function clearNonLinkImportedTitle(
  settings: GlamourTemplateSettings,
  template: GlamourTemplateDefinition,
  source: GlamourDraftSource
): GlamourTemplateSettings {
  if (source.importMode === 'template-link') {
    return settings
  }

  const currentText = String(settings.topText || '').trim()
  const autoText = String(settings.importedTitleAutoText || '').trim()

  if (!autoText || currentText !== autoText) {
    return settings
  }

  return normalizeGlamourTemplateSettings(
    {
      ...settings,
      topText: getDefaultTopText(template),
      importedTitleAutoText: ''
    },
    template.id
  )
}

function shouldApplyImportedTitle(
  settings: GlamourTemplateSettings,
  template: GlamourTemplateDefinition,
  force: boolean
): boolean {
  if (force) {
    return true
  }

  const currentText = String(settings.topText || '').trim()
  const autoText = String(settings.importedTitleAutoText || '').trim()
  return Boolean(autoText && currentText === autoText) || currentText === getDefaultTopText(template)
}

function getImportedAuthorParts(source: GlamourDraftSource) {
  const name = normalizeSubtitlePart(source.authorName)
  const world = normalizeSubtitlePart(source.authorWorld)

  if (name || world) {
    return { left: name, symbol: '♦', right: world }
  }

  const label = normalizeSubtitleText(source.authorLabel)
  return label ? splitGlamourTemplateSubtitleText(label) || { full: label } : null
}

function getDefaultLocaleList(template: GlamourTemplateDefinition): GlamourLocale[] {
  const languageOption = template.languageOptions?.[0]

  if (languageOption?.locales.length) {
    return [...languageOption.locales]
  }

  return [template.defaultLocale]
}

function resetLegacySubtitleSettings(settings: GlamourTemplateSettings): GlamourTemplateSettings {
  return {
    ...settings,
    ecSubtitleText: '',
    ecSubtitleLeftText: '',
    ecSubtitleSymbolText: '♦',
    ecSubtitleRightText: '',
    ecSubtitleTouched: false,
    ecSubtitleAutoText: ''
  }
}

export function normalizeGlamourTemplateLocales(
  locales: unknown,
  template: GlamourTemplateDefinition,
  fallbackLocales: GlamourLocale[] = getDefaultLocaleList(template)
): GlamourLocale[] {
  const source = Array.isArray(locales) ? locales : []
  const supported = new Set(template.localeOrder.map(normalizeGlamourLocale))
  const normalized = source
    .map((locale) => normalizeGlamourLocale(String(locale || '')))
    .filter((locale) => supported.has(locale))

  if (normalized.length) {
    return Array.from(new Set(normalized)).slice(0, Math.max(1, template.localeOrder.length))
  }

  const fallback = fallbackLocales.filter((locale) => supported.has(normalizeGlamourLocale(locale)))
  const normalizedFallback = fallback.map((locale) => normalizeGlamourLocale(locale))
  return Array.from(new Set(normalizedFallback)).slice(0, Math.max(1, template.localeOrder.length))
}

export function formatGlamourTemplateSubtitleParts(
  parts: { full?: string; left?: string; symbol?: string; right?: string } | null
): string {
  if (!parts) {
    return ''
  }

  if (parts.full) {
    return normalizeSubtitleText(parts.full)
  }

  const left = normalizeSubtitlePart(parts.left)
  const symbol = normalizeSubtitleSymbol(parts.symbol)
  const right = normalizeSubtitlePart(parts.right)

  if (left && right && symbol) {
    return `${left} ${symbol} ${right}`
  }

  return [left, right].filter(Boolean).join(' ')
}

export function splitGlamourTemplateSubtitleText(text: string) {
  const rawSource = String(text || '').trim()
  const source = normalizeSubtitleText(rawSource)

  if (!source) {
    return null
  }

  let best: { symbol: string; index: number } | null = null
  for (const symbol of EC_TEMPLATE_SUBTITLE_SYMBOLS) {
    const index = source.indexOf(symbol)
    if (index >= 0 && (!best || index < best.index)) {
      best = { symbol, index }
    }
  }

  if (!best) {
    const wideGapMatch = rawSource.match(/^(.+?)\s{2,}(.+)$/)
    return wideGapMatch
      ? {
          left: normalizeSubtitlePart(wideGapMatch[1]),
          symbol: '♦',
          right: normalizeSubtitlePart(wideGapMatch[2])
        }
      : { full: source }
  }

  const left = source.slice(0, best.index).trim()
  const right = source.slice(best.index + best.symbol.length).trim()

  if (!left || !right) {
    return { full: source }
  }

  return { left, symbol: best.symbol, right }
}

export function applyGlamourTemplateImportedSource(
  settings: GlamourTemplateSettings,
  template: GlamourTemplateDefinition,
  draft: GlamourDraft,
  options: { force?: boolean } = {}
): GlamourTemplateSettings {
  const titleSettings = applyGlamourTemplateImportedTitle(settings, template, draft, options)
  const force = options.force === true
  const patch: Partial<GlamourTemplateSettings> = {}

  const authorParts = getImportedAuthorParts(draft.source)
  const importedAuthorText = formatGlamourTemplateSubtitleParts(authorParts)

  if (importedAuthorText && template.controls.ecSubtitle === true) {
    const shouldUpdate =
      force ||
      !titleSettings.ecSubtitleTouched ||
      getSubtitleTextFromSettings(titleSettings) === titleSettings.ecSubtitleAutoText

    if (shouldUpdate) {
      patch.ecSubtitleLeftText = authorParts?.full
        ? normalizeSubtitlePart(authorParts.full)
        : normalizeSubtitlePart(authorParts?.left)
      patch.ecSubtitleSymbolText = authorParts?.full
        ? ''
        : normalizeSubtitleSymbol(authorParts?.symbol || '♦')
      patch.ecSubtitleRightText = authorParts?.full
        ? ''
        : normalizeSubtitlePart(authorParts?.right)
      patch.ecSubtitleText = importedAuthorText
      patch.ecSubtitleAutoText = importedAuthorText
      patch.ecSubtitleTouched = false
    }
  }

  if (importedAuthorText && template.controls.characterName === true) {
    const shouldUpdate =
      force || !titleSettings.characterName || titleSettings.characterName === titleSettings.ecSubtitleAutoText

    if (shouldUpdate) {
      patch.characterName = importedAuthorText.slice(0, 80)
      patch.ecSubtitleAutoText = importedAuthorText
    }
  }

  return Object.keys(patch).length
    ? normalizeGlamourTemplateSettings({ ...titleSettings, ...patch }, template.id)
    : titleSettings
}

export function applyGlamourTemplateImportedTitle(
  settings: GlamourTemplateSettings,
  template: GlamourTemplateDefinition,
  draft: GlamourDraft,
  options: { force?: boolean } = {}
): GlamourTemplateSettings {
  const force = options.force === true
  const titleSettings = clearNonLinkImportedTitle(settings, template, draft.source)
  const importedTitle = getImportedTitleText(draft.source)

  if (!importedTitle || !shouldApplyImportedTitle(titleSettings, template, force)) {
    return titleSettings
  }

  return normalizeGlamourTemplateSettings(
    {
      ...titleSettings,
      topText: importedTitle,
      importedTitleAutoText: importedTitle
    },
    template.id
  )
}

export function getDefaultGlamourTemplateSettings(templateId = GLAMOUR_TEMPLATE_DEFAULT_ID): GlamourTemplateSettings {
  const template = getGlamourTemplateDefinition(templateId)

  return {
    templateId: template.id,
    topText: getDefaultTopText(template),
    characterName: '',
    bottomText: 'NSGlamour',
    ecSubtitleText: '',
    ecSubtitleLeftText: '',
    ecSubtitleSymbolText: '♦',
    ecSubtitleRightText: '',
    ecSubtitleTouched: false,
    ecSubtitleAutoText: '',
    importedTitleAutoText: '',
    aspect: '1:1',
    infoWidth: 0,
    padding: 28,
    nameSize: 24,
    dyeSize: 15,
    showIcons: true,
    dyeFrameMode: 'psd',
    locales: getDefaultLocaleList(template),
    textColor: '#1c2130',
    panelColor: '#ffffff',
    storySwatchColors: [...DEFAULT_STORY_SWATCH_COLORS]
  }
}

export function normalizeGlamourTemplateSettings(
  value: unknown,
  templateId = GLAMOUR_TEMPLATE_DEFAULT_ID
): GlamourTemplateSettings {
  const normalizedTemplateId = normalizeGlamourTemplateId(templateId)
  const template = getGlamourTemplateDefinition(normalizedTemplateId)
  const defaults = getDefaultGlamourTemplateSettings(normalizedTemplateId)
  const source = isRecord(value) ? value : {}
  const legacySubtitleText = normalizeText(source.ecSubtitleText, '')
  const legacySubtitleParts = splitGlamourTemplateSubtitleText(legacySubtitleText)
  const legacySubtitleHasParts = Boolean(legacySubtitleParts && !legacySubtitleParts.full)
  const hasStoredSubtitleSymbol = Object.prototype.hasOwnProperty.call(source, 'ecSubtitleSymbolText')
  const swatches = Array.isArray(source.storySwatchColors)
    ? source.storySwatchColors.map((color) => normalizeHexColor(color, '')).filter(Boolean)
    : []

  return {
    ...defaults,
    templateId: normalizedTemplateId,
    topText: normalizeText(source.topText, defaults.topText).slice(0, 80),
    characterName: normalizeText(source.characterName, '').slice(0, 80),
    bottomText: normalizeText(source.bottomText, defaults.bottomText).slice(0, 80),
    ecSubtitleText: legacySubtitleText,
    ecSubtitleLeftText: normalizeText(
      source.ecSubtitleLeftText,
      legacySubtitleHasParts ? legacySubtitleParts?.left || '' : legacySubtitleText
    ).slice(0, 80),
    ecSubtitleSymbolText: normalizeText(
      hasStoredSubtitleSymbol ? source.ecSubtitleSymbolText : undefined,
      legacySubtitleHasParts ? legacySubtitleParts?.symbol || defaults.ecSubtitleSymbolText : defaults.ecSubtitleSymbolText
    ).slice(0, 4),
    ecSubtitleRightText: normalizeText(
      source.ecSubtitleRightText,
      legacySubtitleHasParts ? legacySubtitleParts?.right || '' : ''
    ).slice(0, 80),
    ecSubtitleTouched: source.ecSubtitleTouched === true,
    ecSubtitleAutoText: normalizeText(source.ecSubtitleAutoText, ''),
    importedTitleAutoText: normalizeText(source.importedTitleAutoText, '').slice(0, 80),
    aspect: normalizeTemplateAspect(source.aspect ?? defaults.aspect),
    infoWidth: 0,
    padding: clampNumber(source.padding, 12, 80, defaults.padding),
    nameSize: clampNumber(source.nameSize, 14, 48, defaults.nameSize),
    dyeSize: clampNumber(source.dyeSize, 10, 32, defaults.dyeSize),
    showIcons: typeof source.showIcons === 'boolean' ? source.showIcons : defaults.showIcons,
    dyeFrameMode: source.dyeFrameMode === 'color' ? 'color' : 'psd',
    locales: normalizeGlamourTemplateLocales(source.locales, template),
    textColor: normalizeHexColor(source.textColor, defaults.textColor),
    panelColor: normalizeHexColor(source.panelColor, defaults.panelColor),
    storySwatchColors: swatches.length ? swatches.slice(0, 3) : defaults.storySwatchColors
  }
}

export function normalizeGlamourTemplateWorkspaceSettings(
  value: unknown
): GlamourTemplateWorkspaceSettings {
  const source = isRecord(value) ? value : {}
  const shouldResetLegacyTemplateSubtitles = Number(source.version || 0) < GLAMOUR_TEMPLATE_SETTINGS_VERSION
  const templateId = normalizeGlamourTemplateId(String(source.templateId || ''))
  const rawTemplates = isRecord(source.templates) ? source.templates : {}
  const templates = Object.fromEntries(
    GLAMOUR_TEMPLATE_SELECT_ORDER.map((id) => {
      const rawTemplateSettings = isRecord(rawTemplates[id]) ? rawTemplates[id] : {}
      const legacyFlatSettings = Object.keys(rawTemplates).length || id !== templateId ? {} : source
      const template = getGlamourTemplateDefinition(id)
      const settings = normalizeGlamourTemplateSettings(
        {
          ...legacyFlatSettings,
          ...rawTemplateSettings,
          templateId: id
        },
        id
      )

      return [
        id,
        shouldResetLegacyTemplateSubtitles && template.controls.ecSubtitle === true
          ? resetLegacySubtitleSettings(settings)
          : settings
      ]
    })
  ) as Record<GlamourTemplateId, GlamourTemplateSettings>

  return {
    version: GLAMOUR_TEMPLATE_SETTINGS_VERSION,
    templateId,
    templates
  }
}

export function createDefaultGlamourTemplateWorkspaceSettings(): GlamourTemplateWorkspaceSettings {
  return normalizeGlamourTemplateWorkspaceSettings({
    version: GLAMOUR_TEMPLATE_SETTINGS_VERSION,
    templateId: GLAMOUR_TEMPLATE_DEFAULT_ID,
    templates: GLAMOUR_TEMPLATE_DEFINITIONS
  })
}
