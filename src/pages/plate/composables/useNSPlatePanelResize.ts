import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue'

const PANEL_WIDTH_STORAGE_KEY = 'nsplate.configPanelWidthPx.v1'
const DEFAULT_PANEL_WIDTH = 420
const MIN_PANEL_WIDTH = 320
const MAX_VIEWPORT_RATIO = 0.52

export function useNSPlatePanelResize() {
  const panelWidth = ref(readStoredPanelWidth())
  let stopResize: (() => void) | null = null

  const panelStyle = computed(
    () =>
      ({
        '--nsplate-panel-width': `${panelWidth.value}px`
      }) as CSSProperties
  )

  function setPanelWidth(width: number, options: { persist?: boolean } = {}) {
    panelWidth.value = clampPanelWidth(width)

    if (options.persist) {
      persistPanelWidth(panelWidth.value)
    }
  }

  function resizePanelBy(delta: number) {
    setPanelWidth(panelWidth.value + delta, { persist: true })
  }

  function startPanelResize(event: PointerEvent) {
    if (typeof window === 'undefined') {
      return
    }

    event.preventDefault()
    stopResize?.()

    const pointerId = event.pointerId
    const target = event.currentTarget as HTMLElement | null
    target?.setPointerCapture?.(pointerId)
    document.documentElement.classList.add('nsplate-is-resizing')

    const handleMove = (moveEvent: PointerEvent) => {
      setPanelWidth(window.innerWidth - moveEvent.clientX)
    }

    const handleEnd = () => {
      target?.releasePointerCapture?.(pointerId)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
      document.documentElement.classList.remove('nsplate-is-resizing')
      persistPanelWidth(panelWidth.value)
      stopResize = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)
    stopResize = handleEnd
    handleMove(event)
  }

  onBeforeUnmount(() => {
    stopResize?.()
  })

  return {
    panelStyle,
    panelWidth,
    resizePanelBy,
    startPanelResize
  }
}

function readStoredPanelWidth() {
  if (typeof window === 'undefined') {
    return DEFAULT_PANEL_WIDTH
  }

  const parsed = Number(window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY))
  return Number.isFinite(parsed) ? clampPanelWidth(parsed) : DEFAULT_PANEL_WIDTH
}

function persistPanelWidth(width: number) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(clampPanelWidth(width)))
}

function clampPanelWidth(width: number) {
  const viewportMax =
    typeof window === 'undefined'
      ? Number.POSITIVE_INFINITY
      : Math.max(MIN_PANEL_WIDTH, Math.floor(window.innerWidth * MAX_VIEWPORT_RATIO))

  return Math.round(Math.min(Math.max(width, MIN_PANEL_WIDTH), viewportMax))
}
