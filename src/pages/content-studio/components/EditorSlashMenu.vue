<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="ns-floating-panel editor-slash-menu"
      :style="{ left: `${position.left}px`, top: `${position.top}px` }"
      role="listbox"
    >
      <button
        v-for="(item, i) in items"
        :key="item.id"
        type="button"
        class="editor-slash-menu__item"
        :class="{ 'editor-slash-menu__item--active': i === selectedIndex }"
        role="option"
        :aria-selected="i === selectedIndex"
        @mousedown.prevent
        @click="choose(item)"
      >
        {{ t(item.labelKey) }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  registerSlashView,
  unregisterSlashView,
  type SlashView,
  type SlashViewProps,
  type SlashSuggestionItem
} from '@/lib/content/editor/slashCommandExtension'
import { useLocale } from '@/stores/locale'

const emit = defineEmits<{ 'request-media-insert': [] }>()
const { t } = useLocale()

const visible = ref(false)
const items = ref<SlashSuggestionItem[]>([])
const selectedIndex = ref(0)
const position = ref({ left: 0, top: 0 })
let current: SlashViewProps | null = null

function applyProps(props: SlashViewProps) {
  current = props
  items.value = props.items
  if (selectedIndex.value >= props.items.length) selectedIndex.value = 0
  const rect = props.clientRect?.()
  if (rect) {
    position.value = { left: rect.left, top: rect.bottom + 6 }
  }
  visible.value = props.items.length > 0
}

function choose(item: SlashSuggestionItem) {
  if (!current) return
  if (item.opensDialog) {
    emit('request-media-insert')
  } else {
    item.run(current.editor, current.range)
  }
  visible.value = false
}

const view: SlashView = {
  onStart: applyProps,
  onUpdate: applyProps,
  onKeyDown(event) {
    if (event.isComposing) return false // 双保险（扩展层已拦）
    if (!visible.value) return false
    if (event.key === 'ArrowDown') {
      selectedIndex.value = (selectedIndex.value + 1) % items.value.length
      return true
    }
    if (event.key === 'ArrowUp') {
      selectedIndex.value = (selectedIndex.value - 1 + items.value.length) % items.value.length
      return true
    }
    if (event.key === 'Enter') {
      const item = items.value[selectedIndex.value]
      if (item) choose(item)
      return true
    }
    if (event.key === 'Escape') {
      visible.value = false
      return true
    }
    return false
  },
  onExit() {
    visible.value = false
    current = null
    selectedIndex.value = 0
  }
}

onMounted(() => registerSlashView(view))
onBeforeUnmount(() => unregisterSlashView(view))
</script>

<style>
/* 非 scoped：Teleport 挂 body。外壳复用全局 .ns-floating-panel（纯白圆角浮层）。 */
.editor-slash-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
}
.editor-slash-menu__item {
  padding: 6px 10px;
  border: none;
  border-radius: var(--ns-radius-sm);
  background: transparent;
  cursor: pointer;
  font-family: var(--ns-font-ui);
  font-size: 13px;
  text-align: left;
  color: inherit;
  transition: background var(--ns-transition-fast);
}
.editor-slash-menu__item:hover,
.editor-slash-menu__item--active {
  background: var(--ns-color-surface-tint);
}
</style>
