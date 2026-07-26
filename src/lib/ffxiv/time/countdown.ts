export interface CountdownParts {
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getCountdownParts(targetAt: number, now: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor((targetAt - now) / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { totalSeconds, days, hours, minutes, seconds }
}

export function formatCountdown(parts: CountdownParts): string {
  const paddedHours = String(parts.hours).padStart(2, '0')
  const paddedMinutes = String(parts.minutes).padStart(2, '0')
  const paddedSeconds = String(parts.seconds).padStart(2, '0')

  return parts.days > 0
    ? String(parts.days) + 'd ' + paddedHours + ':' + paddedMinutes + ':' + paddedSeconds
    : paddedHours + ':' + paddedMinutes + ':' + paddedSeconds
}
