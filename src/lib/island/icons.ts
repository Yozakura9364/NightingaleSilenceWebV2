// 无人岛物品图标 URL：复用幻化共享图标服务（/api/glamour/icon/{id}），
// 与物品卡片同一 API 边界（apiBoundaries.ts）。
import { buildGlamourIconUrl } from '@/lib/glamour/equipment'
import { getApiBoundary } from '@/services/apiBoundaries'

export function islandIconUrl(iconId: number | null | undefined): string | null {
  if (!iconId || iconId <= 0) {
    return null
  }
  return buildGlamourIconUrl(getApiBoundary('island').apiBase, iconId)
}
