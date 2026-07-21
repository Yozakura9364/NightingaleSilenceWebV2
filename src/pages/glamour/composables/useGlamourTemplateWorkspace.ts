import { computed, ref, watch } from 'vue'
import type { GlamourDraft, GlamourLocale } from '@/lib/glamour/types'
import {
  createGlamourTemplateRenderData
} from '@/lib/glamour/templates/renderData'
import {
  getGlamourTemplateDefinition,
  GLAMOUR_TEMPLATE_SELECT_ORDER,
  normalizeGlamourTemplateId,
  type GlamourTemplateId
} from '@/lib/glamour/templates/definitions'
import {
  applyGlamourTemplateImportedSource,
  applyGlamourTemplateImportedTitle,
  GLAMOUR_TEMPLATE_SETTINGS_STORAGE_KEY,
  normalizeGlamourTemplateSettings,
  normalizeGlamourTemplateWorkspaceSettings,
  type GlamourTemplateSettings,
  type GlamourTemplateWorkspaceSettings
} from '@/lib/glamour/templates/settings'
import { useLocale } from '@/stores/locale'

function getTemplateLocaleForUiLanguage(language: string): GlamourLocale {
  return language === 'zh-CN' ? 'zh' : language
}

function getDefaultTemplateLocalesForUiLanguage(
  template: ReturnType<typeof getGlamourTemplateDefinition>,
  language: string
): GlamourLocale[] {
  const uiLocale = getTemplateLocaleForUiLanguage(language)

  if (template.localeOrder.includes(uiLocale)) {
    return [uiLocale]
  }

  if (template.languageOptions?.length) {
    return [...template.languageOptions[0].locales]
  }

  return [template.defaultLocale]
}

function readTemplateWorkspaceSettings(): GlamourTemplateWorkspaceSettings {
  try {
    return normalizeGlamourTemplateWorkspaceSettings(
      JSON.parse(localStorage.getItem(GLAMOUR_TEMPLATE_SETTINGS_STORAGE_KEY) || '{}')
    )
  } catch {
    return normalizeGlamourTemplateWorkspaceSettings({})
  }
}

function writeTemplateWorkspaceSettings(settings: GlamourTemplateWorkspaceSettings) {
  localStorage.setItem(GLAMOUR_TEMPLATE_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

function areSameLocales(current: GlamourLocale[], next: GlamourLocale[]): boolean {
  return current.length === next.length && current.every((locale, index) => locale === next[index])
}

const workspaceSettings = ref<GlamourTemplateWorkspaceSettings>(readTemplateWorkspaceSettings())
const lastImportedSourceSignature = ref('')

export function useGlamourTemplateWorkspace(draft: { value: GlamourDraft }) {
  const { current: currentUiLocale } = useLocale()
  const templateId = computed(() => workspaceSettings.value.templateId)
  const template = computed(() => getGlamourTemplateDefinition(templateId.value))
  const templateSettings = computed(() => workspaceSettings.value.templates[templateId.value])
  const selectedLocales = computed(() =>
    templateSettings.value.locales.length ? templateSettings.value.locales : [draft.value.locale]
  )
  const activeLocale = computed(() => {
    const draftLocale = draft.value.locale
    return selectedLocales.value.includes(draftLocale) ? draftLocale : selectedLocales.value[0] || draftLocale
  })
  const templateRenderData = computed(() =>
    createGlamourTemplateRenderData(draft.value, templateSettings.value, {
      template: template.value,
      locale: activeLocale.value,
      locales: selectedLocales.value
    })
  )
  const templateRows = computed(() => templateRenderData.value.rows)

  function setTemplateId(nextTemplateId: string) {
    const normalized = normalizeGlamourTemplateId(nextTemplateId)
    const nextTemplate = getGlamourTemplateDefinition(normalized)
    const currentSettings = workspaceSettings.value.templates[normalized]
    const nextSettings = normalizeGlamourTemplateSettings(
      {
        ...currentSettings,
        templateId: normalized,
        locales: getDefaultTemplateLocalesForUiLanguage(nextTemplate, currentUiLocale.value)
      },
      normalized
    )

    workspaceSettings.value = {
      ...workspaceSettings.value,
      templateId: normalized,
      templates: {
        ...workspaceSettings.value.templates,
        [normalized]: nextSettings
      }
    }
    writeTemplateWorkspaceSettings(workspaceSettings.value)
  }

  function updateTemplateSettings(
    nextSettings:
      | Partial<GlamourTemplateSettings>
      | ((current: GlamourTemplateSettings) => Partial<GlamourTemplateSettings>)
  ) {
    const current = templateSettings.value
    const patch = typeof nextSettings === 'function' ? nextSettings(current) : nextSettings
    const normalized = normalizeGlamourTemplateSettings(
      {
        ...current,
        ...patch,
        templateId: templateId.value
      },
      templateId.value
    )

    workspaceSettings.value = {
      ...workspaceSettings.value,
      templates: {
        ...workspaceSettings.value.templates,
        [templateId.value]: normalized
      }
    }
    writeTemplateWorkspaceSettings(workspaceSettings.value)
  }

  function setTemplateLocales(locales: GlamourLocale[]) {
    updateTemplateSettings({ locales })
  }

  function syncCurrentTemplateLocalesWithUiLanguage() {
    const nextLocales = getDefaultTemplateLocalesForUiLanguage(template.value, currentUiLocale.value)

    if (areSameLocales(templateSettings.value.locales, nextLocales)) {
      return
    }

    updateTemplateSettings({ locales: nextLocales })
  }

  function applyImportedSourceToCurrentTemplate(options: { force?: boolean } = {}) {
    const current = templateSettings.value
    const next = applyGlamourTemplateImportedSource(current, template.value, draft.value, options)

    if (next === current) {
      return
    }

    updateTemplateSettings(next)
  }

  function applyImportedTitleToAllTemplates(options: { force?: boolean } = {}) {
    let changed = false
    const templates = { ...workspaceSettings.value.templates }

    for (const id of GLAMOUR_TEMPLATE_SELECT_ORDER) {
      const current = templates[id]
      const next = applyGlamourTemplateImportedTitle(
        current,
        getGlamourTemplateDefinition(id),
        draft.value,
        options
      )

      if (next !== current) {
        templates[id] = next
        changed = true
      }
    }

    if (!changed) {
      return
    }

    workspaceSettings.value = {
      ...workspaceSettings.value,
      templates
    }
    writeTemplateWorkspaceSettings(workspaceSettings.value)
  }

  function syncTemplateLinkImportLocales() {
    const draftLocale = draft.value.locale

    if (!template.value.localeOrder.includes(draftLocale)) {
      return
    }

    const nextLocales = [draftLocale]

    if (areSameLocales(templateSettings.value.locales, nextLocales)) {
      return
    }

    updateTemplateSettings({ locales: nextLocales })
  }

  function resetTemplateSettings(targetTemplateId: GlamourTemplateId = templateId.value) {
    const normalized = normalizeGlamourTemplateSettings({}, targetTemplateId)
    workspaceSettings.value = {
      ...workspaceSettings.value,
      templateId: targetTemplateId,
      templates: {
        ...workspaceSettings.value.templates,
        [targetTemplateId]: normalized
      }
    }
    writeTemplateWorkspaceSettings(workspaceSettings.value)
  }

  function refreshTemplateWorkspaceSettings() {
    workspaceSettings.value = readTemplateWorkspaceSettings()
  }

  watch(
    () => [currentUiLocale.value, templateId.value].join('|'),
    () => {
      syncCurrentTemplateLocalesWithUiLanguage()
    },
    { immediate: true }
  )

  watch(
    () => [
      draft.value.source.importedAt,
      draft.value.source.name,
      draft.value.source.title,
      draft.value.source.authorName,
      draft.value.source.authorWorld,
      draft.value.source.authorLabel,
      draft.value.source.importMode,
      templateId.value
    ].join('|'),
    () => {
      if (!draft.value.source.importedAt) {
        return
      }

      const importedSourceSignature = [
        draft.value.source.importedAt,
        draft.value.source.name,
        draft.value.source.title,
        draft.value.source.authorName,
        draft.value.source.authorWorld,
        draft.value.source.authorLabel,
        draft.value.source.importMode
      ].join('|')
      const force =
        draft.value.source.importMode === 'template-link' &&
        importedSourceSignature !== lastImportedSourceSignature.value

      if (force) {
        syncTemplateLinkImportLocales()
        applyImportedTitleToAllTemplates({ force: true })
      }
      applyImportedSourceToCurrentTemplate({ force })
      lastImportedSourceSignature.value = importedSourceSignature
    },
    { immediate: true }
  )

  return {
    workspaceSettings,
    templateId,
    template,
    templateSettings,
    selectedLocales,
    activeLocale,
    templateRenderData,
    templateRows,
    setTemplateId,
    updateTemplateSettings,
    setTemplateLocales,
    syncCurrentTemplateLocalesWithUiLanguage,
    applyImportedSourceToCurrentTemplate,
    resetTemplateSettings,
    refreshTemplateWorkspaceSettings
  }
}
