<template>
  <main class="ns-page silence-character-page" :style="pageStyle">
    <section
      v-if="character"
      class="silence-character-stage"
      :aria-labelledby="`${character.id}-title`"
    >
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
          <span v-for="(tagKey, index) in character.tagKeys" :key="`${character.id}-tag-${index}`">
            {{ t(tagKey) }}
          </span>
        </div>

        <dl class="silence-character-stage__facts">
          <div v-for="field in character.profile" :key="field.id">
            <dt>{{ t(field.labelKey) }}</dt>
            <dd>{{ t(field.valueKey) }}</dd>
          </div>
        </dl>
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
  getSilenceCharacterRoute,
  getSilenceCharactersByGroup,
  isSilenceGroupId
} from '@/data/silence/characters'
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
</script>

<style scoped>
.silence-character-page {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 24%, color-mix(in srgb, var(--silence-character-color), transparent 68%), transparent 30%),
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

.silence-character-stage::before {
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
.silence-character-missing > * {
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), color-mix(in srgb, var(--silence-character-color), transparent 70%)),
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

.silence-character-stage__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.silence-character-stage__tags span,
.silence-character-stage__nav-link {
  border: 2px solid rgba(42, 33, 56, 0.46);
  background: rgba(255, 255, 255, 0.62);
  color: #2c2338;
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.silence-character-stage__tags span {
  padding: 5px 8px;
}

.silence-character-stage__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.silence-character-stage__nav-link {
  padding: 8px 10px;
  text-decoration: none;
  box-shadow: 4px 4px 0 rgba(42, 33, 56, 0.06);
}

.silence-character-stage__nav-link:hover,
.silence-character-stage__nav-link--active {
  background: color-mix(in srgb, var(--silence-character-color), #ffffff 64%);
  color: #2c2338;
}

.silence-character-missing {
  display: grid;
  grid-template-columns: minmax(0, 760px);
  place-content: center;
}

@media (max-width: 920px) {
  .silence-character-page {
    overflow: visible;
  }

  .silence-character-stage,
  .silence-character-missing {
    min-height: calc(100vh - 56px);
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 76px 14px 160px;
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

  .silence-character-stage__facts {
    grid-template-columns: 1fr;
  }

  .silence-character-stage__nav {
    right: 14px;
    bottom: 34px;
    left: 14px;
  }
}
</style>
