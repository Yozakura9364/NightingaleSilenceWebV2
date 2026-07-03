<template>
  <NSPlatePanel :title="t(textKeys.nsplateAssets)">
    <div
      v-if="showScopeTabs"
      class="nsplate-asset-tabs"
      role="tablist"
      :aria-label="t(textKeys.nsplateAssets)"
    >
      <NSPlateChoiceButton
        v-for="scope in scopes"
        :key="scope"
        :active="activeScope === scope"
        tone="cyan"
        @click="activeScope = scope"
      >
        {{ scopeLabel(scope) }}
      </NSPlateChoiceButton>
    </div>

    <div class="nsplate-asset-sections">
      <p v-if="scopedGroups.length === 0" class="nsplate-asset-empty">{{ t(textKeys.noAssets) }}</p>

      <NSPlateAssetSection
        v-for="(group, index) in scopedGroups"
        :key="sectionKey(group)"
        :group="group"
        :open="isSectionOpen(group)"
        :panel-id="sectionPanelId(group, index)"
        :selected-id="selectedIdForGroup(group)"
        :empty-label="t(textKeys.noAssets)"
        :not-selected-label="t(textKeys.notSelected)"
        @toggle-open="toggleSection(group)"
        @select-asset="selectAsset"
      />
    </div>
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import { getPlateAssetSectionKey, type NSPlateAssetSelectionMap } from '@/lib/plate/draft'
import { useLocale } from '@/stores/locale'
import type { NSPlateAssetGroup, NSPlateAssetScope, NSPlateAssetSummary } from '@/lib/plate/types'
import NSPlateAssetSection from '@/pages/plate/components/NSPlateAssetSection.vue'
import NSPlateChoiceButton from '@/pages/plate/components/NSPlateChoiceButton.vue'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  groups: NSPlateAssetGroup[]
  selectedIdsByCategory: NSPlateAssetSelectionMap
  scope?: NSPlateAssetScope
  showScopeTabs?: boolean
}>()

const emit = defineEmits<{
  'toggle:asset': [value: NSPlateAssetSummary]
}>()

const { t } = useLocale()
const scopes = ['portrait', 'nameplate'] as const
const activeScope = ref<NSPlateAssetScope>('portrait')
const openSectionKeys = ref<Set<string>>(new Set())

const scopedGroups = computed(() =>
  props.groups.filter((group) => group.scope === (props.scope ?? activeScope.value))
)

function scopeLabel(scope: NSPlateAssetScope) {
  return scope === 'portrait' ? t(textKeys.nsplatePortrait) : t(textKeys.nsplateNameplate)
}
function sectionKey(group: NSPlateAssetGroup) {
  return getPlateAssetSectionKey(group.scope, group.category)
}

function sectionPanelId(group: NSPlateAssetGroup, index: number) {
  return `nsplate-asset-section-${group.scope}-${index}`
}

function isSectionOpen(group: NSPlateAssetGroup) {
  return openSectionKeys.value.has(sectionKey(group))
}

function toggleSection(group: NSPlateAssetGroup) {
  const key = sectionKey(group)
  const nextKeys = new Set(openSectionKeys.value)

  if (nextKeys.has(key)) {
    nextKeys.delete(key)
  } else {
    nextKeys.add(key)
  }

  openSectionKeys.value = nextKeys
}

function selectedIdForGroup(group: NSPlateAssetGroup) {
  return props.selectedIdsByCategory[sectionKey(group)] ?? null
}

function selectAsset(asset: NSPlateAssetSummary) {
  emit('toggle:asset', asset)
}

watch(
  () => props.scope,
  (scope) => {
    if (scope) {
      activeScope.value = scope
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.nsplate-asset-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.nsplate-asset-sections {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.nsplate-asset-empty {
  margin: 0;
  padding: 5px 2px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
}
</style>
