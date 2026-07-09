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
      <div class="silence-viioko__cutouts" aria-hidden="true"></div>
      <div class="silence-viioko__debug-boundaries" aria-hidden="true"></div>

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
            <p>{{ block.points[0] ?? emptyText }}</p>
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
      <div class="silence-viioko__cutouts" aria-hidden="true"></div>
      <div class="silence-viioko__debug-boundaries" aria-hidden="true"></div>

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
            <p>{{ combatPreview[0] ?? emptyText }}</p>
          </article>
          <article>
            <h3>{{ visibleStoryCards[0]?.title ?? storyTitle }}</h3>
            <p>{{ visibleStoryCards[0]?.preview ?? combatPreview[1] ?? emptyText }}</p>
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
      <div class="silence-viioko__cutouts" aria-hidden="true"></div>
      <div class="silence-viioko__debug-boundaries" aria-hidden="true"></div>

      <div class="silence-viioko__page silence-viioko__page--profile silence-viioko__page--sample-profile">
        <header class="silence-viioko__identity">
          <p class="silence-viioko__kicker">{{ sample.kicker }}</p>
          <h2>{{ sample.title }}</h2>
          <p>{{ sample.subtitle }}</p>
        </header>

        <div
          class="silence-viioko__layout silence-viioko__layout--framed silence-viioko__sample-lead"
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

          <article
            v-if="sample.leadAside"
            class="silence-viioko__sample-copy silence-viioko__sample-copy--aside"
          >
            <h3>{{ sample.leadAside.title }}</h3>
            <p>{{ sample.leadAside.body }}</p>
          </article>
        </div>

        <div
          class="silence-viioko__layout silence-viioko__layout--framed silence-viioko__detail-strip silence-viioko__sample-strip"
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
} = useSilenceViiokoPrototypeModel({
  character: toRef(props, 'character'),
  t
})
</script>

<style scoped>
.silence-viioko {
  --silence-viioko-sheet-bg: rgb(232 232 232);
  --silence-viioko-frame-bg: rgb(255 255 255);
  --silence-viioko-paper-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.74' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='table' tableValues='0 0.11'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23noise)'/%3E%3C/svg%3E");
  position: relative;
  display: block;
  scroll-margin-top: 92px;
  padding: clamp(20px, 3vw, 44px) 0;
  overflow: visible;
  overflow-x: clip;
  background-color: var(--silence-viioko-sheet-bg);
  background-image: var(--silence-viioko-paper-noise);
  background-size: 180px 180px;
}

.silence-viioko__sheet {
  --silence-viioko-frame-left: var(--silence-viioko-frame-top-length);
  --silence-viioko-frame-right: var(--silence-viioko-frame-top-length);
  --silence-viioko-frame-top: var(--silence-viioko-frame-top-length);
  --silence-viioko-frame-bottom: var(--silence-viioko-frame-bottom-length);
  --silence-viioko-divider-a-start: 32.299%;
  --silence-viioko-divider-a-end: 34.742%;
  --silence-viioko-divider-b-start: -20%;
  --silence-viioko-divider-b-end: -20%;
  --silence-viioko-primary-divider-start: var(--silence-viioko-divider-a-start);
  --silence-viioko-primary-divider-end: var(--silence-viioko-divider-a-end);
  --silence-viioko-line-extend-left: var(--silence-viioko-frame-left);
  --silence-viioko-line-extend-right: var(--silence-viioko-frame-right);
  --silence-viioko-line-horizontal-left: calc(var(--silence-viioko-frame-left) - var(--silence-viioko-line-extend-left));
  --silence-viioko-line-horizontal-width: calc(100% - var(--silence-viioko-frame-left) - var(--silence-viioko-frame-right) + var(--silence-viioko-line-extend-left) + var(--silence-viioko-line-extend-right));
  --silence-viioko-line-horizontal-bottom: calc(100% - var(--silence-viioko-frame-bottom) - 1px);
  --silence-viioko-frame-right-line: calc(100% - var(--silence-viioko-frame-right) - 1px);
  --silence-viioko-divider-a-end-line: var(--silence-viioko-divider-a-end);
  --silence-viioko-divider-b-end-line: var(--silence-viioko-divider-b-end);
  --silence-viioko-frame-line-color: rgba(35, 28, 42, 0.14);
  --silence-viioko-frame-line-strong-color: rgba(35, 28, 42, 0.16);
  --silence-viioko-corner-line-color: rgba(35, 28, 42, 0.2);
  --silence-viioko-backdrop-top: calc(var(--silence-viioko-frame-top) + 1px);
  --silence-viioko-backdrop-right: calc(var(--silence-viioko-frame-right) + 2px);
  --silence-viioko-backdrop-bottom: calc(var(--silence-viioko-frame-bottom) + 2px);
  --silence-viioko-backdrop-left: calc(var(--silence-viioko-frame-left) + 1px);
  --silence-viioko-divider-a-cutout-extra: 1px;
  --silence-viioko-divider-b-cutout-extra: 0px;
  --silence-viioko-corner-diagonal-top: var(--silence-viioko-frame-top);
  --silence-viioko-corner-diagonal-left: var(--silence-viioko-frame-left);
  --silence-viioko-corner-diagonal-size: clamp(140px, 16vw, 260px);
  --silence-viioko-corner-diagonal-offset: clamp(70px, 8vw, 130px);
  --silence-viioko-frame-top-length: clamp(18px, 1.8438vw, 31px);
  --silence-viioko-frame-bottom-length: clamp(30px, 3.2095vw, 54px);
  --silence-viioko-sheet-stack-overlap: calc(var(--silence-viioko-frame-bottom-length) + 1px);
  --silence-viioko-line-overhang-top: var(--silence-viioko-frame-top);
  --silence-viioko-line-overhang-bottom: clamp(14px, 1.4286vw, 24px);
  --silence-viioko-line-vertical-top: calc(var(--silence-viioko-frame-top) - var(--silence-viioko-line-overhang-top));
  --silence-viioko-line-vertical-height: calc(100% - var(--silence-viioko-frame-top) - var(--silence-viioko-frame-bottom) + var(--silence-viioko-line-overhang-top) + var(--silence-viioko-line-overhang-bottom));
  --silence-viioko-frame-inner-gap: clamp(8px, 0.7vw, 12px);
  --silence-viioko-content-top-length: calc(var(--silence-viioko-frame-top-length) + var(--silence-viioko-frame-inner-gap));
  --silence-viioko-content-bottom-length: calc(var(--silence-viioko-frame-bottom-length) + var(--silence-viioko-frame-inner-gap));
  --silence-viioko-page-safe-x: clamp(22px, 2.15vw, 38px);
  --silence-viioko-cell-safe-x: clamp(12px, 1vw, 18px);
  --silence-viioko-cell-safe-y: clamp(10px, 0.85vw, 16px);
  --silence-viioko-cell-padding: var(--silence-viioko-cell-safe-y) var(--silence-viioko-cell-safe-x);
  --silence-viioko-panel-gap: clamp(10px, 0.9vw, 18px);
  --silence-viioko-profile-left-clip: 5.73%;
  --silence-viioko-profile-right-clip: 0%;
  --silence-viioko-material-left-clip: 0%;
  --silence-viioko-material-right-clip: 2.84%;
  --silence-viioko-third-right-clip: 5.73%;
  position: relative;
  z-index: 1;
  isolation: isolate;
  display: grid;
  justify-self: center;
  width: min(1680px, 100%);
  aspect-ratio: 4011 / 2739;
  grid-template-columns:
    minmax(0, var(--silence-viioko-primary-divider-start))
    calc(var(--silence-viioko-primary-divider-end) - var(--silence-viioko-primary-divider-start))
    minmax(0, calc(100% - var(--silence-viioko-primary-divider-end)));
  margin: 0 auto;
  overflow: visible;
  background: transparent;
  color: #241b2f;
}

.silence-viioko__sheet::before {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(var(--silence-viioko-frame-line-strong-color), var(--silence-viioko-frame-line-strong-color)) var(--silence-viioko-line-horizontal-left) var(--silence-viioko-frame-top) / var(--silence-viioko-line-horizontal-width) 1px no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-line-horizontal-left) var(--silence-viioko-line-horizontal-bottom) / var(--silence-viioko-line-horizontal-width) 1px no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-left) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-right-line) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-a-start) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-a-end-line) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-b-start) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-b-end-line) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat;
  content: '';
  pointer-events: none;
}

.silence-viioko__sheet::after {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(135deg, transparent calc(50% - 0.5px), var(--silence-viioko-corner-line-color) 50%, transparent calc(50% + 0.5px))
    calc(var(--silence-viioko-corner-diagonal-left) - var(--silence-viioko-corner-diagonal-offset))
    calc(var(--silence-viioko-corner-diagonal-top) - var(--silence-viioko-corner-diagonal-offset))
    / var(--silence-viioko-corner-diagonal-size) var(--silence-viioko-corner-diagonal-size)
    no-repeat;
  content: '';
  mask:
    linear-gradient(#000 0 0) 0 0 / 100% var(--silence-viioko-corner-diagonal-top) no-repeat,
    linear-gradient(#000 0 0) 0 0 / var(--silence-viioko-corner-diagonal-left) 100% no-repeat;
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#000 0 0) 0 0 / 100% var(--silence-viioko-corner-diagonal-top) no-repeat,
    linear-gradient(#000 0 0) 0 0 / var(--silence-viioko-corner-diagonal-left) 100% no-repeat;
}

.silence-viioko__debug-boundaries {
  --silence-viioko-debug-line: #ff00d6;
  --silence-viioko-debug-line-size: 3px;
  position: absolute;
  inset: 0;
  z-index: 6;
  opacity: 0;
  background:
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-line-horizontal-left) var(--silence-viioko-frame-top) / var(--silence-viioko-line-horizontal-width) var(--silence-viioko-debug-line-size) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-line-horizontal-left) var(--silence-viioko-line-horizontal-bottom) / var(--silence-viioko-line-horizontal-width) var(--silence-viioko-debug-line-size) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-frame-left) var(--silence-viioko-line-vertical-top) / var(--silence-viioko-debug-line-size) var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-frame-right-line) var(--silence-viioko-line-vertical-top) / var(--silence-viioko-debug-line-size) var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-divider-a-start) var(--silence-viioko-line-vertical-top) / var(--silence-viioko-debug-line-size) var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-divider-a-end-line) var(--silence-viioko-line-vertical-top) / var(--silence-viioko-debug-line-size) var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-divider-b-start) var(--silence-viioko-line-vertical-top) / var(--silence-viioko-debug-line-size) var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-debug-line), var(--silence-viioko-debug-line)) var(--silence-viioko-divider-b-end-line) var(--silence-viioko-line-vertical-top) / var(--silence-viioko-debug-line-size) var(--silence-viioko-line-vertical-height) no-repeat;
  filter: drop-shadow(0 0 4px rgba(255, 0, 214, 0.8));
  pointer-events: none;
  transition: opacity 140ms ease;
}

.silence-viioko__debug-boundaries::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, transparent calc(50% - var(--silence-viioko-debug-line-size) / 2), var(--silence-viioko-debug-line) 50%, transparent calc(50% + var(--silence-viioko-debug-line-size) / 2))
    calc(var(--silence-viioko-corner-diagonal-left) - var(--silence-viioko-corner-diagonal-offset))
    calc(var(--silence-viioko-corner-diagonal-top) - var(--silence-viioko-corner-diagonal-offset))
    / var(--silence-viioko-corner-diagonal-size) var(--silence-viioko-corner-diagonal-size)
    no-repeat;
  content: '';
  mask:
    linear-gradient(#000 0 0) 0 0 / 100% var(--silence-viioko-corner-diagonal-top) no-repeat,
    linear-gradient(#000 0 0) 0 0 / var(--silence-viioko-corner-diagonal-left) 100% no-repeat;
  -webkit-mask:
    linear-gradient(#000 0 0) 0 0 / 100% var(--silence-viioko-corner-diagonal-top) no-repeat,
    linear-gradient(#000 0 0) 0 0 / var(--silence-viioko-corner-diagonal-left) 100% no-repeat;
}

.silence-viioko__sheet:hover .silence-viioko__debug-boundaries,
.silence-viioko__sheet:focus-within .silence-viioko__debug-boundaries {
  opacity: 1;
}

.silence-viioko__cutouts {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.silence-viioko__cutouts::before,
.silence-viioko__cutouts::after {
  position: absolute;
  top: var(--silence-viioko-frame-top);
  bottom: var(--silence-viioko-frame-bottom);
  background-color: var(--silence-viioko-sheet-bg);
  background-image: var(--silence-viioko-paper-noise);
  background-size: 180px 180px;
  content: '';
}

.silence-viioko__cutouts::before {
  left: var(--silence-viioko-divider-a-start);
  width: calc(var(--silence-viioko-divider-a-end) - var(--silence-viioko-divider-a-start) + var(--silence-viioko-divider-a-cutout-extra));
}

.silence-viioko__cutouts::after {
  left: var(--silence-viioko-divider-b-start);
  width: calc(var(--silence-viioko-divider-b-end) - var(--silence-viioko-divider-b-start) + var(--silence-viioko-divider-b-cutout-extra));
}

.silence-viioko__sheet + .silence-viioko__sheet {
  margin-top: calc(-1 * var(--silence-viioko-sheet-stack-overlap));
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
  --silence-viioko-frame-left: var(--silence-viioko-frame-top-length);
  --silence-viioko-frame-right: var(--silence-viioko-frame-top-length);
  --silence-viioko-frame-top: var(--silence-viioko-frame-top-length);
  --silence-viioko-frame-bottom: var(--silence-viioko-frame-bottom-length);
  --silence-viioko-divider-a-start: -20%;
  --silence-viioko-divider-a-end: -20%;
  --silence-viioko-divider-b-start: -20%;
  --silence-viioko-divider-b-end: -20%;
  --silence-viioko-english-left: 61%;
  --silence-viioko-english-top: 0%;
  --silence-viioko-corner-diagonal-top: var(--silence-viioko-frame-top);
  --silence-viioko-corner-diagonal-left: var(--silence-viioko-frame-left);
  --silence-viioko-corner-diagonal-size: clamp(140px, 16vw, 260px);
  --silence-viioko-corner-diagonal-offset: clamp(70px, 8vw, 130px);
  background: transparent;
}

.silence-viioko__sheet--sample .silence-viioko__backdrop {
  display: block;
}

.silence-viioko__sheet--sample::before {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(var(--silence-viioko-frame-line-strong-color), var(--silence-viioko-frame-line-strong-color)) var(--silence-viioko-line-horizontal-left) var(--silence-viioko-frame-top) / var(--silence-viioko-line-horizontal-width) 1px no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-line-horizontal-left) var(--silence-viioko-line-horizontal-bottom) / var(--silence-viioko-line-horizontal-width) 1px no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-left) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-right-line) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-a-start) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-a-end-line) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-b-start) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat,
    linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-divider-b-end-line) var(--silence-viioko-line-vertical-top) / 1px var(--silence-viioko-line-vertical-height) no-repeat;
  content: '';
  pointer-events: none;
}

.silence-viioko__sheet--sample::after {
  position: absolute;
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(135deg, transparent calc(50% - 0.5px), var(--silence-viioko-corner-line-color) 50%, transparent calc(50% + 0.5px))
    calc(var(--silence-viioko-corner-diagonal-left) - var(--silence-viioko-corner-diagonal-offset))
    calc(var(--silence-viioko-corner-diagonal-top) - var(--silence-viioko-corner-diagonal-offset))
    / var(--silence-viioko-corner-diagonal-size) var(--silence-viioko-corner-diagonal-size)
    no-repeat;
  content: '';
  mask:
    linear-gradient(#000 0 0) 0 0 / 100% var(--silence-viioko-corner-diagonal-top) no-repeat,
    linear-gradient(#000 0 0) 0 0 / var(--silence-viioko-corner-diagonal-left) 100% no-repeat;
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#000 0 0) 0 0 / 100% var(--silence-viioko-corner-diagonal-top) no-repeat,
    linear-gradient(#000 0 0) 0 0 / var(--silence-viioko-corner-diagonal-left) 100% no-repeat;
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
  inset: var(--silence-viioko-backdrop-top) var(--silence-viioko-backdrop-right) var(--silence-viioko-backdrop-bottom) var(--silence-viioko-backdrop-left);
  z-index: 0;
  overflow: hidden;
  overflow: clip;
  contain: paint;
  background: var(--silence-viioko-frame-bg);
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
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  overflow: clip;
  contain: paint;
  clip-path: inset(
    var(--silence-viioko-page-clip-top, var(--silence-viioko-frame-top))
    var(--silence-viioko-page-clip-right, 0%)
    var(--silence-viioko-page-clip-bottom, var(--silence-viioko-frame-bottom))
    var(--silence-viioko-page-clip-left, 0%)
  );
}

.silence-viioko__page--profile {
  --silence-viioko-page-clip-left: var(--silence-viioko-profile-left-clip);
  --silence-viioko-page-clip-right: var(--silence-viioko-profile-right-clip);
  display: grid;
  grid-column: 1 / 2;
  grid-template-rows: auto auto auto 1fr auto;
  gap: var(--silence-viioko-panel-gap);
  padding:
    var(--silence-viioko-content-top-length)
    max(6.3%, var(--silence-viioko-page-safe-x))
    var(--silence-viioko-content-bottom-length);
  border-right: 0;
}

.silence-viioko__page--materials {
  --silence-viioko-page-clip-left: var(--silence-viioko-material-left-clip);
  --silence-viioko-page-clip-right: var(--silence-viioko-material-right-clip);
  display: grid;
  grid-column: 3 / 4;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--silence-viioko-panel-gap);
  padding:
    var(--silence-viioko-content-top-length)
    max(7.1%, var(--silence-viioko-page-safe-x))
    var(--silence-viioko-content-bottom-length)
    max(2.8%, var(--silence-viioko-page-safe-x));
}

.silence-viioko__page--sample-profile {
  grid-template-rows: auto minmax(0, 0.58fr) minmax(0, 0.42fr);
  border-right: 0;
}

.silence-viioko__page--sample-materials {
  padding-right: 6.1%;
}

.silence-viioko__page--sample-tertiary {
  --silence-viioko-page-clip-right: var(--silence-viioko-third-right-clip);
  display: grid;
  grid-column: 5 / 6;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--silence-viioko-panel-gap);
  padding:
    var(--silence-viioko-content-top-length)
    max(11%, var(--silence-viioko-page-safe-x))
    var(--silence-viioko-content-bottom-length)
    max(7%, var(--silence-viioko-page-safe-x));
}

.silence-viioko__sheet--sample-full .silence-viioko__page--sample-profile {
  --silence-viioko-page-clip-left: var(--silence-viioko-frame-left);
  --silence-viioko-page-clip-right: var(--silence-viioko-frame-right);
}

.silence-viioko__sheet--sample-two-one .silence-viioko__page--sample-profile {
  --silence-viioko-page-clip-left: var(--silence-viioko-material-right-clip);
}

.silence-viioko__sheet--sample-two-one .silence-viioko__page--sample-materials {
  --silence-viioko-page-clip-right: var(--silence-viioko-third-right-clip);
}

.silence-viioko__sheet--sample-thirds .silence-viioko__page--sample-materials {
  --silence-viioko-page-clip-left: 0%;
  --silence-viioko-page-clip-right: 0%;
}

.silence-viioko__page > * {
  min-height: 0;
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
  gap: var(--silence-viioko-panel-gap);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  overflow: clip;
}

.silence-viioko__layout > * {
  min-width: 0;
}

.silence-viioko__layout--one-two:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child),
.silence-viioko__layout--two-one:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child),
.silence-viioko__layout--thirds:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child) {
  position: relative;
}

.silence-viioko__layout--one-two:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child)::before,
.silence-viioko__layout--two-one:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child)::before,
.silence-viioko__layout--thirds:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child)::before {
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

.silence-viioko__layout--framed {
  gap: 0;
  background: transparent;
}

.silence-viioko__layout--framed > * {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  overflow: clip;
  padding: var(--silence-viioko-cell-padding);
}

.silence-viioko__layout--framed.silence-viioko__layout--one-two > :not(:first-child),
.silence-viioko__layout--framed.silence-viioko__layout--two-one > :not(:first-child),
.silence-viioko__layout--framed.silence-viioko__layout--thirds > :not(:first-child) {
  border-left: 1px solid var(--silence-viioko-frame-line-color);
}

.silence-viioko__layout--framed > .silence-viioko__portrait-card {
  padding: 0;
  border: 0;
  background: transparent;
}

.silence-viioko__layout--framed.silence-viioko__detail-strip article {
  padding-top: var(--silence-viioko-cell-safe-y);
  border-top: 0;
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
  padding: calc(var(--silence-viioko-cell-safe-y) * 0.6) var(--silence-viioko-cell-safe-x);
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
  padding: var(--silence-viioko-cell-padding);
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
  gap: var(--silence-viioko-panel-gap);
  align-self: end;
}

.silence-viioko__detail-strip article {
  min-width: 0;
  padding-top: var(--silence-viioko-cell-safe-y);
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

.silence-viioko__layout--framed .silence-viioko__sample-copy {
  display: grid;
  align-content: start;
  padding: var(--silence-viioko-cell-padding);
  border-left: 0;
}

.silence-viioko__layout--framed.silence-viioko__layout--one-two > .silence-viioko__sample-copy:not(:first-child),
.silence-viioko__layout--framed.silence-viioko__layout--two-one > .silence-viioko__sample-copy:not(:first-child),
.silence-viioko__layout--framed.silence-viioko__layout--thirds > .silence-viioko__sample-copy:not(:first-child) {
  border-left: 1px solid var(--silence-viioko-frame-line-color);
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
  gap: var(--silence-viioko-panel-gap);
  overflow: hidden;
  overflow: clip;
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
  gap: var(--silence-viioko-panel-gap);
  min-height: 0;
  overflow: hidden;
  overflow: clip;
}

.silence-viioko__material-list article {
  min-width: 0;
  padding: var(--silence-viioko-cell-padding);
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
  gap: var(--silence-viioko-panel-gap);
  min-height: 0;
  overflow: hidden;
  overflow: clip;
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
  gap: var(--silence-viioko-panel-gap);
  overflow: hidden;
  overflow: clip;
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
  padding: calc(var(--silence-viioko-cell-safe-y) * 0.6) var(--silence-viioko-cell-safe-x);
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
  gap: var(--silence-viioko-panel-gap);
  overflow: hidden;
  overflow: clip;
}

.silence-viioko__sample-notes article {
  min-width: 0;
  padding: var(--silence-viioko-cell-padding);
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
  right: max(3.6%, 34px);
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
    --silence-viioko-frame-left: 18px;
    --silence-viioko-frame-right: 18px;
    --silence-viioko-frame-top: 22px;
    --silence-viioko-frame-bottom: 22px;
    --silence-viioko-frame-line-color: rgba(35, 28, 42, 0.12);
    --silence-viioko-frame-line-strong-color: rgba(35, 28, 42, 0.14);
    --silence-viioko-sheet-stack-overlap: calc(var(--silence-viioko-frame-bottom) + 1px);
    --silence-viioko-line-horizontal-bottom: calc(100% - var(--silence-viioko-frame-bottom) - 1px);
    --silence-viioko-frame-right-line: calc(100% - var(--silence-viioko-frame-right) - 1px);
    --silence-viioko-corner-diagonal-size: 160px;
    --silence-viioko-corner-diagonal-offset: 80px;
    width: 100%;
    aspect-ratio: auto;
    grid-template-columns: 1fr;
    background: transparent;
  }

  .silence-viioko__sheet--sample::after {
    content: '';
  }

  .silence-viioko__debug-boundaries {
    display: none;
  }

  .silence-viioko__cutouts {
    display: none;
  }

  .silence-viioko__sheet::before {
    position: absolute;
    inset: 0;
    z-index: 3;
    background:
      linear-gradient(var(--silence-viioko-frame-line-strong-color), var(--silence-viioko-frame-line-strong-color)) 0 var(--silence-viioko-frame-top) / 100% 1px no-repeat,
      linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) 0 var(--silence-viioko-line-horizontal-bottom) / 100% 1px no-repeat,
      linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-left) 0 / 1px 100% no-repeat,
      linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-right-line) 0 / 1px 100% no-repeat;
    content: '';
    pointer-events: none;
  }

  .silence-viioko__sheet--sample::before {
    position: absolute;
    inset: 0;
    z-index: 3;
    background:
      linear-gradient(var(--silence-viioko-frame-line-strong-color), var(--silence-viioko-frame-line-strong-color)) 0 var(--silence-viioko-frame-top) / 100% 1px no-repeat,
      linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) 0 var(--silence-viioko-line-horizontal-bottom) / 100% 1px no-repeat,
      linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-left) 0 / 1px 100% no-repeat,
      linear-gradient(var(--silence-viioko-frame-line-color), var(--silence-viioko-frame-line-color)) var(--silence-viioko-frame-right-line) 0 / 1px 100% no-repeat;
    content: '';
    pointer-events: none;
  }

  .silence-viioko__page--profile,
  .silence-viioko__page--materials,
  .silence-viioko__page--sample-tertiary {
    grid-column: auto;
    padding:
      calc(var(--silence-viioko-frame-top) + var(--silence-viioko-cell-safe-y))
      calc(var(--silence-viioko-frame-right) + var(--silence-viioko-cell-safe-x))
      calc(var(--silence-viioko-frame-bottom) + var(--silence-viioko-cell-safe-y))
      calc(var(--silence-viioko-frame-left) + var(--silence-viioko-cell-safe-x));
    clip-path: none;
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

  .silence-viioko__layout--one-two:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child)::before,
  .silence-viioko__layout--two-one:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child)::before,
  .silence-viioko__layout--thirds:not(.silence-viioko__facts):not(.silence-viioko__layout--framed) > :not(:first-child)::before {
    top: -6.5px;
    right: 0;
    bottom: auto;
    left: 0;
    width: auto;
    height: 1px;
  }

  .silence-viioko__layout--framed.silence-viioko__layout--one-two > :not(:first-child),
  .silence-viioko__layout--framed.silence-viioko__layout--two-one > :not(:first-child),
  .silence-viioko__layout--framed.silence-viioko__layout--thirds > :not(:first-child) {
    border-top: 1px solid var(--silence-viioko-frame-line-color);
    border-left: 0;
  }

  .silence-viioko__layout--framed.silence-viioko__layout--one-two > .silence-viioko__sample-copy:not(:first-child),
  .silence-viioko__layout--framed.silence-viioko__layout--two-one > .silence-viioko__sample-copy:not(:first-child),
  .silence-viioko__layout--framed.silence-viioko__layout--thirds > .silence-viioko__sample-copy:not(:first-child) {
    border-top: 1px solid var(--silence-viioko-frame-line-color);
    border-left: 0;
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
  .silence-viioko__page--materials,
  .silence-viioko__page--sample-tertiary {
    padding:
      calc(var(--silence-viioko-frame-top) + var(--silence-viioko-cell-safe-y))
      calc(var(--silence-viioko-frame-right) + var(--silence-viioko-cell-safe-x))
      calc(var(--silence-viioko-frame-bottom) + var(--silence-viioko-cell-safe-y))
      calc(var(--silence-viioko-frame-left) + var(--silence-viioko-cell-safe-x));
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
