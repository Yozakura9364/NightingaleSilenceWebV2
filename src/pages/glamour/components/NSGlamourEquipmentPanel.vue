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
        <select
          id="nsglamour-equipment-locale"
          class="nsglamour-equipment__locale"
          :aria-label="t(textKeys.nsglamourEquipmentLanguage)"
          :value="draft.locale"
          @change="emitLocale"
        >
          <option v-for="option in localeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

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
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeSummary,
  GlamourStain
} from '@/lib/glamour/types'
import NSGlamourEquipmentSlot from '@/pages/glamour/components/NSGlamourEquipmentSlot.vue'
import { useGlamourEquipInfoEditor } from '@/pages/glamour/composables/useGlamourEquipInfoEditor'
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
}>()

const { t } = useLocale()
const dialog = useDialog()
const equipmentLayoutQuery = window.matchMedia('(max-width: 1080px)')
const isMobileLayout = ref(equipmentLayoutQuery.matches)
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

const localeOptions = computed(() =>
  props.draft.locales.map((locale) => ({
    value: locale,
    label: t(localeLabelKeys[locale] ?? '') || props.draft.localeLabels[locale] || locale
  }))
)

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

onMounted(() => {
  equipmentLayoutQuery.addEventListener('change', updateEquipmentLayout)
})

onBeforeUnmount(() => {
  equipmentLayoutQuery.removeEventListener('change', updateEquipmentLayout)
})

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

function emitLocale(event: Event): void {
  emit('update-locale', (event.currentTarget as HTMLSelectElement).value)
}
</script>

<style scoped src="../styles/equipment-panel.css"></style>
