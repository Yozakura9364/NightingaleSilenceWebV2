import { ref, watch } from 'vue'
import {
  getItemCardLocaleStyle,
  readItemCardSettings,
  writeItemCardSettings
} from '@/pages/item-card/lib/cardSettings'
import type {
  GlamourLocale,
  ItemCardLayout,
  ItemCardLocaleStyle,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'

export type ItemCardSettingsPatch = Partial<Omit<ItemCardRenderSettings, 'localeStyles'>>

export function useItemCardSettings() {
  const stored = readItemCardSettings()
  const settings = ref<ItemCardRenderSettings>(stored.render)
  const layouts = ref<Record<string, ItemCardLayout>>(stored.layouts)
  const listLayout = ref<ItemCardLayout>(stored.listLayout)

  watch(
    [settings, layouts, listLayout],
    () => {
      writeItemCardSettings({
        version: 1,
        render: settings.value,
        layouts: layouts.value,
        listLayout: listLayout.value
      })
    },
    { deep: true }
  )

  function updateSettings(patch: ItemCardSettingsPatch) {
    settings.value = { ...settings.value, ...patch }
  }

  function updateLocaleStyle(locale: GlamourLocale, patch: Partial<ItemCardLocaleStyle>) {
    settings.value = {
      ...settings.value,
      localeStyles: {
        ...settings.value.localeStyles,
        [locale]: { ...getItemCardLocaleStyle(settings.value, locale), ...patch }
      }
    }
  }

  function toggleOutputLocale(locale: GlamourLocale) {
    const selected = settings.value.outputLocales
    const sourceLocale = selected[0] || locale
    const outputLocales = selected.includes(locale)
      ? selected.filter((item) => item !== locale)
      : [...selected, locale]

    if (!outputLocales.length) {
      return
    }

    settings.value = {
      ...settings.value,
      outputLocales,
      localeStyles: {
        ...settings.value.localeStyles,
        [locale]: getItemCardLocaleStyle(settings.value, sourceLocale)
      }
    }
  }

  function getLayout(rowId: string): ItemCardLayout {
    return layouts.value[rowId] === 'right' ? 'right' : 'left'
  }

  function setLayout(rowId: string, layout: ItemCardLayout) {
    layouts.value = { ...layouts.value, [rowId]: layout }
  }

  function setAllLayouts(rowIds: string[], layout: ItemCardLayout) {
    layouts.value = {
      ...layouts.value,
      ...Object.fromEntries(rowIds.map((rowId) => [rowId, layout]))
    }
  }

  function setListLayout(layout: ItemCardLayout) {
    listLayout.value = layout
  }

  return {
    settings,
    layouts,
    listLayout,
    updateSettings,
    updateLocaleStyle,
    toggleOutputLocale,
    getLayout,
    setLayout,
    setAllLayouts,
    setListLayout
  }
}
