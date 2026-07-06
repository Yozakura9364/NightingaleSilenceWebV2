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
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationSets)"
        :count="incompleteSetCount"
        :toggle-label="getToggleLabel('sets', incompleteSetCount)"
        :sticky-header="isListExpanded('sets')"
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
        />
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireRecommendationDyes)"
        :count="dyeRiskCount"
        :toggle-label="getToggleLabel('dyes', dyeRiskCount)"
        :sticky-header="isListExpanded('dyes')"
        @toggle="toggleList('dyes')"
      >
        <fieldset class="nsarmoire-insight-panel__dye-preferences">
          <legend>{{ t(textKeys.nsarmoireDyePreferenceLabel) }}</legend>
          <label v-for="option in dyeValueCategoryOptions" :key="option.value">
            <input
              type="checkbox"
              :checked="isDyeValueCategorySelected(option.value)"
              @change="emit('toggleDyeValueCategory', option.value)"
            />
            <span>{{ t(option.labelKey) }}</span>
          </label>
        </fieldset>
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
  ArmoireDyeValueCategory,
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
  selectedDyeValueCategories: readonly ArmoireDyeValueCategory[]
  hasPendingCatalogChecks?: boolean
}>()

const emit = defineEmits<{
  toggleDyeValueCategory: [category: ArmoireDyeValueCategory]
}>()

const { t } = useLocale()
const listPreviewLimit = ARMOIRE_INSIGHT_LIST_PREVIEW_LIMIT
const dyeValueCategoryOptions: Array<{ value: ArmoireDyeValueCategory; labelKey: string }> = [
  { value: 'general', labelKey: textKeys.nsarmoireDyeCategoryGeneral },
  { value: 'extra1', labelKey: textKeys.nsarmoireDyeCategoryExtra1 },
  { value: 'extra2', labelKey: textKeys.nsarmoireDyeCategoryExtra2 },
  { value: 'storeSpecial', labelKey: textKeys.nsarmoireDyeCategoryStoreSpecial }
]

type ExpandableListKey =
  'cabinet' | 'sets' | 'setPieces' | 'duplicateItems' | 'duplicateModels' | 'dyes'

const expandedLists = ref<Partial<Record<ExpandableListKey, boolean>>>({})

function getListLimit(key: ExpandableListKey): number | undefined {
  return isListExpanded(key) ? undefined : listPreviewLimit
}

const {
  cabinetCount,
  incompleteSetCount,
  setBucketLoosePieceCount,
  duplicateItemCount,
  duplicateModelCount,
  dyeRiskCount,
  isCabinetCatalogMissing,
  isSetCatalogMissing,
  isSetBucketLoosePieceCatalogMissing,
  isIdenticalModelCatalogMissing,
  transferableItems,
  incompleteSetItems,
  setBucketLoosePieceItems,
  duplicateItemItems,
  duplicateModelItems,
  dyeRiskItems
} = useArmoireInsightViewModels(props, t, { getListLimit })

function isListExpanded(key: ExpandableListKey): boolean {
  return expandedLists.value[key] === true
}

function toggleList(key: ExpandableListKey): void {
  expandedLists.value = {
    ...expandedLists.value,
    [key]: !isListExpanded(key)
  }
}

function getToggleLabel(key: ExpandableListKey, itemCount: number | null | undefined): string {
  if (!itemCount || itemCount <= listPreviewLimit) {
    return ''
  }

  return isListExpanded(key) ? t(textKeys.nsarmoireCollapseList) : t(textKeys.nsarmoireExpandList)
}

function isDyeValueCategorySelected(category: ArmoireDyeValueCategory): boolean {
  return props.selectedDyeValueCategories.includes(category)
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

.nsarmoire-insight-panel__dye-preferences {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
}

.nsarmoire-insight-panel__dye-preferences legend {
  width: 100%;
  margin: 0 0 2px;
  padding: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 850;
}

.nsarmoire-insight-panel__dye-preferences label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 3px 7px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.nsarmoire-insight-panel__dye-preferences input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: var(--ns-color-accent);
}
</style>
