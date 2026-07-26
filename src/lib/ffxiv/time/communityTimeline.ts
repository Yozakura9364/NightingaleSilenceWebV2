export interface CommunityTimelineDay {
  key: string
  timestamp: number
  dayOfMonth: number
  isToday: boolean
  isWeekend: boolean
}

export interface CommunityTimelineMonth {
  key: string
  timestamp: number
  startIndex: number
  dayCount: number
}

export interface CommunityTimelineWindow {
  startAt: number
  endAt: number
  dayCount: number
  days: CommunityTimelineDay[]
  months: CommunityTimelineMonth[]
  todayOffset: number | null
}

export interface CommunityTimelinePlacement {
  leftDays: number
  widthDays: number
}

interface TimelineEventTiming {
  startsAtMs: number
  endsAtMs?: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function localDateOrdinal(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
}

function localDayPosition(timestamp: number, startAt: number): number {
  const date = new Date(timestamp)
  const start = new Date(startAt)
  const dayOffset = localDateOrdinal(date) - localDateOrdinal(start)
  const timeOffset =
    (date.getHours() * 60 * 60 * 1000 +
      date.getMinutes() * 60 * 1000 +
      date.getSeconds() * 1000 +
      date.getMilliseconds()) /
    DAY_MS

  return dayOffset + timeOffset
}

function localDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createCommunityTimelineWindow(
  now: number,
  monthOffset = 0,
  monthCount = 2
): CommunityTimelineWindow {
  if (
    !Number.isInteger(monthOffset) ||
    !Number.isInteger(monthCount) ||
    monthCount < 1 ||
    monthCount > 6
  ) {
    throw new Error('活动日历月份范围无效')
  }

  const nowDate = new Date(now)
  const start = new Date(nowDate.getFullYear(), nowDate.getMonth() + monthOffset, 1)
  const end = new Date(start.getFullYear(), start.getMonth() + monthCount, 1)
  const days: CommunityTimelineDay[] = []
  const months: CommunityTimelineMonth[] = []
  const todayKey = localDateKey(nowDate)

  for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor)
    const key = localDateKey(day)
    const monthKey = key.slice(0, 7)
    const previousMonth = months[months.length - 1]

    if (!previousMonth || previousMonth.key !== monthKey) {
      months.push({
        key: monthKey,
        timestamp: day.getTime(),
        startIndex: days.length,
        dayCount: 0
      })
    }

    months[months.length - 1]!.dayCount += 1
    days.push({
      key,
      timestamp: day.getTime(),
      dayOfMonth: day.getDate(),
      isToday: key === todayKey,
      isWeekend: day.getDay() === 0 || day.getDay() === 6
    })
  }

  const startAt = start.getTime()
  const endAt = end.getTime()
  const todayOffset = now >= startAt && now < endAt ? localDayPosition(now, startAt) : null

  return {
    startAt,
    endAt,
    dayCount: days.length,
    days,
    months,
    todayOffset
  }
}

export function getCommunityTimelinePlacement(
  event: TimelineEventTiming,
  window: CommunityTimelineWindow
): CommunityTimelinePlacement | null {
  const rawStart = localDayPosition(event.startsAtMs, window.startAt)
  const rawEnd = event.endsAtMs ? localDayPosition(event.endsAtMs, window.startAt) : rawStart + 1

  if (rawEnd <= 0 || rawStart >= window.dayCount) {
    return null
  }

  const leftDays = Math.max(0, rawStart)
  const clippedEnd = Math.min(window.dayCount, Math.max(rawStart + 1, rawEnd))
  const widthDays = Math.min(window.dayCount - leftDays, Math.max(1, clippedEnd - leftDays))

  return widthDays > 0 ? { leftDays, widthDays } : null
}
