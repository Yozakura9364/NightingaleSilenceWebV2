<template>
  <section class="fashion-check-tag-database" :aria-label="t(keys.tabTagDatabase)">
    <div class="fashion-check-tag-database__controls">
      <label>
        <span>{{ t(keys.tagDatabaseSearch) }}</span>
        <input v-model.trim="searchQuery" type="search" :placeholder="t(keys.tagDatabaseSearch)" />
      </label>
      <label>
        <span>{{ t(keys.tagDatabaseSlotFilter) }}</span>
        <select v-model="selectedSlotId">
          <option value="all">{{ t(keys.tagDatabaseAllSlots) }}</option>
          <option v-for="slotId in availableSlotIds" :key="slotId" :value="slotId">
            {{ slotLabel(slotId) }}
          </option>
        </select>
      </label>
    </div>

    <AppStatus v-if="loading" tone="info" :message="t(keys.tagDatabaseLoading)" />
    <AppStatus v-else-if="!database" tone="warning" :message="t(keys.tagDatabaseUnavailable)" />
    <AppStatus
      v-else-if="filteredCategories.length === 0"
      tone="info"
      :message="t(keys.tagDatabaseNoResults)"
    />

    <div v-else class="fashion-check-tag-database__layout">
      <nav class="fashion-check-tag-database__tag-list" :aria-label="t(keys.tagDatabaseSelectTag)">
        <button
          v-for="category in filteredCategories"
          :key="category.categoryId"
          type="button"
          :aria-pressed="selectedCategory?.categoryId === category.categoryId"
          :class="{
            'fashion-check-tag-database__tag--active':
              selectedCategory?.categoryId === category.categoryId
          }"
          @click="selectedCategoryId = category.categoryId"
        >
          <span>{{ categoryName(category) }}</span>
          <small v-if="duplicateCategoryNames.has(categoryName(category))">
            {{ category.names.en }}
          </small>
          <small>{{ category.slots.map((slot) => slotLabel(slot.slotId)).join(' / ') }}</small>
        </button>
      </nav>

      <section v-if="selectedCategory" class="fashion-check-tag-database__detail">
        <h2 class="ns-heading-bloom">{{ categoryName(selectedCategory) }}</h2>
        <section
          v-for="slot in visibleCategorySlots"
          :key="slot.slotId"
          class="fashion-check-tag-database__slot ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
        >
          <header class="ns-workbench-panel__header">
            <h3 class="ns-workbench-panel__title">{{ slotLabel(slot.slotId) }}</h3>
            <strong>{{ t(keys.gold) }} +{{ slot.goldPoints }}</strong>
          </header>
          <div class="fashion-check-tag-database__items">
            <div
              v-for="itemId in slot.itemIds"
              :key="itemId"
              class="fashion-check-tag-database__item"
            >
              <FashionCheckItemLine
                :item="fashionCheckItem(itemId)"
                :display-name="itemName(itemId)"
              />
            </div>
          </div>
        </section>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { useFetch } from '@/composables/useFetch'
import { resolveFashionCheckName } from '@/lib/fashion-check/localization'
import type {
  FashionCheckItem,
  FashionCheckTagDatabase,
  FashionCheckTagDatabaseCategory
} from '@/lib/fashion-check/types'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import FashionCheckItemLine from '@/pages/fashion-check/components/FashionCheckItemLine.vue'
import { useLocale } from '@/stores/locale'

const slotOrder = ['head', 'body', 'hands', 'legs', 'feet', 'ears', 'neck', 'wrists', 'ring']
const slotLabelKeys = {
  head: keys.dyeHead,
  body: keys.dyeBody,
  hands: keys.dyeHands,
  legs: keys.dyeLegs,
  feet: keys.dyeFeet,
  ears: keys.slotEars,
  neck: keys.slotNeck,
  wrists: keys.slotWrists,
  ring: keys.slotRing
} as const

const { api } = useFetch()
const { current, t } = useLocale()
const database = ref<FashionCheckTagDatabase | null>(null)
const loading = ref(true)
const searchQuery = ref('')
const selectedSlotId = ref('all')
const selectedCategoryId = ref<number | null>(null)

const availableSlotIds = computed(() => {
  const values = new Set(
    database.value?.categories.flatMap((category) => category.slots.map((slot) => slot.slotId)) ??
      []
  )
  return slotOrder.filter((slotId) => values.has(slotId))
})

const duplicateCategoryNames = computed(() => {
  const counts = new Map<string, number>()
  for (const category of database.value?.categories ?? []) {
    const name = categoryName(category)
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name))
})

const filteredCategories = computed(() => {
  const query = searchQuery.value.toLocaleLowerCase()
  return (database.value?.categories ?? [])
    .filter((category) => {
      const matchesQuery =
        !query ||
        Object.values(category.names).some((name) => name.toLocaleLowerCase().includes(query))
      const matchesSlot =
        selectedSlotId.value === 'all' ||
        category.slots.some((slot) => slot.slotId === selectedSlotId.value)
      return matchesQuery && matchesSlot
    })
    .sort((left, right) => categoryName(left).localeCompare(categoryName(right), current.value))
})

const selectedCategory = computed(
  () =>
    filteredCategories.value.find((category) => category.categoryId === selectedCategoryId.value) ??
    filteredCategories.value[0]
)

const visibleCategorySlots = computed(() =>
  (selectedCategory.value?.slots ?? []).filter(
    (slot) => selectedSlotId.value === 'all' || slot.slotId === selectedSlotId.value
  )
)

function categoryName(category: FashionCheckTagDatabaseCategory) {
  return resolveFashionCheckName(category.names, current.value, String(category.categoryId))
}

function slotLabel(slotId: string) {
  return t(slotLabelKeys[slotId as keyof typeof slotLabelKeys] ?? keys.dyeHead)
}

function itemName(itemId: number) {
  const item = database.value?.items[String(itemId)]
  return resolveFashionCheckName(item?.names, current.value, item?.names['zh-CN'] ?? String(itemId))
}

function fashionCheckItem(itemId: number): FashionCheckItem {
  const item = database.value?.items[String(itemId)]
  return {
    itemId,
    name: item?.names['zh-CN'] ?? String(itemId),
    iconId: item?.iconId ?? 0,
    rarity: item?.rarity ?? 1
  }
}

onMounted(async () => {
  try {
    database.value = await api<FashionCheckTagDatabase>('/data/fashion-check/tag-database.json', {
      cache: 'no-store',
      query: { v: Date.now() }
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.fashion-check-tag-database {
  display: grid;
  gap: 16px;
}

.fashion-check-tag-database__controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 240px);
  gap: 12px;
}

.fashion-check-tag-database__controls label {
  display: grid;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}

.fashion-check-tag-database__controls input,
.fashion-check-tag-database__controls select {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-bg-surface);
  color: var(--ns-color-text);
  font: inherit;
}

.fashion-check-tag-database__controls input {
  padding: 8px 10px;
}

.fashion-check-tag-database__controls select {
  padding: 8px;
}

.fashion-check-tag-database__layout {
  display: grid;
  grid-template-columns: minmax(210px, 280px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.fashion-check-tag-database__tag-list {
  display: grid;
  max-height: min(680px, calc(100vh - 260px));
  border: 1px solid var(--ns-pixel-border);
  overflow-y: auto;
}

.fashion-check-tag-database__tag-list button {
  display: grid;
  gap: 3px;
  width: 100%;
  min-height: 48px;
  padding: 8px 10px;
  border: 0;
  border-bottom: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-bg-surface);
  color: var(--ns-color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.fashion-check-tag-database__tag-list button:last-child {
  border-bottom: 0;
}

.fashion-check-tag-database__tag-list button:hover,
.fashion-check-tag-database__tag-list button:focus-visible {
  background: var(--ns-color-bg-soft);
}

.fashion-check-tag-database__tag-list .fashion-check-tag-database__tag--active {
  background: var(--ns-color-accent-soft);
  box-shadow: inset 3px 0 0 var(--ns-color-accent);
}

.fashion-check-tag-database__tag-list small {
  color: var(--ns-color-text-muted);
}

.fashion-check-tag-database__detail {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.fashion-check-tag-database__detail > h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 22px;
}

.fashion-check-tag-database__slot header {
  align-items: baseline;
}

.fashion-check-tag-database__slot header strong {
  color: var(--ns-color-text-muted);
  font-size: 13px;
  white-space: nowrap;
}

.fashion-check-tag-database__items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.fashion-check-tag-database__item {
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ns-pixel-border);
}

@media (max-width: 760px) {
  .fashion-check-tag-database__controls,
  .fashion-check-tag-database__layout,
  .fashion-check-tag-database__items {
    grid-template-columns: 1fr;
  }

  .fashion-check-tag-database__tag-list {
    max-height: 190px;
  }
}
</style>
