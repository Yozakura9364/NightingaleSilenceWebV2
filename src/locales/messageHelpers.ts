import type { Locale, UiMessage } from '@/locales/types'

export const placeholder = ''

export function draft(value: string): string {
  return value
}

export function same(value: string): UiMessage {
  return {
    'zh-CN': value,
    en: value,
    ja: value,
    ko: value,
    fr: value,
    de: value
  }
}

export function msg(values: {
  zh: string
  en: string
  ja: string
  ko: string
  fr?: string
  de?: string
}): Record<Locale, string> {
  return {
    'zh-CN': values.zh,
    en: values.en,
    ja: values.ja,
    ko: values.ko,
    fr: values.fr ?? values.en,
    de: values.de ?? values.en
  }
}
