export interface CommunityEvent {
  id: string
  title: string
  url: string
  startsAt: string
  endsAt?: string
  timezone?: string
  region?: CommunityEventRegion
}

export type CommunityEventRegion = 'common' | 'cn' | 'global'

export interface CommunityEventsDocument {
  schemaVersion: 1
  updatedAt: string | null
  events: CommunityEvent[]
}

export type CommunityEventState = 'upcoming' | 'active' | 'ended'

export interface CommunityEventStatus extends CommunityEvent {
  state: CommunityEventState
  startsAtMs: number
  endsAtMs?: number
}

export interface CommunityEventStatusOptions {
  includeEnded?: boolean
}

const EVENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/
const ISO_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:\d{2})$/
const MAX_EVENT_COUNT = 100

function isSafeEventUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function parseCommunityEventsDocument(value: unknown): CommunityEventsDocument {
  if (!value || typeof value !== 'object') {
    throw new Error('社区活动数据不是对象')
  }

  const document = value as Partial<CommunityEventsDocument>

  if (document.schemaVersion !== 1 || !Array.isArray(document.events)) {
    throw new Error('社区活动数据版本不受支持')
  }

  if (
    document.updatedAt !== null &&
    (typeof document.updatedAt !== 'string' ||
      !ISO_TIMEZONE_PATTERN.test(document.updatedAt) ||
      !Number.isFinite(Date.parse(document.updatedAt)))
  ) {
    throw new Error('社区活动更新时间无效')
  }

  if (document.events.length > MAX_EVENT_COUNT) {
    throw new Error('社区活动数量不能超过 ' + MAX_EVENT_COUNT + ' 条')
  }

  const events = document.events.map((event, index) => {
    if (!event || typeof event !== 'object') {
      throw new Error('社区活动第 ' + (index + 1) + ' 项格式错误')
    }

    const item = event as Partial<CommunityEvent>
    const { id, title, url, startsAt, endsAt, timezone, region } = item

    if (
      typeof id !== 'string' ||
      !EVENT_ID_PATTERN.test(id) ||
      typeof title !== 'string' ||
      title.length === 0 ||
      title.length > 120 ||
      typeof url !== 'string' ||
      typeof startsAt !== 'string'
    ) {
      throw new Error('社区活动第 ' + (index + 1) + ' 项缺少有效字段')
    }

    const startsAtMs = Date.parse(startsAt)
    const endsAtMs = endsAt ? Date.parse(endsAt) : undefined

    if (!Number.isFinite(startsAtMs)) {
      throw new Error('社区活动第 ' + (index + 1) + ' 项缺少有效字段')
    }

    if (!isSafeEventUrl(url) || url.length > 2048) {
      throw new Error('社区活动第 ' + (index + 1) + ' 项链接无效')
    }

    if (
      timezone !== undefined &&
      (typeof timezone !== 'string' || timezone.length === 0 || timezone.length > 64)
    ) {
      throw new Error('社区活动第 ' + (index + 1) + ' 项时区名称无效')
    }

    if (region !== undefined && region !== 'common' && region !== 'cn' && region !== 'global') {
      throw new Error('社区活动第 ' + (index + 1) + ' 项区服无效')
    }

    if (!ISO_TIMEZONE_PATTERN.test(startsAt) || (endsAt && !ISO_TIMEZONE_PATTERN.test(endsAt))) {
      throw new Error('社区活动第 ' + (index + 1) + ' 项必须包含时区')
    }

    if (endsAtMs !== undefined && (!Number.isFinite(endsAtMs) || endsAtMs <= startsAtMs)) {
      throw new Error('社区活动第 ' + (index + 1) + ' 项结束时间无效')
    }

    return {
      id,
      title,
      url,
      startsAt,
      ...(endsAt ? { endsAt } : {}),
      ...(timezone ? { timezone } : {}),
      ...(region ? { region } : {})
    }
  })

  const ids = new Set<string>()
  for (const event of events) {
    if (ids.has(event.id)) {
      throw new Error('社区活动 ID 重复：' + event.id)
    }
    ids.add(event.id)
  }

  return {
    schemaVersion: 1,
    updatedAt: document.updatedAt,
    events
  }
}

export function getCommunityEventStatuses(
  document: CommunityEventsDocument,
  now: number,
  options: CommunityEventStatusOptions = {}
): CommunityEventStatus[] {
  return document.events
    .map((event) => {
      const startsAtMs = Date.parse(event.startsAt)
      const endsAtMs = event.endsAt ? Date.parse(event.endsAt) : undefined
      const state: CommunityEventState =
        now < startsAtMs
          ? 'upcoming'
          : endsAtMs !== undefined && now >= endsAtMs
            ? 'ended'
            : 'active'

      return { ...event, state, startsAtMs, ...(endsAtMs !== undefined ? { endsAtMs } : {}) }
    })
    .filter((event) => options.includeEnded || event.state !== 'ended')
    .sort((left, right) => left.startsAtMs - right.startsAtMs)
}
