import type { GlamourLocale } from '@/lib/glamour/types'

export type GlamourTemplateId =
  | 'eorzea'
  | 'horizontal'
  | 'story'
  | 'risingstones'
  | 'ec'
  | 'silence-fashion'

export type GlamourTemplateRenderMode =
  | 'eorzea'
  | 'horizontal'
  | 'double-pic'
  | 'risingstones'
  | 'ec'
  | 'silence-fashion'

export interface GlamourTemplateRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GlamourTemplateImageSlot {
  id: string
  label: string
  uploadText: string
  region: GlamourTemplateRect
  uploadRegion?: GlamourTemplateRect
  dropRegion?: GlamourTemplateRect
  aspectRatio: number
}

export interface GlamourTemplateLanguageOption {
  id: string
  label: string
  locales: GlamourLocale[]
}

export interface GlamourTemplateControls {
  title: boolean
  characterName?: boolean
  ecSubtitle: boolean
  dyeFrame: boolean
  storySwatches?: boolean
}

export interface GlamourTemplateDyeFormat {
  mode: 'figma-chips' | 'text' | 'ec-chips' | 'inline-text' | 'risingstones-chips'
  includeAccessories: boolean
  showWhenDyeCountZero: boolean
  showEmptySlots: boolean
  maxSlots: number
  forceSlotCount?: number
  separator?: string
  stripDyeSuffix?: boolean
  reserveLineHeight?: boolean
}

export interface GlamourTemplateEquipmentFormat {
  source: 'default' | 'ec'
  maxRows?: number
  itemName: {
    wrap: boolean
    shrink: boolean
    shrinkOnOverflow?: boolean
    minScale?: number
    inlineDye?: boolean
  }
  dye: GlamourTemplateDyeFormat
}

export interface GlamourTemplateDefinition {
  id: GlamourTemplateId
  name: string
  shortName: string
  author: string
  authorUrl: string
  authorSns: Array<{ platform: string; url: string }>
  legacyPreviewPath: string
  summary: string
  sourceWidth: number
  sourceHeight: number
  renderMode: GlamourTemplateRenderMode
  defaultLocale: GlamourLocale
  localeOrder: GlamourLocale[]
  languageOptions?: GlamourTemplateLanguageOption[]
  controls: GlamourTemplateControls
  equipmentFormat: GlamourTemplateEquipmentFormat
  imageSlots: GlamourTemplateImageSlot[]
}

export const GLAMOUR_TEMPLATE_DEFAULT_ID: GlamourTemplateId = 'eorzea'
export const GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID = 'main'
export const GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID = 'risingstones-avatar'
export const GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID = 'silence-fashion-avatar'

export const GLAMOUR_TEMPLATE_SELECT_ORDER: GlamourTemplateId[] = [
  'eorzea',
  'horizontal',
  'story',
  'risingstones',
  'ec',
  'silence-fashion'
]

export const GLAMOUR_TEMPLATE_DEFINITIONS: Record<GlamourTemplateId, GlamourTemplateDefinition> = {
  eorzea: {
    id: 'eorzea',
    name: 'Eorzea Magazine',
    shortName: 'Magazine',
    author: 'Viioko',
    authorUrl: 'https://www.weibo.com/u/6351189531',
    authorSns: [{ platform: 'weibo', url: 'https://www.weibo.com/u/6351189531' }],
    legacyPreviewPath: '/template-preview/1-Eorzea Magazine/1-Preview.webp',
    summary: '杂志风中文模板，适合中文或繁中装备名。',
    sourceWidth: 3840,
    sourceHeight: 3840,
    renderMode: 'eorzea',
    defaultLocale: 'zh',
    localeOrder: ['zh', 'tc'],
    controls: { title: true, ecSubtitle: false, dyeFrame: true },
    equipmentFormat: {
      source: 'default',
      maxRows: 7,
      itemName: { wrap: false, shrink: false },
      dye: {
        mode: 'figma-chips',
        includeAccessories: false,
        showWhenDyeCountZero: true,
        showEmptySlots: true,
        maxSlots: 2,
        forceSlotCount: 2
      }
    },
    imageSlots: [
      {
        id: GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID,
        label: '图片1',
        uploadText: '上传图片',
        region: { x: -1, y: 0, width: 1893, height: 3840 },
        aspectRatio: 1893 / 3840
      }
    ]
  },
  horizontal: {
    id: 'horizontal',
    name: '横版艾欧泽亚杂志',
    shortName: '横版杂志',
    author: '夜莺不语',
    authorUrl: 'https://weibo.com/u/1734754935',
    authorSns: [
      { platform: 'weibo', url: 'https://weibo.com/u/1734754935' },
      { platform: 'xiaohongshu', url: 'https://www.xiaohongshu.com/user/profile/5e6c8c6e0000000001000724' },
      { platform: 'douyin', url: 'https://www.douyin.com/user/MS4wLjABAAAAtHfFkouTFs-quaZJ9EEgYjkWIa32xJSgiqNklbNuqQY' }
    ],
    legacyPreviewPath: '/template-preview/4-Horizontal Eorzea Magazine/4-Preview.webp',
    summary: '横版杂志模板，适合中文或繁中装备列表。',
    sourceWidth: 4846,
    sourceHeight: 3635,
    renderMode: 'horizontal',
    defaultLocale: 'zh',
    localeOrder: ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko'],
    controls: { title: true, ecSubtitle: false, dyeFrame: false },
    equipmentFormat: {
      source: 'default',
      maxRows: 8,
      itemName: { wrap: true, shrink: false, shrinkOnOverflow: true, minScale: 0.72 },
      dye: {
        mode: 'text',
        includeAccessories: false,
        showWhenDyeCountZero: true,
        showEmptySlots: true,
        maxSlots: 2,
        separator: ' / ',
        reserveLineHeight: true
      }
    },
    imageSlots: [
      {
        id: 'horizontal-left',
        label: '图片1',
        uploadText: '上传图片',
        region: { x: 1917, y: 198, width: 1337, height: 3240 },
        aspectRatio: 1337 / 3240
      },
      {
        id: 'horizontal-right',
        label: '图片2',
        uploadText: '上传图片',
        region: { x: 3312, y: 198, width: 1336, height: 3240 },
        aspectRatio: 1336 / 3240
      }
    ]
  },
  story: {
    id: 'story',
    name: 'Double Pic',
    shortName: 'Double Pic',
    author: '谣不可汲',
    authorUrl: 'https://www.weibo.com/u/6057962251',
    authorSns: [{ platform: 'weibo', url: 'https://www.weibo.com/u/6057962251' }],
    legacyPreviewPath: '/template-preview/2-Double Pic/2-Preview.webp',
    summary: '双图模板，沿用原小故事配装文字排布。',
    sourceWidth: 2968,
    sourceHeight: 3958,
    renderMode: 'double-pic',
    defaultLocale: 'zh',
    localeOrder: ['zh', 'tc'],
    controls: { title: false, ecSubtitle: false, dyeFrame: false, storySwatches: false },
    equipmentFormat: {
      source: 'default',
      itemName: { inlineDye: true, wrap: false, shrink: false },
      dye: {
        mode: 'inline-text',
        includeAccessories: false,
        showWhenDyeCountZero: true,
        showEmptySlots: true,
        maxSlots: 2,
        separator: '/'
      }
    },
    imageSlots: [
      {
        id: 'story-left',
        label: '图片1',
        uploadText: '上传图片',
        region: { x: 0, y: 0, width: 1646, height: 3958 },
        uploadRegion: { x: 0, y: 0, width: 1646, height: 3958 },
        aspectRatio: 1646 / 3958
      },
      {
        id: 'story-right',
        label: '图片2',
        uploadText: '上传图片',
        region: { x: 1292, y: 0, width: 1676, height: 3958 },
        uploadRegion: { x: 1292, y: 0, width: 1676, height: 3958 },
        aspectRatio: 1676 / 3958
      }
    ]
  },
  risingstones: {
    id: 'risingstones',
    name: 'Risingstones',
    shortName: '石之家',
    author: '夜莺不语',
    authorUrl: 'https://weibo.com/u/1734754935',
    authorSns: [
      { platform: 'weibo', url: 'https://weibo.com/u/1734754935' },
      { platform: 'xiaohongshu', url: 'https://www.xiaohongshu.com/user/profile/5e6c8c6e0000000001000724' },
      { platform: 'douyin', url: 'https://www.douyin.com/user/MS4wLjABAAAAtHfFkouTFs-quaZJ9EEgYjkWIa32xJSgiqNklbNuqQY' }
    ],
    legacyPreviewPath: '/template-preview/5-Risingstones/5-preview.webp',
    summary: '石之家风格模板，适合中文或繁中装备信息。',
    sourceWidth: 3840,
    sourceHeight: 3840,
    renderMode: 'risingstones',
    defaultLocale: 'zh',
    localeOrder: ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko'],
    controls: { title: true, ecSubtitle: true, dyeFrame: false, storySwatches: false },
    equipmentFormat: {
      source: 'default',
      maxRows: 10,
      itemName: { wrap: false, shrink: true },
      dye: {
        mode: 'risingstones-chips',
        includeAccessories: false,
        showWhenDyeCountZero: true,
        showEmptySlots: true,
        maxSlots: 2,
        stripDyeSuffix: true
      }
    },
    imageSlots: [
      {
        id: GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID,
        label: '图片1',
        uploadText: '上传图片',
        region: { x: 148, y: 243, width: 1915, height: 3402 },
        aspectRatio: 1915 / 3402
      },
      {
        id: GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID,
        label: '头像',
        uploadText: '上传头像',
        region: { x: 3280, y: 323, width: 389, height: 390 },
        dropRegion: { x: 3160, y: 210, width: 620, height: 620 },
        aspectRatio: 389 / 390
      }
    ]
  },
  ec: {
    id: 'ec',
    name: 'Eorzea Collection风格',
    shortName: 'EC',
    author: '夜莺不语',
    authorUrl: 'https://weibo.com/u/1734754935',
    authorSns: [
      { platform: 'weibo', url: 'https://weibo.com/u/1734754935' },
      { platform: 'xiaohongshu', url: 'https://www.xiaohongshu.com/user/profile/5e6c8c6e0000000001000724' },
      { platform: 'douyin', url: 'https://www.douyin.com/user/MS4wLjABAAAAtHfFkouTFs-quaZJ9EEgYjkWIa32xJSgiqNklbNuqQY' }
    ],
    legacyPreviewPath: '/template-preview/3-Eorzea Collection/3-preview.webp',
    summary: 'EC投稿风格，适合英文，也支持中日韩法德装备名。',
    sourceWidth: 3840,
    sourceHeight: 3840,
    renderMode: 'ec',
    defaultLocale: 'en',
    localeOrder: ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko'],
    controls: { title: true, ecSubtitle: true, dyeFrame: false },
    equipmentFormat: {
      source: 'ec',
      maxRows: 14,
      itemName: { wrap: false, shrink: true },
      dye: {
        mode: 'ec-chips',
        includeAccessories: false,
        showWhenDyeCountZero: false,
        showEmptySlots: true,
        maxSlots: 2,
        stripDyeSuffix: true
      }
    },
    imageSlots: [
      {
        id: GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID,
        label: '图片1',
        uploadText: '上传图片',
        region: { x: 200, y: 672, width: 1683, height: 2821 },
        aspectRatio: 1683 / 2821
      }
    ]
  },
  'silence-fashion': {
    id: 'silence-fashion',
    name: 'Silence Fashion',
    shortName: 'Silence',
    author: '夜莺不语',
    authorUrl: 'https://weibo.com/u/1734754935',
    authorSns: [
      { platform: 'weibo', url: 'https://weibo.com/u/1734754935' },
      { platform: 'xiaohongshu', url: 'https://www.xiaohongshu.com/user/profile/5e6c8c6e0000000001000724' },
      { platform: 'douyin', url: 'https://www.douyin.com/user/MS4wLjABAAAAtHfFkouTFs-quaZJ9EEgYjkWIa32xJSgiqNklbNuqQY' }
    ],
    legacyPreviewPath: '/template-preview/6-Silence Fashion/6-preview.webp',
    summary: 'Silence Fashion 模板，支持中文、繁中和日英双语排版。',
    sourceWidth: 3000,
    sourceHeight: 3000,
    renderMode: 'silence-fashion',
    defaultLocale: 'zh',
    localeOrder: ['ja', 'en', 'zh', 'tc', 'ko'],
    languageOptions: [
      { id: 'zh', label: 'chs', locales: ['zh'] },
      { id: 'tc', label: 'tc', locales: ['tc'] },
      { id: 'ko', label: 'ko', locales: ['ko'] },
      { id: 'en', label: 'en', locales: ['en'] },
      { id: 'ja', label: 'ja', locales: ['ja'] },
      { id: 'en-ja', label: 'en+ja', locales: ['en', 'ja'] }
    ],
    controls: { title: true, characterName: false, ecSubtitle: true, dyeFrame: false, storySwatches: false },
    equipmentFormat: {
      source: 'default',
      maxRows: 99,
      itemName: { wrap: false, shrink: true },
      dye: {
        mode: 'text',
        includeAccessories: false,
        showWhenDyeCountZero: true,
        showEmptySlots: true,
        maxSlots: 2,
        stripDyeSuffix: true,
        separator: ' / '
      }
    },
    imageSlots: [
      {
        id: GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID,
        label: '图片1',
        uploadText: '上传图片',
        region: { x: 171, y: 126, width: 1545, height: 2748 },
        aspectRatio: 1545 / 2748
      },
      {
        id: GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID,
        label: '头像',
        uploadText: '上传头像',
        region: { x: 2434, y: 179, width: 318, height: 318 },
        dropRegion: { x: 2310, y: 55, width: 570, height: 570 },
        aspectRatio: 1
      }
    ]
  }
}

export function getGlamourTemplateDefinition(templateId: string | undefined): GlamourTemplateDefinition {
  return GLAMOUR_TEMPLATE_DEFINITIONS[normalizeGlamourTemplateId(templateId)]
}

export function normalizeGlamourTemplateId(templateId: string | undefined): GlamourTemplateId {
  return GLAMOUR_TEMPLATE_SELECT_ORDER.includes(templateId as GlamourTemplateId)
    ? (templateId as GlamourTemplateId)
    : GLAMOUR_TEMPLATE_DEFAULT_ID
}
