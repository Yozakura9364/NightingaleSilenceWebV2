import { onBeforeUnmount } from 'vue'

const HUIJI_WIKI_ITEM_URL_PREFIX = 'https://ff14.huijiwiki.com/wiki/物品:'
const LONG_PRESS_MS = 650
const LONG_PRESS_MOVE_TOLERANCE = 12

interface LongPressState {
  itemName: string
  pointerId: number
  startX: number
  startY: number
  timer: number
}

export function getArmoireHuijiWikiItemUrl(itemName: string): string {
  return `${HUIJI_WIKI_ITEM_URL_PREFIX}${encodeURIComponent(itemName.trim())}`
}

export function useArmoireItemWikiNavigation() {
  let longPressState: LongPressState | null = null

  function clearLongPress(): void {
    if (longPressState) {
      window.clearTimeout(longPressState.timer)
      longPressState = null
    }
  }

  function openItemWiki(itemName: string, target: 'new-tab' | 'current-tab'): void {
    const cleanName = itemName.trim()

    if (!cleanName) {
      return
    }

    const url = getArmoireHuijiWikiItemUrl(cleanName)

    if (target === 'new-tab') {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    window.location.assign(url)
  }

  function openItemWikiByContextMenu(itemName: string, event: MouseEvent): void {
    event.preventDefault()
    clearLongPress()
    openItemWiki(itemName, 'new-tab')
  }

  function startItemWikiLongPress(itemName: string, event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      return
    }

    clearLongPress()

    longPressState = {
      itemName,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      timer: window.setTimeout(() => {
        const state = longPressState
        longPressState = null

        if (state) {
          openItemWiki(state.itemName, 'current-tab')
        }
      }, LONG_PRESS_MS)
    }
  }

  function moveItemWikiLongPress(event: PointerEvent): void {
    if (!longPressState || longPressState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - longPressState.startX
    const deltaY = event.clientY - longPressState.startY
    const distance = Math.hypot(deltaX, deltaY)

    if (distance > LONG_PRESS_MOVE_TOLERANCE) {
      clearLongPress()
    }
  }

  onBeforeUnmount(clearLongPress)

  return {
    cancelItemWikiLongPress: clearLongPress,
    moveItemWikiLongPress,
    openItemWikiByContextMenu,
    startItemWikiLongPress
  }
}
