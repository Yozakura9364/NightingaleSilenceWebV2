# Silence 角色资料 Schema 草案

## 目的

本文件用于把用户现有的 wiki 角色笔记整理成 V2 可维护的数据结构。当前样例来自用户在对话中粘贴的 `用户笔记:沙乐万【Silence】` wiki 源码片段；由于灰机 wiki 页面外部访问会返回 `403 Forbidden`，本文件不依赖自动抓取。

本文件记录资料结构和迁移样例。当前 Salvance 首版资料已经迁移到 `src/data/silence/characterProfiles.ts` 并用于详情页渲染；文档中的样例仍作为来源对照和后续字段扩展参考。

## 资料接入规则

- 角色正式文案必须来自用户提供或确认的资料；AI 只做结构化、归类、去重和待确认标记。
- wiki 中的 `File:` 文件名只能作为来源引用，不能自动当作项目公开图片路径。
- 用户未明确声明可以提交/公开的 `.png`、`.jpg`、`.jpeg`、`.webp` 不得进入构建产物。
- 渲染到 Vue 页面前，固定 UI 文案仍走本地化 key；角色内容可以先按中文源资料维护，未来如需多语言再拆本地化内容层。
- `∅` 需要单独确认含义：是“刻意为空/不存在”，还是“暂不公开/未知”。不要擅自隐藏。
- 剧透内容必须有 `spoilerLevel` 和默认折叠策略，不能直接在首屏暴露。

## 建议数据分层

当前已存在：

```text
src/data/silence/
├── characterSeeds.ts          # id / 名字 / 代表色 / dev-only 立绘路径
├── characterProfiles.ts       # 用户确认资料的结构化档案，当前先接 Salvance
├── characterForms.ts          # 角色形态数据，当前先接 Salvance 的 base / sorence
├── draftCharacterContent.ts   # 占位资料骨架
├── characters.ts              # 类型、组装、查询 helper
└── navigation.ts              # 横向翻页顺序
```

职责建议：

- `characterSeeds.ts`：只放角色身份种子和开发预览资产路径。
- `characterProfiles.ts`：放用户确认可公开的正式角色资料。
- `draftCharacterContent.ts`：只保留占位模板，不混入正式设定。
- `characters.ts`：根据 seed + profile 组装给页面使用的数据。

## Schema 草案

```ts
interface SilenceCharacterProfileSource {
  kind: 'wiki-paste' | 'manual' | 'future-cms'
  title?: string
  url?: string
  capturedAt?: string
}

interface SilenceCharacterNames {
  zh: string
  ja?: string
  en?: string
  fullName?: string
  aliases: string[]
  title?: string
  titleEn?: string
  nickname?: string
}

interface SilenceCharacterProfileFact {
  id: string
  label: string
  value: string
  visibility: 'public' | 'draft' | 'private'
}

interface SilenceCharacterAppearanceSection {
  id: 'physical' | 'expression' | 'clothing' | string
  title: string
  points: string[]
}

interface SilenceCharacterOutfit {
  id: string
  formIds: string[]
  label: string
  description: string
  imageRef?: string
  equipment: string[]
  visibility: 'public' | 'draft' | 'private'
}

interface SilenceCharacterForm {
  id: string
  label: string
  subtitle?: string
  summary: string
  points: string[]
  color?: string
  portraitSrc?: string
  visibility: 'public' | 'draft' | 'private'
}

interface SilenceCharacterProfileDraft {
  id: string
  groupId: 'angel' | 'glitch'
  sourceRefs: SilenceCharacterProfileSource[]
  names: SilenceCharacterNames
  tags: string[]
  ffxivProfile?: {
    modelRace?: string
    gender?: string
    affiliation?: string
    role?: string
    origin?: string
  }
  facts: SilenceCharacterProfileFact[]
  overview: string[]
  appearance: SilenceCharacterAppearanceSection[]
  forms: SilenceCharacterForm[]
  outfits: SilenceCharacterOutfit[]
  combat: string[]
  story: Array<{
    id: string
    title: string
    body: string[]
    spoilerLevel: 'none' | 'light' | 'major'
  }>
  mediaRefs: string[]
  openQuestions: string[]
}
```

## Salvance 样例提取

```yaml
id: salvance
groupId: angel
sourceRefs:
  - kind: wiki-paste
    title: 用户笔记:沙乐万【Silence】
    url: https://ff14.huijiwiki.com/wiki/用户笔记:沙乐万【Silence】
names:
  zh: 沙乐万
  ja: サラヴァンス
  en: Salvance
  aliases: []
  title: 无心天使
  titleEn: Heartless Angel
  nickname: ∅
tags:
  - 光之战士
  - 拂晓血盟
  - 无心天使
ffxivProfile:
  modelRace: 维埃拉族·山林之民
  gender: 男
  affiliation: 拂晓血盟
  role: 光之战士
  origin: 斯卡提山脉
facts:
  - id: nameday
    label: 命名日
    value: ∅
    visibility: public
  - id: height
    label: 身高
    value: 180cm
    visibility: public
  - id: body
    label: 体型
    value: 壮硕的男性身形
    visibility: public
  - id: favoriteFood
    label: 喜欢的食物
    value: ∅
    visibility: public
  - id: likes
    label: 喜欢的东西
    value: ∅
    visibility: public
  - id: dislikes
    label: 讨厌的事情
    value: ∅
    visibility: public
  - id: goal
    label: 目标
    value: ∅
    visibility: public
overview:
  - 光之战士——虽然相当一部分星球居民都不愿意认同自己星球的“英雄”是这种反社会的心理变态。
appearance:
  - id: physical
    title: 外形设定
    points:
      - 亮白色头发，有黑色挑染。
      - 淡漠无情的灰瞳。
      - 不会更换发型。
  - id: expression
    title: 神态设定
    points:
      - 灵魂分裂时被剥夺了一部分权能，没有情感——使用表情：平常。
      - 思考战术时眉头会不自觉皱起——使用表情：认真。
      - 几乎所有人都以为他不会说话，实际是权能被剥夺后，连锁反应导致语言交流也存在障碍——不使用嘴唇动作。
  - id: clothing
    title: 基础衣装倾向
    points:
      - 战斗时会身着神圣的银白骑士装。
      - 服饰给人的感觉常是圣洁的、带有祝福意味的。
      - 会佩戴翼冠宣告自己是世界的守护者，就像天使一样。
      - 大部分服装都是简单的黑白灰金银的组合，他习惯选择最简单地款式。
forms:
  - id: base
    label: 沙乐万
    subtitle: 常态
    summary: 光之战士。
    points: []
    visibility: public
  - id: sorence
    label: 索伦斯
    subtitle: 痛楚 / 异化状态
    summary: 占位用，待编辑
    points: []
    color: "#8f8a9b"
    visibility: draft
outfits:
  - id: canonical
    formIds: [base]
    label: 公式服
    imageRef: File:立绘1-沙乐万.png
    description: 最常穿的骑士服，轻便且易于行动，又有一定程度的附魔能够无效化攻击。
    equipment:
      - 绝境苍穹之剑
      - 英灵的加护
      - 忠骑翼冠
      - 日影兰御敌长衣
      - 日影兰御敌臂甲
      - 日影兰御敌短裙
      - 日影兰御敌长靴
    visibility: public
  - id: advancedBattle
    formIds: [base]
    label: 高阶战斗服
    imageRef: File:立绘2-沙乐万.png
    description: 精锐骑士服，面对强敌时更注重防御力。
    equipment:
      - 绝境苍穹之剑
      - 英灵的加护
      - 美德忠骑翼冠
      - 伪王战甲
      - 伪王手铠
      - 伪王马裤
      - 伪王铠靴
    visibility: public
  - id: formalwear
    formIds: [base]
    label: 正装
    imageRef: File:立绘3-沙乐万.png
    description: 似乎是拂晓血盟的伙伴为他挑选的纯白色礼服。兼顾了正式场合和需要使用武器的突发情况。
    equipment: []
    visibility: draft
  - id: homewear
    formIds: [base]
    label: 家居服
    imageRef: File:立绘4-沙乐万.png
    description: 原本只是把一些简单的贴身衣物当家居服，但后来在南丁格尔的强烈要求下他买了一套新的。
    equipment: []
    visibility: draft
  - id: sorenceDefault
    formIds: [sorence]
    label: 索伦斯
    description: 占位用，待编辑
    equipment: []
    visibility: draft
combat:
  - 没有人能打败他，其极强的战斗素养和薄弱的共情能力让所有人都怀疑他其实是天外来物。
  - 其他人很难与他交流配合，只能在他身后看情况作战。
  - 不明白生命的意义，酿成了许多惨剧，需要拂晓血盟的成员提醒他作为光之战士什么事该做什么事不该做。
  - 主要使用单手剑，这样对他来说就足够了。
  - 不会使用盾牌，也不会使用治愈系术式，不知守护为何物，直到遇见南丁格尔之后才开始有所接触。
story:
  - id: mainExperience
    title: 人物经历
    body:
      - "123"
    spoilerLevel: major
mediaRefs:
  - File:横条-沙乐万.png
  - File:黑白-沙乐万.png
  - File:精修头-沙乐万-400px.png
  - File:昂一-沙乐万-400px.png
  - File:光行-沙乐万-400px.png
  - File:叉烧蘸白糖-沙乐万-400px.png
  - 沙乐万/沙乐万
openQuestions:
  - ∅ 在公开页面中应显示为符号、显示为“无”，还是隐藏该字段？
  - “人物经历”当前只有 123，是否只是占位文本？
  - 正装和家居服装备列表为空，是否需要隐藏装备表，还是保留空槽位？
  - “反社会的心理变态”等评价性文案是否作为公开正式简介保留？
```

已确认：`索伦斯，“痛楚”` 当前按 Salvance 的形态处理，形态 ID 更正为 `sorence`，推荐 URL 为 `#/silence/angel/salvance?form=sorence`。该查询参数只控制详情区“形态”的默认选中状态，不改变首屏角色身份，也不自动切换“衣装设定”的当前衣装。

## 目录角色映射待确认

wiki 顶部目录给出以下中文角色入口：

```text
南丁格尔
古拉齐娜·索特拉
格拉克亚·索特拉
奈伊·弗洛伦斯
羽贺千早
沙乐万
```

当前代码中的 `angel` 顺序是：

```text
goelia
glynne
chihaya
ney
nightingale
salvance
```

已能直接确认：

| id | 中文名 |
|----|--------|
| `nightingale` | 南丁格尔 |
| `chihaya` | 羽贺千早 |
| `ney` | 奈伊·弗洛伦斯 |
| `salvance` | 沙乐万 |

待用户确认：

| id | 可能中文名 |
|----|------------|
| `goelia` | 古拉齐娜·索特拉 或 格拉克亚·索特拉 |
| `glynne` | 古拉齐娜·索特拉 或 格拉克亚·索特拉 |

不要在确认前把这两个映射写死到公开页面。
