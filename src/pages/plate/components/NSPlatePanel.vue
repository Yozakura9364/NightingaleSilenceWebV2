<template>
  <section class="nsplate-panel">
    <header v-if="title || meta || $slots.header" class="nsplate-panel__header">
      <slot name="header">
        <h4 v-if="title">{{ title }}</h4>
        <small v-if="meta">{{ meta }}</small>
      </slot>
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  meta?: string
}>()
</script>

<style scoped>
.nsplate-panel {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--ns-color-border);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 66%, transparent);
}

.nsplate-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsplate-panel__header h4 {
  margin: 0;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 900;
}

.nsplate-panel__header small {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 900;
}
</style>
