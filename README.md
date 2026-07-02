# NightingaleSilenceWebV2

夜莺不语 / Nightingale Silence 的个人与工具网站 V2。这个仓库用于把原本分散的站点和工具逐步重构成一套统一的 Vue 前端。

当前项目还处在 V2 重构早期：应用外壳、路由、公共样式、基础组件、API 边界和迁移文档已经建立；旧工具的完整业务能力还没有迁入。

## 项目目标

- 用 Vue 3 + Vue Router 建立统一的网站入口。
- 支持个人首页、工具分类、博客和创作信息等后续扩展。
- 第一阶段先承接 FFXIV 工具分类。
- FFXIV 工具需要尽量还原游戏内数据体验，重视多语言客户端数据、装备/染剂/图像/导出结果的准确性。
- 旧后端早期作为兼容 API、行为契约和回归样本保留；后续可以按 V2 规则重写。

## 当前路由

项目当前使用 hash 路由：

| 路由 | 页面 | 状态 |
|------|------|------|
| `#/` | 首页 | 占位视觉首页已接入 |
| `#/ffxiv` | FFXIV 分类导航页 | 工具入口骨架已接入 |
| `#/ffxiv/glamour` | 幻化工房 / NSGlamour | 迁移占位页已接入 |
| `#/ffxiv/plate` | 铭牌工房 / Plate | 迁移占位页已接入 |
| `#/about` | About | 占位页已接入 |

## 技术栈

- Vue 3
- Vue Router 4
- Pinia
- TypeScript
- Vite
- 原生 `fetch` 封装，不使用 axios

## 本地运行

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

预览构建产物：

```bash
npm run preview
```

## 旧项目与后端边界

当前 V2 前端通过 Vite proxy 对接旧后端：

| 模块 | V2 API | 本地旧服务 | 说明 |
|------|--------|------------|------|
| NSGlamour | `/api/glamour/*` | `http://localhost:8765/api/*` | Flask 后端 |
| Plate | `/api/plate/*` | `http://localhost:3456/api/*` | 旧 NSPortable Node.js 后端 |
| Plate 素材 | `/img/*`、`/img-preview/*` | `http://localhost:3456` | 旧 NSPortable 游戏素材与预览图 |

旧后端不是最终架构的限制，而是当前阶段的契约来源。后续重写后端时，应保持 V2 对外 API 路径稳定，并用旧项目真实样本做回归验证。

## 文档入口

给评估项目的朋友可以优先看：

- `docs/OWNER_VISION.md`：站点愿景和用户手写需求。
- `docs/ROADMAP.md`：当前阶段、短中长期计划和暂缓事项。
- `docs/ai/PROJECT_CONTEXT.md`：当前真实状态和目标架构。
- `docs/ai/ARCHITECTURE_PLAN.md`：路由、CSS、组件、端口和代理策略。
- `docs/ai/CODE_STRUCTURE_RULES.md`：防止复杂业务再次写成大坨代码的结构规则。
- `docs/ai/MIGRATION_PLAN.md`：旧项目迁移顺序和后端重写边界。
- `docs/ai/MODULE_MAP.md`：页面和模块状态。
- `docs/ai/REVIEW_GUIDE.md`：给评估者看的检查重点。
- `docs/ai/MODULES/glamour.md`：NSGlamour 迁移计划。
- `docs/ai/MODULES/plate.md`：Plate 迁移计划。
- `docs/api/glamour.md`、`docs/api/plate.md`：API 契约草案。

## 当前评估重点

这个仓库目前最适合评估：

- V2 的项目边界是否清晰。
- Vue 前端目录、路由和公共组件规划是否合理。
- CSS 分层和“公共组件优先”的规则是否能支撑后续工具迁移。
- `/api/glamour` 与 `/api/plate` 的代理命名空间是否方便未来替换后端。
- 对旧项目复杂业务的迁移策略是否足够谨慎，尤其是 FFXIV 数据、Canvas 渲染、导出、染剂和多语言。

暂时不适合评估：

- 旧 NSGlamour / 旧 NSPortable 的完整功能可用性。
- 最终首页视觉设计。
- 最终生产部署方案。

## 代码约定

- 文本文件使用 UTF-8。
- 新页面和复杂模块开发前，先补或更新 `docs/ai/MODULES/` 下的模块文档。
- 用户未提供正式展示文案时，临时文案统一使用 `占位用，待编辑`。
- 样式优先复用公共 CSS 和公共组件，页面专属样式不要污染全站。
- 组件内不要散落裸 `fetch`，优先使用 `src/composables/useFetch.ts`。

## 许可证与素材

当前仓库包含项目代码、文档、站点图标和本地开发所需的前端资源。FFXIV 相关数据、素材、字体、截图或旧项目资源的授权与分发边界需要在正式部署和迁移时单独确认。
