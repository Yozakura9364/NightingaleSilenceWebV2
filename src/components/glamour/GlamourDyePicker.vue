<template>
  <div ref="rootElement" class="glamour-dye-picker ns-glamour-item-info__dye-select">
    <button
      type="button"
      class="glamour-dye-picker__chip ns-glamour-item-info__dye-chip"
      :aria-expanded="open"
      :aria-label="ariaLabel || label"
      :title="ariaLabel || label"
      @click.stop="toggle"
    >
      <span
        class="glamour-dye-picker__dot ns-glamour-item-info__dye-dot"
        :style="{ '--glamour-dye-color': color }"
        aria-hidden="true"
      />
      <span class="glamour-dye-picker__label">{{ label }}</span>
    </button>

    <div
      v-if="open"
      class="glamour-dye-picker__panel ns-glamour-item-info__dye-panel ns-scroll-area ns-scroll-area--compact"
      @click.stop
    >
      <input
        v-model="query"
        type="search"
        class="ns-glamour-item-info__dye-search"
        autocomplete="off"
        :placeholder="searchPlaceholder"
        :aria-label="searchPlaceholder"
      />
      <p v-if="loading">{{ loadingText }}</p>
      <p v-else-if="failed">{{ errorText }}</p>
      <template v-else>
        <div v-for="group in groups" :key="group.key" class="glamour-dye-picker__group ns-glamour-item-info__dye-group">
          <b class="ns-glamour-item-info__dye-group-title">{{ group.label }}</b>
          <button
            v-for="stain in group.items"
            :key="String(stain.id)"
            type="button"
            class="ns-glamour-item-info__dye-option"
            :title="stainName(stain)"
            @click="choose(stain)"
          >
            <span
              class="ns-glamour-item-info__dye-swatch"
              :style="{ '--glamour-dye-color': String(stain.hex || 'transparent') }"
              aria-hidden="true"
            />
            {{ stainName(stain) }}
          </button>
        </div>
        <p v-if="!groups.length">{{ emptyText }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  groupGlamourStains,
  resolveLocalized,
  stainMatchesQuery
} from '@/lib/glamour/equipment'
import type { GlamourStain } from '@/lib/glamour/types'

const props = withDefaults(
  defineProps<{
    loadStains: (locale: string) => Promise<GlamourStain[]>
    locale: string
    label: string
    color: string
    searchPlaceholder: string
    loadingText: string
    errorText: string
    emptyText: string
    fallbackLocale?: string
    ariaLabel?: string
  }>(),
  { fallbackLocale: 'zh', ariaLabel: '' }
)

const emit = defineEmits<{
  select: [stain: GlamourStain]
}>()

// 跨实例染剂缓存：同一语言只请求一次。
const sharedStainLists = new Map<string, GlamourStain[]>()
const sharedStainRequests = new Map<string, Promise<GlamourStain[]>>()

const rootElement = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')
const stains = ref<GlamourStain[]>([])
const loading = ref(false)
const failed = ref(false)

const groups = computed(() =>
  groupGlamourStains(stains.value.filter((stain) => stainMatchesQuery(stain, query.value)))
)

function onDocumentPointerDown(event: PointerEvent) {
  if (!rootElement.value?.contains(event.target as Node)) {
    open.value = false
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

function detachListeners() {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
}

onBeforeUnmount(detachListeners)

async function ensureStains() {
  const locale = props.locale || 'zh'
  const cached = sharedStainLists.get(locale)
  if (cached) {
    stains.value = cached
    return
  }
  loading.value = true
  failed.value = false
  try {
    let request = sharedStainRequests.get(locale)
    if (!request) {
      request = props.loadStains(locale)
      sharedStainRequests.set(locale, request)
    }
    const result = await request
    sharedStainLists.set(locale, result)
    stains.value = result
  } catch {
    stains.value = []
    failed.value = true
  } finally {
    sharedStainRequests.delete(locale)
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    query.value = ''
    void ensureStains()
    document.addEventListener('pointerdown', onDocumentPointerDown)
    document.addEventListener('keydown', onDocumentKeydown)
  } else {
    detachListeners()
  }
}

function stainName(stain: GlamourStain): string {
  return resolveLocalized(stain.names, props.locale, props.fallbackLocale) || stain.name
}

function choose(stain: GlamourStain) {
  emit('select', stain)
  open.value = false
  detachListeners()
}
</script>

<style scoped>
.glamour-dye-picker {
  position: relative;
  flex: 0 0 auto;
  min-width: 0;
}

.glamour-dye-picker__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  max-width: min(220px, 100%);
  min-height: 26px;
  padding: 3px 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-glamour-item-info-radius);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 700 11px/1.2 var(--ns-font-ui);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.glamour-dye-picker__chip:hover,
.glamour-dye-picker__chip:focus-visible {
  border-color: var(--ns-color-accent);
  background: var(--ns-pixel-hover-surface);
  outline: 0;
}

.glamour-dye-picker__dot,
.glamour-dye-picker__panel button span {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  border: 1px solid var(--ns-color-border);
  border-radius: 2px;
  background: var(--glamour-dye-color);
}

.glamour-dye-picker__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.glamour-dye-picker__panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 4px);
  left: 0;
  display: grid;
  align-content: start;
  gap: 6px;
  width: min(280px, calc(100vw - 42px));
  max-height: 300px;
  padding: 8px;
  overflow: hidden;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-glamour-item-info-radius);
  background: var(--ns-color-surface-solid);
  box-shadow: 0 4px 16px rgba(42, 33, 56, 0.12);
}

.glamour-dye-picker__panel input {
  min-width: 0;
  height: 30px;
  padding: 3px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-glamour-item-info-radius);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 12px var(--ns-font-ui);
}

.glamour-dye-picker__panel input:focus {
  border-color: var(--ns-color-accent);
  outline: 0;
}

.glamour-dye-picker__group {
  display: grid;
  gap: 1px;
}

.glamour-dye-picker__group b {
  padding: 5px 6px 3px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.glamour-dye-picker__panel button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 28px;
  padding: 4px 6px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--ns-color-text);
  font: 12px var(--ns-font-ui);
  text-align: left;
  cursor: pointer;
}

.glamour-dye-picker__panel button:hover,
.glamour-dye-picker__panel button:focus-visible {
  border-bottom: 1px solid var(--ns-color-accent);
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent);
  outline: 0;
}

.glamour-dye-picker__panel p {
  margin: 0;
  padding: 2px 6px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

@media (max-width: 760px) {
  .glamour-dye-picker__panel {
    /* 移动端固定为屏幕底部弹层，避免 top:auto 随文档流飘走 */
    position: fixed;
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: min(340px, 55vh);
  }
}
</style>
