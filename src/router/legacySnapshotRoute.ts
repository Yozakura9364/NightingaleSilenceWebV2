const SNAPSHOT_PATH_PATTERN = /^\/g\/([A-Za-z0-9]{1,10})\/?$/

export interface SnapshotEntryLocation {
  pathname: string
  search: string
  hash: string
}

/**
 * Convert the public /g/<id> entry into the hash route used by the V2 router.
 * The pathname remains /g/<id>, so shared links keep their public shape.
 */
export function createV2SnapshotHashRoute(location: SnapshotEntryLocation): string {
  if (location.hash) return ''

  const match = SNAPSHOT_PATH_PATTERN.exec(location.pathname)
  if (!match) return ''

  const params = new URLSearchParams(location.search)
  const locale = params.get('lang')?.trim()
  const query = locale ? `?lang=${encodeURIComponent(locale)}` : ''
  return `#/ffxiv/glamour/equipinfo/${encodeURIComponent(match[1])}${query}`
}
