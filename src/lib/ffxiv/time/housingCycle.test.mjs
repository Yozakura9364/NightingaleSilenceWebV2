import assert from 'node:assert/strict'
import { getHousingCycleStatus, housingCycleProfiles } from './housingCycle.ts'

const HOUR = 60 * 60 * 1000

{
  const status = getHousingCycleStatus(
    Date.parse('2022-08-09T00:00:00+08:00'),
    housingCycleProfiles.cn
  )

  assert.equal(status.phase, 'entry')
  assert.equal(status.canEnterNow, true)
  assert.equal(status.entryClosesAt, Date.parse('2022-08-13T23:00:00+08:00'))
  assert.equal(status.resultsEndAt, Date.parse('2022-08-17T23:00:00+08:00'))
  assert.equal(status.nextEntryAt, Date.parse('2022-08-08T23:00:00+08:00'))
}

{
  const status = getHousingCycleStatus(
    Date.parse('2026-07-24T12:00:00+08:00'),
    housingCycleProfiles.cn
  )

  assert.equal(status.phase, 'results')
  assert.equal(status.canEnterNow, false)
  assert.equal(status.resultsEndAt, Date.parse('2026-07-27T23:00:00+08:00'))
  assert.equal(status.nextEntryAt, Date.parse('2026-07-27T23:00:00+08:00'))
  assert.equal(status.nextTransitionAt - Date.parse('2026-07-24T12:00:00+08:00'), 83 * HOUR)
}

{
  const status = getHousingCycleStatus(
    Date.parse('2026-07-24T12:00:00+08:00'),
    housingCycleProfiles.global
  )

  assert.equal(status.phase, 'results')
  assert.equal(status.resultsEndAt, Date.parse('2026-07-25T23:00:00+08:00'))
  assert.equal(status.nextEntryAt, Date.parse('2026-07-25T23:00:00+08:00'))
}

{
  const beforeDeadline = getHousingCycleStatus(
    Date.parse('2026-03-14T22:59:59+08:00'),
    housingCycleProfiles.tw
  )
  const atDeadline = getHousingCycleStatus(
    Date.parse('2026-03-14T23:00:00+08:00'),
    housingCycleProfiles.tw
  )

  assert.equal(beforeDeadline.phase, 'entry')
  assert.equal(beforeDeadline.entryClosesAt, Date.parse('2026-03-14T23:00:00+08:00'))
  assert.equal(atDeadline.phase, 'results')
  assert.equal(atDeadline.resultsEndAt, Date.parse('2026-03-18T23:00:00+08:00'))
}

{
  const status = getHousingCycleStatus(
    Date.parse('2026-07-24T12:00:00+08:00'),
    housingCycleProfiles.tw
  )

  assert.equal(status.phase, 'entry')
  assert.equal(status.entryClosesAt, Date.parse('2026-07-27T23:00:00+08:00'))
  assert.equal(status.resultsEndAt, Date.parse('2026-07-31T23:00:00+08:00'))
}

console.log('housingCycle tests passed')
