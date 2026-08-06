<template>
  <div class="catalog-search-row">
    <GlamourSearchField
      ref="fieldRef"
      :search="searchAdapter"
      :locale="locale"
      :placeholder="
        category === 'emote'
          ? t(textKeys.emoteSearchPlaceholder)
          : t(textKeys.catalogSearchPlaceholder)
      "
      :search-label="t(textKeys.catalogSearchLabel)"
      :empty-text="t(textKeys.nsglamourEquipmentSearchEmpty)"
      :error-text="t(textKeys.nsglamourEquipmentSearchError)"
      :resolve-name="candidateName"
      :resolve-icon="candidateIcon"
      @select="onSelect"
    >
      <template #prepend>
        <select
          v-model="category"
          class="catalog-search-row__category"
          :aria-label="t(textKeys.catalogCategoryLabel)"
          @change="handleCategoryChange"
        >
          <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </template>
    </GlamourSearchField>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GlamourSearchField from '@/components/glamour/GlamourSearchField.vue'
import type { GlamourSearchCandidate } from '@/components/glamour/GlamourSearchField.vue'
import { buildGlamourIconUrl, getCandidateName } from '@/pages/item-card/lib/equipment'
import type {
  GlamourCandidate,
  ItemCardCatalogCategory,
  ItemCardSearchCategory
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  apiBase: string
  locale: string
  searchItems: (options: {
    query: string
    locale: string
    category: ItemCardCatalogCategory
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
  searchEmotes: (options: {
    query: string
    locale: string
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
}>()

const emit = defineEmits<{
  select: [candidate: GlamourCandidate]
}>()

const { t } = useLocale()
const fieldRef = ref<InstanceType<typeof GlamourSearchField> | null>(null)
const category = ref<ItemCardSearchCategory>('equipment')

const categoryOptions: Array<{
  value: ItemCardSearchCategory
  labelKey: string
}> = [
  { value: 'equipment', labelKey: textKeys.catalogCategoryEquipment },
  { value: 'facewear', labelKey: textKeys.catalogCategoryFacewear },
  { value: 'fashion', labelKey: textKeys.catalogCategoryFashion },
  { value: 'other', labelKey: textKeys.catalogCategoryOther },
  { value: 'furniture', labelKey: textKeys.catalogCategoryFurniture },
  { value: 'mount', labelKey: textKeys.catalogCategoryMount },
  { value: 'emote', labelKey: textKeys.catalogCategoryEmote }
]

function searchAdapter(options: {
  query: string
  locale: string
  limit: number
  signal: AbortSignal
}): Promise<GlamourSearchCandidate[]> {
  if (category.value === 'emote') {
    return props.searchEmotes(options)
  }
  return props.searchItems({ ...options, category: category.value })
}

function candidateName(candidate: GlamourSearchCandidate): string {
  return getCandidateName(candidate as GlamourCandidate, props.locale)
}

function candidateIcon(candidate: GlamourSearchCandidate): string {
  return buildGlamourIconUrl(props.apiBase, candidate.icon)
}

function handleCategoryChange() {
  fieldRef.value?.restart()
}

function onSelect(candidate: GlamourSearchCandidate) {
  emit('select', candidate as GlamourCandidate)
}
</script>

<style scoped>
.catalog-search-row {
  position: relative;
  min-width: 0;
  padding: 8px;
  border-bottom: 1px solid var(--ns-color-border);
}

.catalog-search-row__category {
  flex: 0 0 auto;
  min-width: 0;
  height: 30px;
  padding: 0 22px 0 8px;
  border: 0;
  border-right: 1px solid var(--ns-color-border);
  border-radius: 0;
  appearance: none;
  background: transparent
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23888'/%3E%3C/svg%3E")
    no-repeat right 7px center;
  color: var(--ns-color-text);
  font: 11px var(--ns-font-ui);
  cursor: pointer;
}

.catalog-search-row__category:focus {
  outline: none;
}
</style>
