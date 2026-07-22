<template>
  <main class="ns-page fashion-check-page">
    <div class="ns-page-shell fashion-check-page__shell ns-animate ns-animate--fade-in-up ns-animate-visible">
      <header ref="headerRef" class="fashion-check-page__header">
        <h1 class="ns-heading-bloom">{{ t(keys.title) }}</h1>
        <div v-if="week" class="fashion-check-page__week">
          <strong>{{ week.theme }}</strong>
          <time v-if="challengePeriod">{{ challengePeriod }}</time>
        </div>
      </header>
      <Transition name="fade" mode="out-in">
        <div v-if="loading" key="loading">
          <AppStatus tone="info" :message="t(keys.loading)" />
        </div>
        <div v-else-if="!week" key="unavailable">
          <AppStatus tone="warning" :message="t(keys.unavailable)" />
        </div>
        <div v-else key="content">
          <AppTabs
            :items="tabItems"
            :model-value="activeTab"
            :aria-label="t(keys.views)"
            stretch
            @update:model-value="selectView"
          />
          <RouterView v-slot="{ Component }">
            <FashionCheckSolutionsView
              v-if="activeTab === 'solutions'"
              :week="week"
              :showcase="week.referenceShowcase"
              :locale-catalog="localeCatalog"
            />
            <FashionCheckGoldItemsView
              v-else-if="activeTab === 'gold'"
              :week="week"
              :locale-catalog="localeCatalog"
            />
            <component :is="Component" v-else :week="week" />
          </RouterView>
        </div>
      </Transition>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppStatus from '@/components/AppStatus.vue'
import AppTabs from '@/components/AppTabs.vue'
import { useFetch } from '@/composables/useFetch'
import { siteRoutes } from '@/config/site'
import type { FashionCheckLocaleCatalog, FashionCheckWeek } from '@/lib/fashion-check/types'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import FashionCheckSolutionsView from '@/pages/fashion-check/views/FashionCheckSolutionsView.vue'
import FashionCheckGoldItemsView from '@/pages/fashion-check/views/FashionCheckGoldItemsView.vue'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const { api } = useFetch()
const route = useRoute()
const router = useRouter()
const week = ref<FashionCheckWeek | null>(null)
const localeCatalog = ref<FashionCheckLocaleCatalog>({ items: {}, dyes: {} })
const loading = ref(true)
const headerRef = ref<HTMLElement | null>(null)
const FASHION_CACHE_KEY = 'ns_fashion_check_week'
const FASHION_CATALOG_CACHE_KEY = 'ns_fashion_check_catalog'
const tabRoutes = {
  solutions: siteRoutes.fashionCheck,
  gold: siteRoutes.fashionCheckGoldItems,
  tags: siteRoutes.fashionCheckTags,
  sources: siteRoutes.fashionCheckSources
}
const tabItems = computed(() => [
  { value: 'solutions', label: t(keys.tabSolutions) },
  { value: 'gold', label: t(keys.tabGoldItems) },
  { value: 'tags', label: t(keys.tabTagDatabase) },
  { value: 'sources', label: t(keys.tabSources) }
])
const activeTab = computed(
  () => Object.entries(tabRoutes).find(([, path]) => path === route.path)?.[0] ?? 'solutions'
)
const challengePeriod = computed(() => {
  const challengeWindow = week.value?.challengeWindow
  if (!challengeWindow) return ''

  return `${formatChallengeDate(challengeWindow.startsAt)} - ${formatChallengeDate(challengeWindow.endsAt)}`
})

function selectView(value: string) {
  const path = tabRoutes[value as keyof typeof tabRoutes]
  if (path) void router.push(path)
}

function formatChallengeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date)
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return month && day ? `${month}.${day}` : ''
}

onMounted(async () => {
  try {
    const cached = sessionStorage.getItem(FASHION_CACHE_KEY)
    const cachedCatalog = sessionStorage.getItem(FASHION_CATALOG_CACHE_KEY)
    const now = Date.now()
    let skipFetch = false

    if (cached && cachedCatalog) {
      try {
        const { data, timestamp } = JSON.parse(cached) as { data: FashionCheckWeek; timestamp: number }
        const { data: catData } = JSON.parse(cachedCatalog) as { data: FashionCheckLocaleCatalog }
        if (now - timestamp < 30 * 60 * 1000) {
          week.value = data
          localeCatalog.value = catData
          skipFetch = true
        }
      } catch { /* invalid cache */ }
    }

    if (!skipFetch) {
      const dataVersion = now
      const [currentWeek, currentLocaleCatalog] = await Promise.all([
        api<FashionCheckWeek>('/data/fashion-check/current.json', {
          cache: 'no-store',
          query: { v: dataVersion }
        }),
        api<FashionCheckLocaleCatalog>('/data/fashion-check/current-locales.json', {
          cache: 'no-store',
          query: { v: dataVersion }
        })
      ])
      week.value = currentWeek
      localeCatalog.value = currentLocaleCatalog
      sessionStorage.setItem(FASHION_CACHE_KEY, JSON.stringify({ data: currentWeek, timestamp: now }))
      sessionStorage.setItem(FASHION_CATALOG_CACHE_KEY, JSON.stringify({ data: currentLocaleCatalog }))
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.fashion-check-page__shell {
  display: grid;
  width: min(var(--ns-content-width), calc(100vw - 32px));
  gap: 20px;
  padding-block: 16px 48px;
}
.fashion-check-page {
  font-family: var(--ns-font-sans);
}
.fashion-check-page__header {
  display: grid;
  gap: 5px;
}
.fashion-check-page__header h1 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 28px;
}
.fashion-check-page__week {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 20px;
}
.fashion-check-page__week strong {
  min-width: 0;
  font-size: 18px;
  overflow-wrap: anywhere;
}
.fashion-check-page__week time {
  color: var(--ns-color-accent-strong);
  font-size: 18px;
  white-space: nowrap;
}
@media (max-width: 760px) {
  .fashion-check-page__shell {
    width: min(100%, calc(100vw - 24px));
    padding-block: 14px 32px;
  }
}

/* State transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
