import { computed, readonly, ref, watch, type Ref } from 'vue'
import type {
  ArmoireContainerKind,
  ArmoireSnapshot,
  ArmoireSnapshotSource
} from '@/lib/armoire/types'

const STORAGE_KEY = 'nsarmoire.characterProfiles.v1'
const MAX_PROFILE_COUNT = 50
const UNKNOWN_PROFILE_PREFIX = 'unidentified'
const CONTAINER_DISPLAY_ORDER: ArmoireContainerKind[] = [
  'armoire',
  'inventory',
  'armoury',
  'glamourDresser',
  'saddlebag',
  'manual',
  'retainer'
]

export interface ArmoireCharacterProfile {
  key: string
  name?: string
  world?: string
  dataCenter?: string
  source: ArmoireSnapshotSource
  lastDataAt: string
  cachedAt: string
  entryCount: number
  containers: readonly ArmoireContainerKind[]
  retainerNames: readonly string[]
  retainerCount: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : undefined
}

function isContainerKind(value: unknown): value is ArmoireContainerKind {
  return CONTAINER_DISPLAY_ORDER.includes(value as ArmoireContainerKind)
}

function normalizeProfile(value: unknown): ArmoireCharacterProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const key = normalizeString(value.key, 160)
  const source = normalizeString(value.source, 40) as ArmoireSnapshotSource | undefined
  const lastDataAt = normalizeString(value.lastDataAt, 80)
  const cachedAt = normalizeString(value.cachedAt, 80)

  if (!key || !source || !lastDataAt || !cachedAt) {
    return null
  }

  return {
    key,
    name: normalizeString(value.name, 80),
    world: normalizeString(value.world, 80),
    dataCenter: normalizeString(value.dataCenter, 80),
    source,
    lastDataAt,
    cachedAt,
    entryCount:
      typeof value.entryCount === 'number' &&
      Number.isInteger(value.entryCount) &&
      value.entryCount >= 0
        ? value.entryCount
        : 0,
    containers: Array.isArray(value.containers) ? value.containers.filter(isContainerKind) : [],
    retainerNames: Array.isArray(value.retainerNames)
      ? value.retainerNames
          .map((name) => normalizeString(name, 80))
          .filter((name): name is string => Boolean(name))
      : [],
    retainerCount:
      typeof value.retainerCount === 'number' &&
      Number.isInteger(value.retainerCount) &&
      value.retainerCount >= 0
        ? value.retainerCount
        : 0
  }
}

function readStoredProfiles(): ArmoireCharacterProfile[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawProfiles = window.localStorage.getItem(STORAGE_KEY)
    const parsed = rawProfiles ? (JSON.parse(rawProfiles) as unknown) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(normalizeProfile)
      .filter((profile): profile is ArmoireCharacterProfile => Boolean(profile))
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function saveStoredProfiles(nextProfiles: readonly ArmoireCharacterProfile[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfiles))
  } catch {
    // Profile summaries are a convenience cache; analysis should continue when storage is unavailable.
  }
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function sortProfiles(left: ArmoireCharacterProfile, right: ArmoireCharacterProfile): number {
  return (
    getTimestamp(right.lastDataAt) - getTimestamp(left.lastDataAt) ||
    left.key.localeCompare(right.key)
  )
}

function hashProfileSeed(seed: string): string {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return hash.toString(36).padStart(6, '0')
}

function createUnknownProfileKey(
  snapshot: ArmoireSnapshot,
  containers: readonly ArmoireContainerKind[]
): string {
  return [
    UNKNOWN_PROFILE_PREFIX,
    hashProfileSeed(
      `${snapshot.source}|${snapshot.generatedAt}|${snapshot.items.length}|${containers.join(',')}`
    )
  ].join(':')
}

export function getArmoireCharacterProfileKey(snapshot: ArmoireSnapshot | null): string | null {
  if (!snapshot) {
    return null
  }

  const name = snapshot.character?.name?.trim()
  const world = snapshot.character?.world?.trim()

  if (name && world) {
    return `${name}@${world}`
  }

  const containers = getReadContainers(snapshot)
  return createUnknownProfileKey(snapshot, containers)
}

export function getReadContainers(snapshot: ArmoireSnapshot): ArmoireContainerKind[] {
  const containers = new Set<ArmoireContainerKind>()

  for (const item of snapshot.items) {
    containers.add(item.container)
  }

  return CONTAINER_DISPLAY_ORDER.filter((container) => containers.has(container))
}

function getRetainerSummary(
  snapshot: ArmoireSnapshot
): Pick<ArmoireCharacterProfile, 'retainerNames' | 'retainerCount'> {
  const retainerKeys = new Set<string>()
  const retainerNames: string[] = []

  for (const item of snapshot.items) {
    if (item.container !== 'retainer') {
      continue
    }

    const retainerKey =
      item.retainerId?.trim() ||
      item.retainerName?.trim() ||
      item.containerName?.trim() ||
      'unknown'
    const retainerName = item.retainerName?.trim() || item.containerName?.trim()

    retainerKeys.add(retainerKey)

    if (retainerName && !retainerNames.includes(retainerName)) {
      retainerNames.push(retainerName)
    }
  }

  return {
    retainerNames,
    retainerCount: retainerKeys.size
  }
}

function createProfileFromSnapshot(snapshot: ArmoireSnapshot): ArmoireCharacterProfile {
  const containers = getReadContainers(snapshot)
  const retainerSummary = getRetainerSummary(snapshot)

  return {
    key: getArmoireCharacterProfileKey(snapshot) ?? createUnknownProfileKey(snapshot, containers),
    name: snapshot.character?.name?.trim() || undefined,
    world: snapshot.character?.world?.trim() || undefined,
    dataCenter: snapshot.character?.dataCenter?.trim() || undefined,
    source: snapshot.source,
    lastDataAt: snapshot.generatedAt,
    cachedAt: new Date().toISOString(),
    entryCount: snapshot.items.length,
    containers,
    ...retainerSummary
  }
}

export function useArmoireCharacterProfiles(snapshot: Ref<ArmoireSnapshot | null>) {
  const profiles = ref<ArmoireCharacterProfile[]>(readStoredProfiles().sort(sortProfiles))

  function upsertProfile(nextProfile: ArmoireCharacterProfile): void {
    profiles.value = [
      nextProfile,
      ...profiles.value.filter((profile) => profile.key !== nextProfile.key)
    ]
      .sort(sortProfiles)
      .slice(0, MAX_PROFILE_COUNT)

    saveStoredProfiles(profiles.value)
  }

  watch(
    snapshot,
    (nextSnapshot) => {
      if (!nextSnapshot) {
        return
      }

      upsertProfile(createProfileFromSnapshot(nextSnapshot))
    },
    { immediate: true }
  )

  const activeProfileKey = computed(() => getArmoireCharacterProfileKey(snapshot.value))

  return {
    profiles: readonly(profiles),
    activeProfileKey
  }
}
