export const TEMPLATE_COPYRIGHT_BASE_END_YEAR = 2026
export const TEMPLATE_COPYRIGHT_END_YEAR = Math.max(TEMPLATE_COPYRIGHT_BASE_END_YEAR, new Date().getFullYear())

export const EC_TEMPLATE_SOURCE_SIZE = 3840
export const EC_TEMPLATE_COLORS = {
  background: '#202020',
  accent: '#fb4b4e',
  text: '#c7c1bd',
  textDim: '#b8b1ac',
  line: '#303030',
  placeholder: '#ffffff',
  row: '#282828',
  rowDeep: '#242424'
}
export const EC_ITEM_RARITY_COLORS: Record<number, string> = {
  1: '#e8e8e8',
  2: '#c4ffc8',
  3: '#5c93ff',
  4: '#b78aff',
  7: '#e08abd'
}
export const EC_TEMPLATE_TITLE = { x: 1010, y: 298, width: 1830, height: 185, maxSize: 178, minSize: 86, tracking: -20 }
export const EC_TEMPLATE_SUBTITLE = { x: 1413, y: 522, width: 1028, height: 77, maxSize: 66, minSize: 34 }
export const EC_TEMPLATE_EQUIPMENT_HEADER = {
  label: { x: 2022, y: 696, width: 320, height: 50 },
  line: { x: 2264, y: 714, width: 1364, height: 9 },
  labelSize: 44,
  labelLineGap: 34
}
export const EC_TEMPLATE_COPYRIGHT = {
  x: 1110,
  y: 3584,
  width: 1606,
  height: 93,
  titleSize: 40,
  textSize: 36,
  lineY: [23, 68]
}
export const EC_TEMPLATE_CORNER_MARKS = [
  { x: 99, y: 45, size: 104 },
  { x: 3639, y: 3692, size: 104 }
]
export const CLEAR_DYE_ICON_ASSET = 'clear-dye-icon'

export const EORZEA_TEMPLATE = {
  sourceSize: 3840,
  maskFill: '#ffffff',
  textColor: '#252525',
  titleMask: { x: 3180, y: 838, width: 520, height: 145 },
  titleText: { right: 3690, baselineY: 908, width: 520, maxSize: 130, minSize: 72 },
  titleTracking: -177,
  itemNameTracking: -50,
  layouts: {
    roomy: {
      rowY: [1797, 2125, 2453, 2781, 3109],
      nameX: 2877,
      nameWidth: 810,
      nameSize: 74,
      lineHeight: 88,
      dyeX: [3009, 3359],
      dyeYOffset: 95,
      dyeWidth: 332,
      dyeHeight: 56,
      dyeRadius: 9,
      dyeTextWidth: 226,
      dyeTextXOffset: 69,
      dyeTextYOffset: 12,
      dyeFontSize: 32
    },
    sixRows: {
      rowY: [1706, 2008, 2310, 2613, 2915, 3217],
      nameX: 2877,
      nameWidth: 810,
      nameSize: 74,
      lineHeight: 88,
      dyeX: [3009, 3359],
      dyeYOffset: 95,
      dyeWidth: 332,
      dyeHeight: 56,
      dyeRadius: 9,
      dyeTextWidth: 226,
      dyeTextXOffset: 69,
      dyeTextYOffset: 12,
      dyeFontSize: 32
    },
    compact: {
      rowY: [1689, 1948, 2206, 2465, 2723, 2981, 3240],
      nameX: 2952,
      nameWidth: 731,
      nameSize: 67,
      lineHeight: 80,
      dyeX: [3071, 3387],
      dyeYOffset: 86,
      dyeWidth: 299,
      dyeHeight: 51,
      dyeRadius: 8,
      dyeTextWidth: 204,
      dyeTextXOffset: 63,
      dyeTextYOffset: 10,
      dyeFontSize: 32
    }
  }
}

export const DOUBLE_PIC_TEMPLATE = {
  sourceWidth: 2968,
  sourceHeight: 3958,
  background: '#fefefe',
  frameBlack: '#000000',
  frameWhite: '#f8f8f8',
  fontWeight: 900,
  fontFamily: '"Source Han Serif CN", "Noto Serif CJK SC", "Microsoft YaHei", serif',
  equipment: {
    x: 1469,
    y: 3115,
    width: 1098,
    height: 676,
    maxFontSize: 62,
    lineHeightRatio: 1.54,
    underlineOffsetRatio: 1.13,
    underlineWidth: 4,
    outerGlowColor: '#000000',
    outerGlowOpacity: 0.62,
    outerGlowSpread: 0.19,
    outerGlowSize: 24
  },
  copyright: {
    text: '©SQUARE ENIX',
    rect: { x: 1090, y: 3868, width: 758, height: 72 },
    maxFontSize: 48,
    minFontSize: 36
  }
}

export const EC_TEMPLATE_LAYOUTS = {
  normal: {
    maxRows: 6,
    rowY: [802, 1065, 1328, 1591, 1854, 2117],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 246,
    rowRadius: 34,
    iconX: 2036,
    iconYOffset: 23,
    iconSize: 200,
    iconRadius: 16,
    nameX: 2288,
    nameWidth: 1320,
    nameHeight: 68,
    nameSize: 64,
    nameMinSize: 48,
    nameWeight: 700,
    dyeYOffset: 127,
    dyeHeight: 88,
    dyeRadius: 38,
    dyeFontSize: 41,
    dyeDotSize: 39,
    dyeDotXOffset: 36,
    dyeTextXOffset: 95,
    dyeTextYOffset: 21,
    dyeGap: 34,
    dyes: [
      { x: 2288, minWidth: 256 },
      { x: 2612, minWidth: 286 }
    ]
  },
  dense: {
    maxRows: 10,
    rowY: [780, 1016, 1252, 1488, 1724, 1960, 2196, 2432, 2668, 2904],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 216,
    rowRadius: 30,
    iconX: 2034,
    iconYOffset: 20,
    iconSize: 176,
    iconRadius: 14,
    nameX: 2255,
    nameWidth: 1360,
    nameHeight: 60,
    nameSize: 56,
    nameMinSize: 42,
    nameWeight: 700,
    dyeYOffset: 112,
    dyeHeight: 77,
    dyeRadius: 33,
    dyeFontSize: 36,
    dyeDotSize: 34,
    dyeDotXOffset: 32,
    dyeTextXOffset: 84,
    dyeTextYOffset: 18,
    dyeGap: 34,
    dyes: [
      { x: 2255, minWidth: 256 },
      { x: 2612, minWidth: 286 }
    ]
  },
  compact: {
    maxRows: 14,
    rowY: [760, 948, 1136, 1324, 1512, 1700, 1888, 2076, 2264, 2452, 2640, 2828, 3016, 3204],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 185,
    rowRadius: 26,
    iconX: 2032,
    iconYOffset: 18,
    iconSize: 150,
    iconRadius: 13,
    nameX: 2219,
    nameWidth: 1390,
    nameHeight: 56,
    nameSize: 49,
    nameMinSize: 36,
    nameWeight: 700,
    dyeYOffset: 96,
    dyeHeight: 67,
    dyeRadius: 29,
    dyeFontSize: 31,
    dyeDotSize: 30,
    dyeDotXOffset: 28,
    dyeTextXOffset: 72,
    dyeTextYOffset: 16,
    dyeGap: 34,
    dyes: [
      { x: 2219, minWidth: 256 },
      { x: 2612, minWidth: 286 }
    ]
  }
}

export const RISINGSTONES_TEMPLATE = {
  sourceSize: 3840,
  background: '#ffffff',
  backgroundStrokeWidth: 5,
  borderColor: '#555555',
  imageRegion: { x: 148, y: 243, width: 1915, height: 3402 },
  imageRadius: 44,
  imageStrokeWidth: 0,
  imagePlaceholder: '#a3a3a3',
  avatarRegion: { x: 3280, y: 323, width: 389, height: 390 },
  avatarRadius: 0,
  avatarStrokeWidth: 0,
  title: { x: 2129, y: 333, width: 1010, height: 144, maxSize: 150, minSize: 72 },
  author: { x: 2145, y: 552, width: 451, height: 61, maxSize: 60, minSize: 34 },
  source: { x: 2145, y: 641, width: 1060, height: 57, maxSize: 60, minSize: 32 },
  sourceText: '最终幻想14 - FINAL FANTASY XIV',
  showMeta: false,
  meta: [
    { x: 2164, y: 1739, width: 336, height: 57, key: 'race' },
    { x: 2681, y: 1739, width: 179, height: 57, key: 'job' },
    { x: 3038, y: 1745, width: 198, height: 47, key: 'id' }
  ],
  equipment: {
    maxRows: 10,
    rowStartY: 831,
    rowStep: 297,
    rowBottom: 3535,
    rowX: 2113,
    rowWidth: 1568,
    rowHeight: 247,
    rowRadius: 40,
    iconX: 2132,
    iconYOffset: 23,
    iconSize: 200,
    iconRadius: 14,
    nameX: 2379,
    nameWidth: 700,
    nameYOffset: 44,
    nameHeight: 75,
    nameSize: 72,
    nameMinSize: 40,
    nameWeight: 400,
    fontFamily: '"Noto Sans SC Variable", "HarmonyOS Sans SC", "Source Han Sans CN", "Microsoft YaHei", sans-serif',
    dyeYOffset: 135,
    dyeHeight: 72,
    dyeFontSize: 52,
    dyeMinFontSize: 28,
    dyeDotSize: 51,
    dyeDotRadius: 10,
    dyeDotStrokeWidth: 1,
    dyeDotXOffset: 12,
    dyeTextXOffset: 77,
    dyeTextYOffset: 145,
    dyeTextHeight: 52,
    dyeTextWidth: 133,
    dyeTextRightPadding: 12,
    dyeGap: 30,
    dyes: [
      { x: 2374, minWidth: 287 },
      { x: 2691, minWidth: 287 }
    ]
  },
  textColor: '#2d2d2d',
  textDim: '#2d2d2d',
  accent: '#c3a769',
  dyeText: '#2d2d2d',
  copyright: {
    x: 2275,
    y: 3535,
    width: 1215,
    height: 110,
    lines: [
      'ff14risingstones - 石之家 X 光之收藏家',
      `© 2010-${Math.max(2026, new Date().getFullYear())} SQUARE ENIX CO., LTD. All Rights Reserved.`
    ]
  }
}

export const SILENCE_FASHION_TEMPLATE = {
  sourceSize: 3000,
  textColor: '#161616',
  serifFamily: '"Source Han Serif CN", "Noto Serif CJK KR", "Noto Serif KR", Batang, "Malgun Gothic", "Songti SC", SimSun, serif',
  koSerifFamily: '"Source Han Serif KR Local", "Noto Serif CJK KR", "Noto Serif KR", Batang, AppleMyungjo, "Source Han Serif CN", "Malgun Gothic", serif',
  equipmentBottom: 2650,
  equipmentRight: 2760,
  imageRegion: { x: 171, y: 126, width: 1545, height: 2748 },
  avatarRegion: { x: 2434, y: 179, width: 318, height: 318 },
  character: { x: 1773, y: 209, width: 640, size: 48, minSize: 28, weight: 400 },
  title: { x: 1778, y: 288, width: 760, size: 58, minSize: 32, weight: 500 },
  zh: {
    maxRows: 99,
    itemX: 1788,
    dyeX: 1788,
    width: 620,
    y: 725,
    bottom: 2650,
    rowStep: 160,
    itemSize: 60,
    dyeSize: 48,
    itemLineHeight: 72,
    dyeLineHeight: 58,
    groupGap: 42,
    weight: 600,
    dyeYOffset: 50
  },
  enJa: {
    maxRows: 99,
    itemX: 1787,
    dyeX: 1785,
    width: 760,
    y: 726,
    bottom: 2650,
    rowStep: 245,
    jaSize: 45,
    enSize: 45,
    dyeSize: 36,
    jaLineHeight: 54,
    enLineHeight: 54,
    dyeLineHeight: 43,
    lineGap: 8,
    groupGap: 66,
    weight: 600
  }
}

export const HORIZONTAL_TEMPLATE = {
  sourceWidth: 4846,
  sourceHeight: 3635,
  textColor: '#383838',
  lineColors: ['#d4d4d2', '#cdcdcd'],
  equipmentText: {
    x: 178,
    y: 1092,
    width: 1648,
    height: 2184,
    itemSize: 86,
    dyeSize: 56,
    itemLineHeight: 90,
    dyeLineHeight: 68,
    itemInkHeight: 70,
    dyeInkHeight: 44,
    topPadding: 22,
    groupGap: 80
  },
  title: {
    x: 163,
    y: 897,
    width: 311,
    height: 92,
    size: 100,
    clipBleedTop: 18,
    clipBleedBottom: 24
  },
  titleLine: {
    x: 162,
    y: 1040,
    width: 1629,
    height: 4
  },
  contentGroup: {
    top: 830,
    bottom: 3436,
    titleToLine: 1040 - 897,
    titleToEquipment: 1092 - 897
  }
}

export type EcTemplateLayout = typeof EC_TEMPLATE_LAYOUTS.normal
export type EorzeaTemplateLayout = typeof EORZEA_TEMPLATE.layouts.roomy
export type RisingstonesEquipmentLayout = typeof RISINGSTONES_TEMPLATE.equipment
export type EcFittedItemNameLayout = EcTemplateLayout & { inkCenter?: boolean; fontFamily?: string }
export type HorizontalEquipmentRow = {
  itemName: string
  hasDyeLine: boolean
  dyeText: string
}
