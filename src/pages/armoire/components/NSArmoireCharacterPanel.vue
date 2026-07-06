<template>
  <section class="nsarmoire-panel nsarmoire-character-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ cleanT(textKeys.nsarmoireCharacterProfile) }}</h2>
    </div>

    <AppStatus
      v-if="!snapshot"
      tone="info"
      :title="cleanT(textKeys.nsarmoireSnapshotEmpty)"
      :message="cleanT(textKeys.nsarmoireCharacterNoSnapshot)"
    />

    <template v-else>
      <section class="nsarmoire-character-panel__block">
        <h3>{{ cleanT(textKeys.nsarmoireCharacterCurrentData) }}</h3>

        <dl class="nsarmoire-character-panel__rows">
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireCharacter) }}</dt>
            <dd>{{ characterName }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireCharacterWorld) }}</dt>
            <dd>{{ characterWorld }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireCharacterProfileKey) }}</dt>
            <dd>{{ profileKey }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireSource) }}</dt>
            <dd>{{ sourceLabel }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireGeneratedAt) }}</dt>
            <dd>{{ generatedAtLabel }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireMetricEntries) }}</dt>
            <dd>{{ snapshot.items.length }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireReadContainers) }}</dt>
            <dd :title="currentReadContainersLabel">{{ currentReadContainersLabel }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireCharacterRetainers) }}</dt>
            <dd>{{ currentRetainerCount }}</dd>
          </div>
          <div>
            <dt>{{ cleanT(textKeys.nsarmoireHelperEndpoint) }}</dt>
            <dd>{{ helperEndpoint }}</dd>
          </div>
        </dl>
      </section>

      <section class="nsarmoire-character-panel__block">
        <h3>{{ cleanT(textKeys.nsarmoireCharacterLocalProfileTitle) }}</h3>
        <p class="nsarmoire-character-panel__hint">
          {{ cleanT(textKeys.nsarmoireCharacterLocalProfileMessage) }}
        </p>

        <ul v-if="profiles.length" class="nsarmoire-character-panel__profile-list">
          <li
            v-for="profile in profiles"
            :key="profile.key"
            class="nsarmoire-character-panel__profile"
            :class="{
              'nsarmoire-character-panel__profile--active': profile.key === activeProfileKey
            }"
          >
            <div class="nsarmoire-character-panel__profile-title">
              <strong>{{ getProfileTitle(profile) }}</strong>
              <span
                v-if="profile.key === activeProfileKey"
                class="nsarmoire-character-panel__profile-badge"
              >
                {{ cleanT(textKeys.nsarmoireCharacterLocalProfileCurrent) }}
              </span>
            </div>

            <dl class="nsarmoire-character-panel__profile-meta">
              <div>
                <dt>{{ cleanT(textKeys.nsarmoireGeneratedAt) }}</dt>
                <dd>{{ formatDateLabel(profile.lastDataAt) }}</dd>
              </div>
              <div>
                <dt>{{ cleanT(textKeys.nsarmoireReadContainers) }}</dt>
                <dd :title="getProfileReadContainersLabel(profile)">
                  {{ getProfileReadContainersLabel(profile) }}
                </dd>
              </div>
              <div>
                <dt>{{ cleanT(textKeys.nsarmoireMetricEntries) }}</dt>
                <dd>{{ profile.entryCount }}</dd>
              </div>
              <div>
                <dt>{{ cleanT(textKeys.nsarmoireSource) }}</dt>
                <dd>{{ getSourceLabel(profile.source) }}</dd>
              </div>
            </dl>
          </li>
        </ul>

        <AppStatus
          v-else
          tone="info"
          :message="cleanT(textKeys.nsarmoireCharacterLocalProfilesEmpty)"
        />
      </section>

      <section class="nsarmoire-character-panel__block">
        <h3>{{ cleanT(textKeys.nsarmoireCharacterStaticData) }}</h3>

        <NSArmoireCatalogStatus
          :catalog="catalog"
          :status="catalogStatus"
          :error="catalogError"
          @reload="$emit('reload-catalog')"
        />
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireSnapshot,
  ArmoireSnapshotSource
} from '@/lib/armoire/types'
import NSArmoireCatalogStatus from '@/pages/armoire/components/NSArmoireCatalogStatus.vue'
import {
  getReadContainers,
  type ArmoireCharacterProfile
} from '@/pages/armoire/composables/useArmoireCharacterProfiles'
import type { ArmoireCatalogStatus } from '@/pages/armoire/composables/useArmoireCatalog'
import type { ArmoireHelperHealth } from '@/pages/armoire/services/nsarmoireHelperApi'
import { formatArmoireText } from '@/pages/armoire/utils/itemDisplay'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  snapshot: ArmoireSnapshot | null
  profiles: readonly ArmoireCharacterProfile[]
  activeProfileKey: string | null
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
const DRAFT_SUFFIX_PATTERN = /（占位用，待编辑）/g

const sourceLabelKeys: Record<ArmoireSnapshotSource, string> = {
  'manual-import': textKeys.nsarmoireSourceManualImport,
  'local-helper': textKeys.nsarmoireSourceLocalHelper,
  'asvel-compatible': textKeys.nsarmoireSourceAsvelCompatible
}

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}

function cleanText(value: string): string {
  return value.replace(DRAFT_SUFFIX_PATTERN, '')
}

function cleanT(key: string): string {
  return cleanText(t(key))
}

const characterName = computed(
  () => props.snapshot?.character?.name || cleanT(textKeys.nsarmoireCharacterUnknown)
)

const characterWorld = computed(
  () => props.snapshot?.character?.world || cleanT(textKeys.nsarmoireCharacterWorldUnknown)
)

const profileKey = computed(() => {
  const character = props.snapshot?.character
  if (!character?.name || !character.world) {
    return cleanT(textKeys.nsarmoireCharacterProfileKeyMissing)
  }

  return `${character.name}@${character.world}`
})

const sourceLabel = computed(() => {
  const source = props.snapshot?.source
  return source ? getSourceLabel(source) : cleanT(textKeys.nsarmoireCharacterGeneratedAtEmpty)
})

const generatedAtLabel = computed(() => formatDateLabel(props.snapshot?.generatedAt))

const currentRetainerSummary = computed(() => getRetainerSummary(props.snapshot))
const currentRetainerCount = computed(() => currentRetainerSummary.value.retainerCount)
const currentReadContainersLabel = computed(() => {
  if (!props.snapshot) {
    return cleanT(textKeys.nsarmoireCharacterGeneratedAtEmpty)
  }

  return formatReadContainers(
    getReadContainers(props.snapshot),
    currentRetainerSummary.value.retainerNames,
    currentRetainerSummary.value.retainerCount
  )
})

function formatDateLabel(value: string | undefined): string {
  if (!value) {
    return cleanT(textKeys.nsarmoireCharacterGeneratedAtEmpty)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(current.value, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function getSourceLabel(source: ArmoireSnapshotSource): string {
  return cleanT(sourceLabelKeys[source])
}

function getRetainerSummary(snapshot: ArmoireSnapshot | null): {
  retainerNames: string[]
  retainerCount: number
} {
  const retainerKeys = new Set<string>()
  const retainerNames: string[] = []

  for (const item of snapshot?.items ?? []) {
    if (item.container !== 'retainer') {
      continue
    }

    const retainerKey =
      item.retainerId?.trim() ||
      item.retainerName?.trim() ||
      item.containerName?.trim() ||
      'unknown'
    const retainerName = item.retainerName?.trim() || item.containerName?.trim()

    retainerKeys.add(retainerKey)

    if (retainerName && !retainerNames.includes(retainerName)) {
      retainerNames.push(retainerName)
    }
  }

  return {
    retainerNames,
    retainerCount: retainerKeys.size
  }
}

function formatReadContainers(
  containers: readonly ArmoireContainerKind[],
  retainerNames: readonly string[],
  retainerCount: number
): string {
  const labels = containers
    .filter((container) => container !== 'retainer')
    .map((container) => cleanT(containerLabelKeys[container]))
  const readableRetainers =
    retainerNames.length > 0
      ? retainerNames
      : retainerCount > 0
        ? [
            cleanText(
              formatArmoireText(t, textKeys.nsarmoireCharacterRetainerFallback, {
                count: retainerCount
              })
            )
          ]
        : []

  return (
    [...labels, ...readableRetainers].join(' / ') ||
    cleanT(textKeys.nsarmoireCharacterGeneratedAtEmpty)
  )
}

function getProfileReadContainersLabel(profile: ArmoireCharacterProfile): string {
  return formatReadContainers(profile.containers, profile.retainerNames, profile.retainerCount)
}

function getProfileTitle(profile: ArmoireCharacterProfile): string {
  const baseTitle = [profile.name || cleanT(textKeys.nsarmoireCharacterUnknown), profile.world]
    .filter(Boolean)
    .join(' @ ')

  if (profile.name || profile.world) {
    return baseTitle
  }

  const suffix = profile.key.startsWith('unidentified:') ? `#${profile.key.split(':')[1]}` : ''
  return [baseTitle, suffix].filter(Boolean).join(' ')
}
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

.nsarmoire-character-panel__hint {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.nsarmoire-character-panel__rows,
.nsarmoire-character-panel__profile-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.nsarmoire-character-panel__rows div,
.nsarmoire-character-panel__profile-meta div {
  display: grid;
  min-width: 0;
  gap: 5px;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-character-panel__rows dt,
.nsarmoire-character-panel__rows dd,
.nsarmoire-character-panel__profile-meta dt,
.nsarmoire-character-panel__profile-meta dd {
  min-width: 0;
  margin: 0;
}

.nsarmoire-character-panel__rows dt,
.nsarmoire-character-panel__profile-meta dt {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-character-panel__rows dd,
.nsarmoire-character-panel__profile-meta dd {
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-character-panel__profile-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-character-panel__profile {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: #ffffff;
}

.nsarmoire-character-panel__profile--active {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-cyan-surface);
}

.nsarmoire-character-panel__profile-title {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.nsarmoire-character-panel__profile-title strong {
  min-width: 0;
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 14px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-character-panel__profile-badge {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
  font-size: 12px;
  font-weight: 850;
}

@media (max-width: 720px) {
  .nsarmoire-character-panel__rows,
  .nsarmoire-character-panel__profile-meta {
    grid-template-columns: 1fr;
  }
}
</style>
