<template>
  <section class="silence-character-details" :aria-label="t(textKeys.silenceCharacterProfile)">
    <div class="silence-character-details__inner">
      <template v-if="character.content">
        <section
          :id="`${character.id}-overview`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-overview-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">
              {{ character.content.names.title ?? character.content.names.en }}
            </p>
            <h2 :id="`${character.id}-overview-title`">
              {{ character.content.sections.overview }}
            </h2>
          </div>

          <div class="silence-character-body">
            <p v-for="paragraph in character.content.overview" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>
        </section>

        <section
          :id="`${character.id}-basic`"
          class="silence-character-section silence-character-section--basic"
          :aria-labelledby="`${character.id}-basic-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ character.content.names.en }}</p>
            <h2 :id="`${character.id}-basic-title`">
              {{ character.content.sections.basic }}
            </h2>
          </div>

          <div class="silence-character-section__content">
            <dl class="silence-character-profile-sheet">
              <div v-for="fact in visibleFacts" :key="fact.id">
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>

            <div v-if="character.content.appearance.length" class="silence-character-lore-list">
              <article
                v-for="section in character.content.appearance"
                :key="section.id"
                class="silence-character-lore-block"
              >
                <h3>{{ section.title }}</h3>
                <ul class="silence-character-point-list">
                  <li v-for="point in section.points" :key="point">{{ point }}</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section
          v-if="character.forms.length"
          :id="`${character.id}-forms`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-forms-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ character.content.names.zh }}</p>
            <h2 :id="`${character.id}-forms-title`">
              {{ character.content.sections.forms }}
            </h2>
          </div>

          <SilenceFormOutfitPanel
            :forms="character.forms"
            :outfits="character.content.outfits"
            :active-form-id="activeFormId"
            :outfit-label="character.content.sections.outfits"
            :show-outfits="false"
          />
        </section>

        <section
          v-if="character.content.outfits.length"
          :id="`${character.id}-outfits`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-outfits-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ character.content.names.zh }}</p>
            <h2 :id="`${character.id}-outfits-title`">
              {{ character.content.sections.outfits }}
            </h2>
          </div>

          <SilenceFormOutfitPanel
            :forms="character.forms"
            :outfits="character.content.outfits"
            :outfit-label="character.content.sections.outfits"
            :filter-outfits-by-form="false"
            :show-forms="false"
          />
        </section>

        <section
          :id="`${character.id}-combat`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-combat-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ character.content.names.titleEn }}</p>
            <h2 :id="`${character.id}-combat-title`">
              {{ character.content.sections.combat }}
            </h2>
          </div>

          <ul class="silence-character-point-list silence-character-point-list--wide">
            <li v-for="point in character.content.combat" :key="point">{{ point }}</li>
          </ul>
        </section>

        <section
          v-if="visibleStory.length"
          :id="`${character.id}-story`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-story-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ character.content.names.zh }}</p>
            <h2 :id="`${character.id}-story-title`">
              {{ character.content.sections.story }}
            </h2>
          </div>

          <details v-for="story in visibleStory" :key="story.id" class="silence-character-story">
            <summary>{{ story.title }}</summary>
            <p v-for="paragraph in story.body" :key="paragraph">{{ paragraph }}</p>
          </details>
        </section>
      </template>

      <template v-else>
        <section
          :id="`${character.id}-basic`"
          class="silence-character-section silence-character-section--basic"
          :aria-labelledby="`${character.id}-basic-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ t(textKeys.silenceCharacterProfile) }}</p>
            <h2 :id="`${character.id}-basic-title`">
              {{ t(textKeys.silenceCharacterBasicProfile) }}
            </h2>
          </div>

          <SilenceProfilePanel :profile="character.profile" :color="character.color" />
        </section>

        <section
          :id="`${character.id}-worlds`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-worlds-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ t(textKeys.silenceCharacterArchive) }}</p>
            <h2 :id="`${character.id}-worlds-title`">
              {{ t(textKeys.silenceCharacterWorlds) }}
            </h2>
          </div>

          <div class="silence-character-card-grid">
            <article
              v-for="world in character.worlds"
              :key="world.id"
              class="silence-character-card"
            >
              <h3>{{ t(world.labelKey) }}</h3>
              <p>{{ t(world.summaryKey) }}</p>
            </article>
          </div>
        </section>

        <section
          :id="`${character.id}-gallery`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-gallery-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ t(textKeys.silenceCharacterVisual) }}</p>
            <h2 :id="`${character.id}-gallery-title`">
              {{ t(textKeys.silenceCharacterGallery) }}
            </h2>
          </div>

          <SilenceGallery :items="character.gallery" />
        </section>

        <section
          :id="`${character.id}-relationships`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-relationships-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ t(textKeys.silenceCharacterProfile) }}</p>
            <h2 :id="`${character.id}-relationships-title`">
              {{ t(textKeys.silenceCharacterRelationships) }}
            </h2>
          </div>

          <SilenceRelationshipList :relationships="relationships" />
        </section>

        <section
          :id="`${character.id}-notes`"
          class="silence-character-section"
          :aria-labelledby="`${character.id}-notes-title`"
        >
          <div class="silence-character-section__header">
            <p class="ns-eyebrow">{{ t(textKeys.silenceCharacterArchive) }}</p>
            <h2 :id="`${character.id}-notes-title`">
              {{ t(textKeys.silenceCharacterNotes) }}
            </h2>
          </div>

          <div class="silence-character-note-list">
            <article v-for="note in character.notes" :key="note.id" class="silence-character-note">
              <h3>{{ t(note.titleKey) }}</h3>
              <p>{{ t(note.bodyKey) }}</p>
            </article>
          </div>
        </section>

        <SilenceSpoilerBlock :spoilers="character.spoilers" />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { textKeys } from '@/config/site'
import type { SilenceCharacter } from '@/data/silence/characters'
import SilenceFormOutfitPanel from '@/pages/silence/components/SilenceFormOutfitPanel.vue'
import SilenceGallery from '@/pages/silence/components/SilenceGallery.vue'
import SilenceProfilePanel from '@/pages/silence/components/SilenceProfilePanel.vue'
import SilenceRelationshipList from '@/pages/silence/components/SilenceRelationshipList.vue'
import SilenceSpoilerBlock from '@/pages/silence/components/SilenceSpoilerBlock.vue'
import { useLocale } from '@/stores/locale'

interface SilenceRelationshipCard {
  id: string
  name: string
  route: string
  labelKey: string
  summaryKey: string
}

const props = defineProps<{
  character: SilenceCharacter
  relationships: SilenceRelationshipCard[]
  activeFormId?: string
}>()

const { t } = useLocale()
const visibleFacts = computed(
  () =>
    props.character.content?.facts.filter(
      (fact) => fact.visibility !== 'private' && !isEmptyProfileValue(fact.value)
    ) ?? []
)
const visibleStory = computed(
  () => props.character.content?.story.filter((story) => story.visibility !== 'private') ?? []
)

function isEmptyProfileValue(value: string) {
  return value.trim() === '' || value.trim() === '∅'
}
</script>

<style scoped>
.silence-character-details {
  position: relative;
  padding: clamp(52px, 7vw, 92px) clamp(18px, 5vw, 72px) clamp(78px, 8vw, 128px);
  background:
    linear-gradient(180deg, rgba(255, 253, 252, 0.94), rgba(246, 248, 248, 0.9)),
    var(--ns-color-surface);
  overflow: hidden;
}

.silence-character-details::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(112deg, transparent 0 16%, rgba(255, 255, 255, 0.68) 16% 17%, transparent 17%),
    radial-gradient(
      circle at 12% 12%,
      color-mix(in srgb, var(--silence-character-color), transparent 86%),
      transparent 34%
    );
  content: '';
  pointer-events: none;
}

.silence-character-details__inner {
  position: relative;
  z-index: 2;
  display: grid;
  width: min(1120px, 100%);
  gap: clamp(34px, 5vw, 58px);
  margin: 0 auto;
}

.silence-character-section {
  display: grid;
  grid-template-columns: minmax(156px, 236px) minmax(0, 1fr);
  gap: clamp(20px, 4vw, 48px);
  align-items: start;
  padding-block: clamp(26px, 4vw, 46px);
  border-top: 1px solid rgba(42, 33, 56, 0.14);
  scroll-margin-top: 86px;
}

.silence-character-section:first-child {
  border-top: 0;
}

.silence-character-section__header {
  display: grid;
  gap: 10px;
  padding-top: 2px;
}

.silence-character-section__header h2 {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-sans);
  font-size: clamp(26px, 3.4vw, 42px);
  font-weight: 850;
  line-height: 1.08;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-character-section__header::after {
  width: min(86px, 42%);
  height: 2px;
  background: color-mix(in srgb, var(--silence-character-color), #2c2338 14%);
  content: '';
}

.silence-character-section__content {
  display: grid;
  min-width: 0;
  gap: 18px;
}

.silence-character-card,
.silence-character-note {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(42, 33, 56, 0.16);
  background: rgba(255, 255, 255, 0.62);
}

.silence-character-card-grid,
.silence-character-note-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.silence-character-card h3,
.silence-character-note h3 {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-sans);
  font-size: 20px;
  font-weight: 820;
  line-height: 1.2;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-character-card p,
.silence-character-note p {
  margin: 0;
  color: rgba(49, 40, 63, 0.68);
}

.silence-character-body,
.silence-character-story {
  display: grid;
  gap: 12px;
  padding: 2px 0 2px 18px;
  border-left: 2px solid color-mix(in srgb, var(--silence-character-color), #2c2338 18%);
  background: transparent;
}

.silence-character-body p,
.silence-character-story p {
  margin: 0;
  color: rgba(49, 40, 63, 0.76);
  line-height: 1.8;
}

.silence-character-profile-sheet {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border: 1px solid rgba(42, 33, 56, 0.16);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.52)),
    color-mix(in srgb, var(--silence-character-color), transparent 92%);
}

.silence-character-profile-sheet div {
  display: grid;
  grid-template-columns: minmax(88px, 0.34fr) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  min-height: 52px;
  padding: 12px 18px;
  border-right: 1px solid rgba(42, 33, 56, 0.1);
  border-bottom: 1px solid rgba(42, 33, 56, 0.1);
}

.silence-character-profile-sheet div:nth-child(2n) {
  border-right: 0;
}

.silence-character-profile-sheet div:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.silence-character-profile-sheet div:last-child:nth-child(odd) {
  grid-column: 1 / -1;
  grid-template-columns: minmax(88px, 0.17fr) minmax(0, 1fr);
  border-right: 0;
}

.silence-character-profile-sheet div:nth-last-child(2):nth-child(even) {
  border-bottom: 1px solid rgba(42, 33, 56, 0.1);
}

.silence-character-profile-sheet dt {
  color: color-mix(in srgb, var(--silence-character-color), #2c2338 38%);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 760;
}

.silence-character-profile-sheet dd {
  margin: 0;
  color: rgba(49, 40, 63, 0.78);
  font-size: 15px;
  overflow-wrap: anywhere;
}

.silence-character-lore-list {
  display: grid;
  gap: 0;
}

.silence-character-lore-block {
  display: grid;
  grid-template-columns: minmax(112px, 0.22fr) minmax(0, 1fr);
  gap: 12px 22px;
  padding-block: 20px;
  border-bottom: 1px solid rgba(42, 33, 56, 0.12);
}

.silence-character-lore-block:first-child {
  padding-top: 0;
}

.silence-character-lore-block h3 {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-sans);
  font-size: 18px;
  font-weight: 820;
  line-height: 1.25;
  letter-spacing: 0;
}

.silence-character-point-list,
.silence-character-equipment-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 0;
  color: rgba(49, 40, 63, 0.7);
  list-style: none;
}

.silence-character-point-list li,
.silence-character-equipment-list li {
  position: relative;
  padding-left: 18px;
  line-height: 1.65;
}

.silence-character-point-list li::before,
.silence-character-equipment-list li::before {
  position: absolute;
  top: 0.72em;
  left: 0;
  width: 7px;
  height: 7px;
  background: color-mix(in srgb, var(--silence-character-color), #2c2338 18%);
  content: '';
}

.silence-character-point-list--wide {
  padding: 2px 0 2px 18px;
  border-left: 2px solid color-mix(in srgb, var(--silence-character-color), #2c2338 18%);
}

.silence-character-outfit-list {
  display: grid;
  gap: 0;
}

.silence-character-outfit {
  display: grid;
  grid-template-columns: minmax(132px, 0.26fr) minmax(0, 1fr);
  gap: 8px 24px;
  padding-block: 18px;
  border-bottom: 1px solid rgba(42, 33, 56, 0.16);
}

.silence-character-outfit:first-child {
  padding-top: 0;
}

.silence-character-outfit h3 {
  grid-row: span 2;
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: 24px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
}

.silence-character-outfit p {
  margin: 0;
  color: rgba(49, 40, 63, 0.72);
  line-height: 1.75;
}

.silence-character-story summary {
  color: #2c2338;
  font-family: var(--ns-font-sans);
  font-size: 20px;
  font-weight: 820;
  cursor: pointer;
}

@media (max-width: 920px) {
  .silence-character-section {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .silence-character-lore-block,
  .silence-character-outfit {
    grid-template-columns: 1fr;
  }

  .silence-character-outfit h3 {
    grid-row: auto;
  }

  .silence-character-card-grid,
  .silence-character-note-list,
  .silence-character-profile-sheet {
    grid-template-columns: 1fr;
  }

  .silence-character-profile-sheet div,
  .silence-character-profile-sheet div:nth-child(2n) {
    border-right: 0;
  }

  .silence-character-profile-sheet div:nth-last-child(-n + 2) {
    border-bottom: 1px solid rgba(42, 33, 56, 0.14);
  }

  .silence-character-profile-sheet div:last-child {
    border-bottom: 0;
  }
}
</style>
