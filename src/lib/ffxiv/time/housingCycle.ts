const DAY_MS = 24 * 60 * 60 * 1000
const ENTRY_DURATION_MS = 5 * DAY_MS
const RESULTS_DURATION_MS = 4 * DAY_MS
const CYCLE_DURATION_MS = ENTRY_DURATION_MS + RESULTS_DURATION_MS

export type HousingRegion = 'cn' | 'tw' | 'global'
export type HousingCyclePhase = 'entry' | 'results'

export interface HousingCycleProfile {
  region: HousingRegion
  resultsEndAnchor: number
}

export interface HousingCycleStatus {
  phase: HousingCyclePhase
  canEnterNow: boolean
  entryClosesAt: number
  resultsEndAt: number
  nextEntryAt: number
  nextTransitionAt: number
}

export const housingCycleProfiles: Record<HousingRegion, HousingCycleProfile> = {
  // The CN lottery cycle uses 23:00 China Standard Time as its phase boundary.
  cn: {
    region: 'cn',
    resultsEndAnchor: Date.parse('2022-08-08T23:00:00+08:00')
  },
  // Source: https://forum.gamer.com.tw/C.php?bsn=17608&snA=29576
  // The first in-game entry deadline was 2026-03-14 22:59 Taiwan time.
  tw: {
    region: 'tw',
    resultsEndAnchor: Date.parse('2026-03-18T23:00:00+08:00')
  },
  // Cross-checked against the active global results phase ending on 2026-07-25.
  global: {
    region: 'global',
    resultsEndAnchor: Date.parse('2026-07-25T15:00:00Z')
  }
}

export function getHousingCycleStatus(
  now: number,
  profile: HousingCycleProfile
): HousingCycleStatus {
  const cycleIndex = Math.floor((now - profile.resultsEndAnchor) / CYCLE_DURATION_MS)
  const cycleStartedAt = profile.resultsEndAnchor + cycleIndex * CYCLE_DURATION_MS
  const entryClosesAt = cycleStartedAt + ENTRY_DURATION_MS
  const resultsEndAt = cycleStartedAt + CYCLE_DURATION_MS
  const canEnterNow = now < entryClosesAt

  return {
    phase: canEnterNow ? 'entry' : 'results',
    canEnterNow,
    entryClosesAt,
    resultsEndAt,
    nextEntryAt: canEnterNow ? cycleStartedAt : resultsEndAt,
    nextTransitionAt: canEnterNow ? entryClosesAt : resultsEndAt
  }
}
