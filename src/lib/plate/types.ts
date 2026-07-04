export type NSPlatePresetKind = 'banner' | 'charcard'
export type NSPlateAssetScope = 'portrait' | 'nameplate'
export type NSPlateCanvasMode = 'portrait' | 'nameplate'
export type NSPlatePanelTab = 'portrait' | 'nameplate' | 'info'
export type NSPlatePortraitSide = 'left' | 'right'
export type NSPlateCustomPortraitMode = 'standard' | 'popout'

export interface NSPlateCustomPortraitImage {
  id: string
  mode: NSPlateCustomPortraitMode
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

export interface NSPlateSelectionNoteItem {
  sectionKey: string
  scope: NSPlateAssetScope
  category: string
  label: string
  valueLabel: string
  selected: boolean
}

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
