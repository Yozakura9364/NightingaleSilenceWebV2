<template>
  <section class="island-view">
    <IslandFilterBar v-model="query" :count="matchCount" :total="totalCount" />
    <p class="island-codex__note">{{ t(islandTextKeys.codexNote) }}</p>
    <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />

    <template v-if="!loading && !error">
      <div
        v-for="group in groups"
        :key="group.title"
        class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
      >
        <h2>
          {{ group.title }}
          <small v-if="group.count !== undefined">{{ group.count }}</small>
          <span
            v-for="currency in group.currencies ?? []"
            :key="currency.itemId"
            class="island-codex__currency"
            :title="currency.name"
          >
            <IslandItemIcon :icon="currency.icon" :alt="currency.name" />
            {{ currency.name }}
          </span>
        </h2>
        <p v-if="group.note" class="island-codex__note">{{ group.note }}</p>
        <AppStatus v-if="!group.rows.length" tone="warning" :message="t(islandTextKeys.noResults)" />
        <div v-else class="island-codex__list">
          <IslandCodexRow
            v-for="row in group.rows"
            :key="row.key"
            v-bind="row.props"
            @map="openMaterialMap"
          />
        </div>
      </div>
    </template>

    <IslandMapModal
      :open="mapModalOpen"
      :label="t(islandTextKeys.mapTitle)"
      :markers="modalMarkerList"
      :highlight-id="modalHighlight"
      @close="mapModalOpen = false"
      @update:highlight-id="modalHighlight = $event ?? ''"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import IslandCodexRow from '@/pages/island/components/IslandCodexRow.vue'
import IslandFilterBar from '@/pages/island/components/IslandFilterBar.vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import IslandMapModal from '@/pages/island/components/IslandMapModal.vue'
import type { IslandInteractiveMarker } from '@/pages/island/components/IslandInteractiveMap.vue'
import { formatIslandMaterialList, islandListSeparator, pickIslandName } from '@/lib/island/localization'
import { loadIslandMapMarkers, type IslandMapMarkerData } from '@/services/island/islandMarkers'
import type {
  IslandBuildingsFile,
  IslandCropsFile,
  IslandCurrency,
  IslandGranaryFile,
  IslandMaterialsFile,
  IslandShopFile,
  IslandWorkshopFile
} from '@/lib/island/types'
import {
  loadIslandBuildings,
  loadIslandCrops,
  loadIslandGranary,
  loadIslandMaterials,
  loadIslandShop,
  loadIslandWorkshop
} from '@/services/island/islandApi'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t, current } = useLocale()
const loading = ref(true)
const error = ref(false)
const materialsFile = ref<IslandMaterialsFile | null>(null)
const workshopFile = ref<IslandWorkshopFile | null>(null)
const cropsFile = ref<IslandCropsFile | null>(null)
const buildingsFile = ref<IslandBuildingsFile | null>(null)
const granaryFile = ref<IslandGranaryFile | null>(null)
const shopFile = ref<IslandShopFile | null>(null)
const query = ref('')
const mapModalOpen = ref(false)
const modalHighlight = ref('')
const modalMarkers = ref<IslandMapMarkerData>({ animals: [], gathering: [] })
const modalMarkerList = computed<IslandInteractiveMarker[]>(() => [
  ...modalMarkers.value.animals,
  ...modalMarkers.value.gathering
])

function openMaterialMap(rowKey: string) {
  modalHighlight.value = rowKey.replace(/^m-/, 'g-')
  mapModalOpen.value = true
}

const keyword = computed(() => query.value.trim().toLowerCase())

function matches(names: Record<string, string> | null | undefined, fallback: string) {
  const value = keyword.value
  if (!value) {
    return true
  }
  return (pickIslandName(names ?? {}, current.value) || fallback).toLowerCase().includes(value)
}

interface CodexRowProps {
  icon?: number | null
  title: string
  tags?: string[]
  meta?: string[]
  mapTarget?: string
}

interface CodexGroup {
  title: string
  rows: { key: string; props: CodexRowProps }[]
  count?: number
  /** 分组货币标注（工房/商店显示涉及的货币） */
  currencies?: IslandCurrency[]
  /** 分组补充说明（农田常量、谷仓数据边界等） */
  note?: string
}

const groups = computed<CodexGroup[]>(() => {
  const materials = materialsFile.value
  const workshop = workshopFile.value
  const crops = cropsFile.value
  const buildings = buildingsFile.value
  const shop = shopFile.value
  if (!materials || !workshop || !crops || !buildings || !shop) {
    return []
  }
  const name = (names: Record<string, string>, fallback = '') => pickIslandName(names, current.value) || fallback

  const materialRows = materials.materials
    .filter((material) => matches(material.names, material.id))
    .map((material) => ({
      key: `m-${material.id}`,
      props: {
        icon: material.icon,
        title: name(material.names, material.id),
        tags: [
          name(
            materials.categories.find((category) => category.id === material.categoryId)?.names ?? {},
            ''
          )
        ].filter(Boolean),
        meta: [
          material.tool
            ? `${t(islandTextKeys.colTool)}: ${name(material.tool.names)}` +
              (material.tool.unlockRank
                ? `（${t(islandTextKeys.unlockRankLabel)} ${material.tool.unlockRank}）`
                : '')
            : '',
          material.gathering?.x != null && material.gathering?.y != null
            ? `${t(islandTextKeys.animalsPositionLabel)} (${material.gathering.x.toFixed(1)}, ${material.gathering.y.toFixed(1)})`
            : ''
        ].filter(Boolean),
        mapTarget:
          material.gathering?.x != null && material.gathering?.y != null
            ? `m-${material.id}`
            : ''
      }
    }))

  const toolRows = materials.tools
    .filter((tool) => matches(tool.names, tool.id))
    .map((tool) => ({
      key: `t-${tool.id}`,
      props: {
        icon: tool.icon,
        title: name(tool.names, tool.id),
        tags: [],
        meta: [
          tool.unlockRank
            ? `${t(islandTextKeys.unlockRankLabel)} ${tool.unlockRank}`
            : ''
        ].filter(Boolean)
      }
    }))

  const manualRows = materials.manualRecipes
    .filter((recipe) => matches(recipe.product?.names, recipe.id))
    .map((recipe) => ({
      key: `r-${recipe.id}`,
      props: {
        icon: recipe.product?.icon ?? null,
        title: recipe.product ? name(recipe.product.names, recipe.id) : recipe.id,
        tags: recipe.keyItem ? [name(recipe.keyItem.names)] : [],
        meta: [formatIslandMaterialList(recipe.materials, current.value)]
      }
    }))

  const themeNames = new Map(workshop.themes.map((theme) => [theme.id, name(theme.names)]))
  const workshopRows = workshop.products
    .filter((product) => matches(product.names, product.id))
    .map((product) => ({
      key: `w-${product.id}`,
      props: {
        icon: product.icon,
        title: name(product.names, product.id),
        tags: product.themeIds.map((id) => themeNames.get(id) ?? id).slice(0, 2),
        meta: [
          `${t(islandTextKeys.colLevelReq)} ${product.levelReq}`,
          `${product.hours} ${t(islandTextKeys.workshopHoursUnit)}`,
          `${product.value}`,
          formatIslandMaterialList(product.materials, current.value)
        ]
      }
    }))

  const cropRows = crops.crops
    .filter((crop) => matches(crop.seedNames, crop.id))
    .map((crop) => ({
      key: `c-${crop.id}`,
      props: {
        icon: crop.seedIcon,
        title: name(crop.seedNames, crop.id),
        tags: [
          ...(crop.seedUnlockRank
            ? [`${t(islandTextKeys.unlockRankLabel)} ${crop.seedUnlockRank}`]
            : []),
          ...(crop.crop ? [`${t(islandTextKeys.colHarvest)}: ${name(crop.crop.names)}`] : [])
        ],
        meta: []
      }
    }))

  const structureRows = (structures: typeof buildings.buildings, prefix: string) =>
    structures
      .filter((structure) => matches(structure.names, structure.id))
      .map((structure) => ({
        key: `${prefix}-${structure.id}`,
        props: {
          icon: structure.icon,
          title: name(structure.names, structure.id),
          tags: [],
          meta: [formatIslandMaterialList(structure.materials, current.value)]
        }
      }))

  const shopRows = shop.items
    .filter((item) => matches(item.names, item.id))
    .map((item) => ({
      key: `s-${item.id}`,
      props: {
        icon: item.icon,
        title: name(item.names, item.id),
        tags: [],
        meta: [
          `${pickIslandName(shop.currencies?.[item.currencyId]?.names ?? {}, current.value) || item.currencyId} ${item.price}`
        ]
      }
    }))

  const separator = islandListSeparator(current.value)
  const granaryRows = (granaryFile.value?.destinations ?? [])
    .filter((destination) => matches(destination.areaNames, String(destination.area)))
    .map((destination) => ({
      key: `gr-${destination.area}`,
      props: {
        icon: destination.rareMaterials[0]?.icon ?? null,
        title: pickIslandName(destination.areaNames, current.value) || destination.name,
        tags: destination.rareMaterials.map((rare) => pickIslandName(rare.names, current.value)),
        meta: [
          destination.materials.length
            ? destination.materials
                .map((material) => pickIslandName(material.names, current.value))
                .join(separator)
            : ''
        ].filter(Boolean)
      }
    }))

  const definedGroups: CodexGroup[] = [
    { title: t(islandTextKeys.sectionMaterials), rows: materialRows, count: materials.materials.length },
    { title: t(islandTextKeys.sectionGatheringTools), rows: toolRows, count: materials.tools.length },
    { title: t(islandTextKeys.sectionManualRecipes), rows: manualRows, count: materials.manualRecipes.length },
    { title: t(islandTextKeys.sectionWorkshop), rows: workshopRows, count: workshop.products.length, currencies: [workshop.currency] },
    {
      title: t(islandTextKeys.sectionCrops),
      rows: cropRows,
      count: crops.crops.length,
      note: crops.growth ? (current.value === 'zh-CN' ? crops.growth.noteZh : crops.growth.noteEn) : undefined
    },
    {
      title: t(islandTextKeys.sectionGranary),
      rows: granaryRows,
      count: granaryFile.value?.destinations.length ?? 0,
      note: t(islandTextKeys.granaryNote)
    },
    { title: t(islandTextKeys.sectionBuildings), rows: structureRows(buildings.buildings, 'b'), count: buildings.buildings.length },
    { title: t(islandTextKeys.sectionLandmarks), rows: structureRows(buildings.landmarks, 'l'), count: buildings.landmarks.length },
    {
      title: t(islandTextKeys.sectionShop),
      rows: shopRows,
      count: shop.items.length,
      currencies: Object.values(shop.currencies ?? {})
    }
  ]
  return definedGroups
})

const matchCount = computed(() => groups.value.reduce((sum, group) => sum + group.rows.length, 0))
const totalCount = computed(() =>
  groups.value.reduce((sum, group) => sum + (group.count ?? group.rows.length), 0)
)

onMounted(async () => {
  try {
    const [materials, workshop, crops, buildings, granary, shop, markerData] = await Promise.all([
      loadIslandMaterials(),
      loadIslandWorkshop(),
      loadIslandCrops(),
      loadIslandBuildings(),
      loadIslandGranary(),
      loadIslandShop(),
      loadIslandMapMarkers(current.value)
    ])
    materialsFile.value = materials
    workshopFile.value = workshop
    cropsFile.value = crops
    buildingsFile.value = buildings
    granaryFile.value = granary
    shopFile.value = shop
    modalMarkers.value = markerData
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.island-codex__note {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}
.island-codex__list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}
.island-codex__list :deep(h2) {
  margin: 0;
}
.island-codex__currency {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
  color: var(--ns-color-text-muted);
  font-size: 13px;
  font-weight: normal;
}
.island-codex__currency :deep(.island-icon) {
  width: 20px;
  height: 20px;
}
</style>
