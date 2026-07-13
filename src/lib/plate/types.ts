export type NSPlatePresetKind = 'banner' | 'charcard'
export type NSPlateAssetScope = 'portrait' | 'nameplate'
export type NSPlateCanvasMode = 'portrait' | 'nameplate'
export type NSPlatePanelTab = 'portrait' | 'nameplate' | 'info'
export type NSPlatePortraitSide = 'left' | 'right'
export type NSPlateCustomPortraitMode = 'standard' | 'popout'
export type NSPlateCustomPortraitPopoutLayerAnchor =
  | 'aboveCustomPortrait'
  | 'belowNameplateFrame'
  | 'aboveNameplateFrame'
  | 'abovePortraitFrame'
  | 'aboveNameplateBottomDecoration'
  | 'aboveNameplateDecorations'
  | 'aboveNameplateOrnaments'
  | 'aboveInfoGraphics'
  | 'aboveInfoText'
  | 'front'

type NSPlateLegacyCustomPortraitPopoutLayerAnchor =
  'behindFrames' | 'aboveFrames' | 'aboveDecorations'

export const NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR =
  'abovePortraitFrame' satisfies NSPlateCustomPortraitPopoutLayerAnchor
export const NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS = [
  'aboveCustomPortrait',
  'belowNameplateFrame',
  'aboveNameplateFrame',
  'abovePortraitFrame',
  'aboveNameplateBottomDecoration',
  'aboveNameplateDecorations',
  'aboveNameplateOrnaments',
  'aboveInfoGraphics',
  'aboveInfoText',
  'front'
] as const satisfies readonly NSPlateCustomPortraitPopoutLayerAnchor[]

const NSPLATE_LEGACY_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHOR_MAP = {
  behindFrames: 'belowNameplateFrame',
  aboveFrames: 'abovePortraitFrame',
  aboveDecorations: 'aboveNameplateOrnaments'
} as const satisfies Record<
  NSPlateLegacyCustomPortraitPopoutLayerAnchor,
  NSPlateCustomPortraitPopoutLayerAnchor
>

export function normalizeNSPlateCustomPortraitPopoutLayerAnchor(
  value: unknown
): NSPlateCustomPortraitPopoutLayerAnchor {
  if (typeof value !== 'string') {
    return NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR
  }

  if (
    NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS.includes(
      value as NSPlateCustomPortraitPopoutLayerAnchor
    )
  ) {
    return value as NSPlateCustomPortraitPopoutLayerAnchor
  }

  return (
    NSPLATE_LEGACY_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHOR_MAP[
      value as NSPlateLegacyCustomPortraitPopoutLayerAnchor
    ] ?? NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR
  )
}

export interface NSPlateCustomPortraitImage {
  id: string
  mode: NSPlateCustomPortraitMode
  popoutLayerAnchor?: NSPlateCustomPortraitPopoutLayerAnchor
  fileName: string
  dataUrl: string
  width: number
  height: number
  scale: number
  sourceDataUrl?: string
  sourceWidth?: number
  sourceHeight?: number
  baseScale?: number
  scaleMultiplier?: number
  offsetX?: number
  offsetY?: number
  splitY?: number
}

export interface NSPlateCustomPortraitCropState {
  id: string
  fileName: string
  sourceDataUrl: string
  image: HTMLImageElement
  sourceWidth: number
  sourceHeight: number
  baseScale: number
  mode: NSPlateCustomPortraitMode
  popoutLayerAnchor?: NSPlateCustomPortraitPopoutLayerAnchor
  scaleMultiplier: number
  offsetX: number
  offsetY: number
  splitY: number
}

export interface NSPlatePreset {
  name?: string
  names?: Record<string, string>
  layers?: NSPlatePresetLayerRef[]
  [key: string]: unknown
}

export interface NSPlatePresetLayerRef {
  cat?: string
  id?: string | number
  [key: string]: unknown
}

export interface NSPlatePresetsResponse {
  banner?: NSPlatePreset[]
  charcard?: NSPlatePreset[]
}

export interface NSPlateAsset {
  id?: string | number
  file?: string
  path?: string
  name?: string
  names?: Record<string, string>
  [key: string]: unknown
}

export interface NSPlateFilesResponse {
  portrait?: Record<string, NSPlateAsset[]>
  nameplate?: Record<string, NSPlateAsset[]>
  _meta?: {
    imgBase?: string | null
    previewImgBase?: string | null
    previewMaxEdge?: number | null
    [key: string]: unknown
  }
}

export interface NSPlatePresetSummary {
  id: string
  kind: NSPlatePresetKind
  kindLabel: string
  label: string
  raw: NSPlatePreset
}

export interface NSPlatePresetGroup {
  kind: NSPlatePresetKind
  label: string
  presets: NSPlatePresetSummary[]
}

export interface NSPlateAssetSummary {
  id: string
  legacyIds?: string[]
  scope: NSPlateAssetScope
  scopeLabel: string
  category: string
  label: string
  file: string
  path: string
  imageUrl?: string
  previewUrl?: string
  raw: NSPlateAsset
}

export interface NSPlateAssetGroup {
  scope: NSPlateAssetScope
  scopeLabel: string
  category: string
  label: string
  assets: NSPlateAssetSummary[]
}

export type NSPlateLayerOrderNoteItemTarget = 'asset' | 'customPortrait' | 'info'

export interface NSPlateLayerOrderNoteItem {
  id: string
  target: NSPlateLayerOrderNoteItemTarget
  sectionKey?: string
  scope?: NSPlateAssetScope
  category?: string
  infoSlotId?: string
  label: string
  valueLabel: string
  selected: boolean
  movable?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export type NSPlateSelectionNoteItem = NSPlateLayerOrderNoteItem

export interface NSPlateLayeredExportLayer {
  name: string
  x: number
  y: number
  width: number
  height: number
  rgbaData: string
  sourceType?: 'system' | 'custom' | 'info'
}

export interface NSPlateLayeredExportPayload {
  layers: NSPlateLayeredExportLayer[]
  canvasWidth: number
  canvasHeight: number
  composerConfigFull?: Record<string, unknown>
}

export interface NSPlateLayeredExportOptions {
  scale: number
}
