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
  'fashionCheck.dyeWeapon': message('武器', 'Weapon'),
  'fashionCheck.dyeHead': message('头部', 'Head'),
  'fashionCheck.dyeBody': message('身体', 'Body'),
  'fashionCheck.dyeHands': message('手部', 'Hands'),
  'fashionCheck.dyeLegs': message('腿部', 'Legs'),
  'fashionCheck.dyeFeet': message('脚部', 'Feet'),
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
  'fashionCheck.faq': message('FAQ', 'FAQ'),
  'fashionCheck.faqPlaceholder': message('占位用，待编辑', 'Placeholder, pending editing')
}
