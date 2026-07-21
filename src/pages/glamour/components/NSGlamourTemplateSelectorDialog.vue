<template>
  <div
    class="nsglamour-template-selector"
    aria-modal="true"
    role="dialog"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section class="nsglamour-template-selector__dialog">
      <div class="nsglamour-template-selector__head">
        <h2 :id="titleId" class="ns-heading-bloom">
          {{ t(textKeys.nsglamourTemplateSelectorTitle) }}
        </h2>
        <button
          type="button"
          class="nsglamour-template__secondary ns-compact-action"
          @click="emit('close')"
        >
          {{ t(textKeys.nsglamourTemplateSelectorClose) }}
        </button>
      </div>

      <div
        class="nsglamour-template-selector__filters"
        :aria-label="t(textKeys.nsglamourTemplateSelectorFilter)"
      >
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          :class="{ active: activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ getFilterLabel(filter) }}
        </button>
      </div>

      <div
        ref="listEl"
        class="nsglamour-template-selector__list"
        role="listbox"
        :aria-label="t(textKeys.nsglamourTemplateSelectorList)"
      >
        <p v-if="filteredOptions.length === 0" class="nsglamour-template-selector__empty">
          {{ t(textKeys.nsglamourTemplateSelectorEmpty) }}
        </p>
        <article
          v-for="option in filteredOptions"
          :key="option.id"
          class="nsglamour-template-selector__card"
          :class="{ active: option.id === templateId }"
          role="option"
          tabindex="0"
          :title="getCardTitle(option)"
          :aria-selected="option.id === templateId ? 'true' : 'false'"
          @click="emit('select', option.id)"
          @keydown.enter.prevent="emit('select', option.id)"
          @keydown.space.prevent="emit('select', option.id)"
        >
          <div class="nsglamour-template-selector__preview" aria-hidden="true">
            <img :src="getPreviewUrl(option)" alt="" loading="lazy" />
          </div>
          <div class="nsglamour-template-selector__body">
            <span class="nsglamour-template-selector__author">
              {{ t(textKeys.nsglamourTemplateAuthor) }}
              <a
                v-if="option.authorUrl"
                :href="option.authorUrl"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
              >
                {{ option.author }}
              </a>
              <span v-else>{{ option.author }}</span>
            </span>
            <div class="nsglamour-template-selector__languages">
              <code v-for="label in getLanguageLabels(option)" :key="label">
                {{ label }}
              </code>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import {
  GLAMOUR_TEMPLATE_SELECT_ORDER,
  getGlamourTemplateDefinition,
  type GlamourTemplateDefinition,
  type GlamourTemplateId
} from '@/lib/glamour/templates/definitions'
import type { GlamourLocale } from '@/lib/glamour/types'
import { useLocale } from '@/stores/locale'

defineProps<{ templateId: GlamourTemplateId }>()

const emit = defineEmits<{
  close: []
  select: [templateId: GlamourTemplateId]
}>()

const { t } = useLocale()
const titleId = 'nsglamour-template-selector-title'
const allFilter = 'all'
const languageOrder: GlamourLocale[] = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']
const languageRank = new Map(languageOrder.map((locale, index) => [locale, index]))
const localeLabels: Record<string, string> = {
  zh: 'chs',
  ja: 'ja',
  en: 'en',
  ko: 'ko',
  tc: 'tc',
  fr: 'fr',
  de: 'de'
}
const listEl = ref<HTMLElement | null>(null)
const activeFilter = ref(allFilter)
const options = GLAMOUR_TEMPLATE_SELECT_ORDER.map((id) => getGlamourTemplateDefinition(id))
const filters = computed(() => {
  const locales = new Set<GlamourLocale>()
  options.forEach((option) => option.localeOrder.forEach((locale) => locales.add(locale)))
  const ordered = languageOrder.filter((locale) => locales.has(locale))
  const extra = Array.from(locales).filter((locale) => !ordered.includes(locale))
  return [allFilter, ...ordered, ...extra]
})
const filteredOptions = computed(() => {
  if (activeFilter.value === allFilter) return options
  return options.filter((option) =>
    option.localeOrder.includes(activeFilter.value as GlamourLocale)
  )
})

onMounted(() => {
  void nextTick(() => {
    listEl.value?.querySelector<HTMLElement>('.nsglamour-template-selector__card.active')?.focus()
  })
})

function sortLanguageOptions<T extends { locales: GlamourLocale[] }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (left, right) =>
        (languageRank.get(left.item.locales[0]) ?? Number.MAX_SAFE_INTEGER) -
          (languageRank.get(right.item.locales[0]) ?? Number.MAX_SAFE_INTEGER) ||
        left.index - right.index
    )
    .map((entry) => entry.item)
}

function getFilterLabel(filter: string): string {
  return filter === allFilter
    ? t(textKeys.nsglamourTemplateSelectorAll)
    : localeLabels[filter] || filter
}

function getLanguageLabels(option: GlamourTemplateDefinition): string[] {
  if (option.languageOptions?.length) {
    return sortLanguageOptions(option.languageOptions).map((item) => item.label)
  }

  return [...option.localeOrder]
    .sort(
      (left, right) =>
        (languageRank.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (languageRank.get(right) ?? Number.MAX_SAFE_INTEGER)
    )
    .map((locale) => localeLabels[locale] || locale)
}

function getCardTitle(option: GlamourTemplateDefinition): string {
  return formatMessage(t(textKeys.nsglamourTemplateSelectorCardTitle), {
    template: `${option.author} ${option.summary || ''}`.trim(),
    languages: getLanguageLabels(option).join(' ')
  })
}

function getPreviewUrl(option: GlamourTemplateDefinition): string {
  const legacyPath = String(option.legacyPreviewPath || '').replace(/^\/template-preview\/?/, '')
  return `/data/glamour/template-preview/${legacyPath || '1-Eorzea Magazine/1-Preview.webp'}`
}

function formatMessage(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.split(`{${key}}`).join(value),
    template
  )
}
</script>

<style scoped>
.nsglamour-template-selector {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: color-mix(in srgb, var(--ns-color-bg) 72%, transparent);
}

.nsglamour-template-selector__dialog {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  width: min(820px, 100%);
  max-height: min(720px, calc(100vh - 36px));
  padding: 16px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  box-shadow: 0 16px 34px rgba(20, 28, 45, 0.18);
}

.nsglamour-template-selector__head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.nsglamour-template-selector__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.nsglamour-template-selector__filters,
.nsglamour-template-selector__languages {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nsglamour-template-selector__filters button {
  min-height: 28px;
  padding: 3px 9px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.nsglamour-template-selector__filters button:hover,
.nsglamour-template-selector__filters button:focus,
.nsglamour-template-selector__filters button.active {
  border-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template-selector__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
}

.nsglamour-template-selector__card {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.nsglamour-template-selector__card:hover,
.nsglamour-template-selector__card:focus,
.nsglamour-template-selector__card.active {
  border-color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template-selector__preview {
  display: block;
  min-width: 0;
  min-height: 82px;
  height: 82px;
  overflow: hidden;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-glamour-template-canvas-bg);
}

.nsglamour-template-selector__body strong,
.nsglamour-template-selector__body span,
.nsglamour-template-selector__author a {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template-selector__preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.nsglamour-template-selector__body span {
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsglamour-template-selector__author {
  display: inline-flex;
  min-width: 0;
}

.nsglamour-template-selector__author a {
  color: inherit;
  text-decoration: none;
}

.nsglamour-template-selector__author a:hover,
.nsglamour-template-selector__author a:focus {
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template-selector__body {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.nsglamour-template-selector__body strong {
  font-size: 14px;
  font-weight: 800;
}

.nsglamour-template-selector__languages code {
  padding: 2px 5px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 800;
}

.nsglamour-template-selector__empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 18px 4px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 640px) {
  .nsglamour-template-selector__head {
    align-items: stretch;
    flex-direction: column;
  }

  .nsglamour-template-selector__list {
    grid-template-columns: 1fr;
  }

  .nsglamour-template-selector__card {
    grid-template-columns: 94px minmax(0, 1fr);
  }
}
</style>
