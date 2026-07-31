// Media URL policy — validates image URLs for safety and host allowlist

const CONTENT_IMAGE_HOST = 'img.nightingalesilence.com'

// COS and cloud CDN temporary signature parameters.
// Matching is case-insensitive; any URL containing these is NOT permanent.
const TEMP_PARAM_PREFIXES = ['x-amz-']
const TEMP_PARAM_EXACT = new Set([
  'awskey', 'awsaccesskeyid', 'signature', 'expires',
  'token', 'sig', 'sign', 'auth', 'key', 'accesskeyid',
  'ossaccesskeyid', 'response-content-disposition',
  'policy', 'key-pair-id', 'x-amz-content-sha256'
])

export const ALLOWED_IMAGE_HOSTS = [CONTENT_IMAGE_HOST]

function isTempParam(key: string): boolean {
  const lower = key.toLowerCase()
  if (TEMP_PARAM_EXACT.has(lower)) return true
  for (const prefix of TEMP_PARAM_PREFIXES) {
    if (lower.startsWith(prefix)) return true
  }
  return false
}

export function isAllowedImageHost(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)
  } catch { return false }
}

export function isPermanentContentUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (!ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)) return false
    for (const key of parsed.searchParams.keys()) {
      if (isTempParam(key)) return false
    }
    return true
  } catch { return false }
}

export function isDangerousProtocol(url: string): boolean {
  return /^(javascript|data|vbscript):/i.test(url)
}

export function normalizeContentUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    if (!ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)) return null
    for (const key of parsed.searchParams.keys()) {
      if (isTempParam(key)) return null
    }
    return `${parsed.origin}${parsed.pathname}`
  } catch { return null }
}
