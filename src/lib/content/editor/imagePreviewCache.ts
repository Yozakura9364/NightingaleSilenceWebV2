// imagePreviewCache — event-emitting blob URL store for media previews.
// NodeViews subscribe; set() notifies listeners so img DOM updates without focus hack.

type Listener = (mediaId: string, url: string) => void

const cache = new Map<string, string>()
const listeners = new Set<Listener>()

export function getPreviewUrl(mediaId: string): string | undefined {
  return cache.get(mediaId)
}

export function setPreviewUrl(mediaId: string, url: string) {
  const old = cache.get(mediaId)
  if (old) URL.revokeObjectURL(old)
  cache.set(mediaId, url)
  for (const fn of listeners) fn(mediaId, url)
}

export function hasPreviewUrl(mediaId: string): boolean {
  return cache.has(mediaId)
}

export function subscribePreviews(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function clearPreviews() {
  for (const url of cache.values()) URL.revokeObjectURL(url)
  cache.clear()
}

export async function fetchAndPreview(mediaId: string) {
  const token = import.meta.env.VITE_CONTENT_STUDIO_TOKEN || ''
  const resp = await fetch(`/api/content-studio/media/${mediaId}/raw`, {
    headers: { 'X-Content-Studio-Token': token }
  })
  if (!resp.ok) throw new Error(`Preview fetch failed: ${resp.status}`)
  const blob = await resp.blob()
  setPreviewUrl(mediaId, URL.createObjectURL(blob))
}
