import { ref } from 'vue'

export type ThemeMode = 'day' | 'night'

const THEME_KEY = 'ns-theme-mode'

const current = ref<ThemeMode>(loadThemeMode())
let isStorageSyncReady = false
let nightThemeLoaded = false

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

function ensureNightTheme() {
  if (nightThemeLoaded) return
  nightThemeLoaded = true

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = new URL('@/styles/theme-night.css', import.meta.url).href
  document.head.appendChild(link)
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode === 'night' ? 'dark' : 'light'

  if (mode === 'night') {
    ensureNightTheme()
  }
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
