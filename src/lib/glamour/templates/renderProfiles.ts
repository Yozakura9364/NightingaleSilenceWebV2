import type { GlamourTemplateRenderMode } from '@/lib/glamour/templates/definitions'

export type GlamourTemplateRenderAsset =
  | 'figma-background'
  | 'horizontal-background'
  | 'double-pic-left-mask'
  | 'story-left-mask'
  | 'silence-fashion-background'
  | 'clear-dye-icon'

export interface GlamourTemplateRenderProfile {
  renderMode: GlamourTemplateRenderMode | 'default'
  defaultTopText: string
  legacyTopText?: string
  forceIcons: boolean
  assets: GlamourTemplateRenderAsset[]
}

export const GLAMOUR_TEMPLATE_DEFAULT_RENDER_PROFILE: GlamourTemplateRenderProfile = {
  renderMode: 'default',
  defaultTopText: '幻化存档',
  forceIcons: false,
  assets: []
}

export const GLAMOUR_TEMPLATE_RENDER_PROFILES: Record<GlamourTemplateRenderMode, GlamourTemplateRenderProfile> = {
  eorzea: {
    renderMode: 'eorzea',
    defaultTopText: '幻化存档',
    forceIcons: false,
    assets: ['figma-background', 'clear-dye-icon']
  },
  horizontal: {
    renderMode: 'horizontal',
    defaultTopText: 'EORZEA FASHION',
    legacyTopText: 'TITLE',
    forceIcons: false,
    assets: ['horizontal-background']
  },
  ec: {
    renderMode: 'ec',
    defaultTopText: 'EORZEA COLLECTION',
    legacyTopText: 'Nightingale - No Title',
    forceIcons: true,
    assets: ['clear-dye-icon']
  },
  'double-pic': {
    renderMode: 'double-pic',
    defaultTopText: '幻化存档',
    forceIcons: false,
    assets: ['double-pic-left-mask']
  },
  risingstones: {
    renderMode: 'risingstones',
    defaultTopText: '幻化存档',
    forceIcons: true,
    assets: ['clear-dye-icon']
  },
  'silence-fashion': {
    renderMode: 'silence-fashion',
    defaultTopText: 'FIRSTLOOK',
    forceIcons: true,
    assets: ['silence-fashion-background']
  }
}

export function getGlamourTemplateRenderProfile(
  renderMode: GlamourTemplateRenderMode | undefined
): GlamourTemplateRenderProfile {
  return renderMode ? GLAMOUR_TEMPLATE_RENDER_PROFILES[renderMode] : GLAMOUR_TEMPLATE_DEFAULT_RENDER_PROFILE
}
