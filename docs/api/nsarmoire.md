# NSArmoire API / 数据契约草案

本文件记录 V2 `NSArmoire` 的数据契约。当前阶段已接入本地 helper：V2 仍支持手动导入 snapshot JSON，同时可以从本机 `NSArmoire helper` 读取投影台、背包、兵装库、鞍囊、当前已加载雇员缓存和收藏柜 snapshot。

## 基本信息

| 项 | 值 |
|----|----|
| 目标路由 | `#/ffxiv/armoire` |
| 页面入口 | `src/pages/armoire/NSArmoirePage.vue` |
| 当前输入 | 手动导入 JSON；本地 helper snapshot |
| 当前本地 helper | `tools/nsarmoire-helper` |
| 当前静态 catalog | `public/data/armoire-catalog.json` |
| helper 开发代理 | `/api/armoire` -> `http://127.0.0.1:8015` |
| helper 生产直连 | `http://127.0.0.1:8015` |

## Snapshot v1

第一阶段页面只依赖 snapshot，不理解 helper 内部内存结构。

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
  inventoryType?: number
  retainerId?: string
  retainerName?: string
  cabinetId?: number
}

interface ArmoireSnapshot {
  schemaVersion: 'nsarmoire.snapshot.v1'
  source: 'manual-import' | 'local-helper' | 'asvel-compatible'
  generatedAt: string
  character?: {
    id?: string
    name?: string
    world?: string
    dataCenter?: string
  }
  items: ArmoireOwnedItem[]
}
```

### 物品实例状态预留

`ArmoireOwnedItem` 中的 `hq`、`quantity`、`dyes`、`spiritbond` 属于用户拥有的“这一条物品实例”的状态，不属于 CSV 静态 catalog。当前第一阶段只正式消费 `dyes` 做染色风险提示；其他字段先作为导入契约预留。

当前本地 helper 已优先写入 `character.name` 和 `character.world`，用于把 snapshot 归到“某角色 @ 某服务器”的当前可用身份。`character.id` 仍作为后续稳定身份字段预留；在没有稳定 ID 时，页面可以按角色名 + 服务器展示和人工选择档案，但不能自动处理改名、转服后的历史合并。

后续进入本地 helper / 插件抓数据阶段时，若能稳定读取更多实例状态，再在 snapshot 契约中增量补字段，例如耐久、镶嵌魔晶石、绑定/精炼、投影覆盖、制造者签名等。新增字段必须先确认来源、单位、取值范围和失败样本；页面分析不能从 `Item.csv`、`Stain.csv` 或其他静态 CSV 推断某一件已拥有装备的当前状态。

## Catalog v1

当前已建立前端 catalog 类型和分析入口。第一版正式静态 catalog 由 `scripts/build-armoire-catalog.mjs` 从 datamining CSV 派生，输出到 `public/data/armoire-catalog.json`；后续本地 helper 可以提供同结构 catalog，用于和用户本机客户端版本严格对齐。

```ts
interface ArmoireCatalog {
  schemaVersion: 'nsarmoire.catalog.v1'
  generatedAt: string
  gameVersion?: string
  items: Record<number, ArmoireCatalogItem>
  cabinetItemIds: number[]
  cabinetEntries?: ArmoireCabinetEntry[]
  glamourSetItems: ArmoireGlamourSet[]
  identicalGroups: ArmoireIdenticalGroup[]
  dyes: Record<number, ArmoireDye>
}

interface ArmoireCabinetEntry {
  cabinetId: number
  itemId: number
}

interface ArmoireCatalogItem {
  itemId: number
  name?: string
  iconId?: number
  itemUiCategoryId?: number
  equipSlotCategoryId?: number
  isGlamourous?: boolean
  isCabinetStorable?: boolean
  isGlamourSetContainer?: boolean
  pieceItemIds?: number[]
  mainModel?: [number, number, number, number]
  subModel?: [number, number, number, number]
  modelKey?: string
  dyeSlotCount?: number
}

interface ArmoireDye {
  dyeId: number
  name?: string
  color?: string
  shade?: number
  subOrder?: number
}
```

页面加载静态 catalog 失败时，使用空 catalog 表示“正式静态数据未接入”。依赖 `Cabinet.csv`、`MirageStoreSetItem.csv` 和同模型分组的分析会明确显示等待 catalog，不输出伪结果。

同模型第一版判定口径：同时比较 `Item.csv` 的 `Model{Main}` / 灰机 `主模型`、`Model{Sub}` / 灰机 `副模型`、`ItemUICategory` 和 `EquipSlotCategory`。主副模型两组四元组完全一致，且物品 UI 分类、装备槽位分类也一致，才归为同模型；这是并且关系。`EquipSlotCategory=0` 的非装备、`6` 腰带、`14` 暂未纳入的主副手组合、`17` 灵魂水晶不进入第一版同模分组。

第一版静态 catalog 生成命令：

```bash
npm run build:armoire-catalog
```

可选本地 CSV 来源：

```bash
node scripts/build-armoire-catalog.mjs --source-dir <datamining chs dir>
```

默认远程来源为 `InfSein/ffxiv-datamining-mixed` 的 `chs` 目录。生成脚本按字段名读取 CSV，不按裸数组位置推断字段；`MirageStoreSetItem.csv` 只读取 `Item[0]` 到 `Item[8]` 作为套装散件。

前端物品图标不再请求外部 XIVAPI asset endpoint；`iconId` 会被拼成站点自托管图片地址：`https://img.nightingalesilence.com/ui/icon/<folder>/<icon>_hr1.png`。其中 `<folder>` 为 `iconId` 向下取整到千位后的 6 位目录名，`<icon>` 为 6 位补零图标 ID。

## Asvel 兼容导入

第一阶段同时接受简化的 Asvel dresser 项：

```ts
interface AsvelDresserItem {
  id: number
  hq?: boolean
  dyes?: [number, number]
}
```

可接受形态：

- `AsvelDresserItem[]`
- `{ items: AsvelDresserItem[] }`
- `{ dresser: AsvelDresserItem[] }`

导入后统一转换为：

```ts
source: 'asvel-compatible'
container: 'glamourDresser'
```

## 本地 helper v0.4.2

第一版 helper 位于：

```text
tools/nsarmoire-helper
```

运行命令：

```powershell
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj
```

默认监听：

```text
http://127.0.0.1:8015
```

当前接口：

| 接口 | 用途 |
|------|------|
| `GET /health` | 返回 helper 版本、游戏进程状态、投影台/收藏柜/背包/雇员读取状态和当前支持的容器。 |
| `GET /processes` | 返回当前可选择的 `ffxiv_dx11` 进程列表，包含 PID、窗口标题、可读状态和当前选中标记。 |
| `POST /process/select` | 使用 `{ "pid": number }` 选择要读取的游戏进程，并重置投影台读取器。 |
| `GET /probe` | 实验性读取能力探针，返回投影台、收藏柜、背包、兵装库、鞍囊、当前加载雇员容器、雇员缓存和 0-10 个雇员身份槽的定位、加载状态、容器大小和计数。 |
| `GET /catalog` | 返回 helper 当前找到的 `nsarmoire.catalog.v1` JSON；当前来源为仓库内 `public/data/armoire-catalog.json`，用于和收藏柜 bitset 映射口径保持一致。 |
| `GET /snapshot` | 读取当前可用容器数据并返回 `nsarmoire.snapshot.v1`。 |
| `POST /snapshot/refresh` | 重新读取当前可用容器数据并返回 `nsarmoire.snapshot.v1`。 |
| `GET /open-v2` | 打开 helper 启动参数中配置的 V2 `NSArmoire` 页面。 |

当前 helper 已进入外部内存读取 POC：

- 角色身份通过 `PlayerState` 读取角色名，并通过 `LocalPlayer.HomeWorld` 读取服务器 RowId；snapshot 当前写入 `character.name` 和 `character.world`，暂不写入角色 ID。
- 服务器 RowId 到名称的转换使用当前公开服务器白名单；关闭服、内部测试服、临时服或尚未确认的独立 RowId 会在 `/probe.character` 中保留 `worldId` 并标记 `world_unknown`，不会写入 snapshot 的 `character.world`。
- `glamourDresser` 仍沿用投影台签名读取。
- `inventory`、`armoury`、`saddlebag`、`retainer` 通过 `InventoryManager.Instance` 的签名定位，再扫描 `InventoryContainer` 表读取。
- 雇员身份通过 `RetainerManager.Instance` 读取，最多 10 个槽位；当前已能取得雇员名、雇员 ID、职业、等级、仓库占用数、上架数和当前选中状态。
- `InventoryManager` 中的 `10000-10006` 是当前加载雇员仓库的 7 个 25 格内存块，总计 175 格；游戏 UI 展示为 5 页，每页 35 格。helper snapshot 不直接外显内部块，而是按全局 slot 重排为 `雇员名 背包 1-5`。
- 多雇员归档的正式交互口径不是一次性读完所有雇员；helper 会在用户打开或切换某个雇员且其 7 个内部块加载完成时，把该雇员库存写入本次 helper 进程的内存缓存。用户逐个打开雇员后，snapshot 会逐步累积多个雇员，这与游戏内检索系统需要访问过雇员后才有完整数据的体验一致。
- 当前雇员缓存同时纳入雇员背包、雇员已装备和雇员市场；雇员 ID 以字符串形式写入 `retainerId`，避免 JavaScript 64 位整数精度问题。
- `/probe` 是当前验证入口；它不外显物品 ID，只返回容器状态和数量。
- `/snapshot` 在容器读取成功时会把这些容器中的物品记录并入 snapshot。
- 收藏柜通过 `UIState.Cabinet` 读取：`State == Loaded` 时读取 `UnlockedItems` bitset，再用 `public/data/armoire-catalog.json` 的 `cabinetEntries` 把 Cabinet RowId 映射回 ItemId，输出 `container: 'armoire'`。
- `public/data/armoire-catalog.json` 必须包含 `cabinetEntries` 才能把收藏柜 bitset 转成 snapshot 物品；如果 catalog 缺失或无映射，`/probe.cabinet` 仍可显示 loaded/bit 计数，但 `/snapshot` 不应输出伪收藏柜物品。

外部内存读取仍属于实验能力：游戏版本更新、容器未加载、多个游戏进程都可能影响结果。每个新容器必须先通过 `/probe` 验证后再进入正式 UI 口径。雇员数据按“打开后缓存”的同步流程处理，不作为一次性读取失败。

### 外部内存读取参考入口

如果游戏版本更新导致签名、结构偏移或容器读取失效，优先使用 Dalamud Plugin Browser 作为开源插件索引入口：

```text
https://tommadness.github.io/Plugin-Browser/
```

处理流程：

1. 在 Plugin Browser 中搜索目标能力关键词，例如 `retainer`、`inventory`、`dresser`、`collection`、`cabinet`。
2. 如果插件条目提供源码仓库链接，先阅读其公开实现，确认它使用的是 `FFXIVClientStructs` 结构、Dalamud 服务、IPC，还是插件自身缓存。
3. 对能迁移到外部 helper 的部分，只参考字段来源、结构名、签名和失败口径；实际偏移仍以当前本机 `FFXIVClientStructs.dll/xml` 和 helper `/probe` 验证为准。
4. 记录参考项目、许可证和验证结果；不要直接复制未知许可证代码到 V2。

helper 默认 V2 页面地址为：

```text
http://localhost:5173/#/ffxiv/armoire
```

开发端口变化或正式分发时，可以用启动参数覆盖：

```powershell
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj -- --web-url "http://localhost:5173/#/ffxiv/armoire"
```

`/open-v2` 不接受请求传入的任意 URL，只打开启动时配置的 `http` 或 `https` 地址，避免本地接口被用作任意打开网页的跳板。

helper 输出的 snapshot 形态：

```ts
{
  schemaVersion: 'nsarmoire.snapshot.v1',
  source: 'local-helper',
  generatedAt: string,
  character?: {
    id?: string,
    name?: string,
    world?: string,
    dataCenter?: string
  },
  items: [
    {
      itemId: number,
      hq: boolean,
      dyes: [number, number],
      container: 'glamourDresser' | 'inventory' | 'armoury' | 'saddlebag' | 'retainer' | 'armoire',
      containerName?: string,
      slotIndex?: number,
      inventoryType?: number,
      retainerId?: string,
      retainerName?: string,
      cabinetId?: number
    }
  ]
}
```

## 已确认字段口径

| 字段 / 来源 | 口径 |
|-------------|------|
| `ItemUICategory` / 灰机 `类型ID` | 用于区分武器/防具/饰品等物品 UI 分类；同模型分析必须同分类。 |
| `EquipSlotCategory` / 灰机 `装备位置` | 判断物品是否是装备，以及占用哪些装备槽；同模型分析必须同装备槽位分类。 |
| `Model{Main}` / 灰机 `主模型` | 用于第一版同模型分析；必须与 `Model{Sub}`、`ItemUICategory`、`EquipSlotCategory` 一起完全一致。 |
| `Model{Sub}` / 灰机 `副模型` | 用于第一版同模型分析；必须与 `Model{Main}`、`ItemUICategory`、`EquipSlotCategory` 一起完全一致。 |
| `IsGlamourous` / 灰机 `投影台` | 判断这条 Item 记录本身能否作为普通物品放入投影台。 |
| `Item{Glamour}` / 灰机 `投影材料` | 普通武具投影相关材料，不等同于投影台收纳。 |
| 灰机 `武具投影` | 普通武具投影能力，不等同于投影台收纳。 |
| `ItemUICategory=112` + `MirageStoreSetItem.csv` / 灰机 `套装.物品` | 套装幻影化容器，单独处理；拥有容器不代表散件全收集。 |
| `Cabinet.csv` | 判断可放入收藏柜，不使用 `IsGlamourous` 代替。 |

## 当前校验

手动导入会校验：

- JSON 必须可解析。
- snapshot 必须是对象，或 Asvel 兼容数组/对象。
- `schemaVersion` 必须是 `nsarmoire.snapshot.v1`。
- `source` 必须是已知来源。
- `generatedAt` 必须存在。
- `items` 必须是数组，且不超过当前前端限制。
- `itemId` 必须是正整数。
- `container` 必须是已知容器。
- `quantity` 如存在，必须是正整数。
- `dyes` 如存在，必须是两个非负整数。
- 如果存在 `character`，`character.id`、`character.name`、`character.world`、`character.dataCenter` 必须是字符串。
- 后续进入多角色档案、商城时装统计或跨 snapshot 合并时，当前可先使用 `character.name + character.world` 作为人工可识别身份；缺少稳定 `character.id` 时，改名或转服后的数据不能自动合并，必须提供手动合并入口。

## 当前不做

- helper 当前已读取角色名和服务器；稳定角色 ID 仍未写入，多角色档案的改名/转服自动合并仍需后续攻克。
- 不尝试绕过游戏加载状态一次性读取未打开雇员；多雇员归档按逐个打开/切换后缓存累积的正式流程处理。
- catalog 加载失败时，不计算正式收藏柜收集度。
- catalog 加载失败时，不计算正式套装缺件进度。
- catalog 加载失败时，不输出正式同模型推荐。
- 不保存完整 snapshot 到 `localStorage`。

## 当前前端分析

- 基础统计：条目数、不同物品数、总数量、染色条目数、投影台条目数、收藏柜条目数。
- 容器分布：按 `container + containerName` 聚合。
- 染色风险：仅基于 snapshot 的 `dyes` 字段识别已染色条目；双染色条目标记为更高风险。
- 收藏柜、套装、同模型：已建立纯函数接口；同模型按 `主模型`、`副模型`、`ItemUICategory`、`EquipSlotCategory` 都完全一致分组，但没有正式 catalog 时返回 `missingCatalog`。

## 安全边界

- 手动导入 JSON 视为不可信输入。
- 页面只在浏览器内处理 snapshot，不上传公开服务器。
- 错误信息不输出本机路径、堆栈、用户名、游戏安装路径、角色 ID 或 helper 调试信息。
- 当前 helper 只监听 `127.0.0.1`，不监听公网网卡。
- 当前 helper API 错误不得输出本机用户名、游戏安装路径、进程路径、角色 ID 或堆栈。
- 公开站点直连本地 helper 的浏览器私有网络访问限制仍需实测；手动导入必须保留为 fallback。
