<template>
  <section
    class="silence-viioko"
    :aria-labelledby="titleId"
    :style="prototypeStyle"
  >
    <div class="silence-viioko__sheet">
      <div class="silence-viioko__backdrop" aria-hidden="true">
        <img
          v-if="character.portraitSrc"
          class="silence-viioko__backdrop-portrait"
          :src="character.portraitSrc"
          alt=""
          decoding="async"
        />
      </div>

      <div class="silence-viioko__page silence-viioko__page--profile">
        <header class="silence-viioko__identity">
          <p class="silence-viioko__kicker">{{ profileKicker }}</p>
          <h2 :id="titleId">{{ titleLinePrimary }}</h2>
          <p>{{ titleLineSecondary }}</p>
        </header>

        <div class="silence-viioko__layout silence-viioko__layout--two-one silence-viioko__portrait-grid">
          <figure class="silence-viioko__portrait-card silence-viioko__portrait-card--hero">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ overviewTitle }}</figcaption>
          </figure>
          <figure class="silence-viioko__portrait-card silence-viioko__portrait-card--crop">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ basicTitle }}</figcaption>
          </figure>
        </div>

        <div class="silence-viioko__layout silence-viioko__layout--full">
          <p class="silence-viioko__overview">{{ overviewText }}</p>
        </div>

        <dl class="silence-viioko__layout silence-viioko__layout--thirds silence-viioko__facts">
          <div v-for="fact in visibleFacts" :key="fact.id">
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>

        <div class="silence-viioko__layout silence-viioko__layout--thirds silence-viioko__detail-strip">
          <article v-for="block in visibleAppearance" :key="block.id">
            <h3>{{ block.title }}</h3>
            <p>{{ block.points[0] ?? placeholderText }}</p>
          </article>
        </div>
      </div>

      <div class="silence-viioko__page silence-viioko__page--materials">
        <header class="silence-viioko__materials-header">
          <p>{{ outfitTitle }}</p>
          <div class="silence-viioko__swatches" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </header>

        <div class="silence-viioko__materials-grid">
          <figure class="silence-viioko__standee silence-viioko__standee--front">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ primaryOutfit?.label ?? outfitTitle }}</figcaption>
          </figure>

          <figure class="silence-viioko__standee silence-viioko__standee--back">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ secondaryOutfit?.label ?? formTitle }}</figcaption>
          </figure>

          <div class="silence-viioko__material-list">
            <article v-for="outfit in visibleOutfits" :key="outfit.id">
              <h3>{{ outfit.label }}</h3>
              <p>{{ outfit.description }}</p>
              <ul v-if="outfit.equipment.length">
                <li v-for="item in outfit.equipment.slice(0, 4)" :key="item">{{ item }}</li>
              </ul>
            </article>
          </div>

          <div class="silence-viioko__specimen-board">
            <figure v-for="index in specimenSlots" :key="index">
              <img
                v-if="character.portraitSrc"
                :src="character.portraitSrc"
                alt=""
                decoding="async"
              />
            </figure>
          </div>
        </div>

        <aside class="silence-viioko__rail" aria-hidden="true">
          <span>{{ railTitle }}</span>
          <span>{{ character.name }}</span>
        </aside>
      </div>
    </div>

    <div class="silence-viioko__sheet silence-viioko__sheet--followup">
      <div class="silence-viioko__backdrop" aria-hidden="true">
        <img
          v-if="character.portraitSrc"
          class="silence-viioko__backdrop-portrait"
          :src="character.portraitSrc"
          alt=""
          decoding="async"
        />
      </div>

      <div class="silence-viioko__page silence-viioko__page--profile">
        <header class="silence-viioko__identity">
          <p class="silence-viioko__kicker">{{ formTitle }}</p>
          <h2 :id="secondTitleId">{{ titleLinePrimary }}</h2>
          <p>{{ railTitle }}</p>
        </header>

        <div class="silence-viioko__layout silence-viioko__layout--two-one silence-viioko__portrait-grid">
          <figure class="silence-viioko__portrait-card silence-viioko__portrait-card--hero">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ formTitle }}</figcaption>
          </figure>
          <figure class="silence-viioko__portrait-card silence-viioko__portrait-card--crop">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ combatTitle }}</figcaption>
          </figure>
        </div>

        <div class="silence-viioko__layout silence-viioko__layout--full">
          <p class="silence-viioko__overview">{{ combatLead }}</p>
        </div>

        <dl class="silence-viioko__layout silence-viioko__layout--thirds silence-viioko__facts">
          <div v-for="form in visibleFormFacts" :key="form.id">
            <dt>{{ form.label }}</dt>
            <dd>{{ form.value }}</dd>
          </div>
        </dl>

        <div class="silence-viioko__layout silence-viioko__layout--one-two silence-viioko__detail-strip">
          <article>
            <h3>{{ combatTitle }}</h3>
            <p>{{ combatPreview[0] ?? placeholderText }}</p>
          </article>
          <article>
            <h3>{{ visibleStoryCards[0]?.title ?? storyTitle }}</h3>
            <p>{{ visibleStoryCards[0]?.preview ?? combatPreview[1] ?? placeholderText }}</p>
          </article>
        </div>
      </div>

      <div class="silence-viioko__page silence-viioko__page--materials">
        <header class="silence-viioko__materials-header">
          <p>{{ combatTitle }}</p>
          <div class="silence-viioko__swatches" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </header>

        <div class="silence-viioko__materials-grid">
          <figure class="silence-viioko__standee silence-viioko__standee--front">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ visibleForms[0]?.label ?? formTitle }}</figcaption>
          </figure>

          <figure class="silence-viioko__standee silence-viioko__standee--back">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ visibleForms[1]?.label ?? storyTitle }}</figcaption>
          </figure>

          <div class="silence-viioko__material-list">
            <article v-for="form in visibleForms" :key="form.id">
              <h3>{{ form.label }}</h3>
              <p>{{ form.summary }}</p>
              <ul v-if="form.points.length">
                <li v-for="point in form.points.slice(0, 4)" :key="point">{{ point }}</li>
              </ul>
            </article>
            <article v-for="story in visibleStoryCards" :key="story.id">
              <h3>{{ story.title }}</h3>
              <p>{{ story.preview }}</p>
            </article>
          </div>

          <div class="silence-viioko__specimen-board">
            <figure v-for="index in specimenSlots" :key="`followup-${index}`">
              <img
                v-if="character.portraitSrc"
                :src="character.portraitSrc"
                alt=""
                decoding="async"
              />
            </figure>
          </div>
        </div>

        <aside class="silence-viioko__rail" aria-hidden="true">
          <span>{{ storyTitle }}</span>
          <span>{{ character.name }}</span>
        </aside>
      </div>
    </div>

    <div
      v-for="sample in sampleSheets"
      :key="sample.id"
      class="silence-viioko__sheet silence-viioko__sheet--sample"
      :class="sample.sheetClass"
    >
      <div class="silence-viioko__backdrop" aria-hidden="true">
        <img
          v-if="character.portraitSrc"
          class="silence-viioko__backdrop-portrait"
          :src="character.portraitSrc"
          alt=""
          decoding="async"
        />
      </div>

      <div class="silence-viioko__page silence-viioko__page--profile silence-viioko__page--sample-profile">
        <header class="silence-viioko__identity">
          <p class="silence-viioko__kicker">{{ sample.kicker }}</p>
          <h2>{{ sample.title }}</h2>
          <p>{{ sample.subtitle }}</p>
        </header>

        <div
          class="silence-viioko__layout silence-viioko__sample-lead"
          :class="sample.leadLayoutClass"
        >
          <figure class="silence-viioko__portrait-card silence-viioko__portrait-card--sample">
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ sample.heroCaption }}</figcaption>
          </figure>

          <article class="silence-viioko__sample-copy">
            <h3>{{ sample.copyTitle }}</h3>
            <p>{{ sample.copy }}</p>
          </article>
        </div>

        <div
          class="silence-viioko__layout silence-viioko__detail-strip silence-viioko__sample-strip"
          :class="sample.stripLayoutClass"
        >
          <article v-for="block in sample.blocks" :key="block.id">
            <h3>{{ block.title }}</h3>
            <p>{{ block.body }}</p>
          </article>
        </div>
      </div>

      <div
        v-if="!sample.fullSheet"
        class="silence-viioko__page silence-viioko__page--materials silence-viioko__page--sample-materials"
      >
        <header class="silence-viioko__materials-header">
          <p>{{ sample.boardTitle }}</p>
          <div class="silence-viioko__swatches" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </header>

        <div class="silence-viioko__sample-board" :class="sample.boardClass">
          <figure
            v-for="slot in sample.imageSlots"
            :key="slot.id"
            class="silence-viioko__sample-image"
            :class="slot.className"
          >
            <img
              v-if="character.portraitSrc"
              :src="character.portraitSrc"
              alt=""
              decoding="async"
            />
            <figcaption>{{ slot.caption }}</figcaption>
          </figure>

          <div v-if="sample.id !== 'thirds-board'" class="silence-viioko__sample-notes">
            <article v-for="note in sample.notes" :key="note.id">
              <h3>{{ note.title }}</h3>
              <p>{{ note.body }}</p>
            </article>
          </div>
        </div>

        <aside class="silence-viioko__rail" aria-hidden="true">
          <span>{{ sample.rail }}</span>
          <span>{{ character.name }}</span>
        </aside>
      </div>

      <div
        v-if="sample.id === 'thirds-board'"
        class="silence-viioko__page silence-viioko__page--sample-tertiary"
      >
        <header class="silence-viioko__materials-header">
          <p>{{ sample.boardTitle }}</p>
        </header>

        <div class="silence-viioko__sample-notes silence-viioko__sample-notes--tertiary">
          <article v-for="note in sample.notes" :key="note.id">
            <h3>{{ note.title }}</h3>
            <p>{{ note.body }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import type { SilenceCharacter } from '@/data/silence/characters'
import { useSilenceViiokoPrototypeModel } from '@/pages/silence/composables/useSilenceViiokoPrototypeModel'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  character: SilenceCharacter
}>()

const { t } = useLocale()
const {
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
} = useSilenceViiokoPrototypeModel({
  character: toRef(props, 'character'),
  t
})
</script>

<style scoped>
.silence-viioko {
  position: relative;
  display: grid;
  gap: 0;
  scroll-margin-top: 92px;
  padding: clamp(20px, 3vw, 44px) 0;
  overflow: visible;
  background: #ffffff;
}

.silence-viioko__sheet {
  --silence-viioko-frame-left: 1.85%;
  --silence-viioko-frame-right: 1.85%;
  --silence-viioko-frame-top: 2.7%;
  --silence-viioko-frame-bottom: 4.7%;
  --silence-viioko-divider-a-start: 32.299%;
  --silence-viioko-divider-a-end: 34.742%;
  --silence-viioko-divider-b-start: -20%;
  --silence-viioko-divider-b-end: -20%;
  --silence-viioko-primary-divider-start: var(--silence-viioko-divider-a-start);
  --silence-viioko-primary-divider-end: var(--silence-viioko-divider-a-end);
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1680px, 100%);
  aspect-ratio: 4011 / 2739;
  grid-template-columns:
    minmax(0, var(--silence-viioko-primary-divider-start))
    calc(var(--silence-viioko-primary-divider-end) - var(--silence-viioko-primary-divider-start))
    minmax(0, calc(100% - var(--silence-viioko-primary-divider-end)));
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  color: #241b2f;
}

.silence-viioko__sheet::before {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(rgba(35, 28, 42, 0.16), rgba(35, 28, 42, 0.16)) var(--silence-viioko-frame-left) var(--silence-viioko-frame-top) / calc(100% - var(--silence-viioko-frame-left) - var(--silence-viioko-frame-right)) 1px no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-frame-left) calc(100% - var(--silence-viioko-frame-bottom)) / calc(100% - var(--silence-viioko-frame-left) - var(--silence-viioko-frame-right)) 1px no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-frame-left) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) calc(100% - var(--silence-viioko-frame-right)) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-a-start) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-a-end) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-b-start) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-b-end) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(#fff, #fff) var(--silence-viioko-divider-a-start) var(--silence-viioko-frame-top) / calc(var(--silence-viioko-divider-a-end) - var(--silence-viioko-divider-a-start)) calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(#fff, #fff) var(--silence-viioko-divider-b-start) var(--silence-viioko-frame-top) / calc(var(--silence-viioko-divider-b-end) - var(--silence-viioko-divider-b-start)) calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.045), rgba(35, 28, 42, 0.045)) 0 calc(100% - var(--silence-viioko-frame-bottom)) / 100% var(--silence-viioko-frame-bottom) no-repeat;
  content: '';
  pointer-events: none;
}

.silence-viioko__sheet::after {
  position: absolute;
  top: -4.5%;
  left: -2.2%;
  z-index: 1;
  width: 18%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(35, 28, 42, 0.2) 50%, transparent calc(50% + 0.5px));
  content: '';
  pointer-events: none;
}

.silence-viioko__sheet + .silence-viioko__sheet {
  margin-top: -1px;
}

.silence-viioko__sheet--followup .silence-viioko__backdrop::before {
  right: auto;
  left: 4%;
  width: 58%;
  opacity: 0.72;
  transform: scaleX(-1);
}

.silence-viioko__sheet--followup .silence-viioko__backdrop-portrait {
  right: -12%;
  left: auto;
  width: min(64%, 980px);
  transform: scaleX(-1) scale(1.28);
  transform-origin: right bottom;
}

.silence-viioko__sheet--sample:nth-of-type(odd) .silence-viioko__backdrop-portrait {
  right: -9%;
  left: auto;
  width: min(60%, 940px);
  transform: scaleX(-1) scale(1.2);
  transform-origin: right bottom;
}

.silence-viioko__sheet--sample-visual .silence-viioko__backdrop-portrait {
  opacity: 0.16;
}

.silence-viioko__sheet--sample-material-wall .silence-viioko__backdrop-portrait {
  opacity: 0.07;
}

.silence-viioko__sheet--sample {
  --silence-viioko-frame-left: 1.85%;
  --silence-viioko-frame-right: 1.85%;
  --silence-viioko-frame-top: 2.7%;
  --silence-viioko-frame-bottom: 4.7%;
  --silence-viioko-divider-a-start: -20%;
  --silence-viioko-divider-a-end: -20%;
  --silence-viioko-divider-b-start: -20%;
  --silence-viioko-divider-b-end: -20%;
  --silence-viioko-english-left: 61%;
  --silence-viioko-english-top: 0%;
  background: #fff;
}

.silence-viioko__sheet--sample .silence-viioko__backdrop {
  display: block;
}

.silence-viioko__sheet--sample::before {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(rgba(35, 28, 42, 0.16), rgba(35, 28, 42, 0.16)) var(--silence-viioko-frame-left) var(--silence-viioko-frame-top) / calc(100% - var(--silence-viioko-frame-left) - var(--silence-viioko-frame-right)) 1px no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-frame-left) calc(100% - var(--silence-viioko-frame-bottom)) / calc(100% - var(--silence-viioko-frame-left) - var(--silence-viioko-frame-right)) 1px no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-frame-left) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) calc(100% - var(--silence-viioko-frame-right)) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-a-start) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-a-end) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-b-start) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) var(--silence-viioko-divider-b-end) var(--silence-viioko-frame-top) / 1px calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(#fff, #fff) var(--silence-viioko-divider-a-start) var(--silence-viioko-frame-top) / calc(var(--silence-viioko-divider-a-end) - var(--silence-viioko-divider-a-start)) calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(#fff, #fff) var(--silence-viioko-divider-b-start) var(--silence-viioko-frame-top) / calc(var(--silence-viioko-divider-b-end) - var(--silence-viioko-divider-b-start)) calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom)) no-repeat,
    linear-gradient(rgba(35, 28, 42, 0.045), rgba(35, 28, 42, 0.045)) 0 calc(100% - var(--silence-viioko-frame-bottom)) / 100% var(--silence-viioko-frame-bottom) no-repeat;
  content: '';
  pointer-events: none;
}

.silence-viioko__sheet--sample::after {
  position: absolute;
  top: -4.5%;
  left: -2.2%;
  z-index: 1;
  width: 18%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(35, 28, 42, 0.2) 50%, transparent calc(50% + 0.5px));
  content: '';
  pointer-events: none;
}

.silence-viioko__sheet--sample-full {
  grid-template-columns: minmax(0, 1fr);
}

.silence-viioko__sheet--sample-one-two {
  --silence-viioko-divider-a-start: 32.299%;
  --silence-viioko-divider-a-end: 34.742%;
  --silence-viioko-primary-divider-start: var(--silence-viioko-divider-a-start);
  --silence-viioko-primary-divider-end: var(--silence-viioko-divider-a-end);
  --silence-viioko-english-left: 55%;
}

.silence-viioko__sheet--sample-two-one {
  --silence-viioko-divider-b-start: 65.233%;
  --silence-viioko-divider-b-end: 67.676%;
  --silence-viioko-primary-divider-start: var(--silence-viioko-divider-b-start);
  --silence-viioko-primary-divider-end: var(--silence-viioko-divider-b-end);
  --silence-viioko-english-left: 34%;
}

.silence-viioko__sheet--sample-thirds {
  --silence-viioko-divider-a-start: 32.299%;
  --silence-viioko-divider-a-end: 34.742%;
  --silence-viioko-divider-b-start: 65.233%;
  --silence-viioko-divider-b-end: 67.676%;
  --silence-viioko-english-left: 70%;
  grid-template-columns:
    minmax(0, var(--silence-viioko-divider-a-start))
    calc(var(--silence-viioko-divider-a-end) - var(--silence-viioko-divider-a-start))
    minmax(0, calc(var(--silence-viioko-divider-b-start) - var(--silence-viioko-divider-a-end)))
    calc(var(--silence-viioko-divider-b-end) - var(--silence-viioko-divider-b-start))
    minmax(0, calc(100% - var(--silence-viioko-divider-b-end)));
}

.silence-viioko__sheet--sample-full .silence-viioko__page--sample-profile {
  grid-column: 1 / -1;
  border-right: 0;
}

.silence-viioko__sheet--sample-thirds .silence-viioko__page--sample-profile {
  grid-column: 1 / 2;
}

.silence-viioko__sheet--sample-thirds .silence-viioko__page--sample-materials {
  grid-column: 3 / 4;
}

.silence-viioko__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.silence-viioko__backdrop::before {
  position: absolute;
  top: -3%;
  right: 6%;
  width: auto;
  background: none;
  color: rgba(186, 96, 104, 0.1);
  content: 'SILENCE';
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(10rem, 17vw, 19rem);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 0.72;
  opacity: 1;
  text-transform: uppercase;
  white-space: nowrap;
  writing-mode: vertical-rl;
}

.silence-viioko__backdrop-portrait {
  position: absolute;
  bottom: -22%;
  left: -12%;
  width: min(58%, 900px);
  max-width: none;
  opacity: 0.1;
  filter: sepia(0.14) saturate(0.7);
  transform: scale(1.32);
  transform-origin: left bottom;
}

.silence-viioko__sheet--sample .silence-viioko__backdrop::before {
  top: var(--silence-viioko-english-top);
  right: auto;
  bottom: auto;
  left: var(--silence-viioko-english-left);
  width: auto;
  background: none;
  color: rgba(186, 96, 104, 0.1);
  content: 'SILENCE';
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(10rem, 17vw, 19rem);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 0.72;
  opacity: 1;
  text-transform: uppercase;
  transform: none;
  white-space: nowrap;
  writing-mode: vertical-rl;
}

.silence-viioko__sheet--sample .silence-viioko__backdrop-portrait {
  display: block;
  bottom: -18%;
  left: -7%;
  width: min(58%, 900px);
  opacity: 0.08;
  filter: grayscale(1) sepia(0.24) saturate(0.6) hue-rotate(305deg);
  mix-blend-mode: multiply;
  transform: scale(1.22);
  transform-origin: left bottom;
}

.silence-viioko__sheet--sample:nth-of-type(odd) .silence-viioko__backdrop-portrait {
  right: -10%;
  left: auto;
  transform: scaleX(-1) scale(1.2);
  transform-origin: right bottom;
}

.silence-viioko__page {
  position: relative;
  z-index: 2;
  min-width: 0;
}

.silence-viioko__page--profile {
  display: grid;
  grid-column: 1 / 2;
  grid-template-rows: auto auto auto 1fr auto;
  gap: clamp(8px, 0.95vw, 16px);
  padding: 4.9% 6.3% 4.3%;
  border-right: 0;
}

.silence-viioko__page--materials {
  display: grid;
  grid-column: 3 / 4;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(10px, 1vw, 20px);
  padding: 3.2% 7.1% 4.2% 2.8%;
}

.silence-viioko__page--sample-profile {
  grid-template-rows: auto minmax(0, 0.58fr) minmax(0, 0.42fr);
  border-right: 0;
}

.silence-viioko__page--sample-materials {
  padding-right: 6.1%;
}

.silence-viioko__page--sample-tertiary {
  display: grid;
  grid-column: 5 / 6;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(10px, 1vw, 20px);
  padding: 3.2% 11% 4.2% 7%;
}

.silence-viioko__identity {
  display: grid;
  gap: 4px;
}

.silence-viioko__identity h2 {
  max-width: 7.2em;
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 3.45rem;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 0.82;
  text-transform: uppercase;
}

.silence-viioko__identity p {
  margin: 0;
  color: rgba(36, 27, 47, 0.58);
  font-size: 0.875rem;
  line-height: 1.4;
}

.silence-viioko__kicker {
  color: var(--silence-viioko-accent) !important;
  font-weight: 760;
}

.silence-viioko__layout {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.silence-viioko__layout > * {
  min-width: 0;
}

.silence-viioko__layout--one-two:not(.silence-viioko__facts) > :not(:first-child),
.silence-viioko__layout--two-one:not(.silence-viioko__facts) > :not(:first-child),
.silence-viioko__layout--thirds:not(.silence-viioko__facts) > :not(:first-child) {
  position: relative;
}

.silence-viioko__layout--one-two:not(.silence-viioko__facts) > :not(:first-child)::before,
.silence-viioko__layout--two-one:not(.silence-viioko__facts) > :not(:first-child)::before,
.silence-viioko__layout--thirds:not(.silence-viioko__facts) > :not(:first-child)::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -6.5px;
  width: 1px;
  background: rgba(35, 28, 42, 0.16);
  content: '';
  pointer-events: none;
}

.silence-viioko__layout--full {
  grid-template-columns: minmax(0, 1fr);
}

.silence-viioko__layout--one-two {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}

.silence-viioko__layout--two-one {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.silence-viioko__layout--thirds {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.silence-viioko__portrait-grid {
  align-items: stretch;
}

.silence-viioko__portrait-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(35, 28, 42, 0.18);
  background: rgba(255, 255, 255, 0.74);
}

.silence-viioko__portrait-card img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  filter: saturate(0.86) contrast(0.96);
}

.silence-viioko__portrait-card--hero {
  min-height: clamp(150px, 21svh, 230px);
}

.silence-viioko__portrait-card--hero img {
  object-position: 50% 15%;
}

.silence-viioko__portrait-card--crop {
  min-height: clamp(150px, 21svh, 230px);
}

.silence-viioko__portrait-card--crop img {
  object-position: 50% 32%;
  transform: scale(1.9);
}

.silence-viioko__portrait-card--sample {
  min-height: 0;
}

.silence-viioko__portrait-card--sample img {
  object-position: 50% 22%;
  transform: scale(1.08);
}

.silence-viioko__sheet--sample-dossier .silence-viioko__portrait-card--sample img {
  object-position: 50% 52%;
  transform: scale(1.65);
}

.silence-viioko__sheet--sample-material-wall .silence-viioko__portrait-card--sample img {
  object-position: 50% 38%;
  transform: scaleX(-1) scale(1.2);
}

.silence-viioko__sheet--followup .silence-viioko__portrait-card--hero img {
  object-position: 50% 42%;
  transform: scale(1.14);
}

.silence-viioko__sheet--followup .silence-viioko__portrait-card--crop img {
  object-position: 50% 60%;
  transform: scale(2.05);
}

.silence-viioko__portrait-card figcaption,
.silence-viioko__standee figcaption {
  padding: 6px 8px;
  color: rgba(36, 27, 47, 0.58);
  font-size: 0.6875rem;
  letter-spacing: 0;
}

.silence-viioko__overview {
  margin: 0;
  padding: 8px 0 8px 14px;
  border-left: 2px solid var(--silence-viioko-accent);
  color: rgba(36, 27, 47, 0.68);
  font-size: 0.875rem;
  line-height: 1.55;
}

.silence-viioko__facts {
  gap: 0;
  margin: 0;
  border-top: 1px solid rgba(35, 28, 42, 0.15);
  border-left: 1px solid rgba(35, 28, 42, 0.15);
}

.silence-viioko__facts div {
  min-width: 0;
  padding: 7px 9px;
  border-right: 1px solid rgba(35, 28, 42, 0.15);
  border-bottom: 1px solid rgba(35, 28, 42, 0.15);
}

.silence-viioko__facts dt {
  color: color-mix(in srgb, var(--silence-viioko-accent), #241b2f 28%);
  font-size: 0.6875rem;
  font-weight: 780;
}

.silence-viioko__facts dd {
  margin: 4px 0 0;
  color: rgba(36, 27, 47, 0.72);
  font-size: 0.8125rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.silence-viioko__detail-strip {
  gap: 10px;
  align-self: end;
}

.silence-viioko__detail-strip article {
  min-width: 0;
  padding-top: 8px;
  border-top: 1px solid rgba(35, 28, 42, 0.15);
}

.silence-viioko__detail-strip h3,
.silence-viioko__material-list h3,
.silence-viioko__sample-copy h3,
.silence-viioko__sample-notes h3 {
  margin: 0;
  color: #241b2f;
  font-size: 0.9375rem;
  font-weight: 820;
  line-height: 1.25;
}

.silence-viioko__detail-strip p,
.silence-viioko__material-list p,
.silence-viioko__material-list li,
.silence-viioko__sample-copy p,
.silence-viioko__sample-notes p {
  margin: 6px 0 0;
  color: rgba(36, 27, 47, 0.62);
  font-size: 0.75rem;
  line-height: 1.4;
}

.silence-viioko__sample-lead {
  align-items: stretch;
  min-height: 0;
}

.silence-viioko__sample-copy {
  min-width: 0;
  padding: 12px 0 12px 14px;
  border-left: 2px solid var(--silence-viioko-accent);
}

.silence-viioko__sample-strip {
  align-self: stretch;
}

.silence-viioko__sample-strip article {
  display: grid;
  align-content: start;
}

.silence-viioko__materials-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.silence-viioko__materials-header p {
  margin: 0;
  color: #241b2f;
  font-size: 1.25rem;
  font-weight: 860;
}

.silence-viioko__swatches {
  display: flex;
  gap: 10px;
}

.silence-viioko__swatches span {
  width: clamp(18px, 1.6vw, 32px);
  aspect-ratio: 1;
  background: var(--silence-viioko-accent);
}

.silence-viioko__swatches span:nth-child(2) {
  background: #241b2f;
}

.silence-viioko__swatches span:nth-child(3) {
  border: 1px solid rgba(35, 28, 42, 0.18);
  background: #f0ecec;
}

.silence-viioko__materials-grid {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 0.27fr) minmax(0, 0.25fr) minmax(0, 0.25fr) minmax(0, 0.23fr);
  grid-template-rows: minmax(0, 0.56fr) minmax(0, 0.44fr);
  gap: clamp(10px, 0.9vw, 18px);
}

.silence-viioko__standee {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  margin: 0;
  align-items: end;
  overflow: hidden;
  border-bottom: 1px solid rgba(35, 28, 42, 0.14);
}

.silence-viioko__standee img {
  justify-self: center;
  width: auto;
  height: 92%;
  object-fit: contain;
  object-position: bottom center;
  filter: saturate(0.9) contrast(0.98);
}

.silence-viioko__standee--front {
  grid-row: 1 / -1;
}

.silence-viioko__standee--back {
  grid-row: 1 / -1;
}

.silence-viioko__standee--back img {
  transform: scaleX(-1);
}

.silence-viioko__material-list {
  display: grid;
  grid-column: span 2;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
}

.silence-viioko__material-list article {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(35, 28, 42, 0.14);
  background: rgba(255, 255, 255, 0.62);
}

.silence-viioko__material-list ul {
  margin: 8px 0 0;
  padding-left: 16px;
}

.silence-viioko__specimen-board {
  display: grid;
  grid-column: span 2;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.silence-viioko__specimen-board figure {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(35, 28, 42, 0.14);
  background: rgba(255, 255, 255, 0.66);
}

.silence-viioko__specimen-board img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.silence-viioko__specimen-board figure:nth-child(1) img {
  object-position: 50% 13%;
  transform: scale(1.95);
}

.silence-viioko__specimen-board figure:nth-child(2) img {
  object-position: 50% 42%;
  transform: scale(1.55);
}

.silence-viioko__specimen-board figure:nth-child(3) img {
  object-position: 50% 72%;
  transform: scale(1.72);
}

.silence-viioko__specimen-board figure:nth-child(4) img {
  object-position: 50% 50%;
  transform: scaleX(-1) scale(1.46);
}

.silence-viioko__sample-board {
  display: grid;
  min-height: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: clamp(10px, 0.9vw, 18px);
}

.silence-viioko__sample-image {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(35, 28, 42, 0.14);
  background: rgba(255, 255, 255, 0.64);
}

.silence-viioko__sample-image figcaption {
  padding: 6px 8px;
  color: rgba(36, 27, 47, 0.58);
  font-size: 0.6875rem;
  letter-spacing: 0;
}

.silence-viioko__sample-image img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: 50% 36%;
  filter: saturate(0.88) contrast(0.97);
}

.silence-viioko__sample-image--full img {
  object-position: 50% 24%;
}

.silence-viioko__sample-image--face img {
  object-position: 50% 18%;
  transform: scale(1.9);
}

.silence-viioko__sample-image--detail img {
  object-position: 50% 66%;
  transform: scale(1.55);
}

.silence-viioko__sample-image--reverse img {
  object-position: 50% 42%;
  transform: scaleX(-1) scale(1.28);
}

.silence-viioko__sample-notes {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.silence-viioko__sample-notes article {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(35, 28, 42, 0.14);
  background: rgba(255, 255, 255, 0.6);
}

.silence-viioko__sample-board--gallery .silence-viioko__sample-image--full {
  grid-column: 1 / 3;
  grid-row: 1 / 4;
}

.silence-viioko__sample-board--gallery .silence-viioko__sample-notes {
  grid-column: 4 / 5;
  grid-row: 2 / 4;
  grid-template-columns: 1fr;
}

.silence-viioko__sample-board--dossier .silence-viioko__sample-image--full {
  grid-column: 3 / 5;
  grid-row: 1 / 3;
}

.silence-viioko__sample-board--dossier .silence-viioko__sample-notes {
  grid-column: 1 / 3;
  grid-row: 1 / 4;
}

.silence-viioko__sample-board--materials .silence-viioko__sample-image--full {
  grid-column: 1 / 2;
  grid-row: 1 / 4;
}

.silence-viioko__sample-board--materials .silence-viioko__sample-notes {
  grid-column: 3 / 5;
  grid-row: 1 / 4;
}

.silence-viioko__rail {
  position: absolute;
  top: 8%;
  right: 1.7%;
  bottom: 7%;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  color: rgba(36, 27, 47, 0.78);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.875rem;
  letter-spacing: 0;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

@media (max-width: 1280px) {
  .silence-viioko__backdrop::before {
    top: -6%;
    right: -6%;
    width: 68%;
  }

  .silence-viioko__sheet--sample .silence-viioko__backdrop::before {
    top: var(--silence-viioko-english-top);
    right: auto;
    left: var(--silence-viioko-english-left);
    width: auto;
  }

  .silence-viioko__identity h2 {
    font-size: 3rem;
  }
}

@media (max-width: 900px) {
  .silence-viioko {
    padding: 0;
  }

  .silence-viioko__sheet--followup .silence-viioko__backdrop::before {
    left: -18%;
    width: 120%;
  }

  .silence-viioko__sheet--followup .silence-viioko__backdrop-portrait {
    right: -36%;
    width: 120%;
  }

  .silence-viioko__sheet--sample:nth-of-type(odd) .silence-viioko__backdrop-portrait {
    right: -36%;
    width: 120%;
  }

  .silence-viioko__sheet {
    width: 100%;
    aspect-ratio: auto;
    grid-template-columns: 1fr;
    background: #fff;
  }

  .silence-viioko__sheet--sample::after {
    content: none;
  }

  .silence-viioko__sheet::before {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) 18px 22px / calc(100% - 36px) 1px no-repeat,
      linear-gradient(rgba(35, 28, 42, 0.12), rgba(35, 28, 42, 0.12)) 18px calc(100% - 22px) / calc(100% - 36px) 1px no-repeat,
      linear-gradient(rgba(35, 28, 42, 0.12), rgba(35, 28, 42, 0.12)) 18px 22px / 1px calc(100% - 44px) no-repeat,
      linear-gradient(rgba(35, 28, 42, 0.12), rgba(35, 28, 42, 0.12)) calc(100% - 18px) 22px / 1px calc(100% - 44px) no-repeat;
    content: '';
    pointer-events: none;
  }

  .silence-viioko__sheet--sample::before {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(rgba(35, 28, 42, 0.14), rgba(35, 28, 42, 0.14)) 18px 22px / calc(100% - 36px) 1px no-repeat,
      linear-gradient(rgba(35, 28, 42, 0.12), rgba(35, 28, 42, 0.12)) 18px calc(100% - 22px) / calc(100% - 36px) 1px no-repeat,
      linear-gradient(rgba(35, 28, 42, 0.12), rgba(35, 28, 42, 0.12)) 18px 22px / 1px calc(100% - 44px) no-repeat,
      linear-gradient(rgba(35, 28, 42, 0.12), rgba(35, 28, 42, 0.12)) calc(100% - 18px) 22px / 1px calc(100% - 44px) no-repeat;
    content: '';
    pointer-events: none;
  }

  .silence-viioko__page--profile,
  .silence-viioko__page--materials,
  .silence-viioko__page--sample-tertiary {
    grid-column: auto;
    padding: 42px 22px;
  }

  .silence-viioko__sheet--sample-full .silence-viioko__page--sample-profile,
  .silence-viioko__sheet--sample-thirds .silence-viioko__page--sample-profile,
  .silence-viioko__sheet--sample-thirds .silence-viioko__page--sample-materials,
  .silence-viioko__sheet--sample-thirds .silence-viioko__page--sample-tertiary {
    grid-column: auto;
  }

  .silence-viioko__page--profile {
    border-right: 0;
    border-bottom: 1px solid rgba(35, 28, 42, 0.18);
  }

  .silence-viioko__portrait-grid,
  .silence-viioko__facts,
  .silence-viioko__detail-strip,
  .silence-viioko__sample-lead,
  .silence-viioko__layout--full,
  .silence-viioko__layout--one-two,
  .silence-viioko__layout--two-one,
  .silence-viioko__layout--thirds {
    grid-template-columns: 1fr;
  }

  .silence-viioko__layout--one-two:not(.silence-viioko__facts) > :not(:first-child)::before,
  .silence-viioko__layout--two-one:not(.silence-viioko__facts) > :not(:first-child)::before,
  .silence-viioko__layout--thirds:not(.silence-viioko__facts) > :not(:first-child)::before {
    top: -6.5px;
    right: 0;
    bottom: auto;
    left: 0;
    width: auto;
    height: 1px;
  }

  .silence-viioko__portrait-card--hero,
  .silence-viioko__portrait-card--crop {
    height: 320px;
    min-height: 0;
  }

  .silence-viioko__materials-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .silence-viioko__standee {
    min-height: 420px;
  }

  .silence-viioko__standee--front,
  .silence-viioko__standee--back {
    grid-row: auto;
  }

  .silence-viioko__material-list {
    grid-column: auto;
    grid-template-columns: 1fr;
  }

  .silence-viioko__specimen-board {
    grid-column: auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .silence-viioko__sample-board,
  .silence-viioko__sample-board--gallery,
  .silence-viioko__sample-board--dossier,
  .silence-viioko__sample-board--materials {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .silence-viioko__sample-board--gallery .silence-viioko__sample-image--full,
  .silence-viioko__sample-board--gallery .silence-viioko__sample-notes,
  .silence-viioko__sample-board--dossier .silence-viioko__sample-image--full,
  .silence-viioko__sample-board--dossier .silence-viioko__sample-notes,
  .silence-viioko__sample-board--materials .silence-viioko__sample-image--full,
  .silence-viioko__sample-board--materials .silence-viioko__sample-notes {
    grid-column: auto;
    grid-row: auto;
  }

  .silence-viioko__sample-image {
    min-height: 300px;
  }

  .silence-viioko__sample-image--full {
    min-height: 420px;
  }

  .silence-viioko__sample-notes {
    grid-template-columns: 1fr;
  }

  .silence-viioko__rail {
    display: none;
  }

  .silence-viioko__backdrop::before {
    top: 0;
    right: -18%;
    width: 120%;
    opacity: 0.62;
  }

  .silence-viioko__sheet--sample .silence-viioko__backdrop::before {
    top: 8px;
    right: auto;
    left: 58%;
    width: auto;
    font-size: 8.5rem;
    opacity: 0.9;
  }

  .silence-viioko__identity h2 {
    font-size: 2.375rem;
  }

  .silence-viioko__identity p,
  .silence-viioko__overview,
  .silence-viioko__materials-header p {
    font-size: 0.9375rem;
  }
}

@media (max-width: 640px) {
  .silence-viioko__page--profile,
  .silence-viioko__page--materials {
    padding: 34px 18px;
  }

  .silence-viioko__specimen-board {
    grid-template-columns: 1fr;
  }

  .silence-viioko__standee {
    min-height: 360px;
  }

  .silence-viioko__portrait-card--hero,
  .silence-viioko__portrait-card--crop,
  .silence-viioko__portrait-card--sample {
    height: 300px;
  }

  .silence-viioko__backdrop::before {
    right: -32%;
    width: 150%;
    opacity: 0.48;
  }

  .silence-viioko__sample-image,
  .silence-viioko__sample-image--full {
    min-height: 300px;
  }
}
</style>
