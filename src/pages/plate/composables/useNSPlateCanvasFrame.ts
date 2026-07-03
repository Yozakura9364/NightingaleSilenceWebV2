import { computed, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue'

export interface NSPlateCanvasFrameDimensions {
  width: number
  height: number
}

export function useNSPlateCanvasFrame(dimensions: NSPlateCanvasFrameDimensions) {
  const viewportRef = ref<HTMLDivElement | null>(null)
  const frameSize = ref({ width: 0, height: 0 })
  let resizeObserver: ResizeObserver | null = null

  const frameStyle = computed<CSSProperties | undefined>(() => {
    if (frameSize.value.width <= 0 || frameSize.value.height <= 0) {
      return undefined
    }

    return {
      width: `${frameSize.value.width}px`,
      height: `${frameSize.value.height}px`
    }
  })

  onMounted(() => {
    updateFrameSize()
    observeViewport()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', updateFrameSize)
  })

  function observeViewport() {
    if (!viewportRef.value) {
      return
    }

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateFrameSize)
      return
    }

    resizeObserver = new ResizeObserver(updateFrameSize)
    resizeObserver.observe(viewportRef.value)
  }

  function updateFrameSize() {
    const viewport = viewportRef.value

    if (!viewport) {
      return
    }

    const viewportWidth = viewport.clientWidth
    const viewportHeight = viewport.clientHeight

    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return
    }

    const ratio = dimensions.width / dimensions.height
    const width = Math.floor(Math.min(viewportWidth, viewportHeight * ratio))
    const height = Math.floor(width / ratio)

    if (frameSize.value.width === width && frameSize.value.height === height) {
      return
    }

    frameSize.value = { width, height }
  }

  return {
    viewportRef,
    frameSize,
    frameStyle,
    updateFrameSize
  }
}
