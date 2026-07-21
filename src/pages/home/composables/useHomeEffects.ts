import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '@/stores/theme'

const HOME_THEME_TRANSITION_MS = 1060

export function useHomeEffects() {
  const { current: themeMode } = useTheme()

  const isNightPortraitGlitching = ref(false)
  const isNightBackgroundGlitching = ref(false)
  const homeThemeTransition = ref<'idle' | 'to-night' | 'to-day'>('idle')

  let pointerFrame = 0
  let pointerTargetX = 0
  let pointerTargetY = 0
  let pointerCurrentX = 0
  let pointerCurrentY = 0
  let nightPortraitGlitchTimer = 0
  let nightPortraitGlitchBurstTimer = 0
  let nightPortraitGlitchRepeatTimer = 0
  let nightBackgroundGlitchTimer = 0
  let nightBackgroundGlitchBurstTimer = 0
  let nightBackgroundGlitchRepeatTimer = 0
  let homeThemeTransitionTimer = 0

  function shouldReduceHomeMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }

  function randomHomeDelay(min: number, max: number) {
    return Math.round(min + Math.random() * (max - min))
  }

  function applyHomePointerFrame() {
    const desktopEl = document.querySelector<HTMLElement>('.home-desktop')
    pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.14
    pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.14
    desktopEl?.style.setProperty('--home-pointer-x', pointerCurrentX.toFixed(3))
    desktopEl?.style.setProperty('--home-pointer-y', pointerCurrentY.toFixed(3))
    if (Math.abs(pointerTargetX - pointerCurrentX) > 0.002 || Math.abs(pointerTargetY - pointerCurrentY) > 0.002) {
      pointerFrame = window.requestAnimationFrame(applyHomePointerFrame)
      return
    }
    pointerFrame = 0
  }

  function scheduleHomePointerFrame() {
    if (pointerFrame || shouldReduceHomeMotion()) return
    pointerFrame = window.requestAnimationFrame(applyHomePointerFrame)
  }

  function handleHomePointerMove(event: PointerEvent) {
    const desktop = event.currentTarget as HTMLElement | null
    if (!desktop || shouldReduceHomeMotion()) return
    const rect = desktop.getBoundingClientRect()
    pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    scheduleHomePointerFrame()
  }

  function resetHomePointer() {
    pointerTargetX = 0
    pointerTargetY = 0
    scheduleHomePointerFrame()
  }

  function clearNightPortraitGlitchTimers() {
    if (nightPortraitGlitchTimer) { window.clearTimeout(nightPortraitGlitchTimer); nightPortraitGlitchTimer = 0 }
    if (nightPortraitGlitchBurstTimer) { window.clearTimeout(nightPortraitGlitchBurstTimer); nightPortraitGlitchBurstTimer = 0 }
    if (nightPortraitGlitchRepeatTimer) { window.clearTimeout(nightPortraitGlitchRepeatTimer); nightPortraitGlitchRepeatTimer = 0 }
  }

  function clearNightBackgroundGlitchTimers() {
    if (nightBackgroundGlitchTimer) { window.clearTimeout(nightBackgroundGlitchTimer); nightBackgroundGlitchTimer = 0 }
    if (nightBackgroundGlitchBurstTimer) { window.clearTimeout(nightBackgroundGlitchBurstTimer); nightBackgroundGlitchBurstTimer = 0 }
    if (nightBackgroundGlitchRepeatTimer) { window.clearTimeout(nightBackgroundGlitchRepeatTimer); nightBackgroundGlitchRepeatTimer = 0 }
  }

  function clearHomeThemeTransitionTimer() {
    if (homeThemeTransitionTimer) { window.clearTimeout(homeThemeTransitionTimer); homeThemeTransitionTimer = 0 }
  }

  function finishHomeThemeTransition() {
    homeThemeTransition.value = 'idle'
    homeThemeTransitionTimer = 0
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) return
    scheduleNightPortraitGlitch()
    scheduleNightBackgroundGlitch()
  }

  function startHomeThemeTransition(mode: 'day' | 'night') {
    clearHomeThemeTransitionTimer()
    clearNightPortraitGlitchTimers()
    clearNightBackgroundGlitchTimers()
    isNightPortraitGlitching.value = false
    isNightBackgroundGlitching.value = false
    homeThemeTransition.value = mode === 'night' ? 'to-night' : 'to-day'
    if (shouldReduceHomeMotion()) { finishHomeThemeTransition(); return }
    homeThemeTransitionTimer = window.setTimeout(finishHomeThemeTransition, HOME_THEME_TRANSITION_MS)
  }

  function scheduleNightPortraitGlitch() {
    clearNightPortraitGlitchTimers()
    isNightPortraitGlitching.value = false
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) return
    runNightPortraitGlitchBurst(2)
  }

  function queueNightPortraitGlitch() {
    if (nightPortraitGlitchTimer) { window.clearTimeout(nightPortraitGlitchTimer); nightPortraitGlitchTimer = 0 }
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) return
    nightPortraitGlitchTimer = window.setTimeout(() => {
      nightPortraitGlitchTimer = 0
      runNightPortraitGlitchBurst(Math.random() > 0.5 ? 2 : 1)
    }, randomHomeDelay(3600, 9200))
  }

  function runNightPortraitGlitchBurst(remainingBursts: number) {
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) { isNightPortraitGlitching.value = false; return }
    isNightPortraitGlitching.value = true
    nightPortraitGlitchBurstTimer = window.setTimeout(() => {
      isNightPortraitGlitching.value = false
      nightPortraitGlitchBurstTimer = 0
      if (remainingBursts > 1) {
        nightPortraitGlitchRepeatTimer = window.setTimeout(() => {
          nightPortraitGlitchRepeatTimer = 0
          runNightPortraitGlitchBurst(remainingBursts - 1)
        }, 220 + Math.random() * 260)
        return
      }
      queueNightPortraitGlitch()
    }, 760)
  }

  function scheduleNightBackgroundGlitch() {
    clearNightBackgroundGlitchTimers()
    isNightBackgroundGlitching.value = false
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) return
    runNightBackgroundGlitchBurst(2)
  }

  function queueNightBackgroundGlitch() {
    if (nightBackgroundGlitchTimer) { window.clearTimeout(nightBackgroundGlitchTimer); nightBackgroundGlitchTimer = 0 }
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) return
    nightBackgroundGlitchTimer = window.setTimeout(() => {
      nightBackgroundGlitchTimer = 0
      runNightBackgroundGlitchBurst(Math.random() > 0.55 ? 2 : 1)
    }, randomHomeDelay(3200, 8500))
  }

  function runNightBackgroundGlitchBurst(remainingBursts: number) {
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) { isNightBackgroundGlitching.value = false; return }
    isNightBackgroundGlitching.value = true
    nightBackgroundGlitchBurstTimer = window.setTimeout(() => {
      isNightBackgroundGlitching.value = false
      nightBackgroundGlitchBurstTimer = 0
      if (remainingBursts > 1) {
        nightBackgroundGlitchRepeatTimer = window.setTimeout(() => {
          nightBackgroundGlitchRepeatTimer = 0
          runNightBackgroundGlitchBurst(remainingBursts - 1)
        }, randomHomeDelay(180, 440))
        return
      }
      queueNightBackgroundGlitch()
    }, 620)
  }

  onMounted(() => {
    scheduleNightPortraitGlitch()
    scheduleNightBackgroundGlitch()
  })

  onBeforeUnmount(() => {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame)
    clearHomeThemeTransitionTimer()
    clearNightPortraitGlitchTimers()
    clearNightBackgroundGlitchTimers()
  })

  return {
    isNightPortraitGlitching,
    isNightBackgroundGlitching,
    homeThemeTransition,
    handleHomePointerMove,
    resetHomePointer,
    startHomeThemeTransition,
    cleanupEffects,
  }

  function cleanupEffects() {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame)
    clearHomeThemeTransitionTimer()
    clearNightPortraitGlitchTimers()
    clearNightBackgroundGlitchTimers()
  }
}
