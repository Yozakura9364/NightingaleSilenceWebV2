<template>
  <main class="nsglamour-snapshot-page">
    <NSGlamourSnapshotView
      v-if="snapshot"
      :snapshot="snapshot"
      :api-base="boundary.apiBase"
    />
    <p v-else class="nsglamour-snapshot-page__status" :data-tone="statusTone">
      {{ statusMessage }}
    </p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ApiError } from '@/composables/useFetch'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type { GlamourSnapshot } from '@/lib/glamour/types'
import NSGlamourSnapshotView from '@/pages/glamour/components/NSGlamourSnapshotView.vue'
import { useNSGlamourSnapshots } from '@/pages/glamour/services/nsglamourSnapshots'
import type { ApiBoundary } from '@/services/apiBoundaries'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  snapshotId: string
  boundary: ApiBoundary
}>()

const { t } = useLocale()
const api = useNSGlamourSnapshots(props.boundary)
const snapshot = ref<GlamourSnapshot>()
const statusTone = ref<'loading' | 'danger'>('loading')
const statusKey = ref<string>(textKeys.nsglamourSnapshotLoading)
const statusMessage = computed(() => t(statusKey.value))

watch(
  () => props.snapshotId,
  () => loadSnapshot()
)

onMounted(loadSnapshot)

async function loadSnapshot(): Promise<void> {
  snapshot.value = undefined
  statusTone.value = 'loading'
  statusKey.value = textKeys.nsglamourSnapshotLoading

  try {
    snapshot.value = (await api.loadSnapshot(props.snapshotId)).snapshot
  } catch (error) {
    statusTone.value = 'danger'
    statusKey.value =
      error instanceof ApiError && error.status === 404
        ? textKeys.nsglamourSnapshotNotFound
        : textKeys.nsglamourSnapshotLoadError
  }
}
</script>

<style scoped>
.nsglamour-snapshot-page {
  box-sizing: border-box;
  width: min(1120px, 100%);
  min-height: 100%;
  margin: 0 auto;
  padding: 28px 18px;
}

.nsglamour-snapshot-page__status {
  margin: 0;
  padding: 18px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text-muted);
}

.nsglamour-snapshot-page__status[data-tone='danger'] {
  border-color: var(--ns-status-danger-border);
  color: var(--ns-status-danger-text);
}
</style>
