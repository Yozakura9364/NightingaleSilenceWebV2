import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { ApiError } from '@/composables/useFetch'
import { textKeys } from '@/config/site'
import { exportPlateCanvasImage, type NSPlateCanvasExportOptions } from '@/lib/plate/exportCanvas'
import {
  createLayeredZipBlobOnClient,
  createNameplateLayeredExportPayload,
  downloadPlateLayeredZip
} from '@/lib/plate/layeredExport'
import type { NSPlateNameplateRenderPlan } from '@/lib/plate/render'
import type { NSPlateLayeredExportPayload } from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import { useNSPlateApi } from '@/pages/plate/services/nsplateApi'

interface UseNSPlateCanvasExportOptions {
  apiBase: string
  canvasRef: Ref<HTMLCanvasElement | null>
  renderPlan: ComputedRef<NSPlateNameplateRenderPlan>
  isCanvasReady: Ref<boolean>
  createConfigJson?: () => string
}

export function useNSPlateCanvasExport(options: UseNSPlateCanvasExportOptions) {
  const { t } = useLocale()
  const plateApi = useNSPlateApi(options.apiBase)
  const isExporting = ref(false)
  const exportErrorText = ref('')
  const canExport = computed(() => options.isCanvasReady.value && !isExporting.value)

  async function exportImage(exportOptions: NSPlateCanvasExportOptions) {
    const canvas = options.canvasRef.value
    exportErrorText.value = ''

    if (!canvas) {
      exportErrorText.value = t(textKeys.nsplateExportError)
      return
    }

    try {
      isExporting.value = true

      if (!options.isCanvasReady.value) {
        throw new Error('canvas-not-ready')
      }

      await exportPlateCanvasImage(canvas, exportOptions)
    } catch {
      exportErrorText.value = t(textKeys.nsplateExportError)
    } finally {
      isExporting.value = false
    }
  }

  async function exportLayeredZip(exportOptions: { scale: number }) {
    exportErrorText.value = ''

    try {
      isExporting.value = true

      if (!options.isCanvasReady.value) {
        throw new Error('canvas-not-ready')
      }

      const payload = await createNameplateLayeredExportPayload(
        options.renderPlan.value,
        exportOptions
      )
      const composerConfigFull = readComposerConfigFull()

      if (composerConfigFull) {
        payload.composerConfigFull = composerConfigFull
      }

      if (!payload.layers.length) {
        exportErrorText.value = t(textKeys.nsplateExportNoLayers)
        return
      }

      const zipBlob = await exportLayeredZipBlob(payload)

      downloadPlateLayeredZip(zipBlob, exportOptions.scale)
    } catch (error) {
      exportErrorText.value = formatLayeredZipError(error)
    } finally {
      isExporting.value = false
    }
  }

  async function exportLayeredZipBlob(payload: NSPlateLayeredExportPayload) {
    try {
      return await createLayeredZipBlobOnClient(payload)
    } catch {
      return plateApi.exportLayeredZip(payload)
    }
  }

  function formatLayeredZipError(error: unknown) {
    const baseMessage = t(textKeys.nsplateExportLayeredZipError)

    if (error instanceof ApiError) {
      const serverMessage = readApiErrorMessage(error)
      const detail = serverMessage || `HTTP ${error.status}`

      return `${baseMessage}: ${detail}`
    }

    return baseMessage
  }

  function readComposerConfigFull(): Record<string, unknown> | null {
    if (!options.createConfigJson) {
      return null
    }

    try {
      const parsed: unknown = JSON.parse(options.createConfigJson())

      return isRecord(parsed) && Number(parsed.version) === 1 ? parsed : null
    } catch {
      return null
    }
  }

  return {
    canExport,
    exportErrorText,
    exportImage,
    exportLayeredZip,
    isExporting
  }
}

function readApiErrorMessage(error: ApiError) {
  try {
    const body = JSON.parse(error.bodyText) as { error?: unknown }
    const message = typeof body.error === 'string' ? body.error.trim() : ''

    return message.slice(0, 120)
  } catch {
    return ''
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
