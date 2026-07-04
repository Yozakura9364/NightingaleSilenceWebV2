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

    <div ref="sectionsRef" class="nsplate-asset-sections">
      <p v-if="scopedGroups.length === 0" class="nsplate-asset-empty">{{ t(textKeys.noAssets) }}</p>

      <NSPlateAssetSection
        v-for="(group, index) in scopedGroups"
        :key="sectionKey(group)"
        :data-section-key="sectionKey(group)"
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
import { computed, nextTick, ref, watch } from 'vue'
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
  focusSectionKey?: string | null
  focusRequestId?: number
}>()

const emit = defineEmits<{
  'toggle:asset': [value: NSPlateAssetSummary]
}>()

const { t } = useLocale()
const scopes = ['portrait', 'nameplate'] as const
const activeScope = ref<NSPlateAssetScope>('portrait')
const openSectionKeys = ref<Set<string>>(new Set())
const sectionsRef = ref<HTMLElement | null>(null)

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

async function focusSection(sectionKey: string) {
  const canFocusSection = scopedGroups.value.some(
    (group) => getPlateAssetSectionKey(group.scope, group.category) === sectionKey
  )

  if (!canFocusSection) {
    return
  }

  const nextKeys = new Set(openSectionKeys.value)
  nextKeys.add(sectionKey)
  openSectionKeys.value = nextKeys

  await nextTick()

  const sectionElement = Array.from(sectionsRef.value?.children ?? []).find(
    (child) => (child as HTMLElement).dataset.sectionKey === sectionKey
  ) as HTMLElement | undefined

  sectionElement?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  sectionElement
    ?.querySelector<HTMLButtonElement>('.nsplate-asset-section__header')
    ?.focus({ preventScroll: true })
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

watch(
  () => props.focusRequestId,
  () => {
    if (props.focusSectionKey) {
      void focusSection(props.focusSectionKey)
    }
  },
  { flush: 'post' }
)
</script>

<style scoped>
.nsplate-asset-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--nsplate-section-stack-gap);
}

.nsplate-asset-sections {
  display: grid;
  gap: var(--nsplate-section-stack-gap);
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
