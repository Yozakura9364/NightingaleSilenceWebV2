<template>
  <section class="island-view">
    <IslandFilterBar v-model="query" :count="filteredItemCount" :total="totalItemCount" />
    <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />
    <template v-else-if="!loading">
      <div
        v-for="shop in filteredShops"
        :key="shop.shopId"
        class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
      >
        <h2>
          {{ shopLabel(shop) }}
          <small>{{ shop.items.length }}</small>
        </h2>
        <div class="island-codex__list">
          <IslandCodexRow
            v-for="item in shop.items"
            :key="item.id"
            :icon="item.icon"
            :title="itemName(item)"
            :tags="itemTags(item)"
            :meta="itemMeta(item)"
          />
        </div>
      </div>

      <div class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact">
        <h2>{{ t(islandTextKeys.sectionAchievements) }}</h2>
        <div class="island-codex__list">
          <article
            v-for="achievement in filteredAchievements"
            :key="achievement.id"
            class="island-rewards__achievement"
          >
            <div class="island-rewards__achievement-main">
              <strong>{{ achievement.name }}</strong>
              <small v-if="achievement.title">{{ achievement.title.name }}</small>
              <small>{{ achievement.points }} {{ t(islandTextKeys.achievementPointsUnit) }}</small>
            </div>
            <p class="island-rewards__achievement-desc">{{ achievement.description }}</p>
            <div v-if="achievement.unlockedItems.length" class="island-rewards__unlocks">
              <span class="island-rewards__unlocks-label">{{ t(islandTextKeys.rewardUnlockLabel) }}:</span>
              <span
                v-for="link in achievement.unlockedItems"
                :key="`${link.shopId}-${link.itemId}`"
                class="island-rewards__unlock-chip"
              >
                <IslandItemIcon :icon="rewardItemById.get(link.itemId)?.icon ?? null" :alt="rewardItemById.get(link.itemId)?.name ?? link.itemId" />
                {{ rewardItemById.get(link.itemId)?.name ?? link.itemId }}
              </span>
            </div>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import IslandCodexRow from '@/pages/island/components/IslandCodexRow.vue'
import IslandFilterBar from '@/pages/island/components/IslandFilterBar.vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import { pickIslandName } from '@/lib/island/localization'
import type { IslandAchievement, IslandCropsFile, IslandRewardItem, IslandRewardShop } from '@/lib/island/types'
import { loadIslandAchievements, loadIslandCrops, loadIslandRewards } from '@/services/island/islandApi'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t, current } = useLocale()
const loading = ref(true)
const error = ref(false)
const shops = ref<IslandRewardShop[]>([])
const achievements = ref<IslandAchievement[]>([])
const cropsFile = ref<IslandCropsFile | null>(null)
const query = ref('')

const seedUnlockByItemId = computed(() => {
  const map = new Map<string, number>()
  for (const crop of cropsFile.value?.crops ?? []) {
    if (crop.seedUnlockRank) {
      map.set(crop.seedItemId, crop.seedUnlockRank)
    }
  }
  return map
})

const rewardItemById = computed(() => {
  const map = new Map<string, { icon: number | null; name: string }>()
  for (const shop of shops.value) {
    for (const item of shop.items) {
      map.set(item.itemId, { icon: item.icon, name: pickIslandName(item.names, current.value) || item.id })
    }
  }
  return map
})

const keyword = computed(() => query.value.trim().toLowerCase())

function matchesName(names: Record<string, string> | undefined, fallback: string) {
  const value = keyword.value
  if (!value) {
    return true
  }
  return (pickIslandName(names ?? {}, current.value) || fallback).toLowerCase().includes(value)
}

const filteredShops = computed(() =>
  shops.value
    .map((shop) => ({
      ...shop,
      items: shop.items.filter((item) => matchesName(item.names, item.id))
    }))
    .filter((shop) => shop.items.length > 0)
)

const filteredAchievements = computed(() =>
  achievements.value.filter((achievement) => matchesName(achievement.names, achievement.id))
)

const filteredItemCount = computed(() =>
  filteredShops.value.reduce((sum, shop) => sum + shop.items.length, 0) + filteredAchievements.value.length
)
const totalItemCount = computed(
  () =>
    shops.value.reduce((sum, shop) => sum + shop.items.length, 0) + achievements.value.length
)

function shopLabel(shop: IslandRewardShop) {
  if (current.value === 'zh-CN' && shop.label?.zh) {
    return shop.label.zh
  }
  return shop.label?.en || shop.shopId
}

function itemName(item: IslandRewardItem) {
  return pickIslandName(item.names, current.value) || item.id
}

function itemTags(item: IslandRewardItem): string[] {
  const tags: string[] = []
  if (item.currency) {
    tags.push(`${item.price} ${pickIslandName(item.currency.names, current.value)}`)
  }
  const seedRank = seedUnlockByItemId.value.get(item.itemId)
  if (seedRank) {
    tags.push(`${t(islandTextKeys.unlockRankLabel)} ${seedRank}`)
  }
  if (item.patch) {
    tags.push(item.patch)
  }
  return tags
}

function itemMeta(item: IslandRewardItem): string[] {
  const meta: string[] = []
  if (item.achievementUnlock) {
    const achievement = achievements.value.find((entry) => entry.id === item.achievementUnlock)
    if (achievement) {
      meta.push(`${t(islandTextKeys.rewardUnlockLabel)}: ${achievement.name}`)
    }
  }
  return meta
}

onMounted(async () => {
  try {
    const [rewardsFile, achievementsFile, crops] = await Promise.all([
      loadIslandRewards(),
      loadIslandAchievements(),
      loadIslandCrops()
    ])
    shops.value = rewardsFile.shops
    achievements.value = achievementsFile.achievements
    cropsFile.value = crops
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.island-rewards__achievement {
  padding: 10px 14px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  display: grid;
  gap: 4px;
}
.island-rewards__achievement-main {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
}
.island-rewards__achievement-main strong {
  font-size: 15px;
  overflow-wrap: anywhere;
}
.island-rewards__achievement-main small {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-rewards__achievement-desc {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-rewards__unlocks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.island-rewards__unlocks-label {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-rewards__unlock-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  font-size: 12px;
}
.island-rewards__unlock-chip :deep(.island-icon) {
  width: 20px;
  height: 20px;
}
</style>
