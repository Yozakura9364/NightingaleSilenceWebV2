// 无人岛动物刷新时段的运行时判定。
// 时段语义与桥接数据一致：ET 整点 spawnHour 出现，持续 durationHours 个 ET 小时。
// ET 换算沿用站点既有口径：1 ET 小时 = 175 现实秒（见 useHomeAdventureClock）。

const EORZEA_HOUR_SECONDS = 175
const MINUTES_PER_DAY = 1440

export interface AnimalSpawnWindowState {
  /** 当前处于出没时段内 */
  active: boolean
  /** 当前 ET 一天内的分钟数（0-1439） */
  eorzeaMinute: number
  /** 时段内剩余 ET 分钟（不在时段内为 null） */
  minutesLeft: number | null
  /** 距下一次时段开始的 ET 分钟（在时段内为 null） */
  minutesUntilNext: number | null
}

export function currentEorzeaMinuteOfDay(nowMs: number): number {
  const totalMinutes = Math.floor((nowMs / 1000 / EORZEA_HOUR_SECONDS) * 60)
  return ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

export function animalSpawnWindowState(
  spawnHour: number,
  durationHours: number,
  eorzeaMinute: number
): AnimalSpawnWindowState {
  const start = ((spawnHour % 24) + 24) % 24 * 60
  const length = Math.max(1, Math.round(durationHours)) * 60
  const offset = (((eorzeaMinute - start) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  if (offset < length) {
    return {
      active: true,
      eorzeaMinute,
      minutesLeft: length - offset,
      minutesUntilNext: null
    }
  }
  return {
    active: false,
    eorzeaMinute,
    minutesLeft: null,
    minutesUntilNext: MINUTES_PER_DAY - offset
  }
}

/** ET 分钟数 → `HH:MM`。 */
export function formatEorzeaMinutes(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(hour)}:${pad(minute)}`
}

/** 出没窗口的 ET 起止文本，如 `06:00 - 09:00`。 */
export function formatSpawnWindow(spawnHour: number, durationHours: number): string {
  const start = spawnHour * 60
  const end = start + Math.max(1, Math.round(durationHours)) * 60
  return `${formatEorzeaMinutes(start)} - ${formatEorzeaMinutes(end)}`
}
