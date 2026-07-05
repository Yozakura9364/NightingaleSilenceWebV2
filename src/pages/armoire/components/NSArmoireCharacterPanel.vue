<template>
  <section class="nsarmoire-panel nsarmoire-character-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireCharacterProfile) }}</h2>
    </div>

    <AppStatus
      v-if="!snapshot"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.nsarmoireCharacterNoSnapshot)"
    />

    <template v-else>
      <section class="nsarmoire-character-panel__block">
        <h3>{{ t(textKeys.nsarmoireCharacterCurrentData) }}</h3>

        <dl class="nsarmoire-character-panel__rows">
          <div>
            <dt>{{ t(textKeys.nsarmoireCharacter) }}</dt>
            <dd>{{ characterName }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireCharacterWorld) }}</dt>
            <dd>{{ characterWorld }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireCharacterProfileKey) }}</dt>
            <dd>{{ profileKey }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireSource) }}</dt>
            <dd>{{ sourceLabel }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireGeneratedAt) }}</dt>
            <dd>{{ generatedAtLabel }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireMetricEntries) }}</dt>
            <dd>{{ snapshot.items.length }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireCharacterRetainers) }}</dt>
            <dd>{{ retainerCount }}</dd>
          </div>
          <div>
            <dt>{{ t(textKeys.nsarmoireHelperEndpoint) }}</dt>
            <dd>{{ helperEndpoint }}</dd>
          </div>
        </dl>
      </section>

      <section class="nsarmoire-character-panel__block">
        <h3>{{ t(textKeys.nsarmoireCharacterStaticData) }}</h3>

        <NSArmoireCatalogStatus
          :catalog="catalog"
          :status="catalogStatus"
          :error="catalogError"
          @reload="$emit('reload-catalog')"
        />
      </section>

      <AppStatus
        tone="neutral"
        :title="t(textKeys.nsarmoireCharacterLocalProfileTitle)"
        :message="t(textKeys.nsarmoireCharacterLocalProfileMessage)"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type { ArmoireCatalog, ArmoireSnapshot, ArmoireSnapshotSource } from '@/lib/armoire/types'
import NSArmoireCatalogStatus from '@/pages/armoire/components/NSArmoireCatalogStatus.vue'
import type { ArmoireCatalogStatus } from '@/pages/armoire/composables/useArmoireCatalog'
import type { ArmoireHelperHealth } from '@/pages/armoire/services/nsarmoireHelperApi'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  snapshot: ArmoireSnapshot | null
  helperEndpoint: string
  helperHealth: ArmoireHelperHealth | null
  catalog: ArmoireCatalog
  catalogStatus: ArmoireCatalogStatus
  catalogError: string | null
}>()

defineEmits<{
  'reload-catalog': []
}>()

const { current, t } = useLocale()

const sourceLabelKeys: Record<ArmoireSnapshotSource, string> = {
  'manual-import': textKeys.nsarmoireSourceManualImport,
  'local-helper': textKeys.nsarmoireSourceLocalHelper,
  'asvel-compatible': textKeys.nsarmoireSourceAsvelCompatible
}

const characterName = computed(
  () => props.snapshot?.character?.name || t(textKeys.nsarmoireCharacterUnknown)
)

const characterWorld = computed(
  () => props.snapshot?.character?.world || t(textKeys.nsarmoireCharacterWorldUnknown)
)

const profileKey = computed(() => {
  const character = props.snapshot?.character
  if (!character?.name || !character.world) {
    return t(textKeys.nsarmoireCharacterProfileKeyMissing)
  }

  return `${character.name}@${character.world}`
})

const sourceLabel = computed(() => {
  const source = props.snapshot?.source
  return source ? t(sourceLabelKeys[source]) : t(textKeys.nsarmoireCharacterGeneratedAtEmpty)
})

const generatedAtLabel = computed(() => {
  const value = props.snapshot?.generatedAt
  if (!value) {
    return t(textKeys.nsarmoireCharacterGeneratedAtEmpty)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(current.value, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
})

const retainerCount = computed(() => {
  const retainerIds = new Set<string>()

  for (const item of props.snapshot?.items ?? []) {
    if (item.container === 'retainer' && item.retainerId) {
      retainerIds.add(item.retainerId)
    }
  }

  return retainerIds.size
})
</script>

<style scoped>
.nsarmoire-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsarmoire-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-panel h2,
.nsarmoire-character-panel h3 {
  margin: 0;
  font-family: var(--ns-font-sans);
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-panel h2 {
  font-size: 16px;
}

.nsarmoire-character-panel__block {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-character-panel h3 {
  font-size: 14px;
}

.nsarmoire-character-panel__rows {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.nsarmoire-character-panel__rows div {
  display: grid;
  min-width: 0;
  gap: 5px;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-character-panel__rows dt,
.nsarmoire-character-panel__rows dd {
  min-width: 0;
  margin: 0;
}

.nsarmoire-character-panel__rows dt {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-character-panel__rows dd {
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .nsarmoire-character-panel__rows {
    grid-template-columns: 1fr;
  }
}
</style>
