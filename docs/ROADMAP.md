# Roadmap

本文件用于给项目评估和后续开发排序。当前 V2 已进入 FFXIV 工具迁移收口阶段；具体模块真实状态以 `docs/ai/MODULE_MAP.md` 和 `docs/ai/MODULES/` 为准。

## 当前阶段

阶段：V2 地基与 FFXIV 工具迁移收口。

已完成：

- Vue 3 + Vite + TypeScript 基础项目。
- Vue Router hash 路由。
- 首页、FFXIV 分类页、NSGlamour 占位页、NSPlate 工作台、About 占位页。
- 轻量全局导航。
- 公共 CSS 初版。
- 基础公共组件。
- `useFetch.ts` 请求封装。
- `apiBoundaries.ts` API 边界配置。
- Vite proxy 对接仍需后端的旧工具；`NSPlate` 默认运行数据源已切到静态 manifest + COS/CDN。
- 项目文档、模块文档和迁移计划。

尚未完成：

- `NSPlate` 更完整视觉回归样本
- `src/lib/glamour/`
- `NSGlamour` 旧业务迁移。
- 全量固定 UI 文案的本地化覆盖审计。
- 仍需后端模块的新后端或长期服务策略。
- 生产部署配置。

## 短期计划

1. 稳定工程地基。
   - 保持工作区提交干净。
   - 维护 README、Roadmap、Review Guide。
   - 使用 GitHub Actions 验证构建。

2. 明确复杂业务边界。
   - 为 NSPlate 和 NSGlamour 补 API 契约。
   - 为导入、渲染、导出准备真实样本。
   - 先定义模块边界，再迁移业务代码。

3. 收口已迁移工具的默认数据源和验证链路。
   - 静态 manifest。
   - COS 原图和缩略图。
   - 基础 loading/error/empty 状态。
   - 本地化覆盖审计。

## 中期计划

### NSPlate

目标：

- 保持 `src/lib/plate/`、页面组件和服务边界清晰。
- 默认运行脱离旧 `NSPortable` 服务。
- 补齐视觉回归样本、移动端、夜间模式和导出组合验证。

优先级建议：

1. 静态 manifest `/data/plate/*.json`、COS 原图和 `plate-preview/256` 缩略图的回归检查。
2. 不依赖旧服务的页面加载、素材选择和预设应用验证。
3. 信息层、出框层级和图层顺序验证。
4. PNG/JPG/分层 ZIP 导出验证。
5. 字体授权/OpenType 特性、夜间模式细节和全量回归样本收口。

### NSGlamour

目标：

- 建立 `src/lib/glamour/`。
- 抽取 `.chara`、石之家、EC、文本导入契约。
- 先统一装备/染剂合法性，再迁移模板和装备信息工作流。

优先级建议：

1. 装备、染剂、部位顺序和合法性模型。
2. 文本导入和链接导入适配层。
3. `equipinfo` 工作流。
4. `template` 工作流。
5. 模板渲染和导出回归。

## 长期计划

- 仍需服务端的模块按 V2 规则重写或稳定长期服务策略。
- 旧后端作为契约和回归样本逐步退出。
- 生产 Nginx / 静态资源 / CDN / 缓存策略完善。
- 扩展非 FFXIV 分类、博客和创作信息。
- 首页最终视觉替换占位设计。

## 暂缓事项

这些事不适合在地基阶段急着做：

- 大规模迁移旧业务。
- 合并两个旧后端。
- 切换 clean path。
- 引入 UI 组件库。
- 改写 Canvas 视觉参数。
- 处理最终生产部署。
