import { msg, placeholder, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const coreUiMessages: UiMessageMap = {
  'common.placeholder': same(placeholder),
  'common.back': msg({ zh: '返回', en: 'Back', ja: '戻る', ko: '뒤로' }),
  'common.enter': msg({ zh: '进入', en: 'Enter', ja: '入る', ko: '들어가기' }),
  'common.children': msg({ zh: '子页面', en: 'Subpages', ja: '子ページ', ko: '하위 페이지' }),
  'common.close.window': msg({
    zh: '关闭窗口',
    en: 'Close window',
    ja: 'ウィンドウを閉じる',
    ko: '창 닫기'
  }),
  'common.close.menu': msg({
    zh: '关闭菜单',
    en: 'Close menu',
    ja: 'メニューを閉じる',
    ko: '메뉴 닫기'
  }),
  'common.close.config': msg({
    zh: '关闭设置',
    en: 'Close settings',
    ja: '設定を閉じる',
    ko: '설정 닫기'
  }),
  'common.items.unit': msg({ zh: '项', en: 'items', ja: '件', ko: '개' }),
  'common.layers.unit': msg({ zh: '层', en: 'layers', ja: '層', ko: '층' }),
  'common.notSelected': msg({
    zh: '未选择',
    en: 'Not selected',
    ja: '未選択',
    ko: '선택 안 됨'
  }),
  'common.noAssets': msg({
    zh: '暂无素材',
    en: 'No assets',
    ja: '素材なし',
    ko: '소재 없음'
  }),
  'common.selectPreset': msg({
    zh: '请选择预设',
    en: 'Select a preset',
    ja: 'プリセットを選択',
    ko: '프리셋 선택'
  }),
  'common.previousPreset': msg({
    zh: '上一个预设',
    en: 'Previous preset',
    ja: '前のプリセット',
    ko: '이전 프리셋'
  }),
  'common.nextPreset': msg({
    zh: '下一个预设',
    en: 'Next preset',
    ja: '次のプリセット',
    ko: '다음 프리셋'
  }),
  'common.check': msg({ zh: '检查', en: 'Check', ja: '確認', ko: '확인' }),
  'common.checking': msg({ zh: '检查中', en: 'Checking', ja: '確認中', ko: '확인 중' }),
  'common.retry': msg({ zh: '重试', en: 'Retry', ja: '再試行', ko: '재시도' }),
  'common.ok': msg({ zh: '确定', en: 'OK', ja: 'OK', ko: '확인' }),
  'common.cancel': msg({ zh: '取消', en: 'Cancel', ja: 'キャンセル', ko: '취소' }),
  'common.api': same('API'),
  'common.project': msg({ zh: '项目', en: 'Project', ja: 'プロジェクト', ko: '프로젝트' }),
  'common.port': msg({ zh: '端口', en: 'Port', ja: 'ポート', ko: '포트' }),
  'common.health': msg({
    zh: '健康检查',
    en: 'Health check',
    ja: 'ヘルスチェック',
    ko: '상태 확인'
  }),
  'common.import': msg({ zh: '导入', en: 'Import', ja: 'インポート', ko: '가져오기' }),
  'common.export': msg({ zh: '导出', en: 'Export', ja: 'エクスポート', ko: '내보내기' }),
  'common.save': msg({ zh: '保存', en: 'Save', ja: '保存', ko: '저장' }),
  'common.saveDraft': msg({
    zh: '保存草稿',
    en: 'Save draft',
    ja: '下書きを保存',
    ko: '초안 저장'
  }),
  'common.open': msg({ zh: '打开', en: 'Open', ja: '開く', ko: '열기' }),
  'common.details': msg({ zh: '详情', en: 'Details', ja: '詳細', ko: '자세히' }),
  'common.status': msg({ zh: '状态', en: 'Status', ja: 'ステータス', ko: '상태' }),
  'common.toolbar': msg({ zh: '工具栏', en: 'Toolbar', ja: 'ツールバー', ko: '도구 모음' }),
  'common.tabs': msg({ zh: '选项卡', en: 'Tabs', ja: 'タブ', ko: '탭' }),
  'common.primaryNavigation': msg({
    zh: '主导航',
    en: 'Primary navigation',
    ja: 'メインナビゲーション',
    ko: '기본 탐색'
  }),
  'common.skipToMainContent': msg({
    zh: '跳到主要内容',
    en: 'Skip to main content',
    ja: 'メインコンテンツへ移動',
    ko: '본문으로 건너뛰기'
  }),
  'site.name.zh': same('夜莺不语'),
  'site.name.en': same('Nightingale Silence'),
  'site.title': same('夜莺不语 / Nightingale Silence'),
  'site.description': same(placeholder),
  'site.nav.menu': msg({ zh: '菜单', en: 'Menu', ja: 'メニュー', ko: '메뉴' }),
  'site.nav.menuCommand': same('MENU'),
  'site.nav.menuCategory': msg({
    zh: '菜单分类',
    en: 'Menu sections',
    ja: 'メニュー分類',
    ko: '메뉴 분류'
  }),
  'site.nav.homeCommand': same('HOME'),
  'site.nav.config': msg({ zh: '设置', en: 'Config', ja: '設定', ko: '설정' }),
  'site.nav.configCommand': same('CONFIG'),
  'site.nav.about': msg({ zh: '关于', en: 'About', ja: 'About', ko: 'About' }),
  'site.nav.aboutCommand': same('ABOUT'),
  'site.nav.silenceCommand': same('SILENCE'),
  'site.nav.home': msg({ zh: '回到主页', en: 'Home', ja: 'ホームへ', ko: '홈으로' }),
  'site.window.menuTitle': same('MENU.EXE'),
  'site.window.configTitle': same('CONFIG.EXE'),
  'site.theme.mode': msg({ zh: '显示模式', en: 'Display mode', ja: '表示モード', ko: '표시 모드' }),
  'site.theme.day': msg({ zh: '白天', en: 'Day', ja: '昼', ko: '낮' }),
  'site.theme.dayCommand': same('DAY'),
  'site.theme.night': msg({ zh: '黑夜', en: 'Night', ja: '夜', ko: '밤' }),
  'site.theme.nightCommand': same('NIGHT'),
  'site.language.mode': msg({ zh: '语言', en: 'Language', ja: '言語', ko: '언어' }),
  'site.locale.zh.label': same('中'),
  'site.locale.ja.label': same('日'),
  'site.locale.ko.label': same('韩'),
  'site.locale.en.label': same('英'),
  'site.locale.zh.command': same('CN'),
  'site.locale.ja.command': same('JP'),
  'site.locale.ko.command': same('KR'),
  'site.locale.en.command': same('EN'),
  'site.status.open': same('OPEN'),
  'site.status.wip': same('WIP'),
  'site.menu.silence': same('Silence'),
  'site.menu.oc': same('OC'),
  'site.menu.silenceAngel': same('不语·silence'),
  'site.menu.silenceGlitch': same('幽灵·silence'),
  'ffxiv.workshop.title': msg({
    zh: '狒狒14工房',
    en: 'FFXIV Workshop',
    ja: 'FFXIV工房',
    ko: 'FFXIV 공방'
  }),
  'ffxiv.workshop.short': msg({ zh: '狒狒14', en: 'FFXIV', ja: 'FFXIV', ko: 'FFXIV' }),
  'ffxiv.workshop.kicker': msg({
    zh: 'FFXIV 工具',
    en: 'FFXIV tools',
    ja: 'FFXIVツール',
    ko: 'FFXIV 도구'
  }),
  'ffxiv.tool.badge': msg({ zh: '工具', en: 'Tool', ja: 'ツール', ko: '도구' }),
  'ffxiv.tool.itemCard.title': same('物品卡片'),
  'ffxiv.tool.glamour.title': same('幻化工房'),
  'ffxiv.tool.plate.title': same('铭牌工房'),
  'ffxiv.tool.fashionCheck.title': msg({
    zh: '时尚品鉴',
    en: 'Fashion Check',
    ja: '时尚品鉴',
    ko: '时尚品鉴'
  }),
  'ffxiv.tool.fashionCheck.summary': msg({
    zh: '本周方案',
    en: 'Weekly solutions',
    ja: '本周方案',
    ko: '本周方案'
  }),
  'ffxiv.tool.armoire.title': same('衣柜管家'),
  'ffxiv.termReview.title': msg({
    zh: 'FFXIV 术语校对',
    en: 'FFXIV term review',
    ja: 'FFXIV用語確認',
    ko: 'FFXIV 용어 확인'
  }),
  'ffxiv.termReview.kicker': msg({
    zh: '内部校对',
    en: 'Internal review',
    ja: '内部確認',
    ko: '내부 확인'
  }),
  'ffxiv.termReview.lead': msg({
    zh: '用于核对游戏 CSV 术语、旧字段和网页 UI 文案边界。',
    en: 'Review game CSV terms, legacy fields, and site UI copy boundaries.',
    ja: 'ゲームCSV用語、旧フィールド、サイトUI文言の境界を確認します。',
    ko: '게임 CSV 용어, 기존 필드, 사이트 UI 문구 경계를 확인합니다.'
  }),
  'ffxiv.termReview.filters': msg({
    zh: '术语筛选',
    en: 'Term filters',
    ja: '用語フィルター',
    ko: '용어 필터'
  }),
  'ffxiv.termReview.search': msg({
    zh: '搜索',
    en: 'Search',
    ja: '検索',
    ko: '검색'
  }),
  'ffxiv.termReview.search.placeholder': msg({
    zh: '搜索 key、旧字段、CSV、备注或译文',
    en: 'Search key, legacy field, CSV, note, or translation',
    ja: 'key、旧フィールド、CSV、メモ、訳文を検索',
    ko: 'key, 기존 필드, CSV, 메모, 번역 검색'
  }),
  'ffxiv.termReview.module': msg({
    zh: '模块',
    en: 'Module',
    ja: 'モジュール',
    ko: '모듈'
  }),
  'ffxiv.termReview.status': msg({
    zh: '状态',
    en: 'Status',
    ja: '状態',
    ko: '상태'
  }),
  'ffxiv.termReview.source': msg({
    zh: '来源',
    en: 'Source',
    ja: '出典',
    ko: '출처'
  }),
  'ffxiv.termReview.all': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'ffxiv.termReview.summary': msg({
    zh: '术语统计',
    en: 'Term summary',
    ja: '用語サマリー',
    ko: '용어 요약'
  }),
  'ffxiv.termReview.visible': msg({
    zh: '当前显示',
    en: 'Visible',
    ja: '表示中',
    ko: '표시 중'
  }),
  'ffxiv.termReview.total': msg({
    zh: '总数',
    en: 'Total',
    ja: '合計',
    ko: '전체'
  }),
  'ffxiv.termReview.needsCheck': msg({
    zh: '待核对',
    en: 'Needs check',
    ja: '要確認',
    ko: '확인 필요'
  }),
  'ffxiv.termReview.column.term': msg({
    zh: '条目',
    en: 'Term',
    ja: '項目',
    ko: '항목'
  }),
  'ffxiv.termReview.column.values': msg({
    zh: '多语言值',
    en: 'Localized values',
    ja: '多言語値',
    ko: '다국어 값'
  }),
  'ffxiv.termReview.column.status': msg({
    zh: '状态',
    en: 'Status',
    ja: '状態',
    ko: '상태'
  }),
  'ffxiv.termReview.column.source': msg({
    zh: '数据来源',
    en: 'Data source',
    ja: 'データ出典',
    ko: '데이터 출처'
  }),
  'ffxiv.termReview.column.note': msg({
    zh: '备注',
    en: 'Note',
    ja: 'メモ',
    ko: '메모'
  }),
  'ffxiv.termReview.legacy': msg({
    zh: '旧字段',
    en: 'Legacy',
    ja: '旧フィールド',
    ko: '기존 필드'
  }),
  'ffxiv.termReview.composedFrom': msg({
    zh: '组合来源',
    en: 'Composed from',
    ja: '組み合わせ元',
    ko: '조합 출처'
  }),
  'ffxiv.termReview.missingValue': msg({
    zh: '缺值',
    en: 'Missing',
    ja: '未設定',
    ko: '누락'
  }),
  'ffxiv.termReview.status.confirmed': msg({
    zh: '已确认',
    en: 'Confirmed',
    ja: '確認済み',
    ko: '확인됨'
  }),
  'ffxiv.termReview.status.needsCheck': msg({
    zh: '待核对',
    en: 'Needs check',
    ja: '要確認',
    ko: '확인 필요'
  }),
  'ffxiv.termReview.status.layout': msg({
    zh: '布局字段',
    en: 'Layout field',
    ja: 'レイアウト項目',
    ko: '레이아웃 필드'
  }),
  'ffxiv.termReview.source.gameCsv': msg({
    zh: '游戏 CSV',
    en: 'Game CSV',
    ja: 'ゲームCSV',
    ko: '게임 CSV'
  }),
  'ffxiv.termReview.source.legacyLayout': msg({
    zh: '旧布局',
    en: 'Legacy layout',
    ja: '旧レイアウト',
    ko: '기존 레이아웃'
  }),
  'ffxiv.termReview.source.userConfirmed': msg({
    zh: '用户确认',
    en: 'User confirmed',
    ja: 'ユーザー確認',
    ko: '사용자 확인'
  }),
  'ffxiv.termReview.source.siteUi': msg({
    zh: '网页 UI',
    en: 'Site UI',
    ja: 'サイトUI',
    ko: '사이트 UI'
  })
}

export default coreUiMessages
