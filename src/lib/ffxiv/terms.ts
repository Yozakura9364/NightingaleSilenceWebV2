import type { Locale } from '@/stores/locale'

export type FfxivTermModule = 'NSPlate' | 'NSGlamour' | 'NSArmoire' | 'Common'
export type FfxivTermStatus = 'confirmed' | 'needs-check' | 'layout'
export type FfxivTermSourceKind = 'game-csv' | 'legacy-layout' | 'user-confirmed' | 'site-ui'

export interface FfxivTermSourceRef {
  kind: FfxivTermSourceKind
  table?: string
  row?: string
  field?: string
  note: string
}

export interface FfxivTermEntry {
  id: string
  module: FfxivTermModule
  status: FfxivTermStatus
  usage: string
  uiKey?: string
  legacyNames?: string[]
  composedFrom?: string[]
  values: Partial<Record<Locale, string>>
  source: FfxivTermSourceRef
  note?: string
}

export const ffxivTermEntries = [
  gameTerm({
    id: 'common.rank',
    module: 'Common',
    usage: '游戏基础术语',
    legacyNames: ['军衔'],
    values: { 'zh-CN': '军衔', en: 'Rank', ja: '階級', ko: '계급' },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '用户已确认该基础术语为军衔；具体 Addon.csv row 后续可补。'
    }
  }),
  gameTerm({
    id: 'common.icon',
    module: 'Common',
    usage: '网页字段后缀',
    values: { 'zh-CN': '图标', en: 'icon', ja: 'アイコン', ko: '아이콘' },
    source: {
      kind: 'site-ui',
      note: '工具 UI 中用于表示图像/素材槽位的通用后缀；不是单独的游戏术语 row。'
    }
  }),
  gameTerm({
    id: 'common.name',
    module: 'Common',
    usage: '网页字段后缀',
    values: { 'zh-CN': '名称', en: 'name', ja: '名', ko: '이름' },
    source: {
      kind: 'site-ui',
      note: '工具 UI 中用于表示文本名称槽位的通用后缀；不是单独的游戏术语 row。'
    }
  }),
  gameTerm({
    id: 'common.number',
    module: 'Common',
    usage: '网页字段后缀',
    values: { 'zh-CN': '数字', en: 'numbers', ja: '数字', ko: '숫자' },
    source: {
      kind: 'site-ui',
      note: '工具 UI 中用于表示数字刻度/数字文本槽位的通用后缀；不是单独的游戏术语 row。'
    }
  }),
  gameTerm({
    id: 'common.free-company',
    module: 'Common',
    usage: '游戏基础术语',
    values: {
      'zh-CN': '部队',
      en: 'Free Company',
      ja: 'フリーカンパニー',
      ko: '자유부대'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '游戏内 Free Company 术语；具体 Addon.csv row 后续可补。'
    }
  }),
  gameTerm({
    id: 'common.active-hours',
    module: 'Common',
    usage: '游戏基础术语',
    values: {
      'zh-CN': '活跃时段',
      en: 'Active Hours',
      ja: 'アクティブな時間帯',
      ko: '활동 시간대'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      row: '15010',
      note: '用户确认 Addon#15010。'
    }
  }),
  gameTerm({
    id: 'common.play-style',
    module: 'Common',
    usage: '游戏基础术语',
    values: {
      'zh-CN': '游戏风格',
      en: 'Play Style',
      ja: 'プレイスタイル',
      ko: '플레이 스타일'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      row: '15009',
      note: '用户确认 Addon#15009；非中文译文按游戏常用术语记录，后续可用源 CSV 再核。'
    }
  }),
  gameTerm({
    id: 'plate.info.character-title',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.title',
    legacyNames: ['称号'],
    values: { 'zh-CN': '称号', en: 'Title', ja: '称号', ko: '칭호' },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '角色资料/铭牌相关 UI 文本，具体 row 待从 Addon.csv 核对。'
    }
  }),
  gameTerm({
    id: 'plate.info.character-name',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.characterName',
    legacyNames: ['角色名'],
    values: {
      'zh-CN': '角色名',
      en: 'Character name',
      ja: 'キャラクター名',
      ko: '캐릭터 이름'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '角色资料/铭牌相关 UI 文本，具体 row 待从 Addon.csv 核对。'
    }
  }),
  gameTerm({
    id: 'plate.info.world',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.world',
    legacyNames: ['服务器'],
    values: { 'zh-CN': '服务器', en: 'World', ja: 'ワールド', ko: '월드' },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '中文网页可继续显示“服务器”；日英韩更接近游戏内 World 术语。'
    }
  }),
  gameTerm({
    id: 'plate.info.class-job-icon',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.classJobIcon',
    legacyNames: ['职业图标'],
    values: {
      'zh-CN': '职业图标',
      en: 'Class/Job icon',
      ja: 'クラス/ジョブアイコン',
      ko: '클래스/잡 아이콘'
    },
    source: {
      kind: 'game-csv',
      table: 'ClassJob.csv',
      field: 'Name / Abbreviation / Name{English}',
      note: '职业名称和缩写来自 ClassJob.csv；“图标”是本工具对素材槽位的说明。'
    }
  }),
  gameTerm({
    id: 'plate.info.level',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.level',
    legacyNames: ['等级'],
    values: { 'zh-CN': '等级', en: 'Level', ja: 'レベル', ko: '레벨' },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '角色资料相关 UI 文本，具体 row 待从 Addon.csv 核对。'
    }
  }),
  gameTerm({
    id: 'plate.info.class-job-name',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.classJobName',
    legacyNames: ['职业名'],
    values: {
      'zh-CN': '职业名',
      en: 'Class/Job name',
      ja: 'クラス/ジョブ名',
      ko: '클래스/잡 이름'
    },
    source: {
      kind: 'game-csv',
      table: 'ClassJob.csv',
      field: 'Name / Name{English}',
      note: '职业名本身来自 ClassJob.csv；字段标题仍需核对游戏 UI 是否使用此组合词。'
    }
  }),
  gameTerm({
    id: 'plate.info.rank-icon',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.rankIcon',
    legacyNames: ['军衔'],
    composedFrom: ['common.rank', 'common.icon'],
    values: { 'zh-CN': '军衔图标', en: 'Rank icon', ja: '階級アイコン', ko: '계급 아이콘' },
    source: {
      kind: 'user-confirmed',
      note: '组合字段：基础术语“军衔”加工具 UI 后缀“图标”；用户已确认该字段应显示为军衔图标。'
    }
  }),
  gameTerm({
    id: 'plate.info.rank-name',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.rankName',
    legacyNames: ['军衔名称'],
    composedFrom: ['common.rank', 'common.name'],
    values: { 'zh-CN': '军衔名称', en: 'Rank name', ja: '階級名', ko: '계급명' },
    source: {
      kind: 'user-confirmed',
      note: '组合字段：基础术语“军衔”加工具 UI 后缀“名称”；用户已确认该字段显示为军衔名称。'
    }
  }),
  gameTerm({
    id: 'plate.info.free-company-crest',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.crest',
    legacyNames: ['bd队徽', '部队队徽'],
    values: {
      'zh-CN': '部队队徽',
      en: 'Free Company crest',
      ja: 'フリーカンパニークレスト',
      ko: '자유부대 문장'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '中文已按用户确认从 bd 队徽改为部队队徽；多语言需核对游戏内 Free Company 相关 UI。'
    }
  }),
  gameTerm({
    id: 'plate.info.free-company-name',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.communityName',
    legacyNames: ['bd名称', '部队名称'],
    composedFrom: ['common.free-company', 'common.name'],
    values: {
      'zh-CN': '部队名称',
      en: 'Free Company name',
      ja: 'フリーカンパニー名',
      ko: '자유부대 이름'
    },
    source: {
      kind: 'user-confirmed',
      note: '组合字段：基础术语“部队”加工具 UI 后缀“名称”；用户确认按军衔名称同类方式处理。'
    }
  }),
  gameTerm({
    id: 'plate.info.search-comment',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.searchComment',
    legacyNames: ['个性签名'],
    values: {
      'zh-CN': '个性签名',
      en: 'Search comment',
      ja: 'サーチコメント',
      ko: '검색 코멘트'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '旧项目语义接近游戏内 Search Comment；中文显示是否沿用“个性签名”需校对。'
    }
  }),
  gameTerm({
    id: 'plate.info.schedule-cells',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.scheduleCells',
    legacyNames: ['作息选择'],
    composedFrom: ['common.active-hours'],
    values: {
      'zh-CN': '活跃时段',
      en: 'Active Hours',
      ja: 'アクティブな時間帯',
      ko: '활동 시간대'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      row: '15010',
      note: '旧字段“作息选择”正式显示为 Addon#15010 活跃时段。'
    }
  }),
  gameTerm({
    id: 'plate.info.schedule-number',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.scheduleNumber',
    legacyNames: ['作息数字'],
    composedFrom: ['common.active-hours', 'common.number'],
    values: {
      'zh-CN': '活跃时段数字',
      en: 'Active Hours numbers',
      ja: 'アクティブな時間帯数字',
      ko: '활동 시간대 숫자'
    },
    source: {
      kind: 'user-confirmed',
      note: '组合字段：Addon#15010“活跃时段”加工具 UI 后缀“数字”。'
    }
  }),
  layoutTerm({
    id: 'plate.info.schedule-text',
    module: 'NSPlate',
    usage: '铭牌信息层布局槽位',
    uiKey: 'plate.info.field.scheduleText',
    legacyNames: ['作息文字'],
    values: {
      'zh-CN': '作息文字',
      en: 'Schedule text',
      ja: '活動時間テキスト',
      ko: '활동 시간 문구'
    },
    note: '旧模板装饰文本槽位。'
  }),
  gameTerm({
    id: 'plate.info.activity-icon',
    module: 'NSPlate',
    usage: '铭牌信息层字段',
    uiKey: 'plate.info.field.activityIcon',
    legacyNames: ['活动图标'],
    composedFrom: ['common.play-style'],
    values: {
      'zh-CN': '游戏风格',
      en: 'Play Style',
      ja: 'プレイスタイル',
      ko: '플레이 스타일'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      row: '15009',
      note: '旧字段“活动图标”正式显示为 Addon#15009 游戏风格。'
    }
  }),
  layoutTerm({
    id: 'plate.info.phantom-tide-title-cn',
    module: 'NSPlate',
    usage: '幻海流信息预设布局槽位',
    uiKey: 'plate.info.field.cnTitle',
    legacyNames: ['中文标题'],
    values: { 'zh-CN': '中文标题', en: 'Chinese title', ja: '中国語タイトル', ko: '중국어 제목' },
    note: '幻海流模板布局槽位，不是游戏术语。'
  }),
  layoutTerm({
    id: 'plate.info.phantom-tide-body-one',
    module: 'NSPlate',
    usage: '幻海流信息预设布局槽位',
    uiKey: 'plate.info.field.bodyCopyOne',
    legacyNames: ['文案1'],
    values: { 'zh-CN': '文案1', en: 'Copy 1', ja: '文面1', ko: '문구 1' },
    note: '幻海流模板布局槽位，不是游戏术语。'
  }),
  {
    id: 'armoire.container.glamour-dresser',
    module: 'NSArmoire',
    status: 'confirmed',
    usage: '衣柜管家容器名',
    uiKey: 'nsarmoire.container.glamourDresser',
    legacyNames: ['投影台'],
    values: {
      'zh-CN': '投影台',
      en: 'Glamour dresser',
      ja: 'ミラージュドレッサー',
      ko: '투영대'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '容器名应来自游戏 UI 文本；当前中文由用户长期口径确认。'
    }
  },
  {
    id: 'armoire.container.armoire',
    module: 'NSArmoire',
    status: 'confirmed',
    usage: '衣柜管家容器名',
    uiKey: 'nsarmoire.container.armoire',
    legacyNames: ['收藏柜'],
    values: {
      'zh-CN': '收藏柜',
      en: 'Armoire',
      ja: '愛蔵品キャビネット',
      ko: '애장품 보관함'
    },
    source: {
      kind: 'game-csv',
      table: 'Addon.csv',
      note: '容器名应来自游戏 UI 文本；当前中文由用户长期口径确认。'
    }
  }
] satisfies FfxivTermEntry[]

function gameTerm(entry: Omit<FfxivTermEntry, 'status'>): FfxivTermEntry {
  return { ...entry, status: 'confirmed' }
}

function layoutTerm(
  entry: Omit<FfxivTermEntry, 'status' | 'source'> & { note: string }
): FfxivTermEntry {
  return {
    ...entry,
    status: 'layout',
    source: {
      kind: 'legacy-layout',
      note: entry.note
    }
  }
}
