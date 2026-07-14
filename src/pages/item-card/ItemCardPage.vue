<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" variant="workspace">
    <ItemCardWorkspace
      :draft="draft"
      :api-base="boundary.apiBase"
      :busy="importing"
      :load-stains="api.loadStains"
      :search-items="api.searchItems"
      :status-message="statusMessage"
      :status-tone="statusTone"
      @clear-draft="clear"
      @import-link="importLink"
      @import-text="importText"
      @add-entry-after="addEntryAfter"
      @replace-entry="replaceEntry"
      @select-entry-candidate="selectEntryCandidate"
      @clear-entry="clearEntry"
      @set-entry-dye="setEntryDye"
      @update-locale="setLocale"
    />
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError } from '@/composables/useFetch'
import ItemCardWorkspace from '@/pages/item-card/components/ItemCardWorkspace.vue'
import { getRequiredFfxivTool } from '@/config/site'
import { normalizeGlamourLocale } from '@/pages/item-card/lib/equipment'
import { formatGlamourText } from '@/pages/item-card/lib/formatText'
import { isSupportedGlamourLinkUrl } from '@/pages/item-card/lib/links'
import {
  normalizeItemCardImportText,
  prepareItemCardTextPayload
} from '@/pages/item-card/lib/textImport'
import type { GlamourImportPayload } from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { itemCardUiMessages } from '@/pages/item-card/locales/messages'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import { useItemCardDraft } from '@/pages/item-card/composables/useItemCardDraft'
import { useItemCardApi } from '@/pages/item-card/services/itemCardApi'
import { getApiBoundary } from '@/services/apiBoundaries'
import { loadMessages, useLocale } from '@/stores/locale'

loadMessages(itemCardUiMessages)

const tool = getRequiredFfxivTool('itemCard')
const boundary = getApiBoundary('itemCard')
const { t } = useLocale()
const api = useItemCardApi(boundary)
const {
  draft,
  acceptPayload,
  clearDraft,
  setLocale,
  addEntryAfter,
  replaceEntry,
  selectEntryCandidate,
  clearEntry,
  setEntryDye,
} = useItemCardDraft()

const importing = ref(false)
const statusKey = ref<string>(textKeys.nsglamourStatusIdle)
const statusText = ref('')
const statusTone = ref<'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'>('neutral')
const statusValues = ref<Record<string, string | number>>({})

const statusMessage = computed(() => {
  if (statusText.value) {
    return statusText.value
  }
  return statusTone.value === 'neutral' && statusKey.value === textKeys.nsglamourStatusIdle
    ? ''
    : statusKey.value
      ? formatGlamourText(t(statusKey.value), statusValues.value)
      : ''
})

async function runImport(
  loader: () => Promise<GlamourImportPayload>,
  preferredLocale?: string,
  options: {
    loadingKey?: string
    onSuccess?: (payload: GlamourImportPayload) => void
  } = {}
) {
  importing.value = true
  statusKey.value = options.loadingKey || textKeys.nsglamourStatusReadingLink
  statusText.value = ''
  statusTone.value = 'loading'
  statusValues.value = {}

  try {
    const payload = await loader()
    acceptPayload(payload, selectImportLocale(payload, preferredLocale))
    if (options.onSuccess) {
      options.onSuccess(payload)
    } else {
      statusKey.value = ''
      statusText.value = ''
      statusTone.value = 'neutral'
    }
  } catch (error) {
    statusKey.value = textKeys.nsglamourStatusImportError
    statusText.value = getImportErrorMessage(error)
    statusTone.value = 'danger'
  } finally {
    importing.value = false
  }
}

function importLink(payload: { url: string; preferredLocale?: string }) {
  const url = payload.url.trim()
  if (!url) {
    setStatus(textKeys.nsglamourStatusLinkRequired, 'warning')
    return
  }
  if (!isSupportedGlamourLinkUrl(url)) {
    setStatus(textKeys.nsglamourStatusUnsupportedLink, 'warning')
    return
  }
  void runImport(() => api.importLink({ url }), payload.preferredLocale)
}

function importText(payload: { text: string; sourceLocale: string }) {
  const text = normalizeItemCardImportText(payload.text)
  if (!text) {
    setStatus(textKeys.nsglamourStatusTextRequired, 'warning')
    return
  }

  void runImport(
    () =>
      api
        .resolveNumericItemText(text, payload.sourceLocale)
        .then((resolvedText) =>
          api.parseText({ text: resolvedText, sourceLocale: payload.sourceLocale })
        )
        .then(prepareItemCardTextPayload),
    payload.sourceLocale,
    {
      loadingKey: textKeys.nsglamourStatusParsingText,
      onSuccess: (parsed) => {
        const count = Array.isArray(parsed.resolved_equipment)
          ? parsed.resolved_equipment.length
          : 0
        const warningCount = Array.isArray(parsed.warnings) ? parsed.warnings.length : 0
        setStatus(
          warningCount
            ? textKeys.nsglamourStatusTextImportedWithWarnings
            : textKeys.nsglamourStatusTextImported,
          warningCount ? 'warning' : 'success',
          { count, warningCount }
        )
      }
    }
  )
}

function selectImportLocale(payload: GlamourImportPayload, preferredLocale?: string): string {
  const preferred = normalizeGlamourLocale(preferredLocale || draft.value.locale)
  const available = Array.isArray(payload.locales)
    ? payload.locales.map((locale) => normalizeGlamourLocale(locale))
    : []
  return available.includes(preferred)
    ? preferred
    : normalizeGlamourLocale(payload.default_locale || payload.source_locale || preferred)
}

function setStatus(
  key: string,
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading',
  values: Record<string, string | number> = {}
) {
  statusKey.value = key
  statusText.value = ''
  statusTone.value = tone
  statusValues.value = values
}

function clear() {
  clearDraft()
  setStatus(textKeys.nsglamourStatusIdle, 'neutral')
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
