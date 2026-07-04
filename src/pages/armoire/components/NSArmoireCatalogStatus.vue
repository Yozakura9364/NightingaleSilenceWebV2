<template>
  <section class="nsarmoire-catalog-status">
    <AppStatus
      compact
      :tone="statusTone"
      :title="t(textKeys.nsarmoireCatalogStatus)"
      :message="statusMessage"
    >
      <template v-if="status === 'error'" #actions>
        <AppButton @click="$emit('reload')">
          {{ t(textKeys.nsarmoireReloadCatalog) }}
        </AppButton>
      </template>
    </AppStatus>

    <div v-if="status === 'ready'" class="nsarmoire-catalog-status__metrics">
      <article v-for="metric in metrics" :key="metric.key">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type { ArmoireCatalog } from '@/lib/armoire/types'
import type { ArmoireCatalogStatus } from '@/pages/armoire/composables/useArmoireCatalog'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  catalog: ArmoireCatalog
  status: ArmoireCatalogStatus
  error: string | null
}>()

defineEmits<{
  reload: []
}>()

const { t } = useLocale()

function formatText(key: string, values: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
}

const itemCount = computed(() => Object.keys(props.catalog.items).length)
const cabinetItemCount = computed(() => props.catalog.cabinetItemIds.length)
const setCount = computed(() => props.catalog.glamourSetItems.length)
const identicalGroupCount = computed(() => props.catalog.identicalGroups.length)
const dyeCount = computed(() => Object.keys(props.catalog.dyes).length)

const hasCatalogData = computed(
  () =>
    itemCount.value > 0 ||
    cabinetItemCount.value > 0 ||
    setCount.value > 0 ||
    identicalGroupCount.value > 0 ||
    dyeCount.value > 0
)

const statusTone = computed(() => {
  if (props.status === 'ready') {
    return hasCatalogData.value ? 'success' : 'warning'
  }

  if (props.status === 'error') {
    return 'warning'
  }

  return 'loading'
})

const statusMessage = computed(() => {
  if (props.status === 'ready') {
    if (!hasCatalogData.value) {
      return t(textKeys.nsarmoireCatalogEmpty)
    }

    return formatText(textKeys.nsarmoireCatalogReady, {
      items: itemCount.value,
      cabinet: cabinetItemCount.value,
      sets: setCount.value,
      models: identicalGroupCount.value,
      dyes: dyeCount.value
    })
  }

  if (props.status === 'error') {
    return props.error
      ? formatText(textKeys.nsarmoireCatalogErrorWithDetail, { error: props.error })
      : t(textKeys.nsarmoireCatalogError)
  }

  return t(textKeys.nsarmoireCatalogLoading)
})

const metrics = computed(() => [
  {
    key: 'items',
    label: t(textKeys.nsarmoireMetricCatalogItems),
    value: itemCount.value
  },
  {
    key: 'cabinet',
    label: t(textKeys.nsarmoireMetricCatalogCabinetItems),
    value: cabinetItemCount.value
  },
  {
    key: 'sets',
    label: t(textKeys.nsarmoireMetricCatalogSets),
    value: setCount.value
  },
  {
    key: 'models',
    label: t(textKeys.nsarmoireMetricCatalogModelGroups),
    value: identicalGroupCount.value
  },
  {
    key: 'dyes',
    label: t(textKeys.nsarmoireMetricCatalogDyes),
    value: dyeCount.value
  }
])
</script>

<style scoped>
.nsarmoire-catalog-status {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.nsarmoire-catalog-status__metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;
}

.nsarmoire-catalog-status__metrics article {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-catalog-status__metrics span {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-catalog-status__metrics strong {
  font-family: var(--ns-font-mono);
  font-size: 13px;
}

@media (max-width: 720px) {
  .nsarmoire-catalog-status__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
