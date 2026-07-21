import type { GlamourTemplateLoadedAssetMap } from '@/lib/glamour/templates/assets'
import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'

export interface GlamourTemplateCanvasImage {
  image: HTMLImageElement
}

export type GlamourTemplateImageResolver = (slotId: string) => GlamourTemplateCanvasImage | null
export type GlamourTemplateIconResolver = (iconId: number | string | undefined) => GlamourTemplateCanvasImage | null

export interface GlamourTemplateCanvasRenderContext {
  renderData: GlamourTemplateRenderData
  resolveImage: GlamourTemplateImageResolver
  resolveIcon?: GlamourTemplateIconResolver
  assets?: GlamourTemplateLoadedAssetMap
}
