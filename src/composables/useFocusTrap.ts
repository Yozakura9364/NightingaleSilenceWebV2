import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Focus trap composable — locks Tab/Shift+Tab cycling within a container.
 * Call from a component that renders a modal/dialog.
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, active: Ref<boolean>) {
  let previousActiveElement: Element | null = null

  function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ]
    return Array.from(
      container.querySelectorAll<HTMLElement>(selectors.join(', '))
    )
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const container = containerRef.value
    if (!container) return

    const focusable = getFocusableElements(container)
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  function trap() {
    previousActiveElement = document.activeElement
    document.addEventListener('keydown', handleKeyDown)
    // Auto-focus first focusable element
    const container = containerRef.value
    if (container) {
      const focusable = getFocusableElements(container)
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        container.setAttribute('tabindex', '-1')
        container.focus()
      }
    }
  }

  function release() {
    document.removeEventListener('keydown', handleKeyDown)
    // Return focus to the trigger element
    if (previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus()
    }
    previousActiveElement = null
  }

  onMounted(() => {
    if (active.value) trap()
  })

  onBeforeUnmount(() => {
    release()
  })

  return { trap, release }
}
