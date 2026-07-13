import { msg, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const glamourUiMessages: UiMessageMap = {
  'nsglamour.workspace.title': same('NSGlamour'),
  'nsglamour.page.template': msg({
    zh: '图片模板',
    en: 'Template',
    ja: 'テンプレート',
    ko: '템플릿'
  }),
  'nsglamour.page.equipinfo': msg({
    zh: '装备信息',
    en: 'Equipment',
    ja: '装備情報',
    ko: '장비 정보'
  }),
  'nsglamour.panel.import': msg({
    zh: '装备信息',
    en: 'Import',
    ja: 'インポート',
    ko: '가져오기'
  }),
  'nsglamour.panel.equipment': msg({
    zh: '装备信息',
    en: 'Equipment',
    ja: '装備',
    ko: '장비'
  }),
  'nsglamour.template.settings': msg({
    zh: '模板设置',
    en: 'Template settings',
    ja: 'テンプレート設定',
    ko: '템플릿 설정'
  }),
  'nsglamour.template.author': msg({
    zh: '模板作者：',
    en: 'Template author: ',
    ja: 'テンプレート作者：',
    ko: '템플릿 제작자: '
  }),
  'nsglamour.template.change': msg({
    zh: '更换模板',
    en: 'Change template',
    ja: 'テンプレート変更',
    ko: '템플릿 변경'
  }),
  'nsglamour.template.selector.title': msg({
    zh: '选择模板',
    en: 'Select template',
    ja: 'テンプレート選択',
    ko: '템플릿 선택'
  }),
  'nsglamour.template.selector.close': msg({
    zh: '关闭',
    en: 'Close',
    ja: '閉じる',
    ko: '닫기'
  }),
  'nsglamour.template.selector.filter': msg({
    zh: '模板语言筛选',
    en: 'Template language filter',
    ja: 'テンプレート言語フィルター',
    ko: '템플릿 언어 필터'
  }),
  'nsglamour.template.selector.list': msg({
    zh: '模板选择',
    en: 'Template selection',
    ja: 'テンプレート選択',
    ko: '템플릿 선택'
  }),
  'nsglamour.template.selector.all': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'nsglamour.template.selector.empty': msg({
    zh: '没有符合筛选的模板',
    en: 'No templates match this filter',
    ja: '条件に合うテンプレートがありません',
    ko: '필터에 맞는 템플릿이 없습니다'
  }),
  'nsglamour.template.selector.cardTitle': msg({
    zh: '{template}；支持语言：{languages}',
    en: '{template}; supported languages: {languages}',
    ja: '{template}；対応言語：{languages}',
    ko: '{template}; 지원 언어: {languages}'
  }),
  'nsglamour.template.authorLinks': msg({
    zh: '作者链接',
    en: 'Author links',
    ja: '作者リンク',
    ko: '제작자 링크'
  }),
  'nsglamour.template.author.website': msg({
    zh: '主页',
    en: 'Website',
    ja: 'ホーム',
    ko: '홈'
  }),
  'nsglamour.template.author.weibo': same('微博'),
  'nsglamour.template.author.xiaohongshu': same('小红书'),
  'nsglamour.template.author.douyin': same('抖音'),
  'nsglamour.template.titleText': msg({
    zh: '标题文字',
    en: 'Title text',
    ja: 'タイトル文字',
    ko: '제목 텍스트'
  }),
  'nsglamour.template.characterName': msg({
    zh: '角色名',
    en: 'Character name',
    ja: 'キャラクター名',
    ko: '캐릭터 이름'
  }),
  'nsglamour.template.nameWorld': msg({
    zh: '名字与服务器',
    en: 'Name and world',
    ja: '名前とワールド',
    ko: '이름과 서버'
  }),
  'nsglamour.template.name': msg({
    zh: '名字',
    en: 'Name',
    ja: '名前',
    ko: '이름'
  }),
  'nsglamour.template.world': msg({
    zh: '服务器',
    en: 'World',
    ja: 'ワールド',
    ko: '서버'
  }),
  'nsglamour.template.symbol': msg({
    zh: '特殊符号',
    en: 'Symbol',
    ja: '記号',
    ko: '기호'
  }),
  'nsglamour.template.dyeStyleOne': msg({
    zh: '染剂样式1',
    en: 'Dye style 1',
    ja: '染色スタイル1',
    ko: '염료 스타일 1'
  }),
  'nsglamour.template.dyeStyleTwo': msg({
    zh: '染剂样式2',
    en: 'Dye style 2',
    ja: '染色スタイル2',
    ko: '염료 스타일 2'
  }),
  'nsglamour.template.equipmentData': msg({
    zh: '装备数据',
    en: 'Equipment data',
    ja: '装備データ',
    ko: '장비 데이터'
  }),
  'nsglamour.template.importLink': msg({
    zh: '从网页导入',
    en: 'Import from page',
    ja: 'ページから読み込み',
    ko: '웹에서 가져오기'
  }),
  'nsglamour.template.import.title': msg({
    zh: '从网页导入',
    en: 'Import from page',
    ja: 'ページから読み込み',
    ko: '웹에서 가져오기'
  }),
  'nsglamour.template.import.urlLabel': msg({
    zh: '幻化链接',
    en: 'Glamour link',
    ja: 'ミラプリリンク',
    ko: '코디 링크'
  }),
  'nsglamour.template.import.urlPlaceholder': same('https://...'),
  'nsglamour.template.import.hint': same('请输入石之家或 Eorzea Collection 幻化链接'),
  'nsglamour.template.import.submit': msg({
    zh: '载入',
    en: 'Load',
    ja: '読み込み',
    ko: '불러오기'
  }),
  'nsglamour.template.import.close': msg({
    zh: '关闭',
    en: 'Close',
    ja: '閉じる',
    ko: '닫기'
  }),
  'nsglamour.template.layoutLanguage': msg({
    zh: '排版语言',
    en: 'Layout language',
    ja: 'レイアウト言語',
    ko: '배치 언어'
  }),
  'nsglamour.template.language.currentEdit': msg({
    zh: '当前编辑',
    en: 'Current edit',
    ja: '現在編集中',
    ko: '현재 편집'
  }),
  'nsglamour.template.language.output': msg({
    zh: '输出语言',
    en: 'Output language',
    ja: '出力言語',
    ko: '출력 언어'
  }),
  'nsglamour.template.clearDraft': msg({
    zh: '清空配装',
    en: 'Clear outfit',
    ja: 'ミラプリをクリア',
    ko: '코디 비우기'
  }),
  'nsglamour.template.canvas': msg({
    zh: '模板预览',
    en: 'Template preview',
    ja: 'テンプレートプレビュー',
    ko: '템플릿 미리보기'
  }),
  'nsglamour.template.saveImage': msg({
    zh: '保存图片',
    en: 'Save image',
    ja: '画像を保存',
    ko: '이미지 저장'
  }),
  'nsglamour.template.image.upload': msg({
    zh: '上传图片',
    en: 'Upload image',
    ja: '画像をアップロード',
    ko: '이미지 업로드'
  }),
  'nsglamour.template.image.recent': msg({
    zh: '最近图片',
    en: 'Recent images',
    ja: '最近の画像',
    ko: '최근 이미지'
  }),
  'nsglamour.template.image.recent.empty': msg({
    zh: '暂无图片',
    en: 'No recent images',
    ja: '最近の画像なし',
    ko: '최근 이미지 없음'
  }),
  'nsglamour.template.image.recent.clear': msg({
    zh: '清空',
    en: 'Clear',
    ja: 'クリア',
    ko: '비우기'
  }),
  'nsglamour.template.image.recent.fallback': msg({
    zh: '图片',
    en: 'Image',
    ja: '画像',
    ko: '이미지'
  }),
  'nsglamour.template.crop.title': msg({
    zh: '裁剪图片',
    en: 'Crop image',
    ja: '画像をトリミング',
    ko: '이미지 자르기'
  }),
  'nsglamour.template.crop.hint': msg({
    zh: '调整取景后用于对应图片区域。',
    en: 'Adjust the framing for the target image area.',
    ja: '対応する画像エリアに合わせて構図を調整します。',
    ko: '대상 이미지 영역에 맞게 구도를 조정합니다.'
  }),
  'nsglamour.template.crop.canvas': msg({
    zh: '图片裁剪预览',
    en: 'Image crop preview',
    ja: '画像トリミングプレビュー',
    ko: '이미지 자르기 미리보기'
  }),
  'nsglamour.template.crop.zoom': msg({
    zh: '缩放',
    en: 'Zoom',
    ja: 'ズーム',
    ko: '확대/축소'
  }),
  'nsglamour.template.crop.zoomPercent': msg({
    zh: '缩放百分比',
    en: 'Zoom percentage',
    ja: 'ズーム倍率',
    ko: '확대/축소 비율'
  }),
  'nsglamour.template.crop.cancel': msg({
    zh: '取消',
    en: 'Cancel',
    ja: 'キャンセル',
    ko: '취소'
  }),
  'nsglamour.template.crop.reset': msg({
    zh: '重置',
    en: 'Reset',
    ja: 'リセット',
    ko: '초기화'
  }),
  'nsglamour.template.crop.apply': msg({
    zh: '使用裁剪',
    en: 'Use crop',
    ja: 'トリミングを使用',
    ko: '자른 이미지 사용'
  }),
  'nsglamour.panel.copy': msg({
    zh: '文案生成',
    en: 'Copy text',
    ja: 'コピー文',
    ko: '복사 문구'
  }),
  'nsglamour.panel.recent': msg({
    zh: '最近载入',
    en: 'Recent',
    ja: '最近の読み込み',
    ko: '최근 불러오기'
  }),
  'nsglamour.import.link.label': msg({
    zh: '网页链接',
    en: 'Web link',
    ja: 'Webリンク',
    ko: '웹 링크'
  }),
  'nsglamour.import.link.placeholder': same('石之家或 Eorzea Collection 幻化链接'),
  'nsglamour.import.readLink': msg({
    zh: '读取',
    en: 'Read',
    ja: '読み込み',
    ko: '읽기'
  }),
  'nsglamour.import.text.label': msg({
    zh: '文字信息识别',
    en: 'Equipment text',
    ja: '装備テキスト',
    ko: '장비 텍스트'
  }),
  'nsglamour.import.text.placeholder': msg({
    zh: '例如：\n主手：过期青铜步兵剑\n身体：梦幻装（无染色/煤玉黑）\n耳饰：日长石耳坠',
    en: 'Body: Scholasticate Coat',
    ja: '胴: 装備名',
    ko: '몸통: 장비명'
  }),
  'nsglamour.import.sourceLocale': msg({
    zh: '语言',
    en: 'Source language',
    ja: '原文言語',
    ko: '원문 언어'
  }),
  'nsglamour.import.parseText': msg({
    zh: '识别',
    en: 'Parse text',
    ja: 'テキスト解析',
    ko: '텍스트 분석'
  }),
  'nsglamour.action.clearDraft': msg({
    zh: '清空',
    en: 'Clear',
    ja: 'クリア',
    ko: '비우기'
  }),
  'nsglamour.action.saveConfig': msg({
    zh: '保存配置',
    en: 'Save config',
    ja: '設定を保存',
    ko: '설정 저장'
  }),
  'nsglamour.action.copy': msg({
    zh: '复制',
    en: 'Copy',
    ja: 'コピー',
    ko: '복사'
  }),
  'nsglamour.copy.output': msg({
    zh: '输出',
    en: 'Output',
    ja: '出力',
    ko: '출력'
  }),
  'nsglamour.copy.format': msg({
    zh: '文案格式',
    en: 'Copy format',
    ja: 'コピー形式',
    ko: '복사 형식'
  }),
  'nsglamour.copy.format.one': same('格式一'),
  'nsglamour.copy.format.two': same('格式二'),
  'nsglamour.copy.format.three': same('格式三'),
  'nsglamour.copy.format.four': same('格式四'),
  'nsglamour.copy.format.custom': msg({
    zh: '自定义',
    en: 'Custom',
    ja: 'カスタム',
    ko: '사용자 지정'
  }),
  'nsglamour.copy.template': msg({
    zh: '模板',
    en: 'Template',
    ja: 'テンプレート',
    ko: '템플릿'
  }),
  'nsglamour.copy.resetTemplate': msg({
    zh: '恢复默认模板',
    en: 'Restore default template',
    ja: '既定テンプレートに戻す',
    ko: '기본 템플릿 복원'
  }),
  'nsglamour.equipment.language': msg({
    zh: '装备名语言',
    en: 'Display language',
    ja: '表示言語',
    ko: '표시 언어'
  }),
  'nsglamour.equipment.dyes': msg({
    zh: '染色',
    en: 'Dyes',
    ja: '染色',
    ko: '염색'
  }),
  'nsglamour.equipment.undyeable': msg({
    zh: '不可染色',
    en: 'Undyeable',
    ja: '染色不可',
    ko: '염색 불가'
  }),
  'nsglamour.equipment.dyeIgnored': msg({
    zh: '不显示染色',
    en: 'Dye hidden',
    ja: '染色非表示',
    ko: '염색 숨김'
  }),
  'nsglamour.equipment.dyeSlot': msg({
    zh: '染色',
    en: 'Dye',
    ja: '染色',
    ko: '염색'
  }),
  'nsglamour.equipment.dyeSlotNumber': msg({
    zh: '染色{number}',
    en: 'Dye {number}',
    ja: '染色{number}',
    ko: '염색 {number}'
  }),
  'nsglamour.equipment.dyeSearch.placeholder': msg({
    zh: '搜索染剂',
    en: 'Search dye',
    ja: '染色を検索',
    ko: '염료 검색'
  }),
  'nsglamour.equipment.dyeSearch.empty': msg({
    zh: '没有匹配的染剂',
    en: 'No matching dyes',
    ja: '一致する染色なし',
    ko: '일치하는 염료 없음'
  }),
  'nsglamour.equipment.dyeSearch.loading': msg({
    zh: '正在读取染剂',
    en: 'Loading dyes',
    ja: '染色を読み込み中',
    ko: '염료 읽는 중'
  }),
  'nsglamour.equipment.dyeSearch.error': msg({
    zh: '染剂读取失败',
    en: 'Failed to load dyes',
    ja: '染色の読み込み失敗',
    ko: '염료 읽기 실패'
  }),
  'nsglamour.equipment.search.placeholder': msg({
    zh: '搜索装备名',
    en: 'Search item name',
    ja: '装備名を検索',
    ko: '장비 이름 검색'
  }),
  'nsglamour.equipment.search.empty': msg({
    zh: '无搜索结果',
    en: 'No search results',
    ja: '検索結果なし',
    ko: '검색 결과 없음'
  }),
  'nsglamour.equipment.search.error': msg({
    zh: '搜索失败',
    en: 'Search failed',
    ja: '検索失敗',
    ko: '검색 실패'
  }),
  'nsglamour.equipment.delete': msg({
    zh: '删除当前装备',
    en: 'Remove current item',
    ja: '現在の装備を削除',
    ko: '현재 장비 삭제'
  }),
  'nsglamour.equipment.delete.symbol': same('×'),
  'nsglamour.equipment.switchCandidate': msg({
    zh: '切换匹配项',
    en: 'Switch match',
    ja: '一致項目を切替',
    ko: '일치 항목 전환'
  }),
  'nsglamour.equipment.switchCandidate.symbol': same('⇄'),
  'nsglamour.recent.configName.prompt': msg({
    zh: '配置名称',
    en: 'Config name',
    ja: '設定名',
    ko: '설정 이름'
  }),
  'nsglamour.recent.clear': msg({
    zh: '清空',
    en: 'Clear',
    ja: 'クリア',
    ko: '비우기'
  }),
  'nsglamour.recent.delete': msg({
    zh: '删除这条记录',
    en: 'Delete this record',
    ja: 'この記録を削除',
    ko: '이 기록 삭제'
  }),
  'nsglamour.recent.deleteNamed': msg({
    zh: '删除 {name}',
    en: 'Delete {name}',
    ja: '{name} を削除',
    ko: '{name} 삭제'
  }),
  'nsglamour.recent.delete.symbol': same('×'),
  'nsglamour.recent.empty': msg({
    zh: '暂无缓存',
    en: 'No saved records',
    ja: '保存済み記録なし',
    ko: '저장된 기록 없음'
  }),
  'nsglamour.recent.meta': msg({
    zh: '{count} 个部位 · {time}',
    en: '{count} slots · {time}',
    ja: '{count} 部位 · {time}',
    ko: '{count}개 부위 · {time}'
  }),
  'nsglamour.recent.unnamed': msg({
    zh: '未命名',
    en: 'Untitled',
    ja: '無題',
    ko: '이름 없음'
  }),
  'nsglamour.warnings.title': msg({
    zh: '警告',
    en: 'Warnings',
    ja: '警告',
    ko: '경고'
  }),
  'nsglamour.status.idle': msg({
    zh: '等待输入',
    en: 'Waiting for input',
    ja: '入力待ち',
    ko: '입력 대기'
  }),
  'nsglamour.status.readingLink': msg({
    zh: '正在读取网页……',
    en: 'Reading page...',
    ja: 'ページを読み込み中……',
    ko: '페이지를 읽는 중……'
  }),
  'nsglamour.status.parsingText': msg({
    zh: '正在识别文字……',
    en: 'Reading equipment text...',
    ja: 'テキストを識別中……',
    ko: '텍스트를 인식하는 중……'
  }),
  'nsglamour.status.readingConfig': msg({
    zh: '正在读取配置……',
    en: 'Reading config...',
    ja: '設定を読み込み中……',
    ko: '설정을 읽는 중……'
  }),
  'nsglamour.status.importError': msg({
    zh: '导入失败',
    en: 'Import failed',
    ja: '読み込み失敗',
    ko: '가져오기 실패'
  }),
  'nsglamour.status.linkRequired': same('请输入石之家或 Eorzea Collection 幻化链接'),
  'nsglamour.status.unsupportedLink': same('无法识别，请输入石之家或 Eorzea Collection 幻化链接'),
  'nsglamour.status.textRequired': msg({
    zh: '请输入装备文字',
    en: 'Enter equipment text',
    ja: '装備テキストを入力してください',
    ko: '장비 텍스트를 입력하세요'
  }),
  'nsglamour.status.invalidLocalFile': msg({
    zh: '不支持的本地文件',
    en: 'Unsupported local file',
    ja: '対応していないローカルファイルです',
    ko: '지원하지 않는 로컬 파일입니다'
  }),
  'nsglamour.status.fileTooLarge': msg({
    zh: '文件超过 {size} MB',
    en: 'File is over {size} MB',
    ja: 'ファイルが {size} MB を超えています',
    ko: '파일이 {size} MB를 초과합니다'
  }),
  'nsglamour.status.noConfigToSave': msg({
    zh: '没有可保存的装备配置',
    en: 'No equipment config to save',
    ja: '保存できる装備設定がありません',
    ko: '저장할 장비 설정 없음'
  }),
  'nsglamour.status.configSaved': msg({
    zh: '已保存配置: {name}',
    en: 'Saved config: {name}',
    ja: '設定を保存しました: {name}',
    ko: '설정을 저장했습니다: {name}'
  }),
  'nsglamour.status.configRestored': msg({
    zh: '已载入缓存: {name}',
    en: 'Loaded record: {name}',
    ja: '記録を読み込みました: {name}',
    ko: '기록을 불러왔습니다: {name}'
  }),
  'nsglamour.status.recentDeleted': msg({
    zh: '已删除这条最近载入缓存',
    en: 'Deleted this saved record',
    ja: 'この保存記録を削除しました',
    ko: '이 저장 기록을 삭제했습니다'
  }),
  'nsglamour.status.recentCleared': msg({
    zh: '已清空最近载入缓存',
    en: 'Cleared saved records',
    ja: '保存記録をクリアしました',
    ko: '저장 기록을 비웠습니다'
  }),
  'nsglamour.status.copied': msg({
    zh: '已复制',
    en: 'Copied',
    ja: 'コピーしました',
    ko: '복사했습니다'
  }),
  'nsglamour.status.copyError': msg({
    zh: '复制失败',
    en: 'Copy failed',
    ja: 'コピー失敗',
    ko: '복사 실패'
  }),
  'nsglamour.status.copyEmpty': msg({
    zh: '没有可复制内容',
    en: 'Nothing to copy',
    ja: 'コピーする内容がありません',
    ko: '복사할 내용 없음'
  }),
  'nsglamour.locale.zh': same('简体中文'),
  'nsglamour.locale.en': same('English'),
  'nsglamour.locale.ja': same('日本語'),
  'nsglamour.locale.ko': same('한국어'),
  'nsglamour.locale.tc': same('繁體中文'),
  'nsglamour.locale.fr': same('Français'),
  'nsglamour.locale.de': same('Deutsch')
}

export default glamourUiMessages
