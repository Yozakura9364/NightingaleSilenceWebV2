<template>
  <div
    class="app-field"
    :class="{
      'app-field--compact': density === 'compact',
      'app-field--invalid': Boolean(error)
    }"
  >
    <component :is="labelTag" class="app-field__label" :for="labelFor">
      <span>{{ label }}</span>
      <span v-if="required" class="app-field__required" aria-hidden="true">*</span>
    </component>

    <div class="app-field__control">
      <slot />
    </div>

    <p v-if="error" class="app-field__message app-field__message--error">
      {{ error }}
    </p>
    <p v-else-if="description" class="app-field__message">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    forId?: string
    description?: string
    error?: string
    required?: boolean
    density?: 'default' | 'compact'
  }>(),
  {
    density: 'default',
    required: false
  }
)

const labelTag = computed(() => (props.forId ? 'label' : 'div'))
const labelFor = computed(() => props.forId || undefined)
</script>

<style scoped>
.app-field {
  display: grid;
  min-width: 0;
  gap: 7px;
}

.app-field--compact {
  gap: 5px;
}

.app-field__label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  color: var(--ns-pixel-ink, var(--ns-color-text));
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  line-height: 1.2;
}

.app-field__label span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-field__required {
  color: var(--ns-color-danger);
}

.app-field__control {
  min-width: 0;
}

.app-field__control :deep(input:not([type='checkbox']):not([type='radio'])),
.app-field__control :deep(select),
.app-field__control :deep(textarea) {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  color: var(--ns-pixel-ink, var(--ns-color-text));
  font: inherit;
  font-family: var(--ns-font-sans);
  font-size: 14px;
  box-shadow: var(--ns-control-inset-shadow);
  transition:
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.app-field--compact .app-field__control :deep(input:not([type='checkbox']):not([type='radio'])),
.app-field--compact .app-field__control :deep(select) {
  min-height: 34px;
  font-size: 13px;
}

.app-field--compact .app-field__control :deep(textarea) {
  min-height: 68px;
  padding-block: 7px;
}

.app-field__control :deep(select) {
  appearance: none;
  -webkit-appearance: none;
  padding-inline-start: var(--ns-select-padding-start);
  padding-inline-end: var(--ns-select-padding-end);
  background-color: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  background-image: var(--ns-select-caret-icon);
  background-position: right var(--ns-select-caret-right) center;
  background-repeat: no-repeat;
  background-size: var(--ns-select-caret-size) var(--ns-select-caret-size);
}

.app-field__control :deep(textarea) {
  min-height: 88px;
  padding-block: 9px;
  resize: vertical;
}

.app-field__control :deep(input:disabled),
.app-field__control :deep(select:disabled),
.app-field__control :deep(textarea:disabled) {
  background: var(--ns-color-surface-tint);
  color: var(--ns-pixel-disabled);
  cursor: not-allowed;
  opacity: 0.72;
}

.app-field__control :deep(input:focus),
.app-field__control :deep(select:focus),
.app-field__control :deep(textarea:focus) {
  outline: 0;
  border-color: var(--ns-pixel-border-cyan);
  box-shadow: var(--ns-control-inset-shadow), var(--ns-focus-ring);
}

.app-field--invalid .app-field__control :deep(input:not([type='checkbox']):not([type='radio'])),
.app-field--invalid .app-field__control :deep(select),
.app-field--invalid .app-field__control :deep(textarea) {
  border-color: var(--ns-color-danger);
}

.app-field__message {
  margin: 0;
  color: var(--ns-pixel-muted, var(--ns-color-text-muted));
  font-size: 12px;
  line-height: 1.45;
}

.app-field__message--error {
  color: var(--ns-color-danger);
  font-weight: 800;
}
</style>
