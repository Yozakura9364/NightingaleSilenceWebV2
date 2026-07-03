<template>
  <main class="ns-page silence-character-page" :style="pageStyle">
    <template v-if="character">
      <section class="silence-character-stage" :aria-labelledby="`${character.id}-title`">
        <RouterLink class="silence-character-back" :to="groupRoute">
          ← {{ t(textKeys.back) }}
        </RouterLink>

        <div class="silence-character-stage__visual" aria-hidden="true">
          <div class="silence-character-stage__halo"></div>
          <div class="silence-character-stage__figure">
            <span class="silence-character-stage__figure-head"></span>
            <span class="silence-character-stage__figure-body"></span>
            <span class="silence-character-stage__figure-line"></span>
          </div>
        </div>

        <article class="silence-character-stage__profile">
          <p class="ns-eyebrow">{{ t(groupTitleKey) }}</p>
          <h1 :id="`${character.id}-title`" class="silence-character-stage__name">
            {{ character.name }}
          </h1>
          <p class="ns-lead">
            {{ t(character.summaryKey) }}
          </p>

          <div class="silence-character-stage__tags" :aria-label="t(textKeys.status)">
            <span
              v-for="(tagKey, index) in character.tagKeys"
              :key="`${character.id}-tag-${index}`"
            >
              {{ t(tagKey) }}
            </span>
          </div>

          <dl class="silence-character-stage__facts">
            <div v-for="field in character.profile" :key="field.id">
              <dt>{{ t(field.labelKey) }}</dt>
              <dd>{{ t(field.valueKey) }}</dd>
            </div>
          </dl>

          <nav
            class="silence-character-stage__section-links"
            :aria-label="t(textKeys.silenceCharacterSections)"
          >
            <button
              v-for="item in detailNavItems"
              :key="item.id"
              type="button"
              @click="scrollToSection(item.targetId)"
            >
              {{ t(item.labelKey) }}
            </button>
          </nav>
        </article>

        <nav
          class="silence-character-stage__nav"
          :aria-label="t(textKeys.silenceCharacterNavigation)"
        >
          <RouterLink
            v-for="candidate in groupCharacters"
            :key="candidate.id"
            class="silence-character-stage__nav-link"
            :class="{ 'silence-character-stage__nav-link--active': candidate.id === character.id }"
            :to="getSilenceCharacterRoute(candidate)"
          >
            {{ candidate.name }}
          </RouterLink>
        </nav>
      </section>

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

            <SilenceRelationshipList :relationships="relationshipCards" />
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

    <section v-else class="silence-character-missing" :aria-labelledby="missingTitleId">
      <RouterLink class="silence-character-back" :to="siteRoutes.silence">
        ← {{ t(textKeys.back) }}
      </RouterLink>
      <h1 :id="missingTitleId" class="ns-title">{{ t(textKeys.silenceCharacterMissing) }}</h1>
      <p class="ns-lead">{{ t(textKeys.placeholder) }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { silenceGroups, siteRoutes, textKeys } from '@/config/site'
import {
  getSilenceCharacter,
  getSilenceCharacterById,
  getSilenceCharacterRoute,
  getSilenceCharactersByGroup,
  isSilenceGroupId
} from '@/data/silence/characters'
import SilenceGallery from '@/pages/silence/components/SilenceGallery.vue'
import SilenceProfilePanel from '@/pages/silence/components/SilenceProfilePanel.vue'
import SilenceRelationshipList from '@/pages/silence/components/SilenceRelationshipList.vue'
import SilenceSpoilerBlock from '@/pages/silence/components/SilenceSpoilerBlock.vue'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()
const missingTitleId = 'silence-character-missing-title'
const groupId = computed(() => normalizeParam(route.params.groupId) || getGroupIdFromPath())
const characterId = computed(() => normalizeParam(route.params.characterId))
const character = computed(() => {
  if (!isSilenceGroupId(groupId.value) || !characterId.value) {
    return undefined
  }

  return getSilenceCharacter(groupId.value, characterId.value)
})
const groupCharacters = computed(() => {
  if (!isSilenceGroupId(groupId.value)) {
    return []
  }

  return getSilenceCharactersByGroup(groupId.value)
})
const groupEntry = computed(
  () => silenceGroups.find((group) => group.id === groupId.value) ?? silenceGroups[0]
)
const groupTitleKey = computed(() => groupEntry.value.titleKey)
const groupRoute = computed(() => groupEntry.value.route)
const pageStyle = computed(() => ({
  '--silence-character-color': character.value?.color ?? '#63d9dc'
}))
const detailNavItems = computed(() => {
  const baseId = character.value?.id ?? 'silence-character'

  return [
    {
      id: 'basic',
      labelKey: textKeys.silenceCharacterBasicProfile,
      targetId: `${baseId}-basic`
    },
    {
      id: 'worlds',
      labelKey: textKeys.silenceCharacterWorlds,
      targetId: `${baseId}-worlds`
    },
    {
      id: 'gallery',
      labelKey: textKeys.silenceCharacterGallery,
      targetId: `${baseId}-gallery`
    },
    {
      id: 'relationships',
      labelKey: textKeys.silenceCharacterRelationships,
      targetId: `${baseId}-relationships`
    },
    {
      id: 'notes',
      labelKey: textKeys.silenceCharacterNotes,
      targetId: `${baseId}-notes`
    }
  ]
})
const relationshipCards = computed(
  () =>
    character.value?.relationships.map((relationship) => {
      const target = getSilenceCharacterById(relationship.characterId)

      return {
        ...relationship,
        name: target?.name ?? relationship.characterId,
        route: target ? getSilenceCharacterRoute(target) : groupRoute.value
      }
    }) ?? []
)

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getGroupIdFromPath() {
  const [, firstSegment, secondSegment] = route.path.split('/')

  if (firstSegment !== 'silence' || !secondSegment) {
    return ''
  }

  return secondSegment
}

function scrollToSection(targetId: string) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.silence-character-page {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow: visible;
  background:
    radial-gradient(
      circle at 72% 24%,
      color-mix(in srgb, var(--silence-character-color), transparent 68%),
      transparent 30%
    ),
    linear-gradient(120deg, rgba(255, 248, 253, 0.94), rgba(219, 249, 250, 0.72)),
    var(--ns-body-background);
}

.silence-character-stage,
.silence-character-missing {
  position: relative;
  display: grid;
  min-height: calc(100vh - 56px);
  grid-template-columns: minmax(320px, 0.92fr) minmax(360px, 0.78fr);
  gap: clamp(28px, 5vw, 76px);
  align-items: center;
  padding: clamp(24px, 5vw, 72px);
  overflow: hidden;
}

.silence-character-stage::before,
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

.silence-character-back {
  position: absolute;
  top: clamp(22px, 4vw, 44px);
  left: clamp(18px, 5vw, 72px);
  z-index: 8;
  color: rgba(49, 40, 63, 0.68);
  font-size: 14px;
  font-weight: 800;
}

.silence-character-back:hover {
  color: var(--ns-color-accent-strong);
}

.silence-character-stage__visual,
.silence-character-stage__profile,
.silence-character-stage__nav,
.silence-character-missing > *,
.silence-character-details__inner {
  position: relative;
  z-index: 2;
}

.silence-character-stage__visual {
  display: grid;
  min-height: min(70vh, 720px);
  place-items: end center;
}

.silence-character-stage__halo {
  position: absolute;
  inset: 14% 4% 11%;
  border: 2px solid color-mix(in srgb, var(--silence-character-color), #ffffff 28%);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.42), transparent),
    color-mix(in srgb, var(--silence-character-color), transparent 84%);
  box-shadow:
    12px 12px 0 rgba(99, 217, 220, 0.12),
    -8px -8px 0 rgba(239, 111, 178, 0.08);
  transform: skewX(-5deg);
}

.silence-character-stage__figure {
  position: relative;
  width: min(48vw, 360px);
  min-width: 220px;
  height: min(68vh, 620px);
  filter: drop-shadow(18px 20px 0 rgba(42, 33, 56, 0.1));
}

.silence-character-stage__figure-head,
.silence-character-stage__figure-body,
.silence-character-stage__figure-line {
  position: absolute;
  display: block;
  border: 2px solid rgba(42, 33, 56, 0.52);
}

.silence-character-stage__figure-head {
  top: 0;
  left: 50%;
  width: 34%;
  aspect-ratio: 1;
  background: rgba(255, 250, 253, 0.92);
  box-shadow: 7px 7px 0 color-mix(in srgb, var(--silence-character-color), transparent 68%);
  transform: translateX(-50%);
}

.silence-character-stage__figure-body {
  right: 8%;
  bottom: 0;
  left: 8%;
  height: 82%;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.72),
      color-mix(in srgb, var(--silence-character-color), transparent 70%)
    ),
    var(--ns-color-cyan-soft);
  box-shadow:
    9px 9px 0 rgba(99, 217, 220, 0.18),
    -6px -6px 0 rgba(239, 111, 178, 0.12);
}

.silence-character-stage__figure-line {
  right: 0;
  bottom: 15%;
  left: 0;
  height: 2px;
  border: 0;
  background: rgba(42, 33, 56, 0.28);
  box-shadow:
    0 18px 0 color-mix(in srgb, var(--silence-character-color), transparent 52%),
    0 36px 0 rgba(239, 111, 178, 0.18);
}

.silence-character-stage__profile {
  display: grid;
  gap: 16px;
  max-width: 620px;
  padding: clamp(18px, 3vw, 28px);
  border: 2px solid rgba(42, 33, 56, 0.52);
  background: rgba(255, 252, 255, 0.82);
  box-shadow: 8px 8px 0 rgba(42, 33, 56, 0.08);
  backdrop-filter: blur(16px);
}

.silence-character-stage__name {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: clamp(52px, 8vw, 104px);
  font-weight: 950;
  line-height: 0.92;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  text-shadow:
    3px 3px 0 color-mix(in srgb, var(--silence-character-color), transparent 54%),
    -2px -2px 0 rgba(239, 111, 178, 0.14);
}

.silence-character-stage__profile .ns-lead {
  color: rgba(49, 40, 63, 0.62);
}

.silence-character-stage__tags,
.silence-character-stage__section-links,
.silence-character-stage__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.silence-character-stage__tags span,
.silence-character-stage__nav-link,
.silence-character-stage__section-links button {
  border: 2px solid rgba(42, 33, 56, 0.46);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.62);
  color: #2c2338;
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.silence-character-stage__tags span,
.silence-character-stage__section-links button {
  padding: 5px 8px;
}

.silence-character-stage__section-links button:hover,
.silence-character-stage__nav-link:hover,
.silence-character-stage__nav-link--active {
  background: color-mix(in srgb, var(--silence-character-color), #ffffff 64%);
  color: #2c2338;
}

.silence-character-stage__facts {
  display: grid;
  gap: 10px;
  margin: 0;
}

.silence-character-stage__facts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.silence-character-stage__facts div {
  min-width: 0;
  padding: 12px;
  border: 2px solid rgba(42, 33, 56, 0.24);
  background: rgba(255, 255, 255, 0.48);
}

.silence-character-stage__facts dt {
  color: color-mix(in srgb, var(--silence-character-color), #2c2338 42%);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.silence-character-stage__facts dd {
  margin: 4px 0 0;
  color: rgba(49, 40, 63, 0.7);
  overflow-wrap: anywhere;
}

.silence-character-stage__nav {
  position: absolute;
  right: clamp(18px, 5vw, 72px);
  bottom: clamp(22px, 5vh, 56px);
  left: clamp(18px, 5vw, 72px);
  z-index: 8;
  justify-content: center;
}

.silence-character-stage__nav-link {
  padding: 8px 10px;
  text-decoration: none;
  box-shadow: 4px 4px 0 rgba(42, 33, 56, 0.06);
}

.silence-character-details {
  position: relative;
  padding: clamp(44px, 7vw, 84px) clamp(18px, 5vw, 72px) clamp(72px, 8vw, 120px);
  background:
    linear-gradient(180deg, rgba(255, 252, 255, 0.78), rgba(219, 249, 250, 0.62)),
    var(--ns-color-surface);
  overflow: hidden;
}

.silence-character-details__inner {
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

.silence-character-card,
.silence-character-note {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 16px;
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

.silence-character-missing {
  display: grid;
  grid-template-columns: minmax(0, 760px);
  place-content: center;
}

@media (max-width: 920px) {
  .silence-character-stage,
  .silence-character-missing {
    min-height: calc(100vh - 56px);
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 76px 14px 170px;
  }

  .silence-character-stage__visual {
    min-height: 340px;
  }

  .silence-character-stage__figure {
    width: min(72vw, 280px);
    min-width: 190px;
    height: 360px;
  }

  .silence-character-stage__profile {
    max-width: none;
  }

  .silence-character-stage__facts,
  .silence-character-card-grid,
  .silence-character-note-list {
    grid-template-columns: 1fr;
  }

  .silence-character-stage__nav {
    right: 14px;
    bottom: 34px;
    left: 14px;
  }
}
</style>
