# NSArmoire 模块计划

## 当前状态

- 模块状态：已接入第一阶段页面入口、站点配置、路由、手动 snapshot 导入和基础容器分布统计；本地 helper、静态 catalog 和正式分析能力尚未接入。
- 用户需求来源：`docs/ARMOIRE_PLAN.md`。
- 目标路由：`#/ffxiv/armoire`。
- 计划页面入口：`src/pages/armoire/NSArmoirePage.vue`。
- 计划模块名：`NSArmoire`。
- 计划工具名：`衣柜清理大师`。
- 计划形态：V2 网页工具 + 用户本机本地助手。
- 后续可选形态：独立卫月 / Dalamud 插件项目。该项目暂不放入 V2 仓库，真正启动前必须先阅读官方 Dalamud 开发者指南并单独规划。
- 当前 V2 后端状态：V2 自身没有后端，现阶段只通过 Vite proxy 接旧 `NSGlamour` 和 `NSPlate` 服务；`NSArmoire` 第一阶段不接后端，只处理手动导入 JSON。
- 计划本地助手端口：待确认。实现前必须先确认端口、CORS、公开站点访问本机 helper 的浏览器限制和开发代理策略。

## 已读取文件

本计划基于以下文件和旧项目能力整理：

- `docs/OWNER_VISION.md`
- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/ARCHITECTURE_PLAN.md`
- `docs/ai/CODE_STRUCTURE_RULES.md`
- `docs/ai/PAGE_DEVELOPMENT_GUIDE.md`
- `docs/ai/API_CONVENTIONS.md`
- `docs/ai/MODULE_MAP.md`
- `docs/ai/MODULES/nsglamour.md`
- `docs/ai/MODULES/nsplate.md`
- `docs/ARMOIRE_PLAN.md`
- `docs/api/nsarmoire.md`
- `../NSGlamour/scripts/build_item_mapping.py`
- `../NSGlamour/scripts/resolve_chara.py`
- `../NSGlamour/scripts/app.py`
- `Asvel/ffxiv-dresser-analyze` 公开仓库的 `client/` 和 `web/src/store.ts` 关键逻辑

## 需求理解

`NSArmoire` 不是单纯的收藏柜页面，而是一个 FFXIV 外观仓库检查与清理工具。

目标能力包括：

1. 用户启动本地助手，本地助手读取游戏客户端相关数据。
2. 数据范围希望覆盖背包、陆行鸟鞍囊、雇员背包、兵装库、投影台、收藏柜。
3. 用户从本地助手点击查看，跳转到 V2 的 `#/ffxiv/armoire` 页面检查仓库。
4. 工具提前载入 FFXIV 客户端/静态游戏数据，识别可投影、可放入收藏柜、套装幻影化、失物回购、同模型等关系。
5. 页面展示收藏柜收集进度、未收藏物品、外观分布和清理建议。
6. 参考 `Asvel/ffxiv-dresser-analyze` 的同类功能，但需要扩展到更完整的物品来源分布。

关键判断：

- 纯浏览器无法直接读取本机游戏进程、背包、投影台或客户端 `sqpack`。
- 自动读取用户拥有状态必须依赖本地助手或 Dalamud 插件。本模块当前优先选择“网页 + 本地助手”路线。
- `NSGlamour` 已有成熟静态映射数据路线，可复用为装备、染剂、多语言、图标、模型码基础数据。
- `Asvel/ffxiv-dresser-analyze` 已验证“本地程序读取游戏进程 + Lumina 读取 sqpack + localhost 给网页提供 JSON”的路线可行，但它主要读取投影台；背包、雇员、兵装库等更大范围需要单独验证。
- Dalamud 插件路线作为后续独立项目预研，不纳入当前 V2 第一阶段实现。该路线开工前必须先读官方 Dalamud 开发者指南，确认插件模板、API 能力、读取边界、权限/安全、分发方式和版本兼容。

## 模块定位

`#/ffxiv/armoire` 是 FFXIV 工具分类下的外观收集和仓库清理模块。它应服务于反复整理外观、投影台、收藏柜、背包与雇员仓库的玩家。

第一阶段不要直接追求“全自动读取所有容器”。更稳的路线是先建立稳定数据契约和前端分析能力，再逐步扩大本地助手读取范围。

推荐产品分层：

| 层级 | 用户价值 | 实现方式 |
|------|----------|----------|
| 手动导入模式 | 不安装 helper 也能试用分析能力 | 用户导入 JSON snapshot |
| 本地助手模式 | 自动读取本机游戏数据并打开网页 | helper 读取数据后提供 localhost API 或导出 JSON |
| 深度读取模式 | 覆盖更多容器和更细建议 | 逐步验证背包、鞍囊、雇员、兵装库、投影台、收藏柜读取路线 |

## 推荐 MVP 范围

第一版 MVP 建议只做“可验证闭环”，不要一次吃掉全部容器。

MVP 目标：

1. V2 接入 `#/ffxiv/armoire` 占位工具页和工作台。
2. 支持手动导入 `NSArmoire snapshot` JSON。
3. 兼容 `Asvel/ffxiv-dresser-analyze` 的 `/data/dresser` 简化数据形状：

```ts
interface AsvelDresserItem {
  id: number
  hq: boolean
  dyes: [number, number]
}
```

4. 前端先完成投影台相关分析：
  - 套装幻影化候选。
  - 可放入收藏柜的物品。
  - 染色风险提示。
  - 同模型重复物品。
  - 已拥有物品的基础统计。
  - 套装残缺状态：投影台里存在 `ItemUICategory=112` 的套装幻影化物品时，只表示存在一个套装收纳容器/篓子，不等同于套装内全部散件已收集。
5. 收藏柜收集度的正式口径是“收藏柜现有个数 / 可放入收藏柜的个数”。如果第一版 snapshot 还不能读取真实收藏柜状态，只能展示“已拥有/未拥有”的估算视图，不能把估算值标为正式收藏柜收集度。

当前已完成的第一阶段 A：

1. V2 接入 `#/ffxiv/armoire` 页面入口和 FFXIV 工具导航入口。
2. 支持手动导入 `NSArmoire snapshot` JSON。
3. 支持简化 Asvel dresser JSON 归一为 `container: 'glamourDresser'`。
4. 实现 snapshot 基础校验、容器分布统计、条目数、不同物品数、总数量、染色条目数、投影台条目数和收藏柜条目数。
5. 不接本地 helper，不读取游戏进程，不保存完整 snapshot 到 `localStorage`。

MVP 暂不做：

- 自动读取背包、鞍囊、雇员、兵装库的完整实现。
- 服务器保存用户仓库数据。
- 用户账号体系或云同步。
- 新依赖引入。

## 数据路线

### 静态游戏数据

优先复用或参考 `NSGlamour` 的 CSV 到 JSON 路线：

```text
Item.csv
Stain.csv
Addon.csv
Glasses.csv
Ornament.csv
```

`NSArmoire` 还需要参考或补充以下游戏表/概念：

```text
Cabinet
MirageStoreSetItem
Stain
EquipSlotCategory
GilShopInfo
Item
```

静态数据目标不是直接使用 `NSGlamour` 的全部 `item_model_mapping.json`，而是根据本模块需要形成更轻的 `armoire catalog`：

```ts
interface ArmoireCatalog {
  generatedAt: string
  gameVersion?: string
  locales: string[]
  items: Record<number, ArmoireCatalogItem>
  cabinetItemIds: number[]
  glamourSetItems: ArmoireSet[]
  identicalGroups: ArmoireIdenticalGroup[]
  dyes: Record<number, ArmoireDye>
}
```

具体来源可有两条：

1. 复用 `NSGlamour` datamining CSV 构建流程，另写 `NSArmoire` 派生 JSON。
2. 本地助手使用 Lumina 读取用户本机 `sqpack`，再向网页暴露静态 JSON。

两条路线可以并存：V2 静态包用于无需 helper 的基本分析，helper 静态数据用于和用户客户端版本严格对齐。

### 用户拥有状态

本模块核心输入应设计为 snapshot，而不是让页面直接理解游戏内存结构。

建议第一版数据契约：

```ts
type ArmoireContainerKind =
  | 'inventory'
  | 'saddlebag'
  | 'retainer'
  | 'armoury'
  | 'glamourDresser'
  | 'armoire'
  | 'manual'

interface ArmoireOwnedItem {
  itemId: number
  hq?: boolean
  quantity?: number
  dyes?: [number, number]
  spiritbond?: number
  container: ArmoireContainerKind
  containerName?: string
  slotIndex?: number
}

interface ArmoireSnapshot {
  schemaVersion: 'nsarmoire.snapshot.v1'
  source: 'manual-import' | 'local-helper' | 'asvel-compatible'
  generatedAt: string
  character?: {
    name?: string
    world?: string
    dataCenter?: string
  }
  items: ArmoireOwnedItem[]
}
```

规则：

1. 前端分析只依赖 snapshot，不依赖 helper 内部字段。
2. helper 读取到的所有游戏状态先归一成 snapshot。
3. 用户仓库数据默认只在本机浏览器和本地 helper 间流动，不上传到公开服务器。
4. snapshot 版本必须显式写入，后续数据结构升级可兼容旧导入文件。

## 分析能力拆分

建议把分析能力拆成纯函数，放入 `src/lib/armoire/`。

```text
src/lib/armoire/
├── types.ts
├── normalizeSnapshot.ts
├── buildOwnedIndex.ts
├── analyzeCabinetProgress.ts
├── analyzeContainerDistribution.ts
├── analyzeGlamourSets.ts
├── analyzeIdenticalModels.ts
├── analyzeDyeRisk.ts
└── rankRecommendations.ts
```

第一版分析输出建议包括：

| 输出 | 说明 |
|------|------|
| `cabinetProgress` | 收藏柜正式收集度：收藏柜现有个数 / 可放入收藏柜的个数 |
| `containerDistribution` | 外观物品在背包、鞍囊、雇员、兵装库、投影台、收藏柜中的分布 |
| `glamourSetProgress` | 投影台套装投影化进度：已套装投影化个数 / 可套装投影化的个数 |
| `setRecommendations` | 已有外观中可套装幻影化、接近成套、或已套装投影化但缺件的组合 |
| `cabinetRecommendations` | 可放入收藏柜且风险较低的物品 |
| `duplicateModelGroups` | 同模型或近似同模型重复装备 |
| `dyeRiskItems` | 已染色、双染色或高价值染剂相关风险项 |
| `missingItems` | 用户未拥有但属于收藏柜/套装/同模补全目标的物品 |

### 收集度统计口径

- NSArmoire 不把收藏柜和投影台合并成一个总收集度；页面应分别展示两个进度。
- 收藏柜收集度：分子为 snapshot 中明确位于 `armoire` 容器的收藏柜条目数，分母为 `Cabinet.csv` 中可放入收藏柜的条目数。
- 如果某个物品只是存在于背包、雇员、兵装库或投影台，不计入收藏柜收集度；它可以作为“可转入收藏柜候选”展示。
- 投影台套装投影化进度：分子为投影台中已经存在的套装幻影化容器数量，分母为静态数据中可套装投影化的套装数量，来源主要是 `ItemUICategory=112` 与 `MirageStoreSetItem.csv`。
- 投影台套装进度按套装容器计数，不按散件数量计数；散件完整度作为每个套装的明细展示。
- 对已经套装投影化但缺件的套装，分析结果必须列出缺少的散件 `itemId`、名称和槽位/部位信息。

建议输出结构：

```ts
interface ArmoireCabinetProgress {
  storedCount: number
  storableCount: number
  missingCabinetItemIds: number[]
  transferableItemIds: number[]
}

interface ArmoireGlamourSetProgress {
  storedSetCount: number
  availableSetCount: number
  sets: ArmoireGlamourSetState[]
}

interface ArmoireGlamourSetState {
  setItemId: number
  setName: string
  isStoredAsSet: boolean
  pieceItemIds: number[]
  storedPieceItemIds: number[]
  missingPieceItemIds: number[]
}
```

### 套装收集判定

- `Item.csv` 中 `ItemUICategory=112` 的物品是套装幻影化物品，可通过 `MirageStoreSetItem.csv` 关联到套装散件。
- 用户拥有或投影台中存在 `112` 物品时，不代表 `MirageStoreSetItem.csv` 中的所有散件都已经收集。
- 分析逻辑应把 `112` 物品视为套装容器/篓子，并继续按散件 `itemId` 分别判断拥有状态。
- 套装进度应允许残缺状态，例如“已有套装容器，但缺少若干散件”。
- 投影台页面必须能表现这种残缺状态，不能只显示“该套装已完成”。

## 页面拆分方向

建议 V2 前端拆分：

```text
src/pages/armoire/
├── NSArmoirePage.vue
├── types.ts
├── services/
│   └── nsarmoireApi.ts
├── composables/
│   ├── useArmoireSnapshot.ts
│   ├── useArmoireImport.ts
│   └── useArmoireAnalysis.ts
└── components/
    ├── NSArmoireConnectPanel.vue
    ├── NSArmoireImportPanel.vue
    ├── NSArmoireOverview.vue
    ├── NSArmoireProgressPanel.vue
    ├── NSArmoireDistributionPanel.vue
    ├── NSArmoireRecommendationList.vue
    ├── NSArmoireItemTable.vue
    └── NSArmoireRiskBadge.vue

src/lib/armoire/
├── types.ts
├── catalog/
├── snapshot/
└── analysis/
```

页面职责：

1. `NSArmoirePage.vue` 只负责工具页外壳、状态组合和工作区布局。
2. `services/nsarmoireApi.ts` 负责连接本地 helper 或读取静态 catalog，不在组件中硬编码端口。
3. `useArmoireSnapshot.ts` 负责导入、校验、持久化当前 snapshot。
4. `useArmoireAnalysis.ts` 负责调用 `src/lib/armoire/` 的纯分析函数。
5. 复杂表格、筛选、风险标签、建议列表拆成组件，避免页面文件膨胀。

## API 和本地助手策略

### V2 侧 API 命名

实现前需要新增 API 边界，计划路径：

```text
/api/armoire/*
```

但生产环境的公开站点不能假设服务器可以访问用户本机 helper。因此需要同时设计两种连接模式：

1. 开发代理模式：Vite 把 `/api/armoire/*` 代理到本机 helper，便于开发。
2. 浏览器直连模式：公开 V2 页面直接请求 `http://127.0.0.1:<helper-port>`，helper 处理 CORS 和浏览器私有网络访问限制。

如果直连在目标浏览器中受限，必须保留手动 JSON 导入和 helper 自带本地页面作为 fallback。

### 本地助手建议接口

本地 helper 不应要求 V2 知道内存读取细节，只暴露稳定 JSON。

建议接口：

| 接口 | 用途 |
|------|------|
| `GET /health` | helper 状态、版本、游戏进程状态 |
| `GET /snapshot` | 当前用户物品 snapshot |
| `POST /snapshot/refresh` | 触发重新读取 |
| `GET /catalog` | 与当前客户端版本对应的静态 catalog |
| `GET /icon/:itemId` | 物品图标，后续可选 |
| `GET /open-v2` | 可选，打开 V2 对应页面 |

返回示例：

```ts
interface ArmoireHelperHealth {
  ok: boolean
  helperVersion: string
  gameProcessFound: boolean
  characterLoaded?: boolean
  supportedContainers: ArmoireContainerKind[]
}
```

### 本地助手读取策略

本地助手可参考 `Asvel/ffxiv-dresser-analyze` 的技术路线：

1. 找到 `ffxiv_dx11.exe` 进程。
2. 使用本机客户端路径定位 `sqpack`。
3. 使用 Lumina 读取静态表和图标。
4. 读取投影台/收藏柜/背包等用户拥有状态。
5. 启动 localhost 服务或导出 JSON snapshot。

必须注意：

- `Asvel` 已验证投影台读取路线，但不是完整背包/雇员/兵装库读取方案。
- 进程内存结构会随游戏版本变化，读取逻辑必须有版本探测、失败提示和保守 fallback。
- 雇员、背包、鞍囊、兵装库是否能稳定读到，需要单独调研，不应在第一版计划里假设已成熟。
- 若未来改用 Dalamud 插件，需另开独立项目，不放入 V2 仓库；先读官方 Dalamud 开发者指南，再写风险评估、插件 API 调研、分发计划和与 V2 的数据契约。

### 独立 Dalamud 插件预研

该方向暂不进入当前实现，只记录为后续可能路线。

预研目标：

1. 另开独立插件项目，不把插件源码放进 V2。
2. 阅读官方 Dalamud 开发者指南，确认项目模板、构建方式、插件生命周期、可用 API、配置存储和日志方式。
3. 确认插件能否稳定读取 NSArmoire 需要的容器范围：投影台、收藏柜、背包、陆行鸟鞍囊、兵装库、雇员。
4. 确认插件输出到 V2 的边界：导出 `NSArmoire snapshot` JSON、启动 localhost helper，或打开网页并传递本地数据。
5. 评估插件分发和更新：仅自用、私有仓库、测试仓库，还是公开发布。
6. 记录隐私和安全边界：不上传用户物品数据；不输出本机路径、角色隐私或插件调试细节到公开网页。

预研完成前，V2 仍只依赖手动导入、静态 catalog 和后续本地 helper 方案。

## 需要修改的文件

第一阶段预计/实际涉及：

```text
docs/ai/MODULES/nsarmoire.md
docs/api/nsarmoire.md
src/config/site.ts
src/router/index.ts
src/locales/ui.ts
src/services/apiBoundaries.ts
src/pages/armoire/NSArmoirePage.vue
src/pages/armoire/composables/useArmoireSnapshot.ts
src/pages/armoire/components/*
src/lib/armoire/*
```

如果第一阶段只做手动导入和前端分析，可以暂不修改 `vite.config.ts` 和 `apiBoundaries.ts` 的 helper 代理，只在后续本地助手接入阶段补。

当前第一阶段 A 没有修改 `vite.config.ts`，也没有为 `NSArmoire` 创建 helper API 边界；`apiBoundaries.ts` 只调整为允许没有 API 的工具入口存在。

## 实施步骤

### 阶段 0：确认范围和数据契约

1. 确认路由是否固定为 `#/ffxiv/armoire`。
2. 确认工具名 `衣柜清理大师` 是否作为正式展示名。
3. 确认第一阶段是否接受“手动 JSON 导入 + 分析”作为 MVP。
4. 固定 `ArmoireSnapshot v1` 和 `ArmoireCatalog v1` 数据契约。
5. 建立 `docs/api/nsarmoire.md`，记录 helper 和前端交互契约。

### 阶段 1：V2 页面骨架和手动导入

1. 在 `src/config/site.ts` 增加 `NSArmoire` 工具入口，用户可见未确认文案使用 `占位用，待编辑`。
2. 在 `src/router/index.ts` 增加 lazy route。
3. 建立 `src/pages/armoire/NSArmoirePage.vue` 和基础组件。
4. 支持导入 snapshot JSON，校验 schemaVersion、items、container、itemId。
5. 用模拟 catalog 或现有静态样本跑通基础统计。
6. 不接本地 helper，不读取游戏进程。

### 阶段 2：前端分析引擎

1. 建立 `src/lib/armoire/` 纯逻辑目录。
2. 实现拥有物品索引、容器分布、收藏柜进度、套装建议、同模型建议、染色风险。
3. 用 Asvel 兼容 JSON 样本做回归输入。
4. 页面展示 overview、分布、建议、风险、缺失项。
5. 增加筛选和排序，但不引入新表格库。

### 阶段 3：本地助手最小接入

1. 先做 helper 的 `/health`、`/snapshot`、`/catalog`。
2. V2 页面提供连接状态、刷新按钮、导入 fallback。
3. helper 第一版可只支持投影台数据，确保闭环稳定。
4. 浏览器直连、本地 CORS、公开 HTTPS 页面访问本机 helper 的限制必须实测。
5. 失败时显示保守错误，不泄露本机路径或进程信息。

### 阶段 4：扩展读取容器

1. 调研并逐项验证背包、鞍囊、兵装库、雇员、收藏柜读取路线。
2. 每新增一个容器，都先加入 helper 能力探测，再进入 snapshot。
3. 页面按 `supportedContainers` 显示能力，不假装全部可用。
4. 为每个容器准备真实样本和失败样本。

### 阶段 5：整理建议和发布策略

1. 优化推荐排序和风险等级。
2. 加入导出清单功能，例如“要补收藏柜的物品列表”。
3. 明确 helper 分发、版本更新和杀软误报说明。
4. 确认是否公开发布、是否仅本机使用、是否需要签名。

### 阶段 6：独立 Dalamud 插件预研

1. 不在 V2 内创建插件代码。
2. 另开独立项目目录和计划文档。
3. 先阅读官方 Dalamud 开发者指南。
4. 明确插件读取能力、分发方式、版本兼容和与 V2 的 snapshot 交互契约。
5. 只有预研确认可行后，再决定是否进入插件实现。

## CSS 和组件策略

- 样式层级：工具页业务布局为页面专属；工具页内通用按钮、面板、状态提示、弹窗和工具栏优先复用公共组件。
- `NSArmoire` 是高信息密度工具，不采用首页像素风舞台和强装饰。
- 表格、筛选栏、统计卡、风险标签可以先做模块私有组件；若与 `NSPlate`、`NSGlamour` 复用，再上移到公共组件。
- 不引入 UI 组件库或表格库，除非先说明原因、替代方案和影响并获得确认。
- 用户未确认的功能卡简介、空状态说明和按钮说明使用 `占位用，待编辑`。

## 安全和隐私边界

1. 用户物品 snapshot 默认不上传到公开服务器。
2. 页面和 helper 错误信息不能输出本机用户名、游戏安装路径、进程路径、token、cookie 或堆栈。
3. helper 只监听 loopback 地址，例如 `127.0.0.1`，不监听公网网卡。
4. helper API 应限制来源、方法和请求体大小。
5. JSON 导入视为不可信输入，必须校验 schema、大小、字段类型和 itemId 合法性。
6. 本地进程读取属于敏感能力，需要明确用户主动启动 helper 后才发生。
7. 不在 `localStorage` 长期保存完整仓库明细，除非用户明确开启；默认可只保存最近一次导入时间和轻量设置。

## 风险点

| 风险 | 说明 | 应对 |
|------|------|------|
| 背包/雇员读取不成熟 | 现有参考主要是投影台，不代表所有容器可读 | 分阶段验证，先做手动导入和投影台 |
| 游戏版本变更 | 内存结构和静态表可能随版本变化 | helper 做版本探测，失败时提示更新 |
| Dalamud 插件路线不确定 | 插件 API、可读数据范围、分发和版本兼容需要按官方指南确认 | 独立项目预研，先读官方 Dalamud 开发者指南，不混入 V2 |
| 浏览器直连本机 helper 限制 | 公开 HTTPS 页面访问本机 HTTP helper 可能受 CORS/私有网络策略影响 | 实测 Chrome/Edge，保留手动导入 fallback |
| 用户隐私 | 物品、角色名、服务器属于个人数据 | 默认本地处理，不上传服务器 |
| 推荐误导 | 染色、收藏柜、套装幻影化规则若判断错会误导用户处理物品 | 建立真实样本，风险建议用保守措辞 |
| 数据体积 | 完整 catalog 和图标可能较大 | catalog 拆分，图标按需加载 |
| 名称歧义 | `Armoire` 在游戏中常指收藏柜，但本工具覆盖整个仓库清理 | 文档和 UI 中明确模块覆盖范围 |
| 许可证 | 参考 Asvel 代码时需遵守 MIT license | 若移植代码，保留许可证和来源说明 |

## 验证清单

文档阶段：

- [x] 确认用户需求文档位置：`docs/ARMOIRE_PLAN.md`。
- [x] 确认 V2 当前没有 `NSArmoire` 路由和模块代码。
- [x] 确认 `NSGlamour` 静态数据路线可作为参考。
- [x] 确认 `Asvel/ffxiv-dresser-analyze` 可作为本地 helper 路线参考。

实现阶段至少验证：

- [ ] `npm run build`
- [ ] `npx vue-tsc --noEmit` 或项目等价类型检查
- [ ] 浏览器访问 `http://localhost:5173/#/ffxiv/armoire`
- [ ] 导入合法 snapshot 成功展示 overview
- [ ] 导入非法 JSON、超大 JSON、缺字段 JSON 时给出可控错误
- [ ] Asvel 兼容投影台 JSON 可转成 `ArmoireSnapshot`
- [ ] 收藏柜进度、容器分布、套装建议、同模型检测、染色风险输出稳定
- [ ] 560px / 900px / 1120px+ 宽度下页面可用
- [ ] 本地 helper `/health` 和 `/snapshot` 在开发环境可连通
- [ ] 公开站点直连本地 helper 的浏览器限制经过实测或提供 fallback

## 待确认事项

1. `#/ffxiv/armoire` 是否确定为正式路由。
2. `衣柜清理大师` 是否确定为正式工具名。
3. 第一阶段是否接受手动 JSON 导入作为 MVP。
4. 本地 helper 使用 C# + Lumina，还是先做更简单的 JSON 导出器。
5. 本地 helper 是否允许参考/移植 Asvel 的 MIT 代码。
6. 是否后续另开独立 Dalamud 插件项目；如果做，先阅读哪一版官方开发者指南并如何记录调研结论。
7. 是否需要把 `NSArmoire` 静态 catalog 与 `NSGlamour` 映射构建流程合并。
8. 是否需要读取角色名和服务器，还是第一版完全匿名。
9. 是否需要保存历史 snapshot，还是只分析当前一次导入。
