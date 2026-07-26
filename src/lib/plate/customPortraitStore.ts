import type { NSPlateCustomPortraitImage } from '@/lib/plate/types'

const DATABASE_NAME = 'nsplate-custom-portraits-v1'
const DATABASE_VERSION = 1
const STORE_NAME = 'pairedImages'

interface StoredPairedPortrait {
  base: Blob
  overlay: Blob
  updatedAt: number
}

let databasePromise: Promise<IDBDatabase | null> | null = null

export async function saveNSPlatePairedPortrait(
  portrait: NSPlateCustomPortraitImage
): Promise<string | null> {
  if (portrait.mode !== 'paired' || !portrait.dataUrl || !portrait.overlayDataUrl) {
    return null
  }

  const database = await getDatabase()

  if (!database) {
    return null
  }

  const storageKey = portrait.storageKey ?? `paired:${portrait.id}`

  try {
    const [base, overlay] = await Promise.all([
      dataUrlToBlob(portrait.dataUrl),
      dataUrlToBlob(portrait.overlayDataUrl)
    ])
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction
      .objectStore(STORE_NAME)
      .put({ base, overlay, updatedAt: Date.now() } satisfies StoredPairedPortrait, storageKey)
    await transactionDone(transaction)
    void navigator.storage?.persist?.().catch(() => false)
    return storageKey
  } catch {
    return null
  }
}

export async function loadNSPlatePairedPortrait(
  portrait: NSPlateCustomPortraitImage
): Promise<NSPlateCustomPortraitImage | null> {
  if (portrait.mode !== 'paired' || !portrait.storageKey) {
    return portrait.mode === 'paired' && portrait.overlayDataUrl ? portrait : null
  }

  const database = await getDatabase()

  if (!database) {
    return null
  }

  try {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(portrait.storageKey)
    const value = await requestToPromise<unknown>(request)
    await transactionDone(transaction)

    if (!isStoredPairedPortrait(value)) {
      return null
    }

    const [dataUrl, overlayDataUrl] = await Promise.all([
      blobToDataUrl(value.base),
      blobToDataUrl(value.overlay)
    ])
    return { ...portrait, dataUrl, overlayDataUrl }
  } catch {
    return null
  }
}

export async function deleteNSPlatePairedPortrait(storageKey: string | undefined) {
  if (!storageKey) {
    return
  }

  const database = await getDatabase()

  if (!database) {
    return
  }

  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(storageKey)
    await transactionDone(transaction)
  } catch {
    // Image cleanup is best-effort.
  }
}

function getDatabase() {
  databasePromise ||= openDatabase()
  return databasePromise
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    })
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => resolve(null))
    request.addEventListener('blocked', () => resolve(null))
  })
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve())
    transaction.addEventListener('abort', () => reject(transaction.error))
    transaction.addEventListener('error', () => reject(transaction.error))
  })
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded = ''] = dataUrl.split(',', 2)
  const mimeType = /^data:([^;,]+)/.exec(header)?.[1] ?? 'application/octet-stream'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(blob)
  })
}

function isStoredPairedPortrait(value: unknown): value is StoredPairedPortrait {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Partial<StoredPairedPortrait>
  return record.base instanceof Blob && record.overlay instanceof Blob
}
