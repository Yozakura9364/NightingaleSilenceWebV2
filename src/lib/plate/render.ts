import { NSPLATE_PORTRAIT_CATEGORIES, NSPLATE_PORTRAIT_FRAME_CATEGORY } from '@/lib/plate/draft'
import {
  createNSPlateInfoGraphicRenderLayers,
  createNSPlateInfoTextRenderLayers,
  type NSPlateInfoGraphicRenderLayer,
  type NSPlateInfoTextRenderLayer
} from '@/lib/plate/infoLayerRenderDefinitions'
import type { NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage
} from '@/lib/plate/types'

export type NSPlatePortraitSide = 'left' | 'right'

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
      type: 'portraitComposite'
      portraitBaseLayers: NSPlateRenderImageLayer[]
      customPortrait: NSPlateCustomPortraitImage | null
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
      type: 'infoGraphicLayers'
      layers: NSPlateInfoGraphicRenderLayer[]
    }
  | {
      type: 'infoTextLayers'
      layers: NSPlateInfoTextRenderLayer[]
      dimensions: NSPlateCanvasDimensions
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
  铭牌装饰物: { x: 1700, y: 763 },
  铭牌装饰物B: { x: 1764, y: 824, scale: 0.75 }
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
    overlayLayers: createFixedLayers(NAMEPLATE_OVERLAY_CATEGORIES, selectedByCategory),
    infoGraphicLayers: createNSPlateInfoGraphicRenderLayers(
      infoDraft,
      portraitSide,
      infoAssetGroups
    ),
    infoTextLayers: createNSPlateInfoTextRenderLayers(infoDraft, portraitSide)
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
    } else if (segment.type === 'portraitComposite') {
      names.push(...segment.portraitBaseLayers.map((layer) => layer.category))

      if (segment.customPortrait) {
        names.push(NSPLATE_CUSTOM_PORTRAIT_LAYER_KEY)
      }

      names.push(...segment.portraitOverlayLayers.map((layer) => layer.category))
    } else if (segment.type === 'infoTextLayers') {
      names.push(...segment.layers.map((layer) => layer.legacyName))
    } else if (segment.type === 'infoGraphicLayers') {
      names.push(...segment.layers.map((layer) => layer.legacyName))
    }
  }

  return names
}

export function getNameplateRenderSegments(
  plan: NSPlateNameplateRenderPlan
): NSPlateNameplateRenderSegment[] {
  return [
    { type: 'systemLayers', layers: plan.baseLayers },
    {
      type: 'portraitComposite',
      portraitBaseLayers: plan.portraitBaseLayers,
      customPortrait: plan.customPortrait,
      portraitOverlayLayers: plan.portraitOverlayLayers,
      portraitEmbed: plan.portraitEmbed
    },
    { type: 'systemLayers', layers: plan.overlayLayers.slice(0, 1) },
    {
      type: 'systemLayers',
      layers: plan.portraitFrameLayer ? [plan.portraitFrameLayer] : []
    },
    {
      type: 'customPortraitPopout',
      customPortrait: plan.customPortrait,
      portraitEmbed: plan.portraitEmbed,
      dimensions: plan.dimensions
    },
    { type: 'systemLayers', layers: plan.overlayLayers.slice(1) },
    { type: 'infoGraphicLayers', layers: plan.infoGraphicLayers },
    { type: 'infoTextLayers', layers: plan.infoTextLayers, dimensions: plan.dimensions }
  ]
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
  placement: NSPlateRenderImageLayer['placement'] = 'fixed'
) {
  return categories
    .map((category) => createLayer(category, selectedByCategory, placement))
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
  placement: NSPlateRenderImageLayer['placement']
) {
  const asset = selectedByCategory.get(category)
  const position = NSPLATE_LAYER_COORDS[category]

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
