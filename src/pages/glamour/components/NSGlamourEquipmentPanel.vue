<template>
  <section class="nsglamour-equipment">
    <header class="nsglamour-equipment__header">
      <div>
        <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourEquipmentPanel) }}</h2>
        <p v-if="sourceDisplayName" class="nsglamour-equipment__source">
          <strong>{{ sourceDisplayName }}</strong>
          <span v-if="sourceMetaText">{{ sourceMetaText }}</span>
        </p>
      </div>

      <div class="nsglamour-equipment__actions">
        <div ref="localeControl" class="nsglamour-snapshot__language-control">
          <button
            type="button"
            class="nsglamour-snapshot__tool-button"
            :aria-label="localeButtonLabel"
            :title="localeButtonLabel"
            aria-haspopup="menu"
            :aria-expanded="localeMenuOpen"
            @click.stop="localeMenuOpen = !localeMenuOpen"
          >
            <img :src="languagesIcon" alt="" aria-hidden="true" />
          </button>
          <div
            v-if="localeMenuOpen"
            class="nsglamour-snapshot__language-menu"
            role="menu"
            :aria-label="t(textKeys.nsglamourEquipmentLanguage)"
          >
            <button
              v-for="option in localeOptions"
              :key="option.value"
              type="button"
              role="menuitemradio"
              :class="{ active: option.value === draft.locale }"
              :aria-checked="option.value === draft.locale"
              @click="selectLocale(option.value)"
            >
              {{ option.accessibleLabel }}
            </button>
          </div>
        </div>

        <AppButton
          size="compact"
          variant="ghost"
          :disabled="!hasEquipment"
          @click="emit('clear-draft')"
        >
          {{ t(textKeys.nsglamourClearDraft) }}
        </AppButton>

        <AppButton
          size="compact"
          :disabled="!hasEquipment || snapshotCreating"
          @click="createSnapshot"
        >
          {{ snapshotActionLabel }}
        </AppButton>

        <AppButton size="compact" :disabled="!hasEquipment" @click="saveConfig">
          {{ t(textKeys.nsglamourSaveConfig) }}
        </AppButton>
      </div>
    </header>

    <section v-if="draft.warnings.length" class="nsglamour-equipment__warnings">
      <strong>{{ t(textKeys.nsglamourWarnings) }}</strong>
      <ul>
        <li v-for="warning in draft.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </section>

    <div
      v-if="!isMobileLayout"
      class="nsglamour-equipment__grid nsglamour-equipment__grid--desktop"
    >
      <div
        v-for="(column, columnIndex) in entryColumns"
        :key="columnIndex"
        class="nsglamour-equipment__column"
      >
        <NSGlamourEquipmentSlot
          v-for="entry in column"
          :key="entry.slot"
          :entry="entry"
          :editor="editor"
        />
      </div>
    </div>

    <div v-else class="nsglamour-equipment__grid nsglamour-equipment__grid--mobile">
      <NSGlamourEquipmentSlot
        v-for="entry in mobileEntries"
        :key="entry.slot"
        :entry="entry"
        :editor="editor"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import languagesIcon from '@/assets/icons/pixelarticons/languages.svg'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import {
  buildGlamourIconUrl,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getEquipmentDyeSummary,
  getSelectedCandidate,
  getSlotTitle
} from '@/lib/glamour/equipment'
import { normalizeGlamourConfigName } from '@/lib/glamour/recent'
import {
  findGlamourRecentSnapshotLink,
  recordGlamourRecentSnapshotLink
} from '@/services/glamour/glamourRecentStorage'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeSummary,
  GlamourStain
} from '@/lib/glamour/types'
import NSGlamourEquipmentSlot from '@/pages/glamour/components/NSGlamourEquipmentSlot.vue'
import { useGlamourEquipInfoEditor } from '@/pages/glamour/composables/useGlamourEquipInfoEditor'
import {
  createGlamourSnapshotKey,
  useNSGlamourSnapshotApi
} from '@/services/glamour/nsglamourSnapshots'
import { createGlamourSnapshotUrl } from '@/lib/glamour/snapshotLinks'
import type {
  GlamourEquipmentSearch,
  GlamourStainLoader
} from '@/pages/glamour/types/equipmentEditor'
import type { GlamourEquipmentEntryView } from '@/pages/glamour/types/equipmentPanel'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/stores/locale'

const EQUIPINFO_LEFT_COLUMN_SLOTS = [
  'MainHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Glasses'
]

const EQUIPINFO_RIGHT_COLUMN_SLOTS = [
  'OffHand',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'FashionAccessory'
]

const EQUIPINFO_MOBILE_SLOTS = [
  'MainHand',
  'OffHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'Glasses',
  'FashionAccessory'
]

const props = defineProps<{
  draft: GlamourDraft
  apiBase: string
  searchItems: GlamourEquipmentSearch
  loadStains: GlamourStainLoader
}>()

const emit = defineEmits<{
  'update-locale': [locale: string]
  'replace-entry': [slot: string, candidate: GlamourCandidate]
  'clear-entry': [slot: string]
  'select-entry-candidate': [slot: string, candidateKey: string | number | undefined]
  'set-entry-dye': [slot: string, dyeIndex: number, stain: GlamourStain]
  'save-config': [name: string]
  'clear-draft': []
}>()

const { t } = useLocale()
const dialog = useDialog()
const snapshotApi = useNSGlamourSnapshotApi()
const equipmentLayoutQuery = window.matchMedia('(max-width: 1080px)')
const isMobileLayout = ref(equipmentLayoutQuery.matches)
const snapshotCreating = ref(false)
const snapshotCopied = ref(false)
const localeMenuOpen = ref(false)
const localeControl = ref<HTMLElement | null>(null)
const editor = useGlamourEquipInfoEditor({
  apiBase: computed(() => props.apiBase),
  draft: computed(() => props.draft),
  editorLocale: computed(() => props.draft.locale),
  t,
  searchItems: props.searchItems,
  loadStains: props.loadStains,
  replaceEntry: (slot, candidate) => emit('replace-entry', slot, candidate),
  clearEntry: (slot) => emit('clear-entry', slot),
  selectEntryCandidate: (slot, candidateKey) => emit('select-entry-candidate', slot, candidateKey),
  setEntryDye: (slot, dyeIndex, stain) => emit('set-entry-dye', slot, dyeIndex, stain)
})

const localeLabelKeys: Record<string, string> = {
  zh: textKeys.nsglamourLocaleZh,
  en: textKeys.nsglamourLocaleEn,
  ja: textKeys.nsglamourLocaleJa,
  ko: textKeys.nsglamourLocaleKo,
  tc: textKeys.nsglamourLocaleTc,
  fr: textKeys.nsglamourLocaleFr,
  de: textKeys.nsglamourLocaleDe
}

const LOCALE_ORDER = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']
const localeOptions = computed(() =>
  [...props.draft.locales]
    .sort((left, right) => {
      const leftIndex = LOCALE_ORDER.indexOf(left)
      const rightIndex = LOCALE_ORDER.indexOf(right)
      return (
        (leftIndex < 0 ? LOCALE_ORDER.length : leftIndex) -
        (rightIndex < 0 ? LOCALE_ORDER.length : rightIndex)
      )
    })
    .map((locale) => ({
      value: locale,
      label: t(localeLabelKeys[locale] ?? '') || props.draft.localeLabels[locale] || locale,
      accessibleLabel:
        t(localeLabelKeys[locale] ?? '') || props.draft.localeLabels[locale] || locale
    }))
)

const localeButtonLabel = computed(() => {
  const option = localeOptions.value.find((item) => item.value === props.draft.locale)
  return `${t(textKeys.nsglamourEquipmentLanguage)}: ${option?.accessibleLabel || props.draft.locale}`
})

const entryViews = computed<GlamourEquipmentEntryView[]>(() =>
  props.draft.entries.map((entry) => {
    const candidate = getSelectedCandidate(entry)
    const dyeSummary = getEquipmentDyeSummary(entry, props.draft.locale, props.draft.noDyeLabels)
    const dyeEntries =
      candidate && getCandidateDyeCount(candidate, entry.slot) > 0
        ? getDisplayDyeEntries(candidate, entry.slot, props.draft.noDyeLabels, props.draft.locale)
        : []

    return {
      slot: entry.slot,
      slotName: getSlotTitle(entry, props.draft.locale, {
        slot_names: props.draft.slotNames,
        default_locale: props.draft.source.locale
      }),
      itemName: getCandidateName(candidate, props.draft.locale, props.draft.source.locale),
      iconUrl: buildGlamourIconUrl(props.apiBase, candidate?.icon),
      dyeStatusText: formatDyeSummary(dyeSummary),
      dyeEntries,
      candidates: Array.isArray(entry.candidates) ? entry.candidates : [],
      hasCandidateOptions: Array.isArray(entry.candidates) && entry.candidates.length > 1
    }
  })
)

const entryColumns = computed<GlamourEquipmentEntryView[][]>(() => {
  const entriesBySlot = new Map(entryViews.value.map((entry) => [entry.slot, entry]))

  return [
    EQUIPINFO_LEFT_COLUMN_SLOTS.map((slot) => entriesBySlot.get(slot)).filter(isEntryView),
    EQUIPINFO_RIGHT_COLUMN_SLOTS.map((slot) => entriesBySlot.get(slot)).filter(isEntryView)
  ]
})

const mobileEntries = computed<GlamourEquipmentEntryView[]>(() => {
  const entriesBySlot = new Map(entryViews.value.map((entry) => [entry.slot, entry]))

  return EQUIPINFO_MOBILE_SLOTS.map((slot) => entriesBySlot.get(slot)).filter(isEntryView)
})

const sourceDisplayName = computed(() => props.draft.source.name || props.draft.source.title || '')
const sourceMetaText = computed(() => {
  const title = props.draft.source.title
  return title && title !== sourceDisplayName.value ? title : ''
})
const hasEquipment = computed(() => entryViews.value.some((entry) => Boolean(entry.itemName)))
const snapshotActionLabel = computed(() => {
  if (snapshotCreating.value) {
    return t(textKeys.nsglamourSnapshotCreating)
  }
  return snapshotCopied.value
    ? t(textKeys.nsglamourSnapshotCopied)
    : t(textKeys.nsglamourCreateSnapshot)
})

onMounted(() => {
  equipmentLayoutQuery.addEventListener('change', updateEquipmentLayout)
  document.addEventListener('click', closeLocaleMenu)
  document.addEventListener('keydown', handleLocaleKeydown)
})

onBeforeUnmount(() => {
  equipmentLayoutQuery.removeEventListener('change', updateEquipmentLayout)
  document.removeEventListener('click', closeLocaleMenu)
  document.removeEventListener('keydown', handleLocaleKeydown)
})

function selectLocale(locale: string): void {
  emit('update-locale', locale)
  localeMenuOpen.value = false
  localeControl.value?.querySelector<HTMLButtonElement>('.nsglamour-snapshot__tool-button')?.focus()
}

function closeLocaleMenu(event: MouseEvent): void {
  if (!localeControl.value?.contains(event.target as Node)) {
    localeMenuOpen.value = false
  }
}

function handleLocaleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    localeMenuOpen.value = false
  }
}

function updateEquipmentLayout(event: MediaQueryListEvent): void {
  isMobileLayout.value = event.matches
}

function isEntryView(
  entry: GlamourEquipmentEntryView | undefined
): entry is GlamourEquipmentEntryView {
  return Boolean(entry)
}

function formatDyeSummary(summary: GlamourDyeSummary): string {
  if (summary.kind === 'empty' || summary.kind === 'ignored') {
    return ''
  }
  if (summary.kind === 'undyeable') {
    return summary.text || t(textKeys.nsglamourEquipmentUndyeable)
  }
  return summary.text
}

async function saveConfig(): Promise<void> {
  const name = await dialog.prompt(
    t(textKeys.nsglamourConfigNamePrompt),
    normalizeGlamourConfigName(sourceDisplayName.value || t(textKeys.nsglamourRecentUnnamed))
  )

  if (name !== null) {
    emit('save-config', normalizeGlamourConfigName(name))
  }
}

async function createSnapshot(): Promise<void> {
  if (!hasEquipment.value || snapshotCreating.value) {
    return
  }

  const snapshotWindow = window.open('about:blank', '_blank')
  if (snapshotWindow) {
    snapshotWindow.opener = null
  }
  snapshotCreating.value = true
  snapshotCopied.value = false

  try {
    const snapshotKey = await createGlamourSnapshotKey(props.draft)
    const cachedSnapshot = findGlamourRecentSnapshotLink(snapshotKey)
    let snapshotId = cachedSnapshot?.snapshotId || ''

    if (!snapshotId) {
      const response = await snapshotApi.createSnapshot(props.draft)
      snapshotId = response.id
    }

    const shareUrl = createGlamourSnapshotUrl(snapshotId, props.draft.locale)
    saveSnapshotConfig(snapshotId, shareUrl, snapshotKey)
    if (snapshotWindow && !snapshotWindow.closed) {
      snapshotWindow.location.replace(shareUrl)
    }
    const copied = await copySnapshotUrl(shareUrl)
    if (!copied) {
      await dialog.prompt(
        t(textKeys.nsglamourSnapshotManualCopy),
        shareUrl,
        t(textKeys.nsglamourEquipmentPanel)
      )
      return
    }

    snapshotCopied.value = true
  } catch {
    if (snapshotWindow && !snapshotWindow.closed) {
      snapshotWindow.close()
    }
    await dialog.alert(
      t(textKeys.nsglamourSnapshotCreateError),
      t(textKeys.nsglamourEquipmentPanel)
    )
  } finally {
    snapshotCreating.value = false
  }
}

function saveSnapshotConfig(snapshotId: string, snapshotUrl: string, snapshotKey: string): void {
  const name = normalizeGlamourConfigName(
    sourceDisplayName.value || t(textKeys.nsglamourRecentUnnamed)
  )
  emit('save-config', name)
  recordGlamourRecentSnapshotLink(name, { snapshotId, snapshotUrl, snapshotKey })
}

async function copySnapshotUrl(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall through to the synchronous browser copy command.
    }
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    input.remove()
  }
}
</script>

<style scoped src="../styles/equipment-panel.css"></style>
