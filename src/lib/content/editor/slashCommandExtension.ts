// slashCommandExtension.ts — P2: SlashCommand extension factory + view registry.
// Lib stays page-agnostic: items are injected by the caller (pages layer wires
// slashCommandModel), and the active view registers itself here (EditorSlashMenu).
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { Editor, Range } from '@tiptap/core'

export interface SlashSuggestionItem {
  id: string
  labelKey: string
  opensDialog?: boolean
  run: (editor: Editor, range: Range) => void
}

export interface SlashViewProps {
  items: SlashSuggestionItem[]
  query: string
  clientRect: (() => DOMRect | null) | null
  editor: Editor
  range: Range
}

export interface SlashView {
  onStart(props: SlashViewProps): void
  onUpdate(props: SlashViewProps): void
  onKeyDown(event: KeyboardEvent): boolean
  onExit(): void
}

let activeView: SlashView | null = null
export function registerSlashView(view: SlashView): void {
  activeView = view
}
export function unregisterSlashView(view: SlashView): void {
  if (activeView === view) activeView = null
}

export interface SlashExtensionOptions {
  items: (query: string) => SlashSuggestionItem[]
}

export function createSlashCommandExtension(options: SlashExtensionOptions) {
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '/',
          // allowedPrefixes 默认即"行首或前导空格后"，不做全文任意位置触发
          items: ({ query }) => options.items(query),
          command: ({ editor, range, props }) => {
            ;(props as SlashSuggestionItem).run(editor, range)
          },
          render: () => ({
            onStart: (props) => activeView?.onStart(props as unknown as SlashViewProps),
            onUpdate: (props) => activeView?.onUpdate(props as unknown as SlashViewProps),
            onKeyDown: (props) => {
              // IME 组合态不触发、不抢按键（中文输入防误触发）
              if (props.event.isComposing) return false
              return activeView?.onKeyDown(props.event) ?? false
            },
            onExit: () => activeView?.onExit(),
          }),
        }),
      ]
    },
  })
}
