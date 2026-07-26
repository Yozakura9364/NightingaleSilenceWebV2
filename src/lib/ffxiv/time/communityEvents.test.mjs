import assert from 'node:assert/strict'
import { getCommunityEventStatuses, parseCommunityEventsDocument } from './communityEvents.ts'
import {
  createCommunityTimelineWindow,
  getCommunityTimelinePlacement
} from './communityTimeline.ts'

const document = parseCommunityEventsDocument({
  schemaVersion: 1,
  updatedAt: '2026-07-24T00:00:00+08:00',
  events: [
    {
      id: 'active',
      title: 'Active event',
      url: 'https://example.com/active',
      startsAt: '2026-07-23T00:00:00+08:00',
      endsAt: '2026-07-25T00:00:00+08:00',
      region: 'cn'
    },
    {
      id: 'ended',
      title: 'Ended event',
      url: 'https://example.com/ended',
      startsAt: '2026-07-20T00:00:00+08:00',
      endsAt: '2026-07-21T00:00:00+08:00'
    },
    {
      id: 'upcoming',
      title: 'Upcoming event',
      url: 'https://example.com/upcoming',
      startsAt: '2026-07-26T00:00:00+08:00'
    }
  ]
})

{
  const statuses = getCommunityEventStatuses(document, Date.parse('2026-07-24T00:00:00+08:00'))

  assert.deepEqual(
    statuses.map((event) => [event.id, event.state]),
    [
      ['active', 'active'],
      ['upcoming', 'upcoming']
    ]
  )

  assert.deepEqual(
    getCommunityEventStatuses(document, Date.parse('2026-07-24T00:00:00+08:00'), {
      includeEnded: true
    }).map((event) => event.id),
    ['ended', 'active', 'upcoming']
  )
}

{
  const now = new Date(2026, 6, 24, 12).getTime()
  const timelineWindow = createCommunityTimelineWindow(now)
  const placement = getCommunityTimelinePlacement(
    {
      startsAtMs: new Date(2026, 6, 23).getTime(),
      endsAtMs: new Date(2026, 6, 25).getTime()
    },
    timelineWindow
  )

  assert.equal(timelineWindow.days.length, 62)
  assert.deepEqual(
    timelineWindow.months.map((month) => month.dayCount),
    [31, 31]
  )
  assert.equal(timelineWindow.todayOffset, 23.5)
  assert.deepEqual(placement, { leftDays: 22, widthDays: 2 })
}

{
  const commonDocument = parseCommunityEventsDocument({
    schemaVersion: 1,
    updatedAt: null,
    events: [
      {
        id: 'common-event',
        title: 'Shared event',
        url: 'https://example.com/common',
        startsAt: '2026-07-25T14:00:00+08:00',
        endsAt: '2026-07-26T14:50:00+08:00',
        region: 'common'
      }
    ]
  })

  assert.equal(commonDocument.events[0].region, 'common')
}

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: null,
      events: [
        {
          id: 'invalid',
          title: 'Invalid event',
          url: 'https://example.com',
          startsAt: '2026-07-25T00:00:00+08:00',
          endsAt: '2026-07-24T00:00:00+08:00'
        }
      ]
    }),
  /结束时间无效/
)

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: null,
      events: [
        {
          id: 'unsafe',
          title: 'Unsafe event',
          url: 'javascript:alert(1)',
          startsAt: '2026-07-25T00:00:00+08:00'
        }
      ]
    }),
  /链接无效/
)

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: null,
      events: [
        {
          id: 'ambiguous-time',
          title: 'Ambiguous event',
          url: 'https://example.com',
          startsAt: '2026-07-25T00:00:00'
        }
      ]
    }),
  /时区/
)

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: 'not-a-time',
      events: []
    }),
  /更新时间/
)

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: null,
      events: Array.from({ length: 101 }, (_, index) => ({
        id: 'event-' + index,
        title: 'Event ' + index,
        url: 'https://example.com/' + index,
        startsAt: '2026-07-25T00:00:00+08:00'
      }))
    }),
  /数量/
)

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: null,
      events: [
        {
          id: 'invalid-timezone-label',
          title: 'Invalid timezone label',
          url: 'https://example.com',
          startsAt: '2026-07-25T00:00:00+08:00',
          timezone: 8
        }
      ]
    }),
  /时区名称/
)

assert.throws(
  () =>
    parseCommunityEventsDocument({
      schemaVersion: 1,
      updatedAt: null,
      events: [
        {
          id: 'invalid-region',
          title: 'Invalid region',
          url: 'https://example.com',
          startsAt: '2026-07-25T00:00:00+08:00',
          region: 'tw'
        }
      ]
    }),
  /区服/
)

console.log('communityEvents tests passed')
