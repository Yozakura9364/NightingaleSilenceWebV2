import type { FashionCheckLocalizedNames } from '@/lib/fashion-check/types'
import type { Locale } from '@/locales/types'

export function resolveFashionCheckName(
  names: FashionCheckLocalizedNames | undefined,
  locale: Locale,
  fallback: string
): string {
  const localizedName =
    locale === 'zh-CN' || locale === 'en' || locale === 'ja' || locale === 'ko'
      ? names?.[locale]
      : undefined

  return localizedName ?? names?.en ?? names?.['zh-CN'] ?? fallback
}
