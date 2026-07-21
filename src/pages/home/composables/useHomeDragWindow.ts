import { ref, type CSSProperties } from 'vue'

type HomeWindowLayer = 'day' | 'night'
export type DayWindowId = 'main' | 'links' | 'portrait'
export type NightWindowId = 'status' | 'dialogue' | 'chat' | 'assets' | 'control'
export type HomeWindowKey = `day:${DayWindowId}` | `night:${NightWindowId}`

interface HomeWindowPosition {
  x: number
  y: number
  zIndex: number
}

interface HomeWindowDragState {
  key: HomeWindowKey
  pointerId: number
  startClientX: number
  startClientY: number
  originX: number
  originY: number
  windowElement: HTMLElement
  barElement: HTMLElement
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function useHomeDragWindow() {
  const homeWindowPositions = ref<Partial<Record<HomeWindowKey, HomeWindowPosition>>>({})
  const draggedHomeWindowKey = ref<HomeWindowKey | null>(null)
  const hiddenDayWindowIds = ref<DayWindowId[]>([])
  const hiddenNightWindowIds = ref<NightWindowId[]>([])

  const dayWindowRespawnTimers = new Map<DayWindowId, number>()
  const nightWindowRespawnTimers = new Map<NightWindowId, number>()

  let homeWindowTopZIndex = 20
  let activeHomeWindowDrag: HomeWindowDragState | null = null

  function randomHomeDelay(min: number, max: number) {
    return Math.round(min + Math.random() * (max - min))
  }

  function homeWindowKey(layer: HomeWindowLayer, id: DayWindowId | NightWindowId): HomeWindowKey {
    return `${layer}:${id}` as HomeWindowKey
  }

  function parseHomeWindowKey(value: string | undefined): HomeWindowKey | null {
    if (!value) return null
    const [layer, id] = value.split(':')
    const isDayWindow = layer === 'day' && ['main', 'links', 'portrait'].includes(id)
    const isNightWindow = layer === 'night' && ['status', 'dialogue', 'chat', 'assets', 'control'].includes(id)
    return isDayWindow || isNightWindow ? (value as HomeWindowKey) : null
  }

  function homeWindowStyle(layer: HomeWindowLayer, id: DayWindowId | NightWindowId): CSSProperties {
    const position = homeWindowPositions.value[homeWindowKey(layer, id)]
    return {
      '--home-window-offset-x': `${position?.x ?? 0}px`,
      '--home-window-offset-y': `${position?.y ?? 0}px`,
      zIndex: position?.zIndex
    } as CSSProperties
  }

  function canDragHomeWindows() {
    return window.innerWidth > 720
  }

  function handleHomeWindowPointerDown(event: PointerEvent) {
    if (event.button !== 0 || !canDragHomeWindows()) return

    const target = event.target
    if (!(target instanceof Element) || target.closest('.home-window__controls')) return

    const barElement = target.closest<HTMLElement>('.home-window__bar')
    const windowElement = barElement?.closest<HTMLElement>('[data-home-window]')
    const key = parseHomeWindowKey(windowElement?.dataset.homeWindow)

    if (!barElement || !windowElement || !key) return

    const position = homeWindowPositions.value[key] ?? { x: 0, y: 0, zIndex: 0 }
    const nextPosition = { x: position.x, y: position.y, zIndex: ++homeWindowTopZIndex }
    homeWindowPositions.value = { ...homeWindowPositions.value, [key]: nextPosition }
    activeHomeWindowDrag = {
      key,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: position.y,
      windowElement,
      barElement
    }
    draggedHomeWindowKey.value = key
    barElement.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function handleHomeWindowPointerMove(event: PointerEvent): boolean {
    const drag = activeHomeWindowDrag
    const desktop = (event.currentTarget as HTMLElement | null)
    if (!drag || drag.pointerId !== event.pointerId || !desktop) return false

    const desktopRect = desktop.getBoundingClientRect()
    const windowRect = drag.windowElement.getBoundingClientRect()
    const taskbarTop = desktop.querySelector<HTMLElement>('.home-taskbar')?.getBoundingClientRect().top ?? desktopRect.bottom
    const edgePadding = 10
    const currentPosition = homeWindowPositions.value[drag.key] ?? { x: drag.originX, y: drag.originY, zIndex: homeWindowTopZIndex }
    const minX = currentPosition.x + desktopRect.left + edgePadding - windowRect.left
    const maxX = currentPosition.x + desktopRect.right - edgePadding - windowRect.right
    const minY = currentPosition.y + desktopRect.top + edgePadding - windowRect.top
    const maxY = currentPosition.y + taskbarTop - edgePadding - windowRect.bottom

    homeWindowPositions.value = {
      ...homeWindowPositions.value,
      [drag.key]: {
        x: clampNumber(drag.originX + event.clientX - drag.startClientX, minX, maxX),
        y: clampNumber(drag.originY + event.clientY - drag.startClientY, minY, maxY),
        zIndex: currentPosition.zIndex
      }
    }
    return true
  }

  function finishHomeWindowDrag(event?: PointerEvent) {
    const drag = activeHomeWindowDrag
    if (!drag || (event && drag.pointerId !== event.pointerId)) return
    if (drag.barElement.hasPointerCapture(drag.pointerId)) {
      drag.barElement.releasePointerCapture(drag.pointerId)
    }
    activeHomeWindowDrag = null
    draggedHomeWindowKey.value = null
  }

  function isDayWindowVisible(id: DayWindowId) {
    return !hiddenDayWindowIds.value.includes(id)
  }

  function isNightWindowVisible(id: NightWindowId) {
    return !hiddenNightWindowIds.value.includes(id)
  }

  function closeDayWindow(id: DayWindowId) {
    if (hiddenDayWindowIds.value.includes(id)) return
    hiddenDayWindowIds.value = [...hiddenDayWindowIds.value, id]
    const existingTimer = dayWindowRespawnTimers.get(id)
    if (existingTimer) window.clearTimeout(existingTimer)
    const timer = window.setTimeout(() => {
      dayWindowRespawnTimers.delete(id)
      hiddenDayWindowIds.value = hiddenDayWindowIds.value.filter((windowId) => windowId !== id)
    }, randomHomeDelay(5200, 12800))
    dayWindowRespawnTimers.set(id, timer)
  }

  function closeNightWindow(id: NightWindowId) {
    if (hiddenNightWindowIds.value.includes(id)) return
    hiddenNightWindowIds.value = [...hiddenNightWindowIds.value, id]
    const existingTimer = nightWindowRespawnTimers.get(id)
    if (existingTimer) window.clearTimeout(existingTimer)
    const timer = window.setTimeout(() => {
      nightWindowRespawnTimers.delete(id)
      hiddenNightWindowIds.value = hiddenNightWindowIds.value.filter((windowId) => windowId !== id)
    }, randomHomeDelay(5200, 12800))
    nightWindowRespawnTimers.set(id, timer)
  }

  function clearDayWindowRespawnTimers() {
    dayWindowRespawnTimers.forEach((timer) => window.clearTimeout(timer))
    dayWindowRespawnTimers.clear()
  }

  function clearNightWindowRespawnTimers() {
    nightWindowRespawnTimers.forEach((timer) => window.clearTimeout(timer))
    nightWindowRespawnTimers.clear()
  }

  return {
    homeWindowPositions,
    draggedHomeWindowKey,
    hiddenDayWindowIds,
    hiddenNightWindowIds,
    homeWindowStyle,
    handleHomeWindowPointerDown,
    handleHomeWindowPointerMove,
    finishHomeWindowDrag,
    isDayWindowVisible,
    isNightWindowVisible,
    closeDayWindow,
    closeNightWindow,
    clearDayWindowRespawnTimers,
    clearNightWindowRespawnTimers,
  }
}
