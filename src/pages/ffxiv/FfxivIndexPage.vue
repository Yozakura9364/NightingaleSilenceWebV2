<template>
  <main class="ns-page ffxiv-page">
    <div class="ns-page-shell">
      <RouterLink class="ffxiv-back" :to="siteRoutes.home">← {{ t(textKeys.back) }}</RouterLink>

      <p class="ns-eyebrow">{{ t(ffxivCategory.kickerKey) }}</p>
      <h1 class="ns-title">{{ t(ffxivCategory.titleKey) }}</h1>
      <p class="ns-lead">
        {{ t(ffxivCategory.descriptionKey) }}
      </p>

      <div class="ns-tool-grid">
        <RouterLink
          v-for="tool in ffxivTools"
          :key="tool.id"
          class="ns-panel ns-tool-card"
          :to="tool.route"
        >
          <div>
            <h2 class="ns-tool-card__title">{{ t(tool.titleKey) }}</h2>
            <p class="ns-tool-card__text">{{ t(tool.summaryKey) }}</p>
          </div>
          <span class="ns-status">{{ t(tool.statusLabelKey) }}</span>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ffxivTools, getCategory, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const ffxivCategory = getCategory('ffxiv') ?? {
  titleKey: textKeys.ffxivWorkshop,
  kickerKey: textKeys.placeholder,
  descriptionKey: textKeys.placeholder
}
const { t } = useLocale()
</script>

<style scoped>
.ffxiv-page {
  background: var(--ns-body-background);
}

.ffxiv-back {
  display: inline-flex;
  margin-bottom: 32px;
  color: var(--ns-color-text-muted);
  font-size: 14px;
  font-weight: 800;
}

.ffxiv-back:hover {
  color: var(--ns-color-accent-strong);
}
</style>
