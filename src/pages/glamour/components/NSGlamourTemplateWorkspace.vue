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

        <div class="nsglamour-template__editor">
          <article v-for="row in editorRows" :key="row.slot" class="nsglamour-template__row">
            <h3>{{ row.slotName }}</h3>
            <div
              class="nsglamour-template__item"
              :class="{ 'nsglamour-template__item--search': !row.itemName }"
            >
              <template v-if="row.itemName">
                <img
                  v-if="row.iconUrl"
                  class="nsglamour-template__item-icon"
                  :src="row.iconUrl"
                  :alt="row.itemName"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <div class="nsglamour-template__item-body">
                  <strong>{{ row.itemName }}</strong>
                  <div v-if="row.dyeEntries.length" class="nsglamour-template__dye-controls">
                    <div
                      v-for="(dye, dyeIndex) in row.dyeEntries"
                      :key="`${row.slot}-${dyeIndex}`"
                      class="nsglamour-template__dye-select"
                    >
                      <button
                        type="button"
                        class="nsglamour-template__dye-chip"
                        :class="{ 'empty-dye': isNoDye(dye) }"
                        :style="{ '--nsglamour-dye-color': getDyeColor(dye) }"
                        :title="getDyeTitle(dyeIndex, row.dyeEntries.length)"
                        :aria-label="getDyeTitle(dyeIndex, row.dyeEntries.length)"
                        @click.stop="toggleDyePicker(row, dyeIndex)"
                      >
                        {{ getDyeEntryLabel(dye) }}
                      </button>

                      <div
                        v-if="isDyePickerActive(row, dyeIndex)"
                        class="nsglamour-template__dye-panel"
                        @click.stop
                      >
                        <input
                          type="search"
                          class="nsglamour-template__dye-search"
                          :value="getDyeSearchQuery(row.slot, dyeIndex)"
                          :placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
                          spellcheck="false"
                          autocomplete="off"
                          @input="updateDyeSearch(row.slot, dyeIndex, $event)"
                        />
                        <div class="nsglamour-template__dye-results">
                          <div
                            v-for="group in getDyeGroups(row.slot, dyeIndex)"
                            :key="group.key"
                            class="nsglamour-template__dye-group"
                          >
                            <div v-if="group.label" class="nsglamour-template__dye-group-title">
                              {{ group.label }}
                            </div>
                            <button
                              v-for="stain in group.items"
                              :key="stain.id"
                              type="button"
                              class="nsglamour-template__dye-option"
                              :style="{ '--nsglamour-dye-color': stain.hex || '#000000' }"
                              @click="selectDye(row, dyeIndex, stain)"
                            >
                              <span
                                class="nsglamour-template__dye-swatch"
                                aria-hidden="true"
                              ></span>
                              <span>{{ getStainName(stain) }}</span>
                            </button>
                          </div>
                          <div v-if="isDyeLoading()" class="nsglamour-template__dye-empty">
                            {{ t(textKeys.nsglamourEquipmentDyeLoading) }}
                          </div>
                          <div v-else-if="isDyeFailed()" class="nsglamour-template__dye-empty">
                            {{ t(textKeys.nsglamourEquipmentDyeLoadError) }}
                          </div>
                          <div
                            v-else-if="shouldShowDyeEmpty(row.slot, dyeIndex)"
                            class="nsglamour-template__dye-empty"
                          >
                            {{ t(textKeys.nsglamourEquipmentDyeSearchEmpty) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <small v-else-if="row.dyeStatusText">{{ row.dyeStatusText }}</small>
                </div>
                <button
                  type="button"
                  class="nsglamour-template__delete"
                  :title="t(textKeys.nsglamourEquipmentDelete)"
                  :aria-label="t(textKeys.nsglamourEquipmentDelete)"
                  @click="clearEditorEntry(row)"
                >
                  {{ t(textKeys.nsglamourEquipmentDeleteSymbol) }}
                </button>
              </template>

              <div v-else class="nsglamour-template__search">
                <input
                  class="nsglamour-template__input"
                  type="search"
                  spellcheck="false"
                  :placeholder="t(textKeys.nsglamourEquipmentSearchPlaceholder)"
                  :value="getSearchQuery(row.slot)"
                  @input="updateSearch(row, $event)"
                />
                <div
                  v-if="shouldShowSearchPanel(row.slot)"
                  class="nsglamour-template__search-results"
                >
                  <button
                    v-for="candidate in getSearchResults(row.slot)"
                    :key="getSearchResultKey(candidate)"
                    type="button"
                    class="nsglamour-template__search-result"
                    @click="selectSearchResult(row, candidate)"
                  >
                    <img
                      v-if="buildSearchIconUrl(candidate)"
                      :src="buildSearchIconUrl(candidate)"
                      :alt="getSearchCandidateName(candidate)"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                    />
                    <span>{{ getSearchCandidateName(candidate) }}</span>
                  </button>
                  <div
                    v-if="shouldShowSearchEmpty(row.slot)"
                    class="nsglamour-template__search-empty"
                  >
                    {{ t(textKeys.nsglamourEquipmentSearchEmpty) }}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
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
  getDyeEntryName,
  getSelectedCandidate,
  getSlotTitle,
  groupGlamourStains,
  isNoDyeEntry,
  makeEmptyEquipmentEntry,
  resolveLocalized,
  stainMatchesQuery
} from '@/lib/glamour/equipment'
import { isSupportedGlamourLinkUrl, normalizeGlamourLinkUrl } from '@/lib/glamour/links'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeEntry,
  GlamourLocale,
  GlamourRecentSnapshot,
  GlamourStain,
  GlamourStainGroup,
  GlamourSlotKey
} from '@/lib/glamour/types'
import {
  GLAMOUR_TEMPLATE_RECENT_IMAGE_LIMIT,
  GLAMOUR_TEMPLATE_SLOT_ORDER,
  clearGlamourTemplateRecentImages as clearStoredGlamourTemplateRecentImages,
  drawGlamourTemplateImageCover,
  findGlamourTemplateImageSessionRecord,
  getGlamourTemplateEquivalentImageSlotIds,
  isGlamourTemplatePersistentImageUrl,
  loadGlamourTemplateImageStoreRecords,
  loadGlamourTemplateRecentImages,
  saveGlamourTemplateRecentImage,
  saveGlamourTemplateImageStoreSlot,
  type GlamourTemplateId,
  type GlamourTemplateImageSlot,
  type GlamourTemplateRecentImageRecord,
  writeGlamourTemplateImageSessionSlot
} from '@/lib/glamour/templates'
import NSGlamourRecentPanel from '@/pages/glamour/components/NSGlamourRecentPanel.vue'
import { useGlamourTemplateCanvas } from '@/pages/glamour/composables/useGlamourTemplateCanvas'
import { useGlamourTemplateWorkspace } from '@/pages/glamour/composables/useGlamourTemplateWorkspace'
import type { TemplateImageCropRequest } from '@/pages/glamour/types/templateWorkspace'
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
const editorRows = computed<TemplateEditorRow[]>(() => {
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
const canvasShellEl = ref<HTMLElement | null>(null)
const imageInputEl = ref<HTMLInputElement | null>(null)
const imageUploadMenuSlotId = ref('')
const activeImageSlotId = ref('')
const activeDropSlotId = ref('')
const imageStateVersion = ref(0)
const templateImages = reactive<Record<string, TemplateCanvasImage>>({})
const templateImagesById: Record<string, Record<string, TemplateCanvasImage>> = {}
const recentTemplateImages = ref<GlamourTemplateRecentImageRecord[]>([])
const pendingCrop = ref<TemplateImageCropRequest | null>(null)
const pendingCropQueue: TemplateImageCropRequest[] = []
const searchQueries = reactive<Record<string, string>>({})
const searchResults = reactive<Record<string, GlamourCandidate[]>>({})
const searchTouched = reactive<Record<string, boolean>>({})
const searchBusy = reactive<Record<string, boolean>>({})
const searchTimers = new Map<string, number>()
const activeDyePicker = ref<{ slot: string; index: number } | null>(null)
const stainLists = reactive<Record<string, GlamourStain[]>>({})
const stainLoading = reactive<Record<string, boolean>>({})
const stainFailed = reactive<Record<string, boolean>>({})
const dyeSearchQueries = reactive<Record<string, string>>({})
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

interface TemplateEditorRow {
  slot: GlamourSlotKey
  slotName: string
  itemName: string
  iconUrl: string
  dyeEntries: GlamourDyeEntry[]
  dyeStatusText: string
}

interface TemplateCanvasImage {
  image: HTMLImageElement
  imageUrl: string
  name: string
  sourceUrl: string
  sourceName: string
  backupOnly: boolean
}

let templateImageSyncTaskId = 0
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
const pendingCropSlot = computed(() =>
  pendingCrop.value
    ? canvasUploadLayers.value.find((slot) => slot.id === pendingCrop.value?.slotId) || null
    : null
)
const imageUploadMenuSlot = computed(
  () => canvasUploadLayers.value.find((slot) => slot.id === imageUploadMenuSlotId.value) || null
)
const { templateCanvasEl, drawTemplateCanvas, downloadTemplateCanvas } = useGlamourTemplateCanvas({
  renderData: templateRenderData,
  apiBase: computed(() => props.apiBase),
  imageStateVersion,
  resolveImage: getTemplateImage
})

watch(
  () => templateId.value,
  (nextTemplateId, previousTemplateId) => {
    void syncTemplateImagesForTemplate(nextTemplateId, previousTemplateId)
  },
  { immediate: true }
)

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

function getTemplateImage(slotId: string): TemplateCanvasImage | null {
  return templateImages[slotId] || null
}

function hasTemplateImage(slotId: string): boolean {
  return Boolean(getTemplateImage(slotId))
}

function getCanvasUploadLayerStyle(slot: GlamourTemplateImageSlot) {
  const rect = slot.uploadRegion || slot.region
  const canvas = templateRenderData.value.canvas

  return {
    left: `${(rect.x / canvas.width) * 100}%`,
    top: `${(rect.y / canvas.height) * 100}%`,
    width: `${(rect.width / canvas.width) * 100}%`,
    height: `${(rect.height / canvas.height) * 100}%`
  }
}

function getImageUploadMenuStyle(slot: GlamourTemplateImageSlot) {
  const rect = slot.uploadRegion || slot.region
  const canvas = templateRenderData.value.canvas
  const style: Record<string, string> = {}
  const anchorTop = rect.y + rect.height
  const anchorBottom = canvas.height - rect.y

  if (rect.x + rect.width / 2 > canvas.width / 2) {
    style.right = `${Math.max(0, ((canvas.width - rect.x - rect.width) / canvas.width) * 100)}%`
  } else {
    style.left = `${Math.max(0, (rect.x / canvas.width) * 100)}%`
  }

  if (rect.y > canvas.height * 0.58) {
    style.bottom = `${Math.max(0, (anchorBottom / canvas.height) * 100)}%`
  } else {
    style.top = `${Math.max(0, (anchorTop / canvas.height) * 100)}%`
  }

  return style
}

function openImageUploadMenu(slotId: string) {
  activeImageSlotId.value = slotId
  imageUploadMenuSlotId.value = imageUploadMenuSlotId.value === slotId ? '' : slotId
  void refreshRecentTemplateImages()
}

function closeImageUploadMenu() {
  imageUploadMenuSlotId.value = ''
}

function chooseImageUpload(slotId: string) {
  closeImageUploadMenu()
  openImagePicker(slotId)
}

function openImagePicker(slotId: string) {
  activeImageSlotId.value = slotId
  imageInputEl.value?.click()
}

function handleImageInputChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  void queueImageFiles(input.files)
  input.value = ''
}

function getImageSlotSequence(startSlotId: string): GlamourTemplateImageSlot[] {
  const slots = canvasUploadLayers.value
  const startIndex = Math.max(
    0,
    slots.findIndex((slot) => slot.id === startSlotId)
  )
  return [...slots.slice(startIndex), ...slots.slice(0, startIndex)]
}

async function queueImageFiles(
  files: FileList | File[] | null,
  targetSlotId = activeImageSlotId.value
) {
  const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'))

  if (!imageFiles.length) {
    return
  }

  const slotSequence = getImageSlotSequence(targetSlotId || canvasUploadLayers.value[0]?.id || '')

  for (const [index, file] of imageFiles.entries()) {
    const slot = slotSequence[Math.min(index, slotSequence.length - 1)]

    if (!slot) {
      return
    }

    await queueTemplateImageCrop(slot.id, file)
  }
}

async function queueTemplateImageCrop(slotId: string, file: File) {
  const imageUrl = await readFileAsDataUrl(file)

  if (!imageUrl) {
    return
  }

  const image = await loadImageFromDataUrl(imageUrl)

  if (!image) {
    return
  }

  await storeRecentTemplateImage(file, image)
  openImageCropper({
    slotId,
    image,
    imageUrl,
    imageName: file.name,
    sourceUrl: imageUrl,
    sourceName: file.name
  })
}

async function storeRecentTemplateImage(file: File, image: HTMLImageElement) {
  const thumbnailUrl = createRecentTemplateImageThumbnail(image)

  if (!thumbnailUrl) {
    return
  }

  const saved = await saveGlamourTemplateRecentImage({
    imageName: file.name,
    thumbnailUrl,
    blob: file
  })

  if (saved) {
    await refreshRecentTemplateImages()
  }
}

function createRecentTemplateImageThumbnail(image: HTMLImageElement): string {
  try {
    const output = document.createElement('canvas')
    const size = 96
    output.width = size
    output.height = size
    const ctx = output.getContext('2d')

    if (!ctx) {
      return ''
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    drawGlamourTemplateImageCover(ctx, image, 0, 0, size, size)
    return output.toDataURL('image/png')
  } catch {
    return ''
  }
}

async function refreshRecentTemplateImages() {
  recentTemplateImages.value = (await loadGlamourTemplateRecentImages()).slice(
    0,
    GLAMOUR_TEMPLATE_RECENT_IMAGE_LIMIT
  )
}

async function clearRecentTemplateImages() {
  await clearStoredGlamourTemplateRecentImages()
  recentTemplateImages.value = []
}

async function useRecentTemplateImage(slotId: string, record: GlamourTemplateRecentImageRecord) {
  closeImageUploadMenu()
  const imageUrl = await readBlobAsDataUrl(record.blob)

  if (!imageUrl) {
    return
  }

  const image = await loadImageFromDataUrl(imageUrl)

  if (!image) {
    return
  }

  openImageCropper({
    slotId,
    image,
    imageUrl,
    imageName: record.imageName,
    sourceUrl: imageUrl,
    sourceName: record.imageName
  })
}

function formatRecentTemplateImageTime(updatedAt: number): string {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) {
    return ''
  }

  return new Intl.DateTimeFormat(current.value, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(updatedAt))
}

async function setTemplateImageData(
  slotId: string,
  imageData: {
    image: HTMLImageElement
    imageUrl: string
    imageName: string
    sourceUrl: string
    sourceName: string
  }
) {
  delete templateImages[slotId]
  templateImages[slotId] = {
    image: imageData.image,
    imageUrl: imageData.imageUrl,
    name: imageData.imageName,
    sourceUrl: imageData.sourceUrl,
    sourceName: imageData.sourceName,
    backupOnly: false
  }
  writeGlamourTemplateImageSessionSlot(templateId.value, slotId, {
    imageUrl: imageData.imageUrl,
    imageName: imageData.imageName,
    sourceUrl: imageData.sourceUrl,
    sourceName: imageData.sourceName
  })
  await saveGlamourTemplateImageStoreSlot({
    templateId: templateId.value,
    slotId,
    imageUrl: imageData.imageUrl,
    imageName: imageData.imageName,
    sourceUrl: imageData.sourceUrl,
    sourceName: imageData.sourceName
  })
  saveCurrentTemplateRuntimeImages()
  imageStateVersion.value += 1
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    })
    reader.addEventListener('error', () => resolve(''))
    reader.readAsDataURL(file)
  })
}

function loadImageFromDataUrl(imageUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    if (/^https?:\/\//i.test(imageUrl)) {
      image.crossOrigin = 'anonymous'
    }
    image.decoding = 'async'
    image.addEventListener(
      'load',
      () => {
        resolve(image)
      },
      { once: true }
    )
    image.addEventListener('error', () => resolve(null), { once: true })
    image.src = imageUrl
  })
}

function normalizeDraggedImageUrl(value = ''): string {
  const firstLine = String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'))

  if (!firstLine) {
    return ''
  }

  if (/^data:image\//i.test(firstLine)) {
    return firstLine
  }

  if (/^https?:\/\//i.test(firstLine) || /^blob:/i.test(firstLine)) {
    return firstLine
  }

  return ''
}

function getDraggedData(dataTransfer: DataTransfer | null, type: string): string {
  if (!dataTransfer || typeof dataTransfer.getData !== 'function') {
    return ''
  }

  try {
    return dataTransfer.getData(type)
  } catch {
    return ''
  }
}

function getDroppedImageUrl(event: DragEvent): string {
  const dataTransfer = event.dataTransfer
  const uriList = normalizeDraggedImageUrl(getDraggedData(dataTransfer, 'text/uri-list'))

  if (uriList) {
    return uriList
  }

  return normalizeDraggedImageUrl(getDraggedData(dataTransfer, 'text/plain'))
}

function makeDroppedImageDataUrl(
  image: HTMLImageElement,
  slotId: string,
  fallbackUrl: string
): string {
  if (isGlamourTemplatePersistentImageUrl(fallbackUrl)) {
    return fallbackUrl
  }

  const slot = canvasUploadLayers.value.find((item) => item.id === slotId)
  const rect = slot?.region

  if (!rect) {
    return ''
  }

  try {
    const output = document.createElement('canvas')
    output.width = Math.max(1, Math.round(rect.width))
    output.height = Math.max(1, Math.round(rect.height))
    const ctx = output.getContext('2d')

    if (!ctx) {
      return ''
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    drawGlamourTemplateImageCover(ctx, image, 0, 0, output.width, output.height)
    return output.toDataURL('image/png')
  } catch {
    return ''
  }
}

async function setTemplateImageFromUrl(slotId: string, imageUrl: string) {
  const normalizedUrl = normalizeDraggedImageUrl(imageUrl)

  if (!normalizedUrl) {
    return
  }

  const image = await loadImageFromDataUrl(normalizedUrl)

  if (!image) {
    return
  }

  openImageCropper({
    slotId,
    image,
    imageUrl: normalizedUrl,
    imageName: '',
    sourceUrl: isGlamourTemplatePersistentImageUrl(normalizedUrl) ? normalizedUrl : '',
    sourceName: ''
  })
}

function getCropSlot(slotId: string): GlamourTemplateImageSlot | null {
  return canvasUploadLayers.value.find((slot) => slot.id === slotId) || null
}

function openImageCropper(request: TemplateImageCropRequest) {
  const slot = getCropSlot(request.slotId)

  if (!slot) {
    return
  }

  const normalizedRequest = { ...request, slotId: slot.id }

  if (pendingCrop.value) {
    pendingCropQueue.push(normalizedRequest)
    return
  }

  activeImageSlotId.value = slot.id
  closeImageUploadMenu()
  pendingCrop.value = normalizedRequest
}

async function applyImageCrop(croppedImageUrl: string) {
  const request = pendingCrop.value

  if (!request) {
    return
  }

  const imageUrl =
    croppedImageUrl || makeDroppedImageDataUrl(request.image, request.slotId, request.imageUrl)
  const image = imageUrl ? await loadImageFromDataUrl(imageUrl) : null

  if (!image || !imageUrl) {
    return
  }

  await setTemplateImageData(request.slotId, {
    image,
    imageUrl,
    imageName: request.imageName,
    sourceUrl: request.sourceUrl || request.imageUrl,
    sourceName: request.sourceName
  })
  pendingCrop.value = null

  const nextCrop = pendingCropQueue.shift()

  if (nextCrop) {
    openImageCropper(nextCrop)
  }
}

function closeImageCropper() {
  pendingCrop.value = null
  pendingCropQueue.splice(0)
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    })
    reader.addEventListener('error', () => resolve(''))
    reader.readAsDataURL(blob)
  })
}

function cloneTemplateImages(
  source: Record<string, TemplateCanvasImage>
): Record<string, TemplateCanvasImage> {
  return Object.fromEntries(
    Object.entries(source).map(([slotId, image]) => [
      slotId,
      {
        ...image
      }
    ])
  )
}

function makeCurrentTemplateImages(
  source: Record<string, TemplateCanvasImage> = {}
): Record<string, TemplateCanvasImage> {
  return Object.fromEntries(
    canvasUploadLayers.value.flatMap((slot) => {
      const image = source[slot.id]
      return image ? [[slot.id, { ...image }]] : []
    })
  ) as Record<string, TemplateCanvasImage>
}

function replaceTemplateImages(nextImages: Record<string, TemplateCanvasImage>) {
  clearTemplateImages()
  Object.entries(nextImages).forEach(([slotId, image]) => {
    templateImages[slotId] = image
  })
}

function saveCurrentTemplateRuntimeImages(targetTemplateId: string = templateId.value) {
  templateImagesById[targetTemplateId] = makeCurrentTemplateImages(templateImages)
}

function applyTemplateRuntimeImages(targetTemplateId: string) {
  replaceTemplateImages(makeCurrentTemplateImages(templateImagesById[targetTemplateId] || {}))
}

async function restoreCurrentTemplateImages(
  restoringTemplateId: string = templateId.value,
  taskId = templateImageSyncTaskId
) {
  let changed = await restoreCurrentTemplateImagesFromStore(restoringTemplateId, taskId)

  if (taskId !== templateImageSyncTaskId || templateId.value !== restoringTemplateId) {
    return changed
  }

  changed = (await restoreCurrentTemplateImagesFromSession(restoringTemplateId, taskId)) || changed

  if (changed) {
    saveCurrentTemplateRuntimeImages(restoringTemplateId)
  }

  return changed
}

async function restoreCurrentTemplateImagesFromStore(restoringTemplateId: string, taskId: number) {
  const records = await loadGlamourTemplateImageStoreRecords(restoringTemplateId)
  let changed = false

  for (const record of records) {
    const slotExists = canvasUploadLayers.value.some((slot) => slot.id === record.slotId)
    const currentImage = templateImages[record.slotId]

    if (!slotExists || (currentImage && !currentImage.backupOnly)) {
      continue
    }

    const imageUrl = record.imageUrl || (record.blob ? await readBlobAsDataUrl(record.blob) : '')

    if (!imageUrl) {
      continue
    }

    const image = await loadImageFromDataUrl(imageUrl)

    if (!image || templateId.value !== restoringTemplateId || taskId !== templateImageSyncTaskId) {
      return false
    }

    templateImages[record.slotId] = {
      image,
      imageUrl,
      name: record.imageName || record.sourceName || '',
      sourceUrl: record.sourceUrl || imageUrl,
      sourceName: record.sourceName || record.imageName || '',
      backupOnly: false
    }
    changed = true
  }

  return changed
}

async function restoreCurrentTemplateImagesFromSession(
  restoringTemplateId: string,
  taskId: number
) {
  let changed = false

  for (const slot of canvasUploadLayers.value) {
    if (templateImages[slot.id]) {
      continue
    }

    const record = findGlamourTemplateImageSessionRecord(restoringTemplateId, slot.id)

    if (!record) {
      continue
    }

    const image = await loadImageFromDataUrl(record.imageUrl)

    if (!image || templateId.value !== restoringTemplateId || taskId !== templateImageSyncTaskId) {
      return false
    }

    templateImages[slot.id] = {
      image,
      imageUrl: record.imageUrl,
      name: record.imageName || record.sourceName || '',
      sourceUrl: record.sourceUrl || record.imageUrl,
      sourceName: record.sourceName || record.imageName || '',
      backupOnly: true
    }
    changed = true
  }

  return changed
}

async function makeTemplateImageForSlotFromSource(
  slotId: string,
  sourceImage: TemplateCanvasImage
): Promise<TemplateCanvasImage | null> {
  const sourceUrl = sourceImage.sourceUrl || sourceImage.imageUrl
  const source = await loadImageFromDataUrl(sourceUrl)
  const rect = getCropSlot(slotId)?.region

  if (!source || !rect) {
    return null
  }

  const output = document.createElement('canvas')
  output.width = Math.max(1, Math.round(rect.width))
  output.height = Math.max(1, Math.round(rect.height))
  const ctx = output.getContext('2d')

  if (!ctx) {
    return null
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  drawGlamourTemplateImageCover(ctx, source, 0, 0, output.width, output.height)
  const imageUrl = output.toDataURL('image/png')
  const image = await loadImageFromDataUrl(imageUrl)

  if (!image) {
    return null
  }

  return {
    image,
    imageUrl,
    name: sourceImage.name || sourceImage.sourceName,
    sourceUrl,
    sourceName: sourceImage.sourceName || sourceImage.name,
    backupOnly: false
  }
}

async function carryTemplateImagesIntoCurrentTemplate(
  sourceImages: Record<string, TemplateCanvasImage>,
  carryingTemplateId = templateId.value,
  taskId = templateImageSyncTaskId
) {
  let changed = false

  for (const slot of canvasUploadLayers.value) {
    if (templateImages[slot.id]) {
      continue
    }

    const sourceImage = getGlamourTemplateEquivalentImageSlotIds(slot.id)
      .map((sourceSlotId) => sourceImages[sourceSlotId])
      .find(Boolean)

    if (!sourceImage) {
      continue
    }

    const nextImage = await makeTemplateImageForSlotFromSource(slot.id, sourceImage)

    if (
      !nextImage ||
      templateId.value !== carryingTemplateId ||
      taskId !== templateImageSyncTaskId
    ) {
      return false
    }

    templateImages[slot.id] = nextImage
    changed = true
  }

  if (changed) {
    saveCurrentTemplateRuntimeImages(carryingTemplateId)
  }

  return changed
}

async function syncTemplateImagesForTemplate(nextTemplateId: string, previousTemplateId?: string) {
  const taskId = ++templateImageSyncTaskId
  const previousImages = cloneTemplateImages(templateImages)

  if (previousTemplateId) {
    saveCurrentTemplateRuntimeImages(previousTemplateId)
  }

  applyTemplateRuntimeImages(nextTemplateId)
  activeImageSlotId.value = canvasUploadLayers.value[0]?.id || ''
  const restored = await restoreCurrentTemplateImages(nextTemplateId, taskId)

  if (taskId !== templateImageSyncTaskId || templateId.value !== nextTemplateId) {
    return
  }

  const carried = previousTemplateId
    ? await carryTemplateImagesIntoCurrentTemplate(previousImages, nextTemplateId, taskId)
    : false

  if (taskId !== templateImageSyncTaskId || templateId.value !== nextTemplateId) {
    return
  }

  saveCurrentTemplateRuntimeImages(nextTemplateId)

  if (restored || carried || previousTemplateId) {
    imageStateVersion.value += 1
  }
}

function clearTemplateImages() {
  Object.keys(templateImages).forEach((slotId) => {
    delete templateImages[slotId]
  })
}

function handleCanvasDrag(event: DragEvent) {
  if (!hasDraggedImage(event)) {
    return
  }

  event.dataTransfer!.dropEffect = 'copy'
  activeDropSlotId.value =
    getImageSlotIdFromPoint(event.clientX, event.clientY) || canvasUploadLayers.value[0]?.id || ''
}

function handleCanvasDragLeave(event: DragEvent) {
  const shell = canvasShellEl.value
  const relatedTarget = event.relatedTarget as Node | null

  if (!shell || !relatedTarget || !shell.contains(relatedTarget)) {
    activeDropSlotId.value = ''
  }
}

function handleCanvasDrop(event: DragEvent) {
  if (!hasDraggedImage(event)) {
    return
  }

  const slotId = getImageSlotIdFromPoint(event.clientX, event.clientY) || activeDropSlotId.value
  activeDropSlotId.value = ''

  if (getDraggedImageFiles(event).length) {
    void queueImageFiles(getDraggedImageFiles(event), slotId)
    return
  }

  void setTemplateImageFromUrl(slotId, getDroppedImageUrl(event))
}

function hasDraggedImage(event: DragEvent): boolean {
  const dataTransfer = event.dataTransfer

  if (!dataTransfer) {
    return false
  }

  if (getDraggedImageFiles(event).length) {
    return true
  }

  const types = Array.from(dataTransfer.types || []).map((type) => String(type).toLowerCase())

  if (types.some((type) => type.startsWith('image/') || type === 'text/uri-list')) {
    return true
  }

  return Boolean(normalizeDraggedImageUrl(getDraggedData(dataTransfer, 'text/plain')))
}

function getDraggedImageFiles(event: DragEvent): File[] {
  return Array.from(event.dataTransfer?.files || []).filter((file) =>
    file.type.startsWith('image/')
  )
}

function getImageSlotIdFromPoint(clientX: number, clientY: number): string {
  const shell = canvasShellEl.value

  if (!shell) {
    return activeImageSlotId.value
  }

  const shellRect = shell.getBoundingClientRect()
  const canvas = templateRenderData.value.canvas
  const x = ((clientX - shellRect.left) / shellRect.width) * canvas.width
  const y = ((clientY - shellRect.top) / shellRect.height) * canvas.height
  const slots = canvasUploadLayers.value
  let nearestSlotId = activeImageSlotId.value || slots[0]?.id || ''
  let nearestDistance = Number.POSITIVE_INFINITY

  for (let index = slots.length - 1; index >= 0; index -= 1) {
    const slot = slots[index]
    const rect = slot.dropRegion || slot.uploadRegion || slot.region

    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      return slot.id
    }

    const dx = x < rect.x ? rect.x - x : x > rect.x + rect.width ? x - (rect.x + rect.width) : 0
    const dy = y < rect.y ? rect.y - y : y > rect.y + rect.height ? y - (rect.y + rect.height) : 0
    const distance = dx * dx + dy * dy

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestSlotId = slot.id
    }
  }

  return nearestSlotId
}

function getSearchQuery(slot: string): string {
  return searchQueries[slot] || ''
}

function getSearchResults(slot: string): GlamourCandidate[] {
  return searchResults[slot] || []
}

function shouldShowSearchPanel(slot: string): boolean {
  return Boolean(getSearchQuery(slot).trim() && searchTouched[slot])
}

function shouldShowSearchEmpty(slot: string): boolean {
  return Boolean(
    getSearchQuery(slot).trim() &&
    searchTouched[slot] &&
    !searchBusy[slot] &&
    getSearchResults(slot).length === 0
  )
}

function getSearchCandidateName(candidate: GlamourCandidate): string {
  return getCandidateName(candidate, editorLocale.value, props.draft.source.locale)
}

function buildSearchIconUrl(candidate: GlamourCandidate): string {
  return buildGlamourIconUrl(props.apiBase, candidate.icon)
}

function getSearchResultKey(candidate: GlamourCandidate): string {
  return String(candidate.key ?? candidate.name ?? JSON.stringify(candidate.names ?? {}))
}

function clearSearch(slot: string) {
  const timer = searchTimers.get(slot)

  if (timer) {
    window.clearTimeout(timer)
    searchTimers.delete(slot)
  }

  searchQueries[slot] = ''
  searchResults[slot] = []
  searchTouched[slot] = false
  searchBusy[slot] = false
}

function getDyePickerKey(slot: string, index: number): string {
  return `${slot}:${index}`
}

function getDyeSearchQuery(slot: string, index: number): string {
  return dyeSearchQueries[getDyePickerKey(slot, index)] || ''
}

function updateDyeSearch(slot: string, index: number, event: Event) {
  dyeSearchQueries[getDyePickerKey(slot, index)] = (event.currentTarget as HTMLInputElement).value
}

function isDyePickerActive(row: TemplateEditorRow, index: number): boolean {
  return activeDyePicker.value?.slot === row.slot && activeDyePicker.value.index === index
}

async function ensureStainsForCurrentLocale() {
  const locale = editorLocale.value

  if (stainLists[locale] || stainLoading[locale]) {
    return
  }

  stainLoading[locale] = true
  stainFailed[locale] = false

  try {
    stainLists[locale] = await props.loadStains(locale)
  } catch {
    stainLists[locale] = []
    stainFailed[locale] = true
  } finally {
    stainLoading[locale] = false
  }
}

function toggleDyePicker(row: TemplateEditorRow, index: number) {
  if (isDyePickerActive(row, index)) {
    activeDyePicker.value = null
    return
  }

  activeDyePicker.value = { slot: row.slot, index }
  void ensureStainsForCurrentLocale()
}

function getDyeGroups(slot: string, index: number): GlamourStainGroup[] {
  const query = getDyeSearchQuery(slot, index)
  const stains = stainLists[editorLocale.value] || []
  return groupGlamourStains(stains.filter((stain) => stainMatchesQuery(stain, query)))
}

function shouldShowDyeEmpty(slot: string, index: number): boolean {
  return Boolean(
    activeDyePicker.value &&
    !isDyeLoading() &&
    !isDyeFailed() &&
    getDyeGroups(slot, index).length === 0
  )
}

function isDyeLoading(): boolean {
  return Boolean(stainLoading[editorLocale.value])
}

function isDyeFailed(): boolean {
  return Boolean(stainFailed[editorLocale.value])
}

function getDyeEntryLabel(dye: GlamourDyeEntry): string {
  return getDyeEntryName(dye, props.draft.noDyeLabels, editorLocale.value)
}

function getDyeColor(dye: GlamourDyeEntry): string {
  return isNoDye(dye) ? 'transparent' : dye.hex || '#000000'
}

function isNoDye(dye: GlamourDyeEntry): boolean {
  return isNoDyeEntry(dye)
}

function getStainName(stain: GlamourStain): string {
  return resolveLocalized(stain.names, editorLocale.value, props.draft.source.locale) || stain.name
}

function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  )
}

function getDyeTitle(index: number, count: number): string {
  if (count > 1) {
    return formatMessage(t(textKeys.nsglamourEquipmentDyeSlotNumber), { number: index + 1 })
  }

  return t(textKeys.nsglamourEquipmentDyeSlot)
}

function selectDye(row: TemplateEditorRow, dyeIndex: number, stain: GlamourStain) {
  emit('set-entry-dye', row.slot, dyeIndex, stain)
  activeDyePicker.value = null
}

function updateSearch(row: TemplateEditorRow, event: Event) {
  const slot = row.slot
  const query = (event.currentTarget as HTMLInputElement).value
  const timer = searchTimers.get(slot)

  if (timer) {
    window.clearTimeout(timer)
  }

  searchQueries[slot] = query
  searchResults[slot] = []
  searchTouched[slot] = false

  if (!query.trim()) {
    searchBusy[slot] = false
    searchTimers.delete(slot)
    return
  }

  searchTimers.set(
    slot,
    window.setTimeout(() => {
      void runSearch(slot, query)
    }, 180)
  )
}

async function runSearch(slot: string, query: string) {
  searchBusy[slot] = true

  try {
    const results = await props.searchItems({
      slot,
      query: query.trim(),
      locale: editorLocale.value,
      limit: 20
    })

    if (searchQueries[slot] === query) {
      searchResults[slot] = results
      searchTouched[slot] = true
    }
  } catch {
    if (searchQueries[slot] === query) {
      searchResults[slot] = []
      searchTouched[slot] = false
    }
  } finally {
    if (searchQueries[slot] === query) {
      searchBusy[slot] = false
    }
  }
}

function selectSearchResult(row: TemplateEditorRow, candidate: GlamourCandidate) {
  emit('replace-entry', row.slot, candidate)
  clearSearch(row.slot)
  activeDyePicker.value = null
}

function clearEditorEntry(row: TemplateEditorRow) {
  emit('clear-entry', row.slot)
  clearSearch(row.slot)
  activeDyePicker.value = null
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
  activeDyePicker.value = null
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

  activeDyePicker.value = null
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

function isEventInsideTemplateCanvasShell(event: DragEvent): boolean {
  const shell = canvasShellEl.value
  const target = event.target as Node | null

  return Boolean(shell && target && shell.contains(target))
}

function handleTemplateDocumentDragEvent(event: DragEvent) {
  const insideShell = isEventInsideTemplateCanvasShell(event)
  const isDragEvent = ['dragenter', 'dragover', 'dragleave', 'drop'].includes(event.type)

  if (!hasDraggedImage(event) && !(insideShell && isDragEvent)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }

  if (insideShell && (event.type === 'dragenter' || event.type === 'dragover')) {
    handleCanvasDrag(event)
    return
  }

  if (event.type === 'drop') {
    if (insideShell) {
      handleCanvasDrop(event)
    } else {
      activeDropSlotId.value = ''
    }
    return
  }

  if (event.type === 'dragleave') {
    if (!insideShell) {
      activeDropSlotId.value = ''
      return
    }

    handleCanvasDragLeave(event)
  }
}

function getTemplateDocumentDragTargets(): EventTarget[] {
  return [window, document, document.documentElement].filter(Boolean)
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
  getTemplateDocumentDragTargets().forEach((target) => {
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      target.addEventListener(eventName, handleTemplateDocumentDragEvent as EventListener, {
        capture: true
      })
    })
  })
  document.addEventListener('visibilitychange', redrawTemplateCanvasAfterPageResume)
  window.addEventListener('pageshow', redrawTemplateCanvasAfterPageResume)
  window.addEventListener('focus', redrawTemplateCanvasAfterPageResume)
  window.addEventListener('nsglamour:header-popover-open', closeFloatingTemplatePanels)
  observePreviewSize()
  void refreshRecentTemplateImages()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  getTemplateDocumentDragTargets().forEach((target) => {
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      target.removeEventListener(eventName, handleTemplateDocumentDragEvent as EventListener, {
        capture: true
      })
    })
  })
  document.removeEventListener('visibilitychange', redrawTemplateCanvasAfterPageResume)
  window.removeEventListener('pageshow', redrawTemplateCanvasAfterPageResume)
  window.removeEventListener('focus', redrawTemplateCanvasAfterPageResume)
  window.removeEventListener('nsglamour:header-popover-open', closeFloatingTemplatePanels)
  if (canvasResumeRenderFrame) {
    window.cancelAnimationFrame(canvasResumeRenderFrame)
    canvasResumeRenderFrame = 0
  }
  previewResizeObserver?.disconnect()
  clearTemplateImages()
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
  padding: 0;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsglamour-template__recent-button:hover,
.nsglamour-template__recent-button:focus-visible {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
  outline: none;
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

.nsglamour-template__editor {
  display: grid;
  min-width: 0;
  border-top: 1px solid var(--ns-color-border);
}

.nsglamour-template__row {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 76px;
  padding: 24px 0 10px;
  border-bottom: 1px solid var(--ns-color-border);
}

.nsglamour-template__row h3 {
  position: absolute;
  top: 7px;
  left: 0;
  min-width: 0;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.nsglamour-template__item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.nsglamour-template__item--search {
  display: block;
}

.nsglamour-template__item-icon {
  display: block;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  object-fit: cover;
}

.nsglamour-template__item-body {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.nsglamour-template__item-body strong,
.nsglamour-template__item-body small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__item-body strong {
  font-size: 14px;
  line-height: 1.35;
}

.nsglamour-template__item-body small {
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsglamour-template__dye-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.nsglamour-template__dye-select {
  position: relative;
  min-width: 0;
}

.nsglamour-template__dye-chip {
  display: inline-grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: center;
  gap: 5px;
  max-width: 132px;
  min-height: 24px;
  padding: 2px 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.nsglamour-template__dye-chip::before {
  content: '';
  width: 10px;
  height: 10px;
  border: 1px solid var(--ns-color-border);
  background:
    linear-gradient(45deg, #ddd 25%, transparent 25% 75%, #ddd 75%) 0 0 / 6px 6px,
    var(--nsglamour-dye-color, transparent);
}

.nsglamour-template__dye-chip:not(.empty-dye)::before {
  background: var(--nsglamour-dye-color, #000);
}

.nsglamour-template__dye-chip.empty-dye::before {
  border: 0;
  background: url('/data/glamour/templates/com_icon_clear.svg') center / 10px 10px no-repeat;
}

.nsglamour-template__dye-chip:hover,
.nsglamour-template__dye-chip:focus {
  border-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template__dye-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10;
  display: grid;
  gap: 6px;
  width: min(280px, 82vw);
  padding: 8px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  box-shadow: 0 10px 22px rgba(20, 28, 45, 0.12);
}

.nsglamour-template__dye-search {
  box-sizing: border-box;
  width: 100%;
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
}

.nsglamour-template__dye-results {
  display: grid;
  max-height: 230px;
  overflow-y: auto;
}

.nsglamour-template__dye-group {
  display: grid;
}

.nsglamour-template__dye-group-title,
.nsglamour-template__dye-empty {
  padding: 6px 4px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
}

.nsglamour-template__dye-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-height: 28px;
  padding: 4px 6px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.nsglamour-template__dye-option:hover,
.nsglamour-template__dye-option:focus {
  background: var(--ns-color-surface);
  outline: none;
}

.nsglamour-template__dye-swatch {
  width: 14px;
  height: 14px;
  border: 1px solid var(--ns-color-border);
  background: var(--nsglamour-dye-color, #000);
}

.nsglamour-template__dye-option span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__delete {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.nsglamour-template__delete:hover,
.nsglamour-template__delete:focus {
  border-color: var(--ns-color-danger, #c2410c);
  color: var(--ns-color-danger, #c2410c);
  outline: none;
}

.nsglamour-template__search {
  position: relative;
  min-width: 0;
}

.nsglamour-template__search .nsglamour-template__input {
  width: 100%;
}

.nsglamour-template__search-results {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  z-index: 8;
  display: grid;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  box-shadow: 0 10px 22px rgba(20, 28, 45, 0.12);
}

.nsglamour-template__search-result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 34px;
  padding: 5px 8px;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.nsglamour-template__search-result:last-child {
  border-bottom: 0;
}

.nsglamour-template__search-result:hover,
.nsglamour-template__search-result:focus {
  background: var(--ns-color-surface);
  outline: none;
}

.nsglamour-template__search-result img {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.nsglamour-template__search-result span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__search-empty {
  padding: 9px 10px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
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
