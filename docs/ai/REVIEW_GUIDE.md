# 项目评估指南

本文件给参与评估的朋友或后续 AI 使用，帮助区分“现在应该评估什么”和“现在还没到评估时机的东西”。

## 当前真实状态

V2 当前不是所有旧工具功能的完整替代品，但已经不只是重构地基。`NSPlate` 已进入核心工作台收口；`NSGlamour` 已具备 EquipInfo/Template 双工作台，仍依赖旧 Flask API 并需要继续做旧项目等价回归；`NSArmoire` 和 `Silence` 按各自模块文档推进。

可以访问的页面：

- `#/`
- `#/ffxiv`
- `#/ffxiv/glamour`
- `#/ffxiv/plate`
- `#/about`

这些页面当前状态不同：`#/ffxiv/plate` 可评估真实铭牌工作台、静态数据源、Canvas 预览和导出链路；`#/ffxiv/glamour` 可评估共享装备草稿、EquipInfo/Template 往返、导入/编辑、六套 Canvas 模板、图片裁剪/暂存与原尺寸 PNG 导出；其他占位或半成品页面主要评估路由、布局、导航、公共组件和 API 边界。

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
- 尚未迁移模块的新后端质量。
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

如果只评估 NSPlate 收口质量：

```bash
npm run check:plate-static
npm run check:plate-static:preview
npm run check:plate-regression
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
- `docs/api/nsplate.md`
- `docs/api/nsglamour.md`

## 评估反馈格式建议

建议反馈时按这几类给：

1. 架构边界问题。
2. 命名或文档歧义。
3. 未来迁移风险。
4. 当前代码可维护性问题。
5. 可以暂缓的问题。
