export type NSPlatePresetKind = 'banner' | 'charcard'
export type NSPlateAssetScope = 'portrait' | 'nameplate'
export type NSPlateCanvasMode = 'portrait' | 'nameplate'
export type NSPlatePanelTab = 'portrait' | 'nameplate' | 'info'

export interface NSPlateCustomPortraitImage {
  id: string
  fileName: string
  dataUrl: string
  width: number
  height: number
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
