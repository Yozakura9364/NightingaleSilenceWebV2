import { msg, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const aboutUiMessages: UiMessageMap = {
  'about.profile': msg({ zh: '个人介绍', en: 'Profile', ja: 'プロフィール', ko: '프로필' }),
  'about.sns': same('SNS'),
  'about.friends': msg({ zh: '友链', en: 'Friends', ja: 'リンク', ko: '친구 링크' }),
  'about.siteInfo': msg({ zh: '本站信息', en: 'Site info', ja: 'サイト情報', ko: '사이트 정보' }),
  'about.siteName': msg({ zh: '站名', en: 'Name', ja: 'サイト名', ko: '사이트명' }),
  'about.siteUrl': msg({ zh: '网址', en: 'URL', ja: 'URL', ko: 'URL' }),
  'about.siteIcon': msg({ zh: '网站图标', en: 'Logo URL', ja: 'ロゴURL', ko: '로고 URL' }),
  'about.social.huiji': same('灰机wiki'),
  'about.social.nga': same('NGA'),
  'about.social.xiaohongshu': same('小红书'),
  'about.social.weibo': same('微博'),
  'about.social.douyin': same('抖音'),
  'about.friend.flowersink': same('花墨'),
  'about.opensInNewTab': msg({ zh: '（在新标签页中打开）', en: '（opens in new tab）', ja: '（新しいタブで開く）', ko: '（새 탭에서 열기）' })
}
