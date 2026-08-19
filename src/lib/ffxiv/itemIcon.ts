import {
  GLAMOUR_CONTRACT_HD_FOLDER_EXTRA,
  GLAMOUR_CONTRACT_HD_FOLDER_MAX_EXCLUSIVE,
  GLAMOUR_CONTRACT_HD_FOLDER_MIN
} from '@/lib/glamour/contract.generated'

const FFXIV_ITEM_ICON_BASE_URL = 'https://img.nightingalesilence.com'
const FFXIV_ITEM_ICON_CDN_PATTERN =
  /^https:\/\/img\.nightingalesilence\.com\/ui\/icon\/\d{6}\/(\d{6})_(?:hd|hr1)\.png(?:[?#].*)?$/i
const FFXIV_GLAMOUR_ICON_PROXY_PATTERN = /(?:^|\/)api\/glamour\/icon\/(\d+)(?:[/?#].*)?$/i

// hd 覆盖的段（区间与附加段来自 shared-rules.json 契约，勿手改）
const HD_SEGMENTS = new Set<string>()
for (
  let folder = GLAMOUR_CONTRACT_HD_FOLDER_MIN;
  folder < GLAMOUR_CONTRACT_HD_FOLDER_MAX_EXCLUSIVE;
  folder += 1000
) {
  HD_SEGMENTS.add(folder.toString().padStart(6, '0'))
}
for (const folder of GLAMOUR_CONTRACT_HD_FOLDER_EXTRA) {
  HD_SEGMENTS.add(folder.toString().padStart(6, '0'))
}

function resolveIconPath(iconId: number) {
  const normalizedIconId = Math.trunc(iconId)
  const iconFolder = (Math.floor(normalizedIconId / 1000) * 1000).toString().padStart(6, '0')
  const iconFile = normalizedIconId.toString().padStart(6, '0')
  return { folder: iconFolder, file: iconFile }
}

/** 物品段图标 (hd 覆盖): 返回 _hd.png; 其他段: 返回 _hr1.png */
export function getFfxivItemIconUrl(iconId: number | undefined): string {
  if (typeof iconId !== 'number' || !Number.isFinite(iconId) || iconId <= 0) return ''
  const { folder, file } = resolveIconPath(iconId)
  const suffix = HD_SEGMENTS.has(folder) ? '_hd.png' : '_hr1.png'
  return `${FFXIV_ITEM_ICON_BASE_URL}/ui/icon/${folder}/${file}${suffix}`
}

/** hr1 兜底 */
export function getFfxivItemIconHr1Url(iconId: number | undefined): string {
  if (typeof iconId !== 'number' || !Number.isFinite(iconId) || iconId <= 0) return ''
  const { folder, file } = resolveIconPath(iconId)
  return `${FFXIV_ITEM_ICON_BASE_URL}/ui/icon/${folder}/${file}_hr1.png`
}

/**
 * 将旧图标 URL 或图标 ID 统一到当前 CDN 规则。
 * 仅重写本站 CDN 与幻化 API 代理；其他完整 URL 视为外部资源并保持不变。
 */
export function normalizeFfxivItemIconUrl(iconId: unknown): string {
  if (typeof iconId === 'string') {
    const value = iconId.trim()
    const cdnMatch = value.match(FFXIV_ITEM_ICON_CDN_PATTERN)
    const proxyMatch = value.match(FFXIV_GLAMOUR_ICON_PROXY_PATTERN)
    const matchedIconId = cdnMatch?.[1] || proxyMatch?.[1]
    if (matchedIconId) {
      return getFfxivItemIconUrl(Number(matchedIconId))
    }
    if (/^https?:\/\//i.test(value)) {
      return value
    }
    return getFfxivItemIconUrl(Number(value))
  }

  return getFfxivItemIconUrl(Number(iconId))
}
