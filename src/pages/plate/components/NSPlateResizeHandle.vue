<template>
  <div
    class="nsplate-resize-handle"
    role="separator"
    aria-label="调整 NSPlate 配置面板宽度"
    aria-orientation="vertical"
    tabindex="0"
    @keydown="handleKeydown"
    @pointerdown="emit('start', $event)"
  />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  start: [event: PointerEvent]
  step: [delta: number]
}>()

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
  cursor: col-resize;
  outline: none;
  touch-action: none;
}

.nsplate-resize-handle::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 56px;
  border-radius: var(--ns-radius-pill);
  background: var(--ns-color-border-strong);
  content: '';
  transform: translate(-50%, -50%);
  transition:
    height var(--ns-transition-fast),
    background var(--ns-transition-fast);
}

.nsplate-resize-handle:hover::before,
.nsplate-resize-handle:focus-visible::before {
  height: 84px;
  background: var(--ns-color-cyan);
}

:global(.nsplate-is-resizing),
:global(.nsplate-is-resizing *) {
  cursor: col-resize;
  user-select: none !important;
}

:global(.nsplate-is-resizing) .nsplate-resize-handle::before {
  height: 84px;
  background: var(--ns-color-cyan);
}

@media (max-width: 980px) {
  .nsplate-resize-handle {
    display: none;
  }
}
</style>
