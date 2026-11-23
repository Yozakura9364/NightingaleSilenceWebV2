<template>
  <section class="island-view">
    <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />
    <template v-else-if="!loading">
      <div
        v-for="card in rankCards"
        :key="card.rank"
        class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact island-ranks__card"
      >
        <h2>
          {{ t(islandTextKeys.colRank) }} {{ card.rank }}
          <small>
            {{
              card.expToNext
                ? `${t(islandTextKeys.colExpToNext)} ${card.expToNext}`
                : t(islandTextKeys.ranksMax)
            }}
          </small>
        </h2>
        <div v-if="card.unlocks.length" class="island-ranks__unlocks">
          <span
            v-for="(unlock, index) in card.unlocks"
            :key="`${unlock.kind}-${index}`"
            class="island-ranks__chip"
            :class="{ 'island-ranks__chip--feature': unlock.kind === 'feature' }"
          >
            <IslandItemIcon v-if="unlock.icon" :icon="unlock.icon" :alt="unlock.label" />
            <span>{{ unlock.label }}</span>
          </span>
        </div>
        <p v-else class="island-ranks__empty">{{ t(islandTextKeys.ranksNoUnlock) }}</p>
      </div>

      <details class="ns-workbench-panel ns-workbench-panel--soft ns-workbench-panel--compact island-ranks__progress">
        <summary>{{ t(islandTextKeys.ranksProgressTitle) }}</summary>
        <div class="island-view__list island-view__list--inner">
          <article v-for="step in progress" :key="step.id" class="island-view__row island-view__row--flat">
            <div class="island-view__main">
              <strong>{{ step.objective }}</strong>
              <small v-if="step.vision">{{ step.vision }}</small>
            </div>
          </article>
        </div>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import { pickIslandName } from '@/lib/island/localization'
import type { IslandProgressStep, IslandRankUnlock } from '@/lib/island/types'
import { loadIslandRanks } from '@/services/island/islandApi'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

interface RankCard {
  rank: number
  expToNext: number
  unlocks: { kind: string; icon: number | null; label: string }[]
}

const { t, current } = useLocale()
const loading = ref(true)
const error = ref(false)
const ranks = ref<{ rank: number; expToNext: number }[]>([])
const unlocks = ref<Record<string, IslandRankUnlock[]>>({})
const progress = ref<IslandProgressStep[]>([])

function unlockLabel(unlock: IslandRankUnlock): string {
  if (unlock.kind === 'feature') {
    return current.value === 'zh-CN' ? unlock.text?.zh ?? '' : unlock.text?.en ?? ''
  }
  return pickIslandName(unlock.names ?? {}, current.value) || unlock.name || ''
}

const rankCards = computed<RankCard[]>(() =>
  ranks.value.map((rank) => ({
    ...rank,
    unlocks: (unlocks.value[String(rank.rank)] ?? []).map((unlock) => ({
      kind: unlock.kind,
      icon: unlock.icon,
      label: unlockLabel(unlock)
    }))
  }))
)

onMounted(async () => {
  try {
    const file = await loadIslandRanks()
    ranks.value = file.ranks
    unlocks.value = file.unlocks ?? {}
    progress.value = file.progress.map((step) => ({
      ...step,
      vision: pickIslandName(step.names.vision, current.value),
      objective: pickIslandName(step.names.objective, current.value)
    }))
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.island-ranks__card h2 {
  margin: 0 0 8px;
  font-size: 17px;
}
.island-ranks__card h2 small {
  margin-left: 8px;
  color: var(--ns-color-text-muted);
  font-weight: normal;
  font-size: 13px;
}
.island-ranks__unlocks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.island-ranks__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  font-size: 13px;
  overflow-wrap: anywhere;
}
.island-ranks__chip :deep(.island-icon) {
  width: 22px;
  height: 22px;
}
.island-ranks__chip--feature {
  border-style: dashed;
  color: var(--ns-color-text-muted);
}
.island-ranks__empty {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-ranks__progress summary {
  cursor: pointer;
  font-size: 15px;
  color: var(--ns-color-text-muted);
}
</style>
