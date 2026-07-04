<template>
  <div
    class="silence-group-stage__visual"
    :class="`silence-group-stage__visual--${groupId}`"
    :aria-label="groupTitle"
  >
    <button
      v-for="item in items"
      :key="item.id"
      class="silence-group-stage__character"
      :class="[
        `silence-group-stage__character--${groupId}`,
        `silence-group-stage__character--${groupId}-${item.slot}`,
        {
          'silence-group-stage__character--active': selectedId === item.id,
          'silence-group-stage__character--portrait-ready': isPortraitReady(item)
        }
      ]"
      type="button"
      :aria-label="getSlotLabel(item)"
      :aria-pressed="selectedId === item.id"
      @click="handleVisualClick(item)"
      @focus="emit('select', item.id)"
      @mouseenter="emit('select', item.id)"
      @keydown.enter.prevent="emit('open', item)"
      @keydown.space.prevent="emit('open', item)"
      @keydown.left.prevent="emit('previous')"
      @keydown.right.prevent="emit('next')"
    >
      <template v-if="groupId === 'angel'">
        <img
          v-if="item.character?.portraitSrc"
          :key="getPortraitAnimationKey(item)"
          class="silence-group-stage__portrait"
          :src="item.character.portraitSrc"
          alt=""
          decoding="async"
          @load="handlePortraitLoad($event, item)"
        />
        <template v-else>
          <span class="silence-group-stage__figure-head"></span>
          <span class="silence-group-stage__figure-body"></span>
        </template>
      </template>
      <template v-else>
        <span class="silence-group-stage__window-bar"></span>
        <span class="silence-group-stage__window-ghost"></span>
        <span class="silence-group-stage__window-scan"></span>
      </template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SilenceCharacter, SilenceGroupId } from '@/data/silence/characters'

interface SilenceGroupVisualItem {
  id: string
  name: string
  slot: number
  character?: SilenceCharacter
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

function getSlotLabel(item: SilenceGroupVisualItem) {
  return [props.groupTitle, item.name, item.slot].filter(Boolean).join(' ')
}

function getPortraitAnimationKey(item: SilenceGroupVisualItem) {
  return item.character?.portraitSrc ? `${item.id}-${item.character.portraitSrc}` : item.id
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
  transition: bottom var(--ns-transition);
}

.silence-group-stage__character:hover,
.silence-group-stage__character:focus-visible,
.silence-group-stage__character--active {
  z-index: 5;
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
  bottom: 0;
  width: clamp(240px, 25vw, 430px);
  overflow: hidden;
  transform-origin: bottom center;
}

.silence-group-stage__character--angel-1 {
  --silence-group-rise-delay: 0.04s;

  left: -4%;
  z-index: 2;
  height: 82vh;
}

.silence-group-stage__character--angel-2 {
  --silence-group-rise-delay: 0.14s;

  left: 11.5%;
  z-index: 4;
  height: 88vh;
}

.silence-group-stage__character--angel-3 {
  --silence-group-rise-delay: 0.22s;

  left: 27%;
  z-index: 3;
  height: 82vh;
}

.silence-group-stage__character--angel-4 {
  --silence-group-rise-delay: 0.1s;

  left: 42.5%;
  z-index: 5;
  height: 89vh;
}

.silence-group-stage__character--angel-5 {
  --silence-group-rise-delay: 0.28s;

  left: 58%;
  z-index: 3;
  height: 82vh;
}

.silence-group-stage__character--angel-6 {
  --silence-group-rise-delay: 0.18s;

  left: 73.5%;
  z-index: 4;
  height: 86vh;
}

.silence-group-stage__character--angel:nth-child(even) .silence-group-stage__figure-body {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(99, 217, 220, 0.2)),
    var(--ns-color-accent-soft);
}

.silence-group-stage__portrait {
  position: absolute;
  right: -17%;
  bottom: -18%;
  left: -17%;
  z-index: 1;
  display: block;
  width: auto;
  height: 100%;
  opacity: 0;
  object-fit: contain;
  object-position: bottom center;
  transform-origin: bottom center;
}

.silence-group-stage__character--portrait-ready .silence-group-stage__portrait {
  animation: silenceGroupPortraitRise 2.28s cubic-bezier(0.16, 1, 0.24, 1)
    var(--silence-group-rise-delay, 0s) both;
}

.silence-group-stage__character--angel:hover,
.silence-group-stage__character--angel:focus-visible,
.silence-group-stage__character--angel.silence-group-stage__character--active {
  bottom: 18px;
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

@keyframes silenceGroupPortraitRise {
  0% {
    bottom: -18%;
    opacity: 0;
  }

  42% {
    opacity: 0.52;
  }

  100% {
    bottom: 6%;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .silence-group-stage__portrait {
    animation: none;
  }

  .silence-group-stage__portrait {
    bottom: 6%;
    opacity: 1;
  }
}

@media (max-width: 920px) {
  .silence-group-stage__character--angel {
    bottom: 82px;
    width: clamp(118px, 31vw, 190px);
  }

  .silence-group-stage__character--angel-1 {
    left: -13%;
    height: 49vh;
  }

  .silence-group-stage__character--angel-2 {
    left: 4%;
    height: 55vh;
  }

  .silence-group-stage__character--angel-3 {
    left: 22%;
    height: 49vh;
  }

  .silence-group-stage__character--angel-4 {
    left: 40%;
    height: 56vh;
  }

  .silence-group-stage__character--angel-5 {
    left: 58%;
    height: 49vh;
  }

  .silence-group-stage__character--angel-6 {
    left: 76%;
    height: 53vh;
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
}

@media (max-width: 640px) {
  .silence-group-stage__character--angel {
    width: clamp(96px, 28vw, 142px);
  }
}
</style>
