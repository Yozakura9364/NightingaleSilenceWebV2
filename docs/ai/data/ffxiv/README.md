---
summary: "V2 使用 FFXIV datamining CSV 的来源、注释、生成和公开边界。"
status: "active"
scope: "docs/ai/data/ffxiv、CSV 派生数据和各工具的数据生成器。"
source_of_truth: "指定 datamining 仓库、生成脚本和派生 JSON checker。"
read_when: "更新 CSV、映射、语言源、表注释或部署派生数据。"
update_when: "上游仓库、提交、表结构、生成方式或公开范围变化时。"
verify: "运行对应生成器/checker，并确认页面实际读取新的派生产物。"
---

# FFXIV CSV 数据指南

本文件记录 V2 项目读取 FFXIV datamining CSV 的长期规则。它是所有 FFXIV 工具的数据地基，不属于某一个工具私有模块。

## 当前范围

当前已建立中文主数据源的结构快照：

- 来源仓库：[InfSein/ffxiv-datamining-mixed](https://github.com/InfSein/ffxiv-datamining-mixed)
- 来源目录：`chs`
- 来源提交：`d9c6b2e85d47d0c7e1dd9ec83c8eb03145a2d513`
- 表格数量：1196
- 数据行数量：约 1,330,538
- 列定义数量：约 25,548
- 完整结构：`docs/ai/data/ffxiv/generated/csv-structure.chs.json`
- 人工标注：`docs/ai/data/ffxiv/csv-table-notes.md`
- 表/列/行语义注释：`docs/ai/data/ffxiv/csv-annotations.chs.json`

多语言来源仍按现有 NSGlamour 规则维护：`zh/en/ja/fr/de` 来自 `InfSein/ffxiv-datamining-mixed`，`ko` 来自 `Ra-Workspace/ffxiv-datamining-ko`，`tc` 来自 `thewakingsands/ffxiv-datamining-tc`。

## 文档分工

| 文件 | 用途 | 维护方式 |
|------|------|----------|
| `docs/ai/data/ffxiv/README.md` | 长期读取规则、数据来源、使用原则 | 人工维护 |
| `docs/ai/data/ffxiv/csv-table-notes.md` | 每张表的用途、优先级、相关工具备注 | 人工维护 |
| `docs/ai/data/ffxiv/generated/csv-structure.chs.json` | 所有 CSV 的表头、字段行、类型行、列结构 | 自动生成，不手改 |
| `docs/ai/data/ffxiv/csv-annotations.chs.json` | 已确认的表/列/行语义备注 | 人工维护，允许由 agent 按用户对话增量更新 |

## 全量记录模型

本项目把 CSV 知识分成两类记录：

1. 原始事实记录：来自 datamining CSV 本身，以及自动生成的 `generated/csv-structure.chs.json`。这部分记录每张表、每一列的列号、字段名、类型和数据行数。
2. 语义注释记录：来自用户和 agent 的长期维护，写入 `csv-table-notes.md` 和 `csv-annotations.chs.json`。这部分记录“这张表做什么”“这一列是什么业务含义”“这一行 key 在工具里如何理解”。

不要把 133 万行原始 CSV 全部手工展开进 Markdown；那会导致文档不可维护。需要查某行某列时，agent 应根据结构 JSON 定位表和列，再读取源 CSV 或派生数据；当用户确认语义后，再把确认结果写入注释文件。

## 术语校对入口

V2 当前新增轻量术语注册表 `src/lib/ffxiv/terms.ts`，只登记已经被前端 UI、旧字段兼容或模块文档引用到的 FFXIV 术语，不替代原始 CSV 和派生数据生成流程。

隐藏内部页面 `#/ffxiv/term-review` 用于人工校对这些条目，支持按模块、状态、来源和关键词筛选。该页面不写入公开导航，不作为用户功能页；校对结论仍应回写到 `terms.ts`、`csv-annotations.chs.json` 或对应模块文档中。

术语状态口径：

- `confirmed`：当前显示值已有明确来源或已由用户确认；如后续找到更精确的 CSV row，应补充来源。
- `needs-check`：当前只是迁移兼容或合理推断，需要继续核对游戏 CSV、旧项目样本或游戏内 UI。
- `layout`：旧模板布局字段或网页工具字段，不宣称是游戏内术语。

## 注释维护规则

以后通过对话维护 CSV 知识时，优先按下面的粒度更新：

1. 表级注释：更新 `csv-table-notes.md`，说明表的用途、优先级、相关工具和待确认事项。
2. 列级注释：更新 `csv-annotations.chs.json` 中对应表的 `columns`，记录列号、字段名、类型、业务含义、关联表和使用工具。
3. 行级注释：更新 `csv-annotations.chs.json` 中对应表的 `rows`，只记录用户或实现中已经确认有意义的 key。原始行值仍以源 CSV 为准。
4. 如果某个功能依赖特定列或特定 row key，必须在对应模块文档或注释文件中记录来源和验证方式。
5. 不确定的内容不要写成确定结论；先写入 `pending`、`待确认` 或留空。

示例对话维护方式：

```text
给 Item.csv 的 DyeCount 列加备注：染色槽数量，0 表示不可染色。
给 Cabinet.csv 的 Category 列加备注：关联 CabinetCategory.csv。
如果确认 Cabinet.csv 某个 key 的业务含义，再记录对应行级备注。
```

## 字段语义排查流程

遇到不确定字段时，不直接按字段名或单个样例下结论。优先按下面流程排查：

1. 先明确业务问题，例如“这个字段能否判断可进投影台”“这两个装备是否算同模型”。
2. 从 `generated/csv-structure.chs.json` 确认表名、字段名、类型、`rawKey` 和 `csvIndex`，不要只凭 Excel 列字母或截图位置判断。
3. 收集正例和反例，至少覆盖常规装备、非装备、套装容器、复制品/同模装备等容易混淆的样本。样本可来自灰机页面、原始 CSV 行、已有派生 JSON 或用户提供的物品 JSON。
4. 同时检查相关表。比如 Item 的装备部位要结合 `EquipSlotCategory.csv`，套装幻影化要结合 `ItemUICategory=112` 与 `MirageStoreSetItem.csv`，收藏柜要结合 `Cabinet.csv`。
5. 对比样本时记录“字段值相同但业务不同”和“字段值不同但业务相同”的边界样例。这类样例通常决定规则是否需要增加额外条件。
6. 只把经过多样本验证或用户明确确认的结论写成确定语气。仍在推断的内容写入 `pending`、`待确认` 或备注中的“推断”，不要写成最终规则。
7. 如果字段结论会影响代码规则，文档中必须写清使用场景、排除项、验证样本和相关模块，避免后续生成派生数据时复用错口径。

推荐记录格式：

```text
字段：Item.csv / IsGlamourous
业务问题：是否表示可放入投影台
正例：装备物品 A，字段值 true，灰机显示投影台 true
反例：套装容器 B，字段值 false，属于 ItemUICategory=112，需要按套装容器处理
结论：仅表示这条 Item 记录本身是否可作为普通物品进入投影台，不能替代 Cabinet 或套装规则
状态：confirmedBy=user
```

## 读取规则

1. 优先用 CSV 的字段名和类型行理解数据，不直接凭位置猜列含义。
2. CSV 有两套容易混淆的编号：第一行的数字字段号不包含最左侧 `key` 列；程序读取 CSV 时的数组列索引包含 `key` 列。因此 `ItemUICategory` 的字段号是 `15`，程序列索引是 `16`。文档记录列时应尽量同时写 `csvIndex` 和 `rawKey`。
3. 如果某张表只能稳定通过列索引读取，必须在模块文档中记录列索引、字段名、类型和验证样本。
4. 生成工具用 JSON 时，不让业务页面直接读取原始 CSV；应先生成面向工具的派生数据。
5. 多语言数据必须记录来源仓库和 locale，不把不同语言混成一个来源标签。
6. 对外观、装备、染剂、图标、模型码这类高风险数据，更新 CSV 后必须做行数、关键字段、样本物品和多语言回退检查。
7. 不确定用途的表可以先只保留在表格清单里，不强行写备注。

## 已知高优先表

| CSV | 优先级 | 相关工具 | 初始用途备注 |
|---|---|---|---|
| `Addon.csv` | 高 | NSGlamour, NSPlate, NSArmoire | 游戏 UI 文本表：用于部位名、染色标签、界面词条等。 |
| `Cabinet.csv` | 高 | NSArmoire | 收藏柜可收纳物品表：关联 Item 与收藏柜分类/排序。 |
| `CabinetCategory.csv` | 中 | NSArmoire | 收藏柜分类表：配合 Cabinet.csv 解释收藏柜分类。 |
| `ClassJob.csv` | 中 | NSGlamour, NSArmoire | 职业/特职表：用于装备职业限制展示。 |
| `ClassJobCategory.csv` | 中 | NSGlamour, NSArmoire | 职业分类表：用于装备可用职业范围。 |
| `EquipSlotCategory.csv` | 高 | NSGlamour, NSArmoire | 装备槽位分类表：用于判断物品属于主手、副手、头身手腿脚、饰品等。 |
| `GilShopInfo.csv` | 中 | NSArmoire | 商店/回购相关辅助表：Asvel 工具用它辅助判断失物回购候选。 |
| `Glasses.csv` | 中 | NSGlamour | 面部配饰表：面部配饰名称、图标和相关 ID。 |
| `Item.csv` | 高 | NSGlamour, NSArmoire | 物品基础表：名称、说明、图标、装备槽、搜索分类、模型、染色槽、可投影等。 |
| `ItemRepairResource.csv` | 低 | NSArmoire | 修理材料关联表：暂非外观核心，后续可用于物品详情。 |
| `ItemSearchCategory.csv` | 中 | NSArmoire | 物品搜索分类表：辅助筛选装备/外观相关物品。 |
| `ItemSortCategory.csv` | 中 | NSArmoire | 物品排序分类表：辅助稳定排序。 |
| `ItemUICategory.csv` | 中 | NSArmoire | 物品 UI 分类表：用于展示和筛选物品分类。 |
| `MirageStoreSetItem.csv` | 高 | NSArmoire | 套装幻影化组合表：记录可成套投影/套装建议的物品集合。 |
| `Ornament.csv` | 中 | NSGlamour | 时尚配饰表：时尚配饰名称、图标和相关 ID。 |
| `Stain.csv` | 高 | NSGlamour, NSArmoire | 染剂表：染剂名称、颜色、色系/排序等。 |

## 派生数据产物

| 产物 | 服务模块 | 数据来源 | 说明 |
|------|----------|----------|------|
| `item_model_mapping.json` | NSGlamour | `Item.csv`、`Stain.csv`、`Addon.csv`、`Glasses.csv`、`Ornament.csv` | 现有装备、染剂、多语言、模型码映射。 |
| `item_catalog.sqlite3` | NSGlamour / 物品卡片 | 七语言 `Item.csv` | 服务端完整物品搜索索引；只包含 ID、名称、图标、品质和装备槽编号，不进入网页构建产物。 |
| `armoire_catalog.json` | NSArmoire | `Item.csv`、`Cabinet.csv`、`MirageStoreSetItem.csv`、`EquipSlotCategory.csv`、`Stain.csv` 等 | 计划中的外观收集、收藏柜、套装、同模分析目录。 |
| `plate_catalog.json` | NSPlate | Banner / CharaCard 相关 CSV | 铭牌和肖像素材目录，当前旧项目已有派生数据。 |

## 更新流程

1. 拉取或刷新 datamining 仓库。
2. 重新生成 `docs/ai/data/ffxiv/generated/csv-structure.chs.json`。
3. 对比表数量、列数量、关键表字段是否变化。
4. 只在需要时补充 `csv-table-notes.md`，不要用自动生成覆盖人工备注。
5. 重新生成对应工具派生 JSON 或 SQLite；Item.csv 更新后运行 `npm run build:glamour-item-catalog`。
6. 使用真实样本验证 NSGlamour / NSArmoire / NSPlate 的核心数据输出。

## 注意事项

- `Item.csv` 很宽，字段多且部分字段语义依赖游戏表关系；不要在页面组件里直接解释它。
- `#` 字段行和类型行比第一行数字列更有业务意义。
- datamining 表名会随版本增删，工具代码必须能处理缺表、缺列和空数据。
- 人工备注可以渐进完善：先标注已知和近期要用的表，其他表保持空白即可。
