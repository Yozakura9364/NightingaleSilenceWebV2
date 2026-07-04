<template>
  <section class="silence-character-stage" :aria-labelledby="`${character.id}-title`">
    <div class="silence-character-stage__visual" aria-hidden="true">
      <div class="silence-character-stage__halo"></div>
      <div
        class="silence-character-stage__figure"
        :class="{
          'silence-character-stage__figure--portrait': character.portraitSrc,
          'silence-character-stage__figure--portrait-ready': isPortraitReady
        }"
      >
        <img
          v-if="character.portraitSrc"
          :key="portraitAnimationKey"
          class="silence-character-stage__portrait"
          :src="character.portraitSrc"
          alt=""
          decoding="async"
          @load="handlePortraitLoad"
        />
        <template v-else>
          <span class="silence-character-stage__figure-head"></span>
          <span class="silence-character-stage__figure-body"></span>
          <span class="silence-character-stage__figure-line"></span>
        </template>
      </div>
    </div>

    <article class="silence-character-stage__profile">
      <p class="ns-eyebrow">{{ t(groupTitleKey) }}</p>
      <h1 :id="`${character.id}-title`" class="silence-character-stage__name">
        {{ character.name }}
      </h1>
      <p v-if="character.aliases.length" class="silence-character-stage__aliases">
        {{ character.aliases.join(' / ') }}
      </p>
      <p class="ns-lead">
        {{ character.summary ?? t(character.summaryKey) }}
      </p>

      <div
        v-if="character.tagLabels?.length"
        class="silence-character-stage__tags"
        :aria-label="t(textKeys.status)"
      >
        <span v-for="tagLabel in character.tagLabels" :key="`${character.id}-tag-${tagLabel}`">
          {{ tagLabel }}
        </span>
      </div>

      <div v-else class="silence-character-stage__tags" :aria-label="t(textKeys.status)">
        <span v-for="(tagKey, index) in character.tagKeys" :key="`${character.id}-tag-${index}`">
          {{ t(tagKey) }}
        </span>
      </div>

      <dl
        v-if="character.stageFacts?.length"
        class="silence-character-stage__facts silence-character-stage__facts--inline"
      >
        <div v-for="field in character.stageFacts" :key="field.id">
          <dt>{{ field.label }}</dt>
          <dd>{{ field.value }}</dd>
        </div>
      </dl>

      <dl v-else class="silence-character-stage__facts">
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
          @click="emit('sectionRequest', item.targetId)"
        >
          {{ item.label ?? t(item.labelKey ?? textKeys.placeholder) }}
        </button>
      </nav>
    </article>

    <SilenceTurnHint
      :label="t(textKeys.silenceCharacterNavigation)"
      :left-to="leftTo"
      :left-label="leftLabel"
      :right-to="rightTo"
      :right-label="rightLabel"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { textKeys } from '@/config/site'
import type { SilenceCharacter } from '@/data/silence/characters'
import SilenceTurnHint from '@/pages/silence/components/SilenceTurnHint.vue'
import { useLocale } from '@/stores/locale'

interface SilenceCharacterDetailNavItem {
  id: string
  labelKey?: string
  label?: string
  targetId: string
}

const props = defineProps<{
  character: SilenceCharacter
  groupTitleKey: string
  detailNavItems: SilenceCharacterDetailNavItem[]
  leftTo?: string
  leftLabel?: string
  rightTo?: string
  rightLabel?: string
}>()

const emit = defineEmits<{
  sectionRequest: [targetId: string]
}>()

const { t } = useLocale()
const loadedPortraitKey = ref('')
const portraitAnimationKey = computed(() =>
  props.character.portraitSrc
    ? `${props.character.id}-${props.character.name}-${props.character.portraitSrc}`
    : ''
)
const isPortraitReady = computed(
  () =>
    Boolean(portraitAnimationKey.value) && loadedPortraitKey.value === portraitAnimationKey.value
)

watch(
  portraitAnimationKey,
  () => {
    loadedPortraitKey.value = ''
  },
  { immediate: true }
)

async function handlePortraitLoad(event: Event) {
  const image = event.currentTarget

  if (!(image instanceof HTMLImageElement)) {
    return
  }

  try {
    await image.decode()
  } catch {
    // The load event is still enough to avoid the initial flash if decode() is unavailable.
  }

  loadedPortraitKey.value = portraitAnimationKey.value
}
</script>

<style scoped>
.silence-character-stage {
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
    radial-gradient(circle at 26% 26%, rgba(255, 255, 255, 0.48), transparent 32%),
    linear-gradient(135deg, rgba(99, 217, 220, 0.1), transparent 46%),
    linear-gradient(45deg, rgba(239, 111, 178, 0.08), transparent 52%);
  content: '';
  pointer-events: none;
}

.silence-character-stage__visual,
.silence-character-stage__profile {
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
}

.silence-character-stage__figure--portrait {
  display: grid;
  width: min(54vw, 430px);
  height: min(74vh, 720px);
  overflow: hidden;
  place-items: end center;
}

.silence-character-stage__portrait {
  position: absolute;
  right: -4%;
  bottom: -14%;
  left: -4%;
  display: block;
  width: auto;
  height: 100%;
  opacity: 0;
  object-fit: contain;
  object-position: bottom center;
  transform-origin: bottom center;
}

.silence-character-stage__figure--portrait-ready .silence-character-stage__portrait {
  animation: silencePortraitRise 2.35s cubic-bezier(0.16, 1, 0.24, 1) 0.12s both;
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
  background: rgba(255, 252, 255, 0.94);
  box-shadow: 8px 8px 0 rgba(42, 33, 56, 0.08);
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

.silence-character-stage__aliases {
  margin: -8px 0 0;
  color: color-mix(in srgb, var(--silence-character-color), #2c2338 36%);
  font-family: var(--ns-font-decorative);
  font-size: 14px;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.silence-character-stage__tags,
.silence-character-stage__section-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.silence-character-stage__tags span,
.silence-character-stage__section-links button {
  border: 2px solid rgba(42, 33, 56, 0.46);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.62);
  color: #2c2338;
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
}

.silence-character-stage__tags span,
.silence-character-stage__section-links button {
  padding: 5px 8px;
}

.silence-character-stage__section-links button:hover,
.silence-character-stage__section-links button:focus-visible {
  background: color-mix(in srgb, var(--silence-character-color), #ffffff 64%);
  color: #2c2338;
}

.silence-character-stage__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.silence-character-stage__facts--inline {
  grid-template-columns: 1fr;
  gap: 0;
  border-block: 2px solid rgba(42, 33, 56, 0.18);
}

.silence-character-stage__facts div {
  min-width: 0;
  padding: 12px;
  border: 2px solid rgba(42, 33, 56, 0.24);
  background: rgba(255, 255, 255, 0.48);
}

.silence-character-stage__facts--inline div {
  display: grid;
  grid-template-columns: minmax(72px, 0.34fr) minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid rgba(42, 33, 56, 0.14);
  background: transparent;
}

.silence-character-stage__facts--inline div:last-child {
  border-bottom: 0;
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

.silence-character-stage__facts--inline dd {
  margin: 0;
  color: rgba(49, 40, 63, 0.76);
  font-size: 14px;
}

@keyframes silencePortraitRise {
  0% {
    bottom: -18%;
    opacity: 0;
  }

  34% {
    opacity: 0.48;
  }

  68% {
    bottom: -7%;
    opacity: 0.92;
  }

  100% {
    bottom: -4%;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .silence-character-stage__portrait {
    animation: none;
  }

  .silence-character-stage__portrait {
    bottom: -4%;
    opacity: 1;
  }
}

@media (max-width: 920px) {
  .silence-character-stage {
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

  .silence-character-stage__figure--portrait {
    width: min(82vw, 320px);
    height: 380px;
  }

  .silence-character-stage__profile {
    max-width: none;
  }

  .silence-character-stage__facts {
    grid-template-columns: 1fr;
  }
}
</style>
