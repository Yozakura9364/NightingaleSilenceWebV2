import { computed, nextTick, ref, watch, type Ref } from 'vue'
import {
  clampCustomPortraitCropState,
  drawCustomPortraitCropPreview,
  getCustomPortraitCropLimits,
  getCustomPortraitCropPreviewDimensions,
  setCustomPortraitCropMode
} from '@/lib/plate/customPortrait'
import { NSPLATE_CANVAS_DIMENSIONS, NSPLATE_PORTRAIT_EMBED } from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitMode
} from '@/lib/plate/types'

export function useNSPlateCropInteraction(
  cropState: Readonly<Ref<NSPlateCustomPortraitCropState>>
) {
  const cropLimits = getCustomPortraitCropLimits()
  const portraitHeight = NSPLATE_CANVAS_DIMENSIONS.portrait.height
  const portraitOrigin = NSPLATE_PORTRAIT_EMBED.right
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const localCropState = ref<NSPlateCustomPortraitCropState | null>(null)
  let isDragging = false
  let lastPointerX = 0
  let lastPointerY = 0
  let dragTarget: 'image' | 'split' = 'image'

  const zoomLabel = computed(() => {
    const zoom = localCropState.value?.scaleMultiplier ?? 1
    return `${Math.round(zoom * 100)}%`
  })

  const splitLabel = computed(() => {
    const splitY = localCropState.value?.splitY ?? 0
    return `${Math.round((splitY / portraitHeight) * 100)}%`
  })

  const previewDimensions = computed(() => {
    const currentCropState = localCropState.value
    return currentCropState
      ? getCustomPortraitCropPreviewDimensions(currentCropState)
      : NSPLATE_CANVAS_DIMENSIONS.portrait
  })

  watch(
    cropState,
    (nextCropState) => {
      localCropState.value = cloneCropState(nextCropState)
      void nextTick(renderPreview)
    },
    { immediate: true }
  )

  function renderPreview() {
    const canvas = canvasRef.value
    const currentCropState = localCropState.value

    if (!canvas || !currentCropState) {
      return
    }

    drawCustomPortraitCropPreview(canvas, currentCropState)
  }

  function onZoomInput(event: Event) {
    const currentCropState = localCropState.value

    if (!currentCropState) {
      return
    }

    currentCropState.scaleMultiplier = Number((event.target as HTMLInputElement).value)
    clampCustomPortraitCropState(currentCropState)
    renderPreview()
  }

  function onSplitInput(event: Event) {
    const currentCropState = localCropState.value

    if (!currentCropState) {
      return
    }

    currentCropState.splitY = Number((event.target as HTMLInputElement).value)
    clampCustomPortraitCropState(currentCropState)
    renderPreview()
  }

  function onWheel(event: WheelEvent) {
    const currentCropState = localCropState.value

    if (!currentCropState) {
      return
    }

    event.preventDefault()
    currentCropState.scaleMultiplier += event.deltaY > 0 ? -0.06 : 0.06
    clampCustomPortraitCropState(currentCropState)
    renderPreview()
  }

  function onPointerDown(event: PointerEvent) {
    const currentCropState = localCropState.value
    const canvas = canvasRef.value

    if (!currentCropState || !canvas) {
      return
    }

    const splitPointerY = getSplitPointerY(event, canvas, currentCropState)
    dragTarget =
      currentCropState.mode === 'popout' && Math.abs(splitPointerY - currentCropState.splitY) <= 36
        ? 'split'
        : 'image'
    isDragging = true
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    const currentCropState = localCropState.value
    const canvas = canvasRef.value

    if (!isDragging || !currentCropState || !canvas) {
      return
    }

    if (dragTarget === 'split') {
      currentCropState.splitY = getSplitPointerY(event, canvas, currentCropState)
      clampCustomPortraitCropState(currentCropState)
      renderPreview()
      return
    }

    const rect = canvas.getBoundingClientRect()
    const dimensions = previewDimensions.value
    const scaleX = dimensions.width / rect.width
    const scaleY = dimensions.height / rect.height
    currentCropState.offsetX += (event.clientX - lastPointerX) * scaleX
    currentCropState.offsetY += (event.clientY - lastPointerY) * scaleY
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    clampCustomPortraitCropState(currentCropState)
    renderPreview()
  }

  function onPointerUp(event: PointerEvent) {
    isDragging = false
    dragTarget = 'image'

    try {
      ;(event.currentTarget as HTMLCanvasElement).releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }

  function setCropMode(mode: NSPlateCustomPortraitMode) {
    const currentCropState = localCropState.value

    if (!currentCropState) {
      return
    }

    setCustomPortraitCropMode(currentCropState, mode)
    void nextTick(renderPreview)
  }

  function cloneCurrentCropState() {
    const currentCropState = localCropState.value
    return currentCropState ? cloneCropState(currentCropState) : null
  }

  function getPreviewPointerPosition(event: PointerEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const dimensions = previewDimensions.value
    return {
      x: ((event.clientX - rect.left) * dimensions.width) / rect.width,
      y: ((event.clientY - rect.top) * dimensions.height) / rect.height
    }
  }

  function getSplitPointerY(
    event: PointerEvent,
    canvas: HTMLCanvasElement,
    currentCropState: NSPlateCustomPortraitCropState
  ) {
    const pointer = getPreviewPointerPosition(event, canvas)
    return currentCropState.mode === 'popout' ? pointer.y - portraitOrigin.y : pointer.y
  }

  return {
    canvasRef,
    cloneCurrentCropState,
    cropLimits,
    localCropState,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onSplitInput,
    onWheel,
    onZoomInput,
    previewDimensions,
    setCropMode,
    splitLabel,
    zoomLabel
  }
}

function cloneCropState(cropState: NSPlateCustomPortraitCropState) {
  return { ...cropState }
}
