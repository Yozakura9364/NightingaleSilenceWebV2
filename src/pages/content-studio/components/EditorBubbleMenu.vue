<template>
  <Teleport to="body">
    <div ref="menuEl" class="editor-bubble-menu">
      <div class="editor-bubble-menu__row">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="editor-bubble-menu__btn"
          :class="{ 'editor-bubble-menu__btn--active': item.active }"
          :aria-label="labelFor(item.id)"
          :title="labelFor(item.id)"
          @mousedown.prevent
          @click="onItemClick(item)"
        >{{ iconFor(item.id) }}</button>
      </div>
      <div v-if="linkOpen" class="editor-bubble-menu__bar">
        <input
          ref="linkInputEl"
          v-model="linkValue"
          class="editor-bubble-menu__input"
          type="text"
          :placeholder="t(contentStudioKeys.bubbleLinkPlaceholder)"
          :aria-label="labelFor('link')"
          @keydown.enter.prevent="applyLink"
          @keydown.esc.prevent="closePanels"
        />
      </div>
      <div v-if="pickerOpenFor" class="editor-bubble-menu__bar">
        <button
          v-for="opt in pickerOptions"
          :key="String(opt)"
          type="button"
          class="editor-bubble-menu__opt"
          :style="swatchStyle(opt)"
          @mousedown.prevent
          @click="applyPicker(opt)"
        >{{ optionLabel(opt) }}</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Editor } from '@tiptap/core'
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import { computeBubbleMenuItems, isBubbleEligible, type BubbleMenuItem } from '../editor/bubbleMenuModel'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'

const props = defineProps<{ editor: Editor | null }>()
const { t } = useLocale()

const PLUGIN_KEY = 'studioBubbleMenu'

const menuEl = ref<HTMLElement | null>(null)
const linkInputEl = ref<HTMLInputElement | null>(null)
const items = ref<BubbleMenuItem[]>([])
const linkOpen = ref(false)
const linkValue = ref('')
const pickerOpenFor = ref<'color' | 'size' | null>(null)
const pickerOptions = ref<(string | number)[]>([])

let registered: Editor | null = null
const cleanups: Array<() => void> = []

function labelFor(id: string): string {
  switch (id) {
    case 'bold': return t(contentStudioKeys.bold)
    case 'italic': return t(contentStudioKeys.italic)
    case 'underline': return t(contentStudioKeys.underline)
    case 'strike': return t(contentStudioKeys.strike)
    case 'code': return t(contentStudioKeys.bubbleCode)
    case 'link': return t(contentStudioKeys.bubbleLink)
    case 'color': return t(contentStudioKeys.bubbleColor)
    case 'size': return t(contentStudioKeys.bubbleSize)
    case 'align': return t(contentStudioKeys.bubbleAlign)
    default: return id
  }
}

function iconFor(id: string): string {
  switch (id) {
    case 'bold': return 'B'
    case 'italic': return 'I'
    case 'underline': return 'U'
    case 'strike': return 'S'
    case 'code': return '</>'
    case 'link': return '🔗'
    case 'color': return 'A'
    case 'size': return 'A%'
    case 'align': return '≡'
    default: return id
  }
}

function swatchStyle(opt: string | number): Record<string, string> {
  if (pickerOpenFor.value === 'color' && opt !== 'default') {
    return { background: String(opt), color: 'transparent' }
  }
  return {}
}

function optionLabel(opt: string | number): string {
  if (opt === 'default') return '✕'
  if (pickerOpenFor.value === 'size') return `${opt}%`
  return ''
}

function refresh() {
  if (!props.editor) return
  items.value = computeBubbleMenuItems(props.editor)
}

function refocus() {
  // 按钮用了 @mousedown.prevent，理论上焦点未离开编辑器；这里兜底重聚焦
  props.editor?.chain().focus().run()
}

function closePanels() {
  linkOpen.value = false
  pickerOpenFor.value = null
}

function onItemClick(item: BubbleMenuItem) {
  if (!props.editor) return
  if (item.kind === 'input') {
    linkValue.value = props.editor.getAttributes('link').href ?? ''
    linkOpen.value = true
    pickerOpenFor.value = null
    void nextTick(() => linkInputEl.value?.focus())
    return
  }
  if (item.kind === 'picker') {
    if (pickerOpenFor.value === item.id) {
      closePanels()
      return
    }
    pickerOpenFor.value = item.id as 'color' | 'size'
    pickerOptions.value = item.options ?? []
    linkOpen.value = false
    return
  }
  item.run()
  refocus()
  refresh()
}

function applyLink() {
  items.value.find((i) => i.id === 'link')?.run(linkValue.value)
  closePanels()
  refocus()
  refresh()
}

function applyPicker(opt: string | number) {
  items.value.find((i) => i.id === pickerOpenFor.value)?.run(opt)
  closePanels()
  refocus()
  refresh()
}

watch(
  () => [props.editor, menuEl.value] as const,
  () => {
    const instance = props.editor
    if (!instance || !menuEl.value || registered === instance) return
    // 只读/预览态（含窄屏只读规格）不注册插件
    if (!instance.isEditable) return
    instance.registerPlugin(
      BubbleMenuPlugin({
        pluginKey: PLUGIN_KEY,
        editor: instance,
        element: menuEl.value,
        // 完整规则：eligibility（非空选区+可编辑+非 codeBlock）+ 编辑器聚焦
        shouldShow: ({ editor }) => isBubbleEligible(editor) && editor.isFocused,
      })
    )
    registered = instance
    const onUpdate = () => refresh()
    instance.on('update', onUpdate)
    instance.on('selectionUpdate', onUpdate)
    cleanups.push(() => {
      instance.off('update', onUpdate)
      instance.off('selectionUpdate', onUpdate)
    })
    refresh()
  },
  { immediate: true, flush: 'post' }
)

onBeforeUnmount(() => {
  cleanups.forEach((fn) => fn())
  if (registered) registered.unregisterPlugin(PLUGIN_KEY)
  registered = null
})
</script>

<style>
/* 非 scoped：元素经 Teleport 挂到 body，定位由 floating-ui 内联设置 */
.editor-bubble-menu {
  z-index: 1000;
  background: var(--surface, #fff);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  padding: 4px;
}
.editor-bubble-menu__row { display: flex; gap: 2px; }
.editor-bubble-menu__btn {
  min-width: 28px;
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: inherit;
}
.editor-bubble-menu__btn:hover { background: var(--bg-hover, #eee); }
.editor-bubble-menu__btn--active { background: var(--bg-active, #d7e3ff); }
.editor-bubble-menu__bar {
  display: flex;
  gap: 4px;
  padding-top: 4px;
  margin-top: 4px;
  border-top: 1px solid var(--border-color, #e5e5e5);
}
.editor-bubble-menu__input {
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  min-width: 220px;
}
.editor-bubble-menu__opt {
  min-width: 24px;
  height: 24px;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: #fff;
}
</style>
