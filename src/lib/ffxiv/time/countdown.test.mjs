import assert from 'node:assert/strict'
import { formatCountdown, getCountdownParts } from './countdown.ts'

{
  const parts = getCountdownParts(183845000, 0)

  assert.deepEqual(parts, {
    totalSeconds: 183845,
    days: 2,
    hours: 3,
    minutes: 4,
    seconds: 5
  })
  assert.equal(formatCountdown(parts), '2d 03:04:05')
}

{
  const parts = getCountdownParts(0, 1000)

  assert.equal(parts.totalSeconds, 0)
  assert.equal(formatCountdown(parts), '00:00:00')
}

console.log('countdown tests passed')
