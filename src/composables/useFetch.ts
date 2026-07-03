import { useLocale } from '@/stores/locale'

export type ApiResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'response'

export type QueryValue = string | number | boolean | null | undefined

export interface ApiRequestOptions extends RequestInit {
  json?: unknown
  query?: Record<string, QueryValue | QueryValue[]>
  responseType?: ApiResponseType
}

export class ApiError extends Error {
  readonly status: number
  readonly statusText: string
  readonly url: string
  readonly bodyText: string

  constructor(response: Response, bodyText: string) {
    super(`API ${response.status}: ${response.url}`)
    this.name = 'ApiError'
    this.status = response.status
    this.statusText = response.statusText
    this.url = response.url
    this.bodyText = bodyText
  }
}

function appendQuery(url: string, query?: ApiRequestOptions['query']): string {
  if (!query) {
    return url
  }

  const [path, hash = ''] = url.split('#')
  const [base, search = ''] = path.split('?')
  const params = new URLSearchParams(search)

  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value]
    params.delete(key)

    for (const item of values) {
      if (item === null || item === undefined) {
        continue
      }

      params.append(key, String(item))
    }
  }

  const queryText = params.toString()
  const nextUrl = queryText ? `${base}?${queryText}` : base
  return hash ? `${nextUrl}#${hash}` : nextUrl
}

function createHeaders(options: {
  headers?: HeadersInit
  locale: string
  responseType: ApiResponseType
  hasJsonBody: boolean
}): Headers {
  const headers = new Headers(options.headers)

  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', options.locale)
  }

  if (options.responseType === 'json' && !headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (options.hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

async function parseResponse<T>(response: Response, responseType: ApiResponseType): Promise<T> {
  if (responseType === 'response') {
    return response as T
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (responseType === 'text') {
    return (await response.text()) as T
  }

  if (responseType === 'blob') {
    return (await response.blob()) as T
  }

  if (responseType === 'arrayBuffer') {
    return (await response.arrayBuffer()) as T
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export function joinApiPath(basePath: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedBase = basePath.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function useFetch() {
  const { current } = useLocale()

  async function request<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      headers: requestHeaders,
      json,
      query,
      responseType = 'json',
      body: requestBody,
      ...requestInit
    } = options
    const hasJsonBody = json !== undefined
    const body = hasJsonBody ? JSON.stringify(json) : requestBody
    const headers = createHeaders({
      headers: requestHeaders,
      locale: current.value,
      responseType,
      hasJsonBody
    })

    const response = await fetch(appendQuery(url, query), {
      ...requestInit,
      body,
      headers
    })

    if (!response.ok) {
      throw new ApiError(response, await readErrorBody(response))
    }

    return parseResponse<T>(response, responseType)
  }

  function api<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    return request<T>(url, { ...options, responseType: 'json' })
  }

  function text(url: string, options: ApiRequestOptions = {}): Promise<string> {
    return request<string>(url, { ...options, responseType: 'text' })
  }

  function blob(url: string, options: ApiRequestOptions = {}): Promise<Blob> {
    return request<Blob>(url, { ...options, responseType: 'blob' })
  }

  function createClient(basePath: string) {
    return {
      basePath,
      request: <T = unknown>(path: string, options: ApiRequestOptions = {}) =>
        request<T>(joinApiPath(basePath, path), options),
      api: <T = unknown>(path: string, options: ApiRequestOptions = {}) =>
        api<T>(joinApiPath(basePath, path), options),
      text: (path: string, options: ApiRequestOptions = {}) =>
        text(joinApiPath(basePath, path), options),
      blob: (path: string, options: ApiRequestOptions = {}) =>
        blob(joinApiPath(basePath, path), options)
    }
  }

  return { request, api, text, blob, createClient }
}
