import { ref, computed } from 'vue'

export type Locale = 'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de'

const LOCALE_KEY = 'ns-locale'

const current = ref<Locale>(loadLocale())

function loadLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY)
  return (saved as Locale) ?? 'zh-CN'
}

function setLocale(locale: Locale) {
  current.value = locale
  localStorage.setItem(LOCALE_KEY, locale)
}

// Messages loaded from ui-localization.json
const messages = ref<Record<string, Record<string, string>>>({})

function loadMessages(data: Record<string, Record<string, string>>) {
  messages.value = data
}

const t = computed(() => (key: string): string => {
  return messages.value[key]?.[current.value] ?? key
})

export function useLocale() {
  return { current, messages, setLocale, loadMessages, t }
}
