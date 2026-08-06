import type {
  ItemCardCanvasBackground,
  ItemCardCanvasDocument,
  ItemCardCanvasLayer,
  ItemCardCanvasViewport
} from '@/pages/item-card/lib/canvasTypes'

// IndexedDB 数据库名；画布背景与图层 Blob 只保存在浏览器本地，不写入 localStorage。
const DATABASE_NAME = 'nsitemcard.canvas.v1'
const DATABASE_VERSION = 1
const STORE_NAME = 'documents'
const DOCUMENT_KEY = 'current'

let databasePromise: Promise<IDBDatabase | null> | null = null

function createEmptyDocument(): ItemCardCanvasDocument {
  return {
    version: 1,
    layers: [],
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 }
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeViewport(value: unknown): ItemCardCanvasViewport {
  const record = (value || {}) as Partial<ItemCardCanvasViewport>
  return {
    zoom: isFiniteNumber(record.zoom) && record.zoom > 0 ? record.zoom : 1,
    offsetX: isFiniteNumber(record.offsetX) ? record.offsetX : 0,
    offsetY: isFiniteNumber(record.offsetY) ? record.offsetY : 0
  }
}

function normalizeBackground(value: unknown): ItemCardCanvasBackground | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const record = value as Partial<ItemCardCanvasBackground>
  if (
    !(record.blob instanceof Blob) ||
    !isFiniteNumber(record.width) ||
    !isFiniteNumber(record.height) ||
    record.width <= 0 ||
    record.height <= 0
  ) {
    return undefined
  }
  return {
    name: String(record.name || ''),
    blob: record.blob,
    width: record.width,
    height: record.height
  }
}

function normalizeLayer(value: unknown): ItemCardCanvasLayer | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const record = value as Partial<ItemCardCanvasLayer>
  if (
    !String(record.id || '').trim() ||
    (record.type !== 'item' && record.type !== 'customText') ||
    !(record.blob instanceof Blob) ||
    !isFiniteNumber(record.width) ||
    !isFiniteNumber(record.height) ||
    record.width <= 0 ||
    record.height <= 0
  ) {
    return undefined
  }
  return {
    id: String(record.id),
    name: String(record.name || ''),
    type: record.type,
    sourceId: String(record.sourceId || ''),
    blob: record.blob,
    width: record.width,
    height: record.height,
    x: isFiniteNumber(record.x) ? record.x : 0,
    y: isFiniteNumber(record.y) ? record.y : 0,
    scale: isFiniteNumber(record.scale) && record.scale > 0 ? record.scale : 1,
    zIndex: isFiniteNumber(record.zIndex) ? record.zIndex : 0
  }
}

function normalizeDocument(value: unknown): ItemCardCanvasDocument | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const record = value as Partial<ItemCardCanvasDocument>
  if (record.version !== 1 || !Array.isArray(record.layers)) {
    return null
  }
  const layers = record.layers
    .map(normalizeLayer)
    .filter((layer): layer is ItemCardCanvasLayer => Boolean(layer))
  const selectedLayerId = String(record.selectedLayerId || '')
  return {
    version: 1,
    background: normalizeBackground(record.background),
    layers,
    viewport: normalizeViewport(record.viewport),
    selectedLayerId: layers.some((layer) => layer.id === selectedLayerId)
      ? selectedLayerId
      : undefined
  }
}

export async function readItemCardCanvasDocument(): Promise<ItemCardCanvasDocument | null> {
  const database = await getDatabase()
  if (!database) {
    return null
  }
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(DOCUMENT_KEY)
    const value = await requestToPromise<unknown>(request)
    await transactionDone(transaction)
    return normalizeDocument(value)
  } catch {
    return null
  }
}

// 返回 false 表示 IndexedDB 不可用，调用方降级为仅内存状态。
export async function writeItemCardCanvasDocument(
  document: ItemCardCanvasDocument
): Promise<boolean> {
  const database = await getDatabase()
  if (!database) {
    return false
  }
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(document, DOCUMENT_KEY)
    await transactionDone(transaction)
    return true
  } catch {
    return false
  }
}

export async function clearItemCardCanvasDocument() {
  const database = await getDatabase()
  if (!database) {
    return
  }
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(DOCUMENT_KEY)
    await transactionDone(transaction)
  } catch {
    // 清理失败时下次启动仍会读取旧文档，由调用方覆盖。
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

export { createEmptyDocument }
