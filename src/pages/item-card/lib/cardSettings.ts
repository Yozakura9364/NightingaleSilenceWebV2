import type {
  GlamourLocale,
  ItemCardLocaleStyle,
  ItemCardRenderSettings,
  ItemCardStoredSettings
} from '@/pages/item-card/lib/types'

export const ITEM_CARD_SETTINGS_KEY = 'nsitemcard.pngSettings.v1'
export const ITEM_CARD_DEFAULT_FONT = 'HarmonyOS Sans SC'

const DEFAULT_LOCALE_STYLE: ItemCardLocaleStyle = {
  fontFamily: ITEM_CARD_DEFAULT_FONT,
  titleSize: 25,
  titleWeight: 800,
  dyeSize: 16
}

export const DEFAULT_ITEM_CARD_SETTINGS: ItemCardRenderSettings = {
  mode: 'full',
  outputLocales: ['zh'],
  localeStyles: { zh: { ...DEFAULT_LOCALE_STYLE } },
  titleOffsetX: 12,
  titleOffsetY: 3,
  dyeOffsetX: 12,
  dyeOffsetY: 52,
  fontColor: '#ffffff',
  rarityColorEnabled: false,
  strokeEnabled: true,
  strokeRatio: 0.2,
  strokeColor: '#000000'
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback
}

function normalizeColor(value: unknown, fallback: string): string {
  const text = String(value || '').trim()
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback
}

function normalizeLocaleStyle(value: unknown): ItemCardLocaleStyle {
  const input =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<ItemCardLocaleStyle>)
      : {}

  return {
    fontFamily: String(input.fontFamily || ITEM_CARD_DEFAULT_FONT).trim() || ITEM_CARD_DEFAULT_FONT,
    titleSize: clamp(input.titleSize, 8, 64, DEFAULT_LOCALE_STYLE.titleSize),
    titleWeight: clamp(input.titleWeight, 100, 900, DEFAULT_LOCALE_STYLE.titleWeight),
    dyeSize: clamp(input.dyeSize, 8, 48, DEFAULT_LOCALE_STYLE.dyeSize)
  }
}

export function getItemCardLocaleStyle(
  settings: ItemCardRenderSettings,
  locale: GlamourLocale
): ItemCardLocaleStyle {
  return normalizeLocaleStyle(settings.localeStyles[locale])
}

export function normalizeItemCardSettings(value: unknown): ItemCardStoredSettings {
  const stored =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<ItemCardStoredSettings>)
      : {}
  const input = (stored.render || {}) as Partial<ItemCardRenderSettings>
  const outputLocales = Array.from(
    new Set(
      (Array.isArray(input.outputLocales) ? input.outputLocales : ['zh'])
        .map((locale) => String(locale || '').trim())
        .filter(Boolean)
    )
  ).slice(0, 7)
  const locales = outputLocales.length ? outputLocales : ['zh']
  const localeStyles = Object.fromEntries(
    locales.map((locale) => [locale, normalizeLocaleStyle(input.localeStyles?.[locale])])
  )
  const layouts = Object.fromEntries(
    Object.entries(stored.layouts || {}).map(([slot, layout]) => [
      slot,
      layout === 'right' ? 'right' : 'left'
    ])
  ) as ItemCardStoredSettings['layouts']

  return {
    version: 1,
    render: {
      mode: input.mode === 'compact' ? 'compact' : 'full',
      outputLocales: locales,
      localeStyles,
      titleOffsetX: clamp(input.titleOffsetX, -560, 560, 12),
      titleOffsetY: clamp(input.titleOffsetY, -108, 108, 3),
      dyeOffsetX: clamp(input.dyeOffsetX, -560, 560, 12),
      dyeOffsetY: clamp(input.dyeOffsetY, -108, 108, 52),
      fontColor: normalizeColor(input.fontColor, '#ffffff'),
      rarityColorEnabled: input.rarityColorEnabled === true,
      strokeEnabled: input.strokeEnabled !== false,
      strokeRatio: clamp(input.strokeRatio, 0, 1, 0.2),
      strokeColor: normalizeColor(input.strokeColor, '#000000')
    },
    layouts,
    listLayout: stored.listLayout === 'right' ? 'right' : 'left'
  }
}

export function readItemCardSettings(): ItemCardStoredSettings {
  try {
    const raw = localStorage.getItem(ITEM_CARD_SETTINGS_KEY)
    return normalizeItemCardSettings(raw ? JSON.parse(raw) : undefined)
  } catch {
    return normalizeItemCardSettings(undefined)
  }
}

export function writeItemCardSettings(settings: ItemCardStoredSettings) {
  localStorage.setItem(ITEM_CARD_SETTINGS_KEY, JSON.stringify(settings))
}
