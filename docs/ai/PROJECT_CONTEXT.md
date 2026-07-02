# 项目上下文

## 项目身份

**夜莺不语（Nightingale Silence）V2** 是夜莺不语的个人/工具网站统一 Vue 前端项目。站点可以承载多个分类，包括工具、博客和创作信息；当前第一阶段分类是 `FFXIV`。

站点愿景源文档是用户手写的 `docs/OWNER_VISION.md`。AI 文档和实现计划必须与该文档保持一致。

当前阶段目标是逐步承接原有 `NSHome`、旧 `NSPortable`、`NSGlamour` 的页面入口、交互和前端渲染能力；其中旧 `NSPortable` 在 V2 中的新模块名统一为 `Plate`。原后端服务早期作为独立临时兼容 API、行为契约和回归样本保留；最终后端可以按 V2 新规则重写。

FFXIV 分类强调游戏数据严谨性：装备、染剂、图像、Canvas 渲染、语言数据和导出结果都必须尽量贴近原项目已经验证过的行为。

## 当前真实状态

当前 V2 仍处于脚手架和规划阶段，不是已经完成迁移的站点。当前已接入第一版页面骨架和路由，但旧项目业务能力尚未迁移。

| 项目层面 | 当前状态 |
|---------|---------|
| 前端框架 | Vue 3.5 + Composition API + `<script setup>` |
| 构建工具 | Vite 6 |
| 语言 | TypeScript 5.7 |
| 路由 | Vue Router 4，当前使用 hash mode，已注册首页、FFXIV、两个工具占位页和 About |
| 状态管理 | Pinia 已安装；目前只有 `src/stores/locale.ts` 这种模块化 store 写法 |
| CSS | 已建立第一版 `src/styles/` 公共样式体系 |
| 页面 | 已建立 `src/pages/` 下的首页、FFXIV 分类页、工具占位页和 About 占位页 |
| 站点配置 | 已建立 `src/config/site.ts`，集中维护站点、分类和工具入口信息 |
| 本地化 | `locale` store 已有基本结构，但文案文件尚未接入 |
| API 封装 | 已建立第一版 `src/composables/useFetch.ts` 和 `src/services/apiBoundaries.ts` |
| 后端 | 原项目后端仍独立运行，V2 通过 Vite proxy 接入；后续可在契约验证后重写 |

当前实际文件结构重点如下：

```text
NightingaleSilenceWebV2/
├── AGENTS.md
├── PUBLICPROMPT.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── docs/
│   ├── OWNER_VISION.md
│   └── ai/
│       ├── PROJECT_CONTEXT.md
│       ├── ARCHITECTURE_PLAN.md
│       ├── CODE_STRUCTURE_RULES.md
│       ├── MIGRATION_PLAN.md
│       ├── MODULE_MAP.md
│       ├── API_CONVENTIONS.md
│       ├── REVIEW_GUIDE.md
│       └── PAGE_DEVELOPMENT_GUIDE.md
└── src/
    ├── config/
    │   └── site.ts
    ├── components/
    │   ├── AppButton.vue
    │   └── AppPanel.vue
    ├── composables/
    │   └── useFetch.ts
    ├── main.ts
    ├── App.vue
    ├── env.d.ts
    ├── pages/
    │   ├── about/
    │   ├── ffxiv/
    │   ├── glamour/
    │   ├── home/
    │   └── plate/
    ├── router/
    │   └── index.ts
    ├── services/
    │   └── apiBoundaries.ts
    ├── styles/
    │   ├── base.css
    │   ├── components.css
    │   ├── index.css
    │   ├── reset.css
    │   ├── theme.css
    │   └── utilities.css
    └── stores/
        └── locale.ts
```

当前启动链路：

1. `index.html` 提供 `#app`。
2. `src/main.ts` 创建 Vue app，注册 Pinia 和 Router。
3. `src/App.vue` 只渲染 `<router-view />`。
4. `src/router/index.ts` 当前使用 `createWebHashHistory()`，路由从 `src/config/site.ts` 的路径配置注册。

当前开发命令：

```bash
npm run dev
npm run build
npm run preview
```

当前后端端口约定：

| 服务 | 原项目 | 本地端口 | 备注 |
|------|--------|---------|------|
| 铭牌后端 | 旧 `NSPortable` / V2 `Plate` | `3456` | Node.js 服务，素材路径也由它提供 |
| 幻化后端 | `NSGlamour` | `8765` | Flask 服务，沿用当前本机项目约定 |

## 目标架构

目标是形成一个统一 Vue 前端，但不是一次性重写全部旧项目。迁移应以“先搭公共地基，再逐模块搬迁”为原则。

目标目录方向：

```text
src/
├── components/          # 跨页面公共组件：按钮、面板、表单、工具栏等
├── composables/         # useFetch、Canvas 调度、通用 UI 状态等
├── lib/                 # 与 Vue 解耦的纯逻辑，承接旧项目渲染和数据处理
│   ├── plate/
│   └── glamour/
├── locales/             # 合并后的 UI 本地化文案
├── pages/
│   ├── home/
│   ├── ffxiv/
│   ├── plate/
│   └── glamour/
└── styles/              # reset/theme/global/components/utilities 等公共 CSS
```

目标页面方向：

| 目标路由 | 模块 | 来源 |
|---------|------|------|
| `#/` | 首页 / 个人站入口 | `NSHome` + V2 新视觉 |
| `#/ffxiv` | FFXIV 分类导航页 | V2 新增 |
| `#/ffxiv/plate` | 铭牌编辑器 | V2 `Plate`，来源为旧 `NSPortable` |
| `#/ffxiv/glamour` | 幻化工具 | `NSGlamour` |
| `#/about` | About 占位页 | V2 新增 |

目标 CSS 和组件方向：

- 颜色、字体、间距、按钮、卡片、表单、面板、工具栏、状态反馈等优先进入公共 CSS 或公共组件。
- 页面级 `<style scoped>` 只写该页面独有的布局和视觉细节。
- 正式站点当前阶段固定使用 `atelier` 风格，不做用户可见的主题切换功能；允许建立隐藏的内部样式探索页比较候选皮肤，但候选皮肤不能污染正式全站样式或工具页迁移边界。
- 允许 Plate、Glamour 页面保留自身信息密度和复杂交互，但基础控件语言要统一。
- 样式修改必须按 `ARCHITECTURE_PLAN.md` 的“样式变更分级规则”判断层级：全站级、模块/分类级、页面专属。
- 首页可以有粉蓝像素风视觉皮肤，但它是 `#/` 页面专属，不等于全站主题，不能污染公共组件默认样式或工具页工作台样式。

目标 API 方向：

- 使用原生 `fetch`，不引入 axios。
- 通过 Vite proxy 和生产 Nginx 反向代理接入后端；早期接旧后端，后续可在同一路径后替换为新后端。
- `src/composables/useFetch.ts` 已提供基础统一封装；业务页面应优先使用它，不要散落裸 `fetch`。
- `src/services/apiBoundaries.ts` 负责旧项目 API 边界信息，组件不要硬编码 `localhost` 或端口。
- 后端字段兼容优先；即使重写后端，也必须先抽取旧接口契约和真实样本，不为了前端漂亮结构随意改动可见字段。

## 文档使用方式

- 每次新会话先读 `docs/OWNER_VISION.md`，确认用户手写的整站愿景和分类边界。
- 涉及整体架构、路由、主题、端口：读 `docs/ai/ARCHITECTURE_PLAN.md`。
- 涉及复杂业务拆分、模块边界、重构：读 `docs/ai/CODE_STRUCTURE_RULES.md`。
- 涉及旧项目迁移顺序和边界：读 `docs/ai/MIGRATION_PLAN.md`。
- 涉及页面、模块状态：读 `docs/ai/MODULE_MAP.md`。
- 涉及 API 调用：读 `docs/ai/API_CONVENTIONS.md`。
- 涉及项目评估或给外部朋友说明当前状态：读 `docs/ai/REVIEW_GUIDE.md`。
- 新增页面或组件：读 `docs/ai/PAGE_DEVELOPMENT_GUIDE.md`，并先建立或更新对应模块文档。
