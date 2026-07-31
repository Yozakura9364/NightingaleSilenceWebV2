<template>
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
          @click="emit('open-import')"
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

    <div ref="languageControl" class="nsglamour-snapshot__language-control">
      <button
        type="button"
        class="nsglamour-snapshot__tool-button"
        :aria-label="languageButtonLabel"
        :title="languageButtonLabel"
        aria-haspopup="menu"
        :aria-expanded="languageMenuOpen"
        @click.stop="languageMenuOpen = !languageMenuOpen"
      >
        <img :src="languagesIcon" alt="" aria-hidden="true" />
      </button>
      <div
        v-if="languageMenuOpen"
        class="nsglamour-snapshot__language-menu"
        role="menu"
        :aria-label="t(textKeys.nsglamourTemplateLayoutLanguage)"
      >
        <button
          v-for="option in languageOptions"
          :key="option.id"
          type="button"
          role="menuitemradio"
          :class="{ active: isLanguageOptionActive(option) }"
          :aria-checked="isLanguageOptionActive(option)"
          @click="selectLanguageOption(option)"
        >
          {{ getLanguageOptionLabel(option) }}
        </button>
      </div>
    </div>

    <div v-if="customLanguageMode" class="nsglamour-template__custom-language-settings">
      <label class="nsglamour-template__custom-language-row">
        <span>{{ t(textKeys.nsglamourTemplateLanguageItemNames) }}</span>
        <select
          :value="selectedLocales[0]"
          :aria-label="`${t(textKeys.nsglamourTemplateLanguageItemNames)} 1`"
          @change="emitLocaleChange('update-item-locale', 0, $event)"
        >
          <option v-for="locale in localeOptions" :key="locale.value" :value="locale.value">
            {{ getLocaleLabel(locale.value) }}
          </option>
        </select>
        <b aria-hidden="true">+</b>
        <select
          :value="selectedLocales[1]"
          :aria-label="`${t(textKeys.nsglamourTemplateLanguageItemNames)} 2`"
          @change="emitLocaleChange('update-item-locale', 1, $event)"
        >
          <option v-for="locale in localeOptions" :key="locale.value" :value="locale.value">
            {{ getLocaleLabel(locale.value) }}
          </option>
        </select>
      </label>

      <label class="nsglamour-template__custom-language-row">
        <span>{{ t(textKeys.nsglamourTemplateLanguageDyes) }}</span>
        <select
          :value="selectedDyeLocales[0]"
          :aria-label="`${t(textKeys.nsglamourTemplateLanguageDyes)} 1`"
          @change="emitLocaleChange('update-dye-locale', 0, $event)"
        >
          <option v-for="locale in localeOptions" :key="locale.value" :value="locale.value">
            {{ locale.label }}
          </option>
        </select>
        <b aria-hidden="true">+</b>
        <select
          :value="selectedDyeLocales[1] || ''"
          :aria-label="`${t(textKeys.nsglamourTemplateLanguageDyes)} 2`"
          @change="emitLocaleChange('update-dye-locale', 1, $event)"
        >
          <option value="">{{ t(textKeys.nsglamourTemplateLanguageNone) }}</option>
          <option v-for="locale in localeOptions" :key="locale.value" :value="locale.value">
            {{ getLocaleLabel(locale.value) }}
          </option>
        </select>
      </label>
    </div>

    <NSGlamourTemplateEquipmentEditor
      :rows="rows"
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
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import recentIconUrl from '@/assets/icons/pixelarticons/clock.svg'
import languagesIcon from '@/assets/icons/pixelarticons/languages.svg'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourLocale,
  GlamourRecentSnapshot,
  GlamourStain
} from '@/lib/glamour/types'
import type { GlamourTemplateLanguageOption } from '@/lib/glamour/templates/definitions'
import NSGlamourRecentPanel from '@/pages/glamour/components/NSGlamourRecentPanel.vue'
import NSGlamourTemplateEquipmentEditor from '@/pages/glamour/components/NSGlamourTemplateEquipmentEditor.vue'
import type {
  GlamourEquipmentSearch,
  GlamourStainLoader
} from '@/pages/glamour/types/equipmentEditor'
import type { GlamourTemplateEditorRow } from '@/pages/glamour/types/templateWorkspace'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  languageOptions: GlamourTemplateLanguageOption[]
  selectedLocales: GlamourLocale[]
  selectedDyeLocales: GlamourLocale[]
  localeOptions: Array<{ value: GlamourLocale; label: string }>
  customLanguageMode: boolean
  activeLocale: GlamourLocale
  singleLanguageMode: boolean
  rows: GlamourTemplateEditorRow[]
  draft: GlamourDraft
  apiBase: string
  editorLocale: GlamourLocale
  searchItems: GlamourEquipmentSearch
  loadStains: GlamourStainLoader
  recentItems: GlamourRecentSnapshot[]
  recentDefaultName: string
  busy: boolean
}>()

const emit = defineEmits<{
  'open-import': []
  'clear-draft': []
  'toggle-language': [option: GlamourTemplateLanguageOption]
  'update-item-locale': [index: number, locale: GlamourLocale]
  'update-dye-locale': [index: number, locale: GlamourLocale | '']
  'replace-entry': [slot: string, candidate: GlamourCandidate]
  'clear-entry': [slot: string]
  'set-entry-dye': [slot: string, dyeIndex: number, stain: GlamourStain]
  'restore-recent': [item: GlamourRecentSnapshot]
  'delete-recent': [id: string]
  'clear-recent': []
}>()

const { t } = useLocale()
const recentRootEl = ref<HTMLElement | null>(null)
const recentOpen = ref(false)
const languageControl = ref<HTMLElement | null>(null)
const languageMenuOpen = ref(false)

const localeLabels: Record<GlamourLocale, string> = {
  ja: '日本語',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  zh: '简体中文',
  tc: '繁體中文',
  ko: '한국어'
}

const selectedLanguageOption = computed(
  () =>
    props.languageOptions.find((option) => isLanguageOptionActive(option)) ||
    props.languageOptions.find((option) => isLanguageOptionCurrent(option.locales)) ||
    props.languageOptions[0]
)

const languageButtonLabel = computed(() => {
  const option = selectedLanguageOption.value
  return `${t(textKeys.nsglamourTemplateLayoutLanguage)}: ${option ? getLanguageOptionLabel(option) : ''}`
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  window.addEventListener('nsglamour:header-popover-open', closeRecent)
  window.addEventListener('nsglamour:header-popover-open', closeLanguageMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('nsglamour:header-popover-open', closeRecent)
  window.removeEventListener('nsglamour:header-popover-open', closeLanguageMenu)
})

function toggleRecent(): void {
  recentOpen.value = !recentOpen.value
}

function closeRecent(): void {
  recentOpen.value = false
}

function closeLanguageMenu(): void {
  languageMenuOpen.value = false
}

function selectLanguageOption(option: GlamourTemplateLanguageOption): void {
  emit('toggle-language', option)
  closeLanguageMenu()
  languageControl.value
    ?.querySelector<HTMLButtonElement>('.nsglamour-snapshot__tool-button')
    ?.focus()
}

function restoreRecent(item: GlamourRecentSnapshot): void {
  emit('restore-recent', item)
  closeRecent()
}

function forwardReplaceEntry(slot: string, candidate: GlamourCandidate): void {
  emit('replace-entry', slot, candidate)
}

function forwardClearEntry(slot: string): void {
  emit('clear-entry', slot)
}

function forwardSetEntryDye(slot: string, dyeIndex: number, stain: GlamourStain): void {
  emit('set-entry-dye', slot, dyeIndex, stain)
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as Node
  if (recentRootEl.value && !recentRootEl.value.contains(target)) {
    closeRecent()
  }
  if (languageControl.value && !languageControl.value.contains(target)) {
    closeLanguageMenu()
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeRecent()
    closeLanguageMenu()
  }
}

function isLanguageOptionActive(option: GlamourTemplateLanguageOption): boolean {
  if (option.id === 'custom') {
    return props.customLanguageMode
  }

  const locales = option.locales
  return (
    !props.customLanguageMode &&
    locales.length === props.selectedLocales.length &&
    locales.every((locale, index) => props.selectedLocales[index] === locale)
  )
}

function emitLocaleChange(
  event: 'update-item-locale' | 'update-dye-locale',
  index: number,
  domEvent: Event
): void {
  const locale = (domEvent.target as HTMLSelectElement).value as GlamourLocale | ''

  if (event === 'update-item-locale' && locale) {
    emit(event, index, locale)
  } else if (event === 'update-dye-locale') {
    emit(event, index, locale)
  }
}

function getLanguageOptionLabel(option: GlamourTemplateLanguageOption): string {
  if (option.id === 'custom') {
    return option.labelKey ? t(option.labelKey) : option.label
  }
  return option.locales.map((locale) => localeLabels[locale] || locale).join(' + ')
}

function getLocaleLabel(locale: GlamourLocale): string {
  return localeLabels[locale] || locale
}

function isLanguageOptionCurrent(locales: GlamourLocale[]): boolean {
  return Boolean(locales.length && props.activeLocale === locales[0])
}

defineExpose({ closeRecent })
</script>
