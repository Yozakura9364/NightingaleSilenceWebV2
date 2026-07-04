<template>
  <aside
    class="silence-glitch-duo"
    :style="panelStyle"
    :aria-label="activeMember?.reading ?? members[0]?.reading"
  >
    <div class="silence-glitch-duo__header">
      <p class="ns-eyebrow">{{ activeMember?.signal }}</p>
      <h2>{{ activeMember?.name }}</h2>
      <p>{{ activeMember?.reading }}</p>
    </div>

    <div class="silence-glitch-duo__switcher">
      <button
        v-for="member in members"
        :key="member.id"
        type="button"
        :class="{ 'silence-glitch-duo__member--active': member.id === activeMember?.id }"
        :aria-pressed="member.id === activeMember?.id"
        @click="emit('select', member.id)"
      >
        <span>{{ member.name }}</span>
        <small>{{ member.reading }}</small>
      </button>
    </div>

    <dl class="silence-glitch-duo__notes">
      <div v-for="note in conceptNotes" :key="note.id">
        <dt>{{ note.label }}</dt>
        <dd>{{ note.value }}</dd>
      </div>
    </dl>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  SilenceGlitchConceptNote,
  SilenceGlitchDuoMember
} from '@/data/silence/glitchDuo'

const props = defineProps<{
  members: SilenceGlitchDuoMember[]
  conceptNotes: SilenceGlitchConceptNote[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const activeMember = computed(
  () => props.members.find((member) => member.id === props.selectedId) ?? props.members[0]
)
const panelStyle = computed(() => ({
  '--silence-glitch-accent': activeMember.value?.color ?? '#77fff4'
}))
</script>

<style scoped>
.silence-glitch-duo {
  position: absolute;
  bottom: clamp(34px, 7vh, 76px);
  left: clamp(24px, 5vw, 72px);
  z-index: 8;
  display: grid;
  width: min(420px, 38vw);
  gap: 16px;
  padding: 18px;
  border: 2px solid rgba(248, 241, 255, 0.74);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--silence-glitch-accent), transparent 88%), transparent),
    rgba(9, 12, 24, 0.78);
  box-shadow:
    7px 7px 0 rgba(119, 255, 244, 0.18),
    -5px -5px 0 rgba(255, 65, 172, 0.1);
  color: #f8f1ff;
}

.silence-glitch-duo::before {
  position: absolute;
  inset: 8px;
  z-index: 0;
  border: 1px solid rgba(248, 241, 255, 0.18);
  content: '';
  pointer-events: none;
}

.silence-glitch-duo > * {
  position: relative;
  z-index: 1;
}

.silence-glitch-duo__header {
  display: grid;
  gap: 7px;
}

.silence-glitch-duo__header .ns-eyebrow {
  color: color-mix(in srgb, var(--silence-glitch-accent), #f8f1ff 18%);
}

.silence-glitch-duo__header h2 {
  margin: 0;
  color: #ffffff;
  font-family: var(--ns-font-display);
  font-size: clamp(34px, 4.5vw, 58px);
  font-weight: 950;
  line-height: 0.94;
  letter-spacing: 0;
  text-shadow:
    3px 0 0 rgba(255, 65, 172, 0.28),
    -3px 0 0 rgba(119, 255, 244, 0.24);
}

.silence-glitch-duo__header p {
  margin: 0;
  color: rgba(248, 241, 255, 0.76);
}

.silence-glitch-duo__switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.silence-glitch-duo__switcher button {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(248, 241, 255, 0.34);
  border-radius: 0;
  background: rgba(248, 241, 255, 0.06);
  color: #f8f1ff;
  font-family: var(--ns-font-sans);
  text-align: left;
  cursor: pointer;
}

.silence-glitch-duo__switcher button:hover,
.silence-glitch-duo__switcher button:focus-visible,
.silence-glitch-duo__switcher .silence-glitch-duo__member--active {
  outline: none;
  border-color: color-mix(in srgb, var(--silence-glitch-accent), #f8f1ff 12%);
  background: color-mix(in srgb, var(--silence-glitch-accent), transparent 84%);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.32);
}

.silence-glitch-duo__switcher span {
  overflow: hidden;
  font-size: 16px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.silence-glitch-duo__switcher small {
  overflow: hidden;
  color: rgba(248, 241, 255, 0.62);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.silence-glitch-duo__notes {
  display: grid;
  gap: 0;
  margin: 0;
  border-top: 1px solid rgba(248, 241, 255, 0.18);
}

.silence-glitch-duo__notes div {
  display: grid;
  grid-template-columns: minmax(72px, 0.3fr) minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(248, 241, 255, 0.14);
}

.silence-glitch-duo__notes div:last-child {
  border-bottom: 0;
}

.silence-glitch-duo__notes dt {
  color: color-mix(in srgb, var(--silence-glitch-accent), #f8f1ff 26%);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 800;
}

.silence-glitch-duo__notes dd {
  min-width: 0;
  margin: 0;
  color: rgba(248, 241, 255, 0.78);
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

@media (max-width: 920px) {
  .silence-glitch-duo {
    position: relative;
    bottom: auto;
    left: auto;
    width: 100%;
    margin: 520px 0 0;
  }
}

@media (max-width: 640px) {
  .silence-glitch-duo {
    margin-top: 500px;
    padding: 14px;
  }

  .silence-glitch-duo__switcher {
    grid-template-columns: 1fr;
  }

  .silence-glitch-duo__notes div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
