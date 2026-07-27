import { computed, shallowRef, watch, type CSSProperties, type Ref } from 'vue'
import { silenceTextKeys as textKeys } from '@/locales/keys/silence'
import {
  getSilenceViiokoLayoutClass,
  getSilenceViiokoPageLayouts,
  mergeSilenceViiokoPageLayouts,
  parseSilenceViiokoPageLayouts,
  type SilenceViiokoImageLayout,
  type SilenceViiokoLayoutPreset,
  type SilenceViiokoPageLayout,
  type SilenceViiokoRowLayout
} from '@/data/silence/viiokoPageLayouts'
import type {
  SilenceCharacter,
  SilenceCharacterForm,
  SilenceCharacterOutfit,
  SilenceCharacterTextFact
} from '@/data/silence/characters'

interface UseSilenceViiokoPrototypeModelOptions {
  character: Readonly<Ref<SilenceCharacter>>
  t: (key: string) => string
}

export function useSilenceViiokoPrototypeModel(options: UseSilenceViiokoPrototypeModelOptions) {
  const character = options.character
  const content = computed(() => character.value.content)
  const localPageLayouts = shallowRef<SilenceViiokoPageLayout[]>()
  const defaultPageLayouts = computed(() => getSilenceViiokoPageLayouts(character.value.id))
  const pageLayouts = computed(() =>
    localPageLayouts.value
      ? mergeSilenceViiokoPageLayouts(defaultPageLayouts.value, localPageLayouts.value)
      : defaultPageLayouts.value
  )
  const pageLayoutById = computed(
    () => new Map(pageLayouts.value.map((page) => [page.id, page] as const))
  )

  watch(
    () => character.value.id,
    (characterId, _previousCharacterId, onCleanup) => {
      localPageLayouts.value = undefined

      const localLayoutBase = import.meta.env.DEV
        ? import.meta.env.VITE_SILENCE_LAYOUT_BASE?.trim()
        : ''

      if (!localLayoutBase) {
        return
      }

      const controller = new AbortController()
      onCleanup(() => controller.abort())

      void loadLocalPageLayouts(localLayoutBase, characterId, controller.signal).then((layouts) => {
        if (!controller.signal.aborted) {
          localPageLayouts.value = layouts
        }
      })
    },
    { immediate: true }
  )
  const emptyText = computed(() => '')
  const titleId = computed(() => `${character.value.id}-viioko-prototype-title`)
  const secondTitleId = computed(() => `${character.value.id}-viioko-prototype-followup-title`)
  const titleLinePrimary = computed(() => content.value?.names.en ?? character.value.name)
  const titleLineSecondary = computed(() => {
    const names = content.value?.names

    return [names?.zh, names?.ja, names?.title].filter(Boolean).join(' / ')
  })
  const profileKicker = computed(() => content.value?.names.title ?? character.value.name)
  const overviewTitle = computed(
    () => content.value?.sections.overview ?? options.t(textKeys.silenceCharacterProfile)
  )
  const basicTitle = computed(
    () => content.value?.sections.basic ?? options.t(textKeys.silenceCharacterBasicProfile)
  )
  const formTitle = computed(
    () => content.value?.sections.forms ?? options.t(textKeys.silenceCharacterForms)
  )
  const outfitTitle = computed(
    () => content.value?.sections.outfits ?? options.t(textKeys.silenceCharacterVisual)
  )
  const combatTitle = computed(
    () => content.value?.sections.combat ?? options.t(textKeys.silenceCharacterNotes)
  )
  const storyTitle = computed(
    () => content.value?.sections.story ?? options.t(textKeys.silenceCharacterNotes)
  )
  const overviewText = computed(() => content.value?.overview[0] ?? '')
  const railTitle = computed(() => content.value?.names.titleEn ?? character.value.name)
  const visibleFacts = computed<SilenceCharacterTextFact[]>(() =>
    (content.value?.facts ?? [])
      .filter((fact) => fact.visibility === 'public' && fact.value !== '∅')
      .slice(0, 6)
  )
  const visibleAppearance = computed(() => (content.value?.appearance ?? []).slice(0, 3))
  const visibleOutfits = computed<SilenceCharacterOutfit[]>(() =>
    (content.value?.outfits ?? []).filter((outfit) => outfit.visibility === 'public').slice(0, 4)
  )
  const visibleForms = computed<SilenceCharacterForm[]>(() =>
    character.value.forms.filter((form) => form.visibility === 'public').slice(0, 3)
  )
  const visibleFormFacts = computed(() =>
    visibleForms.value.map((form) => ({
      id: form.id,
      label: form.label,
      value: [form.subtitle, form.summary].filter(Boolean).join(' / ')
    }))
  )
  const combatPoints = computed(() => content.value?.combat ?? [])
  const combatLead = computed(() => combatPoints.value[0] ?? overviewText.value)
  const combatPreview = computed(() => combatPoints.value.slice(1, 4))
  const visibleStoryCards = computed(() =>
    (content.value?.story ?? [])
      .filter((story) => story.visibility === 'public')
      .slice(0, 2)
      .map((story) => ({
        id: story.id,
        title: story.title,
        preview: story.body.find(isUsableStoryPreview) ?? ''
      }))
  )
  const primaryOutfit = computed(() => visibleOutfits.value[0])
  const secondaryOutfit = computed(() => visibleOutfits.value[1])
  const specimenSlots = [1, 2, 3, 4]
  const sampleImageSlots = computed(() => [
    {
      id: 'full',
      caption: overviewTitle.value,
      className: 'silence-viioko__sample-image--full'
    },
    {
      id: 'face',
      caption: basicTitle.value,
      className: 'silence-viioko__sample-image--face'
    },
    {
      id: 'detail',
      caption: outfitTitle.value,
      className: 'silence-viioko__sample-image--detail'
    },
    {
      id: 'reverse',
      caption: formTitle.value,
      className: 'silence-viioko__sample-image--reverse'
    }
  ])
  const sampleSheets = computed(() => {
    const appearanceBlocks = visibleAppearance.value.map((block) => ({
      id: block.id,
      title: block.title,
      body: block.points[0] ?? ''
    }))
    const outfitBlocks = visibleOutfits.value.map((outfit) => ({
      id: outfit.id,
      title: outfit.label,
      body: outfit.description
    }))
    const formBlocks = visibleForms.value.map((form) => ({
      id: form.id,
      title: form.label,
      body: [form.subtitle, form.summary].filter(Boolean).join(' / ')
    }))
    const storyBlocks = visibleStoryCards.value.map((story) => ({
      id: story.id,
      title: story.title,
      body: story.preview
    }))
    const combatBlocks = combatPreview.value.map((point, index) => ({
      id: `combat-${index}`,
      title: combatTitle.value,
      body: point
    }))
    const baseBlocks = appearanceBlocks.length ? appearanceBlocks : []
    const baseOutfits = outfitBlocks.length ? outfitBlocks : []
    const baseForms = formBlocks.length ? formBlocks : []
    const baseStory = storyBlocks.length ? storyBlocks : []
    const baseCombat = combatBlocks.length ? combatBlocks : []

    return [
      {
        id: 'large-visual',
        sheetClass: 'silence-viioko__sheet--sample-full silence-viioko__sheet--sample-visual',
        fullSheet: true,
        kicker: overviewTitle.value,
        title: titleLinePrimary.value,
        subtitle: titleLineSecondary.value,
        heroCaption: profileKicker.value,
        copyTitle: overviewTitle.value,
        copy: overviewText.value,
        leadAside: null,
        boardTitle: outfitTitle.value,
        boardClass: 'silence-viioko__sample-board--gallery',
        imageSlots: sampleImageSlots.value,
        blocks: baseBlocks.slice(0, 1),
        notes: baseOutfits.slice(0, 4),
        rail: railTitle.value
      },
      {
        id: 'dossier-grid',
        sheetClass: 'silence-viioko__sheet--sample-one-two silence-viioko__sheet--sample-dossier',
        fullSheet: false,
        kicker: basicTitle.value,
        title: profileKicker.value,
        subtitle: railTitle.value,
        heroCaption: basicTitle.value,
        copyTitle: combatTitle.value,
        copy: combatLead.value,
        leadAside: null,
        boardTitle: basicTitle.value,
        boardClass: 'silence-viioko__sample-board--dossier',
        imageSlots: sampleImageSlots.value,
        blocks: baseForms.slice(0, 2),
        notes: [...baseCombat, ...baseStory].slice(0, 4),
        rail: basicTitle.value
      },
      {
        id: 'material-wall',
        sheetClass:
          'silence-viioko__sheet--sample-two-one silence-viioko__sheet--sample-material-wall',
        fullSheet: false,
        kicker: outfitTitle.value,
        title: titleLinePrimary.value,
        subtitle: primaryOutfit.value?.label ?? outfitTitle.value,
        heroCaption: secondaryOutfit.value?.label ?? outfitTitle.value,
        copyTitle: primaryOutfit.value?.label ?? outfitTitle.value,
        copy: primaryOutfit.value?.description ?? overviewText.value,
        leadAside: null,
        boardTitle: formTitle.value,
        boardClass: 'silence-viioko__sample-board--materials',
        imageSlots: sampleImageSlots.value,
        blocks: [...baseOutfits, ...baseForms].slice(0, 2),
        notes: [...baseOutfits, ...baseCombat, ...baseStory].slice(0, 5),
        rail: outfitTitle.value
      },
      {
        id: 'thirds-board',
        sheetClass: 'silence-viioko__sheet--sample-thirds silence-viioko__sheet--sample-dossier',
        fullSheet: false,
        kicker: storyTitle.value,
        title: railTitle.value,
        subtitle: titleLineSecondary.value,
        heroCaption: storyTitle.value,
        copyTitle: combatTitle.value,
        copy: combatLead.value,
        leadAside: {
          title: baseStory[0]?.title ?? storyTitle.value,
          body: baseStory[0]?.body ?? ''
        },
        boardTitle: storyTitle.value,
        boardClass: 'silence-viioko__sample-board--dossier',
        imageSlots: sampleImageSlots.value,
        blocks: [...baseCombat, ...baseStory, ...baseForms].slice(0, 3),
        notes: [...baseStory, ...baseCombat, ...baseOutfits].slice(0, 4),
        rail: storyTitle.value
      }
    ]
  })
  const prototypeStyle = computed(() => ({
    '--silence-viioko-accent': character.value.color
  }))

  function getRowLayoutClass(
    pageId: string,
    rowId: string,
    fallback: SilenceViiokoLayoutPreset
  ): string {
    return getSilenceViiokoLayoutClass(getRowLayout(pageId, rowId)?.preset ?? fallback)
  }

  function getPageGridStyle(pageId: string): CSSProperties | undefined {
    const page = pageLayoutById.value.get(pageId)

    if (!page) {
      return undefined
    }

    return {
      gridTemplateRows: `auto ${page.rows.map((row) => toGridTrack(row)).join(' ')}`
    }
  }

  function getCellImageStyle(
    pageId: string,
    rowId: string,
    cellId: string
  ): CSSProperties | undefined {
    const image = getRowLayout(pageId, rowId)?.cells?.find((cell) => cell.id === cellId)?.image

    return image ? toImageStyle(image) : undefined
  }

  function getRowLayout(pageId: string, rowId: string): SilenceViiokoRowLayout | undefined {
    return pageLayoutById.value.get(pageId)?.rows.find((row) => row.id === rowId)
  }

  return {
    basicTitle,
    combatLead,
    combatPreview,
    combatTitle,
    formTitle,
    getCellImageStyle,
    getPageGridStyle,
    getRowLayoutClass,
    outfitTitle,
    overviewText,
    overviewTitle,
    emptyText,
    primaryOutfit,
    profileKicker,
    prototypeStyle,
    railTitle,
    sampleSheets,
    secondTitleId,
    secondaryOutfit,
    specimenSlots,
    storyTitle,
    titleId,
    titleLinePrimary,
    titleLineSecondary,
    visibleAppearance,
    visibleFacts,
    visibleFormFacts,
    visibleForms,
    visibleOutfits,
    visibleStoryCards
  }
}

function toGridTrack(row: SilenceViiokoRowLayout): string {
  return row.track === 'auto' ? 'auto' : `minmax(0, ${Math.max(0.01, row.track)}fr)`
}

function toImageStyle(image: SilenceViiokoImageLayout): CSSProperties {
  const transforms = [
    image.flipX ? 'scaleX(-1)' : '',
    image.scale === undefined ? '' : `scale(${Math.max(0.01, image.scale)})`
  ].filter(Boolean)

  return {
    objectFit: image.fit,
    objectPosition:
      image.positionX === undefined && image.positionY === undefined
        ? undefined
        : `${image.positionX ?? 50}% ${image.positionY ?? 50}%`,
    transform: transforms.length > 0 ? transforms.join(' ') : undefined
  }
}

async function loadLocalPageLayouts(
  baseUrl: string,
  characterId: string,
  signal: AbortSignal
): Promise<SilenceViiokoPageLayout[] | undefined> {
  const normalizedBase = baseUrl.replace(/\/$/, '')

  try {
    const response = await fetch(
      `${normalizedBase}/${encodeURIComponent(characterId)}.json?t=${Date.now()}`,
      { signal }
    )

    if (!response.ok) {
      return undefined
    }

    return parseSilenceViiokoPageLayouts(await response.json())
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return undefined
    }

    console.warn('[silence-layout] Failed to load local page layout.', error)
    return undefined
  }
}

function isUsableStoryPreview(paragraph: string) {
  const value = paragraph.trim()

  return value !== '' && value !== '123'
}
