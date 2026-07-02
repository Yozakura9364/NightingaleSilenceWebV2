<template>
  <main class="ns-page about-page">
    <div class="ns-page-shell">
      <RouterLink class="about-back" :to="siteRoutes.home">← {{ placeholderCopy }}</RouterLink>
      <section class="ns-panel about-panel">
        <p class="ns-eyebrow">About</p>
        <h1 class="ns-title">{{ placeholderCopy }}</h1>
        <p class="ns-lead">
          {{ placeholderCopy }}
        </p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { placeholderCopy, siteRoutes } from '@/config/site'
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
