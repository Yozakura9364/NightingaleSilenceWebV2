<template>
  <section class="nsglamour-template" :aria-label="t(textKeys.nsglamourTemplatePage)">
    <div ref="previewEl" class="nsglamour-template__preview">
      <div
        ref="canvasShellEl"
        class="nsglamour-template__canvas-shell"
        :style="canvasShellStyle"
        tabindex="0"
        :aria-label="t(textKeys.nsglamourTemplateCanvas)"
        @dragenter.prevent="handleCanvasDrag"
        @dragover.prevent="handleCanvasDrag"
        @dragleave="handleCanvasDragLeave"
        @drop.prevent="handleCanvasDrop"
      >
        <canvas
          ref="templateCanvasEl"
          class="nsglamour-template__canvas"
          :width="templateRenderData.canvas.width"
          :height="templateRenderData.canvas.height"
        ></canvas>
        <input
          ref="imageInputEl"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp"
          multiple
          hidden
          @change="handleImageInputChange"
        />
        <button
          v-for="slot in canvasUploadLayers"
          :key="slot.id"
          type="button"
          class="nsglamour-template__canvas-upload-layer"
          :class="{
            'has-image': hasTemplateImage(slot.id),
            dragover: activeDropSlotId === slot.id
          }"
          :style="getCanvasUploadLayerStyle(slot)"
          :data-template-image-slot="slot.id"
          @click.stop="openImageUploadMenu(slot.id)"
        >
          <span>{{ slot.uploadText }}</span>
        </button>
        <div
          v-if="imageUploadMenuSlot"
          class="nsglamour-template__image-menu"
          :style="getImageUploadMenuStyle(imageUploadMenuSlot)"
          role="dialog"
          :aria-label="t(textKeys.nsglamourTemplateRecentImages)"
          @click.stop
        >
          <div class="nsglamour-template__image-menu-actions">
            <button type="button" @click="chooseImageUpload(imageUploadMenuSlot.id)">
              {{ t(textKeys.nsglamourTemplateUploadImage) }}
            </button>
            <button
              v-if="recentTemplateImages.length"
              type="button"
              @click="clearRecentTemplateImages"
            >
              {{ t(textKeys.nsglamourTemplateRecentImagesClear) }}
            </button>
          </div>
          <div class="nsglamour-template__image-menu-title">
            {{ t(textKeys.nsglamourTemplateRecentImages) }}
          </div>
          <div v-if="recentTemplateImages.length" class="nsglamour-template__recent-images">
            <button
              v-for="record in recentTemplateImages"
              :key="record.id"
              type="button"
              class="nsglamour-template__recent-image"
              @click="useRecentTemplateImage(imageUploadMenuSlot.id, record)"
            >
              <img :src="record.thumbnailUrl" :alt="record.imageName" loading="lazy" />
              <span>
                <strong>{{
                  record.imageName || t(textKeys.nsglamourTemplateRecentImageFallback)
                }}</strong>
                <small>{{ formatRecentTemplateImageTime(record.updatedAt) }}</small>
              </span>
            </button>
          </div>
          <div v-else class="nsglamour-template__image-menu-empty">
            {{ t(textKeys.nsglamourTemplateRecentImagesEmpty) }}
          </div>
        </div>
      </div>
    </div>

    <aside class="nsglamour-template__config ns-scroll-area ns-scroll-area--compact">
      <NSGlamourTemplateSettingsPanel
        ref="settingsPanelRef"
        :template="template"
        :template-settings="templateSettings"
        :author-links="authorLinks"
        @update-settings="updateTemplateSettings"
        @change-template="openTemplateSelector"
        @save-image="downloadTemplateCanvas"
      />

      <NSGlamourTemplateEquipmentPanel
        ref="equipmentPanelRef"
        :language-options="orderedLanguageOptions"
        :selected-locales="selectedLocales"
        :active-locale="activeLocale"
        :single-language-mode="isSingleTemplateLanguageMode"
        :rows="editorRows"
        :draft="draft"
        :api-base="apiBase"
        :editor-locale="editorLocale"
        :search-items="searchItems"
        :load-stains="loadStains"
        :recent-items="recentItems"
        :recent-default-name="recentDefaultName"
        :busy="busy"
        @open-import="openImportDialog"
        @clear-draft="emit('clear-draft')"
        @toggle-language="toggleTemplateLocale"
        @replace-entry="forwardReplaceEntry"
        @clear-entry="forwardClearEntry"
        @set-entry-dye="forwardSetEntryDye"
        @restore-recent="emit('restore-recent', $event)"
        @delete-recent="emit('delete-recent', $event)"
        @clear-recent="emit('clear-recent')"
      />
    </aside>

    <NSGlamourTemplateSelectorDialog
      v-if="templateSelectorOpen"
      :template-id="templateId"
      @close="closeTemplateSelector"
      @select="selectTemplate"
    />

    <NSGlamourTemplateCropDialog
      v-if="pendingCrop && pendingCropSlot"
      :request="pendingCrop"
      :slot="pendingCropSlot"
      @apply="applyImageCrop"
      @close="closeImageCropper"
    />

    <NSGlamourTemplateImportDialog
      v-if="importDialogOpen"
      :url="importUrl"
      :busy="busy"
      :status-message="importStatusMessage"
      :status-tone="importStatusTone"
      @update:url="importUrl = $event"
      @close="closeImportDialog"
      @submit="submitImport"
    />
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import {
  GLAMOUR_ACCESSORY_SLOTS,
  buildGlamourIconUrl,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getSelectedCandidate,
  getSlotTitle,
  makeEmptyEquipmentEntry
} from '@/lib/glamour/equipment'
import { isSupportedGlamourLinkUrl, normalizeGlamourLinkUrl } from '@/lib/glamour/links'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourRecentSnapshot,
  GlamourStain
} from '@/lib/glamour/types'
import { GLAMOUR_TEMPLATE_SLOT_ORDER, type GlamourTemplateId } from '@/lib/glamour/templates'
import NSGlamourTemplateEquipmentPanel from '@/pages/glamour/components/NSGlamourTemplateEquipmentPanel.vue'
import NSGlamourTemplateSettingsPanel from '@/pages/glamour/components/NSGlamourTemplateSettingsPanel.vue'
import { useGlamourTemplateCanvas } from '@/pages/glamour/composables/useGlamourTemplateCanvas'
import { useGlamourTemplateImageInteraction } from '@/pages/glamour/composables/useGlamourTemplateImageInteraction'
import { useGlamourTemplateImageStore } from '@/pages/glamour/composables/useGlamourTemplateImageStore'
import { useGlamourTemplateLanguageControls } from '@/pages/glamour/composables/useGlamourTemplateLanguageControls'
import { useGlamourTemplateWorkspace } from '@/pages/glamour/composables/useGlamourTemplateWorkspace'
import type {
  GlamourEquipmentSearch,
  GlamourStainLoader
} from '@/pages/glamour/types/equipmentEditor'
import type { GlamourTemplateEditorRow } from '@/pages/glamour/types/templateWorkspace'
import { useLocale } from '@/stores/locale'

const NSGlamourTemplateCropDialog = defineAsyncComponent(
  () => import('@/pages/glamour/components/NSGlamourTemplateCropDialog.vue')
)
const NSGlamourTemplateImportDialog = defineAsyncComponent(
  () => import('@/pages/glamour/components/NSGlamourTemplateImportDialog.vue')
)
const NSGlamourTemplateSelectorDialog = defineAsyncComponent(
  () => import('@/pages/glamour/components/NSGlamourTemplateSelectorDialog.vue')
)

const props = defineProps<{
  draft: GlamourDraft
  apiBase: string
  busy: boolean
  searchItems: GlamourEquipmentSearch
  loadStains: GlamourStainLoader
  statusMessage: string
  statusTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
  recentItems: GlamourRecentSnapshot[]
  recentDefaultName: string
}>()

const emit = defineEmits<{
  'clear-draft': []
  'import-link': [
    payload: { url: string; importMode?: 'template-link' | ''; preferredLocale?: string }
  ]
  'replace-entry': [slot: string, candidate: GlamourCandidate]
  'clear-entry': [slot: string]
  'set-entry-dye': [slot: string, dyeIndex: number, stain: GlamourStain]
  'update-locale': [locale: string]
  'save-recent': [name: string]
  'restore-recent': [item: GlamourRecentSnapshot]
  'delete-recent': [id: string]
  'clear-recent': []
}>()

const { t, current } = useLocale()
const draftRef = computed(() => props.draft)
const {
  templateId,
  template,
  templateSettings,
  selectedLocales,
  activeLocale,
  templateRenderData,
  setTemplateId,
  updateTemplateSettings,
  setTemplateLocales
} = useGlamourTemplateWorkspace(draftRef)
const {
  templateImportPreferredLocale,
  isSingleLanguageMode: isSingleTemplateLanguageMode,
  orderedLanguageOptions,
  editorLocale,
  toggleTemplateLocale
} = useGlamourTemplateLanguageControls({
  template,
  selectedLocales,
  activeLocale,
  draftLocale: computed(() => props.draft.locale),
  uiLocale: current,
  setTemplateLocales,
  updateLocale: (locale) => emit('update-locale', locale)
})
const editorRows = computed<GlamourTemplateEditorRow[]>(() => {
  const entriesBySlot = new Map(props.draft.entries.map((entry) => [entry.slot, entry]))

  return GLAMOUR_TEMPLATE_SLOT_ORDER.map((slot) => {
    const entry =
      entriesBySlot.get(slot) ??
      makeEmptyEquipmentEntry(slot, { slot_names: props.draft.slotNames })
    const candidate = getSelectedCandidate(entry)
    const locale = editorLocale.value
    const itemName = candidate ? getCandidateName(candidate, locale, props.draft.source.locale) : ''
    const dyeEntries =
      candidate && getCandidateDyeCount(candidate, slot) > 0
        ? getDisplayDyeEntries(candidate, slot, props.draft.noDyeLabels, locale)
        : []

    return {
      slot,
      slotName: getSlotTitle(entry, locale, {
        slot_names: props.draft.slotNames,
        default_locale: props.draft.source.locale
      }),
      itemName,
      iconUrl: buildGlamourIconUrl(props.apiBase, candidate?.icon),
      dyeEntries,
      dyeStatusText:
        candidate && dyeEntries.length === 0 && !GLAMOUR_ACCESSORY_SLOTS.has(slot)
          ? t(textKeys.nsglamourEquipmentUndyeable)
          : ''
    }
  })
})

function forwardReplaceEntry(slot: string, candidate: GlamourCandidate) {
  emit('replace-entry', slot, candidate)
}

function forwardClearEntry(slot: string) {
  emit('clear-entry', slot)
}

function forwardSetEntryDye(slot: string, dyeIndex: number, stain: GlamourStain) {
  emit('set-entry-dye', slot, dyeIndex, stain)
}

const authorLinks = computed(() => {
  if (template.value.authorSns.length) {
    return template.value.authorSns
  }

  if (template.value.authorUrl) {
    return [{ platform: 'website', url: template.value.authorUrl }]
  }

  return []
})
const importDialogOpen = ref(false)
const importUrl = ref('')
const importLocalStatus = ref('')
const importSubmitPending = ref(false)
const importRemoteStatusVisible = ref(false)
const settingsPanelRef = ref<{
  closeAuthorLinks: () => void
  focusTemplateSelectorButton: () => void
} | null>(null)
const equipmentPanelRef = ref<{ closeRecent: () => void } | null>(null)
const templateSelectorOpen = ref(false)
const previewEl = ref<HTMLElement | null>(null)
const importStatusMessage = computed(() => {
  if (importLocalStatus.value) {
    return importLocalStatus.value
  }

  if (importSubmitPending.value || props.busy || importRemoteStatusVisible.value) {
    return props.statusMessage
  }

  return ''
})
const importStatusTone = computed(() => {
  if (importLocalStatus.value) {
    return 'warning'
  }

  return props.statusTone
})

let previewResizeObserver: ResizeObserver | null = null
let canvasResumeRenderFrame = 0

const previewSize = reactive({ width: 0, height: 0 })
const canvasShellStyle = computed(() => {
  const canvas = templateRenderData.value.canvas
  const aspectRatio = canvas.width / canvas.height
  const style: Record<string, string> = {
    aspectRatio: `${canvas.width} / ${canvas.height}`
  }

  if (previewSize.width > 0 && previewSize.height > 0) {
    const width = Math.min(previewSize.width, previewSize.height * aspectRatio)
    const height = width / aspectRatio

    style.width = `${Math.max(1, Math.floor(width))}px`
    style.height = `${Math.max(1, Math.floor(height))}px`
  }

  return style
})
const canvasUploadLayers = computed(() => templateRenderData.value.canvas.imageSlots)
const { imageStateVersion, getTemplateImage, hasTemplateImage, setTemplateImageData } =
  useGlamourTemplateImageStore({
    templateId,
    slots: canvasUploadLayers
  })
const {
  canvasShellEl,
  imageInputEl,
  imageUploadMenuSlotId,
  activeDropSlotId,
  recentTemplateImages,
  pendingCrop,
  pendingCropSlot,
  imageUploadMenuSlot,
  getCanvasUploadLayerStyle,
  getImageUploadMenuStyle,
  openImageUploadMenu,
  closeImageUploadMenu,
  chooseImageUpload,
  handleImageInputChange,
  clearRecentTemplateImages,
  useRecentTemplateImage,
  formatRecentTemplateImageTime,
  applyImageCrop,
  closeImageCropper,
  handleCanvasDrag,
  handleCanvasDragLeave,
  handleCanvasDrop
} = useGlamourTemplateImageInteraction({
  renderData: templateRenderData,
  slots: canvasUploadLayers,
  currentLocale: current,
  setTemplateImageData
})
const { templateCanvasEl, drawTemplateCanvas, downloadTemplateCanvas } = useGlamourTemplateCanvas({
  renderData: templateRenderData,
  apiBase: computed(() => props.apiBase),
  imageStateVersion,
  resolveImage: getTemplateImage
})

watch(
  () => props.busy,
  (busy, wasBusy) => {
    if (busy || !wasBusy || !importSubmitPending.value) {
      return
    }

    importSubmitPending.value = false

    if (props.statusTone === 'danger' || props.statusTone === 'warning' || props.statusMessage) {
      importRemoteStatusVisible.value = true
      return
    }

    importRemoteStatusVisible.value = false
    closeImportDialog()
  }
)

function openTemplateSelector() {
  closeFloatingTemplatePanels()
  templateSelectorOpen.value = true
}

function closeTemplateSelector() {
  if (!templateSelectorOpen.value) {
    return
  }

  templateSelectorOpen.value = false

  void nextTick(() => {
    settingsPanelRef.value?.focusTemplateSelectorButton()
  })
}

function selectTemplate(nextTemplateId: GlamourTemplateId) {
  closeFloatingTemplatePanels()
  closeTemplateSelector()
  setTemplateId(nextTemplateId)
}

function openImportDialog() {
  closeFloatingTemplatePanels()
  closeTemplateSelector()
  importDialogOpen.value = true
  importLocalStatus.value = ''
  importRemoteStatusVisible.value = false
}

function closeImportDialog() {
  importDialogOpen.value = false
  importLocalStatus.value = ''
  importSubmitPending.value = false
  importRemoteStatusVisible.value = false
}

function submitImport() {
  const url = normalizeGlamourLinkUrl(importUrl.value)

  if (!url) {
    importLocalStatus.value = t(textKeys.nsglamourStatusLinkRequired)
    return
  }

  if (!isSupportedGlamourLinkUrl(url)) {
    importLocalStatus.value = t(textKeys.nsglamourStatusUnsupportedLink)
    return
  }

  importLocalStatus.value = ''
  importSubmitPending.value = true
  importRemoteStatusVisible.value = false
  emit('import-link', {
    url,
    importMode: 'template-link',
    preferredLocale: templateImportPreferredLocale.value
  })
}

function closeFloatingTemplatePanels() {
  closeImageUploadMenu()
  settingsPanelRef.value?.closeAuthorLinks()
  equipmentPanelRef.value?.closeRecent()
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node

  if (canvasShellEl.value && !canvasShellEl.value.contains(target)) {
    closeImageUploadMenu()
  }
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return
  }

  if (pendingCrop.value) {
    closeImageCropper()
    return
  }

  if (templateSelectorOpen.value) {
    closeTemplateSelector()
    return
  }

  if (imageUploadMenuSlotId.value) {
    closeImageUploadMenu()
    return
  }

  if (importDialogOpen.value) {
    closeImportDialog()
  }
}

function updatePreviewSize() {
  const preview = previewEl.value

  if (!preview) {
    previewSize.width = 0
    previewSize.height = 0
    return
  }

  const rect = preview.getBoundingClientRect()
  const style = window.getComputedStyle(preview)
  const horizontalPadding =
    Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
  const verticalPadding =
    Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)

  previewSize.width = Math.max(0, rect.width - horizontalPadding)
  previewSize.height = Math.max(0, rect.height - verticalPadding)
}

function redrawTemplateCanvasAfterPageResume() {
  if (document.hidden) {
    return
  }

  if (canvasResumeRenderFrame) {
    window.cancelAnimationFrame(canvasResumeRenderFrame)
  }

  canvasResumeRenderFrame = window.requestAnimationFrame(() => {
    canvasResumeRenderFrame = 0
    updatePreviewSize()
    void drawTemplateCanvas()
  })
}

function observePreviewSize() {
  updatePreviewSize()

  if (!previewEl.value || typeof ResizeObserver === 'undefined') {
    return
  }

  previewResizeObserver = new ResizeObserver(updatePreviewSize)
  previewResizeObserver.observe(previewEl.value)
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  document.addEventListener('visibilitychange', redrawTemplateCanvasAfterPageResume)
  window.addEventListener('pageshow', redrawTemplateCanvasAfterPageResume)
  window.addEventListener('focus', redrawTemplateCanvasAfterPageResume)
  window.addEventListener('nsglamour:header-popover-open', closeFloatingTemplatePanels)
  observePreviewSize()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  document.removeEventListener('visibilitychange', redrawTemplateCanvasAfterPageResume)
  window.removeEventListener('pageshow', redrawTemplateCanvasAfterPageResume)
  window.removeEventListener('focus', redrawTemplateCanvasAfterPageResume)
  window.removeEventListener('nsglamour:header-popover-open', closeFloatingTemplatePanels)
  if (canvasResumeRenderFrame) {
    window.cancelAnimationFrame(canvasResumeRenderFrame)
    canvasResumeRenderFrame = 0
  }
  previewResizeObserver?.disconnect()
})
</script>

<style src="../styles/template-workspace.css"></style>
