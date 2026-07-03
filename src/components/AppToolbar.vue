<template>
  <div
    class="app-toolbar"
    :class="{
      'app-toolbar--compact': density === 'compact',
      'app-toolbar--nowrap': !wrap
    }"
    role="toolbar"
    :aria-label="resolvedAriaLabel"
  >
    <div v-if="title || $slots.start" class="app-toolbar__section app-toolbar__section--start">
      <strong v-if="title" class="app-toolbar__title">{{ title }}</strong>
      <slot name="start" />
    </div>

    <div class="app-toolbar__section app-toolbar__section--main">
      <slot />
    </div>

    <div v-if="$slots.end" class="app-toolbar__section app-toolbar__section--end">
      <slot name="end" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const props = withDefaults(
  defineProps<{
    title?: string
    ariaLabel?: string
    density?: 'default' | 'compact'
    wrap?: boolean
  }>(),
  {
    density: 'default',
    wrap: true
  }
)

const { t } = useLocale()
const resolvedAriaLabel = computed(() => props.ariaLabel || props.title || t(textKeys.toolbar))
</script>

<style scoped>
.app-toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface, var(--ns-color-surface));
  box-shadow: var(--ns-pixel-soft-shadow);
}

.app-toolbar--compact {
  gap: 8px;
  padding: 8px;
}

.app-toolbar--nowrap {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.app-toolbar__section {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.app-toolbar--nowrap .app-toolbar__section {
  flex-wrap: nowrap;
}

.app-toolbar__section--main {
  flex: 1 1 auto;
}

.app-toolbar__section--end {
  justify-content: flex-end;
  margin-left: auto;
}

.app-toolbar__title {
  min-width: 0;
  color: var(--ns-pixel-ink, var(--ns-color-text));
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
