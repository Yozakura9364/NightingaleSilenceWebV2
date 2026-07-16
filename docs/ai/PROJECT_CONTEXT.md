# 项目上下文

## 项目身份

**夜莺不语（Nightingale Silence）V2** 是夜莺不语的个人/工具网站统一 Vue 前端项目。站点可以承载多个分类，包括工具、博客和创作信息；当前第一阶段分类是 `FFXIV`。

站点愿景源文档是用户手写的 `docs/OWNER_VISION.md`。AI 文档和实现计划必须与该文档保持一致。

当前阶段目标是逐步承接原有 `NSHome`、旧 `NSPortable`、`NSGlamour` 的页面入口、交互和前端渲染能力；其中旧 `NSPortable` 在 V2 中的新模块名统一为 `NSPlate`。`NSPlate` 默认运行数据源已切到静态 manifest + COS/CDN；旧后端只作为显式 legacy/dev fallback、manifest 生成源和回归样本保留。其他仍依赖后端的模块按各自模块文档推进。

FFXIV 分类强调游戏数据严谨性：装备、染剂、图像、Canvas 渲染、语言数据和导出结果都必须尽量贴近原项目已经验证过的行为。

## 当前真实状态

当前 V2 已完成基础应用外壳，并且 `NSPlate` 已进入核心工作台收口阶段；但整站还不是所有旧项目的完整替代品。不同模块状态必须分开描述，不能再笼统写成“全部只是占位”或“全部旧业务尚未迁移”。

| 项目层面 | 当前状态                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| 前端框架 | Vue 3.5 + Composition API + `<script setup>`                                  |
| 构建工具 | Vite 6                                                                        |
| 语言     | TypeScript 5.7                                                                |
| 路由     | Vue Router 4，当前使用 hash mode，已注册首页、FFXIV、物品卡片、时尚品鉴、NSPlate、NSGlamour、NSArmoire 轻量下载教程页、Silence 入口/分组/角色路由和 About |
| 状态管理 | Pinia 已安装；目前只有 `src/stores/locale.ts` 这种模块化 store 写法           |
| CSS      | 已建立第一版 `src/styles/` 公共样式体系                                       |
| 页面     | 已建立 `src/pages/` 下的首页、FFXIV 分类页、物品卡片工作台、时尚品鉴、NSPlate 工作台、NSGlamour 的 EquipInfo/Template 双工作台、NSArmoire 第一阶段页、Silence 页面和 About 占位页 |
| 站点配置 | 已建立 `src/config/site.ts`，集中维护站点、分类和工具入口信息                 |
| 本地化   | `locale` store 已接入设置入口和 `document.lang`；公共文案常驻，页面模块文案随路由按需加载 |
| API 封装 | 已建立第一版 `src/composables/useFetch.ts` 和 `src/services/apiBoundaries.ts` |
| 后端/数据源 | `NSPlate` 默认走静态 manifest + COS/CDN；仍需后端的模块通过 Vite proxy 或本机 helper 接入 |

当前模块口径：

| 模块 | 当前状态 |
| ---- | -------- |
| `物品卡片` | 已建立独立 `#/ffxiv/item-card` 工作台，支持网页链接或装备文本导入、装备/染剂编辑、文字样式、多语言、简易/完整版、单张 PNG、批量 ZIP 和连续列表长图；草稿自动保存，最近记录只保留兼容数据而不显示为主入口。不包含人物图片或幻化模板，页面源码和浏览器状态不与 V2 glamour 页面互相引用。 |
| `时尚品鉴` | 已建立当前周方案、金牌物品和来源页面；公开页面只读取经确认的当前周切片及中英日韩名称索引，历史与原始参考继续保留在非公开数据边界。 |
| `NSPlate` | 核心铭牌工作台已迁入，默认数据源为 `/data/plate/*.json` + COS/CDN；旧 `/api/plate` 只作为显式 legacy/dev fallback、manifest 生成源和旧接口参考。 |
| `NSGlamour` | EquipInfo 与 Template 双工作台已迁入：共享 `GlamourDraft`、网页链接/文字/隐式本地配置导入、装备候选替换、染剂编辑、多语言、最近记录、六套模板 Canvas、图片裁剪/最近图片暂存与原尺寸 PNG 导出均已接入。当前仍依赖旧 Flask API；生产部署、后端替换和旧项目等价回归继续按模块文档推进。 |
| `NSArmoire` | 完整工作台改由 `NSArmoireButler` 的 WPF/WebView2 GUI 本地承载；公网路由只保留教程和 GitHub Release 下载入口，公网构建不发布 Armoire catalog。 |
| `Silence` | 入口、分组页和部分角色页骨架已接入，正式角色资料和正式素材仍未完整接入。 |
| 首页 / About | 首页是第一版视觉入口，About 仍是占位页。 |

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
│       ├── STYLE_AUDIT.md
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
    │   ├── AppField.vue
    │   ├── AppNotebookList.vue
    │   ├── AppPixelWindow.vue
    │   ├── AppPanel.vue
    │   ├── AppStatus.vue
    │   ├── AppTabs.vue
    │   ├── AppToolbar.vue
    │   └── AppTopNav.vue
    ├── composables/
    │   └── useFetch.ts
    ├── main.ts
    ├── App.vue
    ├── env.d.ts
    ├── pages/
    │   ├── about/
    │   ├── armoire/
    │   ├── ffxiv/
    │   ├── glamour/
    │   ├── home/
    │   ├── plate/
    │   ├── silence/
    │   └── style-lab/
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

| 服务     | 原项目                         | 本地端口 | 备注                             |
| -------- | ------------------------------ | -------- | -------------------------------- |
| 铭牌旧服务 | 旧 `NSPortable` / V2 `NSPlate` legacy | `3456`   | 只作为 legacy/dev fallback、manifest 生成源和旧接口参考 |
| 幻化后端 | `NSGlamour`                    | `8765`   | Flask 服务，沿用当前本机项目约定 |

## 目标架构

目标是形成一个统一 Vue 前端，但不是一次性重写全部旧项目。迁移应以“先搭公共地基，再逐模块搬迁”为原则。

目标目录方向：

```text
src/
├── components/          # 跨页面公共组件：按钮、面板、表单、工具栏等
├── composables/         # useFetch、Canvas 调度、通用 UI 状态等
├── lib/                 # 与 Vue 解耦的纯逻辑，承接旧项目渲染和数据处理
    │   ├── plate/
    │   ├── silence/
│   └── glamour/
├── locales/             # UI 本地化类型、分模块消息包、分模块 key 和按需加载器
├── pages/
│   ├── home/
│   ├── ffxiv/
│   ├── plate/
│   └── glamour/
└── styles/              # reset/theme/global/components/utilities 等公共 CSS
```

目标页面方向：

| 目标路由          | 模块              | 来源                                |
| ----------------- | ----------------- | ----------------------------------- |
| `#/`              | 首页 / 个人站入口 | `NSHome` + V2 新视觉                |
| `#/ffxiv`         | FFXIV 分类导航页  | V2 新增                             |
| `#/ffxiv/item-card` | 物品卡片        | 旧 `NSGlamour /card` 功能的独立 Vue 重建 |
| `#/ffxiv/fashioncheck` | 时尚品鉴      | V2 当前周公开作业页                 |
| `#/ffxiv/plate`   | 铭牌编辑器        | V2 `NSPlate`，来源为旧 `NSPortable`，核心工作台已迁入 |
| `#/ffxiv/glamour` | 幻化工具          | `NSGlamour`                         |
| `#/ffxiv/armoire` | 衣柜管家          | V2 新增，第一阶段本地 helper / snapshot 工作台 |
| `#/silence`       | Silence 创作入口  | V2 新增，双入口门厅已接入           |
| `#/silence/angel` | 不语·silence 分组 | V2 新增，分组占位页已接入           |
| `#/silence/glitch` | 幽灵·silence 分组 | V2 新增，分组占位页已接入           |
| `#/about`         | About 占位页      | V2 新增                             |

目标 CSS 和组件方向：

- 颜色、字体、间距、按钮、卡片、表单、面板、工具栏、状态反馈等优先进入公共 CSS 或公共组件。
- 页面级 `<style scoped>` 只写该页面独有的布局和视觉细节。
- 正式站点当前阶段固定使用统一像素风；`day / night` 只是同一套像素风的明暗配色模式，不是多套主题系统。
- 允许 NSPlate、NSGlamour 页面保留自身信息密度和复杂交互，但基础控件语言要统一。
- 顶栏设置入口当前提供中/日/韩/英语言切换；全站固定 UI 文案必须通过 `src/locales/` key 读取，语言状态服务 API 语言头、数据选择、`document.lang` 和浏览器标题。
- 样式修改必须按 `ARCHITECTURE_PLAN.md` 的“样式变更分级规则”判断层级：全站级、模块/分类级、页面专属。
- 首页可以拥有更强的粉蓝像素风人物舞台和浮动图标，但全站公共组件也应保持像素风基础语言；首页舞台装饰不能污染工具页工作台样式。

目标 API 方向：

- 使用原生 `fetch`，不引入 axios。
- `NSPlate` 素材/预设默认通过静态 manifest 和 COS/CDN 接入；仍需后端的模块通过 Vite proxy 和生产 Nginx 反向代理接入。
- `src/composables/useFetch.ts` 已提供基础统一封装；业务页面应优先使用它，不要散落裸 `fetch`。
- `src/services/apiBoundaries.ts` 负责旧项目 API 边界信息，组件不要硬编码 `localhost` 或端口。
- 后端字段兼容优先；即使重写后端，也必须先抽取旧接口契约和真实样本，不为了前端漂亮结构随意改动可见字段。

## 文档使用方式

- 每次新会话先读 `docs/OWNER_VISION.md`，确认用户手写的整站愿景和分类边界。
- 涉及整体架构、路由、主题、端口：读 `docs/ai/ARCHITECTURE_PLAN.md`。
- 涉及全站样式审计、公共 token、顶栏弹窗和 Style Lab 边界：读 `docs/ai/STYLE_AUDIT.md`。
- 涉及复杂业务拆分、模块边界、重构：读 `docs/ai/CODE_STRUCTURE_RULES.md`。
- 涉及旧项目迁移顺序和边界：读 `docs/ai/MIGRATION_PLAN.md`。
- 涉及页面、模块状态：读 `docs/ai/MODULE_MAP.md`。
- 涉及 API 调用：读 `docs/ai/API_CONVENTIONS.md`。
- 涉及项目评估或给外部朋友说明当前状态：读 `docs/ai/REVIEW_GUIDE.md`。
- 新增页面或组件：读 `docs/ai/PAGE_DEVELOPMENT_GUIDE.md`，并先建立或更新对应模块文档。
