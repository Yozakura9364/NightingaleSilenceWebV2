# 模块地图

## 当前代码状态

当前 V2 已完成第一版应用外壳和占位页面骨架：

- `src/main.ts`：创建 Vue app，注册 Pinia 和 Router。
- `src/App.vue`：渲染轻量全局导航和 `<router-view />`。
- `src/router/index.ts`：使用 `createWebHashHistory()`，已注册首页、FFXIV 分类页、三个 FFXIV 工具页、Silence 入口/分组页和 About 占位页。
- `src/config/site.ts`：集中维护站点名称、首页导航、分类入口、工具入口、来源项目路径和 API base path。
- `src/composables/useFetch.ts`：提供第一版统一请求封装。
- `src/services/apiBoundaries.ts`：提供 FFXIV 旧项目 API 边界信息；无后端的工具入口不会进入 API 边界列表。
- `src/stores/locale.ts`：提供 locale store，已接入 `src/locales/ui.ts`、`document.lang` 和标题刷新。
- `src/styles/`：已建立第一版 reset/theme/base/components/utilities 公共 CSS。
- `src/components/`：已建立第一版 `AppButton.vue`、`AppPanel.vue`、`AppPixelWindow.vue`、`AppTopNav.vue`、`AppField.vue`、`AppToolbar.vue`、`AppTabs.vue`、`AppStatus.vue`。
- `src/pages/ffxiv/components/ToolApiStatus.vue`：保留给调试或临时占位界面使用；正式工具工作台不展示内部 API 状态块。
- `src/pages/`：已建立首页、FFXIV 分类页、NSGlamour 占位页、NSPlate 迁移页、NSArmoire 第一阶段页、Silence 占位入口和 About 占位页。

当前尚未实现：

- `src/lib/glamour/`
- 旧项目真实业务页面和 Canvas 渲染迁移
- `#/silence/glitch/:characterId` 单角色详情页

当前已存在：

- `docs/ai/MODULES/`：模块文档目录，具体模块文档逐步补齐。
- `docs/ai/PROJECT_STRUCTURE.md`：当前代码结构、近期结构整理结果和目录职责快照。
- `docs/api/`：API 契约草案目录，当前包含 `plate.md` 和 `glamour.md`。
- `docs/ai/CODE_STRUCTURE_RULES.md`：复杂业务拆分和防止单文件膨胀规则。
- `docs/ai/WORKBENCH_STYLE_CONTRACT.md`：NSPlate、NSGlamour 等工房类复杂工具页的工作台样式、密度、状态和响应式契约。
- `docs/ai/REVIEW_GUIDE.md`：项目评估指南。
- `scripts/check-ui-copy.mjs`：固定 UI 文案硬编码检查脚本，已接入 `npm run check:i18n` 和 `npm run check`。

## 计划路由总览

| 路由                            | 页面组件                                     | 当前状态                                    |
| ------------------------------- | -------------------------------------------- | ------------------------------------------- |
| `#/`                            | `src/pages/home/HomePage.vue`                | 已接入占位视觉首页                          |
| `#/ffxiv`                       | `src/pages/ffxiv/FfxivIndexPage.vue`         | 已接入分类导航骨架                          |
| `#/ffxiv/plate`                 | `src/pages/plate/NSPlatePage.vue`            | 已接入 NSPlate 迁移页、基础素材选择和预览   |
| `#/ffxiv/glamour`               | `src/pages/glamour/NSGlamourPage.vue`        | 已接入 NSGlamour 迁移占位页和统一工具页外壳 |
| `#/ffxiv/armoire`               | `src/pages/armoire/NSArmoirePage.vue`        | 已接入 NSArmoire 第一阶段手动 snapshot 导入和基础统计 |
| `#/about`                       | `src/pages/about/AboutPage.vue`              | 已接入 About 占位页                         |
| `#/style-lab`                   | `src/pages/style-lab/StyleLabPage.vue`       | 隐藏内部样式探索页，不写入导航              |
| `#/silence`                     | `src/pages/silence/SilenceIndexPage.vue`     | 已接入左右分割海报式双入口页                |
| `#/silence/angel`               | `src/pages/silence/SilenceGroupPage.vue`     | 已接入全屏分组舞台占位页                    |
| `#/silence/glitch`              | `src/pages/silence/SilenceGroupPage.vue`     | 已接入全屏分组舞台占位页                    |
| `#/silence/angel/:characterId`  | `src/pages/silence/SilenceCharacterPage.vue` | 已接入动态路由和六个测试角色数据骨架        |
| `#/silence/glitch/:characterId` | `src/pages/silence/SilenceCharacterPage.vue` | 未接入代码，规划文档已建立                  |

> 注意：当前页面只是 V2 骨架和迁移入口，不代表旧项目功能已经完成迁移。

当前导航行为：

- `#/` 首页使用首页专属右上导航，不显示 `AppTopNav`。
- `#/ffxiv`、`#/ffxiv/glamour`、`#/ffxiv/plate`、`#/about` 显示轻量 `AppTopNav`。
- `AppTopNav` 提供回首页入口。
- `狒狒14工房` 是父级分类入口，在 `AppTopNav` 中用下拉菜单承载 `幻化工房`、`铭牌工房` 等子工具；不要把父级分类和子工具做成同一排并列项。
- `设置 | CONFIG` 与 `菜单 | MENU` 是顶栏同级入口；`菜单` 管站点导航，`设置` 管全局显示模式等站点设置。
- `AppTopNav` 不作为大型全站 header。

## NSHome 首页（占位骨架已接入）

- **计划路由**：`#/`
- **来源项目**：`NSHome`
- **计划组件**：`src/pages/home/HomePage.vue`
- **页面类型**：个人站首页 / 视觉入口页
- **当前状态**：已接入第一版占位视觉，不作为最终设计稿。
- **迁移目标**：
  - 承接夜莺不语个人站主页视觉和工具入口。
  - 为工具、博客、创作信息和未来分类保留扩展余地。
  - 使用 V2 公共 CSS 和公共组件，不复制旧静态站的零散样式。
  - 作为纯视觉首页，为 `#/ffxiv` 分类导航提供稳定入口。
  - 首页人物舞台、贴纸和浮动图标属于页面专属样式；全站基础控件统一使用像素风公共外观。
- **模块文档**：`docs/ai/MODULES/home.md`。

## FFXIV 分类导航页（占位骨架已接入）

- **计划路由**：`#/ffxiv`
- **计划组件**：`src/pages/ffxiv/FfxivIndexPage.vue`
- **页面类型**：分类导航页 / 工具入口页
- **当前状态**：已读取 `src/config/site.ts` 中的 `ffxivTools` 生成工具卡。
- **包含工具**：
  - `#/ffxiv/glamour`：幻化工房
  - `#/ffxiv/plate`：铭牌工房
  - `#/ffxiv/armoire`：衣柜清理大师
- **迁移目标**：
  - 承接首页 `FFXIV` 主入口。
  - 展示当前和未来 FFXIV 工具，不把工具列表塞进纯视觉首页。
  - 使用 V2 公共按钮、卡片、面板和导航样式。
  - 作为模块/分类级页面，继承全站像素风基础控件，但不继承首页人物舞台和强装饰。
  - 只代表当前第一阶段 FFXIV 分类，不代表整站长期只服务 FFXIV。
- **模块文档**：`docs/ai/MODULES/ffxiv.md`。

## NSPlate 铭牌编辑器（迁移占位页已接入）

- **计划路由**：`#/ffxiv/plate`
- **来源项目路径**：旧 `NSPortable`
- **后端**：Node.js HTTP server，开发端口 `3456`
- **核心能力**：Canvas 铭牌合成、PNG/ZIP/PSD/JSX 导出、多语言、主题/外观配置。
- **当前状态**：已接入迁移页、统一工具页外壳、旧后端素材/预设读取、基础素材选择和铭牌预览；完整旧业务尚未迁移。
- **当前 API 检查**：通过 V2 `/api/plate/presets` 检查旧后端连通性；代理 rewrite 到旧后端 `/api/presets`。
- **迁移目标**：
  - 旧项目行为先抽取为 API/数据/视觉契约，最终后端可按 V2 新规则重写。
  - 旧 Canvas 渲染逻辑或等价新实现迁入 `src/lib/plate/`。
  - 页面交互拆到 `src/pages/plate/`。
  - 与 V2 公共按钮、面板、表单、工具栏样式对齐。
  - API 和素材请求通过 `/api/plate`、`/img`、`/img-preview` 接入。
- **模块文档**：`docs/ai/MODULES/nsplate.md`。

## NSGlamour 幻化工具（迁移占位页已接入）

- **计划路由**：`#/ffxiv/glamour`
- **来源项目路径**：`NSGlamour`
- **后端**：Python Flask，开发端口 `8765`
- **核心能力**：`.chara` 解析、装备/染剂映射、石之家与 Eorzea Collection 导入、模板 Canvas 渲染、图片裁剪、PNG 导出、装备文案生成。
- **当前状态**：仅接入迁移占位页、统一工具页外壳和 API 边界信息，未迁移旧业务。
- **当前 API 检查**：通过 V2 `/api/glamour/health` 检查旧后端连通性；代理 rewrite 到旧后端 `/api/health`。
- **迁移目标**：
  - 旧项目行为先抽取为 API/数据/视觉契约，最终后端可按 V2 新规则重写。
  - 旧模板渲染器或等价新实现迁入 `src/lib/glamour/`。
  - `/template` 和 `/equipinfo` 的核心交互拆到 `src/pages/glamour/`。
  - 保持装备、染剂、多语言和模板渲染规则与原项目兼容。
  - API 通过 `/api/glamour` 接入。
- **模块文档**：`docs/ai/MODULES/nsglamour.md`。

## NSArmoire 衣柜清理大师（第一阶段入口已接入）

- **计划路由**：`#/ffxiv/armoire`
- **需求来源**：`docs/ARMOIRE_PLAN.md`
- **页面入口**：`src/pages/armoire/NSArmoirePage.vue`
- **数据契约**：`docs/api/nsarmoire.md`
- **当前状态**：已接入站点配置、FFXIV 工具入口、hash 路由、手动 JSON snapshot 导入、Asvel dresser 简化数据兼容导入、基础条目/容器分布统计。
- **当前后端/API**：第一阶段不接本地 helper，不新增 Vite proxy；`src/services/apiBoundaries.ts` 只让有 `apiBase` 和 `devPort` 的旧项目工具进入 API 边界列表。
- **已确认字段口径**：
  - `投影台 / IsGlamourous`：判断这条 Item 记录本身能否作为普通物品放入投影台。
  - `武具投影 / Item{Glamour}`：普通武具投影能力或材料，不等同于投影台收纳。
  - `ItemUICategory=112` 与 `MirageStoreSetItem.csv`：套装幻影化容器；拥有容器不代表散件全收集。
  - `Cabinet.csv`：收藏柜可存放口径，不能用 `IsGlamourous` 代替。
- **迁移目标**：
  - 建立稳定 `NSArmoire snapshot` 数据契约，页面分析只依赖 snapshot，不理解本地 helper 内部结构。
  - 后续接入静态 armoire catalog 后，再实现收藏柜进度、套装缺件、同模型重复、染色风险和清理建议。
  - 本地 helper、浏览器直连 localhost、CORS/私有网络限制和 Dalamud 插件路线都必须另行确认后再进入实现。
- **模块文档**：`docs/ai/MODULES/nsarmoire.md`。

## Silence 角色档案（入口和分组占位页已接入）

- **计划入口路由**：`#/silence`
- **推荐分组路由**：`#/silence/angel`、`#/silence/glitch`
- **推荐详情路由**：`#/silence/angel/:characterId`、`#/silence/glitch/:characterId`
- **计划页面入口**：`src/pages/silence/SilenceIndexPage.vue`、`src/pages/silence/SilenceGroupPage.vue`、`src/pages/silence/SilenceCharacterPage.vue`
- **页面类型**：创作信息分类 / 原创角色档案 / 角色图鉴
- **当前状态**：`#/silence` 左右分割海报式双入口、`#/silence/angel` 和 `#/silence/glitch` 全屏分组舞台占位页已接入代码、路由、站点配置和公开导航；`angel` 六个角色的动态详情页和测试数据骨架已接入，正式角色资料和正式素材尚未接入。
- **迁移目标**：
  - 承接首页未来的创作信息入口。
  - 展示 `不语·silence`、`幽灵·silence` 两组角色索引、标签和单角色档案。
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
- **边界**：
  - 不写入首页、顶部导航或 `src/config/site.ts` 公开入口。
  - 实验皮肤必须通过容器选择器或可选 class 隔离。
  - 不覆盖 `body`、`button`、`input`、`a` 等全局标签默认行为。
  - 不影响 `NSGlamour`、`NSPlate` 等工具页迁移默认样式。
- **模块文档**：`docs/ai/MODULES/style-lab.md`。
