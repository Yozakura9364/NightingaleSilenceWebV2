import { onBeforeUnmount, onMounted, ref } from 'vue'

const LONG_PRESS_MS = 650
const LONG_PRESS_MOVE_TOLERANCE = 12

export interface ArmoireItemActionTarget {
  key?: string
  itemId?: number
  name: string
  wikiItemName?: string
}

export interface ArmoireItemActionMenuState {
  itemId: number
  wikiItemName: string
  x: number
  y: number
}

interface LongPressState {
  item: ArmoireItemActionTarget
  pointerId: number
  startX: number
  startY: number
  timer: number
}

export function useArmoireItemActionMenu() {
  const itemActionMenu = ref<ArmoireItemActionMenuState | null>(null)
  let longPressState: LongPressState | null = null

  function getWikiItemName(item: ArmoireItemActionTarget): string {
    return item.wikiItemName ?? item.name
  }

  function getItemId(item: ArmoireItemActionTarget): number {
    if (Number.isInteger(item.itemId) && (item.itemId ?? 0) > 0) {
      return item.itemId ?? 0
    }

    const keyMatch = item.key?.match(/(?:^|-)(\d{2,})(?:-|$)/)
    const keyItemId = keyMatch ? Number(keyMatch[1]) : 0

    return Number.isInteger(keyItemId) && keyItemId > 0 ? keyItemId : 0
  }

  function openItemActionMenu(
    item: ArmoireItemActionTarget,
    event: MouseEvent | PointerEvent
  ): void {
    event.preventDefault()
    cancelItemActionLongPress()

    itemActionMenu.value = {
      itemId: getItemId(item),
      wikiItemName: getWikiItemName(item),
      x: event.clientX,
      y: event.clientY
    }
  }

  function closeItemActionMenu(): void {
    itemActionMenu.value = null
  }

  function closeItemActionMenuByKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      closeItemActionMenu()
    }
  }

  function startItemActionLongPress(item: ArmoireItemActionTarget, event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      return
    }

    cancelItemActionLongPress()

    longPressState = {
      item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      timer: window.setTimeout(() => {
        const state = longPressState
        longPressState = null

        if (state) {
          openItemActionMenu(state.item, event)
        }
      }, LONG_PRESS_MS)
    }
  }

  function moveItemActionLongPress(event: PointerEvent): void {
    if (!longPressState || longPressState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - longPressState.startX
    const deltaY = event.clientY - longPressState.startY

    if (Math.hypot(deltaX, deltaY) > LONG_PRESS_MOVE_TOLERANCE) {
      cancelItemActionLongPress()
    }
  }

  function cancelItemActionLongPress(): void {
    if (!longPressState) {
      return
    }

    window.clearTimeout(longPressState.timer)
    longPressState = null
  }

  onMounted(() => {
    window.addEventListener('click', closeItemActionMenu)
    window.addEventListener('scroll', closeItemActionMenu, true)
    window.addEventListener('keydown', closeItemActionMenuByKeyboard)
  })

  onBeforeUnmount(() => {
    cancelItemActionLongPress()
    window.removeEventListener('click', closeItemActionMenu)
    window.removeEventListener('scroll', closeItemActionMenu, true)
    window.removeEventListener('keydown', closeItemActionMenuByKeyboard)
  })

  return {
    itemActionMenu,
    closeItemActionMenu,
    openItemActionMenu,
    startItemActionLongPress,
    moveItemActionLongPress,
    cancelItemActionLongPress
  }
}
