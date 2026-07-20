export type SiteSocialLinkId = 'huiji' | 'nga' | 'xiaohongshu' | 'weibo' | 'douyin'

export interface SiteSocialLink {
  id: SiteSocialLinkId
  href: string
  icon: string
  domain: string
}

export const siteSocialLinks: readonly SiteSocialLink[] = [
  {
    id: 'huiji',
    href: 'https://ff14.huijiwiki.com/wiki/%E5%88%86%E7%B1%BB:%E4%BD%9C%E8%80%85NIGHTINGALE',
    icon: '/assets/icons/huiji.svg',
    domain: 'ff14.huijiwiki.com'
  },
  {
    id: 'nga',
    href: 'https://nga.178.com/thread.php?authorid=12605886',
    icon: '/assets/icons/nga.svg',
    domain: 'nga.178.com'
  },
  {
    id: 'xiaohongshu',
    href: 'https://xhslink.com/m/2xLfxolEhzS',
    icon: '/assets/icons/xiaohongshu.svg',
    domain: 'xhslink.com'
  },
  {
    id: 'weibo',
    href: 'https://weibo.com/1734754935?refer_flag=1001030103_',
    icon: '/assets/icons/weibo.svg',
    domain: 'weibo.com'
  },
  {
    id: 'douyin',
    href: 'https://www.douyin.com/user/MS4wLjABAAAAtHfFkouTFs-quaZJ9EEgYjkWIa32xJSgiqNklbNuqQY',
    icon: '/assets/icons/douyin.svg',
    domain: 'douyin.com'
  }
]
