# V2 统一 Vue 前端架构方案

## 定位

V2 的目标是把夜莺不语 / Nightingale Silence 建成统一 Vue 3 前端的个人/工具网站。站点可以承载多个分类，包括工具、博客和创作信息；当前第一阶段分类是 `FFXIV`。

第一阶段会把 `NSHome`、旧 `NSPortable`、`NSGlamour` 逐步迁入同一个前端入口。旧 `NSPortable` 在 V2 中的新模块名统一为 `Plate`。旧项目后端先保持独立，V2 前端通过开发代理和生产反向代理接入。

这份文档只放长期架构策略；具体迁移顺序和边界放在 `docs/ai/MIGRATION_PLAN.md`。

## 当前约束

- 当前 `src/router/index.ts` 已创建 Router，并注册首页、FFXIV 分类页、两个工具占位页和 About 占位页。
- 当前已建立 `src/pages/`、`src/components/`、`src/styles/`、`src/config/` 基础目录。
- 当前已建立真实业务用的基础 `src/composables/useFetch.ts`，但尚未建立 `src/lib/plate/`、`src/lib/glamour/`。
- 当前 `src/App.vue` 渲染轻量全局导航和 `<router-view />`。
- 当前 `src/stores/locale.ts` 只有基础 locale store，文案加载和 UI 接入还未完成。
- 当前不是可用的完整站点，所有页面都应视为计划中或待迁移。

## 技术选型

| 层面 | 选择 | 说明 |
|------|------|------|
| 脚手架 | Vite + Vue 3 + TypeScript | 保持轻量，不额外引入框架 |
| 路由 | Vue Router 4，hash mode | 当前代码使用 `createWebHashHistory()` |
| 状态 | Pinia | 用于 locale、页面状态、迁移后的共享草稿状态 |
| 多语言 | 自建 locale store + JSON | 优先复用旧项目本地化数据结构 |
| UI 组件库 | 暂不引入 | 先用公共组件和公共 CSS 建立自己的网站语言 |
| CSS | CSS 自定义属性 + 公共 CSS layer + 页面 scoped style | 公共优先，页面特例最小化 |
| HTTP 客户端 | 原生 `fetch` | 后续由 `useFetch.ts` 统一封装 |
| Canvas 渲染 | 保留原 Canvas API 管线 | 渲染逻辑迁入 `src/lib/`，Vue 只负责状态和 DOM 挂载 |
| 后端 | 旧后端独立服务 | 旧 `NSPortable` Node.js、`NSGlamour` Flask 均先不合并 |

## 路由策略

当前采用 hash mode，因此开发和初期生产 URL 以 hash 路由为准：

| 目标路由 | 模块 | 状态 |
|---------|------|------|
| `#/` | `NSHome` 首页 | 占位骨架已接入 |
| `#/ffxiv` | FFXIV 分类导航页 | 占位骨架已接入 |
| `#/ffxiv/plate` | `Plate` 铭牌编辑器，来源为旧 `NSPortable` | 迁移占位页已接入 |
| `#/ffxiv/glamour` | `NSGlamour` 幻化工具 | 迁移占位页已接入 |
| `#/about` | About | 占位页已接入 |

约定：

1. 新页面必须 lazy import，避免首屏加载全部工具。
2. 新增路由前先建立或更新对应模块文档，见 `PAGE_DEVELOPMENT_GUIDE.md`。
3. `#/ffxiv` 是当前第一阶段分类，不代表整站只服务 FFXIV；未来可以新增其他分类路由。
4. 当前不把 clean path 当成立即目标，避免在迁移早期同时处理 Nginx fallback 和子路径兼容。
5. 若未来要从 `#/ffxiv/...` 切到 `/ffxiv/...`，需单独写迁移计划，统一处理 Router history、Nginx fallback、旧链接跳转和搜索引擎风险。

导航约定：

1. `#/` 首页保留页面专属导航，不显示通用顶栏。
2. 非首页显示轻量 `AppTopNav`，用于回首页和进入当前分类菜单。
3. `FF14工具` 是父级分类，`幻化工房`、`铭牌工房` 是子工具；顶栏应使用下拉菜单表达父子关系，不要做成三个并列按钮。
4. `AppTopNav` 不承担大型全站 header、营销导航或复杂信息架构。
5. 导航项优先来自 `src/config/site.ts`，不要在多个页面重复硬编码。

示例方向：

```ts
const routes = [
  { path: '/', component: () => import('@/pages/home/HomePage.vue') },
  { path: '/ffxiv', component: () => import('@/pages/ffxiv/FfxivIndexPage.vue') },
  { path: '/ffxiv/plate', component: () => import('@/pages/plate/PlatePage.vue') },
  { path: '/ffxiv/glamour', component: () => import('@/pages/glamour/GlamourPage.vue') },
  { path: '/about', component: () => import('@/pages/about/AboutPage.vue') },
]
```

## 站点配置策略

站点级、分类级和工具入口级的稳定信息统一放在：

```text
src/config/site.ts
```

当前包括：

- `siteMeta`：站点中英文名称和基础描述。
- `siteRoutes`：当前 hash route 对应的内部路径。
- `homeNavItems`：首页顶部导航项。
- `siteCategories`：分类入口，当前只有 `ffxiv`。
- `ffxivTools`：FFXIV 工具入口，当前包括 `NSGlamour` 和 `Plate`。

规则：

1. 新增分类或工具入口时，优先更新 `src/config/site.ts`。
2. 页面组件应读取配置渲染入口，不要在多个页面重复硬编码工具名称、路径、端口和 API base path。
3. `site.ts` 只放稳定站点信息，不放运行时用户状态、接口返回数据或大量本地化文案。

## 主题和 CSS 策略

当前阶段正式站点固定使用 `atelier` 风格，不做用户可见的主题切换功能，也不建立 theme store。

允许为了确定最终视觉方向建立内部样式探索，但它不是正式主题系统：

1. 可以建立隐藏预览页或开发用样式试验区，用同一批基础组件预览多套候选皮肤。
2. 候选皮肤只能用于设计比较，不提供给用户切换，不写入导航入口。
3. 候选皮肤优先通过容器选择器或可选 class 隔离，例如 `data-style-preview`、`.ns-pixel-*`，不得覆盖 `body`、`button`、`input`、`a` 等全局标签默认行为。
4. 核心公共组件的 DOM、状态和业务交互保持稳定；候选皮肤只调整颜色、字体、边框、圆角、阴影、间距等视觉变量或可选装饰类。
5. `NSGlamour`、`Plate` 等工具页迁移期间优先保持工作台可读性和旧项目行为还原，不默认继承强像素装饰、贴纸感或首页视觉舞台。
6. 最终确定一套视觉方向后，再把选中的变量和公共组件样式沉淀为正式全站风格；未选中的候选样式应删除或保留在文档记录中，不长期混入生产样式。

CSS 分层目标：

```css
@layer reset, theme, base, layout, components, utilities;
```

职责：

| 层 | 用途 |
|----|------|
| `reset` | box sizing、默认 margin、基础表单归一 |
| `theme` | `atelier` 的颜色、字体、阴影、圆角、间距变量 |
| `base` | body、链接、标题、可访问性基础样式 |
| `layout` | 页面骨架、内容宽度、双栏/单栏布局 |
| `components` | 按钮、卡片、面板、表单、工具栏、状态提示等公共样式 |
| `utilities` | 少量可复用工具类 |

规则：

1. 颜色、按钮、卡片、表单、面板、工具栏、状态反馈优先用公共样式和公共组件实现。
2. 页面级 `<style scoped>` 只写页面独有的空间关系、特殊 Canvas 布局或无法复用的视觉细节。
3. 不要让 Home、Plate、Glamour 各复制一套相似按钮和面板样式。
4. 旧项目迁移时，先抽象公共视觉语言，再保留必要的页面差异。
5. 如果某个样式第三次出现，应考虑沉淀为公共 class、CSS 变量或公共组件。

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
3. 不能把首页的像素装饰、贴纸感、强视觉舞台写进全站组件默认样式。

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

### 首页视觉皮肤边界

`#/` 首页允许拥有独立视觉皮肤：粉色 + 蓝色的可爱主播女孩像素风、人物舞台、浮动图标、窗口 UI、爱心、鼠标指针等。

但 `atelier` 是全站基础主题，不等于首页像素皮肤。公共组件不得默认带首页像素装饰。`#/ffxiv`、`#/ffxiv/glamour`、`#/ffxiv/plate` 只继承柔和色彩变量和基础控件，不继承首页强装饰。

## 组件策略

目标公共组件方向：

```text
src/components/
├── AppButton.vue
├── AppPanel.vue
├── AppTopNav.vue
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
- 复杂业务拆分、文件体积警戒线、`src/lib/` 和后端分层规则见 `docs/ai/CODE_STRUCTURE_RULES.md`。

## 端口和代理策略

开发环境端口：

| V2 路径 | 代理目标 | rewrite 后路径 | 来源 |
|------|---------|------|------|
| `/api/plate/*` | `http://localhost:3456` | `/api/*` | V2 `Plate`，旧 `NSPortable` |
| `/api/glamour/*` | `http://localhost:8765` | `/api/*` | `NSGlamour` |
| `/img/*` | `http://localhost:3456` | 原路径 | 旧 `NSPortable` 游戏素材 |
| `/img-preview/*` | `http://localhost:3456` | 原路径 | 旧 `NSPortable` 预览素材 |

`NSGlamour` 本机端口以当前项目习惯 `8765` 为准，不再沿用旧文档里的旧端口。
两个旧项目后端真实业务路径都以 `/api/...` 为主；V2 前端使用 `/api/glamour/...`、`/api/plate/...` 做命名空间隔离，开发代理和生产反向代理必须保持一致的 rewrite 规则。

生产环境目标：

- `/` 指向 V2 Vue 静态构建产物。
- `/api/plate/*` 反向代理到 `Plate` 后端；当前目标是旧 `NSPortable`。
- `/api/glamour/*` 反向代理到 `NSGlamour`。
- `/img/*` 和 `/img-preview/*` 反向代理到旧 `NSPortable`，除非后续统一素材静态分发。
- 旧路径跳转或兼容层需在具体迁移阶段单独设计，不在早期默认删除。

## API 策略

- 组件不直接散落 `fetch` 逻辑；统一封装见 `API_CONVENTIONS.md`。
- `useFetch.ts` 已建立基础封装，业务页面应优先使用它，不要在组件内散落裸 `fetch`。
- 接口返回字段以旧项目兼容为先，前端适配层可以整理数据，但不要轻易要求后端改字段。
- 上传、外部链接导入、图像代理、文件解析都视为不可信输入，迁移时必须说明安全边界。

## Canvas 迁移策略

`Plate` 和 `NSGlamour` 的核心 Canvas 逻辑应作为可测试的纯逻辑迁入 `src/lib/`：

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

1. 正式站点固定单套 `atelier` 视觉风格，暂不做用户可见的主题切换。
2. `NSGlamour` 开发代理端口使用 `8765`。
3. `Plate` 当前开发代理端口使用旧 `NSPortable` 的 `3456`。
4. V2 前端先统一页面入口和前端架构，旧后端初期保持独立。
5. 页面迁移前必须先建立对应模块文档。
6. 整站不是 FFXIV 专站；`FFXIV` 是当前第一阶段分类。
7. 允许建立内部样式探索页比较候选皮肤，但候选皮肤不是主题系统，不能污染正式全站样式和工具页迁移边界。

## 风险点

- 旧项目 Canvas 渲染对坐标、字体和图片裁剪高度敏感，迁移时不能“顺手优化”视觉参数。
- 游戏素材和字体体积可能很大，需要后续规划静态资源分发和缓存。
- API path 需要兼容旧项目真实接口，不能只按新目录想象。
- Hash route 与未来 clean path 之间有部署差异，切换前必须另写计划。
- 公共 CSS 抽象过早会妨碍复杂工具迁移，抽象过晚又会造成页面风格分裂；以出现频率和复用价值为准。
