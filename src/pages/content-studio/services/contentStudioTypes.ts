// Content studio API types — mirrors contracts/content-api.openapi.yaml

export interface ContentStudioHealth {
  ok: true
  service: 'content-studio'
}

export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface MetadataInput {
  title: string
  summary?: string | null
  coverMediaId?: string | null
  tags: string[]
}

export interface DraftSummary {
  id: string
  publicId: number
  title: string
  status: ContentStatus
  revision: number
  updatedAt: string
  publishedAt: string | null
}

export interface Draft {
  id: string
  publicId: number
  title: string
  status: ContentStatus
  revision: number
  updatedAt: string
  publishedAt: string | null
  metadata: MetadataInput
  document: unknown
  media: unknown[]
  createdAt: string
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface DraftListResponse {
  data: DraftSummary[]
  pagination: Pagination
}

export interface CreateDraftInput {
  metadata: MetadataInput
  document: unknown
}

export interface SaveDraftInput {
  expectedRevision: number
  metadata: MetadataInput
  document: unknown
}

export interface ContentStudioError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ContentStudioError; status: number }
