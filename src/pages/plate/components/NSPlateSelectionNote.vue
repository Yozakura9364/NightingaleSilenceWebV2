<template>
  <aside class="nsplate-selection-note" :data-open="isOpen">
    <button
      class="nsplate-selection-note__summary"
      type="button"
      :aria-label="summaryLabel"
      :aria-expanded="isOpen"
      :title="summaryLabel"
      @click="isOpen = !isOpen"
    >
      <span
        class="nsplate-selection-note__summary-icon"
        :style="summaryIconStyle"
        aria-hidden="true"
      />
      <span v-if="isOpen" class="nsplate-selection-note__title">{{ title }}</span>
      <span
        v-if="isOpen || hasSelected"
        class="nsplate-selection-note__count"
        :data-compact="!isOpen"
      >
        {{ progressLabel }}
      </span>
    </button>

    <div v-if="isOpen" class="nsplate-selection-note__body">
      <button
        v-for="item in items"
        :key="item.sectionKey"
        class="nsplate-selection-note__item"
        :data-selected="item.selected"
        type="button"
        @click="emit('focus-item', item)"
      >
        <span
          class="nsplate-selection-note__icon"
          :style="iconStyle(item)"
          aria-hidden="true"
        />
        <span class="nsplate-selection-note__content">
          <span class="nsplate-selection-note__label">{{ item.label }}</span>
          <span class="nsplate-selection-note__value" :data-empty="!item.selected">
            {{ item.valueLabel }}
          </span>
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import circleIcon from '@/assets/icons/circle.svg'
import sparklesIcon from '@/assets/icons/sparkles.svg'
import type { NSPlateSelectionNoteItem } from '@/lib/plate/types'

const props = defineProps<{
  title: string
  items: NSPlateSelectionNoteItem[]
}>()

const emit = defineEmits<{
  'focus-item': [value: NSPlateSelectionNoteItem]
}>()

const isOpen = ref(false)
const selectedCount = computed(() => props.items.filter((item) => item.selected).length)
const hasSelected = computed(() => selectedCount.value > 0)
const progressLabel = computed(() => `${selectedCount.value}/${props.items.length}`)
const summaryLabel = computed(() => `${props.title} ${progressLabel.value}`)
const summaryIconStyle = computed(
  () =>
    ({
      '--nsplate-selection-note-icon': `url("${selectedCount.value > 0 ? sparklesIcon : circleIcon}")`
    }) as CSSProperties
)

function iconStyle(item: NSPlateSelectionNoteItem) {
  return {
    '--nsplate-selection-note-icon': `url("${item.selected ? sparklesIcon : circleIcon}")`
  } as CSSProperties
}
</script>

<style scoped>
.nsplate-selection-note {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 2;
  display: flex;
  max-height: calc(100% - 24px);
  width: min(260px, calc(100% - 24px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ns-color-border-strong);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 92%, transparent);
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--ns-color-text) 14%, transparent);
}

.nsplate-selection-note[data-open='false'] {
  width: auto;
  max-height: none;
}

.nsplate-selection-note__summary {
  display: flex;
  flex: 0 0 auto;
  width: 100%;
  min-width: 34px;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 9px;
  border: 0;
  background: color-mix(in srgb, var(--ns-color-cyan-soft) 42%, var(--ns-color-surface-solid));
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-align: left;
  cursor: pointer;
}

.nsplate-selection-note[data-open='false'] .nsplate-selection-note__summary {
  justify-content: center;
  width: auto;
  height: 34px;
  padding: 0 8px;
}

.nsplate-selection-note__summary-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  background: currentColor;
  color: var(--ns-color-accent-strong);
  image-rendering: pixelated;
  mask: var(--nsplate-selection-note-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-selection-note-icon) center / contain no-repeat;
}

.nsplate-selection-note__count {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
}

.nsplate-selection-note__count[data-compact='true'] {
  color: var(--ns-color-text);
  font-size: 10px;
  font-weight: 900;
}

.nsplate-selection-note__body {
  display: grid;
  min-height: 0;
  max-height: min(48vh, 340px);
  overflow-y: auto;
  padding: 6px;
  gap: 2px;
}

.nsplate-selection-note__item {
  display: grid;
  grid-template-columns: 15px minmax(0, 1fr);
  align-items: start;
  gap: 6px;
  width: 100%;
  padding: 5px 4px 6px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.nsplate-selection-note__item:hover,
.nsplate-selection-note__item:focus-visible {
  background: color-mix(in srgb, var(--ns-color-accent) 12%, transparent);
  outline: 0;
}

.nsplate-selection-note__icon {
  width: 13px;
  height: 13px;
  margin-top: 1px;
  background: currentColor;
  color: color-mix(in srgb, var(--ns-color-text-muted) 70%, transparent);
  image-rendering: pixelated;
  mask: var(--nsplate-selection-note-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-selection-note-icon) center / contain no-repeat;
}

.nsplate-selection-note__item[data-selected='true'] .nsplate-selection-note__icon {
  color: var(--ns-color-accent-strong);
}

.nsplate-selection-note__content {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.nsplate-selection-note__label {
  overflow: hidden;
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-selection-note__value {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-sans);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.nsplate-selection-note__value[data-empty='true'] {
  opacity: 0.72;
}
</style>
