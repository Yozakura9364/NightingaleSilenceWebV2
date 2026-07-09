import type { SilenceCharacterProfileContent } from '@/data/silence/characters'

const salvanceProfile: SilenceCharacterProfileContent = {
  sourceRefs: [
    {
      kind: 'wiki-paste',
      title: '用户笔记:沙乐万【Silence】',
      url: 'https://ff14.huijiwiki.com/wiki/用户笔记:沙乐万【Silence】'
    }
  ],
  sections: {
    overview: '人物概览',
    basic: '基本设定',
    forms: '形态',
    outfits: '衣装设定',
    combat: '战斗能力',
    story: '人物经历'
  },
  names: {
    zh: '沙乐万',
    ja: 'サラヴァンス',
    en: 'Salvance',
    aliases: ['沙乐万', 'サラヴァンス', '无心天使 / Heartless Angel'],
    title: '无心天使',
    titleEn: 'Heartless Angel',
    nickname: '∅'
  },
  overview: [
    '光之战士——虽然相当一部分星球居民都不愿意认同自己星球的“英雄”是这种反社会的心理变态。'
  ],
  facts: [
    { id: 'zhName', label: '中文名', value: '沙乐万', visibility: 'public' },
    { id: 'jaName', label: '日文名', value: 'サラヴァンス', visibility: 'public' },
    { id: 'enName', label: '英文名', value: 'Salvance', visibility: 'public' },
    { id: 'modelRace', label: '模型数据种族', value: '维埃拉族·山林之民', visibility: 'public' },
    { id: 'gender', label: '性别', value: '男', visibility: 'public' },
    { id: 'affiliation', label: '所属', value: '拂晓血盟', visibility: 'public' },
    { id: 'identity', label: '身份', value: '光之战士', visibility: 'public' },
    { id: 'title', label: '称号', value: '无心天使 Heartless Angel', visibility: 'public' },
    { id: 'nickname', label: '昵称', value: '∅', visibility: 'public' },
    { id: 'favoriteFood', label: '喜欢的食物', value: '∅', visibility: 'public' },
    { id: 'likes', label: '喜欢的东西', value: '∅', visibility: 'public' },
    { id: 'dislikes', label: '讨厌的事情', value: '∅', visibility: 'public' },
    { id: 'goal', label: '目标', value: '∅', visibility: 'public' },
    { id: 'origin', label: '出身', value: '斯卡提山脉', visibility: 'public' },
    { id: 'nameday', label: '命名日', value: '∅', visibility: 'public' },
    { id: 'height', label: '身高', value: '180cm', visibility: 'public' },
    { id: 'body', label: '体型', value: '壮硕的男性身形', visibility: 'public' }
  ],
  appearance: [
    {
      id: 'physical',
      title: '外形设定',
      points: ['亮白色头发，有黑色挑染。', '淡漠无情的灰瞳。', '不会更换发型。']
    },
    {
      id: 'expression',
      title: '神态设定',
      points: [
        '灵魂分裂时被剥夺了一部分权能，没有情感——使用表情：平常。',
        '思考战术时眉头会不自觉皱起——使用表情：认真。',
        '几乎所有人都以为他不会说话，实际是权能被剥夺后，连锁反应导致语言交流也存在障碍——不使用嘴唇动作。'
      ]
    },
    {
      id: 'clothing',
      title: '服装设定',
      points: [
        '战斗时会身着神圣的银白骑士装。',
        '服饰给人的感觉常是圣洁的、带有祝福意味的。',
        '会佩戴翼冠宣告自己是世界的守护者，就像天使一样。',
        '大部分服装都是简单的黑白灰金银的组合，他习惯选择最简单地款式。'
      ]
    }
  ],
  outfits: [
    {
      id: 'canonical',
      formIds: ['base'],
      label: '公式服',
      imageRef: 'File:立绘1-沙乐万.png',
      description: '最常穿的骑士服，轻便且易于行动，又有一定程度的附魔能够无效化攻击。',
      equipment: [
        '绝境苍穹之剑',
        '英灵的加护',
        '忠骑翼冠',
        '日影兰御敌长衣',
        '日影兰御敌臂甲',
        '日影兰御敌短裙',
        '日影兰御敌长靴'
      ],
      visibility: 'public'
    },
    {
      id: 'advanced-battle',
      formIds: ['base'],
      label: '高阶战斗服',
      imageRef: 'File:立绘2-沙乐万.png',
      description: '精锐骑士服，面对强敌时更注重防御力。',
      equipment: [
        '绝境苍穹之剑',
        '英灵的加护',
        '美德忠骑翼冠',
        '伪王战甲',
        '伪王手铠',
        '伪王马裤',
        '伪王铠靴'
      ],
      visibility: 'public'
    },
    {
      id: 'formalwear',
      formIds: ['base'],
      label: '正装',
      imageRef: 'File:立绘3-沙乐万.png',
      description: '似乎是拂晓血盟的伙伴为他挑选的纯白色礼服。兼顾了正式场合和需要使用武器的突发情况。',
      equipment: [],
      visibility: 'draft'
    },
    {
      id: 'homewear',
      formIds: ['base'],
      label: '家居服',
      imageRef: 'File:立绘4-沙乐万.png',
      description: '原本只是把一些简单的贴身衣物当家居服，但后来在南丁格尔的强烈要求下他买了一套新的。',
      equipment: [],
      visibility: 'draft'
    },
    {
      id: 'sorence-default',
      formIds: ['sorence'],
      label: '索伦斯',
      description: '',
      equipment: [],
      visibility: 'draft'
    }
  ],
  combat: [
    '没有人能打败他，其极强的战斗素养和薄弱的共情能力让所有人都怀疑他其实是天外来物。',
    '其他人很难与他交流配合，只能在他身后看情况作战。',
    '不明白生命的意义，酿成了许多惨剧，需要拂晓血盟的成员提醒他作为光之战士什么事该做什么事不该做。',
    '主要使用单手剑，这样对他来说就足够了。',
    '不会使用盾牌，也不会使用治愈系术式，不知守护为何物，直到遇见南丁格尔之后才开始有所接触。'
  ],
  story: [
    {
      id: 'main-experience',
      title: '人物经历',
      body: ['123'],
      spoilerLevel: 'major',
      visibility: 'draft'
    }
  ],
  mediaRefs: [
    'File:横条-沙乐万.png',
    'File:黑白-沙乐万.png',
    'File:精修头-沙乐万-400px.png',
    'File:昂一-沙乐万-400px.png',
    'File:光行-沙乐万-400px.png',
    'File:叉烧蘸白糖-沙乐万-400px.png',
    '沙乐万/沙乐万'
  ]
}

const characterProfileContentById: Partial<Record<string, SilenceCharacterProfileContent>> = {
  salvance: salvanceProfile
}

export function getSilenceCharacterProfileContent(
  characterId: string
): SilenceCharacterProfileContent | undefined {
  return characterProfileContentById[characterId]
}
