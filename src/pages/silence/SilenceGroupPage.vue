<template>
  <main class="ns-page silence-group-page" :class="`silence-group-page--${currentGroup.id}`">
    <section
      class="silence-group-stage"
      :class="`silence-group-stage--${currentGroup.id}`"
      :aria-labelledby="`${currentGroup.id}-title`"
    >
      <RouterLink class="silence-back" :to="siteRoutes.silence">
        ← {{ t(textKeys.back) }}
      </RouterLink>

      <div class="silence-group-stage__copy">
        <p class="ns-eyebrow">{{ t(textKeys.silence) }}</p>
        <h1 :id="`${currentGroup.id}-title`" class="ns-title">
          {{ t(currentGroup.titleKey) }}
        </h1>
        <p class="ns-lead">
          {{ t(currentGroup.summaryKey) }}
        </p>
      </div>

      <div class="silence-group-stage__visual" :aria-label="t(currentGroup.titleKey)">
        <button
          v-for="item in visualItems"
          :key="item.id"
          class="silence-group-stage__character"
          :class="[
            `silence-group-stage__character--${currentGroup.id}`,
            `silence-group-stage__character--${currentGroup.id}-${item.slot}`,
            { 'silence-group-stage__character--active': selectedVisualId === item.id }
          ]"
          type="button"
          :aria-label="getSlotLabel(item)"
          :aria-pressed="selectedVisualId === item.id"
          @click="selectVisual(item.id)"
          @focus="selectVisual(item.id)"
          @mouseenter="selectVisual(item.id)"
          @keydown.enter.prevent="openVisual(item)"
          @keydown.space.prevent="openVisual(item)"
          @keydown.left.prevent="selectPrevious"
          @keydown.right.prevent="selectNext"
        >
          <template v-if="currentGroup.id === 'angel'">
            <span class="silence-group-stage__figure-head"></span>
            <span class="silence-group-stage__figure-body"></span>
          </template>
          <template v-else>
            <span class="silence-group-stage__window-bar"></span>
            <span class="silence-group-stage__window-ghost"></span>
            <span class="silence-group-stage__window-scan"></span>
          </template>
        </button>
      </div>

      <div class="silence-group-stage__nav" :aria-label="t(currentGroup.titleKey)">
        <button
          v-for="item in visualItems"
          :key="item.id"
          class="silence-group-stage__dot"
          :class="{ 'silence-group-stage__dot--active': selectedVisualId === item.id }"
          type="button"
          :aria-label="getSlotLabel(item)"
          :aria-pressed="selectedVisualId === item.id"
          @click="selectVisual(item.id)"
        ></button>
      </div>

      <aside class="silence-group-stage__info">
        <span class="ns-status">{{ t(currentGroup.statusLabelKey) }}</span>
        <strong>{{ activeVisual?.name ?? t(textKeys.placeholder) }}</strong>
        <p>{{ activeSlot }} / {{ visualItems.length }}</p>
        <p>{{ activeVisual?.character ? t(activeVisual.character.summaryKey) : t(textKeys.placeholder) }}</p>
        <RouterLink
          v-if="activeVisual?.character"
          class="silence-group-stage__action"
          :to="getSilenceCharacterRoute(activeVisual.character)"
        >
          {{ t(textKeys.enter) }}
        </RouterLink>
        <button v-else class="silence-group-stage__action" type="button" disabled>
          {{ t(textKeys.enter) }}
        </button>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { silenceGroups, siteRoutes, textKeys } from '@/config/site'
import {
  getSilenceCharacterRoute,
  getSilenceCharactersByGroup,
  type SilenceCharacter,
  type SilenceGroupId
} from '@/data/silence/characters'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const selectedVisualId = ref('')

const currentGroup = computed(
  () => silenceGroups.find((group) => group.route === route.path) ?? silenceGroups[0]
)
const currentCharacters = computed(() => getSilenceCharactersByGroup(currentGroup.value.id))
const visualItems = computed(() => {
  if (currentCharacters.value.length > 0) {
    return currentCharacters.value.map((character, index) => ({
      id: character.id,
      name: character.name,
      slot: index + 1,
      character
    }))
  }

  return Array.from({ length: getFallbackSlotCount(currentGroup.value.id) }, (_, index) => {
    const slot = index + 1

    return {
      id: `placeholder-${slot}`,
      name: t(textKeys.placeholder),
      slot,
      character: undefined
    }
  })
})
const activeVisual = computed(
  () => visualItems.value.find((item) => item.id === selectedVisualId.value) ?? visualItems.value[0]
)
const activeSlot = computed(() => activeVisual.value?.slot ?? 0)

function selectVisual(id: string) {
  selectedVisualId.value = id
}

function selectPrevious() {
  selectByOffset(-1)
}

function selectNext() {
  selectByOffset(1)
}

function selectByOffset(offset: number) {
  if (visualItems.value.length === 0) {
    return
  }

  const currentIndex = Math.max(
    0,
    visualItems.value.findIndex((item) => item.id === selectedVisualId.value)
  )
  const nextIndex =
    (currentIndex + offset + visualItems.value.length) % visualItems.value.length
  selectedVisualId.value = visualItems.value[nextIndex].id
}

function openVisual(item: { character?: SilenceCharacter }) {
  if (item.character) {
    router.push(getSilenceCharacterRoute(item.character))
  }
}

function getSlotLabel(item: { name: string; slot: number }) {
  return `${t(currentGroup.value.titleKey)} ${item.name} ${item.slot}`
}

function getFallbackSlotCount(groupId: SilenceGroupId) {
  return groupId === 'angel' ? 6 : 2
}

function resetSelectedVisual() {
  selectedVisualId.value = visualItems.value[0]?.id ?? ''
}

watch(
  () => route.path,
  resetSelectedVisual
)

watch(
  visualItems,
  () => {
    if (!visualItems.value.some((item) => item.id === selectedVisualId.value)) {
      resetSelectedVisual()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.silence-group-page {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.8), transparent 26%),
    linear-gradient(120deg, rgba(255, 240, 249, 0.92), rgba(207, 247, 251, 0.72)),
    var(--ns-body-background);
}

.silence-group-page--glitch {
  background:
    radial-gradient(circle at 78% 24%, rgba(127, 217, 227, 0.18), transparent 28%),
    repeating-linear-gradient(0deg, rgba(127, 217, 227, 0.08) 0 1px, transparent 1px 10px),
    linear-gradient(135deg, #121426, #101827 48%, #173138);
}

.silence-group-stage {
  position: relative;
  min-height: calc(100vh - 56px);
  padding: clamp(24px, 4vw, 56px);
  overflow: hidden;
}

.silence-group-stage::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    repeating-linear-gradient(90deg, rgba(99, 217, 220, 0.08) 0 1px, transparent 1px 32px),
    repeating-linear-gradient(0deg, rgba(239, 111, 178, 0.08) 0 1px, transparent 1px 32px);
  content: '';
  pointer-events: none;
}

.silence-group-stage--glitch::before {
  background:
    repeating-linear-gradient(90deg, rgba(127, 217, 227, 0.12) 0 1px, transparent 1px 18px),
    repeating-linear-gradient(0deg, rgba(240, 128, 189, 0.08) 0 1px, transparent 1px 10px);
}

.silence-back {
  position: absolute;
  top: clamp(22px, 4vw, 44px);
  left: clamp(18px, 5vw, 72px);
  z-index: 8;
  color: rgba(49, 40, 63, 0.68);
  font-size: 14px;
  font-weight: 800;
}

.silence-back:hover {
  color: var(--ns-color-accent-strong);
}

.silence-group-page--glitch .silence-back {
  color: rgba(248, 241, 255, 0.72);
}

.silence-group-stage__copy {
  position: relative;
  z-index: 6;
  width: min(560px, 54vw);
  margin-top: clamp(50px, 8vh, 96px);
  pointer-events: none;
}

.silence-group-page--angel .ns-title {
  color: #2c2338;
  text-shadow:
    3px 3px 0 rgba(99, 217, 220, 0.24),
    -2px -2px 0 rgba(239, 111, 178, 0.14);
}

.silence-group-page--angel .ns-lead {
  color: rgba(49, 40, 63, 0.62);
}

.silence-group-page--glitch .ns-title,
.silence-group-page--glitch .ns-lead {
  color: #f8f1ff;
}

.silence-group-page--glitch .ns-lead {
  color: rgba(248, 241, 255, 0.72);
}

.silence-group-stage__visual {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.silence-group-stage__character {
  position: absolute;
  z-index: 2;
  display: block;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  filter: saturate(0.82) brightness(0.86);
  transform: translateY(0) scale(1);
  transition:
    filter var(--ns-transition),
    transform var(--ns-transition),
    opacity var(--ns-transition);
}

.silence-group-stage__character:hover,
.silence-group-stage__character:focus-visible,
.silence-group-stage__character--active {
  z-index: 5;
  filter: saturate(1.1) brightness(1.08);
  transform: translateY(-18px) scale(1.04);
}

.silence-group-stage__character:focus-visible {
  box-shadow: 0 0 0 4px rgba(99, 217, 220, 0.36);
}

.silence-group-stage__figure-head,
.silence-group-stage__figure-body {
  display: block;
  border: 2px solid rgba(42, 33, 56, 0.52);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(239, 111, 178, 0.2)),
    var(--ns-color-cyan-soft);
  box-shadow:
    7px 7px 0 rgba(99, 217, 220, 0.2),
    -4px -4px 0 rgba(239, 111, 178, 0.1);
}

.silence-group-stage__figure-head {
  width: 34%;
  aspect-ratio: 1;
  margin: 0 auto -2px;
  background: rgba(255, 250, 253, 0.9);
}

.silence-group-stage__figure-body {
  width: 100%;
  height: 100%;
}

.silence-group-stage__character--angel {
  bottom: 12vh;
  width: clamp(86px, 9vw, 146px);
}

.silence-group-stage__character--angel-1 {
  left: 8%;
  height: 42vh;
}

.silence-group-stage__character--angel-2 {
  left: 21%;
  height: 56vh;
}

.silence-group-stage__character--angel-3 {
  left: 34%;
  height: 48vh;
}

.silence-group-stage__character--angel-4 {
  left: 48%;
  height: 60vh;
}

.silence-group-stage__character--angel-5 {
  left: 62%;
  height: 46vh;
}

.silence-group-stage__character--angel-6 {
  left: 75%;
  height: 52vh;
}

.silence-group-stage__character--angel:nth-child(even) .silence-group-stage__figure-body {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(99, 217, 220, 0.2)),
    var(--ns-color-accent-soft);
}

.silence-group-stage--glitch .silence-group-stage__visual::after {
  position: absolute;
  right: 8%;
  bottom: 18%;
  left: 8%;
  height: 2px;
  background: rgba(127, 217, 227, 0.72);
  box-shadow:
    0 14px 0 rgba(240, 128, 189, 0.68),
    0 28px 0 rgba(127, 217, 227, 0.42);
  content: '';
}

.silence-group-stage__character--glitch {
  width: clamp(220px, 28vw, 430px);
  height: clamp(280px, 44vh, 520px);
  border: 2px solid rgba(248, 241, 255, 0.76);
  background: rgba(12, 18, 31, 0.84);
  box-shadow:
    10px 10px 0 rgba(127, 217, 227, 0.18),
    -7px -7px 0 rgba(240, 128, 189, 0.1);
  overflow: hidden;
}

.silence-group-stage__character--glitch-1 {
  right: 46%;
  bottom: 18vh;
}

.silence-group-stage__character--glitch-2 {
  right: 12%;
  bottom: 26vh;
}

.silence-group-stage__window-bar {
  position: absolute;
  inset: 0 0 auto;
  height: 34px;
  border-bottom: 2px solid rgba(248, 241, 255, 0.54);
  background: linear-gradient(90deg, rgba(240, 128, 189, 0.5), rgba(127, 217, 227, 0.38));
}

.silence-group-stage__window-ghost {
  position: absolute;
  inset: 28% 12% 22% 18%;
  border: 2px solid rgba(127, 217, 227, 0.42);
  opacity: 0.72;
}

.silence-group-stage__window-scan {
  position: absolute;
  right: 9%;
  bottom: 12%;
  width: 45%;
  height: 2px;
  background: rgba(127, 217, 227, 0.92);
  box-shadow:
    0 12px 0 rgba(240, 128, 189, 0.82),
    0 24px 0 rgba(127, 217, 227, 0.7);
}

.silence-group-stage__nav {
  position: absolute;
  right: clamp(18px, 4vw, 52px);
  bottom: clamp(28px, 5vh, 64px);
  z-index: 8;
  display: flex;
  gap: 8px;
}

.silence-group-stage__dot {
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.38);
  color: var(--ns-color-text);
  cursor: pointer;
}

.silence-group-page--glitch .silence-group-stage__dot {
  background: rgba(127, 217, 227, 0.12);
  color: #f8f1ff;
}

.silence-group-stage__dot--active {
  background: var(--ns-color-accent);
}

.silence-group-stage__info {
  position: absolute;
  bottom: clamp(28px, 5vh, 64px);
  left: clamp(18px, 5vw, 72px);
  z-index: 8;
  display: grid;
  width: min(430px, calc(100vw - 36px));
  gap: 10px;
  padding: 18px 20px;
  border: 2px solid currentColor;
  background: rgba(255, 252, 255, 0.78);
  color: #2c2338;
  backdrop-filter: blur(14px);
  box-shadow: 7px 7px 0 rgba(42, 33, 56, 0.09);
}

.silence-group-page--glitch .silence-group-stage__info {
  background: rgba(12, 18, 31, 0.78);
  color: #f8f1ff;
  box-shadow: 7px 7px 0 rgba(127, 217, 227, 0.12);
}

.silence-group-stage__info strong {
  font-family: var(--ns-font-display);
  font-size: clamp(27px, 4vw, 42px);
  line-height: 1;
  overflow-wrap: anywhere;
}

.silence-group-page--angel .silence-group-stage__info .ns-status {
  border-color: rgba(42, 33, 56, 0.34);
  background: #d9fbfb;
  color: #237579;
}

.silence-group-stage__info p {
  margin: 0;
  color: var(--ns-color-text-muted);
}

.silence-group-page--glitch .silence-group-stage__info p {
  color: rgba(248, 241, 255, 0.72);
}

.silence-group-stage__action {
  justify-self: start;
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 12px;
  border: 2px solid currentColor;
  border-radius: 0;
  background: transparent;
  color: currentColor;
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
}

button.silence-group-stage__action {
  opacity: 0.55;
}

@media (max-width: 920px) {
  .silence-group-page {
    overflow: visible;
  }

  .silence-group-stage {
    min-height: calc(100vh - 56px);
    padding: 20px 14px 360px;
  }

  .silence-group-stage__copy {
    width: min(100%, 520px);
    margin-top: 62px;
  }

  .silence-group-stage__character--angel {
    bottom: 330px;
    width: clamp(48px, 13vw, 74px);
  }

  .silence-group-stage__character--angel-1 {
    left: 4%;
    height: 27vh;
  }

  .silence-group-stage__character--angel-2 {
    left: 18%;
    height: 34vh;
  }

  .silence-group-stage__character--angel-3 {
    left: 32%;
    height: 30vh;
  }

  .silence-group-stage__character--angel-4 {
    left: 47%;
    height: 36vh;
  }

  .silence-group-stage__character--angel-5 {
    left: 62%;
    height: 29vh;
  }

  .silence-group-stage__character--angel-6 {
    left: 76%;
    height: 32vh;
  }

  .silence-group-stage__character--glitch {
    width: clamp(160px, 48vw, 260px);
    height: 280px;
    bottom: 340px;
  }

  .silence-group-stage__character--glitch-1 {
    right: auto;
    left: 8%;
  }

  .silence-group-stage__character--glitch-2 {
    right: 8%;
  }

  .silence-group-stage__info {
    bottom: 88px;
  }

  .silence-group-stage__nav {
    right: 18px;
    bottom: 36px;
  }
}

@media (max-width: 640px) {
  .silence-group-stage__copy .ns-title {
    font-size: 46px;
  }

  .silence-group-stage__character--angel {
    width: clamp(42px, 12vw, 58px);
  }

  .silence-group-stage__info {
    left: 14px;
  }
}
</style>
