import { msg } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const ffxivUiMessages: UiMessageMap = {
  'ffxiv.workshops': msg({
    zh: '工房',
    en: 'Workshops',
    ja: '工房',
    ko: '공방'
  }),
  'ffxiv.clocks.mechanisms': msg({
    zh: '时钟',
    en: 'Clocks',
    ja: '時計',
    ko: '시계'
  }),
  'ffxiv.clocks.community': msg({
    zh: '活动日历',
    en: 'Event calendar',
    ja: 'イベントカレンダー',
    ko: '이벤트 캘린더'
  }),
  'ffxiv.clocks.region': msg({
    zh: '服务器版本',
    en: 'Service region',
    ja: 'サービス地域',
    ko: '서비스 지역'
  }),
  'ffxiv.clocks.region.cn': msg({
    zh: '国服',
    en: 'China',
    ja: '中国版',
    ko: '중국 서버'
  }),
  'ffxiv.clocks.region.tw': msg({
    zh: '繁中服',
    en: 'Traditional Chinese',
    ja: '繁体字版',
    ko: '번체 중국어'
  }),
  'ffxiv.clocks.region.global': msg({
    zh: '国际服',
    en: 'Global',
    ja: 'グローバル版',
    ko: '글로벌 서버'
  }),
  'ffxiv.clocks.housing.title': msg({
    zh: '房屋抽选',
    en: 'Housing lottery',
    ja: 'ハウジング抽選',
    ko: '하우징 추첨'
  }),
  'ffxiv.clocks.housing.phase.entry': msg({
    zh: '可参与抽选',
    en: 'Entry period',
    ja: '応募期間',
    ko: '응모 기간'
  }),
  'ffxiv.clocks.housing.phase.results': msg({
    zh: '公示期',
    en: 'Results period',
    ja: '結果発表期間',
    ko: '결과 발표 기간'
  }),
  'ffxiv.clocks.housing.callout.entry': msg({
    zh: '该R房了！',
    en: 'Time to enter!',
    ja: '応募の時間です！',
    ko: '응모할 시간이에요!'
  }),
  'ffxiv.clocks.housing.callout.results': msg({
    zh: '该看R房结果了！',
    en: 'Check the lottery results!',
    ja: '抽選結果を確認しましょう！',
    ko: '추첨 결과를 확인하세요!'
  }),
  'ffxiv.clocks.housing.entryClosesIn': msg({
    zh: '本轮抽选截止',
    en: 'Entry closes in',
    ja: '応募締切まで',
    ko: '응모 마감까지'
  }),
  'ffxiv.clocks.housing.entryAvailableIn': msg({
    zh: '距离开放抽选',
    en: 'Entry opens in',
    ja: '次回応募開始まで',
    ko: '다음 응모 시작까지'
  }),
  'ffxiv.clocks.housing.nextEntryOpens': msg({
    zh: '下一轮抽选开放',
    en: 'Next entry period opens',
    ja: '次回応募開始',
    ko: '다음 응모 시작'
  }),
  'ffxiv.clocks.frontline.title': msg({
    zh: '纷争前线',
    en: 'Frontline',
    ja: 'フロントライン',
    ko: '프론트라인'
  }),
  'ffxiv.clocks.frontline.current': msg({
    zh: '当前战场',
    en: 'Current map',
    ja: '現在の戦場',
    ko: '현재 전장'
  }),
  'ffxiv.clocks.frontline.next': msg({
    zh: '明日战场',
    en: "Tomorrow's map",
    ja: '明日の戦場',
    ko: '내일 전장'
  }),
  'ffxiv.clocks.frontline.rotatesIn': msg({
    zh: '轮换时间',
    en: 'Rotation time',
    ja: '切り替え時刻',
    ko: '교체 시간'
  }),
  'ffxiv.clocks.frontline.map.sealRock': msg({
    zh: '尘封秘岩（争夺战）',
    en: 'Seal Rock (Seize)',
    ja: 'シールロック（争奪戦）',
    ko: '봉인된 바위섬(쟁탈전)'
  }),
  'ffxiv.clocks.frontline.map.borderlandRuins': msg({
    zh: '周边遗迹群（阵地战）',
    en: 'The Borderland Ruins (Secure)',
    ja: '外縁遺跡群（制圧戦）',
    ko: '외곽 유적지대(제압전)'
  }),
  'ffxiv.clocks.frontline.map.onsalHakair': msg({
    zh: '昂萨哈凯尔（竞争战）',
    en: 'Onsal Hakair (Danshig Naadam)',
    ja: 'オンサル・ハカイル（終節戦）',
    ko: '온살 하카이르(경쟁전)'
  }),
  'ffxiv.clocks.frontline.map.worqorChirteh': msg({
    zh: '沃刻其特（演习战）',
    en: 'Worqor Chirteh (Triumph)',
    ja: 'ウォーコー・チーテ（演習戦）',
    ko: '워코 치테(연습전)'
  }),
  'ffxiv.clocks.frontline.map.fieldsOfGlory': msg({
    zh: '荣誉野（碎冰战）',
    en: 'The Fields of Glory (Shatter)',
    ja: 'フィールド・オブ・グローリー（砕氷戦）',
    ko: '영광의 평원(쇄빙전)'
  }),
  'ffxiv.clocks.community.startsIn': msg({
    zh: '开始还有',
    en: 'Starts in',
    ja: '開始まで',
    ko: '시작까지'
  }),
  'ffxiv.clocks.community.endsIn': msg({
    zh: '结束还有',
    en: 'Ends in',
    ja: '終了まで',
    ko: '종료까지'
  }),
  'ffxiv.clocks.community.active': msg({
    zh: '进行中',
    en: 'In progress',
    ja: '開催中',
    ko: '진행 중'
  }),
  'ffxiv.clocks.community.dataError': msg({
    zh: '活动数据暂时无法读取',
    en: 'Community event data is unavailable',
    ja: 'イベントデータを読み込めません',
    ko: '이벤트 데이터를 불러올 수 없습니다'
  }),
  'ffxiv.clocks.community.empty': msg({
    zh: '这段时间暂无活动',
    en: 'No events in this date range',
    ja: 'この期間のイベントはありません',
    ko: '이 기간에 예정된 이벤트가 없습니다'
  }),
  'ffxiv.clocks.community.loading': msg({
    zh: '正在读取活动数据',
    en: 'Loading event data',
    ja: 'イベントデータを読み込み中',
    ko: '이벤트 데이터를 불러오는 중'
  }),
  'ffxiv.clocks.community.region': msg({
    zh: '区服',
    en: 'Region',
    ja: 'リージョン',
    ko: '지역'
  }),
  'ffxiv.clocks.community.region.common': msg({
    zh: '共同活动',
    en: 'Shared',
    ja: '共通イベント',
    ko: '공통 이벤트'
  }),
  'ffxiv.clocks.community.region.cn': msg({
    zh: '国服专属',
    en: 'China only',
    ja: '中国版限定',
    ko: '중국 서버 전용'
  }),
  'ffxiv.clocks.community.region.global': msg({
    zh: '国际服专属',
    en: 'Global only',
    ja: 'グローバル版限定',
    ko: '글로벌 서버 전용'
  }),
  'ffxiv.clocks.community.previousMonth': msg({
    zh: '上一个月',
    en: 'Previous month',
    ja: '前の月',
    ko: '이전 달'
  }),
  'ffxiv.clocks.community.nextMonth': msg({
    zh: '下一个月',
    en: 'Next month',
    ja: '次の月',
    ko: '다음 달'
  }),
  'ffxiv.clocks.community.today': msg({
    zh: '今天',
    en: 'Today',
    ja: '今日',
    ko: '오늘'
  }),
  'ffxiv.clocks.community.openLink': msg({
    zh: '打开活动页面',
    en: 'Open event page',
    ja: 'イベントページを開く',
    ko: '이벤트 페이지 열기'
  }),
  'ffxiv.clocks.countdown.days': msg({ zh: '天', en: 'd', ja: '日', ko: '일' }),
  'ffxiv.clocks.countdown.hours': msg({ zh: '时', en: 'h', ja: '時', ko: '시간' }),
  'ffxiv.clocks.countdown.minutes': msg({ zh: '分', en: 'm', ja: '分', ko: '분' }),
  'ffxiv.clocks.countdown.seconds': msg({ zh: '秒', en: 's', ja: '秒', ko: '초' })
}

export default ffxivUiMessages
