import type { NSPlateInfoPresetId } from '@/lib/plate/infoLayerFields'
import {
  NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT,
  getNSPlateInfoActiveLayers,
  normalizeNSPlateInfoDraft,
  type NSPlateInfoDraft
} from '@/lib/plate/infoLayers'
import {
  resolveNSPlateInfoTextAdaptiveColor,
  type NSPlateInfoTextAdaptiveColorSource
} from '@/lib/plate/infoTextAdaptiveColor'
import type { NSPlateAssetGroup, NSPlateAssetSummary } from '@/lib/plate/types'

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

export const nsPlateInfoTextRenderDefinitions = {
  international: [
    textLayer('text-1', '称号', 'Endwalker', 'AXIS', 'light', 'left', 579, 308, 23, {
      renderEffect: 'shadowGray',
      positionBySide: sameSide(579, 308),
      kerningVA: -10,
      adaptiveColorSource: 'nameplateHeaderThenBase',
      adaptiveColorFont1: '#94cec7',
      adaptiveColorFont2: '#614133'
    }),
    textLayer(
      'text-2',
      '角色名',
      'Warrior Light',
      'Trump Gothic Pro',
      'regular',
      'left',
      579,
      344,
      48,
      {
        renderEffect: 'shadowGray',
        positionBySide: sameSide(579, 344),
        kerningVA: 25,
        scaleXPercent: 110,
        scaleYPercent: 94,
        adaptiveColorSource: 'nameplateHeaderThenBase'
      }
    ),
    textLayer('text-3', '服务器', 'Hades [Mana]', 'AXIS', 'light', 'right', 1942, 319, 27, {
      positionBySide: sameSide(1942, 319),
      kerningVA: -35,
      scaleYPercent: 97,
      strokeEnabled: true,
      strokeWidth: 2,
      strokeColor: '#b2923e',
      inlineIconPath: 'ui/sprites/worldtransrate_4.png',
      inlineIconWidth: 50,
      inlineIconHeight: 42,
      inlineIconGap: 8,
      adaptiveColorSource: 'none'
    }),
    textLayer('text-4', '等级', 'LEVEL  100', 'Miedinger', 'regular', 'left', 707, 435, 26, {
      positionBySide: splitSide(707, 435, 1287, 435),
      kerningVA: 25
    }),
    textLayer('text-5', '英文职业名', 'Paladin', 'Jupiter Pro', 'regular', 'left', 703, 465, 55, {
      positionBySide: splitSide(703, 465, 1283, 465),
      smallCaps: true,
      kerningVA: -37,
      scaleXPercent: 85
    }),
    textLayer('text-6', '职业名', 'ナイト', 'AXIS', 'regular', 'left', 703, 492, 24, {
      positionBySide: splitSide(703, 492, 1283, 492),
      kerningVA: -100,
      scaleYPercent: 97,
      followLayerId: 'text-5',
      followXGap: 0
    }),
    textLayer('text-8', '军衔名称', '大闘士', 'AXIS', 'regular', 'left', 703, 567, 27, {
      positionBySide: splitSide(703, 567, 1283, 567),
      kerningVA: -75
    }),
    textLayer('text-7', '部队名称', 'The Seventh Dawn', 'AXIS', 'regular', 'left', 703, 649, 27, {
      positionBySide: splitSide(703, 649, 1283, 649),
      kerningVA: -10
    }),
    textLayer(
      'text-9',
      '个性签名',
      '降り注ぐ星は悲しみ 海を濁らせるのは嘆き',
      'AXIS',
      'regular',
      'left',
      594,
      976,
      24,
      {
        positionBySide: splitSide(594, 976, 1174, 976),
        kerningVA: -75,
        scaleXPercent: 95,
        scaleYPercent: 97
      }
    ),
    textLayer(
      'text-10',
      '作息数字',
      '0:00                                       12:00',
      'Trump Gothic Pro',
      'regular',
      'left',
      702,
      723,
      48,
      {
        positionBySide: splitSide(702, 723, 1282, 723),
        kerningVA: 3,
        scaleXPercent: 110,
        scaleYPercent: 94
      }
    ),
    textLayer('text-11', '作息文字', '平日\n休日', 'AXIS', 'medium', 'left', 611, 780, 24, {
      positionBySide: splitSide(611, 780, 1191, 780),
      lineHeightMode: 'manual',
      lineHeight: 2,
      kerningVA: -75,
      scaleYPercent: 97
    })
  ],
  china: [
    textLayer('text-1', '称号', '终途行者', 'Adobe Heiti Std', 'light', 'left', 579, 308, 23, {
      renderEffect: 'shadowGray',
      positionBySide: sameSide(579, 308),
      kerningVA: -10,
      adaptiveColorSource: 'nameplateHeaderThenBase',
      adaptiveColorFont1: '#94cec7',
      adaptiveColorFont2: '#614133'
    }),
    textLayer('text-2', '角色名', '光之战士', 'Adobe Heiti Std', 'regular', 'left', 579, 344, 24, {
      renderEffect: 'shadowGray',
      positionBySide: sameSide(579, 344),
      kerningVA: 25,
      adaptiveColorSource: 'nameplateHeaderThenBase'
    }),
    textLayer('text-3', '服务器', '神意之地', 'Adobe Heiti Std', 'light', 'right', 1942, 319, 26, {
      positionBySide: sameSide(1942, 319),
      kerningVA: -35,
      strokeEnabled: true,
      strokeWidth: 2,
      strokeColor: '#b2923e',
      inlineIconPath: 'ui/sprites/worldtransrate_4.png',
      inlineIconWidth: 50,
      inlineIconHeight: 42,
      inlineIconGap: 8,
      adaptiveColorSource: 'none'
    }),
    textLayer('text-4', '等级', '100级', 'Adobe Heiti Std', 'regular', 'left', 707, 435, 26, {
      positionBySide: splitSide(707, 435, 1287, 435),
      kerningVA: 25
    }),
    textLayer('text-6', '职业名', '骑士', 'Adobe Heiti Std', 'regular', 'left', 702, 486, 44, {
      positionBySide: splitSide(702, 486, 1283, 486),
      kerningVA: -75
    }),
    textLayer('text-8', '军衔名称', '正耀尉', 'Adobe Heiti Std', 'regular', 'left', 703, 567, 27, {
      positionBySide: splitSide(703, 567, 1283, 567),
      kerningVA: -75
    }),
    textLayer(
      'text-7',
      '部队名称',
      '拂晓血盟',
      'Adobe Heiti Std',
      'regular',
      'left',
      703,
      649,
      27,
      {
        positionBySide: splitSide(703, 649, 1283, 649),
        kerningVA: -10
      }
    ),
    textLayer(
      'text-9',
      '个性签名',
      '繁星犹如泪水飞落 哀叹令大海不再清澈',
      'Adobe Heiti Std',
      'regular',
      'left',
      594,
      976,
      24,
      {
        positionBySide: splitSide(594, 976, 1174, 976),
        kerningVA: -75
      }
    ),
    textLayer(
      'text-10',
      '作息数字',
      '0:00                                   12:00',
      'Adobe Heiti Std',
      'regular',
      'left',
      702,
      723,
      32,
      {
        positionBySide: splitSide(702, 723, 1282, 723),
        kerningVA: 25,
        scaleYPercent: 95
      }
    ),
    textLayer('text-11', '作息文字', '工作日\n休息日', 'AXIS', 'medium', 'left', 611, 780, 24, {
      positionBySide: splitSide(611, 780, 1191, 780),
      lineHeightMode: 'manual',
      lineHeight: 2,
      kerningVA: -75,
      scaleYPercent: 97
    })
  ],
  'phantom-tide': [
    textLayer(
      'text-1',
      '中文标题',
      '其他游戏角色@九号解决方案',
      'HarmonyOS Sans SC',
      'regular',
      'left',
      737,
      510,
      40,
      {
        positionBySide: splitSide(737, 510, 1330, 510),
        lineHeight: 1.08,
        color: '#000000'
      }
    ),
    textLayer('text-2', '英文标题', 'Paladin', 'Eofont SP', 'regular', 'left', 737, 435, 60, {
      positionBySide: splitSide(737, 435, 1335, 435),
      smallCaps: true,
      scaleXPercent: 85,
      color: '#000000'
    }),
    textLayer(
      'text-3',
      '文案1',
      '关于我：\n高难/战场/钓鱼/剧情/拍照/幻化/……\n常驻体型……\n空间浓度……\n成分有……',
      'HarmonyOS Sans SC',
      'regular',
      'left',
      739,
      638,
      30,
      {
        positionBySide: splitSide(739, 638, 1332, 638),
        color: '#000000'
      }
    ),
    textLayer(
      'text-4',
      '文案2',
      '其他补充：\n脾气很好……\nXXX全肯定bot……\n我雷……\n欢迎……',
      'HarmonyOS Sans SC',
      'regular',
      'left',
      739,
      887,
      30,
      {
        positionBySide: splitSide(739, 887, 1332, 887),
        color: '#000000'
      }
    )
  ]
} satisfies Record<NSPlateInfoPresetId, NSPlateInfoTextRenderDefinition[]>

export const nsPlateInfoGraphicRenderDefinitions = {
  international: createSharedProfileGraphicRenderDefinitions(),
  china: createSharedProfileGraphicRenderDefinitions(),
  'phantom-tide': [
    iconLayer('icon-1', '职业图标', '职业图标', '水晶-骑士.png', 1200, 435, {
      positionBySide: splitSide(600, 435, 1200, 435),
      scale: 0.5
    }),
    iconLayer('icon-2', '装饰图标1', '装饰图标', '234001_hr1.png', 642, 620, {
      positionBySide: splitSide(642, 620, 1200, 620),
      sizeMode: 'fixed',
      targetSize: 84
    }),
    iconLayer('icon-3', '装饰图标2', '装饰图标', '234002_hr1.png', 642, 869, {
      positionBySide: splitSide(642, 869, 1200, 869),
      sizeMode: 'fixed',
      targetSize: 84
    })
  ]
} satisfies Record<NSPlateInfoPresetId, NSPlateInfoGraphicRenderDefinition[]>

export function createNSPlateInfoTextRenderLayers(
  draft: NSPlateInfoDraft | null | undefined,
  side: NSPlateInfoRenderSide,
  selectedByCategory?: Map<string, NSPlateAssetSummary>
): NSPlateInfoTextRenderLayer[] {
  if (!draft) {
    return []
  }

  const normalized = normalizeNSPlateInfoDraft(draft)
  const stateBySlotId = new Map(
    getNSPlateInfoActiveLayers(normalized).map((item) => [item.definition.slotId, item.state])
  )
  const definitions = nsPlateInfoTextRenderDefinitions[normalized.activePresetId]

  return definitions
    .map((definition) => {
      const state = stateBySlotId.get(definition.slotId)

      if (!state || state.type !== 'text' || !state.enabled || state.text.length === 0) {
        return null
      }

      const position = definition.positionBySide[side]

      return {
        ...definition,
        text: state.text,
        color: resolveNSPlateInfoTextAdaptiveColor(definition, selectedByCategory),
        x: position.x,
        y: position.y
      } satisfies NSPlateInfoTextRenderLayer
    })
    .filter((layer): layer is NSPlateInfoTextRenderLayer => layer !== null)
}

export function createNSPlateInfoGraphicRenderLayers(
  draft: NSPlateInfoDraft | null | undefined,
  side: NSPlateInfoRenderSide,
  assetGroups: NSPlateAssetGroup[]
): NSPlateInfoGraphicRenderLayer[] {
  if (!draft) {
    return []
  }

  const normalized = normalizeNSPlateInfoDraft(draft)
  const stateBySlotId = new Map(
    getNSPlateInfoActiveLayers(normalized).map((item) => [item.definition.slotId, item.state])
  )
  const definitions = nsPlateInfoGraphicRenderDefinitions[normalized.activePresetId]

  return definitions
    .map((definition) => {
      const state = stateBySlotId.get(definition.slotId)

      if (!state || !state.enabled) {
        return null
      }

      const position = definition.positionBySide[side]

      if (definition.type === 'fixed') {
        if (state.type !== 'fixed') {
          return null
        }

        const path = state.path || definition.path
        const source = createInfoFixedGraphicSource(path)

        return source
          ? ({
              ...definition,
              path,
              x: position.x,
              y: position.y,
              source
            } satisfies NSPlateInfoFixedRenderLayer)
          : null
      }

      if (definition.type === 'bar48') {
        if (state.type !== 'bar48') {
          return null
        }

        const emptySource = createInfoFixedGraphicSource(definition.emptyPath)
        const fillSource = createInfoFixedGraphicSource(definition.fillPath)

        return emptySource
          ? ({
              ...definition,
              x: position.x,
              y: position.y,
              states: state.states.slice(0, NSPLATE_INFO_BAR48_COUNT),
              emptySource,
              fillSource
            } satisfies NSPlateInfoBar48RenderLayer)
          : null
      }

      if (definition.type === 'special') {
        if (state.type !== 'special') {
          return null
        }

        const bgItemId = state.bgItemId || definition.bgItemId
        const maskItemId = state.maskItemId || definition.maskItemId
        const symbolItemId = state.symbolItemId || definition.symbolItemId
        const symbol = resolveInfoGraphicSourceByItemId(
          NSPLATE_INFO_SPECIAL_SYMBOL_CATEGORY,
          symbolItemId,
          assetGroups
        )

        if (!symbol) {
          return null
        }

        return {
          ...definition,
          x: position.x,
          y: position.y,
          bgItemId,
          maskItemId,
          symbolItemId,
          maskDarkColor: state.maskDarkColor || definition.maskDarkColor,
          maskLightColor: state.maskLightColor || definition.maskLightColor,
          background: bgItemId
            ? resolveInfoGraphicSourceByItemId(
                NSPLATE_INFO_SPECIAL_BG_CATEGORY,
                bgItemId,
                assetGroups
              )
            : null,
          mask: maskItemId
            ? resolveInfoGraphicSourceByItemId(
                NSPLATE_INFO_SPECIAL_MASK_CATEGORY,
                maskItemId,
                assetGroups
              )
            : null,
          symbol
        } satisfies NSPlateInfoSpecialRenderLayer
      }

      if (state.type !== 'icon') {
        return null
      }

      const itemIds = resolveInfoIconRenderItemIds(definition, state)
      const items = itemIds
        .map((itemId) =>
          resolveInfoGraphicSourceByItemId(definition.sourceCat, itemId, assetGroups)
        )
        .filter((item): item is NSPlateInfoGraphicSource => item !== null)

      if (!items.length) {
        return null
      }

      return {
        ...definition,
        itemId: itemIds[0] ?? '',
        itemIds,
        x: position.x,
        y: position.y,
        items
      } satisfies NSPlateInfoIconRenderLayer
    })
    .filter((layer): layer is NSPlateInfoGraphicRenderLayer => layer !== null)
}

export function getNSPlateInfoTextRenderSignature(draft: NSPlateInfoDraft | null | undefined) {
  if (!draft) {
    return ''
  }

  const normalized = normalizeNSPlateInfoDraft(draft)
  return [
    normalized.activePresetId,
    ...getNSPlateInfoActiveLayers(normalized).map((item) =>
      [
        item.definition.slotId,
        item.state.type,
        item.state.enabled ? '1' : '0',
        item.state.type === 'text' ? item.state.text : ''
      ].join(':')
    )
  ].join('|')
}

export function getNSPlateInfoGraphicAssetSignature(assetGroups: NSPlateAssetGroup[]) {
  return assetGroups
    .filter((group) => group.scope === 'nameplate')
    .map((group) =>
      [
        group.category,
        group.assets.length,
        ...group.assets.map((asset) =>
          [asset.id, asset.imageUrl ?? '', asset.previewUrl ?? '', asset.file, asset.path].join('@')
        )
      ].join(':')
    )
    .join('|')
}

function textLayer(
  slotId: string,
  legacyName: string,
  defaultText: string,
  fontFamily: string,
  fontVariant: string,
  align: NSPlateInfoTextAlign,
  x: number,
  y: number,
  fontSize: number,
  options: Partial<NSPlateInfoTextRenderDefinition>
): NSPlateInfoTextRenderDefinition {
  return {
    slotId,
    legacyName,
    defaultText,
    fontFamily,
    fontVariant,
    bold: false,
    italic: false,
    smallCaps: false,
    renderEffect: 'none',
    align,
    x,
    y,
    positionBySide: sameSide(x, y),
    fontSize,
    lineHeightMode: 'auto',
    lineHeight: 1.2,
    tracking: 0,
    kerningVA: 0,
    scaleXPercent: 100,
    scaleYPercent: 100,
    baselineShift: 0,
    color: '#ffffff',
    opacity: 1,
    ...options
  }
}

function createSharedProfileGraphicRenderDefinitions(): NSPlateInfoGraphicRenderDefinition[] {
  return [
    iconLayer('icon-1', '职业图标', '职业图标', '铭牌-骑士.png', 581, 425, {
      positionBySide: splitSide(581, 425, 1160, 425),
      sizeMode: 'fixed',
      targetSize: 112
    }),
    iconLayer('icon-4', '军衔', '军衔图标', '083111', 597, 540, {
      positionBySide: splitSide(597, 540, 1177, 540),
      sizeMode: 'fixed',
      targetSize: 81
    }),
    specialLayer('special-1', '部队队徽', 597, 620, {
      positionBySide: splitSide(597, 620, 1177, 620)
    }),
    fixedLayer('fixed-1', '时间图标', 'ui/sprites/CharacterCard_1.png', 615, 722, 41, 41, {
      positionBySide: splitSide(615, 722, 1195, 722)
    }),
    bar48Layer('bar-1', '作息选择', 727, 770, {
      positionBySide: splitSide(727, 770, 1307, 770)
    }),
    fixedLayer('fixed-2', '个签图标', 'ui/sprites/CharacterCard_2.png', 618, 890, 40, 43, {
      positionBySide: splitSide(618, 890, 1198, 890)
    }),
    iconLayer('icon-2', '活动图标', NSPLATE_INFO_ACTIVITY_ICON_CATEGORY, '', 700, 880, {
      itemIds: [],
      positionBySide: splitSide(700, 880, 1280, 880),
      sizeMode: 'fixed',
      targetSize: NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX,
      isActivity: true
    })
  ]
}

function iconLayer(
  slotId: string,
  legacyName: string,
  sourceCat: string,
  itemId: string,
  x: number,
  y: number,
  options: Partial<NSPlateInfoIconRenderDefinition>
): NSPlateInfoIconRenderDefinition {
  return {
    slotId,
    legacyName,
    type: 'icon',
    sourceCat,
    itemId,
    itemIds: [],
    x,
    y,
    positionBySide: sameSide(x, y),
    scale: 1,
    opacity: 1,
    ...options
  }
}

function fixedLayer(
  slotId: string,
  legacyName: string,
  path: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<NSPlateInfoFixedRenderDefinition>
): NSPlateInfoFixedRenderDefinition {
  return {
    slotId,
    legacyName,
    type: 'fixed',
    path,
    x,
    y,
    width,
    height,
    positionBySide: sameSide(x, y),
    opacity: 1,
    ...options
  }
}

function specialLayer(
  slotId: string,
  legacyName: string,
  x: number,
  y: number,
  options: Partial<NSPlateInfoSpecialRenderDefinition>
): NSPlateInfoSpecialRenderDefinition {
  return {
    slotId,
    legacyName,
    type: 'special',
    bgItemId: '',
    maskItemId: '',
    symbolItemId: NSPLATE_INFO_SPECIAL_DEFAULT_SYMBOL_ITEM_ID,
    maskDarkColor: '#5f3c22',
    maskLightColor: '#f6d9a7',
    x,
    y,
    positionBySide: sameSide(x, y),
    sizeMode: 'fixed',
    targetSize: 80,
    scale: 1,
    opacity: 1,
    ...options
  }
}

function bar48Layer(
  slotId: string,
  legacyName: string,
  x: number,
  y: number,
  options: Partial<NSPlateInfoBar48RenderDefinition>
): NSPlateInfoBar48RenderDefinition {
  return {
    slotId,
    legacyName,
    type: 'bar48',
    x,
    y,
    columns: NSPLATE_INFO_BAR48_DEFAULT_COLUMNS,
    cellWidth: 20,
    cellHeight: 44,
    gapX: 4,
    gapY: 4,
    emptyPath: 'ui/sprites/CharacterCard_3.png',
    fillPath: 'ui/sprites/CharacterCard_4.png',
    positionBySide: sameSide(x, y),
    opacity: 1,
    ...options
  }
}

export function getNSPlateInfoBar48Bounds(layer: {
  columns: number
  cellWidth: number
  cellHeight: number
  gapX: number
  gapY: number
}): NSPlateInfoBar48Bounds {
  const columns = Math.max(1, Math.min(NSPLATE_INFO_BAR48_COUNT, Number(layer.columns) || 1))
  const cellWidth = Math.max(1, Number(layer.cellWidth) || 1)
  const cellHeight = Math.max(1, Number(layer.cellHeight) || 1)
  const gapX = Math.max(0, Number(layer.gapX) || 0)
  const gapY = Math.max(0, Number(layer.gapY) || 0)
  const rows = Math.max(1, Math.ceil(NSPLATE_INFO_BAR48_COUNT / columns))
  const splitCol = Math.floor(columns / 2)
  const hasCenterGap = columns === NSPLATE_INFO_BAR48_DEFAULT_COLUMNS && splitCol > 0
  const centerGapPx = hasCenterGap
    ? Math.max(
        0,
        Math.round(
          NSPLATE_INFO_BAR48_CENTER_GAP_BASE_PX *
            (cellWidth / NSPLATE_INFO_BAR48_BASE_CELL_WIDTH_PX)
        )
      )
    : 0
  const width = columns * cellWidth + Math.max(0, columns - 1) * gapX + centerGapPx
  const height = rows * cellHeight + Math.max(0, rows - 1) * gapY

  return {
    columns,
    rows,
    splitCol,
    centerGapPx,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height))
  }
}

function resolveInfoIconRenderItemIds(
  definition: NSPlateInfoIconRenderDefinition,
  state: { itemId: string; itemIds: string[] }
) {
  const source =
    definition.isActivity || definition.sourceCat === NSPLATE_INFO_ACTIVITY_ICON_CATEGORY
      ? state.itemIds.length > 0
        ? state.itemIds
        : state.itemId
          ? [state.itemId]
          : definition.itemIds.length > 0
            ? definition.itemIds
            : definition.itemId
              ? [definition.itemId]
              : []
      : [state.itemId || definition.itemId].filter((itemId) => itemId.length > 0)

  return Array.from(new Set(source.map((itemId) => itemId.trim()).filter(Boolean))).slice(
    0,
    NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT
  )
}

function resolveInfoGraphicSourceByItemId(
  sourceCat: string,
  itemId: string,
  assetGroups: NSPlateAssetGroup[]
): NSPlateInfoGraphicSource | null {
  const asset = findInfoGraphicAsset(sourceCat, itemId, assetGroups)
  const url = asset?.imageUrl ?? asset?.previewUrl ?? ''

  if (!asset || !url) {
    return null
  }

  return {
    label: asset.label || itemId,
    url,
    asset
  }
}

function findInfoGraphicAsset(
  sourceCat: string,
  itemId: string,
  assetGroups: NSPlateAssetGroup[]
): NSPlateAssetSummary | null {
  const exactToken = itemId.trim()

  if (!exactToken) {
    return null
  }

  const assets = assetGroups
    .filter((group) => group.scope === 'nameplate' && group.category === sourceCat)
    .flatMap((group) => group.assets)

  for (const asset of assets) {
    if (String(asset.raw.id ?? '') === exactToken) {
      return asset
    }
  }

  const lookupToken = normalizeInfoItemLookupToken(exactToken)

  if (!lookupToken) {
    return null
  }

  for (const asset of assets) {
    const tokens = [asset.raw.id, asset.raw.file, asset.raw.path, asset.file, asset.path]

    if (tokens.some((token) => normalizeInfoItemLookupToken(token) === lookupToken)) {
      return asset
    }
  }

  return null
}

function createInfoFixedGraphicSource(path: string): NSPlateInfoGraphicSource | null {
  const normalizedPath = normalizeInfoAssetPath(path)

  if (!normalizedPath) {
    return null
  }

  return {
    label: normalizedPath.split('/').pop() ?? normalizedPath,
    url: isAbsoluteInfoAssetUrl(normalizedPath) ? normalizedPath : `/img/${normalizedPath}`
  }
}

function normalizeInfoItemLookupToken(raw: unknown) {
  const source = String(raw ?? '').trim()

  if (!source) {
    return ''
  }

  if (/^\d{6}$/.test(source)) {
    return source
  }

  const normalizedPath = source.replace(/\\/g, '/')
  const rawBase = normalizedPath.split('/').pop() || normalizedPath
  let base = rawBase

  try {
    base = decodeURIComponent(rawBase)
  } catch {
    base = rawBase
  }

  const numeric = base.match(/^(\d{6})(?:_[^./\\]+)?(?:\.[A-Za-z0-9]+)?$/)

  if (numeric) {
    return numeric[1]
  }

  return base.toLowerCase()
}

function normalizeInfoAssetPath(raw: unknown) {
  const value = String(raw ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/^\/+/, '')

  const lower = value.toLowerCase()
  const uiIndex = lower.lastIndexOf('/ui/')

  return uiIndex >= 0 ? value.slice(uiIndex + 1).replace(/^\/+/, '') : value
}

function isAbsoluteInfoAssetUrl(value: string) {
  return /^(https?:)?\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value)
}

function sameSide(x: number, y: number): Record<NSPlateInfoRenderSide, NSPlateInfoLayerPoint> {
  return {
    right: { x, y },
    left: { x, y }
  }
}

function splitSide(
  rightX: number,
  rightY: number,
  leftX: number,
  leftY: number
): Record<NSPlateInfoRenderSide, NSPlateInfoLayerPoint> {
  return {
    right: { x: rightX, y: rightY },
    left: { x: leftX, y: leftY }
  }
}
