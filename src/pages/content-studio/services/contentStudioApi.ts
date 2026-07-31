// Content studio API client — typed fetch wrapper for the loopback helper.

import type {
  ApiResult,
  ContentStudioError,
  ContentStudioHealth,
  CreateDraftInput,
  Draft,
  DraftListResponse,
  SaveDraftInput
} from './contentStudioTypes'

const DEFAULT_BASE_URL = '/api/content-studio'

export class ContentStudioApi {
  private baseUrl: string
  private token: string

  constructor(token: string, baseUrl: string = DEFAULT_BASE_URL) {
    this.token = token
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Content-Studio-Token': this.token,
      ...(options.headers as Record<string, string> || {})
    }

    try {
      const response = await fetch(url, { ...options, headers })
      if (response.ok) {
        const data = await response.json() as T
        return { ok: true, data }
      }
      let error: ContentStudioError
      try { error = await response.json() as ContentStudioError }
      catch { error = { error: { code: 'PARSE_ERROR', message: `HTTP ${response.status}` } } }
      return { ok: false, error, status: response.status }
    } catch (err) {
      return { ok: false, error: { error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' } }, status: 0 }
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
    return this.request(`/drafts/${encodeURIComponent(contentId)}`, { method: 'PATCH', body: JSON.stringify(input) })
  }
}
