<template>
  <div
    class="nsplate-resize-handle"
    role="separator"
    :aria-label="t(textKeys.nsplateResizeConfigPanel)"
    aria-orientation="vertical"
    tabindex="0"
    @keydown="handleKeydown"
    @pointerdown="emit('start', $event)"
  >
    <span class="nsplate-resize-handle__icon" :style="handleIconStyle" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import moreVerticalIcon from '@/assets/icons/more-vertical.svg'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const emit = defineEmits<{
  start: [event: PointerEvent]
  step: [delta: number]
}>()
const { t } = useLocale()
const handleIconStyle = {
  '--nsplate-resize-handle-icon': `url("${moreVerticalIcon}")`
} as CSSProperties

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    emit('step', 24)
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    emit('step', -24)
  }
}
</script>

<style scoped>
.nsplate-resize-handle {
  position: relative;
  width: 10px;
  flex: 0 0 10px;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--ns-color-border-strong) 74%, transparent);
  cursor: col-resize;
  outline: none;
  touch-action: none;
  transition: color var(--ns-transition-fast);
}

.nsplate-resize-handle::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1px;
  height: 62px;
  border-radius: var(--ns-radius-pill);
  background: currentColor;
  content: '';
  transform: translate(-50%, -50%);
  transition: height var(--ns-transition-fast);
}

.nsplate-resize-handle__icon {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 14px;
  height: 22px;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--nsplate-resize-handle-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-resize-handle-icon) center / contain no-repeat;
  transform: translate(-50%, -50%);
}

.nsplate-resize-handle:hover,
.nsplate-resize-handle:focus-visible {
  color: var(--ns-color-cyan);
}

.nsplate-resize-handle:hover::before,
.nsplate-resize-handle:focus-visible::before {
  height: 84px;
}

:global(.nsplate-is-resizing),
:global(.nsplate-is-resizing *) {
  cursor: col-resize;
  user-select: none !important;
}

:global(.nsplate-is-resizing) .nsplate-resize-handle::before {
  height: 84px;
}

:global(.nsplate-is-resizing) .nsplate-resize-handle {
  color: var(--ns-color-cyan);
}

@media (max-width: 980px) {
  .nsplate-resize-handle {
    display: none;
  }
}
</style>
