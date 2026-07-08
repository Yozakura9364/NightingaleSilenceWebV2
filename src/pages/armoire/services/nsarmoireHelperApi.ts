import { isArmoireCatalog } from '@/lib/armoire/catalog'
import {
  normalizeArmoireSnapshot,
  type ArmoireSnapshotErrorCode
} from '@/lib/armoire/normalizeSnapshot'
import type { ArmoireCatalog, ArmoireSnapshot } from '@/lib/armoire/types'

export const NSARMOIRE_HELPER_PORT = 8015
const NSARMOIRE_HELPER_LOOPBACK_HOST = ['127', '0', '0', '1'].join('.')
export const NSARMOIRE_HELPER_DIRECT_BASE_URL = new URL(
  `http://${NSARMOIRE_HELPER_LOOPBACK_HOST}:${NSARMOIRE_HELPER_PORT}`
).toString().replace(/\/$/, '')
export const NSARMOIRE_HELPER_PROXY_BASE_URL = '/api/armoire'
export const NSARMOIRE_BUTLER_PROTOCOL_URL = 'nsarmoire-butler://start'
export const NSARMOIRE_BUTLER_RELEASE_URL =
  'https://github.com/Yozakura9364/NSArmoireButler/releases/latest'

export interface ArmoireHelperHealth {
  ok: boolean
  helperVersion: string
  status: string
  statusMessage: string
  gameProcessFound: boolean
  dresserLocated: boolean
  dresserLoaded: boolean
  catalogLocated?: boolean
  catalogCabinetEntryCount?: number
  supportedContainers: string[]
  selectedPid?: number | null
  gameProcessCount?: number
}

export interface ArmoireHelperProbe {
  ok: boolean
  helperVersion: string
  gameProcessFound: boolean
  selectedPid?: number | null
  snapshotContentHash?: string | null
  character: {
    located: boolean
    loaded: boolean
    name?: string | null
    worldId?: number | null
    worldName?: string | null
    status: string
  }
  dresserLocated: boolean
  dresserLoaded: boolean
  cabinet?: ArmoireHelperCabinetProbe | null
  inventoryLocated: boolean
  retainerManagerLocated: boolean
  inventoryContainerTableLocated: boolean
  retainers: ArmoireHelperRetainerProbe[]
  retainerCaches: ArmoireHelperRetainerCacheProbe[]
  containers?: ArmoireHelperContainerProbe[]
}

export interface ArmoireHelperCabinetProbe {
  located: boolean
  loaded: boolean
  state?: number | null
  byteCount?: number | null
  unlockedBitCount: number
  catalogLocated: boolean
  mappedItemCount: number
  status: string
}

export interface ArmoireHelperContainerProbe {
  key: string
  container: string
  containerName?: string | null
  inventoryType?: number | null
  located: boolean
  loaded: boolean
  size?: number | null
  itemCount: number
  status: string
}

export interface ArmoireHelperRetainerProbe {
  slot: number
  retainerId: number
  name: string
  jobId: number
  level: number
  itemCount: number
  marketItemCount: number
  available: boolean
  ventureId: number
  ventureComplete: number
  isActive: boolean
  inventoryCached: boolean
  cachedItemCount: number
  cachedAt?: string | null
}

export interface ArmoireHelperRetainerCacheProbe {
  retainerId: string
  retainerName: string
  itemCount: number
  updatedAt: string
}

export interface ArmoireHelperProcess {
  pid: number
  processName: string
  displayName: string
  windowTitle?: string | null
  startedAt?: string | null
  isSelected: boolean
  isReadable: boolean
  status: string
  statusMessage: string
}

interface ArmoireHelperErrorPayload {
  error?: string
  message?: string
}

interface ArmoireHelperProcessListPayload {
  processes?: ArmoireHelperProcess[]
}

export class ArmoireHelperApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ArmoireHelperApiError'
    this.code = code
    this.status = status
  }
}

export class ArmoireHelperSnapshotError extends Error {
  readonly code: ArmoireSnapshotErrorCode

  constructor(code: ArmoireSnapshotErrorCode, message: string) {
    super(message)
    this.name = 'ArmoireHelperSnapshotError'
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getHelperBaseUrl(): string {
  return import.meta.env.DEV ? NSARMOIRE_HELPER_PROXY_BASE_URL : NSARMOIRE_HELPER_DIRECT_BASE_URL
}

export function getArmoireHelperDisplayUrl(): string {
  return NSARMOIRE_HELPER_DIRECT_BASE_URL
}

function buildHelperUrl(path: string): string {
  const baseUrl = getHelperBaseUrl().replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

async function requestHelperJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildHelperUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers
    }
  })

  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const errorPayload = isRecord(payload) ? (payload as ArmoireHelperErrorPayload) : {}
    const code = errorPayload.error || `http_${response.status}`
    const message = errorPayload.message || `${response.status} ${response.statusText}`
    throw new ArmoireHelperApiError(code, message, response.status)
  }

  return payload as T
}

export async function fetchArmoireHelperHealth(): Promise<ArmoireHelperHealth> {
  return requestHelperJson<ArmoireHelperHealth>('/health')
}

export async function fetchArmoireHelperProbe(): Promise<ArmoireHelperProbe> {
  return requestHelperJson<ArmoireHelperProbe>('/probe')
}

export async function fetchArmoireHelperProcesses(): Promise<ArmoireHelperProcess[]> {
  const payload = await requestHelperJson<ArmoireHelperProcessListPayload>('/processes')
  return Array.isArray(payload.processes) ? payload.processes : []
}

export async function selectArmoireHelperProcess(pid: number): Promise<ArmoireHelperHealth> {
  return requestHelperJson<ArmoireHelperHealth>('/process/select', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pid })
  })
}

export async function clearArmoireHelperRetainerCache(): Promise<ArmoireHelperHealth> {
  return requestHelperJson<ArmoireHelperHealth>('/retainer-cache/clear', {
    method: 'POST'
  })
}

export async function fetchArmoireHelperCatalog(): Promise<ArmoireCatalog> {
  const payload = await requestHelperJson<unknown>('/catalog')
  if (!isArmoireCatalog(payload)) {
    throw new ArmoireHelperApiError('invalid_catalog', 'invalid armoire catalog', 502)
  }

  return payload
}

export async function fetchArmoireHelperSnapshot(): Promise<ArmoireSnapshot> {
  return normalizeHelperSnapshot(await requestHelperJson<unknown>('/snapshot'))
}

export async function refreshArmoireHelperSnapshot(): Promise<ArmoireSnapshot> {
  return normalizeHelperSnapshot(
    await requestHelperJson<unknown>('/snapshot/refresh', {
      method: 'POST'
    })
  )
}

export async function shutdownArmoireHelper(): Promise<void> {
  await requestHelperJson<unknown>('/shutdown', {
    method: 'POST'
  })
}

function normalizeHelperSnapshot(payload: unknown): ArmoireSnapshot {
  try {
    return normalizeArmoireSnapshot(payload)
  } catch (error) {
    if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
      throw new ArmoireHelperSnapshotError(error.code as ArmoireSnapshotErrorCode, error.message)
    }

    throw error
  }
}
