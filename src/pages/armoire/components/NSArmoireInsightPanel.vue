<template>
  <section class="nsarmoire-insight-panel">
    <AppStatus
      v-if="!analysis"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <div v-else class="nsarmoire-insight-stack">
      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationCabinet)"
        :count="cabinetCount"
        :toggle-label="getToggleLabel('cabinet', cabinetCount)"
        :sticky-header="isListExpanded('cabinet')"
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
          @ignore-item="$emit('ignore-item', $event)"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationSetPieces)"
        :count="setBucketLoosePieceCount"
        :toggle-label="getToggleLabel('setPieces', setBucketLoosePieceCount)"
        :sticky-header="isListExpanded('setPieces')"
        @toggle="toggleList('setPieces')"
      >
        <AppStatus
          v-if="isSetBucketLoosePieceCatalogMissing"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="setBucketLoosePieceItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('setPieces')"
          @ignore-item="$emit('ignore-item', $event)"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationTradableItems)"
        :count="tradableItemCount"
        :toggle-label="getToggleLabel('tradableItems', tradableItemCount)"
        :sticky-header="isListExpanded('tradableItems')"
        @toggle="toggleList('tradableItems')"
      >
        <AppStatus
          v-if="isTradableCatalogMissing"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="tradableItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('tradableItems')"
          @ignore-item="$emit('ignore-item', $event)"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationCrafterGathererReplicas)"
        :count="crafterGathererReplicaCount"
        :toggle-label="getToggleLabel('crafterGathererReplicas', crafterGathererReplicaCount)"
        :sticky-header="isListExpanded('crafterGathererReplicas')"
        @toggle="toggleList('crafterGathererReplicas')"
      >
        <AppStatus
          v-if="isCrafterGathererReplicaCatalogMissing"
          compact
          tone="warning"
          :message="t(textKeys.nsarmoireCatalogPending)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="crafterGathererReplicaItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('crafterGathererReplicas')"
          @ignore-item="$emit('ignore-item', $event)"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationDuplicateItems)"
        :count="duplicateItemCount"
        :toggle-label="getToggleLabel('duplicateItems', duplicateItemCount)"
        :sticky-header="isListExpanded('duplicateItems')"
        @toggle="toggleList('duplicateItems')"
      >
        <NSArmoireReadableItemList
          :items="duplicateItemItems"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('duplicateItems')"
          @ignore-item="$emit('ignore-item', $event)"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationDuplicates)"
        :count="duplicateModelCount"
        :toggle-label="getToggleLabel('duplicateModels', duplicateModelCount)"
        :sticky-header="isListExpanded('duplicateModels')"
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
          @ignore-item="$emit('ignore-item', $event)"
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationIgnoredItems)"
        :count="ignoredItemViews.length"
        :toggle-label="getToggleLabel('ignoredItems', ignoredItemViews.length)"
        :sticky-header="isListExpanded('ignoredItems')"
        @toggle="toggleList('ignoredItems')"
      >
        <AppStatus
          v-if="ignoredItemViews.length === 0"
          compact
          tone="info"
          :message="t(textKeys.nsarmoireIgnoredItemsEmpty)"
        />
        <NSArmoireReadableItemList
          v-else
          :items="ignoredItemViews"
          :limit="listPreviewLimit"
          :expanded="isListExpanded('ignoredItems')"
          :can-ignore-items="false"
          can-unignore-items
          @unignore-item="$emit('unignore-item', $event)"
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
import type { ArmoireReadableItemView } from '@/pages/armoire/utils/insightDisplay'
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
  ignoredItemViews: ArmoireReadableItemView[]
}>()

const emit = defineEmits<{
  loadIdenticalModelCatalog: []
  'ignore-item': [itemId: number]
  'unignore-item': [itemId: number]
}>()

const { t } = useLocale()
const listPreviewLimit = ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT

type ExpandableListKey =
  | 'cabinet'
  | 'setPieces'
  | 'tradableItems'
  | 'crafterGathererReplicas'
  | 'duplicateItems'
  | 'duplicateModels'
  | 'ignoredItems'

const expandedLists = ref<Partial<Record<ExpandableListKey, boolean>>>({})

function isExpandableListKey(key: string): key is ExpandableListKey {
  return (
    key === 'cabinet' ||
    key === 'setPieces' ||
    key === 'tradableItems' ||
    key === 'crafterGathererReplicas' ||
    key === 'duplicateItems' ||
    key === 'duplicateModels' ||
    key === 'ignoredItems'
  )
}

function getListLimit(key: string): number | undefined {
  return isExpandableListKey(key) && isListExpanded(key) ? undefined : listPreviewLimit
}

const {
  cabinetCount,
  setBucketLoosePieceCount,
  tradableItemCount,
  crafterGathererReplicaCount,
  duplicateItemCount,
  duplicateModelCount,
  isCabinetCatalogMissing,
  isSetBucketLoosePieceCatalogMissing,
  isTradableCatalogMissing,
  isCrafterGathererReplicaCatalogMissing,
  isIdenticalModelCatalogMissing,
  transferableItems,
  setBucketLoosePieceItems,
  tradableItems,
  crafterGathererReplicaItems,
  duplicateItemItems,
  duplicateModelItems
} = useArmoireInsightViewModels(props, t, { getListLimit })

function isListExpanded(key: ExpandableListKey): boolean {
  return expandedLists.value[key] === true
}

function toggleList(key: ExpandableListKey): void {
  if (key === 'duplicateModels' && isIdenticalModelCatalogMissing.value) {
    emit('loadIdenticalModelCatalog')
    return
  }

  expandedLists.value = {
    ...expandedLists.value,
    [key]: !isListExpanded(key)
  }
}

function getToggleLabel(key: ExpandableListKey, itemCount: number | null | undefined): string {
  if (key === 'duplicateModels' && isIdenticalModelCatalogMissing.value) {
    return t(textKeys.nsarmoireReloadCatalog)
  }

  if (!itemCount || itemCount <= listPreviewLimit) {
    return ''
  }

  return isListExpanded(key) ? t(textKeys.nsarmoireCollapseList) : t(textKeys.nsarmoireExpandList)
}

</script>

<style scoped>
.nsarmoire-insight-panel {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.nsarmoire-insight-stack {
  display: grid;
  gap: 10px;
}

</style>
