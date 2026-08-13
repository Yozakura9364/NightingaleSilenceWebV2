const FFXIV_ITEM_ICON_BASE_URL = 'https://img.nightingalesilence.com'
const FFXIV_ITEM_ICON_CDN_PATTERN =
  /^https:\/\/img\.nightingalesilence\.com\/ui\/icon\/\d{6}\/(\d{6})_(?:hd|hr1)\.png(?:[?#].*)?$/i
const FFXIV_GLAMOUR_ICON_PROXY_PATTERN = /(?:^|\/)api\/glamour\/icon\/(\d+)(?:[/?#].*)?$/i

// hd 覆盖的段 (020000-059000 + 200000, 桶内存在 _hd.png 的段)
const HD_SEGMENTS = new Set<string>()
for (let i = 20; i < 60; i++) HD_SEGMENTS.add(String(i).padStart(3, '0') + '000')
HD_SEGMENTS.add('200000')

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
