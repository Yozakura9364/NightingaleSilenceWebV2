import type { UiMessageMap } from '@/locales/types'

const message = (
  zh: string,
  en: string
): Record<'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de', string> => ({
  'zh-CN': zh,
  en,
  ja: zh,
  ko: zh,
  fr: en,
  de: en
})

const localizedMessage = (
  zh: string,
  en: string,
  ja: string,
  ko: string
): Record<'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de', string> => ({
  'zh-CN': zh,
  en,
  ja,
  ko,
  fr: en,
  de: en
})

export const fashionCheckUiMessages: UiMessageMap = {
  'fashionCheck.title': message('时尚品鉴', 'Fashion Check'),
  'fashionCheck.theme': message('本周主题', 'Theme'),
  'fashionCheck.target80': message('目标 80 分', '80-point target'),
  'fashionCheck.gold': message('金牌', 'Gold'),
  'fashionCheck.exactDye': message('精确染色 +2', 'Exact dye +2'),
  'fashionCheck.verified': message('已验证分值', 'Verified score'),
  'fashionCheck.loading': message('正在读取当前周数据', 'Loading current week'),
  'fashionCheck.unavailable': message('当前周数据尚未公开', 'Current week data is unavailable'),
  'fashionCheck.solutions': message('本周方案', 'Weekly solutions'),
  'fashionCheck.goldItems': message('金牌物品', 'Gold items'),
  'fashionCheck.anyTwoGold': message('任意两件金牌', 'Any two gold pieces'),
  'fashionCheck.allGold': message('四件金牌', 'Four gold pieces'),
  'fashionCheck.target100': message('100 分方案', '100-point solution'),
  'fashionCheck.goldWithDye': message('一件金牌 + 两处精确染色', 'One gold piece + two exact dyes'),
  'fashionCheck.noDye': message('不计染色', 'No dye bonus'),
  'fashionCheck.dyeWeapon': localizedMessage('武器', 'Weapon', '武器', '무기'),
  'fashionCheck.dyeHead': localizedMessage('头部', 'Head', '頭防具', '머리'),
  'fashionCheck.dyeBody': localizedMessage('身体', 'Body', '胴防具', '몸통'),
  'fashionCheck.dyeHands': localizedMessage('手部', 'Hands', '手防具', '손'),
  'fashionCheck.dyeLegs': localizedMessage('腿部', 'Legs', '脚防具', '다리'),
  'fashionCheck.dyeFeet': localizedMessage('脚部', 'Feet', '足防具', '발'),
  'fashionCheck.views': message('时尚品鉴视图', 'Fashion Check views'),
  'fashionCheck.tabSolutions': message('本周作业', 'Weekly solutions'),
  'fashionCheck.tabGoldItems': message('金牌物品', 'Gold items'),
  'fashionCheck.tabSources': message('数据来源', 'Sources'),
  'fashionCheck.sources': message('数据来源', 'Sources'),
  'fashionCheck.sourcesUnavailable': message('数据来源暂不可用', 'Sources are unavailable'),
  'fashionCheck.referenceTitle': message(
    '第 {issue} 期临时展示',
    'Week {issue} temporary showcase'
  ),
  'fashionCheck.dyeGuide': message('全部位染色', 'Full-slot dyes'),
  'fashionCheck.solution80Title': message('80分作业', '80-point solution'),
  'fashionCheck.solution100Title': message('100分作业', '100-point solution'),
  'fashionCheck.anyDyeableBody': localizedMessage(
    '任意可染色身体装备',
    'Any dyeable body gear',
    '染色可能な胴防具',
    '염색 가능한 몸통 방어구'
  ),
  'fashionCheck.anyDyeableLegs': localizedMessage(
    '任意可染色腿部装备',
    'Any dyeable leg gear',
    '染色可能な脚防具',
    '염색 가능한 다리 방어구'
  ),
  'fashionCheck.anyDyeableFeet': localizedMessage(
    '任意可染色脚部装备',
    'Any dyeable foot gear',
    '染色可能な足防具',
    '염색 가능한 발 방어구'
  ),
  'fashionCheck.dyeFamilyBlack': localizedMessage(
    '黑色系',
    'Black dyes',
    'ブラック系',
    '검은색 계열'
  ),
  'fashionCheck.dyeFamilyRed': localizedMessage('红色系', 'Red dyes', 'レッド系', '붉은색 계열'),
  'fashionCheck.commonDye': localizedMessage(
    '通用染剂',
    'Common dye',
    '汎用カララント',
    '일반 염료'
  ),
  'fashionCheck.openHuijiWiki': localizedMessage(
    '打开灰机 Wiki',
    'Open Huiji Wiki',
    '灰機Wikiを開く',
    '회색기 Wiki 열기'
  ),
  'fashionCheck.faq': message('FAQ', 'FAQ'),
  'fashionCheck.faqPlaceholder': message('占位用，待编辑', 'Placeholder, pending editing'),
  'fashionCheck.awaitingData': message('\u7b49\u5f85\u6570\u636e', 'Awaiting data')
}
