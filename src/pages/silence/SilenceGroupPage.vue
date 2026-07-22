<template>
  <main class="ns-page silence-group-page" :class="`silence-group-page--${currentGroup.id}`">
    <section
      v-if="visualItems.length > 0"
      class="silence-group-stage"
      :class="`silence-group-stage--${currentGroup.id}`"
      :aria-label="t(currentGroup.titleKey)"
    >
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

    <section v-else class="silence-group-empty" :aria-labelledby="EMPTY_TITLE_ID">
      <h1 :id="EMPTY_TITLE_ID" class="ns-title">{{ t(textKeys.silenceGroupEmpty) }}</h1>
      <RouterLink class="ns-button" :to="siteRoutes.silence">
        {{ t(textKeys.silence) }}
      </RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { silenceGroups, siteRoutes } from '@/config/site'
import { silenceTextKeys as textKeys } from '@/locales/keys/silence'
import { silenceUiMessages } from '@/locales/modules/silence'
import { silenceGlitchDuoMembers } from '@/data/silence/glitchDuo'
import {
  getSilenceCharacterRoute,
  getSilenceCharactersByGroup,
  type SilenceCharacter
} from '@/data/silence/characters'
import { useSilenceTurnNavigation } from '@/pages/silence/composables/useSilenceTurnNavigation'
import SilenceGroupVisual from '@/pages/silence/components/SilenceGroupVisual.vue'
import SilenceTurnHint from '@/pages/silence/components/SilenceTurnHint.vue'
import { loadMessages, useLocale } from '@/stores/locale'

loadMessages(silenceUiMessages)

const EMPTY_TITLE_ID = 'silence-group-empty-title'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const selectedVisualId = ref('')
const localGlitchPortraits: Partial<Record<'yoin' | 'yoine', string>> = import.meta.env.DEV
  ? {
      yoin: '/local-assets/%E5%B9%BD%E7%81%B5-banner/yoin-banner.webp',
      yoine: '/local-assets/%E5%B9%BD%E7%81%B5-banner/yoine-banner.webp'
    }
  : {}

interface AngelGroupStagePlacement {
  slot: number
  left: string
  height: string
  aspectRatio: string
  zIndex: number
  shadowColor: string
  displayName: string
  labelSide: 'left' | 'right'
  labelTop: string
  focusShift: string
}

const angelGroupStagePlacements: Record<string, AngelGroupStagePlacement> = {
  nightingale: {
    slot: 1,
    left: '18.2%',
    height: '75.32%',
    aspectRatio: '858 / 1627',
    zIndex: 2,
    shadowColor: '#878c93',
    displayName: '南丁格尔',
    labelSide: 'right',
    labelTop: '36%',
    focusShift: '-2vw'
  },
  goelia: {
    slot: 2,
    left: '33.9%',
    height: '74.4%',
    aspectRatio: '995 / 1607',
    zIndex: 5,
    shadowColor: '#000000',
    displayName: '歌莉亚',
    labelSide: 'right',
    labelTop: '42%',
    focusShift: '-2.2vw'
  },
  glynne: {
    slot: 3,
    left: '43%',
    height: '100%',
    aspectRatio: '1084 / 2160',
    zIndex: 4,
    shadowColor: '#000000',
    displayName: '歌林',
    labelSide: 'right',
    labelTop: '47%',
    focusShift: '-2.4vw'
  },
  ney: {
    slot: 4,
    left: '57.3%',
    height: '100%',
    aspectRatio: '1097 / 2160',
    zIndex: 3,
    shadowColor: '#540100',
    displayName: '奈伊',
    labelSide: 'left',
    labelTop: '25%',
    focusShift: '2.4vw'
  },
  chihaya: {
    slot: 5,
    left: '67.7%',
    height: '68.94%',
    aspectRatio: '981 / 1489',
    zIndex: 6,
    shadowColor: '#540100',
    displayName: '千早',
    labelSide: 'left',
    labelTop: '43%',
    focusShift: '2.2vw'
  },
  salvance: {
    slot: 6,
    left: '84.6%',
    height: '100%',
    aspectRatio: '1032 / 2160',
    zIndex: 4,
    shadowColor: '#878c93',
    displayName: '沙乐万',
    labelSide: 'left',
    labelTop: '43%',
    focusShift: '2vw'
  }
}

const localAngelGroupPortraits: Record<string, string> = import.meta.env.DEV
  ? {
      goelia:
        '/local-assets/%E4%B8%8D%E8%AF%AD-banner/%E6%97%A7%E6%A8%A1%E5%9E%8B-%E6%AD%8C%E8%8E%89%E4%BA%9A%20%E6%8B%B7%E8%B4%9D.png',
      glynne:
        '/local-assets/%E4%B8%8D%E8%AF%AD-banner/%E6%97%A7%E6%A8%A1%E5%9E%8B-%E6%AD%8C%E6%9E%97%20%E6%8B%B7%E8%B4%9D.png',
      chihaya:
        '/local-assets/%E4%B8%8D%E8%AF%AD-banner/%E6%97%A7%E6%A8%A1%E5%9E%8B-%E5%8D%83%E6%97%A9%20%E6%8B%B7%E8%B4%9D.png',
      ney:
        '/local-assets/%E4%B8%8D%E8%AF%AD-banner/%E6%97%A7%E6%A8%A1%E5%9E%8B-%E5%A5%88%E4%BC%8A%20%E6%8B%B7%E8%B4%9D.png',
      nightingale:
        '/local-assets/%E4%B8%8D%E8%AF%AD-banner/%E6%97%A7%E6%A8%A1%E5%9E%8B-%E5%8D%97%E4%B8%81%E6%A0%BC%E5%B0%94%20%E6%8B%B7%E8%B4%9D.png',
      salvance:
        '/local-assets/%E4%B8%8D%E8%AF%AD-banner/%E6%97%A7%E6%A8%A1%E5%9E%8B-%E6%B2%99%E4%B9%90%E4%B8%87%20%E6%8B%B7%E8%B4%9D.png'
    }
  : {}

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
      portraitSrc: localGlitchPortraits[member.id],
      slot: index + 1,
      character: undefined
    }))
  }

  if (currentCharacters.value.length > 0) {
    return currentCharacters.value.map((character, index) => {
      const placement = angelGroupStagePlacements[character.id]

      return {
        id: character.id,
        name: character.name,
        slot: placement?.slot ?? index + 1,
        character,
        portraitSrc: localAngelGroupPortraits[character.id] ?? character.portraitSrc,
        stageLeft: placement?.left,
        stageHeight: placement?.height,
        stageAspectRatio: placement?.aspectRatio,
        stageZIndex: placement?.zIndex,
        stageShadowColor: placement?.shadowColor,
        secondaryName: placement?.displayName,
        stageLabelSide: placement?.labelSide,
        stageLabelTop: placement?.labelTop,
        stageFocusShift: placement?.focusShift
      }
    })
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
  min-height: calc(100vh - 58px);
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.8), transparent 26%),
    linear-gradient(120deg, rgba(255, 240, 249, 0.92), rgba(207, 247, 251, 0.72)),
    var(--ns-body-background);
}

.silence-group-page--angel {
  background: #e8f0fb;
}

.silence-group-page--glitch {
  background:
    radial-gradient(circle at 78% 24%, rgba(127, 217, 227, 0.18), transparent 28%),
    repeating-linear-gradient(0deg, rgba(127, 217, 227, 0.08) 0 1px, transparent 1px 10px),
    linear-gradient(135deg, #121426, #101827 48%, #173138);
}

.silence-group-stage {
  position: relative;
  min-height: calc(100vh - 58px);
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

@media (max-width: 920px) {
  .silence-group-page {
    overflow: visible;
  }

  .silence-group-stage {
    min-height: calc(100vh - 58px);
    padding: 20px 14px 120px;
  }

}

.silence-group-empty {
  display: grid;
  min-height: calc(100vh - 58px);
  place-content: center;
  gap: 24px;
  padding: 48px 24px;
  text-align: center;
}
</style>
