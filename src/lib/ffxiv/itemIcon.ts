const FFXIV_ITEM_ICON_BASE_URL = 'https://img.nightingalesilence.com'

export function getFfxivItemIconUrl(iconId: number | undefined): string {
  if (typeof iconId !== 'number' || iconId <= 0) {
    return ''
  }

  const normalizedIconId = Math.trunc(iconId)
  const iconFolder = (Math.floor(normalizedIconId / 1000) * 1000).toString().padStart(6, '0')
  const iconFile = normalizedIconId.toString().padStart(6, '0')

  return `${FFXIV_ITEM_ICON_BASE_URL}/ui/icon/${iconFolder}/${iconFile}_hr1.png`
}
