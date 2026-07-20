<template>
  <main class="ns-page fashion-check-page">
    <div class="ns-page-shell fashion-check-page__shell">
      <header class="fashion-check-page__header">
        <h1 class="ns-heading-bloom">{{ t(keys.title) }}</h1>
        <div v-if="week" class="fashion-check-page__week">
          <strong>{{ week.theme }}</strong>
          <time v-if="challengePeriod">{{ challengePeriod }}</time>
        </div>
      </header>
      <AppTabs
        v-if="week"
        :items="tabItems"
        :model-value="activeTab"
        :aria-label="t(keys.views)"
        stretch
        @update:model-value="selectView"
      />
      <AppStatus v-if="loading" tone="info" :message="t(keys.loading)" />
      <AppStatus v-else-if="!week" tone="warning" :message="t(keys.unavailable)" />
      <RouterView v-else v-slot="{ Component }">
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
const tabRoutes = {
  solutions: siteRoutes.fashionCheck,
  gold: siteRoutes.fashionCheckGoldItems,
  sources: siteRoutes.fashionCheckSources
}
const tabItems = computed(() => [
  { value: 'solutions', label: t(keys.tabSolutions) },
  { value: 'gold', label: t(keys.tabGoldItems) },
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
    const dataVersion = Date.now()
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
</style>
