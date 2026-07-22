---
summary: "V2 路由、页面入口、模块职责、当前状态和文档入口地图。"
status: "active"
scope: "整站页面、隐藏路由和主要业务模块。"
source_of_truth: "src/router/index.ts、src/config/site.ts 和 src/pages。"
read_when: "跨页面修改、查找模块入口或评估当前实现范围。"
update_when: "路由、页面组件、模块状态或公开入口变化时。"
verify: "逐项对照 router、site config 和实际文件。"
---

# 模块地图

## 当前代码状态

当前 V2 已完成第一版应用外壳，并且部分模块已经超过占位阶段：

- `src/main.ts`：创建 Vue app，注册 Pinia 和 Router。
- `src/App.vue`：渲染轻量全局导航和 `<router-view />`。
- `src/router/index.ts`：使用 `createWebHashHistory()`；普通生产构建注册首页、FFXIV 分类页、五个公开 FFXIV 工具页和 About，开发环境另注册 Silence、Style Lab 与术语校对路由。
- `src/config/features.ts`：集中暴露 Armoire 本地工作台、Silence 和内部路由构建开关；开发服务器默认启用内部路由，普通构建默认排除。
- `src/config/site.ts`：集中维护站点名称、首页导航、分类入口、工具入口、来源项目路径和 API base path。
- `src/composables/useFetch.ts`：提供第一版统一请求封装。
- `src/services/apiBoundaries.ts`：提供 FFXIV 旧项目 API 边界信息；无后端的工具入口不会进入 API 边界列表。
- `src/stores/locale.ts`：提供 locale 状态，常驻 core 文案并接入 `document.lang` 和标题刷新；页面消息包由路由并行按需加载。
- `src/stores/theme.ts`：提供 day/night 状态、浏览器偏好、持久化和跨标签页同步。
- `src/styles/`：已建立第一版 reset/theme/base/components/utilities 公共 CSS。
- `src/components/`：已建立第一版 `AppButton.vue`、`AppPanel.vue`、`AppPixelWindow.vue`、`AppTopNav.vue`、`AppField.vue`、`AppToolbar.vue`、`AppTabs.vue`、`AppStatus.vue`。
- `src/pages/ffxiv/components/ToolApiStatus.vue`：保留给调试或临时占位界面使用；正式工具工作台不展示内部 API 状态块。
- `src/pages/`：已建立首页、FFXIV 分类页、物品卡片、时尚品鉴、NSGlamour 双工作台、NSPlate 核心工作台、NSArmoire 公网下载页/本地工作台、Silence 本地开发页面和 About 个人与友链页。

当前已注册但不作为当前产品页面的路由：

- `#/silence/glitch/:characterId` 预留单角色详情页，当前 `glitch` 组先使用双人页

当前已存在：

- `docs/ai/MODULES/`：模块文档目录，具体模块文档逐步补齐。
- `docs/ai/PROJECT_STRUCTURE.md`：当前代码结构、近期结构整理结果和目录职责快照。
- `docs/api/`：API 契约目录，当前包含 `nsplate.md`、`nsglamour.md` 和 `nsarmoire.md`。
- `docs/ai/CODE_STRUCTURE_RULES.md`：复杂业务拆分和防止单文件膨胀规则。
- `docs/ai/WORKBENCH_STYLE_CONTRACT.md`：NSPlate、NSGlamour 等工房类复杂工具页的工作台样式、密度、状态和响应式契约。
- `docs/ai/REVIEW_GUIDE.md`：项目评估指南。
- `scripts/check-ui-copy.mjs`：固定 UI 文案硬编码检查脚本，已接入 `npm run check:i18n` 和 `npm run check`。

## 路由总览

| 路由                            | 页面组件                                     | 当前状态                                    |
| ------------------------------- | -------------------------------------------- | ------------------------------------------- |
| `#/`                            | `src/pages/home/HomePage.vue`                | 已接入昼夜像素桌面视觉入口                  |
| `#/ffxiv`                       | `src/pages/ffxiv/FfxivIndexPage.vue`         | 已接入分类导航骨架                          |
| `#/ffxiv/plate`                 | `src/pages/plate/NSPlatePage.vue`            | 已接入 NSPlate 核心工作台、静态 manifest、Canvas 预览和主要导入导出 |
| `#/ffxiv/glamour`               | `src/pages/glamour/NSGlamourPage.vue`        | 已接入 EquipInfo/Template 双工作台、共享草稿、导入/编辑、多语言、六套 Canvas 模板、图片裁剪/暂存和 PNG 导出；仍通过 `/api/glamour/*` 复用旧 Flask 契约 |
| `#/ffxiv/armoire`               | `src/pages/armoire/NSArmoireLandingPage.vue` | 公网教程和 Release 下载页；`armoire-local` 构建才加载 `NSArmoirePage.vue` 完整工作台 |
| `#/ffxiv/fashioncheck`          | `src/pages/fashion-check/FashionCheckPage.vue` | 已接入当前周方案、金牌物品、标签数据库和来源页面 |
| `#/ffxiv/item-card`             | `src/pages/item-card/ItemCardPage.vue`       | 已接入旧 `/card` 的链接/文本导入、装备和染剂编辑、多语言单张 PNG、批量 ZIP 和连续列表长图 |
| `#/ffxiv/term-review`           | `src/pages/ffxiv/FfxivTermReviewPage.vue`    | 内部 FFXIV 术语校对页；仅开发/显式内部构建注册 |
| `#/about`                       | `src/pages/about/AboutPage.vue`              | 已接入像素头像、SNS、本站信息和静态友链列表 |
| `#/style-lab`                   | `src/pages/style-lab/StyleLabPage.vue`       | 内部样式探索页；仅开发/显式内部构建注册      |
| `#/silence`                     | `src/pages/silence/SilenceIndexPage.vue`     | 双入口页代码已接入；普通生产构建排除         |
| `#/silence/angel`               | `src/pages/silence/SilenceGroupPage.vue`     | 全屏分组舞台已接入；普通生产构建排除         |
| `#/silence/glitch`              | `src/pages/silence/SilenceGroupPage.vue`     | Yoin & Yoine 双人页已接入；普通生产构建排除  |
| `#/silence/angel/:characterId`  | `src/pages/silence/SilenceCharacterPage.vue` | 动态路由和资料骨架已接入；普通生产构建排除   |
| `#/silence/glitch/:characterId` | `src/pages/silence/SilenceCharacterPage.vue` | 预留内部路由形态；普通生产构建排除           |

> 注意：各页面成熟度不同。`NSPlate` 已进入核心工作台收口；`NSGlamour` 已完成当前前端双工作台迁移但仍依赖旧 Flask 服务与后续等价回归；Silence 等内容模块仍有资料未完成，不能用同一句“占位页”概括全部模块。

当前导航行为：

- `#/` 首页使用首页专属右上导航，不显示 `AppTopNav`。
- `#/ffxiv`、五个公开 FFXIV 工具路由和 `#/about` 显示轻量 `AppTopNav`。
- `AppTopNav` 提供回首页入口。
- `狒狒14工房` 是父级分类入口，在 `AppTopNav` 中用下拉菜单承载 `幻化工房`、`铭牌工房` 等子工具；不要把父级分类和子工具做成同一排并列项。
- `设置 | CONFIG` 与 `菜单 | MENU` 是顶栏同级入口；`菜单` 管站点导航，`设置` 管全局显示模式等站点设置。
- `AppTopNav` 不作为大型全站 header。

## NSHome 首页（昼夜视觉入口已接入）

- **计划路由**：`#/`
- **来源项目**：`NSHome`
- **计划组件**：`src/pages/home/HomePage.vue`
- **页面类型**：个人站首页 / 视觉入口页
- **当前状态**：已接入昼夜像素桌面、工房入口、可拖动窗口和开发环境本地人物预览；正式人物资产与部分真实内容仍待确认和公开。
- **迁移目标**：
  - 承接夜莺不语个人站主页视觉和工具入口。
  - 为工具、博客、创作信息和未来分类保留扩展余地。
  - 使用 V2 公共 CSS 和公共组件，不复制旧静态站的零散样式。
  - 作为纯视觉首页，为 `#/ffxiv` 分类导航提供稳定入口。
  - 首页人物舞台、贴纸和浮动图标属于页面专属样式；全站基础控件统一使用像素风公共外观。
- **模块文档**：`docs/ai/MODULES/home.md`。

## FFXIV 分类导航页（分类导航已接入）

- **计划路由**：`#/ffxiv`
- **计划组件**：`src/pages/ffxiv/FfxivIndexPage.vue`
- **页面类型**：分类导航页 / 工具入口页
- **当前状态**：已读取 `src/config/site.ts` 中的 `ffxivTools` 生成工具卡。
- **包含工具**：
  - `#/ffxiv/plate`：铭牌工房
  - `#/ffxiv/glamour`：幻化工房
  - `#/ffxiv/armoire`：衣柜管家轻量教程和 Helper 下载入口；完整工作台由 Helper GUI 本地承载
  - `#/ffxiv/fashioncheck`：时尚品鉴
  - `#/ffxiv/item-card`：物品卡片
- **迁移目标**：
  - 承接首页 `FFXIV` 主入口。
  - 展示当前和未来 FFXIV 工具，不把工具列表塞进纯视觉首页。
  - 使用 V2 公共按钮、卡片、面板和导航样式。
  - 作为模块/分类级页面，继承全站像素风基础控件，但不继承首页人物舞台和强装饰。
  - 只代表当前第一阶段 FFXIV 分类，不代表整站长期只服务 FFXIV。
- **模块文档**：`docs/ai/MODULES/ffxiv.md`。

## 物品卡片（独立工作台已接入）

- **路由**：`#/ffxiv/item-card`
- **来源功能**：旧 `NSGlamour /card`，不是 `/template`
- **页面入口**：`src/pages/item-card/ItemCardPage.vue`
- **当前状态**：已按恢复代码重建网页链接和装备文本导入、装备与染剂编辑、文字样式、多语言、简易/完整版、左右排版、单张 PNG、批量 ZIP 和连续列表长图；草稿自动保存，最近记录仅保留兼容数据。不包含人物图片、图片裁剪或幻化模板。
- **隔离边界**：源码、文案和浏览器存储均由 `src/pages/item-card/` 私有维护；不移动或改写旧 `NSGlamour` 文件，也不让 V2 glamour 页面引用物品卡片私有组件。
- **后端**：开发阶段仅复用 `/api/glamour/*` 接口契约和端口 `8765`。
- **模块文档**：`docs/ai/MODULES/item-card.md`。

## 时尚品鉴（当前周作业与标签数据库已接入）

- **路由**：`#/ffxiv/fashioncheck`、`#/ffxiv/fashioncheck/gold-items`、`#/ffxiv/fashioncheck/tags`、`#/ffxiv/fashioncheck/sources`
- **页面入口**：`src/pages/fashion-check/FashionCheckPage.vue`
- **当前状态**：已接入当前周 80/100 作业、金牌物品、标签数据库、来源展示和中英日韩名称索引；原始历史、逐条证据和参考文件不向公开页面发布。
- **数据边界**：公开页面只读取 `public/data/fashion-check/` 下经确认的当前周切片、名称索引、聚合标签索引和来源清单。
- **模块文档**：`docs/ai/MODULES/fashion-check.md`。

## NSPlate 铭牌编辑器（核心工作台已接入）

- **计划路由**：`#/ffxiv/plate`
- **来源项目路径**：旧 `NSPortable`
- **默认数据源**：静态 manifest `/data/plate/*.json` + COS/CDN 素材；旧 Node.js 服务端口 `3456` 只保留为 legacy/dev fallback 和 manifest 生成源
- **核心能力**：Canvas 铭牌合成、PNG/JPG/分层 ZIP 导出、多语言、主题/外观配置。
- **当前状态**：已接入真实工作台、素材/预设选择、Canvas 预览、自定义图片/出框图、信息层基础编辑、配置导入导出、PNG/JPG 和前端分层 ZIP。
- **当前数据检查**：通过 `npm run check:plate-static` / `npm run check:plate-static:preview` 校验 `public/data/plate/` 静态 manifest 和 COS 缩略图；通过 `npm run check:plate-regression` 固定核心浏览器回归；页面默认不请求旧 `/api/plate/presets` 或 `/api/plate/files`。
- **迁移目标**：
  - 旧项目行为先抽取为数据/视觉/导出契约，默认运行脱离旧服务。
  - 旧 Canvas 渲染逻辑或等价新实现迁入 `src/lib/plate/`。
  - 页面交互拆到 `src/pages/plate/`。
  - 与 V2 公共按钮、面板、表单、工具栏样式对齐。
  - 素材和预设通过静态 manifest + COS/CDN 接入；旧 `/api/plate` 只保留显式 fallback 或未来服务端导出能力。
- **模块文档**：`docs/ai/MODULES/nsplate.md`。

## NSGlamour 幻化工具（EquipInfo/Template 双工作台已接入）

- **计划路由**：`#/ffxiv/glamour`
- **来源项目路径**：`NSGlamour`
- **后端**：Python Flask，开发端口 `8765`
- **核心能力**：本地角色配置解析、装备/染剂映射、石之家与 Eorzea Collection 导入、模板 Canvas 渲染、图片裁剪、PNG 导出、装备文案生成。
- **当前状态**：已接入统一工具页外壳、共享 `GlamourDraft`、网页链接/文字/隐式本地配置导入、固定 14 装备槽、候选替换、染剂编辑、语言切换、复制与最近记录；Template 已接入六套 Canvas 模板、图片裁剪、最近图片 IndexedDB 暂存、跨模板继承与原尺寸 PNG 导出。预览画布最长边限制为 `1920px`，导出仍按模板原始尺寸重绘。
- **当前 API 检查**：通过 `npm run check:nsglamour-contract` 检查旧后端轻量契约；私有本地配置 fixture 仅本机 ignored 回归使用。页面通过 V2 `/api/glamour/*` 代理 rewrite 到旧后端 `/api/*`。
- **迁移目标**：
  - 旧项目行为先抽取为 API/数据/视觉契约，最终后端可按 V2 新规则重写。
  - 模板渲染器已进入 `src/lib/glamour/templates/`，后续保持 Vue 与纯渲染逻辑边界。
  - `/template` 和 `/equipinfo` 的核心交互拆到 `src/pages/glamour/`。
  - 保持装备、染剂、多语言和模板渲染规则与原项目兼容。
  - API 通过 `/api/glamour` 接入。
- **模块文档**：`docs/ai/MODULES/nsglamour.md`。

## NSArmoire 衣柜管家（公网下载页 / Helper 本地工作台）

- **计划路由**：`#/ffxiv/armoire`
- **需求来源**：`docs/ARMOIRE_PLAN.md`
- **公网页面入口**：`src/pages/armoire/NSArmoireLandingPage.vue`
- **本地工作台入口**：`src/pages/armoire/NSArmoirePage.vue`，仅 `armoire-local` 构建使用
- **数据契约**：`docs/api/nsarmoire.md`
- **当前状态**：公网路由只提供轻量教程和 GitHub Release 下载入口；完整工作台支持手动 JSON snapshot、Helper snapshot、三分区分析和本地角色缓存，但只进入 `armoire-local` 构建并由 Helper GUI 内嵌。
- **当前后端/API**：Vite 开发期使用 `/api/armoire` -> `http://127.0.0.1:8015`；正式本地工作台由 Helper 同源提供页面、catalog 和 API；公网页面不连接 Helper。
- **已确认字段口径**：
  - `投影台 / IsGlamourous`：判断这条 Item 记录本身能否作为普通物品放入投影台。
  - `武具投影 / Item{Glamour}`：普通武具投影能力或材料，不等同于投影台收纳。
  - `ItemUICategory=112` 与 `MirageStoreSetItem.csv`：套装幻影化容器；拥有容器不代表散件全收集。
  - `Cabinet.csv`：收藏柜可存放口径，不能用 `IsGlamourous` 代替。
  - `Model{Main}` / 灰机 `主模型`、`Model{Sub}` / 灰机 `副模型`、`ItemUICategory` 与 `EquipSlotCategory`：第一版同模型口径，主副模型和分类/槽位都完全一致才归为同模型。
- **迁移目标**：
  - 建立稳定 `NSArmoire snapshot` 数据契约，页面分析只依赖 snapshot，不理解本地 helper 内部结构。
  - 第一版 helper 只读取投影台；背包、鞍囊、雇员、兵装库和收藏柜必须逐容器验证后再扩展。
  - Helper GUI 内嵌工作台、版本升级和 Dalamud 插件路线仍需后续回归/预研。
- **模块文档**：`docs/ai/MODULES/nsarmoire.md`。

## Silence 角色档案（代码已接入，当前暂不上线）

- **计划入口路由**：`#/silence`
- **推荐分组路由**：`#/silence/angel`、`#/silence/glitch`
- **推荐详情路由**：`#/silence/angel/:characterId`；`#/silence/glitch/:characterId` 作为未来预留
- **计划页面入口**：`src/pages/silence/SilenceIndexPage.vue`、`src/pages/silence/SilenceGroupPage.vue`、`src/pages/silence/SilenceCharacterPage.vue`
- **页面类型**：创作信息分类 / 原创角色档案 / 角色图鉴
- **当前状态**：`#/silence` 双入口、`angel` 分组舞台、`glitch` 双人页、`angel` 动态详情页和本地数据骨架已接入代码；Salvance 只有首版资料，其他资料和正式素材尚未填写完成。整个 Silence 模块当前只保留给本地开发和资料录入，不纳入公开上线范围。
- **构建边界**：`VITE_ENABLE_SILENCE` 在开发服务器中默认开启，在普通生产构建中默认关闭；关闭时路由、导航入口和 Silence 消息包均不进入公开产物。
- **迁移目标**：
  - 承接首页未来的创作信息入口。
  - 展示 `不语·silence`、`幽灵·silence` 两组角色入口；`angel` 组进入单角色档案，`glitch` 组当前作为双人页展示。
  - `#/silence` 当前作为左右分割海报式双入口，不直接展示八个角色完整档案；`angel` 和 `glitch` 的完整视觉展开留给各自分组页。
  - 使用本地结构化数据作为第一阶段数据来源，不默认接后端。
  - 参考动漫官网角色介绍页的信息架构，但不复刻具体商业 IP 的美术、素材或文案。
  - 公开文案和角色设定必须由用户提供或确认；未确认内容实现时统一使用 `占位用，待编辑`。
  - 样式作为 Silence 模块或页面专属样式处理，不污染全站公共组件默认外观。
- **模块文档**：`docs/ai/MODULES/silence.md`。

## 模块文档规则

新增页面或迁移复杂模块前，先在 `docs/ai/MODULES/` 建立对应文档，至少说明：

1. 来源项目和迁移范围。
2. 目标路由和页面入口。
3. 主要组件拆分。
4. API 和数据依赖。
5. 公共 CSS/组件复用策略。
6. 验证清单。

如果页面非常简单，可以在计划中说明不单独建模块文档的原因；否则默认应建立模块文档。

样式相关模块文档必须说明该模块的样式层级：全站级、模块/分类级或页面专属。默认不要把页面专属视觉写进全站公共 CSS 或公共组件默认样式。

## Style Lab 内部样式探索页

- **计划路由**：`#/style-lab`
- **计划组件**：`src/pages/style-lab/StyleLabPage.vue`
- **页面类型**：隐藏内部设计预览页
- **当前状态**：用于比较像素风强度、工具工作台密度和单页特殊风格，不是用户可见主题切换系统。
- **构建边界**：由 `VITE_ENABLE_INTERNAL_ROUTES` 控制，普通生产构建不生成 Style Lab 页面或消息包 chunk。
- **边界**：
  - 不写入首页、顶部导航或 `src/config/site.ts` 公开入口。
  - 实验皮肤必须通过容器选择器或可选 class 隔离。
  - 不覆盖 `body`、`button`、`input`、`a` 等全局标签默认行为。
  - 不影响 `NSGlamour`、`NSPlate` 等工具页迁移默认样式。
- **模块文档**：`docs/ai/MODULES/style-lab.md`。

## FFXIV 术语校对页

- **计划路由**：`#/ffxiv/term-review`
- **计划组件**：`src/pages/ffxiv/FfxivTermReviewPage.vue`
- **页面类型**：隐藏内部数据校对页
- **当前状态**：读取 `src/lib/ffxiv/terms.ts` 的轻量术语注册表，支持按模块、状态、来源和关键词筛选，便于人工核对游戏 CSV 术语、旧字段和网页 UI 文案边界。
- **构建边界**：由 `VITE_ENABLE_INTERNAL_ROUTES` 控制，普通生产构建不生成术语校对页面 chunk。
- **边界**：
  - 不写入首页、顶部导航、FFXIV 工具卡或公开入口。
  - 不直接读取全量原始 CSV，不替代派生数据生成流程。
  - 校对结论应回写到 `src/lib/ffxiv/terms.ts`、`docs/ai/data/ffxiv/csv-annotations.chs.json` 或对应模块文档。
- **数据文档**：`docs/ai/data/ffxiv/README.md`。
