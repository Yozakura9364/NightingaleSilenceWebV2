<template>
  <section class="island-view">
    <a
      class="island-goods__reference ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
      :href="NGA_REFERENCE_URL"
      target="_blank"
      rel="noreferrer"
    >
      <span class="island-goods__reference-label">{{ t(islandTextKeys.scheduleReferenceLabel) }}</span>
      <strong>{{ t(islandTextKeys.scheduleReferenceNgaTitle) }}</strong>
      <small>{{ t(islandTextKeys.scheduleReferenceNgaSource) }}</small>
    </a>

    <div class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact">
      <h2>{{ t(islandTextKeys.sectionPopularity) }}</h2>
      <p class="island-goods__note">{{ t(islandTextKeys.weeklyResetNote) }}</p>
      <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />
      <template v-if="!loading && !error">
        <h3>{{ t(islandTextKeys.weeklyIdentifyTitle) }}</h3>
        <p class="island-goods__note">{{ t(islandTextKeys.weeklyIdentifyHint) }}</p>
        <p class="island-goods__note">{{ t(islandTextKeys.weeklyServerNote) }}</p>
        <div class="island-goods__identify">
          <label class="island-goods__field">
            <span>{{ t(islandTextKeys.weeklyAddProduct) }}</span>
            <select v-model="selectedProduct" :aria-label="t(islandTextKeys.weeklyAddProduct)">
              <option value="">{{ t(islandTextKeys.weeklyAddProduct) }}</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ nameOf(product) }}
              </option>
            </select>
          </label>
          <div class="island-goods__levels" role="group" :aria-label="t(islandTextKeys.weeklyPopularity)">
            <button
              v-for="level in POPULARITY_LEVELS"
              :key="level"
              type="button"
              class="island-goods__level"
              :disabled="!selectedProduct"
              @click="addConstraint(level)"
            >
              {{ levelLabel(level) }}
            </button>
          </div>
        </div>
        <div v-if="constraintEntries.length" class="island-goods__constraints">
          <span class="island-goods__constraints-label">{{ t(islandTextKeys.weeklyConstraints) }}</span>
          <button
            v-for="entry in constraintEntries"
            :key="entry.productId"
            type="button"
            class="island-goods__chip"
            @click="removeConstraint(entry.productId)"
          >
            {{ entry.name }} · {{ levelLabel(entry.level) }} ✕
          </button>
          <button type="button" class="island-goods__clear" @click="clearConstraints">
            {{ t(islandTextKeys.weeklyClear) }}
          </button>
        </div>
        <p
          v-if="constraintEntries.length"
          class="island-goods__result"
          :class="{ 'island-goods__result--unique': matches.length === 1 }"
        >
          <template v-if="matches.length === 1">{{ t(islandTextKeys.weeklyMatchUnique) }} · {{ t(islandTextKeys.weeklyRowLabel) }} #{{ matches[0].id }}</template>
          <template v-else-if="matches.length">{{ t(islandTextKeys.weeklyMatches) }}: {{ matches.map((row) => '#' + row.id).join(' / ') }}</template>
          <template v-else>{{ t(islandTextKeys.weeklyNoMatch) }}</template>
        </p>

        <div v-if="matches.length" class="island-goods__grid-wrap ns-workbench-panel ns-workbench-panel--soft ns-workbench-panel--compact">
          <h3 v-if="matches.length === 1">
            {{ t(islandTextKeys.weeklyRowLabel) }} #{{ matches[0].id }} · {{ t(islandTextKeys.weeklyPopularity) }}
          </h3>
          <div class="island-goods__grid">
            <button
              v-for="product in levelSortedProducts"
              :key="product.id"
              type="button"
              class="island-goods__cell"
              :data-level="levelOf(matchRow, product.id)"
              @click="toggleConstraint(product.id)"
            >
              <IslandItemIcon :icon="product.icon" :alt="nameOf(product)" />
              <span class="island-goods__cell-name">{{ nameOf(product) }}</span>
              <span class="island-goods__cell-level">{{ levelLabel(levelOf(matchRow, product.id)) }}</span>
            </button>
          </div>
        </div>

        <details class="island-goods__anchors ns-workbench-panel ns-workbench-panel--soft ns-workbench-panel--compact">
          <summary>{{ t(islandTextKeys.weeklyAnchorsTitle) }}</summary>
          <p class="island-goods__note">{{ t(islandTextKeys.weeklyAnchorNote) }}</p>
          <ul class="island-goods__anchor-list">
            <li v-for="anchor in anchors" :key="anchor.week">
              {{ anchor.weekStart }} → {{ t(islandTextKeys.weeklyRowLabel) }} #{{ anchor.rotationId }}
              <span v-if="anchor.confidence === 'partial'">※</span>
            </li>
          </ul>
        </details>

        <div v-if="matches.length" class="island-goods__planner ns-workbench-panel ns-workbench-panel--soft ns-workbench-panel--compact">
          <h3>{{ t(islandTextKeys.scheduleTitle) }}</h3>
          <IslandRotationPlanner
            v-model:workshop-level="workshopLevel"
            v-model:rest-cycle="restCycle"
            :products="plannerProducts"
            :popularity="plannerPopularity"
            :popularity-ratios="popularityRatios"
            :groove-bonuses="grooveBonuses"
            :currency="currency"
          />
        </div>
        <p v-else class="island-goods__note">{{ t(islandTextKeys.scheduleRotationMissing) }}</p>
      </template>
    </div>

    <div class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact">
      <h2>{{ t(islandTextKeys.sectionFixed) }}</h2>
      <p class="island-goods__note" v-for="(note, index) in phaseNotes" :key="index">{{ note }}</p>
      <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />
      <div v-if="!loading && !error && phaseRanks.length" class="island-goods__phases">
        <div v-for="phase in phaseRanks" :key="phase.rank" class="island-goods__phase">
          <h3>
            {{ t(islandTextKeys.colRank) }} {{ phase.rank }}
            <small v-if="phase.newProducts.length">
              {{ t(islandTextKeys.phaseNewProducts) }}:
              {{ phase.newProducts.map((product) => product.name).join(listSeparator) }}
            </small>
          </h3>
          <div class="island-goods__routes">
            <div v-for="(route, routeIndex) in phase.routes" :key="routeIndex" class="island-goods__route">
              <small>{{ t(islandTextKeys.phaseRoutesLabel) }} {{ routeIndex + 1 }}</small>
              <div class="island-goods__route-crafts">
                <span v-for="(craft, craftIndex) in route" :key="craftIndex" class="island-goods__route-craft">
                  <IslandItemIcon :icon="craft.icon" :alt="craft.name" />
                  <span>{{ craft.name }}</span>
                  <small v-if="craft.hours">{{ craft.hours }}{{ t(islandTextKeys.workshopHoursUnit) }}</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="island-goods__note">
        {{ t(islandTextKeys.scheduleReferenceLabel) }}:
        <a :href="NGA_REFERENCE_URL" target="_blank" rel="noreferrer">{{ t(islandTextKeys.scheduleReferenceNgaTitle) }}（{{ t(islandTextKeys.scheduleReferenceNgaSource) }}）</a>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import IslandRotationPlanner from '@/pages/island/components/IslandRotationPlanner.vue'
import {
  ISLAND_ROTATION_ANCHORS,
  identifyRotationRows,
  type IslandPopularityLevel
} from '@/lib/island/weekly'
import { islandListSeparator, pickIslandName } from '@/lib/island/localization'
import type { IslandRotationRow, IslandWorkshopFile, IslandWorkshopProduct } from '@/lib/island/types'
import { loadIslandWeekly, loadIslandWorkshop } from '@/services/island/islandApi'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t, current } = useLocale()
const loading = ref(true)
const error = ref(false)
const workshopFile = ref<IslandWorkshopFile | null>(null)
const rotation = ref<IslandRotationRow[]>([])
const selectedProduct = ref('')
const constraints = ref<Record<string, IslandPopularityLevel>>({})
const workshopLevel = ref(4)
const restCycle = ref(2)

const NGA_REFERENCE_URL = 'https://bbs.nga.cn/read.php?tid=34810413'
const anchors = ISLAND_ROTATION_ANCHORS
const POPULARITY_LEVELS = [1, 2, 3, 4] as const

const products = computed<IslandWorkshopProduct[]>(() => workshopFile.value?.products ?? [])

const productById = computed(() => new Map(products.value.map((product) => [product.id, product])))

const currency = computed(() => workshopFile.value?.currency ?? null)

function nameOf(product: IslandWorkshopProduct) {
  return pickIslandName(product.names, current.value)
}

function levelLabel(level: number) {
  if (level === 1) return t(islandTextKeys.popularityVeryHigh)
  if (level === 2) return t(islandTextKeys.popularityHigh)
  if (level === 3) return t(islandTextKeys.popularityAverage)
  return t(islandTextKeys.popularityLow)
}

const matches = computed(() => identifyRotationRows(rotation.value, constraints.value))
const matchRow = computed(() => matches.value[0])

const constraintEntries = computed(() =>
  Object.entries(constraints.value).map(([productId, level]) => ({
    productId,
    level,
    name: productById.value.get(productId) ? nameOf(productById.value.get(productId)!) : productId
  }))
)

const levelSortedProducts = computed(() => {
  const row = matchRow.value
  if (!row) {
    return products.value
  }
  return [...products.value].sort(
    (a, b) => (row.values[a.id] ?? 9) - (row.values[b.id] ?? 9) || a.id.localeCompare(b.id, 'en', { numeric: true })
  )
})

function levelOf(row: IslandRotationRow | undefined, productId: string): number {
  return row?.values[productId] ?? 3
}

function addConstraint(level: IslandPopularityLevel) {
  if (!selectedProduct.value) {
    return
  }
  constraints.value = { ...constraints.value, [selectedProduct.value]: level }
  selectedProduct.value = ''
}

function toggleConstraint(productId: string) {
  const next = { ...constraints.value }
  const level = next[productId]
  if (level === undefined || level >= 4) {
    delete next[productId]
  } else {
    next[productId] = (level + 1) as IslandPopularityLevel
  }
  constraints.value = next
}

function removeConstraint(productId: string) {
  const next = { ...constraints.value }
  delete next[productId]
  constraints.value = next
}

function clearConstraints() {
  constraints.value = {}
}

// 规划器数据：周期作业使用已识别轮换行（未识别按普通档估算）。
const plannerProducts = computed(() => {
  const file = workshopFile.value
  if (!file) {
    return []
  }
  return file.products.map((product) => ({
    id: product.id,
    name: pickIslandName(product.names, current.value) || product.id,
    names: product.names,
    icon: product.icon,
    hours: product.hours,
    value: product.value,
    levelReq: product.levelReq,
    materials: product.materials.map((material) => ({
      name: pickIslandName(material.names, current.value) || material.itemId,
      amount: material.amount
    }))
  }))
})

const plannerPopularity = computed<Record<string, IslandPopularityLevel>>(() => {
  const row = matchRow.value
  if (!row) {
    return {}
  }
  const result: Record<string, IslandPopularityLevel> = {}
  for (const [productId, level] of Object.entries(row.values)) {
    if (level >= 1 && level <= 4) {
      result[productId] = level as IslandPopularityLevel
    }
  }
  return result
})

const popularityRatios = computed<Record<IslandPopularityLevel, number>>(() => {
  const ratios: Partial<Record<IslandPopularityLevel, number>> = {}
  for (const level of workshopFile.value?.popularityTypes ?? []) {
    const id = Number(level.id) as IslandPopularityLevel
    if (id >= 1 && id <= 4) {
      ratios[id] = level.ratio / 100
    }
  }
  return ratios as Record<IslandPopularityLevel, number>
})

const grooveBonuses = computed(() =>
  (workshopFile.value?.tensionLevels ?? []).map((level) => level.bonus)
)

const phaseRanks = computed(() => workshopFile.value?.phaseRoutes.ranks ?? [])
const phaseNotes = computed(() => workshopFile.value?.phaseRoutes.notes ?? [])
const listSeparator = computed(() => islandListSeparator(current.value))

onMounted(async () => {
  try {
    const [workshop, weekly] = await Promise.all([loadIslandWorkshop(), loadIslandWeekly()])
    workshopFile.value = workshop
    rotation.value = weekly.rotation
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.island-goods__reference {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast);
}
.island-goods__reference:hover,
.island-goods__reference:focus-visible {
  border-color: var(--ns-color-accent-strong);
  outline: 0;
}
.island-goods__reference-label {
  padding: 3px 8px;
  border: 1px solid var(--ns-color-accent-strong);
  border-radius: 6px;
  color: var(--ns-color-accent-strong);
  font-size: 12px;
}
.island-goods__reference strong {
  font-size: 15px;
  overflow-wrap: anywhere;
}
.island-goods__reference small {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-view h2,
.island-goods h2,
section h2 {
  margin: 0 0 8px;
  font-size: 17px;
}
section h3 {
  margin: 10px 0 6px;
  font-size: 15px;
}
.island-goods__note {
  margin: 4px 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}
.island-goods__identify {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-top: 8px;
}
.island-goods__field {
  display: grid;
  gap: 4px;
  font-size: 13px;
  color: var(--ns-color-text-muted);
}
.island-goods__field select {
  min-width: 220px;
  padding: 8px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 8px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
}
.island-goods__levels {
  display: flex;
  gap: 6px;
}
.island-goods__level {
  padding: 7px 12px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  cursor: pointer;
}
.island-goods__level:disabled {
  opacity: 0.5;
  cursor: default;
}
.island-goods__constraints {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.island-goods__constraints-label {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-goods__chip {
  padding: 5px 10px;
  border: 1px solid var(--ns-color-border-strong);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  cursor: pointer;
}
.island-goods__clear {
  border: 0;
  background: none;
  color: var(--ns-color-accent-strong);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}
.island-goods__result {
  margin: 0;
  font-size: 15px;
}
.island-goods__result--unique {
  color: var(--ns-color-accent-strong);
  font-weight: 600;
}
.island-goods__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.island-goods__cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  text-align: left;
  cursor: pointer;
}
.island-goods__cell[data-level='1'] {
  border-color: var(--ns-color-accent-strong);
}
.island-goods__cell[data-level='4'] {
  opacity: 0.75;
}
.island-goods__cell-name {
  min-width: 0;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.island-goods__cell-level {
  flex-shrink: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}
.island-goods__anchors summary {
  cursor: pointer;
  font-size: 14px;
  color: var(--ns-color-text-muted);
}
.island-goods__anchor-list {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.8;
}
.island-goods__planner {
  margin-top: 10px;
}
.island-goods__phases {
  display: grid;
  gap: 14px;
  margin-top: 8px;
}
.island-goods__phase {
  padding: 10px 14px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
}
.island-goods__phase h3 {
  margin: 0 0 8px;
  font-size: 15px;
}
.island-goods__phase h3 small {
  margin-left: 8px;
  color: var(--ns-color-text-muted);
  font-weight: normal;
  font-size: 13px;
}
.island-goods__routes {
  display: grid;
  gap: 10px;
}
.island-goods__route > small {
  display: block;
  margin-bottom: 4px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}
.island-goods__route-crafts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.island-goods__route-craft {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  font-size: 13px;
}
.island-goods__route-craft small {
  color: var(--ns-color-text-muted);
}
@media (max-width: 760px) {
  .island-goods__field select {
    min-width: 0;
    width: 100%;
  }
}
</style>
