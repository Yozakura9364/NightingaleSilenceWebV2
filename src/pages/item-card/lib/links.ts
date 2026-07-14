export function normalizeGlamourLinkUrl(rawUrl: unknown): string {
  const text = String(rawUrl || '').trim()

  if (!text) {
    return ''
  }

  return /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`
}

export type GlamourLinkKind = 'ec' | 'risingstones' | ''

export function getGlamourLinkKind(rawUrl: unknown): GlamourLinkKind {
  const normalizedUrl = normalizeGlamourLinkUrl(rawUrl)

  if (!normalizedUrl) {
    return ''
  }

  let url: URL

  try {
    url = new URL(normalizedUrl)
  } catch {
    return ''
  }

  if (url.hostname === 'ffxiv.eorzeacollection.com') {
    return 'ec'
  }

  if (url.hostname === 'ff14risingstones.web.sdo.com') {
    return 'risingstones'
  }

  return ''
}

export function isSupportedGlamourLinkUrl(rawUrl: unknown): boolean {
  return Boolean(getGlamourLinkKind(rawUrl))
}
