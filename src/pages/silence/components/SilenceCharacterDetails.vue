<template>
  <section class="silence-character-details" :aria-label="t(textKeys.silenceCharacterProfile)">
    <div class="silence-character-details__inner">
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
          <article v-for="world in character.worlds" :key="world.id" class="silence-character-card">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { textKeys } from '@/config/site'
import type { SilenceCharacter } from '@/data/silence/characters'
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

defineProps<{
  character: SilenceCharacter
  relationships: SilenceRelationshipCard[]
}>()

const { t } = useLocale()
</script>

<style scoped>
.silence-character-details {
  position: relative;
  padding: clamp(44px, 7vw, 84px) clamp(18px, 5vw, 72px) clamp(72px, 8vw, 120px);
  background:
    linear-gradient(180deg, rgba(255, 252, 255, 0.78), rgba(219, 249, 250, 0.62)),
    var(--ns-color-surface);
  overflow: hidden;
}

.silence-character-details::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    repeating-linear-gradient(90deg, rgba(99, 217, 220, 0.08) 0 1px, transparent 1px 32px),
    repeating-linear-gradient(0deg, rgba(239, 111, 178, 0.08) 0 1px, transparent 1px 32px);
  content: '';
  pointer-events: none;
}

.silence-character-details__inner {
  position: relative;
  z-index: 2;
  display: grid;
  width: min(1180px, 100%);
  gap: clamp(38px, 6vw, 68px);
  margin: 0 auto;
}

.silence-character-section {
  display: grid;
  gap: 16px;
  scroll-margin-top: 86px;
}

.silence-character-section__header {
  display: grid;
  gap: 6px;
}

.silence-character-section__header h2 {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-character-card,
.silence-character-note {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 16px;
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.07);
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
  font-family: var(--ns-font-display);
  font-size: 24px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-character-card p,
.silence-character-note p {
  margin: 0;
  color: rgba(49, 40, 63, 0.68);
}

@media (max-width: 920px) {
  .silence-character-card-grid,
  .silence-character-note-list {
    grid-template-columns: 1fr;
  }
}
</style>
