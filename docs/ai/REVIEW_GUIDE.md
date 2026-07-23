---
summary: "评估 V2 当前可检查范围、重点风险、暂缓项和本地验证入口。"
status: "active"
scope: "整站代码 review、模块收口评估和外部反馈。"
source_of_truth: "PROJECT_CONTEXT、MODULE_MAP、当前路由和模块回归文档。"
read_when: "进行代码评估、跨 Agent review 或向外部说明当前状态。"
update_when: "可访问页面、模块成熟度、重点风险或验证命令变化时。"
verify: "对照 router、模块文档和 package scripts。"
---

# 项目评估指南

本文件给参与评估的朋友或后续 AI 使用，帮助区分“现在应该评估什么”和“现在还没到评估时机的东西”。

## 当前真实状态

V2 已形成统一 Vue 站点外壳和五个公开 FFXIV 工具入口。`NSPlate`、物品卡片和 `NSGlamour` 已具备真实工作台；时尚品鉴提供当前周公开作业；`NSArmoire` 公网页只提供本地程序下载教程，完整工作台进入 `armoire-local` 构建。`Silence` 已有入口、分组舞台和部分角色详情代码，但资料未完成，当前暂不上线。

可以访问的页面：

- `#/`
- `#/ffxiv`
- `#/ffxiv/plate`
- `#/ffxiv/glamour/template`
- `#/ffxiv/glamour/equipinfo`
- `#/ffxiv/glamour`
- `#/ffxiv/armoire`
- `#/ffxiv/fashioncheck`
- `#/ffxiv/fashioncheck/tags`
- `#/ffxiv/fashioncheck/sources`
- `#/ffxiv/item-card`
- `#/about`

这些页面成熟度不同，评估时必须先读对应模块文档。工具页重点检查真实导入、编辑、数据和导出链路；首页重点检查视觉、导航和响应式；衣柜公网页重点检查下载教程与公开构建隔离，不按完整工作台验收。

Silence 路由代码当前只用于本地开发和资料录入，资料未完成，不纳入公开页面或上线验收。

## 建议重点评估

### 架构边界

- 页面组件是否只负责 UI 组织。
- 复杂业务是否规划进入 `src/lib/`。
- API 是否通过 service / adapter 隔离。
- 旧后端是否被当作契约，而不是被无脑搬迁。

### 可维护性

- 文档是否能说明当前真实状态。
- 新模块是否先有模块文档。
- 命名是否清楚，例如 V2 模块名 `NSPlate` 与旧项目 `NSPortable` 是否区分。
- 是否有明确的“不要写成一大坨”的规则。

### 前端基础

- Router 层级是否合理。
- `src/config/site.ts` 是否适合作为站点入口配置。
- 公共 CSS 和公共组件是否避免页面风格分裂。
- `useFetch.ts` 和 `apiBoundaries.ts` 是否足以支撑后续 API 接入。

### 迁移策略

- NSPlate 和 NSGlamour 是否分别有清楚的模块边界。
- API 契约是否先于后端重写建立。
- Canvas、导入、导出和多语言是否有回归样本规划。
- 旧项目复杂细节是否被记录为风险点。

### NSPlate 收口质量

- 默认运行是否只读取 `/data/plate/*.json` 和 COS/CDN，不依赖旧 `/api/plate`。
- Canvas 预览、PNG/JPG、前端分层 ZIP 和配置导入导出是否保持同一图层顺序来源。
- 信息层坐标、字体、描边、图标、队徽、作息条是否有旧项目样本对照。
- 移动端、夜间模式、多语言和旧配置兼容是否进入回归矩阵。
- 本地是否能通过 `npm run check:plate-static`、`npm run check:plate-static:preview` 和重型浏览器回归 `npm run check:plate-regression`。

## 暂不建议评估

这些内容当前还不是最终状态：

- 首页最终视觉效果。
- NSGlamour 新后端替换、旧项目全量视觉哈希和生产环境外部导入稳定性。
- 仍使用旧后端模块的长期服务和替换方案。
- 生产部署。
- 移动端完整工具体验；NSPlate 至少应做基础可用性回归，但不把移动端当作主要生产编辑体验。

## 本地检查

```bash
npm install
npm run check
```

如果只想确认项目能构建：

```bash
npm run build
```

代码 review 不能只看 diff 和构建结果。行为改动按 `AGENT_WORKFLOW.md` 启动真实应用，执行对应用户路径并检查浏览器错误和失败请求。

如果只评估 NSPlate 收口质量：

```bash
npm run check:plate-static
npm run check:plate-static:preview
npm run check:plate-regression
```

## 关键文档入口

- `README.md`
- `AGENT_WORKFLOW.md`
- `docs/OWNER_VISION.md`
- `docs/ROADMAP.md`
- `docs/ai/DOCUMENTATION_CONTRACT.md`
- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/ARCHITECTURE_PLAN.md`
- `docs/ai/CODE_STRUCTURE_RULES.md`
- `docs/ai/MIGRATION_PLAN.md`
- `docs/ai/MODULE_MAP.md`
- `docs/ai/MODULES/*.md`
- `docs/api/nsplate.md`
- `docs/api/nsglamour.md`
- `docs/api/nsarmoire.md`

## 评估反馈格式建议

建议反馈时按这几类给：

1. 架构边界问题。
2. 命名或文档歧义。
3. 未来迁移风险。
4. 当前代码可维护性问题。
5. 可以暂缓的问题。
