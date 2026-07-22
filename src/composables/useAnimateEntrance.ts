import { onBeforeUnmount, watch, type Ref } from 'vue'

export interface AnimateEntranceOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  visibleClass?: string
  /** Also apply to direct children with stagger delay */
  staggerChildren?: boolean
}

/**
 * Observes an element and applies animation when it enters the viewport.
 * Uses inline styles (not CSS classes) to avoid Vue scoped CSS cascade issues.
 *
 * @example
 * ```vue
 * <div ref="elRef" style="opacity:0">
 *   content
 * </div>
 *
 * <script setup>
 * const elRef = ref(null)
 * useAnimateEntrance(elRef)
 * </script>
 * ```
 */
export function useAnimateEntrance(
  target: Ref<Element | null | undefined>,
  options: AnimateEntranceOptions = {}
) {
  const {
    threshold = 0.15,
    rootMargin = '0px',
    triggerOnce = true,
    staggerChildren = false
  } = options

  let observer: IntersectionObserver | null = null
  let hasTriggered = false

  function animateIn(el: Element, delay = 0) {
    const htmlEl = el as HTMLElement
    htmlEl.style.opacity = '1'
    htmlEl.style.transform = 'translateY(0)'
    htmlEl.style.transition = `opacity 420ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 420ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
  }

  function observe(el: Element) {
    if (hasTriggered) return

    if (typeof IntersectionObserver === 'undefined') {
      triggerVisible(el)
      hasTriggered = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            triggerVisible(entry.target)
            hasTriggered = true
            if (triggerOnce && observer) {
              observer.disconnect()
              observer = null
            }
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
  }

  function triggerVisible(el: Element) {
    if (staggerChildren) {
      Array.from(el.children).forEach((child, i) => {
        animateIn(child, 40 + i * 60)
      })
    } else {
      animateIn(el)
    }
  }

  function disconnect() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  watch(target, (el) => {
    if (el) observe(el)
  })

  onBeforeUnmount(() => {
    disconnect()
  })

  return { observe: () => target.value && observe(target.value), disconnect }
}
