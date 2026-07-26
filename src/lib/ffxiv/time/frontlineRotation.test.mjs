import assert from 'node:assert/strict'
import { getFrontlineRotation } from './frontlineRotation.ts'

{
  const rotation = getFrontlineRotation(Date.parse('2026-04-28T15:30:00Z'))

  assert.equal(rotation.currentMap, 'borderlandRuins')
  assert.equal(rotation.nextMap, 'onsalHakair')
  assert.equal(rotation.nextRotationAt, Date.parse('2026-04-29T15:00:00Z'))
}

{
  const rotation = getFrontlineRotation(Date.parse('2026-05-02T14:59:59Z'))

  assert.equal(rotation.currentMap, 'sealRock')
  assert.equal(rotation.nextMap, 'fieldsOfGlory')
}

{
  const rotation = getFrontlineRotation(Date.parse('2026-05-02T15:00:00Z'))

  assert.equal(rotation.currentMap, 'fieldsOfGlory')
  assert.equal(rotation.nextMap, 'onsalHakair')
}

console.log('frontlineRotation tests passed')
