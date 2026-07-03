import {
  ARMOIRE_CONTAINER_KINDS,
  ARMOIRE_SNAPSHOT_SCHEMA_VERSION,
  type ArmoireContainerKind,
  type ArmoireOwnedItem,
  type ArmoireSnapshot,
  type ArmoireSnapshotSource
} from '@/lib/armoire/types'

export const ARMOIRE_MAX_SNAPSHOT_ITEMS = 50000

export type ArmoireSnapshotErrorCode =
  | 'invalidRoot'
  | 'invalidSchema'
  | 'invalidSource'
  | 'invalidGeneratedAt'
  | 'invalidItems'
  | 'tooManyItems'
  | 'invalidItem'
  | 'invalidItemId'
  | 'invalidContainer'
  | 'invalidQuantity'
  | 'invalidDyes'

export class ArmoireSnapshotError extends Error {
  readonly code: ArmoireSnapshotErrorCode
  readonly detail?: string

  constructor(code: ArmoireSnapshotErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'ArmoireSnapshotError'
    this.code = code
    this.detail = detail
  }
}

const CONTAINER_SET = new Set<string>(ARMOIRE_CONTAINER_KINDS)
const SNAPSHOT_SOURCES = new Set<ArmoireSnapshotSource>([
  'manual-import',
  'local-helper',
  'asvel-compatible'
])

function fail(code: ArmoireSnapshotErrorCode, detail?: string): never {
  throw new ArmoireSnapshotError(code, detail)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : undefined
}

function normalizeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    fail('invalidItem', path)
  }

  return value
}

function normalizeItemId(value: unknown, path: string): number {
  const itemId = normalizeInteger(value, path)

  if (itemId <= 0) {
    fail('invalidItemId', path)
  }

  return itemId
}

function normalizeQuantity(value: unknown, path: string): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const quantity = normalizeInteger(value, path)

  if (quantity <= 0) {
    fail('invalidQuantity', path)
  }

  return quantity
}

function normalizeOptionalInteger(value: unknown, path: string): number | undefined {
  if (value === undefined) {
    return undefined
  }

  return normalizeInteger(value, path)
}

function normalizeDyeId(value: unknown, path: string): number {
  const dyeId = normalizeInteger(value, path)

  if (dyeId < 0) {
    fail('invalidDyes', path)
  }

  return dyeId
}

function normalizeDyes(value: unknown, path: string): [number, number] | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value) || value.length !== 2) {
    fail('invalidDyes', path)
  }

  return [normalizeDyeId(value[0], `${path}[0]`), normalizeDyeId(value[1], `${path}[1]`)]
}

function normalizeContainer(value: unknown, path: string): ArmoireContainerKind {
  if (typeof value !== 'string' || !CONTAINER_SET.has(value)) {
    fail('invalidContainer', path)
  }

  return value as ArmoireContainerKind
}

function normalizeOwnedItem(value: unknown, index: number): ArmoireOwnedItem {
  if (!isRecord(value)) {
    fail('invalidItem', `items[${index}]`)
  }

  return {
    itemId: normalizeItemId(value.itemId, `items[${index}].itemId`),
    hq: typeof value.hq === 'boolean' ? value.hq : undefined,
    quantity: normalizeQuantity(value.quantity, `items[${index}].quantity`),
    dyes: normalizeDyes(value.dyes, `items[${index}].dyes`),
    spiritbond: normalizeOptionalInteger(value.spiritbond, `items[${index}].spiritbond`),
    container: normalizeContainer(value.container, `items[${index}].container`),
    containerName: normalizeText(value.containerName, 120),
    slotIndex: normalizeOptionalInteger(value.slotIndex, `items[${index}].slotIndex`)
  }
}

function normalizeAsvelItem(value: unknown, index: number): ArmoireOwnedItem {
  if (!isRecord(value)) {
    fail('invalidItem', `items[${index}]`)
  }

  return {
    itemId: normalizeItemId(value.id, `items[${index}].id`),
    hq: typeof value.hq === 'boolean' ? value.hq : undefined,
    dyes: normalizeDyes(value.dyes, `items[${index}].dyes`),
    container: 'glamourDresser'
  }
}

function normalizeItems(value: unknown): ArmoireOwnedItem[] {
  if (!Array.isArray(value)) {
    fail('invalidItems')
  }

  if (value.length > ARMOIRE_MAX_SNAPSHOT_ITEMS) {
    fail('tooManyItems', String(value.length))
  }

  return value.map(normalizeOwnedItem)
}

function normalizeCharacter(value: unknown): ArmoireSnapshot['character'] {
  if (!isRecord(value)) {
    return undefined
  }

  const character = {
    name: normalizeText(value.name, 80),
    world: normalizeText(value.world, 80),
    dataCenter: normalizeText(value.dataCenter, 80)
  }

  return character.name || character.world || character.dataCenter ? character : undefined
}

function isAsvelDresserItem(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && 'id' in value && !('itemId' in value)
}

function getAsvelItems(value: unknown): unknown[] | undefined {
  if (Array.isArray(value) && value.every(isAsvelDresserItem)) {
    return value
  }

  if (isRecord(value) && Array.isArray(value.items) && value.items.every(isAsvelDresserItem)) {
    return value.items
  }

  if (isRecord(value) && Array.isArray(value.dresser) && value.dresser.every(isAsvelDresserItem)) {
    return value.dresser
  }

  return undefined
}

function normalizeAsvelSnapshot(value: unknown): ArmoireSnapshot | undefined {
  const items = getAsvelItems(value)

  if (!items) {
    return undefined
  }

  if (items.length > ARMOIRE_MAX_SNAPSHOT_ITEMS) {
    fail('tooManyItems', String(items.length))
  }

  return {
    schemaVersion: ARMOIRE_SNAPSHOT_SCHEMA_VERSION,
    source: 'asvel-compatible',
    generatedAt: new Date().toISOString(),
    items: items.map(normalizeAsvelItem)
  }
}

export function normalizeArmoireSnapshot(value: unknown): ArmoireSnapshot {
  const asvelSnapshot = normalizeAsvelSnapshot(value)

  if (asvelSnapshot) {
    return asvelSnapshot
  }

  if (!isRecord(value)) {
    fail('invalidRoot')
  }

  if (value.schemaVersion !== ARMOIRE_SNAPSHOT_SCHEMA_VERSION) {
    fail('invalidSchema')
  }

  if (typeof value.source !== 'string' || !SNAPSHOT_SOURCES.has(value.source as ArmoireSnapshotSource)) {
    fail('invalidSource')
  }

  if (typeof value.generatedAt !== 'string' || !value.generatedAt.trim()) {
    fail('invalidGeneratedAt')
  }

  return {
    schemaVersion: ARMOIRE_SNAPSHOT_SCHEMA_VERSION,
    source: value.source as ArmoireSnapshotSource,
    generatedAt: value.generatedAt,
    character: normalizeCharacter(value.character),
    items: normalizeItems(value.items)
  }
}
