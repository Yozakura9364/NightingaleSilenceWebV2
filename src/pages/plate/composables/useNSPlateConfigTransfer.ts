import { computed, ref, watch, type Ref } from 'vue'
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import type { NSPlateAssetSelectionMap } from '@/lib/plate/draft'
import {
  createNSPlateConfigFilename,
  createNSPlateConfigJson,
  importNSPlateConfigText
} from '@/lib/plate/configTransfer'
import type { NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import { NSPlateLegacyConfigImportError } from '@/lib/plate/legacyConfig'
import type {
  NSPlateAssetGroup,
  NSPlateCustomPortraitImage,
  NSPlatePanelTab,
  NSPlatePortraitSide,
  NSPlatePresetKind,
  NSPlatePresetSummary
} from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import { readNSPlateDraft } from '@/pages/plate/composables/useNSPlateDraftPersistence'
import { useDialog } from '@/composables/useDialog'

interface UseNSPlateConfigTransferOptions {
  isLoading: Ref<boolean>
  presets: Ref<NSPlatePresetSummary[]>
  assetGroups: Ref<NSPlateAssetGroup[]>
  portraitSide: Ref<NSPlatePortraitSide>
  selectedPresetIdsByKind: Ref<Record<NSPlatePresetKind, string | null>>
  selectedAssetIdsByCategory: Ref<NSPlateAssetSelectionMap>
  customPortrait: Ref<NSPlateCustomPortraitImage | null>
  infoDraft: Ref<NSPlateInfoDraft>
  activeTab: Ref<NSPlatePanelTab>
}

const LEGACY_CONFIG_STORAGE_KEY = 'iconComposer.ui.config.v1'

export function useNSPlateConfigTransfer(options: UseNSPlateConfigTransferOptions) {
  const { t } = useLocale()
  const dialog = useDialog()
  const configFileInputRef = ref<HTMLInputElement | null>(null)
  const isImportingConfig = ref(false)
  const canImportConfig = computed(() => !isImportingConfig.value)
  const hadInitialV2Draft = readNSPlateDraft() !== null
  const hasTriedLegacyStorageRestore = ref(false)

  watch(
    () => ({
      isLoading: options.isLoading.value,
      presetCount: options.presets.value.length,
      assetGroupCount: options.assetGroups.value.length
    }),
    () => {
      void restoreLegacyStoredConfigOnce()
    },
    { immediate: true }
  )

  function triggerConfigImport() {
    if (isImportingConfig.value) {
      return
    }

    configFileInputRef.value?.click()
  }

  async function importConfigFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    input.value = ''

    if (!file) {
      return
    }

    isImportingConfig.value = true

    try {
      await importConfigText(await file.text(), { notify: true })
    } catch (error) {
      await dialog.alert(t(importConfigErrorKey(error)))
    } finally {
      isImportingConfig.value = false
    }
  }

  async function pasteCurrentConfig() {
    if (isImportingConfig.value) {
      return
    }

    isImportingConfig.value = true

    try {
      await importConfigText(await readTextFromClipboard(), { notify: true })
    } catch (error) {
      await dialog.alert(t(pasteConfigErrorKey(error)))
    } finally {
      isImportingConfig.value = false
    }
  }

  async function copyCurrentConfig() {
    try {
      await copyTextToClipboard(createCurrentConfigJson())
      await dialog.alert(t(textKeys.nsplateCopyConfigSuccess))
    } catch {
      await dialog.alert(t(textKeys.nsplateCopyConfigError))
    }
  }

  function exportCurrentConfig() {
    downloadTextFile(createCurrentConfigJson(), createNSPlateConfigFilename(), 'application/json')
  }

  async function importConfigText(rawText: string, options_: { notify: boolean }) {
    const result = await importNSPlateConfigText(rawText, {
      presets: options.presets.value,
      assetGroups: options.assetGroups.value
    })

    options.portraitSide.value = result.portraitSide
    options.selectedPresetIdsByKind.value = result.selectedPresetIdsByKind
    options.selectedAssetIdsByCategory.value = result.selectedAssetIdsByCategory
    options.customPortrait.value = result.customPortrait
    options.infoDraft.value = result.infoDraft

    if (
      result.activePanel === 'portrait' ||
      result.activePanel === 'nameplate' ||
      result.activePanel === 'info'
    ) {
      options.activeTab.value = result.activePanel
    }

    if (options_.notify) {
      await dialog.alert(
        t(
          result.missingAssetCount > 0 || result.ignoredInfoLayerCount > 0
            ? textKeys.nsplateImportConfigPartial
            : textKeys.nsplateImportConfigSuccess
        )
      )
    }
  }

  async function restoreLegacyStoredConfigOnce() {
    if (
      hadInitialV2Draft ||
      hasTriedLegacyStorageRestore.value ||
      options.isLoading.value ||
      options.presets.value.length === 0 ||
      options.assetGroups.value.length === 0
    ) {
      return
    }

    hasTriedLegacyStorageRestore.value = true

    try {
      const raw = window.localStorage.getItem(LEGACY_CONFIG_STORAGE_KEY)

      if (!raw) {
        return
      }

      await importConfigText(raw, { notify: false })
    } catch (error) {
      console.warn('[NSPlate] Failed to restore legacy stored config:', error)
    }
  }

  function createCurrentConfigJson() {
    return createNSPlateConfigJson({
      portraitSide: options.portraitSide.value,
      selectedPresetIdsByKind: options.selectedPresetIdsByKind.value,
      selectedAssetIdsByCategory: options.selectedAssetIdsByCategory.value,
      customPortrait: options.customPortrait.value,
      infoDraft: options.infoDraft.value
    })
  }

  return {
    canImportConfig,
    configFileInputRef,
    copyCurrentConfig,
    createCurrentConfigJson,
    exportCurrentConfig,
    importConfigFile,
    isImportingConfig,
    pasteCurrentConfig,
    triggerConfigImport
  }
}

function importConfigErrorKey(error: unknown) {
  if (error instanceof NSPlateLegacyConfigImportError && error.code === 'zip-manifest') {
    return textKeys.nsplateImportConfigUnsupported
  }

  return textKeys.nsplateImportConfigError
}

function pasteConfigErrorKey(error: unknown) {
  if (error instanceof NSPlateLegacyConfigImportError) {
    return importConfigErrorKey(error)
  }

  return textKeys.nsplatePasteConfigError
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy')) {
      throw new Error('copy-failed')
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

async function readTextFromClipboard() {
  if (!navigator.clipboard?.readText) {
    throw new Error('clipboard-unavailable')
  }

  const text = await navigator.clipboard.readText()

  if (!text.trim()) {
    throw new NSPlateLegacyConfigImportError('empty')
  }

  return text
}

function downloadTextFile(text: string, filename: string, mimeType: string) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.download = filename
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
