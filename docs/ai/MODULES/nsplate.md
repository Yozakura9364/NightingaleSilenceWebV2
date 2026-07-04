# NSPlate 模块计划

## 当前状态

- 模块状态：迁移占位页已接入，真实业务待重写/迁移。
- 目标路由：`#/ffxiv/plate`。
- 当前页面入口：`src/pages/plate/NSPlatePage.vue`。
- 来源项目路径：旧 `NSPortable`。
- 当前 API 边界：V2 使用 `/api/plate/*`，开发代理 rewrite 到旧服务 `/api/*`。
- 当前连通性检查：`/api/plate/presets`，对应旧服务 `/api/presets`。
- 当前旧服务端口：`3456`。
- 图片资源路径：`/img/*`、`/img-preview/*` 仍由旧服务提供。

## 已落地迁移切片

2026-07-03 已完成第一段保守迁移：预设和素材浏览 + 基础预览工作区。

2026-07-03 已完成第二段保守迁移：轻量图层草稿状态。

2026-07-03 已完成第三段保守迁移：信息图层固定字段定义只作为迁移契约资料保留，不挂载到正式工作台 UI。

2026-07-03 已完成第四段保守整理：抽出 NSPlate 私有面板壳，减少右侧面板样式重复。

2026-07-03 已完成第五段保守整理：抽出 NSPlate 私有可选项按钮，减少预设和素材选择按钮样式重复。

2026-07-03 已完成第六段保守清理：`#/ffxiv/plate` 退回为干净工作台骨架，隐藏旧信息层字段、图层匹配统计和缺失图层提示。

2026-07-03 已完成第七段迁移样板：打通 `肖像/铭牌 tab -> 预设/素材选择 -> 预览区状态反馈` 的最小闭环；切换 tab 时自动约束到对应的预设类型和素材 scope，预览区只展示当前已选预设与素材，不提供尚未实现的缩放、清空、导出等假按钮。

2026-07-03 已完成旧 UI 分布摸底：通过旧 `NSPortable` 服务和 V2 当前页面截图对照，确认后续迁移以新架构还原旧版双栏工作台、右侧三 tab、顶部轻量菜单和导出/设置浮层为主。

2026-07-03 已完成第八段保守迁移：阶段 B 工作台外壳拆分和右侧配置面板拖拽宽度落地。`NSPlateWorkspace.vue` 继续负责数据和当前 tab 编排；画布区域、右侧配置区、resize handle、右侧宽度持久化已拆到 NSPlate 私有组件/composable。此切片不迁移 Canvas 合成、菜单浮层、导出或信息层正式 UI。

2026-07-03 已完成第九段交互校正：右侧预设面板由按钮列表改为旧版信息架构中的下拉选择；素材面板由单个“分类”下拉改为按素材系列独立展开/收起的折叠区。当前只校正 UI 结构和浏览选择入口，尚未迁移旧版每个素材分类独立选中、预设上/下一个、真实 Canvas 应用规则。

2026-07-03 已完成第十段 Canvas 前置状态模型：新增 `src/lib/plate/draft.ts`，把旧 `NSPortable` 的肖像/铭牌素材分类、`肖像外框`、`铭牌装饰物`/`铭牌装饰物B` 互斥和预设 `cat + id` 匹配规则集中为 V2 draft 逻辑；`useNSPlateData.ts` 不再使用全局单选素材，也不再自动选中第一个素材，而是按素材系列保存选中项。当前临时预览只显示 draft 摘要和第一张已选素材，不代表真实 Canvas 合成已迁移。

2026-07-03 已完成第十一段最小 Canvas 合成：新增 `src/lib/plate/render.ts`，集中维护旧 `NSPortable` 的基础画布尺寸、系统素材层坐标、肖像嵌入铭牌位置和最小渲染顺序；`NSPlateCanvasArea.vue` 改为真实 `<canvas>`，左侧预览统一显示最终铭牌画布，`肖像` tab 只表示正在编辑嵌入到铭牌中的肖像素材。左侧画布框通过工作区尺寸测量自动使用可用空间内最大的 16:9 显示尺寸，不再固定为旧临时预览宽度。右侧素材面板先过滤到当前画布会渲染的系统分类，避免信息层图标素材等暂未迁移内容造成“已选但不显示”的错觉。预设和素材面板不显示项目数或层数。当前只渲染系统素材层，不迁移信息图层、缩放拖拽视口、导出和旧配置导入。

2026-07-03 已完成第十二段自定义肖像最小预览闭环：新增 `NSPlatePortraitUpload.vue`，在 `肖像` tab 中提供自定义图片上传和清空入口；上传图片会被前端居中裁切成 `512×840` 数据图，并按旧 `NSPortable` 顺序绘制在肖像背景之后、肖像装饰框/装饰物之前，再嵌入最终铭牌画布。此切片同时移除画布底部状态框，避免把“当前编辑/预设/图层名”这类调试型状态固定在正式预览下方；后续如需部件清单，应作为可折叠的真实编辑器列表单独设计。右侧面板提供轻量清空操作：`清空自定义图片` 只影响上传图，`清空所有选择` 同时清空当前页面草稿中的预设、素材选择和自定义图。此切片不迁移裁切弹窗、缩放拖拽取景、自定义图配置持久化、旧配置导入或导出 payload。

2026-07-04 已完成第十三段结构拆分：把 NSPlate 类型定义移动到 `src/lib/plate/types.ts`；把 Canvas 绘制流程从 `NSPlateCanvasArea.vue` 拆到 `src/lib/plate/canvasRenderer.ts`；把画布 frame 尺寸和 ResizeObserver 拆到 `useNSPlateCanvasFrame.ts`；把自定义肖像文件读取和居中裁切拆到 `src/lib/plate/customPortrait.ts`；把素材面板拆为 `NSPlateAssetPanel.vue`、`NSPlateAssetSection.vue`、`NSPlateAssetCard.vue`；把画布底部操作栏拆为 `NSPlateCanvasActions.vue`；把旧 API 返回归一拆到 `nsplateAdapters.ts`，让 `nsplateApi.ts` 只负责请求。此切片只调整前端职责边界，不改变素材选择、预设应用或 Canvas 合成行为。

2026-07-04 已完成第十四段标准自定义肖像裁切：新增 `NSPlateCropDialog.vue`，上传图片后先进入 `512×840` 裁切弹窗，支持拖拽取景、缩放滑块、确认/取消；`src/lib/plate/customPortrait.ts` 负责文件读取、裁切状态、裁切预览和标准裁切输出。确认后仍输出固定 `512×840` PNG 作为标准自定义肖像层，保持当前 Canvas 合成顺序和旧项目标准裁切语义。此切片不迁移出框式透明 PNG 模式、旧配置持久化、导出 payload 或旧 JSON 导入兼容。

2026-07-04 已完成第十五段出框式自定义肖像前端预览闭环：`NSPlateCropDialog.vue` 在标准裁切基础上新增 `标准进框 / 出框` 模式切换；出框模式保留原图数据、取景参数和 `splitY` 横向分界线，分界线可通过滑块或直接拖动画布上的横线调整。出框模式的裁切弹窗预览使用最终 `2560×1440` 铭牌范围显示，并在最终坐标中标出肖像框和分界线，避免用户只看到孤立 `512×840` 肖像裁切框而无法判断最终出框范围。`canvasRenderer.ts` 在预览合成时把同一张透明图分两次绘制：分界线以下作为框内角色层进入 `512×840` 肖像画布，肖像装饰框/铭牌外框之后再把分界线以上作为出框角色层绘制到铭牌主画布。此切片只完成前端预览，不迁移 PSD/ZIP 分层导出、旧配置持久化或旧 JSON 导入兼容。

2026-07-04 已完成第十六段前端扁平图导出：新增 `src/lib/plate/exportCanvas.ts`，先迁移浏览器端 PNG/JPG 下载能力；`NSPlateCanvasActions.vue` 在画布下方操作栏提供 `导出 200%`、`导出 PNG`、`导出 JPG`，`NSPlateCanvasArea.vue` 只在最终 canvas 渲染完成后允许导出。此切片导出当前合成后的扁平图，不收集导出级图层数据，不迁移 PSD/ZIP/JSX、旧配置导入导出或出框层级锚点。

2026-07-04 已完成第十七段分层 ZIP 最小闭环：新增 `src/lib/plate/layeredExport.ts`，按当前 V2 Canvas 顺序收集已迁移的系统素材层和自定义肖像层；出框自定义图导出为 `自定义图片` 与 `自定义图片（出框）` 两层，保持后续 PSD/ZIP 可编辑方向。`NSPlateCanvasActions.vue` 新增 `导出分层 ZIP`，`NSPlateCanvasArea.vue` 通过 `/api/plate/export-layered-zip` 走旧 `NSPortable` 后端生成 ZIP；`vite.config.ts` 支持从 `ICON_COMPOSER_API_TOKEN` 或 `NSPLATE_EXPORT_API_TOKEN` 读取 token，并只对 `/api/plate/export-*` 代理请求注入 `x-icon-composer-token`。此切片不迁移信息层、PSD/JSX、旧配置 JSON 或前端 JSZip 打包。

2026-07-04 已完成第十八段分层 ZIP 稳定性修正：`src/lib/plate/layeredExport.ts` 增加浏览器端无压缩 ZIP 打包器，不引入新依赖；导出时先在前端把每个图层贴到完整铭牌画布并写入 `L000.png`、`L001.png` 等 ZIP 条目，旧 `/api/plate/export-layered-zip` 只作为 fallback。这样本地开发环境即使旧后端未配置导出 token，或旧后端 `pngjs` 对个别 PNG 解码失败，也不阻塞用户导出。`NSPlateCanvasArea.vue` 同时把“没有可导出的图层”和“分层 ZIP 导出失败”拆成独立错误提示，避免所有导出失败都只显示通用文案。

2026-07-04 已完成第十九段 V2 草稿本地缓存：新增 `useNSPlateDraftPersistence.ts`，使用 V2 私有 localStorage 键 `nsplate.draft.v1` 缓存当前已迁移的草稿状态，包括肖像/铭牌预设 id、各素材系列选中项和自定义肖像图片。预设 id 改为不依赖本地化显示名的稳定形式，避免切换语言后缓存失效。自定义肖像如果序列化体积过大，会跳过图片缓存但保留预设和素材选择。此切片不读取旧 `iconComposer.ui.config.v1`，旧配置和旧 JSON 兼容仍需后续 adapter 单独迁移。

2026-07-04 已完成第二十段当前组合便签功能骨架：新增 `NSPlateSelectionNote.vue`，在画布区显示可折叠的当前素材组合清单；默认收起为一个小像素图标，已有选择时显示 `图标 + 进度`，点击清单项会切换到对应肖像/铭牌 tab，并展开、滚动到右侧素材分组。视觉已在后续切片接入公共 `AppNotebookList` 记事本式列表，避免继续使用临时软卡片样式。

2026-07-04 已完成第二十一段 NSPlate 耦合治理：`NSPlateLayeredExportPayload` 等导出契约类型移动到 `src/lib/plate/types.ts`，避免 API service 依赖浏览器 ZIP 实现；新增 `useNSPlateCanvasExport.ts`，把 PNG/JPG/分层 ZIP 导出编排、错误文案和旧后端 fallback 从 `NSPlateCanvasArea.vue` 抽出；`render.ts` 新增 `getNameplateRenderSegments()` 作为预览和分层导出的统一顺序来源，避免后续信息层、出框层级和素材层顺序出现“预览对但导出错”；素材 id 改为不依赖 API 返回顺序的稳定形式，并保留旧 index 型 id 兼容，使已有 V2 draft 可在素材加载后自动归一。

2026-07-04 已完成第二十二段前端 ZIP 封装拆分：新增 `src/lib/plate/zipArchive.ts`，把无压缩 ZIP 的 header、central directory、CRC32 和二进制拼装从 `layeredExport.ts` 拆出为纯工具函数；`layeredExport.ts` 只保留 NSPlate 业务语义，包括图层收集、图层贴到完整铭牌画布和调用 ZIP 工具。此切片不改变 ZIP 条目命名、图层顺序、前端优先/后端 fallback 策略或导出 UI。

2026-07-04 已完成第二十三段当前组合便签逻辑拆分：新增 `useNSPlateSelectionNote.ts`，把当前组合便签的条目 view-model、未选择文案 fallback、点击便签后切换 `肖像/铭牌` tab 并请求右侧素材分组聚焦的逻辑从 `NSPlateWorkspace.vue` 拆出。`NSPlateWorkspace.vue` 继续只负责工作台布局、数据源接线和清空动作。此切片不改变便签 UI、折叠行为、素材选择或画布渲染。

2026-07-04 已完成第二十四段裁切弹窗交互逻辑拆分：新增 `useNSPlateCropInteraction.ts`，把裁切弹窗的本地裁切状态副本、预览 canvas ref、缩放/分界线滑块、滚轮缩放、图片拖拽、出框分界线拖拽和模式切换逻辑从 `NSPlateCropDialog.vue` 拆出。`NSPlateCropDialog.vue` 继续负责弹窗 UI、文案、本地化、确认和取消事件；`src/lib/plate/customPortrait.ts` 继续负责裁切算法和预览绘制。此切片不改变裁切结果、出框预览、样式或父级上传流程。

2026-07-04 已完成第二十五段旧配置导入兼容切片：新增 `src/lib/plate/legacyConfig.ts`，支持读取旧 `NSPortable` 完整 JSON 和 `IC1?` 紧凑参数串，并只把当前 V2 已迁移字段转成 `nsplate.draft.v1` 对应状态：肖像/铭牌预设、系统素材系列选择和旧标准自定义肖像。`NSPlateCanvasActions.vue` 在画布下方操作条接入“导入配置”文件入口；`NSPlateWorkspace.vue` 负责把导入结果写入当前草稿和当前 tab。此切片不会导入信息层、PSD/JSX 相关配置、旧主题、视口缩放或未迁移字段；缺失素材和信息层会被跳过并提示为部分导入。

2026-07-04 已完成第二十六段信息层模型前置切片：新增 `src/lib/plate/infoLayers.ts` 和 `NSPlateInfoPanel.vue`，把 `国际服`、`国服`、`幻海流` 信息预设的固定字段定义转成 V2 草稿模型，并在信息 tab 中提供预设切换、图层启用状态和文字字段内容编辑。信息字段标题继续来自 `infoLayerFields.ts` 的稳定 `slotId + labelKey`，旧配置里的 `layer.name` 不允许覆盖 V2 固定显示标题；`useNSPlateDraftPersistence.ts` 开始把 `infoDraft` 写入 `nsplate.draft.v1`，旧缓存缺少该字段时自动补默认信息草稿。信息字段卡片使用与素材系列相近的可展开/收起条目结构，文字层展开后显示 textarea，收起后只保留字段标题和内容摘要。此切片不迁移信息层 Canvas 渲染、图标/队徽/固定层/多选 bar 的素材选择、旧信息层配置导入或导出图层收集。

2026-07-04 已完成第二十七段信息文字层渲染最小闭环：新增 `src/lib/plate/infoLayerRenderDefinitions.ts` 和 `src/lib/plate/infoLayerTextRenderer.ts`，把旧 `NSPortable` 的 `INFO_PRESET_DEFINITIONS` 中三套信息预设的文字层坐标、左右侧 `positionBySide`、字号、行高、缩放、对齐、描边和灰色投影接入 V2 canvas 渲染计划。`NSPlateCanvasArea.vue` 现在会把 `infoDraft` 传入 `createNameplateRenderPlan()`，编辑信息 tab 的文字后会刷新预览和扁平 PNG/JPG 导出；分层 ZIP 暂时把已渲染的信息文字合成到一个透明 `信息文字` 图层，避免导出漏掉文字或渲染段崩溃。此切片只迁移文字层，不迁移信息图标、队徽、固定图、多选 bar、旧字体资产、内联小图标、旧信息层配置导入和每个字段独立分层导出。

2026-07-04 已完成第二十八段信息图标/固定图渲染最小闭环：`infoLayerRenderDefinitions.ts` 继续以旧 `NSPortable` 的 `INFO_PRESET_DEFINITIONS` 为唯一坐标来源，补入 `国际服`、`国服`、`幻海流` 中已确认的 `icon` 和 `fixed` 图片层定义，包括 `positionBySide`、`sourceCat/itemId/itemIds`、`targetSize/scale`、`width/height` 和 `opacity`。`NSPlateCanvasArea.vue` 通过已有 `/api/plate/files` 归一后的 `assetGroups` 解析职业图标、军衔图标、装饰图标和活动图标素材，不在渲染器里额外请求接口；固定图使用旧 `/img/ui/sprites/*` 路径。新增 `infoLayerImageRenderer.ts` 负责 Canvas 绘制，`layeredExport.ts` 会把信息图标/固定图作为独立 `info` 图层写入分层 ZIP。当前为保守迁移：没有新增图标选择 UI；信息层 state 中未填写 `itemId/path` 时使用旧预设默认值，用户可通过禁用该层隐藏；活动图标无默认选择所以默认不渲染。此切片不迁移 `special` 队徽、`bar48` 作息条、图标素材选择控件、旧信息层配置导入、逐文字字段独立 ZIP、旧字体资产和内联小图标。

2026-07-04 已完成第二十九段 `bar48` 作息条渲染最小闭环：`infoLayerRenderDefinitions.ts` 在 `国际服`、`国服` 的共享信息预设中补入旧 `bar-1` 定义，坐标、左右侧位置、24 列、`20×44` 格子、`4px` 间距、`11px` 中缝以及 `ui/sprites/CharacterCard_3.png` / `CharacterCard_4.png` 均来自旧 `INFO_PRESET_DEFINITIONS` 和旧渲染器。`infoLayerImageRenderer.ts` 按旧逻辑绘制 48 个空格子，并在 state 为 `1` 时叠加填充格，保留旧默认素材组合的 `-1px` 填充偏移；`layeredExport.ts` 会把作息条作为独立 `info` 图层写入分层 ZIP。此切片只接通已存在的 `bar48` 草稿状态和默认全空渲染，不新增作息格子编辑 UI，不迁移 `special` 队徽，不迁移旧信息层配置导入中的 bar 参数扩展字段。

2026-07-04 已完成第三十段 `special` 队徽渲染最小闭环：`infoLayerRenderDefinitions.ts` 在 `国际服`、`国服` 的共享信息预设中补入旧 `special-1` 定义，V2 正式显示名为“部队队徽”，旧配置兼容名为 `bd队徽`；默认 symbol 为 `091000_hr1.png`，背景和遮罩默认为空，坐标、左右侧位置、`80×80` 固定尺寸、缩放和默认遮罩颜色均来自旧 `INFO_PRESET_DEFINITIONS`。`infoLayerImageRenderer.ts` 按旧逻辑绘制队徽：有背景时先画背景，背景和遮罩同时存在时执行旧遮罩调色算法，最后绘制 symbol；`layeredExport.ts` 会把队徽作为独立 `info` 图层写入分层 ZIP。此切片只接通已存在的 `special` 草稿状态和默认队徽渲染，不新增队徽三类素材选择 UI，不迁移旧信息层配置导入中的队徽参数。

2026-07-04 已完成第三十一段 `bar48` 作息条编辑最小闭环：`infoLayers.ts` 增加单格切换和全空/全亮状态更新函数，`NSPlateInfoPanel.vue` 在 `bar-1` 展开后显示 48 格作息条选择网格，状态会直接驱动当前 Canvas 预览和分层 ZIP 中的独立 `info` 图层。此切片只迁移旧 `toggleInfoBar48Cell()` / `setInfoBar48All()` 的用户编辑能力，不开放旧版 X/Y、单格尺寸、间距和透明度参数；这些参数继续以旧 `INFO_PRESET_DEFINITIONS` 为固定渲染契约，避免用户编辑坐标导致旧项目对齐回归。

2026-07-04 已完成第三十二段 `special-1` 部队队徽素材选择最小闭环：`infoLayers.ts` 增加队徽背景、上色蒙版和寓意物素材更新函数；`NSPlateWorkspace.vue` 把旧 `/api/plate/files` 归一后的 `assetGroups` 传给 `NSPlateInfoPanel.vue`；信息 tab 中的“部队队徽”展开后提供“寓意背景 / 上色蒙版 / 寓意物”三组素材选择，背景和蒙版可清空，寓意物保持必选并沿用默认 `091000_hr1.png` fallback。注意：UI 显示名不带“国际服”前缀，但内部素材分类仍使用旧服务返回的 `国际服寓意背景`、`国际服上色蒙版`、`国际服寓意物` 作为匹配键。此切片只迁移旧 `setInfoSpecialLayerMaterial()` 的用户素材选择能力，不开放旧版 X/Y、尺寸、缩放、透明度和颜色参数；这些参数继续以旧 `INFO_PRESET_DEFINITIONS` 和当前渲染定义为固定契约，也不迁移旧信息层配置导入中的队徽参数。

2026-07-04 已完成第三十三段 `icon` 图标素材选择最小闭环：`infoLayers.ts` 增加普通图标单选和活动图标多选状态更新函数，活动图标沿用旧 `INFO_ACTIVITY_ICON_MAX_COUNT = 6` 上限并同步维护 `itemId` 为第一个选中项；`infoLayerRenderDefinitions.ts` 显式导出活动图标分类常量并让渲染截断引用同一上限；`NSPlateInfoPanel.vue` 中 `icon` 信息层可展开并通过当前信息预设的 `sourceCat` 读取对应素材组，普通图标单选，活动图标多选且支持再次点击取消。职业图标等信息图标素材卡优先使用原图，避免旧服务缺少 `/img-preview/256/ui/sprites/class/*` 预览图时缩略图空白。此切片只迁移旧 `setInfoIconLayerMaterial()` / `toggleInfoIconLayerMaterial()` 的素材选择能力，不开放旧版 X/Y、尺寸、缩放、透明度和素材分类切换；坐标与渲染参数继续以旧 `INFO_PRESET_DEFINITIONS` 和当前渲染定义为固定契约。

当前 V2 代码结构：

```text
src/lib/plate/
├── canvasRenderer.ts
├── customPortrait.ts
├── draft.ts
├── exportCanvas.ts
├── infoLayerFields.ts
├── infoLayers.ts
├── legacyConfig.ts
├── layeredExport.ts
├── render.ts
├── types.ts
└── zipArchive.ts

src/pages/plate/
├── NSPlatePage.vue
├── services/
│   ├── nsplateAdapters.ts
│   └── nsplateApi.ts
├── composables/
│   ├── useNSPlateCanvasFrame.ts
│   ├── useNSPlateData.ts
│   ├── useNSPlateDraftPersistence.ts
│   ├── useNSPlateCanvasExport.ts
│   ├── useNSPlateSelectionNote.ts
│   ├── useNSPlateCropInteraction.ts
│   └── useNSPlatePanelResize.ts
└── components/
    ├── NSPlatePanel.vue
    ├── NSPlateChoiceButton.vue
    ├── NSPlateWorkspace.vue
    ├── NSPlateAssetCard.vue
    ├── NSPlateAssetSection.vue
    ├── NSPlateCanvasArea.vue
    ├── NSPlateCanvasActions.vue
    ├── NSPlateConfigPanel.vue
    ├── NSPlateInfoPanel.vue
    ├── NSPlateResizeHandle.vue
    ├── NSPlatePortraitUpload.vue
    ├── NSPlatePresetPanel.vue
    ├── NSPlateAssetPanel.vue
    └── NSPlatePreviewShell.vue
```

本切片边界：

- `NSPlatePage.vue` 继续复用 `FfxivToolShell`，只通过 workspace slot 接入 NSPlate 私有工作区。
- `NSPlatePage.vue` 使用 `FfxivToolShell` 的 `workspace` 模式；该模式用于真实工具工作台，隐藏占位页的大 hero、左侧 API 说明卡以及内部标题/API 状态条。正式工具页由顶部菜单承担站点和工具导航，顶部菜单下方直接进入全屏工具工作台，不再用外层卡片/面板包住工作区；`ToolApiStatus` 只保留给占位页或调试界面使用。
- 当前 `NSPlateWorkspace.vue` 是干净的迁移工作台骨架，还不是最终 `FFXIV` 工具页统一骨架。后续整理 `#/ffxiv/glamour` 和 `#/ffxiv/plate` 共享工作台时，应把通用预览区、配置区、tab 容器上移到 `src/pages/ffxiv/components/`，让 NSPlate 只提供业务 slot。
- `services/nsplateApi.ts` 负责调用 `/api/plate/presets`、`/api/plate/files`；`services/nsplateAdapters.ts` 负责把旧接口返回归一成 V2 展示模型。
- 素材 URL 由 adapter 根据 `_meta.imgBase`、`_meta.previewImgBase` 生成；兼容旧服务可能返回的 `/portable/img`、`/portable/img-preview/256` 前缀，组件不硬编码 `localhost`、端口或旧挂载前缀。素材 id 不应依赖接口数组顺序；如需兼容旧 V2 草稿，可通过 `legacyIds` 在加载后归一到稳定 id。
- `useNSPlateData.ts` 只负责请求生命周期、错误状态、当前选中预设和素材。
- `useNSPlateCanvasExport.ts` 负责当前前端导出编排：浏览器端 PNG/JPG、浏览器端分层 ZIP、旧后端 ZIP fallback 和导出错误格式化。`NSPlateCanvasArea.vue` 不直接承担 API fallback 或 ZIP 生成细节。
- `src/lib/plate/zipArchive.ts` 只负责浏览器端无压缩 ZIP 二进制封装；它不读取 NSPlate 图层模型、不访问 DOM、不决定导出文件名或 fallback 策略。
- `src/lib/plate/render.ts` 的 `getNameplateRenderSegments()` 是铭牌预览和分层导出的统一图层顺序来源；新增信息层、出框层级锚点或素材层时必须先改这里，再让 renderer/export 消费同一顺序。
- `src/lib/plate/infoLayerFields.ts` 负责维护旧 `国际服`、`国服`、`幻海流` 信息预设的固定字段定义，包括 `slotId`、旧字段名、V2 本地化 key、fallback 标题和游戏术语确认状态。
- `src/lib/plate/infoLayers.ts` 负责信息层 V2 草稿模型、默认值、归一化、预设切换和字段内容更新；它只处理与 Vue 解耦的状态，不访问 DOM、不做 Canvas 渲染、不读取旧 localStorage。
- `src/lib/plate/infoLayerRenderDefinitions.ts` 负责旧 `INFO_PRESET_DEFINITIONS` 中已迁移文字层的渲染契约数据；坐标、左右侧位置、字号、行高、缩放、对齐等字段必须逐项来源于旧项目，不允许在 V2 中按视觉重新推导。
- `src/lib/plate/infoLayerTextRenderer.ts` 负责信息文字层的 Canvas 绘制。当前只覆盖文字层最小闭环；旧字体资产、内联小图标、图标/队徽/固定图/bar48 和更完整的 OpenType 特性后续单独迁移。
- 信息层字段可以进入 `NSPlateInfoPanel.vue` 正式 UI，但标题必须来自固定字段定义和本地化 key。旧配置里的 `layer.name` 只可作为兼容输入线索，不能覆盖 V2 固定显示字段名。
- `src/lib/plate/legacyConfig.ts` 负责旧 `NSPortable` 配置导入适配。它可以解析旧完整 JSON 和 `IC1?` 紧凑参数串，但只输出 V2 当前已迁移的 draft 字段；信息层、旧主题、视口缩放、PSD/JSX 导出配置和其他未迁移字段必须继续留在后续切片处理，不直接污染当前工作台状态。
- `NSPlatePanel.vue` 是 NSPlate 私有面板壳，承接右侧面板中“面板容器 + 标题 + 数量/状态”的重复样式；暂不提升到全站公共组件，等 NSGlamour 等工具页确实复用同类结构后再评估上移。
- `NSPlateChoiceButton.vue` 是 NSPlate 私有可选项按钮，承接预设列表和素材 scope tab 的基础按钮壳、active 色和 label/meta 排版；素材缩略图卡、字段行和右侧 tab 暂时不纳入，避免过度抽象。
- `NSPlateCanvasArea.vue` 当前负责预览外壳、真实 canvas DOM 挂载和渲染生命周期；可用尺寸测量和 frame style 来自 `useNSPlateCanvasFrame.ts`，画布尺寸、坐标和渲染计划来自 `src/lib/plate/render.ts`，实际绘制流程来自 `src/lib/plate/canvasRenderer.ts`。该组件仍不承接裁切弹窗、信息层、导出 payload 或缩放拖拽视口。
- `useNSPlateSelectionNote.ts` 负责当前组合便签的数据条目和点击聚焦逻辑；`NSPlateWorkspace.vue` 不直接拼装便签 view-model，也不直接维护右侧素材分组聚焦 request id。
- `useNSPlateCropInteraction.ts` 负责裁切弹窗交互状态，包括本地裁切副本、canvas 预览刷新、滑块、滚轮、拖拽取景、出框分界线拖拽和模式切换；`NSPlateCropDialog.vue` 不直接维护这些 DOM 交互细节，`customPortrait.ts` 不承担 Vue 状态。
- `NSPlatePortraitUpload.vue` 当前只负责选择图片、展示已选文件和上报错误；文件读取、`512×840` 居中裁切和数据图生成来自 `src/lib/plate/customPortrait.ts`。它不直接做旧版裁切弹窗、拖拽取景、配置兼容或导出数据收集。
- `NSPlatePreviewShell.vue` 当前只作为旧文件名兼容包装，后续新代码应直接使用 `NSPlateCanvasArea.vue`。
- `NSPlateConfigPanel.vue` 承接右侧三 tab、滚动容器和配置面板边界；不包含具体预设、素材或信息层业务。
- `NSPlateResizeHandle.vue` 和 `useNSPlatePanelResize.ts` 承接桌面端配置面板宽度调整，默认宽度 `420px`、最小宽度 `320px`、最大宽度 `52vw`，并写入 V2 私有键 `nsplate.configPanelWidthPx.v1`。
- `useNSPlateDraftPersistence.ts` 负责 V2 当前草稿缓存，键名为 `nsplate.draft.v1`；它缓存已迁移的预设、素材选择、自定义肖像和信息层草稿，不读取旧 `iconComposer.ui.config.v1`。
- `NSPlateInfoPanel.vue` 当前只负责信息预设选择、固定字段列表、启用状态和文字字段内容编辑；非文字字段只建立状态入口，不迁移图标素材、队徽、固定图或多选 bar 控件。
- 组件只展示真实预设、素材、自定义肖像入口、信息字段草稿、清空当前页面草稿的轻量操作和基础预览壳，不把迁移统计、旧字段盘点或旧 JSON 内部结构暴露为正式 UI。
- 右侧面板不得默认展示聚合数量、接口统计、缺失图层提示、旧字段盘点和废弃信息层；这些内容如需保留，只能进入隐藏调试区或文档样本。
- 当前已发现迁移校验样本：预设 `以太空间` 声明 `肖像装饰框 #191001`、`肖像装饰物 #192001`，但当前 `/api/plate/files` 对应分类从 `191002`、`192002` 开始，V2 会在图层草稿里标记为缺失，后续需要核对旧数据、素材缺号规则或预设 fallback。

本切片已验证：

- 阶段 B 外壳拆分后，`npm run build` 通过。
- 阶段 B 外壳拆分后，V2 dev 页面 `http://127.0.0.1:5175/#/ffxiv/plate` HTTP 200；`/api/plate/presets` 返回 `banner=421`、`charcard=143`；`/api/plate/files` 返回 `portrait`、`nameplate`、`_meta`。
- Playwright 验证 `#/ffxiv/plate`：桌面和移动端均只显示干净预览区、配置区和 tab 容器；桌面右侧面板可拖拽调整宽度，`肖像/铭牌/信息` tab 可切换；移动端右侧面板转为下方满宽布局且无横向溢出。旧字段、缺失图层提示和图层匹配统计未出现在正式 UI。

仍未迁移：

- 完整 Canvas 视口交互、hover overlay、缩放控件和信息层导出级图层数据收集。
- 自定义肖像出框式透明 PNG 模式的 PSD/JSX 分层导出、旧配置读取、旧 JSON 导入兼容和导出 payload。
- 出框角色层的用户可选层级锚点暂缓实现；待导出、信息层和旧配置兼容统一图层计划后再评估。
- 信息图层的 Canvas 渲染、字体参数、图标选择、队徽、固定层、多选 bar、旧配置读取和导出图层收集。
- PSD、JSX 导出；分层 ZIP 当前仅覆盖已迁移的系统素材层和自定义肖像层，尚未包含信息层和旧配置 JSON。当前 ZIP 优先使用 V2 前端无压缩打包器，旧后端导出接口只作为 fallback。
- 旧 `NSPortable` 导出 API 如果启用 token，开发环境需要让 Vite 进程设置 `ICON_COMPOSER_API_TOKEN` 或 `NSPLATE_EXPORT_API_TOKEN`；生产反代也必须在服务端注入等价 header，不能把 token 暴露给浏览器。
- 旧用户配置自动迁移、本地旧键 `iconComposer.ui.config.v1` 读取、信息层旧配置迁移和完整配置导出。
- 完整多语言 UI 文案加载。
- 右侧面板内部 select、素材缩略图卡、字段行、右侧 tab 等仍有页面私有样式重复和硬编码文案，后续需要继续按“出现第三次再抽象”的规则整理。
- 当前组合清单已迁到画布区便签骨架；右侧素材分组标题后续应继续轻量化，正式像素记事本视觉和完整清单信息密度待 Style Lab 定稿后再接入。
- 当前信息层字段盘点包含旧 `NSPortable` 的历史/布局字段，例如旧 `bd队徽`、`bd名称`、`作息选择`、`活动图标` 等；这些字段可以作为契约样本和定义表保留。正式 UI 显示时必须走固定本地化标题，其中 `special-1` 正式显示为“部队队徽”，`text-7` 正式显示为“部队名称”，后续还需要确认哪些字段是真正需要完整编辑和渲染的功能。

## 定位

`#/ffxiv/plate` 是 FFXIV 铭牌/肖像相关编辑器模块，模块名统一为 `NSPlate`，目标是承接旧 `NSPortable` 的核心能力。

本模块不要求机械迁移旧前端代码。优先按 V2 的 Vue、公共组件、公共 CSS、API 边界和安全规则重新整理前端；后端也可以按新规则重写，但旧 `NSPortable` 行为必须先被抽取为契约和回归样本。

核心目标：

1. 保留旧项目已验证的 Canvas 合成、素材选择、图层编辑和导出能力。
2. 使用 V2 统一路由和工具页外壳。
3. 通过 `/api/plate`、`/img`、`/img-preview` 稳定接入素材和导出服务。
4. 多语言 UI、预设、信息图层和用户配置能平稳迁移。

## 旧 UI 分布契约

2026-07-03 已用旧服务 `http://127.0.0.1:3456/portable/` 和 V2 `http://127.0.0.1:5175/#/ffxiv/plate` 做过桌面视口截图核对。旧 `NSPortable` 的正式工作台不是卡片页或营销页，而是高密度双栏编辑器。V2 后续迁移应优先还原这个信息架构，再套入新公共组件和像素风视觉变量。

旧桌面布局要点：

- 顶部是约 `37px` 高的细 header：左侧为 `铭牌工房` 标题，右侧为语言、明暗模式、设置、导出按钮。
- 主体是左右双栏：左侧为画布工作区，右侧为配置面板，中间有 `10px` 左右的可拖拽宽度调整柄。
- 在 `1440×1000` 视口下，旧右侧配置面板约 `420px`，左侧画布区约 `1010px`，配置面板宽度会写入 `iconComposer.configPanelWidthPx.v1`。
- 左侧画布区负责预览、拖拽/缩放、底部缩放控件、清空按钮和选中图层状态；即使没有选择素材，也允许空画布存在。
- 右侧配置面板固定为三 tab：`肖像`、`铭牌`、`信息`。tab 是主工作流分区，不是导航到新页面。
- `肖像` tab 包含肖像预设切换、自定义肖像图片上传/裁切、肖像素材分组折叠。
- `铭牌` tab 包含肖像左右位置切换、铭牌预设切换、铭牌素材分组折叠。
- `信息` tab 包含信息预设、加载本机字体、显示/隐藏全部信息、重置预设值，以及信息图层卡片列表。
- 设置菜单和导出菜单是 header 右上角浮层，不是页面主体内容；V2 可以用 `AppPixelWindow` 或同类弹窗承载，但入口仍应保持轻量。
- 移动端旧布局变为上下结构：画布区在上方约半屏，配置面板在下方滚动；右侧 resize handle 在移动端隐藏。

旧 UI 的还原边界：

- V2 可以使用统一像素风公共组件，但不应把 `NSPlate` 工作台改成首页式视觉舞台。
- 当前 V2 的 `NSPlatePreviewShell` 只能视为临时预览壳，不等于旧版画布工作区。
- 当前 V2 的右侧面板可以继续保留 tab，但应逐步靠近旧版“预设行 + 分组折叠 + 缩略图选择”的操作密度。
- 迁移辅助信息、接口统计、缺失素材调试信息不能默认进入正式工作台。

## 旧功能地图

旧 `NSPortable` 前端入口和资源组织：

| 旧文件                                                                         | 主要职责                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `../NSPortable/src/client/index.html`                                          | 全局 overlay、裁切弹窗、关于弹窗、header、画布区、右侧 tab 面板和脚本加载顺序         |
| `../NSPortable/src/client/styles/main.css`                                     | 旧工作台全部布局和控件样式，包括双栏、resize、tab、分组、缩略图、信息图层、移动端布局 |
| `../NSPortable/src/client/scripts/state/store.js`                              | 旧全局状态、初始化、API 拉取、多语言图层名、预设 select 初始化                        |
| `../NSPortable/src/client/scripts/state/persistence.js`                        | 旧 localStorage、配置导入导出、剪贴板/JSON 读写、旧配置归一                           |
| `../NSPortable/src/client/scripts/render/section-panel.js`                     | 右侧素材分组、缩略图选择、tab 切换、面板宽度拖拽、清空                                |
| `../NSPortable/src/client/scripts/render/canvas-core.js`                       | 主 canvas 渲染、状态栏、系统层/自定义层/分层导出数据收集                              |
| `../NSPortable/src/client/scripts/render/portrait-renderer.js`                 | 肖像画布渲染                                                                          |
| `../NSPortable/src/client/scripts/render/nameplate-renderer.js`                | 铭牌画布渲染                                                                          |
| `../NSPortable/src/client/scripts/render/image-loader.js`                      | 素材图片加载和缓存                                                                    |
| `../NSPortable/src/client/scripts/render/viewport-transform.js`                | 缩放、居中、菜单开关、关于弹窗、窗口 resize 响应                                      |
| `../NSPortable/src/client/scripts/features/presets/*.js`                       | 肖像/铭牌预设应用、信息预设、肖像左右位置同步                                         |
| `../NSPortable/src/client/scripts/features/custom-portrait/custom-portrait.js` | 自定义肖像上传、裁切、缩放和清除                                                      |
| `../NSPortable/src/client/scripts/features/info-layers/*.js`                   | 信息层模型、面板渲染、交互、Canvas 绘制、字体和图标处理                               |
| `../NSPortable/src/client/scripts/export/*.js`                                 | PNG/JPG、PSD、JSX、分层 ZIP 导出                                                      |

旧后端能力已在“旧项目契约参考”中列出。前端迁移时应把这些职责拆到 V2 的不同层，不再把初始化、状态、渲染、面板 DOM 和导出逻辑堆在单个页面组件里。

## 还原式迁移阶段

NSPlate 迁移目标不是机械复制旧原生 JS，而是在 V2 新架构下还原旧布局和旧行为。每一阶段完成后都要有旧项目对照截图或真实样本验证。

### 阶段 A：冻结旧布局和行为契约

目标：

- 固定旧版桌面和移动端布局要点。
- 记录旧 UI 的主路径：空画布、肖像 tab、铭牌 tab、信息 tab、语言菜单、设置菜单、导出菜单。
- 准备至少一组旧预设、一组素材分类、一个自定义肖像样本、一个信息预设样本和一个导出 payload。

验证：

- 旧服务可访问 `http://127.0.0.1:3456/portable/`。
- 截图或浏览器检查确认旧版 header、画布区、右侧面板、tab 和菜单状态。
- 文档中的旧行为必须能追溯到旧文件或旧服务实测，不凭记忆补。

### 阶段 B：V2 工作台外壳还原

目标：

- 把 `NSPlateWorkspace.vue` 调整为旧式双栏工作台：左画布区、右配置面板、中间 resize handle。
- 保留 V2 顶部全局 `AppTopNav`，但工具页内部不再包大卡片或说明区。
- 画布区允许空状态，不强制显示“等待数据”或假功能提示。
- 右侧配置区继续使用 `肖像 / 铭牌 / 信息` 三 tab。

建议拆分：

```text
src/pages/plate/components/
├── NSPlateWorkspace.vue
├── NSPlateCanvasArea.vue
├── NSPlateConfigPanel.vue
└── NSPlateResizeHandle.vue
```

验证：

- 桌面端第一屏结构接近旧版双栏比例。
- 移动端变为上画布、下配置。
- 不出现旧项目没有的营销卡片、迁移统计或调试字段。

当前状态：

- 已完成外壳级拆分、桌面双栏、移动上下布局和右侧面板宽度拖拽。
- 尚未迁移旧版内部 header 菜单、设置浮层、导出浮层、底部缩放控件和真实 Canvas 视口交互；这些进入后续阶段 D/G 或单独切片。

### 阶段 C：肖像和铭牌素材选择闭环

目标：

- 先还原 `肖像` 和 `铭牌` tab 的操作结构。
- 预设区域先使用旧版“上一个 / select / 下一个”的信息架构，视觉可按 V2 公共组件重做。
- 素材区域按旧分类分组折叠，显示选中状态、未选择状态、缩略图和素材名。
- 切换 tab 时只切换编辑范围，不丢失另一 tab 的选择。

建议拆分：

```text
src/pages/plate/components/
├── NSPlatePresetStepper.vue
├── NSPlateLayerSection.vue
├── NSPlateThumbnailGrid.vue
└── NSPlatePortraitSideSwitch.vue

src/pages/plate/composables/
├── usePlateAssets.ts
├── usePlatePresets.ts
└── usePlateDraft.ts
```

验证：

- `/api/plate/files`、`/api/plate/presets` 返回的数据能驱动真实分组。
- 选择肖像素材、铭牌素材后，右侧选中状态稳定。
- API adapter 仍然负责路径归一，组件不硬编码旧端口和 `/portable`。

### 阶段 D：Canvas 渲染和视口交互

目标：

- 把 canvas 合成、图层排序、坐标、缩放和 hover overlay 迁入 `src/lib/plate/`。
- Vue 组件只负责挂载 canvas、传入 draft、响应用户交互。
- 保持旧版画布尺寸和导出尺寸，不因页面 CSS 改变真实 canvas 数据。
- 恢复缩放 select、加减按钮、居中、状态栏和基础拖拽手感。

建议拆分：

```text
src/lib/plate/canvas/
├── dimensions.ts
├── viewport.ts
└── hitRegions.ts

src/lib/plate/render/
├── renderPortrait.ts
├── renderNameplate.ts
├── renderLayers.ts
└── imageCache.ts
```

验证：

- 同一旧预设在旧项目和 V2 中的图层位置、尺寸和叠放顺序一致。
- 画布缩放只影响显示，不改变导出像素。
- 空画布、仅肖像、仅铭牌、肖像+铭牌组合都可渲染。

### 阶段 E：自定义肖像和裁切弹窗

目标：

- 恢复自定义肖像上传、裁切为 `512×840`、滑块缩放、拖拽取景、确认/取消。
- 自定义肖像作为一类图层进入 canvas 合成和导出数据。
- 清空自定义图片只影响自定义图层，不清空其他素材选择。
- 在旧裁切能力基础上新增 V2 增强：出框式自定义肖像模式。第一版不做自动抠图，要求用户上传透明 PNG。
- 出框式模式使用一条可拖动的横向分界线控制同一张透明角色图的上下区域：分界线以下按肖像框裁切进入框内，分界线以上允许绘制到肖像框外。

出框式模式评估：

- 技术上可行，不需要 AI。核心是同一张透明 PNG 分两次绘制：一次 clip 到 `512×840` 肖像框内，一次只绘制分界线上方的出框区域。
- 第一版使用横向分界线，默认位于角色胸口/脖子附近，用户可上下拖动。这样身体和衣服天然留在肖像边界里，头发、帽子、武器、手势或特效可以冲出框。
- 不建议第一版做自动抠图、画笔蒙版或多边形蒙版。自动抠图涉及模型体积、性能、隐私或外部 API；画笔/多边形交互复杂，等基础模式稳定后再评估。
- 后续可增强软边缘或手动画笔蒙版，让出框边缘更自然，但不能影响标准裁切模式的旧项目兼容性。

出框式渲染顺序：

```text
铭牌底层
-> 肖像背景
-> 框内角色层：clip 到 512×840 肖像框
-> 肖像装饰框 / 肖像装饰物 / 肖像外框 / 铭牌外框
-> 出框角色层：只绘制分界线上方，不限制在肖像框内
-> 铭牌顶部/底部装饰、铭牌装饰物、信息层（后续按旧导出契约校准）
```

后续增强：出框图层层级锚点

- 用户后续可能需要决定出框角色层“压到哪里”：例如藏在肖像框后、压过肖像/铭牌框、或压到最前景。
- 不建议第一版开放任意素材层前后排序。素材缺失、预设差异、PSD/ZIP 分层导出、旧配置导入和未来信息层都会依赖同一套图层顺序，过早开放任意层级容易造成后续返工。
- 建议等 `导出 payload / PSD / ZIP`、信息层渲染和旧配置兼容迁移后，再把它做成有限枚举的“出框层级锚点”，由统一图层计划同时服务 Canvas 预览和导出。
- 后续用户询问 NSPlate 还有什么要做时，需要主动提醒此项仍是待评估增强。

第一版数据结构方向：

```ts
interface NSPlateCustomPortraitImage {
  mode: 'standard' | 'popout'
  dataUrl: string
  fileName: string
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
  splitY?: number
}
```

说明：

- `standard` 对应旧项目裁切语义，确认后输出固定 `512×840` 数据图。
- `popout` 保留透明 PNG 原图或可复算的裁切状态，渲染时按 `scale`、`offsetX`、`offsetY` 和 `splitY` 分成框内/出框两层。
- `splitY` 使用肖像坐标系，范围为 `0-840`；例如 `splitY = 260` 表示肖像坐标 260 以下进框，260 以上出框。
- 导出阶段应能把出框模式拆成两个导出图层：`框内角色层` 和 `出框角色层`，避免 PSD/ZIP 中丢失可编辑性。

建议拆分：

```text
src/pages/plate/components/
├── NSPlatePortraitUpload.vue
└── NSPlateCropDialog.vue

src/pages/plate/composables/
└── usePlateCustomPortrait.ts

src/lib/plate/
├── customPortrait.ts
└── canvasRenderer.ts
```

验证：

- 上传横图、竖图、小图、大图都能裁切。
- 裁切结果在画布和导出中一致。
- 弹窗关闭、重新上传、清空都不破坏其他草稿状态。
- 标准裁切模式继续通过旧项目对照样本；不能改变已验证的系统素材层 canvas hash。
- 出框模式上传透明 PNG 后，分界线以下内容被限制在肖像框内，分界线以上内容可以越过肖像边界。
- 出框模式切换回标准模式或清空自定义图时，不影响预设、素材和信息层草稿。

### 阶段 F：信息图层正式迁移

目标：

- 信息 tab 独立成为 `NSPlateInfoPanel`，不要塞进主工作台组件。
- 固定字段名和本地化策略继续遵守“信息图层迁移规则”。
- 信息层坐标必须与旧 `NSPortable` 完全一致；V2 不重新调坐标、不做近似摆放。
- 迁移文本层、图标层、特殊层、固定层、多选 bar 的状态模型和渲染逻辑。
- 恢复信息预设、显示/隐藏全部、重置、字体加载和每张信息层卡片展开。

建议拆分：

```text
src/pages/plate/components/info/
├── NSPlateInfoPanel.vue
├── NSPlateInfoPresetBar.vue
├── NSPlateInfoLayerCard.vue
├── NSPlateInfoTextControls.vue
├── NSPlateInfoIconControls.vue
└── NSPlateInfoBar48Controls.vue

src/lib/plate/info-layers/
├── definitions.ts
├── normalize.ts
├── renderText.ts
├── renderIcons.ts
└── renderSpecial.ts
```

验证：

- `国际服`、`国服`、`幻海流` 三套信息预设各有一组对照样本。
- 每个信息图层的 `x`、`y`、`positionBySide.right/left`、尺寸、缩放和锚点必须逐项对照旧 `INFO_PRESET_DEFINITIONS`，不得用肉眼微调代替旧坐标。
- 旧配置中的 `layer.name` 不覆盖 V2 固定字段显示名。
- 字体、描边、阴影、图标、多选 bar 的渲染与旧项目对齐。

### 阶段 G：导出、配置和旧数据兼容

目标：

- 恢复 PNG/JPG、分层 ZIP、PSD、JSX 导出入口。
- 恢复导出 `200%` 选项。
- 恢复配置导出到剪贴板、导出 JSON、从剪贴板导入、从 JSON 导入。
- 旧 localStorage 和旧 JSON 配置通过兼容 adapter 转成 V2 draft，不直接污染 V2 状态结构。

建议拆分：

```text
src/pages/plate/composables/
├── usePlateExport.ts
└── usePlateConfigTransfer.ts

src/lib/plate/export/
├── collectLayers.ts
├── exportCanvas.ts
├── exportZipPayload.ts
└── normalizeLegacyConfig.ts
```

验证：

- PNG/JPG 在浏览器端导出结果正确。
- ZIP/PSD/JSX 继续走 `/api/plate/export-*`，并保留 payload 大小、图层数量、像素总量限制。
- 旧 JSON 配置可以导入；无法兼容的字段必须给出可理解的错误或忽略策略。

### 阶段 H：新后端重写

目标：

- 在前端契约稳定后，再决定是否重写 `NSPlate` 后端。
- 新后端不必复制旧目录结构，但必须保持 `/api/plate/*`、`/img/*`、`/img-preview/*` 的对外契约或提供兼容层。
- 导出、图片预览、素材白名单和错误处理必须不低于旧服务安全边界。

验证：

- 新后端与旧后端对同一组 API 样本返回等价结构。
- 同一导出 payload 结果可用且图层数量、尺寸、文件名规则符合预期。
- 生产代理 rewrite 不需要前端页面改代码。

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
../NSPortable/src/server/routes/api-routes.js
../NSPortable/src/server/routes/image-routes.js
```

已确认旧接口：

| 旧接口                         | V2 目标路径                          | 用途                         |
| ------------------------------ | ------------------------------------ | ---------------------------- |
| `GET /api/metrics`             | `GET /api/plate/metrics`             | 指标接口，可能受 secret 保护 |
| `GET /api/files`               | `GET /api/plate/files`               | 素材列表和图片 base 信息     |
| `GET /api/presets`             | `GET /api/plate/presets`             | 肖像/铭牌预设                |
| `POST /api/export-psd`         | `POST /api/plate/export-psd`         | 服务端 PSD 导出              |
| `POST /api/export-psd-jsx`     | `POST /api/plate/export-psd-jsx`     | JSX 导出，可能被服务端禁用   |
| `POST /api/export-layered-zip` | `POST /api/plate/export-layered-zip` | 分层 ZIP 导出                |
| `GET /img/*`                   | `GET /img/*`                         | 游戏素材原图                 |
| `GET /img-preview/*`           | `GET /img-preview/*`                 | 游戏素材预览图               |

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

## 信息图层迁移规则

旧 `NSPortable` 的信息页位于右侧面板 `信息` tab，旧代码允许用户编辑每张信息图层卡片头部的 `layer.name`。V2 迁移时不要保留这个行为：信息图层的标题/字段名应是固定 UI 文案，用户只编辑实际内容、素材选择和样式参数。

已确认旧代码位置：

```text
../NSPortable/src/client/scripts/00-paths-and-constants.js
../NSPortable/src/client/scripts/features/info-layers/panel-render.js
../NSPortable/src/client/scripts/features/info-layers/panel-actions.js
../NSPortable/src/client/scripts/features/info-layers/model.js
```

旧 `panel-render.js` 中 `info-layer-name` 是 `<input>`，并通过 `updateInfoLayerName()` 写回 `layer.name`；V2 应改为只读标题显示，不提供改名输入框。导入旧配置时，如果配置里带有历史 `name`，只可作为兼容信息读取，不能覆盖 V2 的固定显示字段名。

字段名规则：

1. 每个信息层槽位使用稳定 `slotId` / `fieldKey` 识别，例如 `text-1`、`icon-1`、`special-1`、`bar-1`。
2. UI 展示标题通过本地化 key 生成，例如 `plate.info.field.characterName`，不直接使用旧配置里的 `name`。
3. 能对应游戏内角色资料、铭牌或肖像字段的标题，优先使用游戏客户端术语和多语言数据；不要用 AI 自拟文案代替游戏字段名。
4. 无法确认是游戏术语的旧标题，先标记为迁移布局字段，仍然固定并本地化，但不要宣称来自游戏字段。
5. 信息预设名也应本地化显示；旧内部名可作为 preset id 或兼容 key，不作为唯一用户可见文案来源。

坐标规则：

1. 信息层渲染坐标必须以旧 `../NSPortable/src/client/scripts/00-paths-and-constants.js` 中的 `INFO_PRESET_DEFINITIONS` 为唯一来源，优先读取每层的 `x`、`y`、`positionBySide.right`、`positionBySide.left`、`width`、`height`、`scale`、`targetSize` 等旧字段。
2. V2 内部继续使用旧项目的 `2560×1440` 铭牌画布坐标系和 `512×840` 肖像画布坐标系；页面响应式只能缩放最终 canvas 显示尺寸，不能改变实际绘制坐标。
3. 旧项目区分左右肖像侧时，V2 必须使用旧 `positionBySide` 对应坐标，不允许把 right 坐标平移推导成 left 坐标。
4. 信息层文字、图标、队徽、固定图、多选 bar 的默认坐标、尺寸、行高、缩放、透明度和跟随关系都属于旧项目契约；迁移时只能做字段归一和类型补全，不能重新设计位置。
5. 如果旧坐标看起来“不居中”或“不符合 V2 视觉”，仍以旧项目输出为准；除非用户明确要求校准新版布局，否则不得调整。

旧预设字段盘点：

| 旧预设                       | 旧字段名                                                                     | 迁移判断                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `国际服` / `国服`            | `称号`、`角色名`、`服务器`、`等级`、`职业名`、`军衔`、`军衔名称`、`个性签名` | 优先按游戏内角色资料/铭牌字段建立本地化 key，并核对各语言游戏术语。                 |
| `国际服`                     | `英文职业名`                                                                 | 需要确认是否是国际服 UI 字段还是旧模板布局字段；确认前不可随意改名。                |
| `国际服` / `国服` / `幻海流` | `职业图标`                                                                   | 作为固定字段名和素材分类名处理，旧兼容分类 `职业图标图层组` 仍需映射到 `职业图标`。 |
| `国际服` / `国服`            | 旧 `bd队徽`（V2 显示“部队队徽”）、旧 `bd名称`（V2 显示“部队名称”）           | `special-1` 已按部队队徽固定本地化；`text-7` 已按部队名称固定本地化。               |
| `国际服` / `国服`            | `作息选择`、`时间图标`、`作息数字`、`作息文字`、`个签图标`、`活动图标`       | 更像旧信息卡布局/素材槽位，迁移时固定本地化，不让用户改标题。                       |
| `幻海流`                     | `中文标题`、`英文标题`、`文案1`、`装饰图标1`、`文案2`、`装饰图标2`           | 更像模板布局槽位，不应当作游戏术语；可在用户确认后改成固定本地化标题。              |

实现建议：

- 在 `src/lib/plate/` 或 `src/pages/plate/` 建立信息层字段定义表，集中维护 `slotId`、`type`、`legacyNames`、`labelKey`、`gameTermStatus`。
- `normalizeInfoLayers` 类逻辑迁移到 V2 时，应先按 `slotId` 匹配槽位，再把旧 `name` 只作为 legacy fallback，不进入可编辑草稿字段。
- UI 组件显示标题时调用 V2 本地化 store；如果某语言暂未接入游戏术语，回退到已确认的简体中文或旧项目 fallback。
- 真正迁移信息页前，需要把 `国际服`、`国服`、`幻海流` 三套预设各取一份真实样本，确认旧字段与 V2 固定字段定义完全对上。

## 前端状态和存储参考

旧项目重要状态键：

| 键                                                      | 用途                           |
| ------------------------------------------------------- | ------------------------------ |
| `nsplate.uiLanguage`                                    | UI 语言                        |
| `iconComposerTheme`                                     | 旧项目主题                     |
| `iconComposer.ui.config.v1`                             | 图层、预设、视图等完整 UI 状态 |
| `iconComposer.infoPreset.phantomTideDefaults.v4`        | 信息预设迁移标记               |
| `iconComposer.infoPreset.firstVisitHiddenDone.v1`       | 信息图层首次提示状态           |
| `iconComposer.configPanelWidthPx.v1`                    | 配置面板宽度                   |
| `iconComposer.infoPreset.graphicLayerRepair.v20260620a` | 图形层修复迁移标记             |

V2 不要求继续使用旧键名，但需要规划旧用户配置的读取、迁移或清理方式，避免用户一打开新页面就丢配置。

当前 V2 已新增私有草稿键 `nsplate.draft.v1`，只保存 V2 已迁移的预设、素材选择和自定义肖像状态。旧 `iconComposer.ui.config.v1` 后续应通过兼容 adapter 转换为 V2 draft，不要直接在工作台组件中读取旧结构。

## 页面拆分方向

建议 V2 前端拆分：

```text
src/pages/plate/
├── NSPlatePage.vue
├── components/
│   ├── NSPlateWorkspace.vue
│   ├── NSPlatePreviewCanvas.vue
│   ├── NSPlateAssetPicker.vue
│   ├── NSPlateLayerPanel.vue
│   ├── NSPlatePresetPanel.vue
│   ├── NSPlateInfoPanel.vue        # 待字段和术语确认后再实现
│   └── NSPlateExportPanel.vue
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
- 右侧面板中向下展开的素材系列、图层卡片或编辑选项 bar，在展开状态下应在右侧滚动容器内置顶，方便用户滚动查看内容后直接收起。
- 不把旧 `NSPortable` 的暗色编辑器样式整套复制成 V2 全站样式。
- 不把首页像素风装饰带入铭牌编辑器工作台。
- 如果 NSPlate 与 NSGlamour 都需要同类工具页外壳，应沉淀到 `src/pages/ffxiv/components/` 或公共组件。

### 当前 NSPlate 样式边界

NSPlate 已经形成一部分业务私有样式，这些样式不要求直接调用公共组件，但必须遵守 `ARCHITECTURE_PLAN.md` 的“公共组件样式契约 v0.1”中定义的基础视觉语言。

当前应保留为 NSPlate 私有样式的部分：

- `NSPlateWorkspace.vue`：工作台主布局、加载骨架和错误状态。它决定左侧画布、resize handle、右侧配置面板的空间关系，不应提升为全站布局。
- `NSPlateConfigPanel.vue`：右侧三 tab、滚动容器和配置面板宽度边界。它可以使用公共 `AppTabs`，但滚动区域、面板宽度和 sticky 行为属于 NSPlate。
- `NSPlateCanvasArea.vue`：画布背景、棋盘透明底、画布 frame、预览居中和导出错误位置。这些直接服务 Canvas 预览，不应被公共面板样式覆盖。
- `NSPlateCanvasActions.vue`：画布下方导出/清空操作条。它是工房画布操作条，不等同于通用 `AppToolbar`；后续如果 NSGlamour 出现同类画布操作条，再评估抽到 FFXIV 工具公共层。
- `NSPlatePanel.vue`：右侧面板内部的小标题壳。它只解决 NSPlate 配置区内标题、meta 和堆叠间距，暂不提升为 `AppPanel`。
- `NSPlateChoiceButton.vue`：NSPlate 私有选择按钮，用于预设列表、scope tab 等轻量选择项；它不代表全站按钮默认样式。
- `NSPlateAssetSection.vue`：素材系列折叠区，包括展开后 header 置顶、选中素材名、箭头图标和右侧状态列。它是素材选择器信息架构的一部分。
- `NSPlateAssetCard.vue`：素材缩略图卡。为了缩略图密度和素材名可读性，可以使用 `1px` 边框、紧凑 padding、轻量 active 装饰；不要强行改成大号 `AppButton`。
- `NSPlatePortraitUpload.vue`：自定义肖像上传入口。它是“缩略图 + 文件名 + 隐藏 file input”的业务控件，可以保持私有结构。
- `NSPlateCropDialog.vue`：裁切弹窗、Canvas 取景、滑块和模式切换属于高交互业务控件；只继承公共 token，不抽为公共组件。
- `NSPlateResizeHandle.vue`：右侧面板拖拽手柄属于工作台布局交互，不进入公共按钮体系。
- `NSPlateSelectionNote.vue`：当前组合便签保留画布区定位、折叠状态和素材聚焦逻辑，但展开列表视觉使用公共 `AppNotebookList`，避免在 NSPlate 内继续维护一套重复的记事本列表样式。

当前可以直接使用或继续靠近公共组件的部分：

- 右侧主 tab 使用 `AppTabs`。
- 信息 tab 的占位状态使用 `AppStatus`。
- 未来普通按钮、通用弹窗、表单项、提示条优先使用 `AppButton`、`AppPixelWindow`、`AppField`、`AppStatus`。
- 如果新增的控件只是普通命令按钮或普通输入框，不要再写一套 NSPlate 私有按钮/输入样式。

边界判断规则：

1. 涉及 Canvas 尺寸、画布背景、素材缩略图、裁切取景、拖拽宽度、素材系列折叠、导出层级状态的样式，优先留在 NSPlate 私有组件。
2. 涉及普通按钮、普通表单、普通状态、普通弹窗、普通 tab 的样式，优先用公共组件。
3. NSPlate 内部的高密度控件可以使用 `1px` 内部分隔，但外层工作台边界、操作条、弹窗和公共控件仍应保持像素风 `2px` 边框语言。
4. 不为了“统一”牺牲素材缩略图可读性、长素材名省略、右侧面板滚动稳定性或旧项目操作路径。
5. 已确认的记事本式短文本列表优先使用公共 `AppNotebookList`；迁入具体业务组件时仍应保持原有业务逻辑、定位方式和画布区低干扰原则。

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

- 新后端技术栈：继续 Node，还是与 NSGlamour 后端统一。
- 服务端导出能力是否全部保留，尤其是 JSX 导出。
- 游戏素材是继续由后端服务，还是后续迁入静态/CDN 分发。
- 旧用户配置是否自动迁移，还是提供一次性导入。
- 第一阶段先实现素材/预设浏览，还是直接实现完整 Canvas 编辑器。
