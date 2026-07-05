import type { Locale } from '@/stores/locale'

export type UiMessageMap = Record<string, Record<Locale, string>>

const placeholder = '占位用，待编辑'
const draftSuffix = '（占位用，待编辑）'

function draft(value: string): string {
  return `${value}${draftSuffix}`
}

function same(value: string): Record<Locale, string> {
  return {
    'zh-CN': value,
    en: value,
    ja: value,
    ko: value,
    fr: value,
    de: value
  }
}

function msg(values: {
  zh: string
  en: string
  ja: string
  ko: string
  fr?: string
  de?: string
}): Record<Locale, string> {
  return {
    'zh-CN': values.zh,
    en: values.en,
    ja: values.ja,
    ko: values.ko,
    fr: values.fr ?? values.en,
    de: values.de ?? values.en
  }
}

export const uiMessages: UiMessageMap = {
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
  'nsplate.search.presets': msg({
    zh: '搜索预设名称 / ID',
    en: 'Search preset name / ID',
    ja: 'プリセット名 / IDを検索',
    ko: '프리셋 이름 / ID 검색'
  }),
  'nsplate.search.assets': msg({
    zh: '搜索素材名称 / ID',
    en: 'Search asset name / ID',
    ja: '素材名 / IDを検索',
    ko: '소재 이름 / ID 검색'
  }),
  'nsplate.search.noResults': msg({
    zh: '没有匹配结果',
    en: 'No matches',
    ja: '一致する結果がありません',
    ko: '일치하는 결과 없음'
  }),
  'nsplate.search.clear': msg({
    zh: '清除搜索',
    en: 'Clear search',
    ja: '検索をクリア',
    ko: '검색 지우기'
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

  'home.social.title': msg({
    zh: '站外链接',
    en: 'Links',
    ja: '外部リンク',
    ko: '외부 링크'
  }),
  'home.social.huiji': same('灰机wiki'),
  'home.social.nga': same('NGA'),
  'home.social.xiaohongshu': same('小红书'),
  'home.social.weibo': same('微博'),
  'home.social.douyin': same('抖音'),

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
  'silence.group.angel.title': same('不语·silence'),
  'silence.group.glitch.title': same('幽灵·silence'),
  'silence.character.profile': msg({
    zh: '档案',
    en: 'Profile',
    ja: 'プロフィール',
    ko: '프로필'
  }),
  'silence.character.visual': msg({
    zh: '视觉',
    en: 'Visual',
    ja: 'ビジュアル',
    ko: '비주얼'
  }),
  'silence.character.archive': msg({
    zh: '资料',
    en: 'Archive',
    ja: '資料',
    ko: '자료'
  }),
  'silence.character.notes': msg({
    zh: '笔记',
    en: 'Notes',
    ja: 'ノート',
    ko: '노트'
  }),
  'silence.character.navigation': msg({
    zh: '角色导航',
    en: 'Character navigation',
    ja: 'キャラクターナビゲーション',
    ko: '캐릭터 탐색'
  }),
  'silence.character.missing': msg({
    zh: '角色未找到',
    en: 'Character not found',
    ja: 'キャラクターが見つかりません',
    ko: '캐릭터를 찾을 수 없음'
  }),
  'silence.character.sections': msg({
    zh: '档案分区',
    en: 'Profile sections',
    ja: 'プロフィール区分',
    ko: '프로필 섹션'
  }),
  'silence.character.basicProfile': msg({
    zh: '基础档案',
    en: 'Basic profile',
    ja: '基本プロフィール',
    ko: '기본 프로필'
  }),
  'silence.character.worlds': msg({
    zh: '世界线',
    en: 'World lines',
    ja: '世界線',
    ko: '세계선'
  }),
  'silence.character.gallery': msg({
    zh: '图像资料',
    en: 'Visual archive',
    ja: '画像資料',
    ko: '이미지 자료'
  }),
  'silence.character.relationships': msg({
    zh: '关系网',
    en: 'Relationships',
    ja: '関係',
    ko: '관계'
  }),
  'silence.character.spoiler': msg({
    zh: '剧透区',
    en: 'Spoilers',
    ja: 'ネタバレ',
    ko: '스포일러'
  }),
  'silence.character.preview': msg({
    zh: '预览',
    en: 'Preview',
    ja: 'プレビュー',
    ko: '미리보기'
  }),
  'silence.character.color': msg({
    zh: '代表色',
    en: 'Signature color',
    ja: '代表色',
    ko: '대표색'
  }),
  'silence.character.draftStatus': msg({
    zh: '资料状态',
    en: 'Archive status',
    ja: '資料ステータス',
    ko: '자료 상태'
  }),
  'silence.character.forms': msg({
    zh: '形态切换',
    en: 'Form switcher',
    ja: '形態切替',
    ko: '형태 전환'
  }),

  'ffxiv.workshop.title': msg({
    zh: '狒狒14工房',
    en: 'FFXIV Workshop',
    ja: 'FFXIV工房',
    ko: 'FFXIV 공방'
  }),
  'ffxiv.workshop.short': msg({ zh: '狒狒14', en: 'FFXIV', ja: 'FFXIV', ko: 'FFXIV' }),
  'ffxiv.tool.glamour.title': same('幻化工房'),
  'ffxiv.tool.plate.title': same('铭牌工房'),
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
  }),

  'nsarmoire.panel.import': msg({
    zh: draft('导入'),
    en: 'Import',
    ja: 'インポート',
    ko: '가져오기'
  }),
  'nsarmoire.panel.overview': msg({
    zh: draft('概览'),
    en: 'Overview',
    ja: '概要',
    ko: '개요'
  }),
  'nsarmoire.panel.distribution': msg({
    zh: draft('容器分布'),
    en: 'Container distribution',
    ja: 'コンテナ分布',
    ko: '컨테이너 분포'
  }),
  'nsarmoire.panel.insights': msg({
    zh: draft('分析'),
    en: 'Analysis',
    ja: '分析',
    ko: '분석'
  }),
  'nsarmoire.panel.catalogGrid': msg({
    zh: '图鉴',
    en: 'Catalog',
    ja: 'カタログ',
    ko: '도감'
  }),
  'nsarmoire.panel.validation': msg({
    zh: '判定依据',
    en: 'Validation evidence',
    ja: '判定根拠',
    ko: '판정 근거'
  }),
  'nsarmoire.panel.cabinetProgress': msg({
    zh: draft('收藏柜进度'),
    en: 'Armoire progress',
    ja: '愛蔵品キャビネット進捗',
    ko: '애장품 보관함 진행'
  }),
  'nsarmoire.panel.glamourSetProgress': msg({
    zh: draft('套装投影'),
    en: 'Glamour sets',
    ja: 'ミラージュセット',
    ko: '투영 세트'
  }),
  'nsarmoire.panel.dyeRisk': msg({
    zh: draft('染色风险'),
    en: 'Dye risk',
    ja: '染色リスク',
    ko: '염색 위험'
  }),
  'nsarmoire.panel.identicalModels': msg({
    zh: draft('同模型重复'),
    en: 'Duplicate models',
    ja: '同一モデル重複',
    ko: '동일 모델 중복'
  }),
  'nsarmoire.panel.actionHints': msg({
    zh: draft('处理提示'),
    en: 'Action hints',
    ja: '処理ヒント',
    ko: '처리 힌트'
  }),
  'nsarmoire.panel.characterProfile': msg({
    zh: '角色配置',
    en: 'Character settings',
    ja: 'キャラクター設定',
    ko: '캐릭터 설정'
  }),
  'nsarmoire.section.navigation': msg({
    zh: '衣柜工具分区',
    en: 'Armoire sections',
    ja: '衣装整理セクション',
    ko: '의상 정리 섹션'
  }),
  'nsarmoire.section.rail.collapse': msg({
    zh: '收起分区栏',
    en: 'Collapse section rail',
    ja: 'セクションバーを折りたたむ',
    ko: '섹션 바 접기'
  }),
  'nsarmoire.section.rail.expand': msg({
    zh: '展开分区栏',
    en: 'Expand section rail',
    ja: 'セクションバーを展開',
    ko: '섹션 바 펼치기'
  }),
  'nsarmoire.section.cleanup': msg({
    zh: '衣柜清理',
    en: 'Wardrobe cleanup',
    ja: '衣装整理',
    ko: '의상 정리'
  }),
  'nsarmoire.section.cleanup.short': msg({ zh: '清', en: 'Clean', ja: '整', ko: '정' }),
  'nsarmoire.section.collection': msg({
    zh: '查漏补缺',
    en: 'Collection gaps',
    ja: '不足確認',
    ko: '누락 확인'
  }),
  'nsarmoire.section.collection.short': msg({ zh: '补', en: 'Gaps', ja: '補', ko: '누' }),
  'nsarmoire.section.characters': msg({
    zh: '角色配置',
    en: 'Characters',
    ja: 'キャラクター',
    ko: '캐릭터'
  }),
  'nsarmoire.section.characters.short': msg({ zh: '角', en: 'Char', ja: '人', ko: '캐' }),
  'nsarmoire.section.actions': msg({
    zh: '整理建议',
    en: 'Cleanup suggestions',
    ja: '整理提案',
    ko: '정리 제안'
  }),
  'nsarmoire.section.storage': msg({
    zh: '衣服在哪',
    en: 'Where gear is',
    ja: '装備の場所',
    ko: '장비 위치'
  }),
  'nsarmoire.section.reference': msg({
    zh: '核对资料',
    en: 'Reference',
    ja: '確認資料',
    ko: '확인 자료'
  }),
  'nsarmoire.section.catalogData': msg({
    zh: '静态数据',
    en: 'Static data',
    ja: '静的データ',
    ko: '정적 데이터'
  }),
  'nsarmoire.section.collection.loading': msg({
    zh: '整理查漏补缺',
    en: 'Preparing collection gaps',
    ja: '不足確認を準備中',
    ko: '누락 확인 준비 중'
  }),
  'nsarmoire.collection.storeStats': msg({
    zh: '商城统计',
    en: 'Store stats',
    ja: 'ストア統計',
    ko: '상점 통계'
  }),
  'nsarmoire.collection.cabinetStats': msg({
    zh: '收藏柜统计',
    en: 'Armoire stats',
    ja: '愛蔵品キャビネット統計',
    ko: '애장품 보관함 통계'
  }),
  'nsarmoire.collection.glamourSetStats': msg({
    zh: '套装幻影化统计',
    en: 'Glamour set stats',
    ja: 'ミラージュセット統計',
    ko: '투영 세트 통계'
  }),
  'nsarmoire.collection.catalog': msg({
    zh: '图鉴',
    en: 'Catalog',
    ja: 'カタログ',
    ko: '도감'
  }),
  'nsarmoire.collection.needsCatalog': msg({
    zh: '需要先读取静态数据。',
    en: 'Static data must be loaded first.',
    ja: '先に静的データを読み込む必要があります。',
    ko: '먼저 정적 데이터를 불러와야 합니다.'
  }),
  'nsarmoire.collection.noItems': msg({
    zh: '暂无条目。',
    en: 'No entries.',
    ja: '項目はありません。',
    ko: '항목이 없습니다.'
  }),
  'nsarmoire.collection.status.stored': msg({
    zh: '已收纳',
    en: 'Stored',
    ja: '収納済み',
    ko: '수납됨'
  }),
  'nsarmoire.collection.status.missing': msg({
    zh: '未收纳',
    en: 'Missing',
    ja: '未収納',
    ko: '미수납'
  }),
  'nsarmoire.collection.status.transferable': msg({
    zh: '可转入',
    en: 'Transferable',
    ja: '移動可能',
    ko: '이동 가능'
  }),
  'nsarmoire.collection.cabinet.summary': msg({
    zh: '已收纳 {stored} / {total}，当前可转入 {transferable}，仍未收纳 {missing}。',
    en: '{stored} / {total} stored; {transferable} transferable now; {missing} still missing.',
    ja: '{stored} / {total} 収納済み、現在 {transferable} 件移動可能、{missing} 件未収納。',
    ko: '{stored} / {total} 수납됨, 현재 {transferable}개 이동 가능, {missing}개 미수납.'
  }),
  'nsarmoire.collection.cabinet.transferable': msg({
    zh: '可转入收藏柜',
    en: 'Can move into armoire',
    ja: 'キャビネットへ移動可能',
    ko: '보관함으로 이동 가능'
  }),
  'nsarmoire.collection.cabinet.missing': msg({
    zh: '收藏柜未收纳',
    en: 'Missing from armoire',
    ja: 'キャビネット未収納',
    ko: '보관함 미수납'
  }),
  'nsarmoire.collection.glamourSet.summary': msg({
    zh: '已收纳套装 {stored} / {total}，残缺套装 {incomplete}。',
    en: '{stored} / {total} set baskets stored; {incomplete} incomplete.',
    ja: 'セット収納 {stored} / {total}、不足あり {incomplete} 件。',
    ko: '세트 수납 {stored} / {total}, 불완전 세트 {incomplete}개.'
  }),
  'nsarmoire.collection.glamourSet.empty': msg({
    zh: '暂无套装幻影化条目。',
    en: 'No glamour set entries.',
    ja: 'ミラージュセット項目はありません。',
    ko: '투영 세트 항목이 없습니다.'
  }),
  'nsarmoire.collection.glamourSet.pieces': msg({
    zh: '套装散件',
    en: 'Set pieces',
    ja: 'セット部品',
    ko: '세트 부위'
  }),
  'nsarmoire.collection.glamourSet.complete': msg({
    zh: '已完整',
    en: 'Complete',
    ja: '完了',
    ko: '완료'
  }),
  'nsarmoire.collection.glamourSet.incomplete': msg({
    zh: '残缺',
    en: 'Incomplete',
    ja: '不足あり',
    ko: '불완전'
  }),
  'nsarmoire.collection.glamourSet.notStored': msg({
    zh: '未收纳套装',
    en: 'Set not stored',
    ja: 'セット未収納',
    ko: '세트 미수납'
  }),
  'nsarmoire.panel.storeOutfits': msg({
    zh: '商城统计',
    en: 'Store stats',
    ja: 'ストア統計',
    ko: '상점 통계'
  }),
  'nsarmoire.store.summary': msg({
    zh: '按当前角色仓库检测，不等于商城账号购买记录。',
    en: 'Checked against the current character snapshot; this is not an account purchase record.',
    ja: '現在のキャラクタースナップショットで確認します。アカウント購入履歴ではありません。',
    ko: '현재 캐릭터 스냅샷 기준이며 계정 구매 기록은 아닙니다.'
  }),
  'nsarmoire.store.metric.label': msg({
    zh: '商城统计',
    en: 'Store metrics',
    ja: 'ストア統計',
    ko: '상점 통계'
  }),
  'nsarmoire.store.metric.total': msg({
    zh: '商品',
    en: 'Items',
    ja: '商品',
    ko: '상품'
  }),
  'nsarmoire.store.metric.mapped': msg({
    zh: '已映射',
    en: 'Mapped',
    ja: '対応済み',
    ko: '매핑됨'
  }),
  'nsarmoire.store.metric.detected': msg({
    zh: '已检测到',
    en: 'Detected',
    ja: '検出済み',
    ko: '감지됨'
  }),
  'nsarmoire.store.metric.partial': msg({
    zh: '缺部分',
    en: 'Partial',
    ja: '一部不足',
    ko: '일부 누락'
  }),
  'nsarmoire.store.metric.needsMapping': msg({
    zh: '待校正',
    en: 'Needs mapping',
    ja: '要確認',
    ko: '확인 필요'
  }),
  'nsarmoire.store.search.label': msg({
    zh: '搜索商城套装',
    en: 'Search store outfits',
    ja: 'ストア衣装検索',
    ko: '상점 의상 검색'
  }),
  'nsarmoire.store.search.placeholder': msg({
    zh: '输入商品名或散件名',
    en: 'Product or item name',
    ja: '商品名または部品名',
    ko: '상품명 또는 부위명'
  }),
  'nsarmoire.store.filter.label': msg({
    zh: '状态',
    en: 'Status',
    ja: '状態',
    ko: '상태'
  }),
  'nsarmoire.store.filter.all': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'nsarmoire.store.tags.label': msg({
    zh: '标签',
    en: 'Tags',
    ja: 'タグ',
    ko: '태그'
  }),
  'nsarmoire.store.tag.npcCostume': msg({
    zh: 'NPC时装',
    en: 'NPC costume',
    ja: 'NPC衣装',
    ko: 'NPC 의상'
  }),
  'nsarmoire.store.tag.bonusCostume': msg({
    zh: '特典时装',
    en: 'Bonus costume',
    ja: '特典衣装',
    ko: '특전 의상'
  }),
  'nsarmoire.store.tag.replicaCostume': msg({
    zh: '复制品时装',
    en: 'Replica costume',
    ja: 'レプリカ衣装',
    ko: '복제품 의상'
  }),
  'nsarmoire.store.tag.fanFestivalCostume': msg({
    zh: '粉丝节时装',
    en: 'Fan Festival costume',
    ja: 'ファンフェス衣装',
    ko: '팬페스 의상'
  }),
  'nsarmoire.store.tag.crossoverCostume': msg({
    zh: '其他作品时装',
    en: 'Crossover costume',
    ja: 'コラボ衣装',
    ko: '콜라보 의상'
  }),
  'nsarmoire.store.tag.moonfireFaire': msg({
    zh: '红莲节',
    en: 'Moonfire Faire',
    ja: '紅蓮祭',
    ko: '불꽃축제'
  }),
  'nsarmoire.store.tag.hatchingTide': msg({
    zh: '彩蛋狩猎',
    en: 'Hatching-tide',
    ja: 'エッグハント',
    ko: '에그 헌트'
  }),
  'nsarmoire.store.tag.theRising': msg({
    zh: '新生庆典',
    en: 'The Rising',
    ja: '新生祭',
    ko: '신생제'
  }),
  'nsarmoire.store.tag.starlightCelebration': msg({
    zh: '星芒节',
    en: 'Starlight Celebration',
    ja: '星芒祭',
    ko: '별빛축제'
  }),
  'nsarmoire.store.tag.valentioneDay': msg({
    zh: '恋人节',
    en: "Valentione's Day",
    ja: 'ヴァレンティオンデー',
    ko: '발렌티온 데이'
  }),
  'nsarmoire.store.tag.littleLadiesDay': msg({
    zh: '女儿节',
    en: "Little Ladies' Day",
    ja: 'プリンセスデー',
    ko: '프린세스 데이'
  }),
  'nsarmoire.store.tag.allSaintsWake': msg({
    zh: '守护天节',
    en: "All Saints' Wake",
    ja: '守護天節',
    ko: '수호천절'
  }),
  'nsarmoire.store.tag.heavensturn': msg({
    zh: '降神节',
    en: 'Heavensturn',
    ja: '降神祭',
    ko: '강신제'
  }),
  'nsarmoire.store.tag.goldSaucerFestival': msg({
    zh: '金碟嘉年华',
    en: 'Gold Saucer Festival',
    ja: 'ゴールドソーサー・フェスティバル',
    ko: '골드 소서 축제'
  }),
  'nsarmoire.store.detailTag.maleOnly': msg({
    zh: '男性限定',
    en: 'Male only',
    ja: '男性用',
    ko: '남성 전용'
  }),
  'nsarmoire.store.detailTag.femaleOnly': msg({
    zh: '女性限定',
    en: 'Female only',
    ja: '女性用',
    ko: '여성 전용'
  }),
  'nsarmoire.store.status.complete': msg({
    zh: '已检测到',
    en: 'Detected',
    ja: '検出済み',
    ko: '감지됨'
  }),
  'nsarmoire.store.status.partial': msg({
    zh: '缺部分',
    en: 'Partial',
    ja: '一部不足',
    ko: '일부 누락'
  }),
  'nsarmoire.store.status.missing': msg({
    zh: '未检测到',
    en: 'Not detected',
    ja: '未検出',
    ko: '미감지'
  }),
  'nsarmoire.store.status.needsMapping': msg({
    zh: '待校正',
    en: 'Needs mapping',
    ja: '要確認',
    ko: '확인 필요'
  }),
  'nsarmoire.store.region.cn': msg({
    zh: '国服',
    en: 'CN',
    ja: '中国版',
    ko: '중국 서버'
  }),
  'nsarmoire.store.region.global': msg({
    zh: '国际服',
    en: 'Global',
    ja: 'グローバル',
    ko: '글로벌'
  }),
  'nsarmoire.store.openLink': msg({
    zh: '打开商城',
    en: 'Open store',
    ja: 'ストアを開く',
    ko: '상점 열기'
  }),
  'nsarmoire.store.items.label': msg({
    zh: '散件',
    en: 'Pieces',
    ja: '部品',
    ko: '부위'
  }),
  'nsarmoire.store.items.empty': msg({
    zh: '待补散件',
    en: 'Pieces pending',
    ja: '部品未設定',
    ko: '부위 확인 필요'
  }),
  'nsarmoire.store.empty': msg({
    zh: '没有符合条件的商城套装。',
    en: 'No matching store outfits.',
    ja: '一致するストア衣装はありません。',
    ko: '조건에 맞는 상점 의상이 없습니다.'
  }),
  'nsarmoire.store.catalog.loading': msg({
    zh: '商城表加载中',
    en: 'Loading store catalog',
    ja: 'ストア表を読み込み中',
    ko: '상점 목록 불러오는 중'
  }),
  'nsarmoire.store.catalog.error': msg({
    zh: '商城表加载失败',
    en: 'Store catalog failed to load',
    ja: 'ストア表の読み込みに失敗',
    ko: '상점 목록 불러오기 실패'
  }),
  'nsarmoire.store.catalog.retry': msg({
    zh: '重试',
    en: 'Retry',
    ja: '再試行',
    ko: '다시 시도'
  }),
  'nsarmoire.storeReview.title': msg({
    zh: '商城数据校正',
    en: 'Store data review',
    ja: 'ストアデータ確認',
    ko: '상점 데이터 확인'
  }),
  'nsarmoire.storeReview.summary': msg({
    zh: '用于校正商城套装、散件映射和各地区商城链接。',
    en: 'Review store outfits, piece mappings, and regional store links.',
    ja: 'ストア衣装、部品対応、地域別リンクを確認します。',
    ko: '상점 의상, 부위 매핑, 지역별 링크를 확인합니다.'
  }),
  'nsarmoire.storeReview.filter.all': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'nsarmoire.storeReview.filter.pendingCorrection': msg({
    zh: '待校正',
    en: 'Pending review',
    ja: '確認待ち',
    ko: '확인 대기'
  }),
  'nsarmoire.storeReview.filter.corrected': msg({
    zh: '已校正',
    en: 'Reviewed',
    ja: '確認済み',
    ko: '확인됨'
  }),
  'nsarmoire.storeReview.filter.needsMapping': msg({
    zh: '缺物品映射',
    en: 'Needs item mapping',
    ja: 'アイテム対応不足',
    ko: '아이템 매핑 필요'
  }),
  'nsarmoire.storeReview.filter.missingLinks': msg({
    zh: '缺跨服链接',
    en: 'Missing links',
    ja: 'リンク不足',
    ko: '링크 누락'
  }),
  'nsarmoire.storeReview.filter.edited': msg({
    zh: '已编辑',
    en: 'Edited',
    ja: '編集済み',
    ko: '수정됨'
  }),
  'nsarmoire.storeReview.column.outfit': msg({
    zh: '套装',
    en: 'Outfit',
    ja: '衣装',
    ko: '의상'
  }),
  'nsarmoire.storeReview.column.items': msg({
    zh: '物品',
    en: 'Items',
    ja: 'アイテム',
    ko: '아이템'
  }),
  'nsarmoire.storeReview.column.links': msg({
    zh: '商城链接',
    en: 'Store links',
    ja: 'ストアリンク',
    ko: '상점 링크'
  }),
  'nsarmoire.storeReview.column.state': msg({
    zh: '状态',
    en: 'State',
    ja: '状態',
    ko: '상태'
  }),
  'nsarmoire.storeReview.region.cn': msg({
    zh: '国服',
    en: 'CN',
    ja: '中国版',
    ko: '중국 서버'
  }),
  'nsarmoire.storeReview.region.global': msg({
    zh: '国际服',
    en: 'Global',
    ja: 'グローバル',
    ko: '글로벌'
  }),
  'nsarmoire.storeReview.region.tw': msg({
    zh: '繁中服',
    en: 'TW',
    ja: '繁体字版',
    ko: '대만 서버'
  }),
  'nsarmoire.storeReview.region.kr': msg({
    zh: '韩服',
    en: 'KR',
    ja: '韓国版',
    ko: '한국 서버'
  }),
  'nsarmoire.storeReview.link.placeholder': msg({
    zh: '粘贴商城链接',
    en: 'Paste store link',
    ja: 'ストアリンクを貼り付け',
    ko: '상점 링크 붙여넣기'
  }),
  'nsarmoire.storeReview.action.copyPatch': msg({
    zh: '复制校正 JSON',
    en: 'Copy correction JSON',
    ja: '修正 JSON をコピー',
    ko: '수정 JSON 복사'
  }),
  'nsarmoire.storeReview.action.downloadPatch': msg({
    zh: '下载校正 JSON',
    en: 'Download correction JSON',
    ja: '修正 JSON をダウンロード',
    ko: '수정 JSON 다운로드'
  }),
  'nsarmoire.storeReview.action.resetDraft': msg({
    zh: '清空本页编辑',
    en: 'Clear page edits',
    ja: 'このページの編集を消去',
    ko: '이 페이지 수정 내용 지우기'
  }),
  'nsarmoire.storeReview.action.openLink': msg({
    zh: '打开',
    en: 'Open',
    ja: '開く',
    ko: '열기'
  }),
  'nsarmoire.storeReview.action.confirmCorrected': msg({
    zh: '标为已校正',
    en: 'Mark reviewed',
    ja: '確認済みにする',
    ko: '확인됨으로 표시'
  }),
  'nsarmoire.storeReview.action.unconfirmCorrected': msg({
    zh: '改回待校正',
    en: 'Mark pending',
    ja: '確認待ちに戻す',
    ko: '확인 대기로 변경'
  }),
  'nsarmoire.storeReview.status.patchCopied': msg({
    zh: '校正 JSON 已复制',
    en: 'Correction JSON copied',
    ja: '修正 JSON をコピーしました',
    ko: '수정 JSON을 복사했습니다'
  }),
  'nsarmoire.storeReview.status.patchCopyFailed': msg({
    zh: '复制失败',
    en: 'Copy failed',
    ja: 'コピーに失敗しました',
    ko: '복사 실패'
  }),
  'nsarmoire.storeReview.status.noChanges': msg({
    zh: '暂无编辑',
    en: 'No edits yet',
    ja: '編集はありません',
    ko: '수정 없음'
  }),
  'nsarmoire.storeReview.status.changedCount': msg({
    zh: '已编辑 {count} 条',
    en: '{count} edited',
    ja: '{count} 件編集済み',
    ko: '{count}개 수정됨'
  }),
  'nsarmoire.storeReview.status.pendingCorrection': msg({
    zh: '待校正',
    en: 'Pending review',
    ja: '確認待ち',
    ko: '확인 대기'
  }),
  'nsarmoire.storeReview.status.corrected': msg({
    zh: '已校正',
    en: 'Reviewed',
    ja: '確認済み',
    ko: '확인됨'
  }),
  'nsarmoire.storeReview.item.add.label': msg({
    zh: '补物品',
    en: 'Add item',
    ja: 'アイテム追加',
    ko: '아이템 추가'
  }),
  'nsarmoire.storeReview.item.add.placeholder': msg({
    zh: '输入物品 ID 或物品名',
    en: 'Item ID or item name',
    ja: 'アイテムIDまたは名前',
    ko: '아이템 ID 또는 이름'
  }),
  'nsarmoire.storeReview.item.add.action': msg({
    zh: '添加',
    en: 'Add',
    ja: '追加',
    ko: '추가'
  }),
  'nsarmoire.storeReview.item.remove.action': msg({
    zh: '移除',
    en: 'Remove',
    ja: '削除',
    ko: '제거'
  }),
  'nsarmoire.storeReview.item.added': msg({
    zh: '物品已加入校正草稿',
    en: 'Item added to draft',
    ja: 'アイテムを修正案に追加しました',
    ko: '아이템을 수정 초안에 추가했습니다'
  }),
  'nsarmoire.storeReview.item.notFound': msg({
    zh: '没有找到这个物品',
    en: 'Item not found',
    ja: 'アイテムが見つかりません',
    ko: '아이템을 찾지 못했습니다'
  }),
  'nsarmoire.storeReview.item.duplicate': msg({
    zh: '这个物品已经在该套装里',
    en: 'This item is already in the outfit',
    ja: 'このアイテムは既に衣装に含まれています',
    ko: '이 아이템은 이미 의상에 포함되어 있습니다'
  }),
  'nsarmoire.storeReview.item.draft': msg({
    zh: '新增',
    en: 'New',
    ja: '新規',
    ko: '신규'
  }),
  'nsarmoire.storeReview.empty.items': msg({
    zh: '待补物品',
    en: 'Items pending',
    ja: 'アイテム未設定',
    ko: '아이템 확인 필요'
  }),
  'nsarmoire.storeReview.empty.results': msg({
    zh: '没有符合条件的商城套装。',
    en: 'No matching store outfits.',
    ja: '一致するストア衣装はありません。',
    ko: '조건에 맞는 상점 의상이 없습니다.'
  }),
  'nsarmoire.recommendation.cabinet': msg({
    zh: '可转入收藏柜',
    en: 'Move to armoire',
    ja: '愛蔵品キャビネットへ',
    ko: '애장품 보관함으로'
  }),
  'nsarmoire.recommendation.sets': msg({
    zh: '残缺套装',
    en: 'Incomplete sets',
    ja: '不足セット',
    ko: '불완전 세트'
  }),
  'nsarmoire.recommendation.setPieces': msg({
    zh: '可进套装桶散件',
    en: 'Set pieces for baskets',
    ja: 'セット収納可能な部品',
    ko: '세트 보관 가능 부위'
  }),
  'nsarmoire.recommendation.duplicateItems': msg({
    zh: '重复物品检查',
    en: 'Duplicate item check',
    ja: '重複アイテム確認',
    ko: '중복 아이템 확인'
  }),
  'nsarmoire.recommendation.duplicates': msg({
    zh: '同模型物品检查',
    en: 'Duplicate model cleanup',
    ja: '同一モデル整理',
    ko: '동일 모델 정리'
  }),
  'nsarmoire.recommendation.dyes': msg({
    zh: '已染色可收纳物品（高风险）',
    en: 'Check dyes first',
    ja: '染色を先に確認',
    ko: '염색 먼저 확인'
  }),
  'nsarmoire.summary.inventory': msg({
    zh: draft('当前导入了 {entries} 条记录，分布在 {containers} 个容器里。'),
    en: '{entries} entries are imported across {containers} containers.',
    ja: '{entries} 件の記録が {containers} 個のコンテナにあります。',
    ko: '{entries}개 항목이 {containers}개 컨테이너에 있습니다.'
  }),
  'nsarmoire.summary.storage': msg({
    zh: draft(
      '其中投影台有 {dresser} 条，收藏柜有 {armoire} 条；后面的建议会按容器判断能不能整理。'
    ),
    en: '{dresser} are in the glamour dresser and {armoire} are in the armoire; suggestions below use container-aware checks.',
    ja: 'ミラージュドレッサーに {dresser} 件、愛蔵品キャビネットに {armoire} 件あります。下の提案はコンテナ別に判定します。',
    ko: '투영대에 {dresser}개, 애장품 보관함에 {armoire}개가 있습니다. 아래 제안은 컨테이너별로 판단합니다.'
  }),
  'nsarmoire.summary.dyeWarning': msg({
    zh: '有 {count} 条已经染色；收藏柜和套装幻影化篓子会清除染色，其他收纳系统暂按保留处理。',
    en: '{count} entries are dyed. Armoire storage and glamour-set baskets clear dyes; other storage is treated as preserving dyes.',
    ja: '{count} 件が染色済みです。愛蔵品キャビネットとセット収納は染色を消しますが、他の収納は保持として扱います。',
    ko: '{count}개 항목이 염색되어 있습니다. 애장품 보관함과 세트 보관은 염색을 지우며, 다른 보관은 유지로 봅니다.'
  }),
  'nsarmoire.summary.noDyeWarning': msg({
    zh: draft('未发现染色条目，当前这批数据不需要检查清染色风险。'),
    en: 'No dyed entries were found, so dye-clearing risk does not need review for this import.',
    ja: '染色済み項目はありません。今回のデータでは染色消去リスクの確認は不要です。',
    ko: '염색 항목이 없어 이번 데이터에서는 염색 삭제 위험 확인이 필요 없습니다.'
  }),
  'nsarmoire.hint.cabinet.summary': msg({
    zh: draft('有 {count} 件已经拥有、但还不在收藏柜里，可以优先检查：{items}。'),
    en: '{count} owned items are not in the armoire yet. Check first: {items}.',
    ja: '所持済みで愛蔵品キャビネット未収納の項目が {count} 件あります。まず確認: {items}。',
    ko: '이미 보유했지만 애장품 보관함에 없는 항목이 {count}개 있습니다. 먼저 확인: {items}.'
  }),
  'nsarmoire.hint.cabinet.none': msg({
    zh: draft('当前没有发现可直接转入收藏柜的已拥有物品。'),
    en: 'No owned items currently look ready to move into the armoire.',
    ja: '今すぐ愛蔵品キャビネットへ移せそうな所持品はありません。',
    ko: '지금 바로 애장품 보관함으로 옮길 수 있는 보유 항목이 없습니다.'
  }),
  'nsarmoire.hint.sets.summary': msg({
    zh: draft('有 {count} 个已经套装投影化的套装还缺散件，先看：{items}。'),
    en: '{count} stored glamour sets are still missing pieces. Check: {items}.',
    ja: 'セット収納済みのうち {count} 件に不足パーツがあります。確認: {items}。',
    ko: '세트 보관된 항목 중 {count}개에 누락된 파츠가 있습니다. 확인: {items}.'
  }),
  'nsarmoire.hint.sets.none': msg({
    zh: draft('当前没有发现“已经套装化但缺散件”的套装。'),
    en: 'No stored glamour sets are missing pieces right now.',
    ja: 'セット収納済みでパーツ不足のものはありません。',
    ko: '세트 보관되었지만 파츠가 누락된 항목은 없습니다.'
  }),
  'nsarmoire.hint.duplicateItems.summary': msg({
    zh: draft('发现 {count} 种物品有多条记录，可以确认是否真的都要保留：{items}。'),
    en: '{count} items appear more than once. Check whether all copies should be kept: {items}.',
    ja: '{count} 種のアイテムが複数あります。すべて残すか確認: {items}。',
    ko: '{count}종 아이템이 여러 번 있습니다. 모두 보관할지 확인: {items}.'
  }),
  'nsarmoire.hint.duplicateItems.none': msg({
    zh: draft('当前没有发现同一种物品的多条记录。'),
    en: 'No item appears in multiple entries right now.',
    ja: '同じアイテムの複数記録はありません。',
    ko: '같은 아이템의 여러 항목은 없습니다.'
  }),
  'nsarmoire.hint.duplicates.summary': msg({
    zh: draft('发现 {count} 组同模型重复，可以考虑只保留更想保留的一件：{items}。'),
    en: '{count} duplicate model groups were found. Consider keeping only the preferred item: {items}.',
    ja: '同一モデルの重複が {count} 組あります。残したいものだけ残す候補: {items}。',
    ko: '동일 모델 중복이 {count}그룹 있습니다. 남길 항목을 고르세요: {items}.'
  }),
  'nsarmoire.hint.duplicates.none': msg({
    zh: draft('当前没有发现同模型重复装备。'),
    en: 'No duplicate model equipment was found.',
    ja: '同一モデルの重複装備はありません。',
    ko: '동일 모델 중복 장비가 없습니다.'
  }),
  'nsarmoire.hint.dyes.summary': msg({
    zh: '有 {count} 件染色物品进入收藏柜或套装幻影化篓子时会清除染色，先看：{items}。',
    en: '{count} dyed items would lose dyes in armoire storage or glamour-set baskets. Check: {items}.',
    ja: '{count} 件の染色済みアイテムはキャビネットまたはセット収納で染色が消えます。確認: {items}。',
    ko: '{count}개 염색 아이템은 보관함이나 세트 보관에 넣으면 염색이 지워집니다. 확인: {items}.'
  }),
  'nsarmoire.hint.dyes.preserved': msg({
    zh: '有 {count} 件带染色，但当前命中的收纳位置不会清除染色：{items}。',
    en: '{count} items are dyed, but the matched storage positions do not clear dyes: {items}.',
    ja: '{count} 件が染色済みですが、現在命中した収納位置では染色は消えません: {items}。',
    ko: '{count}개 항목이 염색되어 있지만 현재 감지된 보관 위치에서는 염색이 지워지지 않습니다: {items}.'
  }),
  'nsarmoire.hint.allClear.title': msg({
    zh: draft('暂无需要处理的提示'),
    en: 'No action hints yet',
    ja: '処理ヒントなし',
    ko: '처리 힌트 없음'
  }),
  'nsarmoire.hint.allClear.message': msg({
    zh: draft('当前导入的数据没有触发收藏柜、套装、重复物品、同模型或清染色风险提示。'),
    en: 'The current import did not trigger armoire, set, duplicate item, duplicate model, or dye-clearing risk hints.',
    ja: '今回のデータでは、キャビネット、セット、重複アイテム、同一モデル、染色消去リスクのヒントはありません。',
    ko: '현재 가져온 데이터에서는 보관함, 세트, 중복 아이템, 동일 모델, 염색 삭제 위험 힌트가 없습니다.'
  }),
  'nsarmoire.hint.catalogPending.title': msg({
    zh: draft('部分检查等待静态数据'),
    en: 'Some checks are waiting for catalog data',
    ja: '一部の確認はcatalogデータ待ちです',
    ko: '일부 확인은 catalog 데이터를 기다립니다'
  }),
  'nsarmoire.hint.catalogPending.message': msg({
    zh: draft('收藏柜、套装和同模型判断需要静态 catalog；加载完成前，这些项目不会给出正式结论。'),
    en: 'Armoire, set, and duplicate-model checks need the static catalog. They will not report final results until it is loaded.',
    ja: 'キャビネット、セット、同一モデルの確認には静的catalogが必要です。読み込み完了まで正式な結果は出しません。',
    ko: '보관함, 세트, 동일 모델 확인에는 정적 catalog가 필요합니다. 로드되기 전에는 최종 결과를 표시하지 않습니다.'
  }),
  'nsarmoire.hint.moreItems': msg({
    zh: '{items} 等 {count} 件',
    en: '{items}, and {count} total',
    ja: '{items} など合計 {count} 件',
    ko: '{items} 등 총 {count}개'
  }),
  'nsarmoire.hint.missingPieces': msg({
    zh: '缺少：{items}',
    en: 'Missing: {items}',
    ja: '不足: {items}',
    ko: '누락: {items}'
  }),
  'nsarmoire.status.stored': msg({
    zh: '已收纳',
    en: 'Stored',
    ja: '収納済み',
    ko: '보관됨'
  }),
  'nsarmoire.status.unstored': msg({
    zh: '未收纳',
    en: 'Not stored',
    ja: '未収納',
    ko: '미보관'
  }),
  'nsarmoire.status.foundOutsideSet': msg({
    zh: '外部有：{locations}',
    en: 'Outside set: {locations}',
    ja: 'セット外: {locations}',
    ko: '세트 외부: {locations}'
  }),
  'nsarmoire.hint.ownedEntries': msg({
    zh: '当前拥有{count}件',
    en: '{count} owned entries',
    ja: '所持記録 {count} 件',
    ko: '보유 항목 {count}개'
  }),
  'nsarmoire.hint.duplicateEntry.location': msg({
    zh: '物品{index}：位于{location}',
    en: 'Copy {index}: in {location}',
    ja: 'アイテム{index}: {location}',
    ko: '아이템 {index}: {location}'
  }),
  'nsarmoire.hint.duplicateEntry.dyes': msg({
    zh: '染色：{dyes}',
    en: 'Dyes: {dyes}',
    ja: '染色: {dyes}',
    ko: '염색: {dyes}'
  }),
  'nsarmoire.hint.currentLocation': msg({
    zh: '当前在：{locations}',
    en: 'Currently in: {locations}',
    ja: '現在位置: {locations}',
    ko: '현재 위치: {locations}'
  }),
  'nsarmoire.hint.namedLocations': msg({
    zh: '{item}：{locations}',
    en: '{item}: {locations}',
    ja: '{item}: {locations}',
    ko: '{item}: {locations}'
  }),
  'nsarmoire.action.expandList': msg({
    zh: '展开',
    en: 'Expand',
    ja: '展開',
    ko: '펼치기'
  }),
  'nsarmoire.action.collapseList': msg({
    zh: '收起',
    en: 'Collapse',
    ja: '閉じる',
    ko: '접기'
  }),
  'nsarmoire.action.loadMoreList': msg({
    zh: '继续显示 {count} 条',
    en: 'Show {count} more',
    ja: 'さらに {count} 件表示',
    ko: '{count}개 더 보기'
  }),
  'nsarmoire.action.loadExampleSnapshot': msg({
    zh: draft('载入示例'),
    en: 'Load example',
    ja: '例を読み込む',
    ko: '예시 불러오기'
  }),
  'nsarmoire.action.importSnapshot': msg({
    zh: '导入',
    en: 'Import',
    ja: 'インポート',
    ko: '가져오기'
  }),
  'nsarmoire.action.clearSnapshot': msg({
    zh: '清空',
    en: 'Clear',
    ja: 'クリア',
    ko: '지우기'
  }),
  'nsarmoire.action.connectHelper': msg({
    zh: '开启管家',
    en: 'Start helper',
    ja: 'ヘルパー起動',
    ko: '헬퍼 시작'
  }),
  'nsarmoire.action.shutdownHelper': msg({
    zh: '关闭管家',
    en: 'Stop helper',
    ja: 'ヘルパー終了',
    ko: '헬퍼 종료'
  }),
  'nsarmoire.action.refreshHelper': msg({
    zh: '刷新',
    en: 'Refresh',
    ja: '更新',
    ko: '새로고침'
  }),
  'nsarmoire.catalog.filter.label': msg({
    zh: draft('图鉴筛选'),
    en: 'Catalog filters',
    ja: 'カタログフィルター',
    ko: '도감 필터'
  }),
  'nsarmoire.catalog.filter.all': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'nsarmoire.catalog.filter.cabinet': msg({
    zh: '可转收藏柜',
    en: 'Armoire candidates',
    ja: 'キャビネット候補',
    ko: '보관함 후보'
  }),
  'nsarmoire.catalog.filter.duplicateItems': msg({
    zh: '重复物品',
    en: 'Duplicate items',
    ja: '重複アイテム',
    ko: '중복 아이템'
  }),
  'nsarmoire.catalog.filter.duplicateModels': msg({
    zh: '同模型',
    en: 'Duplicate models',
    ja: '同一モデル',
    ko: '동일 모델'
  }),
  'nsarmoire.catalog.filter.dyed': msg({
    zh: '染色高风险',
    en: 'Dye risk',
    ja: '染色済み',
    ko: '염색됨'
  }),
  'nsarmoire.catalog.filter.glamourDresser': msg({
    zh: '投影台',
    en: 'Glamour dresser',
    ja: 'ミラージュドレッサー',
    ko: '투영대'
  }),
  'nsarmoire.catalog.filter.armoire': msg({
    zh: '收藏柜',
    en: 'Armoire',
    ja: '愛蔵品キャビネット',
    ko: '애장품 보관함'
  }),
  'nsarmoire.catalog.search.label': msg({
    zh: draft('搜索物品'),
    en: 'Search items',
    ja: 'アイテム検索',
    ko: '아이템 검색'
  }),
  'nsarmoire.catalog.search.placeholder': msg({
    zh: draft('输入物品名、容器或标签'),
    en: 'Name, container, or tag',
    ja: '名前、コンテナ、タグ',
    ko: '이름, 컨테이너, 태그'
  }),
  'nsarmoire.catalog.sort.label': msg({
    zh: draft('排序'),
    en: 'Sort',
    ja: '並び順',
    ko: '정렬'
  }),
  'nsarmoire.catalog.sort.risk': msg({
    zh: draft('优先显示处理项'),
    en: 'Action items first',
    ja: '処理項目を優先',
    ko: '처리 항목 우선'
  }),
  'nsarmoire.catalog.sort.container': msg({
    zh: draft('按容器'),
    en: 'By container',
    ja: 'コンテナ順',
    ko: '컨테이너순'
  }),
  'nsarmoire.catalog.sort.name': msg({
    zh: draft('按名称'),
    en: 'By name',
    ja: '名前順',
    ko: '이름순'
  }),
  'nsarmoire.catalog.sort.itemId': msg({
    zh: draft('按物品 ID'),
    en: 'By item ID',
    ja: 'アイテムID順',
    ko: '아이템 ID순'
  }),
  'nsarmoire.catalog.metric.label': msg({
    zh: '图鉴当前结果',
    en: 'Current catalog result',
    ja: '現在のカタログ結果',
    ko: '현재 도감 결과'
  }),
  'nsarmoire.catalog.metric.visible': msg({
    zh: '当前结果',
    en: 'Visible',
    ja: '表示中',
    ko: '표시 중'
  }),
  'nsarmoire.catalog.metric.actionItems': msg({
    zh: '处理项',
    en: 'Action items',
    ja: '処理項目',
    ko: '처리 항목'
  }),
  'nsarmoire.catalog.metric.dyed': msg({
    zh: '染色高风险',
    en: 'Dye risk',
    ja: '染色あり',
    ko: '염색 있음'
  }),
  'nsarmoire.catalog.metric.duplicates': msg({
    zh: '重复相关',
    en: 'Duplicates',
    ja: '重複関連',
    ko: '중복 관련'
  }),
  'nsarmoire.catalog.grid.summary': msg({
    zh: '当前筛选 {shown} / {total} 件物品。',
    en: '{shown} of {total} items match.',
    ja: '{total} 件中 {shown} 件が一致しています。',
    ko: '아이템 {total}개 중 {shown}개가 일치합니다.'
  }),
  'nsarmoire.catalog.grid.empty': msg({
    zh: draft('当前筛选下没有物品。'),
    en: 'No items match the current filter.',
    ja: '現在のフィルターに一致するアイテムはありません。',
    ko: '현재 필터에 맞는 아이템이 없습니다.'
  }),
  'nsarmoire.catalog.quantity': msg({
    zh: '数量 {count}',
    en: 'Qty {count}',
    ja: '数量 {count}',
    ko: '수량 {count}'
  }),
  'nsarmoire.catalog.dye.none': msg({
    zh: '未染色',
    en: 'No dye',
    ja: '未染色',
    ko: '염색 없음'
  }),
  'nsarmoire.catalog.iconFallback': msg({
    zh: draft('无图标'),
    en: 'No icon',
    ja: 'アイコンなし',
    ko: '아이콘 없음'
  }),
  'nsarmoire.validation.lead': msg({
    zh: draft('这里把当前导入数据里触发或未触发的规则拆开，显示参与字段、命中数据和结论。'),
    en: 'This breaks the current import into rule checks, matching data, fields, and conclusions.',
    ja: '現在のインポートをルール、命中データ、使用フィールド、結論に分けて表示します。',
    ko: '현재 가져온 데이터를 규칙, 일치 데이터, 사용 필드, 결론으로 나누어 표시합니다.'
  }),
  'nsarmoire.validation.technicalBadge': msg({
    zh: draft('技术核对'),
    en: 'Technical check',
    ja: '技術確認',
    ko: '기술 확인'
  }),
  'nsarmoire.validation.status.triggered': msg({
    zh: draft('已触发'),
    en: 'Triggered',
    ja: '検出',
    ko: '감지됨'
  }),
  'nsarmoire.validation.status.notTriggered': msg({
    zh: draft('未触发'),
    en: 'Not triggered',
    ja: '未検出',
    ko: '감지 안 됨'
  }),
  'nsarmoire.validation.status.waitingCatalog': msg({
    zh: draft('等待静态数据'),
    en: 'Waiting for catalog',
    ja: 'catalog待ち',
    ko: 'catalog 대기 중'
  }),
  'nsarmoire.validation.evidence.rule': msg({
    zh: draft('规则'),
    en: 'Rule',
    ja: 'ルール',
    ko: '규칙'
  }),
  'nsarmoire.validation.evidence.fields': msg({
    zh: draft('使用字段'),
    en: 'Fields',
    ja: '使用フィールド',
    ko: '사용 필드'
  }),
  'nsarmoire.validation.evidence.result': msg({
    zh: draft('结论'),
    en: 'Result',
    ja: '結論',
    ko: '결론'
  }),
  'nsarmoire.validation.evidence.locations': msg({
    zh: draft('当前位置'),
    en: 'Locations',
    ja: '現在位置',
    ko: '현재 위치'
  }),
  'nsarmoire.validation.evidence.item': msg({
    zh: draft('物品'),
    en: 'Item',
    ja: 'アイテム',
    ko: '아이템'
  }),
  'nsarmoire.validation.evidence.items': msg({
    zh: draft('物品组'),
    en: 'Items',
    ja: 'アイテム組',
    ko: '아이템 그룹'
  }),
  'nsarmoire.validation.evidence.modelKey': msg({
    zh: draft('模型键'),
    en: 'Model key',
    ja: 'モデルキー',
    ko: '모델 키'
  }),
  'nsarmoire.validation.evidence.models': msg({
    zh: draft('模型字段'),
    en: 'Model fields',
    ja: 'モデルフィールド',
    ko: '모델 필드'
  }),
  'nsarmoire.validation.evidence.catalog': msg({
    zh: draft('目录命中'),
    en: 'Catalog match',
    ja: 'catalog命中',
    ko: 'catalog 일치'
  }),
  'nsarmoire.validation.evidence.dyes': msg({
    zh: draft('染剂'),
    en: 'Dyes',
    ja: '染色',
    ko: '염료'
  }),
  'nsarmoire.validation.evidence.dyeReset': msg({
    zh: '清染色判定',
    en: 'Dye reset check',
    ja: '染色消去判定',
    ko: '염색 삭제 판정'
  }),
  'nsarmoire.validation.duplicateItems.rule': msg({
    zh: draft('同一个 itemId 在 snapshot 中出现多条记录，就判为重复物品。'),
    en: 'If the same itemId appears in multiple snapshot entries, it is treated as a duplicate item.',
    ja: '同じitemIdがsnapshot内に複数記録されている場合、重複アイテムとして扱います。',
    ko: '같은 itemId가 snapshot에 여러 번 나오면 중복 아이템으로 봅니다.'
  }),
  'nsarmoire.validation.duplicateItems.hit': msg({
    zh: draft('{item} 在当前 snapshot 中出现了多条记录。'),
    en: '{item} appears in multiple entries in the current snapshot.',
    ja: '{item} は現在のsnapshotに複数記録されています。',
    ko: '{item} 항목이 현재 snapshot에 여러 번 있습니다.'
  }),
  'nsarmoire.validation.duplicateItems.none': msg({
    zh: draft('当前没有同一 itemId 的多条记录。'),
    en: 'No itemId appears in multiple entries right now.',
    ja: '現在、同じitemIdの複数記録はありません。',
    ko: '현재 같은 itemId의 여러 항목은 없습니다.'
  }),
  'nsarmoire.validation.duplicateItems.result': msg({
    zh: draft('{entries} 条记录，总数量 {quantity}。'),
    en: '{entries} entries, {quantity} total quantity.',
    ja: '{entries} 件の記録、合計数量 {quantity}。',
    ko: '{entries}개 항목, 총 수량 {quantity}.'
  }),
  'nsarmoire.validation.identicalModels.rule': msg({
    zh: draft(
      '主模型、副模型、物品类型和装备位置都一致，且当前拥有多个不同物品 ID，才判为同模型。'
    ),
    en: 'Items count as duplicate models only when main model, sub model, item category, and equip slot all match, and multiple owned item IDs are present.',
    ja: '主モデル、副モデル、アイテム種別、装備位置がすべて一致し、複数の所持アイテムIDがある場合だけ同一モデルと判定します。',
    ko: '주 모델, 보조 모델, 아이템 종류, 장비 위치가 모두 같고 여러 보유 item ID가 있을 때만 동일 모델로 봅니다.'
  }),
  'nsarmoire.validation.identicalModels.hit': msg({
    zh: draft('{items} 使用同一套模型字段。'),
    en: '{items} share the same model fields.',
    ja: '{items} は同じモデルフィールドを共有しています。',
    ko: '{items} 항목이 같은 모델 필드를 사용합니다.'
  }),
  'nsarmoire.validation.identicalModels.none': msg({
    zh: draft('当前没有命中同模型重复装备。'),
    en: 'No duplicate model equipment was found right now.',
    ja: '現在、同一モデルの重複装備はありません。',
    ko: '현재 동일 모델 중복 장비가 없습니다.'
  }),
  'nsarmoire.validation.identicalModels.pending': msg({
    zh: draft('同模型判断需要静态 catalog，加载完成前不会给出正式结论。'),
    en: 'Duplicate-model checks need the static catalog and will not report final results until it loads.',
    ja: '同一モデル判定には静的catalogが必要で、読み込み完了まで正式な結果は表示しません。',
    ko: '동일 모델 판정에는 정적 catalog가 필요하며 로드 전에는 최종 결과를 표시하지 않습니다.'
  }),
  'nsarmoire.validation.cabinet.rule': msg({
    zh: draft('物品在 Cabinet.csv 目录中、当前已拥有、且不在收藏柜容器里，就判为可转收藏柜。'),
    en: 'An owned item is an armoire candidate when it appears in Cabinet.csv and is not already in the armoire container.',
    ja: 'Cabinet.csvにあり、現在所持していて、愛蔵品キャビネット内にない場合、キャビネット候補として扱います。',
    ko: 'Cabinet.csv에 있고 현재 보유 중이며 애장품 보관함 컨테이너에 없으면 보관함 후보로 봅니다.'
  }),
  'nsarmoire.validation.cabinet.hit': msg({
    zh: draft('{item} 命中收藏柜目录，但当前位置还不是收藏柜。'),
    en: '{item} appears in the armoire catalog but is not currently in the armoire container.',
    ja: '{item} はキャビネット目录にありますが、現在位置はキャビネットではありません。',
    ko: '{item} 항목이 보관함 목록에 있지만 현재 위치는 보관함이 아닙니다.'
  }),
  'nsarmoire.validation.cabinet.none': msg({
    zh: draft('当前没有发现可转入收藏柜的已拥有物品。'),
    en: 'No owned item currently looks ready to move into the armoire.',
    ja: '現在、キャビネットへ移せそうな所持品はありません。',
    ko: '현재 보관함으로 옮길 수 있는 보유 항목이 없습니다.'
  }),
  'nsarmoire.validation.cabinet.pending': msg({
    zh: draft('收藏柜判断需要 Cabinet.csv 目录，加载完成前不会给出正式结论。'),
    en: 'Armoire checks need the Cabinet.csv catalog and will not report final results until it loads.',
    ja: 'キャビネット判定にはCabinet.csv目录が必要で、読み込み完了まで正式な結果は表示しません。',
    ko: '보관함 판정에는 Cabinet.csv 목록이 필요하며 로드 전에는 최종 결과를 표시하지 않습니다.'
  }),
  'nsarmoire.validation.cabinet.catalogHit': msg({
    zh: draft('Cabinet.csv 包含 itemId {itemId}。'),
    en: 'Cabinet.csv includes itemId {itemId}.',
    ja: 'Cabinet.csvにitemId {itemId} が含まれています。',
    ko: 'Cabinet.csv에 itemId {itemId}가 포함되어 있습니다.'
  }),
  'nsarmoire.validation.dyes.rule': msg({
    zh: 'snapshot 的 dyes 字段记录当前染色；只有收藏柜和套装幻影化篓子会清除染色，其他收纳系统不会。',
    en: 'snapshot.dyes records current dyes. Only armoire storage and glamour-set baskets clear dyes; other storage does not.',
    ja: 'snapshotのdyesは現在の染色を記録します。染色を消すのはキャビネットとセット収納だけで、他の収納は消しません。',
    ko: 'snapshot.dyes는 현재 염색을 기록합니다. 염색을 지우는 것은 보관함과 세트 보관뿐이며 다른 보관은 지우지 않습니다.'
  }),
  'nsarmoire.validation.dyes.hit': msg({
    zh: draft('{item} 带有染色信息，需要按收纳目标判断是否会被清除。'),
    en: '{item} has dye data. Whether it is cleared depends on the storage target.',
    ja: '{item} には染色情報があります。消えるかどうかは収納先で判定します。',
    ko: '{item} 항목에 염색 정보가 있습니다. 삭제 여부는 보관 대상에 따라 판단합니다.'
  }),
  'nsarmoire.validation.dyes.none': msg({
    zh: draft('当前没有发现 dyes 字段大于 0 的记录。'),
    en: 'No entry currently has a dye value above 0.',
    ja: '現在、dyesフィールドが0より大きい記録はありません。',
    ko: '현재 dyes 필드가 0보다 큰 항목은 없습니다.'
  }),
  'nsarmoire.validation.dyes.result': msg({
    zh: draft('当前命中 {slots} 个染色槽。'),
    en: '{slots} dyed slots matched.',
    ja: '染色スロット {slots} 個が命中しました。',
    ko: '염색 슬롯 {slots}개가 감지되었습니다.'
  }),
  'nsarmoire.dyeReset.cabinet': msg({
    zh: '收藏柜会清除染色',
    en: 'Armoire storage clears dyes',
    ja: 'キャビネット収納は染色を消します',
    ko: '보관함 보관은 염색을 지웁니다'
  }),
  'nsarmoire.dyeReset.glamourSetBasket': msg({
    zh: '套装幻影化篓子会清除染色',
    en: 'Glamour-set baskets clear dyes',
    ja: 'セット収納は染色を消します',
    ko: '세트 보관은 염색을 지웁니다'
  }),
  'nsarmoire.dyeReset.preservedStorage': msg({
    zh: '当前收纳系统不清除染色',
    en: 'Current storage does not clear dyes',
    ja: '現在の収納は染色を消しません',
    ko: '현재 보관은 염색을 지우지 않습니다'
  }),
  'nsarmoire.dyePreference.label': msg({
    zh: '贵重染剂',
    en: 'Valuable dyes',
    ja: '高価な染料',
    ko: '고가 염료'
  }),
  'nsarmoire.dyeCategory.general': msg({
    zh: '通用',
    en: 'General',
    ja: '汎用',
    ko: '일반'
  }),
  'nsarmoire.dyeCategory.extra1': msg({
    zh: '追加1',
    en: 'Extra 1',
    ja: '追加1',
    ko: '추가1'
  }),
  'nsarmoire.dyeCategory.extra2': msg({
    zh: '追加2',
    en: 'Extra 2',
    ja: '追加2',
    ko: '추가2'
  }),
  'nsarmoire.dyeCategory.storeSpecial': msg({
    zh: '商城特殊',
    en: 'Store special',
    ja: 'ストア特殊',
    ko: '상점 특수'
  }),
  'nsarmoire.input.snapshot': msg({
    zh: draft('选择 NSArmoire snapshot JSON'),
    en: 'Choose an NSArmoire snapshot JSON',
    ja: 'NSArmoire snapshot JSONを選択',
    ko: 'NSArmoire snapshot JSON 선택'
  }),
  'nsarmoire.status.snapshotReady': msg({
    zh: draft('snapshot 已导入'),
    en: 'Snapshot imported',
    ja: 'snapshotをインポートしました',
    ko: 'snapshot을 가져왔습니다'
  }),
  'nsarmoire.status.snapshotEmpty': msg({
    zh: draft('等待 snapshot'),
    en: 'Waiting for snapshot',
    ja: 'snapshot待機中',
    ko: 'snapshot 대기 중'
  }),
  'nsarmoire.status.snapshotError': msg({
    zh: draft('snapshot 无法导入'),
    en: 'Snapshot import failed',
    ja: 'snapshotをインポートできません',
    ko: 'snapshot을 가져올 수 없습니다'
  }),
  'nsarmoire.error.fileTooLarge': msg({
    zh: draft('文件过大'),
    en: 'File is too large',
    ja: 'ファイルが大きすぎます',
    ko: '파일이 너무 큽니다'
  }),
  'nsarmoire.error.invalidJson': msg({
    zh: draft('JSON 格式无效'),
    en: 'Invalid JSON',
    ja: 'JSON形式が無効です',
    ko: 'JSON 형식이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidRoot': msg({
    zh: draft('根结构无效'),
    en: 'Invalid root structure',
    ja: 'ルート構造が無効です',
    ko: '루트 구조가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidSchema': msg({
    zh: draft('schemaVersion 无效'),
    en: 'Invalid schemaVersion',
    ja: 'schemaVersionが無効です',
    ko: 'schemaVersion이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidSource': msg({
    zh: draft('source 无效'),
    en: 'Invalid source',
    ja: 'sourceが無効です',
    ko: 'source가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidGeneratedAt': msg({
    zh: draft('generatedAt 无效'),
    en: 'Invalid generatedAt',
    ja: 'generatedAtが無効です',
    ko: 'generatedAt이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidItems': msg({
    zh: draft('items 无效'),
    en: 'Invalid items',
    ja: 'itemsが無効です',
    ko: 'items가 잘못되었습니다'
  }),
  'nsarmoire.error.tooManyItems': msg({
    zh: draft('items 数量过多'),
    en: 'Too many items',
    ja: 'itemsが多すぎます',
    ko: 'items가 너무 많습니다'
  }),
  'nsarmoire.error.invalidItem': msg({
    zh: draft('物品条目无效'),
    en: 'Invalid item entry',
    ja: 'アイテム項目が無効です',
    ko: '아이템 항목이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidItemId': msg({
    zh: draft('itemId 无效'),
    en: 'Invalid itemId',
    ja: 'itemIdが無効です',
    ko: 'itemId가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidContainer': msg({
    zh: draft('container 无效'),
    en: 'Invalid container',
    ja: 'containerが無効です',
    ko: 'container가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidQuantity': msg({
    zh: draft('quantity 无效'),
    en: 'Invalid quantity',
    ja: 'quantityが無効です',
    ko: 'quantity가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidDyes': msg({
    zh: draft('dyes 无效'),
    en: 'Invalid dyes',
    ja: 'dyesが無効です',
    ko: 'dyes가 잘못되었습니다'
  }),
  'nsarmoire.status.catalogStatus': msg({
    zh: draft('静态 catalog'),
    en: 'Static catalog',
    ja: '静的catalog',
    ko: '정적 catalog'
  }),
  'nsarmoire.status.catalogPending': msg({
    zh: draft('等待 catalog'),
    en: 'Waiting for catalog',
    ja: 'catalog待機中',
    ko: 'catalog 대기 중'
  }),
  'nsarmoire.status.catalogLoading': msg({
    zh: draft('正在读取静态 catalog，收藏柜、套装和同模型检查会等它加载完成。'),
    en: 'Loading the static catalog. Armoire, set, and duplicate-model checks will wait for it.',
    ja: '静的catalogを読み込み中です。キャビネット、セット、同一モデルの確認は読み込みを待ちます。',
    ko: '정적 catalog를 읽는 중입니다. 보관함, 세트, 동일 모델 확인은 로드를 기다립니다.'
  }),
  'nsarmoire.status.catalogReady': msg({
    zh: draft(
      '已读取 {items} 件物品、{cabinet} 个收藏柜项、{sets} 个套装项、{models} 组同模型和 {dyes} 个染剂。'
    ),
    en: 'Loaded {items} items, {cabinet} armoire entries, {sets} set entries, {models} model groups, and {dyes} dyes.',
    ja: '{items} アイテム、{cabinet} キャビネット項目、{sets} セット項目、{models} モデルグループ、{dyes} 染料を読み込みました。',
    ko: '{items}개 아이템, {cabinet}개 보관함 항목, {sets}개 세트 항목, {models}개 모델 그룹, {dyes}개 염료를 읽었습니다.'
  }),
  'nsarmoire.status.catalogEmpty': msg({
    zh: draft('静态 catalog 已读取，但没有可用于分析的数据；相关检查会继续保持等待状态。'),
    en: 'The static catalog loaded, but no analysis data was found. Related checks will keep waiting.',
    ja: '静的catalogは読み込まれましたが、分析データがありません。関連する確認は待機状態のままです。',
    ko: '정적 catalog는 로드되었지만 분석 데이터가 없습니다. 관련 확인은 계속 대기합니다.'
  }),
  'nsarmoire.status.catalogError': msg({
    zh: draft('静态 catalog 读取失败；收藏柜、套装和同模型检查暂时不会给出正式结论。'),
    en: 'The static catalog failed to load. Armoire, set, and duplicate-model checks will not report final results yet.',
    ja: '静的catalogの読み込みに失敗しました。キャビネット、セット、同一モデルの確認はまだ正式な結果を出しません。',
    ko: '정적 catalog 로드에 실패했습니다. 보관함, 세트, 동일 모델 확인은 아직 최종 결과를 표시하지 않습니다.'
  }),
  'nsarmoire.status.catalogErrorWithDetail': msg({
    zh: draft('静态 catalog 读取失败：{error}。收藏柜、套装和同模型检查暂时不会给出正式结论。'),
    en: 'The static catalog failed to load: {error}. Armoire, set, and duplicate-model checks will not report final results yet.',
    ja: '静的catalogの読み込みに失敗しました: {error}。キャビネット、セット、同一モデルの確認はまだ正式な結果を出しません。',
    ko: '정적 catalog 로드에 실패했습니다: {error}. 보관함, 세트, 동일 모델 확인은 아직 최종 결과를 표시하지 않습니다.'
  }),
  'nsarmoire.status.noDyeRisk': msg({
    zh: draft('未发现染色条目'),
    en: 'No dyed entries found',
    ja: '染色済み項目はありません',
    ko: '염색 항목 없음'
  }),
  'nsarmoire.status.helperIdle': msg({
    zh: draft('本地助手未连接'),
    en: 'Local helper not connected',
    ja: 'ローカルヘルパー未接続',
    ko: '로컬 헬퍼 연결 안 됨'
  }),
  'nsarmoire.status.helperConnecting': msg({
    zh: draft('正在连接本地助手'),
    en: 'Connecting to local helper',
    ja: 'ローカルヘルパーに接続中',
    ko: '로컬 헬퍼 연결 중'
  }),
  'nsarmoire.status.helperReady': msg({
    zh: draft('已读取本地助手 snapshot'),
    en: 'Local helper snapshot loaded',
    ja: 'ローカルヘルパーのsnapshotを読み込みました',
    ko: '로컬 헬퍼 snapshot을 불러왔습니다'
  }),
  'nsarmoire.status.helperGameNotFound': msg({
    zh: draft('未找到游戏进程'),
    en: 'Game process not found',
    ja: 'ゲームプロセスが見つかりません',
    ko: '게임 프로세스를 찾을 수 없음'
  }),
  'nsarmoire.status.helperDresserNotLoaded': msg({
    zh: draft('投影台数据尚未载入'),
    en: 'Glamour dresser data is not loaded',
    ja: 'ミラージュドレッサーのデータが未読み込みです',
    ko: '투영대 데이터가 아직 로드되지 않았습니다'
  }),
  'nsarmoire.status.helperMultipleProcesses': msg({
    zh: draft('检测到多个游戏进程'),
    en: 'Multiple game processes detected',
    ja: '複数のゲームプロセスを検出しました',
    ko: '여러 게임 프로세스가 감지되었습니다'
  }),
  'nsarmoire.status.helperError': msg({
    zh: draft('本地助手连接失败'),
    en: 'Local helper connection failed',
    ja: 'ローカルヘルパー接続に失敗しました',
    ko: '로컬 헬퍼 연결 실패'
  }),
  'nsarmoire.status.helperIdle.message': msg({
    zh: draft('启动 NSArmoire 本地助手后，可以直接读取投影台 snapshot。'),
    en: 'Start the NSArmoire local helper to read the glamour dresser snapshot directly.',
    ja: 'NSArmoireローカルヘルパーを起動すると、ミラージュドレッサーsnapshotを直接読み取れます。',
    ko: 'NSArmoire 로컬 헬퍼를 시작하면 투영대 snapshot을 직접 읽을 수 있습니다.'
  }),
  'nsarmoire.status.helperConnecting.message': msg({
    zh: draft('正在检查本机 helper 状态，并尝试读取 snapshot。'),
    en: 'Checking the local helper and trying to load a snapshot.',
    ja: 'ローカルヘルパーの状態を確認し、snapshotを読み込んでいます。',
    ko: '로컬 헬퍼 상태를 확인하고 snapshot을 불러오는 중입니다.'
  }),
  'nsarmoire.status.helperReady.message': msg({
    zh: draft('本地助手返回的数据已进入当前分析面板。'),
    en: 'The local helper data is now loaded into the analysis panels.',
    ja: 'ローカルヘルパーのデータを分析パネルへ読み込みました。',
    ko: '로컬 헬퍼 데이터가 현재 분석 패널에 로드되었습니다.'
  }),
  'nsarmoire.status.helperGameNotFound.message': msg({
    zh: draft('请先启动游戏客户端，再重新连接本地助手。'),
    en: 'Start the game client, then reconnect the local helper.',
    ja: '先にゲームクライアントを起動してから、ローカルヘルパーに再接続してください。',
    ko: '먼저 게임 클라이언트를 실행한 뒤 로컬 헬퍼에 다시 연결하세요.'
  }),
  'nsarmoire.status.helperDresserNotLoaded.message': msg({
    zh: draft('请在游戏中打开或刷新投影台，再读取本地数据。'),
    en: 'Open or refresh the glamour dresser in game, then read local data again.',
    ja: 'ゲーム内でミラージュドレッサーを開くか更新してから、ローカルデータを再読み込みしてください。',
    ko: '게임에서 투영대를 열거나 새로고침한 뒤 로컬 데이터를 다시 읽으세요.'
  }),
  'nsarmoire.status.helperMultipleProcesses.message': msg({
    zh: draft('请在进程选择窗口里选择要读取的游戏客户端。'),
    en: 'Choose which game client to read in the process picker.',
    ja: 'プロセス選択ウィンドウで読み取るゲームクライアントを選んでください。',
    ko: '프로세스 선택 창에서 읽을 게임 클라이언트를 선택하세요.'
  }),
  'nsarmoire.status.helperError.message': msg({
    zh: draft('请确认本地助手正在运行，并且浏览器允许访问本机服务。'),
    en: 'Check that the local helper is running and the browser can reach the local service.',
    ja: 'ローカルヘルパーが起動しており、ブラウザがローカルサービスへアクセスできるか確認してください。',
    ko: '로컬 헬퍼가 실행 중이고 브라우저가 로컬 서비스에 접근할 수 있는지 확인하세요.'
  }),
  'nsarmoire.process.dialog.title': msg({
    zh: draft('选择游戏进程'),
    en: 'Choose game process',
    ja: 'ゲームプロセスを選択',
    ko: '게임 프로세스 선택'
  }),
  'nsarmoire.process.dialog.message': msg({
    zh: draft('本地助手检测到多个 FFXIV 客户端，请选择当前要分析的那个。'),
    en: 'The local helper found multiple FFXIV clients. Choose the one to analyze.',
    ja: 'ローカルヘルパーが複数のFFXIVクライアントを検出しました。分析する対象を選んでください。',
    ko: '로컬 헬퍼가 여러 FFXIV 클라이언트를 찾았습니다. 분석할 대상을 선택하세요.'
  }),
  'nsarmoire.process.action.refresh': msg({
    zh: draft('刷新进程列表'),
    en: 'Refresh process list',
    ja: 'プロセス一覧を更新',
    ko: '프로세스 목록 새로고침'
  }),
  'nsarmoire.process.action.select': msg({
    zh: draft('选择此进程'),
    en: 'Select process',
    ja: 'このプロセスを選択',
    ko: '이 프로세스 선택'
  }),
  'nsarmoire.process.field.name': msg({
    zh: draft('进程'),
    en: 'Process',
    ja: 'プロセス',
    ko: '프로세스'
  }),
  'nsarmoire.process.field.pid': msg({
    zh: 'PID',
    en: 'PID',
    ja: 'PID',
    ko: 'PID'
  }),
  'nsarmoire.process.field.windowTitle': msg({
    zh: draft('窗口标题'),
    en: 'Window title',
    ja: 'ウィンドウタイトル',
    ko: '창 제목'
  }),
  'nsarmoire.process.field.startedAt': msg({
    zh: draft('启动时间'),
    en: 'Started at',
    ja: '起動時刻',
    ko: '시작 시간'
  }),
  'nsarmoire.process.field.status': msg({
    zh: draft('状态'),
    en: 'Status',
    ja: '状態',
    ko: '상태'
  }),
  'nsarmoire.process.empty.windowTitle': msg({
    zh: draft('没有窗口标题'),
    en: 'No window title',
    ja: 'ウィンドウタイトルなし',
    ko: '창 제목 없음'
  }),
  'nsarmoire.process.empty.startedAt': msg({
    zh: draft('无法读取启动时间'),
    en: 'Start time unavailable',
    ja: '起動時刻を読み取れません',
    ko: '시작 시간을 읽을 수 없음'
  }),
  'nsarmoire.process.empty.processes': msg({
    zh: draft('当前没有找到可选择的 ffxiv_dx11 进程。'),
    en: 'No selectable ffxiv_dx11 process was found.',
    ja: '選択できる ffxiv_dx11 プロセスが見つかりません。',
    ko: '선택할 수 있는 ffxiv_dx11 프로세스를 찾지 못했습니다.'
  }),
  'nsarmoire.process.status.selected': msg({
    zh: draft('已选择'),
    en: 'Selected',
    ja: '選択済み',
    ko: '선택됨'
  }),
  'nsarmoire.process.status.readable': msg({
    zh: draft('可读取'),
    en: 'Readable',
    ja: '読み取り可能',
    ko: '읽기 가능'
  }),
  'nsarmoire.process.status.unreadable': msg({
    zh: draft('不可读取'),
    en: 'Unreadable',
    ja: '読み取り不可',
    ko: '읽을 수 없음'
  }),
  'nsarmoire.process.status.error': msg({
    zh: draft('进程选择失败'),
    en: 'Process selection failed',
    ja: 'プロセス選択に失敗しました',
    ko: '프로세스 선택 실패'
  }),
  'nsarmoire.action.reloadCatalog': msg({
    zh: draft('重新读取 catalog'),
    en: 'Reload catalog',
    ja: 'catalogを再読み込み',
    ko: 'catalog 다시 읽기'
  }),
  'nsarmoire.metric.entries': msg({ zh: draft('条目'), en: 'Entries', ja: '項目', ko: '항목' }),
  'nsarmoire.metric.uniqueItems': msg({
    zh: draft('不同物品'),
    en: 'Unique items',
    ja: '固有アイテム',
    ko: '고유 아이템'
  }),
  'nsarmoire.metric.totalQuantity': msg({
    zh: draft('总数量'),
    en: 'Total quantity',
    ja: '総数',
    ko: '총수량'
  }),
  'nsarmoire.metric.dyedEntries': msg({
    zh: draft('染色条目'),
    en: 'Dyed entries',
    ja: '染色項目',
    ko: '염색 항목'
  }),
  'nsarmoire.metric.glamourDresser': msg({
    zh: draft('投影台条目'),
    en: 'Glamour dresser entries',
    ja: 'ミラージュドレッサー項目',
    ko: '투영대 항목'
  }),
  'nsarmoire.metric.armoire': msg({
    zh: draft('收藏柜条目'),
    en: 'Armoire entries',
    ja: '愛蔵品キャビネット項目',
    ko: '애장품 보관함 항목'
  }),
  'nsarmoire.metric.stored': msg({
    zh: draft('已收纳'),
    en: 'Stored',
    ja: '収納済み',
    ko: '보관됨'
  }),
  'nsarmoire.metric.storable': msg({
    zh: draft('可收纳'),
    en: 'Storable',
    ja: '収納可能',
    ko: '보관 가능'
  }),
  'nsarmoire.metric.transferable': msg({
    zh: draft('可转入'),
    en: 'Transferable',
    ja: '移動候補',
    ko: '이동 후보'
  }),
  'nsarmoire.metric.missing': msg({
    zh: draft('缺少'),
    en: 'Missing',
    ja: '不足',
    ko: '누락'
  }),
  'nsarmoire.metric.storedSets': msg({
    zh: draft('已套装化'),
    en: 'Stored sets',
    ja: 'セット収納済み',
    ko: '세트 보관됨'
  }),
  'nsarmoire.metric.availableSets': msg({
    zh: draft('可套装化'),
    en: 'Available sets',
    ja: 'セット候補',
    ko: '세트 후보'
  }),
  'nsarmoire.metric.incompleteSets': msg({
    zh: draft('残缺套装'),
    en: 'Incomplete sets',
    ja: '不足セット',
    ko: '불완전 세트'
  }),
  'nsarmoire.metric.highRisk': msg({
    zh: draft('高风险'),
    en: 'High risk',
    ja: '高リスク',
    ko: '고위험'
  }),
  'nsarmoire.metric.duplicateGroups': msg({
    zh: draft('重复组'),
    en: 'Duplicate groups',
    ja: '重複グループ',
    ko: '중복 그룹'
  }),
  'nsarmoire.metric.catalogItems': msg({
    zh: draft('物品目录'),
    en: 'Item catalog',
    ja: 'アイテムカタログ',
    ko: '아이템 catalog'
  }),
  'nsarmoire.metric.catalogCabinetItems': msg({
    zh: draft('收藏柜目录'),
    en: 'Armoire catalog',
    ja: 'キャビネットカタログ',
    ko: '보관함 catalog'
  }),
  'nsarmoire.metric.catalogSets': msg({
    zh: draft('套装目录'),
    en: 'Set catalog',
    ja: 'セットカタログ',
    ko: '세트 catalog'
  }),
  'nsarmoire.metric.catalogModelGroups': msg({
    zh: draft('同模型目录'),
    en: 'Model groups',
    ja: '同一モデルカタログ',
    ko: '동일 모델 catalog'
  }),
  'nsarmoire.metric.catalogDyes': msg({
    zh: draft('染剂目录'),
    en: 'Dye catalog',
    ja: '染料カタログ',
    ko: '염료 catalog'
  }),
  'nsarmoire.field.generatedAt': msg({
    zh: '数据时间',
    en: 'Data time',
    ja: '生成日時',
    ko: '생성 시간'
  }),
  'nsarmoire.field.source': msg({ zh: draft('来源'), en: 'Source', ja: 'ソース', ko: '출처' }),
  'nsarmoire.field.character': msg({
    zh: draft('角色'),
    en: 'Character',
    ja: 'キャラクター',
    ko: '캐릭터'
  }),
  'nsarmoire.field.characterWorld': msg({
    zh: '服务器',
    en: 'World',
    ja: 'ワールド',
    ko: '월드'
  }),
  'nsarmoire.field.characterProfileKey': msg({
    zh: '档案键',
    en: 'Profile key',
    ja: 'プロフィールキー',
    ko: '프로필 키'
  }),
  'nsarmoire.field.characterRetainers': msg({
    zh: '已缓存雇员',
    en: 'Cached retainers',
    ja: 'キャッシュ済みリテイナー',
    ko: '캐시된 고용인'
  }),
  'nsarmoire.field.readContainers': msg({
    zh: '已读取',
    en: 'Read containers',
    ja: '読み取り範囲',
    ko: '읽은 범위'
  }),
  'nsarmoire.field.helperEndpoint': msg({
    zh: draft('本地助手地址'),
    en: 'Local helper endpoint',
    ja: 'ローカルヘルパーのアドレス',
    ko: '로컬 헬퍼 주소'
  }),
  'nsarmoire.field.helperCatalog': msg({
    zh: '本地目录数据',
    en: 'Local catalog',
    ja: 'ローカルcatalog',
    ko: '로컬 catalog'
  }),
  'nsarmoire.field.helperCatalogReady': msg({
    zh: '{count} 条收藏柜映射',
    en: '{count} armoire mappings',
    ja: 'キャビネット対応 {count} 件',
    ko: '보관함 매핑 {count}개'
  }),
  'nsarmoire.field.helperCatalogMissing': msg({
    zh: '未定位',
    en: 'Not found',
    ja: '未検出',
    ko: '찾지 못함'
  }),
  'nsarmoire.character.currentData': msg({
    zh: '当前数据',
    en: 'Current data',
    ja: '現在のデータ',
    ko: '현재 데이터'
  }),
  'nsarmoire.character.noSnapshot': msg({
    zh: '导入或读取本地助手数据后，这里会显示当前角色和服务器。',
    en: 'Import data or read from the helper to show the current character and world here.',
    ja: 'インポートまたはヘルパー読み取り後、ここにキャラクターとワールドを表示します。',
    ko: '가져오기나 헬퍼 읽기 후 현재 캐릭터와 월드가 여기에 표시됩니다.'
  }),
  'nsarmoire.character.staticData': msg({
    zh: '静态数据',
    en: 'Static data',
    ja: '静的データ',
    ko: '정적 데이터'
  }),
  'nsarmoire.character.unknown': msg({
    zh: '未识别角色',
    en: 'Unknown character',
    ja: '不明なキャラクター',
    ko: '알 수 없는 캐릭터'
  }),
  'nsarmoire.character.worldUnknown': msg({
    zh: '未识别服务器',
    en: 'Unknown world',
    ja: '不明なワールド',
    ko: '알 수 없는 월드'
  }),
  'nsarmoire.character.generatedAtEmpty': msg({
    zh: '未读取',
    en: 'Not read yet',
    ja: '未読み込み',
    ko: '아직 읽지 않음'
  }),
  'nsarmoire.character.profileKeyMissing': msg({
    zh: '等待角色名和服务器',
    en: 'Waiting for character and world',
    ja: 'キャラクター名とワールド待ち',
    ko: '캐릭터명과 월드 대기 중'
  }),
  'nsarmoire.character.localProfile.title': msg({
    zh: '本地角色档案',
    en: 'Local character profiles',
    ja: 'ローカルキャラクタープロフィール',
    ko: '로컬 캐릭터 프로필'
  }),
  'nsarmoire.character.localProfile.message': msg({
    zh: '占位用，待编辑',
    en: 'Placeholder, to be edited',
    ja: '仮置き、後で編集',
    ko: '임시 문구, 수정 예정'
  }),
  'nsarmoire.source.manualImport': msg({
    zh: '手动导入',
    en: 'Manual import',
    ja: '手動インポート',
    ko: '수동 가져오기'
  }),
  'nsarmoire.source.localHelper': msg({
    zh: '本地助手',
    en: 'Local helper',
    ja: 'ローカルヘルパー',
    ko: '로컬 헬퍼'
  }),
  'nsarmoire.source.asvelCompatible': msg({
    zh: 'Asvel 兼容导入',
    en: 'Asvel-compatible import',
    ja: 'Asvel互換インポート',
    ko: 'Asvel 호환 가져오기'
  }),
  'nsarmoire.field.itemId': msg({
    zh: draft('物品 ID'),
    en: 'Item ID',
    ja: 'アイテムID',
    ko: '아이템 ID'
  }),
  'nsarmoire.field.unknownItem': msg({
    zh: draft('未识别物品'),
    en: 'Unknown item',
    ja: '未識別アイテム',
    ko: '알 수 없는 아이템'
  }),
  'nsarmoire.field.dyes': msg({ zh: draft('染剂'), en: 'Dyes', ja: '染料', ko: '염료' }),
  'nsarmoire.container.inventory': msg({ zh: '背包', en: 'Inventory', ja: '所持品', ko: '소지품' }),
  'nsarmoire.container.saddlebag': msg({
    zh: '陆行鸟鞍囊',
    en: 'Saddlebag',
    ja: 'チョコボかばん',
    ko: '초코보 가방'
  }),
  'nsarmoire.container.retainer': msg({
    zh: '雇员',
    en: 'Retainer',
    ja: 'リテイナー',
    ko: '고용인'
  }),
  'nsarmoire.container.armoury': msg({
    zh: '兵装库',
    en: 'Armoury chest',
    ja: 'アーマリーチェスト',
    ko: '장비함'
  }),
  'nsarmoire.container.glamourDresser': msg({
    zh: '投影台',
    en: 'Glamour dresser',
    ja: 'ミラージュドレッサー',
    ko: '투영대'
  }),
  'nsarmoire.container.armoire': msg({
    zh: '收藏柜',
    en: 'Armoire',
    ja: '愛蔵品キャビネット',
    ko: '애장품 보관함'
  }),
  'nsarmoire.container.manual': msg({
    zh: '手动',
    en: 'Manual',
    ja: '手動',
    ko: '수동'
  }),

  'nsplate.tab.portrait': msg({ zh: '肖像', en: 'Portrait', ja: 'ポートレート', ko: '초상화' }),
  'nsplate.tab.nameplate': msg({ zh: '铭牌', en: 'Nameplate', ja: 'ネームプレート', ko: '명패' }),
  'nsplate.tab.info': msg({ zh: '信息', en: 'Info', ja: '情報', ko: '정보' }),
  'nsplate.info.preset': msg({
    zh: '信息预设',
    en: 'Info preset',
    ja: '情報プリセット',
    ko: '정보 프리셋'
  }),
  'nsplate.info.fields': msg({
    zh: '信息字段',
    en: 'Info fields',
    ja: '情報フィールド',
    ko: '정보 필드'
  }),
  'nsplate.info.layer.show': msg({
    zh: '显示此图层',
    en: 'Show this layer',
    ja: 'このレイヤーを表示',
    ko: '이 레이어 표시'
  }),
  'nsplate.info.layer.hide': msg({
    zh: '隐藏此图层',
    en: 'Hide this layer',
    ja: 'このレイヤーを非表示',
    ko: '이 레이어 숨기기'
  }),
  'plate.info.layerType.text': msg({ zh: '文字', en: 'Text', ja: 'テキスト', ko: '텍스트' }),
  'plate.info.layerType.icon': msg({ zh: '图标', en: 'Icon', ja: 'アイコン', ko: '아이콘' }),
  'plate.info.layerType.special': msg({
    zh: '队徽',
    en: 'Crest',
    ja: 'クレスト',
    ko: '문장'
  }),
  'plate.info.layerType.fixed': msg({ zh: '固定', en: 'Fixed', ja: '固定', ko: '고정' }),
  'plate.info.layerType.bar48': msg({
    zh: '多选',
    en: 'Multi',
    ja: '複数選択',
    ko: '다중 선택'
  }),
  'plate.info.preset.phantomTide': msg({
    zh: '幻海流',
    en: 'Phantom Tide',
    ja: '幻海流',
    ko: '환해류'
  }),
  'plate.info.preset.china': msg({ zh: '国服', en: 'China', ja: '中国版', ko: '중국 서버' }),
  'plate.info.preset.international': msg({
    zh: '国际服',
    en: 'International',
    ja: 'グローバル版',
    ko: '글로벌 서버'
  }),
  'plate.info.field.title': msg({ zh: '称号', en: 'Title', ja: '称号', ko: '칭호' }),
  'plate.info.field.characterName': msg({
    zh: '角色名',
    en: 'Character name',
    ja: 'キャラクター名',
    ko: '캐릭터 이름'
  }),
  'plate.info.field.world': msg({ zh: '服务器', en: 'World', ja: 'ワールド', ko: '월드' }),
  'plate.info.field.classJobIcon': msg({
    zh: '职业图标',
    en: 'Class/Job icon',
    ja: 'クラス/ジョブアイコン',
    ko: '클래스/잡 아이콘'
  }),
  'plate.info.field.level': msg({ zh: '等级', en: 'Level', ja: 'レベル', ko: '레벨' }),
  'plate.info.field.classJobName': msg({
    zh: '职业名',
    en: 'Class/Job name',
    ja: 'クラス/ジョブ名',
    ko: '클래스/잡 이름'
  }),
  'plate.info.field.rankIcon': msg({
    zh: '军衔图标',
    en: 'Rank icon',
    ja: '階級アイコン',
    ko: '계급 아이콘'
  }),
  'plate.info.field.rankName': msg({
    zh: '军衔名称',
    en: 'Rank name',
    ja: '階級名',
    ko: '계급명'
  }),
  'plate.info.field.crest': msg({
    zh: '部队队徽',
    en: 'Free Company crest',
    ja: 'フリーカンパニークレスト',
    ko: '자유부대 문장'
  }),
  'plate.info.field.communityName': msg({
    zh: '部队名称',
    en: 'Free Company name',
    ja: 'フリーカンパニー名',
    ko: '자유부대 이름'
  }),
  'plate.info.field.scheduleCells': msg({
    zh: '活跃时段',
    en: 'Active Hours',
    ja: 'アクティブな時間帯',
    ko: '활동 시간대'
  }),
  'plate.info.field.searchComment': msg({
    zh: '个性签名',
    en: 'Search comment',
    ja: 'サーチコメント',
    ko: '검색 코멘트'
  }),
  'plate.info.field.timeIcon': msg({
    zh: '时间图标',
    en: 'Time icon',
    ja: '時間アイコン',
    ko: '시간 아이콘'
  }),
  'plate.info.field.scheduleNumber': msg({
    zh: '活跃时段数字',
    en: 'Active Hours numbers',
    ja: 'アクティブな時間帯数字',
    ko: '활동 시간대 숫자'
  }),
  'plate.info.field.scheduleText': msg({
    zh: '作息文字',
    en: 'Schedule labels',
    ja: '活動時間ラベル',
    ko: '활동 시간 라벨'
  }),
  'plate.info.field.searchCommentIcon': msg({
    zh: '个签图标',
    en: 'Search comment icon',
    ja: 'サーチコメントアイコン',
    ko: '검색 코멘트 아이콘'
  }),
  'plate.info.field.activityIcon': msg({
    zh: '游戏风格',
    en: 'Play Style',
    ja: 'プレイスタイル',
    ko: '플레이 스타일'
  }),
  'plate.info.field.classJobEnglishName': msg({
    zh: '英文职业名',
    en: 'English class/job name',
    ja: '英語クラス/ジョブ名',
    ko: '영문 클래스/잡 이름'
  }),
  'plate.info.field.cnTitle': msg({
    zh: '中文标题',
    en: 'Chinese title',
    ja: '中国語タイトル',
    ko: '중국어 제목'
  }),
  'plate.info.field.enTitle': msg({
    zh: '英文标题',
    en: 'English title',
    ja: '英語タイトル',
    ko: '영어 제목'
  }),
  'plate.info.field.bodyCopyOne': msg({ zh: '文案1', en: 'Copy 1', ja: '本文1', ko: '문안 1' }),
  'plate.info.field.decorIconOne': msg({
    zh: '装饰图标1',
    en: 'Decor icon 1',
    ja: '装飾アイコン1',
    ko: '장식 아이콘 1'
  }),
  'plate.info.field.bodyCopyTwo': msg({ zh: '文案2', en: 'Copy 2', ja: '本文2', ko: '문안 2' }),
  'plate.info.field.decorIconTwo': msg({
    zh: '装饰图标2',
    en: 'Decor icon 2',
    ja: '装飾アイコン2',
    ko: '장식 아이콘 2'
  }),
  'plate.info.actions.group': msg({
    zh: '信息层操作',
    en: 'Info layer actions',
    ja: '情報レイヤー操作',
    ko: '정보 레이어 작업'
  }),
  'plate.info.actions.showAll': msg({
    zh: '显示全部',
    en: 'Show all',
    ja: 'すべて表示',
    ko: '전체 표시'
  }),
  'plate.info.actions.hideAll': msg({
    zh: '隐藏全部',
    en: 'Hide all',
    ja: 'すべて非表示',
    ko: '전체 숨기기'
  }),
  'plate.info.actions.reset': msg({
    zh: '重置',
    en: 'Reset',
    ja: 'リセット',
    ko: '초기화'
  }),
  'plate.info.actions.resetConfirm': msg({
    zh: '重置当前信息预设的字段、素材和启用状态？',
    en: 'Reset fields, materials, and enabled states for the current info preset?',
    ja: '現在の情報プリセットの項目、素材、表示状態をリセットしますか？',
    ko: '현재 정보 프리셋의 필드, 소재, 표시 상태를 초기화할까요?'
  }),
  'plate.info.bar48.actions': msg({
    zh: '作息条状态操作',
    en: 'Schedule bar actions',
    ja: '活動時間バー操作',
    ko: '활동 시간 바 작업'
  }),
  'plate.info.bar48.allEmpty': msg({
    zh: '全空',
    en: 'Clear all',
    ja: 'すべて空',
    ko: '전체 비우기'
  }),
  'plate.info.bar48.allOn': msg({
    zh: '全亮',
    en: 'Fill all',
    ja: 'すべて点灯',
    ko: '전체 켜기'
  }),
  'plate.info.bar48.stateSelect': msg({
    zh: '作息条选择',
    en: 'Schedule bar selection',
    ja: '活動時間バー選択',
    ko: '활동 시간 바 선택'
  }),
  'plate.info.bar48.cellPrefix': msg({
    zh: '第 ',
    en: 'Cell ',
    ja: '',
    ko: ''
  }),
  'plate.info.bar48.cellSeparator': msg({
    zh: ' 格：',
    en: ': ',
    ja: '番：',
    ko: '번: '
  }),
  'plate.info.bar48.cellOn': msg({ zh: '实心', en: 'filled', ja: '点灯', ko: '켜짐' }),
  'plate.info.bar48.cellOff': msg({ zh: '空心', en: 'empty', ja: '空', ko: '비어 있음' }),
  'plate.info.icon.material': msg({ zh: '素材', en: 'Material', ja: '素材', ko: '소재' }),
  'plate.info.icon.selectedCount': msg({
    zh: '已选',
    en: 'Selected',
    ja: '選択済み',
    ko: '선택됨'
  }),
  'plate.info.special.background': msg({
    zh: '寓意背景',
    en: 'Meaning background',
    ja: '寓意背景',
    ko: '의미 배경'
  }),
  'plate.info.special.mask': msg({
    zh: '上色蒙版',
    en: 'Tint mask',
    ja: '着色マスク',
    ko: '채색 마스크'
  }),
  'plate.info.special.symbol': msg({
    zh: '寓意物',
    en: 'Meaning symbol',
    ja: '寓意物',
    ko: '의미 상징'
  }),
  'plate.info.special.noBackground': msg({
    zh: '不使用背景',
    en: 'No background',
    ja: '背景なし',
    ko: '배경 없음'
  }),
  'plate.info.special.noMask': msg({
    zh: '不使用蒙版',
    en: 'No mask',
    ja: 'マスクなし',
    ko: '마스크 없음'
  }),
  'plate.info.special.maskNeedsBackground': msg({
    zh: '先选择背景后再选择蒙版',
    en: 'Choose a background before selecting a mask',
    ja: '先に背景を選択してください',
    ko: '먼저 배경을 선택하세요'
  }),
  'nsplate.panel.config': msg({
    zh: 'NSPlate 配置',
    en: 'NSPlate config',
    ja: 'NSPlate設定',
    ko: 'NSPlate 설정'
  }),
  'nsplate.panel.assets': msg({ zh: '素材', en: 'Assets', ja: '素材', ko: '소재' }),
  'nsplate.panel.presets': msg({ zh: '预设', en: 'Presets', ja: 'プリセット', ko: '프리셋' }),
  'nsplate.panel.currentCombination': msg({
    zh: '当前组合',
    en: 'Current set',
    ja: '現在の組み合わせ',
    ko: '현재 조합'
  }),
  'nsplate.panel.layerOrder': msg({
    zh: '图层顺序',
    en: 'Layer order',
    ja: 'レイヤー順序',
    ko: '레이어 순서'
  }),
  'nsplate.layerOrder.customPortraitPopout': msg({
    zh: '出框角色层',
    en: 'Popout character layer',
    ja: 'はみ出しキャラクターレイヤー',
    ko: '돌출 캐릭터 레이어'
  }),
  'nsplate.layerOrder.infoLayers': msg({
    zh: '信息层',
    en: 'Info layer',
    ja: '情報レイヤー',
    ko: '정보 레이어'
  }),
  'nsplate.layerOrder.enabled': msg({
    zh: '已启用',
    en: 'Enabled',
    ja: '有効',
    ko: '사용 중'
  }),
  'nsplate.layerOrder.notEnabled': msg({
    zh: '未启用',
    en: 'Not enabled',
    ja: '未使用',
    ko: '사용 안 함'
  }),
  'nsplate.layerOrder.moveUp': msg({
    zh: '将出框角色层上移',
    en: 'Move popout character layer up',
    ja: 'はみ出しキャラクターレイヤーを上へ',
    ko: '돌출 캐릭터 레이어 위로 이동'
  }),
  'nsplate.layerOrder.moveDown': msg({
    zh: '将出框角色层下移',
    en: 'Move popout character layer down',
    ja: 'はみ出しキャラクターレイヤーを下へ',
    ko: '돌출 캐릭터 레이어 아래로 이동'
  }),
  'nsplate.panel.portraitAssets': msg({
    zh: '肖像素材',
    en: 'Portrait assets',
    ja: 'ポートレート素材',
    ko: '초상화 소재'
  }),
  'nsplate.panel.nameplateAssets': msg({
    zh: '铭牌素材',
    en: 'Nameplate assets',
    ja: 'ネームプレート素材',
    ko: '명패 소재'
  }),
  'nsplate.panel.customPortrait': msg({
    zh: '自定义图片',
    en: 'Custom image',
    ja: 'カスタム画像',
    ko: '사용자 이미지'
  }),
  'nsplate.portraitSide.title': msg({
    zh: '肖像位置',
    en: 'Portrait side',
    ja: 'ポートレート位置',
    ko: '초상화 위치'
  }),
  'nsplate.portraitSide.left': msg({
    zh: '左侧',
    en: 'Left',
    ja: '左側',
    ko: '왼쪽'
  }),
  'nsplate.portraitSide.right': msg({
    zh: '右侧',
    en: 'Right',
    ja: '右側',
    ko: '오른쪽'
  }),
  'nsplate.customPortrait.upload': msg({
    zh: '选择图片',
    en: 'Choose image',
    ja: '画像を選択',
    ko: '이미지 선택'
  }),
  'nsplate.customPortrait.clear': msg({
    zh: '移除图片',
    en: 'Remove image',
    ja: '画像を削除',
    ko: '이미지 제거'
  }),
  'nsplate.customPortrait.clearConfirm': msg({
    zh: '确认移除自定义图片？',
    en: 'Remove the custom image?',
    ja: 'カスタム画像を削除しますか？',
    ko: '사용자 이미지를 제거할까요?'
  }),
  'nsplate.customPortrait.input': msg({
    zh: '选择自定义肖像图片',
    en: 'Choose a custom portrait image',
    ja: 'カスタムポートレート画像を選択',
    ko: '사용자 초상화 이미지 선택'
  }),
  'nsplate.customPortrait.error': msg({
    zh: '无法读取该图片',
    en: 'Unable to read this image',
    ja: 'この画像を読み取れません',
    ko: '이 이미지를 읽을 수 없습니다'
  }),
  'nsplate.customPortrait.crop.title': msg({
    zh: '裁切自定义肖像',
    en: 'Crop custom portrait',
    ja: 'カスタムポートレートをトリミング',
    ko: '사용자 초상화 자르기'
  }),
  'nsplate.customPortrait.crop.canvas': msg({
    zh: '自定义肖像裁切预览',
    en: 'Custom portrait crop preview',
    ja: 'カスタムポートレートのトリミングプレビュー',
    ko: '사용자 초상화 자르기 미리보기'
  }),
  'nsplate.customPortrait.crop.mode': msg({
    zh: '裁切模式',
    en: 'Crop mode',
    ja: 'トリミングモード',
    ko: '자르기 모드'
  }),
  'nsplate.customPortrait.crop.mode.standard': msg({
    zh: '标准进框',
    en: 'Standard',
    ja: '標準',
    ko: '표준'
  }),
  'nsplate.customPortrait.crop.mode.popout': msg({
    zh: '出框',
    en: 'Popout',
    ja: '枠外',
    ko: '프레임 밖'
  }),
  'nsplate.customPortrait.crop.zoom': msg({
    zh: '缩放',
    en: 'Zoom',
    ja: 'ズーム',
    ko: '확대/축소'
  }),
  'nsplate.customPortrait.crop.split': msg({
    zh: '出框分界线',
    en: 'Popout split line',
    ja: '枠外の境界線',
    ko: '프레임 밖 경계선'
  }),
  'nsplate.customPortrait.crop.cancel': msg({
    zh: '取消',
    en: 'Cancel',
    ja: 'キャンセル',
    ko: '취소'
  }),
  'nsplate.customPortrait.crop.apply': msg({
    zh: '应用',
    en: 'Apply',
    ja: '適用',
    ko: '적용'
  }),
  'nsplate.action.menu': msg({
    zh: '操作菜单',
    en: 'Actions',
    ja: '操作メニュー',
    ko: '작업 메뉴'
  }),
  'nsplate.action.clearAllSelections': msg({
    zh: '清空素材',
    en: 'Clear assets',
    ja: '素材をクリア',
    ko: '소재 지우기'
  }),
  'nsplate.action.clearAllSelectionsConfirm': msg({
    zh: '确认清空素材选择？',
    en: 'Clear asset selections?',
    ja: '素材の選択をクリアしますか？',
    ko: '소재 선택을 지울까요?'
  }),
  'nsplate.config.import': msg({
    zh: '导入配置',
    en: 'Import config',
    ja: '設定をインポート',
    ko: '설정 가져오기'
  }),
  'nsplate.config.importInput': msg({
    zh: '选择 NSPlate 配置 JSON',
    en: 'Choose an NSPlate config JSON',
    ja: 'NSPlate設定JSONを選択',
    ko: 'NSPlate 설정 JSON 선택'
  }),
  'nsplate.config.importSuccess': msg({
    zh: '配置已导入',
    en: 'Config imported',
    ja: '設定をインポートしました',
    ko: '설정을 가져왔습니다'
  }),
  'nsplate.config.importPartial': msg({
    zh: '已导入当前版本支持的配置；未迁移的信息层或缺失素材暂时跳过',
    en: 'Supported config was imported; unmigrated info layers or missing assets were skipped.',
    ja: '現在対応している設定をインポートしました。未移行の情報レイヤーまたは不足素材はスキップしました。',
    ko: '현재 지원되는 설정을 가져왔습니다. 아직 이전되지 않은 정보 레이어나 누락 소재는 건너뛰었습니다.'
  }),
  'nsplate.config.importUnsupported': msg({
    zh: '这个文件不是网页配置；如果是分层 ZIP，请导入里面的 composer-config.json',
    en: 'This is not a web config. If it came from a layered ZIP, import composer-config.json inside it.',
    ja: 'これはWeb設定ではありません。レイヤーZIPの場合は中のcomposer-config.jsonをインポートしてください。',
    ko: '웹 설정 파일이 아닙니다. 레이어 ZIP이라면 내부의 composer-config.json을 가져오세요.'
  }),
  'nsplate.config.importError': msg({
    zh: '配置导入失败，请确认文件来自旧铭牌工房',
    en: 'Config import failed. Check that the file came from the legacy nameplate editor.',
    ja: '設定のインポートに失敗しました。旧ネームプレート工房のファイルか確認してください。',
    ko: '설정 가져오기에 실패했습니다. 이전 명패 편집기에서 나온 파일인지 확인하세요.'
  }),
  'nsplate.config.paste': msg({
    zh: '粘贴配置',
    en: 'Paste config',
    ja: '設定を貼り付け',
    ko: '설정 붙여넣기'
  }),
  'nsplate.config.pasteError': msg({
    zh: '读取剪贴板失败，请改用导入配置',
    en: 'Clipboard read failed. Use import config instead.',
    ja: 'クリップボードを読み取れませんでした。設定をインポートしてください。',
    ko: '클립보드를 읽지 못했습니다. 설정 가져오기를 사용하세요.'
  }),
  'nsplate.config.copy': msg({
    zh: '复制配置',
    en: 'Copy config',
    ja: '設定をコピー',
    ko: '설정 복사'
  }),
  'nsplate.config.export': msg({
    zh: '导出配置',
    en: 'Export config',
    ja: '設定を書き出し',
    ko: '설정 내보내기'
  }),
  'nsplate.config.copySuccess': msg({
    zh: '配置已复制',
    en: 'Config copied',
    ja: '設定をコピーしました',
    ko: '설정을 복사했습니다'
  }),
  'nsplate.config.copyError': msg({
    zh: '复制配置失败，请改用导出配置',
    en: 'Copy failed. Use export config instead.',
    ja: 'コピーに失敗しました。設定を書き出してください。',
    ko: '복사에 실패했습니다. 설정 내보내기를 사용하세요.'
  }),
  'nsplate.export.png': msg({
    zh: '导出 PNG',
    en: 'Export PNG',
    ja: 'PNGを書き出し',
    ko: 'PNG 내보내기'
  }),
  'nsplate.export.jpg': msg({
    zh: '导出 JPG',
    en: 'Export JPG',
    ja: 'JPGを書き出し',
    ko: 'JPG 내보내기'
  }),
  'nsplate.export.layeredZip': msg({
    zh: '导出分层 ZIP',
    en: 'Export layered ZIP',
    ja: 'レイヤーZIPを書き出し',
    ko: '레이어 ZIP 내보내기'
  }),
  'nsplate.export.scale2x': msg({
    zh: '导出 200%',
    en: 'Export 200%',
    ja: '200%で書き出し',
    ko: '200%로 내보내기'
  }),
  'nsplate.export.error': msg({
    zh: '导出失败，请重试',
    en: 'Export failed. Please try again.',
    ja: '書き出しに失敗しました。もう一度お試しください。',
    ko: '내보내기에 실패했습니다. 다시 시도해 주세요.'
  }),
  'nsplate.export.error.noLayers': msg({
    zh: '没有可导出的图层，请先选择素材',
    en: 'No exportable layers. Choose assets first.',
    ja: '書き出せるレイヤーがありません。先に素材を選択してください。',
    ko: '내보낼 수 있는 레이어가 없습니다. 먼저 소재를 선택해 주세요.'
  }),
  'nsplate.export.error.layeredZip': msg({
    zh: '分层 ZIP 导出失败，请重试',
    en: 'Layered ZIP export failed. Please try again.',
    ja: 'レイヤーZIPの書き出しに失敗しました。もう一度お試しください。',
    ko: '레이어 ZIP 내보내기에 실패했습니다. 다시 시도해 주세요.'
  }),
  'nsplate.canvas.editing': msg({ zh: '编辑', en: 'Edit', ja: '編集', ko: '편집' }),
  'nsplate.canvas.selectedPreset': msg({
    zh: '预设',
    en: 'Preset',
    ja: 'プリセット',
    ko: '프리셋'
  }),
  'nsplate.canvas.selectedLayers': msg({
    zh: '已选',
    en: 'Selected',
    ja: '選択済み',
    ko: '선택됨'
  }),
  'nsplate.canvas.layers': msg({ zh: '图层', en: 'Layers', ja: 'レイヤー', ko: '레이어' }),
  'nsplate.canvas.selectionStatus': msg({
    zh: 'NSPlate 预览选择状态',
    en: 'NSPlate preview selection',
    ja: 'NSPlateプレビュー選択状態',
    ko: 'NSPlate 미리보기 선택 상태'
  }),
  'nsplate.canvas.aria': msg({
    zh: '铭牌预览画布，当前编辑',
    en: 'Nameplate preview canvas, editing ',
    ja: 'ネームプレートプレビューキャンバス、編集中: ',
    ko: '명패 미리보기 캔버스, 현재 편집: '
  }),
  'nsplate.canvas.viewportToolbar': msg({
    zh: '画布视图控制',
    en: 'Canvas view controls',
    ja: 'キャンバス表示コントロール',
    ko: '캔버스 보기 컨트롤'
  }),
  'nsplate.canvas.clearToolbar': msg({
    zh: '画布清空操作',
    en: 'Canvas clear actions',
    ja: 'キャンバスのクリア操作',
    ko: '캔버스 지우기 작업'
  }),
  'nsplate.canvas.zoomOut': msg({
    zh: '缩小画布预览',
    en: 'Zoom preview out',
    ja: 'プレビューを縮小',
    ko: '미리보기 축소'
  }),
  'nsplate.canvas.zoomIn': msg({
    zh: '放大画布预览',
    en: 'Zoom preview in',
    ja: 'プレビューを拡大',
    ko: '미리보기 확대'
  }),
  'nsplate.canvas.zoomLabel': msg({
    zh: '当前画布预览缩放',
    en: 'Current preview zoom',
    ja: '現在のプレビュー倍率',
    ko: '현재 미리보기 확대율'
  }),
  'nsplate.canvas.resetView': msg({
    zh: '适配',
    en: 'Fit',
    ja: 'フィット',
    ko: '맞춤'
  }),
  'nsplate.resize.configPanel': msg({
    zh: '调整 NSPlate 配置面板宽度',
    en: 'Resize NSPlate config panel',
    ja: 'NSPlate設定パネルの幅を調整',
    ko: 'NSPlate 설정 패널 너비 조정'
  }),
  'nsplate.category.portraitBackground': msg({
    zh: '肖像背景',
    en: 'Portrait background',
    ja: 'ポートレート背景',
    ko: '초상화 배경'
  }),
  'nsplate.category.portraitDecorFrame': msg({
    zh: '肖像装饰框',
    en: 'Portrait frame',
    ja: 'ポートレート装飾枠',
    ko: '초상화 장식 프레임'
  }),
  'nsplate.category.portraitDecoration': msg({
    zh: '肖像装饰物',
    en: 'Portrait decoration',
    ja: 'ポートレート装飾',
    ko: '초상화 장식'
  }),
  'nsplate.category.portraitFrame': msg({
    zh: '肖像外框',
    en: 'Portrait outer frame',
    ja: 'ポートレート外枠',
    ko: '초상화 외곽 프레임'
  }),
  'nsplate.category.nameplateBase': msg({
    zh: '铭牌背衬',
    en: 'Nameplate backing',
    ja: 'ネームプレート背面',
    ko: '명패 배경판'
  }),
  'nsplate.category.nameplateColor': msg({
    zh: '铭牌底色',
    en: 'Nameplate color',
    ja: 'ネームプレート地色',
    ko: '명패 바탕색'
  }),
  'nsplate.category.nameplatePattern': msg({
    zh: '铭牌花纹',
    en: 'Nameplate pattern',
    ja: 'ネームプレート模様',
    ko: '명패 무늬'
  }),
  'nsplate.category.nameplateFrame': msg({
    zh: '铭牌外框',
    en: 'Nameplate frame',
    ja: 'ネームプレート外枠',
    ko: '명패 프레임'
  }),
  'nsplate.category.nameplateTopDecor': msg({
    zh: '铭牌顶部装饰',
    en: 'Top decoration',
    ja: '上部装飾',
    ko: '상단 장식'
  }),
  'nsplate.category.nameplateBottomDecor': msg({
    zh: '铭牌底部装饰',
    en: 'Bottom decoration',
    ja: '下部装飾',
    ko: '하단 장식'
  }),
  'nsplate.category.nameplateDecoration': msg({
    zh: '铭牌装饰物',
    en: 'Nameplate decoration',
    ja: 'ネームプレート装飾',
    ko: '명패 장식'
  }),
  'nsplate.category.nameplateDecorationAlt': msg({
    zh: '铭牌装饰物B',
    en: 'Nameplate decoration B',
    ja: 'ネームプレート装飾B',
    ko: '명패 장식 B'
  }),

  'styleLab.pixelTone': msg({
    zh: '像素色调',
    en: 'Pixel tone',
    ja: 'ピクセルトーン',
    ko: '픽셀 톤'
  }),
  'styleLab.fontMode': msg({
    zh: '字体模式',
    en: 'Font mode',
    ja: 'フォントモード',
    ko: '글꼴 모드'
  }),
  'styleLab.title': same('Pixel Soft'),
  'styleLab.sampleLead': same(placeholder),
  'styleLab.primary': same('Primary'),
  'styleLab.action': same('Action'),
  'styleLab.default': same('Default'),
  'styleLab.windowSample': msg({
    zh: '像素窗口样本',
    en: 'Pixel soft sample window',
    ja: 'ピクセルウィンドウサンプル',
    ko: '픽셀 창 샘플'
  }),
  'styleLab.palette': msg({
    zh: '像素色板',
    en: 'Pixel soft palette',
    ja: 'ピクセルパレット',
    ko: '픽셀 팔레트'
  }),
  'styleLab.progress': msg({
    zh: '预览进度',
    en: 'Preview progress',
    ja: 'プレビュー進行',
    ko: '미리보기 진행'
  }),
  'styleLab.popupMenuSample': msg({
    zh: '千禧像素弹窗菜单样本',
    en: 'Millennium pixel popup menu sample',
    ja: 'ミレニアムピクセルポップアップメニューサンプル',
    ko: '밀레니엄 픽셀 팝업 메뉴 샘플'
  }),
  'styleLab.popupWindowSample': msg({
    zh: '弹窗菜单窗口样本',
    en: 'Popup menu window sample',
    ja: 'ポップアップメニューウィンドウサンプル',
    ko: '팝업 메뉴 창 샘플'
  }),
  'styleLab.popupNavigationSample': msg({
    zh: '像素弹窗导航样本',
    en: 'Pixel popup navigation sample',
    ja: 'ピクセルポップアップナビゲーションサンプル',
    ko: '픽셀 팝업 탐색 샘플'
  }),
  'styleLab.ffxivChildren': msg({
    zh: 'FF14 工具子项',
    en: 'FFXIV tool children',
    ja: 'FFXIVツール子項目',
    ko: 'FFXIV 도구 하위 항목'
  }),
  'styleLab.ocChildren': msg({
    zh: 'OC 子项',
    en: 'OC children',
    ja: 'OC子項目',
    ko: 'OC 하위 항목'
  }),
  'styleLab.workbenchSample': msg({
    zh: '像素工作台样本',
    en: 'Pixel soft workbench sample',
    ja: 'ピクセルワークベンチサンプル',
    ko: '픽셀 작업대 샘플'
  }),
  'styleLab.workbenchToolbar': msg({
    zh: '工作台工具栏样本',
    en: 'Workbench toolbar sample',
    ja: 'ワークベンチツールバーサンプル',
    ko: '작업대 도구 모음 샘플'
  }),
  'styleLab.workbenchSidebar': msg({
    zh: '工作台侧栏样本',
    en: 'Workbench sidebar sample',
    ja: 'ワークベンチサイドバーサンプル',
    ko: '작업대 사이드바 샘플'
  }),
  'styleLab.workbenchCanvas': msg({
    zh: '工作台画布样本',
    en: 'Workbench canvas sample',
    ja: 'ワークベンチキャンバスサンプル',
    ko: '작업대 캔버스 샘플'
  }),
  'styleLab.workbenchInspector': msg({
    zh: '工作台检查器样本',
    en: 'Workbench inspector sample',
    ja: 'ワークベンチインスペクターサンプル',
    ko: '작업대 검사기 샘플'
  }),
  'styleLab.workbenchMeters': msg({
    zh: '工作台设置条',
    en: 'Workbench setting meters',
    ja: 'ワークベンチ設定メーター',
    ko: '작업대 설정 막대'
  }),
  'styleLab.toolbarSample': msg({
    zh: '像素工具栏样本',
    en: 'Pixel toolbar sample',
    ja: 'ピクセルツールバーサンプル',
    ko: '픽셀 도구 모음 샘플'
  }),
  'styleLab.commonToolbarPreview': msg({
    zh: '公共组件工具栏预览',
    en: 'Common component toolbar preview',
    ja: '共通コンポーネントツールバープレビュー',
    ko: '공통 컴포넌트 도구 모음 미리보기'
  }),
  'styleLab.commonTabsPreview': msg({
    zh: '公共组件选项卡预览',
    en: 'Common component tabs preview',
    ja: '共通コンポーネントタブプレビュー',
    ko: '공통 컴포넌트 탭 미리보기'
  }),
  'styleLab.formalComponents': msg({
    zh: '正式公共组件基准',
    en: 'Formal component baseline',
    ja: '正式共通コンポーネント基準',
    ko: '정식 공통 컴포넌트 기준'
  }),
  'styleLab.formalControls': msg({
    zh: '公共控件基准',
    en: 'Common control baseline',
    ja: '共通コントロール基準',
    ko: '공통 컨트롤 기준'
  }),
  'styleLab.formalStates': msg({
    zh: '状态反馈基准',
    en: 'Status feedback baseline',
    ja: '状態フィードバック基準',
    ko: '상태 피드백 기준'
  }),
  'styleLab.toolCardSamples': msg({
    zh: '像素工具卡样本',
    en: 'Pixel tool card samples',
    ja: 'ピクセルツールカードサンプル',
    ko: '픽셀 도구 카드 샘플'
  }),
  'styleLab.decorativePixels': msg({
    zh: '装饰像素',
    en: 'Decorative pixels',
    ja: '装飾ピクセル',
    ko: '장식 픽셀'
  }),
  'styleLab.allPixels': msg({
    zh: '全部像素',
    en: 'All pixels',
    ja: '全ピクセル',
    ko: '전체 픽셀'
  }),
  'styleLab.currentPixel': msg({
    zh: '当前像素',
    en: 'Current pixel',
    ja: '現在のピクセル',
    ko: '현재 픽셀'
  }),
  'styleLab.lightPixel': msg({
    zh: '轻像素',
    en: 'Light pixel',
    ja: '軽いピクセル',
    ko: '가벼운 픽셀'
  }),
  'styleLab.cyberNight': msg({
    zh: '赛博夜色',
    en: 'Cyber night',
    ja: 'サイバーナイト',
    ko: '사이버 나이트'
  }),
  'styleLab.tools': msg({ zh: '工具', en: 'Tools', ja: 'ツール', ko: '도구' }),
  'styleLab.equipmentPanel': msg({
    zh: '装备栏',
    en: 'Equipment panel',
    ja: '装備欄',
    ko: '장비 패널'
  }),
  'styleLab.template': msg({ zh: '模板', en: 'Template', ja: 'テンプレート', ko: '템플릿' }),
  'styleLab.assets': msg({ zh: '素材', en: 'Assets', ja: '素材', ko: '소재' }),
  'styleLab.layers': msg({ zh: '图层', en: 'Layers', ja: 'レイヤー', ko: '레이어' }),
  'styleLab.titleField': msg({ zh: '标题', en: 'Title', ja: 'タイトル', ko: '제목' }),
  'styleLab.character': msg({ zh: '角色', en: 'Character', ja: 'キャラクター', ko: '캐릭터' }),
  'styleLab.equipment': msg({ zh: '装备', en: 'Equipment', ja: '装備', ko: '장비' }),
  'styleLab.background': msg({ zh: '背景', en: 'Background', ja: '背景', ko: '배경' }),
  'styleLab.inspector': msg({ zh: '检查器', en: 'Inspector', ja: 'インスペクター', ko: '검사기' }),
  'styleLab.language': msg({ zh: '语言', en: 'Language', ja: '言語', ko: '언어' }),
  'styleLab.ready': msg({ zh: '就绪', en: 'Ready', ja: '準備完了', ko: '준비됨' }),
  'styleLab.name': msg({ zh: '名称', en: 'Name', ja: '名前', ko: '이름' }),
  'styleLab.module': msg({ zh: '模块', en: 'Module', ja: 'モジュール', ko: '모듈' }),
  'styleLab.toolBadge': msg({ zh: '工具', en: 'tool', ja: 'tool', ko: 'tool' }),
  'styleLab.statusPanel': msg({
    zh: '状态面板',
    en: 'Status panel',
    ja: 'ステータスパネル',
    ko: '상태 패널'
  }),
  'styleLab.appField': same('AppField'),
  'styleLab.appToolbar': same('AppToolbar'),
  'styleLab.appStatus': same('AppStatus'),
  'styleLab.iconLab': msg({
    zh: 'Pixelarticons 图标样本',
    en: 'Pixelarticons icon samples',
    ja: 'Pixelarticonsアイコンサンプル',
    ko: 'Pixelarticons 아이콘 샘플'
  }),
  'styleLab.iconTextBar': msg({
    zh: '图标文字 Bar',
    en: 'Icon text bar',
    ja: 'アイコン付きテキストバー',
    ko: '아이콘 텍스트 바'
  }),
  'styleLab.iconOnlyButtons': msg({
    zh: '纯图标按钮',
    en: 'Icon-only buttons',
    ja: 'アイコンのみボタン',
    ko: '아이콘 전용 버튼'
  }),
  'styleLab.textIconButtons': msg({
    zh: '图标文字按钮',
    en: 'Icon text buttons',
    ja: 'アイコン付きテキストボタン',
    ko: '아이콘 텍스트 버튼'
  }),
  'styleLab.iconMenuSample': msg({
    zh: '图标菜单',
    en: 'Icon menu',
    ja: 'アイコンメニュー',
    ko: '아이콘 메뉴'
  }),
  'styleLab.iconSource': same('Pixelarticons / MIT'),
  'styleLab.icon.home': msg({ zh: '主页', en: 'Home', ja: 'ホーム', ko: '홈' }),
  'styleLab.icon.menu': msg({ zh: '菜单', en: 'Menu', ja: 'メニュー', ko: '메뉴' }),
  'styleLab.icon.config': msg({ zh: '设置', en: 'Config', ja: '設定', ko: '설정' }),
  'styleLab.icon.search': msg({ zh: '搜索', en: 'Search', ja: '検索', ko: '검색' }),
  'styleLab.icon.download': msg({
    zh: '下载',
    en: 'Download',
    ja: 'ダウンロード',
    ko: '다운로드'
  }),
  'styleLab.icon.image': msg({ zh: '图片', en: 'Image', ja: '画像', ko: '이미지' }),
  'styleLab.icon.folder': msg({ zh: '文件夹', en: 'Folder', ja: 'フォルダー', ko: '폴더' }),
  'styleLab.icon.favorite': msg({
    zh: '收藏',
    en: 'Favorite',
    ja: 'お気に入り',
    ko: '즐겨찾기'
  }),
  'styleLab.icon.language': msg({ zh: '语言', en: 'Language', ja: '言語', ko: '언어' }),
  'styleLab.notebookLab': msg({
    zh: '赛博记事本样本',
    en: 'Cyber notebook sample',
    ja: 'サイバーノートサンプル',
    ko: '사이버 노트 샘플'
  }),
  'styleLab.notebook.card': msg({
    zh: '赛博记事本选择面板',
    en: 'Cyber notebook picker',
    ja: 'サイバーノート選択パネル',
    ko: '사이버 노트 선택 패널'
  }),
  'styleLab.notebook.fold': msg({
    zh: '可折叠素材小面板',
    en: 'Foldable material panel',
    ja: '折りたたみ素材パネル',
    ko: '접이식 소재 패널'
  }),
  'styleLab.notebook.comment': msg({
    zh: '作为画布区旁边的工作台便签：不是导出内容，而是帮助用户快速确认当前组合和素材状态。',
    en: 'A workbench note near the canvas: not exported content, just a quick status rhythm.',
    ja: 'キャンバス横の作業メモです。書き出し対象ではなく、現在の組み合わせと素材状態を確認します。',
    ko: '캔버스 옆 작업 메모입니다. 내보내기 대상이 아니라 현재 조합과 소재 상태를 빠르게 확인합니다.'
  }),
  'styleLab.notebook.rule.title': msg({
    zh: '第一行显示组合名和进度。',
    en: 'First line shows group name and progress.',
    ja: '1行目にグループ名と進捗を表示。',
    ko: '첫 줄에 그룹명과 진행도를 표시합니다.'
  }),
  'styleLab.notebook.rule.value': msg({
    zh: '第二行是素材名，最多两行后省略。',
    en: 'Second line is the material value, clamped after two lines.',
    ja: '2行目は素材名で、2行まで表示します。',
    ko: '둘째 줄은 소재명이며 두 줄 뒤 생략합니다.'
  }),
  'styleLab.notebook.rule.fold': msg({
    zh: '折叠态只保留当前组合，不显示具体项目。',
    en: 'Folded state keeps only the current group, not every item.',
    ja: '折りたたみ時は現在のグループだけを残します。',
    ko: '접힌 상태에서는 현재 그룹만 남깁니다.'
  }),
  'styleLab.meta.text': same('text'),
  'styleLab.meta.material': msg({ zh: '素材', en: 'Material', ja: '素材', ko: '소재' }),
  'styleLab.meta.currentGroup': msg({
    zh: '当前组合',
    en: 'Current group',
    ja: '現在の組み合わせ',
    ko: '현재 조합'
  }),
  'styleLab.meta.portraitBackground': msg({
    zh: '肖像背景',
    en: 'Portrait background',
    ja: 'ポートレート背景',
    ko: '초상화 배경'
  }),
  'styleLab.meta.portraitFrame': msg({
    zh: '肖像装饰框',
    en: 'Portrait frame',
    ja: 'ポートレート装飾枠',
    ko: '초상화 장식 프레임'
  }),
  'styleLab.meta.portraitDecoration': msg({
    zh: '肖像装饰物',
    en: 'Portrait decoration',
    ja: 'ポートレート装飾',
    ko: '초상화 장식'
  }),
  'styleLab.meta.nameplateBacking': msg({
    zh: '铭牌背衬',
    en: 'Nameplate backing',
    ja: 'ネームプレート背面',
    ko: '명패 배경판'
  }),
  'styleLab.meta.gray': msg({ zh: '灰色', en: 'Gray', ja: 'グレー', ko: '회색' }),
  'styleLab.meta.glow': msg({ zh: '光彩', en: 'Glow', ja: '光彩', ko: '광채' }),
  'styleLab.meta.unselected': msg({
    zh: '未选',
    en: 'Unselected',
    ja: '未選択',
    ko: '선택 안 됨'
  }),
  'styleLab.meta.newColor': msg({
    zh: '新空色：防...',
    en: 'Sky tint: def...',
    ja: '空色：防...',
    ko: '하늘색: 방...'
  }),
  'styleLab.skinName': same('pixel-soft-lite')
}
