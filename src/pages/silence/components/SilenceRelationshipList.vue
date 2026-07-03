<template>
  <div class="silence-character-card-grid">
    <RouterLink
      v-for="relationship in relationships"
      :key="relationship.id"
      class="silence-character-card silence-character-card--link"
      :to="relationship.route"
    >
      <span>{{ t(relationship.labelKey) }}</span>
      <strong>{{ relationship.name }}</strong>
      <p>{{ t(relationship.summaryKey) }}</p>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '@/stores/locale'

export interface SilenceRelationshipCard {
  id: string
  name: string
  route: string
  labelKey: string
  summaryKey: string
}

defineProps<{
  relationships: SilenceRelationshipCard[]
}>()

const { t } = useLocale()
</script>

<style scoped>
.silence-character-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.silence-character-card {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 16px;
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.07);
}

.silence-character-card--link {
  color: inherit;
  text-decoration: none;
}

.silence-character-card--link:hover {
  background: color-mix(in srgb, var(--silence-character-color), #ffffff 74%);
}

.silence-character-card span {
  color: color-mix(in srgb, var(--silence-character-color), #2c2338 44%);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.silence-character-card strong {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: 24px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-character-card p {
  margin: 0;
  color: rgba(49, 40, 63, 0.68);
}

@media (max-width: 920px) {
  .silence-character-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
