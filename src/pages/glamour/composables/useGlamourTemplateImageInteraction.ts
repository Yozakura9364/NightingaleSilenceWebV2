import { computed, onBeforeUnmount, onMounted, ref, watch, type ComputedRef } from 'vue'
import { isGlamourTemplatePersistentImageUrl } from '@/lib/glamour/templates/imageSlots'
import type { GlamourTemplateImageSlot } from '@/lib/glamour/templates/definitions'
import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import {
  createGlamourTemplateImageCoverDataUrl,
  getGlamourDraggedData,
  getGlamourDroppedImageUrl,
  loadGlamourTemplateImage,
  normalizeGlamourDraggedImageUrl,
  readGlamourImageFileAsDataUrl
} from '@/lib/glamour/templates/imageProcessing'
import type { TemplateImageCropRequest } from '@/pages/glamour/types/templateWorkspace'

interface TemplateImageData {
  image: HTMLImageElement
  imageUrl: string
  imageName: string
  sourceUrl: string
  sourceName: string
}

interface GlamourTemplateImageInteractionOptions {
  renderData: ComputedRef<GlamourTemplateRenderData>
  slots: ComputedRef<GlamourTemplateImageSlot[]>
  setTemplateImageData: (slotId: string, imageData: TemplateImageData) => Promise<void>
}

export function useGlamourTemplateImageInteraction(
  options: GlamourTemplateImageInteractionOptions
) {
  const canvasShellEl = ref<HTMLElement | null>(null)
  const imageInputEl = ref<HTMLInputElement | null>(null)
  const activeImageSlotId = ref('')
  const activeDropSlotId = ref('')
  const pendingCrop = ref<TemplateImageCropRequest | null>(null)
  const pendingCropQueue: TemplateImageCropRequest[] = []
  const canvasUploadLayers = options.slots
  const pendingCropSlot = computed(() =>
    pendingCrop.value
      ? canvasUploadLayers.value.find((slot) => slot.id === pendingCrop.value?.slotId) || null
      : null
  )

  watch(
    canvasUploadLayers,
    (slots) => {
      activeImageSlotId.value = slots[0]?.id || ''
    },
    { immediate: true }
  )

  function getCanvasUploadLayerStyle(slot: GlamourTemplateImageSlot) {
    const rect = slot.uploadRegion || slot.region
    const canvas = options.renderData.value.canvas

    return {
      left: `${(rect.x / canvas.width) * 100}%`,
      top: `${(rect.y / canvas.height) * 100}%`,
      width: `${(rect.width / canvas.width) * 100}%`,
      height: `${(rect.height / canvas.height) * 100}%`
    }
  }

  function chooseImageUpload(slotId: string): void {
    activeImageSlotId.value = slotId
    imageInputEl.value?.click()
  }

  function handleImageInputChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    void queueImageFiles(input.files)
    input.value = ''
  }

  function getImageSlotSequence(startSlotId: string): GlamourTemplateImageSlot[] {
    const slots = canvasUploadLayers.value
    const startIndex = Math.max(
      0,
      slots.findIndex((slot) => slot.id === startSlotId)
    )
    return [...slots.slice(startIndex), ...slots.slice(0, startIndex)]
  }

  async function queueImageFiles(
    files: FileList | File[] | null,
    targetSlotId = activeImageSlotId.value
  ): Promise<void> {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'))
    if (!imageFiles.length) {
      return
    }

    const slotSequence = getImageSlotSequence(targetSlotId || canvasUploadLayers.value[0]?.id || '')
    for (const [index, file] of imageFiles.entries()) {
      const slot = slotSequence[Math.min(index, slotSequence.length - 1)]
      if (!slot) {
        return
      }
      await queueTemplateImageCrop(slot.id, file)
    }
  }

  async function queueTemplateImageCrop(slotId: string, file: File): Promise<void> {
    const imageUrl = await readGlamourImageFileAsDataUrl(file)
    if (!imageUrl) {
      return
    }

    const image = await loadGlamourTemplateImage(imageUrl)
    if (!image) {
      return
    }

    openImageCropper({
      slotId,
      image,
      imageUrl,
      imageName: file.name,
      sourceUrl: imageUrl,
      sourceName: file.name
    })
  }

  async function setTemplateImageFromUrl(slotId: string, imageUrl: string): Promise<void> {
    const normalizedUrl = normalizeGlamourDraggedImageUrl(imageUrl)
    if (!normalizedUrl) {
      return
    }

    const image = await loadGlamourTemplateImage(normalizedUrl)
    if (!image) {
      return
    }

    openImageCropper({
      slotId,
      image,
      imageUrl: normalizedUrl,
      imageName: '',
      sourceUrl: isGlamourTemplatePersistentImageUrl(normalizedUrl) ? normalizedUrl : '',
      sourceName: ''
    })
  }

  function getCropSlot(slotId: string): GlamourTemplateImageSlot | null {
    return canvasUploadLayers.value.find((slot) => slot.id === slotId) || null
  }

  function openImageCropper(request: TemplateImageCropRequest): void {
    const slot = getCropSlot(request.slotId)
    if (!slot) {
      return
    }

    const normalizedRequest = { ...request, slotId: slot.id }
    if (pendingCrop.value) {
      pendingCropQueue.push(normalizedRequest)
      return
    }

    activeImageSlotId.value = slot.id
    pendingCrop.value = normalizedRequest
  }

  async function applyImageCrop(croppedImageUrl: string): Promise<void> {
    const request = pendingCrop.value
    if (!request) {
      return
    }

    const fallbackSlot = getCropSlot(request.slotId)?.region
    const imageUrl =
      croppedImageUrl ||
      (isGlamourTemplatePersistentImageUrl(request.imageUrl)
        ? request.imageUrl
        : fallbackSlot
          ? createGlamourTemplateImageCoverDataUrl(
              request.image,
              fallbackSlot.width,
              fallbackSlot.height
            )
          : '')
    const image = imageUrl ? await loadGlamourTemplateImage(imageUrl) : null
    if (!image || !imageUrl) {
      return
    }

    await options.setTemplateImageData(request.slotId, {
      image,
      imageUrl,
      imageName: request.imageName,
      sourceUrl: request.sourceUrl || request.imageUrl,
      sourceName: request.sourceName
    })
    pendingCrop.value = null
    const nextCrop = pendingCropQueue.shift()
    if (nextCrop) {
      openImageCropper(nextCrop)
    }
  }

  function closeImageCropper(): void {
    pendingCrop.value = null
    pendingCropQueue.splice(0)
  }

  function hasDraggedImage(event: DragEvent): boolean {
    const dataTransfer = event.dataTransfer
    if (!dataTransfer) {
      return false
    }
    if (getDraggedImageFiles(event).length) {
      return true
    }

    const types = Array.from(dataTransfer.types || []).map((type) => String(type).toLowerCase())
    if (types.some((type) => type.startsWith('image/') || type === 'text/uri-list')) {
      return true
    }

    return Boolean(
      normalizeGlamourDraggedImageUrl(getGlamourDraggedData(dataTransfer, 'text/plain'))
    )
  }

  function getDraggedImageFiles(event: DragEvent): File[] {
    return Array.from(event.dataTransfer?.files || []).filter((file) =>
      file.type.startsWith('image/')
    )
  }

  function getImageSlotIdFromPoint(clientX: number, clientY: number): string {
    const shell = canvasShellEl.value
    if (!shell) {
      return activeImageSlotId.value
    }

    const shellRect = shell.getBoundingClientRect()
    const canvas = options.renderData.value.canvas
    const x = ((clientX - shellRect.left) / shellRect.width) * canvas.width
    const y = ((clientY - shellRect.top) / shellRect.height) * canvas.height
    const slots = canvasUploadLayers.value
    let nearestSlotId = activeImageSlotId.value || slots[0]?.id || ''
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let index = slots.length - 1; index >= 0; index -= 1) {
      const slot = slots[index]
      const rect = slot.dropRegion || slot.uploadRegion || slot.region
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return slot.id
      }

      const dx = x < rect.x ? rect.x - x : x > rect.x + rect.width ? x - (rect.x + rect.width) : 0
      const dy = y < rect.y ? rect.y - y : y > rect.y + rect.height ? y - (rect.y + rect.height) : 0
      const distance = dx * dx + dy * dy
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestSlotId = slot.id
      }
    }

    return nearestSlotId
  }

  function handleCanvasDrag(event: DragEvent): void {
    if (!hasDraggedImage(event)) {
      return
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    activeDropSlotId.value =
      getImageSlotIdFromPoint(event.clientX, event.clientY) || canvasUploadLayers.value[0]?.id || ''
  }

  function handleCanvasDragLeave(event: DragEvent): void {
    const shell = canvasShellEl.value
    const relatedTarget = event.relatedTarget as Node | null
    if (!shell || !relatedTarget || !shell.contains(relatedTarget)) {
      activeDropSlotId.value = ''
    }
  }

  function handleCanvasDrop(event: DragEvent): void {
    if (!hasDraggedImage(event)) {
      return
    }

    const slotId = getImageSlotIdFromPoint(event.clientX, event.clientY) || activeDropSlotId.value
    activeDropSlotId.value = ''
    const files = getDraggedImageFiles(event)
    if (files.length) {
      void queueImageFiles(files, slotId)
      return
    }
    void setTemplateImageFromUrl(slotId, getGlamourDroppedImageUrl(event))
  }

  function isEventInsideTemplateCanvasShell(event: DragEvent): boolean {
    const target = event.target as Node | null
    return Boolean(canvasShellEl.value && target && canvasShellEl.value.contains(target))
  }

  function handleTemplateDocumentDragEvent(event: DragEvent): void {
    const insideShell = isEventInsideTemplateCanvasShell(event)
    const isDragEvent = ['dragenter', 'dragover', 'dragleave', 'drop'].includes(event.type)
    if (!hasDraggedImage(event) && !(insideShell && isDragEvent)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }

    if (insideShell && (event.type === 'dragenter' || event.type === 'dragover')) {
      handleCanvasDrag(event)
      return
    }
    if (event.type === 'drop') {
      if (insideShell) {
        handleCanvasDrop(event)
      } else {
        activeDropSlotId.value = ''
      }
      return
    }
    if (event.type === 'dragleave') {
      if (!insideShell) {
        activeDropSlotId.value = ''
        return
      }
      handleCanvasDragLeave(event)
    }
  }

  function getTemplateDocumentDragTargets(): EventTarget[] {
    return [window, document, document.documentElement].filter(Boolean)
  }

  onMounted(() => {
    getTemplateDocumentDragTargets().forEach((target) => {
      ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        target.addEventListener(eventName, handleTemplateDocumentDragEvent as EventListener, {
          capture: true
        })
      })
    })
  })

  onBeforeUnmount(() => {
    getTemplateDocumentDragTargets().forEach((target) => {
      ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        target.removeEventListener(eventName, handleTemplateDocumentDragEvent as EventListener, {
          capture: true
        })
      })
    })
  })

  return {
    canvasShellEl,
    imageInputEl,
    activeDropSlotId,
    pendingCrop,
    canvasUploadLayers,
    pendingCropSlot,
    getCanvasUploadLayerStyle,
    chooseImageUpload,
    handleImageInputChange,
    applyImageCrop,
    closeImageCropper,
    handleCanvasDrag,
    handleCanvasDragLeave,
    handleCanvasDrop
  }
}
