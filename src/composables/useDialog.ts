import { reactive, ref } from 'vue'

export type DialogMode = 'alert' | 'confirm' | 'prompt'

export interface DialogOptions {
  mode: DialogMode
  title: string
  message: string
  defaultValue?: string
}

export interface DialogState {
  visible: boolean
  mode: DialogMode
  title: string
  message: string
  value: string
  resolve: ((value: string | boolean | null) => void) | null
}

const state = reactive<DialogState>({
  visible: false,
  mode: 'alert',
  title: '',
  message: '',
  value: '',
  resolve: null
})

const defaultTitle = ref('')

export function useDialog() {
  function setDefaultTitle(title: string) {
    defaultTitle.value = title
  }

  function alert(message: string, title?: string): Promise<null> {
    return new Promise<null>((resolve) => {
      state.mode = 'alert'
      state.title = title ?? defaultTitle.value
      state.message = message
      state.value = ''
      state.resolve = () => resolve(null)
      state.visible = true
    })
  }

  function confirm(message: string, title?: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      state.mode = 'confirm'
      state.title = title ?? defaultTitle.value
      state.message = message
      state.value = ''
      state.resolve = (value) => resolve(value === true)
      state.visible = true
    })
  }

  function prompt(message: string, defaultValue?: string, title?: string): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      state.mode = 'prompt'
      state.title = title ?? defaultTitle.value
      state.message = message
      state.value = defaultValue ?? ''
      state.resolve = (value) => resolve(typeof value === 'string' ? value : null)
      state.visible = true
    })
  }

  function close(result: string | boolean | null) {
    state.visible = false
    if (state.resolve) {
      state.resolve(result)
      state.resolve = null
    }
  }

  return {
    state,
    alert,
    confirm,
    prompt,
    close,
    setDefaultTitle
  }
}
