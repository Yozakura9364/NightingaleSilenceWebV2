<template>
  <section class="nsarmoire-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireInsights) }}</h2>
    </div>

    <AppStatus
      v-if="!analysis"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <div v-else class="nsarmoire-insight-stack">
      <NSArmoireActionCard :title="t(textKeys.nsarmoireActionHints)" primary>
        <ul class="nsarmoire-hint-list">
          <li v-for="hint in actionHints" :key="hint.key">
            <strong>{{ hint.title }}</strong>
            <span>{{ hint.message }}</span>
          </li>
        </ul>
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationCabinet)"
        :count="cabinetCount"
        :summary="isCabinetCatalogMissing ? '' : cabinetSummary"
        :toggle-label="getToggleLabel('cabinet', transferableItems.length)"
        @toggle="toggleList('cabinet')"
      >
        <AppStatus
          v-if="isCabinetCatalogMissing"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="transferableItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('cabinet')"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationSets)"
        :count="incompleteSetCount"
        :summary="isSetCatalogMissing ? '' : glamourSetSummary"
        :toggle-label="getToggleLabel('sets', incompleteSetItems.length)"
        @toggle="toggleList('sets')"
      >
        <AppStatus
          v-if="isSetCatalogMissing"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="incompleteSetItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('sets')"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationDuplicateItems)"
        :count="duplicateItemCount"
        :summary="duplicateItemSummary"
        :toggle-label="getToggleLabel('duplicateItems', duplicateItemItems.length)"
        @toggle="toggleList('duplicateItems')"
      >
        <NSArmoireReadableItemList
          :items="duplicateItemItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('duplicateItems')"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationDuplicates)"
        :count="duplicateModelCount"
        :summary="isIdenticalModelCatalogMissing ? '' : duplicateSummary"
        :toggle-label="getToggleLabel('duplicateModels', duplicateModelItems.length)"
        @toggle="toggleList('duplicateModels')"
      >
        <AppStatus
          v-if="isIdenticalModelCatalogMissing"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="duplicateModelItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('duplicateModels')"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationDyes)"
        :count="dyeRiskCount"
        :summary="dyeSummary"
        :toggle-label="getToggleLabel('dyes', dyeRiskItems.length)"
        @toggle="toggleList('dyes')"
      >
        <NSArmoireReadableItemList
          :items="dyeRiskItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('dyes')"
        />
      </NSArmoireActionCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import NSArmoireActionCard from '@/pages/armoire/components/NSArmoireActionCard.vue'
import NSArmoireReadableItemList from '@/pages/armoire/components/NSArmoireReadableItemList.vue'
import { useArmoireInsightViewModels } from '@/pages/armoire/composables/useArmoireInsightViewModels'
import { ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT } from '@/pages/armoire/utils/insightDisplay'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
  hasPendingCatalogChecks?: boolean
}>()

const { t } = useLocale()
const listPreviewLimit = ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT

type ExpandableListKey = 'cabinet' | 'sets' | 'duplicateItems' | 'duplicateModels' | 'dyes'

const expandedLists = ref<Partial<Record<ExpandableListKey, boolean>>>({})

const {
  actionHints,
  cabinetCount,
  incompleteSetCount,
  duplicateItemCount,
  duplicateModelCount,
  dyeRiskCount,
  isCabinetCatalogMissing,
  isSetCatalogMissing,
  isIdenticalModelCatalogMissing,
  cabinetSummary,
  glamourSetSummary,
  duplicateItemSummary,
  duplicateSummary,
  dyeSummary,
  transferableItems,
  incompleteSetItems,
  duplicateItemItems,
  duplicateModelItems,
  dyeRiskItems
} = useArmoireInsightViewModels(props, t)

function isListExpanded(key: ExpandableListKey): boolean {
  return expandedLists.value[key] === true
}

function toggleList(key: ExpandableListKey): void {
  expandedLists.value = {
    ...expandedLists.value,
    [key]: !isListExpanded(key)
  }
}

function getToggleLabel(key: ExpandableListKey, itemCount: number): string {
  if (itemCount <= listPreviewLimit) {
    return ''
  }

  return isListExpanded(key) ? t(textKeys.nsarmoireCollapseList) : t(textKeys.nsarmoireExpandList)
}
</script>

<style scoped>
.nsarmoire-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsarmoire-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-panel h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
  font-weight: 950;
}

.nsarmoire-insight-stack {
  display: grid;
  gap: 10px;
}

.nsarmoire-hint-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-hint-list li {
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-hint-list strong {
  font-family: var(--ns-font-decorative);
  font-size: 13px;
}

.nsarmoire-hint-list span {
  line-height: 1.7;
}
</style>
