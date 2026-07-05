<template>
  <article
    class="nsarmoire-action-card"
    :class="{
      'nsarmoire-action-card--primary': primary,
      'nsarmoire-action-card--sticky-header': stickyHeader
    }"
  >
    <div class="nsarmoire-action-card__header">
      <span class="nsarmoire-action-card__title-group">
        <h3>{{ title }}</h3>
        <strong v-if="count !== null && count !== undefined">{{ count }}</strong>
      </span>
      <button
        v-if="toggleLabel"
        class="nsarmoire-action-card__toggle"
        type="button"
        @click="$emit('toggle')"
      >
        {{ toggleLabel }}
      </button>
    </div>

    <p v-if="summary" class="nsarmoire-action-card__summary">
      {{ summary }}
    </p>

    <slot />
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  count?: number | string | null
  summary?: string
  primary?: boolean
  toggleLabel?: string
  stickyHeader?: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.nsarmoire-action-card {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-action-card--primary {
  background: var(--ns-pixel-window-bg);
}

.nsarmoire-action-card__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}

.nsarmoire-action-card--sticky-header .nsarmoire-action-card__header {
  position: sticky;
  top: 0;
  z-index: 6;
  box-sizing: border-box;
  align-self: stretch;
  width: auto;
  max-width: none;
  margin: -12px -12px 0;
  padding: 8px 12px;
  border-bottom: 2px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  box-shadow: none;
}

.nsarmoire-action-card__title-group {
  display: inline-flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
}

.nsarmoire-action-card h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 14px;
  font-weight: 950;
  line-height: 1.35;
}

.nsarmoire-action-card__header strong {
  flex: 0 0 auto;
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
  line-height: 1;
}

.nsarmoire-action-card__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-action-card__toggle {
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  cursor: pointer;
}

.nsarmoire-action-card__toggle:hover,
.nsarmoire-action-card__toggle:focus-visible {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-hover-surface);
}
</style>
