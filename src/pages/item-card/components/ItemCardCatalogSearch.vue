<template>
  <div ref="rootElement" class="catalog-search-row" @focusout="handleFocusOut">
    <div
      class="catalog-search-row__categories"
      role="group"
      :aria-label="t(textKeys.catalogCategoryLabel)"
    >
      <button
        v-for="option in categoryOptions"
        :key="option.value"
        type="button"
        :class="{ active: category === option.value }"
        :aria-pressed="category === option.value"
        @click="selectCategory(option.value)"
      >
        {{ t(option.labelKey) }}
      </button>
    </div>
    <div class="catalog-search-row__body">
      <input
        type="search"
        autocomplete="off"
        :aria-label="t(textKeys.catalogSearchLabel)"
        :placeholder="t(textKeys.catalogSearchPlaceholder)"
        :value="query"
        @focus="open = true"
        @input="updateQuery"
      />
      <div
        v-if="open && query.trim()"
        class="catalog-search-row__results"
        :aria-busy="state === 'loading'"
      >
        <button
          v-for="candidate in results"
          :key="String(candidate.key || candidate.name)"
          type="button"
          @click="choose(candidate)"
        >
          <img
            v-if="candidate.icon"
            :src="buildGlamourIconUrl(apiBase, candidate.icon)"
            alt=""
            loading="lazy"
          />
          <span>{{ candidateName(candidate) }}</span>
        </button>
        <p v-if="state === 'empty'">{{ t(textKeys.nsglamourEquipmentSearchEmpty) }}</p>
        <p v-if="state === 'error'">{{ t(textKeys.nsglamourEquipmentSearchError) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { buildGlamourIconUrl, getCandidateName } from '@/pages/item-card/lib/equipment'
import type {
  GlamourCandidate,
  ItemCardCatalogCategory
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
}>()

const emit = defineEmits<{
  select: [candidate: GlamourCandidate]
}>()

const { t } = useLocale()
const rootElement = ref<HTMLElement | null>(null)
const category = ref<ItemCardCatalogCategory>('equipment')
const query = ref('')
const results = ref<GlamourCandidate[]>([])
const state = ref<'idle' | 'loading' | 'empty' | 'error'>('idle')
const open = ref(false)
let searchTimer: number | undefined
let searchController: AbortController | undefined

const categoryOptions: Array<{
  value: ItemCardCatalogCategory
  labelKey: string
}> = [
  { value: 'equipment', labelKey: textKeys.catalogCategoryEquipment },
  { value: 'other', labelKey: textKeys.catalogCategoryOther }
]

onBeforeUnmount(() => {
  if (searchTimer !== undefined) {
    window.clearTimeout(searchTimer)
  }
  searchController?.abort()
})

watch(
  () => props.locale,
  () => restartSearch()
)

function candidateName(candidate: GlamourCandidate): string {
  return getCandidateName(candidate, props.locale)
}

function updateQuery(event: Event) {
  query.value = (event.currentTarget as HTMLInputElement).value
  open.value = true
  results.value = []
  state.value = query.value.trim() ? 'loading' : 'idle'
  if (searchTimer !== undefined) {
    window.clearTimeout(searchTimer)
  }
  searchController?.abort()
  if (!query.value.trim()) {
    return
  }
  searchTimer = window.setTimeout(() => void runSearch(query.value.trim()), 180)
}

function selectCategory(nextCategory: ItemCardCatalogCategory) {
  if (category.value === nextCategory) {
    return
  }
  category.value = nextCategory
  restartSearch()
}

function restartSearch() {
  results.value = []
  searchController?.abort()
  if (searchTimer !== undefined) {
    window.clearTimeout(searchTimer)
  }
  const searchQuery = query.value.trim()
  state.value = searchQuery ? 'loading' : 'idle'
  open.value = Boolean(searchQuery)
  if (searchQuery) {
    const searchCategory = category.value
    searchTimer = window.setTimeout(() => void runSearch(searchQuery, searchCategory), 180)
  }
}

async function runSearch(
  searchQuery: string,
  searchCategory: ItemCardCatalogCategory = category.value
) {
  searchController = new AbortController()
  try {
    const nextResults = await props.searchItems({
      query: searchQuery,
      locale: props.locale,
      category: searchCategory,
      limit: 12,
      signal: searchController.signal
    })
    if (query.value.trim() !== searchQuery || category.value !== searchCategory) {
      return
    }
    results.value = nextResults
    state.value = nextResults.length ? 'idle' : 'empty'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    if (query.value.trim() !== searchQuery || category.value !== searchCategory) {
      return
    }
    results.value = []
    state.value = 'error'
  }
}

function choose(candidate: GlamourCandidate) {
  emit('select', candidate)
  query.value = ''
  results.value = []
  state.value = 'idle'
  open.value = false
}

function handleFocusOut() {
  window.requestAnimationFrame(() => {
    if (!rootElement.value?.contains(document.activeElement)) {
      open.value = false
    }
  })
}
</script>

<style scoped>
.catalog-search-row {
  position: relative;
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  min-width: 0;
  padding: 8px;
  border-bottom: 1px solid var(--ns-color-border);
}

.catalog-search-row__categories {
  display: inline-flex;
  min-width: 0;
}

.catalog-search-row__categories button {
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-right: 0;
  border-radius: 0;
  background: var(--ns-color-surface);
  color: var(--ns-color-text-muted);
  font: 700 11px var(--ns-font-sans);
  white-space: nowrap;
  cursor: pointer;
}

.catalog-search-row__categories button.active {
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.catalog-search-row__body {
  min-width: 0;
}

.catalog-search-row__body > input {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 4px 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: 0 3px 3px 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-sans);
}

.catalog-search-row__results {
  position: absolute;
  z-index: 31;
  inset: 45px 8px auto 8px;
  display: grid;
  gap: 7px;
  max-height: 320px;
  padding: 8px;
  overflow-y: auto;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  box-shadow: var(--ns-pixel-window-shadow);
}

.catalog-search-row__results button {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 3px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: 12px var(--ns-font-sans);
  text-align: left;
  cursor: pointer;
}

.catalog-search-row__results button:hover,
.catalog-search-row__results button:focus-visible {
  background: var(--ns-pixel-hover-surface);
}

.catalog-search-row__results img {
  width: 36px;
  height: 36px;
  border-radius: 3px;
}

.catalog-search-row__results p {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}
</style>
