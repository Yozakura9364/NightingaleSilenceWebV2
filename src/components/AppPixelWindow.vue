<template>
  <section class="app-pixel-window">
    <div class="app-pixel-window__bar">
      <span class="app-pixel-window__title">
        <span class="app-pixel-window__icon" aria-hidden="true"></span>
        <slot name="title">{{ title }}</slot>
      </span>
      <button
        v-if="closable"
        class="app-pixel-window__close"
        type="button"
        :aria-label="resolvedCloseLabel"
        @click="$emit('close')"
      >
        <span aria-hidden="true"></span>
      </button>
    </div>

    <div class="app-pixel-window__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/stores/locale'

const props = withDefaults(
  defineProps<{
    title: string
    closeLabel?: string
    closable?: boolean
  }>(),
  {
    closable: true
  }
)

const { t } = useLocale()
const resolvedCloseLabel = computed(() => props.closeLabel ?? t('common.close.window'))

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.app-pixel-window {
  display: grid;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-window-bg);
  box-shadow: var(--ns-pixel-window-shadow);
}

.app-pixel-window__bar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px;
  border-bottom: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bar-bg);
}

.app-pixel-window__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 950;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.app-pixel-window__icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  background: var(--ns-color-text);
}

.app-pixel-window__close {
  position: relative;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  cursor: pointer;
  transition:
    transform var(--ns-transition-fast),
    background var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.app-pixel-window__close:hover {
  transform: translate(-1px, -1px);
  background: var(--ns-pixel-hover-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.app-pixel-window__close:focus-visible {
  outline: 0;
  box-shadow: var(--ns-focus-ring);
}

.app-pixel-window__close:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.app-pixel-window__close span::before,
.app-pixel-window__close span::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 15px;
  height: 2px;
  background: currentColor;
  content: '';
  transform-origin: center;
}

.app-pixel-window__close span::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.app-pixel-window__close span::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.app-pixel-window__body {
  display: grid;
  gap: 12px;
  padding: 14px;
}
</style>
