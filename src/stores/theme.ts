import { ref } from 'vue'

export type ThemeMode = 'day' | 'night'

const THEME_KEY = 'ns-theme-mode'

const current = ref<ThemeMode>(loadThemeMode())

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
}

function setThemeMode(mode: ThemeMode) {
  current.value = mode
  localStorage.setItem(THEME_KEY, mode)
  applyThemeMode(mode)
}

export function useTheme() {
  return { current, initThemeMode, setThemeMode }
}
