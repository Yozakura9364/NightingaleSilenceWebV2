import { computed, nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'
import { buildGlamourIconUrl } from '@/lib/glamour/equipment'
import {
  createGlamourTemplatePreviewRenderData,
  loadGlamourTemplateRenderAssets,
  renderGlamourTemplateCanvas,
  type GlamourTemplateCanvasImage,
  type GlamourTemplateId,
  type GlamourTemplateLoadedAssetMap,
  type GlamourTemplateRenderData
} from '@/lib/glamour/templates'
import { useTheme } from '@/stores/theme'

const fontLoadFallbackText = '幻化工房最终幻想14装备染色角色服务器NameServer日本語한국어123'
const canvasFonts: Partial<Record<GlamourTemplateId, string[]>> = {
  eorzea: [
    "500 130px 'Source Han Serif CN'",
    "500 74px 'Source Han Serif CN'",
    "500 32px 'Source Han Sans CN'",
    "400 24px 'Source Han Sans CN'"
  ],
  horizontal: ["900 100px 'HarmonyOS Sans SC'", "300 95px 'Source Sans 3'"],
  ec: [
    "400 178px 'Josefin Sans'",
    "700 41px 'Source Sans 3'",
    "400 76px 'Source Sans 3'",
    "400 76px 'NS Cambria'"
  ],
  story: ["900 62px 'Source Han Serif CN'"],
  risingstones: ["700 150px 'Noto Sans SC Variable'", "400 38px 'Noto Sans SC Variable'"],
  'silence-fashion': [
    "400 70px 'Source Han Serif CN'",
    "500 70px 'Source Han Serif CN'",
    "600 40px 'Source Han Serif CN'"
  ]
}
const silenceFashionKoCanvasFonts = [
  "400 60px 'Source Han Serif KR Local'",
  "600 50px 'Source Han Serif KR Local'",
  "400 60px 'Noto Serif CJK KR'",
  "600 50px 'Noto Serif CJK KR'",
  '400 60px Batang',
  '600 50px Batang'
]
const loadedFontKeys = new Set<string>()
const loadingFontPromises = new Map<string, Promise<void>>()

interface GlamourTemplateCanvasOptions {
  renderData: ComputedRef<GlamourTemplateRenderData>
  apiBase: ComputedRef<string>
  imageStateVersion: Ref<number>
  resolveImage: (slotId: string) => GlamourTemplateCanvasImage | null
}

export function useGlamourTemplateCanvas(options: GlamourTemplateCanvasOptions) {
  const { current: themeMode } = useTheme()
  const templateCanvasEl = ref<HTMLCanvasElement | null>(null)
  const previewRenderData = computed(() =>
    createGlamourTemplatePreviewRenderData(options.renderData.value)
  )
  const previewCanvasSize = computed(() => ({
    width: previewRenderData.value.canvas.width,
    height: previewRenderData.value.canvas.height
  }))
  const iconStateVersion = ref(0)
  const iconImages = new Map<string, HTMLImageElement | null>()
  const loadingIconKeys = new Set<string>()
  const renderAssets = ref<GlamourTemplateLoadedAssetMap>({})
  let renderAssetTaskId = 0
  let canvasDrawTaskId = 0
  let scheduledDrawFrame = 0

  watch(
    () => [
      options.renderData.value,
      options.imageStateVersion.value,
      iconStateVersion.value,
      renderAssets.value,
      themeMode.value
    ],
    () => {
      void nextTick(() => {
        scheduleTemplateCanvasDraw()
      })
    },
    { deep: true, immediate: true }
  )

  watch(
    () => options.renderData.value.requiredAssets.join('|'),
    () => {
      void loadRenderAssets()
    },
    { immediate: true }
  )

  watch(
    () => [
      options.renderData.value.template.renderMode,
      String(options.renderData.value.style.showIcons),
      options.renderData.value.rows.map((row) => String(row.item.icon || '')).join('|'),
      options.apiBase.value
    ],
    preloadIcons,
    { immediate: true }
  )

  function getIcon(iconId: number | string | undefined): GlamourTemplateCanvasImage | null {
    const key = getIconKey(iconId)
    const image = key ? iconImages.get(key) : null
    return image ? { image } : null
  }

  function getIconKey(iconId: unknown): string {
    const numericId = Number(iconId)
    return Number.isFinite(numericId) && numericId > 0 ? String(Math.trunc(numericId)) : ''
  }

  function shouldPreloadIcons(): boolean {
    const renderData = options.renderData.value
    const renderMode = renderData.template.renderMode
    return renderData.style.showIcons && (renderMode === 'ec' || renderMode === 'risingstones')
  }

  function preloadIcons() {
    if (!shouldPreloadIcons()) return

    const iconIds = Array.from(
      new Set(options.renderData.value.rows.map((row) => getIconKey(row.item.icon)).filter(Boolean))
    )
    iconIds.forEach(loadIcon)
  }

  function loadIcon(iconKey: string) {
    if (iconImages.has(iconKey) || loadingIconKeys.has(iconKey)) return

    const iconUrl = buildGlamourIconUrl(options.apiBase.value, iconKey)
    if (!iconUrl) {
      iconImages.set(iconKey, null)
      return
    }

    loadingIconKeys.add(iconKey)
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      loadingIconKeys.delete(iconKey)
      iconImages.set(iconKey, image)
      iconStateVersion.value += 1
    }
    image.onerror = () => {
      loadingIconKeys.delete(iconKey)
      iconImages.set(iconKey, null)
    }
    image.src = iconUrl
  }

  async function loadRenderAssets() {
    const taskId = ++renderAssetTaskId
    const assets = options.renderData.value.requiredAssets

    if (!assets.length) {
      renderAssets.value = {}
      return
    }

    const loadedAssets = await loadGlamourTemplateRenderAssets(assets)
    if (taskId === renderAssetTaskId) renderAssets.value = loadedAssets
  }

  async function drawTemplateCanvas() {
    const canvas = templateCanvasEl.value
    if (!canvas) return

    const renderData = previewRenderData.value
    const taskId = ++canvasDrawTaskId
    await ensureCanvasFonts(renderData)

    if (taskId !== canvasDrawTaskId || renderData !== previewRenderData.value) return

    renderCanvas(canvas, renderData)
  }

  function scheduleTemplateCanvasDraw() {
    if (scheduledDrawFrame) return

    scheduledDrawFrame = window.requestAnimationFrame(() => {
      scheduledDrawFrame = 0
      void drawTemplateCanvas()
    })
  }

  function renderCanvas(canvas: HTMLCanvasElement, renderData: GlamourTemplateRenderData) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = renderData.canvas.width
    canvas.height = renderData.canvas.height
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    renderGlamourTemplateCanvas(ctx, {
      renderData,
      resolveImage: options.resolveImage,
      resolveIcon: getIcon,
      assets: renderAssets.value
    })
  }

  async function downloadTemplateCanvas() {
    const renderData = options.renderData.value
    await ensureCanvasFonts(renderData)
    const canvas = document.createElement('canvas')
    renderCanvas(canvas, renderData)

    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `幻化模板_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  onBeforeUnmount(() => {
    if (scheduledDrawFrame) {
      window.cancelAnimationFrame(scheduledDrawFrame)
      scheduledDrawFrame = 0
    }
    canvasDrawTaskId += 1
  })

  return { templateCanvasEl, previewCanvasSize, drawTemplateCanvas, downloadTemplateCanvas }
}

function getCanvasFonts(renderData: GlamourTemplateRenderData): string[] {
  const fonts = [...(canvasFonts[renderData.templateId] || [])]
  if (renderData.templateId === 'silence-fashion' && renderData.locales.includes('ko')) {
    fonts.push(...silenceFashionKoCanvasFonts)
  }
  return Array.from(new Set(fonts))
}

function buildCanvasFontLoadText(renderData: GlamourTemplateRenderData): string {
  const parts = [
    fontLoadFallbackText,
    renderData.text.title,
    renderData.text.characterName,
    renderData.text.subtitle,
    renderData.text.bottomText
  ]

  for (const localized of renderData.localizedRows) {
    for (const row of localized.rows) {
      parts.push(row.itemName, row.dyeText)
      row.dyes.forEach((dye) => parts.push(dye.name))
    }
  }

  const chars: string[] = []
  const seen = new Set<string>()
  for (const char of parts.filter(Boolean).join('')) {
    if (/\s/.test(char) || seen.has(char)) continue
    seen.add(char)
    chars.push(char)
    if (chars.length >= 1600) break
  }

  return chars.length ? chars.join('') : fontLoadFallbackText
}

async function ensureCanvasFonts(renderData: GlamourTemplateRenderData) {
  const fontSet = document.fonts
  if (!fontSet) return

  const fonts = getCanvasFonts(renderData)
  const loadText = buildCanvasFontLoadText(renderData)
  const cacheKey = `${renderData.templateId}::${renderData.locales.join(',')}::${fonts.join('||')}::${loadText}`

  if (!fonts.length || loadedFontKeys.has(cacheKey)) {
    loadedFontKeys.add(cacheKey)
    return
  }

  let promise = loadingFontPromises.get(cacheKey)
  if (!promise) {
    promise = Promise.all(fonts.map((font) => fontSet.load(font, loadText).catch(() => [])))
      .then(() => {
        loadedFontKeys.add(cacheKey)
      })
      .finally(() => loadingFontPromises.delete(cacheKey))
    loadingFontPromises.set(cacheKey, promise)
  }

  await promise
}
