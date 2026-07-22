<template>
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
          @click="emit('change-template')"
        >
          {{ t(textKeys.nsglamourTemplateChange) }}
        </button>
        <button
          type="button"
          class="nsglamour-template__secondary ns-compact-action"
          @click="emit('save-image')"
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
        @input="updateTextSetting('topText', $event)"
      />
    </label>

    <label v-if="template.controls.characterName" class="nsglamour-template__field">
      <span>{{ t(textKeys.nsglamourTemplateCharacterName) }}</span>
      <input
        class="nsglamour-template__input"
        type="text"
        spellcheck="false"
        :value="templateSettings.characterName"
        @input="updateTextSetting('characterName', $event)"
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
          @input="updateSubtitleSetting('ecSubtitleLeftText', $event)"
        />
        <input
          class="nsglamour-template__input nsglamour-template__input--symbol"
          type="text"
          spellcheck="false"
          maxlength="4"
          :aria-label="t(textKeys.nsglamourTemplateSymbol)"
          :value="templateSettings.ecSubtitleSymbolText"
          @input="updateSubtitleSetting('ecSubtitleSymbolText', $event)"
        />
        <input
          class="nsglamour-template__input"
          type="text"
          spellcheck="false"
          :placeholder="t(textKeys.nsglamourTemplateWorld)"
          :value="templateSettings.ecSubtitleRightText"
          @input="updateSubtitleSetting('ecSubtitleRightText', $event)"
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
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type { GlamourTemplateDefinition } from '@/lib/glamour/templates/definitions'
import type { GlamourTemplateSettings } from '@/lib/glamour/templates/settings'
import { useLocale } from '@/stores/locale'

defineProps<{
  template: GlamourTemplateDefinition
  templateSettings: GlamourTemplateSettings
  authorLinks: Array<{ platform: string; url: string }>
}>()

const emit = defineEmits<{
  'update-settings': [settings: Partial<GlamourTemplateSettings>]
  'change-template': []
  'save-image': []
}>()

const { t } = useLocale()
const authorLinksRootEl = ref<HTMLElement | null>(null)
const authorLinksOpen = ref(false)
const templateSelectorOpenButton = ref<HTMLButtonElement | null>(null)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
  window.addEventListener('nsglamour:header-popover-open', closeAuthorLinks)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('nsglamour:header-popover-open', closeAuthorLinks)
})

function getInputValue(event: Event): string {
  return (event.currentTarget as HTMLInputElement).value
}

function updateTextSetting(key: 'topText' | 'characterName', event: Event): void {
  emit('update-settings', { [key]: getInputValue(event) })
}

function updateSubtitleSetting(
  key: 'ecSubtitleLeftText' | 'ecSubtitleSymbolText' | 'ecSubtitleRightText',
  event: Event
): void {
  emit('update-settings', {
    [key]: getInputValue(event),
    ecSubtitleTouched: true
  })
}

function setDyeFrameMode(dyeFrameMode: 'psd' | 'color'): void {
  emit('update-settings', { dyeFrameMode })
}

function toggleAuthorLinks(): void {
  authorLinksOpen.value = !authorLinksOpen.value
}

function closeAuthorLinks(): void {
  authorLinksOpen.value = false
}

function focusTemplateSelectorButton(): void {
  templateSelectorOpenButton.value?.focus()
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as Node
  if (authorLinksRootEl.value && !authorLinksRootEl.value.contains(target)) {
    closeAuthorLinks()
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeAuthorLinks()
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

defineExpose({ closeAuthorLinks, focusTemplateSelectorButton })
</script>
