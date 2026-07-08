import type { GlamourDraft, GlamourLocale } from '@/lib/glamour/types'
import {
  getGlamourTemplateDefinition,
  type GlamourTemplateDefinition,
  type GlamourTemplateId,
  type GlamourTemplateImageSlot
} from '@/lib/glamour/templates/definitions'
import {
  getGlamourTemplateSubtitleParts,
  getGlamourTemplateSubtitleText,
  type GlamourTemplateSettings
} from '@/lib/glamour/templates/settings'
import { createGlamourTemplateRows, type GlamourTemplateRow } from '@/lib/glamour/templates/rows'
import {
  getGlamourTemplateRenderProfile,
  type GlamourTemplateRenderAsset,
  type GlamourTemplateRenderProfile
} from '@/lib/glamour/templates/renderProfiles'
import { GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES } from '@/lib/glamour/templates/imageSlots'

export interface GlamourTemplateRenderText {
  title: string
  characterName: string
  subtitle: string
  subtitleParts: { full?: string; left?: string; symbol?: string; right?: string } | null
  bottomText: string
}

export interface GlamourTemplateRenderStyle {
  textColor: string
  panelColor: string
  padding: number
  nameSize: number
  dyeSize: number
  showIcons: boolean
  dyeFrameMode: 'psd' | 'color'
  storySwatchColors: string[]
}

export interface GlamourTemplateLocalizedRows {
  locale: GlamourLocale
  rows: GlamourTemplateRow[]
}

export interface GlamourTemplateRenderCanvas {
  width: number
  height: number
  aspectRatio: number
  imageSlots: GlamourTemplateImageSlot[]
  imageSlotAliases: Record<string, string[]>
}

export interface GlamourTemplateRenderData {
  template: GlamourTemplateDefinition
  templateId: GlamourTemplateId
  profile: GlamourTemplateRenderProfile
  requiredAssets: GlamourTemplateRenderAsset[]
  canvas: GlamourTemplateRenderCanvas
  locale: GlamourLocale
  locales: GlamourLocale[]
  rows: GlamourTemplateRow[]
  localizedRows: GlamourTemplateLocalizedRows[]
  text: GlamourTemplateRenderText
  style: GlamourTemplateRenderStyle
}

function normalizeRenderLocales(
  locales: GlamourLocale[],
  template: GlamourTemplateDefinition,
  fallback: GlamourLocale
): GlamourLocale[] {
  const supported = new Set(template.localeOrder)
  const normalized = locales.filter((locale) => supported.has(locale))

  if (normalized.length) {
    return Array.from(new Set(normalized))
  }

  return supported.has(fallback) ? [fallback] : [template.defaultLocale]
}

function cloneImageSlot(slot: GlamourTemplateImageSlot): GlamourTemplateImageSlot {
  return {
    ...slot,
    region: { ...slot.region },
    uploadRegion: slot.uploadRegion ? { ...slot.uploadRegion } : undefined,
    dropRegion: slot.dropRegion ? { ...slot.dropRegion } : undefined
  }
}

function cloneImageSlotAliases(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES).map(([slotId, aliases]) => [slotId, [...aliases]])
  )
}

export function createGlamourTemplateRenderData(
  draft: GlamourDraft,
  settings: GlamourTemplateSettings,
  options: {
    template?: GlamourTemplateDefinition | string
    locale?: GlamourLocale
    locales?: GlamourLocale[]
  } = {}
): GlamourTemplateRenderData {
  const template =
    typeof options.template === 'string' || !options.template
      ? getGlamourTemplateDefinition(options.template || settings.templateId)
      : options.template
  const locales = normalizeRenderLocales(
    options.locales?.length ? options.locales : settings.locales,
    template,
    options.locale || draft.locale
  )
  const locale = locales.includes(options.locale || draft.locale)
    ? (options.locale || draft.locale)
    : locales[0] || template.defaultLocale
  const profile = getGlamourTemplateRenderProfile(template.renderMode)
  const rows = createGlamourTemplateRows(draft, { template, locale, locales })

  return {
    template,
    templateId: template.id,
    profile,
    requiredAssets: [...profile.assets],
    canvas: {
      width: template.sourceWidth,
      height: template.sourceHeight,
      aspectRatio: template.sourceWidth / template.sourceHeight,
      imageSlots: template.imageSlots.map(cloneImageSlot),
      imageSlotAliases: cloneImageSlotAliases()
    },
    locale,
    locales,
    rows,
    localizedRows: locales.map((rowLocale) => ({
      locale: rowLocale,
      rows: createGlamourTemplateRows(draft, {
        template,
        locale: rowLocale,
        locales
      })
    })),
    text: {
      title: settings.topText,
      characterName: settings.characterName,
      subtitle: getGlamourTemplateSubtitleText(settings),
      subtitleParts: getGlamourTemplateSubtitleParts(settings),
      bottomText: settings.bottomText
    },
    style: {
      textColor: settings.textColor,
      panelColor: settings.panelColor,
      padding: settings.padding,
      nameSize: settings.nameSize,
      dyeSize: settings.dyeSize,
      showIcons: settings.showIcons || profile.forceIcons,
      dyeFrameMode: settings.dyeFrameMode,
      storySwatchColors: [...settings.storySwatchColors]
    }
  }
}
