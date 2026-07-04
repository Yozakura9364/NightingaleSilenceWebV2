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
      <AppNotebookList
        :items="notebookItems"
        :aria-label="summaryLabel"
        :height="288"
        :mobile-height="238"
        :min-width="218"
        :max-width="286"
        @select="focusNotebookItem"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import circleIcon from '@/assets/icons/circle.svg'
import sparklesIcon from '@/assets/icons/sparkles.svg'
import AppNotebookList from '@/components/AppNotebookList.vue'
import type { NSPlateSelectionNoteItem } from '@/lib/plate/types'

type NotebookItem = {
  id: string
  label: string
  value?: string
  active?: boolean
  disabled?: boolean
}

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
const notebookItems = computed<NotebookItem[]>(() =>
  props.items.map((item) => ({
    id: item.sectionKey,
    label: item.label,
    value: item.valueLabel,
    active: item.selected
  }))
)
const summaryIconStyle = computed(
  () =>
    ({
      '--nsplate-selection-note-icon': `url("${selectedCount.value > 0 ? sparklesIcon : circleIcon}")`
    }) as CSSProperties
)

function focusNotebookItem(item: NotebookItem) {
  const selectedItem = props.items.find((candidate) => candidate.sectionKey === item.id)

  if (selectedItem) {
    emit('focus-item', selectedItem)
  }
}
</script>

<style scoped>
.nsplate-selection-note {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 2;
  display: grid;
  max-height: calc(100% - 24px);
  max-width: min(320px, calc(100% - 24px));
  justify-items: start;
  gap: 6px;
  --ns-notebook-cutout: color-mix(in srgb, var(--ns-color-bg-soft) 88%, var(--ns-color-cyan-soft));
}

.nsplate-selection-note[data-open='false'] {
  max-height: none;
}

.nsplate-selection-note__summary {
  display: inline-flex;
  min-width: 34px;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  border: 2px solid var(--ns-notebook-border);
  background: var(--ns-notebook-paper);
  color: var(--ns-notebook-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-align: left;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.nsplate-selection-note[data-open='false'] .nsplate-selection-note__summary {
  justify-content: center;
  height: 32px;
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

.nsplate-selection-note__title {
  overflow: hidden;
  max-width: 138px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nsplate-selection-note__count {
  color: var(--ns-notebook-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
}

.nsplate-selection-note__count[data-compact='true'] {
  color: var(--ns-notebook-ink);
  font-size: 10px;
  font-weight: 900;
}

.nsplate-selection-note__body {
  max-width: 100%;
}

.nsplate-selection-note__body :deep(.app-notebook-list) {
  margin: 0;
}

@media (max-width: 980px) {
  .nsplate-selection-note {
    display: none;
  }
}
</style>
