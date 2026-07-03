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
        :mode="activeCanvasMode"
        :selected-assets="selectedAssets"
        :custom-portrait="customPortrait"
        :can-clear-custom-portrait="customPortrait !== null"
        :can-clear-all="hasAnySelection"
        @clear-custom-portrait="clearCustomPortrait"
        @clear-all="clearWorkbenchSelections"
      />

      <NSPlateResizeHandle @start="startPanelResize" @step="resizePanelBy" />

      <NSPlateConfigPanel v-model="activeTab" :tabs="tabs">
        <template v-if="activeTab !== 'info'">
          <NSPlatePortraitUpload
            v-if="activeTab === 'portrait'"
            v-model="customPortrait"
          />
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
            @toggle:asset="toggleAsset"
          />
        </template>

        <template v-else>
          <AppStatus
            tone="info"
            :title="t(textKeys.placeholder)"
            :message="t(textKeys.placeholder)"
          />
        </template>
      </NSPlateConfigPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import {
  NSPLATE_NAMEPLATE_PRESET_CATEGORIES,
  NSPLATE_PORTRAIT_CATEGORIES
} from '@/lib/plate/draft'
import { useLocale } from '@/stores/locale'
import type { ApiBoundary } from '@/services/apiBoundaries'
import { useNSPlateData } from '@/pages/plate/composables/useNSPlateData'
import { useNSPlatePanelResize } from '@/pages/plate/composables/useNSPlatePanelResize'
import NSPlateAssetPanel from '@/pages/plate/components/NSPlateAssetPanel.vue'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'
import NSPlateConfigPanel from '@/pages/plate/components/NSPlateConfigPanel.vue'
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
