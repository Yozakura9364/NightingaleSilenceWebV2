<template>
  <FfxivToolShell :tool="tool" variant="workspace">
    <main class="nsarmoire-store-review">
      <header class="nsarmoire-store-review__header">
        <div>
          <h1 class="ns-heading-bloom">{{ t(textKeys.nsarmoireStoreReviewTitle) }}</h1>
          <p>{{ t(textKeys.nsarmoireStoreReviewSummary) }}</p>
        </div>

        <div class="nsarmoire-store-review__actions">
          <span class="nsarmoire-store-review__edited-count">
            {{ editedCountLabel }}
          </span>
          <AppButton @click="copyPatch">
            {{ t(textKeys.nsarmoireStoreReviewCopyPatch) }}
          </AppButton>
          <AppButton @click="downloadPatch">
            {{ t(textKeys.nsarmoireStoreReviewDownloadPatch) }}
          </AppButton>
          <AppButton @click="resetDraft">
            {{ t(textKeys.nsarmoireStoreReviewResetDraft) }}
          </AppButton>
        </div>
      </header>

      <AppStatus
        v-if="storeCatalogStatus === 'loading' || catalogStatus === 'loading'"
        compact
        tone="loading"
        :message="t(textKeys.nsarmoireStoreCatalogLoading)"
      />

      <AppStatus
        v-else-if="storeCatalogStatus === 'error'"
        compact
        tone="danger"
        :title="t(textKeys.nsarmoireStoreCatalogError)"
        :message="storeCatalogError ?? undefined"
      >
        <template #actions>
          <AppButton @click="reloadStoreCatalog">
            {{ t(textKeys.nsarmoireStoreCatalogRetry) }}
          </AppButton>
        </template>
      </AppStatus>

      <AppStatus v-if="statusMessageKey" compact tone="info" :message="t(statusMessageKey)" />

      <section class="nsarmoire-store-review__controls">
        <AppField
          :label="t(textKeys.nsarmoireStoreSearchLabel)"
          for-id="nsarmoire-store-review-search"
          density="compact"
        >
          <input
            id="nsarmoire-store-review-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :placeholder="t(textKeys.nsarmoireStoreSearchPlaceholder)"
          />
        </AppField>

        <AppField
          :label="t(textKeys.nsarmoireStoreFilterLabel)"
          for-id="nsarmoire-store-review-filter"
          density="compact"
        >
          <select id="nsarmoire-store-review-filter" v-model="selectedFilter">
            <option v-for="option in filterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </AppField>

        <AppField
          :label="t(textKeys.nsarmoireStoreReviewTagFilterLabel)"
          for-id="nsarmoire-store-review-tag-filter"
          density="compact"
        >
          <select id="nsarmoire-store-review-tag-filter" v-model="selectedTagFilter">
            <option v-for="option in tagFilterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </AppField>
      </section>

      <AppStatus
        v-if="visibleOutfits.length === 0"
        compact
        tone="info"
        :message="t(textKeys.nsarmoireStoreReviewNoResults)"
      />

      <template v-else>
        <ol class="nsarmoire-store-review__list">
          <li
            v-for="outfit in visibleOutfits"
            :key="outfit.id"
            class="nsarmoire-store-review__row"
            :class="{
              'nsarmoire-store-review__row--edited': isEdited(outfit.id),
              'nsarmoire-store-review__row--corrected': isCorrected(outfit.id),
              'nsarmoire-store-review__row--excluded': isExcluded(outfit.id),
              'nsarmoire-store-review__row--needs-mapping': isNeedsMapping(outfit)
            }"
        >
          <section class="nsarmoire-store-review__outfit">
            <div class="nsarmoire-store-review__cover">
              <img
                v-if="getCoverIconUrl(outfit)"
                :src="getCoverIconUrl(outfit)"
                :alt="getStoreReviewOutfitName(outfit)"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span v-else aria-hidden="true"></span>
            </div>

            <div class="nsarmoire-store-review__outfit-main">
              <span class="nsarmoire-store-review__column-label">
                {{ t(textKeys.nsarmoireStoreReviewOutfitColumn) }}
              </span>
              <h2>{{ getStoreReviewOutfitName(outfit) }}</h2>
              <div class="nsarmoire-store-review__meta">
                <span v-if="outfit.priceLabel">{{ outfit.priceLabel }}</span>
                <span v-if="outfit.productId">{{ outfit.productId }}</span>
                <span v-if="outfit.skuId">{{ outfit.skuId }}</span>
                <span v-if="outfit.mappingSource">{{ outfit.mappingSource }}</span>
              </div>
              <div class="nsarmoire-store-review__tag-editor">
                <span class="nsarmoire-store-review__tag-editor-label">
                  {{ t(textKeys.nsarmoireStoreReviewTagsLabel) }}
                </span>
                <div class="nsarmoire-store-review__tag-chip-list">
                  <button
                    v-for="tag in getMergedTags(outfit)"
                    :key="tag"
                    type="button"
                    class="nsarmoire-store-review__tag-chip"
                    @click="removeStoreTag(outfit, tag)"
                  >
                    {{ getStoreTagLabel(tag) }}
                  </button>
                  <button
                    v-for="tag in getMergedDetailTags(outfit)"
                    :key="tag"
                    type="button"
                    class="nsarmoire-store-review__tag-chip nsarmoire-store-review__tag-chip--detail"
                    @click="removeDetailTag(outfit, tag)"
                  >
                    {{ getStoreDetailTagLabel(tag) }}
                  </button>
                </div>
                <div class="nsarmoire-store-review__tag-selects">
                  <select
                    :value="''"
                    :disabled="getAvailableStoreTagOptions(outfit).length === 0"
                    :aria-label="t(textKeys.nsarmoireStoreReviewTagsLabel)"
                    @change="addStoreTagFromEvent(outfit, $event)"
                  >
                    <option disabled value="">
                      {{ t(textKeys.nsarmoireStoreReviewTagsLabel) }}
                    </option>
                    <option
                      v-for="option in getAvailableStoreTagOptions(outfit)"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <select
                    :value="''"
                    :disabled="getAvailableStoreDetailTagOptions(outfit).length === 0"
                    :aria-label="t(textKeys.nsarmoireStoreReviewDetailTagsLabel)"
                    @change="addDetailTagFromEvent(outfit, $event)"
                  >
                    <option disabled value="">
                      {{ t(textKeys.nsarmoireStoreReviewDetailTagsLabel) }}
                    </option>
                    <option
                      v-for="option in getAvailableStoreDetailTagOptions(outfit)"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section class="nsarmoire-store-review__items">
            <span class="nsarmoire-store-review__column-label">
              {{ t(textKeys.nsarmoireStoreReviewItemsColumn) }}
            </span>

            <ul v-if="getPieceViews(outfit).length > 0">
              <li
                v-for="piece in getPieceViews(outfit)"
                :key="piece.key"
                :class="{ 'nsarmoire-store-review__item--draft': piece.isDraft }"
              >
                <img v-if="piece.iconUrl" :src="piece.iconUrl" :alt="piece.name" loading="lazy" />
                <span v-else class="nsarmoire-store-review__item-fallback" aria-hidden="true" />
                <span class="nsarmoire-store-review__item-name">{{ piece.name }}</span>
                <span v-if="piece.itemId" class="nsarmoire-store-review__item-id">
                  #{{ piece.itemId }}
                </span>
                <span v-if="piece.isDraft" class="nsarmoire-store-review__item-draft">
                  {{ t(textKeys.nsarmoireStoreReviewItemDraft) }}
                </span>
                <button
                  v-if="piece.isDraft && piece.itemId"
                  type="button"
                  class="nsarmoire-store-review__item-remove"
                  @click="removeDraftItem(outfit, piece.itemId)"
                >
                  {{ t(textKeys.nsarmoireStoreReviewRemoveItem) }}
                </button>
              </li>
            </ul>

            <span v-else class="nsarmoire-store-review__empty">
              {{ t(textKeys.nsarmoireStoreReviewNoItems) }}
            </span>

            <div
              v-if="getCandidateViews(outfit).length > 0"
              class="nsarmoire-store-review__candidates"
            >
              <span class="nsarmoire-store-review__candidate-label">
                {{ t(textKeys.nsarmoireStoreReviewCandidateItems) }}
              </span>
              <div class="nsarmoire-store-review__candidate-list">
                <div
                  v-for="candidate in getCandidateViews(outfit)"
                  :key="candidate.itemId"
                  class="nsarmoire-store-review__candidate-group"
                >
                  <button
                    type="button"
                    class="nsarmoire-store-review__candidate"
                    :disabled="candidate.isAdded"
                    :aria-label="
                      formatArmoireText(t, textKeys.nsarmoireStoreReviewCandidateAdd, {
                        item: candidate.name
                      })
                    "
                    @click="addDraftItemId(outfit, candidate.itemId)"
                  >
                    <span class="nsarmoire-store-review__item-fallback" aria-hidden="true" />
                    <span>{{ candidate.name }}</span>
                    <span>#{{ candidate.itemId }}</span>
                    <span
                      v-if="candidate.pieceItemIds.length > 0"
                      class="nsarmoire-store-review__candidate-piece-count"
                    >
                      {{
                        formatArmoireText(t, textKeys.nsarmoireStoreReviewCandidatePieceCount, {
                          count: candidate.pieceItemIds.length
                        })
                      }}
                    </span>
                  </button>
                  <button
                    v-if="candidate.pieceItemIds.length > 0"
                    type="button"
                    class="nsarmoire-store-review__candidate-pieces"
                    :disabled="candidate.arePiecesAdded"
                    @click="addDraftItemIds(outfit, candidate.pieceItemIds)"
                  >
                    {{ t(textKeys.nsarmoireStoreReviewCandidateAddPieces) }}
                  </button>
                </div>
              </div>
            </div>

            <div class="nsarmoire-store-review__add-item">
              <label :for="getItemInputId(outfit.id)">
                {{ t(textKeys.nsarmoireStoreReviewAddItemLabel) }}
              </label>
              <div class="nsarmoire-store-review__add-item-control">
                <input
                  :id="getItemInputId(outfit.id)"
                  v-model="itemDraftInputs[outfit.id]"
                  type="text"
                  autocomplete="off"
                  :placeholder="t(textKeys.nsarmoireStoreReviewAddItemPlaceholder)"
                  @keydown.enter.prevent="addDraftItem(outfit)"
                />
                <button type="button" @click="addDraftItem(outfit)">
                  {{ t(textKeys.nsarmoireStoreReviewAddItem) }}
                </button>
              </div>
            </div>
          </section>

          <section class="nsarmoire-store-review__links">
            <span class="nsarmoire-store-review__column-label">
              {{ t(textKeys.nsarmoireStoreReviewLinksColumn) }}
            </span>

            <div
              v-for="region in linkRegions"
              :key="region.value"
              class="nsarmoire-store-review__link-field"
            >
              <label :for="getLinkInputId(outfit.id, region.value)">
                {{ t(region.labelKey) }}
              </label>
              <div class="nsarmoire-store-review__link-control">
                <input
                  :id="getLinkInputId(outfit.id, region.value)"
                  :value="getLinkValue(outfit, region.value)"
                  type="url"
                  autocomplete="off"
                  :placeholder="t(textKeys.nsarmoireStoreReviewLinkPlaceholder)"
                  @input="updateLink(outfit, region.value, $event)"
                />
                <a
                  v-if="getLinkValue(outfit, region.value)"
                  :href="getLinkValue(outfit, region.value)"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ t(textKeys.nsarmoireStoreReviewOpenLink) }}
                </a>
              </div>
              <div class="nsarmoire-store-review__link-control">
                <input
                  :id="getPriceInputId(outfit.id, region.value)"
                  :value="getPriceValue(outfit, region.value)"
                  type="text"
                  autocomplete="off"
                  :aria-label="`${t(region.labelKey)} ${t(textKeys.nsarmoireStoreReviewPricePlaceholder)}`"
                  :placeholder="t(textKeys.nsarmoireStoreReviewPricePlaceholder)"
                  @input="updatePrice(outfit, region.value, $event)"
                />
              </div>
            </div>
          </section>

          <section class="nsarmoire-store-review__state">
            <span class="nsarmoire-store-review__column-label">
              {{ t(textKeys.nsarmoireStoreReviewStateColumn) }}
            </span>
            <span v-if="isNeedsMapping(outfit)" class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreStatusNeedsMapping) }}
            </span>
            <span v-else class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreMetricMapped) }}
            </span>
            <span v-if="hasMissingLinks(outfit)" class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreReviewFilterMissingLinks) }}
            </span>
            <span v-if="isEdited(outfit.id)" class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreReviewFilterEdited) }}
            </span>
            <span
              v-if="isExcluded(outfit.id)"
              class="nsarmoire-store-review__badge nsarmoire-store-review__badge--excluded"
            >
              {{ t(textKeys.nsarmoireStoreReviewStatusExcluded) }}
            </span>
            <span
              class="nsarmoire-store-review__badge"
              :class="
                isCorrected(outfit.id)
                  ? 'nsarmoire-store-review__badge--corrected'
                  : 'nsarmoire-store-review__badge--pending'
              "
            >
              {{
                t(
                  isCorrected(outfit.id)
                    ? textKeys.nsarmoireStoreReviewStatusCorrected
                    : textKeys.nsarmoireStoreReviewStatusPendingCorrection
                )
              }}
            </span>
            <button
              type="button"
              class="nsarmoire-store-review__state-action"
              @click="setCorrectionState(outfit.id, !isCorrected(outfit.id))"
            >
              {{
                t(
                  isCorrected(outfit.id)
                    ? textKeys.nsarmoireStoreReviewUnconfirmCorrected
                    : textKeys.nsarmoireStoreReviewConfirmCorrected
                )
              }}
            </button>
            <button
              type="button"
              class="nsarmoire-store-review__state-action nsarmoire-store-review__state-action--danger"
              @click="setExcludedState(outfit.id, !isExcluded(outfit.id))"
            >
              {{
                t(
                  isExcluded(outfit.id)
                    ? textKeys.nsarmoireStoreReviewUnexclude
                    : textKeys.nsarmoireStoreReviewExclude
                )
              }}
            </button>
          </section>
          </li>
        </ol>

        <div
          v-if="hasMoreVisibleOutfits"
          ref="loadMoreSentinel"
          class="nsarmoire-store-review__load-more"
        >
          <AppButton @click="loadMoreVisibleOutfits">
            {{ t(textKeys.nsarmoireLoadMoreList) }}
          </AppButton>
        </div>
      </template>
    </main>
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppStatus from '@/components/AppStatus.vue'
import { getRequiredFfxivTool } from '@/config/site'
import { armoireTextKeys as textKeys } from '@/locales/keys/armoire'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import { useArmoireCatalog } from '@/pages/armoire/composables/useArmoireCatalog'
import { useArmoireStoreCatalog } from '@/pages/armoire/composables/useArmoireStoreCatalog'
import {
  formatArmoireText
} from '@/pages/armoire/utils/itemDisplay'
import { useLocale } from '@/stores/locale'
import { useArmoireStoreReviewFilter } from '@/pages/armoire/composables/useArmoireStoreReviewFilter'
import { useArmoireStoreReviewDraft } from '@/pages/armoire/composables/useArmoireStoreReviewDraft'

const tool = getRequiredFfxivTool('armoire')
const { t, current } = useLocale()
const { catalog, status: catalogStatus, loadCatalog } = useArmoireCatalog()
const {
  storeCatalog,
  status: storeCatalogStatus,
  error: storeCatalogError,
  loadStoreCatalog
} = useArmoireStoreCatalog()

const {
  draftEntries,
  itemDraftInputs,
  statusMessageKey,
  linkRegions,
  getLinkValue,
  updateLink,
  getPriceValue,
  updatePrice,
  isEdited,
  isCorrected,
  isExcluded,
  isNeedsMapping,
  hasMissingLinks,
  setCorrectionState,
  setExcludedState,
  getStoreTagLabel,
  getStoreDetailTagLabel,
  getMergedTags,
  getMergedDetailTags,
  getAvailableStoreTagOptions,
  getAvailableStoreDetailTagOptions,
  addStoreTagFromEvent,
  addDetailTagFromEvent,
  removeStoreTag,
  removeDetailTag,
  getStoreReviewOutfitName,
  getCoverIconUrl,
  getPieceViews,
  getCandidateViews,
  getLinkInputId,
  getPriceInputId,
  getItemInputId,
  addDraftItem,
  addDraftItemId,
  addDraftItemIds,
  removeDraftItem,
  hideBrokenImage,
  copyPatch,
  downloadPatch,
  resetDraft,
  editedCountLabel,
  getMergedItemIds,
} = useArmoireStoreReviewDraft(catalog, storeCatalog, t, current)

const {
  searchQuery,
  selectedFilter,
  selectedTagFilter,
  filterOptions,
  tagFilterOptions,
  visibleOutfits,
  hasMoreVisibleOutfits,
  loadMoreSentinel,
  loadMoreVisibleOutfits,
  disconnectLoadMoreObserver,
} = useArmoireStoreReviewFilter(
  storeCatalog,
  catalog,
  draftEntries,
  t,
  (outfit, region) => getLinkValue(outfit, region),
  (outfit) => getMergedTags(outfit),
  (outfit) => getMergedDetailTags(outfit),
  (outfit) => getMergedItemIds(outfit),
)

onMounted(() => {
  void loadCatalog()
  void loadStoreCatalog()
})

onBeforeUnmount(() => {
  disconnectLoadMoreObserver()
})

function reloadStoreCatalog(): void {
  void loadStoreCatalog({ force: true })
}
</script>

<style scoped>
.nsarmoire-store-review {
  display: grid;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  background: var(--ns-color-bg);
  font-family: var(--ns-font-sans);
}

.nsarmoire-store-review__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}

.nsarmoire-store-review__header h1,
.nsarmoire-store-review__outfit h2 {
  margin: 0;
  font-family: var(--ns-font-sans);
  letter-spacing: 0;
}

.nsarmoire-store-review__header h1 {
  font-size: 18px;
  font-weight: 850;
}

.nsarmoire-store-review__header p {
  margin: 6px 0 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-store-review__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.nsarmoire-store-review__edited-count {
  padding: 6px 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-store-review__controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 220px) minmax(150px, 220px);
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}

.nsarmoire-store-review__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-review__row {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(300px, 1.2fr) minmax(360px, 1.4fr) minmax(
      120px,
      0.45fr
    );
  gap: 12px;
  align-items: start;
  min-width: 0;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
}

.nsarmoire-store-review__row--edited {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-store-review__row--corrected {
  border-color: var(--ns-status-success-border);
}

.nsarmoire-store-review__row--excluded {
  border-color: var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
}

.nsarmoire-store-review__row--needs-mapping {
  box-shadow: inset 4px 0 0 var(--ns-status-danger-border);
}

.nsarmoire-store-review__outfit {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
}

.nsarmoire-store-review__cover {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-review__cover img,
.nsarmoire-store-review__cover span {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover;
}

.nsarmoire-store-review__cover span,
.nsarmoire-store-review__item-fallback {
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-pixel-surface);
}

.nsarmoire-store-review__outfit-main,
.nsarmoire-store-review__items,
.nsarmoire-store-review__links,
.nsarmoire-store-review__state {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.nsarmoire-store-review__outfit h2 {
  overflow: hidden;
  font-size: 15px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-review__column-label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsarmoire-store-review__tag-editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.nsarmoire-store-review__tag-editor-label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__tag-chip-list,
.nsarmoire-store-review__tag-selects {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
}

.nsarmoire-store-review__tag-chip {
  min-height: 24px;
  padding: 2px 6px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-size: 11px;
  font-weight: 850;
  line-height: 1.2;
  cursor: pointer;
}

.nsarmoire-store-review__tag-chip::after {
  content: '×';
  margin-left: 4px;
  color: var(--ns-color-text-muted);
}

.nsarmoire-store-review__tag-chip:hover {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-accent-soft);
}

.nsarmoire-store-review__tag-chip--detail {
  border-color: var(--ns-status-info-border);
  background: var(--ns-status-info-bg);
}

.nsarmoire-store-review__tag-selects select {
  min-width: 92px;
  max-width: 130px;
  min-height: 26px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-size: 12px;
}

.nsarmoire-store-review__items ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-review__items li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto auto auto;
  align-items: center;
  max-width: none;
  min-width: 0;
  gap: 5px;
  padding: 3px 6px 3px 3px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-size: 12px;
}

.nsarmoire-store-review__item--draft {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-store-review__items img,
.nsarmoire-store-review__item-fallback {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.nsarmoire-store-review__item-name {
  min-width: 0;
  line-height: 1.35;
}

.nsarmoire-store-review__item-id,
.nsarmoire-store-review__empty,
.nsarmoire-store-review__item-draft {
  flex: 0 0 auto;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsarmoire-store-review__item-draft {
  color: var(--ns-color-text);
  font-weight: 850;
}

.nsarmoire-store-review__candidates {
  display: grid;
  gap: 5px;
  margin-top: 6px;
}

.nsarmoire-store-review__candidate-label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__candidate-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.nsarmoire-store-review__candidate-group {
  display: inline-flex;
  align-items: stretch;
  max-width: 320px;
}

.nsarmoire-store-review__candidate {
  display: inline-grid;
  grid-template-columns: 22px minmax(0, 1fr) auto auto;
  align-items: center;
  min-width: 0;
  max-width: 240px;
  gap: 5px;
  padding: 3px 6px 3px 3px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 11px;
  text-align: left;
}

.nsarmoire-store-review__candidate-pieces {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  margin-left: -1px;
  padding: 3px 6px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

.nsarmoire-store-review__candidate:not(:disabled):hover,
.nsarmoire-store-review__candidate-pieces:not(:disabled):hover {
  border-color: var(--ns-pixel-border);
  transform: translate(-1px, -1px);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsarmoire-store-review__candidate:disabled,
.nsarmoire-store-review__candidate-pieces:disabled {
  opacity: 0.55;
}

.nsarmoire-store-review__candidate img,
.nsarmoire-store-review__candidate .nsarmoire-store-review__item-fallback {
  width: 22px;
  height: 22px;
  object-fit: cover;
}

.nsarmoire-store-review__candidate span:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-review__candidate-piece-count {
  color: var(--ns-color-text-muted);
}

.nsarmoire-store-review__item-remove,
.nsarmoire-store-review__add-item-control button,
.nsarmoire-store-review__state-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 6px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__add-item {
  display: grid;
  gap: 4px;
  margin-top: 2px;
}

.nsarmoire-store-review__add-item label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__add-item-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px;
}

.nsarmoire-store-review__add-item-control input {
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
}

.nsarmoire-store-review__link-field {
  display: grid;
  gap: 3px;
}

.nsarmoire-store-review__link-field label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__link-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px;
}

.nsarmoire-store-review__link-control input {
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
}

.nsarmoire-store-review__link-control a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 8px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
}

.nsarmoire-store-review__badge {
  display: inline-flex;
  justify-self: start;
  padding: 3px 6px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-surface);
  font-size: 12px;
  font-weight: 850;
}

.nsarmoire-store-review__badge--pending {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.nsarmoire-store-review__badge--corrected {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.nsarmoire-store-review__badge--excluded {
  border-color: var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
}

.nsarmoire-store-review__state-action {
  justify-self: start;
  min-height: 26px;
  margin-top: 2px;
  background: var(--ns-color-surface-solid);
}

.nsarmoire-store-review__state-action--danger {
  border-color: var(--ns-status-danger-border);
}

@media (max-width: 1180px) {
  .nsarmoire-store-review__row {
    grid-template-columns: minmax(220px, 0.9fr) minmax(280px, 1fr);
  }
}

@media (max-width: 760px) {
  .nsarmoire-store-review {
    padding: 8px;
  }

  .nsarmoire-store-review__header,
  .nsarmoire-store-review__controls,
  .nsarmoire-store-review__row {
    grid-template-columns: 1fr;
  }

  .nsarmoire-store-review__actions {
    justify-content: flex-start;
  }
}
</style>
