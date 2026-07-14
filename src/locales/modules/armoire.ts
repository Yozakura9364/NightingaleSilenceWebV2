import { draft, msg } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const armoireUiMessages: UiMessageMap = {
  'nsarmoire.panel.import': msg({
    zh: '读取衣柜数据',
    en: 'Read wardrobe data',
    ja: '衣装データを読み込み',
    ko: '의상장 데이터 읽기'
  }),
  'nsarmoire.panel.overview': msg({
    zh: draft('概览'),
    en: 'Overview',
    ja: '概要',
    ko: '개요'
  }),
  'nsarmoire.panel.distribution': msg({
    zh: '背包分布',
    en: 'Inventory distribution',
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
    zh: '衣柜统计',
    en: 'Wardrobe stats',
    ja: 'ワードローブ統計',
    ko: '옷장 통계'
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
    zh: '衣柜统计',
    en: 'Wardrobe stats',
    ja: 'ワードローブ統計',
    ko: '옷장 통계'
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
  'nsarmoire.collection.status.toStore': msg({
    zh: '待收纳',
    en: 'To store',
    ja: '収納待ち',
    ko: '수납 대기'
  }),
  'nsarmoire.collection.status.owned': msg({
    zh: '已拥有',
    en: 'Owned',
    ja: '所持済み',
    ko: '보유 중'
  }),
  'nsarmoire.collection.status.unowned': msg({
    zh: '未拥有',
    en: 'Not owned',
    ja: '未所持',
    ko: '미보유'
  }),
  'nsarmoire.collection.status.dyed': msg({
    zh: '有染色',
    en: 'Dyed',
    ja: '染色あり',
    ko: '염색 있음'
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
  'nsarmoire.collection.cabinet.unknownCategory': msg({
    zh: '未识别分类',
    en: 'Unknown category',
    ja: '未識別カテゴリ',
    ko: '알 수 없는 분류'
  }),
  'nsarmoire.collection.cabinet.unknownSubCategory': msg({
    zh: '未识别子分类',
    en: 'Unknown subcategory',
    ja: '未識別サブカテゴリ',
    ko: '알 수 없는 하위 분류'
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
  'nsarmoire.collection.glamourSet.filter.all': msg({
    zh: '全部',
    en: 'All',
    ja: 'すべて',
    ko: '전체'
  }),
  'nsarmoire.collection.glamourSet.status.completeStored': msg({
    zh: '套装已完整收纳',
    en: 'Fully stored',
    ja: '完全収納済み',
    ko: '완전 수납'
  }),
  'nsarmoire.collection.glamourSet.status.loosePiecesToStore': msg({
    zh: '散件待收纳',
    en: 'Pieces to store',
    ja: '収納待ちパーツ',
    ko: '수납 대기 부위'
  }),
  'nsarmoire.collection.glamourSet.status.missingPieces': msg({
    zh: '散件未拥有',
    en: 'Missing pieces',
    ja: '未所持パーツ',
    ko: '미보유 부위'
  }),
  'nsarmoire.collection.glamourSet.status.canCreateSet': msg({
    zh: '套装待创建',
    en: 'Set to create',
    ja: 'セット作成待ち',
    ko: '세트 생성 대기'
  }),
  'nsarmoire.collection.glamourSet.status.unowned': msg({
    zh: '套装未拥有',
    en: 'Set not owned',
    ja: 'セット未所持',
    ko: '세트 미보유'
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
    zh: '已拥有',
    en: 'Owned',
    ja: '所持済み',
    ko: '보유'
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
  'nsarmoire.store.tag.collectorEditionBonus': msg({
    zh: '典藏包',
    en: "Collector's edition",
    ja: 'コレクターズエディション',
    ko: '컬렉터스 에디션'
  }),
  'nsarmoire.store.tag.replicaCostume': msg({
    zh: '复制品时装',
    en: 'Replica costume',
    ja: 'レプリカ衣装',
    ko: '복제품 의상'
  }),
  'nsarmoire.store.tag.fanFestivalCostume': msg({
    zh: '运营活动时装',
    en: 'Promotional costume',
    ja: 'プロモーション衣装',
    ko: '프로모션 의상'
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
  'nsarmoire.store.tag.huntingMoon': msg({
    zh: '狩猎之月',
    en: 'Hunt for the Moon',
    ja: '狩りの月',
    ko: '사냥의 달'
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
  'nsarmoire.store.group.seasonal': msg({
    zh: '节日时装',
    en: 'Seasonal outfits',
    ja: 'シーズナル衣装',
    ko: '시즌 의상'
  }),
  'nsarmoire.store.group.other': msg({
    zh: '其他商城外观',
    en: 'Other store outfits',
    ja: 'その他ストア外見',
    ko: '기타 상점 외형'
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
    zh: '已拥有',
    en: 'Owned',
    ja: '所持済み',
    ko: '보유'
  }),
  'nsarmoire.store.status.partial': msg({
    zh: '缺部分',
    en: 'Partial',
    ja: '一部不足',
    ko: '일부 누락'
  }),
  'nsarmoire.store.status.missing': msg({
    zh: '未拥有',
    en: 'Not owned',
    ja: '未所持',
    ko: '미보유'
  }),
  'nsarmoire.store.status.needsMapping': msg({
    zh: '待校正',
    en: 'Needs mapping',
    ja: '要確認',
    ko: '확인 필요'
  }),
  'nsarmoire.store.region.cn': msg({
    zh: '简中服',
    en: 'CN',
    ja: '中国版',
    ko: '중국 서버'
  }),
  'nsarmoire.store.region.global': msg({
    zh: 'Global Server',
    en: 'Global Server',
    ja: 'Global Server',
    ko: 'Global Server'
  }),
  'nsarmoire.store.region.tw': msg({
    zh: '繁中服',
    en: 'TW',
    ja: '繁体字版',
    ko: '대만 서버'
  }),
  'nsarmoire.store.region.kr': msg({
    zh: '한국 서버',
    en: '한국 서버',
    ja: '한국 서버',
    ko: '한국 서버'
  }),
  'nsarmoire.store.link.cn': msg({
    zh: 'Simplified Chinese',
    en: 'Simplified Chinese',
    ja: 'Simplified Chinese',
    ko: 'Simplified Chinese'
  }),
  'nsarmoire.store.link.global': msg({
    zh: 'GLOBAL',
    en: 'GLOBAL',
    ja: 'GLOBAL',
    ko: 'GLOBAL'
  }),
  'nsarmoire.store.link.tw': msg({
    zh: 'Traditional Chinese',
    en: 'Traditional Chinese',
    ja: 'Traditional Chinese',
    ko: 'Traditional Chinese'
  }),
  'nsarmoire.store.link.kr': msg({
    zh: '한국 서버',
    en: '한국 서버',
    ja: '한국 서버',
    ko: '한국 서버'
  }),
  'nsarmoire.store.openLink': msg({
    zh: '打开商城',
    en: 'Open store',
    ja: 'ストアを開く',
    ko: '상점 열기'
  }),
  'nsarmoire.store.noLink': msg({
    zh: '暂无链接',
    en: 'No link yet',
    ja: 'リンク未登録',
    ko: '링크 없음'
  }),
  'nsarmoire.store.noPrice': msg({
    zh: '暂无价格',
    en: 'No price yet',
    ja: '価格未登録',
    ko: '가격 없음'
  }),
  'nsarmoire.store.items.label': msg({
    zh: '散件',
    en: 'Pieces',
    ja: '部品',
    ko: '부위'
  }),
  'nsarmoire.store.piece.location': msg({
    zh: '位置：{location}',
    en: 'Location: {location}',
    ja: '位置：{location}',
    ko: '위치: {location}'
  }),
  'nsarmoire.store.piece.dye': msg({
    zh: '染色：{dyes}',
    en: 'Dye: {dyes}',
    ja: '染色：{dyes}',
    ko: '염색: {dyes}'
  }),
  'nsarmoire.store.piece.bind': msg({
    zh: '绑定：{state}',
    en: 'Binding: {state}',
    ja: 'バインド：{state}',
    ko: '귀속: {state}'
  }),
  'nsarmoire.store.piece.bound': msg({
    zh: '已绑定',
    en: 'Bound',
    ja: 'バインド済み',
    ko: '귀속됨'
  }),
  'nsarmoire.store.piece.unbound': msg({
    zh: '未绑定',
    en: 'Unbound',
    ja: '未バインド',
    ko: '미귀속'
  }),
  'nsarmoire.store.piece.moreEntries': msg({
    zh: '另有 {count} 件',
    en: '{count} more',
    ja: '他 {count} 件',
    ko: '{count}개 더 있음'
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
    zh: '用于校正商城套装、散件映射、各地区商城链接和价格。',
    en: 'Review store outfits, piece mappings, regional store links, and prices.',
    ja: 'ストア衣装、部品対応、地域別リンク、価格を確認します。',
    ko: '상점 의상, 부위 매핑, 지역별 링크와 가격을 확인합니다.'
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
    zh: '简中服',
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
    zh: '한국 서버',
    en: '한국 서버',
    ja: '한국 서버',
    ko: '한국 서버'
  }),
  'nsarmoire.storeReview.link.placeholder': msg({
    zh: '粘贴商城链接',
    en: 'Paste store link',
    ja: 'ストアリンクを貼り付け',
    ko: '상점 링크 붙여넣기'
  }),
  'nsarmoire.storeReview.price.placeholder': msg({
    zh: '填写价格',
    en: 'Enter price',
    ja: '価格を入力',
    ko: '가격 입력'
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
  'nsarmoire.storeReview.action.exclude': msg({
    zh: '排除出目录',
    en: 'Exclude from catalog',
    ja: 'カタログから除外',
    ko: '목록에서 제외'
  }),
  'nsarmoire.storeReview.action.unexclude': msg({
    zh: '取消排除',
    en: 'Keep in catalog',
    ja: '除外を取り消す',
    ko: '제외 취소'
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
  'nsarmoire.storeReview.status.excluded': msg({
    zh: '将排除',
    en: 'Will exclude',
    ja: '除外予定',
    ko: '제외 예정'
  }),
  'nsarmoire.storeReview.tags.label': msg({
    zh: '商城标签',
    en: 'Store tags',
    ja: 'ストアタグ',
    ko: '상점 태그'
  }),
  'nsarmoire.storeReview.detailTags.label': msg({
    zh: '限定',
    en: 'Limits',
    ja: '制限',
    ko: '제한'
  }),
  'nsarmoire.storeReview.tagFilter.label': msg({
    zh: '标签筛选',
    en: 'Tag filter',
    ja: 'タグ絞り込み',
    ko: '태그 필터'
  }),
  'nsarmoire.storeReview.tagFilter.all': msg({
    zh: '全部标签',
    en: 'All tags',
    ja: 'すべてのタグ',
    ko: '전체 태그'
  }),
  'nsarmoire.storeReview.tagFilter.tagged': msg({
    zh: '已有标签',
    en: 'Tagged',
    ja: 'タグあり',
    ko: '태그 있음'
  }),
  'nsarmoire.storeReview.tagFilter.untagged': msg({
    zh: '未打标签',
    en: 'Untagged',
    ja: 'タグなし',
    ko: '태그 없음'
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
  'nsarmoire.storeReview.item.candidates': msg({
    zh: '候选物品',
    en: 'Candidate items',
    ja: '候補アイテム',
    ko: '후보 아이템'
  }),
  'nsarmoire.storeReview.item.candidateAdd': msg({
    zh: '加入 {item}',
    en: 'Add {item}',
    ja: '{item}を追加',
    ko: '{item} 추가'
  }),
  'nsarmoire.storeReview.item.candidateAddPieces': msg({
    zh: '加入散件',
    en: 'Add pieces',
    ja: '部品を追加',
    ko: '부품 추가'
  }),
  'nsarmoire.storeReview.item.candidatePieceCount': msg({
    zh: '{count} 件',
    en: '{count} pieces',
    ja: '{count} 件',
    ko: '{count}개'
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
    zh: '可套装幻影化',
    en: 'Can be stored as glamour sets',
    ja: 'セット収納可能な部品',
    ko: '세트 보관 가능 부위'
  }),
  'nsarmoire.recommendation.tradableItems': msg({
    zh: '可交易物品检查',
    en: 'Tradable item check',
    ja: '取引可能アイテム確認',
    ko: '거래 가능 아이템 확인'
  }),
  'nsarmoire.recommendation.crafterGathererReplicas': msg({
    zh: '生产采集复制品',
    en: 'Crafter and gatherer replicas',
    ja: 'クラフター・ギャザラーレプリカ',
    ko: '제작 채집 복제품'
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
    zh: '染色高风险',
    en: 'Dye risk',
    ja: '染色を先に確認',
    ko: '염색 먼저 확인'
  }),
  'nsarmoire.recommendation.ignoredItems': msg({
    zh: '已忽略装备',
    en: 'Ignored gear',
    ja: '除外中の装備',
    ko: '무시한 장비'
  }),
  'nsarmoire.summary.inventory': msg({
    zh: '当前检测到了{entries}件外观物品，分布在{containers}个物品收纳系统里。',
    en: '{entries} glamour items were detected across {containers} storage systems.',
    ja: '{entries}件のミラプリ用アイテムを検出しました。{containers}個の保管システムに分布しています。',
    ko: '{containers}개 보관 시스템에서 {entries}개의 외형 아이템을 감지했습니다.'
  }),
  'nsarmoire.summary.storage': msg({
    zh: '其中投影台有 {dresser} 条，收藏柜有 {armoire} 条；后面的建议会按容器判断能不能整理。',
    en: '{dresser} are in the glamour dresser and {armoire} are in the armoire; suggestions below use container-aware checks.',
    ja: 'ミラージュドレッサーに {dresser} 件、愛蔵品キャビネットに {armoire} 件あります。下の提案はコンテナ別に判定します。',
    ko: '투영대에 {dresser}개, 애장품 보관함에 {armoire}개가 있습니다. 아래 제안은 컨테이너별로 판단합니다.'
  }),
  'nsarmoire.summary.dyeWarning': msg({
    zh: '有 {count} 条已经染色；请按物品位置确认是否需要保留当前染色。',
    en: '{count} entries are dyed. Check the item locations before deciding whether to keep the current dyes.',
    ja: '{count} 件が染色済みです。愛蔵品キャビネットとセット収納は染色を消しますが、他の収納は保持として扱います。',
    ko: '{count}개 항목이 염색되어 있습니다. 애장품 보관함과 세트 보관은 염색을 지우며, 다른 보관은 유지로 봅니다.'
  }),
  'nsarmoire.summary.noDyeWarning': msg({
    zh: '未发现染色条目，当前这批数据不需要检查清染色风险。',
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
  'nsarmoire.hint.setPieces.summary': msg({
    zh: '已有套装幻影化的散件可以整理；已染贵重染剂的条目会暂不优先。',
    en: 'Some pieces can be stored as glamour sets. Items with valuable dyes are de-prioritized.',
    ja: 'セット収納できる部品があります。高価な染料付きの項目は優先度を下げています。',
    ko: '세트 보관 가능한 부위가 있습니다. 고가 염료가 적용된 항목은 우선순위를 낮춥니다.'
  }),
  'nsarmoire.hint.dyed': msg({
    zh: '已染',
    en: 'Dyed',
    ja: '染色済み',
    ko: '염색됨'
  }),
  'nsarmoire.hint.valuableDyeDeferredSuffix': msg({
    zh: '，暂不优先',
    en: ', not prioritized',
    ja: '、優先度低',
    ko: ', 우선순위 낮음'
  }),
  'nsarmoire.hint.tradableItems.summary': msg({
    zh: '发现 {count} 件未绑定的可交易外观，可以先确认是否需要保留在角色身上：{items}。',
    en: '{count} unbound tradable glamour items were found. Check whether they need to stay on this character: {items}.',
    ja: '未バインドの取引可能ミラプリ品が {count} 件あります。キャラクターに残すか確認: {items}。',
    ko: '미귀속 거래 가능 외형 아이템이 {count}개 있습니다. 이 캐릭터에 둘지 확인: {items}.'
  }),
  'nsarmoire.hint.tradableItems.none': msg({
    zh: '当前没有发现未绑定的可交易外观。',
    en: 'No unbound tradable glamour items were found.',
    ja: '未バインドの取引可能ミラプリ品はありません。',
    ko: '미귀속 거래 가능 외형 아이템이 없습니다.'
  }),
  'nsarmoire.hint.tradableEntry.unbound': msg({
    zh: '未绑定',
    en: 'Unbound',
    ja: '未バインド',
    ko: '미귀속'
  }),
  'nsarmoire.hint.replicaRecycle.summary': msg({
    zh: '发现 {count} 件生产采集复制品，可兑换 {vouchers} 个染剂兑换券，并返还已染染剂：{dyes}。',
    en: '{count} crafter/gatherer replicas can be exchanged for {vouchers} dye vouchers and dyed colors returned: {dyes}.',
    ja: '{count} 件のクラフター・ギャザラーレプリカを {vouchers} 個の染料交換券に交換でき、染色済み染料も返却されます: {dyes}。',
    ko: '제작/채집 복제품 {count}개를 염료 교환권 {vouchers}개로 교환할 수 있으며 염색한 염료도 반환됩니다: {dyes}.'
  }),
  'nsarmoire.hint.replicaRecycle.none': msg({
    zh: '当前没有发现生产采集复制品。',
    en: 'No crafter/gatherer replicas were found.',
    ja: 'クラフター・ギャザラーレプリカは見つかりませんでした。',
    ko: '제작/채집 복제품이 없습니다.'
  }),
  'nsarmoire.hint.replicaRecycle.reward': msg({
    zh: '回收可得：染剂兑换券 x{count}',
    en: 'Recycle reward: dye voucher x{count}',
    ja: '回収報酬: 染料交換券 x{count}',
    ko: '회수 보상: 염료 교환권 x{count}'
  }),
  'nsarmoire.hint.replicaRecycle.dyes': msg({
    zh: '返还染剂',
    en: 'Returned dyes',
    ja: '返却染料',
    ko: '반환 염료'
  }),
  'nsarmoire.hint.replicaRecycle.noReturnedDyes': msg({
    zh: '无染剂返还',
    en: 'No dyed colors to return',
    ja: '返却される染料なし',
    ko: '반환될 염료 없음'
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
    zh: draft('当前导入的数据没有触发收藏柜、套装幻影化、可交易、重复物品或同模型提示。'),
    en: 'The current import did not trigger armoire, glamour-set, tradable item, duplicate item, or duplicate model hints.',
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
  'nsarmoire.hint.storeRelated': msg({
    zh: '商城相关',
    en: 'Store-related',
    ja: 'ストア関連',
    ko: '상점 관련'
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
  'nsarmoire.ignoredItems.empty': msg({
    zh: '当前角色还没有忽略任何装备。',
    en: 'No gear is ignored for the current character.',
    ja: '現在のキャラクターで除外中の装備はありません。',
    ko: '현재 캐릭터에서 무시한 장비가 없습니다.'
  }),
  'nsarmoire.ignoredItems.context': msg({
    zh: '不参与清理建议',
    en: 'Excluded from cleanup suggestions',
    ja: '整理提案から除外',
    ko: '정리 제안에서 제외됨'
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
    zh: '导入已有数据',
    en: 'Import existing data',
    ja: '既存データをインポート',
    ko: '기존 데이터 가져오기'
  }),
  'nsarmoire.action.clearSnapshot': msg({
    zh: '清空',
    en: 'Clear',
    ja: 'クリア',
    ko: '지우기'
  }),
  'nsarmoire.action.downloadHelper': msg({
    zh: '下载管家',
    en: 'Download helper',
    ja: 'ヘルパーをダウンロード',
    ko: '헬퍼 다운로드'
  }),
  'nsarmoire.action.downloadHelperShort': msg({
    zh: '下载',
    en: 'Download',
    ja: 'ダウンロード',
    ko: '다운로드'
  }),
  'nsarmoire.action.connectHelper': msg({
    zh: '连接管家',
    en: 'Connect helper',
    ja: 'ヘルパーに接続',
    ko: '헬퍼 연결'
  }),
  'nsarmoire.action.selectHelperProcess': msg({
    zh: '选择进程',
    en: 'Select process',
    ja: 'プロセスを選択',
    ko: '프로세스 선택'
  }),
  'nsarmoire.action.clearRetainerCache': msg({
    zh: '清雇员缓存',
    en: 'Clear retainer cache',
    ja: 'リテイナーキャッシュをクリア',
    ko: '고용인 캐시 지우기'
  }),
  'nsarmoire.action.openHuijiWiki': msg({
    zh: '跳转灰机wiki',
    en: 'Open Huiji Wiki',
    ja: 'Huiji Wikiを開く',
    ko: 'Huiji Wiki 열기'
  }),
  'nsarmoire.action.ignoreCleanupItem': msg({
    zh: '忽略该装备的清理建议',
    en: 'Ignore cleanup suggestions for this gear',
    ja: 'この装備を整理提案から除外',
    ko: '이 장비의 정리 제안 무시'
  }),
  'nsarmoire.action.unignoreCleanupItem': msg({
    zh: '取消忽略',
    en: 'Stop ignoring',
    ja: '除外解除',
    ko: '무시 해제'
  }),
  'nsarmoire.action.clearIgnoredItems': msg({
    zh: '清空忽略',
    en: 'Clear ignored gear',
    ja: '除外リストをクリア',
    ko: '무시 목록 비우기'
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
    zh: 'snapshot 的 dyes 字段记录当前染色；清染色风险按收纳目标判断。',
    en: 'snapshot.dyes records current dyes. Dye-clearing risk is determined by the target storage.',
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
    zh: '清除当前染色',
    en: 'Clears current dyes',
    ja: 'キャビネット収納は染色を消します',
    ko: '보관함 보관은 염색을 지웁니다'
  }),
  'nsarmoire.dyeReset.glamourSetBasket': msg({
    zh: '清除当前染色',
    en: 'Clears current dyes',
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
  'nsarmoire.dyePreference.categories': msg({
    zh: '染剂分类',
    en: 'Dye categories',
    ja: '染料カテゴリ',
    ko: '염료 분류'
  }),
  'nsarmoire.dyePreference.storeSpecial': msg({
    zh: '商城染剂',
    en: 'Store dyes',
    ja: 'ストア染料',
    ko: '상점 염료'
  }),
  'nsarmoire.dyeCategory.general': msg({
    zh: '普通染剂',
    en: 'Normal dyes',
    ja: '汎用',
    ko: '일반'
  }),
  'nsarmoire.dyeCategory.extra1': msg({
    zh: '追加染剂1',
    en: 'Extra dye 1',
    ja: '追加1',
    ko: '추가1'
  }),
  'nsarmoire.dyeCategory.extra2': msg({
    zh: '追加染剂2',
    en: 'Extra dye 2',
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
    zh: '等待数据中……',
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
    zh: '静态 catalog',
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
    zh: '衣柜管家未连接',
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
    zh: draft('从 GitHub Release 下载并启动 NSArmoire 本地助手后，可以直接读取投影台 snapshot。'),
    en: 'Download and start the NSArmoire local helper from GitHub Releases to read the glamour dresser snapshot directly.',
    ja: 'GitHub ReleasesからNSArmoireローカルヘルパーをダウンロードして起動すると、ミラージュドレッサーsnapshotを直接読み取れます。',
    ko: 'GitHub Releases에서 NSArmoire 로컬 헬퍼를 다운로드해 시작하면 투영대 snapshot을 직접 읽을 수 있습니다.'
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
    zh: '物品目录',
    en: 'Item catalog',
    ja: 'アイテムカタログ',
    ko: '아이템 catalog'
  }),
  'nsarmoire.metric.catalogCabinetItems': msg({
    zh: '收藏柜目录',
    en: 'Armoire catalog',
    ja: 'キャビネットカタログ',
    ko: '보관함 catalog'
  }),
  'nsarmoire.metric.catalogSets': msg({
    zh: '套装目录',
    en: 'Set catalog',
    ja: 'セットカタログ',
    ko: '세트 catalog'
  }),
  'nsarmoire.metric.catalogModelGroups': msg({
    zh: '同模型目录',
    en: 'Model groups',
    ja: '同一モデルカタログ',
    ko: '동일 모델 catalog'
  }),
  'nsarmoire.metric.catalogDyes': msg({
    zh: '染剂目录',
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
  'nsarmoire.field.readContainersMore': msg({
    zh: '{items} 等 {count} 项',
    en: '{items}, and {count} total',
    ja: '{items} など合計 {count} 項目',
    ko: '{items} 등 총 {count}개'
  }),
  'nsarmoire.field.readStatus.read': msg({
    zh: '已读取',
    en: 'Read',
    ja: '読み取り済み',
    ko: '읽음'
  }),
  'nsarmoire.field.readStatus.unread': msg({
    zh: '未读取',
    en: 'Unread',
    ja: '未読み取り',
    ko: '읽지 않음'
  }),
  'nsarmoire.field.detectedRetainers': msg({
    zh: '检测到 {count} 个雇员',
    en: '{count} retainers detected',
    ja: 'リテイナー {count} 人を検出',
    ko: '고용인 {count}명 감지'
  }),
  'nsarmoire.field.retainerIndex': msg({
    zh: '雇员 {index}',
    en: 'Retainer {index}',
    ja: 'リテイナー {index}',
    ko: '고용인 {index}'
  }),
  'nsarmoire.field.basicStorageProgress': msg({
    zh: '基础收纳',
    en: 'Core storage',
    ja: '基本収納',
    ko: '기본 보관'
  }),
  'nsarmoire.field.retainerProgress': msg({
    zh: '雇员',
    en: 'Retainers',
    ja: 'リテイナー',
    ko: '고용인'
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
    zh: '本机保存每个角色最近一次读取的数据，点击切换会载入对应角色。',
    en: 'The latest snapshot for each character is stored locally. Switch to load that character.',
    ja: '各キャラクターの最新スナップショットをローカル保存します。切替で読み込みます。',
    ko: '각 캐릭터의 최신 스냅샷을 로컬에 저장합니다. 전환하면 해당 캐릭터를 불러옵니다.'
  }),
  'nsarmoire.character.localProfile.empty': msg({
    zh: '还没有本地角色档案。',
    en: 'No local character profiles yet.',
    ja: 'ローカルキャラクタープロフィールはまだありません。',
    ko: '아직 로컬 캐릭터 프로필이 없습니다.'
  }),
  'nsarmoire.character.localProfile.current': msg({
    zh: '当前',
    en: 'Current',
    ja: '現在',
    ko: '현재'
  }),
  'nsarmoire.character.localProfile.switch': msg({
    zh: '切换',
    en: 'Switch',
    ja: '切替',
    ko: '전환'
  }),
  'nsarmoire.character.localProfile.switching': msg({
    zh: '切换中',
    en: 'Switching',
    ja: '切替中',
    ko: '전환 중'
  }),
  'nsarmoire.character.localProfile.delete': msg({
    zh: '删除本地缓存',
    en: 'Delete local cache',
    ja: 'ローカルキャッシュを削除',
    ko: '로컬 캐시 삭제'
  }),
  'nsarmoire.character.localProfile.deleting': msg({
    zh: '删除中',
    en: 'Deleting',
    ja: '削除中',
    ko: '삭제 중'
  }),
  'nsarmoire.character.localProfile.loading': msg({
    zh: '正在读取本地角色缓存。',
    en: 'Reading local character cache.',
    ja: 'ローカルキャラクターキャッシュを読み込み中です。',
    ko: '로컬 캐릭터 캐시를 읽는 중입니다.'
  }),
  'nsarmoire.character.localProfile.error': msg({
    zh: '本地角色缓存读取失败。',
    en: 'Failed to read local character cache.',
    ja: 'ローカルキャラクターキャッシュの読み込みに失敗しました。',
    ko: '로컬 캐릭터 캐시를 읽지 못했습니다.'
  }),
  'nsarmoire.character.localProfile.unavailable': msg({
    zh: '浏览器本地角色缓存不可用。当前页面仍可使用，但角色切换不会保存。',
    en: 'Local character cache is unavailable. This page still works, but character switching will not be saved.',
    ja: 'ブラウザーのローカルキャラクターキャッシュを利用できません。このページは使用できますが、キャラクター切替は保存されません。',
    ko: '브라우저 로컬 캐릭터 캐시를 사용할 수 없습니다. 현재 페이지는 사용할 수 있지만 캐릭터 전환은 저장되지 않습니다.'
  }),
  'nsarmoire.character.localProfile.cachedAt': msg({
    zh: '本机缓存时间',
    en: 'Cached locally',
    ja: 'ローカル保存日時',
    ko: '로컬 캐시 시간'
  }),
  'nsarmoire.character.localProfile.count': msg({
    zh: '本机已保存 {count} 个角色',
    en: '{count} characters saved locally',
    ja: '{count} キャラクターをローカル保存済み',
    ko: '로컬에 {count}개 캐릭터 저장됨'
  }),
  'nsarmoire.character.localProfile.switchSuccess': msg({
    zh: '已切换到本地角色缓存。',
    en: 'Switched to the local character cache.',
    ja: 'ローカルキャラクターキャッシュに切り替えました。',
    ko: '로컬 캐릭터 캐시로 전환했습니다.'
  }),
  'nsarmoire.character.localProfile.deleteSuccess': msg({
    zh: '已删除这份本地角色缓存。',
    en: 'Deleted this local character cache.',
    ja: 'このローカルキャラクターキャッシュを削除しました。',
    ko: '이 로컬 캐릭터 캐시를 삭제했습니다.'
  }),
  'nsarmoire.character.localProfile.deleteCurrentSuccess': msg({
    zh: '已删除当前角色的本地缓存；当前页面数据会保留到切换或清空。',
    en: 'Deleted the current character cache. Current page data remains until you switch or clear it.',
    ja: '現在のキャラクターキャッシュを削除しました。現在のページデータは切替またはクリアまで保持されます。',
    ko: '현재 캐릭터 캐시를 삭제했습니다. 현재 페이지 데이터는 전환하거나 비울 때까지 유지됩니다.'
  }),
  'nsarmoire.character.localProfile.clearCurrent': msg({
    zh: '清空当前页面数据',
    en: 'Clear current page data',
    ja: '現在のページデータをクリア',
    ko: '현재 페이지 데이터 비우기'
  }),
  'nsarmoire.character.localProfile.clearCurrentSuccess': msg({
    zh: '已清空当前页面数据；本地角色缓存仍保留。',
    en: 'Cleared the current page data. Local character caches remain saved.',
    ja: '現在のページデータをクリアしました。ローカルキャラクターキャッシュは保持されます。',
    ko: '현재 페이지 데이터를 비웠습니다. 로컬 캐릭터 캐시는 유지됩니다.'
  }),
  'nsarmoire.character.retainerFallback': msg({
    zh: '雇员 {count}',
    en: '{count} retainers',
    ja: 'リテイナー {count}',
    ko: '고용인 {count}명'
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
  'nsarmoire.container.retainerInventory': msg({
    zh: '雇员背包',
    en: 'Retainer inventory',
    ja: 'リテイナー所持品',
    ko: '고용인 가방'
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
  })
}

export default armoireUiMessages
