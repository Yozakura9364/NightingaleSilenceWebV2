---
summary: "独立物品卡片工作台的导入、装备编辑、渲染、存储和 API 边界。"
status: "active"
scope: "#/ffxiv/item-card 和 src/pages/item-card 私有实现。"
source_of_truth: "ItemCardPage、item-card components/locales、glamour API 契约。"
read_when: "修改物品卡片导入、编辑、排版、导出或存储。"
update_when: "用户流程、API、草稿键、渲染格式或隔离边界改变时。"
verify: "运行真实导入、编辑、单张/批量导出和响应式页面检查。"
---

# 物品卡片模块

## 定位与边界

- 目标路由：`#/ffxiv/item-card`。
- 页面入口：`src/pages/item-card/ItemCardPage.vue`。
- 来源功能：仓库同级旧 `../NSGlamour` 已删除的 `/card` 工作流，不是 `/template`。
- 恢复依据：2026 年 6 月 Codex 会话中保留的完整 `card.html`、早期完整 `card.js` 和后续代码片段。
- 迁移原则：旧 `NSGlamour` 和 V2 `src/pages/glamour/` 均保持只读，不移动、不删除、不改写其文件。
- 模块隔离：页面、组件、状态、Canvas 渲染、本地化和浏览器存储均位于 `src/pages/item-card/`。

## 当前功能

1. 左栏通过统一搜索入口追加装备或普通物品；没有固定空部位行，已选行可切换候选、编辑染色或直接删除。
2. 通过一个“导入”入口读取石之家或 Eorzea Collection 链接，或切换至 Wiki `{{物品|名称}}<br>`、`{{物品|物品ID}}<br>` 和 equipinfo `部位：装备（染剂）` 文本自动识别。
3. 染剂搜索、单染色和双染色编辑。
4. 装备名语言切换会同步切换卡片预览文字；图片设置仍可单独配置多语言 PNG 输出。
5. 字体、装备名字号、装备名字重和染剂字号统一应用到全部已选输出语言。
6. 配置字色、坐标、描边比例、描边颜色和每件物品的左右排版。
7. 生成旧版 `560 x 108` 透明物品卡，支持单张 PNG 下载。
8. 全部卡片 ZIP 导出。
9. 将全部物品合并为无标题、无分隔线的纯净连续长图；长图拥有独立的居左/居右排版和 PNG 下载控件，不受单张卡片布局影响。
10. 草稿和输出设置自动使用独立的 `nsitemcard.*` 浏览器存储；最近记录的底层兼容数据保留，但不显示为主工作流入口。
11. 网页、文本和 `.chara` 导入只生成实际识别到的装备，并按既定装备部位顺序排列；手动搜索结果按选择顺序追加，不补齐空部位。
12. 提供简易版和完整版全局输出模式；完整版单语言保持 `560 x 108`，多语言时自动增高以分开名称和染剂内容，并让每个染剂色块在语言名称之间共用一次；简易版缩小图标、压缩卡片高度和长图行距、隐藏染色文本，并让物品名与图标垂直居中。模式统一作用于连续长图、单张 PNG 和 ZIP。
13. 图片设置可开启“物品名按品质着色”；开启后仅物品名使用 FFXIV 品质色，染剂文字和描边继续遵循原有设置，并统一作用于全部导出模式。
14. 本机字体加载后使用真正的下拉选择；有明确中文名称的系统字体优先显示中文并排在其他字体前面，内部仍保存原始 font family 以保证 Canvas 字体加载正确。
15. 搜索入口分为“装备”和“其他物品”：装备覆盖 Item 装备、面部配饰和时尚配饰并保留装备槽与 `dye_count`；其他物品只包含 `EquipSlotCategory = 0`，统一生成无染色普通物品卡片。

本模块不包含人物图片、模板选择、图片上传、图片裁剪或杂志式幻化模板。

## 当前界面约定

- 工作台不显示模块标题、来源状态、手动保存卡片或最近记录的顶部栏；草稿和输出设置会自动保存。
- 预览工具栏集中放置导入、清空、卡片模式、全部单张排版和 ZIP 导出。空草稿时不显示“等待输入”或预览件数。
- “导入”是唯一入口：默认填写石之家或 Eorzea Collection 链接，弹窗内可切换到文本识别；链接输入区域同时接受拖入 `.chara` 文件作为隐藏导入方式，不增加独立按钮。
- 装备编辑器中的数据语言固定使用 `CHS`、`FR`、`DE`、`JP`、`EN`、`TC`、`KO` 缩写；切换后同时更新装备编辑和卡片文本。
- 左侧面板统一称为“卡片内容”；语言切换下方是紧贴搜索框左侧的“装备 / 其他物品”二段控件，默认选择装备。下方只渲染已有卡片：装备行显示原部位，普通物品行显示随卡片语言切换的“物品”，不显示固定空行、行内添加按钮或 CSV 分类字段。
- 连续长图与单张卡片的透明 PNG 预览在日间主题使用浅灰白棋盘格，夜间主题使用深色底。该底色仅用于浏览器预览，不写入导出的 PNG。

## 浏览器存储

- 草稿：`nsitemcard.cardDraft.v2` 与兼容键 `nsitemcard.store.equipment`。
- 读取旧 `_cardRows` 草稿时过滤没有候选的固定空部位行，只保留已选装备和普通物品，并维持原记录顺序。
- 渲染设置和布局：`nsitemcard.pngSettings.v1`。
- 最近记录兼容数据：`nsitemcard.recentLoadouts`。当前不在主界面显示，保留以避免清除既有浏览器数据。
- 存储值仅是本机浏览器状态，不能作为跨设备同步或正式备份机制。

## 目录职责

- `components/ItemCardEquipmentEditor.vue`：装备、候选和染剂编辑。
- `components/ItemCardCatalogSearch.vue`：完整物品目录的防抖搜索、请求取消和候选追加入口。
- `components/ItemCardImportDialog.vue`：网页链接导入，以及切换至文本识别入口。
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

- 与幻化工房共用 V2 自有 Flask API，前缀为 `/api/glamour/*`，端口 `8766`。
- 复用后端接口契约，不引用 V2 glamour 页面的前端实现。
- 主要接口：`POST /api/glamour/import-glamour-link`、`POST /api/glamour/equipinfo/parse-text`、`GET /api/glamour/search-items`、`GET /api/glamour/search-catalog-items`、`GET /api/glamour/stains`、`GET /api/glamour/icon/:id`。
- `/search-items` 继续只搜索指定装备槽；`/search-catalog-items` 使用 `category=equipment|other` 区分完整装备映射和 `EquipSlotCategory = 0` 的 Item.csv 普通物品索引。索引不会进入 Vite bundle，只有用户输入搜索词时才发生请求。
- 数字物品 ID 文本不会调用专用解析接口；前端会以并发上限 4 逐槽搜索 `/api/glamour/search-items`，将 ID 替换为匹配物品名后再提交文本解析。
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
6. 验证装备搜索覆盖 Item 装备、面部配饰和时尚配饰，选中后按 `dye_count` 显示 0、1 或 2 个染色槽。
7. 验证普通物品可按 ID、当前语言名称和英文 fallback 搜索；追加后没有染色控件或不可染色文案。
8. 验证手动选择顺序、导入装备顺序和刷新恢复顺序不变；旧固定空行草稿恢复后只保留已有物品。
9. 在桌面与移动视口检查布局和文字溢出。
10. 检查 `src/pages/item-card/` 与 `src/pages/glamour/` 没有相互私有引用。
