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
        <p class="ns-lead">
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
  getSilenceCharacterRoute,
  getSilenceCharactersByGroup,
  type SilenceCharacter,
  type SilenceGroupId
} from '@/data/silence/characters'
import { useSilenceTurnNavigation } from '@/pages/silence/composables/useSilenceTurnNavigation'
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
    radial-gradient(circle at 18% 24%, rgba(255, 255, 255, 0.5), transparent 30%),
    linear-gradient(120deg, rgba(99, 217, 220, 0.1), transparent 48%),
    linear-gradient(45deg, rgba(239, 111, 178, 0.08), transparent 56%);
  content: '';
  pointer-events: none;
}

.silence-group-stage--glitch::before {
  background:
    repeating-linear-gradient(90deg, rgba(127, 217, 227, 0.12) 0 1px, transparent 1px 18px),
    repeating-linear-gradient(0deg, rgba(240, 128, 189, 0.08) 0 1px, transparent 1px 10px);
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
