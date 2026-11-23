import { msg } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const housingUiMessages: UiMessageMap = {
  'housing.title': msg({
    zh: '房屋空地查询',
    en: 'Housing Plots',
    ja: 'ハウジング空き地検索',
    ko: '주택 공지 조회'
  }),
  'housing.regionLabel': msg({
    zh: '服务器版本',
    en: 'Service region',
    ja: 'サービス地域',
    ko: '서비스 지역'
  }),
  'housing.regionCn': msg({
    zh: '国服',
    en: 'China',
    ja: '中国版',
    ko: '중국 서버'
  }),
  'housing.regionGlobal': msg({
    zh: '国际服',
    en: 'Global',
    ja: 'グローバル版',
    ko: '글로벌 서버'
  }),
  'housing.serverLabel': msg({
    zh: '服务器',
    en: 'World',
    ja: 'ワールド',
    ko: '월드'
  }),
  'housing.serverSearchPlaceholder': msg({
    zh: '搜索服务器',
    en: 'Search worlds',
    ja: 'ワールドを検索',
    ko: '월드 검색'
  }),
  'housing.refresh': msg({
    zh: '刷新',
    en: 'Refresh',
    ja: '更新',
    ko: '새로 고침'
  }),
  'housing.refreshing': msg({
    zh: '刷新中…',
    en: 'Refreshing…',
    ja: '更新中…',
    ko: '새로 고치는 중…'
  }),
  'housing.loading': msg({
    zh: '加载中…',
    en: 'Loading…',
    ja: '読み込み中…',
    ko: '불러오는 중…'
  }),
  'housing.loadError': msg({
    zh: '数据加载失败，请稍后重试',
    en: 'Failed to load data. Please try again later.',
    ja: 'データの読み込みに失敗しました。後でもう一度お試しください。',
    ko: '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }),
  'housing.loadWorldsError': msg({
    zh: '世界列表加载失败，请稍后重试',
    en: 'Failed to load the world list. Please try again later.',
    ja: 'ワールド一覧の読み込みに失敗しました。後でもう一度お試しください。',
    ko: '월드 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }),
  'housing.updatedAtLabel': msg({
    zh: '数据更新于',
    en: 'Data updated',
    ja: 'データ更新時刻:',
    ko: '데이터 갱신:'
  }),
  'housing.unknownUpdatedAt': msg({
    zh: '暂无数据更新时间',
    en: 'No update time available',
    ja: '更新時刻は不明',
    ko: '갱신 시간 없음'
  }),
  'housing.emptyTitle': msg({
    zh: '该服务器当前没有在售地块',
    en: 'No plots are currently listed on this world',
    ja: 'このワールドには現在売り出し中の区画がありません',
    ko: '이 월드에 현재 판매 중인 구획이 없습니다'
  }),
  'housing.emptyHint': msg({
    zh: '地块出售有周期，数据依赖玩家上报：可能不在售地期，或暂无上报数据。',
    en: 'Plot sales run in cycles and data is crowdsourced: the window may be closed, or no reports have been received yet.',
    ja: '区画の売り出しは周期的で、データはプレイヤーの報告に依存します。売り出し期間外または報告がない可能性があります。',
    ko: '구획 판매는 주기적으로 진행되며 데이터는 플레이어 제보에 의존합니다. 판매 기간이 아니거나 제보가 없을 수 있습니다.'
  }),
  'housing.filterEmptyTitle': msg({
    zh: '没有符合当前筛选条件的空地',
    en: 'No plots match the current filters',
    ja: '現在のフィルターに一致する区画はありません',
    ko: '현재 필터와 일치하는 구획이 없습니다'
  }),
  'housing.filterSizeLabel': msg({
    zh: '尺寸',
    en: 'Size',
    ja: 'サイズ',
    ko: '크기'
  }),
  'housing.filterAudienceLabel': msg({
    zh: '可购人群',
    en: 'Buyer',
    ja: '購入対象',
    ko: '구매 대상'
  }),
  'housing.filterCycleLabel': msg({
    zh: '轮次',
    en: 'Cycle',
    ja: 'くじ回',
    ko: '추첨 회차'
  }),
  'housing.groupLabel': msg({
    zh: '分组',
    en: 'Group',
    ja: 'グループ',
    ko: '그룹'
  }),
  'housing.groupDistrict': msg({
    zh: '按区域',
    en: 'By district',
    ja: '区域別',
    ko: '지역별'
  }),
  'housing.groupSize': msg({
    zh: '按尺寸',
    en: 'By size',
    ja: 'サイズ別',
    ko: '크기별'
  }),
  'housing.filterAll': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'housing.filterCycleCurrent': msg({
    zh: '本轮',
    en: 'This cycle',
    ja: '今回',
    ko: '이번 회차'
  }),
  'housing.filterCycleNext': msg({
    zh: '下一轮',
    en: 'Next cycle',
    ja: '次回',
    ko: '다음 회차'
  }),
  'housing.sizeSmall': msg({
    zh: '小型',
    en: 'Small',
    ja: '小',
    ko: '소형'
  }),
  'housing.sizeMedium': msg({
    zh: '中型',
    en: 'Medium',
    ja: '中',
    ko: '중형'
  }),
  'housing.sizeLarge': msg({
    zh: '大型',
    en: 'Large',
    ja: '大',
    ko: '대형'
  }),
  'housing.sizeMediumLarge': msg({
    zh: 'M/L',
    en: 'M/L',
    ja: 'M/L',
    ko: 'M/L'
  }),
  'housing.sortLabel': msg({
    zh: '排序',
    en: 'Sort',
    ja: '並び順',
    ko: '정렬'
  }),
  'housing.sortDefault': msg({
    zh: '区号',
    en: 'Location',
    ja: '区画順',
    ko: '구획 순'
  }),
  'housing.sortPriceAsc': msg({
    zh: '价格从低到高',
    en: 'Price: low to high',
    ja: '価格の安い順',
    ko: '낮은 가격 순'
  }),
  'housing.sortPriceDesc': msg({
    zh: '价格从高到低',
    en: 'Price: high to low',
    ja: '価格の高い順',
    ko: '높은 가격 순'
  }),
  'housing.sortEntriesAsc': msg({
    zh: '报名数从少到多',
    en: 'Entries: fewest first',
    ja: '応募数の少ない順',
    ko: '응모 적은 순'
  }),
  'housing.sortEntriesDesc': msg({
    zh: '报名数从多到少',
    en: 'Entries: most first',
    ja: '応募数の多い順',
    ko: '응모 많은 순'
  }),
  'housing.sortScanDesc': msg({
    zh: '最新扫描优先',
    en: 'Recently scanned first',
    ja: '最近スキャン順',
    ko: '최근 스캔 순'
  }),
  'housing.prefTitle': msg({
    zh: '心仪地块',
    en: 'Watchlist',
    ja: 'お気に入り区画',
    ko: '관심 구획'
  }),
  'housing.prefAdd': msg({
    zh: '添加',
    en: 'Add',
    ja: '追加',
    ko: '추가'
  }),
  'housing.prefWardAll': msg({
    zh: '全部小区',
    en: 'Any ward',
    ja: 'すべての区',
    ko: '전체 구역'
  }),
  'housing.prefRemove': msg({
    zh: '删除',
    en: 'Remove',
    ja: '削除',
    ko: '삭제'
  }),
  'housing.prefEmptyHint': msg({
    zh: '添加你心仪的地块，出现时自动置顶显示',
    en: 'Add plots you like; they are pinned to the top when available.',
    ja: 'お気に入りの区画を追加すると、出現時に自動で先頭に表示されます。',
    ko: '원하는 구획을 추가하면 나타날 때 자동으로 상단에 표시됩니다.'
  }),
  'housing.prefPinnedTitle': msg({
    zh: '心仪',
    en: 'Pinned',
    ja: 'お気に入り',
    ko: '관심'
  }),
  'housing.prefDistrictLabel': msg({
    zh: '住宅区',
    en: 'District',
    ja: 'エリア',
    ko: '지역'
  }),
  'housing.groupExpand': msg({
    zh: '展开',
    en: 'Expand',
    ja: '展開',
    ko: '펼치기'
  }),
  'housing.groupCollapse': msg({
    zh: '收起',
    en: 'Collapse',
    ja: '折りたたむ',
    ko: '접기'
  }),
  'housing.audienceIndividual': msg({
    zh: '个人',
    en: 'Individual',
    ja: '個人',
    ko: '개인'
  }),
  'housing.audienceFreeCompany': msg({
    zh: '部队',
    en: 'Free Company',
    ja: 'フリーカンパニー',
    ko: '자유 부대'
  }),
  'housing.audienceBoth': msg({
    zh: '个人/部队',
    en: 'Individual / FC',
    ja: '個人/FC',
    ko: '개인/부대'
  }),
  'housing.purchaseLottery': msg({
    zh: '抽签',
    en: 'Lottery',
    ja: 'くじ',
    ko: '추첨'
  }),
  'housing.purchaseFirstCome': msg({
    zh: '先到先得',
    en: 'First-come',
    ja: '先着順',
    ko: '선착순'
  }),
  'housing.phaseEntry': msg({
    zh: '报名中',
    en: 'Entry open',
    ja: '受付中',
    ko: '응모 중'
  }),
  'housing.phaseResults': msg({
    zh: '结果公示',
    en: 'Results',
    ja: '結果発表',
    ko: '결과 발표'
  }),
  'housing.phaseUpcoming': msg({
    zh: '下一轮',
    en: 'Next cycle',
    ja: '次回',
    ko: '다음 회차'
  }),
  'housing.phaseUnknown': msg({
    zh: '无轮次信息',
    en: 'No cycle info',
    ja: 'くじ情報なし',
    ko: '추첨 정보 없음'
  }),
  'housing.wardLabel': msg({
    zh: '区',
    en: ' Ward',
    ja: '区',
    ko: ' 구'
  }),
  'housing.plotLabel': msg({
    zh: '号',
    en: ' Plot',
    ja: '番',
    ko: '번'
  }),
  'housing.priceLabel': msg({
    zh: '价格',
    en: 'Price',
    ja: '価格',
    ko: '가격'
  }),
  'housing.currencyGil': msg({
    zh: '金币',
    en: 'Gil',
    ja: 'ギル',
    ko: '길'
  }),
  'housing.entriesNone': msg({
    zh: '暂无报名',
    en: 'No entries yet',
    ja: '応募なし',
    ko: '응모 없음'
  }),
  'housing.entriesUnit': msg({
    zh: '人报名',
    en: ' entries',
    ja: '件の応募',
    ko: '명 응모'
  }),
  'housing.plotCountUnit': msg({
    zh: '块',
    en: ' plots',
    ja: '件',
    ko: '개'
  }),
  'housing.summaryTotalLabel': msg({
    zh: '空地总数',
    en: 'Open plots',
    ja: '空き区画',
    ko: '빈 구획'
  }),
  'housing.summaryEmpty': msg({
    zh: '暂无空地数据',
    en: 'No plot data',
    ja: '空き区画データなし',
    ko: '빈 구획 데이터 없음'
  }),
  'housing.time.justNow': msg({
    zh: '刚刚',
    en: 'just now',
    ja: 'たった今',
    ko: '방금 전'
  }),
  'housing.time.minutesUnit': msg({
    zh: '分钟前',
    en: ' min ago',
    ja: '分前',
    ko: '분 전'
  }),
  'housing.time.hoursUnit': msg({
    zh: '小时前',
    en: ' h ago',
    ja: '時間前',
    ko: '시간 전'
  }),
  'housing.time.daysUnit': msg({
    zh: '天前',
    en: ' d ago',
    ja: '日前',
    ko: '일 전'
  }),
  'housing.remaining.unitDays': msg({
    zh: '天',
    en: 'd',
    ja: '日',
    ko: '일'
  }),
  'housing.remaining.unitHours': msg({
    zh: '小时',
    en: 'h',
    ja: '時間',
    ko: '시간'
  }),
  'housing.remaining.unitMinutes': msg({
    zh: '分',
    en: 'm',
    ja: '分',
    ko: '분'
  }),
  'housing.remaining.expired': msg({
    zh: '已截止',
    en: 'closed',
    ja: '終了',
    ko: '마감'
  }),
  'housing.dataSourceLabel': msg({
    zh: '数据来源',
    en: 'Data sources',
    ja: 'データソース',
    ko: '데이터 출처'
  }),
  'housing.dataSourcePaissa': msg({
    zh: 'PaissaHouse 插件众包上报（数据出口：PaissaDB）· 国际服',
    en: 'Crowdsourced via the PaissaHouse plugin (served by PaissaDB) · Global',
    ja: 'PaissaHouse プラグインによる報告（配信元: PaissaDB）· グローバル版',
    ko: 'PaissaHouse 플러그인 크라우드소싱(데이터 제공: PaissaDB) · 글로벌 서버'
  }),
  'housing.dataSourceCyou': msg({
    zh: 'HousingCheckXP 插件上报（数据出口：艾欧泽亚售楼中心）· 国服',
    en: 'Reported via the HousingCheckXP plugin (served by Eorzea Housing Sales Center) · CN',
    ja: 'HousingCheckXP プラグインによる報告（配信元: エオルゼア販売センター）· 中国版',
    ko: 'HousingCheckXP 플러그인 제보(데이터 제공: 에오르제아 분양 센터) · 중국 서버'
  }),
  'housing.district.mist': msg({
    zh: '海雾村',
    en: 'Mist',
    ja: 'ミスト',
    ko: '미스트'
  }),
  'housing.district.lavenderBeds': msg({
    zh: '薰衣草苗圃',
    en: 'The Lavender Beds',
    ja: 'ラベンダーベッド',
    ko: '라벤더 베드'
  }),
  'housing.district.goblet': msg({
    zh: '高脚孤丘',
    en: 'The Goblet',
    ja: 'ゴブレットビスタ',
    ko: '고블렛'
  }),
  'housing.district.shirogane': msg({
    zh: '白银乡',
    en: 'Shirogane',
    ja: 'シロガネ',
    ko: '시로가네'
  }),
  'housing.district.empyreum': msg({
    zh: '穹顶皓天',
    en: 'Empyreum',
    ja: 'エンピリウム',
    ko: '엠파이리움'
  })
}
