# 物品卡片模块

## 定位与边界

- 目标路由：`#/ffxiv/item-card`。
- 页面入口：`src/pages/item-card/ItemCardPage.vue`。
- 来源功能：旧 `H:\NightingaleSilenceWeb\NSGlamour` 已删除的 `/card` 工作流，不是 `/template`。
- 恢复依据：2026 年 6 月 Codex 会话中保留的完整 `card.html`、早期完整 `card.js` 和后续代码片段。
- 迁移原则：旧 `NSGlamour` 和 V2 `src/pages/glamour/` 均保持只读，不移动、不删除、不改写其文件。
- 模块隔离：页面、组件、状态、Canvas 渲染、本地化和浏览器存储均位于 `src/pages/item-card/`。

## 当前功能

1. 固定装备槽编辑、装备搜索、替换、清空和候选切换。
2. 通过一个“导入”入口读取石之家或 Eorzea Collection 链接，或切换至 Wiki `{{物品|名称}}<br>`、`{{物品|物品ID}}<br>` 和 equipinfo `部位：装备（染剂）` 文本自动识别。
3. 染剂搜索、单染色和双染色编辑。
4. 装备名语言切换会同步切换卡片预览文字；图片设置仍可单独配置多语言 PNG 输出。
5. 字体、装备名字号、装备名字重和染剂字号统一应用到全部已选输出语言。
6. 配置字色、坐标、描边比例、描边颜色和每件物品的左右排版。
7. 生成旧版 `560 x 108` 透明物品卡，支持单张 PNG 下载。
8. 全部卡片 ZIP 导出。
9. 将全部物品合并为无标题、无分隔线的纯净连续长图；长图拥有独立的居左/居右排版和 PNG 下载控件，不受单张卡片布局影响。
10. 草稿和输出设置自动使用独立的 `nsitemcard.*` 浏览器存储；最近记录的底层兼容数据保留，但不显示为主工作流入口。
11. 每条装备行可在下方添加同部位物品；新增行拥有独立的搜索、候选、染剂和左右排版状态，导出按可见行顺序排列。
12. 提供简易版和完整版全局输出模式；完整版单语言保持 `560 x 108`，多语言时自动增高以分开名称和染剂内容，并让每个染剂色块在语言名称之间共用一次；简易版缩小图标、压缩卡片高度和长图行距、隐藏染色文本，并让物品名与图标垂直居中。模式统一作用于连续长图、单张 PNG 和 ZIP。
13. 图片设置可开启“物品名按品质着色”；开启后仅物品名使用 FFXIV 品质色，染剂文字和描边继续遵循原有设置，并统一作用于全部导出模式。
14. 本机字体加载后使用真正的下拉选择；有明确中文名称的系统字体优先显示中文并排在其他字体前面，内部仍保存原始 font family 以保证 Canvas 字体加载正确。

本模块不包含人物图片、模板选择、图片上传、图片裁剪或杂志式幻化模板。

## 目录职责

- `components/ItemCardEquipmentEditor.vue`：装备、候选和染剂编辑。
- `components/ItemCardTextImportDialog.vue`：文本语言、装备文本输入和识别状态。
- `components/ItemCardRenderSettings.vue`：文字、颜色、坐标和输出语言设置。
- `components/ItemCardCanvas.vue`：单张卡片预览和下载。
- `components/ItemCardPreview.vue`：连续列表、单张预览、ZIP 和长图导出。
- `lib/cardRenderer.ts`：与 Vue 解耦的 Canvas 渲染和 PNG 导出。
- `lib/cardSettings.ts`：设置默认值、校验和持久化。
- `lib/textImport.ts`：Wiki 物品模板预处理和重复部位文本载荷适配。
- `lib/zip.ts`：无第三方依赖的浏览器端 ZIP 生成。
- `lib/equipment.ts`、`lib/draft.ts`：装备、染剂和草稿适配。
- `services/itemCardApi.ts`：物品卡片 API 调用封装。

## 数据与 API

- 开发阶段复用旧 Flask 服务，V2 API 前缀为 `/api/glamour/*`，端口 `8765`。
- 复用后端接口契约，不引用 V2 glamour 页面的前端实现。
- 主要接口：`POST /api/glamour/import-glamour-link`、`POST /api/glamour/equipinfo/parse-text`、`GET /api/glamour/search-items`、`GET /api/glamour/stains`、`GET /api/glamour/icon/:id`。
- 上传、外部链接和后端返回均视为不可信输入。
- `slot` 继续作为后端搜索和装备规则字段；前端用稳定的 `cardRowId` 区分同部位的多条记录。

## 样式策略

- 页面遵守 `docs/ai/WORKBENCH_STYLE_CONTRACT.md`。
- 工作台业务布局和预览样式保留在 `src/pages/item-card/components/` 的 scoped style 中。
- 只复用站点公共外壳、主题变量和状态组件，不修改 glamour 页面私有样式。

## 验证

1. `npm run typecheck`。
2. `npm run check:i18n`。
3. 浏览器访问 `#/ffxiv/item-card`。
4. 验证链接导入、手动搜索、染剂编辑、语言和字体设置。
5. 验证单张 PNG、全部 ZIP 和连续长图均非空。
6. 验证同部位新增行可独立搜索、染色和排版，刷新及最近记录恢复后顺序不变。
7. 在桌面与移动视口检查布局和文字溢出。
8. 检查 `src/pages/item-card/` 与 `src/pages/glamour/` 没有相互私有引用。
