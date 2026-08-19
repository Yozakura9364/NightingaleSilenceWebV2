import {
  getFilledGlamourDraftEntries
} from '@/lib/glamour/draft'
import { getSelectedCandidate } from '@/lib/glamour/equipment'
import type { GlamourDraft, GlamourSnapshot } from '@/lib/glamour/types'
import { GLAMOUR_SNAPSHOT_API_BASE } from '@/lib/glamour/snapshotLinks'
import { useFetch } from '@/composables/useFetch'
import type { ApiBoundary } from '@/services/apiBoundaries'

export interface GlamourSnapshotCreateRequest {
  locales: string[]
  slot_names: GlamourDraft['slotNames']
  no_dye_labels: GlamourDraft['noDyeLabels']
  entries: Array<{
    slot: string
    slot_names?: GlamourDraft['slotNames'][string]
    candidate: NonNullable<ReturnType<typeof getSelectedCandidate>>
  }>
}

export interface GlamourSnapshotResponse {
  id: string
  created_at: string
  snapshot: GlamourSnapshot
  reused: boolean
}

const SNAPSHOT_LOCALES = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko'] as const
const SNAPSHOT_SLOTS = [
  'MainHand',
  'OffHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'Glasses',
  'FashionAccessory'
] as const
const SNAPSHOT_SLOT_ORDER = new Map<string, number>(
  SNAPSHOT_SLOTS.map((slot, index) => [slot, index])
)
const SNAPSHOT_HEX_PATTERN = /^#[0-9a-f]{6}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function snapshotText(value: unknown, limit = 256): string {
  return String(value || '').trim().slice(0, limit)
}

function snapshotInteger(value: unknown): number {
  const number = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(number) ? Math.min(Math.max(number, 0), 9_999_999) : 0
}

function snapshotLocalizedMap(value: unknown, limit = 256): Record<string, string> {
  const source = isRecord(value) ? value : {}
  return Object.fromEntries(
    SNAPSHOT_LOCALES.flatMap((locale) => {
      const text = snapshotText(source[locale], limit)
      return text ? [[locale, text]] : []
    })
  )
}

function createPublicSnapshotIdentity(request: GlamourSnapshotCreateRequest): GlamourSnapshot {
  const slotNames = isRecord(request.slot_names) ? request.slot_names : {}
  const entries = request.entries
    .flatMap((entry) => {
      const candidate = isRecord(entry.candidate) ? entry.candidate : {}
      const names = snapshotLocalizedMap(candidate.names)
      const name = snapshotText(candidate.name)
      if (!SNAPSHOT_SLOT_ORDER.has(entry.slot) || (!name && !Object.keys(names).length)) {
        return []
      }

      const dyes = (Array.isArray(candidate.dye_entries) ? candidate.dye_entries : [])
        .slice(0, 2)
        .map((value) => {
          const dye = isRecord(value) ? value : {}
          const id = snapshotInteger(dye.id)
          const hex = snapshotText(dye.hex, 16)
          return {
            id,
            name: snapshotText(dye.name),
            names: snapshotLocalizedMap(dye.names),
            hex: SNAPSHOT_HEX_PATTERN.test(hex) ? hex : 'transparent',
            isEmpty: Boolean(dye.isEmpty) || id === 0
          }
        })

      return [{
        slot: entry.slot,
        slot_names: snapshotLocalizedMap(entry.slot_names || slotNames[entry.slot]),
        item: {
          key: snapshotText(candidate.key, 96),
          name,
          names,
          icon: snapshotInteger(candidate.icon),
          dyes
        }
      }]
    })
    .sort((left, right) => (
      (SNAPSHOT_SLOT_ORDER.get(left.slot) ?? SNAPSHOT_SLOTS.length) -
      (SNAPSHOT_SLOT_ORDER.get(right.slot) ?? SNAPSHOT_SLOTS.length)
    ))

  const locales = SNAPSHOT_LOCALES.filter((locale) => (
    request.locales.includes(locale) || entries.some((entry) => Boolean(entry.item.names[locale]))
  ))

  return {
    version: 1,
    locales: locales.length ? [...locales] : ['zh'],
    slot_names: Object.fromEntries(
      SNAPSHOT_SLOTS.flatMap((slot) => {
        const names = snapshotLocalizedMap(slotNames[slot])
        return Object.keys(names).length ? [[slot, names]] : []
      })
    ),
    no_dye_labels: snapshotLocalizedMap(request.no_dye_labels),
    entries
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export async function createGlamourSnapshotKey(draft: GlamourDraft): Promise<string> {
  const identity = stableStringify(createPublicSnapshotIdentity(createGlamourSnapshotRequest(draft)))
  if (!globalThis.crypto?.subtle) {
    return `json:${identity}`
  }

  try {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))
    return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  } catch {
    return `json:${identity}`
  }
}

export function createGlamourSnapshotRequest(draft: GlamourDraft): GlamourSnapshotCreateRequest {
  return {
    locales: [...draft.locales],
    slot_names: draft.slotNames,
    no_dye_labels: draft.noDyeLabels,
    entries: getFilledGlamourDraftEntries(draft).flatMap((entry) => {
      const candidate = getSelectedCandidate(entry)
      return candidate
        ? [{ slot: entry.slot, slot_names: entry.slot_names, candidate }]
        : []
    })
  }
}

export function useNSGlamourSnapshotApi() {
  const client = useFetch().createClient(GLAMOUR_SNAPSHOT_API_BASE)

  function createSnapshot(draft: GlamourDraft): Promise<GlamourSnapshotResponse> {
    return client.api<GlamourSnapshotResponse>('/equipinfo/snapshots', {
      method: 'POST',
      json: createGlamourSnapshotRequest(draft)
    })
  }

  function loadSnapshot(snapshotId: string): Promise<GlamourSnapshotResponse> {
    return client.api<GlamourSnapshotResponse>(
      `/equipinfo/snapshots/${encodeURIComponent(snapshotId)}`,
      { cache: 'no-store' }
    )
  }

  return { createSnapshot, loadSnapshot }
}

export function useNSGlamourSnapshots(_boundary: ApiBoundary) {
  return useNSGlamourSnapshotApi()
}
