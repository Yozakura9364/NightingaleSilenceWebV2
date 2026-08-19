// Content media preview service — fetches raw media blobs into the lib preview cache.

import { contentStudioToken } from '@/config/env'
import { useFetch } from '@/composables/useFetch'
import { setPreviewUrl } from '@/lib/content/editor/imagePreviewCache'

const PREVIEW_TIMEOUT_MS = 15000

export async function fetchAndPreview(mediaId: string) {
  const token = contentStudioToken
  const blob = await useFetch().blob(`/api/content-studio/media/${mediaId}/raw`, {
    headers: { 'X-Content-Studio-Token': token },
    timeoutMs: PREVIEW_TIMEOUT_MS
  })
  setPreviewUrl(mediaId, URL.createObjectURL(blob))
}
