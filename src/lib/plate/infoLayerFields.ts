export type NSPlateInfoPresetId = 'phantom-tide' | 'china' | 'international'

export type NSPlateInfoLayerType = 'text' | 'icon' | 'special' | 'fixed' | 'bar48'

export type NSPlateInfoTermStatus = 'game' | 'layout' | 'needs-check'

export interface NSPlateInfoFieldDefinition {
  slotId: string
  type: NSPlateInfoLayerType
  legacyName: string
  labelKey: string
  fallbackLabel: string
  termStatus: NSPlateInfoTermStatus
}

export interface NSPlateInfoPresetDefinition {
  id: NSPlateInfoPresetId
  legacyName: string
  labelKey: string
  fallbackLabel: string
  fields: NSPlateInfoFieldDefinition[]
}

export const nsPlateInfoDefaultTexts = {
  international: {
    'text-1': 'Endwalker',
    'text-2': 'Warrior Light',
    'text-3': 'Hades [Mana]',
    'text-4': 'LEVEL  100',
    'text-5': 'Paladin',
    'text-6': 'ナイト',
    'text-8': '大闘士',
    'text-7': 'The Seventh Dawn',
    'text-9': '降り注ぐ星は悲しみ 海を濁らせるのは嘆き',
    'text-10': '0:00                                       12:00',
    'text-11': '平日\n休日'
  },
  china: {
    'text-1': '终途行者',
    'text-2': '光之战士',
    'text-3': '神意之地',
    'text-4': '100级',
    'text-6': '骑士',
    'text-8': '正耀尉',
    'text-7': '拂晓血盟',
    'text-9': '繁星犹如泪水飞落 哀叹令大海不再清澈',
    'text-10': '0:00                                   12:00',
    'text-11': '工作日\n休息日'
  },
  'phantom-tide': {
    'text-1': '其他游戏角色@九号解决方案',
    'text-2': 'Paladin',
    'text-3': '关于我：\n高难/战场/钓鱼/剧情/拍照/幻化/……\n常驻体型……\n空间浓度……\n成分有……',
    'text-4': '其他补充：\n脾气很好……\nXXX全肯定bot……\n我雷……\n欢迎……'
  }
} satisfies Record<NSPlateInfoPresetId, Record<string, string>>

const sharedProfileFields = [
  infoField('text-1', 'text', '称号', 'title', 'game'),
  infoField('text-2', 'text', '角色名', 'characterName', 'game'),
  infoField('text-3', 'text', '服务器', 'world', 'game'),
  infoField('icon-1', 'icon', '职业图标', 'classJobIcon', 'game'),
  infoField('text-4', 'text', '等级', 'level', 'game'),
  infoField('text-6', 'text', '职业名', 'classJobName', 'game'),
  infoField('icon-4', 'icon', '军衔', 'rankIcon', 'needs-check'),
  infoField('text-8', 'text', '军衔名称', 'rankName', 'needs-check'),
  infoField('special-1', 'special', 'bd队徽', 'crest', 'game', '部队队徽'),
  infoField('text-7', 'text', 'bd名称', 'communityName', 'needs-check', '部队名称'),
  infoField('bar-1', 'bar48', '作息选择', 'scheduleCells', 'layout'),
  infoField('text-9', 'text', '个性签名', 'searchComment', 'game'),
  infoField('fixed-1', 'fixed', '时间图标', 'timeIcon', 'layout'),
  infoField('text-10', 'text', '作息数字', 'scheduleNumber', 'layout'),
  infoField('text-11', 'text', '作息文字', 'scheduleText', 'layout'),
  infoField('fixed-2', 'fixed', '个签图标', 'searchCommentIcon', 'layout'),
  infoField('icon-2', 'icon', '活动图标', 'activityIcon', 'layout')
] satisfies NSPlateInfoFieldDefinition[]

export const nsPlateInfoPresetDefinitions = [
  {
    id: 'phantom-tide',
    legacyName: '幻海流',
    labelKey: 'plate.info.preset.phantomTide',
    fallbackLabel: '幻海流',
    fields: [
      infoField('text-1', 'text', '中文标题', 'cnTitle', 'layout'),
      infoField('text-2', 'text', '英文标题', 'enTitle', 'layout'),
      infoField('icon-1', 'icon', '职业图标', 'classJobIcon', 'game'),
      infoField('text-3', 'text', '文案1', 'bodyCopyOne', 'layout'),
      infoField('icon-2', 'icon', '装饰图标1', 'decorIconOne', 'layout'),
      infoField('text-4', 'text', '文案2', 'bodyCopyTwo', 'layout'),
      infoField('icon-3', 'icon', '装饰图标2', 'decorIconTwo', 'layout')
    ]
  },
  {
    id: 'china',
    legacyName: '国服',
    labelKey: 'plate.info.preset.china',
    fallbackLabel: '国服',
    fields: sharedProfileFields
  },
  {
    id: 'international',
    legacyName: '国际服',
    labelKey: 'plate.info.preset.international',
    fallbackLabel: '国际服',
    fields: [
      ...sharedProfileFields.slice(0, 5),
      infoField('text-5', 'text', '英文职业名', 'classJobEnglishName', 'needs-check'),
      ...sharedProfileFields.slice(5)
    ]
  }
] satisfies NSPlateInfoPresetDefinition[]

export function localizePlateInfoText(
  key: string,
  fallback: string,
  translate?: (key: string) => string
) {
  const localized = translate?.(key)

  return localized && localized !== key ? localized : fallback
}

export function getNSPlateInfoDefaultText(presetId: NSPlateInfoPresetId, slotId: string) {
  const texts: Record<string, string> = nsPlateInfoDefaultTexts[presetId]

  return texts[slotId] ?? ''
}

function infoField(
  slotId: string,
  type: NSPlateInfoLayerType,
  legacyName: string,
  token: string,
  termStatus: NSPlateInfoTermStatus,
  fallbackLabel = legacyName
): NSPlateInfoFieldDefinition {
  return {
    slotId,
    type,
    legacyName,
    labelKey: `plate.info.field.${token}`,
    fallbackLabel,
    termStatus
  }
}
