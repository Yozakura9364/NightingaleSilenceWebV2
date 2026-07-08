<template>
  <section class="nsarmoire-panel nsarmoire-character-panel">
    <div class="nsarmoire-panel__header">
      <h2 class="ns-heading-bloom">{{ cleanT(textKeys.nsarmoireCharacterProfile) }}</h2>
    </div>

    <AppStatus
      v-if="!snapshot"
      tone="info"
      :title="cleanT(textKeys.nsarmoireSnapshotEmpty)"
      :message="cleanT(textKeys.nsarmoireCharacterNoSnapshot)"
    />

    <template v-if="snapshot">
      <section class="nsarmoire-character-panel__block">
        <h3>{{ cleanT(textKeys.nsarmoireDyePreferenceLabel) }}</h3>

        <fieldset class="nsarmoire-character-panel__dye-fieldset">
          <legend>{{ cleanT(textKeys.nsarmoireDyePreferenceStoreSpecial) }}</legend>
          <label v-for="dye in storeSpecialDyeOptions" :key="dye.dyeId">
            <input
              type="checkbox"
              :checked="isValuableDyeIdSelected(dye.dyeId)"
              @change="$emit('toggle-valuable-dye-id', dye.dyeId)"
            />
            <span
              v-if="dye.color"
              class="nsarmoire-character-panel__dye-swatch"
              :style="{ backgroundColor: dye.color }"
              aria-hidden="true"
            />
            <span>{{ dye.name }}</span>
          </label>
        </fieldset>

        <fieldset class="nsarmoire-character-panel__dye-fieldset">
          <legend>{{ cleanT(textKeys.nsarmoireDyePreferenceCategories) }}</legend>
          <label v-for="option in dyeValueCategoryOptions" :key="option.value">
            <input
              type="checkbox"
              :checked="isDyeValueCategorySelected(option.value)"
              @change="$emit('toggle-dye-value-category', option.value)"
            />
            <span>{{ cleanT(option.labelKey) }}</span>
          </label>
        </fieldset>
      </section>

      <section class="nsarmoire-character-panel__block">
        <div class="nsarmoire-character-panel__block-heading">
          <h3>{{ cleanT(textKeys.nsarmoireRecommendationIgnoredItems) }}</h3>
          <AppButton
            v-if="ignoredItemViews.length"
            size="compact"
            variant="secondary"
            @click="$emit('clear-ignored-items')"
          >
            {{ cleanT(textKeys.nsarmoireActionClearIgnoredItems) }}
          </AppButton>
        </div>

        <AppStatus
          v-if="ignoredItemStorageError"
          tone="warning"
          compact
          :message="ignoredItemStorageError"
        />
        <p v-if="!ignoredItemViews.length" class="nsarmoire-character-panel__hint">
          {{ cleanT(textKeys.nsarmoireIgnoredItemsEmpty) }}
        </p>
        <ul v-else class="nsarmoire-character-panel__ignored-list">
          <li v-for="item in ignoredItemViews" :key="item.key">
            <span class="nsarmoire-character-panel__ignored-icon" aria-hidden="true">
              <img
                v-if="item.iconUrl"
                :src="item.iconUrl"
                alt=""
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
              />
            </span>
            <span class="nsarmoire-character-panel__ignored-name">{{ item.name }}</span>
            <AppButton
              size="compact"
              variant="secondary"
              @click="$emit('unignore-item', item.itemId)"
            >
              {{ cleanT(textKeys.nsarmoireActionUnignoreCleanupItem) }}
            </AppButton>
          </li>
        </ul>
      </section>

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

        <div class="nsarmoire-character-panel__block-actions">
          <AppButton size="compact" variant="secondary" @click="$emit('clear-current-profile')">
            {{ cleanT(textKeys.nsarmoireCharacterLocalProfileClearCurrent) }}
          </AppButton>
        </div>
      </section>
    </template>

    <section class="nsarmoire-character-panel__block">
      <div class="nsarmoire-character-panel__block-heading">
        <h3>{{ cleanT(textKeys.nsarmoireCharacterLocalProfileTitle) }}</h3>
        <div class="nsarmoire-character-panel__heading-actions">
          <label
            class="ns-button ns-button--secondary ns-button--compact nsarmoire-character-panel__import-button"
          >
            <span>{{ cleanT(textKeys.nsarmoireImportSnapshot) }}</span>
            <input
              ref="fileInput"
              type="file"
              accept="application/json,.json"
              :aria-label="cleanT(textKeys.nsarmoireSnapshotInput)"
              @change="handleFileChange"
            />
          </label>
          <span class="nsarmoire-character-panel__profile-count">{{ localProfileCountLabel }}</span>
        </div>
      </div>
      <p class="nsarmoire-character-panel__hint">
        {{ cleanT(textKeys.nsarmoireCharacterLocalProfileMessage) }}
      </p>

      <AppStatus
        v-if="profileActionStatusKey"
        tone="success"
        compact
        :message="cleanT(profileActionStatusKey)"
      />

      <AppStatus
        v-if="profileStorageStatus === 'loading' && !profiles.length"
        tone="loading"
        compact
        :message="cleanT(textKeys.nsarmoireCharacterLocalProfileLoading)"
      />
      <AppStatus
        v-else-if="profileStorageStatus === 'error'"
        tone="danger"
        compact
        :title="cleanT(textKeys.nsarmoireCharacterLocalProfileError)"
        :message="localProfileErrorMessage"
      />

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
              <dt>{{ cleanT(textKeys.nsarmoireCharacterLocalProfileCachedAt) }}</dt>
              <dd>{{ formatDateLabel(profile.cachedAt) }}</dd>
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

          <div class="nsarmoire-character-panel__profile-actions">
            <AppButton
              size="compact"
              :disabled="profile.key === activeProfileKey || isProfileActionBusy(profile.key)"
              @click="$emit('switch-profile', profile.key)"
            >
              {{
                profile.key === activeProfileKey
                  ? cleanT(textKeys.nsarmoireCharacterLocalProfileCurrent)
                  : getSwitchProfileLabel(profile.key)
              }}
            </AppButton>
            <AppButton
              size="compact"
              variant="danger"
              :disabled="isProfileActionBusy(profile.key)"
              @click="$emit('delete-profile', profile.key)"
            >
              {{ getDeleteProfileLabel(profile.key) }}
            </AppButton>
          </div>
        </li>
      </ul>

      <AppStatus
        v-else-if="profileStorageStatus !== 'loading'"
        tone="info"
        :message="cleanT(textKeys.nsarmoireCharacterLocalProfilesEmpty)"
      />
    </section>

    <section v-if="snapshot" class="nsarmoire-character-panel__block">
      <h3>{{ cleanT(textKeys.nsarmoireCharacterStaticData) }}</h3>

      <NSArmoireCatalogStatus
        :catalog="catalog"
        :status="catalogStatus"
        :error="catalogError"
        @reload="$emit('reload-catalog')"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireDyeValueCategory,
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireSnapshot,
  ArmoireSnapshotSource
} from '@/lib/armoire/types'
import { ARMOIRE_STORE_SPECIAL_DYE_IDS } from '@/lib/armoire/types'
import NSArmoireCatalogStatus from '@/pages/armoire/components/NSArmoireCatalogStatus.vue'
import {
  getReadContainers,
  type ArmoireCharacterProfile,
  type ArmoireCharacterProfileStorageStatus
} from '@/pages/armoire/composables/useArmoireCharacterProfiles'
import type { ArmoireCatalogStatus } from '@/pages/armoire/composables/useArmoireCatalog'
import type { ArmoireHelperHealth } from '@/pages/armoire/services/nsarmoireHelperApi'
import type { ArmoireReadableItemView } from '@/pages/armoire/utils/insightDisplay'
import { formatArmoireText } from '@/pages/armoire/utils/itemDisplay'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  snapshot: ArmoireSnapshot | null
  profiles: readonly ArmoireCharacterProfile[]
  activeProfileKey: string | null
  profileActionStatusKey: string | null
  profileStorageStatus: ArmoireCharacterProfileStorageStatus
  profileStorageError: string | null
  switchingProfileKey: string | null
  deletingProfileKey: string | null
  helperEndpoint: string
  helperHealth: ArmoireHelperHealth | null
  catalog: ArmoireCatalog
  catalogStatus: ArmoireCatalogStatus
  catalogError: string | null
  selectedDyeValueCategories: readonly ArmoireDyeValueCategory[]
  selectedValuableDyeIds: readonly number[]
  ignoredItemViews: ArmoireReadableItemView[]
  ignoredItemStorageError: string | null
}>()

const emit = defineEmits<{
  'import-file': [file: File]
  'reload-catalog': []
  'toggle-dye-value-category': [category: ArmoireDyeValueCategory]
  'toggle-valuable-dye-id': [dyeId: number]
  'unignore-item': [itemId: number]
  'clear-ignored-items': []
  'switch-profile': [profileKey: string]
  'delete-profile': [profileKey: string]
  'clear-current-profile': []
}>()

const { current, t } = useLocale()
const fileInput = ref<HTMLInputElement | null>(null)

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

const dyeValueCategoryOptions: Array<{ value: ArmoireDyeValueCategory; labelKey: string }> = [
  { value: 'general', labelKey: textKeys.nsarmoireDyeCategoryGeneral },
  { value: 'extra1', labelKey: textKeys.nsarmoireDyeCategoryExtra1 },
  { value: 'extra2', labelKey: textKeys.nsarmoireDyeCategoryExtra2 }
]

function cleanText(value: string): string {
  return value
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
const localProfileCountLabel = computed(() =>
  cleanText(
    formatArmoireText(t, textKeys.nsarmoireCharacterLocalProfileCount, {
      count: props.profiles.length
    })
  )
)
const localProfileErrorMessage = computed(() => {
  const message = cleanT(textKeys.nsarmoireCharacterLocalProfileUnavailable)

  if (!props.profileStorageError) {
    return message
  }

  return `${message} ${props.profileStorageError}`
})

const storeSpecialDyeOptions = computed(() =>
  ARMOIRE_STORE_SPECIAL_DYE_IDS.map((dyeId) => ({
    dyeId,
    name: props.catalog.dyes[dyeId]?.name ?? String(dyeId),
    color: props.catalog.dyes[dyeId]?.color
  }))
)

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

function isDyeValueCategorySelected(category: ArmoireDyeValueCategory): boolean {
  return props.selectedDyeValueCategories.includes(category)
}

function isValuableDyeIdSelected(dyeId: number): boolean {
  return props.selectedValuableDyeIds.includes(dyeId)
}

function isProfileActionBusy(profileKey: string): boolean {
  return props.switchingProfileKey === profileKey || props.deletingProfileKey === profileKey
}

function getSwitchProfileLabel(profileKey: string): string {
  return props.switchingProfileKey === profileKey
    ? cleanT(textKeys.nsarmoireCharacterLocalProfileSwitching)
    : cleanT(textKeys.nsarmoireCharacterLocalProfileSwitch)
}

function getDeleteProfileLabel(profileKey: string): string {
  return props.deletingProfileKey === profileKey
    ? cleanT(textKeys.nsarmoireCharacterLocalProfileDeleting)
    : cleanT(textKeys.nsarmoireCharacterLocalProfileDelete)
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

function handleFileChange(event: Event) {
  const input = event.target

  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
    return
  }

  emit('import-file', input.files[0])

  if (fileInput.value) {
    fileInput.value.value = ''
  }
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

.nsarmoire-character-panel__block-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.nsarmoire-character-panel__heading-actions {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.nsarmoire-character-panel__import-button {
  position: relative;
  overflow: hidden;
  min-width: 0;
  white-space: nowrap;
}

.nsarmoire-character-panel__import-button:focus-within {
  box-shadow: var(--ns-pixel-button-shadow-hover), var(--ns-focus-ring);
}

.nsarmoire-character-panel__import-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.nsarmoire-character-panel__profile-count {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 850;
}

.nsarmoire-character-panel__block-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
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
  background: var(--ns-color-surface);
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

.nsarmoire-character-panel__profile-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.nsarmoire-character-panel__ignored-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-character-panel__ignored-list li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-character-panel__ignored-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-character-panel__ignored-icon img {
  display: block;
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.nsarmoire-character-panel__ignored-name {
  min-width: 0;
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-character-panel__dye-fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.nsarmoire-character-panel__dye-fieldset legend {
  width: 100%;
  margin: 0 0 2px;
  padding: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 850;
}

.nsarmoire-character-panel__dye-fieldset label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 3px 7px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.nsarmoire-character-panel__dye-fieldset input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: var(--ns-color-accent);
}

.nsarmoire-character-panel__dye-swatch {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  border: 1px solid var(--ns-color-border-strong);
  box-shadow: var(--ns-control-inset-shadow);
}

@media (max-width: 720px) {
  .nsarmoire-character-panel__rows,
  .nsarmoire-character-panel__profile-meta {
    grid-template-columns: 1fr;
  }
}
</style>
