# NightingaleSilenceWebV2

夜莺不语 / Nightingale Silence 的个人与工具网站 V2。这个仓库用于把原本分散的站点和工具逐步重构成一套统一的 Vue 前端。

当前项目已进入现有工具收口和生产边界稳定阶段：NSPlate、NSGlamour、物品卡片和时尚品鉴已具备真实工作流；NSArmoire 公网页与 Helper 内嵌本地工作台已分离；Silence 资料尚未填写完成，暂不纳入公开上线范围。

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
| `#/` | 首页 | 第一版视觉入口已接入 |
| `#/ffxiv` | FFXIV 分类导航页 | 五个工具入口已接入 |
| `#/ffxiv/plate` | 铭牌工房 / NSPlate | 核心工作台已接入 |
| `#/ffxiv/glamour` | 幻化工房 / NSGlamour | `template` 与 `equipinfo` 主工作流已接入，仍依赖旧 Flask 后端 |
| `#/ffxiv/armoire` | 衣柜管家 / NSArmoire | 公网教程和 GitHub Release 下载页 |
| `#/ffxiv/fashioncheck` | 时尚品鉴 | 当前周方案、金牌物品和来源页面已接入 |
| `#/ffxiv/item-card` | 物品卡片 | 独立导入、编辑和多种导出工作台已接入 |
| `#/ffxiv/armoire/store-review` | NSArmoire 商城数据校正 | 仅 `armoire-local` 构建中的隐藏校正页 |
| `#/ffxiv/term-review` | FFXIV 术语校正 | 内部校正页已接入 |
| `#/silence` | Silence 创作入口 | 代码已接入，资料未完成，暂不上线 |
| `#/silence/angel` | 不语·silence | 分组和角色详情代码已接入，暂不上线 |
| `#/silence/glitch` | 幽灵·silence | 双人页代码已接入，暂不上线 |
| `#/about` | About | 占位页已接入 |
| `#/style-lab` | Style Lab | 内部样式实验页 |

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

发布前检查：

```bash
npm run check:release
```

预览构建产物：

```bash
npm run preview
```

## 旧项目与后端边界

当前 V2 的服务和数据边界：

| 模块 | V2 API | 本地旧服务 | 说明 |
|------|--------|------------|------|
| NSGlamour | `/api/glamour/*` | `http://localhost:8765/api/*` | 当前仍使用旧 Flask 后端 |
| NSPlate | `/data/plate/*` + COS/CDN | 静态资源 | 默认运行路径；`/api/plate/*` 仅 legacy/dev fallback |
| NSArmoire | `http://127.0.0.1:8015` 同源页面/API | `NSArmoireButler` | 完整工作台仅由 Helper GUI 内嵌，公网页不连接 Helper |

旧后端不是最终架构的限制，而是当前阶段的契约来源。后续重写后端时，应保持 V2 对外 API 路径稳定，并用旧项目真实样本做回归验证。

## 文档入口

给评估项目的朋友可以优先看：

- `docs/OWNER_VISION.md`：站点愿景和用户手写需求。
- `AGENT_WORKFLOW.md`：实现、验证、文档同步和交付流程。
- `docs/ROADMAP.md`：当前阶段、短中长期计划和暂缓事项。
- `docs/ai/PROJECT_CONTEXT.md`：当前真实状态和目标架构。
- `docs/ai/DOCUMENTATION_CONTRACT.md`：文档事实来源、自愈和维护规则。
- `docs/ai/ARCHITECTURE_PLAN.md`：路由、CSS、组件、端口和代理策略。
- `docs/ai/CODE_STRUCTURE_RULES.md`：防止复杂业务再次写成大坨代码的结构规则。
- `docs/ai/MIGRATION_PLAN.md`：旧项目迁移顺序和后端重写边界。
- `docs/ai/MODULE_MAP.md`：页面和模块状态。
- `docs/ai/DEPLOYMENT_CHECKLIST.md`：上线前构建、反代、缓存和烟测清单。
- `docs/ai/REVIEW_GUIDE.md`：给评估者看的检查重点。
- `docs/ai/MODULES/nsglamour.md`：NSGlamour 迁移计划。
- `docs/ai/MODULES/nsplate.md`：NSPlate 迁移计划。
- `docs/api/nsglamour.md`、`docs/api/nsplate.md`、`docs/api/nsarmoire.md`：API 和数据契约。

## 当前评估重点

这个仓库目前适合评估：

- V2 的项目边界是否清晰。
- Vue 前端目录、路由和公共组件规划是否合理。
- CSS 分层和“公共组件优先”的规则是否能支撑后续工具迁移。
- NSPlate 静态数据源、NSGlamour 旧后端契约和 NSArmoire 本地边界是否清晰。
- FFXIV 数据、Canvas 渲染、导出、染剂、多语言和生产资源边界是否稳定。

Silence 当前只适合评估代码结构和本地页面，不适合按公开成品验收；角色资料、正式文案和授权素材完成后再单独进入上线评估。

## 代码约定

- 文本文件使用 UTF-8。
- 新页面和复杂模块开发前，先补或更新 `docs/ai/MODULES/` 下的模块文档。
- 用户未提供正式展示文案时，临时文案统一使用 `占位用，待编辑`。
- 样式优先复用公共 CSS 和公共组件，页面专属样式不要污染全站。
- 组件内不要散落裸 `fetch`，优先使用 `src/composables/useFetch.ts`。

## 许可证与素材

当前仓库包含项目代码、文档、站点图标和本地开发所需的前端资源。FFXIV 相关数据、素材、字体、截图或旧项目资源的授权与分发边界需要在正式部署和迁移时单独确认。
