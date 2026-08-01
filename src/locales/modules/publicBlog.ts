import { msg } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

// Fixed reader UI copy only — article titles/summaries/body/tags stay as author-authored.
export const publicBlogUiMessages: UiMessageMap = {
  'publicBlog.pageTitle': msg({ zh: '博客', en: 'Blog', ja: 'ブログ', ko: '블로그' }),
  'publicBlog.indexSubtitle': msg({ zh: '已发布内容索引', en: 'Published content index', ja: '公開済みコンテンツ一覧', ko: '게시된 콘텐츠 목록' }),
  'publicBlog.loading': msg({ zh: '加载中…', en: 'Loading…', ja: '読み込み中…', ko: '불러오는 중…' }),
  'publicBlog.loadFailed': msg({ zh: '内容加载失败，请稍后重试', en: 'Failed to load content, please try again later', ja: 'コンテンツの読み込みに失敗しました。後でもう一度お試しください', ko: '콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요' }),
  'publicBlog.empty': msg({ zh: '暂无已发布内容', en: 'No published content yet', ja: '公開済みコンテンツはありません', ko: '게시된 콘텐츠가 없습니다' }),
  'publicBlog.notFoundTitle': msg({ zh: '内容不存在', en: 'Content not found', ja: 'コンテンツが見つかりません', ko: '콘텐츠를 찾을 수 없습니다' }),
  'publicBlog.notFoundText': msg({ zh: '该内容可能尚未发布、已被撤回或归档。', en: 'This content may not be published yet, or has been withdrawn or archived.', ja: 'このコンテンツは未公開、撤回、またはアーカイブされている可能性があります。', ko: '이 콘텐츠는 아직 게시되지 않았거나 철회 또는 보관되었을 수 있습니다.' }),
  'publicBlog.backToIndex': msg({ zh: '返回博客首页', en: 'Back to blog home', ja: 'ブログトップへ戻る', ko: '블로그 홈으로 돌아가기' }),
} as const
