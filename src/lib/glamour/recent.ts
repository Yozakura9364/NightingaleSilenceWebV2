import { draftToGlamourPayload, getFilledGlamourDraftEntries } from '@/lib/glamour/draft'
import { GLAMOUR_DEFAULT_LOCALE } from '@/lib/glamour/equipment'
import type { GlamourDraft, GlamourRecentSnapshot } from '@/lib/glamour/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function normalizeRecentSnapshot(value: unknown, index: number): GlamourRecentSnapshot | undefined {
  if (!isRecord(value) || !isRecord(value.parsed) || !Array.isArray(value.parsed.resolved_equipment)) {
    return undefined
  }

  const sourceName = normalizeGlamourConfigName(value.sourceName || value.displayName)
  const displayName = normalizeGlamourConfigName(value.displayName || sourceName)
  const savedAt = typeof value.savedAt === 'string' && value.savedAt ? value.savedAt : new Date(0).toISOString()
  const id =
    typeof value.id === 'string' && value.id
      ? value.id
      : `legacy-${index}-${savedAt}-${sourceName}`.replace(/\s+/g, '-')

  return {
    id,
    savedAt,
    sourceName,
    displayName,
    sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : '',
    parsed: value.parsed,
    locale: typeof value.locale === 'string' && value.locale ? value.locale : GLAMOUR_DEFAULT_LOCALE,
    copyFormat: typeof value.copyFormat === 'string' ? value.copyFormat : undefined,
    customTemplate: typeof value.customTemplate === 'string' ? value.customTemplate : undefined,
    snapshotId: typeof value.snapshotId === 'string' ? value.snapshotId : undefined,
    snapshotUrl: typeof value.snapshotUrl === 'string' ? value.snapshotUrl : undefined,
    snapshotKey: typeof value.snapshotKey === 'string' ? value.snapshotKey : undefined
  }
}

export function normalizeGlamourConfigName(value: unknown): string {
  const text = String(value || '').trim()
  return text || '未命名'
}

export function formatGlamourRecentTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getGlamourRecentSnapshotCount(item: GlamourRecentSnapshot): number {
  return Array.isArray(item.parsed?.resolved_equipment) ? item.parsed.resolved_equipment.length : 0
}

export function createGlamourRecentSnapshot(
  draft: GlamourDraft,
  options: {
    name: string
    copyFormat: string
    customTemplate: string
  }
): GlamourRecentSnapshot | undefined {
  if (!getFilledGlamourDraftEntries(draft).length) {
    return undefined
  }

  const displayName = normalizeGlamourConfigName(options.name)
  const parsed = draftToGlamourPayload(draft)

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: new Date().toISOString(),
    sourceName: displayName,
    displayName,
    sourceUrl: typeof draft.source?.url === 'string' ? draft.source.url : '',
    parsed: cloneJson(parsed),
    locale: draft.locale || draft.source?.locale || GLAMOUR_DEFAULT_LOCALE,
    copyFormat: options.copyFormat,
    customTemplate: options.customTemplate
  }
}
