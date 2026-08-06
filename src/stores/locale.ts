import { ref } from 'vue'
import { coreUiMessages } from '@/locales/modules/core'
import { safeSetLocalItem } from '@/services/browserStorage'
import type { Locale, UiMessageMap } from '@/locales/types'

export type { Locale } from '@/locales/types'
export type LocaleFunction = (key: string) => string

const LOCALE_KEY = 'ns-locale'
const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de']

const current = ref<Locale>(loadLocale())

function isLocale(value: string | null): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

function normalizeLocaleCandidate(raw: string): Locale | null {
  const base = raw.toLowerCase().split('-')[0]
  if (base === 'zh') return 'zh-CN'
  if (base === 'ja') return 'ja'
  if (base === 'ko') return 'ko'
  if (base === 'en' || base === 'fr' || base === 'de') return 'en'
  return null
}

function detectBrowserLocale(): Locale {
  const candidates =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : []
  for (const raw of candidates) {
    const match = normalizeLocaleCandidate(raw)
    if (match) return match
  }
  return 'zh-CN'
}

function loadLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (isLocale(saved)) return saved

  const detected = detectBrowserLocale()
  safeSetLocalItem(LOCALE_KEY, detected)
  return detected
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale
}

function initLocale() {
  applyLocale(current.value)
}

function setLocale(locale: Locale) {
  current.value = locale
  safeSetLocalItem(LOCALE_KEY, locale)
  applyLocale(locale)
}

const messages = ref<UiMessageMap>({ ...coreUiMessages })
const registeredMessageMaps = new WeakSet<UiMessageMap>([coreUiMessages])

export function loadMessages(data: UiMessageMap) {
  if (registeredMessageMaps.has(data)) return

  messages.value = { ...messages.value, ...data }
  registeredMessageMaps.add(data)
}

function t(key: string): string {
  const message = messages.value[key]
  return message?.[current.value] ?? message?.['zh-CN'] ?? key
}

export function useLocale() {
  return { current, messages, initLocale, setLocale, loadMessages, t }
}
