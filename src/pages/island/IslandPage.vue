<template>
  <main class="ns-page island-page">
    <div class="ns-page-shell island-page__shell ns-animate ns-animate--fade-in-up ns-animate-visible">
      <header class="island-page__header">
        <h1 class="ns-heading-bloom">{{ t(islandTextKeys.title) }}</h1>
      </header>
      <AppTabs
        :items="tabItems"
        :model-value="activeTab"
        :aria-label="t(islandTextKeys.views)"
        stretch
        @update:model-value="selectView"
      />
      <RouterView />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTabs from '@/components/AppTabs.vue'
import { siteRoutes } from '@/config/site'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const route = useRoute()
const router = useRouter()

const tabRoutes = {
  goods: siteRoutes.island,
  map: siteRoutes.islandMap,
  codex: siteRoutes.islandCodex,
  animals: siteRoutes.islandAnimals,
  rewards: siteRoutes.islandRewards,
  guide: siteRoutes.islandGuide,
  ranks: siteRoutes.islandRanks
}

const tabItems = computed(() => [
  { value: 'goods', label: t(islandTextKeys.tabGoods) },
  { value: 'map', label: t(islandTextKeys.tabMap) },
  { value: 'codex', label: t(islandTextKeys.tabCodex) },
  { value: 'animals', label: t(islandTextKeys.tabAnimals) },
  { value: 'rewards', label: t(islandTextKeys.tabRewards) },
  { value: 'guide', label: t(islandTextKeys.tabGuide) },
  { value: 'ranks', label: t(islandTextKeys.tabRanks) }
])

const activeTab = computed(
  () => Object.entries(tabRoutes).find(([, path]) => path === route.path)?.[0] ?? 'goods'
)

function selectView(value: string) {
  const path = tabRoutes[value as keyof typeof tabRoutes]
  if (path) {
    void router.push(path)
  }
}
</script>

<style scoped>
.island-page {
  font-family: var(--ns-font-ui);
}
.island-page__shell {
  display: grid;
  width: min(var(--ns-content-width), calc(100vw - 32px));
  gap: 20px;
  padding-block: 16px 48px;
}
.island-page__header {
  display: grid;
  gap: 5px;
}
.island-page__header h1 {
  margin: 0;
  font-family: var(--ns-font-ui);
  font-size: 28px;
}
@media (max-width: 760px) {
  .island-page__shell {
    width: min(100%, calc(100vw - 24px));
    padding-block: 14px 32px;
  }
}
</style>
