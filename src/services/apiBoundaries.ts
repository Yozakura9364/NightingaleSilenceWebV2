import { ffxivTools } from '@/config/site'

export type FfxivToolId = 'glamour' | 'plate'

export interface ApiBoundary {
  id: FfxivToolId
  projectName: string
  apiBase: string
  healthPath: string
  devPort: number
  sourcePath: string
}

export const apiBoundaries = ffxivTools
  .filter((tool) => tool.apiBase && tool.devPort)
  .map((tool) => ({
    id: tool.id as FfxivToolId,
    projectName: tool.projectName,
    apiBase: tool.apiBase ?? '',
    healthPath: tool.id === 'glamour' ? '/health' : '/presets',
    devPort: tool.devPort ?? 0,
    sourcePath: tool.sourcePath
  })) satisfies ApiBoundary[]

export function getApiBoundary(id: FfxivToolId): ApiBoundary {
  const boundary = apiBoundaries.find((item) => item.id === id)

  if (!boundary) {
    throw new Error(`Unknown API boundary: ${id}`)
  }

  return boundary
}
