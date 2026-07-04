# NSArmoire API / 数据契约草案

本文件记录 V2 `NSArmoire` 的数据契约。当前阶段已接入第一版本地 helper：V2 仍支持手动导入 snapshot JSON，同时可以从本机 `NSArmoire helper` 读取投影台 snapshot。

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

`character.id` 和 `character.world` 是多角色场景的稳定身份键。角色名只能作为显示字段，不能单独用于合并历史 snapshot、商城时装购买状态或图鉴统计。如果导入来源暂时无法提供稳定角色 ID，前端只能把它作为当前快照分析，不能自动并入某个角色档案。

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
  glamourSetItems: ArmoireGlamourSet[]
  identicalGroups: ArmoireIdenticalGroup[]
  dyes: Record<number, ArmoireDye>
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

## 本地 helper v0.1

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
| `GET /health` | 返回 helper 版本、游戏进程状态、投影台读取状态和当前支持的容器。 |
| `GET /processes` | 返回当前可选择的 `ffxiv_dx11` 进程列表，包含 PID、窗口标题、可读状态和当前选中标记。 |
| `POST /process/select` | 使用 `{ "pid": number }` 选择要读取的游戏进程，并重置投影台读取器。 |
| `GET /snapshot` | 读取投影台数据并返回 `nsarmoire.snapshot.v1`。 |
| `POST /snapshot/refresh` | 重新读取投影台数据并返回 `nsarmoire.snapshot.v1`。 |
| `GET /open-v2` | 打开 helper 启动参数中配置的 V2 `NSArmoire` 页面。 |

当前 helper 只支持 `glamourDresser` 容器。背包、陆行鸟鞍囊、雇员、兵装库和收藏柜读取还未实现，后续必须逐容器验证。

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
      container: 'glamourDresser',
      slotIndex: number
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
- 后续进入多角色档案、商城时装统计或跨 snapshot 合并时，缺少稳定 `character.id + character.world` 的 snapshot 不能自动合并到已有角色。

## 当前不做

- 不读取背包、陆行鸟鞍囊、雇员、兵装库或收藏柜。
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
