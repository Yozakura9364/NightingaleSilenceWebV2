import { ArmoireSnapshotError, normalizeArmoireSnapshot } from '@/lib/armoire/normalizeSnapshot'
import type {
  ArmoireContainerKind,
  ArmoireSnapshot,
  ArmoireSnapshotSource
} from '@/lib/armoire/types'
import { ARMOIRE_CONTAINER_KINDS } from '@/lib/armoire/types'

const DATABASE_NAME = 'nsarmoire-character-cache'
const DATABASE_VERSION = 1
const SNAPSHOT_STORE_NAME = 'snapshots'

export interface ArmoireStoredSnapshotProfile {
  key: string
  name?: string
  world?: string
  dataCenter?: string
  source: ArmoireSnapshotSource
  lastDataAt: string
  cachedAt: string
  entryCount: number
  containers: readonly ArmoireContainerKind[]
  retainerNames: readonly string[]
  retainerCount: number
  ignoredItemIds: readonly number[]
}

export interface ArmoireStoredSnapshotRecord extends ArmoireStoredSnapshotProfile {
  snapshot: ArmoireSnapshot
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : undefined
}

function isContainerKind(value: unknown): value is ArmoireContainerKind {
  return ARMOIRE_CONTAINER_KINDS.includes(value as ArmoireContainerKind)
}

function normalizeItemIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value.filter((itemId): itemId is number => Number.isInteger(itemId) && itemId > 0)
    )
  ).sort((left, right) => left - right)
}

function normalizeStoredProfile(value: unknown): ArmoireStoredSnapshotProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const key = normalizeString(value.key, 160)
  const source = normalizeString(value.source, 40) as ArmoireSnapshotSource | undefined
  const lastDataAt = normalizeString(value.lastDataAt, 80)
  const cachedAt = normalizeString(value.cachedAt, 80)

  if (!key || !source || !lastDataAt || !cachedAt) {
    return null
  }

  return {
    key,
    name: normalizeString(value.name, 80),
    world: normalizeString(value.world, 80),
    dataCenter: normalizeString(value.dataCenter, 80),
    source,
    lastDataAt,
    cachedAt,
    entryCount:
      typeof value.entryCount === 'number' &&
      Number.isInteger(value.entryCount) &&
      value.entryCount >= 0
        ? value.entryCount
        : 0,
    containers: Array.isArray(value.containers) ? value.containers.filter(isContainerKind) : [],
    retainerNames: Array.isArray(value.retainerNames)
      ? value.retainerNames
          .map((name) => normalizeString(name, 80))
          .filter((name): name is string => Boolean(name))
      : [],
    retainerCount:
      typeof value.retainerCount === 'number' &&
      Number.isInteger(value.retainerCount) &&
      value.retainerCount >= 0
        ? value.retainerCount
        : 0,
    ignoredItemIds: normalizeItemIds(value.ignoredItemIds)
  }
}

function normalizeStoredRecord(value: unknown): ArmoireStoredSnapshotRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const profile = normalizeStoredProfile(value)

  if (!profile) {
    return null
  }

  try {
    return {
      ...profile,
      snapshot: normalizeArmoireSnapshot(value.snapshot)
    }
  } catch (error) {
    if (error instanceof ArmoireSnapshotError) {
      return null
    }

    throw error
  }
}

function createUnavailableError(): Error {
  return new Error('IndexedDB is not available')
}

function openSnapshotDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(createUnavailableError())
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) {
        const store = database.createObjectStore(SNAPSHOT_STORE_NAME, { keyPath: 'key' })
        store.createIndex('lastDataAt', 'lastDataAt')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

async function withSnapshotStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openSnapshotDatabase()

  try {
    const transaction = database.transaction(SNAPSHOT_STORE_NAME, mode)
    const store = transaction.objectStore(SNAPSHOT_STORE_NAME)
    return await requestToPromise(callback(store))
  } finally {
    database.close()
  }
}

export async function putArmoireSnapshotRecord(record: ArmoireStoredSnapshotRecord): Promise<void> {
  await withSnapshotStore('readwrite', (store) => store.put(record))
}

export async function updateArmoireSnapshotIgnoredItemIds(
  key: string,
  itemIds: readonly number[]
): Promise<void> {
  const record = await getArmoireSnapshotRecord(key)

  if (!record) {
    throw new Error('Armoire profile is not cached')
  }

  await putArmoireSnapshotRecord({
    ...record,
    ignoredItemIds: normalizeItemIds(itemIds)
  })
}

export async function getArmoireSnapshotRecord(
  key: string
): Promise<ArmoireStoredSnapshotRecord | null> {
  const record = await withSnapshotStore('readonly', (store) => store.get(key))
  return normalizeStoredRecord(record)
}

export async function listArmoireSnapshotProfiles(): Promise<ArmoireStoredSnapshotProfile[]> {
  const records = await withSnapshotStore('readonly', (store) => store.getAll())

  return records
    .map(normalizeStoredProfile)
    .filter((profile): profile is ArmoireStoredSnapshotProfile => Boolean(profile))
}

export async function deleteArmoireSnapshotRecord(key: string): Promise<void> {
  await withSnapshotStore('readwrite', (store) => store.delete(key))
}
