<template>
  <section class="nsplate-workspace" aria-live="polite">
    <p v-if="errorText" class="nsplate-workspace__status" data-state="error">
      {{ errorText }}
    </p>

    <div v-if="isLoading" class="nsplate-workspace__loading" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>

    <div v-else class="nsplate-main" :style="panelStyle">
      <NSPlateCanvasArea
        :api-base="boundary.apiBase"
        :mode="activeCanvasMode"
        :selected-assets="selectedAssets"
        :asset-groups="assetGroups"
        :custom-portrait="customPortrait"
        :info-draft="infoDraft"
        :can-clear-custom-portrait="customPortrait !== null"
        :can-clear-all="hasAnySelection"
        :can-import-config="!isImportingLegacyConfig"
        :selection-note-title="t(textKeys.nsplateCurrentCombination)"
        :selection-note-items="selectionNoteItems"
        @clear-custom-portrait="clearCustomPortrait"
        @clear-all="clearWorkbenchSelections"
        @import-config="triggerLegacyConfigImport"
        @focus-asset-section="focusAssetSection"
      />

      <NSPlateResizeHandle @start="startPanelResize" @step="resizePanelBy" />

      <NSPlateConfigPanel v-model="activeTab" :tabs="tabs">
        <template v-if="activeTab !== 'info'">
          <NSPlatePortraitUpload v-if="activeTab === 'portrait'" v-model="customPortrait" />
          <NSPlatePresetPanel
            :selected-id="activeSelectedPresetId"
            :groups="activePresetGroups"
            @update:selected-id="applyPresetById"
          />
          <NSPlateAssetPanel
            :selected-ids-by-category="selectedAssetIdsByCategory"
            :groups="activeAssetGroups"
            :scope="activeAssetScope"
            :show-scope-tabs="false"
            :focus-section-key="assetPanelFocusRequest?.sectionKey ?? null"
            :focus-request-id="assetPanelFocusRequest?.requestId ?? 0"
            @toggle:asset="toggleAsset"
          />
        </template>

        <template v-else>
          <NSPlateInfoPanel v-model="infoDraft" :asset-groups="assetGroups" />
        </template>
      </NSPlateConfigPanel>
    </div>

    <input
      ref="legacyConfigFileInputRef"
      class="nsplate-workspace__file-input"
      type="file"
      accept="application/json,.json,text/plain,.txt"
      :aria-label="t(textKeys.nsplateImportConfigInput)"
      @change="importLegacyConfigFile"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import { NSPLATE_NAMEPLATE_PRESET_CATEGORIES, NSPLATE_PORTRAIT_CATEGORIES } from '@/lib/plate/draft'
import { createNSPlateInfoDraft } from '@/lib/plate/infoLayers'
import {
  NSPlateLegacyConfigImportError,
  importNSPlateLegacyConfigText
} from '@/lib/plate/legacyConfig'
import { useLocale } from '@/stores/locale'
import type { ApiBoundary } from '@/services/apiBoundaries'
import { useNSPlateData } from '@/pages/plate/composables/useNSPlateData'
import { useNSPlateDraftPersistence } from '@/pages/plate/composables/useNSPlateDraftPersistence'
import { useNSPlatePanelResize } from '@/pages/plate/composables/useNSPlatePanelResize'
import { useNSPlateSelectionNote } from '@/pages/plate/composables/useNSPlateSelectionNote'
import NSPlateAssetPanel from '@/pages/plate/components/NSPlateAssetPanel.vue'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'
import NSPlateConfigPanel from '@/pages/plate/components/NSPlateConfigPanel.vue'
import NSPlateInfoPanel from '@/pages/plate/components/NSPlateInfoPanel.vue'
import NSPlatePresetPanel from '@/pages/plate/components/NSPlatePresetPanel.vue'
import NSPlatePortraitUpload from '@/pages/plate/components/NSPlatePortraitUpload.vue'
import NSPlateResizeHandle from '@/pages/plate/components/NSPlateResizeHandle.vue'
import type {
  NSPlateAssetScope,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage,
  NSPlatePanelTab,
  NSPlatePresetKind
} from '@/lib/plate/types'

const props = defineProps<{
  boundary: ApiBoundary
}>()
const { t } = useLocale()

const {
  isLoading,
  errorText,
  presetGroups,
  presets,
  assetGroups,
  selectedPresetIdsByKind,
  selectedAssetIdsByCategory,
  selectedAssets,
  toggleAsset,
  applyPreset,
  clearAllSelections
} = useNSPlateData(props.boundary)

const { panelStyle, resizePanelBy, startPanelResize } = useNSPlatePanelResize()
const customPortrait = ref<NSPlateCustomPortraitImage | null>(null)
const infoDraft = ref(createNSPlateInfoDraft())
const legacyConfigFileInputRef = ref<HTMLInputElement | null>(null)
const isImportingLegacyConfig = ref(false)

useNSPlateDraftPersistence({
  selectedPresetIdsByKind,
  selectedAssetIdsByCategory,
  customPortrait,
  infoDraft
})

const tabs = computed<{ value: NSPlatePanelTab; label: string }[]>(() => [
  { value: 'portrait', label: t(textKeys.nsplatePortrait) },
  { value: 'nameplate', label: t(textKeys.nsplateNameplate) },
  { value: 'info', label: t(textKeys.nsplateInfo) }
])

const activeTab = ref<NSPlatePanelTab>('portrait')
const activeCanvasMode = ref<NSPlateCanvasMode>('portrait')
const activePresetKind = computed<NSPlatePresetKind>(() =>
  activeCanvasMode.value === 'portrait' ? 'banner' : 'charcard'
)
const activeAssetScope = computed<NSPlateAssetScope>(() => activeCanvasMode.value)
const activePresetGroups = computed(() =>
  presetGroups.value.filter((group) => group.kind === activePresetKind.value)
)
const activeAssetCategories = computed<readonly string[]>(() =>
  activeCanvasMode.value === 'portrait'
    ? NSPLATE_PORTRAIT_CATEGORIES
    : NSPLATE_NAMEPLATE_PRESET_CATEGORIES
)
const activeAssetGroups = computed(() =>
  assetGroups.value.filter(
    (group) =>
      group.scope === activeAssetScope.value && activeAssetCategories.value.includes(group.category)
  )
)
const { selectionNoteItems, assetPanelFocusRequest, focusAssetSection } = useNSPlateSelectionNote({
  assetGroups,
  selectedAssetIdsByCategory,
  activeTab,
  activeCanvasMode
})
const activeSelectedPresetId = computed(() => selectedPresetIdsByKind.value[activePresetKind.value])
const hasAnySelection = computed(
  () =>
    customPortrait.value !== null ||
    selectedAssets.value.length > 0 ||
    Object.values(selectedPresetIdsByKind.value).some((presetId) => presetId !== null)
)
watch(
  activeTab,
  (tab) => {
    if (tab === 'portrait' || tab === 'nameplate') {
      activeCanvasMode.value = tab
    }
  },
  { immediate: true }
)

function applyPresetById(presetId: string) {
  const preset = presets.value.find((item) => item.id === presetId)

  if (preset) {
    applyPreset(preset)
  }
}

function clearWorkbenchSelections() {
  customPortrait.value = null
  clearAllSelections()
}

function clearCustomPortrait() {
  customPortrait.value = null
}

function triggerLegacyConfigImport() {
  if (isImportingLegacyConfig.value) {
    return
  }

  legacyConfigFileInputRef.value?.click()
}

async function importLegacyConfigFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''

  if (!file) {
    return
  }

  isImportingLegacyConfig.value = true

  try {
    const result = await importNSPlateLegacyConfigText(await file.text(), {
      presets: presets.value,
      assetGroups: assetGroups.value
    })

    selectedPresetIdsByKind.value = result.selectedPresetIdsByKind
    selectedAssetIdsByCategory.value = result.selectedAssetIdsByCategory
    customPortrait.value = result.customPortrait

    if (
      result.activePanel === 'portrait' ||
      result.activePanel === 'nameplate' ||
      result.activePanel === 'info'
    ) {
      activeTab.value = result.activePanel
    }

    window.alert(
      t(
        result.missingAssetCount > 0 || result.ignoredInfoLayerCount > 0
          ? textKeys.nsplateImportConfigPartial
          : textKeys.nsplateImportConfigSuccess
      )
    )
  } catch (error) {
    window.alert(t(importLegacyConfigErrorKey(error)))
  } finally {
    isImportingLegacyConfig.value = false
  }
}

function importLegacyConfigErrorKey(error: unknown) {
  if (error instanceof NSPlateLegacyConfigImportError && error.code === 'zip-manifest') {
    return textKeys.nsplateImportConfigUnsupported
  }

  return textKeys.nsplateImportConfigError
}
</script>

<style scoped>
.nsplate-workspace {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  background: var(--ns-color-bg);
}

.nsplate-workspace__status {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(214, 79, 114, 0.28);
  border-radius: var(--ns-radius-sm);
  background: rgba(214, 79, 114, 0.08);
  color: var(--ns-color-danger);
  font-size: 13px;
  font-weight: 850;
}

.nsplate-workspace__loading {
  display: grid;
  flex: 1;
  align-content: center;
  gap: 10px;
  padding: 18px;
  background: var(--ns-color-bg-soft);
}

.nsplate-workspace__loading span {
  display: block;
  height: 38px;
  border: 1px solid var(--ns-color-border);
  background: linear-gradient(90deg, var(--ns-color-surface), rgba(99, 217, 220, 0.14));
}

.nsplate-workspace__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.nsplate-main {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--ns-color-bg-soft);
}

@media (max-width: 980px) {
  .nsplate-workspace {
    min-height: auto;
  }

  .nsplate-main {
    display: grid;
    overflow: visible;
  }
}
</style>
