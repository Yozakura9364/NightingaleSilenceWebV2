import { ffxivTools } from '@/config/site'
import { getDevToolMeta } from '@/config/devToolMeta'

export type FfxivToolId = 'itemCard' | 'glamour' | 'plate' | 'armoire'

export interface ApiBoundary {
  id: FfxivToolId
  projectName: string
  apiBase: string
  healthPath: string
  devPort: number
  sourcePath: string
}

// 后端 API 路径约定的唯一事实源。apiBase 属于服务层知识，不写进站点展示配置
// （src/config/site.ts 只保留文案/路由等展示信息）。
const toolApiBase: Partial<Record<FfxivToolId, string>> = {
  plate: '/api/plate',
  glamour: '/api/glamour',
  itemCard: '/api/glamour'
}

// devPort / sourcePath 来自 dev-only 元数据（src/config/devToolMeta.ts），
// 业务请求只用 apiBase 路径约定，不感知后端端口与源码位置。
export const apiBoundaries = ffxivTools
  .filter((tool) => toolApiBase[tool.id as FfxivToolId])
  .map((tool) => {
    const meta = getDevToolMeta(tool.id)

    return {
      id: tool.id as FfxivToolId,
      projectName: tool.projectName,
      apiBase: toolApiBase[tool.id as FfxivToolId] ?? '',
      healthPath: tool.id === 'plate' ? '/presets' : '/health',
      devPort: meta?.devPort ?? 0,
      sourcePath: meta?.sourcePath ?? ''
    }
  }) satisfies ApiBoundary[]

export function getApiBoundary(id: FfxivToolId): ApiBoundary {
  const boundary = apiBoundaries.find((item) => item.id === id)

  if (!boundary) {
    throw new Error(`Unknown API boundary: ${id}`)
  }

  return boundary
}
