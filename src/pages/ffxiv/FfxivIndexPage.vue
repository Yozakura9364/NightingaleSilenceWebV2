<template>
  <main class="ns-page ffxiv-page">
    <div class="ns-page-shell">
      <RouterLink class="ffxiv-back" :to="siteRoutes.home">← {{ placeholderCopy }}</RouterLink>

      <p class="ns-eyebrow">{{ ffxivCategory.kicker }}</p>
      <h1 class="ns-title">{{ ffxivCategory.title }}</h1>
      <p class="ns-lead">
        {{ ffxivCategory.description }}
      </p>

      <div class="ns-tool-grid">
        <RouterLink
          v-for="tool in ffxivTools"
          :key="tool.id"
          class="ns-panel ns-tool-card"
          :to="tool.route"
        >
          <div>
            <h2 class="ns-tool-card__title">{{ tool.title }}</h2>
            <p class="ns-tool-card__text">{{ tool.summary }}</p>
          </div>
          <span class="ns-status">{{ tool.statusLabel }}</span>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ffxivTools, getCategory, siteRoutes } from '@/config/site'
import { placeholderCopy } from '@/config/site'

const ffxivCategory = getCategory('ffxiv') ?? {
  title: 'FF14 工具',
  kicker: placeholderCopy,
  description: placeholderCopy
}
</script>

<style scoped>
.ffxiv-page {
  background:
    linear-gradient(125deg, rgba(217, 251, 251, 0.5), rgba(255, 244, 251, 0.58) 58%, rgba(255, 255, 255, 0.7)),
    var(--ns-color-bg);
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
