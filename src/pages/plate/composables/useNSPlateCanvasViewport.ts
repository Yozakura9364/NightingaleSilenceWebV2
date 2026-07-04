import { computed, onBeforeUnmount, ref, watch, type CSSProperties, type Ref } from 'vue'
import type { NSPlateCanvasFrameDimensions } from '@/pages/plate/composables/useNSPlateCanvasFrame'

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const
const DEFAULT_ZOOM = 1
const POINTER_PRIMARY_BUTTON = 0

interface UseNSPlateCanvasViewportOptions {
  viewportRef: Ref<HTMLDivElement | null>
  frameSize: Ref<NSPlateCanvasFrameDimensions>
}

interface PanOffset {
  x: number
  y: number
}

export function useNSPlateCanvasViewport({
  viewportRef,
  frameSize
}: UseNSPlateCanvasViewportOptions) {
  const zoomLevel = ref(DEFAULT_ZOOM)
  const panOffset = ref<PanOffset>({ x: 0, y: 0 })
  const isDragging = ref(false)

  let activePointerId: number | null = null
  let dragStartClientX = 0
  let dragStartClientY = 0
  let dragStartOffset: PanOffset = { x: 0, y: 0 }

  const zoomPercentLabel = computed(() => `${Math.round(zoomLevel.value * 100)}%`)
  const currentZoomIndex = computed(() => getNearestZoomIndex(zoomLevel.value))
  const canZoomOut = computed(() => currentZoomIndex.value > 0)
  const canZoomIn = computed(() => currentZoomIndex.value < ZOOM_STEPS.length - 1)
  const isPannable = computed(() => zoomLevel.value > DEFAULT_ZOOM)
  const viewportTransformStyle = computed<CSSProperties>(() => ({
    transform: `translate3d(${panOffset.value.x}px, ${panOffset.value.y}px, 0) scale(${zoomLevel.value})`,
    transformOrigin: 'center center'
  }))

  watch([zoomLevel, frameSize], () => {
    panOffset.value = clampPan(panOffset.value)
  })

  onBeforeUnmount(() => {
    activePointerId = null
    isDragging.value = false
  })

  function zoomOut() {
    setZoomByIndex(currentZoomIndex.value - 1)
  }

  function zoomIn() {
    setZoomByIndex(currentZoomIndex.value + 1)
  }

  function resetView() {
    zoomLevel.value = DEFAULT_ZOOM
    panOffset.value = { x: 0, y: 0 }
    activePointerId = null
    isDragging.value = false
  }

  function handleViewportPointerDown(event: PointerEvent) {
    if (
      !isPannable.value ||
      !event.isPrimary ||
      event.button !== POINTER_PRIMARY_BUTTON ||
      isInteractiveTarget(event.target)
    ) {
      return
    }

    event.preventDefault()
    activePointerId = event.pointerId
    isDragging.value = true
    dragStartClientX = event.clientX
    dragStartClientY = event.clientY
    dragStartOffset = panOffset.value

    const target = event.currentTarget
    if (target instanceof HTMLElement) {
      target.setPointerCapture(event.pointerId)
    }
  }

  function handleViewportPointerMove(event: PointerEvent) {
    if (!isDragging.value || activePointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    panOffset.value = clampPan({
      x: dragStartOffset.x + event.clientX - dragStartClientX,
      y: dragStartOffset.y + event.clientY - dragStartClientY
    })
  }

  function handleViewportPointerUp(event: PointerEvent) {
    if (activePointerId !== event.pointerId) {
      return
    }

    releasePointer(event)
  }

  function handleViewportPointerCancel(event: PointerEvent) {
    if (activePointerId !== event.pointerId) {
      return
    }

    releasePointer(event)
  }

  function setZoomByIndex(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), ZOOM_STEPS.length - 1)
    zoomLevel.value = ZOOM_STEPS[nextIndex]
    panOffset.value = clampPan(panOffset.value)

    if (!isPannable.value) {
      panOffset.value = { x: 0, y: 0 }
      activePointerId = null
      isDragging.value = false
    }
  }

  function releasePointer(event: PointerEvent) {
    const target = event.currentTarget
    if (target instanceof HTMLElement && target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }

    activePointerId = null
    isDragging.value = false
  }

  function clampPan(offset: PanOffset): PanOffset {
    const viewport = viewportRef.value

    if (!viewport || !isPannable.value) {
      return { x: 0, y: 0 }
    }

    const scaledWidth = frameSize.value.width * zoomLevel.value
    const scaledHeight = frameSize.value.height * zoomLevel.value
    const maxX = Math.max(0, (scaledWidth - viewport.clientWidth) / 2)
    const maxY = Math.max(0, (scaledHeight - viewport.clientHeight) / 2)

    return {
      x: Math.round(clamp(offset.x, -maxX, maxX)),
      y: Math.round(clamp(offset.y, -maxY, maxY))
    }
  }

  return {
    zoomPercentLabel,
    canZoomIn,
    canZoomOut,
    isDragging,
    isPannable,
    viewportTransformStyle,
    zoomIn,
    zoomOut,
    resetView,
    handleViewportPointerDown,
    handleViewportPointerMove,
    handleViewportPointerUp,
    handleViewportPointerCancel
  }
}

function getNearestZoomIndex(zoom: number) {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  ZOOM_STEPS.forEach((step, index) => {
    const distance = Math.abs(step - zoom)
    if (distance < nearestDistance) {
      nearestIndex = index
      nearestDistance = distance
    }
  })

  return nearestIndex
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(
    target.closest(
      'button, input, textarea, select, a, label, [role="button"], [data-nsplate-ignore-viewport-drag="true"]'
    )
  )
}
