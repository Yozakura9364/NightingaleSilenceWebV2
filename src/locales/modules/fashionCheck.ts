import type { UiMessageMap } from '@/locales/types'

const message = (
  zh: string,
  en: string
): Record<'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de', string> => ({
  'zh-CN': zh,
  en,
  ja: zh,
  ko: zh,
  fr: en,
  de: en
})

const localizedMessage = (
  zh: string,
  en: string,
  ja: string,
  ko: string
): Record<'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de', string> => ({
  'zh-CN': zh,
  en,
  ja,
  ko,
  fr: en,
  de: en
})

export const fashionCheckUiMessages: UiMessageMap = {
  'fashionCheck.title': message('时尚品鉴', 'Fashion Check'),
  'fashionCheck.theme': message('本周主题', 'Theme'),
  'fashionCheck.target80': message('目标 80 分', '80-point target'),
  'fashionCheck.gold': message('金牌', 'Gold'),
  'fashionCheck.exactDye': message('精确染色 +2', 'Exact dye +2'),
  'fashionCheck.verified': message('已验证分值', 'Verified score'),
  'fashionCheck.loading': message('正在读取当前周数据', 'Loading current week'),
  'fashionCheck.unavailable': message('当前周数据尚未公开', 'Current week data is unavailable'),
  'fashionCheck.solutions': message('本周方案', 'Weekly solutions'),
  'fashionCheck.goldItems': message('金牌物品', 'Gold items'),
  'fashionCheck.anyTwoGold': message('任意两件金牌', 'Any two gold pieces'),
  'fashionCheck.allGold': message('四件金牌', 'Four gold pieces'),
  'fashionCheck.target100': message('100 分方案', '100-point solution'),
  'fashionCheck.goldWithDye': message('一件金牌 + 两处精确染色', 'One gold piece + two exact dyes'),
  'fashionCheck.noDye': message('不计染色', 'No dye bonus'),
  'fashionCheck.dyeWeapon': localizedMessage('武器', 'Weapon', '武器', '무기'),
  'fashionCheck.dyeHead': localizedMessage('头部', 'Head', '頭防具', '머리'),
  'fashionCheck.dyeBody': localizedMessage('身体', 'Body', '胴防具', '몸통'),
  'fashionCheck.dyeHands': localizedMessage('手部', 'Hands', '手防具', '손'),
  'fashionCheck.dyeLegs': localizedMessage('腿部', 'Legs', '脚防具', '다리'),
  'fashionCheck.dyeFeet': localizedMessage('脚部', 'Feet', '足防具', '발'),
  'fashionCheck.views': message('时尚品鉴视图', 'Fashion Check views'),
  'fashionCheck.tabSolutions': message('本周作业', 'Weekly solutions'),
  'fashionCheck.tabGoldSearch': localizedMessage(
    '金牌查询',
    'Gold search',
    'ゴールド検索',
    '금메달 검색'
  ),
  'fashionCheck.tabSources': message('数据来源', 'Sources'),
  'fashionCheck.sources': message('数据来源', 'Sources'),
  'fashionCheck.sourcesUnavailable': message('数据来源暂不可用', 'Sources are unavailable'),
  'fashionCheck.referenceTitle': message(
    '第 {issue} 期临时展示',
    'Week {issue} temporary showcase'
  ),
  'fashionCheck.dyeGuide': message('全部位染色', 'Full-slot dyes'),
  'fashionCheck.providedBy': localizedMessage('提供者：', 'Provided by:', '提供：', '제공:'),
  'fashionCheck.solution80Title': message('80分作业', '80-point solution'),
  'fashionCheck.solution100Title': message('100分作业', '100-point solution'),
  'fashionCheck.solutionOptionOne': localizedMessage('方案 1', 'Option 1', 'プラン1', '방법 1'),
  'fashionCheck.solutionOptionTwo': localizedMessage('方案 2', 'Option 2', 'プラン2', '방법 2'),
  'fashionCheck.solution80SixDyes': localizedMessage(
    '六个精准染色',
    'Six exact dyes',
    '6部位を指定色で染色',
    '6부위를 정확한 색으로 염색'
  ),
  'fashionCheck.solution80GoldAndDyes': localizedMessage(
    '胸/手/腿/脚任意一件亚拉戈高位 + 两个精准染色',
    'Any one High Allagan body, hands, legs, or feet piece + two exact dyes',
    'ハイアラガンの胴・手・脚・足装備から1点 + 2部位を指定色で染色',
    '상급 알라그 몸통/손/다리/발 장비 중 1개 + 2부위를 정확한 색으로 염색'
  ),
  'fashionCheck.anyDyeableWeapon': localizedMessage(
    '任意可染色武器',
    'Any dyeable weapon',
    '染色可能な武器',
    '염색 가능한 무기'
  ),
  'fashionCheck.anyDyeableHead': localizedMessage(
    '任意可染色头部装备',
    'Any dyeable head gear',
    '染色可能な頭防具',
    '염색 가능한 머리 방어구'
  ),
  'fashionCheck.anyDyeableBody': localizedMessage(
    '任意可染色身体装备',
    'Any dyeable body gear',
    '染色可能な胴防具',
    '염색 가능한 몸통 방어구'
  ),
  'fashionCheck.anyDyeableHands': localizedMessage(
    '任意可染色手部装备',
    'Any dyeable hand gear',
    '染色可能な手防具',
    '염색 가능한 손 방어구'
  ),
  'fashionCheck.anyDyeableLegs': localizedMessage(
    '任意可染色腿部装备',
    'Any dyeable leg gear',
    '染色可能な脚防具',
    '염색 가능한 다리 방어구'
  ),
  'fashionCheck.anyDyeableFeet': localizedMessage(
    '任意可染色脚部装备',
    'Any dyeable foot gear',
    '染色可能な足防具',
    '염색 가능한 발 방어구'
  ),
  'fashionCheck.dyeFamilyBlack': localizedMessage(
    '黑色系',
    'Black dyes',
    'ブラック系',
    '검은색 계열'
  ),
  'fashionCheck.dyeFamilyRed': localizedMessage('红色系', 'Red dyes', 'レッド系', '붉은색 계열'),
  'fashionCheck.dyeFamilyBrown': localizedMessage(
    '棕色系',
    'Brown dyes',
    'ブラウン系',
    '갈색 계열'
  ),
  'fashionCheck.dyeFamilyGreen': localizedMessage(
    '绿色系',
    'Green dyes',
    'グリーン系',
    '초록색 계열'
  ),
  'fashionCheck.dyeFamilyBlue': localizedMessage('蓝色系', 'Blue dyes', 'ブルー系', '파란색 계열'),
  'fashionCheck.openHuijiWiki': localizedMessage(
    '打开灰机 Wiki',
    'Open Huiji Wiki',
    '灰機Wikiを開く',
    '회색기 Wiki 열기'
  ),
  'fashionCheck.tagDatabase.search': localizedMessage(
    '搜索标签',
    'Search tags',
    'テーマを検索',
    '주제 검색'
  ),
  'fashionCheck.tagDatabase.allSlots': localizedMessage(
    '全部部位',
    'All slots',
    '全部位',
    '모든 부위'
  ),
  'fashionCheck.tagDatabase.loading': localizedMessage(
    '正在读取金牌查询数据',
    'Loading gold search data',
    'ゴールド検索データを読み込み中',
    '금메달 검색 데이터 불러오는 중'
  ),
  'fashionCheck.tagDatabase.unavailable': localizedMessage(
    '金牌查询暂不可用',
    'Gold search is unavailable',
    'ゴールド検索を利用できません',
    '금메달 검색을 사용할 수 없습니다'
  ),
  'fashionCheck.tagDatabase.noResults': localizedMessage(
    '没有符合条件的标签',
    'No matching tags',
    '条件に一致するテーマがありません',
    '조건에 맞는 주제가 없습니다'
  ),
  'fashionCheck.tagDatabase.selectTag': localizedMessage(
    '选择标签',
    'Select a tag',
    'テーマを選択',
    '주제 선택'
  ),
  'fashionCheck.tagDatabase.slotFilter': localizedMessage(
    '筛选部位',
    'Filter by slot',
    '部位で絞り込み',
    '부위 필터'
  ),
  'fashionCheck.slotEars': localizedMessage('耳部', 'Earrings', '耳飾り', '귀걸이'),
  'fashionCheck.slotNeck': localizedMessage('颈部', 'Necklace', '首飾り', '목걸이'),
  'fashionCheck.slotWrists': localizedMessage('手腕', 'Bracelets', '腕輪', '팔찌'),
  'fashionCheck.slotRing': localizedMessage('戒指', 'Ring', '指輪', '반지'),
  'fashionCheck.faq': message('FAQ', 'FAQ'),
  'fashionCheck.faqAttemptsQuestion': localizedMessage(
    '每周可以参加几次？',
    'How many times can I enter each week?',
    '毎週何回参加できますか？',
    '매주 몇 번 참가할 수 있나요?'
  ),
  'fashionCheck.faqAttemptsAnswer': localizedMessage(
    '每周最多接受 4 次评审。',
    'You can be judged up to four times each week.',
    '毎週4回まで採点を受けられます。',
    '매주 최대 4회 심사를 받을 수 있습니다.'
  ),
  'fashionCheck.faqParticipationRewardQuestion': localizedMessage(
    '参加评审有什么基础奖励？',
    'What is the participation reward?',
    '参加報酬は何ですか？',
    '참가 보상은 무엇인가요?'
  ),
  'fashionCheck.faqParticipationRewardAnswer': localizedMessage(
    '每周首次参加可获得 10,000 金碟币。',
    'Your first judging each week awards 10,000 MGP.',
    '毎週初回の参加で10,000 MGPを獲得できます。',
    '매주 첫 심사 참가 시 10,000 MGP를 받을 수 있습니다.'
  ),
  'fashionCheck.faq80RewardQuestion': localizedMessage(
    '达到 80 分有什么奖励？',
    'What do I receive for scoring 80 points?',
    '80点を取ると何がもらえますか？',
    '80점을 달성하면 무엇을 받나요?'
  ),
  'fashionCheck.faq80RewardAnswer': localizedMessage(
    '达到 80 分可额外获得 50,000 金碟币。参加奖励和 80 分奖励每周各领取一次。',
    'Scoring 80 points awards an additional 50,000 MGP. The participation and 80-point rewards can each be claimed once per week.',
    '80点を取ると、追加で50,000 MGPを獲得できます。参加報酬と80点報酬は、それぞれ週に1回だけ受け取れます。',
    '80점을 달성하면 50,000 MGP를 추가로 받을 수 있습니다. 참가 보상과 80점 보상은 각각 주 1회만 받을 수 있습니다.'
  ),
  'fashionCheck.faq80RequirementsQuestion': localizedMessage(
    '怎样比较容易达到 80 分？',
    'What is an easy way to reach 80 points?',
    '80点を取りやすい方法はありますか？',
    '80점을 쉽게 달성하는 방법이 있나요?'
  ),
  'fashionCheck.faq80RequirementsAnswer': localizedMessage(
    '先穿满全部装备栏位，不要留空。通常装备两件符合主题的正确装备即可达到 80 分以上，不需要染色加分。',
    'Fill every equipment slot first. With no empty slots, two correct themed pieces will usually reach at least 80 points without dye bonuses.',
    'まず全装備枠を埋めてください。空き枠がなければ、通常はテーマに合う正解装備を2点着用するだけで、染色加点なしでも80点以上に到達できます。',
    '먼저 모든 장비 칸을 채우세요. 빈칸이 없다면 보통 주제에 맞는 정답 장비 2개만 착용해도 염색 점수 없이 80점 이상을 달성할 수 있습니다.'
  ),
  'fashionCheck.faq100RewardQuestion': localizedMessage(
    '达到 100 分有什么奖励？',
    'What do I receive for scoring 100 points?',
    '100点を取ると何がもらえますか？',
    '100점을 달성하면 무엇을 받나요?'
  ),
  'fashionCheck.faq100RewardAnswer': localizedMessage(
    '首次达到 100 分可获得专属称号；称号只需取得一次。',
    'Reaching 100 points for the first time awards an exclusive title. The title only needs to be earned once.',
    '初めて100点を取ると専用の称号を獲得できます。称号の取得は1回だけで構いません。',
    '처음으로 100점을 달성하면 전용 칭호를 받을 수 있습니다. 칭호는 한 번만 획득하면 됩니다.'
  ),
  'fashionCheck.faqCumulativeQuestion': localizedMessage(
    '累计分数有什么作用？',
    'What are cumulative points used for?',
    '累計点にはどんな意味がありますか？',
    '누적 점수는 어디에 사용되나요?'
  ),
  'fashionCheck.faqCumulativeAnswer': localizedMessage(
    '每周成绩会累计。累计达到 600 分后，可以在霞处购买春意短裤等时尚物品。',
    'Weekly scores accumulate. At 600 cumulative points, fashion items such as Spring Bottoms become available from Kasumi.',
    '毎週の得点は累積されます。累計600点に達すると、カスミからスプリングボトムなどのおしゃれ装備を購入できるようになります。',
    '매주 점수가 누적됩니다. 누적 600점에 도달하면 카스미에게서 스프링 바텀 같은 패션 아이템을 구매할 수 있습니다.'
  ),
  'fashionCheck.faqBonusQuestion': localizedMessage(
    '金碟币奖励可以加成吗？',
    'Can the MGP rewards be increased?',
    'MGP報酬にボーナスは適用されますか？',
    'MGP 보상에 보너스를 적용할 수 있나요?'
  ),
  'fashionCheck.faqBonusAnswer': localizedMessage(
    '部队金碟币加成和金碟币优待券均可提高奖励，但两种效果不能叠加。',
    'Free Company MGP actions and Gold Saucer VIP Cards can increase the reward, but their effects do not stack.',
    'フリーカンパニーのMGP獲得量アップとゴールドソーサー優待券は報酬を増やせますが、効果は重複しません。',
    '자유부대 MGP 보너스와 골드 소서 VIP 카드는 보상을 늘릴 수 있지만, 두 효과는 중첩되지 않습니다.'
  ),
  'fashionCheck.faqFacewearQuestion': localizedMessage(
    '脸饰或眼镜会参与判定吗？',
    'Do facewear or glasses count toward judging?',
    'フェイスアクセサリーや眼鏡は採点対象ですか？',
    '얼굴 장식이나 안경도 심사 대상인가요?'
  ),
  'fashionCheck.faqFacewearAnswer': localizedMessage(
    '会，但必须实际应用为角色当前的脸饰外观后才参与判定。',
    'Yes, but they count only when actually applied as the character\'s current facewear appearance.',
    '対象になりますが、キャラクターの現在のフェイスアクセサリーとして実際に適用されている必要があります。',
    '네. 단, 캐릭터의 현재 얼굴 장식 외형으로 실제 적용된 상태여야 심사에 반영됩니다.'
  ),
  'fashionCheck.awaitingData': message('\u7b49\u5f85\u6570\u636e', 'Awaiting data')
}
