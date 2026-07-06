import type { NSPlateInfoTextAdaptiveColorSource } from '@/lib/plate/infoTextAdaptiveColor'
import type { NSPlateAssetSummary } from '@/lib/plate/types'

export type NSPlateInfoTextAlign = 'left' | 'center' | 'right'
export type NSPlateInfoTextRenderEffect = 'none' | 'shadowGray' | 'embossSoft'
export type NSPlateInfoTextLineHeightMode = 'auto' | 'manual'
export type NSPlateInfoRenderSide = 'left' | 'right'

export interface NSPlateInfoLayerPoint {
  x: number
  y: number
}

export interface NSPlateInfoTextRenderDefinition {
  slotId: string
  legacyName: string
  defaultText: string
  fontFamily: string
  fontVariant?: string
  bold?: boolean
  italic?: boolean
  smallCaps?: boolean
  renderEffect?: NSPlateInfoTextRenderEffect
  align: NSPlateInfoTextAlign
  centerOnDefaultText?: boolean
  x: number
  y: number
  positionBySide: Record<NSPlateInfoRenderSide, NSPlateInfoLayerPoint>
  fontSize: number
  lineHeightMode: NSPlateInfoTextLineHeightMode
  lineHeight: number
  tracking: number
  kerningVA: number
  scaleXPercent: number
  scaleYPercent: number
  baselineShift: number
  color: string
  adaptiveColorSource?: NSPlateInfoTextAdaptiveColorSource
  adaptiveColorFont1?: string
  adaptiveColorFont2?: string
  opacity: number
  strokeEnabled?: boolean
  strokeWidth?: number
  strokeColor?: string
  inlineIconPath?: string
  inlineIconWidth?: number
  inlineIconHeight?: number
  inlineIconGap?: number
  followLayerId?: string
  followXGap?: number
}

export interface NSPlateInfoTextRenderLayer extends NSPlateInfoTextRenderDefinition {
  text: string
}

export type NSPlateInfoGraphicRenderLayerType = 'icon' | 'special' | 'fixed' | 'bar48'

export interface NSPlateInfoGraphicSource {
  label: string
  url: string
  asset?: NSPlateAssetSummary
}

interface NSPlateInfoGraphicRenderDefinitionBase {
  slotId: string
  legacyName: string
  type: NSPlateInfoGraphicRenderLayerType
  x: number
  y: number
  positionBySide: Record<NSPlateInfoRenderSide, NSPlateInfoLayerPoint>
  opacity: number
}

export interface NSPlateInfoIconRenderDefinition extends NSPlateInfoGraphicRenderDefinitionBase {
  type: 'icon'
  sourceCat: string
  itemId: string
  itemIds: string[]
  sizeMode?: 'fixed'
  targetSize?: number
  scale: number
  isActivity?: boolean
}

export interface NSPlateInfoFixedRenderDefinition extends NSPlateInfoGraphicRenderDefinitionBase {
  type: 'fixed'
  path: string
  width: number
  height: number
}

export interface NSPlateInfoSpecialRenderDefinition extends NSPlateInfoGraphicRenderDefinitionBase {
  type: 'special'
  bgItemId: string
  maskItemId: string
  symbolItemId: string
  maskDarkColor: string
  maskLightColor: string
  sizeMode?: 'fixed'
  targetSize?: number
  scale: number
}

export interface NSPlateInfoBar48RenderDefinition extends NSPlateInfoGraphicRenderDefinitionBase {
  type: 'bar48'
  columns: number
  cellWidth: number
  cellHeight: number
  gapX: number
  gapY: number
  emptyPath: string
  fillPath: string
}

export type NSPlateInfoGraphicRenderDefinition =
  | NSPlateInfoIconRenderDefinition
  | NSPlateInfoSpecialRenderDefinition
  | NSPlateInfoFixedRenderDefinition
  | NSPlateInfoBar48RenderDefinition

export interface NSPlateInfoIconRenderLayer extends NSPlateInfoIconRenderDefinition {
  items: NSPlateInfoGraphicSource[]
}

export interface NSPlateInfoFixedRenderLayer extends NSPlateInfoFixedRenderDefinition {
  source: NSPlateInfoGraphicSource
}

export interface NSPlateInfoSpecialRenderLayer extends NSPlateInfoSpecialRenderDefinition {
  bgItemId: string
  maskItemId: string
  symbolItemId: string
  maskDarkColor: string
  maskLightColor: string
  background: NSPlateInfoGraphicSource | null
  mask: NSPlateInfoGraphicSource | null
  symbol: NSPlateInfoGraphicSource
}

export interface NSPlateInfoBar48RenderLayer extends NSPlateInfoBar48RenderDefinition {
  states: number[]
  emptySource: NSPlateInfoGraphicSource
  fillSource: NSPlateInfoGraphicSource | null
}

export type NSPlateInfoGraphicRenderLayer =
  | NSPlateInfoIconRenderLayer
  | NSPlateInfoSpecialRenderLayer
  | NSPlateInfoFixedRenderLayer
  | NSPlateInfoBar48RenderLayer

export const NSPLATE_INFO_ACTIVITY_ICON_CATEGORY = '活动图标'
export const NSPLATE_INFO_SPECIAL_BG_CATEGORY = '国际服寓意背景'
export const NSPLATE_INFO_SPECIAL_MASK_CATEGORY = '国际服上色蒙版'
export const NSPLATE_INFO_SPECIAL_SYMBOL_CATEGORY = '国际服寓意物'
export const NSPLATE_INFO_SPECIAL_DEFAULT_SYMBOL_ITEM_ID = '091000_hr1.png'
export const NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX = 64
export const NSPLATE_INFO_ACTIVITY_ICON_GAP_PX = 16
export const NSPLATE_INFO_BAR48_COUNT = 48
export const NSPLATE_INFO_BAR48_DEFAULT_COLUMNS = 24
export const NSPLATE_INFO_BAR48_CENTER_GAP_BASE_PX = 11
export const NSPLATE_INFO_BAR48_BASE_CELL_WIDTH_PX = 20

export interface NSPlateInfoBar48Bounds {
  columns: number
  rows: number
  splitCol: number
  centerGapPx: number
  width: number
  height: number
}
