<template>
  <main class="ns-page housing-page">
    <div class="ns-page-shell housing-shell">
      <header class="housing-header">
        <div class="housing-header__top">
          <h1 class="housing-header__title">{{ t(housingTextKeys.title) }}</h1>
          <button
            type="button"
            class="housing-header__refresh"
            :disabled="loading"
            @click="refresh"
          >
            {{ loading ? t(housingTextKeys.refreshing) : t(housingTextKeys.refresh) }}
          </button>
        </div>
        <div class="housing-header__controls">
          <HousingRegionSwitch
            :model-value="region"
            :disabled="loading"
            @update:model-value="onRegionChange"
          />
          <HousingServerPicker
            :region="region"
            :model-value="selectedServerId"
            :worlds="worlds"
            :disabled="loading"
            @update:model-value="onServerChange"
          />
        </div>
        <p class="housing-header__updated">{{ updatedAtText }}</p>
      </header>

      <HousingFilterBar
        v-model:size="filters.size"
        v-model:audience="filters.audience"
        v-model:cycle="filters.cycle"
        v-model:group="filters.group"
      />

      <div class="housing-summary">
        <span class="housing-summary__total">
          <span class="housing-summary__label">{{ t(housingTextKeys.summaryTotalLabel) }}</span>
          <strong class="housing-summary__value">{{ summaryText }}</strong>
        </span>
        <span v-for="group in plotGroups" :key="group.key" class="housing-summary__district">
          <span class="housing-summary__district-name">{{ group.label }}</span>
          <span class="housing-summary__district-count">{{ group.countText }}</span>
        </span>
        <span class="housing-summary__tools">
          <button
            type="button"
            class="housing-summary__fav"
            :aria-pressed="favOnly"
            @click="favOnly = !favOnly"
          >
            ★ {{ t(housingTextKeys.favOnly) }} ({{ favorites.length }})
          </button>
          <label class="housing-summary__sort">
            <span>{{ t(housingTextKeys.sortLabel) }}</span>
            <select v-model="sortBy">
              <option value="default">{{ t(housingTextKeys.sortDefault) }}</option>
              <option value="priceAsc">{{ t(housingTextKeys.sortPriceAsc) }}</option>
              <option value="priceDesc">{{ t(housingTextKeys.sortPriceDesc) }}</option>
              <option value="entriesAsc">{{ t(housingTextKeys.sortEntriesAsc) }}</option>
              <option value="entriesDesc">{{ t(housingTextKeys.sortEntriesDesc) }}</option>
              <option value="scanDesc">{{ t(housingTextKeys.sortScanDesc) }}</option>
            </select>
          </label>
        </span>
      </div>

      <div v-if="error" class="housing-state housing-state--error" role="alert">
        <p>{{ t(housingTextKeys.loadError) }}</p>
        <button type="button" class="housing-state__retry" @click="retry">{{ t(coreTextKeys.retry) }}</button>
      </div>

      <div v-else-if="loading && !serverData" class="housing-state">
        <p>{{ t(housingTextKeys.loading) }}</p>
      </div>

      <div v-else-if="!serverData || serverData.plots.length === 0" class="housing-state housing-state--empty">
        <p class="housing-state__title">{{ t(housingTextKeys.emptyTitle) }}</p>
        <p class="housing-state__hint">{{ t(housingTextKeys.emptyHint) }}</p>
      </div>

      <div v-else-if="filteredPlots.length === 0" class="housing-state housing-state--empty">
        <p class="housing-state__title">
          {{ favOnly && favorites.length === 0 ? t(housingTextKeys.favEmpty) : t(housingTextKeys.filterEmptyTitle) }}
        </p>
      </div>

      <template v-else>
        <section
          v-for="group in plotGroups"
          :key="group.key"
          class="housing-district"
        >
          <h2 class="housing-district__title">
            <button
              type="button"
              class="housing-district__toggle"
              :aria-expanded="!isCollapsed(group.key)"
              @click="toggleGroup(group.key)"
            >
              <span>{{ group.label }}</span>
              <span class="housing-district__count">{{ group.countText }}</span>
              <span class="housing-district__chevron">
                {{ isCollapsed(group.key) ? t(housingTextKeys.groupExpand) : t(housingTextKeys.groupCollapse) }}
              </span>
            </button>
          </h2>
          <div v-if="!isCollapsed(group.key)" class="housing-district__list">
            <HousingPlotBar
              v-for="plot in group.plots"
              :key="plot.key"
              :plot="plot"
              :now="now"
              :favorited="favorites.includes(plot.key)"
              @toggle-favorite="toggleFavorite(plot.key)"
            />
          </div>
        </section>
      </template>

      <footer class="housing-source">
        <span class="housing-source__label">{{ t(housingTextKeys.dataSourceLabel) }}</span>
        <span>{{ region === 'global' ? t(housingTextKeys.dataSourcePaissa) : t(housingTextKeys.dataSourceCyou) }}</span>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { housingTextKeys } from '@/locales/keys/housing'
import { coreTextKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { fetchPaissaWorldPlots, fetchPaissaWorlds } from '@/lib/housing/paissaAdapter'
import { fetchCnServerPlots } from '@/lib/housing/cyouAdapter'
import {
  clearCachedPlots,
  loadCachedPlots,
  loadFavorites,
  loadSelectedServer,
  saveCachedPlots,
  saveFavorites,
  saveSelectedServer
} from '@/lib/housing/housingCache'
import {
  cnServers,
  defaultServerIdByRegion,
  getCnServerOrDefault
} from '@/lib/housing/regions'
import type {
  HousingRegionKey,
  HousingServerData,
  HousingWorld
} from '@/lib/housing/types'
import HousingRegionSwitch from './components/HousingRegionSwitch.vue'
import HousingServerPicker from './components/HousingServerPicker.vue'
import HousingFilterBar from './components/HousingFilterBar.vue'
import type {
  HousingAudienceFilter,
  HousingCycleFilter,
  HousingGroupFilter,
  HousingSizeFilter
} from './components/HousingFilterBar.vue'
import HousingPlotBar from './components/HousingPlotBar.vue'

interface HousingFilters {
  group: HousingGroupFilter
  size: HousingSizeFilter
  audience: HousingAudienceFilter
  cycle: HousingCycleFilter
}

const { t } = useLocale()

const region = ref<HousingRegionKey>(readStoredRegion())
const worlds = ref<HousingWorld[]>([])
const selectedServerId = ref<number>(readInitialServerId())
const serverData = ref<HousingServerData | null>(null)
const loading = ref(false)
const error = ref(false)
const now = ref(Date.now())
// 三个筛选字段通过 defineModel 双向绑定，整体保持 ref 响应性
const filters = ref<HousingFilters>({ group: 'district', size: 'all', audience: 'all', cycle: 'all' })
const favorites = ref<string[]>(loadFavorites())
const favOnly = ref(false)
type SortMode = 'default' | 'priceAsc' | 'priceDesc' | 'entriesAsc' | 'entriesDesc' | 'scanDesc'
const sortBy = ref<SortMode>('default')
// 大区分组默认折叠（>100 条），用户手动切换覆盖默认值
const groupCollapseOverrides = ref<Record<string, boolean>>({})

function toggleFavorite(key: string): void {
  favorites.value = favorites.value.includes(key)
    ? favorites.value.filter((item) => item !== key)
    : [...favorites.value, key]
  saveFavorites(favorites.value)
}

function isCollapsed(groupKey: string): boolean {
  const override = groupCollapseOverrides.value[groupKey]
  if (override !== undefined) {
    return override
  }
  const group = plotGroups.value.find((item) => item.key === groupKey)
  return (group?.plots.length ?? 0) > 100
}

function toggleGroup(groupKey: string): void {
  groupCollapseOverrides.value = {
    ...groupCollapseOverrides.value,
    [groupKey]: !isCollapsed(groupKey)
  }
}

let nowTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
  void initialize()
})

onBeforeUnmount(() => {
  if (nowTimer !== undefined) {
    clearInterval(nowTimer)
  }
})

function readStoredRegion(): HousingRegionKey {
  try {
    const raw = localStorage.getItem('ns-housing:region')
    return raw === 'cn' ? 'cn' : 'global'
  } catch {
    return 'global'
  }
}

function readInitialServerId(): number {
  const stored = loadSelectedServer(region.value)
  if (stored !== null) {
    return stored
  }
  return defaultServerIdByRegion[region.value]
}

async function initialize(): Promise<void> {
  await alignServerIdToRegion()
  if (region.value === 'global') {
    await ensureWorlds()
    alignServerIdToRegion()
  }
  await loadServerData(true)
}

async function ensureWorlds(): Promise<void> {
  if (worlds.value.length > 0) {
    return
  }
  try {
    worlds.value = await fetchPaissaWorlds()
  } catch {
    // 世界列表失败不阻塞页面：保留当前选择，服务器选择器为空时用户可刷新
  }
}

/** 校验记住的服务器 ID 在当前区域真实存在（历史遗留 ID 回退默认值） */
function alignServerIdToRegion(): void {
  if (region.value === 'global') {
    if (worlds.value.length === 0) {
      return
    }
    const exists = worlds.value.some((world) => world.id === selectedServerId.value)
    if (!exists) {
      selectedServerId.value = defaultServerIdByRegion.global
    }
    return
  }
  if (!cnServers.some((server) => server.id === selectedServerId.value)) {
    selectedServerId.value = defaultServerIdByRegion.cn
  }
}

async function loadServerData(useCache: boolean): Promise<void> {
  const regionKey = region.value
  const serverId = selectedServerId.value
  if (useCache) {
    const cached = loadCachedPlots(regionKey, serverId)
    if (cached) {
      serverData.value = cached
      error.value = false
      return
    }
  }
  loading.value = true
  error.value = false
  try {
    let data: HousingServerData
    if (regionKey === 'global') {
      data = await fetchPaissaWorldPlots(serverId)
    } else {
      const server = getCnServerOrDefault(serverId)
      data = await fetchCnServerPlots(server.id, server.name)
    }
    serverData.value = data
    saveCachedPlots(data)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function onRegionChange(next: HousingRegionKey): void {
  if (next === region.value) {
    return
  }
  region.value = next
  try {
    localStorage.setItem('ns-housing:region', next)
  } catch {
    // ignore
  }
  const stored = loadSelectedServer(next)
  selectedServerId.value = stored ?? defaultServerIdByRegion[next]
  void alignServerIdToRegion()
  serverData.value = null
  if (next === 'global') {
    void ensureWorlds().then(alignServerIdToRegion)
  }
  void loadServerData(true)
}

function onServerChange(serverId: number): void {
  if (serverId === selectedServerId.value) {
    return
  }
  selectedServerId.value = serverId
  saveSelectedServer(region.value, serverId)
  void loadServerData(true)
}

function refresh(): void {
  clearCachedPlots(region.value, selectedServerId.value)
  void loadServerData(false)
}

function retry(): void {
  clearCachedPlots(region.value, selectedServerId.value)
  void loadServerData(false)
}

const updatedAtText = computed(() => {
  const updatedAt = serverData.value?.updatedAt ?? null
  if (updatedAt === null) {
    return t(housingTextKeys.unknownUpdatedAt)
  }
  return `${t(housingTextKeys.updatedAtLabel)} ${new Date(updatedAt).toLocaleString()}`
})

interface PlotGroup {
  /** 组标识：区域分组用 districtId，尺寸分组用 size 名 */
  key: string
  label: string
  countText: string
  plots: HousingServerData['plots']
}

const filteredPlots = computed<HousingServerData['plots']>(() => {
  const plots = serverData.value?.plots ?? []
  return plots.filter((plot) => {
    if (favOnly.value && !favorites.value.includes(plot.key)) {
      return false
    }
    if (filters.value.size === 'ml') {
      if (plot.size === 'small') {
        return false
      }
    } else if (filters.value.size !== 'all' && plot.size !== filters.value.size) {
      return false
    }
    if (filters.value.audience !== 'all') {
      // 个人/部队筛选包含“个人·部队均可”的地块
      const matches =
        plot.audience === 'both' ||
        (filters.value.audience === 'individual' && plot.audience === 'individual') ||
        (filters.value.audience === 'freeCompany' && plot.audience === 'freeCompany')
      if (!matches) {
        return false
      }
    }
    if (filters.value.cycle !== 'all') {
      const cycles = filters.value.cycle === 'current' ? ['entry', 'results'] : ['upcoming']
      if (!cycles.includes(plot.phase)) {
        return false
      }
    }
    return true
  })
})

type Plot = HousingServerData['plots'][number]

function byLocation(a: Plot, b: Plot): number {
  return a.districtId - b.districtId || a.ward - b.ward || a.plot - b.plot
}

function comparePlots(a: Plot, b: Plot): number {
  switch (sortBy.value) {
    case 'priceAsc':
      return a.price - b.price || byLocation(a, b)
    case 'priceDesc':
      return b.price - a.price || byLocation(a, b)
    case 'entriesAsc': {
      // 报名数未知的地块排最后，0 人报名优先
      const av = a.entries === null ? Number.MAX_SAFE_INTEGER : a.entries
      const bv = b.entries === null ? Number.MAX_SAFE_INTEGER : b.entries
      return av - bv || byLocation(a, b)
    }
    case 'entriesDesc': {
      const av = a.entries === null ? -1 : a.entries
      const bv = b.entries === null ? -1 : b.entries
      return bv - av || byLocation(a, b)
    }
    case 'scanDesc': {
      const av = a.lastUpdatedAt ?? 0
      const bv = b.lastUpdatedAt ?? 0
      return bv - av || byLocation(a, b)
    }
    default:
      return byLocation(a, b)
  }
}

function districtLabelFor(plot: HousingServerData['plots'][number]): string {
  return plot.districtNameKey ? t(plot.districtNameKey) : plot.districtNameFallback
}

function sizeLabelFor(plot: HousingServerData['plots'][number]): string {
  if (plot.size === 'medium') {
    return t(housingTextKeys.sizeMedium)
  }
  if (plot.size === 'large') {
    return t(housingTextKeys.sizeLarge)
  }
  return t(housingTextKeys.sizeSmall)
}

const districtGroups = computed<PlotGroup[]>(() => {
  const groups = new Map<number, HousingServerData['plots']>()
  for (const plot of filteredPlots.value) {
    const list = groups.get(plot.districtId) ?? []
    list.push(plot)
    groups.set(plot.districtId, list)
  }
  return [...groups.entries()]
    .map(([districtId, plots]) => {
      plots.sort(comparePlots)
      return {
        key: String(districtId),
        label: districtLabelFor(plots[0]),
        countText: `${plots.length}${t(housingTextKeys.plotCountUnit)}`,
        plots
      }
    })
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
})

const sizeGroups = computed<PlotGroup[]>(() => {
  const order: Array<HousingServerData['plots'][number]['size']> = ['small', 'medium', 'large']
  const groups = new Map<string, HousingServerData['plots']>()
  for (const plot of filteredPlots.value) {
    const list = groups.get(plot.size) ?? []
    list.push(plot)
    groups.set(plot.size, list)
  }
  return order
    .filter((size) => groups.has(size))
    .map((size) => {
      const plots = groups.get(size) ?? []
      plots.sort(comparePlots)
      return {
        key: size,
        label: sizeLabelFor(plots[0]),
        countText: `${plots.length}${t(housingTextKeys.plotCountUnit)}`,
        plots
      }
    })
})

const plotGroups = computed<PlotGroup[]>(() =>
  filters.value.group === 'size' ? sizeGroups.value : districtGroups.value
)

const summaryText = computed(() => {
  const count = filteredPlots.value.length
  return count === 0 ? t(housingTextKeys.summaryEmpty) : `${count}${t(housingTextKeys.plotCountUnit)}`
})
</script>

<style scoped>
.housing-page {
  --housing-page-bg: #f3f5f7;
  --housing-card-bg: #ffffff;
  --housing-ink: #2d3142;
  --housing-muted: #737b8c;
  --housing-line: #d8dce3;
  --housing-accent: var(--ns-color-accent-strong);
  min-height: 100%;
  background: var(--housing-page-bg);
  color: var(--housing-ink);
}

.housing-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(1280px, calc(100vw - 32px));
  padding-top: 28px;
  padding-bottom: 48px;
}

.housing-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.housing-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.housing-header__title {
  margin: 0;
  color: var(--housing-ink);
  font-family: var(--ns-font-ui);
  font-size: 20px;
  font-weight: 800;
}

.housing-header__refresh {
  min-height: 32px;
  padding: 0 16px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.housing-header__refresh:hover:not(:disabled) {
  border-color: var(--ns-color-border-strong);
  background: var(--ns-color-bg-soft);
}

.housing-header__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.housing-header__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.housing-header__updated {
  margin: 0;
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.housing-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.housing-summary__total {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.housing-summary__label {
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.housing-summary__value {
  color: var(--housing-accent);
  font-family: var(--ns-font-data);
  font-size: 16px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.housing-summary__district {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.housing-summary__district-name {
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.housing-summary__district-count {
  color: var(--housing-ink);
  font-family: var(--ns-font-data);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.housing-summary__tools {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-left: auto;
}

.housing-summary__fav {
  min-height: 28px;
  padding: 0 10px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface);
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.housing-summary__fav[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--ns-color-accent) 42%, var(--ns-color-border));
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}

.housing-summary__sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.housing-summary__sort select {
  min-height: 28px;
  padding: 0 8px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface);
  color: var(--housing-ink);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.housing-district__toggle {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.housing-district__chevron {
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 700;
}

.housing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  border: var(--ns-line-width) dashed var(--housing-line);
  border-radius: var(--ns-radius-md);
  background: var(--housing-card-bg);
  text-align: center;
}

.housing-state p {
  margin: 0;
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 14px;
  font-weight: 700;
}

.housing-state--error p {
  color: var(--ns-color-danger);
}

.housing-state__title {
  color: var(--housing-ink) !important;
  font-size: 16px !important;
  font-weight: 800 !important;
}

.housing-state__hint {
  max-width: 480px;
  font-size: 12px !important;
  font-weight: 700 !important;
}

.housing-state__retry {
  min-height: 32px;
  padding: 0 16px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.housing-district {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.housing-district__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  color: var(--housing-ink);
  font-family: var(--ns-font-ui);
  font-size: 16px;
  font-weight: 800;
}

.housing-district__count {
  color: var(--housing-muted);
  font-family: var(--ns-font-data);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.housing-district__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.housing-source {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: var(--ns-line-width) solid var(--housing-line);
  color: var(--housing-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
}

.housing-source__label {
  font-weight: 800;
}

:global(:root[data-theme='night'] .housing-page) {
  --housing-page-bg: #1e232b;
  --housing-card-bg: #282f39;
  --housing-ink: #eef1f5;
  --housing-muted: #aeb7c4;
  --housing-line: #48515e;
  --housing-accent: var(--ns-color-accent-strong);
}

@media (max-width: 680px) {
  .housing-shell {
    width: min(100%, calc(100vw - 24px));
    padding-top: 20px;
  }
}
</style>
