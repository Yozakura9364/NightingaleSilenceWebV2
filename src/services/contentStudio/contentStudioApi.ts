// Content studio API client — typed fetch wrapper for the loopback helper.

import { ApiError, ApiTimeoutError, useFetch, type ApiRequestOptions } from '@/composables/useFetch'
import type {
  ApiResult,
  ContentStudioError,
  ContentStudioHealth,
  CreateDraftInput,
  Draft,
  DraftListResponse,
  Publication,
  SaveDraftInput
} from './contentStudioTypes'

const DEFAULT_BASE_URL = '/api/content-studio'
const DEFAULT_TIMEOUT_MS = 15000

export class ContentStudioApi {
  private baseUrl: string
  private token: string

  constructor(token: string, baseUrl: string = DEFAULT_BASE_URL) {
    this.token = token
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Content-Studio-Token': this.token,
      ...((options.headers as Record<string, string>) || {})
    }

    try {
      const data = await useFetch().request<T>(url, {
        ...options,
        headers,
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
      })
      return { ok: true, data }
    } catch (err) {
      if (err instanceof ApiError) {
        let error: ContentStudioError
        try {
          error = JSON.parse(err.bodyText) as ContentStudioError
        } catch {
          error = { error: { code: 'PARSE_ERROR', message: `HTTP ${err.status}` } }
        }
        return { ok: false, error, status: err.status }
      }
      if (err instanceof ApiTimeoutError) {
        return { ok: false, error: { error: { code: 'TIMEOUT', message: err.message } }, status: 0 }
      }
      return {
        ok: false,
        error: {
          error: {
            code: 'NETWORK_ERROR',
            message: err instanceof Error ? err.message : 'Network error'
          }
        },
        status: 0
      }
    }
  }

  async health(): Promise<ApiResult<ContentStudioHealth>> {
    return this.request('/health')
  }

  async listDrafts(page = 1, pageSize = 20): Promise<ApiResult<DraftListResponse>> {
    return this.request(`/drafts?page=${page}&pageSize=${pageSize}`)
  }

  async createDraft(input: CreateDraftInput): Promise<ApiResult<Draft>> {
    return this.request('/drafts', { method: 'POST', body: JSON.stringify(input) })
  }

  async getDraft(contentId: string): Promise<ApiResult<Draft>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}`)
  }

  async saveDraft(contentId: string, input: SaveDraftInput): Promise<ApiResult<Draft>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    })
  }

  async deleteDraft(contentId: string): Promise<ApiResult<null>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}`, { method: 'DELETE' })
  }

  async publishDraft(contentId: string, expectedRevision: number): Promise<ApiResult<Publication>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}/publications`, {
      method: 'POST',
      body: JSON.stringify({ expectedRevision })
    })
  }

  async withdrawPublication(contentId: string): Promise<ApiResult<null>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}/publication`, {
      method: 'DELETE'
    })
  }

  async archiveDraft(contentId: string, expectedRevision: number): Promise<ApiResult<Draft>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}/archive`, {
      method: 'POST',
      body: JSON.stringify({ expectedRevision })
    })
  }

  async restoreDraft(contentId: string, expectedRevision: number): Promise<ApiResult<Draft>> {
    return this.request(`/drafts/${encodeURIComponent(contentId)}/restore`, {
      method: 'POST',
      body: JSON.stringify({ expectedRevision })
    })
  }
}

export interface ContentStudioMediaUpload {
  id: string
  publicObjectKey: string
  width: number
  height: number
}

/** 上传媒体文件（二进制流 + token 头）；错误按 useFetch 语义抛出，由调用方处理。 */
export async function uploadContentStudioMedia(
  file: File,
  token: string
): Promise<ContentStudioMediaUpload> {
  const data = await file.arrayBuffer()

  return useFetch().request<ContentStudioMediaUpload>('/api/content-studio/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': file.name,
      'X-Content-Studio-Token': token
    },
    body: data,
    timeoutMs: 30000
  })
}
