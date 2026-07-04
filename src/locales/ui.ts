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

  'ffxiv.workshop.title': msg({
    zh: '狒狒14工房',
    en: 'FFXIV Workshop',
    ja: 'FFXIV工房',
    ko: 'FFXIV 공방'
  }),
  'ffxiv.workshop.short': msg({ zh: '狒狒14', en: 'FFXIV', ja: 'FFXIV', ko: 'FFXIV' }),
  'ffxiv.tool.glamour.title': same('幻化工房'),
  'ffxiv.tool.plate.title': same('铭牌工房'),
  'ffxiv.tool.armoire.title': same('衣柜清理大师'),

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
  'nsarmoire.recommendation.cabinet': msg({
    zh: draft('可转入收藏柜'),
    en: 'Move to armoire',
    ja: '愛蔵品キャビネットへ',
    ko: '애장품 보관함으로'
  }),
  'nsarmoire.recommendation.sets': msg({
    zh: draft('残缺套装'),
    en: 'Incomplete sets',
    ja: '不足セット',
    ko: '불완전 세트'
  }),
  'nsarmoire.recommendation.duplicateItems': msg({
    zh: '重复物品检查',
    en: 'Duplicate item check',
    ja: '重複アイテム確認',
    ko: '중복 아이템 확인'
  }),
  'nsarmoire.recommendation.duplicates': msg({
    zh: draft('同模型可精简'),
    en: 'Duplicate model cleanup',
    ja: '同一モデル整理',
    ko: '동일 모델 정리'
  }),
  'nsarmoire.recommendation.dyes': msg({
    zh: draft('染色先确认'),
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
    zh: draft('有 {count} 条已经染色，移动、套装化或精简前先确认染色是否要保留。'),
    en: '{count} entries are dyed. Check dyes before moving, storing as sets, or cleaning duplicates.',
    ja: '{count} 件が染色済みです。移動、セット収納、整理の前に染色を確認してください。',
    ko: '{count}개 항목이 염색되어 있습니다. 이동, 세트 보관, 중복 정리 전에 염색을 확인하세요.'
  }),
  'nsarmoire.summary.noDyeWarning': msg({
    zh: draft('未发现染色条目，当前这批数据的移动风险较低。'),
    en: 'No dyed entries were found, so moving these entries is lower risk.',
    ja: '染色済み項目はありません。今回の移動リスクは低めです。',
    ko: '염색 항목이 없어 이동 위험이 낮습니다.'
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
    en: '{count} item IDs appear more than once. Check whether all copies should be kept: {items}.',
    ja: '{count} 種のアイテムIDが複数あります。すべて残すか確認: {items}。',
    ko: '{count}종 아이템 ID가 여러 번 있습니다. 모두 보관할지 확인: {items}.'
  }),
  'nsarmoire.hint.duplicateItems.none': msg({
    zh: draft('当前没有发现同一物品 ID 的多条记录。'),
    en: 'No item ID appears in multiple entries right now.',
    ja: '同じアイテムIDの複数記録はありません。',
    ko: '같은 아이템 ID의 여러 항목은 없습니다.'
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
    zh: draft('有 {count} 件带染色，整理前先看染剂：{items}。'),
    en: '{count} items are dyed. Check dye choices before cleanup: {items}.',
    ja: '{count} 件が染色済みです。整理前に染色を確認: {items}。',
    ko: '{count}개 항목이 염색되어 있습니다. 정리 전 염색 확인: {items}.'
  }),
  'nsarmoire.hint.allClear.title': msg({
    zh: draft('暂无需要处理的提示'),
    en: 'No action hints yet',
    ja: '処理ヒントなし',
    ko: '처리 힌트 없음'
  }),
  'nsarmoire.hint.allClear.message': msg({
    zh: draft('当前导入的数据没有触发收藏柜、套装、重复物品、同模型或染色风险提示。'),
    en: 'The current import did not trigger armoire, set, duplicate item, duplicate model, or dye-risk hints.',
    ja: '今回のデータでは、キャビネット、セット、重複アイテム、同一モデル、染色リスクのヒントはありません。',
    ko: '현재 가져온 데이터에서는 보관함, 세트, 중복 아이템, 동일 모델, 염색 위험 힌트가 없습니다.'
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
    zh: draft('{items} 等 {count} 件'),
    en: '{items}, and {count} total',
    ja: '{items} など合計 {count} 件',
    ko: '{items} 등 총 {count}개'
  }),
  'nsarmoire.hint.missingPieces': msg({
    zh: draft('缺少：{items}'),
    en: 'Missing: {items}',
    ja: '不足: {items}',
    ko: '누락: {items}'
  }),
  'nsarmoire.hint.ownedEntries': msg({
    zh: draft('当前拥有 {count} 条'),
    en: '{count} owned entries',
    ja: '所持記録 {count} 件',
    ko: '보유 항목 {count}개'
  }),
  'nsarmoire.hint.currentLocation': msg({
    zh: draft('当前在：{locations}'),
    en: 'Currently in: {locations}',
    ja: '現在位置: {locations}',
    ko: '현재 위치: {locations}'
  }),
  'nsarmoire.hint.namedLocations': msg({
    zh: draft('{item}：{locations}'),
    en: '{item}: {locations}',
    ja: '{item}: {locations}',
    ko: '{item}: {locations}'
  }),
  'nsarmoire.action.expandList': msg({
    zh: draft('展开全部'),
    en: 'Show all',
    ja: 'すべて表示',
    ko: '모두 보기'
  }),
  'nsarmoire.action.collapseList': msg({
    zh: draft('收起列表'),
    en: 'Collapse list',
    ja: 'リストを閉じる',
    ko: '목록 접기'
  }),
  'nsarmoire.action.loadExampleSnapshot': msg({
    zh: draft('载入示例'),
    en: 'Load example',
    ja: '例を読み込む',
    ko: '예시 불러오기'
  }),
  'nsarmoire.action.importSnapshot': msg({
    zh: draft('导入 snapshot'),
    en: 'Import snapshot',
    ja: 'snapshotをインポート',
    ko: 'snapshot 가져오기'
  }),
  'nsarmoire.action.clearSnapshot': msg({
    zh: draft('清空 snapshot'),
    en: 'Clear snapshot',
    ja: 'snapshotをクリア',
    ko: 'snapshot 지우기'
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
    zh: draft('已读取 {items} 件物品、{cabinet} 个收藏柜项、{sets} 个套装项、{models} 组同模型和 {dyes} 个染剂。'),
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
    zh: draft('生成时间'),
    en: 'Generated at',
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
  'nsarmoire.field.itemId': msg({
    zh: draft('物品 ID'),
    en: 'Item ID',
    ja: 'アイテムID',
    ko: '아이템 ID'
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
  'plate.info.field.rankIcon': msg({ zh: '军衔', en: 'Rank', ja: '階級', ko: '계급' }),
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
    zh: '作息选择',
    en: 'Schedule cells',
    ja: '活動時間選択',
    ko: '활동 시간 선택'
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
    zh: '作息数字',
    en: 'Schedule numbers',
    ja: '活動時間数字',
    ko: '활동 시간 숫자'
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
    zh: '活动图标',
    en: 'Activity icon',
    ja: '活動アイコン',
    ko: '활동 아이콘'
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
  'nsplate.customPortrait.upload': msg({
    zh: '选择图片',
    en: 'Choose image',
    ja: '画像を選択',
    ko: '이미지 선택'
  }),
  'nsplate.customPortrait.clear': msg({
    zh: '清空自定义图片',
    en: 'Clear custom image',
    ja: 'カスタム画像をクリア',
    ko: '사용자 이미지 지우기'
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
  'nsplate.action.clearAllSelections': msg({
    zh: '清空所有选择',
    en: 'Clear all selections',
    ja: 'すべての選択をクリア',
    ko: '모든 선택 지우기'
  }),
  'nsplate.config.import': msg({
    zh: '导入配置',
    en: 'Import config',
    ja: '設定をインポート',
    ko: '설정 가져오기'
  }),
  'nsplate.config.importInput': msg({
    zh: '选择旧 NSPlate 配置 JSON',
    en: 'Choose a legacy NSPlate config JSON',
    ja: '旧NSPlate設定JSONを選択',
    ko: '이전 NSPlate 설정 JSON 선택'
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
