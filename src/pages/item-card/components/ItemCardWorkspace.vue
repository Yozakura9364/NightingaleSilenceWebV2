<template>
  <div class="item-card-workspace">
    <div class="item-card-workspace__body">
      <aside class="item-card-workspace__sidebar ns-scroll-area">
        <div class="item-card-workspace__tabs">
          <AppTabs v-model="activeTab" :items="sidebarTabs" stretch density="compact" />
        </div>

        <section v-if="activePreviewView === 'canvas'" class="item-card-workspace__controls">
          <div class="item-card-workspace__canvas-controls">
            <div class="item-card-workspace__control-row">
              <button
                type="button"
                class="ns-button ns-button--compact"
                @click="openCanvasFilePicker"
              >
                {{ t(textKeys.canvasUpload) }}
              </button>
              <button
                type="button"
                class="ns-button ns-button--compact"
                :disabled="!canvasHasContent"
                @click="clearCanvasDocument"
              >
                {{ t(textKeys.canvasClear) }}
              </button>
              <button
                type="button"
                class="ns-button ns-button--compact"
                :disabled="!canvasBackground || canvasExporting"
                @click="exportCanvas"
              >
                {{ t(textKeys.canvasExport) }}
              </button>
            </div>
            <input
              ref="canvasFileInputElement"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              @change="onCanvasFileChange"
            />
            <p v-if="canvasStatusKey" class="item-card-workspace__control-status">
              {{ t(canvasStatusKey) }}
            </p>
          </div>
        </section>

        <ItemCardEquipmentEditor
          v-show="activeTab === 'equipment'"
          :draft="draft"
          :has-entries="Boolean(filledEntries.length)"
          :mode="settings.mode"
          :api-base="apiBase"
          :search-catalog-items="searchCatalogItems"
          :search-emotes="searchEmotes"
          :load-stains="loadStains"
          :layouts="layouts"
          @update-locale="selectEquipmentLocale"
          @add-catalog-item="emit('add-catalog-item', $event)"
          @clear-entry="emit('clear-entry', $event)"
          @move-entry="forwardMoveEntry"
          @set-entry-dye="forwardDyeSelection"
          @set-layout="setLayout"
          @set-all-layouts="setAllLayouts(filledEntries.map(getItemCardRowId), $event)"
          @clear-draft="emit('clear-draft')"
          @update-mode="updateSettings({ mode: $event })"
        />
        <ItemCardRenderSettings
          v-show="activeTab === 'settings'"
          :settings="settings"
          :locales="draft.locales"
          @update="updateSettings"
          @update-locale-style="updateLocaleStyle"
          @toggle-locale="toggleOutputLocale"
        />
        <ItemCardCustomTextEditor v-show="activeTab === 'customText'" :settings="settings" />
      </aside>

      <main class="item-card-workspace__preview ns-scroll-area">
        <ItemCardPreview
          :active-view="activePreviewView"
          :entries="filledEntries"
          :draft="draft"
          :settings="settings"
          :layouts="layouts"
          :api-base="apiBase"
          @update-view="activePreviewView = $event"
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
      @parse-chara="emit('import-chara', $event)"
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
import { defineAsyncComponent, computed, ref, watch } from 'vue'
import AppTabs from '@/components/AppTabs.vue'

const ItemCardImportDialog = defineAsyncComponent({
  loader: () => import('@/pages/item-card/components/ItemCardImportDialog.vue'),
  delay: 200
})
const ItemCardTextImportDialog = defineAsyncComponent({
  loader: () => import('@/pages/item-card/components/ItemCardTextImportDialog.vue'),
  delay: 200
})
import ItemCardEquipmentEditor from '@/pages/item-card/components/ItemCardEquipmentEditor.vue'
import ItemCardCustomTextEditor from '@/pages/item-card/components/ItemCardCustomTextEditor.vue'
import ItemCardPreview from '@/pages/item-card/components/ItemCardPreview.vue'
import ItemCardRenderSettings from '@/pages/item-card/components/ItemCardRenderSettings.vue'
import { useItemCardSettings } from '@/pages/item-card/composables/useItemCardSettings'
import { useItemCardCanvas } from '@/pages/item-card/composables/useItemCardCanvas'
import { downloadBlob } from '@/pages/item-card/lib/cardRenderer'
import { renderItemCardCanvasBlob } from '@/pages/item-card/lib/canvasComposer'
import { getFilledGlamourDraftEntries } from '@/pages/item-card/lib/draft'
import { getItemCardRowId } from '@/pages/item-card/lib/equipment'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourLocale,
  GlamourStain,
  ItemCardCatalogCategory
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  draft: GlamourDraft
  apiBase: string
  busy: boolean
  statusMessage: string
  statusTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
  searchCatalogItems: (options: {
    query: string
    locale: string
    category: ItemCardCatalogCategory
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
  searchEmotes: (options: {
    query: string
    locale: string
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
}>()

const emit = defineEmits<{
  'clear-draft': []
  'import-link': [payload: { url: string; preferredLocale?: string }]
  'import-text': [payload: { text: string; sourceLocale: string }]
  'import-chara': [file: File]
  'add-catalog-item': [candidate: GlamourCandidate]
  'clear-entry': [rowId: string]
  'move-entry': [sourceRowId: string, targetRowId: string, placement: 'before' | 'after']
  'set-entry-dye': [rowId: string, dyeIndex: number, stain: GlamourStain]
  'update-locale': [locale: string]
}>()

const { t } = useLocale()
const activeTab = ref('equipment')
const activePreviewView = ref<'cards' | 'canvas'>('cards')
const sidebarTabs = computed(() => [
  { value: 'equipment', label: t(textKeys.nsglamourEquipmentPanel) },
  { value: 'settings', label: t(textKeys.settingsTitle) },
  { value: 'customText', label: t(textKeys.customTextPanel) }
])
const importOpen = ref(false)
const importUrl = ref('')
const textImportOpen = ref(false)
const textImportValue = ref('')
const textImportLocale = ref('zh')
const canvasFileInputElement = ref<HTMLInputElement | null>(null)
const canvasExporting = ref(false)
const canvasStatusKey = ref('')
const {
  settings,
  layouts,
  updateSettings,
  updateLocaleStyle,
  toggleOutputLocale,
  setLayout,
  setAllLayouts
} = useItemCardSettings()

const filledEntries = computed(() => getFilledGlamourDraftEntries(props.draft))
const {
  canvasDocument,
  setBackgroundFromFile,
  clearCanvas: clearCanvasDocumentState
} = useItemCardCanvas()
const canvasBackground = computed(() => canvasDocument.value.background || null)
const canvasHasContent = computed(() =>
  Boolean(canvasBackground.value || canvasDocument.value.layers.length)
)
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

function selectEquipmentLocale(locale: string) {
  const selectedLocale = props.draft.locales.includes(locale as GlamourLocale)
    ? (locale as GlamourLocale)
    : props.draft.locale

  emit('update-locale', selectedLocale)
  updateSettings({ outputLocales: [selectedLocale] })
}

function forwardDyeSelection(rowId: string, dyeIndex: number, stain: GlamourStain) {
  emit('set-entry-dye', rowId, dyeIndex, stain)
}

function forwardMoveEntry(sourceRowId: string, targetRowId: string, placement: 'before' | 'after') {
  emit('move-entry', sourceRowId, targetRowId, placement)
}

function closeImport() {
  importOpen.value = false
}

function openCanvasFilePicker() {
  canvasFileInputElement.value?.click()
}

function onCanvasFileChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    void uploadCanvasFile(file)
  }
}

async function uploadCanvasFile(file: File) {
  const result = await setBackgroundFromFile(file)
  canvasStatusKey.value =
    result === 'ok'
      ? ''
      : result === 'format'
        ? textKeys.canvasErrorFormat
        : result === 'tooLarge'
          ? textKeys.canvasErrorTooLarge
          : textKeys.canvasErrorRead
}

async function clearCanvasDocument() {
  canvasStatusKey.value = ''
  await clearCanvasDocumentState()
}

async function exportCanvas() {
  canvasExporting.value = true
  try {
    const blob = await renderItemCardCanvasBlob(canvasDocument.value)
    if (!blob) {
      canvasStatusKey.value = textKeys.canvasEmpty
      return
    }
    canvasStatusKey.value = ''
    downloadBlob(blob, 'item-card-canvas.png')
  } finally {
    canvasExporting.value = false
  }
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
  border-right: var(--ns-large-panel-border-width) solid var(--ns-large-panel-border-color);
  background: var(--ns-color-surface);
}

.item-card-workspace__tabs {
  position: sticky;
  z-index: 20;
  top: 0;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  padding: 10px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 88%, transparent);
}

.item-card-workspace__tabs :deep(.app-tabs) {
  width: 100%;
}

.item-card-workspace__controls {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
}

.item-card-workspace__canvas-controls {
  display: grid;
  gap: 8px;
}

.item-card-workspace__control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item-card-workspace__control-status {
  margin: 0;
  color: var(--ns-color-danger, #b4453c);
  font-size: 11px;
  line-height: 1.45;
}

.item-card-workspace__preview {
  min-width: 0;
  overflow-y: auto;
}

@media (max-width: 860px) {
  .item-card-workspace {
    height: auto;
  }

  .item-card-workspace__body {
    grid-template-columns: 1fr;
    height: auto;
  }

  .item-card-workspace__sidebar {
    max-height: none;
    overflow: visible;
    border-right: 0;
    border-bottom: var(--ns-large-panel-border-width) solid var(--ns-large-panel-border-color);
  }

  .item-card-workspace__preview {
    overflow: visible;
  }
}
</style>
