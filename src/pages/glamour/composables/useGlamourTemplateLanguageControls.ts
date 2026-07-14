import { computed, watch, type ComputedRef, type Ref } from 'vue'
import type {
  GlamourTemplateDefinition,
  GlamourTemplateLanguageOption
} from '@/lib/glamour/templates'
import type { GlamourLocale } from '@/lib/glamour/types'

interface GlamourTemplateLanguageControlsOptions {
  template: ComputedRef<GlamourTemplateDefinition>
  selectedLocales: ComputedRef<GlamourLocale[]>
  activeLocale: ComputedRef<GlamourLocale>
  draftLocale: ComputedRef<GlamourLocale>
  uiLocale: Ref<string>
  setTemplateLocales: (locales: GlamourLocale[]) => void
  updateLocale: (locale: GlamourLocale) => void
}

const localeLabels: Record<string, string> = {
  zh: 'chs',
  ja: 'ja',
  en: 'en',
  ko: 'ko',
  tc: 'tc',
  fr: 'fr',
  de: 'de'
}
const displayOrder: GlamourLocale[] = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']
const displayRank = new Map(displayOrder.map((locale, index) => [locale, index]))

export function useGlamourTemplateLanguageControls(
  options: GlamourTemplateLanguageControlsOptions
) {
  const templateImportPreferredLocale = computed(() => {
    const uiLocale = options.uiLocale.value === 'zh-CN' ? 'zh' : options.uiLocale.value

    if (options.template.value.localeOrder.includes(uiLocale as GlamourLocale)) {
      return uiLocale as GlamourLocale
    }

    if (options.template.value.languageOptions?.length) {
      return (
        options.template.value.languageOptions[0].locales[0] || options.template.value.defaultLocale
      )
    }

    return options.template.value.defaultLocale
  })

  const hasLanguageOptions = computed(() => Boolean(options.template.value.languageOptions?.length))
  const isSingleLanguageMode = computed(
    () => !hasLanguageOptions.value && options.template.value.localeOrder.length <= 1
  )
  const languageOptions = computed<GlamourTemplateLanguageOption[]>(() => {
    if (options.template.value.languageOptions?.length) {
      return options.template.value.languageOptions
    }

    return options.template.value.localeOrder.map((locale) => ({
      id: locale,
      label: localeLabels[locale] || locale,
      locales: [locale]
    }))
  })
  const orderedLanguageOptions = computed(() =>
    [...languageOptions.value].sort(
      (left, right) =>
        getLanguageRank(left.locales) - getLanguageRank(right.locales) ||
        languageOptions.value.indexOf(left) - languageOptions.value.indexOf(right)
    )
  )
  const editorLocale = computed(() => options.activeLocale.value || options.draftLocale.value)

  function normalizeSupportedLocales(locales: GlamourLocale[]): GlamourLocale[] {
    const supported = new Set(options.template.value.localeOrder)
    return Array.from(new Set(locales.filter((locale) => supported.has(locale))))
  }

  function setNormalizedLocales(locales: GlamourLocale[]): GlamourLocale[] {
    const next = normalizeSupportedLocales(locales)
    if (next.length) {
      options.setTemplateLocales(next)
    }
    return next
  }

  function setActiveLocale(locale: GlamourLocale): void {
    if (options.template.value.localeOrder.includes(locale)) {
      options.updateLocale(locale)
    }
  }

  function toggleTemplateLocale(option: GlamourTemplateLanguageOption): void {
    const locale = option.locales[0]
    if (!locale) {
      return
    }

    if (hasLanguageOptions.value || isSingleLanguageMode.value) {
      const next = setNormalizedLocales([...option.locales])
      setActiveLocale(next[0] || locale)
      return
    }

    const selected = [...options.selectedLocales.value]
    const selectedIndex = selected.indexOf(locale)

    if (selectedIndex < 0) {
      const next = setNormalizedLocales([...selected, locale])
      const nextActiveLocale = next.includes(locale) ? locale : next[0]
      if (nextActiveLocale) {
        setActiveLocale(nextActiveLocale)
      }
      return
    }

    if (options.activeLocale.value !== locale) {
      setActiveLocale(locale)
      return
    }

    if (selected.length > 1) {
      const next = setNormalizedLocales(selected.filter((item) => item !== locale))
      if (next[0]) {
        setActiveLocale(next[0])
      }
    }
  }

  watch(
    options.activeLocale,
    (locale) => {
      if (locale && options.draftLocale.value !== locale) {
        options.updateLocale(locale)
      }
    },
    { immediate: true }
  )

  return {
    templateImportPreferredLocale,
    isSingleLanguageMode,
    orderedLanguageOptions,
    editorLocale,
    toggleTemplateLocale
  }
}

function getLanguageRank(locales: GlamourLocale[]): number {
  return displayRank.get(locales[0]) ?? Number.MAX_SAFE_INTEGER
}
