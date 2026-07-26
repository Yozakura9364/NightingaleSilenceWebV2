import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// One Eorzea hour passes every 175 real-world seconds.
const EORZEA_HOUR_SECONDS = 175
// FFXIV duty resets occur daily at 15:00 UTC and weekly on Tuesday at 08:00 UTC.
const DAILY_RESET_UTC_HOUR = 15
const WEEKLY_RESET_UTC_DAY = 2
const WEEKLY_RESET_UTC_HOUR = 8

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatEorzeaTime(nowMs: number) {
  const totalMinutes = Math.floor((nowMs / 1000 / EORZEA_HOUR_SECONDS) * 60)
  const minuteOfDay = ((totalMinutes % 1440) + 1440) % 1440
  return `${pad2(Math.floor(minuteOfDay / 60))}:${pad2(minuteOfDay % 60)}`
}

function getNextDailyReset(nowMs: number) {
  const now = new Date(nowMs)
  let resetMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    DAILY_RESET_UTC_HOUR
  )
  if (resetMs <= nowMs) resetMs += 24 * 60 * 60 * 1000
  return resetMs
}

function getNextWeeklyReset(nowMs: number) {
  const now = new Date(nowMs)
  const daysUntilReset = (WEEKLY_RESET_UTC_DAY - now.getUTCDay() + 7) % 7
  let resetMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilReset,
    WEEKLY_RESET_UTC_HOUR
  )
  if (resetMs <= nowMs) resetMs += 7 * 24 * 60 * 60 * 1000
  return resetMs
}

function countdownParts(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days,
    clock: `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
  }
}

export function useHomeAdventureClock() {
  const nowMs = ref(Date.now())
  let timerId: number | undefined

  const eorzeaTime = computed(() => formatEorzeaTime(nowMs.value))
  const dailyReset = computed(
    () => countdownParts(getNextDailyReset(nowMs.value) - nowMs.value).clock
  )
  const weeklyReset = computed(() => countdownParts(getNextWeeklyReset(nowMs.value) - nowMs.value))

  onMounted(() => {
    nowMs.value = Date.now()
    timerId = window.setInterval(() => {
      nowMs.value = Date.now()
    }, 1000)
  })

  onBeforeUnmount(() => {
    if (timerId !== undefined) window.clearInterval(timerId)
  })

  return {
    eorzeaTime,
    dailyReset,
    weeklyReset
  }
}
