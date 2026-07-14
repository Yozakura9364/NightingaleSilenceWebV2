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
      <section
        class="nsglamour-template__section ns-workbench-panel ns-workbench-panel--compact ns-workbench-panel--solid"
      >
        <div class="nsglamour-template__bar-title ns-workbench-panel__title">
          {{ t(textKeys.nsglamourTemplateSettings) }}
        </div>

        <div class="nsglamour-template__meta" :aria-label="t(textKeys.nsglamourTemplateAuthor)">
          <div ref="authorLinksRootEl" class="nsglamour-template__author">
            <span>{{ t(textKeys.nsglamourTemplateAuthor) }}</span>
            <button
              type="button"
              class="nsglamour-template__author-button"
              :aria-label="t(textKeys.nsglamourTemplateAuthorLinks)"
              aria-haspopup="dialog"
              :aria-expanded="authorLinksOpen ? 'true' : 'false'"
              @click.stop="toggleAuthorLinks"
            >
              {{ template.author }}
            </button>

            <div
              v-if="authorLinksOpen"
              class="nsglamour-template__author-popover"
              role="dialog"
              :aria-label="t(textKeys.nsglamourTemplateAuthorLinks)"
              @click.stop
            >
              <a
                v-for="item in authorLinks"
                :key="`${item.platform}:${item.url}`"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ getAuthorPlatformLabel(item.platform) }}
              </a>
            </div>
          </div>
          <div class="nsglamour-template__meta-actions">
            <button
              ref="templateSelectorOpenButton"
              type="button"
              class="nsglamour-template__secondary ns-compact-action"
              @click="openTemplateSelector"
            >
              {{ t(textKeys.nsglamourTemplateChange) }}
            </button>
            <button
              type="button"
              class="nsglamour-template__secondary ns-compact-action"
              @click="downloadTemplateCanvas"
            >
              {{ t(textKeys.nsglamourTemplateSaveImage) }}
            </button>
          </div>
        </div>

        <label v-if="template.controls.title" class="nsglamour-template__field">
          <span>{{ t(textKeys.nsglamourTemplateTitleText) }}</span>
          <input
            class="nsglamour-template__input"
            type="text"
            spellcheck="false"
            :value="templateSettings.topText"
            @input="updateTopText"
          />
        </label>

        <label v-if="template.controls.characterName" class="nsglamour-template__field">
          <span>{{ t(textKeys.nsglamourTemplateCharacterName) }}</span>
          <input
            class="nsglamour-template__input"
            type="text"
            spellcheck="false"
            :value="templateSettings.characterName"
            @input="updateCharacterName"
          />
        </label>

        <label v-if="template.controls.ecSubtitle" class="nsglamour-template__field">
          <span>{{ t(textKeys.nsglamourTemplateNameWorld) }}</span>
          <div
            class="nsglamour-template__subtitle-grid"
            :aria-label="t(textKeys.nsglamourTemplateNameWorld)"
          >
            <input
              class="nsglamour-template__input"
              type="text"
              spellcheck="false"
              :placeholder="t(textKeys.nsglamourTemplateName)"
              :value="templateSettings.ecSubtitleLeftText"
              @input="updateEcSubtitleLeft"
            />
            <input
              class="nsglamour-template__input nsglamour-template__input--symbol"
              type="text"
              spellcheck="false"
              maxlength="4"
              :aria-label="t(textKeys.nsglamourTemplateSymbol)"
              :value="templateSettings.ecSubtitleSymbolText"
              @input="updateEcSubtitleSymbol"
            />
            <input
              class="nsglamour-template__input"
              type="text"
              spellcheck="false"
              :placeholder="t(textKeys.nsglamourTemplateWorld)"
              :value="templateSettings.ecSubtitleRightText"
              @input="updateEcSubtitleRight"
            />
          </div>
        </label>

        <div v-if="template.controls.dyeFrame" class="nsglamour-template__segmented">
          <button
            type="button"
            :class="{ active: templateSettings.dyeFrameMode === 'psd' }"
            @click="setDyeFrameMode('psd')"
          >
            {{ t(textKeys.nsglamourTemplateDyeStyleOne) }}
          </button>
          <button
            type="button"
            :class="{ active: templateSettings.dyeFrameMode === 'color' }"
            @click="setDyeFrameMode('color')"
          >
            {{ t(textKeys.nsglamourTemplateDyeStyleTwo) }}
          </button>
        </div>
      </section>

      <section
        class="nsglamour-template__section ns-workbench-panel ns-workbench-panel--compact ns-workbench-panel--solid"
      >
        <div class="nsglamour-template__section-title-row ns-workbench-panel__header">
          <div class="nsglamour-template__bar-title ns-workbench-panel__title">
            {{ t(textKeys.nsglamourTemplateEquipmentData) }}
          </div>
          <div class="nsglamour-template__section-actions">
            <div ref="recentRootEl" class="nsglamour-template__recent">
              <button
                type="button"
                class="nsglamour-template__recent-button ns-icon-button"
                :title="t(textKeys.nsglamourRecentPanel)"
                :aria-label="t(textKeys.nsglamourRecentPanel)"
                aria-haspopup="dialog"
                :aria-expanded="recentOpen ? 'true' : 'false'"
                @click.stop="toggleRecent"
              >
                <img :src="recentIconUrl" alt="" aria-hidden="true" />
              </button>

              <NSGlamourRecentPanel
                v-if="recentOpen"
                class="nsglamour-template__recent-panel"
                variant="popover"
                :items="recentItems"
                :disabled="busy"
                :default-name="recentDefaultName"
                :show-save="false"
                @restore="restoreRecent"
                @delete="emit('delete-recent', $event)"
                @clear="emit('clear-recent')"
              />
            </div>
            <button
              type="button"
              class="nsglamour-template__secondary ns-compact-action"
              @click="openImportDialog"
            >
              {{ t(textKeys.nsglamourTemplateImportLink) }}
            </button>
            <button
              type="button"
              class="nsglamour-template__secondary ns-compact-action"
              :disabled="busy"
              @click="emit('clear-draft')"
            >
              {{ t(textKeys.nsglamourTemplateClearDraft) }}
            </button>
          </div>
        </div>

        <div
          class="nsglamour-template__language-controls"
          :aria-label="t(textKeys.nsglamourTemplateLayoutLanguage)"
        >
          <button
            v-for="option in orderedLanguageOptions"
            :key="option.id"
            type="button"
            :class="{
              active: isLanguageOptionActive(option.locales),
              current: isLanguageOptionCurrent(option.locales)
            }"
            :title="getLanguageOptionTitle(option.locales)"
            @click="toggleTemplateLocale(option)"
          >
            {{ option.label }}
          </button>
        </div>

        <NSGlamourTemplateEquipmentEditor
          :rows="editorRows"
          :draft="draft"
          :api-base="apiBase"
          :editor-locale="editorLocale"
          :search-items="searchItems"
          :load-stains="loadStains"
          @replace-entry="forwardReplaceEntry"
          @clear-entry="forwardClearEntry"
          @set-entry-dye="forwardSetEntryDye"
        />
      </section>
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
import recentIconUrl from '@/assets/icons/pixelarticons/clock.svg'
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
  GlamourLocale,
  GlamourRecentSnapshot,
  GlamourStain
} from '@/lib/glamour/types'
import { GLAMOUR_TEMPLATE_SLOT_ORDER, type GlamourTemplateId } from '@/lib/glamour/templates'
import NSGlamourRecentPanel from '@/pages/glamour/components/NSGlamourRecentPanel.vue'
import NSGlamourTemplateEquipmentEditor from '@/pages/glamour/components/NSGlamourTemplateEquipmentEditor.vue'
import { useGlamourTemplateCanvas } from '@/pages/glamour/composables/useGlamourTemplateCanvas'
import { useGlamourTemplateImageInteraction } from '@/pages/glamour/composables/useGlamourTemplateImageInteraction'
import { useGlamourTemplateImageStore } from '@/pages/glamour/composables/useGlamourTemplateImageStore'
import { useGlamourTemplateWorkspace } from '@/pages/glamour/composables/useGlamourTemplateWorkspace'
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
  searchItems: (options: {
    slot: string
    query: string
    locale: string
    limit?: number
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
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

const localeLabels: Record<string, string> = {
  zh: 'chs',
  ja: 'ja',
  en: 'en',
  ko: 'ko',
  tc: 'tc',
  fr: 'fr',
  de: 'de'
}

const templateImportPreferredLocale = computed(() => {
  const uiLocale = current.value === 'zh-CN' ? 'zh' : current.value

  if (template.value.localeOrder.includes(uiLocale as GlamourLocale)) {
    return uiLocale
  }

  if (template.value.languageOptions?.length) {
    return template.value.languageOptions[0].locales[0] || template.value.defaultLocale
  }

  return template.value.defaultLocale
})
const templateLanguageDisplayOrder: GlamourLocale[] = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']
const templateLanguageDisplayRank = new Map(
  templateLanguageDisplayOrder.map((locale, index) => [locale, index])
)

function getTemplateLanguageRank(locales: GlamourLocale[]): number {
  return templateLanguageDisplayRank.get(locales[0]) ?? Number.MAX_SAFE_INTEGER
}

function sortTemplateLanguageOptions<T extends { locales: GlamourLocale[] }>(options: T[]): T[] {
  return options
    .map((option, index) => ({ option, index }))
    .sort(
      (left, right) =>
        getTemplateLanguageRank(left.option.locales) -
          getTemplateLanguageRank(right.option.locales) || left.index - right.index
    )
    .map((entry) => entry.option)
}

const hasTemplateLanguageOptions = computed(() => Boolean(template.value.languageOptions?.length))
const isSingleTemplateLanguageMode = computed(
  () => !hasTemplateLanguageOptions.value && template.value.localeOrder.length <= 1
)
const languageOptions = computed(() => {
  if (template.value.languageOptions?.length) {
    return template.value.languageOptions
  }

  return template.value.localeOrder.map((locale) => ({
    id: locale,
    label: localeLabels[locale] || locale,
    locales: [locale]
  }))
})
const orderedLanguageOptions = computed(() => {
  return sortTemplateLanguageOptions(languageOptions.value)
})
const editorLocale = computed(() => activeLocale.value || props.draft.locale)
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

watch(
  activeLocale,
  (locale) => {
    if (locale && props.draft.locale !== locale) {
      emit('update-locale', locale)
    }
  },
  { immediate: true }
)
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
const recentRootEl = ref<HTMLElement | null>(null)
const recentOpen = ref(false)
const authorLinksRootEl = ref<HTMLElement | null>(null)
const authorLinksOpen = ref(false)
const templateSelectorOpenButton = ref<HTMLButtonElement | null>(null)
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

function getInputValue(event: Event): string {
  return (event.currentTarget as HTMLInputElement).value
}

function updateTopText(event: Event) {
  updateTemplateSettings({ topText: getInputValue(event) })
}

function updateCharacterName(event: Event) {
  updateTemplateSettings({ characterName: getInputValue(event) })
}

function updateEcSubtitleLeft(event: Event) {
  updateTemplateSettings({ ecSubtitleLeftText: getInputValue(event), ecSubtitleTouched: true })
}

function updateEcSubtitleSymbol(event: Event) {
  updateTemplateSettings({ ecSubtitleSymbolText: getInputValue(event), ecSubtitleTouched: true })
}

function updateEcSubtitleRight(event: Event) {
  updateTemplateSettings({ ecSubtitleRightText: getInputValue(event), ecSubtitleTouched: true })
}

function setDyeFrameMode(dyeFrameMode: 'psd' | 'color') {
  updateTemplateSettings({ dyeFrameMode })
}

function isLanguageOptionActive(locales: GlamourLocale[]): boolean {
  return (
    locales.length === selectedLocales.value.length &&
    locales.every((locale, index) => selectedLocales.value[index] === locale)
  )
}

function isLanguageOptionCurrent(locales: GlamourLocale[]): boolean {
  return Boolean(locales.length && activeLocale.value === locales[0])
}

function getLanguageOptionTitle(locales: GlamourLocale[]): string {
  if (isSingleTemplateLanguageMode.value) {
    return isLanguageOptionCurrent(locales)
      ? t(textKeys.nsglamourTemplateLanguageCurrentEdit)
      : t(textKeys.nsglamourTemplateLayoutLanguage)
  }

  if (
    isLanguageOptionActive(locales) ||
    locales.some((locale) => selectedLocales.value.includes(locale))
  ) {
    return isLanguageOptionCurrent(locales)
      ? t(textKeys.nsglamourTemplateLanguageCurrentEdit)
      : t(textKeys.nsglamourTemplateLanguageOutput)
  }

  return t(textKeys.nsglamourTemplateLayoutLanguage)
}

function normalizeSupportedTemplateLocales(locales: GlamourLocale[]): GlamourLocale[] {
  const supported = new Set(template.value.localeOrder)
  return Array.from(new Set(locales.filter((locale) => supported.has(locale))))
}

function setNormalizedTemplateLocales(locales: GlamourLocale[]): GlamourLocale[] {
  const next = normalizeSupportedTemplateLocales(locales)

  if (!next.length) {
    return []
  }

  setTemplateLocales(next)
  return next
}

function setTemplateActiveLocale(locale: GlamourLocale) {
  if (!template.value.localeOrder.includes(locale)) {
    return
  }

  emit('update-locale', locale)
}

function toggleTemplateLocale(option: { locales: GlamourLocale[] }) {
  const locale = option.locales[0]

  if (!locale) {
    return
  }

  if (hasTemplateLanguageOptions.value || isSingleTemplateLanguageMode.value) {
    const next = setNormalizedTemplateLocales([...option.locales])
    const nextActiveLocale = next[0] || locale
    setTemplateActiveLocale(nextActiveLocale)
    return
  }

  const selected = [...selectedLocales.value]
  const selectedIndex = selected.indexOf(locale)

  if (selectedIndex < 0) {
    const next = setNormalizedTemplateLocales([...selected, locale])
    const nextActiveLocale = next.includes(locale) ? locale : next[0]
    if (nextActiveLocale) {
      setTemplateActiveLocale(nextActiveLocale)
    }
    return
  }

  if (activeLocale.value !== locale) {
    setTemplateActiveLocale(locale)
    return
  }

  if (selected.length > 1) {
    const next = setNormalizedTemplateLocales(selected.filter((item) => item !== locale))
    if (next[0]) {
      setTemplateActiveLocale(next[0])
    }
  }
}

function getAuthorPlatformLabel(platform: string): string {
  const platformKeys: Record<string, string> = {
    website: textKeys.nsglamourTemplateAuthorWebsite,
    weibo: textKeys.nsglamourTemplateAuthorWeibo,
    xiaohongshu: textKeys.nsglamourTemplateAuthorXiaohongshu,
    douyin: textKeys.nsglamourTemplateAuthorDouyin
  }

  const labelKey = platformKeys[platform]
  return labelKey ? t(labelKey) : platform
}

function toggleAuthorLinks() {
  closeRecent()
  authorLinksOpen.value = !authorLinksOpen.value
}

function closeAuthorLinks() {
  authorLinksOpen.value = false
}

function openTemplateSelector() {
  closeRecent()
  closeAuthorLinks()
  templateSelectorOpen.value = true
}

function closeTemplateSelector() {
  if (!templateSelectorOpen.value) {
    return
  }

  templateSelectorOpen.value = false

  void nextTick(() => {
    templateSelectorOpenButton.value?.focus()
  })
}

function selectTemplate(nextTemplateId: GlamourTemplateId) {
  closeAuthorLinks()
  closeTemplateSelector()
  setTemplateId(nextTemplateId)
}

function openImportDialog() {
  closeRecent()
  closeAuthorLinks()
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

function toggleRecent() {
  recentOpen.value = !recentOpen.value
}

function closeRecent() {
  recentOpen.value = false
}

function closeFloatingTemplatePanels() {
  closeImageUploadMenu()
  closeRecent()
  closeAuthorLinks()
}

function restoreRecent(item: GlamourRecentSnapshot) {
  emit('restore-recent', item)
  closeRecent()
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node

  if (canvasShellEl.value && !canvasShellEl.value.contains(target)) {
    closeImageUploadMenu()
  }

  if (recentRootEl.value && !recentRootEl.value.contains(target)) {
    closeRecent()
  }

  if (authorLinksRootEl.value && !authorLinksRootEl.value.contains(target)) {
    closeAuthorLinks()
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

  if (authorLinksOpen.value) {
    closeAuthorLinks()
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

<style scoped>
.nsglamour-template {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
  gap: 14px;
  width: min(1540px, 100%);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: 14px;
  background: transparent;
}

.nsglamour-template__preview,
.nsglamour-template__config {
  min-height: 0;
}

.nsglamour-template__preview {
  display: grid;
  place-items: center;
  padding: 16px;
  border: 0;
  background: var(--ns-glamour-template-preview-bg);
  overflow: hidden;
}

.nsglamour-template__canvas-shell {
  position: relative;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  border: 1px solid rgba(42, 33, 56, 0.16);
  background: #fff;
  box-shadow: none;
}

.nsglamour-template__canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: auto;
}

.nsglamour-template__canvas-upload-layer {
  position: absolute;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 1px dashed rgba(20, 28, 45, 0.22);
  background: rgba(255, 255, 255, 0.2);
  color: rgba(20, 28, 45, 0.7);
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.nsglamour-template__canvas-upload-layer span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: min(90%, 150px);
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.nsglamour-template__canvas-upload-layer:hover,
.nsglamour-template__canvas-upload-layer.dragover {
  border-color: rgba(82, 113, 255, 0.72);
  background: rgba(82, 113, 255, 0.08);
  color: #263a8f;
}

.nsglamour-template__canvas-upload-layer.has-image {
  background: transparent;
  color: transparent;
}

.nsglamour-template__canvas-upload-layer.has-image span {
  opacity: 0;
}

.nsglamour-template__canvas-upload-layer.has-image:hover,
.nsglamour-template__canvas-upload-layer.has-image.dragover {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(20, 28, 45, 0.72);
}

.nsglamour-template__canvas-upload-layer.has-image:hover span,
.nsglamour-template__canvas-upload-layer.has-image.dragover span {
  opacity: 1;
}

.nsglamour-template__image-menu {
  position: absolute;
  z-index: 20;
  display: grid;
  gap: 8px;
  width: min(280px, calc(100% - 16px));
  max-height: min(330px, calc(100% - 16px));
  overflow: hidden;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  box-shadow: 0 14px 28px rgba(20, 28, 45, 0.16);
}

.nsglamour-template__image-menu-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.nsglamour-template__image-menu-actions button {
  min-height: 28px;
  padding: 3px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.nsglamour-template__image-menu-actions button:hover,
.nsglamour-template__image-menu-actions button:focus {
  border-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template__image-menu-title,
.nsglamour-template__image-menu-empty {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsglamour-template__recent-images {
  display: grid;
  gap: 6px;
  max-height: 230px;
  overflow-y: auto;
}

.nsglamour-template__recent-image {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 5px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.nsglamour-template__recent-image:hover,
.nsglamour-template__recent-image:focus {
  border-color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template__recent-image img {
  display: block;
  width: 44px;
  height: 44px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  object-fit: cover;
}

.nsglamour-template__recent-image span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.nsglamour-template__recent-image strong,
.nsglamour-template__recent-image small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__recent-image strong {
  font-size: 12px;
}

.nsglamour-template__recent-image small {
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsglamour-template__config {
  display: grid;
  align-content: start;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
}

.nsglamour-template__meta,
.nsglamour-template__section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.nsglamour-template__author {
  position: relative;
  display: inline-flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0;
  min-width: 0;
}

.nsglamour-template__meta-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  justify-content: flex-end;
  margin-left: auto;
}

.nsglamour-template__author > span {
  min-width: 0;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__author-button {
  min-width: 0;
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.nsglamour-template__author-button:hover,
.nsglamour-template__author-button:focus {
  border-bottom-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template__author-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 12;
  display: flex;
  gap: 8px;
  min-width: max-content;
  padding: 8px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  box-shadow: 0 10px 24px rgba(20, 28, 45, 0.12);
}

.nsglamour-template__author-popover a {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 3px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.nsglamour-template__author-popover a:hover,
.nsglamour-template__author-popover a:focus {
  border-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template__section-actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.nsglamour-template__recent {
  position: static;
  display: inline-flex;
  align-self: center;
}

.nsglamour-template__recent-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
}

.nsglamour-template__recent-button img {
  display: block;
  width: 18px;
  height: 18px;
  filter: var(--ns-pixel-icon-filter);
}

.nsglamour-template__recent-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  width: min(320px, calc(100vw - 48px));
}

.nsglamour-template__field {
  display: grid;
  gap: 6px;
  min-width: 0;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 700;
}

.nsglamour-template__input,
.nsglamour-template__select {
  box-sizing: border-box;
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  font-weight: 400;
}

.nsglamour-template__select {
  width: min(180px, 100%);
  appearance: auto;
}

.nsglamour-template__input:focus,
.nsglamour-template__select:focus {
  outline: auto;
}

.nsglamour-template__subtitle-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr);
  gap: 6px;
}

.nsglamour-template__input--symbol {
  text-align: center;
}

.nsglamour-template__segmented,
.nsglamour-template__language-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.nsglamour-template__language-controls {
  flex-wrap: nowrap;
  gap: 6px;
}

.nsglamour-template__segmented button,
.nsglamour-template__language-controls button {
  min-height: 36px;
  padding: 5px 12px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  line-height: 1;
  box-shadow: var(--ns-pixel-button-shadow);
  cursor: pointer;
  transition: none;
}

.nsglamour-template__segmented button {
  min-width: 104px;
}

.nsglamour-template__language-controls button {
  min-width: 42px;
  padding-inline: 8px;
  text-transform: lowercase;
}

.nsglamour-template__segmented button:hover,
.nsglamour-template__segmented button:focus-visible,
.nsglamour-template__language-controls button:hover,
.nsglamour-template__language-controls button:focus-visible {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
  box-shadow: var(--ns-pixel-button-shadow-hover);
  outline: none;
  transform: translate(-1px, -1px);
}

.nsglamour-template__segmented button.active,
.nsglamour-template__language-controls button.active,
.nsglamour-template__language-controls button.current {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-pink-surface);
  color: var(--ns-color-accent-strong);
  box-shadow: var(--ns-pixel-button-shadow);
}

.nsglamour-template__language-controls button.current {
  background: var(--ns-pixel-cyan-surface);
}

.nsglamour-template__segmented button:active,
.nsglamour-template__language-controls button:active {
  box-shadow: var(--ns-pixel-soft-shadow);
  transform: translate(2px, 2px);
}

@media (max-width: 1080px) {
  .nsglamour-template {
    grid-template-columns: 1fr;
    height: auto;
  }

  .nsglamour-template__config {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .nsglamour-template__preview {
    padding: 8px;
  }

  .nsglamour-template__canvas-upload-layer span {
    max-width: min(90%, 110px);
    min-height: 26px;
    padding: 5px 9px;
    font-size: 12px;
  }

  .nsglamour-template__meta,
  .nsglamour-template__section-title-row {
    align-items: stretch;
    flex-direction: column;
  }

  .nsglamour-template__meta-actions {
    margin-left: 0;
  }
}
</style>
