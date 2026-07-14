import { msg } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const plateUiMessages: UiMessageMap = {
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
  'nsplate.customPortrait.adjust': msg({
    zh: '调整图片',
    en: 'Adjust image',
    ja: '画像を調整',
    ko: '이미지 조정'
  }),
  'nsplate.customPortrait.popoutLayer': msg({
    zh: '出框层级',
    en: 'Popout layer',
    ja: 'はみ出しレイヤー',
    ko: '프레임 밖 레이어'
  }),
  'nsplate.customPortrait.popoutLayer.aboveCustomPortrait': msg({
    zh: '自定义图片上方',
    en: 'Above custom image',
    ja: 'カスタム画像の上',
    ko: '사용자 이미지 위'
  }),
  'nsplate.customPortrait.freeLayer.portraitBase': msg({
    zh: '普通图片层', en: 'Standard image layer', ja: '通常画像レイヤー', ko: '일반 이미지 레이어'
  }),
  'nsplate.customPortrait.popoutLayer.belowNameplateFrame': msg({
    zh: '铭牌外框下方',
    en: 'Below nameplate frame',
    ja: 'ネームプレート枠の下',
    ko: '명패 프레임 아래'
  }),
  'nsplate.customPortrait.popoutLayer.aboveNameplateFrame': msg({
    zh: '铭牌外框上方',
    en: 'Above nameplate frame',
    ja: 'ネームプレート枠の上',
    ko: '명패 프레임 위'
  }),
  'nsplate.customPortrait.popoutLayer.abovePortraitFrame': msg({
    zh: '肖像外框上方',
    en: 'Above portrait frame',
    ja: 'ポートレート枠の上',
    ko: '초상화 프레임 위'
  }),
  'nsplate.customPortrait.popoutLayer.aboveNameplateBottomDecoration': msg({
    zh: '铭牌底部装饰上方',
    en: 'Above bottom decoration',
    ja: '下部装飾の上',
    ko: '하단 장식 위'
  }),
  'nsplate.customPortrait.popoutLayer.aboveNameplateDecorations': msg({
    zh: '铭牌装饰上方',
    en: 'Above nameplate decorations',
    ja: 'ネームプレート装飾の上',
    ko: '명패 장식 위'
  }),
  'nsplate.customPortrait.popoutLayer.aboveNameplateOrnaments': msg({
    zh: '铭牌装饰物上方',
    en: 'Above nameplate ornaments',
    ja: 'ネームプレート装飾物の上',
    ko: '명패 장식물 위'
  }),
  'nsplate.customPortrait.popoutLayer.aboveInfoGraphics': msg({
    zh: '信息层下方',
    en: 'Below info layer',
    ja: '情報レイヤーの下',
    ko: '정보 레이어 아래'
  }),
  'nsplate.customPortrait.popoutLayer.aboveInfoText': msg({
    zh: '信息层上方',
    en: 'Above info layer',
    ja: '情報レイヤーの上',
    ko: '정보 레이어 위'
  }),
  'nsplate.customPortrait.popoutLayer.front': msg({
    zh: '最前方',
    en: 'Front',
    ja: '最前面',
    ko: '맨 앞'
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
    zh: '普通图片',
    en: 'Standard image',
    ja: '通常画像',
    ko: '일반 이미지'
  }),
  'nsplate.customPortrait.crop.mode.popout': msg({
    zh: '半出框图片',
    en: 'Partial popout',
    ja: '半分はみ出し画像',
    ko: '반 프레임 밖 이미지'
  }),
  'nsplate.customPortrait.crop.mode.free': msg({
    zh: '全出框图片',
    en: 'Full popout',
    ja: '全枠外画像',
    ko: '전체 프레임 밖 이미지'
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
  'nsplate.customPortrait.crop.angle': msg({
    zh: '倾斜角度',
    en: 'Tilt angle',
    ja: '傾斜角度',
    ko: '기울기 각도'
  }),
  'nsplate.customPortrait.crop.angleReset': msg({
    zh: '重置',
    en: 'Reset',
    ja: 'リセット',
    ko: '초기화'
  }),
  'nsplate.customPortrait.crop.rotation': msg({
    zh: '旋转', en: 'Rotation', ja: '回転', ko: '회전'
  }),
  'nsplate.customPortrait.crop.transformReset': msg({
    zh: '重置位置', en: 'Reset position', ja: '位置をリセット', ko: '위치 초기화'
  }),
  'nsplate.customPortrait.crop.hint.moveImage': msg({
    zh: '拖拽画布：修改图片位置',
    en: 'Drag canvas: reposition image',
    ja: 'キャンバスをドラッグ：画像位置を調整',
    ko: '캔버스 드래그: 이미지 위치 조정'
  }),
  'nsplate.customPortrait.crop.hint.adjustAngle': msg({
    zh: '拖拽端点：改变分界线斜率',
    en: 'Drag endpoints: change split-line angle',
    ja: '端点をドラッグ：境界線の傾きを変更',
    ko: '끝점 드래그: 경계선 기울기 변경'
  }),
  'nsplate.customPortrait.crop.hint.sliderOnly': msg({
    zh: '分界线仅可使用滑杆控制',
    en: 'Move the split line using the slider only',
    ja: '境界線の位置はスライダーでのみ調整できます',
    ko: '경계선 위치는 슬라이더로만 조정할 수 있습니다'
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
  })
}

export default plateUiMessages
