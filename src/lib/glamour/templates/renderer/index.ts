// Re-export all public API from sub-modules for full backward compatibility.
// Only items that were originally exported from renderer.ts are re-exported here.

export type {
  GlamourTemplateCanvasImage,
  GlamourTemplateImageResolver,
  GlamourTemplateIconResolver,
  GlamourTemplateCanvasRenderContext
} from './types'

export {
  drawGlamourTemplateImageCover,
  drawGlamourTemplateMaskedImageCover,
  renderGlamourTemplateCanvas,
  renderGlamourTemplateCanvasFallback
} from './canvas'
