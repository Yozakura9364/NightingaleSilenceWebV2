import { housingTextKeys } from '@/locales/keys/housing'

type TranslateFn = (key: string) => string

export function formatPrice(value: number): string {
  return value.toLocaleString('en-US')
}

/** 相对时间：返回数值与单位 key，由组件拆分渲染（项目惯例：数字与文案分开）；null 表示"刚刚" */
export interface RelativeTimeParts {
  value: number
  unitKey: string
}

export function formatRelativeTime(
  timestampMs: number | null,
  now: number
): RelativeTimeParts | null {
  if (timestampMs === null) {
    return null
  }
  const diffMinutes = Math.floor((now - timestampMs) / 60_000)
  if (diffMinutes < 1) {
    return null
  }
  if (diffMinutes < 60) {
    return { value: diffMinutes, unitKey: housingTextKeys.timeMinutesUnit }
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return { value: diffHours, unitKey: housingTextKeys.timeHoursUnit }
  }
  return { value: Math.floor(diffHours / 24), unitKey: housingTextKeys.timeDaysUnit }
}

/** 轮次剩余时间：紧凑拼接（2天3小时 / 3小时24分 / 24分）；已截止返回 null */
export function formatRemainingTime(
  targetMs: number,
  now: number,
  t: TranslateFn
): string | null {
  const remainingMinutes = Math.ceil((targetMs - now) / 60_000)
  if (remainingMinutes <= 0) {
    return null
  }
  const days = Math.floor(remainingMinutes / 1440)
  const hours = Math.floor((remainingMinutes % 1440) / 60)
  const minutes = remainingMinutes % 60
  if (days > 0) {
    return `${days}${t(housingTextKeys.remainingUnitDays)}${
      hours > 0 ? `${hours}${t(housingTextKeys.remainingUnitHours)}` : ''
    }`
  }
  if (hours > 0) {
    return `${hours}${t(housingTextKeys.remainingUnitHours)}${
      minutes > 0 ? `${minutes}${t(housingTextKeys.remainingUnitMinutes)}` : ''
    }`
  }
  return `${minutes}${t(housingTextKeys.remainingUnitMinutes)}`
}

export function formatAbsoluteTime(timestampMs: number | null): string {
  if (timestampMs === null) {
    return ''
  }
  return new Date(timestampMs).toLocaleString()
}
