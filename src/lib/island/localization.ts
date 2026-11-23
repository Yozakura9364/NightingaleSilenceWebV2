// 无人岛数据的名称本地化选择。数据侧 locale 键为 zh/en/ja/ko/tc/fr/de，
// UI locale 为 zh-CN/en/ja/ko/fr/de；缺失时按 当前语言 → en → zh → 首个可用 回退。
import type { IslandLocaleNames } from './types'

export type IslandUiLocale = 'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de'

const UI_TO_DATA: Record<IslandUiLocale, keyof IslandLocaleNames> = {
  'zh-CN': 'zh',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  de: 'de'
}

/** 首字母大写（仅用于 en/fr/de 的 datamining 小写名）。 */
function capitalizeWords(value: string): string {
  return value.replace(/\b([a-zÀ-ÿ])([a-zÀ-ÿ'’-]*)/g, (_, first: string, rest: string) => first.toUpperCase() + rest)
}

/** 列表分隔符：中日用顿号，其余用逗号。 */
export function islandListSeparator(locale: IslandUiLocale): string {
  return locale === 'zh-CN' || locale === 'ja' ? '、' : ', '
}

/** 材料清单的本地化拼接：`名称 ×数量` 列表。 */
export function formatIslandMaterialList(
  entries: ReadonlyArray<{ names: IslandLocaleNames; amount: number }>,
  locale: IslandUiLocale
): string {
  return entries
    .map((entry) => `${pickIslandName(entry.names, locale)} ×${entry.amount}`)
    .join(islandListSeparator(locale))
}

export function pickIslandName(
  names: IslandLocaleNames | null | undefined,
  locale: IslandUiLocale
): string {
  if (!names) {
    return ''
  }
  const dataLocale = UI_TO_DATA[locale]
  const raw =
    names[dataLocale] || names.en || names.zh || Object.values(names).find(Boolean) || ''
  if (!raw) {
    return ''
  }
  return locale === 'zh-CN' || locale === 'ja' || locale === 'ko' ? raw : capitalizeWords(raw)
}
