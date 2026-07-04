<template>
  <div
    ref="tablistRef"
    class="app-tabs"
    :class="{
      'app-tabs--compact': density === 'compact',
      'app-tabs--stretch': stretch
    }"
    role="tablist"
    :aria-label="resolvedAriaLabel"
  >
    <button
      v-for="(item, index) in items"
      :id="`${idPrefix}-${item.value}`"
      :key="item.value"
      class="app-tabs__tab"
      :class="{ 'app-tabs__tab--active': item.value === modelValue }"
      type="button"
      role="tab"
      :aria-selected="item.value === modelValue"
      :tabindex="item.value === modelValue ? 0 : -1"
      :disabled="item.disabled"
      @click="selectTab(item)"
      @keydown="handleKeydown($event, index)"
    >
      <span>{{ item.label }}</span>
      <small v-if="item.meta">{{ item.meta }}</small>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

interface AppTabItem {
  value: string
  label: string
  meta?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    items: AppTabItem[]
    modelValue: string
    ariaLabel?: string
    idPrefix?: string
    density?: 'default' | 'compact'
    stretch?: boolean
  }>(),
  {
    idPrefix: 'app-tab',
    density: 'default',
    stretch: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useLocale()
const tablistRef = ref<HTMLElement | null>(null)
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t(textKeys.tabs))

function selectTab(item: AppTabItem) {
  if (item.disabled) {
    return
  }

  emit('update:modelValue', item.value)
}

function handleKeydown(event: KeyboardEvent, index: number) {
  const keyActions: Record<string, 'next' | 'previous' | 'first' | 'last'> = {
    ArrowRight: 'next',
    ArrowDown: 'next',
    ArrowLeft: 'previous',
    ArrowUp: 'previous',
    Home: 'first',
    End: 'last'
  }
  const action = keyActions[event.key]

  if (!action) {
    return
  }

  event.preventDefault()

  const enabledIndexes = props.items
    .map((item, itemIndex) => (item.disabled ? -1 : itemIndex))
    .filter((itemIndex) => itemIndex >= 0)

  if (!enabledIndexes.length) {
    return
  }

  const currentEnabledIndex = enabledIndexes.indexOf(index)
  const fallbackIndex = enabledIndexes.findIndex((itemIndex) => itemIndex > index)
  const safeCurrentIndex =
    currentEnabledIndex >= 0 ? currentEnabledIndex : Math.max(0, fallbackIndex)

  const targetIndexByAction = {
    next: enabledIndexes[(safeCurrentIndex + 1) % enabledIndexes.length],
    previous:
      enabledIndexes[(safeCurrentIndex - 1 + enabledIndexes.length) % enabledIndexes.length],
    first: enabledIndexes[0],
    last: enabledIndexes[enabledIndexes.length - 1]
  }

  const targetIndex = targetIndexByAction[action]
  const targetItem = props.items[targetIndex]

  if (!targetItem) {
    return
  }

  emit('update:modelValue', targetItem.value)
  nextTick(() => {
    tablistRef.value?.querySelectorAll<HTMLButtonElement>('.app-tabs__tab')[targetIndex]?.focus()
  })
}
</script>

<style scoped>
.app-tabs {
  display: inline-flex;
  min-width: 0;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 0;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  box-shadow: var(--ns-pixel-soft-shadow);
}

.app-tabs--stretch {
  display: flex;
  width: 100%;
}

.app-tabs__tab {
  display: inline-grid;
  min-width: 0;
  min-height: 38px;
  place-items: center;
  gap: 2px;
  padding: 6px 14px;
  border: 0;
  border-right: 2px solid var(--ns-pixel-border);
  background: transparent;
  color: var(--ns-pixel-muted, var(--ns-color-text-muted));
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  transition:
    background var(--ns-transition-fast),
    color var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.app-tabs--compact .app-tabs__tab {
  min-height: 32px;
  padding: 4px 10px;
}

.app-tabs--stretch .app-tabs__tab {
  flex: 1 1 0;
}

.app-tabs__tab:last-child {
  border-right: 0;
}

.app-tabs__tab span {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-tabs__tab small {
  color: inherit;
  font-size: 10px;
  opacity: 0.78;
}

.app-tabs__tab:hover,
.app-tabs__tab--active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
}

.app-tabs__tab:focus-visible {
  z-index: 1;
  outline: 0;
  box-shadow: inset 0 0 0 2px var(--ns-color-cyan), var(--ns-focus-ring);
}

.app-tabs__tab--active {
  box-shadow: inset 0 -3px 0 var(--ns-color-accent);
}

.app-tabs__tab:disabled {
  color: var(--ns-pixel-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.app-tabs__tab:disabled:hover {
  background: transparent;
}
</style>
