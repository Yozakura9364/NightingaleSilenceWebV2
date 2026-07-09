<template>
  <main class="ns-page silence-group-page" :class="`silence-group-page--${currentGroup.id}`">
    <section
      class="silence-group-stage"
      :class="`silence-group-stage--${currentGroup.id}`"
      :aria-labelledby="`${currentGroup.id}-title`"
    >
      <div class="silence-group-stage__copy">
        <p class="ns-eyebrow">{{ t(textKeys.silence) }}</p>
        <h1 :id="`${currentGroup.id}-title`" class="ns-title">
          {{ t(currentGroup.titleKey) }}
        </h1>
        <p v-if="currentGroup.id !== 'glitch'" class="ns-lead">
          {{ t(currentGroup.summaryKey) }}
        </p>
      </div>

      <SilenceGroupVisual
        :group-id="currentGroup.id"
        :group-title="t(currentGroup.titleKey)"
        :items="visualItems"
        :selected-id="selectedVisualId"
        @select="selectVisual"
        @open="openVisual"
        @previous="selectPrevious"
        @next="selectNext"
      />

      <SilenceGlitchDuoPanel
        v-if="currentGroup.id === 'glitch'"
        :members="silenceGlitchDuoMembers"
        :concept-notes="silenceGlitchConceptNotes"
        :selected-id="selectedVisualId"
        @select="selectVisual"
      />

      <SilenceTurnHint
        :label="t(textKeys.silenceCharacterNavigation)"
        :left-to="turnNeighbors.left?.route"
        :left-label="leftTurnLabel"
        :right-to="turnNeighbors.right?.route"
        :right-label="rightTurnLabel"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { silenceGroups, textKeys } from '@/config/site'
import {
  silenceGlitchConceptNotes,
  silenceGlitchDuoMembers
} from '@/data/silence/glitchDuo'
import {
  getSilenceCharacterRoute,
  getSilenceCharactersByGroup,
  type SilenceCharacter
} from '@/data/silence/characters'
import { useSilenceTurnNavigation } from '@/pages/silence/composables/useSilenceTurnNavigation'
import SilenceGlitchDuoPanel from '@/pages/silence/components/SilenceGlitchDuoPanel.vue'
import SilenceGroupVisual from '@/pages/silence/components/SilenceGroupVisual.vue'
import SilenceTurnHint from '@/pages/silence/components/SilenceTurnHint.vue'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const selectedVisualId = ref('')

const currentGroup = computed(
  () => silenceGroups.find((group) => group.route === route.path) ?? silenceGroups[0]
)
const currentCharacters = computed(() => getSilenceCharactersByGroup(currentGroup.value.id))
const { turnNeighbors, leftTurnLabel, rightTurnLabel } = useSilenceTurnNavigation(
  () => route.path
)
const visualItems = computed(() => {
  if (currentGroup.value.id === 'glitch' && silenceGlitchDuoMembers.length > 0) {
    return silenceGlitchDuoMembers.map((member, index) => ({
      id: member.id,
      name: member.name,
      reading: member.reading,
      color: member.color,
      signal: member.signal,
      slot: index + 1,
      character: undefined
    }))
  }

  if (currentCharacters.value.length > 0) {
    return currentCharacters.value.map((character, index) => ({
      id: character.id,
      name: character.name,
      slot: index + 1,
      character
    }))
  }

  return []
})

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

.silence-group-page--angel {
  background: #ffffff;
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

.silence-group-stage--glitch::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    repeating-linear-gradient(90deg, rgba(127, 217, 227, 0.12) 0 1px, transparent 1px 18px),
    repeating-linear-gradient(0deg, rgba(240, 128, 189, 0.08) 0 1px, transparent 1px 10px);
  content: '';
  pointer-events: none;
}

.silence-group-stage--glitch::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, transparent 0 21%, rgba(255, 65, 172, 0.11) 21% 21.4%, transparent 21.4%),
    linear-gradient(90deg, transparent 0 68%, rgba(119, 255, 244, 0.13) 68% 68.35%, transparent 68.35%),
    repeating-linear-gradient(0deg, transparent 0 36px, rgba(255, 255, 255, 0.035) 36px 38px);
  content: '';
  mix-blend-mode: screen;
  pointer-events: none;
}

.silence-group-stage__copy {
  position: relative;
  z-index: 6;
  width: min(560px, 54vw);
  margin-top: clamp(50px, 8vh, 96px);
  pointer-events: none;
}

.silence-group-page--glitch .ns-title,
.silence-group-page--glitch .ns-lead {
  color: #f8f1ff;
}

.silence-group-page--glitch .ns-title {
  text-shadow:
    4px 0 0 rgba(255, 65, 172, 0.34),
    -4px 0 0 rgba(119, 255, 244, 0.26),
    0 8px 0 rgba(0, 0, 0, 0.28);
}

.silence-group-page--glitch .ns-lead {
  color: rgba(248, 241, 255, 0.72);
}

@media (max-width: 920px) {
  .silence-group-page {
    overflow: visible;
  }

  .silence-group-stage {
    min-height: calc(100vh - 56px);
    padding: 20px 14px 120px;
  }

  .silence-group-stage__copy {
    width: min(100%, 520px);
    margin-top: 62px;
  }
}

@media (max-width: 640px) {
  .silence-group-stage__copy .ns-title {
    font-size: 46px;
  }
}
</style>
