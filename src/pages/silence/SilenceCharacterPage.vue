<template>
  <main class="ns-page silence-character-page" :style="pageStyle">
    <template v-if="character">
      <SilenceCharacterStage
        :character="character"
        :group-title-key="groupTitleKey"
        :detail-nav-items="detailNavItems"
        :left-to="turnNeighbors.left?.route"
        :left-label="leftTurnLabel"
        :right-to="turnNeighbors.right?.route"
        :right-label="rightTurnLabel"
        @section-request="scrollToSection"
      />

      <component
        :is="SilenceViiokoPrototype"
        v-if="showViiokoPrototype"
        :character="character"
      />

      <SilenceCharacterDetails
        :character="character"
        :relationships="relationshipCards"
        :active-form-id="formId"
      />
    </template>

    <section v-else class="silence-character-missing" :aria-labelledby="missingTitleId">
      <h1 :id="missingTitleId" class="ns-title">{{ t(textKeys.silenceCharacterMissing) }}</h1>
      <SilenceTurnHint
        :label="t(textKeys.silenceCharacterNavigation)"
        :left-to="siteRoutes.silence"
        :left-label="t(textKeys.silence)"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { silenceGroups, siteRoutes, siteMeta } from '@/config/site'
import { silenceTextKeys as textKeys } from '@/locales/keys/silence'
import { silenceUiMessages } from '@/locales/modules/silence'
import {
  getSilenceCharacter,
  getSilenceCharacterById,
  getSilenceCharacterRoute,
  isSilenceGroupId
} from '@/data/silence/characters'
import { useSilenceTurnNavigation } from '@/pages/silence/composables/useSilenceTurnNavigation'
import SilenceCharacterDetails from '@/pages/silence/components/SilenceCharacterDetails.vue'
import SilenceCharacterStage from '@/pages/silence/components/SilenceCharacterStage.vue'
import SilenceTurnHint from '@/pages/silence/components/SilenceTurnHint.vue'
import { loadMessages, useLocale } from '@/stores/locale'
import AppLoading from '@/components/AppLoading.vue'

loadMessages(silenceUiMessages)

const SilenceViiokoPrototype = import.meta.env.DEV
  ? defineAsyncComponent({
      loader: () => import('@/pages/silence/components/SilenceViiokoPrototype.vue'),
      loadingComponent: AppLoading,
      delay: 200
    })
  : null
const route = useRoute()
const { t } = useLocale()
const missingTitleId = 'silence-character-missing-title'
const groupId = computed(() => normalizeParam(route.params.groupId) || getGroupIdFromPath())
const characterId = computed(() => normalizeParam(route.params.characterId))
const formId = computed(() => normalizeParam(route.query.form))
const character = computed(() => {
  if (!isSilenceGroupId(groupId.value) || !characterId.value) {
    return undefined
  }

  return getSilenceCharacter(groupId.value, characterId.value)
})
const groupEntry = computed(
  () => silenceGroups.find((group) => group.id === groupId.value) ?? silenceGroups[0]
)
const groupTitleKey = computed(() => groupEntry.value.titleKey)
const groupRoute = computed(() => groupEntry.value.route)
const { turnNeighbors, leftTurnLabel, rightTurnLabel } = useSilenceTurnNavigation(
  () => route.path
)
const pageStyle = computed(() => ({
  '--silence-character-color': character.value?.color ?? '#63d9dc'
}))
const showViiokoPrototype = computed(
  () => Boolean(SilenceViiokoPrototype) && character.value?.id === 'salvance'
)

// Dynamic document.title
let previousTitle = ''
watch(
  () => character.value?.name,
  (name) => {
    if (!previousTitle) previousTitle = document.title
    if (name) {
      document.title = `${name} | ${t(siteMeta.zhNameKey)}`
    } else {
      document.title = previousTitle
    }
  },
  { immediate: true }
)
onUnmounted(() => {
  if (previousTitle) document.title = previousTitle
})
const detailNavItems = computed(() => {
  const baseId = character.value?.id ?? 'silence-character'

  if (character.value?.content) {
    const sections = character.value.content.sections

    return [
      {
        id: 'overview',
        label: sections.overview,
        targetId: `${baseId}-overview`
      },
      {
        id: 'basic',
        label: sections.basic,
        targetId: `${baseId}-basic`
      },
      {
        id: 'forms',
        label: sections.forms,
        targetId: `${baseId}-forms`
      },
      {
        id: 'outfits',
        label: sections.outfits,
        targetId: `${baseId}-outfits`
      },
      {
        id: 'combat',
        label: sections.combat,
        targetId: `${baseId}-combat`
      },
      {
        id: 'story',
        label: sections.story,
        targetId: `${baseId}-story`
      }
    ]
  }

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

function normalizeParam(value: string | null | Array<string | null> | undefined) {
  if (Array.isArray(value)) {
    return value.find(Boolean) ?? undefined
  }

  return value || undefined
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
  background: #ffffff;
}

.silence-character-missing {
  position: relative;
  display: grid;
  min-height: calc(100vh - 56px);
  grid-template-columns: minmax(0, 760px);
  gap: clamp(28px, 5vw, 76px);
  place-content: center;
  padding: clamp(24px, 5vw, 72px);
  overflow: hidden;
}

.silence-character-missing > :not(.silence-turn-hints) {
  position: relative;
  z-index: 2;
}

@media (max-width: 920px) {
  .silence-character-missing {
    min-height: calc(100vh - 56px);
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 76px 14px 170px;
  }
}
</style>
