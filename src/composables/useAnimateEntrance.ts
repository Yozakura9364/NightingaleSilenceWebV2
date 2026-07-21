import { onBeforeUnmount, watch, type Ref } from 'vue'

export interface AnimateEntranceOptions {
  /** Intersection ratio threshold (0-1). Default 0.15 */
  threshold?: number
  /** Root margin. Default '0px' */
  rootMargin?: string
  /** Only trigger once. Default true */
  triggerOnce?: boolean
  /** Additional class to add when visible. Default 'ns-animate-visible' */
  visibleClass?: string
}

/**
 * Observes an element and adds `visibleClass` when it enters the viewport.
 * Designed to work with the `.ns-animate` CSS utility classes.
 *
 * @example
 * ```vue
 * <div ref="elRef" class="ns-animate ns-animate--fade-in-up">
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
    visibleClass = 'ns-animate-visible'
  } = options

  let observer: IntersectionObserver | null = null
  let hasTriggered = false

  function observe(el: Element) {
    if (hasTriggered) return

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add(visibleClass)
      hasTriggered = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass)
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

  function disconnect() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  // Watch for the ref to be populated after mount
  watch(target, (el) => {
    if (el) observe(el)
  })

  onBeforeUnmount(() => {
    disconnect()
  })

  return { observe: () => target.value && observe(target.value), disconnect }
}
