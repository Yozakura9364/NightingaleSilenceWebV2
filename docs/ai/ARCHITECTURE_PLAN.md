# V2 统一 Vue 前端架构方案

## 定位

V2 的目标是把夜莺不语 / Nightingale Silence 建成统一 Vue 3 前端的个人/工具网站。站点可以承载多个分类，包括工具、博客和创作信息；当前第一阶段分类是 `FFXIV`。

第一阶段会把 `NSHome`、旧 `NSPortable`、`NSGlamour` 逐步迁入同一个前端入口。旧 `NSPortable` 在 V2 中的新模块名统一为 `NSPlate`。旧项目后端先保持独立，V2 前端通过开发代理和生产反向代理接入。

这份文档只放长期架构策略；具体迁移顺序和边界放在 `docs/ai/MIGRATION_PLAN.md`。

## 当前约束

- 当前 `src/router/index.ts` 已创建 Router，并注册首页、FFXIV 分类页、两个工具占位页、Silence 入口与分组占位页、About 占位页。
- 当前已建立 `src/pages/`、`src/components/`、`src/styles/`、`src/config/` 基础目录。
- 当前已建立真实业务用的基础 `src/composables/useFetch.ts`，并已建立第一版 `src/lib/plate/`；`src/lib/glamour/` 尚未建立。
- 当前 `src/App.vue` 渲染轻量全局导航和 `<router-view />`。
- 当前 `src/stores/locale.ts` 已接入 `src/locales/ui.ts`，并驱动 UI 文案、`document.lang` 和标题刷新。
- 当前不是可用的完整站点，所有页面都应视为计划中或待迁移。

## 技术选型

| 层面        | 选择                                                | 说明                                                  |
| ----------- | --------------------------------------------------- | ----------------------------------------------------- |
| 脚手架      | Vite + Vue 3 + TypeScript                           | 保持轻量，不额外引入框架                              |
| 路由        | Vue Router 4，hash mode                             | 当前代码使用 `createWebHashHistory()`                 |
| 状态        | Pinia                                               | 用于 locale、页面状态、迁移后的共享草稿状态           |
| 多语言      | 自建 locale store + `src/locales/` 文案表           | 优先复用旧项目本地化数据结构                          |
| UI 组件库   | 暂不引入                                            | 先用公共组件和公共 CSS 建立自己的网站语言             |
| CSS         | CSS 自定义属性 + 公共 CSS layer + 页面 scoped style | 公共优先，页面特例最小化                              |
| HTTP 客户端 | 原生 `fetch`                                        | 后续由 `useFetch.ts` 统一封装                         |
| Canvas 渲染 | 保留原 Canvas API 管线                              | 渲染逻辑迁入 `src/lib/`，Vue 只负责状态和 DOM 挂载    |
| 后端        | 旧后端独立服务                                      | 旧 `NSPortable` Node.js、`NSGlamour` Flask 均先不合并 |

## 路由策略

当前采用 hash mode，因此开发和初期生产 URL 以 hash 路由为准：

| 目标路由           | 模块                                        | 状态             |
| ------------------ | ------------------------------------------- | ---------------- |
| `#/`               | `NSHome` 首页                               | 占位骨架已接入   |
| `#/ffxiv`          | FFXIV 分类导航页                            | 占位骨架已接入   |
| `#/ffxiv/plate`    | `NSPlate` 铭牌编辑器，来源为旧 `NSPortable` | 迁移占位页已接入 |
| `#/ffxiv/glamour`  | `NSGlamour` 幻化工具                        | 迁移占位页已接入 |
| `#/silence`        | Silence 创作入口                            | 双入口门厅已接入 |
| `#/silence/angel`  | 不语·silence 分组                           | 分组占位页已接入 |
| `#/silence/glitch` | 幽灵·silence 分组                           | 分组占位页已接入 |
| `#/about`          | About                                       | 占位页已接入     |

约定：

1. 新页面必须 lazy import，避免首屏加载全部工具。
2. 新增路由前先建立或更新对应模块文档，见 `PAGE_DEVELOPMENT_GUIDE.md`。
3. `#/ffxiv` 是当前第一阶段分类，不代表整站只服务 FFXIV；未来可以新增其他分类路由。
4. 当前不把 clean path 当成立即目标，避免在迁移早期同时处理 Nginx fallback 和子路径兼容。
5. 若未来要从 `#/ffxiv/...` 切到 `/ffxiv/...`，需单独写迁移计划，统一处理 Router history、Nginx fallback、旧链接跳转和搜索引擎风险。

导航约定：

1. `#/` 首页保留页面专属导航，不显示通用顶栏。
2. 非首页显示轻量 `AppTopNav`，用于回首页和进入当前分类菜单。
3. `狒狒14工房` 是父级分类，`幻化工房`、`铭牌工房` 是子工具；顶栏应使用下拉菜单表达父子关系，不要做成三个并列按钮。
4. `设置 | CONFIG` 与 `菜单 | MENU` 是顶栏同级入口；`菜单` 管站点导航，`设置` 管全局显示模式、语言等站点设置。
5. `AppTopNav` 不承担大型全站 header、营销导航或复杂信息架构。
6. 导航项优先来自 `src/config/site.ts`，不要在多个页面重复硬编码。
7. 用户可见的固定文案、按钮文案、aria-label、弹窗标题、状态文本和占位 UI 文案必须通过 `src/locales/` 文案 key 获取，不在 Vue 模板或组件脚本中直接写死。
8. 固定 UI 文案规则由 `npm run check:i18n` 做基础自动化检查；`npm run check` 会同时执行类型检查、文案检查和构建。

顶栏弹窗交互规格：

1. 顶栏只保留必要入口，当前为品牌回首页、`菜单 | MENU`、`设置 | CONFIG`。
2. `菜单` 弹窗使用千禧年像素小窗口形式，左侧/上方表达分类，右侧/下方表达子入口；分类和子工具不在顶栏横向铺开。
3. `设置` 弹窗与 `菜单` 并列，不放进菜单层级；当前只承载 `day / night` 和中/日/韩/英 UI 语言切换。
4. 弹窗打开时，点击外部、切换路由或按关闭按钮都应收起。
5. 弹窗尺寸、按钮等长宽度、弹窗偏移等视觉参数使用 `--ns-top-nav-*` token，不在组件里散落数字。

示例方向：

```ts
const routes = [
  { path: '/', component: () => import('@/pages/home/HomePage.vue') },
  { path: '/ffxiv', component: () => import('@/pages/ffxiv/FfxivIndexPage.vue') },
  { path: '/ffxiv/plate', component: () => import('@/pages/plate/NSPlatePage.vue') },
  { path: '/ffxiv/glamour', component: () => import('@/pages/glamour/NSGlamourPage.vue') },
  { path: '/about', component: () => import('@/pages/about/AboutPage.vue') }
]
```

## 站点配置策略

站点级、分类级和工具入口级的稳定信息统一放在：

```text
src/config/site.ts
```

当前包括：

- `siteMeta`：站点中英文名称和基础描述。
- `textKeys`：站点稳定文案 key，例如 `ffxiv.workshop.title`、`site.nav.about`。
- `siteRoutes`：当前 hash route 对应的内部路径。
- `homeNavItems`：首页顶部导航项。
- `siteCategories`：分类入口，当前包括 `ffxiv` 和 `silence`。
- `ffxivTools`：FFXIV 工具入口，当前包括 `NSGlamour` 和 `NSPlate`。

规则：

1. 新增分类或工具入口时，优先更新 `src/config/site.ts`。
2. 页面组件应读取配置渲染入口，不要在多个页面重复硬编码品牌名、分类名、工具名称、路径、端口和 API base path。
3. `site.ts` 只放稳定站点信息、路由、API 边界和文案 key，不放运行时用户状态、接口返回数据或大量本地化文案。
4. 像 `狒狒14工房` 这种会在首页、顶栏、返回链接、标题和可访问性标签中重复出现的稳定名词，必须通过 `src/locales/` 的 key 读取，不能散落写死。

## 主题和 CSS 策略

当前阶段正式站点固定使用统一像素风。`day / night` 是同一套像素风的明暗配色模式，不是多套主题系统。

允许保留内部样式探索页，但它不再代表正式站点主题方向：

1. 可以建立隐藏预览页或开发用样式试验区，用同一批基础组件预览像素风内部强度、布局密度或单页特殊风格。
2. 样式探索只能用于设计比较，不提供给用户切换，不写入导航入口。
3. 实验皮肤优先通过容器选择器或可选 class 隔离，例如 `data-style-preview`、`.ns-pixel-*`，不得覆盖 `body`、`button`、`input`、`a` 等全局标签默认行为。
4. 核心公共组件的 DOM、状态和业务交互保持稳定；实验皮肤只调整颜色、字体、边框、圆角、阴影、间距等视觉变量或可选装饰类。
5. 实验样式文件不得从 `src/styles/index.css` 全站入口导入；必须由隐藏实验页或调试页按路由加载。
6. `NSGlamour`、`NSPlate` 等工具页迁移期间采用像素风公共组件，但优先保持工作台可读性和旧项目行为还原，不默认继承首页视觉舞台。
7. 白天/黑夜模式统一由 `src/stores/theme.ts` 写入 `document.documentElement.dataset.theme`，CSS 通过 `:root` 和 `:root[data-theme='night']` 切换变量。
8. 站点语言模式统一由 `src/stores/locale.ts` 管理，当前设置入口开放中/日/韩/英四项；UI 固定文案从 `src/locales/ui.ts` 读取，语言状态同时服务 API 语言头、数据选择、`document.lang` 和浏览器标题。

工房类复杂工具页的工作台样式和交互边界见 `docs/ai/WORKBENCH_STYLE_CONTRACT.md`。该文件优先约束 `NSPlate`、`NSGlamour` 等页面：布局可以不同，但控件、密度、状态提示、响应式和视觉降噪规则应保持一致。

公共样式审计记录见 `docs/ai/STYLE_AUDIT.md`。当出现“这个页面像素风是否偏了”“公共组件是否被实验样式污染”“某个颜色或尺寸应不应该成为 token”这类问题时，先读该文档和本节。

CSS 分层目标：

```css
@layer reset, theme, base, layout, components, utilities;
```

职责：

| 层           | 用途                                                            |
| ------------ | --------------------------------------------------------------- |
| `reset`      | box sizing、默认 margin、基础表单归一                           |
| `theme`      | 全站像素风颜色、字体、阴影、圆角、间距变量，以及 day/night 配色 |
| `base`       | body、链接、标题、可访问性基础样式                              |
| `layout`     | 页面骨架、内容宽度、双栏/单栏布局                               |
| `components` | 按钮、卡片、面板、表单、工具栏、状态提示等公共样式              |
| `utilities`  | 少量可复用工具类                                                |

规则：

1. 颜色、按钮、卡片、表单、面板、工具栏、状态反馈优先用公共样式和公共组件实现。
2. 页面级 `<style scoped>` 只写页面独有的空间关系、特殊 Canvas 布局或无法复用的视觉细节。
3. 不要让 Home、NSPlate、NSGlamour 各复制一套相似按钮、面板、像素边框和硬阴影样式。
4. 旧项目迁移时，先抽象公共视觉语言，再保留必要的页面差异。
5. 如果某个样式第三次出现，应考虑沉淀为公共 class、CSS 变量或公共组件。
6. 迁移功能时不得直接复制 Style Lab 的 `.ns-pixel-*` 实验类；正式页应使用 `App*` 公共组件、`.ns-*` 公共类和主题变量。

正式 token 分组：

| 分组     | 示例                                                              | 用途                           |
| -------- | ----------------------------------------------------------------- | ------------------------------ |
| 语义色   | `--ns-color-bg`、`--ns-color-text`、`--ns-color-accent`           | 全站背景、文字和品牌强调       |
| 像素外观 | `--ns-pixel-border`、`--ns-pixel-surface`、`--ns-pixel-window-bg` | 像素边框、窗口、按钮和面板     |
| 控件状态 | `--ns-control-inset-shadow`、`--ns-focus-ring`                    | 表单、focus 和基础控件反馈     |
| 状态反馈 | `--ns-status-info-*`、`--ns-status-danger-*`                      | `AppStatus` 和状态标签         |
| 顶栏弹窗 | `--ns-top-nav-control-width`、`--ns-top-nav-menu-width`           | 顶栏按钮等长、弹窗宽度和偏移   |
| 首页专属 | `--ns-home-*`                                                     | 只服务首页人物舞台和强视觉入口 |

正式公共组件不能直接依赖 `src/styles/experiments/pixel-soft.css` 中的实验变量。Style Lab 内如果需要对比正式公共组件，应把正式组件样本放在实验容器外。

## 样式变更分级规则

每次修改样式前必须先判断变更层级。判断不清楚时，不允许直接改公共样式。

### A. 全站级样式

适用范围：应该影响所有页面，包括 `#/`、`#/ffxiv`、`#/ffxiv/glamour`、`#/ffxiv/plate`。

包含：

- 字体、字号层级、行高。
- 基础色板和语义色。
- 按钮、链接、输入框、卡片、面板、弹窗、工具栏。
- spacing、radius、shadow、border。
- focus、hover、disabled、loading、error 等交互状态。

放置位置：

- `src/styles/theme.css`
- `src/styles/base.css`
- `src/styles/components.css`
- 公共组件，例如 `AppButton.vue`、`AppPanel.vue`、`AppField.vue`

要求：

1. 改动前说明这是全站统一调整。
2. 改动后至少检查首页、FFXIV 分类页和一个工具页的基础控件。
3. 可以把像素风基础控件写进全站组件默认样式，但不能把首页人物舞台、贴纸装饰和强视觉编排写进全站组件。

### B. 模块/分类级样式

适用范围：只影响某一类页面，例如 FFXIV 分类和 FFXIV 工具页。

包含：

- FFXIV 分类页工具卡布局。
- 工具页导航、工具分组、工作台信息密度。
- 同一模块内共享的标签、筛选、工具入口样式。

放置位置：

- `src/pages/ffxiv/`
- 未来如确有需要，可建立 `src/styles/modules/ffxiv.css`
- 模块私有组件

要求：

1. 不影响 `#/` 纯视觉首页。
2. 不修改公共组件默认外观来满足模块局部需求。
3. 如果模块样式后来被第二个模块复用，再考虑上移到全站公共层。

### C. 页面专属样式

适用范围：只影响单个页面。

包含：

- 首页人物舞台、粉蓝像素风皮肤、浮动图标、顶部视觉 bar。
- 单个工具页的 Canvas 容器、专属布局和局部动效。
- 单页特殊背景、装饰、贴纸、角色图、鼠标视差。

放置位置：

- 页面组件 `<style scoped>`
- 页面目录下的私有组件
- 页面私有 composable 或私有 CSS 文件

要求：

1. 不写进全站 CSS。
2. 不通过修改公共组件默认样式来实现单页视觉特效。
3. 首页可以强装饰，但这些装饰不能外溢到 FFXIV 分类页和工具页。
4. 页面专属样式如果出现第三处复用，再重新评估是否上移。

### 全站像素风与首页边界

全站统一使用像素风公共视觉语言：硬边框、方角、像素窗口感、硬阴影、粉蓝主色和 day/night 明暗配色。

`#/` 首页仍然允许拥有更强的页面专属视觉：人物舞台、浮动图标、爱心、鼠标指针、贴纸感和更明显的粉蓝主播女孩氛围。这些专属舞台效果不进入工具页工作台默认样式。

## 组件策略

目标公共组件方向：

```text
src/components/
├── AppButton.vue
├── AppPanel.vue
├── AppTopNav.vue
├── AppPixelWindow.vue
├── AppNotebookList.vue
├── AppField.vue
├── AppToolbar.vue
├── AppTabs.vue
├── AppDialog.vue
└── AppStatus.vue
```

约定：

- 公共组件负责基础视觉、可访问性和交互状态。
- 页面组件负责业务组合，不在页面里重复写通用按钮、卡片、输入框样式。
- 迁移旧项目时，能用公共组件表达的 UI 先用公共组件；确实不适配再补 modifier 或页面专用组件。
- 工房类页面不要一开始强行抽完整共享工作台组件；先遵守 `WORKBENCH_STYLE_CONTRACT.md`，等 `NSPlate` 和 `NSGlamour` 都出现稳定重复结构后，再上提到 `src/pages/ffxiv/components/` 或公共组件。
- 复杂业务拆分、文件体积警戒线、`src/lib/` 和后端分层规则见 `docs/ai/CODE_STRUCTURE_RULES.md`。

## 公共组件样式契约 v0.1

本契约约束正式公共组件的默认视觉语言。它不要求所有业务控件都直接调用公共组件；复杂工房页可以保留页面私有控件，但私有控件应尽量继承同一套 token、字体、状态和交互原则。

适用公共组件：

- `AppButton` / `.ns-button`：普通按钮、主操作按钮、未来危险按钮、轻量按钮、图标按钮和紧凑按钮。
- `AppField`：输入框、下拉框、文本域、说明文字、错误文字和必填标记。
- `AppToolbar`：导入、清空、识别、导出等同类操作行。
- `AppTabs`：页面或工作台主分区。
- `AppStatus`：成功、警告、错误、加载、空状态和轻量提示。
- `AppPanel`：普通内容面板。
- `AppPixelWindow`：弹窗、小菜单、轻量工具窗口。
- `AppNotebookList`：记事本式素材/选项列表，适合工房页侧栏里需要紧凑浏览、滚动和选中反馈的短文本列表。
- `AppTopNav`：非首页全局顶栏、`菜单 | MENU` 和 `设置 | CONFIG` 弹窗。

视觉规则：

1. 正式公共组件统一使用像素风基础语言：方角、硬边框、硬阴影、清晰 active/focus 状态。
2. 外层按钮、弹窗、工具栏、tab、面板默认使用 `2px solid` 像素边框；高密度业务列表、素材缩略图、表格行和内部分隔可以使用 `1px`，但要保留方角和清晰选中态。
3. 默认不使用圆角、玻璃拟态、`fantasy-card` 类装饰、大面积柔光卡片或与像素风无关的 fantasy 风格。
4. 阴影使用硬阴影，例如 `3px 3px 0`、`4px 4px 0`、`6px 6px 0`；避免模糊大阴影作为基础控件默认样式。
5. hover 可以轻微向左上移动；active 可以表现为按下去。动画应短、克制，并照顾长时间操作的工房页。
6. `day` 模式使用粉蓝像素风；`night` 模式使用紫青赛博夜色，但饱和度保持克制，不能压过内容、缩略图、Canvas 或游戏素材。
7. 按钮、标签、窗口标题栏、tab 标题优先使用 `--ns-font-decorative`；输入内容、正文、长说明、素材名、装备名等需要阅读的文本优先使用 `--ns-font-sans`。
8. 工房页控件密度应偏紧凑；首页可以更花、更舞台化，但首页装饰不能进入公共组件默认样式。
9. 滚动区域如果需要像素化滚动条，优先使用公共 `.ns-scroll-area` class，并按需加 `.ns-scroll-area--compact`；不要全局重写 `body`、`*` 或所有滚动条，避免影响浏览器可用性。
10. Style Lab 的 `.ns-pixel-*`、`.ns-cyber-*` 属于实验样式，不能直接复制到正式页面。正式页面应使用 `App*` 公共组件、`.ns-*` 公共类和 `theme.css` token。

公共/私有边界：

1. 公共组件负责基础视觉、可访问性、状态、字体和交互节奏。
2. 页面私有组件负责业务布局、Canvas、素材缩略图、裁切器、复杂列表、拖拽区和导出级状态。
3. 私有组件可以不直接调用 `AppButton`、`AppPanel` 等公共组件，尤其当它需要更高密度、更特殊的 DOM 结构或更贴近旧项目交互时。
4. 如果某个私有样式在两个以上正式模块稳定复用，再评估上提到公共组件、公共 class 或 `src/pages/ffxiv/components/`。
5. 上提公共样式前必须确认不会破坏 `NSPlate`、`NSGlamour` 等工房页的可读性和操作密度。

## 图标素材策略

当用户提出“做图标”“找图标”“换成像素图标”或类似需求时，优先把用户确认过的像素图标页面发给用户挑选，不要由 AI 自行随意决定整套图标：

```text
https://www.iconfont.cn/collections/detail?spm=a313x.search_index.0.da5a778a4.1cd23a810ynaEk&cid=51225
https://pixelarticons.com/
```

规则：

1. 用户从上述页面或其他明确来源选定图标后，再接入项目。
2. `Pixelarticons` 免费包按 MIT 授权来源处理；正式接入前保留必要 license/copyright 记录。
3. 正式接入图标时优先下载到本地资产目录，不默认使用远程 iconfont CDN。
4. 图标接入应尽量通过公共图标组件、CSS 变量或统一资产路径管理，避免在页面里散落硬编码 SVG。
5. `NSPlate`、`NSGlamour` 等工具页中的游戏数据图标仍以游戏客户端数据和正式素材为准，不用通用像素图标替代游戏数据。

## 端口和代理策略

开发环境端口：

| V2 路径          | 代理目标                | rewrite 后路径 | 来源                          |
| ---------------- | ----------------------- | -------------- | ----------------------------- |
| `/api/plate/*`   | `http://localhost:3456` | `/api/*`       | V2 `NSPlate`，旧 `NSPortable` |
| `/api/glamour/*` | `http://localhost:8765` | `/api/*`       | `NSGlamour`                   |
| `/img/*`         | `http://localhost:3456` | 原路径         | 旧 `NSPortable` 游戏素材      |
| `/img-preview/*` | `http://localhost:3456` | 原路径         | 旧 `NSPortable` 预览素材      |

`NSGlamour` 本机端口以当前项目习惯 `8765` 为准，不再沿用旧文档里的旧端口。
两个旧项目后端真实业务路径都以 `/api/...` 为主；V2 前端使用 `/api/glamour/...`、`/api/plate/...` 做命名空间隔离，开发代理和生产反向代理必须保持一致的 rewrite 规则。

生产环境目标：

- `/` 指向 V2 Vue 静态构建产物。
- `/api/plate/*` 反向代理到 `NSPlate` 后端；当前目标是旧 `NSPortable`。
- `/api/glamour/*` 反向代理到 `NSGlamour`。
- `/img/*` 和 `/img-preview/*` 反向代理到旧 `NSPortable`，除非后续统一素材静态分发。
- 旧路径跳转或兼容层需在具体迁移阶段单独设计，不在早期默认删除。

## API 策略

- 组件不直接散落 `fetch` 逻辑；统一封装见 `API_CONVENTIONS.md`。
- `useFetch.ts` 已建立基础封装，业务页面应优先使用它，不要在组件内散落裸 `fetch`。
- 接口返回字段以旧项目兼容为先，前端适配层可以整理数据，但不要轻易要求后端改字段。
- 上传、外部链接导入、图像代理、文件解析都视为不可信输入，迁移时必须说明安全边界。

## Canvas 迁移策略

`NSPlate` 和 `NSGlamour` 的核心 Canvas 逻辑应作为可测试的纯逻辑迁入 `src/lib/`：

```text
src/lib/
├── plate/
└── glamour/
```

原则：

1. 不用 Vue 重写已经验证过的 Canvas 坐标、字体、裁剪和导出算法。
2. Vue 组件负责 canvas DOM、用户输入、状态同步和生命周期。
3. 渲染模块保留明确入口，例如 `render(...)`、`loadImageSlot(...)`、`exportPng(...)`。
4. 迁移后用真实旧项目数据做视觉回归，尤其关注字体、裁剪、坐标和导出尺寸。

## 已确认决策

1. 正式站点固定统一像素风，支持全局 `day / night` 明暗配色模式。
2. `NSGlamour` 开发代理端口使用 `8765`。
3. `NSPlate` 当前开发代理端口使用旧 `NSPortable` 的 `3456`。
4. V2 前端先统一页面入口和前端架构，旧后端初期保持独立。
5. 页面迁移前必须先建立对应模块文档。
6. 整站不是 FFXIV 专站；`FFXIV` 是当前第一阶段分类。
7. 允许保留内部样式探索页比较像素风强度和单页特殊风格，但它不是用户可见主题系统，不能污染工具页迁移边界。

## 风险点

- 旧项目 Canvas 渲染对坐标、字体和图片裁剪高度敏感，迁移时不能“顺手优化”视觉参数。
- 游戏素材和字体体积可能很大，需要后续规划静态资源分发和缓存。
- API path 需要兼容旧项目真实接口，不能只按新目录想象。
- Hash route 与未来 clean path 之间有部署差异，切换前必须另写计划。
- 公共 CSS 抽象过早会妨碍复杂工具迁移，抽象过晚又会造成页面风格分裂；以出现频率和复用价值为准。
