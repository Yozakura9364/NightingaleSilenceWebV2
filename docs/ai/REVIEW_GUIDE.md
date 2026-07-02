# 项目评估指南

本文件给参与评估的朋友或后续 AI 使用，帮助区分“现在应该评估什么”和“现在还没到评估时机的东西”。

## 当前真实状态

V2 当前是重构地基，不是旧工具功能的完整替代品。

可以访问的页面：

- `#/`
- `#/ffxiv`
- `#/ffxiv/glamour`
- `#/ffxiv/plate`
- `#/about`

这些页面当前主要用于验证路由、布局、导航、公共组件和 API 边界。

## 建议重点评估

### 架构边界

- 页面组件是否只负责 UI 组织。
- 复杂业务是否规划进入 `src/lib/`。
- API 是否通过 service / adapter 隔离。
- 旧后端是否被当作契约，而不是被无脑搬迁。

### 可维护性

- 文档是否能说明当前真实状态。
- 新模块是否先有模块文档。
- 命名是否清楚，例如 V2 模块名 `Plate` 与旧项目 `NSPortable` 是否区分。
- 是否有明确的“不要写成一大坨”的规则。

### 前端基础

- Router 层级是否合理。
- `src/config/site.ts` 是否适合作为站点入口配置。
- 公共 CSS 和公共组件是否避免页面风格分裂。
- `useFetch.ts` 和 `apiBoundaries.ts` 是否足以支撑后续 API 接入。

### 迁移策略

- Plate 和 NSGlamour 是否分别有清楚的模块边界。
- API 契约是否先于后端重写建立。
- Canvas、导入、导出和多语言是否有回归样本规划。
- 旧项目复杂细节是否被记录为风险点。

## 暂不建议评估

这些内容当前还不是最终状态：

- 首页最终视觉效果。
- Plate 完整编辑功能。
- NSGlamour 完整模板和装备信息功能。
- 新后端质量。
- 生产部署。
- 移动端完整工具体验。

## 本地检查

```bash
npm install
npm run check
```

如果只想确认项目能构建：

```bash
npm run build
```

## 关键文档入口

- `README.md`
- `docs/OWNER_VISION.md`
- `docs/ROADMAP.md`
- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/ARCHITECTURE_PLAN.md`
- `docs/ai/CODE_STRUCTURE_RULES.md`
- `docs/ai/MIGRATION_PLAN.md`
- `docs/ai/MODULE_MAP.md`
- `docs/api/plate.md`
- `docs/api/glamour.md`

## 评估反馈格式建议

建议反馈时按这几类给：

1. 架构边界问题。
2. 命名或文档歧义。
3. 未来迁移风险。
4. 当前代码可维护性问题。
5. 可以暂缓的问题。
