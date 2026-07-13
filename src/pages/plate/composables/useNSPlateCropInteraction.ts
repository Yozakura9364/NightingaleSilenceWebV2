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
  NSPlateCustomPortraitMode,
  NSPlatePortraitSide
} from '@/lib/plate/types'

export function useNSPlateCropInteraction(
  cropState: Readonly<Ref<NSPlateCustomPortraitCropState>>,
  portraitSide: Readonly<Ref<NSPlatePortraitSide>>
) {
  const cropLimits = getCustomPortraitCropLimits()
  const portraitHeight = NSPLATE_CANVAS_DIMENSIONS.portrait.height
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

  watch(portraitSide, () => {
    void nextTick(renderPreview)
  })

  function renderPreview() {
    const canvas = canvasRef.value
    const currentCropState = localCropState.value

    if (!canvas || !currentCropState) {
      return
    }

    drawCustomPortraitCropPreview(canvas, currentCropState, portraitSide.value)
  }

  function onZoomInput(event: Event) {
    const currentCropState = localCropState.value

    if (!currentCropState) {
      return
    }

    updateZoom(Number((event.target as HTMLInputElement).value))
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
    updateZoom(
      currentCropState.scaleMultiplier + (event.deltaY > 0 ? -0.06 : 0.06),
      getPortraitPointerPosition(event, canvasRef.value, currentCropState)
    )
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

  function updateZoom(nextZoom: number, pointer?: { x: number; y: number }) {
    const currentCropState = localCropState.value

    if (!currentCropState) {
      return
    }

    const previousZoom = currentCropState.scaleMultiplier
    const clampedZoom = Math.max(cropLimits.minZoom, Math.min(cropLimits.maxZoom, nextZoom))

    if (pointer && previousZoom > 0 && clampedZoom !== previousZoom) {
      const ratio = clampedZoom / previousZoom
      const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
      const centerX = portrait.width / 2 + currentCropState.offsetX
      const centerY = portrait.height / 2 + currentCropState.offsetY
      currentCropState.offsetX += (pointer.x - centerX) * (1 - ratio)
      currentCropState.offsetY += (pointer.y - centerY) * (1 - ratio)
    }

    currentCropState.scaleMultiplier = clampedZoom
    clampCustomPortraitCropState(currentCropState)
    renderPreview()
  }

  function getPreviewPointerPosition(event: MouseEvent, canvas: HTMLCanvasElement) {
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
    return currentCropState.mode === 'popout'
      ? pointer.y - NSPLATE_PORTRAIT_EMBED[portraitSide.value].y
      : pointer.y
  }

  function getPortraitPointerPosition(
    event: MouseEvent,
    canvas: HTMLCanvasElement | null,
    currentCropState: NSPlateCustomPortraitCropState
  ) {
    if (!canvas) {
      return undefined
    }

    const pointer = getPreviewPointerPosition(event, canvas)
    if (currentCropState.mode !== 'popout') {
      return pointer
    }

    const origin = NSPLATE_PORTRAIT_EMBED[portraitSide.value]
    return { x: pointer.x - origin.x, y: pointer.y - origin.y }
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
