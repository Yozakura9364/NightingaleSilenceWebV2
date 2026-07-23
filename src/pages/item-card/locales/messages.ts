import { msg, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const itemCardUiMessages: UiMessageMap = {
  'itemCard.workspace.title': same('物品卡片'),
  'itemCard.panel.equipment': msg({
    zh: '卡片内容',
    en: 'Card contents',
    ja: 'カード内容',
    ko: '카드 내용'
  }),
  'itemCard.panel.recent': msg({
    zh: '最近记录',
    en: 'Recent',
    ja: '最近の記録',
    ko: '최근 기록'
  }),
  'itemCard.import.action': msg({ zh: '导入', en: 'Import', ja: '読込', ko: '가져오기' }),
  'itemCard.import.link': msg({
    zh: '从网页导入',
    en: 'Import page',
    ja: 'ページから読込',
    ko: '웹에서 가져오기'
  }),
  'itemCard.import.text': msg({
    zh: '从文本导入',
    en: 'Import text',
    ja: 'テキストから読込',
    ko: '텍스트에서 가져오기'
  }),
  'itemCard.import.title': msg({
    zh: '从网页导入',
    en: 'Import from page',
    ja: 'ページから読み込み',
    ko: '웹에서 가져오기'
  }),
  'itemCard.import.urlLabel': msg({
    zh: '幻化链接',
    en: 'Glamour link',
    ja: 'ミラプリリンク',
    ko: '코디 링크'
  }),
  'itemCard.import.urlPlaceholder': same('https://...'),
  'itemCard.import.hint': same('请输入石之家或 Eorzea Collection 幻化链接'),
  'itemCard.import.submit': msg({ zh: '载入', en: 'Load', ja: '読込', ko: '불러오기' }),
  'itemCard.import.close': msg({ zh: '关闭', en: 'Close', ja: '閉じる', ko: '닫기' }),
  'itemCard.importText.title': msg({
    zh: '从文本导入',
    en: 'Import from text',
    ja: 'テキストから読み込み',
    ko: '텍스트에서 가져오기'
  }),
  'itemCard.importText.sourceLocale': msg({
    zh: '文本语言',
    en: 'Text language',
    ja: 'テキスト言語',
    ko: '텍스트 언어'
  }),
  'itemCard.importText.label': msg({
    zh: '装备文本',
    en: 'Equipment text',
    ja: '装備テキスト',
    ko: '장비 텍스트'
  }),
  'itemCard.importText.placeholder': msg({
    zh: '粘贴装备文本',
    en: 'Paste equipment text',
    ja: '装備テキストを貼り付け',
    ko: '장비 텍스트 붙여넣기'
  }),
  'itemCard.importText.submit': msg({
    zh: '识别并导入',
    en: 'Recognize and import',
    ja: '認識して読み込み',
    ko: '인식하고 가져오기'
  }),
  'itemCard.action.clearDraft': msg({
    zh: '清空',
    en: 'Clear',
    ja: 'クリア',
    ko: '비우기'
  }),
  'itemCard.action.saveConfig': msg({
    zh: '保存卡片',
    en: 'Save cards',
    ja: 'カードを保存',
    ko: '카드 저장'
  }),
  'itemCard.equipment.language': msg({
    zh: '装备名语言',
    en: 'Display language',
    ja: '表示言語',
    ko: '표시 언어'
  }),
  'itemCard.equipment.undyeable': msg({
    zh: '不可染色',
    en: 'Undyeable',
    ja: '染色不可',
    ko: '염색 불가'
  }),
  'itemCard.equipment.dyeSearch.placeholder': msg({
    zh: '搜索染剂',
    en: 'Search dye',
    ja: '染色を検索',
    ko: '염료 검색'
  }),
  'itemCard.equipment.dyeSearch.empty': msg({
    zh: '没有匹配的染剂',
    en: 'No matching dyes',
    ja: '一致する染色なし',
    ko: '일치하는 염료 없음'
  }),
  'itemCard.equipment.dyeSearch.loading': msg({
    zh: '正在读取染剂',
    en: 'Loading dyes',
    ja: '染色を読み込み中',
    ko: '염료 읽는 중'
  }),
  'itemCard.equipment.dyeSearch.error': msg({
    zh: '染剂读取失败',
    en: 'Failed to load dyes',
    ja: '染色の読み込み失敗',
    ko: '염료 읽기 실패'
  }),
  'itemCard.equipment.search.empty': msg({
    zh: '无搜索结果',
    en: 'No results',
    ja: '検索結果なし',
    ko: '검색 결과 없음'
  }),
  'itemCard.equipment.search.error': msg({
    zh: '搜索失败',
    en: 'Search failed',
    ja: '検索失敗',
    ko: '검색 실패'
  }),
  'itemCard.catalog.itemType': msg({
    zh: '物品',
    en: 'Item',
    ja: 'アイテム',
    ko: '아이템',
    fr: 'Objet',
    de: 'Gegenstand'
  }),
  'itemCard.catalog.category.label': msg({
    zh: '物品分类',
    en: 'Item category',
    ja: 'アイテム分類',
    ko: '아이템 분류',
    fr: 'Catégorie',
    de: 'Kategorie'
  }),
  'itemCard.catalog.category.equipment': msg({
    zh: '装备',
    en: 'Gear',
    ja: '装備',
    ko: '장비',
    fr: 'Équipement',
    de: 'Ausrüstung'
  }),
  'itemCard.catalog.category.other': msg({
    zh: '其他物品',
    en: 'Other items',
    ja: 'その他',
    ko: '기타 아이템',
    fr: 'Autres objets',
    de: 'Andere Gegenstände'
  }),
  'itemCard.catalog.search.label': msg({
    zh: '添加物品',
    en: 'Add item',
    ja: 'アイテムを追加',
    ko: '아이템 추가',
    fr: 'Ajouter un objet',
    de: 'Gegenstand hinzufügen'
  }),
  'itemCard.catalog.search.placeholder': msg({
    zh: '搜索物品名或物品ID',
    en: 'Search item name or ID',
    ja: 'アイテム名またはアイテムIDを検索',
    ko: '아이템 이름 또는 아이템 ID 검색',
    fr: 'Rechercher par nom ou ID',
    de: 'Gegenstandsname oder ID suchen'
  }),
  'itemCard.equipment.removeRow': msg({
    zh: '删除这一行',
    en: 'Remove row',
    ja: 'この行を削除',
    ko: '이 행 삭제'
  }),
  'itemCard.equipment.delete.symbol': same('×'),
  'itemCard.equipment.switchCandidate': msg({
    zh: '切换匹配项',
    en: 'Switch match',
    ja: '一致項目を切替',
    ko: '일치 항목 전환'
  }),
  'itemCard.recent.configName.prompt': msg({
    zh: '卡片名称',
    en: 'Card name',
    ja: 'カード名',
    ko: '카드 이름'
  }),
  'itemCard.recent.clear': msg({ zh: '清空', en: 'Clear', ja: 'クリア', ko: '비우기' }),
  'itemCard.recent.delete': msg({
    zh: '删除这条记录',
    en: 'Delete record',
    ja: '記録を削除',
    ko: '기록 삭제'
  }),
  'itemCard.recent.deleteNamed': msg({
    zh: '删除 {name}',
    en: 'Delete {name}',
    ja: '{name} を削除',
    ko: '{name} 삭제'
  }),
  'itemCard.recent.delete.symbol': same('×'),
  'itemCard.recent.empty': msg({
    zh: '暂无缓存',
    en: 'No saved records',
    ja: '保存済み記録なし',
    ko: '저장된 기록 없음'
  }),
  'itemCard.recent.meta': msg({
    zh: '{count} 个部位 · {time}',
    en: '{count} slots · {time}',
    ja: '{count} 部位 · {time}',
    ko: '{count}개 부위 · {time}'
  }),
  'itemCard.recent.unnamed': msg({
    zh: '未命名',
    en: 'Untitled',
    ja: '無題',
    ko: '이름 없음'
  }),
  'itemCard.status.idle': msg({
    zh: '等待输入',
    en: 'Waiting for input',
    ja: '入力待ち',
    ko: '입력 대기'
  }),
  'itemCard.status.readingLink': msg({
    zh: '正在读取网页……',
    en: 'Reading page...',
    ja: 'ページを読み込み中……',
    ko: '페이지를 읽는 중……'
  }),
  'itemCard.status.parsingText': msg({
    zh: '正在识别装备文本……',
    en: 'Recognizing equipment text...',
    ja: '装備テキストを認識中……',
    ko: '장비 텍스트 인식 중……'
  }),
  'itemCard.status.readingConfig': msg({
    zh: '正在读取配置……',
    en: 'Reading config...',
    ja: '設定を読み込み中……',
    ko: '설정을 읽는 중……'
  }),
  'itemCard.status.importError': msg({
    zh: '导入失败',
    en: 'Import failed',
    ja: '読み込み失敗',
    ko: '가져오기 실패'
  }),
  'itemCard.status.linkRequired': same('请输入石之家或 Eorzea Collection 幻化链接'),
  'itemCard.status.unsupportedLink': same('无法识别，请输入石之家或 Eorzea Collection 幻化链接'),
  'itemCard.status.textRequired': msg({
    zh: '请输入装备文本',
    en: 'Enter equipment text',
    ja: '装備テキストを入力してください',
    ko: '장비 텍스트를 입력하세요'
  }),
  'itemCard.status.invalidLocalFile': msg({
    zh: '不支持的本地文件',
    en: 'Unsupported local file',
    ja: '対応していないローカルファイルです',
    ko: '지원하지 않는 로컬 파일입니다'
  }),
  'itemCard.status.fileTooLarge': msg({
    zh: '文件超过 {size} MB',
    en: 'File is over {size} MB',
    ja: 'ファイルが {size} MB を超えています',
    ko: '파일이 {size} MB를 초과합니다'
  }),
  'itemCard.status.textImported': msg({
    zh: '已识别 {count} 件装备',
    en: 'Recognized {count} items',
    ja: '{count} 件の装備を認識しました',
    ko: '장비 {count}개를 인식했습니다'
  }),
  'itemCard.status.textImportedWithWarnings': msg({
    zh: '已识别 {count} 件装备，另有 {warningCount} 条提示',
    en: 'Recognized {count} items with {warningCount} warnings',
    ja: '{count} 件を認識、{warningCount} 件の注意があります',
    ko: '{count}개를 인식했으며 알림 {warningCount}개가 있습니다'
  }),
  'itemCard.status.noConfigToSave': msg({
    zh: '没有可保存的卡片内容',
    en: 'No card content',
    ja: '保存できるカードがありません',
    ko: '저장할 카드가 없습니다'
  }),
  'itemCard.status.configSaved': msg({
    zh: '已保存卡片: {name}',
    en: 'Saved: {name}',
    ja: '保存しました: {name}',
    ko: '저장됨: {name}'
  }),
  'itemCard.status.configRestored': msg({
    zh: '已载入记录: {name}',
    en: 'Loaded: {name}',
    ja: '読み込みました: {name}',
    ko: '불러옴: {name}'
  }),
  'itemCard.status.recentDeleted': msg({
    zh: '已删除这条卡片记录',
    en: 'Record deleted',
    ja: '記録を削除しました',
    ko: '기록을 삭제했습니다'
  }),
  'itemCard.status.recentCleared': msg({
    zh: '已清空最近记录',
    en: 'Recent records cleared',
    ja: '最近の記録を消去',
    ko: '최근 기록을 비웠습니다'
  }),
  'itemCard.source.manual': msg({
    zh: '手动编辑',
    en: 'Manual edit',
    ja: '手動編集',
    ko: '수동 편집'
  }),
  'itemCard.card.settings': msg({
    zh: '图片设置',
    en: 'Image settings',
    ja: '画像設定',
    ko: '이미지 설정'
  }),
  'itemCard.card.outputLanguages': msg({
    zh: '输出语言',
    en: 'Output languages',
    ja: '出力言語',
    ko: '출력 언어'
  }),
  'itemCard.card.fontFamily': msg({
    zh: '字体',
    en: 'Font',
    ja: 'フォント',
    ko: '글꼴'
  }),
  'itemCard.card.loadLocalFonts': msg({
    zh: '加载本机字体',
    en: 'Load local fonts',
    ja: 'ローカルフォント読込',
    ko: '로컬 글꼴 불러오기'
  }),
  'itemCard.card.localFontsUnsupported': msg({
    zh: '当前浏览器不支持读取本机字体',
    en: 'Local font access is unavailable',
    ja: 'ローカルフォントを読み込めません',
    ko: '로컬 글꼴을 읽을 수 없습니다'
  }),
  'itemCard.card.localFontsLoaded': msg({
    zh: '本机字体已载入',
    en: 'Local fonts loaded',
    ja: 'ローカルフォントを読み込みました',
    ko: '로컬 글꼴을 불러왔습니다'
  }),
  'itemCard.card.localFontsError': msg({
    zh: '本机字体读取失败',
    en: 'Failed to load local fonts',
    ja: 'ローカルフォントの読込に失敗',
    ko: '로컬 글꼴 불러오기 실패'
  }),
  'itemCard.card.titleSize': msg({
    zh: '装备名字号',
    en: 'Item name size',
    ja: '装備名サイズ',
    ko: '장비 이름 크기'
  }),
  'itemCard.card.titleWeight': msg({
    zh: '装备名字重',
    en: 'Item name weight',
    ja: '装備名ウェイト',
    ko: '장비 이름 굵기'
  }),
  'itemCard.card.dyeSize': msg({
    zh: '染剂字号',
    en: 'Dye text size',
    ja: '染色文字サイズ',
    ko: '염료 글자 크기'
  }),
  'itemCard.card.titleOffsetX': same('装备名 X'),
  'itemCard.card.titleOffsetY': same('装备名 Y'),
  'itemCard.card.dyeOffsetX': same('染剂 X'),
  'itemCard.card.dyeOffsetY': same('染剂 Y'),
  'itemCard.card.fontColor': msg({
    zh: '字色',
    en: 'Text color',
    ja: '文字色',
    ko: '글자색'
  }),
  'itemCard.card.rarityColorEnabled': msg({
    zh: '物品名按品质着色',
    en: 'Color item names by rarity',
    ja: 'アイテム名をレアリティ色で表示',
    ko: '아이템 이름에 희귀도 색상 적용'
  }),
  'itemCard.card.strokeEnabled': msg({
    zh: '描边',
    en: 'Stroke',
    ja: '縁取り',
    ko: '외곽선'
  }),
  'itemCard.card.strokeRatio': msg({
    zh: '描边比例',
    en: 'Stroke ratio',
    ja: '縁取り比率',
    ko: '외곽선 비율'
  }),
  'itemCard.card.strokeColor': msg({
    zh: '描边颜色',
    en: 'Stroke color',
    ja: '縁取り色',
    ko: '외곽선 색상'
  }),
  'itemCard.mode.label': msg({
    zh: '卡片版本',
    en: 'Card version',
    ja: 'カード版',
    ko: '카드 버전'
  }),
  'itemCard.mode.compact': msg({
    zh: '简易版',
    en: 'Compact',
    ja: '簡易版',
    ko: '간이판'
  }),
  'itemCard.mode.full': msg({
    zh: '完整版',
    en: 'Full',
    ja: '完全版',
    ko: '완전판'
  }),
  'itemCard.preview.title': msg({
    zh: '图片预览',
    en: 'Preview',
    ja: '画像プレビュー',
    ko: '이미지 미리보기'
  }),
  'itemCard.preview.count': msg({
    zh: '{count} 件物品',
    en: '{count} items',
    ja: '{count} 件',
    ko: '{count}개 아이템'
  }),
  'itemCard.preview.empty': msg({
    zh: '等待装备数据',
    en: 'Waiting for equipment',
    ja: '装備データ待ち',
    ko: '장비 데이터 대기 중'
  }),
  'itemCard.preview.list': msg({
    zh: '连续列表',
    en: 'Continuous list',
    ja: '連続リスト',
    ko: '연속 목록'
  }),
  'itemCard.preview.singles': msg({
    zh: '单张卡片',
    en: 'Individual cards',
    ja: '個別カード',
    ko: '개별 카드'
  }),
  'itemCard.layout.left': msg({ zh: '居左', en: 'Left', ja: '左', ko: '왼쪽' }),
  'itemCard.layout.right': msg({ zh: '居右', en: 'Right', ja: '右', ko: '오른쪽' }),
  'itemCard.layout.allLeft': msg({
    zh: '全部居左',
    en: 'All left',
    ja: 'すべて左',
    ko: '모두 왼쪽'
  }),
  'itemCard.layout.allRight': msg({
    zh: '全部居右',
    en: 'All right',
    ja: 'すべて右',
    ko: '모두 오른쪽'
  }),
  'itemCard.export.png': same('PNG'),
  'itemCard.export.zip': msg({
    zh: '下载 ZIP',
    en: 'Download ZIP',
    ja: 'ZIP ダウンロード',
    ko: 'ZIP 다운로드'
  }),
  'itemCard.locale.zh': same('简体中文'),
  'itemCard.locale.en': same('English'),
  'itemCard.locale.ja': same('日本語'),
  'itemCard.locale.ko': same('한국어'),
  'itemCard.locale.tc': same('繁體中文'),
  'itemCard.locale.fr': same('Français'),
  'itemCard.locale.de': same('Deutsch')
}

export default itemCardUiMessages
