// 开发/调试专用工具元数据：后端端口与源码路径只供调试壳（ToolApiStatus /
// FfxivToolShell）展示，业务代码不得依赖 devPort/sourcePath 做任何运行时决策——
// 请求一律走 src/services/apiBoundaries.ts 的 apiBase 路径约定。
// apiBoundaries 为兼容既有 ApiBoundary 形状会读取本模块，字段仅为展示用途。
//
// 类型引用自 apiBoundaries（type-only，编译期擦除，无运行时环）。

import type { FfxivToolId } from '@/services/apiBoundaries'

export interface DevToolMetaEntry {
  sourcePath: string
  devPort?: number
}

export const devToolMeta: Partial<Record<FfxivToolId, DevToolMetaEntry>> = {
  plate: { sourcePath: '../NSPortable', devPort: 3456 },
  glamour: { sourcePath: 'server/glamour', devPort: 8766 },
  itemCard: { sourcePath: 'server/glamour', devPort: 8766 }
}

export function getDevToolMeta(id: string): DevToolMetaEntry | undefined {
  return devToolMeta[id as FfxivToolId]
}
