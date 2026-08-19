// FFXIV 社区活动数据服务 — 运行时源优先，静态回退（与旧行为一致）。

import { useFetch } from '@/composables/useFetch'
import { ffxivCommunityEventsUrl } from '@/config/env'
import { resolvePublicDataPath } from '@/services/dataAccess'
import {
  parseCommunityEventsDocument,
  type CommunityEventsDocument
} from '@/lib/ffxiv/time/communityEvents'

const STATIC_EVENTS_URL = resolvePublicDataPath('ffxiv/community-events.json')

function getSourceUrls(): string[] {
  const runtimeUrl = ffxivCommunityEventsUrl.trim()
  return [...new Set([runtimeUrl, STATIC_EVENTS_URL].filter((url): url is string => Boolean(url)))]
}

/** 依次尝试运行时源与静态回退；全部失败时抛错，由调用方决定错误态。 */
export async function loadCommunityEventsDocument(): Promise<CommunityEventsDocument> {
  const { api } = useFetch()

  for (const url of getSourceUrls()) {
    try {
      return parseCommunityEventsDocument(await api<unknown>(url, { cache: 'no-store' }))
    } catch {
      // Try the checked-in fallback before exposing an error state.
    }
  }

  throw new Error('All community events sources failed')
}
