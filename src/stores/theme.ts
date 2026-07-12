import { ref } from 'vue'

export type ThemeMode = 'day' | 'night'

const THEME_KEY = 'ns-theme-mode'

const current = ref<ThemeMode>(loadThemeMode())
let isStorageSyncReady = false

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'day' || value === 'night'
}

function loadThemeMode(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY)
  if (isThemeMode(saved)) {
    return saved
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode === 'night' ? 'dark' : 'light'
}

function initThemeMode() {
  applyThemeMode(current.value)
  initStorageSync()
}

function initStorageSync() {
  if (isStorageSyncReady) {
    return
  }

  isStorageSyncReady = true
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_KEY || !isThemeMode(event.newValue)) {
      return
    }

    current.value = event.newValue
    applyThemeMode(event.newValue)
  })
}

function setThemeMode(mode: ThemeMode) {
  current.value = mode
  localStorage.setItem(THEME_KEY, mode)
  applyThemeMode(mode)
}

export function useTheme() {
  return { current, initThemeMode, setThemeMode }
}
