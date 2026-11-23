// 无人岛攻略草稿：AI 依据游戏数据与社区公认机制起草，待维护者逐篇审校后转正。
// 每篇固定为「目标 → 步骤 → 数据页入口链接」，文案为事实性机制说明，不含宣传性措辞。
import { siteRoutes } from '@/config/site'

export interface IslandGuideLink {
  route: string
  label: { zh: string; en: string }
}

export interface IslandGuideEntry {
  id: string
  title: { zh: string; en: string }
  goal: { zh: string; en: string }
  steps: { zh: string; en: string }[]
  links: IslandGuideLink[]
}

export const ISLAND_GUIDES: IslandGuideEntry[] = [
  {
    id: 'leveling',
    title: { zh: '入岛与 1~20 级升级路线', en: 'Getting Started and the Rank 1-20 Route' },
    goal: {
      zh: '把开拓等级升到 20 级，过程中不错过每级的关键解锁。',
      en: 'Reach island rank 20 without missing any rank-critical unlocks.'
    },
    steps: [
      {
        zh: '按「开发等级」页逐级解锁清单推进：先建小岛木屋、开拓工房、屯货仓库与地标，把每级的建筑和升级做完再冲级。',
        en: 'Follow the unlock checklist on the Ranks tab: build the cabin, workshop, granary and landmarks at each rank before pushing XP.'
      },
      {
        zh: '升级所需经验主要来自制作新工具/家具、建筑验收和日常采集；工房长时间运转（挂经验）是稳定来源。',
        en: 'Most XP comes from crafting new tools and furniture, completing buildings, and daily gathering; keeping workshops running is the steady source.'
      },
      {
        zh: '卡级时先检查是否缺工具：石斧 R1、石锤 R3、铲 R5、铜镰 R6、鱼叉 R7、嘴斧 R8、铁斧 R9、钢锤 R13、秘银镐与凿子 R17，解锁等级决定能采什么。',
        en: 'If progress stalls, check your tools: hatchet R1, hammer R3, shovel R5, scythe R6, gig R7, beakaxe R8, iron hatchet R9, steel hammer R13, mythril pickaxe and chisel R17. Tool ranks gate which materials you can gather.'
      }
    ],
    links: [
      { route: siteRoutes.islandRanks, label: { zh: '开发等级', en: 'Ranks' } }
    ]
  },
  {
    id: 'gathering',
    title: { zh: '采集顺序与工具升级优先级', en: 'Gathering Order and Tool Priorities' },
    goal: {
      zh: '用最少的跑路把当前等级能用的素材采齐，并把工具有效升级。',
      en: 'Collect every material your current rank allows with minimal travel, and upgrade tools in the right order.'
    },
    steps: [
      {
        zh: '先在「物品图鉴」按所需工具筛选素材，再打开「岛屿地图」看采集点分布；同一地点的多个素材可共享路线。',
        en: 'Filter materials by required tool in the Codex, then open the Island Map to see gathering spots; materials sharing a spot can be gathered in one run.'
      },
      {
        zh: '优先做能解锁新素材池的工具：R3 石锤（矿石）、R5 铲（黏土/汀砂）、R6 铜镰（甘蔗/棉花/麻）、R7 鱼叉（鱼类）、R8 嘴斧（石英/铁矿）。',
        en: 'Prioritize tools that open new material pools: R3 hammer (ores), R5 shovel (clay/tinsand), R6 scythe (sugarcane/cotton/hemp), R7 gig (fish), R8 beakaxe (quartz/iron).'
      },
      {
        zh: '钢锤 R13 是洞窟采集的门槛；洞窟开放（R12 探查工具）后再补页岩/辉光矿/秘银等高级素材。',
        en: 'The R13 steel hammer gates cave gathering; after the R12 spelunking tools open Mountain Hollow, farm shale, spectrine and mythril there.'
      },
      {
        zh: '工具大多由工房手工配方制作且只需做一次；按「开发等级」页提示满足额外条件（例如铁斧还需 III 级设施与 4 个地标）。',
        en: 'Most tools are one-time handmade recipes; check the Ranks tab for extra requirements (e.g. the iron hatchet also needs tier-III facilities and four landmarks).'
      }
    ],
    links: [
      { route: siteRoutes.islandCodex, label: { zh: '物品图鉴', en: 'Codex' } },
      { route: siteRoutes.islandMap, label: { zh: '岛屿地图', en: 'Island Map' } }
    ]
  },
  {
    id: 'workshop',
    title: { zh: '每周工房思路：周期作业与固定路线怎么选', en: 'Weekly Workshop: Rotation Agendas vs Fixed Routes' },
    goal: {
      zh: '理解人气轮换后，能按本周情况选周期作业或 NGA 岛建固定路线。',
      en: 'Know when to use a rotation agenda versus the fixed NGA island-building routes.'
    },
    steps: [
      {
        zh: '每周二重置后，先到「工房商品」页对照游戏内供需面板，选几件制品的人气档位识别当前轮换行；识别成功即生成本周周期作业。',
        en: 'After Tuesday reset, open Workshop Goods and match a few popularity levels from the in-game board to identify the current rotation row; the rotation agenda is generated from it.'
      },
      {
        zh: '周期作业适合把高人气制品排满：收益估算含人气与干劲加成，但不含随制作变化的供需倍率，实际以游戏内为准。',
        en: 'Rotation agendas prioritize high-popularity items: estimates include popularity and groove, but not supply multipliers that shift as you craft. Verify in-game.'
      },
      {
        zh: '还在岛建阶段（约 5~8 级）时，直接按下方「固定作业（岛建阶段）」的 NGA 参考路线走：组合生产填满 24 小时、每周期作 5 休 2、首周休息日放在工房升级日。',
        en: 'During the island-building phase (roughly ranks 5-8), use the NGA fixed routes below: fill 24h with combo production, work 5 rest 2 each cycle, and put the first week’s rest day on the workshop upgrade day.'
      },
      {
        zh: '每周先确认材料充足（尤其建筑会消耗的材料），排程页的「材料合计」可对照游戏内“材料分配”。',
        en: 'Check materials first, especially those consumed by buildings; the planner’s per-cycle material totals can be compared with the in-game Material Allocation screen.'
      }
    ],
    links: [
      { route: siteRoutes.island, label: { zh: '工房商品', en: 'Workshop Goods' } }
    ]
  },
  {
    id: 'pasture',
    title: { zh: '牧场捕捉速查：时段、天气与位置', en: 'Pasture Catching: Time, Weather and Position' },
    goal: {
      zh: '按当前 ET 时间和天气条件判断哪只稀有动物可以捕捉，减少空跑。',
      en: 'Decide which rare animals are catchable right now from ET time and weather, and avoid wasted trips.'
    },
    steps: [
      {
        zh: '「牧场动物」页顶部有实时 ET 时钟与当前可捕捉数量；每只动物会显示出没时段（ET）、天气条件、岛内坐标和下次出现倒计时。',
        en: 'The Pasture Animals tab shows a live ET clock and catchable count; each animal lists its ET spawn window, weather requirement, coordinates and next-spawn countdown.'
      },
      {
        zh: '体型与产物决定收益：先用图标和稀有度筛出目标动物，再点「在地图上查看」弹出交互地图确认位置。',
        en: 'Size and leavings drive value: filter by icon and rarity, then use “Show on map” to open the interactive map and confirm the location.'
      },
      {
        zh: '捕网/围栏/安眠香对应小/中/大型动物，都是手工配方；成功率更高的完美版本在 20 级解锁。',
        en: 'Nets, restraints and soporifics map to small/medium/large animals and are handmade recipes; the flawless versions with higher catch rate unlock at rank 20.'
      },
      {
        zh: '无人岛天气与艾欧泽亚时间同源：计划捕捉前先看是否处于出没窗口和指定天气，再安排等待。',
        en: 'Check both the spawn window and the required weather before committing to a catch; use the countdown to plan your wait.'
      }
    ],
    links: [
      { route: siteRoutes.islandAnimals, label: { zh: '牧场动物', en: 'Pasture Animals' } },
      { route: siteRoutes.islandMap, label: { zh: '岛屿地图', en: 'Island Map' } }
    ]
  },
  {
    id: 'farming',
    title: { zh: '农田节奏与耕作魔偶自动化', en: 'Farming Rhythm and Mammet Automation' },
    goal: {
      zh: '按固定生长周期安排播种与收获，并用耕作魔偶托管日常农田。',
      en: 'Schedule sowing and harvesting around the fixed growth cycle and let cropworker mammets handle the routine.'
    },
    steps: [
      {
        zh: '每株作物固定 48 小时成熟，每块耕地每次收获 5 个产物；耕地 III 每日满产 100 个。',
        en: 'Every crop matures in 48 hours and each plot yields 5 produce per harvest; Cropland III yields 100 per day at full output.'
      },
      {
        zh: '种子按开拓等级解锁购买：R1 南瓜/甘蓝，R5 欧洲萝卜，R7 起一批蔬果，R11 彩椒/韭葱，R14 与 R18 各一批高级种子。',
        en: 'Seed purchases unlock by rank: R1 pumpkin/cabbage, R5 parsnip, R7 a first wave of produce, R11 leek/paprika, and higher tiers at R14 and R18.'
      },
      {
        zh: 'R7 取得耕作/畜牧魔偶工具后（需 III 级设施），把日常播种、浇水、收获交给魔偶，自己只补种子和收材料。',
        en: 'After the R7 cropworker and pastureworker tools (tier-III facilities required), hand sowing, watering and harvesting to mammets; you only restock seeds and collect materials.'
      },
      {
        zh: '工房需要大量特定作物时，优先保持该地块连续种植；魔偶托管时检查产物是否被仓库存满。',
        en: 'When workshops need a steady crop, keep that plot continuously planted; while automated, watch for the granary filling up.'
      }
    ],
    links: [
      { route: siteRoutes.islandCodex, label: { zh: '物品图鉴 · 农田作物', en: 'Codex · Crops' } },
      { route: siteRoutes.islandRanks, label: { zh: '开发等级', en: 'Ranks' } }
    ]
  },
  {
    id: 'granary',
    title: { zh: '谷仓远征与素材池', en: 'Granary Expeditions and the Material Pool' },
    goal: {
      zh: '用谷仓远征补充稀有素材，并知道每个目的地可能带回什么。',
      en: 'Use granary expeditions to stock rare materials, and know what each destination can bring back.'
    },
    steps: [
      {
        zh: '屯货仓库建成后开启远征：派出魔偶去草原、溪流、森林、沙滩、山与洞窟，按目的地回收候选素材。',
        en: 'Build the granary to unlock expeditions: send mammets to the plains, river, forest, beach, mountains and hollow to bring back destination-specific materials.'
      },
      {
        zh: '每个目的地有固定稀有素材：香荠、石榴石原石、云杉原木、锤头鲨、银矿、长臂虾，按需选择远征地点。',
        en: 'Each destination has a signature rare material: alyssum, raw garnet, spruce log, hammerhead, silver ore and cave shrimp. Pick destinations by what you need.'
      },
      {
        zh: '「物品图鉴 · 谷仓远征」分组列出各地候选与稀有素材，可对照工房配方缺料再决定远征目标。',
        en: 'The Codex “Granary Expeditions” section lists candidates and rare drops per destination; cross-check against workshop material gaps before dispatching.'
      },
      {
        zh: '远征时长、每次数量与概率不在客户端数据中，页面不展示这些数值；需要精确收益时以游戏内结算为准。',
        en: 'Expedition duration, quantities and probabilities are not in the client data and are not shown here; check in-game results for exact yields.'
      }
    ],
    links: [
      { route: siteRoutes.islandCodex, label: { zh: '物品图鉴 · 谷仓远征', en: 'Codex · Granary Expeditions' } }
    ]
  },
  {
    id: 'rewards',
    title: { zh: '货币使用与奖励兑换优先级', en: 'Cowrie Spending and Reward Priorities' },
    goal: {
      zh: '合理分配青船币与绿岛币，优先换对进度最有帮助的奖励。',
      en: 'Spend Seafarer’s and Islander’s cowries wisely, prioritizing rewards that help progression most.'
    },
    steps: [
      {
        zh: '青船币来自卖基础素材与工房制品，绿岛币来自稀有素材；工房稳定排程是最主要的青船币来源。',
        en: 'Seafarer’s cowries come from basic materials and workshop products; Islander’s cowries come from rare materials. A steady workshop agenda is the main income.'
      },
      {
        zh: '先用青船币补齐工具与设施升级（寻路者机关系列），再考虑外观类奖励；升级直接扩大后续收益。',
        en: 'Spend Seafarer’s cowries on tool and facility upgrades first (Pathfinder series), then cosmetics; upgrades compound future income.'
      },
      {
        zh: '「奖励兑换」页列出坐骑、宠物、发型、乐谱、装备家具与票据兑换；有成就解锁条件的物品会标注对应成就。',
        en: 'The Rewards tab lists mounts, minions, hairstyles, orchestrion rolls, gear, furniture and ticket exchanges; items gated by achievements show the required achievement.'
      },
      {
        zh: '绿岛币更稀缺，优先换只有绿岛币能买的特选品，不要把绿岛币浪费在普通素材回购上。',
        en: 'Islander’s cowries are scarcer: prioritize Islander-exclusive specials instead of buying back common materials.'
      }
    ],
    links: [
      { route: siteRoutes.islandRewards, label: { zh: '奖励兑换', en: 'Rewards' } }
    ]
  },
  {
    id: 'achievements',
    title: { zh: '无人岛成就速查', en: 'Island Achievements Quick Reference' },
    goal: {
      zh: '用成就清单规划等级、采集、耕种与谷仓目标，并借成就解锁兑换资格。',
      en: 'Use the achievement list to plan rank, gathering, farming and granary goals and unlock shop eligibility.'
    },
    steps: [
      {
        zh: '开拓等级 10/20 分别对应资深/传奇开拓者成就；采集 1000 次、收获 50 次、谷仓稀有素材 50 个都有对应成就。',
        en: 'Ranks 10 and 20 grant the veteran/legendary pioneer achievements; 1000 gathers, 50 harvests and 50 granary rare materials each have their own achievements.'
      },
      {
        zh: '部分成就会给称号，但更重要的是它们会解锁 SpecialShop 的兑换资格（例如 GL-II 钥匙需要资深开拓者）。',
        en: 'Some achievements grant titles, but more importantly they unlock SpecialShop eligibility (e.g. the GL-II key requires the veteran pioneer achievement).'
      },
      {
        zh: '「奖励兑换 · 无人岛成就」分组支持反查：每个成就下列出它解锁的商店物品，按缺什么补什么。',
        en: 'The Rewards “Island Achievements” section reverse-links each achievement to the shop items it unlocks, so you can target what you are missing.'
      },
      {
        zh: '成就目标、点数与称号文本来自游戏 Achievement/Title 表；商店解锁关系来自 SpecialShop.AchievementUnlock 列。',
        en: 'Goals, points and titles come from the Achievement/Title sheets; shop unlock links come from SpecialShop.AchievementUnlock.'
      }
    ],
    links: [
      { route: siteRoutes.islandRewards, label: { zh: '奖励兑换 · 无人岛成就', en: 'Rewards · Island Achievements' } }
    ]
  }
]
