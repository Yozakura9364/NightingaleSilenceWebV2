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
        :selected-preset="selectedPreset"
        :selected-asset="previewAsset"
      />

      <NSPlateResizeHandle @start="startPanelResize" @step="resizePanelBy" />

      <NSPlateConfigPanel v-model="activeTab" :tabs="tabs">
        <template v-if="activeTab !== 'info'">
          <div class="nsplate-group-title" :class="`nsplate-group-title--${activeCanvasMode}`">
            <span class="nsplate-dot" />
            <span>{{ activeGroupTitle }}</span>
          </div>
          <NSPlatePresetPanel v-model:selected-id="selectedPresetId" :groups="activePresetGroups" />
          <NSPlateAssetPanel
            v-model:selected-id="selectedAssetId"
            :groups="assetGroups"
            :scope="activeAssetScope"
            :show-scope-tabs="false"
          />
        </template>

        <template v-else>
          <AppStatus tone="info" title="占位用，待编辑" message="占位用，待编辑" />
        </template>
      </NSPlateConfigPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import type { ApiBoundary } from '@/services/apiBoundaries'
import { useNSPlateData } from '@/pages/plate/composables/useNSPlateData'
import { useNSPlatePanelResize } from '@/pages/plate/composables/useNSPlatePanelResize'
import NSPlateAssetPanel from '@/pages/plate/components/NSPlateAssetPanel.vue'
import NSPlateCanvasArea from '@/pages/plate/components/NSPlateCanvasArea.vue'
import NSPlateConfigPanel from '@/pages/plate/components/NSPlateConfigPanel.vue'
import NSPlatePresetPanel from '@/pages/plate/components/NSPlatePresetPanel.vue'
import NSPlateResizeHandle from '@/pages/plate/components/NSPlateResizeHandle.vue'
import type {
  NSPlateAssetScope,
  NSPlateCanvasMode,
  NSPlatePanelTab,
  NSPlatePresetKind
} from '@/pages/plate/types'

const props = defineProps<{
  boundary: ApiBoundary
}>()

const {
  isLoading,
  errorText,
  presetGroups,
  assetGroups,
  selectedPresetId,
  selectedPreset,
  selectedAssetId,
  selectedAsset
} = useNSPlateData(props.boundary)

const { panelStyle, resizePanelBy, startPanelResize } = useNSPlatePanelResize()

const tabs: { value: NSPlatePanelTab; label: string }[] = [
  { value: 'portrait', label: '肖像' },
  { value: 'nameplate', label: '铭牌' },
  { value: 'info', label: '信息' }
]

const activeTab = ref<NSPlatePanelTab>('portrait')
const activeCanvasMode = ref<NSPlateCanvasMode>('portrait')
const previewAsset = computed(() => selectedAsset.value)
const activePresetKind = computed<NSPlatePresetKind>(() =>
  activeCanvasMode.value === 'portrait' ? 'banner' : 'charcard'
)
const activeAssetScope = computed<NSPlateAssetScope>(() => activeCanvasMode.value)
const activePresetGroups = computed(() =>
  presetGroups.value.filter((group) => group.kind === activePresetKind.value)
)
const activeGroupTitle = computed(() =>
  activeCanvasMode.value === 'portrait' ? '肖像图层（512×840）' : '铭牌图层（2560×1440）'
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

watch(
  [activePresetGroups, activePresetKind, selectedPreset],
  () => {
    if (selectedPreset.value?.kind === activePresetKind.value) {
      return
    }

    selectedPresetId.value = getFirstPresetIdForActiveMode()
  },
  { immediate: true }
)

watch(
  [assetGroups, activeAssetScope, selectedAsset],
  () => {
    if (selectedAsset.value?.scope === activeAssetScope.value) {
      return
    }

    selectedAssetId.value = getFirstAssetIdForActiveMode()
  },
  { immediate: true }
)

function getFirstPresetIdForActiveMode() {
  return activePresetGroups.value.flatMap((group) => group.presets)[0]?.id ?? null
}

function getFirstAssetIdForActiveMode() {
  return (
    assetGroups.value
      .filter((group) => group.scope === activeAssetScope.value)
      .flatMap((group) => group.assets)[0]?.id ?? null
  )
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

.nsplate-group-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 8px 0;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 900;
}

.nsplate-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--ns-color-accent);
}

.nsplate-group-title--portrait .nsplate-dot {
  background: var(--ns-color-success);
}

.nsplate-group-title--nameplate .nsplate-dot {
  background: var(--ns-color-cyan);
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
