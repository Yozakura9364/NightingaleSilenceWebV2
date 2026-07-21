import { onBeforeUnmount, reactive, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  findGlamourTemplateImageSessionRecord,
  getGlamourTemplateEquivalentImageSlotIds,
  loadGlamourTemplateImageStoreRecords,
  saveGlamourTemplateImageStoreSlot,
  writeGlamourTemplateImageSessionSlot
} from '@/lib/glamour/templates/imageSlots'
import {
  createGlamourTemplateImageCoverDataUrl,
  loadGlamourTemplateImage,
  readGlamourImageBlobAsDataUrl
} from '@/lib/glamour/templates/imageProcessing'
import type { GlamourTemplateId, GlamourTemplateImageSlot } from '@/lib/glamour/templates/definitions'
import type { GlamourTemplateWorkspaceImage } from '@/pages/glamour/types/templateWorkspace'

interface TemplateImageData {
  image: HTMLImageElement
  imageUrl: string
  imageName: string
  sourceUrl: string
  sourceName: string
}

interface GlamourTemplateImageStoreOptions {
  templateId: Ref<GlamourTemplateId>
  slots: ComputedRef<GlamourTemplateImageSlot[]>
}

export function useGlamourTemplateImageStore(options: GlamourTemplateImageStoreOptions) {
  const imageStateVersion = ref(0)
  const templateImages = reactive<Record<string, GlamourTemplateWorkspaceImage>>({})
  const templateImagesById: Record<string, Record<string, GlamourTemplateWorkspaceImage>> = {}
  let templateImageSyncTaskId = 0

  function getTemplateImage(slotId: string): GlamourTemplateWorkspaceImage | null {
    return templateImages[slotId] || null
  }

  function hasTemplateImage(slotId: string): boolean {
    return Boolean(getTemplateImage(slotId))
  }

  function clearTemplateImages(): void {
    Object.keys(templateImages).forEach((slotId) => {
      delete templateImages[slotId]
    })
  }

  function makeCurrentTemplateImages(
    source: Record<string, GlamourTemplateWorkspaceImage> = {}
  ): Record<string, GlamourTemplateWorkspaceImage> {
    return Object.fromEntries(
      options.slots.value.flatMap((slot) => {
        const image = source[slot.id]
        return image ? [[slot.id, { ...image }]] : []
      })
    ) as Record<string, GlamourTemplateWorkspaceImage>
  }

  function saveCurrentTemplateRuntimeImages(
    targetTemplateId: string = options.templateId.value
  ): void {
    templateImagesById[targetTemplateId] = makeCurrentTemplateImages(templateImages)
  }

  async function setTemplateImageData(slotId: string, imageData: TemplateImageData): Promise<void> {
    delete templateImages[slotId]
    templateImages[slotId] = {
      image: imageData.image,
      imageUrl: imageData.imageUrl,
      name: imageData.imageName,
      sourceUrl: imageData.sourceUrl,
      sourceName: imageData.sourceName,
      backupOnly: false
    }
    writeGlamourTemplateImageSessionSlot(options.templateId.value, slotId, imageData)
    await saveGlamourTemplateImageStoreSlot({
      templateId: options.templateId.value,
      slotId,
      ...imageData
    })
    saveCurrentTemplateRuntimeImages()
    imageStateVersion.value += 1
  }

  function cloneTemplateImages(
    source: Record<string, GlamourTemplateWorkspaceImage>
  ): Record<string, GlamourTemplateWorkspaceImage> {
    return Object.fromEntries(
      Object.entries(source).map(([slotId, image]) => [slotId, { ...image }])
    )
  }

  function replaceTemplateImages(nextImages: Record<string, GlamourTemplateWorkspaceImage>): void {
    clearTemplateImages()
    Object.entries(nextImages).forEach(([slotId, image]) => {
      templateImages[slotId] = image
    })
  }

  function applyTemplateRuntimeImages(targetTemplateId: string): void {
    replaceTemplateImages(makeCurrentTemplateImages(templateImagesById[targetTemplateId] || {}))
  }

  async function restoreCurrentTemplateImages(
    restoringTemplateId: string,
    taskId: number
  ): Promise<boolean> {
    let changed = await restoreCurrentTemplateImagesFromStore(restoringTemplateId, taskId)

    if (taskId !== templateImageSyncTaskId || options.templateId.value !== restoringTemplateId) {
      return changed
    }

    changed =
      (await restoreCurrentTemplateImagesFromSession(restoringTemplateId, taskId)) || changed

    if (changed) {
      saveCurrentTemplateRuntimeImages(restoringTemplateId)
    }

    return changed
  }

  async function restoreCurrentTemplateImagesFromStore(
    restoringTemplateId: string,
    taskId: number
  ): Promise<boolean> {
    const records = await loadGlamourTemplateImageStoreRecords(restoringTemplateId)
    let changed = false

    for (const record of records) {
      const slotExists = options.slots.value.some((slot) => slot.id === record.slotId)
      const currentImage = templateImages[record.slotId]

      if (!slotExists || (currentImage && !currentImage.backupOnly)) {
        continue
      }

      const imageUrl =
        record.imageUrl || (record.blob ? await readGlamourImageBlobAsDataUrl(record.blob) : '')
      if (!imageUrl) {
        continue
      }

      const image = await loadGlamourTemplateImage(imageUrl)
      if (
        !image ||
        options.templateId.value !== restoringTemplateId ||
        taskId !== templateImageSyncTaskId
      ) {
        return false
      }

      templateImages[record.slotId] = {
        image,
        imageUrl,
        name: record.imageName || record.sourceName || '',
        sourceUrl: record.sourceUrl || imageUrl,
        sourceName: record.sourceName || record.imageName || '',
        backupOnly: false
      }
      changed = true
    }

    return changed
  }

  async function restoreCurrentTemplateImagesFromSession(
    restoringTemplateId: string,
    taskId: number
  ): Promise<boolean> {
    let changed = false

    for (const slot of options.slots.value) {
      if (templateImages[slot.id]) {
        continue
      }

      const record = findGlamourTemplateImageSessionRecord(restoringTemplateId, slot.id)
      if (!record) {
        continue
      }

      const image = await loadGlamourTemplateImage(record.imageUrl)
      if (
        !image ||
        options.templateId.value !== restoringTemplateId ||
        taskId !== templateImageSyncTaskId
      ) {
        return false
      }

      templateImages[slot.id] = {
        image,
        imageUrl: record.imageUrl,
        name: record.imageName || record.sourceName || '',
        sourceUrl: record.sourceUrl || record.imageUrl,
        sourceName: record.sourceName || record.imageName || '',
        backupOnly: true
      }
      changed = true
    }

    return changed
  }

  async function makeTemplateImageForSlotFromSource(
    slotId: string,
    sourceImage: GlamourTemplateWorkspaceImage
  ): Promise<GlamourTemplateWorkspaceImage | null> {
    const sourceUrl = sourceImage.sourceUrl || sourceImage.imageUrl
    const source = await loadGlamourTemplateImage(sourceUrl)
    const rect = options.slots.value.find((slot) => slot.id === slotId)?.region

    if (!source || !rect) {
      return null
    }

    const imageUrl = createGlamourTemplateImageCoverDataUrl(source, rect.width, rect.height)
    const image = imageUrl ? await loadGlamourTemplateImage(imageUrl) : null

    if (!image) {
      return null
    }

    return {
      image,
      imageUrl,
      name: sourceImage.name || sourceImage.sourceName,
      sourceUrl,
      sourceName: sourceImage.sourceName || sourceImage.name,
      backupOnly: false
    }
  }

  async function carryTemplateImagesIntoCurrentTemplate(
    sourceImages: Record<string, GlamourTemplateWorkspaceImage>,
    carryingTemplateId: string,
    taskId: number
  ): Promise<boolean> {
    let changed = false

    for (const slot of options.slots.value) {
      if (templateImages[slot.id]) {
        continue
      }

      const sourceImage = getGlamourTemplateEquivalentImageSlotIds(slot.id)
        .map((sourceSlotId) => sourceImages[sourceSlotId])
        .find(Boolean)

      if (!sourceImage) {
        continue
      }

      const nextImage = await makeTemplateImageForSlotFromSource(slot.id, sourceImage)
      if (
        !nextImage ||
        options.templateId.value !== carryingTemplateId ||
        taskId !== templateImageSyncTaskId
      ) {
        return false
      }

      templateImages[slot.id] = nextImage
      changed = true
    }

    if (changed) {
      saveCurrentTemplateRuntimeImages(carryingTemplateId)
    }

    return changed
  }

  async function syncTemplateImagesForTemplate(
    nextTemplateId: string,
    previousTemplateId?: string
  ): Promise<void> {
    const taskId = ++templateImageSyncTaskId
    const previousImages = cloneTemplateImages(templateImages)

    if (previousTemplateId) {
      saveCurrentTemplateRuntimeImages(previousTemplateId)
    }

    applyTemplateRuntimeImages(nextTemplateId)
    const restored = await restoreCurrentTemplateImages(nextTemplateId, taskId)

    if (taskId !== templateImageSyncTaskId || options.templateId.value !== nextTemplateId) {
      return
    }

    const carried = previousTemplateId
      ? await carryTemplateImagesIntoCurrentTemplate(previousImages, nextTemplateId, taskId)
      : false

    if (taskId !== templateImageSyncTaskId || options.templateId.value !== nextTemplateId) {
      return
    }

    saveCurrentTemplateRuntimeImages(nextTemplateId)
    if (restored || carried || previousTemplateId) {
      imageStateVersion.value += 1
    }
  }

  watch(
    () => options.templateId.value,
    (nextTemplateId, previousTemplateId) => {
      void syncTemplateImagesForTemplate(nextTemplateId, previousTemplateId)
    },
    { immediate: true }
  )

  onBeforeUnmount(clearTemplateImages)

  return {
    imageStateVersion,
    getTemplateImage,
    hasTemplateImage,
    setTemplateImageData
  }
}
