import { computed, watch, type ComputedRef, type Ref } from 'vue'
import type {
  GlamourTemplateDefinition,
  GlamourTemplateLanguageOption
} from '@/lib/glamour/templates/definitions'
import type { GlamourLocale } from '@/lib/glamour/types'
import type {
  GlamourTemplateOutputLanguageMode,
  GlamourTemplateSettings
} from '@/lib/glamour/templates/settings'

interface GlamourTemplateLanguageControlsOptions {
  template: ComputedRef<GlamourTemplateDefinition>
  selectedLocales: ComputedRef<GlamourLocale[]>
  selectedDyeLocales: ComputedRef<GlamourLocale[]>
  outputLanguageMode: ComputedRef<GlamourTemplateOutputLanguageMode>
  activeLocale: ComputedRef<GlamourLocale>
  draftLocale: ComputedRef<GlamourLocale>
  uiLocale: Ref<string>
  updateTemplateSettings: (settings: Partial<GlamourTemplateSettings>) => void
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
const CUSTOM_LANGUAGE_OPTION: GlamourTemplateLanguageOption = {
  id: 'custom',
  label: 'Custom',
  labelKey: 'nsglamour.template.language.custom',
  locales: []
}

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

  const supportsCustomLanguages = computed(
    () => options.template.value.supportsCustomLanguages === true
  )
  const isCustomLanguageMode = computed(
    () => supportsCustomLanguages.value && options.outputLanguageMode.value === 'custom'
  )
  const isSingleLanguageMode = computed(() => !supportsCustomLanguages.value)
  const languageOptions = computed<GlamourTemplateLanguageOption[]>(() => {
    if (options.template.value.languageOptions?.length) {
      return [...options.template.value.languageOptions]
    }

    return options.template.value.localeOrder.map((locale) => ({
      id: locale,
      label: localeLabels[locale] || locale,
      locales: [locale]
    }))
  })
  const orderedLanguageOptions = computed(() => {
    const ordered = [...languageOptions.value].sort(
      (left, right) =>
        getLanguageRank(left.locales) - getLanguageRank(right.locales) ||
        languageOptions.value.indexOf(left) - languageOptions.value.indexOf(right)
    )

    return supportsCustomLanguages.value ? [...ordered, CUSTOM_LANGUAGE_OPTION] : ordered
  })
  const localeSelectOptions = computed(() =>
    options.template.value.localeOrder.map((locale) => ({
      value: locale,
      label: localeLabels[locale] || locale
    }))
  )
  const editorLocale = computed(() => options.activeLocale.value || options.draftLocale.value)

  function normalizeSupportedLocales(locales: GlamourLocale[]): GlamourLocale[] {
    const supported = new Set(options.template.value.localeOrder)
    return Array.from(new Set(locales.filter((locale) => supported.has(locale))))
  }

  function normalizeSelectedLocales(locales: GlamourLocale[]): GlamourLocale[] {
    const next = normalizeSupportedLocales(locales)
    return next
  }

  function setActiveLocale(locale: GlamourLocale): void {
    if (options.template.value.localeOrder.includes(locale)) {
      options.updateLocale(locale)
    }
  }

  function toggleTemplateLocale(option: GlamourTemplateLanguageOption): void {
    if (option.id === CUSTOM_LANGUAGE_OPTION.id && supportsCustomLanguages.value) {
      const primary = options.selectedLocales.value[0] || options.template.value.defaultLocale
      const secondary = getPreferredSecondaryLocale(primary, options.template.value.localeOrder)
      const locales = normalizeSelectedLocales([primary, secondary])
      const dyeLocales = normalizeSelectedLocales(
        options.selectedDyeLocales.value.length
          ? options.selectedDyeLocales.value
          : [locales[0] || primary]
      ).slice(0, 2)

      options.updateTemplateSettings({
        outputLanguageMode: 'custom',
        locales,
        dyeLocales: dyeLocales.length ? dyeLocales : [locales[0] || primary]
      })
      setActiveLocale(locales[0] || primary)
      return
    }

    const locale = option.locales[0]
    if (!locale) {
      return
    }

    options.updateTemplateSettings({
      outputLanguageMode: 'single',
      locales: [locale],
      dyeLocales: [locale]
    })
    setActiveLocale(locale)
  }

  function updateTemplateItemLocale(index: number, locale: GlamourLocale): void {
    if (!isCustomLanguageMode.value || index < 0 || index > 1) {
      return
    }

    const locales = [...options.selectedLocales.value]
    const otherIndex = index === 0 ? 1 : 0
    const previous = locales[index]
    locales[index] = locale

    if (locales[otherIndex] === locale) {
      locales[otherIndex] = previous
    }

    const normalized = normalizeSelectedLocales(locales).slice(0, 2)
    options.updateTemplateSettings({ locales: normalized })

    if (index === 0 && normalized[0]) {
      setActiveLocale(normalized[0])
    }
  }

  function updateTemplateDyeLocale(index: number, locale: GlamourLocale | ''): void {
    if (!isCustomLanguageMode.value || index < 0 || index > 1) {
      return
    }

    const locales = [...options.selectedDyeLocales.value]
    const primaryFallback = options.selectedLocales.value[0] || options.template.value.defaultLocale

    if (index === 0) {
      locales[0] = locale || primaryFallback
      if (locales[1] === locales[0]) {
        locales.splice(1, 1)
      }
    } else if (!locale || locale === locales[0]) {
      locales.splice(1, 1)
    } else {
      locales[1] = locale
    }

    const normalized = normalizeSelectedLocales(locales).slice(0, 2)
    options.updateTemplateSettings({
      dyeLocales: normalized.length ? normalized : [primaryFallback]
    })
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
    isCustomLanguageMode,
    orderedLanguageOptions,
    localeSelectOptions,
    editorLocale,
    toggleTemplateLocale,
    updateTemplateItemLocale,
    updateTemplateDyeLocale
  }
}

function getPreferredSecondaryLocale(
  primaryLocale: GlamourLocale,
  localeOrder: GlamourLocale[]
): GlamourLocale {
  const preferred = primaryLocale === 'en' ? 'ja' : 'en'
  return localeOrder.includes(preferred)
    ? preferred
    : localeOrder.find((locale) => locale !== primaryLocale) || primaryLocale
}

function getLanguageRank(locales: GlamourLocale[]): number {
  return displayRank.get(locales[0]) ?? Number.MAX_SAFE_INTEGER
}
