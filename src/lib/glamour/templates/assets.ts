import type { GlamourTemplateRenderAsset } from '@/lib/glamour/templates/renderProfiles'

export type GlamourTemplateRenderAssetUrlMap = Partial<Record<GlamourTemplateRenderAsset, string>>

export interface GlamourTemplateLoadedAsset {
  id: GlamourTemplateRenderAsset
  image: HTMLImageElement
  url: string
}

export type GlamourTemplateLoadedAssetMap = Partial<
  Record<GlamourTemplateRenderAsset, GlamourTemplateLoadedAsset>
>

export const GLAMOUR_TEMPLATE_RENDER_ASSET_URLS: GlamourTemplateRenderAssetUrlMap = {
  'figma-background': '/data/glamour/templates/eorzea-magazine.png',
  'horizontal-background': '/data/glamour/templates/eorzea-horizontal-magazine-bg.png',
  'double-pic-left-mask': '/data/glamour/templates/double-pic-left-mask.png',
  'silence-fashion-background': '/data/glamour/templates/silence-fashion-background.png',
  'clear-dye-icon': '/data/glamour/templates/com_icon_clear.svg'
}

export function resolveGlamourTemplateRenderAssetUrl(
  asset: GlamourTemplateRenderAsset,
  urls: GlamourTemplateRenderAssetUrlMap = GLAMOUR_TEMPLATE_RENDER_ASSET_URLS
): string {
  return urls[asset] || ''
}

export function loadGlamourTemplateImageAsset(
  asset: GlamourTemplateRenderAsset,
  url: string
): Promise<GlamourTemplateLoadedAsset | null> {
  const normalizedUrl = String(url || '').trim()

  if (!normalizedUrl) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const image = new Image()

    if (/^https?:\/\//i.test(normalizedUrl)) {
      image.crossOrigin = 'anonymous'
    }

    image.decoding = 'async'
    image.addEventListener(
      'load',
      () => {
        resolve({ id: asset, image, url: normalizedUrl })
      },
      { once: true }
    )
    image.addEventListener('error', () => resolve(null), { once: true })
    image.src = normalizedUrl
  })
}

export async function loadGlamourTemplateRenderAssets(
  assets: GlamourTemplateRenderAsset[],
  urls: GlamourTemplateRenderAssetUrlMap = GLAMOUR_TEMPLATE_RENDER_ASSET_URLS
): Promise<GlamourTemplateLoadedAssetMap> {
  const entries = await Promise.all(
    [...new Set(assets)].map(async (asset) => {
      const loaded = await loadGlamourTemplateImageAsset(
        asset,
        resolveGlamourTemplateRenderAssetUrl(asset, urls)
      )
      return loaded ? [asset, loaded] as const : null
    })
  )

  return Object.fromEntries(entries.filter(Boolean) as Array<readonly [GlamourTemplateRenderAsset, GlamourTemplateLoadedAsset]>)
}
