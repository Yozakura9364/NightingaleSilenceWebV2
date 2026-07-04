<template>
  <section class="nsplate-asset-section" :data-open="open" :data-selected="hasSelectedAsset">
    <button
      class="nsplate-asset-section__header"
      type="button"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="emit('toggle-open')"
    >
      <span class="nsplate-asset-section__name">
        <span
          class="nsplate-asset-section__status-icon"
          :style="statusIconStyle"
          aria-hidden="true"
        />
        <span>{{ group.label }}</span>
      </span>
      <span class="nsplate-asset-section__right">
        <span
          class="nsplate-asset-section__selected"
          :data-empty="!hasSelectedAsset"
          :title="selectedLabel"
        >
          {{ selectedLabel }}
        </span>
        <span class="nsplate-asset-section__arrow" aria-hidden="true" />
      </span>
    </button>

    <div v-if="open" :id="panelId" class="nsplate-asset-section__body">
      <p v-if="group.assets.length === 0" class="nsplate-asset-empty">
        {{ emptyLabel }}
      </p>

      <div v-else class="nsplate-asset-grid">
        <NSPlateAssetCard
          v-for="asset in group.assets"
          :key="asset.id"
          :asset="asset"
          :active="asset.id === selectedId"
          @select="emit('select-asset', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import circleIcon from '@/assets/icons/circle.svg'
import sparklesIcon from '@/assets/icons/sparkles.svg'
import type { NSPlateAssetGroup, NSPlateAssetSummary } from '@/lib/plate/types'
import NSPlateAssetCard from '@/pages/plate/components/NSPlateAssetCard.vue'

const props = defineProps<{
  group: NSPlateAssetGroup
  open: boolean
  panelId: string
  selectedId: string | null
  emptyLabel: string
  notSelectedLabel: string
}>()

const emit = defineEmits<{
  'toggle-open': []
  'select-asset': [value: NSPlateAssetSummary]
}>()

const selectedAsset = computed(
  () => props.group.assets.find((asset) => asset.id === props.selectedId) ?? null
)
const hasSelectedAsset = computed(() => selectedAsset.value !== null)
const selectedLabel = computed(() => selectedAsset.value?.label ?? props.notSelectedLabel)
const statusIconStyle = computed(
  () =>
    ({
      '--nsplate-asset-section-status-icon': `url("${hasSelectedAsset.value ? sparklesIcon : circleIcon}")`
    }) as CSSProperties
)
</script>

<style scoped>
.nsplate-asset-section {
  min-width: 0;
  overflow: visible;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 76%, transparent);
}

.nsplate-asset-section__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(
      72px,
      var(--nsplate-asset-section-status-column, 116px)
    );
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 7px var(--ns-control-caret-box-right) 7px 9px;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--ns-control-caret-box-size);
  justify-content: end;
  gap: 6px;
}

.nsplate-asset-section__status-icon {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  background: currentColor;
  color: color-mix(in srgb, var(--ns-color-text-muted) 68%, transparent);
  image-rendering: pixelated;
  mask: var(--nsplate-asset-section-status-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-asset-section-status-icon) center / contain no-repeat;
}

.nsplate-asset-section[data-selected='true'] .nsplate-asset-section__status-icon {
  color: var(--ns-color-accent-strong);
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--ns-color-accent) 38%, transparent));
}

.nsplate-asset-section__name span:last-child,
.nsplate-asset-section__selected {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-asset-section__selected {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
  line-height: 1;
  text-align: right;
}

.nsplate-asset-section[data-selected='true'] .nsplate-asset-section__selected {
  color: var(--ns-color-accent-strong);
  text-shadow: 0 0 5px color-mix(in srgb, var(--ns-color-accent) 24%, transparent);
}

.nsplate-asset-section__selected[data-empty='true'] {
  color: var(--ns-color-text-muted);
  opacity: 0.72;
  text-shadow: none;
}

.nsplate-asset-section__arrow {
  display: grid;
  width: var(--ns-control-caret-box-size);
  height: var(--ns-control-caret-box-size);
  flex: 0 0 var(--ns-control-caret-box-size);
  place-items: center;
  color: color-mix(in srgb, var(--ns-color-text) 58%, var(--ns-color-text-muted));
  image-rendering: pixelated;
  transition: color 0.16s ease;
}

.nsplate-asset-section__arrow::before {
  display: block;
  width: 13px;
  height: 15px;
  background:
    linear-gradient(currentColor 0 0) 2px 0 / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 5px 3px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 8px 6px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 5px 9px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 2px 12px / 3px 3px no-repeat;
  content: '';
}

.nsplate-asset-section[data-open='true'] .nsplate-asset-section__arrow {
  color: var(--ns-color-accent-strong);
}

.nsplate-asset-section[data-open='true'] .nsplate-asset-section__arrow::before {
  width: 15px;
  height: 13px;
  background:
    linear-gradient(currentColor 0 0) 0 2px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 3px 5px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 6px 8px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 9px 5px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 12px 2px / 3px 3px no-repeat;
}

.nsplate-asset-section__body {
  display: grid;
  gap: var(--nsplate-section-body-gap);
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
  gap: var(--nsplate-section-body-gap);
  align-content: start;
}
</style>
