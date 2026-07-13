import { msg, placeholder, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const styleLabUiMessages: UiMessageMap = {
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
  'styleLab.loadingPreview': msg({
    zh: '加载预览',
    en: 'Loading preview',
    ja: '読み込みプレビュー',
    ko: '로딩 미리보기'
  }),
  'styleLab.loadingPreview.action': msg({
    zh: '模拟全屏加载',
    en: 'Preview full-screen loading',
    ja: '全画面読み込みをプレビュー',
    ko: '전체 화면 로딩 미리보기'
  }),
  'styleLab.loadingPreview.message': msg({
    zh: '用于查看共同加载动画的真实覆盖效果。',
    en: 'Shows the shared loading animation as a real overlay.',
    ja: '共通読み込みアニメーションの実際のオーバーレイ表示です。',
    ko: '공통 로딩 애니메이션의 실제 오버레이 표시입니다.'
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
  'styleLab.desktop.start': msg({
    zh: '开始',
    en: 'Start',
    ja: 'スタート',
    ko: '시작'
  }),
  'styleLab.desktop.day': msg({
    zh: '第2天',
    en: 'Day 2',
    ja: '2日目',
    ko: '2일차'
  }),
  'styleLab.desktop.silenceArchive': msg({
    zh: '入梦',
    en: 'Silence Archive',
    ja: 'Silenceアーカイブ',
    ko: 'Silence 아카이브'
  }),
  'styleLab.desktop.angel': msg({
    zh: '不语',
    en: 'Angel',
    ja: '不語',
    ko: '불어'
  }),
  'styleLab.desktop.glitch': msg({
    zh: '幽灵',
    en: 'Glitch',
    ja: '幽霊',
    ko: '유령'
  }),
  'styleLab.desktop.network': msg({
    zh: '网上邻居',
    en: 'Network',
    ja: 'ネットワーク',
    ko: '네트워크'
  }),
  'styleLab.skinName': same('pixel-soft-lite')
}

export default styleLabUiMessages
