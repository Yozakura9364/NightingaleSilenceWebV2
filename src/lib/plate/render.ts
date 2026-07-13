import { NSPLATE_PORTRAIT_CATEGORIES, NSPLATE_PORTRAIT_FRAME_CATEGORY } from '@/lib/plate/draft'
import {
  createNSPlateInfoGraphicRenderLayers,
  createNSPlateInfoTextRenderLayers
} from '@/lib/plate/infoLayerRenderDefinitions'
import type {
  NSPlateInfoGraphicRenderLayer,
  NSPlateInfoTextRenderLayer
} from '@/lib/plate/infoLayerRenderTypes'
import type { NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitPopoutLayerAnchor,
  NSPlatePortraitSide
} from '@/lib/plate/types'
import { normalizeNSPlateCustomPortraitPopoutLayerAnchor } from '@/lib/plate/types'

export interface NSPlateCanvasDimensions {
  width: number
  height: number
}

export interface NSPlateLayerPosition {
  x: number
  y: number
  scale?: number
}

export interface NSPlateRenderImageLayer {
  key: string
  category: string
  asset: NSPlateAssetSummary
  position: NSPlateLayerPosition
  placement: 'center' | 'fixed'
}

export interface NSPlatePortraitRenderPlan {
  mode: 'portrait'
  dimensions: NSPlateCanvasDimensions
  layers: NSPlateRenderImageLayer[]
}

export interface NSPlateNameplateRenderPlan {
  mode: 'nameplate'
  dimensions: NSPlateCanvasDimensions
  baseLayers: NSPlateRenderImageLayer[]
  portraitBaseLayers: NSPlateRenderImageLayer[]
  customPortrait: NSPlateCustomPortraitImage | null
  portraitOverlayLayers: NSPlateRenderImageLayer[]
  portraitEmbed: NSPlateLayerPosition
  portraitFrameLayer: NSPlateRenderImageLayer | null
  overlayLayers: NSPlateRenderImageLayer[]
  infoGraphicLayers: NSPlateInfoGraphicRenderLayer[]
  infoTextLayers: NSPlateInfoTextRenderLayer[]
}

export type NSPlateRenderPlan = NSPlatePortraitRenderPlan | NSPlateNameplateRenderPlan

export type NSPlateNameplateRenderSegment =
  | {
      type: 'systemLayers'
      layers: NSPlateRenderImageLayer[]
    }
  | {
      type: 'portraitBaseComposite'
      portraitBaseLayers: NSPlateRenderImageLayer[]
      customPortrait: NSPlateCustomPortraitImage | null
      portraitEmbed: NSPlateLayerPosition
    }
  | {
      type: 'portraitOverlayComposite'
      portraitOverlayLayers: NSPlateRenderImageLayer[]
      portraitEmbed: NSPlateLayerPosition
    }
  | {
      type: 'customPortraitPopout'
      customPortrait: NSPlateCustomPortraitImage | null
      portraitEmbed: NSPlateLayerPosition
      dimensions: NSPlateCanvasDimensions
    }
  | {
      type: 'infoLayers'
      graphicLayers: NSPlateInfoGraphicRenderLayer[]
      textLayers: NSPlateInfoTextRenderLayer[]
      dimensions: NSPlateCanvasDimensions
    }

export type NSPlateNameplateLayerOrderSlot =
  | {
      type: 'asset'
      category: string
    }
  | {
      type: 'customPortraitInFrame'
    }
  | {
      type: 'customPortraitPopout'
    }
  | {
      type: 'infoLayers'
    }

export const NSPLATE_CANVAS_DIMENSIONS = {
  portrait: { width: 512, height: 840 },
  nameplate: { width: 2560, height: 1440 }
} satisfies Record<NSPlateCanvasMode, NSPlateCanvasDimensions>

export const NSPLATE_CUSTOM_PORTRAIT_LAYER_KEY = 'customPortrait'

export const NSPLATE_LAYER_COORDS: Record<string, NSPlateLayerPosition> = {
  肖像背景: { x: 0, y: 0 },
  肖像装饰框: { x: 0, y: 0 },
  肖像装饰物: { x: 0, y: 0 },
  铭牌背衬: { x: 0, y: 0 },
  铭牌底色: { x: 540, y: 300 },
  铭牌花纹: { x: 540, y: 300 },
  铭牌外框: { x: 320, y: 172 },
  铭牌顶部装饰: { x: 320, y: 172 },
  铭牌底部装饰: { x: 320, y: 956 },
  铭牌装饰物: { x: 1700, y: 760 },
  铭牌装饰物B: { x: 1764, y: 824, scale: 0.75 }
}

export const NSPLATE_LAYER_COORDS_BY_PORTRAIT_SIDE: Partial<
  Record<string, Record<NSPlatePortraitSide, NSPlateLayerPosition>>
> = {
  铭牌装饰物: {
    right: { x: 1700, y: 760 },
    left: { x: 348, y: 760 }
  },
  铭牌装饰物B: {
    right: { x: 1764, y: 824, scale: 0.75 },
    left: { x: 412, y: 824, scale: 0.75 }
  }
}

export const NSPLATE_PORTRAIT_EMBED: Record<NSPlatePortraitSide, NSPlateLayerPosition> = {
  right: { x: 1444, y: 300 },
  left: { x: 604, y: 300 }
}

export const NSPLATE_PORTRAIT_FRAME_ON_NAMEPLATE: Record<
  NSPlatePortraitSide,
  NSPlateLayerPosition
> = {
  right: { x: 1260, y: 0 },
  left: { x: 420, y: 0 }
}

const NAMEPLATE_BASE_CATEGORIES = ['铭牌背衬', '铭牌底色', '铭牌花纹'] as const
const NAMEPLATE_OVERLAY_CATEGORIES = [
  '铭牌外框',
  '铭牌顶部装饰',
  '铭牌底部装饰',
  '铭牌装饰物',
  '铭牌装饰物B'
] as const
const NAMEPLATE_FRAME_CATEGORIES = NAMEPLATE_OVERLAY_CATEGORIES.slice(0, 1)
const NAMEPLATE_BOTTOM_DECORATION_CATEGORIES = ['铭牌底部装饰'] as const
const NAMEPLATE_TOP_DECORATION_CATEGORIES = ['铭牌顶部装饰'] as const
const NAMEPLATE_ORNAMENT_CATEGORIES = NAMEPLATE_OVERLAY_CATEGORIES.slice(3)

export function createPlateRenderPlan(
  mode: NSPlateCanvasMode,
  selectedAssets: NSPlateAssetSummary[],
  portraitSide: NSPlatePortraitSide = 'right',
  customPortrait: NSPlateCustomPortraitImage | null = null,
  infoDraft: NSPlateInfoDraft | null = null,
  infoAssetGroups: NSPlateAssetGroup[] = []
): NSPlateRenderPlan {
  const selectedByCategory = getSelectedAssetsByCategory(selectedAssets)

  if (mode === 'portrait') {
    return {
      mode,
      dimensions: NSPLATE_CANVAS_DIMENSIONS.portrait,
      layers: [
        ...createPortraitBaseLayers(selectedByCategory),
        ...createPortraitOverlayLayers(selectedByCategory)
      ]
    }
  }

  return createNameplateRenderPlan(
    selectedAssets,
    portraitSide,
    selectedByCategory,
    customPortrait,
    infoDraft,
    infoAssetGroups
  )
}

export function createNameplateRenderPlan(
  selectedAssets: NSPlateAssetSummary[],
  portraitSide: NSPlatePortraitSide = 'right',
  selectedByCategory = getSelectedAssetsByCategory(selectedAssets),
  customPortrait: NSPlateCustomPortraitImage | null = null,
  infoDraft: NSPlateInfoDraft | null = null,
  infoAssetGroups: NSPlateAssetGroup[] = []
): NSPlateNameplateRenderPlan {
  return {
    mode: 'nameplate',
    dimensions: NSPLATE_CANVAS_DIMENSIONS.nameplate,
    baseLayers: createFixedLayers(NAMEPLATE_BASE_CATEGORIES, selectedByCategory),
    portraitBaseLayers: createPortraitBaseLayers(selectedByCategory),
    customPortrait,
    portraitOverlayLayers: createPortraitOverlayLayers(selectedByCategory),
    portraitEmbed: NSPLATE_PORTRAIT_EMBED[portraitSide],
    portraitFrameLayer: createPortraitFrameLayer(selectedByCategory, portraitSide),
    overlayLayers: createFixedLayers(
      NAMEPLATE_OVERLAY_CATEGORIES,
      selectedByCategory,
      'fixed',
      portraitSide
    ),
    infoGraphicLayers: createNSPlateInfoGraphicRenderLayers(
      infoDraft,
      portraitSide,
      infoAssetGroups
    ),
    infoTextLayers: createNSPlateInfoTextRenderLayers(infoDraft, portraitSide, selectedByCategory)
  }
}

export function getPlateRenderLayerNames(plan: NSPlateRenderPlan) {
  if (plan.mode === 'portrait') {
    return plan.layers.map((layer) => layer.category)
  }

  const names: string[] = []

  for (const segment of getNameplateRenderSegments(plan)) {
    if (segment.type === 'systemLayers') {
      names.push(...segment.layers.map((layer) => layer.category))
    } else if (segment.type === 'portraitBaseComposite') {
      names.push(...segment.portraitBaseLayers.map((layer) => layer.category))

      if (segment.customPortrait) {
        names.push(NSPLATE_CUSTOM_PORTRAIT_LAYER_KEY)
      }
    } else if (segment.type === 'portraitOverlayComposite') {
      names.push(...segment.portraitOverlayLayers.map((layer) => layer.category))
    } else if (segment.type === 'infoLayers') {
      if (
        (segment.graphicLayers.length > 0 || segment.textLayers.length > 0) &&
        !names.includes('信息层')
      ) {
        names.push('信息层')
      }
    } else if (
      segment.type === 'customPortraitPopout' &&
      segment.customPortrait?.mode === 'popout'
    ) {
      names.push(`${NSPLATE_CUSTOM_PORTRAIT_LAYER_KEY}:popout`)
    }
  }

  return names
}

export function getNameplateRenderSegments(
  plan: NSPlateNameplateRenderPlan
): NSPlateNameplateRenderSegment[] {
  const popoutAnchor = getCustomPortraitPopoutLayerAnchor(plan.customPortrait)
  const popoutSegment = {
    type: 'customPortraitPopout',
    customPortrait: plan.customPortrait,
    portraitEmbed: plan.portraitEmbed,
    dimensions: plan.dimensions
  } satisfies NSPlateNameplateRenderSegment

  return [
    { type: 'systemLayers', layers: plan.baseLayers },
    {
      type: 'portraitBaseComposite',
      portraitBaseLayers: plan.portraitBaseLayers,
      customPortrait: plan.customPortrait,
      portraitEmbed: plan.portraitEmbed
    },
    ...(popoutAnchor === 'aboveCustomPortrait' ? [popoutSegment] : []),
    {
      type: 'portraitOverlayComposite',
      portraitOverlayLayers: plan.portraitOverlayLayers,
      portraitEmbed: plan.portraitEmbed
    },
    ...(popoutAnchor === 'belowNameplateFrame' ? [popoutSegment] : []),
    {
      type: 'systemLayers',
      layers: filterLayersByCategories(plan.overlayLayers, NAMEPLATE_FRAME_CATEGORIES)
    },
    ...(popoutAnchor === 'aboveNameplateFrame' ? [popoutSegment] : []),
    {
      type: 'systemLayers',
      layers: plan.portraitFrameLayer ? [plan.portraitFrameLayer] : []
    },
    ...(popoutAnchor === 'abovePortraitFrame' ? [popoutSegment] : []),
    {
      type: 'systemLayers',
      layers: filterLayersByCategories(plan.overlayLayers, NAMEPLATE_BOTTOM_DECORATION_CATEGORIES)
    },
    ...(popoutAnchor === 'aboveNameplateBottomDecoration' ? [popoutSegment] : []),
    {
      type: 'systemLayers',
      layers: filterLayersByCategories(plan.overlayLayers, NAMEPLATE_TOP_DECORATION_CATEGORIES)
    },
    ...(popoutAnchor === 'aboveNameplateDecorations' ? [popoutSegment] : []),
    {
      type: 'systemLayers',
      layers: filterLayersByCategories(plan.overlayLayers, NAMEPLATE_ORNAMENT_CATEGORIES)
    },
    ...(popoutAnchor === 'aboveNameplateOrnaments' ? [popoutSegment] : []),
    ...(popoutAnchor === 'aboveInfoGraphics' ? [popoutSegment] : []),
    {
      type: 'infoLayers',
      graphicLayers: plan.infoGraphicLayers,
      textLayers: plan.infoTextLayers,
      dimensions: plan.dimensions
    },
    ...(popoutAnchor === 'aboveInfoText' ? [popoutSegment] : []),
    ...(popoutAnchor === 'front' ? [popoutSegment] : [])
  ]
}

export function getNameplateLayerOrderSlots(
  customPortrait: NSPlateCustomPortraitImage | null
): NSPlateNameplateLayerOrderSlot[] {
  const popoutAnchor = getCustomPortraitPopoutLayerAnchor(customPortrait)
  const popoutSlot = { type: 'customPortraitPopout' } satisfies NSPlateNameplateLayerOrderSlot

  return [
    ...NAMEPLATE_BASE_CATEGORIES.map(createAssetLayerOrderSlot),
    createAssetLayerOrderSlot(NSPLATE_PORTRAIT_CATEGORIES[0]),
    { type: 'customPortraitInFrame' },
    ...(popoutAnchor === 'aboveCustomPortrait' ? [popoutSlot] : []),
    ...NSPLATE_PORTRAIT_CATEGORIES.slice(1).map(createAssetLayerOrderSlot),
    ...(popoutAnchor === 'belowNameplateFrame' ? [popoutSlot] : []),
    ...NAMEPLATE_FRAME_CATEGORIES.map(createAssetLayerOrderSlot),
    ...(popoutAnchor === 'aboveNameplateFrame' ? [popoutSlot] : []),
    createAssetLayerOrderSlot(NSPLATE_PORTRAIT_FRAME_CATEGORY),
    ...(popoutAnchor === 'abovePortraitFrame' ? [popoutSlot] : []),
    ...NAMEPLATE_BOTTOM_DECORATION_CATEGORIES.map(createAssetLayerOrderSlot),
    ...(popoutAnchor === 'aboveNameplateBottomDecoration' ? [popoutSlot] : []),
    ...NAMEPLATE_TOP_DECORATION_CATEGORIES.map(createAssetLayerOrderSlot),
    ...(popoutAnchor === 'aboveNameplateDecorations' ? [popoutSlot] : []),
    ...NAMEPLATE_ORNAMENT_CATEGORIES.map(createAssetLayerOrderSlot),
    ...(popoutAnchor === 'aboveNameplateOrnaments' ? [popoutSlot] : []),
    ...(popoutAnchor === 'aboveInfoGraphics' ? [popoutSlot] : []),
    { type: 'infoLayers' },
    ...(popoutAnchor === 'aboveInfoText' ? [popoutSlot] : []),
    ...(popoutAnchor === 'front' ? [popoutSlot] : [])
  ]
}

function getCustomPortraitPopoutLayerAnchor(
  customPortrait: NSPlateCustomPortraitImage | null
): NSPlateCustomPortraitPopoutLayerAnchor {
  if (customPortrait?.mode !== 'popout') {
    return normalizeNSPlateCustomPortraitPopoutLayerAnchor(null)
  }

  return normalizeNSPlateCustomPortraitPopoutLayerAnchor(customPortrait.popoutLayerAnchor)
}

function createAssetLayerOrderSlot(category: string): NSPlateNameplateLayerOrderSlot {
  return {
    type: 'asset',
    category
  }
}

function filterLayersByCategories(
  layers: NSPlateRenderImageLayer[],
  categories: readonly string[]
) {
  const categorySet = new Set(categories)
  return layers.filter((layer) => categorySet.has(layer.category))
}

export function getPlateLayerImageUrl(layer: NSPlateRenderImageLayer) {
  return layer.asset.imageUrl ?? layer.asset.previewUrl ?? ''
}

function createPortraitBaseLayers(selectedByCategory: Map<string, NSPlateAssetSummary>) {
  return createFixedLayers([NSPLATE_PORTRAIT_CATEGORIES[0]], selectedByCategory, 'center')
}

function createPortraitOverlayLayers(selectedByCategory: Map<string, NSPlateAssetSummary>) {
  return createFixedLayers(NSPLATE_PORTRAIT_CATEGORIES.slice(1), selectedByCategory, 'center')
}

function createFixedLayers(
  categories: readonly string[],
  selectedByCategory: Map<string, NSPlateAssetSummary>,
  placement: NSPlateRenderImageLayer['placement'] = 'fixed',
  portraitSide?: NSPlatePortraitSide
) {
  return categories
    .map((category) => createLayer(category, selectedByCategory, placement, portraitSide))
    .filter((layer): layer is NSPlateRenderImageLayer => layer !== null)
}

function createPortraitFrameLayer(
  selectedByCategory: Map<string, NSPlateAssetSummary>,
  portraitSide: NSPlatePortraitSide
) {
  const asset = selectedByCategory.get(NSPLATE_PORTRAIT_FRAME_CATEGORY)

  if (!asset) {
    return null
  }

  return {
    key: `${asset.category}:${asset.id}`,
    category: asset.category,
    asset,
    position: NSPLATE_PORTRAIT_FRAME_ON_NAMEPLATE[portraitSide],
    placement: 'fixed'
  } satisfies NSPlateRenderImageLayer
}

function createLayer(
  category: string,
  selectedByCategory: Map<string, NSPlateAssetSummary>,
  placement: NSPlateRenderImageLayer['placement'],
  portraitSide?: NSPlatePortraitSide
) {
  const asset = selectedByCategory.get(category)
  const position = portraitSide
    ? NSPLATE_LAYER_COORDS_BY_PORTRAIT_SIDE[category]?.[portraitSide] ??
      NSPLATE_LAYER_COORDS[category]
    : NSPLATE_LAYER_COORDS[category]

  if (!asset || !position) {
    return null
  }

  return {
    key: `${asset.category}:${asset.id}`,
    category,
    asset,
    position,
    placement
  } satisfies NSPlateRenderImageLayer
}

function getSelectedAssetsByCategory(selectedAssets: NSPlateAssetSummary[]) {
  const selectedByCategory = new Map<string, NSPlateAssetSummary>()

  for (const asset of selectedAssets) {
    selectedByCategory.set(asset.category, asset)
  }

  return selectedByCategory
}
