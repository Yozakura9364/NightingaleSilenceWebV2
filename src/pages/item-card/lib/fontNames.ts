const CHINESE_FONT_NAMES: Record<string, string> = {
  DengXian: '等线',
  FangSong: '仿宋',
  FZFengYaKaiSongS: '方正风雅楷宋简体',
  FZShuTi: '方正舒体',
  FZYaoTi: '方正姚体',
  'FZZhengHeiS-EL-GB': '方正正纤黑简体',
  'Glow Sans SC': '未来荧黑',
  HYZhongHei: '汉仪中黑',
  'HanziPen SC': '翩翩体简体',
  'HarmonyOS Sans': '鸿蒙黑体',
  'HarmonyOS Sans SC': '鸿蒙黑体简体中文',
  KaiTi: '楷体',
  LiSu: '隶书',
  'Microsoft JhengHei': '微软正黑体',
  'Microsoft JhengHei UI': '微软正黑体 UI',
  'Microsoft YaHei': '微软雅黑',
  'Microsoft YaHei UI': '微软雅黑 UI',
  'MingLiU-ExtB': '细明体扩展 B',
  'MingLiU_HKSCS-ExtB': '细明体香港增补字符集扩展 B',
  MiSans: '小米 MiSans',
  NSimSun: '新宋体',
  'Noto Sans SC': '思源黑体',
  'Noto Serif SC': '思源宋体',
  'PMingLiU-ExtB': '新细明体扩展 B',
  STCaiyun: '华文彩云',
  STFangsong: '华文仿宋',
  STHupo: '华文琥珀',
  STKaiti: '华文楷体',
  STLiti: '华文隶书',
  STSong: '华文宋体',
  STXihei: '华文细黑',
  STXingkai: '华文行楷',
  STXinwei: '华文新魏',
  STZhongsong: '华文中宋',
  SimHei: '黑体',
  SimSun: '宋体',
  'SimSun-ExtB': '宋体扩展 B',
  'SimSun-ExtG': '宋体扩展 G',
  YouYuan: '幼圆'
}

export interface ItemCardFontOption {
  value: string
  label: string
  localized: boolean
}

export function buildItemCardFontOptions(fontFamilies: string[]): ItemCardFontOption[] {
  return Array.from(new Set(fontFamilies.map((font) => String(font || '').trim()).filter(Boolean)))
    .map((value) => ({
      value,
      label: CHINESE_FONT_NAMES[value] || value,
      localized: Boolean(CHINESE_FONT_NAMES[value])
    }))
    .sort((left, right) => {
      if (left.localized !== right.localized) {
        return left.localized ? -1 : 1
      }
      return left.label.localeCompare(right.label, 'zh-CN')
    })
}
