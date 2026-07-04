import { ARMOIRE_SNAPSHOT_SCHEMA_VERSION, type ArmoireSnapshot } from '@/lib/armoire/types'

export function createExampleArmoireSnapshot(): ArmoireSnapshot {
  return {
    schemaVersion: ARMOIRE_SNAPSHOT_SCHEMA_VERSION,
    source: 'manual-import',
    generatedAt: '2026-07-04T00:00:00.000Z',
    items: [
      {
        itemId: 12117,
        dyes: [102, 0],
        container: 'glamourDresser'
      },
      {
        itemId: 1675,
        dyes: [0, 0],
        container: 'glamourDresser'
      },
      {
        itemId: 45094,
        container: 'glamourDresser'
      },
      {
        itemId: 2642,
        dyes: [0, 0],
        container: 'glamourDresser'
      },
      {
        itemId: 2965,
        dyes: [0, 0],
        container: 'inventory'
      },
      {
        itemId: 2221,
        container: 'armoire'
      },
      {
        itemId: 2222,
        container: 'inventory'
      },
      {
        itemId: 2673,
        dyes: [1, 0],
        container: 'armoury'
      },
      {
        itemId: 2673,
        dyes: [0, 0],
        container: 'inventory'
      }
    ]
  }
}
