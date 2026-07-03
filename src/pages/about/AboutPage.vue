<template>
  <main class="ns-page about-page">
    <div class="ns-page-shell">
      <RouterLink class="about-back" :to="siteRoutes.home">← {{ t(textKeys.back) }}</RouterLink>
      <section class="ns-panel about-panel">
        <p class="ns-eyebrow">{{ t(textKeys.about) }}</p>
        <h1 class="ns-title">{{ t(textKeys.placeholder) }}</h1>
        <p class="ns-lead">
          {{ t(textKeys.placeholder) }}
        </p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
</script>

<style scoped>
.about-page {
  background: var(--ns-color-bg);
}

.about-back {
  display: inline-flex;
  margin-bottom: 24px;
  color: var(--ns-color-text-muted);
  font-size: 14px;
  font-weight: 800;
}

.about-panel {
  padding: clamp(28px, 5vw, 56px);
}
</style>
