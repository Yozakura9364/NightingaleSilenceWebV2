# NSArmoire 模块计划

## 当前状态

- 模块状态：已接入第一阶段页面入口、站点配置、路由、手动 snapshot 导入、内置示例 snapshot、基础容器分布统计、前端 catalog/analysis 类型、snapshot 级染色风险分析、第一版静态 `armoire_catalog`、可读处理提示、第一版本地 helper 接入和三分区工作台第一版；helper 当前已能读取投影台、背包、兵装库、鞍囊、当前已加载雇员缓存和收藏柜。
- 用户需求来源：`docs/ARMOIRE_PLAN.md`。
- 目标路由：`#/ffxiv/armoire`。
- 计划页面入口：`src/pages/armoire/NSArmoirePage.vue`。
- 计划模块名：`NSArmoire`。
- 计划工具名：`衣柜管家`。
- 计划形态：V2 网页工具 + 用户本机本地助手。
- 后续可选形态：独立卫月 / Dalamud 插件项目。该项目暂不放入 V2 仓库，真正启动前必须先阅读官方 Dalamud 开发者指南并单独规划。
- 当前 V2 后端状态：V2 自身没有后端，现阶段通过 Vite proxy 接旧 `NSGlamour`、`NSPlate` 服务和本机 `NSArmoire` helper。
- 当前本地助手正式项目：`H:\NightingaleSilenceWeb\NSArmoireButler`；V2 内 `tools/nsarmoire-helper` 只作为历史内置副本/开发参考。
- 当前本地助手分发口径：公开页面跳转到 `NSArmoireButler` 仓库 GitHub Releases 最新页，由用户下载 zip；页面不直链 `.exe` 或 `.zip`。
- 2026-07-08 已开始拆分 `NSArmoireButler` 独立项目：独立项目使用 `NSArmoireButler.exe` 作为发布产物，默认启动后打开 `https://nightingalesilence.com/#/ffxiv/armoire?connect=1`，网页带 `connect=1` 时自动连接本机 helper。Release 包提供 `register-protocol.ps1` 注册 `nsarmoire-butler://start`；网页连接失败时可尝试唤起该协议并自动重试连接。
- 2026-07-08 `NSArmoireButler` 当前 helper 版本为 `0.5.1`，`/probe` 增加 `snapshotContentHash`，用于前端保留 2 秒探针但只在可读衣柜内容变化时刷新完整 snapshot。Release 面向普通用户，不外显 SHA256 校验文案。
- 当前本地助手端口：`8015`，开发期 `/api/armoire/*` 代理到 `http://127.0.0.1:8015/*`；生产/公开页面直连 `http://127.0.0.1:8015`。
- 2026-07-05 已完成三分区工作台第一版：`NSArmoireWorkspace.vue` 改为“导入区 + 分区轨道 + 当前分区内容”，新增 `NSArmoireSectionRail.vue` 和 `NSArmoireCharacterPanel.vue`。当前分区包括衣柜清理、查漏补缺、角色配置；衣柜清理承接整理建议和容器分布，查漏补缺承接图鉴、商城、判定依据和静态数据，角色配置展示当前 snapshot 的角色名、服务器、来源、生成时间、条目数、雇员缓存数和本地角色缓存列表。尚未实现手动合并、商城账号购买状态或稳定角色 ID 自动合并。
- 2026-07-05 已建立第一版商城目录：`public/data/armoire-store-catalog.json` 记录国服商城公开商品列表中筛出的外观商品；有国际服商品链接时，未校正条目的 `itemIds` 以国际服商城商品详情 `items` + 日文 `Item.csv` 映射结果为主，国服商城说明只保留为国服商品名、链接、价格和无国际服链接时的待校正参考。商城卡片封面使用 `coverItemId`，仅用于展示图标，不参与拥有状态检测；`NSArmoireStorePanel.vue` 当前只根据 snapshot 检测这些物品是否出现在角色仓库中，不等同于账号购买记录。目录可通过 `npm run build:armoire-store-catalog` 刷新，生成脚本会尽量保留已有人工 `corrected: true`、`itemIds` 和 `coverItemId` 校正。
- 2026-07-06 已确认繁中服商城进度与其他服务器不同、整体较落后；繁中服链接只作为人工维护的地区参考链接参与格式校验，不参与自动抓取、漏网商品扫描或从链接反推 `itemIds`。
- 2026-07-05 商城目录已接入自动 tag：`tags` 记录 NPC时装、特典时装、典藏包、复制品时装、粉丝节时装、其他作品时装和游戏内节日来源；`detailTags` 只记录影响收集口径的男性限定、女性限定。国际服的角色单位、头部开闭可等展示属性不进入 `detailTags`。
- 2026-07-05 已新增隐藏商城数据校正页：`#/ffxiv/armoire/store-review`。该页不进入公开导航，只用于校正商城套装散件映射和国服、国际服、繁中服、韩服链接；页面编辑先保存在浏览器本地，并通过导出校正 JSON 交给开发侧回写 `armoire-store-catalog.json`。回写命令为 `npm run apply:armoire-store-corrections -- <corrections.json>`，可用 `--dry-run` 先验证。校正页可将家具、庭具、坐骑等误混入的非外观商品标记为排除，回写脚本会从正式商城目录中删除这些条目。
- 2026-07-06 商城数据校正页已支持手工编辑 `tags` 和 `detailTags`，并可按未打标签、已有标签、具体商城标签或男女限定筛选。标签来源仍以国际服商城自动分类为初始值，用户可在校正页增删 NPC时装、节日来源、男性限定、女性限定等标签；导出的校正 JSON 可通过 `npm run apply:armoire-store-corrections -- <corrections.json>` 回写。
- 2026-07-05 用户已确认当前 snapshot 可保存在浏览器本地缓存中，用于刷新或再次进入页面时直接恢复到衣柜清理页。2026-07-07 起当前实现改为使用 IndexedDB `nsarmoire-character-cache` 按角色保存完整 snapshot；`localStorage` 只保存当前 active profile key 和旧 `latestSnapshot` 的一次性迁移槽位。该缓存仍只在本机浏览器内，不上传公开服务器。
- 2026-07-05 已接入贵重染剂偏好第一版：页面允许用户在通用染剂、追加染剂1、追加染剂2、商城特殊染剂中选择哪些类别需要进入高风险染色清单；默认选择追加染剂1、追加染剂2和商城特殊染剂。染剂类别以当前游戏染剂合并后的颜色范围维护，后续游戏版本更新或染剂系统改动时必须复核该映射。
- 2026-07-06 已接入本地角色档案摘要第一版；2026-07-07 已升级为 IndexedDB 多角色完整 snapshot 缓存：`useArmoireCharacterProfiles.ts` 会在 snapshot 导入或 helper 刷新后按“角色名@服务器”记录最近一次完整 snapshot，同时维护摘要列表，包括角色名、服务器、数据时间、来源、条目数、已读取容器和雇员名列表。缺少角色名或服务器的 snapshot 会生成未识别档案键，避免混入其他角色。删除当前角色缓存时保留当前页面数据，但清除持久化记录，刷新后不会恢复该角色。
- 2026-07-06 已确认 NSArmoire 当前加载模型存在明显性能问题：生产包空进 `#/ffxiv/armoire` 也会请求 `armoire-catalog.json`，该文件约 6.5 MB raw、约 730 KB gzip，并会在客户端解析为 3 万多个 item 对象。后续暂停商城卡片扩展，先执行性能收缩计划。
- 2026-07-06 已完成静态 catalog 运行时拆分：普通工作台不再请求 `public/data/armoire-catalog.json`，改为按分区/tab 请求 `armoire-catalog-display-index.json`、`armoire-cabinet-catalog.json`、`armoire-glamour-set-catalog.json`、`armoire-identical-model-catalog.json`、`armoire-dye-catalog.json`、`armoire-store-catalog.json` 和 `armoire-store-item-display-index.json`。完整 catalog 继续保留为构建源、校正页和脚本校验输入，不作为普通页面运行时依赖。
- 2026-07-06 已进一步拆分物品显示索引：普通工作台改为按当前 snapshot itemId 请求 `public/data/armoire-item-display-chunks/*.json`，每个 chunk 覆盖 2000 个 itemId 区间；`armoire-catalog-display-index.json` 继续保留为完整显示索引和后续脚本/校正兜底，不作为衣柜清理默认请求。`衣柜清理` 默认不再请求 `armoire-identical-model-catalog.json`，同模型索引只在图鉴 tab 或手动刷新静态数据时加载。
- 2026-07-06 已继续拆分衣柜清理默认依赖：`衣柜清理` 不再默认请求完整 `armoire-cabinet-catalog.json` 和 `armoire-glamour-set-catalog.json`，改为按当前 snapshot itemId 请求 `public/data/armoire-cabinet-item-chunks/*.json` 和 `public/data/armoire-glamour-set-chunks/*.json`。完整收藏柜和套装 catalog 只在查漏补缺对应详情 tab 或手动刷新静态数据时加载。
- 2026-07-06 已将三类 itemId chunk composable 改为批量合并 reactive state：同一批 snapshot itemId 对应的 chunk 请求完成后最多写入一次 `chunksByKey`，避免每个 chunk 返回都触发 catalog computed 和 snapshot analysis 重算。
- 2026-07-06 生产预览性能 trace 继续确认：空进 `#/ffxiv/armoire` 不请求 `/data/armoire-catalog.json`，无主线程 long task；后置面板、商城 catalog 校验器和 helper API 已改为按需 chunk，空页不再加载 `itemDisplay-*`、`storeCatalog-*` 或 `nsarmoireHelperApi-*`。当前首屏最大剩余资源是全站中文像素字体 `fusion-pixel-12px-proportional-zh_hans.otf.woff2`，约 713 KB transfer。
- 2026-07-06 商城统计卡片已扩展为逐散件展示：每件散件显示已拥有/未拥有；已拥有散件列出 snapshot 中的容器位置和染色，超过 3 条副本时折叠剩余数量。地区商城入口按 `regionalStoreUrls` 拆成简中服、繁中服、GLOBAL 和 한국 按钮；该统计仍只表示当前角色 snapshot 中是否出现散件，不等同商城账号购买记录。
- 2026-07-06 本地 helper 已将背包/兵装库/鞍囊/雇员物品实例的 `spiritbond` 透出到 snapshot。该字段用于验证可交易装备的实例绑定状态，不能由静态 `Item.csv` 交易字段替代；第一轮验证样本为两件 `经典眼镜`：HQ 已绑定、NQ 未绑定。实际 snapshot 中两条 `itemId=9298` 分别输出 `spiritbond: 1` 和 `spiritbond: 0`。当前分析口径无视 HQ/NQ，只使用绑定关系：`spiritbond === 0` 视为已知未绑定，`spiritbond > 0` 视为已绑定，缺失 `spiritbond` 时不进入未绑定可交易清单。
- 2026-07-08 helper 前端接入已支持多进程选择、雇员缓存探针轮询、连接后静默刷新 snapshot、手动清空雇员缓存。页面可通过 `/processes` 和 `/process/select` 切换读取目标进程；连接 helper 后可见页面每 2 秒、隐藏页面每 10 秒轮询 `/probe`，首次探针只记录刷新签名，后续仅在角色、容器、雇员状态、雇员缓存或 `snapshotContentHash` 等探针签名变化时，延迟约 1.4 秒自动调用 `/snapshot/refresh`，避免每 2 秒重建完整 snapshot。`snapshotContentHash` 只暴露稳定内容哈希，不外显物品明细，可覆盖同容器等量交换、染色或绑定状态变化。
- 2026-07-08 衣柜分析新增行动项过滤：`inventoryType=12002` 或雇员容器名以 `市场` 结尾的雇员市场上架物品会从商城拥有状态、可交易物品、重复物品、同模型和生产采集复制品等行动建议中排除，避免把已挂市场的物品当成可整理背包库存。
- 2026-07-08 `衣柜统计` 已替换原查漏补缺图鉴位置，按容器/背包折叠展示当前 snapshot 物品图标；展开时才渲染对应容器图标。单件物品卡片和商城散件支持右键打开灰机 wiki，移动端用长按。
- 2026-07-08 已确认读取完整性提醒的产品分工：V2 网页顶部只显示角色、数据时间、基础收纳读取进度和雇员读取进度摘要；完整“还有哪些容器/雇员需要打开”的实时待读取清单更适合放进 `NSArmoireButler` exe GUI，避免用户在网页和游戏窗口之间反复切换。网页内完整容器结果继续放在 `衣柜统计`。
- 2026-07-08 商城面板改为“分组图标总览 + 选中详情”结构：先按来源/标签分组，再在组内按 Global 商品编号倒序；未拥有图标灰化。详情卡展示本地化套装名、各地区价格、右上角地区短链、暂无链接状态、填充色块标签和散件位置/染色。商城数据校正页改为每次加载 10 条并支持继续滚动加载，同时可编辑 `regionalPriceLabels`。
- 2026-07-08 已接入生产采集复制品回收板块：构建阶段输出轻量 `public/data/armoire-crafter-gatherer-replica-catalog.json`，当前候选 275 件、无缺失项；衣柜清理按 snapshot 命中项展示所在位置、回收可得 `染剂兑换券 x4` 和返还染剂。
- 2026-07-09 已接入角色级“已忽略装备”：用户可在清理建议物品卡片右键/移动端长按菜单中忽略某个 `itemId`，忽略后该物品种类不再参与收藏柜转入、套装散件、未绑定可交易、生产采集复制品、重复物品、同模型和染色风险等清理建议；原始 snapshot、衣柜统计和拥有状态不变。忽略配置跟随 IndexedDB 角色档案持久化，只保存 itemId 列表，并在角色配置中提供查看、取消和清空入口。旧版 `localStorage` 忽略列表会在打开对应角色档案时迁入角色记录。

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
- `Seventhxiv/Collections` 公开仓库的 `Collections/Data/Providers/DresserObserver.cs` 和 `ItemFinder.cs` 收藏柜口径
- `Critical-Impact/InventoryTools` 公开仓库的 `CriticalCommonLib/Services/InventoryScanner.cs`、`InventoryMonitor.cs`、`CharacterMonitor.cs` 雇员读取和缓存口径

## 需求理解

`NSArmoire` 不是单纯的收藏柜页面，而是一个 FFXIV 外观仓库检查与清理工具。

目标能力包括：

1. 用户启动本地助手，本地助手读取游戏客户端相关数据。
2. 数据范围希望覆盖背包、陆行鸟鞍囊、雇员背包、兵装库、投影台、收藏柜。
3. 用户从本地助手点击查看，跳转到 V2 的 `#/ffxiv/armoire` 页面检查仓库。
4. 工具提前载入 FFXIV 客户端/静态游戏数据，识别可投影、可放入收藏柜、套装幻影化、失物回购、同模型等关系。
5. 页面展示收藏柜收集进度、未收藏物品、外观分布和清理建议。
6. 页面需要统计商城时装收集情况：已购买几套、还差几套没买、缺少哪些商城套装。
7. 读取到的信息当前必须包含角色名和服务器，支持同一玩家多个角色分别排查商城时装、图鉴和仓库状态；稳定角色 ID 作为后续增强，不阻塞当前验证。
8. 页面信息架构改为三大分区：衣柜清理、查漏补缺、角色配置。
9. 参考 `Asvel/ffxiv-dresser-analyze` 的同类功能，但需要扩展到更完整的物品来源分布。

关键判断：

- 纯浏览器无法直接读取本机游戏进程、背包、投影台或客户端 `sqpack`。
- 自动读取用户拥有状态必须依赖本地助手或 Dalamud 插件。本模块当前优先选择“网页 + 本地助手”路线。
- `NSGlamour` 已有成熟静态映射数据路线，可复用为装备、染剂、多语言、图标、模型码基础数据。
- `Asvel/ffxiv-dresser-analyze` 已验证“本地程序读取游戏进程 + Lumina 读取 sqpack + localhost 给网页提供 JSON”的路线可行，但它主要读取投影台；背包、雇员、兵装库等更大范围需要单独验证。
- `Critical-Impact/InventoryTools` 的全雇员显示不是一次性直接读完所有雇员背包，而是通过当前活动雇员 ID + 已加载雇员容器 + 按雇员 ID 分组的本地缓存逐步积累；NSArmoire helper 当前采用同类口径。
- `Seventhxiv/Collections` 的收藏柜读取核心是 `UIState.Instance()->Cabinet`：先确认 `Cabinet.IsCabinetLoaded()`，再按 `Cabinet.csv` RowId 调用 `IsItemInCabinet`；NSArmoire helper 当前采用外部读取 `Cabinet.UnlockedItems` bitset + catalog `cabinetEntries` 映射的口径。
- Dalamud 插件路线作为后续独立项目预研，不纳入当前 V2 第一阶段实现。该路线开工前必须先读官方 Dalamud 开发者指南，确认插件模板、API 能力、读取边界、权限/安全、分发方式和版本兼容。

## 模块定位

`#/ffxiv/armoire` 是 FFXIV 工具分类下的外观收集和仓库清理模块。它应服务于反复整理外观、投影台、收藏柜、背包与雇员仓库的玩家。

第一阶段不要直接追求“全自动读取所有容器”。更稳的路线是先建立稳定数据契约和前端分析能力，再逐步扩大本地助手读取范围。

推荐产品分层：

| 层级         | 用户价值                           | 实现方式                                                                                                               |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 手动导入模式 | 不安装 helper 也能试用分析能力     | 用户导入 JSON snapshot                                                                                                 |
| 本地助手模式 | 自动读取本机游戏数据并打开网页     | helper 读取数据后提供 localhost API 或导出 JSON                                                                        |
| 深度读取模式 | 覆盖更多容器和更细建议             | 逐步验证背包、鞍囊、雇员、兵装库、投影台、收藏柜读取路线                                                               |
| 商城时装统计 | 形成区别于普通投影台助手的收集目标 | 已建立国服商城目录第一版；当前按 snapshot 检测角色仓库中是否出现商城套装散件，账号购买状态仍需手动标记、导入或授权读取 |
| 多角色档案   | 同一玩家可按角色分别排查收集状态   | snapshot 当前使用角色名 + 服务器作为可用身份键，后续补稳定角色 ID 以支持改名/转服自动合并                              |

## 三分区工作台计划

NSArmoire 后续页面不继续把所有分析结果纵向摊开，而是改为左侧分区导航 + 右侧当前工作区的结构。参考 `https://mc.susudesu.com/#/tools` 的侧边栏思路：窄状态常驻图标轨，当前分区以嵌入式高亮表达，hover 或宽屏状态可以展开文字。只借鉴“图标轨 + 当前项清晰高亮 + 工具区切换”的信息架构，不照搬其黑黄配色、站点品牌或内容卡片。

三大分区：

| 分区     | 主要问题                           | 放置内容                                                                                         |
| -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| 衣柜清理 | 我现在应该整理哪些衣服             | 收藏柜可转入、投影台可纳入、残缺套装、重复物品检查、同模型多余、已染色可收纳物品、容器分布摘要   |
| 查漏补缺 | 我还缺哪些外观和套装               | 图鉴、收藏柜进度、投影台套装进度、商城时装已买/未买、缺失套装/散件、按角色过滤的收集进度         |
| 角色配置 | 当前数据属于哪个角色，如何管理多号 | 角色名 + 服务器、本地角色档案、上次更新时间、数据来源、手动重命名显示、改名/转服后的手动合并入口 |

交互原则：

1. 左侧分区导航是 NSArmoire 页面私有组件，不进入全站 `AppTopNav`，也不替代 FFXIV 分类导航。
2. 桌面端优先使用窄轨图标菜单，hover 或展开状态显示分区名；移动端降级为顶部三段式切换或横向 tab，避免占据过多宽度。
3. `衣柜清理` 是默认分区，因为它承接用户导入数据后的第一行动。
4. `查漏补缺` 只展示收集和补全，不再混入判定依据、catalog 加载等技术核对信息。
5. `角色配置` 是数据底座，不只是设置页；当前选中角色会影响衣柜清理、查漏补缺、商城时装统计和图鉴筛选。
6. 判定依据、静态数据状态、helper 调试状态等仍保留，但默认放在后置详情或分区内的辅助区域，不抢首屏。

项目改造评估：

| 层级       | 涉及文件                                                                 | 评估                                                                                             |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 页面外壳   | `NSArmoireWorkspace.vue`                                                 | 需要从纵向信息流改为“分区导航 + active section”容器；保留现有 import/helper/catalog 组合状态。   |
| 新导航组件 | `NSArmoireSectionRail.vue`（计划新增）                                   | 页面私有左侧图标轨；文案和 aria-label 走 `src/locales/ui.ts`。                                   |
| 衣柜清理区 | `NSArmoireInsightPanel.vue`、`NSArmoireOverview.vue`                     | 现有处理建议基本可复用；只需要调整组合位置和摘要密度。                                           |
| 查漏补缺区 | `NSArmoireCatalogPanel.vue`、`NSArmoireStorePanel.vue`                   | 现有图鉴已迁入；商城面板独立读取 store catalog，并按当前 snapshot 检测角色仓库中出现的商城散件。 |
| 角色配置区 | `NSArmoireCharacterPanel.vue`、`useArmoireCharacterProfiles.ts`、`armoireSnapshotStore.ts` | 基于当前 snapshot 展示角色身份、上次更新时间、读取范围和本地角色缓存列表；IndexedDB 保存每个角色最近一次完整 snapshot，支持切换和删除本地缓存；合并功能需要谨慎设计确认。 |
| 数据契约   | `src/lib/armoire/types.ts`、`normalizeSnapshot.ts`、helper `Models.cs`   | 当前 helper 已写入 `character.name` 和 `character.world`；`character.id` 仍是后续稳定身份预留。  |
| 本地持久化 | `useArmoireCharacterProfiles.ts`、`armoireSnapshotStore.ts`              | IndexedDB 保存每个角色最近一次完整 snapshot；内存里只维护摘要列表；`localStorage` 只保存 active profile key 和旧缓存迁移槽位。 |
| 本地化     | `src/config/site.ts`、`src/locales/ui.ts`                                | 新增三分区标题、导航 aria、角色配置字段和状态文案；所有可见固定文案必须走 key。                  |
| 样式       | `NSArmoireWorkspace.vue` 或私有 CSS                                      | 属于 NSArmoire 页面专属样式；不改公共组件默认外观，不引入新依赖。                                |

建议第一刀实现顺序：

1. 先补齐 snapshot 角色身份代码契约：`character.name`、`character.world`、校验、示例 snapshot、helper 输出预留；`character.id` 后续再攻克。
2. 新增三分区 shell 和 `NSArmoireSectionRail.vue`，只搬现有内容，不改分析规则。
3. 把现有 `NSArmoireInsightPanel` 和容器分布放入“衣柜清理”。
4. 把现有 `NSArmoireCatalogPanel` 放入“查漏补缺”，并保留“判定依据/静态数据”为辅助 tab 或详情。
5. 新增“角色配置”第一版，只展示当前 snapshot 角色、上次更新时间、本地档案占位和后续合并入口状态；不先实现复杂合并。
6. 再进入商城时装 catalog 与多角色购买状态设计。

第一轮不建议同时做：

- 不建议一口气实现商城时装抓取、购买状态管理和角色合并。
- 不建议把左侧分区导航抽成全站公共组件。
- 不建议修改 helper 读取更多容器；这和页面信息架构可以解耦。
- 不把完整 snapshot 持久化到 `localStorage`；多角色完整 snapshot 只保存到 IndexedDB，避免 localStorage 容量和同步初始化成本。

## 性能收缩计划

当前 NSArmoire 的性能问题不是单纯的商城卡片数量，而是页面进入时过早加载完整静态 catalog，并且完整分析会把多个子系统一起计算。性能优化必须先收缩加载模型，再继续扩展商城卡片详情。

已实测生产包空页面资源：

| 资源 | 传输体积 | 解压/解析后体积 | 说明 |
| ---- | -------- | --------------- | ---- |
| `public/data/armoire-catalog.json` | 约 730 KB gzip | 约 6.5 MB JSON | 当前空页面也会加载，是首要问题 |
| `public/data/armoire-store-catalog.json` | 约 39 KB gzip | 约 324 KB JSON | 体积可接受，但也应延迟到查漏补缺或商城统计需要时 |
| 中文像素字体 | 约 713 KB | 约 713 KB | 属于全站字体成本，暂不在 NSArmoire 内单独处理 |

当前拆分后的运行时静态数据：

| 资源 | 传输体积 | 解压/解析后体积 | 用途 |
| ---- | -------- | --------------- | ---- |
| `public/data/armoire-catalog-display-index.json` | 约 267 KB gzip | 约 1.11 MB JSON | 图鉴和整理建议的物品名、图标、外观 item 过滤 |
| `public/data/armoire-item-display-chunks/*.json` | 单块最大约 18 KB gzip；全量约 286 KB gzip | 单块最大约 75 KB JSON；全量约 1.12 MB JSON | 普通工作台按当前 snapshot itemId 加载的物品名、图标和外观 item 过滤 |
| `public/data/armoire-cabinet-item-chunks/*.json` | 单块最大约 10 KB gzip；全量约 80 KB gzip | 单块最大约 41 KB JSON；全量约 291 KB JSON | 衣柜清理按当前 snapshot itemId 加载可转入收藏柜关系；空区间也生成空 chunk，避免 404 |
| `public/data/armoire-glamour-set-chunks/*.json` | 单块最大约 59 KB gzip；全量约 202 KB gzip | 单块最大约 247 KB JSON；全量约 808 KB JSON | 衣柜清理按当前 snapshot itemId 加载相关投影台套装和散件关系；空区间也生成空 chunk，避免 404 |
| `public/data/armoire-cabinet-catalog.json` | 约 82 KB gzip | 约 410 KB JSON | 查漏补缺收藏柜详情的完整进度、可转入/缺失收藏柜物品 |
| `public/data/armoire-glamour-set-catalog.json` | 约 105 KB gzip | 约 408 KB JSON | 查漏补缺套装详情的完整投影台套装、套装散件和套装篮建议 |
| `public/data/armoire-identical-model-catalog.json` | 约 204 KB gzip | 约 1.07 MB JSON | 同模型分组检查 |
| `public/data/armoire-dye-catalog.json` | 约 3 KB gzip | 约 14 KB JSON | 染剂名称、颜色和价值分类 |
| `public/data/armoire-store-item-display-index.json` | 约 11 KB gzip | 约 51 KB JSON | 商城卡片散件名和图标 |

性能预算：

1. 空进 `#/ffxiv/armoire` 不得请求 `armoire-catalog.json`。
2. 未导入 snapshot 时，只加载页面外壳、导入区和 helper 控制，不加载任何大 catalog。
3. 进入 `查漏补缺` 前，不加载 `armoire-store-catalog.json`。
4. `衣柜清理` 默认只跑基础统计和按当前 snapshot itemId 命中的轻量整理提示；需要完整 catalog 的收藏柜、套装、同模型分析按功能区延迟计算。
5. 商城统计不应依赖完整 6.5 MB catalog；如需显示散件图标、染剂、所在容器，优先使用商城专用轻量索引。
6. 单次首屏渲染卡片数控制在 24-48；散件详情、所在容器和染色情况按卡片展开或详情层懒渲染，不默认全展开。

实施顺序：

1. 止血：移除 `useArmoireCatalog()` 和 `useArmoireStoreCatalog()` 的页面挂载自动加载，改为由工作台在需要时显式加载。
2. 止血：空页面和只打开导入区时不加载主 catalog；导入 snapshot 后先只展示基础统计。
3. 计算收缩：`analyzeArmoireSnapshot` 只构建一次 `ownedIndex`，传入收藏柜、套装、染色、同模、重复物品等子分析，避免重复扫描 snapshot。
4. 数据收缩：将完整 `armoire-catalog.json` 拆成多个按需加载的静态索引，例如 item 显示索引、收藏柜索引、套装索引、同模索引和染剂索引。
5. UI 收缩：商城卡片新增“散件在哪、染什么色、多地区商城按钮”前，必须先做按需展开；默认卡片只展示套装状态、散件名和精简地区入口。
6. 主线程收缩：如果真实大 snapshot 下仍有明显卡顿，再把同模和大列表分析移入 Web Worker；不要先引入 Worker 复杂度。

验证方式：

1. 用生产预览访问 `#/ffxiv/armoire`，确认空页面资源列表中没有 `/data/armoire-catalog.json`。
2. 载入示例 snapshot 后，确认衣柜清理区可用且没有提前加载商城 catalog。
3. 点击 `查漏补缺` 或商城 tab 后，才加载需要的 catalog。
4. 跑 `npm run check:i18n`、`npm run typecheck`、`npm run build`。
5. 用 Playwright 检查页面 identity、空页面、载入示例、进入查漏补缺四个状态，无框架错误覆盖层和关键 console error。

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
5. 提供内置示例 snapshot，用于没有真实游戏导出时快速查看页面分析状态。
6. 不接本地 helper，不读取游戏进程，不保存完整 snapshot 到 `localStorage`。

内置示例 snapshot 说明：

- 文件：`src/lib/armoire/exampleSnapshot.ts`。
- 只用于前端演示和人工验收，不代表真实角色仓库数据。
- 覆盖场景包括：柯塔纳同模型、梦幻套装缺散件、收藏柜已有/可转入、染色风险和基础容器分布。
- 后续接入真实 helper 后，示例入口仍可作为无数据状态下的体验预览和回归样本。

当前已完成的第一阶段 B：

1. 建立 `ArmoireCatalog v1` 前端类型。
2. 建立收藏柜进度、套装状态、染色风险、同模型重复的纯函数分析入口。
3. 在没有正式 catalog 时，收藏柜、套装和同模型分析返回 `missingCatalog`，页面显示等待 catalog，不输出伪结果。
4. 染色状态可先基于 snapshot `dyes` 字段工作；真正会清除染色的收纳目标第一版按“收藏柜”和“套装幻影化篓子”处理，其他收纳系统暂按保留染色处理。
5. 页面新增分析面板，把分析数据转换成用户可读的处理提示和具体物品清单；数字只作为辅助，不作为主要信息。
6. 确认同模型第一版口径：`Item.csv` 的 `Model{Main}` / 灰机 `主模型`、`Model{Sub}` / 灰机 `副模型`、`ItemUICategory` 和 `EquipSlotCategory` 都完全一致才归为同模型；这是并且关系。非装备、腰带、灵魂水晶和暂未纳入筛选的槽位不进入第一版同模分组。
7. 图鉴区已支持按筛选、搜索和排序浏览导入条目；搜索/排序状态由页面组件持有，具体匹配和排序规则放在 `useArmoireCatalogGrid.ts`，卡片组件只消费 view model。
8. 页面新增判定依据面板，用示例或导入 snapshot 展示重复物品、同模型、收藏柜候选和染色风险的规则、使用字段、命中物品、当前位置和结论，帮助在没有真实游戏数据时也能验证分析逻辑。

分析 UI 规则：

- 概览区不能只展示数字，应先说明“导入了多少记录、分布在几个容器、投影台/收藏柜各有多少、是否存在染色风险”。
- 分析区优先展示“处理提示”，例如可转入收藏柜、残缺套装、同模型多余和染色确认。
- 页面导入区下方优先展示用户要处理的清单：可转入收藏柜、残缺套装、重复物品检查、同模型多余、已染色可收纳物品和图鉴；静态 catalog 状态、概览、判定依据等偏技术/核对信息下放。
- 页面主线按三层组织：先给用户“整理顺序”，再展示“衣服在哪”的容器分布，最后把图鉴、判定依据和静态数据状态放入后置核对区；不要把调试/技术核对信息与首屏行动清单并列。
- NSArmoire 是高文字密度整理工具，页面内部使用正常无衬线阅读字体；不要沿用全站像素装饰字体作为大段文字、按钮、tab 或清单标题的默认字体。
- 每条提示应尽量列出具体物品名；没有 catalog 名称时普通清单显示未识别物品，不直接外显 `物品 ID`。
- 清单型提示应尽量同时显示物品当前所在容器或来源位置，例如背包、兵装库、投影台、收藏柜或雇员名，避免用户只看到物品名却不知道去哪处理。
- 普通用户清单不外显物品 ID；`itemId`、模型字段、CSV 字段等技术信息只放在后置的判定依据/技术核对区。
- 如果 catalog 中存在 `iconId`，清单型提示可以显示游戏物品图标；当前前端按 `https://img.nightingalesilence.com/ui/icon/<folder>/<icon>_hr1.png` 使用站点自托管图标源，后续本地 helper 的 `/icon/:itemId` 仍可作为严格匹配本机客户端版本的可选能力。
- “重复物品检查”与“同模型多余”分开：前者只判断同一个 `itemId` 在 snapshot 中出现多条记录；后者判断不同物品是否使用同一套模型。
- “同模型多余”是占格成本建议，不是收集度惩罚。收藏柜当前没有格子限制，检测口径固定为：同模型组全在收藏柜里时忽略；收藏柜里有、投影台/背包/兵装库/雇员/鞍囊等占格系统里也有时正常提示；全在占格系统里时也正常提示。用户侧只把占格系统中的条目标为可处理，不把收藏柜条目标为多余。
- 统计数字保留，但作为提示的辅助信息，不替代可读结论。
- 清单型提示默认预览前 4 条；当完整清单超过 4 条时提供展开/收起控制。展开点击本身不能同步挂载更多物品，应把首批和后续批次都延迟到下一帧/浏览器空闲时间小批量渲染，避免真实数据导入后一次挂载几十到几百个物品行和图标导致浏览器卡顿。
- 清单型提示的物品项应优先使用紧凑多列布局，不用全宽长横条；长位置/ID 信息可以压缩展示，但应保留悬停 title 或后续详情入口，避免用户丢失核对信息。
- 残缺套装和同模型多余属于高关注清单，除了显示主物品，还应展示缺失散件或同模型组内物品的图标和名称；这类“组”条目适合使用长横条，主物品信息在左，关联图标横向排列在右，视觉重量高于普通单件清单。
- 静态 catalog 状态必须对用户可见，至少说明加载中、已加载、失败和已加载的数据规模；收藏柜、套装、同模型这些依赖 catalog 的检查在 catalog 未就绪时不能显示成“全部正常”。
- 图鉴式 UI 参考 FFXIV Collect 的“可浏览收藏条目 + 筛选 + 进度感”，但不照抄其视觉；第一版 `NSArmoireCatalogPanel.vue` 只消费 `useArmoireCatalogGrid.ts` 生成的 view model，卡片组件不直接写收藏柜、套装、同模型或染色业务判断。
- 图鉴按 `itemId` 聚合同一物品，不按 snapshot 拥有记录逐条铺卡；同一物品出现多条记录时，在一张卡内通过数量、位置、染色状态和重复物品标签体现。
- 图鉴不能一次性挂载真实 snapshot 的全部物品卡和图标；默认只渲染首批结果，通过“继续显示”分批增加，避免图鉴底部的大量 DOM/图片拖慢页面上方清单的点击响应。
- 图鉴搜索优先匹配物品名、容器、数量/染剂显示和标签；普通用户入口不把物品 ID 作为可见检索条件，ID 留在后置技术核对区。
- 图鉴当前结果摘要只展示当前筛选/搜索后的可见条目、处理项、染色项和重复相关数量；它是浏览辅助，不替代分析面板的正式建议。
- 判定依据面板用于解释分析规则，不另写第二套业务判断；展示数据应来自 `ArmoireSnapshotAnalysis`、`ArmoireCatalog` 和 snapshot 原始条目。
- 判定依据至少展示规则、使用字段和结论；命中项应尽量显示物品名、物品 ID、当前位置、模型字段、目录命中或染剂原始值，方便人工核对。
- “可转入收藏柜”的用户清单必须同时满足：静态 catalog 判定可放入收藏柜、当前已拥有、当前不在收藏柜，并且 snapshot 中至少有一条未染色的同 `itemId` 拥有记录；如果同一物品另有染色副本，仍可提示未染色副本可转入，但必须在收藏柜未收纳清单中标注该物品“已拥有 / 有染色”。
- “收藏柜未收纳”只表示该 `itemId` 当前不在收藏柜，不等同于未拥有。未收纳清单需要区分：已在背包/兵装库/投影台/雇员等其他容器中的物品标“已拥有”，其中任一拥有记录带染色时额外标“有染色”；完全没在 snapshot 中出现的物品才标“未拥有”。
- 染色判定必须区分“记录到染色状态”和“收纳会清除染色”：进入或位于收藏柜、放入套装幻影化篓子会清除染色；投影台、背包、兵装库、雇员、鞍囊等其他收纳系统暂按不清除染色处理。
- 顶部处理提示和图鉴高风险染色筛选只应把会清除染色的条目当成染色风险；普通已染色但当前收纳不清染色的条目可以在后置判定依据中作为状态记录展示。
- 高风险染色清单还必须结合用户选择的贵重染剂类别。当前四类为：通用染剂、追加染剂1、追加染剂2、商城特殊染剂；默认贵重类别为追加染剂1、追加染剂2和商城特殊染剂。用户可以全不选，此时染色状态仍可在后置判定依据中看到，但顶部高风险清单不应继续提示。
- `NSArmoireInsightPanel.vue` 只负责分析面板组合；卡片外壳在 `NSArmoireActionCard.vue`，可读物品清单在 `NSArmoireReadableItemList.vue`，分析结果到 UI 的 view model 在 `useArmoireInsightViewModels.ts`，显示格式化工具在 `utils/insightDisplay.ts`。
- `NSArmoireValidationPanel.vue` 只负责展示判定依据；分析结果到 UI 的 view model 在 `useArmoireValidationViewModels.ts`。

当前已完成的第一阶段 C：

1. 新增 `scripts/build-armoire-catalog.mjs`，从 datamining CSV 构建 `ArmoireCatalog v1`。
2. 默认从 `InfSein/ffxiv-datamining-mixed` 的 `chs` 目录读取 `Item.csv`、`Cabinet.csv`、`MirageStoreSetItem.csv`、`Stain.csv`，同时保留本地 `--source-dir` 作为 fallback。
3. 输出轻量静态数据到 `public/data/armoire-catalog.json`，不把原始 CSV 或完整多语言映射放入前端。
4. 页面启动后加载该静态 catalog；加载成功时收藏柜、套装和同模型分析进入正式口径，加载失败时继续显示 catalog pending。
5. 本阶段仍不接本地 helper，不读取游戏进程，不新增 Vite proxy；该限制只适用于第一阶段 C，后续 helper v0.1 已单独接入。
6. 页面新增 catalog 状态提示，显示物品、收藏柜、套装、同模型和染剂目录规模；当 catalog 加载失败或缺失时，处理提示必须追加“部分检查等待静态数据”，避免把 pending 状态误读为无风险。

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

第一版 V2 静态 catalog 生成规则：

- 生成脚本：`scripts/build-armoire-catalog.mjs`。
- 默认来源：`https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/*.csv`。
- 可选本地来源：`node scripts/build-armoire-catalog.mjs --source-dir <datamining chs dir>`。
- 默认输出：`public/data/armoire-catalog.json`。
- catalog 只保留分析需要的轻量字段：
  - `Item.csv`：`#`、`Name`、`Icon`、`ItemUICategory`、`EquipSlotCategory`、`DyeCount`、`Model{Main}`、`Model{Sub}`、`IsGlamourous`。
  - `Cabinet.csv`：收藏柜可收纳 item id。
  - `MirageStoreSetItem.csv`：套装容器 item id 与 `Item[0]` 到 `Item[8]` 的散件关系。
  - `Stain.csv`：后续用于染剂名称、颜色和贵重染剂判断；第一版可先为 catalog 预留，不强制接 UI。
- 同模型分组由 catalog item 的 `Model{Main}`、`Model{Sub}`、`ItemUICategory`、`EquipSlotCategory` 构建，保持第一版严格口径。
- 生成脚本必须输出 summary，至少包含 item、cabinet、set、identical group 数量和来源信息，便于后续更新 CSV 时检查异常。

### 用户拥有状态

本模块核心输入应设计为 snapshot，而不是让页面直接理解游戏内存结构。

建议第一版数据契约：

```ts
type ArmoireContainerKind =
  'inventory' | 'saddlebag' | 'retainer' | 'armoury' | 'glamourDresser' | 'armoire' | 'manual'

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

规则：

1. 前端分析只依赖 snapshot，不依赖 helper 内部字段。
2. helper 读取到的所有游戏状态先归一成 snapshot。
3. 用户仓库数据默认只在本机浏览器和本地 helper 间流动，不上传到公开服务器。
4. snapshot 版本必须显式写入，后续数据结构升级可兼容旧导入文件。
5. `hq`、`quantity`、`dyes`、`spiritbond` 属于用户拥有的物品实例状态，不来自静态 CSV。当前第一阶段只正式使用 `dyes` 记录染色状态，并结合静态 catalog 判断收藏柜和套装幻影化篓子的清染色风险；后续 helper / 插件抓数据阶段再按真实可读字段扩展耐久、魔晶石、投影覆盖、制造者签名等状态。
6. 静态 CSV 只能提供物品能力和目录信息，例如 `Item.csv / DyeCount` 表示可染色槽数、`Stain.csv` 表示染剂名和颜色；不能用来判断用户某一件装备当前是否已染色或当前染剂。
7. 多角色场景当前优先读取并保留 `character.name` 和 `character.world`，作为“某角色 @ 某服务器”的可用身份；`character.id` 后续补齐后再作为改名/转服自动合并的稳定键。
8. 如果某个来源暂时无法提供稳定角色 ID，页面仍可按角色名 + 服务器展示和人工选择档案，但不能自动处理改名、转服后的历史合并，必须保留手动合并入口。

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

| 输出                     | 说明                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `cabinetProgress`        | 收藏柜正式收集度：收藏柜现有个数 / 可放入收藏柜的个数                                   |
| `containerDistribution`  | 外观物品在背包、鞍囊、雇员、兵装库、投影台、收藏柜中的分布                              |
| `glamourSetProgress`     | 投影台套装投影化进度：已套装投影化个数 / 可套装投影化的个数                             |
| `setRecommendations`     | 已有外观中可套装幻影化、接近成套、或已套装投影化但缺件的组合                            |
| `cabinetRecommendations` | 可放入收藏柜且风险较低的物品                                                            |
| `duplicateItems`         | 同一个 `itemId` 在 snapshot 中出现多条记录的精确重复物品                                |
| `duplicateModelGroups`   | `Model{Main}`、`Model{Sub}`、`ItemUICategory`、`EquipSlotCategory` 都完全一致的重复装备 |
| `dyeRiskItems`           | 已染色、双染色或高价值染剂相关风险项                                                    |
| `crafterGathererReplicas` | 当前仍拥有的生产采集复制品，以及回收后可获得的染剂兑换券和返还染剂                      |
| `missingItems`           | 用户未拥有但属于收藏柜/套装/同模补全目标的物品                                          |

### 生产采集复制品回收板块

衣柜清理已新增 `生产采集复制品` 板块，用于列出当前角色仍拥有的生产/采集复制品，并计算官方回收补偿。

当前功能：

1. 列出 snapshot 中仍拥有的生产采集复制品。
2. 每件显示当前所在容器/背包位置。
3. 每件显示是否染色；如果已染色，展示染剂色块、染剂名和染剂槽位。
4. 每件计算回收收益：`染剂兑换券 x4`。
5. 每件同时统计该部件上已染染剂的返还。
6. 板块汇总总件数、总染剂兑换券数量和可返还染剂清单。

识别口径必须保守。不能只用中文名包含 `（复制品）` 判断，因为游戏数据里还有大量武器、古武或非生产采集装备也带有 `（复制品）`。当前使用构建阶段生成的轻量 itemId 列表，不让普通页面重新依赖完整 catalog。

第一轮候选条件：

1. 只针对国服和韩服存在的生产/采集复制品。
2. 国服名称包含 `（复制品）`。
3. 品级为 `1`。
4. 装备等级为 `1`。
5. 品质颜色为蓝色或绿色。
6. 物品类型必须属于生产/采集相关装备。
7. 排除武器、古武、战斗职业复制品和其它同名误命中的复制品。

当前实现：

1. `scripts/build-armoire-catalog.mjs` 输出 `public/data/armoire-crafter-gatherer-replica-catalog.json`，schema 为 `nsarmoire.crafterGathererReplicaCatalog.v1`。
2. 当前候选列表为 275 个 itemId，`items` 显示项 275 条，`missingItemIds` 为 0；已排除 `23343`、`23344`，`27956` 因装备槽位口径不命中。
3. `src/lib/armoire/analyzeCrafterGathererReplicas.ts` 只消费 actionable owned index、候选 itemId 集合和已加载显示/染剂数据。
4. 分析结果记录 `itemId`、数量、容器位置、染剂槽位、单件兑换券数量、合计兑换券数量和返还染剂。
5. `analyzeArmoireSnapshot()` 已接入该分析，衣柜清理板块展示，不影响商城图鉴和角色配置。
6. UI 文案全部走本地化 key，不在 Vue 模板或组件脚本中硬编码展示文案。

验证要求：

1. 用候选列表样例确认不会把古武、武器和战斗职业复制品误纳入。
2. 用含未染色、单染、双染复制品的 snapshot 样本验证染剂返还。
3. 验证合计券数为 `命中件数 * 4`。
4. 验证无命中时显示空状态，不影响现有衣柜清理建议。
5. 验证新增数据源不会导致空页面重新加载完整 `armoire-catalog.json`。

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
│   ├── useArmoireCharacterProfiles.ts
│   ├── useArmoireSnapshot.ts
│   ├── useArmoireImport.ts
│   └── useArmoireAnalysis.ts
└── components/
    ├── NSArmoireSectionRail.vue
    ├── NSArmoireCleanupSection.vue
    ├── NSArmoireCollectionSection.vue
    ├── NSArmoireCharacterPanel.vue
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
5. `useArmoireCharacterProfiles.ts` 后续负责本地角色档案、上次更新时间和手动合并关系，不直接承载分析规则。
6. `NSArmoireSectionRail.vue` 只负责三分区导航，不读取业务数据。
7. `NSArmoireCleanupSection.vue` 组合衣柜清理相关处理建议；`NSArmoireCollectionSection.vue` 组合图鉴和后续商城时装统计。
8. 复杂表格、筛选、风险标签、建议列表拆成组件，避免页面文件膨胀。

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

| 接口                     | 用途                                         |
| ------------------------ | -------------------------------------------- |
| `GET /health`            | helper 状态、版本、游戏进程状态              |
| `GET /snapshot`          | 当前用户物品 snapshot                        |
| `POST /snapshot/refresh` | 触发重新读取                                 |
| `GET /catalog`           | 与当前客户端版本对应的静态 catalog，后续可选 |
| `GET /icon/:itemId`      | 物品图标，后续可选                           |
| `GET /open-v2`           | 可选，打开 V2 对应页面                       |

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

- `Asvel` 已验证投影台读取路线；当前独立项目 `NSArmoireButler` 已在本机验证外部读取投影台、背包、兵装库、鞍囊、当前已加载雇员和收藏柜，但这些都仍依赖当前游戏版本签名和结构偏移。
- 进程内存结构会随游戏版本变化，读取逻辑必须有版本探测、失败提示和保守 fallback。
- 如果内存签名、结构偏移或容器语义随游戏版本变化，先到 Dalamud Plugin Browser（`https://tommadness.github.io/Plugin-Browser/`）按能力关键词查找开源插件，再从公开仓库里确认对应 `FFXIVClientStructs` 结构、Dalamud API 或插件缓存口径；实际落地仍必须回到本机 `FFXIVClientStructs.dll/xml` 和 helper `/probe` 验证。
- 雇员全量归档不是一次性全读；当前方案是读取当前活动雇员并缓存，用户需要逐个打开雇员让 helper 累积。这是正式同步流程，不作为未攻克难点。
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
vite.config.ts
src/pages/armoire/NSArmoirePage.vue
src/pages/armoire/composables/useArmoireSnapshot.ts
src/pages/armoire/components/*
src/lib/armoire/*
H:\NightingaleSilenceWeb\NSArmoireButler\*
tools/nsarmoire-helper/*（历史内置副本/开发参考）
```

第一阶段 A/B 只做手动导入和前端分析，没有修改 `vite.config.ts`，也没有为 `NSArmoire` 创建 helper API 边界。

第一版本地 helper 接入后，`src/config/site.ts`、`src/services/apiBoundaries.ts` 和 `vite.config.ts` 已补充 `/api/armoire` 开发代理；公开页面仍以浏览器直连 `http://127.0.0.1:8015` 为主。

## 实施步骤

### 阶段 0：确认范围和数据契约

1. 确认路由是否固定为 `#/ffxiv/armoire`。
2. 确认工具名 `衣柜管家` 是否作为正式展示名。
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

### 阶段 2.5：静态 catalog 接入

1. 新增 `scripts/build-armoire-catalog.mjs`，从关键 CSV 生成 `ArmoireCatalog v1`。
2. 新增 npm script `build:armoire-catalog`，用于刷新 `public/data/armoire-catalog.json`。
3. 前端新增 catalog 读取入口，默认请求 `/data/armoire-catalog.json`。
4. `NSArmoireWorkspace.vue` 将加载到的 catalog 传给 `analyzeArmoireSnapshot`。
5. catalog 加载失败时继续保守显示 `missingCatalog`，不输出伪进度。
6. 验证生成 summary、类型检查和 Vite build。

### 阶段 3：本地助手最小接入

当前已完成 v0.4.5：

1. 新增本地助手，已从 V2 内置 `tools/nsarmoire-helper` 拆为独立项目 `H:\NightingaleSilenceWeb\NSArmoireButler`，使用 C# / .NET 7 构建。
2. helper 提供 `/health`、`/processes`、`/process/select`、`/probe`、`/retainer-cache/clear`、`/snapshot`、`/snapshot/refresh` 和 `/shutdown`。
3. helper 支持投影台、背包、兵装库、鞍囊、当前已加载雇员缓存和收藏柜 snapshot，输出 `source: 'local-helper'`。
4. V2 页面提供连接状态、刷新按钮和手动导入 fallback。
5. helper 只监听 `127.0.0.1`，错误响应不输出本机路径或堆栈。
6. helper 支持 `/open-v2`，打开启动参数中配置的 V2 `#/ffxiv/armoire` 页面；接口不接受请求传入的任意 URL。
7. 雇员读取参考 `Critical-Impact/InventoryTools` 的缓存口径：当前活动雇员的 `10000-10006` 内部 7 块会重排为游戏 UI 的 5 页，每页 35 格，并按雇员 ID 缓存。
8. 收藏柜读取参考 `Seventhxiv/Collections` 的 `UIState.Cabinet` 口径：helper 读取 `UnlockedItems` bitset，并用 catalog `cabinetEntries` 映射到 itemId。
9. helper 提供 `/catalog`，返回当前用于收藏柜映射的 `nsarmoire.catalog.v1` JSON；前端优先加载站点静态 catalog，静态加载失败时会尝试用 helper catalog 兜底。
10. `/health` 返回 catalog 定位状态和收藏柜映射条目数，用于不打开 `/probe` 时快速判断 helper 静态目录是否就绪。
11. 前端连接 helper 后会轮询 `/probe`；页面可见时约 2 秒一次，隐藏时约 10 秒一次。首次探针只记录刷新签名，后续仅在角色、容器、雇员状态、雇员缓存或 `snapshotContentHash` 等探针签名变化时，延迟约 1.4 秒调用 `/snapshot/refresh` 刷新当前 snapshot，保留自动捕捉雇员切换的能力，同时避免每 2 秒重建完整数据。`snapshotContentHash` 由 helper 在已读取的投影台、收藏柜、背包类容器和雇员缓存外观物品上计算，不包含生成时间、缓存更新时间或物品明细。
12. `/retainer-cache/clear` 清空当前 helper 进程内的雇员库存缓存；前端删除缓存后保留当前页面数据，直到用户刷新或重新读取。

仍待完成：

1. `/icon/:itemId` 暂未实现。
2. 浏览器直连本地 helper 在公开 HTTPS 页面下仍需实测。
3. 角色名和服务器已写入 helper snapshot；稳定角色 ID 仍未写入，多角色档案的改名/转服自动合并前需要继续攻克。
4. 商城时装收集统计必须和完整容器读取同级推进，不能降级为普通后置小功能。

### 阶段 3.5：三分区工作台重构

1. 补齐前端和 helper snapshot 契约中的 `character.name`、`character.world` 字段，normalize 和示例数据同步更新；`character.id` 作为后续稳定身份字段。
2. 新增页面私有三分区导航组件 `NSArmoireSectionRail.vue`，桌面端使用左侧窄轨，移动端降级为顶部切换。
3. 将现有整理建议和容器分布组合成 `衣柜清理` 分区。
4. 将现有图鉴迁入 `查漏补缺` 分区，保留后续商城时装统计插槽。
5. 新增 `角色配置` 分区第一版，展示当前角色身份、数据来源、上次更新时间和本地档案占位；手动合并只先留交互入口和规则说明，不在第一刀实现复杂合并。
6. 判定依据和静态数据状态改为辅助详情，不再作为首屏并列主模块。
7. 不改收藏柜、套装、同模型、染色风险等分析规则；本阶段只重组信息架构和角色档案入口。

### 阶段 3.6：性能收缩重构

1. 暂停商城卡片详情扩展和更多地区按钮改造，先解决空页面加载大 catalog 的问题。
2. `useArmoireCatalog` 和 `useArmoireStoreCatalog` 不再在 composable 内部 `onMounted` 自动加载；由 `NSArmoireWorkspace.vue` 按 active section、active tab 和 snapshot 状态显式触发。
3. `armoire-catalog.json` 不作为普通工作台运行时依赖；需要收藏柜、套装、图鉴、同模或染剂显示时只加载对应拆分索引；衣柜清理需要当前 snapshot 物品名、图标、收藏柜关系和投影台套装关系时，只加载对应 itemId 区间 chunk。
4. `armoire-store-catalog.json` 只在进入查漏补缺的商城统计时加载。
5. 分析函数先共享 `ownedIndex`，降低导入大 snapshot 后重复扫描成本。
6. 已拆分 `armoire-catalog.json` 为多个静态索引，并将物品显示、收藏柜关系和投影台套装关系二次拆成 itemId 区间 chunk；后续新增 NSArmoire 分析能力时必须优先新增或复用轻量索引，不得把普通页面重新强依赖完整主 catalog。
7. itemId chunk 加载器必须批量合并 Vue reactive state，避免一批 chunk 内每块返回都触发一次 catalog 合并和 snapshot analysis 重算。
8. 生产预览必须验证空页面没有 `/data/armoire-catalog.json` 请求，不能只用 Vite dev server 体验判断性能。

### 阶段 4：扩展读取容器和商城时装统计

1. 持续维护背包、鞍囊、兵装库、雇员、收藏柜读取路线的版本兼容；新游戏版本更新后先跑 `/probe` 再进入正式 UI 口径。
2. 每次用户提到游戏版本更新、收纳系统改动、收藏柜/投影台容量或规则变化时，必须先确认是否需要调整 NSArmoire 的产品方向、整理建议优先级和判定口径，再继续实现。
3. 每新增一个容器，都先加入 helper 能力探测，再进入 snapshot。
4. 页面按 `supportedContainers` 显示能力，不假装全部可用。
5. 为每个容器准备真实样本和失败样本。
6. 已建立第一版商城时装 catalog：国服商城先用公开商品列表生成 `public/data/armoire-store-catalog.json`，刷新命令为 `npm run build:armoire-store-catalog`；国际服商城先记录来源；商品封面图标使用 `coverItemId`，不参与拥有状态检测；商品到游戏物品的 `itemIds` 映射仍需人工校正和持续维护。网页导出的校正 JSON 用 `npm run apply:armoire-store-corrections -- <corrections.json>` 合并回目录。
7. 商城时装统计当前展示“已拥有 / 缺部分 / 未拥有 / 待校正”，含义是当前 snapshot 中是否出现对应商城散件；真正“已购买 / 未购买”的账号状态来源必须保守设计，可以来自用户手动标记、导入清单或后续明确授权的数据读取，不默认抓取用户商城账号。
8. 商城时装、图鉴和仓库统计当前先按角色名 + 服务器归档，支持用户在多个角色之间切换和对比；本地角色缓存当前保存每个角色最近一次完整 snapshot，且只在用户本机浏览器 IndexedDB 内保存。后续取得稳定角色 ID 后再升级自动合并规则，避免不同角色的购买/拥有状态混在一起。
9. 衣柜清理新增 `生产采集复制品` 板块前，必须先生成并人工确认生产/采集复制品 itemId 候选列表；确认后再接入 snapshot 分析、染剂返还统计和 UI 展示。该板块每件复制品按 `染剂兑换券 x4` 计算，并额外统计该物品当前染色可返还的染剂。
10. 商城时装 catalog 已支持 `localizedNames`、`regionalStoreUrls` 和 `regionalPriceLabels`。价格展示不是外显内部字段名，而是按固定地区标签展示，例如 `简中服 12800点券`、`繁中服 300水晶`、`Global Server 19200 crysta`、`한국 25,300 크리스탈`。
11. 商城校正页只用于维护数据，不进入公开导航；为避免一次性渲染过多表单，当前每批只渲染 10 条，滚动到底部或点击加载更多再继续。

商城时装目录参考：

- 国服商城：https://qu.sdo.com/tools-shop?merchantId=1
- 国际服商城：https://store.finalfantasyxiv.com/ffxivstore/ja-jp/

### 阶段 5：整理建议和发布策略

1. 优化推荐排序和风险等级。
2. 加入导出清单功能，例如“要补收藏柜的物品列表”。
3. helper 正式分发走 GitHub Releases 最新页：页面链接 Release 页面，不直链可执行文件；Release 附 zip 包、版本号、支持游戏版本、SHA256、使用步骤、源码路径和更新说明。
4. Release 说明必须明确 helper 只监听 `127.0.0.1`、不上传用户仓库数据，并说明杀软/SmartScreen 可能提示未知发布者。
5. 确认是否公开发布、是否仅本机使用、是否需要签名。

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
2. 页面和 helper 错误信息不能输出本机用户名、游戏安装路径、进程路径、token、cookie、角色 ID 或堆栈。
3. helper 只监听 loopback 地址，例如 `127.0.0.1`，不监听公网网卡。
4. helper API 应限制来源、方法和请求体大小。
5. JSON 导入视为不可信输入，必须校验 schema、大小、字段类型和 itemId 合法性。
6. 本地进程读取属于敏感能力，需要明确用户主动启动 helper 后才发生。
7. 不在 `localStorage` 长期保存完整仓库明细；完整 snapshot 如需本地多角色切换，只保存到 IndexedDB。`localStorage` 只能保存 active profile key、轻量设置和旧缓存迁移槽位。

## 风险点

| 风险                         | 说明                                                                                      | 应对                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 容器读取随版本变化           | 背包、鞍囊、兵装库、雇员和收藏柜都依赖当前游戏版本签名、结构偏移和加载状态                | helper 做 `/probe` 验证和版本失败提示；雇员按逐个打开后缓存的正式流程同步                                |
| 商城时装目录和购买状态不稳定 | 国服/国际服商城条目、套装拆分、地区差异和页面结构可能变化；用户购买状态也不应默认抓取账号 | 商城目录独立建表并记录来源；购买状态优先手动/导入，账号相关读取必须另行确认隐私和授权边界                |
| 游戏版本变更                 | 内存结构、静态表、收纳容量和游戏系统规则都可能随版本变化                                  | helper 做版本探测，失败时提示更新；用户提到版本更新时，先询问是否需要调整 NSArmoire 的功能方向和整理口径 |
| 收纳系统规则变化             | 收藏柜、投影台、套装幻影化和其他收纳系统的容量、清染色规则或成本可能改变                  | 整理建议必须按当前版本的真实收纳成本重审；例如收藏柜无格子限制时，不把纯收藏柜同模型全集视为需要清理     |
| Dalamud 插件路线不确定       | 插件 API、可读数据范围、分发和版本兼容需要按官方指南确认                                  | 独立项目预研，先读官方 Dalamud 开发者指南，不混入 V2                                                     |
| 浏览器直连本机 helper 限制   | 公开 HTTPS 页面访问本机 HTTP helper 可能受 CORS/私有网络策略影响                          | 实测 Chrome/Edge，保留手动导入 fallback                                                                  |
| 用户隐私                     | 物品、角色名、角色 ID、服务器属于个人数据                                                 | 默认本地处理，不上传服务器；错误信息和公开日志不输出角色 ID                                              |
| 推荐误导                     | 染色、收藏柜、套装幻影化规则若判断错会误导用户处理物品                                    | 建立真实样本，风险建议用保守措辞                                                                         |
| 数据体积                     | 完整 catalog 和图标可能较大                                                               | catalog 拆分，图标按需加载                                                                               |
| 首屏性能                     | 当前完整 catalog 在空页面也会加载，低端设备和移动端会明显卡顿                              | 空页面不加载大 catalog；按分区和 tab 延迟加载；真实性能以生产预览和浏览器资源面板验证                    |
| 名称歧义                     | `Armoire` 在游戏中常指收藏柜，但本工具覆盖整个仓库清理                                    | 文档和 UI 中明确模块覆盖范围                                                                             |
| 许可证                       | 参考 Asvel 代码时需遵守 MIT license                                                       | 若移植代码，保留许可证和来源说明                                                                         |

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
2. `衣柜管家` 是否确定为正式工具名。
3. 第一阶段是否接受手动 JSON 导入作为 MVP。
4. 本地 helper 使用 C# + Lumina，还是先做更简单的 JSON 导出器。
5. 本地 helper 是否允许参考/移植 Asvel 的 MIT 代码。
6. 是否后续另开独立 Dalamud 插件项目；如果做，先阅读哪一版官方开发者指南并如何记录调研结论。
7. 是否需要把 `NSArmoire` 静态 catalog 与 `NSGlamour` 映射构建流程合并。
8. 是否需要保存历史 snapshot，还是只分析当前一次导入。

## 已确认补充事项

- 当前验收标准是读取角色名和服务器；多角色档案、商城时装统计和图鉴查询先按“角色名 + 服务器”区分，稳定角色 ID 后续作为改名/转服自动合并增强。
