<template>
  <div ref="rootElement" class="glamour-search-field" @focusout="handleFocusOut">
    <div class="glamour-search-field__controls">
      <slot name="prepend" />
      <input
        type="search"
        autocomplete="off"
        :aria-label="searchLabel"
        :placeholder="placeholder"
        :value="query"
        @focus="open = true"
        @input="updateQuery"
        @keydown.esc="clearQuery"
      />
    </div>
    <div
      v-if="open && query.trim()"
      class="glamour-search-field__results ns-scroll-area ns-scroll-area--compact"
      :aria-busy="state === 'loading'"
    >
      <button
        v-for="candidate in results"
        :key="resultKey(candidate)"
        type="button"
        @click="choose(candidate)"
      >
        <img v-if="resolveIcon(candidate)" :src="resolveIcon(candidate)" alt="" loading="lazy" />
        <span>{{ resolveName(candidate) }}</span>
      </button>
      <p v-if="state === 'empty'">{{ emptyText }}</p>
      <p v-if="state === 'error'">{{ errorText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

// 最小结构化类型：glamour 与 item-card 两套 GlamourCandidate 均兼容（两侧都有索引签名）。
export interface GlamourSearchCandidate {
  key?: number | string
  name?: string
  names?: Record<string, string | undefined>
  icon?: number | string
}

const props = withDefaults(
  defineProps<{
    search: (options: {
      query: string
      locale: string
      limit: number
      signal: AbortSignal
    }) => Promise<GlamourSearchCandidate[]>
    locale: string
    placeholder: string
    searchLabel: string
    emptyText: string
    errorText: string
    resolveName: (candidate: GlamourSearchCandidate) => string
    resolveIcon: (candidate: GlamourSearchCandidate) => string
    limit?: number
  }>(),
  { limit: 12 }
)

const emit = defineEmits<{
  select: [candidate: GlamourSearchCandidate]
}>()

const rootElement = ref<HTMLElement | null>(null)
const query = ref('')
const results = ref<GlamourSearchCandidate[]>([])
const state = ref<'idle' | 'loading' | 'empty' | 'error'>('idle')
const open = ref(false)
let searchTimer: number | undefined
let searchController: AbortController | undefined

onBeforeUnmount(() => {
  if (searchTimer !== undefined) {
    window.clearTimeout(searchTimer)
  }
  searchController?.abort()
})

watch(
  () => props.locale,
  () => restart()
)

function resultKey(candidate: GlamourSearchCandidate): string {
  return String(candidate.key ?? candidate.name ?? JSON.stringify(candidate.names ?? {}))
}

function updateQuery(event: Event) {
  query.value = (event.currentTarget as HTMLInputElement).value
  scheduleSearch()
}

function scheduleSearch() {
  open.value = true
  results.value = []
  state.value = query.value.trim() ? 'loading' : 'idle'
  if (searchTimer !== undefined) {
    window.clearTimeout(searchTimer)
  }
  searchController?.abort()
  if (!query.value.trim()) {
    return
  }
  searchTimer = window.setTimeout(() => void runSearch(), 180)
}

async function runSearch() {
  const searchQuery = query.value.trim()
  if (!searchQuery) {
    return
  }
  searchController = new AbortController()
  try {
    const nextResults = await props.search({
      query: searchQuery,
      locale: props.locale,
      limit: props.limit,
      signal: searchController.signal
    })
    if (query.value.trim() !== searchQuery) {
      return
    }
    results.value = nextResults
    state.value = nextResults.length ? 'idle' : 'empty'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    if (query.value.trim() !== searchQuery) {
      return
    }
    results.value = []
    state.value = 'error'
  }
}

function choose(candidate: GlamourSearchCandidate) {
  emit('select', candidate)
  query.value = ''
  results.value = []
  state.value = 'idle'
  open.value = false
}

function clearQuery() {
  query.value = ''
  results.value = []
  state.value = 'idle'
  open.value = false
  searchController?.abort()
  if (searchTimer !== undefined) {
    window.clearTimeout(searchTimer)
  }
}

// 外部条件变化（如分类切换）时保留关键词重新搜索。
function restart() {
  scheduleSearch()
}

function handleFocusOut() {
  window.requestAnimationFrame(() => {
    if (!rootElement.value?.contains(document.activeElement)) {
      open.value = false
    }
  })
}

defineExpose({ restart, clearQuery })
</script>

<style scoped>
.glamour-search-field {
  position: relative;
  min-width: 0;
}

.glamour-search-field__controls {
  display: flex;
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
}

.glamour-search-field__controls:focus-within {
  border-color: var(--ns-color-accent);
}

.glamour-search-field__controls input {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 4px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ns-color-text);
  font: 13px var(--ns-font-ui);
}

.glamour-search-field__controls input:focus {
  outline: none;
}

.glamour-search-field__results {
  position: absolute;
  z-index: 31;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  display: grid;
  gap: 2px;
  max-height: 320px;
  padding: 6px;
  border: 1px solid var(--ns-color-border-strong);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
  box-shadow: 0 4px 16px rgba(42, 33, 56, 0.12);
}

.glamour-search-field__results button {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 3px 6px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--ns-color-text);
  font: 12px var(--ns-font-ui);
  text-align: left;
  cursor: pointer;
}

.glamour-search-field__results button:hover,
.glamour-search-field__results button:focus-visible {
  background: var(--ns-pixel-hover-surface);
}

.glamour-search-field__results img {
  width: 24px;
  height: 24px;
  border-radius: 3px;
}

.glamour-search-field__results p {
  margin: 0;
  padding: 2px 6px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}
</style>
