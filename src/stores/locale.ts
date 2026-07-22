import { ref } from 'vue'
import { coreUiMessages } from '@/locales/modules/core'
import type { Locale, UiMessageMap } from '@/locales/types'

export type { Locale } from '@/locales/types'
export type LocaleFunction = (key: string) => string

const LOCALE_KEY = 'ns-locale'
const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de']

const current = ref<Locale>(loadLocale())

function isLocale(value: string | null): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

function loadLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY)
  return isLocale(saved) ? saved : 'zh-CN'
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale
}

function initLocale() {
  applyLocale(current.value)
}

function setLocale(locale: Locale) {
  current.value = locale
  localStorage.setItem(LOCALE_KEY, locale)
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
