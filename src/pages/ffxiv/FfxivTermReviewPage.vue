<template>
  <main class="ns-page ffxiv-term-review-page">
    <div class="ffxiv-term-review-page__shell">
      <AppBackLink :to="siteRoutes.ffxiv" />

      <header class="ffxiv-term-review-page__header">
        <p class="ns-eyebrow">{{ t(textKeys.ffxivTermReviewKicker) }}</p>
        <h1 class="ns-title">{{ t(textKeys.ffxivTermReviewTitle) }}</h1>
        <p class="ns-lead">{{ t(textKeys.ffxivTermReviewLead) }}</p>
      </header>

      <section
        class="ffxiv-term-review-page__filters"
        :aria-label="t(textKeys.ffxivTermReviewFilters)"
      >
        <label class="ffxiv-term-review-page__field">
          <span>{{ t(textKeys.ffxivTermReviewSearch) }}</span>
          <input
            v-model.trim="searchText"
            type="search"
            :placeholder="t(textKeys.ffxivTermReviewSearchPlaceholder)"
          />
        </label>

        <label class="ffxiv-term-review-page__field">
          <span>{{ t(textKeys.ffxivTermReviewModule) }}</span>
          <select v-model="selectedModule">
            <option value="all">{{ t(textKeys.ffxivTermReviewAll) }}</option>
            <option v-for="module in moduleOptions" :key="module" :value="module">
              {{ module }}
            </option>
          </select>
        </label>

        <label class="ffxiv-term-review-page__field">
          <span>{{ t(textKeys.ffxivTermReviewStatus) }}</span>
          <select v-model="selectedStatus">
            <option value="all">{{ t(textKeys.ffxivTermReviewAll) }}</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ statusLabel(status) }}
            </option>
          </select>
        </label>

        <label class="ffxiv-term-review-page__field">
          <span>{{ t(textKeys.ffxivTermReviewSource) }}</span>
          <select v-model="selectedSource">
            <option value="all">{{ t(textKeys.ffxivTermReviewAll) }}</option>
            <option v-for="source in sourceOptions" :key="source" :value="source">
              {{ sourceLabel(source) }}
            </option>
          </select>
        </label>
      </section>

      <section
        class="ffxiv-term-review-page__summary"
        :aria-label="t(textKeys.ffxivTermReviewSummary)"
      >
        <span>{{ t(textKeys.ffxivTermReviewVisible) }} {{ filteredTerms.length }}</span>
        <span>{{ t(textKeys.ffxivTermReviewTotal) }} {{ ffxivTermEntries.length }}</span>
        <span>{{ t(textKeys.ffxivTermReviewNeedsCheck) }} {{ needsCheckCount }}</span>
      </section>

      <section class="ffxiv-term-review-page__table-wrap ns-scroll-area">
        <table class="ffxiv-term-review-page__table">
          <thead>
            <tr>
              <th>{{ t(textKeys.ffxivTermReviewColumnTerm) }}</th>
              <th>{{ t(textKeys.ffxivTermReviewColumnValues) }}</th>
              <th>{{ t(textKeys.ffxivTermReviewColumnStatus) }}</th>
              <th>{{ t(textKeys.ffxivTermReviewColumnSource) }}</th>
              <th>{{ t(textKeys.ffxivTermReviewColumnNote) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="term in filteredTerms" :key="term.id" :data-status="term.status">
              <td>
                <strong>{{ displayPrimaryValue(term) }}</strong>
                <span>{{ term.usage }}</span>
                <code>{{ term.uiKey ?? term.id }}</code>
                <small v-if="term.legacyNames?.length">
                  {{ t(textKeys.ffxivTermReviewLegacy) }} {{ term.legacyNames.join(' / ') }}
                </small>
              </td>
              <td>
                <dl class="ffxiv-term-review-page__values">
                  <template v-for="locale in visibleLocales" :key="locale">
                    <dt>{{ locale }}</dt>
                    <dd>{{ term.values[locale] || t(textKeys.ffxivTermReviewMissingValue) }}</dd>
                  </template>
                </dl>
              </td>
              <td>
                <span class="ffxiv-term-review-page__badge">{{ statusLabel(term.status) }}</span>
                <small>{{ term.module }}</small>
              </td>
              <td>
                <strong>{{ sourceLabel(term.source.kind) }}</strong>
                <span v-if="term.source.table">{{ term.source.table }}</span>
                <span v-if="term.source.field">{{ term.source.field }}</span>
                <span v-if="term.source.row">{{ term.source.row }}</span>
              </td>
              <td>
                <span>{{ term.note ?? term.source.note }}</span>
                <small v-if="term.composedFrom?.length">
                  {{ t(textKeys.ffxivTermReviewComposedFrom) }} {{ composedFromLabel(term) }}
                </small>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppBackLink from '@/components/AppBackLink.vue'
import { siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import {
  ffxivTermEntries,
  type FfxivTermEntry,
  type FfxivTermModule,
  type FfxivTermSourceKind,
  type FfxivTermStatus
} from '@/lib/ffxiv/terms'
import { useLocale, type Locale } from '@/stores/locale'

const { t } = useLocale()
const visibleLocales: Locale[] = ['zh-CN', 'en', 'ja', 'ko']
const searchText = ref('')
const selectedModule = ref<FfxivTermModule | 'all'>('all')
const selectedStatus = ref<FfxivTermStatus | 'all'>('all')
const selectedSource = ref<FfxivTermSourceKind | 'all'>('all')

const moduleOptions = uniqueOptions(ffxivTermEntries.map((term) => term.module))
const statusOptions: FfxivTermStatus[] = ['confirmed', 'needs-check', 'layout']
const sourceOptions: FfxivTermSourceKind[] = [
  'game-csv',
  'legacy-layout',
  'user-confirmed',
  'site-ui'
]
const termById = new Map(ffxivTermEntries.map((term) => [term.id, term]))

const filteredTerms = computed(() => {
  const query = searchText.value.toLowerCase()

  return ffxivTermEntries.filter((term) => {
    if (selectedModule.value !== 'all' && term.module !== selectedModule.value) {
      return false
    }

    if (selectedStatus.value !== 'all' && term.status !== selectedStatus.value) {
      return false
    }

    if (selectedSource.value !== 'all' && term.source.kind !== selectedSource.value) {
      return false
    }

    if (!query) {
      return true
    }

    return createSearchBlob(term).includes(query)
  })
})

const needsCheckCount = computed(
  () => ffxivTermEntries.filter((term) => term.status === 'needs-check').length
)

function displayPrimaryValue(term: FfxivTermEntry) {
  return term.values['zh-CN'] ?? term.values.en ?? term.id
}

function statusLabel(status: FfxivTermStatus) {
  const keyMap = {
    confirmed: textKeys.ffxivTermReviewStatusConfirmed,
    'needs-check': textKeys.ffxivTermReviewStatusNeedsCheck,
    layout: textKeys.ffxivTermReviewStatusLayout
  } satisfies Record<FfxivTermStatus, string>

  return t(keyMap[status])
}

function sourceLabel(source: FfxivTermSourceKind) {
  const keyMap = {
    'game-csv': textKeys.ffxivTermReviewSourceGameCsv,
    'legacy-layout': textKeys.ffxivTermReviewSourceLegacyLayout,
    'user-confirmed': textKeys.ffxivTermReviewSourceUserConfirmed,
    'site-ui': textKeys.ffxivTermReviewSourceSiteUi
  } satisfies Record<FfxivTermSourceKind, string>

  return t(keyMap[source])
}

function composedFromLabel(term: FfxivTermEntry) {
  return (term.composedFrom ?? [])
    .map((id) => {
      const sourceTerm = termById.get(id)
      return sourceTerm ? `${displayPrimaryValue(sourceTerm)} (${id})` : id
    })
    .join(' + ')
}

function createSearchBlob(term: FfxivTermEntry) {
  const composedTerms = (term.composedFrom ?? []).flatMap((id) => {
    const sourceTerm = termById.get(id)
    return sourceTerm ? [id, ...Object.values(sourceTerm.values)] : [id]
  })

  return [
    term.id,
    term.module,
    term.status,
    term.usage,
    term.uiKey,
    term.source.kind,
    term.source.table,
    term.source.field,
    term.source.row,
    term.source.note,
    term.note,
    ...(term.legacyNames ?? []),
    ...(term.composedFrom ?? []),
    ...composedTerms,
    ...Object.values(term.values)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function uniqueOptions<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}
</script>

<style scoped>
.ffxiv-term-review-page {
  background: var(--ns-body-background);
}

.ffxiv-term-review-page__shell {
  width: min(1440px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.ffxiv-term-review-page__header {
  max-width: 860px;
}

.ffxiv-term-review-page__filters,
.ffxiv-term-review-page__summary {
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  box-shadow: var(--ns-shadow-panel);
}

.ffxiv-term-review-page__filters {
  display: grid;
  grid-template-columns: minmax(260px, 1.6fr) repeat(3, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 24px;
  padding: 14px;
}

.ffxiv-term-review-page__field {
  display: grid;
  gap: 6px;
  min-width: 0;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.ffxiv-term-review-page__field input,
.ffxiv-term-review-page__field select {
  width: 100%;
  min-width: 0;
  min-height: 38px;
  border: 2px solid var(--ns-pixel-border-soft);
  background-color: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 700 14px/1.3 var(--ns-font-sans);
}

.ffxiv-term-review-page__field input {
  padding: 0 10px;
}

.ffxiv-term-review-page__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.ffxiv-term-review-page__summary span {
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
  padding: 4px 8px;
}

.ffxiv-term-review-page__table-wrap {
  max-height: calc(100vh - 340px);
  margin-top: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}

.ffxiv-term-review-page__table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
  color: var(--ns-color-text);
  font-size: 13px;
}

.ffxiv-term-review-page__table th,
.ffxiv-term-review-page__table td {
  border: 1px solid var(--ns-pixel-border-soft);
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

.ffxiv-term-review-page__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--ns-pixel-window-title-bg);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
}

.ffxiv-term-review-page__table td:first-child {
  width: 230px;
}

.ffxiv-term-review-page__table td:nth-child(2) {
  width: 280px;
}

.ffxiv-term-review-page__table td:nth-child(3) {
  width: 120px;
}

.ffxiv-term-review-page__table td:nth-child(4) {
  width: 210px;
}

.ffxiv-term-review-page__table strong,
.ffxiv-term-review-page__table span,
.ffxiv-term-review-page__table small,
.ffxiv-term-review-page__table code {
  display: block;
}

.ffxiv-term-review-page__table strong {
  margin-bottom: 4px;
  font-weight: 900;
}

.ffxiv-term-review-page__table span,
.ffxiv-term-review-page__table small {
  color: var(--ns-color-text-muted);
}

.ffxiv-term-review-page__table code {
  margin-top: 6px;
  color: var(--ns-color-accent-strong);
  font-family: var(--ns-font-mono);
  font-size: 11px;
}

.ffxiv-term-review-page__badge {
  display: inline-block;
  margin-bottom: 6px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  padding: 4px 6px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 900;
}

tr[data-status='needs-check'] .ffxiv-term-review-page__badge {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
  color: var(--ns-status-warning-text);
}

tr[data-status='layout'] .ffxiv-term-review-page__badge {
  border-color: var(--ns-status-info-border);
  background: var(--ns-status-info-bg);
  color: var(--ns-status-info-text);
}

.ffxiv-term-review-page__values {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 4px 8px;
  margin: 0;
}

.ffxiv-term-review-page__values dt {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
  font-weight: 900;
}

.ffxiv-term-review-page__values dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 700;
}

@media (max-width: 900px) {
  .ffxiv-term-review-page__filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .ffxiv-term-review-page__shell {
    width: min(100% - 20px, 1440px);
    padding-top: 20px;
  }

  .ffxiv-term-review-page__filters {
    grid-template-columns: 1fr;
  }

  .ffxiv-term-review-page__table-wrap {
    max-height: none;
  }
}
</style>
