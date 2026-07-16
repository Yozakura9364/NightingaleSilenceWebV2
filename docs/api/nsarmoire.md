# NSArmoire API / 数据契约草案

本文件记录 `NSArmoire` 的数据契约。完整 Vue 工作台由 `NSArmoireButler` 的 WPF/WebView2 GUI 内嵌，页面、catalog 和 API 均来自本机；公网 V2 路由只保留教程和下载入口。

## 基本信息

| 项 | 值 |
|----|----|
| 公网路由 | `#/ffxiv/armoire`，轻量教程和下载页 |
| 本地工作台 | `http://127.0.0.1:8015/#/ffxiv/armoire?connect=1` |
| 页面入口 | `src/pages/armoire/NSArmoirePage.vue`，仅 `armoire-local` 构建使用 |
| 当前输入 | 手动导入 JSON；本地 helper snapshot |
| 当前本地 helper | 独立项目 `H:\NightingaleSilenceWeb\NSArmoireButler`；V2 内 `tools/nsarmoire-helper` 仅作为历史内置副本/开发参考 |
| 当前静态 catalog | `public/data/armoire-catalog.json` |
| helper 开发代理 | `/api/armoire` -> `http://127.0.0.1:8015` |
| helper GUI 同源 | `http://127.0.0.1:8015` |

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
  retainerSlot?: number
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

`ArmoireOwnedItem` 中的 `hq`、`quantity`、`dyes`、`spiritbond` 属于用户拥有的“这一条物品实例”的状态，不属于 CSV 静态 catalog。当前第一阶段已正式消费 `dyes` 做染色风险提示；`spiritbond` 由本地 helper 从背包/兵装库/鞍囊/雇员物品实例读取并透出，用于验证可交易装备是否已绑定在当前角色身上。

绑定状态不能从 `Item.csv` 的可交易/市场字段直接推出；这些静态字段只能说明物品模板规则，不能说明用户背包里某一件副本当前是否已绑定。第一轮验证样本使用同一物品的两件副本：`经典眼镜` HQ 已绑定、NQ 未绑定。`/snapshot` 中两条 `itemId=9298` 分别输出 `spiritbond: 1` 和 `spiritbond: 0`。当前分析口径无视 HQ/NQ，只使用绑定关系：`spiritbond === 0` 视为已知未绑定，`spiritbond > 0` 视为已绑定，缺失 `spiritbond` 时不进入未绑定可交易清单。

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
  crafterGathererReplicaItemIds?: number[]
}

interface ArmoireCabinetEntry {
  cabinetId: number
  itemId: number
  order?: number
  sortKey?: number
  categoryId?: number
  categoryName?: string
  categoryMenuOrder?: number
  categoryHideOrder?: number
  categoryIconId?: number
  subCategoryId?: number
  subCategoryName?: string
  subCategoryOrder?: number
}

interface ArmoireCatalogItem {
  itemId: number
  name?: string
  localizedNames?: Partial<Record<'zh-CN' | 'en' | 'ja' | 'ko', string>>
  iconId?: number
  itemUiCategoryId?: number
  equipSlotCategoryId?: number
  isGlamourous?: boolean
  isTradable?: boolean
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
  valueCategory?: 'general' | 'extra1' | 'extra2' | 'storeSpecial'
}
```

页面优先加载站点静态 catalog；静态 catalog 加载失败时，会尝试从本地 helper `/catalog` 读取同结构 catalog。两者都失败时，使用空 catalog 表示“正式静态数据未接入”。依赖 `Cabinet.csv`、`MirageStoreSetItem.csv` 和同模型分组的分析会明确显示等待 catalog，不输出伪结果。

收藏柜条目使用游戏原始分组：`Cabinet.csv.Category` 对应 `CabinetCategory.csv` 的 RowId，再通过 `CabinetCategory.csv.Category` 指向 `Addon.csv` 文本作为一级分类名；`Cabinet.csv.SortKey` 对应 `CabinetSubCategory.csv` 的 RowId，作为二级分类名；`Cabinet.csv.Order` 保留为组内排序。前端收藏柜统计按这些字段还原游戏里的“职业专用装备 / 季节活动装备”等大类和“骑士装备 / 妖怪手表”等子类，不用网页侧硬编码分类表。

收藏柜分析边界集中在 `src/lib/armoire/cabinetDomain.ts` 和 `analyzeCabinetProgress.ts`：普通完整 catalog、完整收藏柜 catalog、按 snapshot 加载的 cabinet chunk 都必须先合并为收藏柜专用 view，再参与分析。`cabinetEntries` 按 `cabinetId` 去重并按游戏分类排序；chunk 只是运行时加速数据，不代表另一份收藏柜真源，不能和完整 catalog 重复计数。UI 组件只接收已归一化后的条目并渲染分组。

同模型第一版判定口径：同时比较 `Item.csv` 的 `Model{Main}` / 灰机 `主模型`、`Model{Sub}` / 灰机 `副模型`、`ItemUICategory` 和 `EquipSlotCategory`。主副模型两组四元组完全一致，且物品 UI 分类、装备槽位分类也一致，才归为同模型；这是并且关系。`EquipSlotCategory=0` 的非装备、`6` 腰带、`14` 暂未纳入的主副手组合、`17` 灵魂水晶不进入第一版同模分组。

普通页面运行时不再默认请求完整 `public/data/armoire-catalog.json`。页面会按分区和当前 snapshot itemId 加载轻量目录或 chunk，例如 `armoire-item-display-chunks/*.json`、`armoire-cabinet-item-chunks/*.json`、`armoire-glamour-set-chunks/*.json`、`armoire-dye-catalog.json`、`armoire-store-catalog.json` 和 `armoire-crafter-gatherer-replica-catalog.json`。完整 catalog 继续作为构建源、脚本校验和隐藏校正页兜底输入。

生产采集复制品回收目录单独输出：

```ts
interface ArmoireCrafterGathererReplicaCatalog {
  schemaVersion: 'nsarmoire.crafterGathererReplicaCatalog.v1'
  generatedAt: string
  source?: {
    catalogGeneratedAt?: string
  }
  items: ArmoireCompactDisplayItem[]
  itemIds: number[]
  excludedItemIds?: number[]
  missingItemIds?: number[]
}
```

当前生成口径：中文名包含 `（复制品）`、`Level{Item}=1`、`Level{Equip}=1`、`Rarity` 为蓝色/绿色、`EquipSlotCategory` 属于生产采集防具槽位，并显式排除误命中的 `23343`、`23344`。当前候选 275 件，`missingItemIds` 为 0。

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

## Store Catalog v1

商城时装目录独立于游戏静态 catalog，当前文件为：

```text
public/data/armoire-store-catalog.json
```

第一版 schema：

```ts
interface ArmoireStoreCatalog {
  schemaVersion: 'nsarmoire.storeCatalog.v1'
  generatedAt: string
  sources: ArmoireStoreCatalogSource[]
  outfits: ArmoireStoreOutfit[]
}

interface ArmoireStoreCatalogSource {
  region: 'cn' | 'global' | 'tw' | 'kr'
  url: string
  note?: string
}

interface ArmoireStoreOutfit {
  id: string
  region: 'cn' | 'global' | 'tw'
  name: string
  localizedNames?: Partial<Record<'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de', string>>
  storeUrl: string
  regionalStoreUrls?: Partial<Record<'cn' | 'global' | 'tw' | 'kr', string>>
  sourceUrl: string
  productId?: string
  skuId?: string
  globalProductId?: string
  globalProductName?: string
  globalItemNames?: string[]
  globalItemUris?: string[]
  priceLabel?: string
  regionalPriceLabels?: Partial<Record<'cn' | 'global' | 'tw' | 'kr', string>>
  coverItemId?: number
  itemNames: string[]
  itemIds: number[]
  tags?: ArmoireStoreTag[]
  detailTags?: ArmoireStoreDetailTag[]
  mappingSource?: 'cn-store' | 'global-store' | 'manual'
  corrected?: boolean
  needsMapping?: boolean
  notes?: string
}
```

当前口径：

- 国服商城目录第一版来自公开商品列表和商品说明解析。
- `coverItemId` 只用于商城卡片封面图标，可以来自套装幻影化物品、装备套装或代表性散件；它不参与拥有状态检测。
- `itemIds` 只在商城说明里的散件名能和 `armoire-catalog.json` 物品名精确匹配时自动填入。
- `needsMapping: true` 表示仍需人工校正商品和游戏物品关系。
- `localizedNames` 用于让商城套装名随界面语言切换；游戏物品名优先来自静态 Item 数据。
- `regionalStoreUrls` 记录各地区入口；前端只外显短链域名，不外显 `cn/tw/global/kr` 字段名。
- `regionalPriceLabels` 记录各地区价格文本；前端按固定地区标签展示，例如 `简中服`、`繁中服`、`Global Server`、`한국`。
- 校正页读取地区链接时不再用 `storeUrl` 兜底 `regionalStoreUrls.cn`。简中服为空就表示缺简中链接；GLOBAL 商品的国际服链接不能被当成简中链接显示或导出。
- 对片假名或日文为主的商品，必须同时维护 `localizedNames.zh-CN` 和对应地区的 `regionalStoreUrls` / `regionalPriceLabels`，避免商品名随界面语言切换时回落到日文默认名。
- 国际服商城价格如果抓到日元网页金额，目录中按同数值 `crysta` 展示，例如 `550 円` 写成 `550 crysta`。
- 前端“商城”面板只根据当前 snapshot 中是否存在这些 `itemIds` 显示“已检测到 / 缺部分 / 未检测到 / 待校正”，不等同于商城账号购买记录。
- 真正的账号购买状态必须来自用户手动标记、导入清单，或后续明确授权的数据读取；不能默认抓取商城账号。

刷新商城目录命令：

```bash
npm run build:armoire-store-catalog
```

生成脚本：`scripts/build-armoire-store-catalog.mjs`。
校验脚本：`scripts/check-armoire-store-catalog.mjs`。
价格抓取辅助脚本：`scripts/scrape-armoire-store-prices.mjs`，入口命令为：

```bash
npm run scrape:armoire-store-prices
```

默认行为：

- 读取 `public/data/armoire-catalog.json`，用游戏物品名精确匹配商城说明里的散件名。
- 输出 `public/data/armoire-store-catalog.json`。
- 如果输出文件已经存在，会尽量保留已人工校正的 `itemIds`，避免重新抓取覆盖用户修正。
- 如果输出文件已经存在，会尽量保留已人工校正的 `localizedNames`、`regionalStoreUrls`、`regionalPriceLabels`、`tags`、`detailTags`、`coverItemId` 和 `itemIds`。
- 如果需要完全按当前抓取结果重建，可运行：

```bash
node scripts/build-armoire-store-catalog.mjs --no-preserve-existing
```

查看待校正清单：

```bash
npm run check:armoire-store-catalog
```

`npm run check` 会以 `--pending-limit 0` 静默模式校验商城表结构、重复 ID 和坏 `itemIds`，不会把待校正清单刷进常规检查输出。

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

## 本地 helper v0.5.2

v0.5.2 起，helper 会在雇员物品实例上输出 `retainerSlot`。该字段来自游戏雇员列表槽位，helper 内部为 0-based 数值；网页只用它排序，把衣柜统计按“雇员 1-10”的游戏顺序展示。旧 snapshot 或手动导入文件没有该字段时，网页会回退到雇员 ID、雇员名和容器名的稳定排序。

正式 helper 已拆为独立项目：

```text
H:\NightingaleSilenceWeb\NSArmoireButler
```

运行命令：

```powershell
dotnet run --project H:\NightingaleSilenceWeb\NSArmoireButler\NSArmoireButler.csproj
```

默认监听：

```text
http://127.0.0.1:8015
```

正式下载入口：

```text
https://github.com/Yozakura9364/NSArmoireButler/releases/latest
```

公开页面只跳转到 `NSArmoireButler` GitHub Releases 最新页，不直链 `.exe` 或 `.zip`。每个 helper Release 需要写明 helper 版本、支持游戏版本、使用步骤、只监听 `127.0.0.1`、不上传用户仓库数据、杀软/SmartScreen 可能提示未知发布者，以及对应源码路径。Release 页面面向普通用户，不外显 SHA256 校验文案。

当前独立 helper 默认启动后打开：

```text
https://nightingalesilence.com/#/ffxiv/armoire?connect=1
```

网页看到 `connect=1` 后会自动连接 `http://127.0.0.1:8015`。如果用户在网页中点击连接而 helper 未运行，网页会尝试唤起 `nsarmoire-butler://start`，然后自动重试连接；浏览器仍会按系统策略显示打开本地应用的确认弹窗。Release 包内的 `register-protocol.ps1` 用于注册该协议。

当前接口：

| 接口 | 用途 |
|------|------|
| `GET /health` | 返回 helper 版本、游戏进程状态、catalog 定位状态、投影台/收藏柜/背包/雇员读取状态和当前支持的容器。 |
| `GET /processes` | 返回当前可选择的 `ffxiv_dx11` 进程列表，包含 PID、窗口标题、可读状态和当前选中标记。 |
| `POST /process/select` | 使用 `{ "pid": number }` 选择要读取的游戏进程，并重置投影台读取器。 |
| `GET /probe` | 实验性读取能力探针，返回投影台、收藏柜、背包、兵装库、鞍囊、当前加载雇员容器、雇员缓存和 0-10 个雇员身份槽的定位、加载状态、容器大小和计数。 |
| `POST /retainer-cache/clear` | 清空当前 helper 进程内的雇员库存缓存，并返回新的 helper health。 |
| `GET /catalog` | 返回 helper 当前找到的 `nsarmoire.catalog.v1` JSON；当前来源为仓库内 `public/data/armoire-catalog.json`，用于和收藏柜 bitset 映射口径保持一致。 |
| `GET /snapshot` | 读取当前可用容器数据并返回 `nsarmoire.snapshot.v1`。 |
| `POST /snapshot/refresh` | 重新读取当前可用容器数据并返回 `nsarmoire.snapshot.v1`。 |
| `GET /open-v2` | 打开 helper 启动参数中配置的 V2 `NSArmoire` 页面。 |
| `POST /shutdown` | 返回成功响应后关闭当前本地 helper 进程；只停止 helper 自身，不操作游戏进程。 |

当前 helper 已进入外部内存读取 POC：

- 角色身份通过 `PlayerState` 读取角色名，并通过 `LocalPlayer.HomeWorld` 读取服务器 RowId；snapshot 当前写入 `character.name` 和 `character.world`，暂不写入角色 ID。
- 服务器 RowId 到名称的转换使用当前公开服务器白名单；关闭服、内部测试服、临时服或尚未确认的独立 RowId 会在 `/probe.character` 中保留 `worldId` 并标记 `world_unknown`，不会写入 snapshot 的 `character.world`。
- `glamourDresser` 仍沿用投影台签名读取。
- `/health.catalogLocated` 表示 helper 是否找到了 `armoire-catalog.json`；`catalogCabinetEntryCount` 表示当前 catalog 中可用于收藏柜 bitset 映射的条目数。
- `inventory`、`armoury`、`saddlebag`、`retainer` 通过 `InventoryManager.Instance` 的签名定位，再扫描 `InventoryContainer` 表读取。
- 雇员身份通过 `RetainerManager.Instance` 读取，最多 10 个槽位；当前已能取得雇员名、雇员 ID、职业、等级、仓库占用数、上架数和当前选中状态。
- `InventoryManager` 中的 `10000-10006` 是当前加载雇员仓库的 7 个 25 格内存块，总计 175 格；游戏 UI 展示为 5 页，每页 35 格。helper snapshot 不直接外显内部块，而是按全局 slot 重排为 `雇员名 背包 1-5`。
- 多雇员归档的正式交互口径不是一次性读完所有雇员；helper 会在用户打开或切换某个雇员且其 7 个内部块加载完成时，把该雇员库存写入本次 helper 进程的内存缓存。用户逐个打开雇员后，snapshot 会逐步累积多个雇员，这与游戏内检索系统需要访问过雇员后才有完整数据的体验一致。
- 当前雇员缓存同时纳入雇员背包、雇员已装备和雇员市场；雇员 ID 以字符串形式写入 `retainerId`，避免 JavaScript 64 位整数精度问题。前端会保留这些原始数据用于衣柜统计和位置展示。行动建议会全局过滤雇员市场上架物品：`inventoryType=12002` 或容器名以 `市场` 结尾的条目，不进入商城拥有状态、可交易物品、重复物品、同模型和生产采集复制品回收建议。雇员已装备物品只在重复相关建议中排除：`inventoryType=11000` 或容器名以 `已装备` 结尾的条目，不参与重复物品和同模型多余判断，但仍可参与商城拥有状态、收藏柜、套装、可交易、复制品和染色风险等其他判断。
- 前端连接 helper 后会轮询 `/probe`：页面可见时约 2 秒一次，隐藏时约 10 秒一次。首次探针只记录刷新签名；后续检测到角色、容器、雇员状态、雇员缓存或 `snapshotContentHash` 等探针签名变化后，会延迟约 1.4 秒调用 `/snapshot/refresh` 更新页面，减少“每打开一个雇员还要手动刷新一次”的操作，同时避免每 2 秒重建完整 snapshot。`snapshotContentHash` 只暴露稳定内容哈希，不外显物品明细，用于覆盖同容器等量交换、染色或绑定状态变化。
- `/retainer-cache/clear` 只清空 helper 进程内缓存，不清空当前页面已经显示的 snapshot；页面数据会在下一次刷新或重新读取后更新。
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
dotnet run --project H:\NightingaleSilenceWeb\NSArmoireButler\NSArmoireButler.csproj -- --web-url "http://localhost:5173/#/ffxiv/armoire?connect=1"
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
      spiritbond?: number,
      container: 'glamourDresser' | 'inventory' | 'armoury' | 'saddlebag' | 'retainer' | 'armoire',
      containerName?: string,
      slotIndex?: number,
      inventoryType?: number,
      retainerId?: string,
      retainerName?: string,
      retainerSlot?: number,
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
| `Cabinet.csv` | 判断可放入收藏柜，并提供 `Category`、`SortKey`、`Order` 作为收藏柜分类和排序基础；不使用 `IsGlamourous` 代替。 |
| `CabinetCategory.csv` | 通过 `Category -> Addon.csv` 解析收藏柜一级分类名，并保留 `MenuOrder`、`HideOrder`、`Icon`。 |
| `CabinetSubCategory.csv` | 解析收藏柜二级分类名；当前 CSV 表头为空，生成脚本按原始行位置读取。 |
| `Addon.csv` | 提供 `CabinetCategory.csv` 指向的一级分类本地化文本。 |

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
- 不保存完整 snapshot 到 `localStorage`。多角色切换所需的完整 snapshot 保存到浏览器 IndexedDB `nsarmoire-character-cache`，对象仓库为 `snapshots`，key 为 `角色名@服务器` 或未识别 fallback key；`localStorage` 只保存 active profile key 和旧缓存迁移槽位。

## 当前前端分析

- 基础统计：条目数、不同物品数、总数量、染色条目数、投影台条目数、收藏柜条目数。
- 衣柜统计：按 `container + containerName` 聚合，并以折叠容器展示每个容器中的物品图标；展开后才渲染该容器物品。
- 染色风险：基于 snapshot 的 `dyes` 字段识别已染色条目，并结合用户选择的贵重染剂判断是否进入高风险清单。用户可以选择 `general`、`extra1`、`extra2` 等类别，也可以选择 `storeSpecial` 范围内的具体染剂；默认只选择具体染剂 `无瑕白`、`煤玉黑`、`柔彩粉`，不默认把追加染剂1/2 整个类别视为贵重。用户可以全不选。`general`、`extra1`、`extra2` 是一对多颜色范围，`storeSpecial` 是商城特殊染剂一对一颜色范围。分类表随游戏版本和染剂系统调整需要复核。
- 收藏柜、套装、同模型：已建立纯函数接口；同模型按 `主模型`、`副模型`、`ItemUICategory`、`EquipSlotCategory` 都完全一致分组，但没有正式 catalog 时返回 `missingCatalog`。
- 可交易物品检查：只提示静态 catalog 判定可交易、且实例 `spiritbond === 0` 的外观物品；缺失 `spiritbond` 或已绑定的条目不提示。
- 生产采集复制品：基于轻量复制品 catalog 命中当前 snapshot 中仍拥有的生产/采集复制品，每件按 `染剂兑换券 x4` 统计，并展示当前染剂返还。

## 安全边界

- 手动导入 JSON 视为不可信输入。
- 页面只在浏览器内处理 snapshot，不上传公开服务器。
- 错误信息不输出本机路径、堆栈、用户名、游戏安装路径、角色 ID 或 helper 调试信息。
- 当前 helper 只监听 `127.0.0.1`，不监听公网网卡。
- 当前 helper API 错误不得输出本机用户名、游戏安装路径、进程路径、角色 ID 或堆栈。
- 公开站点直连本地 helper 的浏览器私有网络访问限制仍需实测；手动导入必须保留为 fallback。
