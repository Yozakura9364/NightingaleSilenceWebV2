<template>
  <div class="item-card-workspace">
    <div class="item-card-workspace__body">
      <aside class="item-card-workspace__sidebar">
        <div class="item-card-workspace__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'equipment'"
            :class="{ active: activeTab === 'equipment' }"
            @click="activeTab = 'equipment'"
          >
            {{ t(textKeys.nsglamourEquipmentPanel) }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'settings'"
            :class="{ active: activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            {{ t(textKeys.settingsTitle) }}
          </button>
        </div>

        <ItemCardEquipmentEditor
          v-show="activeTab === 'equipment'"
          :draft="draft"
          :api-base="apiBase"
          :search-items="searchItems"
          :load-stains="loadStains"
          @update-locale="selectEquipmentLocale"
          @add-entry-after="emit('add-entry-after', $event)"
          @replace-entry="forwardReplaceEntry"
          @select-entry-candidate="forwardCandidateSelection"
          @clear-entry="emit('clear-entry', $event)"
          @set-entry-dye="forwardDyeSelection"
        />
        <ItemCardRenderSettings
          v-show="activeTab === 'settings'"
          :settings="settings"
          :locales="draft.locales"
          @update="updateSettings"
          @update-locale-style="updateLocaleStyle"
          @toggle-locale="toggleOutputLocale"
        />
      </aside>

      <main class="item-card-workspace__preview">
        <ItemCardPreview
          :entries="filledEntries"
          :draft="draft"
          :settings="settings"
          :layouts="layouts"
          :list-layout="listLayout"
          :api-base="apiBase"
          @set-layout="setLayout"
          @set-all-layouts="setAllLayouts(filledEntries.map(getItemCardRowId), $event)"
          @set-list-layout="setListLayout"
          @set-mode="updateSettings({ mode: $event })"
          @open-import="importOpen = true"
          @clear-draft="emit('clear-draft')"
        />
      </main>
    </div>

    <ItemCardImportDialog
      v-if="importOpen"
      :url="importUrl"
      :busy="busy"
      :status-message="statusMessage"
      :status-tone="statusTone"
      @update:url="importUrl = $event"
      @close="closeImport"
      @submit="submitImport"
      @open-text="openTextImportFromLink"
    />
    <ItemCardTextImportDialog
      v-if="textImportOpen"
      :text="textImportValue"
      :source-locale="textImportLocale"
      :busy="busy"
      :status-message="statusMessage"
      :status-tone="statusTone"
      @update:text="textImportValue = $event"
      @update:source-locale="textImportLocale = $event"
      @close="closeTextImport"
      @submit="submitTextImport"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ItemCardEquipmentEditor from '@/pages/item-card/components/ItemCardEquipmentEditor.vue'
import ItemCardImportDialog from '@/pages/item-card/components/ItemCardImportDialog.vue'
import ItemCardPreview from '@/pages/item-card/components/ItemCardPreview.vue'
import ItemCardRenderSettings from '@/pages/item-card/components/ItemCardRenderSettings.vue'
import ItemCardTextImportDialog from '@/pages/item-card/components/ItemCardTextImportDialog.vue'
import { useItemCardSettings } from '@/pages/item-card/composables/useItemCardSettings'
import { getFilledGlamourDraftEntries } from '@/pages/item-card/lib/draft'
import { getItemCardRowId } from '@/pages/item-card/lib/equipment'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourLocale,
  GlamourStain
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  draft: GlamourDraft
  apiBase: string
  busy: boolean
  statusMessage: string
  statusTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
  searchItems: (options: {
    slot: string
    query: string
    locale: string
    limit?: number
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
}>()

const emit = defineEmits<{
  'clear-draft': []
  'import-link': [payload: { url: string; preferredLocale?: string }]
  'import-text': [payload: { text: string; sourceLocale: string }]
  'add-entry-after': [rowId: string]
  'replace-entry': [rowId: string, candidate: GlamourCandidate]
  'select-entry-candidate': [rowId: string, candidateKey: string | number | undefined]
  'clear-entry': [rowId: string]
  'set-entry-dye': [rowId: string, dyeIndex: number, stain: GlamourStain]
  'update-locale': [locale: string]
}>()

const { t } = useLocale()
const activeTab = ref<'equipment' | 'settings'>('equipment')
const importOpen = ref(false)
const importUrl = ref('')
const textImportOpen = ref(false)
const textImportValue = ref('')
const textImportLocale = ref('zh')
const {
  settings,
  layouts,
  listLayout,
  updateSettings,
  updateLocaleStyle,
  toggleOutputLocale,
  setLayout,
  setAllLayouts,
  setListLayout
} = useItemCardSettings()

const filledEntries = computed(() => getFilledGlamourDraftEntries(props.draft))
watch(
  () => props.busy,
  (busy, previous) => {
    if (previous && !busy && props.statusTone !== 'danger') {
      importOpen.value = false
      importUrl.value = ''
      textImportOpen.value = false
      textImportValue.value = ''
    }
  }
)

function forwardReplaceEntry(rowId: string, candidate: GlamourCandidate) {
  emit('replace-entry', rowId, candidate)
}

function selectEquipmentLocale(locale: string) {
  const selectedLocale = props.draft.locales.includes(locale as GlamourLocale)
    ? (locale as GlamourLocale)
    : props.draft.locale

  emit('update-locale', selectedLocale)
  updateSettings({ outputLocales: [selectedLocale] })
}

function forwardCandidateSelection(rowId: string, candidateKey: string | number | undefined) {
  emit('select-entry-candidate', rowId, candidateKey)
}

function forwardDyeSelection(rowId: string, dyeIndex: number, stain: GlamourStain) {
  emit('set-entry-dye', rowId, dyeIndex, stain)
}

function closeImport() {
  importOpen.value = false
}

function submitImport() {
  emit('import-link', { url: importUrl.value, preferredLocale: props.draft.locale })
}

function openTextImport() {
  textImportLocale.value = props.draft.locale || 'zh'
  textImportOpen.value = true
}

function openTextImportFromLink() {
  importOpen.value = false
  openTextImport()
}

function closeTextImport() {
  textImportOpen.value = false
}

function submitTextImport() {
  emit('import-text', {
    text: textImportValue.value,
    sourceLocale: textImportLocale.value
  })
}
</script>

<style scoped>
.item-card-workspace {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--ns-body-background);
  color: var(--ns-color-text);
}

.item-card-workspace__body {
  display: grid;
  grid-template-columns: minmax(360px, 420px) minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.item-card-workspace__sidebar {
  min-width: 0;
  overflow-y: auto;
  border-right: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface);
}

.item-card-workspace__tabs {
  position: sticky;
  z-index: 20;
  top: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  background: var(--ns-pixel-window-bg);
}

.item-card-workspace__tabs button {
  min-height: 34px;
  border: 0;
  border-bottom: 2px solid var(--ns-color-border);
  background: transparent;
  color: var(--ns-color-text-muted);
  font: 900 12px var(--ns-font-decorative);
  cursor: pointer;
}

.item-card-workspace__tabs button.active {
  border-bottom-color: var(--ns-color-accent);
  color: var(--ns-color-accent-strong);
}

.item-card-workspace__preview {
  min-width: 0;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .item-card-workspace {
    height: auto;
  }

  .item-card-workspace__body {
    grid-template-columns: 1fr;
  }

  .item-card-workspace__sidebar {
    max-height: none;
    border-right: 0;
    border-bottom: 2px solid var(--ns-pixel-border);
  }

  .item-card-workspace__preview {
    overflow: visible;
  }
}
</style>
