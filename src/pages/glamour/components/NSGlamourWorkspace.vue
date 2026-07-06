<template>
  <div class="nsglamour-workspace" :aria-label="t(textKeys.nsglamourWorkspace)">
    <aside class="nsglamour-workspace__side ns-scroll-area ns-scroll-area--compact">
      <NSGlamourImportPanel
        :busy="importing"
        :status-message="statusMessage"
        :status-tone="statusTone"
        :recent-items="recentSnapshots"
        :recent-default-name="defaultConfigName"
        @import-link="importLink"
        @parse-text="parseText"
        @parse-chara="parseChara"
        @save-recent="saveConfig"
        @restore-recent="restoreConfig"
        @delete-recent="deleteRecent"
        @clear-recent="clearRecent"
        @clear="clear"
      />

      <NSGlamourCopyPanel
        :copy-text="copyText"
        :copy-format="copyFormat"
        :custom-template="customCopyTemplate"
        :disabled="importing || !hasEquipment"
        @update-copy-format="setCopyFormat"
        @update-custom-template="setCustomCopyTemplate"
        @reset-custom-template="resetCustomCopyTemplate"
      />
    </aside>

    <main class="nsglamour-workspace__main ns-scroll-area ns-scroll-area--compact">
      <NSGlamourEquipmentPanel
        :draft="draft"
        :api-base="boundary.apiBase"
        :search-items="api.searchItems"
        :load-stains="api.loadStains"
        @update-locale="setLocale"
        @replace-entry="replaceEntry"
        @clear-entry="clearEntry"
        @select-entry-candidate="selectEntryCandidate"
        @set-entry-dye="setEntryDye"
        @save-config="saveConfig"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { textKeys } from '@/config/site'
import { formatGlamourText } from '@/lib/glamour/formatText'
import type { GlamourImportPayload } from '@/lib/glamour/types'
import NSGlamourCopyPanel from '@/pages/glamour/components/NSGlamourCopyPanel.vue'
import NSGlamourEquipmentPanel from '@/pages/glamour/components/NSGlamourEquipmentPanel.vue'
import NSGlamourImportPanel from '@/pages/glamour/components/NSGlamourImportPanel.vue'
import { useGlamourDraft } from '@/pages/glamour/composables/useGlamourDraft'
import { useNSGlamourApi } from '@/pages/glamour/services/nsglamourApi'
import type { ApiBoundary } from '@/services/apiBoundaries'
import type { GlamourRecentSnapshot } from '@/lib/glamour/types'
import { useLocale } from '@/stores/locale'

const MAX_CHARA_UPLOAD_BYTES = 5 * 1024 * 1024

const props = defineProps<{
  boundary: ApiBoundary
}>()

const { t } = useLocale()
const api = useNSGlamourApi(props.boundary)
const {
  draft,
  hasEquipment,
  recentSnapshots,
  copyFormat,
  customCopyTemplate,
  copyText,
  acceptPayload,
  clearDraft,
  setLocale,
  replaceEntry,
  clearEntry,
  selectEntryCandidate,
  setEntryDye,
  setCopyFormat,
  setCustomCopyTemplate,
  resetCustomCopyTemplate,
  saveCurrentConfig,
  restoreRecentConfig,
  deleteRecentConfig,
  clearRecentConfigs
} = useGlamourDraft()
const importing = ref(false)
const statusKey = ref<string>(textKeys.nsglamourStatusIdle)
const statusTone = ref<'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'>('neutral')
const statusValues = ref<Record<string, string | number>>({})

const statusMessage = computed(() => {
  if (!statusKey.value) {
    return ''
  }

  return formatGlamourText(t(statusKey.value), statusValues.value)
})

const defaultConfigName = computed(() =>
  draft.value.source.name || draft.value.source.title || t(textKeys.nsglamourRecentUnnamed)
)

async function runImport(loader: () => Promise<GlamourImportPayload>, loadingStatusKey: string) {
  importing.value = true
  statusKey.value = loadingStatusKey
  statusTone.value = 'loading'
  statusValues.value = {}

  try {
    const payload = await loader()
    acceptPayload(payload, draft.value.locale)
    statusKey.value = ''
    statusTone.value = 'neutral'
    statusValues.value = {}
  } catch {
    statusKey.value = textKeys.nsglamourStatusImportError
    statusTone.value = 'danger'
    statusValues.value = {}
  } finally {
    importing.value = false
  }
}

function parseText(payload: { text: string; sourceLocale: string }) {
  const text = payload.text.trim()

  if (!text) {
    statusKey.value = textKeys.nsglamourStatusTextRequired
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  void runImport(
    () => api.parseText({ text, sourceLocale: payload.sourceLocale }),
    textKeys.nsglamourStatusParsingText
  )
}

function importLink(payload: { url: string }) {
  const url = payload.url.trim()

  if (!url) {
    statusKey.value = textKeys.nsglamourStatusLinkRequired
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  void runImport(() => api.importLink({ url }), textKeys.nsglamourStatusReadingLink)
}

function parseChara(file: File) {
  if (!file.name.toLowerCase().endsWith('.chara')) {
    statusKey.value = textKeys.nsglamourStatusInvalidLocalFile
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  if (file.size > MAX_CHARA_UPLOAD_BYTES) {
    statusKey.value = textKeys.nsglamourStatusFileTooLarge
    statusTone.value = 'warning'
    statusValues.value = { size: Math.round(MAX_CHARA_UPLOAD_BYTES / 1024 / 1024) }
    return
  }

  void runImport(() => api.parseChara(file), textKeys.nsglamourStatusReadingConfig)
}

function clear() {
  clearDraft()
  statusKey.value = textKeys.nsglamourStatusIdle
  statusTone.value = 'neutral'
  statusValues.value = {}
}

function saveConfig(name: string) {
  if (!saveCurrentConfig(name)) {
    statusKey.value = textKeys.nsglamourStatusNoConfigToSave
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  statusKey.value = textKeys.nsglamourStatusConfigSaved
  statusTone.value = 'success'
  statusValues.value = { name }
}

function restoreConfig(item: GlamourRecentSnapshot) {
  restoreRecentConfig(item)
  statusKey.value = textKeys.nsglamourStatusConfigRestored
  statusTone.value = 'success'
  statusValues.value = { name: item.displayName || item.sourceName || '' }
}

function deleteRecent(id: string) {
  deleteRecentConfig(id)
  statusKey.value = textKeys.nsglamourStatusRecentDeleted
  statusTone.value = 'neutral'
  statusValues.value = {}
}

function clearRecent() {
  clearRecentConfigs()
  statusKey.value = textKeys.nsglamourStatusRecentCleared
  statusTone.value = 'neutral'
  statusValues.value = {}
}
</script>

<style scoped>
.nsglamour-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 14px;
  background: var(--ns-body-background);
}

.nsglamour-workspace__side,
.nsglamour-workspace__main {
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 0;
  overflow: auto;
}

.nsglamour-workspace__main {
  align-content: stretch;
}

@media (max-width: 900px) {
  .nsglamour-workspace {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .nsglamour-workspace__side,
  .nsglamour-workspace__main {
    overflow: visible;
  }
}
</style>
