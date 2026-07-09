<template>
  <main class="ns-page about-page">
    <div class="ns-page-shell">
      <RouterLink class="about-back" :to="siteRoutes.home">← {{ t(textKeys.back) }}</RouterLink>
      <section class="ns-panel about-panel">
        <p class="ns-eyebrow">{{ t(textKeys.about) }}</p>
        <h1 class="ns-title">{{ t(siteMeta.zhNameKey) }}</h1>
        <p v-if="siteDescription" class="ns-lead">{{ siteDescription }}</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { siteMeta, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const siteDescription = computed(() => t(siteMeta.descriptionKey).trim())
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
