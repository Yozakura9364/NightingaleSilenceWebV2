<template>
  <div
    v-if="mode === 'equipinfo'"
    class="nsglamour-workspace"
    :aria-label="t(textKeys.nsglamourWorkspace)"
  >
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

  <NSGlamourTemplateWorkspace
    v-else
    :draft="draft"
    :api-base="boundary.apiBase"
    :busy="importing"
    :load-stains="api.loadStains"
    :search-items="api.searchItems"
    :status-message="statusMessage"
    :status-tone="statusTone"
    :recent-items="recentSnapshots"
    :recent-default-name="defaultConfigName"
    @clear-draft="clear"
    @import-link="importLink"
    @replace-entry="replaceEntry"
    @clear-entry="clearEntry"
    @set-entry-dye="setEntryDye"
    @update-locale="setLocale"
    @save-recent="saveConfig"
    @restore-recent="restoreConfig"
    @delete-recent="deleteRecent"
    @clear-recent="clearRecent"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError } from '@/composables/useFetch'
import { textKeys } from '@/config/site'
import { normalizeGlamourLocale } from '@/lib/glamour/equipment'
import { formatGlamourText } from '@/lib/glamour/formatText'
import { isSupportedGlamourLinkUrl } from '@/lib/glamour/links'
import type { GlamourImportPayload } from '@/lib/glamour/types'
import NSGlamourCopyPanel from '@/pages/glamour/components/NSGlamourCopyPanel.vue'
import NSGlamourEquipmentPanel from '@/pages/glamour/components/NSGlamourEquipmentPanel.vue'
import NSGlamourImportPanel from '@/pages/glamour/components/NSGlamourImportPanel.vue'
import NSGlamourTemplateWorkspace from '@/pages/glamour/components/NSGlamourTemplateWorkspace.vue'
import { useGlamourDraft } from '@/pages/glamour/composables/useGlamourDraft'
import { useNSGlamourApi } from '@/pages/glamour/services/nsglamourApi'
import type { ApiBoundary } from '@/services/apiBoundaries'
import type { GlamourRecentSnapshot } from '@/lib/glamour/types'
import { useLocale } from '@/stores/locale'

const MAX_CHARA_UPLOAD_BYTES = 5 * 1024 * 1024

const props = defineProps<{
  boundary: ApiBoundary
  mode: 'template' | 'equipinfo'
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
const statusText = ref('')
const statusTone = ref<'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'>('neutral')
const statusValues = ref<Record<string, string | number>>({})

const statusMessage = computed(() => {
  if (statusText.value) {
    return statusText.value
  }

  if (!statusKey.value) {
    return ''
  }

  return formatGlamourText(t(statusKey.value), statusValues.value)
})

const defaultConfigName = computed(() =>
  draft.value.source.name || draft.value.source.title || t(textKeys.nsglamourRecentUnnamed)
)

async function runImport(
  loader: () => Promise<GlamourImportPayload>,
  loadingStatusKey: string,
  options: { importMode?: 'template-link' | ''; preferredLocale?: string } = {}
) {
  importing.value = true
  statusKey.value = loadingStatusKey
  statusText.value = ''
  statusTone.value = 'loading'
  statusValues.value = {}

  try {
    const payload = await loader()
    acceptPayload(payload, selectImportPreferredLocale(payload, options.preferredLocale), {
      importMode: options.importMode || ''
    })
    statusKey.value = ''
    statusText.value = ''
    statusTone.value = 'neutral'
    statusValues.value = {}
  } catch (error) {
    statusKey.value = textKeys.nsglamourStatusImportError
    statusText.value = getImportErrorMessage(error)
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
    statusText.value = ''
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  void runImport(
    () => api.parseText({ text, sourceLocale: payload.sourceLocale }),
    textKeys.nsglamourStatusParsingText
  )
}

function importLink(payload: { url: string; importMode?: 'template-link' | ''; preferredLocale?: string }) {
  const url = payload.url.trim()

  if (!url) {
    statusKey.value = textKeys.nsglamourStatusLinkRequired
    statusText.value = ''
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  if (!isSupportedGlamourLinkUrl(url)) {
    statusKey.value = textKeys.nsglamourStatusUnsupportedLink
    statusText.value = ''
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  void runImport(
    () => api.importLink({ url }),
    textKeys.nsglamourStatusReadingLink,
    { importMode: payload.importMode || '', preferredLocale: payload.preferredLocale }
  )
}

function selectImportPreferredLocale(payload: GlamourImportPayload, preferredLocale?: string): string {
  if (!preferredLocale) {
    return draft.value.locale
  }

  const normalizedPreferred = normalizeGlamourLocale(preferredLocale)
  const availableLocales = Array.isArray(payload.locales)
    ? payload.locales.map((locale) => normalizeGlamourLocale(locale)).filter(Boolean)
    : []

  if (availableLocales.includes(normalizedPreferred)) {
    return normalizedPreferred
  }

  return normalizeGlamourLocale(payload.default_locale || payload.source_locale || draft.value.locale)
}

function parseChara(file: File) {
  if (!file.name.toLowerCase().endsWith('.chara')) {
    statusKey.value = textKeys.nsglamourStatusInvalidLocalFile
    statusText.value = ''
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  if (file.size > MAX_CHARA_UPLOAD_BYTES) {
    statusKey.value = textKeys.nsglamourStatusFileTooLarge
    statusText.value = ''
    statusTone.value = 'warning'
    statusValues.value = { size: Math.round(MAX_CHARA_UPLOAD_BYTES / 1024 / 1024) }
    return
  }

  void runImport(() => api.parseChara(file), textKeys.nsglamourStatusReadingConfig)
}

function clear() {
  clearDraft()
  statusKey.value = textKeys.nsglamourStatusIdle
  statusText.value = ''
  statusTone.value = 'neutral'
  statusValues.value = {}
}

function saveConfig(name: string) {
  if (!saveCurrentConfig(name)) {
    statusKey.value = textKeys.nsglamourStatusNoConfigToSave
    statusText.value = ''
    statusTone.value = 'warning'
    statusValues.value = {}
    return
  }

  statusKey.value = textKeys.nsglamourStatusConfigSaved
  statusText.value = ''
  statusTone.value = 'success'
  statusValues.value = { name }
}

function restoreConfig(item: GlamourRecentSnapshot) {
  restoreRecentConfig(item, { mode: props.mode })
  statusKey.value = textKeys.nsglamourStatusConfigRestored
  statusText.value = ''
  statusTone.value = 'success'
  statusValues.value = { name: item.displayName || item.sourceName || '' }
}

function deleteRecent(id: string) {
  deleteRecentConfig(id)
  statusKey.value = textKeys.nsglamourStatusRecentDeleted
  statusText.value = ''
  statusTone.value = 'neutral'
  statusValues.value = {}
}

function clearRecent() {
  clearRecentConfigs()
  statusKey.value = textKeys.nsglamourStatusRecentCleared
  statusText.value = ''
  statusTone.value = 'neutral'
  statusValues.value = {}
}

function getImportErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError) || !error.bodyText) {
    return ''
  }

  try {
    const body = JSON.parse(error.bodyText) as { error?: unknown; message?: unknown }
    const message = typeof body.error === 'string' ? body.error : body.message
    return typeof message === 'string' ? message.trim() : ''
  } catch {
    return ''
  }
}
</script>

<style scoped>
.nsglamour-workspace {
  display: grid;
  grid-template-columns: clamp(400px, 25vw, 520px) minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
  padding: 14px;
  background: #fff;
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

@media (max-width: 1080px) {
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
