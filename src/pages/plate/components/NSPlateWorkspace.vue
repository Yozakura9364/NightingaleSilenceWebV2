<template>
  <section class="nsplate-workspace" aria-live="polite">
    <p v-if="errorText" class="nsplate-workspace__status" data-state="error">
      {{ errorText }}
    </p>

    <AppLoading
      v-if="isLoading"
      class="nsplate-workspace__loading"
      size="lg"
      :aria-label="t(textKeys.checking)"
    />

    <div v-else class="nsplate-main" :style="panelStyle">
      <NSPlateCanvasArea
        ref="canvasAreaRef"
        :layered-export-data-source="dataSource"
        :mode="activeCanvasMode"
        :portrait-side="portraitSide"
        :selected-assets="selectedAssets"
        :asset-groups="assetGroups"
        :custom-portrait="customPortrait"
        :info-draft="infoDraft"
        :selection-note-title="t(textKeys.nsplateLayerOrder)"
        :selection-note-items="selectionNoteItems"
        :can-clear-custom-portrait="customPortrait !== null"
        :can-clear-materials="hasAnyMaterialSelection"
        :create-config-json="createCurrentConfigJson"
        @focus-asset-section="focusAssetSection"
        @move-popout-layer="moveCustomPortraitPopoutLayer"
        @clear-custom-portrait="clearCustomPortrait"
        @clear-materials="clearMaterialSelections"
      />

      <NSPlateResizeHandle @start="startPanelResize" @step="resizePanelBy" />

      <NSPlateConfigPanel v-model="activeTab" :tabs="tabs">
        <template #toolbar>
          <NSPlateWorkbenchActions
            :can-import-config="canImportConfig"
            :can-export="canExportCanvas"
            :export-error-text="canvasExportErrorText"
            @import-config="triggerConfigImport"
            @paste-config="pasteCurrentConfig"
            @copy-config="copyCurrentConfig"
            @export-config="exportCurrentConfig"
            @export-image="exportCanvasImage"
            @export-layered-zip="exportCanvasLayeredZip"
          />
        </template>

        <template v-if="activeTab !== 'info'">
          <NSPlatePortraitSideSwitch v-if="activeTab === 'portrait'" v-model="portraitSide" />
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
      ref="configFileInputRef"
      class="nsplate-workspace__file-input"
      type="file"
      accept="application/json,.json,text/plain,.txt"
      :aria-label="t(textKeys.nsplateImportConfigInput)"
      @change="importConfigFile"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import { NSPLATE_NAMEPLATE_PRESET_CATEGORIES, NSPLATE_PORTRAIT_CATEGORIES } from '@/lib/plate/draft'
import type { NSPlateCanvasExportFormat } from '@/lib/plate/exportCanvas'
import { createNSPlateInfoDraft } from '@/lib/plate/infoLayers'
import { useLocale } from '@/stores/locale'
import type { ApiBoundary } from '@/services/apiBoundaries'
import { useNSPlateData } from '@/pages/plate/composables/useNSPlateData'
import { useNSPlateConfigTransfer } from '@/pages/plate/composables/useNSPlateConfigTransfer'
import { useNSPlateDraftPersistence } from '@/pages/plate/composables/useNSPlateDraftPersistence'
import { useNSPlatePanelResize } from '@/pages/plate/composables/useNSPlatePanelResize'
import { useNSPlateSelectionNote } from '@/pages/plate/composables/useNSPlateSelectionNote'
import { useNSPlateDataSource } from '@/pages/plate/services/nsplateDataSource'
import AppLoading from '@/components/AppLoading.vue'
import NSPlateAssetPanel from '@/pages/plate/components/NSPlateAssetPanel.vue'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'
import NSPlateConfigPanel from '@/pages/plate/components/NSPlateConfigPanel.vue'
import NSPlateInfoPanel from '@/pages/plate/components/NSPlateInfoPanel.vue'
import NSPlatePresetPanel from '@/pages/plate/components/NSPlatePresetPanel.vue'
import NSPlatePortraitSideSwitch from '@/pages/plate/components/NSPlatePortraitSideSwitch.vue'
import NSPlatePortraitUpload from '@/pages/plate/components/NSPlatePortraitUpload.vue'
import NSPlateResizeHandle from '@/pages/plate/components/NSPlateResizeHandle.vue'
import NSPlateWorkbenchActions from '@/pages/plate/components/NSPlateWorkbenchActions.vue'
import type {
  NSPlateAssetScope,
  NSPlateCanvasMode,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitPopoutLayerAnchor,
  NSPlatePanelTab,
  NSPlatePortraitSide,
  NSPlatePresetKind
} from '@/lib/plate/types'
import {
  NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS,
  normalizeNSPlateCustomPortraitPopoutLayerAnchor
} from '@/lib/plate/types'

const props = defineProps<{
  boundary: ApiBoundary
}>()
const { t } = useLocale()
const dataSource = useNSPlateDataSource(props.boundary.apiBase)

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
} = useNSPlateData(dataSource)

const { panelStyle, resizePanelBy, startPanelResize } = useNSPlatePanelResize()
const customPortrait = ref<NSPlateCustomPortraitImage | null>(null)
const infoDraft = ref(createNSPlateInfoDraft())
const portraitSide = ref<NSPlatePortraitSide>('right')
const activeTab = ref<NSPlatePanelTab>('portrait')
const activeCanvasMode = ref<NSPlateCanvasMode>('portrait')
const canvasAreaRef = ref<NSPlateCanvasAreaExpose | null>(null)

useNSPlateDraftPersistence({
  portraitSide,
  selectedPresetIdsByKind,
  selectedAssetIdsByCategory,
  customPortrait,
  infoDraft
})

const {
  canImportConfig,
  configFileInputRef,
  copyCurrentConfig,
  createCurrentConfigJson,
  exportCurrentConfig,
  importConfigFile,
  pasteCurrentConfig,
  triggerConfigImport
} = useNSPlateConfigTransfer({
  isLoading,
  presets,
  assetGroups,
  portraitSide,
  selectedPresetIdsByKind,
  selectedAssetIdsByCategory,
  customPortrait,
  infoDraft,
  activeTab
})

const tabs = computed<{ value: NSPlatePanelTab; label: string }[]>(() => [
  { value: 'portrait', label: t(textKeys.nsplatePortrait) },
  { value: 'nameplate', label: t(textKeys.nsplateNameplate) },
  { value: 'info', label: t(textKeys.nsplateInfo) }
])

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
  customPortrait,
  infoDraft,
  activeTab,
  activeCanvasMode
})
const activeSelectedPresetId = computed(() => selectedPresetIdsByKind.value[activePresetKind.value])
const canExportCanvas = computed(() => canvasAreaRef.value?.canExport ?? false)
const canvasExportErrorText = computed(() => canvasAreaRef.value?.exportErrorText ?? '')
const hasAnyMaterialSelection = computed(
  () =>
    selectedAssets.value.length > 0 ||
    Object.values(selectedPresetIdsByKind.value).some((presetId) => presetId !== null)
)
watch(
  activeTab,
  (tab) => {
    if (tab === 'portrait' || tab === 'nameplate') {
      activeCanvasMode.value = tab
      return
    }

    if (tab === 'info') {
      activeCanvasMode.value = 'nameplate'
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

function clearMaterialSelections() {
  clearAllSelections()
}

function clearCustomPortrait() {
  customPortrait.value = null
}

function moveCustomPortraitPopoutLayer(direction: 'up' | 'down') {
  const currentPortrait = customPortrait.value

  if (!currentPortrait || currentPortrait.mode !== 'popout') {
    return
  }

  const currentAnchor = normalizeNSPlateCustomPortraitPopoutLayerAnchor(
    currentPortrait.popoutLayerAnchor
  )
  const currentIndex = NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS.indexOf(currentAnchor)
  const nextIndex =
    direction === 'up'
      ? Math.min(NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1)
  const nextAnchor = NSPLATE_CUSTOM_PORTRAIT_POPOUT_LAYER_ANCHORS[
    nextIndex
  ] as NSPlateCustomPortraitPopoutLayerAnchor

  if (nextAnchor === currentAnchor) {
    return
  }

  customPortrait.value = {
    ...currentPortrait,
    popoutLayerAnchor: nextAnchor
  }
}

function exportCanvasImage(payload: { format: NSPlateCanvasExportFormat; scale: number }) {
  void canvasAreaRef.value?.exportImage(payload)
}

function exportCanvasLayeredZip(payload: { scale: number }) {
  void canvasAreaRef.value?.exportLayeredZip(payload)
}

interface NSPlateCanvasAreaExpose {
  canExport: boolean
  exportErrorText: string
  exportImage: (payload: { format: NSPlateCanvasExportFormat; scale: number }) => Promise<void>
  exportLayeredZip: (payload: { scale: number }) => Promise<void>
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
  flex: 1;
  background: var(--ns-color-bg-soft);
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
