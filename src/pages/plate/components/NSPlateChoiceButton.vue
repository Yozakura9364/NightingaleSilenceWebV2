<template>
  <button
    type="button"
    class="nsplate-choice-button"
    :data-active="active"
    :data-layout="layout"
    :data-tone="tone"
  >
    <span class="nsplate-choice-button__label">
      <slot />
    </span>
    <small v-if="meta != null || $slots.meta" class="nsplate-choice-button__meta">
      <slot name="meta">{{ meta }}</slot>
    </small>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean
    layout?: 'split' | 'center'
    meta?: string | number
    tone?: 'accent' | 'cyan'
  }>(),
  {
    active: false,
    layout: 'split',
    meta: undefined,
    tone: 'accent'
  }
)
</script>

<style scoped>
.nsplate-choice-button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 8px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 86%, transparent);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
}

.nsplate-choice-button[data-layout='center'] {
  display: flex;
  min-height: 36px;
  justify-content: center;
  text-align: center;
}

.nsplate-choice-button[data-tone='accent']:hover,
.nsplate-choice-button[data-tone='accent'][data-active='true'] {
  border-color: color-mix(in srgb, var(--ns-color-accent) 62%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-accent) 16%, var(--ns-color-surface-solid));
}

.nsplate-choice-button[data-tone='cyan']:hover,
.nsplate-choice-button[data-tone='cyan'][data-active='true'] {
  border-color: color-mix(in srgb, var(--ns-color-cyan) 66%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 16%, var(--ns-color-surface-solid));
}

.nsplate-choice-button__label,
.nsplate-choice-button__meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-choice-button__meta {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
  font-weight: 900;
}
</style>
