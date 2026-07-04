import { ref } from 'vue'
import { textKeys } from '@/config/site'
import { createExampleArmoireSnapshot } from '@/lib/armoire/exampleSnapshot'
import {
  ArmoireSnapshotError,
  normalizeArmoireSnapshot,
  type ArmoireSnapshotErrorCode
} from '@/lib/armoire/normalizeSnapshot'
import type { ArmoireSnapshot } from '@/lib/armoire/types'

const MAX_SNAPSHOT_FILE_BYTES = 8 * 1024 * 1024

const errorKeyByCode: Record<ArmoireSnapshotErrorCode, string> = {
  invalidRoot: textKeys.nsarmoireSnapshotInvalidRoot,
  invalidSchema: textKeys.nsarmoireSnapshotInvalidSchema,
  invalidSource: textKeys.nsarmoireSnapshotInvalidSource,
  invalidGeneratedAt: textKeys.nsarmoireSnapshotInvalidGeneratedAt,
  invalidItems: textKeys.nsarmoireSnapshotInvalidItems,
  tooManyItems: textKeys.nsarmoireSnapshotTooManyItems,
  invalidItem: textKeys.nsarmoireSnapshotInvalidItem,
  invalidItemId: textKeys.nsarmoireSnapshotInvalidItemId,
  invalidContainer: textKeys.nsarmoireSnapshotInvalidContainer,
  invalidQuantity: textKeys.nsarmoireSnapshotInvalidQuantity,
  invalidDyes: textKeys.nsarmoireSnapshotInvalidDyes
}

export function useArmoireSnapshot() {
  const snapshot = ref<ArmoireSnapshot | null>(null)
  const errorKey = ref<string | null>(null)
  const errorDetail = ref<string | null>(null)
  const importedFileName = ref<string | null>(null)

  function importSnapshotPayload(
    payload: unknown,
    nextImportedFileName: string | null = null
  ): ArmoireSnapshot | null {
    errorKey.value = null
    errorDetail.value = null

    try {
      const importedSnapshot = normalizeArmoireSnapshot(payload)
      snapshot.value = importedSnapshot
      importedFileName.value = nextImportedFileName
      return importedSnapshot
    } catch (error) {
      if (error instanceof ArmoireSnapshotError) {
        errorKey.value = errorKeyByCode[error.code]
        errorDetail.value = error.detail ?? null
        return null
      }

      errorKey.value = textKeys.nsarmoireSnapshotInvalidJson
      return null
    }
  }

  async function importSnapshotFile(file: File) {
    errorKey.value = null
    errorDetail.value = null

    if (file.size > MAX_SNAPSHOT_FILE_BYTES) {
      errorKey.value = textKeys.nsarmoireSnapshotFileTooLarge
      errorDetail.value = `${file.size}`
      return
    }

    try {
      const payload = JSON.parse(await file.text()) as unknown
      importSnapshotPayload(payload, file.name)
    } catch (error) {
      if (error instanceof ArmoireSnapshotError) {
        errorKey.value = errorKeyByCode[error.code]
        errorDetail.value = error.detail ?? null
        return
      }

      errorKey.value = textKeys.nsarmoireSnapshotInvalidJson
    }
  }

  function clearSnapshot() {
    snapshot.value = null
    errorKey.value = null
    errorDetail.value = null
    importedFileName.value = null
  }

  function loadExampleSnapshot() {
    snapshot.value = createExampleArmoireSnapshot()
    errorKey.value = null
    errorDetail.value = null
    importedFileName.value = null
  }

  return {
    snapshot,
    errorKey,
    errorDetail,
    importedFileName,
    importSnapshotPayload,
    importSnapshotFile,
    loadExampleSnapshot,
    clearSnapshot
  }
}
