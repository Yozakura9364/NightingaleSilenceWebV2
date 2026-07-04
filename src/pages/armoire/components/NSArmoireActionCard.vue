<template>
  <article class="nsarmoire-action-card" :class="{ 'nsarmoire-action-card--primary': primary }">
    <div class="nsarmoire-action-card__header">
      <h3>{{ title }}</h3>
      <strong v-if="count !== null && count !== undefined">{{ count }}</strong>
    </div>

    <p v-if="summary" class="nsarmoire-action-card__summary">
      {{ summary }}
    </p>

    <slot />

    <div v-if="toggleLabel" class="nsarmoire-action-card__footer">
      <AppButton @click="$emit('toggle')">
        {{ toggleLabel }}
      </AppButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'

defineProps<{
  title: string
  count?: number | string | null
  summary?: string
  primary?: boolean
  toggleLabel?: string
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
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.nsarmoire-action-card h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 14px;
  font-weight: 950;
}

.nsarmoire-action-card__header strong {
  font-family: var(--ns-font-decorative);
  font-size: 20px;
}

.nsarmoire-action-card__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-action-card__footer {
  display: flex;
  justify-content: flex-start;
}
</style>
