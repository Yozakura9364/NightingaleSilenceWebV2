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

    <div
      class="nsglamour-template__language-controls"
      :aria-label="t(textKeys.nsglamourTemplateLayoutLanguage)"
    >
      <button
        v-for="option in languageOptions"
        :key="option.id"
        type="button"
        :class="{
          active: isLanguageOptionActive(option.locales),
          current: isLanguageOptionCurrent(option.locales)
        }"
        :title="getLanguageOptionTitle(option.locales)"
        @click="emit('toggle-language', option)"
      >
        {{ option.label }}
      </button>
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
import { onBeforeUnmount, onMounted, ref } from 'vue'
import recentIconUrl from '@/assets/icons/pixelarticons/clock.svg'
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

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  window.addEventListener('nsglamour:header-popover-open', closeRecent)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('nsglamour:header-popover-open', closeRecent)
})

function toggleRecent(): void {
  recentOpen.value = !recentOpen.value
}

function closeRecent(): void {
  recentOpen.value = false
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
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeRecent()
  }
}

function isLanguageOptionActive(locales: GlamourLocale[]): boolean {
  return (
    locales.length === props.selectedLocales.length &&
    locales.every((locale, index) => props.selectedLocales[index] === locale)
  )
}

function isLanguageOptionCurrent(locales: GlamourLocale[]): boolean {
  return Boolean(locales.length && props.activeLocale === locales[0])
}

function getLanguageOptionTitle(locales: GlamourLocale[]): string {
  if (props.singleLanguageMode) {
    return isLanguageOptionCurrent(locales)
      ? t(textKeys.nsglamourTemplateLanguageCurrentEdit)
      : t(textKeys.nsglamourTemplateLayoutLanguage)
  }

  if (
    isLanguageOptionActive(locales) ||
    locales.some((locale) => props.selectedLocales.includes(locale))
  ) {
    return isLanguageOptionCurrent(locales)
      ? t(textKeys.nsglamourTemplateLanguageCurrentEdit)
      : t(textKeys.nsglamourTemplateLanguageOutput)
  }

  return t(textKeys.nsglamourTemplateLayoutLanguage)
}

defineExpose({ closeRecent })
</script>
