# Plate 模块计划

## 当前状态

- 模块状态：迁移占位页已接入，真实业务待重写/迁移。
- 目标路由：`#/ffxiv/plate`。
- 当前页面入口：`src/pages/plate/PlatePage.vue`。
- 来源项目路径：旧 `NSPortable`，`H:\NightingaleSilenceWeb\NSPortable`。
- 当前 API 边界：V2 使用 `/api/plate/*`，开发代理 rewrite 到旧服务 `/api/*`。
- 当前连通性检查：`/api/plate/presets`，对应旧服务 `/api/presets`。
- 当前旧服务端口：`3456`。
- 图片资源路径：`/img/*`、`/img-preview/*` 仍由旧服务提供。

## 定位

`#/ffxiv/plate` 是 FFXIV 铭牌/肖像相关编辑器模块，模块名统一为 `Plate`，目标是承接旧 `NSPortable` 的核心能力。

本模块不要求机械迁移旧前端代码。优先按 V2 的 Vue、公共组件、公共 CSS、API 边界和安全规则重新整理前端；后端也可以按新规则重写，但旧 `NSPortable` 行为必须先被抽取为契约和回归样本。

核心目标：

1. 保留旧项目已验证的 Canvas 合成、素材选择、图层编辑和导出能力。
2. 使用 V2 统一路由和工具页外壳。
3. 通过 `/api/plate`、`/img`、`/img-preview` 稳定接入素材和导出服务。
4. 多语言 UI、预设、信息图层和用户配置能平稳迁移。

## 后端重写策略

本模块允许按新规则重写后端，但旧 `NSPortable` Node 服务在一段时间内应作为行为契约和临时兼容 API。

推荐顺序：

1. 记录旧 API 的输入、输出、错误结构和文件/素材路径规则。
2. 冻结一组真实预设、素材、图层配置和导出样本。
3. V2 对外稳定使用 `/api/plate/*`、`/img/*`、`/img-preview/*`。
4. 新后端实现时不必复制旧目录结构，但必须保持 API 契约或提供明确适配层。
5. PNG、ZIP、PSD、JSX 等导出结果要用旧项目样本做回归比对。
6. 等价验证通过前，不删除旧 `NSPortable` 和旧部署入口。

重点风险：

- Canvas 坐标、缩放、图层排序、文本渲染和素材裁剪容易产生肉眼可见回归。
- 素材路径和缓存策略直接影响公开站点体积和加载速度。
- PSD/ZIP/JSX 导出涉及大 payload，必须保留大小、图层数量和像素总量限制。
- 旧本地存储里有大量用户配置，迁移策略需要单独设计。

## 旧项目契约参考

旧后端关键入口位于：

```text
H:\NightingaleSilenceWeb\NSPortable\src\server\routes\api-routes.js
H:\NightingaleSilenceWeb\NSPortable\src\server\routes\image-routes.js
```

已确认旧接口：

| 旧接口 | V2 目标路径 | 用途 |
|--------|-------------|------|
| `GET /api/metrics` | `GET /api/plate/metrics` | 指标接口，可能受 secret 保护 |
| `GET /api/files` | `GET /api/plate/files` | 素材列表和图片 base 信息 |
| `GET /api/presets` | `GET /api/plate/presets` | 肖像/铭牌预设 |
| `POST /api/export-psd` | `POST /api/plate/export-psd` | 服务端 PSD 导出 |
| `POST /api/export-psd-jsx` | `POST /api/plate/export-psd-jsx` | JSX 导出，可能被服务端禁用 |
| `POST /api/export-layered-zip` | `POST /api/plate/export-layered-zip` | 分层 ZIP 导出 |
| `GET /img/*` | `GET /img/*` | 游戏素材原图 |
| `GET /img-preview/*` | `GET /img-preview/*` | 游戏素材预览图 |

旧 `NSPortable` 服务没有 `/api/health`，不要臆造 health 接口。当前 V2 使用 `/api/plate/presets` 作为轻量连通性检查。

## 核心数据和功能契约

迁移或重写时必须先确认这些契约：

- `presets.banner`
- `presets.charcard`
- `/api/files` 的 `portrait`、`nameplate`、`_meta.imgBase`、`_meta.previewImgBase`
- Canvas 尺寸和导出尺寸
- 图层类型、图层顺序、图层坐标、透明度、混合方式
- 信息图层：文本、图标、队徽、固定层、多选 bar 等
- PSD/ZIP 导出 payload 中的 `layers`、`canvasWidth`、`canvasHeight`

旧项目对导出有服务端校验，包括画布尺寸、图层数量、像素总量和 PNG 图层数据。新后端必须保留同等或更严格的保护。

## 前端状态和存储参考

旧项目重要状态键：

| 键 | 用途 |
|----|------|
| `nsplate.uiLanguage` | UI 语言 |
| `iconComposerTheme` | 旧项目主题 |
| `iconComposer.ui.config.v1` | 图层、预设、视图等完整 UI 状态 |
| `iconComposer.infoPreset.phantomTideDefaults.v4` | 信息预设迁移标记 |
| `iconComposer.infoPreset.firstVisitHiddenDone.v1` | 信息图层首次提示状态 |
| `iconComposer.configPanelWidthPx.v1` | 配置面板宽度 |
| `iconComposer.infoPreset.graphicLayerRepair.v20260620a` | 图形层修复迁移标记 |

V2 不要求继续使用旧键名，但需要规划旧用户配置的读取、迁移或清理方式，避免用户一打开新页面就丢配置。

## 页面拆分方向

建议 V2 前端拆分：

```text
src/pages/plate/
├── PlatePage.vue
├── components/
│   ├── PlateWorkspace.vue
│   ├── PlatePreviewCanvas.vue
│   ├── PlateAssetPicker.vue
│   ├── PlateLayerPanel.vue
│   ├── PlatePresetPanel.vue
│   ├── PlateInfoLayerPanel.vue
│   └── PlateExportPanel.vue
└── composables/
    ├── usePlateAssets.ts
    ├── usePlateDraft.ts
    └── usePlateExport.ts

src/lib/plate/
├── assets/
├── canvas/
├── export/
├── layers/
├── presets/
└── render/
```

原则：

1. Vue 组件负责用户交互、表单、状态组合和 DOM 生命周期。
2. Canvas 绘制、图层归一、素材路径解析、导出数据收集放入 `src/lib/plate/`。
3. API 调用通过 `useFetch.ts` 和 `/api/plate`，页面不硬编码旧端口。
4. 图片素材路径仍通过 API 返回的 base 或 `apiBoundaries` 规则解析，不在组件里散落路径拼接。

## CSS 和组件策略

- 样式层级：工具页业务布局为页面专属；可复用工具控件优先公共组件。
- 按钮、面板、输入框、状态提示、弹窗、工具栏优先使用 `src/components/` 和 `src/styles/`。
- 预览画布、图层面板、素材选择器和导出面板可写页面私有样式。
- 不把旧 `NSPortable` 的暗色编辑器样式整套复制成 V2 全站样式。
- 不把首页像素风装饰带入铭牌编辑器工作台。
- 如果 Plate 与 Glamour 都需要同类工具页外壳，应沉淀到 `src/pages/ffxiv/components/` 或公共组件。

## 安全边界

必须注意：

1. `/api/files` 不应泄露服务器内部素材路径。
2. `/img/*` 和 `/img-preview/*` 只能服务白名单素材，不能变成任意文件读取。
3. PSD/ZIP/JSX 导出必须限制 payload、图层数量、单层尺寸和总像素。
4. JSX 导出如果涉及服务器文件写入或本机路径，公开部署时默认应关闭或加严格权限。
5. 错误信息不输出服务器内部路径、密钥或堆栈。

## 验证清单

实现或迁移后至少验证：

- `npx vue-tsc --noEmit`
- `npm run build`
- 浏览器访问 `http://localhost:5173/#/ffxiv/plate`
- `/api/plate/presets` 返回正常。
- `/api/plate/files` 能返回素材列表和图片 base。
- `/img/*` 和 `/img-preview/*` 可加载真实素材。
- 肖像和铭牌预设能正确应用。
- 图层排序、启用/隐藏、信息图层编辑和预览刷新稳定。
- PNG、分层 ZIP、PSD、JSX 导出路径按当前部署策略可用。
- 移动端至少保持查看和基础编辑可用，桌面端保持完整编辑体验。

## 待确认事项

- 新后端技术栈：继续 Node，还是与 Glamour 后端统一。
- 服务端导出能力是否全部保留，尤其是 JSX 导出。
- 游戏素材是继续由后端服务，还是后续迁入静态/CDN 分发。
- 旧用户配置是否自动迁移，还是提供一次性导入。
- 第一阶段先实现素材/预设浏览，还是直接实现完整 Canvas 编辑器。
