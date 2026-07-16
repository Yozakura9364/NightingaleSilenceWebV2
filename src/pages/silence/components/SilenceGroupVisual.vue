<template>
  <div
    class="silence-group-stage__visual"
    :class="`silence-group-stage__visual--${groupId}`"
    :aria-label="groupTitle"
  >
    <div
      ref="compositionRef"
      class="silence-group-stage__composition"
      :class="[
        `silence-group-stage__composition--${groupId}`,
        {
          'silence-group-stage__composition--previewing': groupId === 'angel' && previewedId
        }
      ]"
      @mouseleave="clearPointerPreview"
    >
      <div v-if="groupId === 'angel'" class="silence-group-stage__shadow-layer" aria-hidden="true">
        <template v-for="item in items" :key="`shadow-${item.id}`">
          <span
            v-if="item.portraitSrc"
            class="silence-group-stage__shadow"
            :class="{
              'silence-group-stage__shadow--ready': isPortraitReady(item),
              'silence-group-stage__shadow--previewed': previewedId === item.id,
              'silence-group-stage__shadow--dimmed': previewedId && previewedId !== item.id
            }"
            :style="getCharacterShadowStyle(item)"
          ></span>
        </template>
      </div>

      <button
        v-for="item in items"
        :key="item.id"
        class="silence-group-stage__character"
        :class="[
          `silence-group-stage__character--${groupId}`,
          `silence-group-stage__character--${groupId}-${item.slot}`,
          {
            'silence-group-stage__character--active': selectedId === item.id,
            'silence-group-stage__character--portrait-ready': isPortraitReady(item),
            'silence-group-stage__character--previewed': previewedId === item.id,
            'silence-group-stage__character--dimmed': previewedId && previewedId !== item.id
          }
        ]"
        :style="getCharacterStyle(item)"
        type="button"
        :aria-label="getSlotLabel(item)"
        :aria-pressed="selectedId === item.id"
        @click="handleVisualClick(item)"
        @focus="handleVisualFocus(item)"
        @blur="handleVisualBlur"
        @mouseenter="handleVisualEnter(item)"
        @keydown.enter.prevent="emit('open', item)"
        @keydown.space.prevent="emit('open', item)"
        @keydown.left.prevent="emit('previous')"
        @keydown.right.prevent="emit('next')"
      >
        <template v-if="groupId === 'angel'">
          <span class="silence-group-stage__hit-target" aria-hidden="true"></span>
          <img
            v-if="item.portraitSrc"
            :key="getPortraitAnimationKey(item)"
            class="silence-group-stage__portrait"
            :src="item.portraitSrc"
            alt=""
            decoding="async"
            @load="handlePortraitLoad($event, item)"
          />
          <template v-else>
            <span class="silence-group-stage__figure-head"></span>
            <span class="silence-group-stage__figure-body"></span>
          </template>
          <span
            class="silence-group-stage__nameplate"
            :class="`silence-group-stage__nameplate--${item.stageLabelSide ?? 'right'}`"
            aria-hidden="true"
          >
            <strong>{{ item.name }}</strong>
            <small v-if="item.secondaryName">{{ item.secondaryName }}</small>
            <i></i>
          </span>
        </template>
        <template v-else>
          <img
            v-if="item.portraitSrc"
            class="silence-group-stage__glitch-portrait"
            :src="item.portraitSrc"
            alt=""
            decoding="async"
          />
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SilenceCharacter, SilenceGroupId } from '@/data/silence/characters'

interface SilenceGroupVisualItem {
  id: string
  name: string
  reading?: string
  color?: string
  signal?: string
  slot: number
  character?: SilenceCharacter
  portraitSrc?: string
  stageLeft?: string
  stageHeight?: string
  stageAspectRatio?: string
  stageZIndex?: number
  stageShadowColor?: string
  secondaryName?: string
  stageLabelSide?: 'left' | 'right'
  stageLabelTop?: string
  stageFocusShift?: string
}

const props = defineProps<{
  groupId: SilenceGroupId
  groupTitle: string
  items: SilenceGroupVisualItem[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  open: [item: SilenceGroupVisualItem]
  previous: []
  next: []
}>()

const loadedPortraitKeys = ref<Record<string, true>>({})
const compositionRef = ref<HTMLElement | null>(null)
const hoveredId = ref('')
const focusedId = ref('')
const previewedId = computed(() => hoveredId.value || focusedId.value)

watch(
  () => props.items.map((item) => getPortraitAnimationKey(item)).join('|'),
  () => {
    loadedPortraitKeys.value = {}
  },
  { immediate: true }
)

function handleVisualClick(item: SilenceGroupVisualItem) {
  emit('select', item.id)
  emit('open', item)
}

function handleVisualEnter(item: SilenceGroupVisualItem) {
  hoveredId.value = item.id
  emit('select', item.id)
}

function clearPointerPreview() {
  hoveredId.value = ''
}

function handleVisualFocus(item: SilenceGroupVisualItem) {
  focusedId.value = item.id
  emit('select', item.id)
}

function handleVisualBlur(event: FocusEvent) {
  const nextTarget = event.relatedTarget

  if (!(nextTarget instanceof Node) || !compositionRef.value?.contains(nextTarget)) {
    focusedId.value = ''
  }
}

function getSlotLabel(item: SilenceGroupVisualItem) {
  return [props.groupTitle, item.name, item.reading, item.slot].filter(Boolean).join(' ')
}

function getCharacterStyle(item: SilenceGroupVisualItem) {
  return {
    '--silence-glitch-window-accent': item.color,
    '--silence-angel-left': item.stageLeft,
    '--silence-angel-height': item.stageHeight,
    '--silence-angel-aspect-ratio': item.stageAspectRatio,
    '--silence-angel-z-index': item.stageZIndex,
    '--silence-angel-label-top': item.stageLabelTop,
    '--silence-angel-focus-shift': item.stageFocusShift
  }
}

const portraitRiseDelays: Record<number, string> = {
  1: '0.04s',
  2: '0.14s',
  3: '0.22s',
  4: '0.1s',
  5: '0.28s',
  6: '0.18s'
}

function getCharacterShadowStyle(item: SilenceGroupVisualItem) {
  const maskImage = item.portraitSrc ? `url("${item.portraitSrc}")` : undefined

  return {
    '--silence-angel-left': item.stageLeft,
    '--silence-angel-height': item.stageHeight,
    '--silence-angel-aspect-ratio': item.stageAspectRatio,
    '--silence-angel-shadow-color': item.stageShadowColor,
    '--silence-angel-focus-shift': item.stageFocusShift,
    '--silence-group-rise-delay': portraitRiseDelays[item.slot],
    zIndex: item.stageZIndex,
    maskImage,
    WebkitMaskImage: maskImage
  }
}

function getPortraitAnimationKey(item: SilenceGroupVisualItem) {
  return item.portraitSrc ? `${item.id}-${item.portraitSrc}` : item.id
}

function isPortraitReady(item: SilenceGroupVisualItem) {
  return Boolean(loadedPortraitKeys.value[getPortraitAnimationKey(item)])
}

async function handlePortraitLoad(event: Event, item: SilenceGroupVisualItem) {
  const image = event.currentTarget

  if (!(image instanceof HTMLImageElement)) {
    return
  }

  try {
    await image.decode()
  } catch {
    // The load event is still enough to avoid the initial flash if decode() is unavailable.
  }

  loadedPortraitKeys.value = {
    ...loadedPortraitKeys.value,
    [getPortraitAnimationKey(item)]: true
  }
}
</script>

<style scoped>
.silence-group-stage__visual {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
}

.silence-group-stage__composition {
  position: absolute;
}

.silence-group-stage__composition--angel {
  bottom: 0;
  left: 50%;
  isolation: isolate;
  width: auto;
  height: min(100%, 56.25vw);
  aspect-ratio: 16 / 9;
  background: #e8f0fb;
  transform: translateX(-50%);
}

.silence-group-stage__composition--angel::before,
.silence-group-stage__composition--angel::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  pointer-events: none;
  transform: translateY(-104%);
  will-change: transform;
}

.silence-group-stage__composition--angel::before {
  background: #550101;
  clip-path: polygon(29% 0, 52% 0, 39% 100%, 16% 100%);
  animation: silenceAngelBandEnter 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.silence-group-stage__composition--angel::after {
  background: #000000;
  clip-path: polygon(52% 0, 76% 0, 63% 100%, 39% 100%);
  animation: silenceAngelBandEnter 0.48s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
}

.silence-group-stage__composition--glitch {
  inset: 0;
}

.silence-group-stage__shadow-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.silence-group-stage__shadow {
  position: absolute;
  bottom: 0;
  left: calc(var(--silence-angel-left, 50%) + 1.1%);
  width: auto;
  height: var(--silence-angel-height, 80%);
  aspect-ratio: var(--silence-angel-aspect-ratio, 1 / 2);
  background: var(--silence-angel-shadow-color, #000000);
  opacity: 0;
  transform: translate(-50%, 12%);
  transform-origin: bottom center;
  mask-position: center bottom;
  mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-position: center bottom;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  translate: 0 0;
  transition:
    translate 260ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 220ms ease;
}

.silence-group-stage__shadow--ready {
  animation: silenceAngelShadowRise 2.28s cubic-bezier(0.16, 1, 0.24, 1)
    calc(0.58s + var(--silence-group-rise-delay, 0s)) both;
}

.silence-group-stage__shadow--previewed {
  filter: opacity(1);
  translate: var(--silence-angel-focus-shift, 0) 0;
}

.silence-group-stage__shadow--dimmed {
  filter: opacity(0.1);
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
  transition:
    opacity 220ms ease,
    filter var(--ns-transition),
    transform var(--ns-transition);
}

.silence-group-stage__character:hover,
.silence-group-stage__character:focus-visible,
.silence-group-stage__character--active {
  z-index: var(--silence-character-active-z-index, 5);
}

.silence-group-stage__character:focus-visible {
  box-shadow: 0 0 0 4px rgba(99, 217, 220, 0.36);
}

.silence-group-stage__figure-head,
.silence-group-stage__figure-body {
  display: block;
  border: 2px solid rgba(42, 33, 56, 0.52);
  background: transparent;
}

.silence-group-stage__figure-head {
  width: 34%;
  aspect-ratio: 1;
  margin: 0 auto -2px;
}

.silence-group-stage__figure-body {
  width: 100%;
  height: 100%;
}

.silence-group-stage__character--angel {
  --silence-character-active-z-index: 20;

  bottom: 0;
  left: var(--silence-angel-left, 50%);
  z-index: var(--silence-angel-z-index, 2);
  width: auto;
  height: var(--silence-angel-height, 80%);
  aspect-ratio: var(--silence-angel-aspect-ratio, 1 / 2);
  overflow: visible;
  pointer-events: none;
  transform: translateX(-50%);
  transform-origin: bottom center;
}

.silence-group-stage__hit-target {
  position: absolute;
  inset: 0;
  z-index: 4;
  clip-path: polygon(34% 0, 66% 0, 80% 25%, 90% 55%, 100% 100%, 0 100%, 10% 55%, 20% 25%);
  cursor: pointer;
  pointer-events: auto;
}

.silence-group-stage__character--angel.silence-group-stage__character--active {
  z-index: var(--silence-angel-z-index, 2);
}

.silence-group-stage__character--angel.silence-group-stage__character--previewed,
.silence-group-stage__character--angel:focus-visible {
  z-index: var(--silence-character-active-z-index, 20);
}

.silence-group-stage__character--angel.silence-group-stage__character--previewed {
  opacity: 1;
  filter: saturate(1.04) brightness(1.02);
}

.silence-group-stage__character--angel.silence-group-stage__character--dimmed {
  opacity: 0.25;
  filter: saturate(0.3) brightness(0.9);
}

.silence-group-stage__nameplate {
  position: absolute;
  top: var(--silence-angel-label-top, 42%);
  z-index: 3;
  display: grid;
  min-width: 240px;
  gap: 5px;
  color: #ffffff;
  font-family: var(--ns-font-sans);
  line-height: 1;
  opacity: 0;
  pointer-events: none;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.72);
  visibility: hidden;
  transition:
    opacity 180ms ease,
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 240ms;
}

.silence-group-stage__nameplate--right {
  left: calc(100% + 34px);
  justify-items: start;
  text-align: left;
  transform: translateX(-14px);
}

.silence-group-stage__nameplate--left {
  right: calc(100% + 34px);
  justify-items: end;
  text-align: right;
  transform: translateX(14px);
}

.silence-group-stage__character--previewed .silence-group-stage__nameplate {
  opacity: 1;
  transform: translateX(0);
  visibility: visible;
  transition-delay: 80ms, 80ms, 0s;
}

.silence-group-stage__nameplate strong,
.silence-group-stage__nameplate small {
  display: block;
  max-width: 320px;
  overflow-wrap: anywhere;
}

.silence-group-stage__nameplate strong {
  font-size: 28px;
  font-style: italic;
  font-weight: 900;
  text-transform: uppercase;
}

.silence-group-stage__nameplate small {
  font-size: 15px;
  font-weight: 800;
}

.silence-group-stage__nameplate i {
  display: block;
  width: 72px;
  height: 3px;
  margin-top: 3px;
  background: currentColor;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.52);
}

.silence-group-stage__character--angel-1 {
  --silence-group-rise-delay: 0.04s;
}

.silence-group-stage__character--angel-2 {
  --silence-group-rise-delay: 0.14s;
}

.silence-group-stage__character--angel-3 {
  --silence-group-rise-delay: 0.22s;
}

.silence-group-stage__character--angel-4 {
  --silence-group-rise-delay: 0.1s;
}

.silence-group-stage__character--angel-5 {
  --silence-group-rise-delay: 0.28s;
}

.silence-group-stage__character--angel-6 {
  --silence-group-rise-delay: 0.18s;
}

.silence-group-stage__portrait {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  object-fit: contain;
  object-position: bottom center;
  transform: translateY(12%);
  transform-origin: bottom center;
  translate: 0 0;
  transition: translate 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.silence-group-stage__character--portrait-ready .silence-group-stage__portrait {
  animation: silenceGroupPortraitRise 2.28s cubic-bezier(0.16, 1, 0.24, 1)
    calc(0.58s + var(--silence-group-rise-delay, 0s)) both;
}

.silence-group-stage__character--previewed .silence-group-stage__portrait {
  translate: var(--silence-angel-focus-shift, 0) 0;
}

.silence-group-stage__visual--glitch::after {
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
  width: clamp(360px, 42vw, 650px);
  height: min(74vh, 710px);
  overflow: visible;
  transition:
    transform 180ms ease,
    filter 180ms ease;
}

.silence-group-stage__character--glitch-1 {
  bottom: 0;
  left: 7%;
}

.silence-group-stage__character--glitch-2 {
  right: 4%;
  bottom: 0;
  width: clamp(300px, 38vw, 600px);
  height: min(75vh, 720px);
}

.silence-group-stage__glitch-portrait {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  opacity: 1;
  image-rendering: pixelated;
}

.silence-group-stage__character--glitch:hover,
.silence-group-stage__character--glitch:focus-visible,
.silence-group-stage__character--glitch.silence-group-stage__character--active {
  filter: brightness(1.08) saturate(1.08)
    drop-shadow(4px 0 0 rgba(240, 128, 189, 0.34))
    drop-shadow(-4px 0 0 rgba(119, 255, 244, 0.3));
  transform: translateY(-12px) scale(1.015);
}

@keyframes silenceGroupPortraitRise {
  0% {
    opacity: 0;
    transform: translateY(12%);
  }

  42% {
    opacity: 0.52;
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes silenceAngelBandEnter {
  from {
    transform: translateY(-104%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes silenceAngelShadowRise {
  0% {
    opacity: 0;
    transform: translate(-50%, 12%);
  }

  42% {
    opacity: 0.52;
  }

  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .silence-group-stage__composition--angel::before,
  .silence-group-stage__composition--angel::after,
  .silence-group-stage__shadow--ready,
  .silence-group-stage__portrait {
    animation: none;
  }

  .silence-group-stage__composition--angel::before,
  .silence-group-stage__composition--angel::after {
    transform: translateY(0);
  }

  .silence-group-stage__shadow--ready {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  .silence-group-stage__portrait {
    opacity: 1;
    transform: translateY(0);
    translate: var(--silence-angel-focus-shift, 0) 0;
  }

  .silence-group-stage__character,
  .silence-group-stage__nameplate,
  .silence-group-stage__shadow {
    transition: none;
  }
}

@media (max-width: 1200px) {
  .silence-group-stage__nameplate {
    min-width: 160px;
  }

  .silence-group-stage__nameplate--right {
    left: calc(100% + 18px);
  }

  .silence-group-stage__nameplate--left {
    right: calc(100% + 18px);
  }

  .silence-group-stage__nameplate strong {
    font-size: 20px;
  }

  .silence-group-stage__nameplate small {
    font-size: 13px;
  }

  .silence-group-stage__nameplate i {
    width: 48px;
    height: 2px;
  }
}

@media (max-width: 920px) {
  .silence-group-stage__character--glitch {
    width: clamp(220px, 62vw, 360px);
    height: min(62vh, 540px);
    top: auto;
    bottom: 0;
  }

  .silence-group-stage__character--glitch-1 {
    left: -7%;
  }

  .silence-group-stage__character--glitch-2 {
    right: -9%;
    width: clamp(190px, 54vw, 320px);
    height: min(52vh, 460px);
  }
}

</style>
