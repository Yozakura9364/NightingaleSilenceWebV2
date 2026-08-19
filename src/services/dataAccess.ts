// 统一数据访问路径解析：三类消费路径的唯一定义点。
// 1) public/data 静态数据（/data/**）；2) 后端 API（apiBase 约定）；
// 3) NSPlate manifest/CDN 素材根。业务代码不得散落拼接这些路径。

import { nsplateManifestBase } from '@/config/env'

/** 公开静态数据路径（public/data/** 由构建以 /data/** 提供）。 */
export function resolvePublicDataPath(relativePath: string): string {
  const normalized = String(relativePath || '').replace(/^\/+/, '')
  return `/data/${normalized}`
}

/** 后端 API 路径拼接（apiBase 来自 site/apiBoundaries 约定）。 */
export function normalizeApiPath(apiBase: string, path: string): string {
  const base = String(apiBase || '').replace(/\/+$/, '')
  const suffix = String(path || '').replace(/^\/+/, '')
  return suffix ? `${base}/${suffix}` : base
}

/** NSPlate 静态 manifest 根（env 优先，默认 /data/plate）。 */
export function resolveNSPlateManifestBase(): string {
  return String(nsplateManifestBase || '/data/plate').replace(/\/+$/, '')
}
