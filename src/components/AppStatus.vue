<template>
  <div
    class="app-status"
    :class="[`app-status--${tone}`, { 'app-status--compact': compact }]"
    :role="resolvedRole"
    :aria-live="resolvedAriaLive"
  >
    <span class="app-status__mark" aria-hidden="true"></span>

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
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  border-radius: 0;
  background: var(--ns-pixel-surface, var(--ns-color-surface));
  color: var(--ns-pixel-ink, var(--ns-color-text));
  box-shadow: var(--ns-pixel-soft-shadow);
}

.app-status--compact {
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 6px 8px;
}

.app-status__mark {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-muted, var(--ns-color-text-muted));
}

.app-status--compact .app-status__mark {
  margin-top: 0;
}

.app-status__content {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.app-status__title {
  min-width: 0;
  font-family: var(--ns-font-decorative);
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
  color: var(--ns-pixel-muted, var(--ns-color-text-muted));
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
  margin-left: auto;
}

.app-status--info {
  border-color: var(--ns-status-info-border);
  background: var(--ns-status-info-bg);
}

.app-status--info .app-status__mark {
  background: var(--ns-color-cyan);
}

.app-status--success {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.app-status--success .app-status__mark {
  background: var(--ns-color-success);
}

.app-status--warning {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.app-status--warning .app-status__mark {
  background: var(--ns-color-warning);
}

.app-status--danger {
  border-color: var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
}

.app-status--danger .app-status__mark {
  background: var(--ns-color-danger);
}

.app-status--loading .app-status__mark {
  background: repeating-linear-gradient(
    90deg,
    var(--ns-color-accent) 0 4px,
    var(--ns-color-cyan) 4px 8px
  );
  animation: app-status-loading 680ms steps(2, end) infinite;
}

@keyframes app-status-loading {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 8px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-status--loading .app-status__mark {
    animation: none;
  }
}

@media (max-width: 520px) {
  .app-status {
    flex-wrap: wrap;
  }

  .app-status__actions {
    width: 100%;
    margin-left: 22px;
    justify-content: flex-start;
  }
}
</style>
