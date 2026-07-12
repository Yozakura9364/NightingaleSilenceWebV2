import { computed, onMounted, readonly, ref, toRaw, watch, type Ref } from 'vue'
import { normalizeArmoireSnapshot } from '@/lib/armoire/normalizeSnapshot'
import type { ArmoireContainerKind, ArmoireSnapshot } from '@/lib/armoire/types'
import {
  deleteArmoireSnapshotRecord,
  getArmoireSnapshotRecord,
  listArmoireSnapshotProfiles,
  putArmoireSnapshotRecord,
  type ArmoireStoredSnapshotProfile,
  type ArmoireStoredSnapshotRecord
} from '@/pages/armoire/services/armoireSnapshotStore'

export type ArmoireCharacterProfile = ArmoireStoredSnapshotProfile
export type ArmoireCharacterProfileStorageStatus = 'idle' | 'loading' | 'ready' | 'error'

const ACTIVE_PROFILE_STORAGE_KEY = 'nsarmoire.activeProfileKey.v1'
const UNKNOWN_PROFILE_PREFIX = 'unidentified'
const CONTAINER_DISPLAY_ORDER: ArmoireContainerKind[] = [
  'armoire',
  'inventory',
  'armoury',
  'glamourDresser',
  'saddlebag',
  'manual',
  'retainer'
]

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function sortProfiles(left: ArmoireCharacterProfile, right: ArmoireCharacterProfile): number {
  return (
    getTimestamp(right.lastDataAt) - getTimestamp(left.lastDataAt) ||
    left.key.localeCompare(right.key)
  )
}

function hashProfileSeed(seed: string): string {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return hash.toString(36).padStart(6, '0')
}

function createUnknownProfileKey(
  snapshot: ArmoireSnapshot,
  containers: readonly ArmoireContainerKind[]
): string {
  return [
    UNKNOWN_PROFILE_PREFIX,
    hashProfileSeed(
      `${snapshot.source}|${snapshot.generatedAt}|${snapshot.items.length}|${containers.join(',')}`
    )
  ].join(':')
}

function saveActiveProfileKey(key: string | null): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (key) {
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, key)
    } else {
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    }
  } catch {
    // Active profile is a convenience pointer. Snapshot switching still works without it.
  }
}

function readActiveProfileKey(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const key = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)?.trim()
    return key || null
  } catch {
    return null
  }
}

export function getArmoireCharacterProfileKey(snapshot: ArmoireSnapshot | null): string | null {
  if (!snapshot) {
    return null
  }

  const name = snapshot.character?.name?.trim()
  const world = snapshot.character?.world?.trim()

  if (name && world) {
    return `${name}@${world}`
  }

  const containers = getReadContainers(snapshot)
  return createUnknownProfileKey(snapshot, containers)
}

export function getReadContainers(snapshot: ArmoireSnapshot): ArmoireContainerKind[] {
  const containers = new Set<ArmoireContainerKind>()

  for (const item of snapshot.items) {
    containers.add(item.container)
  }

  return CONTAINER_DISPLAY_ORDER.filter((container) => containers.has(container))
}

function getRetainerSummary(
  snapshot: ArmoireSnapshot
): Pick<ArmoireCharacterProfile, 'retainerNames' | 'retainerCount'> {
  const retainerKeys = new Set<string>()
  const retainerNames: string[] = []

  for (const item of snapshot.items) {
    if (item.container !== 'retainer') {
      continue
    }

    const retainerKey =
      item.retainerId?.trim() ||
      item.retainerName?.trim() ||
      item.containerName?.trim() ||
      'unknown'
    const retainerName = item.retainerName?.trim() || item.containerName?.trim()

    retainerKeys.add(retainerKey)

    if (retainerName && !retainerNames.includes(retainerName)) {
      retainerNames.push(retainerName)
    }
  }

  return {
    retainerNames,
    retainerCount: retainerKeys.size
  }
}

function createProfileFromSnapshot(snapshot: ArmoireSnapshot): ArmoireCharacterProfile {
  const containers = getReadContainers(snapshot)
  const retainerSummary = getRetainerSummary(snapshot)

  return {
    key: getArmoireCharacterProfileKey(snapshot) ?? createUnknownProfileKey(snapshot, containers),
    name: snapshot.character?.name?.trim() || undefined,
    world: snapshot.character?.world?.trim() || undefined,
    dataCenter: snapshot.character?.dataCenter?.trim() || undefined,
    source: snapshot.source,
    lastDataAt: snapshot.generatedAt,
    cachedAt: new Date().toISOString(),
    entryCount: snapshot.items.length,
    containers,
    ignoredItemIds: [],
    ...retainerSummary
  }
}

function createRecordFromSnapshot(snapshot: ArmoireSnapshot): ArmoireStoredSnapshotRecord {
  const storedSnapshot = normalizeArmoireSnapshot(
    JSON.parse(JSON.stringify(toRaw(snapshot))) as unknown
  )

  return {
    ...createProfileFromSnapshot(storedSnapshot),
    snapshot: storedSnapshot
  }
}

function getRetainerContainerOwnerName(containerName: string | undefined): string | undefined {
  const name = containerName?.trim()

  if (!name) {
    return undefined
  }

  return (
    name.match(/^(.+?)\s+(?:背包|市场)(?:\s+\d+)?$/)?.[1]?.trim() ||
    name.match(/^(.+?)\s+(?:Bag|Market)(?:\s+\d+)?$/i)?.[1]?.trim() ||
    undefined
  )
}

function getRetainerMergeKey(item: ArmoireSnapshot['items'][number]): string {
  return (
    item.retainerId?.trim() ||
    item.retainerName?.trim() ||
    getRetainerContainerOwnerName(item.containerName) ||
    item.containerName?.trim() ||
    `slot:${item.inventoryType ?? ''}:${item.slotIndex ?? ''}`
  )
}

function cloneSnapshot(snapshot: ArmoireSnapshot): ArmoireSnapshot {
  return normalizeArmoireSnapshot(JSON.parse(JSON.stringify(toRaw(snapshot))) as unknown)
}

function getSnapshotItemInstanceKey(item: ArmoireSnapshot['items'][number]): string {
  return [
    item.container,
    item.retainerId?.trim() ?? '',
    item.retainerName?.trim() ?? '',
    getRetainerContainerOwnerName(item.containerName) ?? item.containerName?.trim() ?? '',
    item.inventoryType ?? '',
    item.slotIndex ?? '',
    item.itemId,
    item.hq === true ? 1 : 0,
    item.quantity ?? 1,
    item.dyes?.join('/') ?? '',
    item.glamourId ?? '',
    item.spiritbond ?? '',
    item.cabinetId ?? ''
  ].join('|')
}

function dedupeSnapshotItems(snapshot: ArmoireSnapshot): ArmoireSnapshot {
  const seenKeys = new Set<string>()
  const items: ArmoireSnapshot['items'] = []

  for (const item of snapshot.items) {
    const key = getSnapshotItemInstanceKey(item)

    if (seenKeys.has(key)) {
      continue
    }

    seenKeys.add(key)
    items.push(item)
  }

  return items.length === snapshot.items.length ? snapshot : { ...snapshot, items }
}

function mergeSnapshotWithStoredProfile(
  nextSnapshot: ArmoireSnapshot,
  storedSnapshot: ArmoireSnapshot | null
): ArmoireSnapshot {
  if (!storedSnapshot) {
    return cloneSnapshot(dedupeSnapshotItems(nextSnapshot))
  }

  const nextProfileKey = getArmoireCharacterProfileKey(nextSnapshot)
  const storedProfileKey = getArmoireCharacterProfileKey(storedSnapshot)

  if (!nextProfileKey || nextProfileKey !== storedProfileKey) {
    return cloneSnapshot(dedupeSnapshotItems(nextSnapshot))
  }

  const mergedRetainerItemsByKey = new Map<string, ArmoireSnapshot['items']>()
  const nextRetainerKeys = new Set<string>()

  for (const item of storedSnapshot.items) {
    if (item.container !== 'retainer') {
      continue
    }

    const key = getRetainerMergeKey(item)
    const items = mergedRetainerItemsByKey.get(key) ?? []
    items.push(item)
    mergedRetainerItemsByKey.set(key, items)
  }

  for (const item of nextSnapshot.items) {
    if (item.container !== 'retainer') {
      continue
    }

    const key = getRetainerMergeKey(item)
    if (!nextRetainerKeys.has(key)) {
      nextRetainerKeys.add(key)
      mergedRetainerItemsByKey.set(key, [])
    }

    mergedRetainerItemsByKey.get(key)?.push(item)
  }

  const mergedItems = [
    ...nextSnapshot.items.filter((item) => item.container !== 'retainer'),
    ...Array.from(mergedRetainerItemsByKey.values()).flat()
  ]

  return cloneSnapshot(dedupeSnapshotItems({
    ...nextSnapshot,
    items: mergedItems
  }))
}

function areSnapshotsEquivalent(left: ArmoireSnapshot, right: ArmoireSnapshot): boolean {
  return JSON.stringify(toRaw(left)) === JSON.stringify(toRaw(right))
}

export function useArmoireCharacterProfiles(snapshot: Ref<ArmoireSnapshot | null>) {
  const profiles = ref<ArmoireCharacterProfile[]>([])
  const storageStatus = ref<ArmoireCharacterProfileStorageStatus>('idle')
  const storageError = ref<string | null>(null)
  const switchingProfileKey = ref<string | null>(null)
  const deletingProfileKey = ref<string | null>(null)
  let applyingMergedSnapshot = false

  async function refreshProfiles(): Promise<void> {
    storageStatus.value = 'loading'
    storageError.value = null

    try {
      profiles.value = (await listArmoireSnapshotProfiles()).sort(sortProfiles)
      storageStatus.value = 'ready'
    } catch (error) {
      storageStatus.value = 'error'
      storageError.value = error instanceof Error ? error.message : String(error)
    }
  }

  async function initializeProfiles(): Promise<void> {
    storageStatus.value = 'loading'
    storageError.value = null

    try {
      profiles.value = (await listArmoireSnapshotProfiles()).sort(sortProfiles)

      const storedActiveProfileKey = readActiveProfileKey()

      if (storedActiveProfileKey && activeProfileKey.value !== storedActiveProfileKey) {
        const record = await getArmoireSnapshotRecord(storedActiveProfileKey)

        if (record) {
          snapshot.value = record.snapshot
          profiles.value = [
            record,
            ...profiles.value.filter((profile) => profile.key !== record.key)
          ].sort(sortProfiles)
        } else {
          saveActiveProfileKey(null)
        }
      } else if (!storedActiveProfileKey && snapshot.value) {
        await cacheSnapshot(snapshot.value)
      }

      storageStatus.value = 'ready'
    } catch (error) {
      storageStatus.value = 'error'
      storageError.value = error instanceof Error ? error.message : String(error)
    }
  }

  async function cacheSnapshot(nextSnapshot: ArmoireSnapshot): Promise<void> {
    try {
      const profileKey = getArmoireCharacterProfileKey(nextSnapshot)
      const storedRecord = profileKey ? await getArmoireSnapshotRecord(profileKey) : null
      const mergedSnapshot = mergeSnapshotWithStoredProfile(
        nextSnapshot,
        storedRecord?.snapshot ?? null
      )
      const record = createRecordFromSnapshot(mergedSnapshot)
      record.ignoredItemIds = storedRecord?.ignoredItemIds ?? []

      await putArmoireSnapshotRecord(record)
      saveActiveProfileKey(record.key)
      profiles.value = [
        record,
        ...profiles.value.filter((profile) => profile.key !== record.key)
      ].sort(sortProfiles)
      storageStatus.value = 'ready'
      storageError.value = null

      if (!areSnapshotsEquivalent(nextSnapshot, mergedSnapshot)) {
        applyingMergedSnapshot = true
        snapshot.value = mergedSnapshot
      }
    } catch (error) {
      storageStatus.value = 'error'
      storageError.value = error instanceof Error ? error.message : String(error)
    }
  }

  async function loadProfileSnapshot(key: string): Promise<ArmoireSnapshot | null> {
    switchingProfileKey.value = key
    storageError.value = null

    try {
      const record = await getArmoireSnapshotRecord(key)

      if (!record) {
        await refreshProfiles()
        return null
      }

      saveActiveProfileKey(record.key)
      return record.snapshot
    } catch (error) {
      storageStatus.value = 'error'
      storageError.value = error instanceof Error ? error.message : String(error)
      return null
    } finally {
      switchingProfileKey.value = null
    }
  }

  async function deleteProfile(key: string): Promise<void> {
    deletingProfileKey.value = key
    storageError.value = null

    try {
      await deleteArmoireSnapshotRecord(key)
      profiles.value = profiles.value.filter((profile) => profile.key !== key)

      if (activeProfileKey.value === key) {
        saveActiveProfileKey(null)
      }

      storageStatus.value = 'ready'
    } catch (error) {
      storageStatus.value = 'error'
      storageError.value = error instanceof Error ? error.message : String(error)
    } finally {
      deletingProfileKey.value = null
    }
  }

  watch(snapshot, (nextSnapshot) => {
    if (!nextSnapshot) {
      return
    }

    if (applyingMergedSnapshot) {
      applyingMergedSnapshot = false
      return
    }

    void cacheSnapshot(nextSnapshot)
  })

  onMounted(() => {
    void initializeProfiles()
  })

  const activeProfileKey = computed(() => getArmoireCharacterProfileKey(snapshot.value))

  return {
    profiles: readonly(profiles),
    activeProfileKey,
    storageStatus: readonly(storageStatus),
    storageError: readonly(storageError),
    switchingProfileKey: readonly(switchingProfileKey),
    deletingProfileKey: readonly(deletingProfileKey),
    refreshProfiles,
    loadProfileSnapshot,
    deleteProfile
  }
}
