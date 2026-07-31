export const GLAMOUR_SNAPSHOT_API_BASE = '/glamour/api'
export const GLAMOUR_SNAPSHOT_PUBLIC_ORIGIN = 'https://nsffxiv.com'

const SNAPSHOT_LOCALE_URL_VALUES: Record<string, string> = {
  ja: 'ja',
  en: 'en',
  fr: 'fr',
  de: 'de',
  zh: 'zh-CN',
  tc: 'zh-TW',
  ko: 'ko'
}

export function createGlamourSnapshotUrl(snapshotId: string, locale: string): string {
  const url = new URL(
    `/g/${encodeURIComponent(String(snapshotId || '').trim())}`,
    GLAMOUR_SNAPSHOT_PUBLIC_ORIGIN
  )
  const language = SNAPSHOT_LOCALE_URL_VALUES[locale]
  if (language) {
    url.searchParams.set('lang', language)
  }
  return url.href
}
