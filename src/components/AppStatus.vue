<template>
  <div
    class="app-status"
    :class="[`app-status--${tone}`, { 'app-status--compact': compact }]"
    :role="resolvedRole"
    :aria-live="resolvedAriaLive"
  >
    <div class="app-status__content">
      <strong v-if="title" class="app-status__title">{{ title }}</strong>
      <p v-if="message" class="app-status__message">{{ message }}</p>
      <slot v-else />
    </div>

    <div v-if="$slots.actions" class="app-status__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
    compact?: boolean
    role?: 'status' | 'alert' | 'note'
    ariaLive?: 'off' | 'polite' | 'assertive'
  }>(),
  {
    tone: 'neutral',
    compact: false
  }
)

const resolvedRole = computed(() => props.role || (props.tone === 'danger' ? 'alert' : 'status'))
const resolvedAriaLive = computed(
  () => props.ariaLive || (props.tone === 'danger' ? 'assertive' : 'polite')
)
</script>

<style scoped>
.app-status {
  min-width: 0;
  color: var(--ns-color-text-muted);
}

.app-status--compact {
  font-size: 12px;
}

.app-status__content {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.app-status__title {
  min-width: 0;
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 950;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-status__message,
.app-status__content :deep(p) {
  margin: 0;
  color: inherit;
  font-size: 12px;
  line-height: 1.45;
}

.app-status__actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}

.app-status--success {
  color: var(--ns-color-success);
}

.app-status--warning {
  color: var(--ns-color-warning);
}

.app-status--danger {
  color: var(--ns-color-danger);
}
</style>
