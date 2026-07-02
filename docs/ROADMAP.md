# Roadmap

本文件用于给项目评估和后续开发排序。当前 V2 仍处于地基阶段，旧工具完整业务尚未迁入。

## 当前阶段

阶段：V2 地基与迁移准备。

已完成：

- Vue 3 + Vite + TypeScript 基础项目。
- Vue Router hash 路由。
- 首页、FFXIV 分类页、Glamour 占位页、Plate 占位页、About 占位页。
- 轻量全局导航。
- 公共 CSS 初版。
- 基础公共组件。
- `useFetch.ts` 请求封装。
- `apiBoundaries.ts` API 边界配置。
- Vite proxy 对接旧 `NSGlamour` 和旧 `NSPortable`。
- 项目文档、模块文档和迁移计划。

尚未完成：

- `src/lib/plate/`
- `src/lib/glamour/`
- 旧工具真实业务迁移。
- UI 本地化文案加载和切换控件。
- 新后端实现。
- 生产部署配置。

## 短期计划

1. 稳定工程地基。
   - 保持工作区提交干净。
   - 维护 README、Roadmap、Review Guide。
   - 使用 GitHub Actions 验证构建。

2. 明确复杂业务边界。
   - 为 Plate 和 NSGlamour 补 API 契约。
   - 为导入、渲染、导出准备真实样本。
   - 先定义模块边界，再迁移业务代码。

3. 先迁移低风险壳层能力。
   - 工具页布局。
   - API 连通性状态。
   - 基础 loading/error/empty 状态。
   - 本地化框架。

## 中期计划

### Plate

目标：

- 建立 `src/lib/plate/`。
- 抽取旧素材、预设、图层和导出契约。
- 分阶段实现素材列表、预设选择、图层编辑、Canvas 预览和导出。

优先级建议：

1. `/api/plate/files` 和 `/api/plate/presets` 的类型与适配层。
2. 素材/预设浏览 UI。
3. 图层模型和草稿状态。
4. Canvas 预览。
5. 导出能力。

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

- 新后端按 V2 规则重写。
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
