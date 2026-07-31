import {
  normalizeGlamourConfigName,
  normalizeRecentSnapshot
} from '@/lib/glamour/recent'
import type { GlamourRecentSnapshot } from '@/lib/glamour/types'

export const GLAMOUR_RECENT_STORAGE_KEY = 'nsglamour.recentLoadouts'
export const GLAMOUR_RECENT_LIMIT = 10

export function readGlamourRecentSnapshots(): GlamourRecentSnapshot[] {
  try {
    const data = JSON.parse(localStorage.getItem(GLAMOUR_RECENT_STORAGE_KEY) || '[]')

    if (!Array.isArray(data)) {
      return []
    }

    return data
      .map((item, index) => normalizeRecentSnapshot(item, index))
      .filter((item): item is GlamourRecentSnapshot => Boolean(item))
  } catch {
    return []
  }
}

export function writeGlamourRecentSnapshots(items: GlamourRecentSnapshot[]): boolean {
  try {
    localStorage.setItem(
      GLAMOUR_RECENT_STORAGE_KEY,
      JSON.stringify((Array.isArray(items) ? items : []).slice(0, GLAMOUR_RECENT_LIMIT))
    )
    return true
  } catch {
    return false
  }
}

export function upsertGlamourRecentSnapshot(snapshot: GlamourRecentSnapshot) {
  const snapshotKey = snapshot.sourceName
  const existing = readGlamourRecentSnapshots().filter((item) => item.sourceName !== snapshotKey)
  writeGlamourRecentSnapshots([snapshot, ...existing])
}

export function findGlamourRecentSnapshotLink(snapshotKey: string):
  | Pick<GlamourRecentSnapshot, 'snapshotId' | 'snapshotUrl' | 'snapshotKey'>
  | undefined {
  const item = readGlamourRecentSnapshots().find((snapshot) => (
    snapshot.snapshotKey === snapshotKey && Boolean(snapshot.snapshotId)
  ))
  return item
    ? {
        snapshotId: item.snapshotId,
        snapshotUrl: item.snapshotUrl,
        snapshotKey: item.snapshotKey
      }
    : undefined
}

export function recordGlamourRecentSnapshotLink(
  name: string,
  link: { snapshotId: string; snapshotUrl: string; snapshotKey: string }
): boolean {
  const normalizedName = normalizeGlamourConfigName(name)
  const items = readGlamourRecentSnapshots()
  const index = items.findIndex((item) => item.sourceName === normalizedName)
  if (index < 0) {
    return false
  }

  items[index] = { ...items[index], ...link }
  if (!writeGlamourRecentSnapshots(items)) {
    return false
  }
  window.dispatchEvent(new StorageEvent('storage', { key: GLAMOUR_RECENT_STORAGE_KEY }))
  return true
}

export function removeGlamourRecentSnapshot(id: string) {
  writeGlamourRecentSnapshots(readGlamourRecentSnapshots().filter((item) => item.id !== id))
}

export function clearGlamourRecentSnapshots() {
  writeGlamourRecentSnapshots([])
}
