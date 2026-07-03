import { ref } from 'vue'
import { textKeys } from '@/config/site'
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
      snapshot.value = normalizeArmoireSnapshot(payload)
      importedFileName.value = file.name
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

  return {
    snapshot,
    errorKey,
    errorDetail,
    importedFileName,
    importSnapshotFile,
    clearSnapshot
  }
}
