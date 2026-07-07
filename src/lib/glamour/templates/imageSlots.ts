import {
  GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID,
  GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID
} from '@/lib/glamour/templates/definitions'

export const GLAMOUR_TEMPLATE_IMAGE_SESSION_STORAGE_KEY = 'nsglamour.templateImageSessionBackup.v2'
export const GLAMOUR_TEMPLATE_IMAGE_LEGACY_SESSION_STORAGE_KEY = 'nsglamour.templateImageSessionBackup.v1'
export const GLAMOUR_TEMPLATE_IMAGE_DB_NAME = 'nsglamour-template-images-v2'
export const GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME = 'images'
export const GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME = 'recentImages'
export const GLAMOUR_TEMPLATE_RECENT_IMAGE_LIMIT = 5

const GLAMOUR_TEMPLATE_IMAGE_DB_KEY_SEPARATOR = '::'
const GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAMES = [
  GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME,
  GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME
] as const
let imageDatabasePromise: Promise<IDBDatabase | null> | null = null
let storagePersistPromise: Promise<boolean> | null = null

export const GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES: Record<string, string[]> = {
  [GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID]: [GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID],
  [GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID]: [GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID]
}

export interface GlamourTemplateImageSessionRecord {
  imageUrl: string
  imageName: string
  sourceUrl: string
  sourceName: string
  updatedAt: number
}

export type GlamourTemplateImageSessionBackup = Record<
  string,
  Record<string, GlamourTemplateImageSessionRecord>
>

export interface GlamourTemplateImageStoreRecord {
  templateId: string
  slotId: string
  imageName: string
  imageUrl: string
  sourceUrl: string
  sourceName: string
  blob: Blob | null
  updatedAt: number
}

export interface GlamourTemplateRecentImageRecord {
  id: string
  imageName: string
  thumbnailUrl: string
  blob: Blob
  updatedAt: number
}

export function getGlamourTemplateEquivalentImageSlotIds(slotId: string): string[] {
  const normalized = String(slotId || '').trim()

  if (!normalized) {
    return []
  }

  return [normalized, ...(GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES[normalized] || [])]
}

export function isGlamourTemplatePersistentImageUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image/')
}

function makeTemplateImageStoreKey(templateId: string, slotId: string): string {
  return `${String(templateId || '').trim()}${GLAMOUR_TEMPLATE_IMAGE_DB_KEY_SEPARATOR}${String(slotId || '').trim()}`
}

function splitTemplateImageStoreKey(key: unknown): { templateId: string; slotId: string } {
  const text = String(key || '')
  const index = text.indexOf(GLAMOUR_TEMPLATE_IMAGE_DB_KEY_SEPARATOR)

  if (index < 0) {
    return { templateId: '', slotId: '' }
  }

  return {
    templateId: text.slice(0, index),
    slotId: text.slice(index + GLAMOUR_TEMPLATE_IMAGE_DB_KEY_SEPARATOR.length)
  }
}

function makeRecentImageStoreKey(): string {
  return `${Date.now()}${GLAMOUR_TEMPLATE_IMAGE_DB_KEY_SEPARATOR}${Math.random().toString(36).slice(2, 10)}`
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve())
    transaction.addEventListener('abort', () => reject(transaction.error))
    transaction.addEventListener('error', () => reject(transaction.error))
  })
}

function openImageDatabase(version?: number): Promise<IDBDatabase | null> {
  if (!('indexedDB' in window)) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const request = version
      ? indexedDB.open(GLAMOUR_TEMPLATE_IMAGE_DB_NAME, version)
      : indexedDB.open(GLAMOUR_TEMPLATE_IMAGE_DB_NAME)

    request.addEventListener('upgradeneeded', () => {
      const db = request.result

      GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      })
    })

    request.addEventListener('success', () => {
      const db = request.result

      const hasRequiredStores = GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAMES.every((storeName) =>
        db.objectStoreNames.contains(storeName)
      )

      if (hasRequiredStores) {
        db.addEventListener('close', () => {
          imageDatabasePromise = null
        })
        resolve(db)
        return
      }

      const nextVersion = db.version + 1
      db.close()
      openImageDatabase(nextVersion).then(resolve)
    })

    request.addEventListener('error', () => resolve(null))
    request.addEventListener('blocked', () => resolve(null))
  })
}

function getImageDatabase(): Promise<IDBDatabase | null> {
  imageDatabasePromise ||= openImageDatabase()
  return imageDatabasePromise
}

async function requestPersistentImageStorage() {
  if (!navigator.storage?.persist) {
    return false
  }

  storagePersistPromise ||= navigator.storage.persist().catch(() => false)
  return storagePersistPromise
}

function normalizeTemplateImageStoreRecord(
  key: IDBValidKey,
  value: unknown
): GlamourTemplateImageStoreRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const { templateId, slotId } = splitTemplateImageStoreKey(key)
  const record = value as Partial<GlamourTemplateImageStoreRecord>
  const blob = record.blob instanceof Blob && record.blob.type.startsWith('image/') ? record.blob : null
  const imageUrl = isGlamourTemplatePersistentImageUrl(record.imageUrl) ? record.imageUrl : ''

  if (!templateId || !slotId || (!imageUrl && !blob)) {
    return null
  }

  return {
    templateId,
    slotId,
    imageName: typeof record.imageName === 'string' ? record.imageName : '',
    imageUrl,
    sourceUrl: isGlamourTemplatePersistentImageUrl(record.sourceUrl) ? record.sourceUrl : '',
    sourceName: typeof record.sourceName === 'string' ? record.sourceName : '',
    blob,
    updatedAt: Number.isFinite(record.updatedAt) ? Number(record.updatedAt) : 0
  }
}

function normalizeTemplateRecentImageRecord(
  key: IDBValidKey,
  value: unknown
): GlamourTemplateRecentImageRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Partial<GlamourTemplateRecentImageRecord>
  const id = typeof record.id === 'string' && record.id.trim() ? record.id : String(key || '')
  const blob = record.blob instanceof Blob && record.blob.type.startsWith('image/') ? record.blob : null
  const thumbnailUrl = isGlamourTemplatePersistentImageUrl(record.thumbnailUrl)
    ? record.thumbnailUrl
    : ''

  if (!id || !blob || !thumbnailUrl) {
    return null
  }

  return {
    id,
    imageName: typeof record.imageName === 'string' ? record.imageName : '',
    thumbnailUrl,
    blob,
    updatedAt: Number.isFinite(record.updatedAt) ? Number(record.updatedAt) : 0
  }
}

function normalizeTemplateImageSessionRecord(value: unknown): GlamourTemplateImageSessionRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Partial<GlamourTemplateImageSessionRecord>

  if (!isGlamourTemplatePersistentImageUrl(record.imageUrl)) {
    return null
  }

  return {
    imageUrl: record.imageUrl,
    imageName: typeof record.imageName === 'string' ? record.imageName : '',
    sourceUrl: isGlamourTemplatePersistentImageUrl(record.sourceUrl) ? record.sourceUrl : '',
    sourceName: typeof record.sourceName === 'string' ? record.sourceName : '',
    updatedAt: Number.isFinite(record.updatedAt) ? Number(record.updatedAt) : 0
  }
}

function readGlamourTemplateImageSessionBackupKey(storageKey: string): GlamourTemplateImageSessionBackup {
  try {
    const raw = JSON.parse(sessionStorage.getItem(storageKey) || '{}')

    if (!raw || typeof raw !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).flatMap(([templateId, slots]) => {
        if (!slots || typeof slots !== 'object') {
          return []
        }

        const normalizedSlots = Object.fromEntries(
          Object.entries(slots as Record<string, unknown>).flatMap(([slotId, record]) => {
            const normalizedRecord = normalizeTemplateImageSessionRecord(record)
            return normalizedRecord ? [[slotId, normalizedRecord]] : []
          })
        )

        return Object.keys(normalizedSlots).length ? [[templateId, normalizedSlots]] : []
      })
    )
  } catch {
    return {}
  }
}

export function readGlamourTemplateImageSessionBackup(): GlamourTemplateImageSessionBackup {
  const legacyBackup = readGlamourTemplateImageSessionBackupKey(GLAMOUR_TEMPLATE_IMAGE_LEGACY_SESSION_STORAGE_KEY)
  const currentBackup = readGlamourTemplateImageSessionBackupKey(GLAMOUR_TEMPLATE_IMAGE_SESSION_STORAGE_KEY)

  return {
    ...legacyBackup,
    ...Object.fromEntries(
      Object.entries(currentBackup).map(([templateId, slots]) => [
        templateId,
        {
          ...(legacyBackup[templateId] || {}),
          ...slots
        }
      ])
    )
  }
}

export function writeGlamourTemplateImageSessionSlot(
  templateId: string,
  slotId: string,
  imageData: {
    imageUrl: string
    imageName?: string
    sourceUrl?: string
    sourceName?: string
  }
) {
  const normalizedTemplateId = String(templateId || '').trim()
  const normalizedSlotId = String(slotId || '').trim()

  if (
    !normalizedTemplateId ||
    !normalizedSlotId ||
    !isGlamourTemplatePersistentImageUrl(imageData.imageUrl)
  ) {
    return
  }

  try {
    const backup = readGlamourTemplateImageSessionBackup()
    backup[normalizedTemplateId] = {
      ...(backup[normalizedTemplateId] || {}),
      [normalizedSlotId]: {
        imageUrl: imageData.imageUrl,
        imageName: imageData.imageName || '',
        sourceUrl: isGlamourTemplatePersistentImageUrl(imageData.sourceUrl) ? imageData.sourceUrl : '',
        sourceName: imageData.sourceName || '',
        updatedAt: Date.now()
      }
    }
    sessionStorage.setItem(GLAMOUR_TEMPLATE_IMAGE_SESSION_STORAGE_KEY, JSON.stringify(backup))
  } catch {
    // Same-tab image backup is best-effort.
  }
}

export async function saveGlamourTemplateImageStoreSlot(options: {
  templateId: string
  slotId: string
  imageName?: string
  imageUrl?: string
  sourceUrl?: string
  sourceName?: string
  blob?: Blob | null
}): Promise<boolean> {
  const normalizedTemplateId = String(options.templateId || '').trim()
  const normalizedSlotId = String(options.slotId || '').trim()
  const blob = options.blob instanceof Blob && options.blob.type.startsWith('image/') ? options.blob : null
  const imageUrl = isGlamourTemplatePersistentImageUrl(options.imageUrl) ? options.imageUrl : ''

  if (!normalizedTemplateId || !normalizedSlotId || (!imageUrl && !blob)) {
    return false
  }

  const db = await getImageDatabase()

  if (!db) {
    return false
  }

  try {
    sessionStorage.removeItem(GLAMOUR_TEMPLATE_IMAGE_LEGACY_SESSION_STORAGE_KEY)
    await requestPersistentImageStorage()
    const transaction = db.transaction(GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME)
    store.put(
      {
        imageName: options.imageName || '',
        imageUrl,
        sourceUrl: isGlamourTemplatePersistentImageUrl(options.sourceUrl) ? options.sourceUrl : '',
        sourceName: options.sourceName || '',
        blob,
        updatedAt: Date.now()
      },
      makeTemplateImageStoreKey(normalizedTemplateId, normalizedSlotId)
    )
    await transactionDone(transaction)
    return true
  } catch {
    return false
  }
}

export async function loadGlamourTemplateImageStoreRecords(
  templateId: string
): Promise<GlamourTemplateImageStoreRecord[]> {
  const normalizedTemplateId = String(templateId || '').trim()

  if (!normalizedTemplateId) {
    return []
  }

  const db = await getImageDatabase()

  if (!db) {
    return []
  }

  try {
    const transaction = db.transaction(GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME, 'readonly')
    const store = transaction.objectStore(GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME)
    const keysRequest = store.getAllKeys()
    const valuesRequest = store.getAll()
    const [keys, values] = await Promise.all([
      requestToPromise(keysRequest),
      requestToPromise(valuesRequest)
    ])
    const records: GlamourTemplateImageStoreRecord[] = []

    keys.forEach((key, index) => {
      const { templateId: keyTemplateId, slotId } = splitTemplateImageStoreKey(key)

      if (keyTemplateId !== normalizedTemplateId || !slotId) {
        return
      }

      const record = normalizeTemplateImageStoreRecord(key, values[index])

      if (record) {
        records.push(record)
      }
    })
    await transactionDone(transaction)
    return records.sort((a, b) => a.slotId.localeCompare(b.slotId))
  } catch {
    return []
  }
}

export async function deleteGlamourTemplateImageStoreSlot(
  templateId: string,
  slotId: string
): Promise<boolean> {
  const key = makeTemplateImageStoreKey(templateId, slotId)

  if (key === GLAMOUR_TEMPLATE_IMAGE_DB_KEY_SEPARATOR) {
    return false
  }

  const db = await getImageDatabase()

  if (!db) {
    return false
  }

  try {
    const transaction = db.transaction(GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME, 'readwrite')
    transaction.objectStore(GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME).delete(key)
    await transactionDone(transaction)
    return true
  } catch {
    return false
  }
}

export async function saveGlamourTemplateRecentImage(options: {
  imageName?: string
  thumbnailUrl?: string
  blob?: Blob | null
}): Promise<boolean> {
  const blob = options.blob instanceof Blob && options.blob.type.startsWith('image/') ? options.blob : null
  const thumbnailUrl = isGlamourTemplatePersistentImageUrl(options.thumbnailUrl) ? options.thumbnailUrl : ''

  if (!blob || !thumbnailUrl) {
    return false
  }

  const db = await getImageDatabase()

  if (!db) {
    return false
  }

  try {
    await requestPersistentImageStorage()
    const transaction = db.transaction(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME)
    const id = makeRecentImageStoreKey()

    store.put(
      {
        id,
        imageName: options.imageName || '',
        thumbnailUrl,
        blob,
        updatedAt: Date.now()
      },
      id
    )
    await transactionDone(transaction)
    await pruneGlamourTemplateRecentImages()
    return true
  } catch {
    return false
  }
}

async function pruneGlamourTemplateRecentImages(): Promise<void> {
  const records = await loadGlamourTemplateRecentImages()
  const expiredRecords = records.slice(GLAMOUR_TEMPLATE_RECENT_IMAGE_LIMIT)

  if (!expiredRecords.length) {
    return
  }

  const db = await getImageDatabase()

  if (!db) {
    return
  }

  const transaction = db.transaction(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME)
  expiredRecords.forEach((record) => {
    store.delete(record.id)
  })
  await transactionDone(transaction)
}

export async function loadGlamourTemplateRecentImages(): Promise<GlamourTemplateRecentImageRecord[]> {
  const db = await getImageDatabase()

  if (!db) {
    return []
  }

  try {
    const transaction = db.transaction(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME, 'readonly')
    const store = transaction.objectStore(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME)
    const keysRequest = store.getAllKeys()
    const valuesRequest = store.getAll()
    const [keys, values] = await Promise.all([
      requestToPromise(keysRequest),
      requestToPromise(valuesRequest)
    ])

    await transactionDone(transaction)
    return keys
      .map((key, index) => normalizeTemplateRecentImageRecord(key, values[index]))
      .filter((record): record is GlamourTemplateRecentImageRecord => Boolean(record))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export async function clearGlamourTemplateRecentImages(): Promise<boolean> {
  const db = await getImageDatabase()

  if (!db) {
    return false
  }

  try {
    const transaction = db.transaction(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME, 'readwrite')
    transaction.objectStore(GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME).clear()
    await transactionDone(transaction)
    return true
  } catch {
    return false
  }
}

export function findGlamourTemplateImageSessionRecord(
  templateId: string,
  slotId: string
): GlamourTemplateImageSessionRecord | null {
  const backup = readGlamourTemplateImageSessionBackup()
  const equivalentSlotIds = getGlamourTemplateEquivalentImageSlotIds(slotId)
  const directTemplate = backup[templateId]

  for (const equivalentSlotId of equivalentSlotIds) {
    const record = directTemplate?.[equivalentSlotId]

    if (record) {
      return record
    }
  }

  return null
}
