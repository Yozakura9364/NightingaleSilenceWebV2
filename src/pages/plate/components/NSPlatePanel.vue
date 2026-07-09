<template>
  <section class="nsplate-panel">
    <header v-if="title || meta || $slots.header" class="nsplate-panel__header">
      <slot name="header">
        <h4 v-if="title" class="ns-heading-bloom">{{ title }}</h4>
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
  gap: var(--nsplate-panel-title-gap);
  min-width: 0;
  padding: 0 2px;
  border: 0;
  background: transparent;
}

.nsplate-panel + .nsplate-panel {
  margin-top: var(--nsplate-panel-stack-gap);
}

.nsplate-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsplate-panel__header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
}

.nsplate-panel__header small {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 900;
}
</style>
