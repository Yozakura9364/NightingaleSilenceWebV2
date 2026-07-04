import { computed, type Ref } from 'vue'
import { textKeys } from '@/config/site'
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
  const placeholderText = computed(() => options.t(textKeys.placeholder))
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
  const overviewText = computed(() => content.value?.overview[0] ?? options.t(textKeys.placeholder))
  const railTitle = computed(() => content.value?.names.titleEn ?? character.value.name)
  const visibleFacts = computed<SilenceCharacterTextFact[]>(() =>
    (content.value?.facts ?? [])
      .filter((fact) => fact.visibility !== 'private' && fact.value !== '∅')
      .slice(0, 6)
  )
  const visibleAppearance = computed(() => (content.value?.appearance ?? []).slice(0, 3))
  const visibleOutfits = computed<SilenceCharacterOutfit[]>(() =>
    (content.value?.outfits ?? [])
      .filter((outfit) => outfit.visibility !== 'private')
      .slice(0, 4)
  )
  const visibleForms = computed<SilenceCharacterForm[]>(() =>
    character.value.forms.filter((form) => form.visibility !== 'private').slice(0, 3)
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
      .filter((story) => story.visibility !== 'private')
      .slice(0, 2)
      .map((story) => ({
        id: story.id,
        title: story.title,
        preview: story.body.find(isUsableStoryPreview) ?? placeholderText.value
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
      body: block.points[0] ?? placeholderText.value
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
    const baseBlocks = appearanceBlocks.length
      ? appearanceBlocks
      : [{ id: 'placeholder', title: basicTitle.value, body: placeholderText.value }]
    const baseOutfits = outfitBlocks.length
      ? outfitBlocks
      : [{ id: 'placeholder', title: outfitTitle.value, body: placeholderText.value }]
    const baseForms = formBlocks.length
      ? formBlocks
      : [{ id: 'placeholder', title: formTitle.value, body: placeholderText.value }]
    const baseStory = storyBlocks.length
      ? storyBlocks
      : [{ id: 'placeholder', title: storyTitle.value, body: placeholderText.value }]
    const baseCombat = combatBlocks.length
      ? combatBlocks
      : [{ id: 'placeholder', title: combatTitle.value, body: placeholderText.value }]

    return [
      {
        id: 'large-visual',
        sheetClass: 'silence-viioko__sheet--sample-full silence-viioko__sheet--sample-visual',
        fullSheet: true,
        kicker: overviewTitle.value,
        title: titleLinePrimary.value,
        subtitle: titleLineSecondary.value,
        leadLayoutClass: 'silence-viioko__layout--full',
        stripLayoutClass: 'silence-viioko__layout--thirds',
        heroCaption: profileKicker.value,
        copyTitle: overviewTitle.value,
        copy: overviewText.value,
        boardTitle: outfitTitle.value,
        boardClass: 'silence-viioko__sample-board--gallery',
        imageSlots: sampleImageSlots.value,
        blocks: baseBlocks.slice(0, 3),
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
        leadLayoutClass: 'silence-viioko__layout--one-two',
        stripLayoutClass: 'silence-viioko__layout--thirds',
        heroCaption: basicTitle.value,
        copyTitle: combatTitle.value,
        copy: combatLead.value,
        boardTitle: basicTitle.value,
        boardClass: 'silence-viioko__sample-board--dossier',
        imageSlots: sampleImageSlots.value,
        blocks: baseForms.slice(0, 3),
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
        leadLayoutClass: 'silence-viioko__layout--two-one',
        stripLayoutClass: 'silence-viioko__layout--one-two',
        heroCaption: secondaryOutfit.value?.label ?? outfitTitle.value,
        copyTitle: primaryOutfit.value?.label ?? outfitTitle.value,
        copy: primaryOutfit.value?.description ?? overviewText.value,
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
        leadLayoutClass: 'silence-viioko__layout--thirds',
        stripLayoutClass: 'silence-viioko__layout--thirds',
        heroCaption: storyTitle.value,
        copyTitle: combatTitle.value,
        copy: combatLead.value,
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

  return {
    basicTitle,
    combatLead,
    combatPreview,
    combatTitle,
    formTitle,
    outfitTitle,
    overviewText,
    overviewTitle,
    placeholderText,
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

function isUsableStoryPreview(paragraph: string) {
  const value = paragraph.trim()

  return value !== '' && value !== '123'
}
