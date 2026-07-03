import type { Locale } from '@/stores/locale'

export type UiMessageMap = Record<string, Record<Locale, string>>

const placeholder = '占位用，待编辑'

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
    zh: '导入',
    en: 'Import',
    ja: 'インポート',
    ko: '가져오기'
  }),
  'nsarmoire.panel.overview': msg({
    zh: '概览',
    en: 'Overview',
    ja: '概要',
    ko: '개요'
  }),
  'nsarmoire.panel.distribution': msg({
    zh: '容器分布',
    en: 'Container distribution',
    ja: 'コンテナ分布',
    ko: '컨테이너 분포'
  }),
  'nsarmoire.panel.insights': msg({
    zh: '分析',
    en: 'Analysis',
    ja: '分析',
    ko: '분석'
  }),
  'nsarmoire.panel.cabinetProgress': msg({
    zh: '收藏柜进度',
    en: 'Armoire progress',
    ja: '愛蔵品キャビネット進捗',
    ko: '애장품 보관함 진행'
  }),
  'nsarmoire.panel.glamourSetProgress': msg({
    zh: '套装投影',
    en: 'Glamour sets',
    ja: 'ミラージュセット',
    ko: '투영 세트'
  }),
  'nsarmoire.panel.dyeRisk': msg({
    zh: '染色风险',
    en: 'Dye risk',
    ja: '染色リスク',
    ko: '염색 위험'
  }),
  'nsarmoire.panel.identicalModels': msg({
    zh: '同模型重复',
    en: 'Duplicate models',
    ja: '同一モデル重複',
    ko: '동일 모델 중복'
  }),
  'nsarmoire.action.importSnapshot': msg({
    zh: '导入 snapshot',
    en: 'Import snapshot',
    ja: 'snapshotをインポート',
    ko: 'snapshot 가져오기'
  }),
  'nsarmoire.action.clearSnapshot': msg({
    zh: '清空 snapshot',
    en: 'Clear snapshot',
    ja: 'snapshotをクリア',
    ko: 'snapshot 지우기'
  }),
  'nsarmoire.input.snapshot': msg({
    zh: '选择 NSArmoire snapshot JSON',
    en: 'Choose an NSArmoire snapshot JSON',
    ja: 'NSArmoire snapshot JSONを選択',
    ko: 'NSArmoire snapshot JSON 선택'
  }),
  'nsarmoire.status.snapshotReady': msg({
    zh: 'snapshot 已导入',
    en: 'Snapshot imported',
    ja: 'snapshotをインポートしました',
    ko: 'snapshot을 가져왔습니다'
  }),
  'nsarmoire.status.snapshotEmpty': msg({
    zh: '等待 snapshot',
    en: 'Waiting for snapshot',
    ja: 'snapshot待機中',
    ko: 'snapshot 대기 중'
  }),
  'nsarmoire.status.snapshotError': msg({
    zh: 'snapshot 无法导入',
    en: 'Snapshot import failed',
    ja: 'snapshotをインポートできません',
    ko: 'snapshot을 가져올 수 없습니다'
  }),
  'nsarmoire.error.fileTooLarge': msg({
    zh: '文件过大',
    en: 'File is too large',
    ja: 'ファイルが大きすぎます',
    ko: '파일이 너무 큽니다'
  }),
  'nsarmoire.error.invalidJson': msg({
    zh: 'JSON 格式无效',
    en: 'Invalid JSON',
    ja: 'JSON形式が無効です',
    ko: 'JSON 형식이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidRoot': msg({
    zh: '根结构无效',
    en: 'Invalid root structure',
    ja: 'ルート構造が無効です',
    ko: '루트 구조가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidSchema': msg({
    zh: 'schemaVersion 无效',
    en: 'Invalid schemaVersion',
    ja: 'schemaVersionが無効です',
    ko: 'schemaVersion이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidSource': msg({
    zh: 'source 无效',
    en: 'Invalid source',
    ja: 'sourceが無効です',
    ko: 'source가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidGeneratedAt': msg({
    zh: 'generatedAt 无效',
    en: 'Invalid generatedAt',
    ja: 'generatedAtが無効です',
    ko: 'generatedAt이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidItems': msg({
    zh: 'items 无效',
    en: 'Invalid items',
    ja: 'itemsが無効です',
    ko: 'items가 잘못되었습니다'
  }),
  'nsarmoire.error.tooManyItems': msg({
    zh: 'items 数量过多',
    en: 'Too many items',
    ja: 'itemsが多すぎます',
    ko: 'items가 너무 많습니다'
  }),
  'nsarmoire.error.invalidItem': msg({
    zh: '物品条目无效',
    en: 'Invalid item entry',
    ja: 'アイテム項目が無効です',
    ko: '아이템 항목이 잘못되었습니다'
  }),
  'nsarmoire.error.invalidItemId': msg({
    zh: 'itemId 无效',
    en: 'Invalid itemId',
    ja: 'itemIdが無効です',
    ko: 'itemId가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidContainer': msg({
    zh: 'container 无效',
    en: 'Invalid container',
    ja: 'containerが無効です',
    ko: 'container가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidQuantity': msg({
    zh: 'quantity 无效',
    en: 'Invalid quantity',
    ja: 'quantityが無効です',
    ko: 'quantity가 잘못되었습니다'
  }),
  'nsarmoire.error.invalidDyes': msg({
    zh: 'dyes 无效',
    en: 'Invalid dyes',
    ja: 'dyesが無効です',
    ko: 'dyes가 잘못되었습니다'
  }),
  'nsarmoire.status.catalogPending': msg({
    zh: '等待 catalog',
    en: 'Waiting for catalog',
    ja: 'catalog待機中',
    ko: 'catalog 대기 중'
  }),
  'nsarmoire.status.noDyeRisk': msg({
    zh: '未发现染色条目',
    en: 'No dyed entries found',
    ja: '染色済み項目はありません',
    ko: '염색 항목 없음'
  }),
  'nsarmoire.metric.entries': msg({ zh: '条目', en: 'Entries', ja: '項目', ko: '항목' }),
  'nsarmoire.metric.uniqueItems': msg({
    zh: '不同物品',
    en: 'Unique items',
    ja: '固有アイテム',
    ko: '고유 아이템'
  }),
  'nsarmoire.metric.totalQuantity': msg({
    zh: '总数量',
    en: 'Total quantity',
    ja: '総数',
    ko: '총수량'
  }),
  'nsarmoire.metric.dyedEntries': msg({
    zh: '染色条目',
    en: 'Dyed entries',
    ja: '染色項目',
    ko: '염색 항목'
  }),
  'nsarmoire.metric.glamourDresser': msg({
    zh: '投影台条目',
    en: 'Glamour dresser entries',
    ja: 'ミラージュドレッサー項目',
    ko: '투영대 항목'
  }),
  'nsarmoire.metric.armoire': msg({
    zh: '收藏柜条目',
    en: 'Armoire entries',
    ja: '愛蔵品キャビネット項目',
    ko: '애장품 보관함 항목'
  }),
  'nsarmoire.metric.stored': msg({
    zh: '已收纳',
    en: 'Stored',
    ja: '収納済み',
    ko: '보관됨'
  }),
  'nsarmoire.metric.storable': msg({
    zh: '可收纳',
    en: 'Storable',
    ja: '収納可能',
    ko: '보관 가능'
  }),
  'nsarmoire.metric.transferable': msg({
    zh: '可转入',
    en: 'Transferable',
    ja: '移動候補',
    ko: '이동 후보'
  }),
  'nsarmoire.metric.missing': msg({
    zh: '缺少',
    en: 'Missing',
    ja: '不足',
    ko: '누락'
  }),
  'nsarmoire.metric.storedSets': msg({
    zh: '已套装化',
    en: 'Stored sets',
    ja: 'セット収納済み',
    ko: '세트 보관됨'
  }),
  'nsarmoire.metric.availableSets': msg({
    zh: '可套装化',
    en: 'Available sets',
    ja: 'セット候補',
    ko: '세트 후보'
  }),
  'nsarmoire.metric.incompleteSets': msg({
    zh: '残缺套装',
    en: 'Incomplete sets',
    ja: '不足セット',
    ko: '불완전 세트'
  }),
  'nsarmoire.metric.highRisk': msg({
    zh: '高风险',
    en: 'High risk',
    ja: '高リスク',
    ko: '고위험'
  }),
  'nsarmoire.metric.duplicateGroups': msg({
    zh: '重复组',
    en: 'Duplicate groups',
    ja: '重複グループ',
    ko: '중복 그룹'
  }),
  'nsarmoire.field.generatedAt': msg({
    zh: '生成时间',
    en: 'Generated at',
    ja: '生成日時',
    ko: '생성 시간'
  }),
  'nsarmoire.field.source': msg({ zh: '来源', en: 'Source', ja: 'ソース', ko: '출처' }),
  'nsarmoire.field.character': msg({
    zh: '角色',
    en: 'Character',
    ja: 'キャラクター',
    ko: '캐릭터'
  }),
  'nsarmoire.field.itemId': msg({ zh: '物品 ID', en: 'Item ID', ja: 'アイテムID', ko: '아이템 ID' }),
  'nsarmoire.field.dyes': msg({ zh: '染剂', en: 'Dyes', ja: '染料', ko: '염료' }),
  'nsarmoire.container.inventory': msg({ zh: '背包', en: 'Inventory', ja: '所持品', ko: '소지품' }),
  'nsarmoire.container.saddlebag': msg({
    zh: '陆行鸟鞍囊',
    en: 'Saddlebag',
    ja: 'チョコボかばん',
    ko: '초코보 가방'
  }),
  'nsarmoire.container.retainer': msg({ zh: '雇员', en: 'Retainer', ja: 'リテイナー', ko: '고용인' }),
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
  'nsplate.panel.config': msg({
    zh: 'NSPlate 配置',
    en: 'NSPlate config',
    ja: 'NSPlate設定',
    ko: 'NSPlate 설정'
  }),
  'nsplate.panel.assets': msg({ zh: '素材', en: 'Assets', ja: '素材', ko: '소재' }),
  'nsplate.panel.presets': msg({ zh: '预设', en: 'Presets', ja: 'プリセット', ko: '프리셋' }),
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
  'nsplate.action.clearAllSelections': msg({
    zh: '清空所有选择',
    en: 'Clear all selections',
    ja: 'すべての選択をクリア',
    ko: '모든 선택 지우기'
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
  'styleLab.skinName': same('pixel-soft-lite')
}
