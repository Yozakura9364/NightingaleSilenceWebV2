// Type declarations for canonical-hash.mjs (shared generator/checker/service hash contract).
export function canonicalJson(obj: unknown): string
export function sha256Hex(text: string): string
export function entryGenerationHash(entry: Record<string, unknown>): string
export function snapshotHash(snapshot: Record<string, unknown>): string
