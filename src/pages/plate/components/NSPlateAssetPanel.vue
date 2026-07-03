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

      <section
        v-for="(group, index) in scopedGroups"
        :key="sectionKey(group)"
        class="nsplate-asset-section"
        :data-open="isSectionOpen(group)"
        :data-selected="hasSelectedAsset(group)"
      >
        <button
          class="nsplate-asset-section__header"
          type="button"
          :aria-expanded="isSectionOpen(group)"
          :aria-controls="sectionPanelId(group, index)"
          @click="toggleSection(group)"
        >
          <span class="nsplate-asset-section__name">
            <span class="nsplate-asset-section__status-icon" aria-hidden="true" />
            <span>{{ group.label }}</span>
          </span>
          <span class="nsplate-asset-section__right">
            <span
              class="nsplate-asset-section__selected"
              :data-empty="!hasSelectedAsset(group)"
              :title="selectedLabelForGroup(group)"
            >
              {{ selectedLabelForGroup(group) }}
            </span>
            <span class="nsplate-asset-section__arrow" aria-hidden="true">▶</span>
          </span>
        </button>

        <div
          v-if="isSectionOpen(group)"
          :id="sectionPanelId(group, index)"
          class="nsplate-asset-section__body"
        >
          <p v-if="group.assets.length === 0" class="nsplate-asset-empty">
            {{ t(textKeys.noAssets) }}
          </p>

          <div v-else class="nsplate-asset-grid">
            <button
              v-for="asset in group.assets"
              :key="asset.id"
              class="nsplate-asset-card"
              :class="{ 'nsplate-asset-card--active': isAssetSelected(group, asset) }"
              type="button"
              @click="selectAsset(asset)"
            >
              <span class="nsplate-asset-card__image">
                <img
                  v-if="asset.previewUrl"
                  :src="asset.previewUrl"
                  :alt="asset.label"
                  loading="lazy"
                />
              </span>
              <span class="nsplate-asset-card__label">{{ asset.label }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import {
  getPlateAssetSectionKey,
  selectedAssetForGroup as resolveSelectedAssetForGroup,
  type NSPlateAssetSelectionMap
} from '@/lib/plate/draft'
import { useLocale } from '@/stores/locale'
import type { NSPlateAssetGroup, NSPlateAssetScope, NSPlateAssetSummary } from '@/lib/plate/types'
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

function selectedAssetForGroup(group: NSPlateAssetGroup) {
  return resolveSelectedAssetForGroup(props.selectedIdsByCategory, group)
}

function hasSelectedAsset(group: NSPlateAssetGroup) {
  return selectedAssetForGroup(group) !== null
}

function isAssetSelected(group: NSPlateAssetGroup, asset: NSPlateAssetSummary) {
  return props.selectedIdsByCategory[sectionKey(group)] === asset.id
}

function selectedLabelForGroup(group: NSPlateAssetGroup) {
  return selectedAssetForGroup(group)?.label ?? t(textKeys.notSelected)
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

.nsplate-asset-section {
  min-width: 0;
  overflow: visible;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 76%, transparent);
}

.nsplate-asset-section__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 7px 9px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 850;
  text-align: left;
  cursor: pointer;
}

.nsplate-asset-section[data-open='true'] .nsplate-asset-section__header {
  position: sticky;
  top: calc(var(--nsplate-config-scroll-padding, 10px) * -1);
  z-index: 3;
  border-bottom: 1px solid color-mix(in srgb, var(--ns-color-border) 76%, transparent);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 94%, var(--ns-color-cyan-soft));
  box-shadow: 0 2px 0 color-mix(in srgb, var(--ns-color-border) 50%, transparent);
}

.nsplate-asset-section__header:hover {
  background: color-mix(in srgb, var(--ns-color-cyan) 11%, transparent);
}

.nsplate-asset-section__name,
.nsplate-asset-section__right {
  display: flex;
  min-width: 0;
  align-items: center;
}

.nsplate-asset-section__name {
  gap: 6px;
}

.nsplate-asset-section__right {
  max-width: 180px;
  justify-content: flex-end;
  gap: 6px;
}

.nsplate-asset-section__status-icon {
  position: relative;
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border: 2px solid color-mix(in srgb, var(--ns-color-border-strong) 70%, transparent);
  background: var(--ns-color-surface-solid);
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ns-color-border) 38%, transparent);
}

.nsplate-asset-section__status-icon::before {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 3px;
  height: 3px;
  background: color-mix(in srgb, var(--ns-color-border-strong) 54%, transparent);
  box-shadow:
    5px 0 0 color-mix(in srgb, var(--ns-color-border-strong) 54%, transparent),
    0 5px 0 color-mix(in srgb, var(--ns-color-border-strong) 54%, transparent),
    5px 5px 0 color-mix(in srgb, var(--ns-color-border-strong) 54%, transparent);
  content: '';
}

.nsplate-asset-section[data-selected='true'] .nsplate-asset-section__status-icon {
  border-color: var(--ns-color-accent);
  background: color-mix(in srgb, var(--ns-color-accent) 14%, var(--ns-color-surface-solid));
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ns-color-accent) 24%, transparent);
}

.nsplate-asset-section[data-selected='true'] .nsplate-asset-section__status-icon::before {
  top: 7px;
  left: 2px;
  width: 3px;
  height: 3px;
  background: var(--ns-color-accent);
  box-shadow:
    3px 3px 0 var(--ns-color-accent),
    6px 0 0 var(--ns-color-accent),
    9px -3px 0 var(--ns-color-accent);
}

.nsplate-asset-section__name span:last-child,
.nsplate-asset-section__selected {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-asset-section__selected {
  padding: 1px 6px;
  border: 1px solid color-mix(in srgb, var(--ns-color-border) 70%, transparent);
  border-radius: var(--ns-radius-xs);
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 850;
}

.nsplate-asset-section__selected[data-empty='true'] {
  opacity: 0.72;
}

.nsplate-asset-section__arrow {
  color: var(--ns-color-text-muted);
  font-size: 9px;
  transition: transform 0.16s ease;
}

.nsplate-asset-section[data-open='true'] .nsplate-asset-section__arrow {
  transform: rotate(90deg);
}

.nsplate-asset-section__body {
  display: grid;
  gap: 8px;
  padding: 6px 7px 8px;
}

.nsplate-asset-empty {
  margin: 0;
  padding: 5px 2px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
}

.nsplate-asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
  align-content: start;
}

.nsplate-asset-card {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 76%, transparent);
  color: var(--ns-color-text);
  font: inherit;
  cursor: pointer;
}

.nsplate-asset-card:hover,
.nsplate-asset-card--active {
  border-color: rgba(239, 111, 178, 0.52);
  background: rgba(255, 225, 241, 0.62);
}

.nsplate-asset-card__image {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border-radius: var(--ns-radius-xs);
  background:
    linear-gradient(45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%);
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
  background-size: 12px 12px;
}

.nsplate-asset-card__image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.nsplate-asset-card__label {
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
