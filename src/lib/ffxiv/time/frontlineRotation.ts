const DAY_MS = 24 * 60 * 60 * 1000

export type FrontlineMap =
  'sealRock' | 'borderlandRuins' | 'onsalHakair' | 'worqorChirteh' | 'fieldsOfGlory'

export interface FrontlineRotationStatus {
  currentMap: FrontlineMap
  nextMap: FrontlineMap
  nextRotationAt: number
}

// Patch 7.5 introduced this eight-day sequence. Rotation changes at 15:00 UTC daily.
export const frontlineRotation: readonly FrontlineMap[] = [
  'sealRock',
  'borderlandRuins',
  'onsalHakair',
  'worqorChirteh',
  'sealRock',
  'fieldsOfGlory',
  'onsalHakair',
  'worqorChirteh'
]

const REFERENCE_RESET = Date.parse('2026-04-27T15:00:00Z')

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

export function getFrontlineRotation(now: number): FrontlineRotationStatus {
  const elapsedDays = Math.floor((now - REFERENCE_RESET) / DAY_MS)
  const currentIndex = positiveModulo(elapsedDays, frontlineRotation.length)
  const nextIndex = (currentIndex + 1) % frontlineRotation.length

  return {
    currentMap: frontlineRotation[currentIndex],
    nextMap: frontlineRotation[nextIndex],
    nextRotationAt: REFERENCE_RESET + (elapsedDays + 1) * DAY_MS
  }
}
