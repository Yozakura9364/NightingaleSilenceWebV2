---
summary: "幻化 EquipInfo/Template 双工作台、共享草稿、V2 Flask API 和模板渲染契约。"
status: "active"
scope: "#/ffxiv/glamour、src/pages/glamour 和 src/lib/glamour。"
source_of_truth: "V2 glamour 前端、server/glamour、API 与模板回归样本。"
read_when: "修改幻化导入、装备、染剂、模板、图片、Canvas 或后端。"
update_when: "用户可见行为、API、模板、草稿、渲染或生产边界变化时。"
verify: "运行契约检查并实测 EquipInfo/Template 往返、预览和导出。"
---

# NSGlamour 模块计划

## 当前状态

- 模块状态：EquipInfo/Template 双工作台已接入；当前前端迁移范围包括导入、装备候选/染剂编辑、六套 Canvas 模板、图片裁剪/暂存和原尺寸 PNG 导出，后续以旧项目等价回归、生产部署边界和后端演进为主。
- 目标路由：`#/ffxiv/glamour` 按旧项目入口跳转到 `#/ffxiv/glamour/template`；装备信息页为 `#/ffxiv/glamour/equipinfo`。
- 当前页面入口：`src/pages/glamour/NSGlamourPage.vue`。
- 当前页面外壳：复用 `FfxivToolShell` 的 `workspace` 模式；正式/迁移工具入口不展示内部标题栏或 API 状态块，顶部菜单承担站点和工具导航，顶部菜单下方直接进入全屏工具工作台。
- 来源项目路径：旧 `NSGlamour` 只保留为行为参考和回滚。
- 当前 API 边界：V2 使用 `/api/glamour/*`，开发代理 rewrite 到 `server/glamour` 的 `/api/*`。
- 当前连通性检查：`/api/glamour/health`。
- 当前 V2 API 端口：`8766`；旧 `8765` 可并行运行。
- 旧项目当前主工作流是 `/template` 和 `/equipinfo`；旧 `/card` 不是本轮 V2 迁移的第一目标。

当前第一段已接入：

- `src/lib/glamour/`：共享类型、固定部位、装备归一、染剂摘要、`GlamourDraft` 和基础复制文案。
- `src/pages/glamour/composables/useGlamourDraft.ts`：页面内共享草稿状态，并同步写入旧模板可读的 `nsglamour.cardDraft.v2` 与 `nsglamour.store.equipment`；后续 `/template` 消费同一份草稿。
- `src/pages/glamour/services/nsglamourApi.ts`：通过 `/api/glamour` 调用 V2 自有后端的 `import-glamour-link`、`parse-text` 和 `parse-chara`。
- `src/pages/glamour/components/`：导入面板、装备面板、复制面板和工作台布局；装备面板已接入旧 `/equipinfo` 的空槽装备名搜索、搜索结果选择、删除当前装备、匹配项切换和行内染剂 chip 编辑能力。
- 装备信息结果头部已按旧 `/equipinfo` 可见行为显示来源名，并提供“保存配置”入口；保存后仍写入旧键 `nsglamour.recentLoadouts`，与最近载入弹窗共享同一套记录。
- 最近记录已按旧 `/equipinfo` 行为接入：沿用 `nsglamour.recentLoadouts`，最多 10 条，入口是导入面板右上角的图标按钮，点击后弹出最近记录面板；支持保存配置、恢复、删除单条和清空，并在恢复后继续同步 `GlamourDraft`、`nsglamour.cardDraft.v2` 和 `nsglamour.store.equipment`。
- 文案生成已接入旧 `/equipinfo` 可见的格式一、格式二、格式三、格式四和第一版自定义模板输入；V2 不显示旧项目 token 参考里涉及模型码、候选数量、原始 JSON 等内部字段。
- `/template` 迁移已开始进入数据层：`src/lib/glamour/templates/` 已建立模板定义、旧设置键 `nsglamour.templateWorkspaceSettings` 的归一模型，以及 `GlamourDraft` 到模板装备行的适配层。该层只承接旧模板 ID、作者/语言/图片槽/装备格式和 template/mobile 装备顺序，不迁入模板图片、字体或精确 Canvas 渲染 UI。
- `/template` 已建立 Vue 无关的渲染输入层：`createGlamourTemplateRenderData` 统一输出当前模板、编辑语言、输出语言顺序、主语言装备行、多语言装备行、标题/副标题/角色名、输出画布尺寸、图片槽和旧 Canvas 设置字段；后续 Canvas renderer 必须消费这一层，不要在 Vue 组件里重新拼 renderer 输入。
- `/template` 已把 Canvas 绘制迁入 `src/lib/glamour/templates/renderer/`：Vue 组件只负责拿到 canvas context、图片状态和下载动作；当前已按模板族拆分六套 renderer，并复用旧项目图片 cover 的裁剪源矩形与多步高质量重采样逻辑。后续模板背景、坐标、字体、图标和多语言绘制都应继续落在 renderer 层，不回填到 `NSGlamourTemplateWorkspace.vue`。
- `/template` 的 Risingstones Canvas renderer 已对齐旧项目装备名基线处理：复用 `drawEcFittedItemName` 的 `inkCenter` 分支，按 `actualBoundingBoxAscent/Descent` 计算字形实际高度居中，避免中文装备名在图标旁产生竖向偏差。
- `/template` 的 Risingstones Canvas renderer 装备名必须沿用旧项目 `nameWeight: 400` 和 Noto/HarmonyOS/Source Han Sans 字体链，不要套 EC 模板的粗体装备名规则。
- `/template` 的 Risingstones Canvas renderer 必须保留旧项目底部两行版权：`ff14risingstones - 石之家 X 光之收藏家` 和动态年份的 `SQUARE ENIX` 版权行；不要只保留第一行。
- `/template` 的 Canvas 装备图标加载只服务实际绘制图标的 EC / Risingstones renderer；Double Pic、Eorzea Magazine、horizontal 等不在 Canvas 绘制装备图标的模板不应预加载 `/api/glamour/icon/*`。右侧装备编辑器的可见装备图标属于旧界面内容，仍按行内 `<img>` 自然加载。
- `/template` 的 EC Canvas renderer 已保留旧项目 Glasses / 面部配饰特殊信息：后端 payload 的 `ec_variant_label` / `ec_variant_kind` 只透传到模板数据层，并在 EC 导出图的 Glasses 行按旧项目绘制灰色信息 chip；该字段不进入装备编辑器额外 UI。
- `/template` 的 EC Canvas renderer 已对齐旧项目“名字与服务器”副标题绘制：`GlamourTemplateRenderData` 保留拆分后的 `subtitleParts`，EC 导出时 `left / symbol / right` 三段分别测量，符号段使用 `NS Cambria` / Cambria 字体；无法拆分时才回退整行居中。
- `/template` 的 EC Canvas renderer 必须沿用旧项目深色 EC 配色：背景 `#202020`、行底 `#282828`、染剂底 `#242424`、强调红 `#fb4b4e`、正文 `#c7c1bd`；该配色属于模板画布契约，不跟随 V2 工作台主题变成白底灰系。
- `/template` 的 Eorzea Magazine Canvas renderer 染剂标签后缀必须按旧项目 `formatFigmaDyeLabel` 规则处理：英文不追加后缀，繁中把简体 `染剂` 后缀替换为 `染劑`，其他中文路径按 `染剂` 补齐；不要因为输入已有简体后缀就在繁中画布原样显示。
- `/template` 的 Eorzea Magazine、Horizontal、Double Pic、EC、Risingstones 和 Silence Fashion 关键 Canvas 常量已纳入 `npm run check:nsglamour-contract`：包括源尺寸、标题/装备文字区、染剂坐标、图片区、头像区、颜色、字体/字重、版权框和旧项目保持关闭的隐藏 meta / 描边开关；后续视觉微调前必须先确认旧项目或 PSD 依据，不能随手改这些坐标。
- `/template` 的 Canvas 绘制前必须沿用旧项目字体预加载边界：按模板 ID 和输出语言对 `document.fonts.load(...)` 做一次无 UI 的等待，加载文本来自标题、角色/服务器、装备名和染剂名；不为此新增字体资产或公开未确认资源。
- `/template` 已建立 renderer 资源加载边界 `src/lib/glamour/templates/assets.ts`：资源 ID 来自 renderer profile，已按用户确认接入旧项目运行时底图/遮罩资源，只包含 Eorzea Magazine、horizontal、Double Pic 左图 mask 和 Silence Fashion 背景；资源位于 `public/data/glamour/templates/`，通过 renderer profile 按需懒加载，不把预览图、PSD/SVG 原稿、用户图片或旧模板目录整包带入构建产物。
- `/template` 已建立旧 renderer profile 的 V2 元数据层：`src/lib/glamour/templates/renderProfiles.ts` 对齐旧 `static/template-renderers.js` 的默认标题、旧标题、强制图标和按模板需要的资产标识。该层只声明后续 renderer 需要什么，不加载模板图片、不迁入字体、不接入 Cropper，也不代表 Canvas 导出已完成。
- `/template` 已建立图片槽兼容 helper：`src/lib/glamour/templates/imageSlots.ts` 保留旧同标签页图片备份键 `nsglamour.templateImageSessionBackup.v2/v1`、旧 IndexedDB 图片库 `nsglamour-template-images-v2/images`，并保留石之家头像槽与 Silence Fashion 头像槽互相复用的旧别名规则。该层承接隐藏图片备份/恢复契约；额外的图片取用体验只允许走用户已确认的“最近图片”轻量弹层。
- V2 已接入旧项目 `/template` ↔ `/equipinfo` 的页面衔接：`#/ffxiv/glamour/template` 与 `#/ffxiv/glamour/equipinfo` 共用同一份 `GlamourDraft`，并使用左右侧翻页按钮互相跳转。
- `/template` 已接入旧页面已有的单链接导入弹窗：装备数据区的“从网页导入”通过现有 `/api/glamour/import-glamour-link` 读取石之家 / Eorzea Collection 链接，成功后写入共享 `GlamourDraft` 并立即刷新 template 装备行；失败信息留在弹窗内，不新增调试字段。
- V2 的 equipinfo 和 template 网页链接导入输入按旧项目处理裸域名：提交时自动补 `https://`，不使用浏览器原生 `type=url` 阻断提交；域名和路径合法性仍交给现有导入接口返回错误。
- `/template` 已接入旧页面已有的“最近载入”入口：使用 clock 图标打开同一套 `nsglamour.recentLoadouts` 列表，支持恢复、删除单条和清空；template 页不显示 equipinfo 里的保存配置按钮。
- V2 读取 `nsglamour.recentLoadouts` 时按旧项目宽松缓存结构兼容：只要条目包含 `parsed.resolved_equipment` 就保留，缺失旧 `id` 时补稳定的 legacy id；保存新记录仍沿用当前 equipinfo/template 共享结构。
- `/template` 已把模板切换从临时 select 改回旧页面的“更换模板”弹窗：支持“全部”和语言筛选、点击/键盘选择、Esc/背景/关闭按钮关闭；模板选择卡片已接入旧 `/template-preview/<path>` 对应的六张 `.webp` 预览图，V2 路径为 `public/data/glamour/template-preview/`，不复制旧 `templates/` 原稿目录或未引用的大图。
- `/template` 的模板选择卡片按旧页面显示预览图、作者和支持语言；作者/模板摘要与“支持语言”摘要保留在浏览器提示信息里，内容必须来自模板定义和本地化 key，不要改成新增说明文案。
- `/template` 的模板选择弹窗不显示旧页面没有的额外说明文字；可见内容只保留标题、关闭按钮、语言筛选和模板卡片。
- `/template` 的模板选择弹窗打开时按旧页面行为把焦点落到当前模板卡片；装备数据区的“清空配装”按钮按旧页面常驻可点击，只在导入忙碌时禁用。
- `/template` 切换模板时已对齐旧项目的语言重置规则：按当前全站 UI 语言优先选择目标模板支持的排版语言，不支持时回到该模板第一语言/默认语言；用户手动点击语言按钮后仍保存到当前模板设置。
- `/template` 初始化和全站 UI 语言变化时已对齐旧项目的模板语言同步规则：当前模板支持 UI 对应语言时自动切到该模板语言，否则回到该模板第一语言/默认语言；有效的手动模板语言选择不会被默认语言额外补齐。
- `/template` 已接入旧页面多语言模板的语言切换：无固定语言组合的多语言模板可通过语言按钮切换/选择排版语言；V2 不显示额外的上移、下移或删除语言按钮。语言按钮、模板筛选和模板卡片支持语言标签的显示顺序固定为 `ja → en → fr → de → chs → tc → ko` 的支持子集，组合项如 `en+ja` 跟随首个语言位置后按原定义稳定排序。V2 使用共享 `GlamourDraft.locale` 承接旧项目独立的当前编辑语言，`templateSettings.locales` 只表达模板输出语言顺序，避免点击语言时误改输出顺序；装备编辑行、染剂选择和装备搜索也必须跟随当前编辑语言。
- `GlamourDraft.locales` 的默认和导入归一顺序固定为 `ja → en → fr → de → zh → tc → ko`，其中 `zh` 在 template 按钮上显示为 `chs`；equipinfo 语言下拉和 template 编辑语言都必须沿用这个顺序。
- `/template` 已接入旧页面已有的模板作者链接弹层：点击作者名展示模板定义里的作者社交链接，外点、Esc 或打开模板选择时关闭；当前用文本链接承接，不引入额外图标资产。
- `/template` 已接入旧页面的导入来源自动回填：网页链接导入会保留 `source_title/source_name/author` 等来源元数据，模板页按旧规则把导入标题写入“标题文字”，并在支持的模板上把角色名/服务器写入“名字与服务器”或角色名字段；链接导入的标题会按旧项目写入所有模板设置，切换模板后仍保留该导入标题。只覆盖默认值、旧自动值或模板页本次链接导入的强制回填，不暴露来源元数据为额外 UI。template 页从“最近载入”恢复时对齐旧项目，按“手动编辑”草稿处理，不把历史记录的来源标题/作者再次当作网页导入回填。
- `/template` 标题自动回填只允许来自模板页网页链接导入的 `template-link` 模式；本地 `.chara` 文件名、隐式本地配置、文字导入和手动编辑来源名不能自动写入“标题文字”。如果旧错误逻辑已经把本地文件名写成自动标题，后续非网页导入会把该自动标题恢复为当前模板默认标题，但不清除用户手动编辑过的其他标题。
- `/template` 网页链接导入已对齐旧页面语言选择规则：提交时记录当前模板按全站 UI 语言推导的首选语言，接口返回后仅在 payload 支持该语言时采用，否则回退到 payload 默认语言；随后模板输出语言收敛到这次编辑语言。
- `/template` 已接入旧页面装备编辑行的空槽搜索、搜索结果选择、删除当前装备和行内染剂选择：编辑区按 template/mobile 固定顺序渲染全部 14 个槽位，空槽显示旧文案“搜索装备名”，选择、删除或改染剂都写回共享 `GlamourDraft` 并同步预览，不显示候选数量、模型码或 `.chara` 导入提示。
- `/template` 已把左侧临时 DOM 预览替换为旧页面同形态的 `canvas + 上传图片覆盖层 + 保存图片` 入口：画布尺寸、图片槽、上传区域和装备行都来自 `createGlamourTemplateRenderData`；当前已按运行时资源边界接入确认过的模板背景/遮罩，图片输入支持文件上传/拖放以及旧项目已有的 `text/uri-list` / `text/plain` 图片 URL 拖入，不复制旧字体或 Cropper。
- `/template` 的模板图片槽区域、上传区域和头像 drop 区域已纳入 `npm run check:nsglamour-contract`，包括 Eorzea Magazine、Horizontal、Double Pic、EC、Risingstones 和 Silence Fashion 的 `region / uploadRegion / dropRegion`；后续图片适配、撑满画布或裁剪交互调整必须保持这些旧项目坐标不漂移。
- `/template` 的图片拖放槽位命中必须沿用旧页面规则：优先按 `dropRegion / uploadRegion / region` 命中，从后往前处理重叠区域；拖到画布空白但仍在画布内时，回退到最近的图片槽，而不是丢弃这次拖放。
- `/template` 必须保留旧页面的文档级图片拖放保护：组件挂载期间在 `window / document / documentElement` capture 阶段拦截图片拖放，画布内交给图片槽处理，画布外只阻止浏览器默认打开文件或图片 URL；该保护不新增可见 UI。
- `/template` 必须保留旧页面的页面恢复重绘保护：标签页重新显示、浏览器 pageshow 或窗口重新获得焦点时，用 `requestAnimationFrame` 去抖后重新测量预览区并重绘 Canvas，避免浏览器恢复后画布空白或尺寸错位；该保护不新增可见 UI。
- `/template` 必须保留旧页面的全局弹层收口边界：收到 `nsglamour:header-popover-open` 时关闭模板页自己的最近载入、作者链接、图片上传菜单和染剂选择器，避免多个浮层叠加；该保护不新增可见 UI。
- `/template` 跨模板继承图片时必须沿用旧项目做法：优先使用上一模板图片的原始 `sourceUrl`，重新按目标模板图片槽尺寸 cover 生成新图片；不要直接复用上一模板已经裁过的 `imageUrl`，否则不同长宽比模板会产生二次裁切。
- `/template` 的模板装备格式和染剂格式已纳入 `npm run check:nsglamour-contract`：包括每个模板的 `equipmentFormat.source`、最大行数、装备名换行/缩放规则、染剂模式、染剂槽数量、附件染剂排除、空染色显示、后缀剥离和分隔符；后续不要在 Vue 组件里临时覆盖这些旧规则。
- `/template` 装备行适配必须按旧项目顺序处理：先按模板当前语言组合过滤有可显示装备名的行，再应用 `maxRows`，最后才为具体输出语言生成 `itemName` / `dyeText`；不要在生成完整多语言行之后再截断。
- `/template` 装备行适配层的染剂名必须保留旧 `getTemplateDyeText` 的后缀行为，不在 rows 层统一剥离“染剂/染劑”；EC / Risingstones 这类 chip 画布标签需要短名时由 renderer 局部处理。
- `/template` 已接入旧页面图片裁剪确认层的轻量 V2 实现：上传或拖入图片后先打开裁剪弹层，提供旧项目已有的取消、缩放、重置、使用裁剪操作；确认后按当前图片槽输出裁剪后的 PNG data URL，并沿用同标签页备份和 IndexedDB 图片库。该实现不引入旧 Cropper.js vendor，不新增图片管理 UI。
- `/template` 已接入旧同标签页图片备份、IndexedDB 持久化和切换模板图片边界：上传图片会写入 `nsglamour-template-images-v2/images` 与 `nsglamour.templateImageSessionBackup.v2`，刷新后先按当前模板 ID 从 IndexedDB 恢复，再读同标签页备份；切换模板时先保存当前模板运行时图片状态，再恢复目标模板已有图片，最后只向目标模板空的兼容槽继承上一模板图片，已有图片不被覆盖。石之家头像槽与 Silence Fashion 头像槽按旧别名互相复用。该能力不新增可见 UI，也不把用户图片写入项目文件或构建产物。
- `/template` 已接入用户确认的“最近图片”轻量弹层：点击上传区域后可选择上传图片或最近图片；最近图片只存最近 5 张上传原图 `Blob` 和缩略图到同一个浏览器 IndexedDB 的 `recentImages` store，每条只显示缩略图、文件名和时间，可清空，不显示路径、不写入项目文件、不进入构建产物。
- V2 已补上旧 `/template` 的草稿恢复边界：启动时优先读取 `nsglamour.store.equipment`，再读取旧 `nsglamour.cardDraft.v2` template draft，并转换回共享 `GlamourDraft`；这保证刷新页面后仍恢复装备数据，同时不新增任何可见提示。
- V2 已兼容旧 `/template` 草稿里的来源元数据别名：`sourceMeta` 的 `sourceTitle/source_title/title`、`sourceUrl/source_url/url`、`sourceId/source_id`、`fileType/file_type`、作者字段和 `race/gender` 会在恢复时进入共享 `GlamourDraft` payload；这些字段只用于自动回填和后续渲染数据层，不新增可见 UI。
- V2 从旧 `nsglamour.store.equipment` 恢复时会优先使用 `_storeDisplayName` 作为共享草稿的来源显示名，再回退到 `source_name`，以保持旧 equipinfo/template 跨页同步显示名行为。
- V2 已补上旧页面之间的隐藏同步边界：监听 `nsglamour.store.equipment`、`nsglamour.cardDraft.v2` 和 `nsglamour.recentLoadouts` 的 `storage` 变化，跨标签页或旧页面更新时刷新共享草稿和最近载入列表，不新增界面提示。
- V2 已兼容旧 `nsglamour.templateWorkspaceSettings` 的早期平铺字段结构：没有新 `templates` 分组时，把旧标题、角色名、副标题、语言和模板局部设置迁入当前模板；已有新结构时不反向覆盖。
- V2 已兼容旧 `/template` 的副标题设置归一规则：新版本设置里如果只有 `ecSubtitleText` 而没有拆分后的名字、符号和服务器字段，会按旧项目规则拆回三个字段；version<3 的旧副标题仍按已确认规则清空，避免污染新版自动回填。
- V2 已对齐旧 `nsglamour.templateWorkspaceSettings` 的 version<3 副标题迁移规则：EC / 石之家 / Silence Fashion 等暴露“名字与服务器”的模板会清空旧副标题拆分字段，避免老结构污染新版自动回填。
- V2 已在模板设置数据层保留旧 Canvas 专用字段，包括 `bottomText`、`aspect`、`padding`、`nameSize`、`dyeSize`、`showIcons`、`textColor`、`panelColor` 和 `storySwatchColors`；默认 `textColor` / `panelColor` 必须跟旧 `DEFAULT_TEMPLATE_SETTINGS` 一致。当前不新增可见控件，只为后续 Canvas 渲染迁移避免丢旧设置。
- V2 已修正最近记录的来源 URL 兼容：保存最近记录时 `sourceUrl` 对齐旧 `/equipinfo` 的 `parsed.source_url`，不再误用显示标题。
- V2 装备归一入口已读取旧 `nsglamour.ignoreEmperor` 键，保持旧 `/template` 应用草稿时过滤皇帝套的隐藏行为；没有该键时不改变装备显示。

当前 UI 约束：

- V2 迁移目标是更换前端架构，不是重新设计用户可见功能。最终界面必须以旧项目同一工作流的用户可见界面为准做等价复现；旧项目没显示的字段、统计、调试信息或解析中间态，不能因为 V2 数据层可获得就新增到界面上。
- 新增任何用户可见字段、按钮、状态、文案或编辑能力前，必须先确认旧项目对应工作流确实已有等价展示，或得到用户明确要求。
- 本地角色配置导入是隐式能力，不在用户界面展示专门按钮、格式名或明显提示文案。
- 候选数量、模型码等解析辅助信息只保留在内部数据层，不进入正式用户界面；除非用户明确要求开启调试/编辑功能。
- `npm run check:nsglamour-contract` 已静态保护 NSGlamour 可见 UI 文案：不得出现模型码、候选数量、`X个候选`、`未导入`、`.chara` 文件提示或 `model code` 等内部/调试文案；空装备搜索文案必须保持“搜索装备名”，简体中文语言标签必须保持“简体中文”。
- 装备栏顺序是用户亲自定过的旧 `/equipinfo` 视觉契约，不能用通用槽位数组自动排版替代。桌面端左列固定为：主手、头部、身体、手臂、腿部、脚部、面部配饰；右列固定为：副手、耳部、颈部、腕部、左指、右指、时尚配饰。手机端单列和后续 `/template` 装备顺序固定为：主手、副手、头部、身体、手臂、腿部、脚部、耳部、颈部、腕部、左指、右指、面部配饰、时尚配饰。
- “无染色”属于装备/染剂数据文案，必须跟随装备草稿语言和导入 payload 的 `no_dye_labels`，不能跟随全站 UI 语言；`/equipinfo` 和后续 `/template` 都应复用同一装备层 helper。
- `/template` 装备编辑器只显示旧页面已有的装备名、空槽搜索、删除当前装备、染剂按钮和不可染色文本；`row.dyeText` / `hasDyeLine` 等 renderer 专用染色摘要只允许进入预览/Canvas 数据层，不能作为额外说明行显示在编辑器里。
- equipinfo 和 template 工具页除全站标题栏/顶栏外，工作区背景必须保持纯白；不要回退到全站粉蓝渐变或 `#fff8fc`。
- 装备栏中已选装备如果没有染色控件或不可染色文本，只居中显示已选装备名和图标；空槽才显示“搜索装备名”，不能用搜索框替代已选装备行。
- equipinfo 装备候选/搜索结果的图标和字号必须与已选装备行保持一致，避免回退成旧的窄小候选行。
- equipinfo 和 template 编辑区的“无染色”图标使用 `public/data/glamour/templates/com_icon_clear.svg`，必须占用与普通染色色块相同的 10px × 10px 盒子；根目录 `com_icon_clear.svg` 只是用户放置的本地来源文件，必须保持忽略，不提交。

当前未接入：

- 旧 localStorage 迁移提示。
- `/template` 仍未完成全部旧 Canvas 精确渲染器；当前 Eorzea Magazine / horizontal / Double Pic / EC / Risingstones / Silence Fashion 已有 Canvas renderer，Eorzea Magazine、horizontal、Double Pic 左图 mask 与 Silence Fashion 背景已按运行时资源接入并按需懒加载，EC / Risingstones 按需通过现有 `/api/glamour/icon/<id>` 读取装备图标，图标加载失败时回退 renderer 内部占位。
- `/template` 只把当前六套 renderer 实际需要的背景和 mask 放入 V2 构建产物，并按需加载；旧模板目录的其余图片、旧字体和 Cropper.js 没有整包迁入。新增资产仍必须先确认提交/公开策略和按需加载边界，当前裁剪层继续使用原生轻量实现。

已确认图片暂存约束：

- “最近图片/图片暂存”与旧装备草稿的“最近载入”是两套不同能力：前者只服务图片重新取用，后者仍服务装备/幻化数据恢复。
- 图片暂存只保留最近 5 张图片，存储内容为缩略图和原图 `Blob`，存放在浏览器 IndexedDB；不自动公开、不写入项目文件、不进入构建产物。
- UI 放在上传层附近的轻量弹层里，点击上传区域后可选择“最近图片”；每条记录只显示缩略图、文件名和时间。
- 可提供“清空”入口，但不做复杂管理、重命名、路径展示、文件夹管理、批量整理或伪路径展示。
- 该能力是用户已确认的体验增强，不应扩展成额外图片管理功能。

## 阶段 0 当前结论

本轮从 0 开始的阶段 0 只建立契约和回归地基，不迁移 UI、不复制旧资源、不修改旧 `NSGlamour` 项目。

已确认的轻量接口：

- `GET /api/health`：连通性。
- `GET /api/stains?locale=zh|en`：染剂数据，当前 `zh/en` 均为 `126` 条，缓存 1 小时。
- `GET /api/ui-localization`：旧 UI 本地化数据，当前 `version=2`，响应约 `102 KB` raw，`no-store`。
- `GET /api/search-items`：装备搜索，支持 `slot`、`q`、`locale`、`limit`，limit 后端限制为 `1..80`。
- `POST /api/import-glamour-link`：石之家 / Eorzea Collection 链接导入。
- `POST /api/equipinfo/parse-text`：成段文字识别，空文本返回 400；可用搜索结果构造最小结构回归。

已确认的资产/流量约束：

- `data/item_model_mapping.json` 约 `47.7 MB` raw / `4.36 MB` gzip，`28,935` 条 items；不能进入 V2 前端 bundle。
- 旧 `font/` 约 `81.6 MB`；不能整目录迁入，后续只能按模板/语言懒加载。
- 旧 `static/templates/` 约 `4.5 MB`；只迁运行时模板资源，按选中模板加载。
- 旧 `templates/` 下源/参考资源约 `327.6 MB`；不能进入 V2 构建产物。
- `/template` HTML 本身很轻，但真实首屏依赖 Cropper、字体、模板背景和多份渲染脚本；`/equipinfo` 更适合作为第一段轻量迁移切片。

当前已新增 V2 契约检查脚本：

```bash
npm run check:nsglamour-contract
```

默认直连 V2 服务 `http://127.0.0.1:8766/api`。如需验证 V2 代理，执行 `npm run dev` 后设置：

```bash
NSGLAMOUR_CONTRACT_BASE_URL=http://127.0.0.1:5175/api/glamour npm run check:nsglamour-contract
```

该脚本同时做一项本地模板数据层检查：确认 V2 模板定义覆盖旧 `/template` 的六个模板 ID，保留旧模板设置键，并固定模板装备顺序为：主手、副手、头部、身体、手臂、腿部、脚部、耳部、颈部、腕部、左指、右指、面部配饰、时尚配饰。此检查也静态保护当前 `canvas + 上传图片覆盖层 + 裁剪弹层 + 保存图片` 链路，以及 Eorzea Magazine / Double Pic / EC / Risingstones / Silence Fashion renderer dispatcher 边界；但不代表全部旧 Canvas 精确渲染器已迁移完成。

当前本机已有用户提供的私有本地配置 fixture，位于 ignored 的 `tests/fixtures/nsglamour/chara/`，只用于本机回归，不公开、不提交。

阶段 1 推荐先从 `/equipinfo` 的导入/编辑结构开始，再进入 `/template` Canvas。原因是 `/equipinfo` 依赖资源更轻，能先固定装备、染剂、候选和文案结构；`/template` 对字体、图片裁剪、Canvas 坐标、背景资源和视觉回归更敏感。

## 定位

`#/ffxiv/glamour` 是 FFXIV 幻化工具模块，目标是承接旧 `NSGlamour` 的核心能力，但不是把旧项目代码机械搬进 V2。

新实现应优先按 V2 的 Vue、模块文档、公共组件、公共 CSS、API 边界和安全规则重新整理。旧项目在迁移期间作为行为契约、数据契约和回归样本保留。

核心目标：

1. 本地角色配置解析和装备/染剂映射严谨可靠。
2. 石之家与 Eorzea Collection 导入结果与旧项目一致或更稳。
3. `/template` 模板生成和 `/equipinfo` 装备信息工作流在 V2 中重新组织。
4. 模板 Canvas 渲染、图片裁剪、PNG 导出尽量保持旧项目已校准的视觉结果。
5. 多语言装备、染剂和 UI 本地化能力保留，并为后续扩展留出边界。

## 后端迁移状态

V2 自有后端位于 `server/glamour/`，继续使用 Flask 并保留既有 API 字段。它持有 `.chara` resolver、47.7MB 映射、UI localization、EC 解析、外部石之家 Reader 客户端、图标代理、搜索和染剂接口，不承载旧 Jinja 页面。

`npm run dev` 同时启动 `127.0.0.1:5175` 和 `127.0.0.1:8766`；`npm run test:glamour-api` 运行后端回归。旧 `8765` 在生产切流观察完成前保留，但不是 V2 运行依赖。

## 后端迁移策略

本模块允许按新规则重写后端，但必须先抽取旧后端行为契约。

推荐顺序：

1. 记录旧 API 输入、输出、错误结构和关键字段。
2. 用真实样本建立回归用例，包括本地角色配置、石之家链接、EC 链接、成段文字和模板草稿。
3. 在 V2 API 命名空间下稳定对外路径：`/api/glamour/*`。
4. 新后端按契约实现，不要求复制旧 Flask 内部结构。
5. 新旧后端并行一段时间，用同样样本比对解析结果和导出结果。
6. 等价验证通过前，不删除旧 `NSGlamour` 和旧部署入口。

重点风险：

- 染剂槽一致性、空染色、不可染色、双染色、饰品/面部配饰/时尚配饰规则容易回归。
- 主手/副手互斥、双手武器清理、副手候选和同模型装备替换容易回归。
- 模板渲染对坐标、字体、裁剪、阴影、描边和导出尺寸敏感。
- 外部链接导入和后台浏览器功能涉及公开部署安全边界。

## 旧项目契约参考

旧后端关键入口位于：

```text
../NSGlamour/scripts/app.py
```

已确认旧接口：

| 旧接口                                      | V2 目标路径                                         | 用途                     |
| ------------------------------------------- | --------------------------------------------------- | ------------------------ |
| `GET /api/health`                           | `GET /api/glamour/health`                           | 连通性检查               |
| `GET /api/ui-localization`                  | `GET /api/glamour/ui-localization`                  | UI 本地化数据            |
| `POST /api/import-glamour-link`             | `POST /api/glamour/import-glamour-link`             | 石之家/EC 链接导入       |
| `POST /api/equipinfo/parse-text`            | `POST /api/glamour/equipinfo/parse-text`            | 成段文字识别             |
| `GET /api/icon/<icon_id>`                   | `GET /api/glamour/icon/<icon_id>`                   | 图标代理                 |
| `GET /api/stains`                           | `GET /api/glamour/stains`                           | 染剂数据                 |
| `GET /api/search-items`                     | `GET /api/glamour/search-items`                     | 装备搜索                 |
| `POST /api/parse-chara`                     | `POST /api/glamour/parse-chara`                     | 本地角色配置解析         |

旧静态/资源入口：

| 旧入口                         | 迁移注意                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `/template-preview/<path>`     | 旧页面实际引用的六张 `.webp` 预览已迁入 `public/data/glamour/template-preview/`，不做开放代理 |
| `server/glamour/data/item_model_mapping.json` | 装备、染剂、图标、模型码核心映射，只由后端读取，不进入 Vite bundle                    |
| `server/glamour/data/ui-localization.json`    | 兼容接口数据，只由后端读取                                                           |

旧外部依赖：

- 石之家接口基础地址：`https://apiff14risingstones.web.sdo.com/api/home/`。
- 石之家页面和接口可能变化，链接导入必须保守处理。

## 核心数据契约

迁移或重写时不得轻易改变这些字段语义：

- `resolved_equipment`
- `candidates`
- `dye_entries`
- `names`
- `model_main`
- 装备部位、染剂槽、图标 ID、模型码、语言名称、来源信息

装备合法性检查应成为导入链路的一部分：

1. 染剂属性一致性：染剂槽数量、不可染色、空染色必须与物品属性一致。
2. 主手/副手互斥：主手装备不可能再装备副手时，自动删除或禁用副手数据。
3. 候选替换一致性：同模型装备替换后重新校验染剂和副手规则。
4. 饰品、面部配饰、时尚配饰按旧项目显示规则处理，不套普通装备染色展示逻辑。

## 共享装备草稿决策

V2 中 `/equipinfo` 和 `/template` 的装备信息必须共用同一层规范化数据，不再让两个页面各自维护装备状态。

已确认边界：

1. `GlamourDraft` 是 V2 前端唯一的幻化草稿模型，负责装备、染剂、候选、部位顺序、语言、来源信息和导入警告。
2. `equipinfo` 只负责导入、识别、编辑和替换这个草稿，不拥有另一份页面私有装备状态。
3. `template` 只消费同一份 `GlamourDraft` 渲染模板；模板选择、裁切图片、标题、模板局部开关等属于模板私有设置，不写回装备层。
4. 旧项目的 `NSGlamourStore.equipment`、`equipmentSync` 和 `nsglamour.cardDraft.v2` 说明了“装备层”和“模板层”的边界，但 V2 不直接复制全局 JS；应迁入 `src/lib/glamour/`、service 和 composable。
5. 后续候选替换、染剂编辑和模板 Canvas 都必须围绕同一份 `GlamourDraft` 增量实现，避免 equipinfo 与 template 的装备/染剂不同步。

## 前端状态和存储参考

旧项目重要状态键：

| 键/机制                                  | 用途                 |
| ---------------------------------------- | -------------------- |
| `nsglamour.theme`                        | 旧项目主题           |
| `nsglamour.cardDraft.v2`                 | 模板/装备草稿        |
| `nsglamour.recentLoadouts`               | 最近导入记录         |
| `nsglamour.copyTemplate`                 | 自定义复制模板       |
| `nsglamour.copyFormat`                   | 文案格式             |
| `nsglamour.ignoreEmperor`                | 皇帝套过滤设置       |
| `nsglamour.templateWorkspaceSettings`    | 模板工作台设置       |
| `NSGlamourStore`                         | 旧项目跨页面共享状态 |
| `nsglamour-template-images-v2` IndexedDB | 模板上传图片持久化   |

V2 不要求复用这些键名，但迁移时必须处理旧数据兼容或迁移提示，不能无声丢失用户草稿。

## 当前模板工作台边界

## 已实现范围

当前 V2 的 `#/ffxiv/glamour/equipinfo` 与 `#/ffxiv/glamour/template` 已围绕同一份 `GlamourDraft` 工作。EquipInfo 负责网页链接、文字和隐式本地配置导入，以及装备候选、染剂、复制和最近记录；Template 负责六套模板选择、多语言输出、图片裁剪、最近图片 IndexedDB 暂存、跨模板图片继承、Canvas 预览和 PNG 导出。

后端现已迁入本仓库；页面继续通过稳定的 `/api/glamour/*` 使用同一契约。生产切换到 `8766` 前仍须保留旧 `8765`，完成真实导入、六套模板导出和移动端主流程回归。

## 性能与流量计划

本模块的性能优化必须保持模板预览、导出 PNG、装备编辑和旧项目已校准的 Canvas 输出语义不变，优先减少不可见的重复工作：

1. 模板页面预览 Canvas 最长边限制为 `1920px`，用于屏幕显示；下载时使用离屏 Canvas 按模板原始尺寸重绘并导出，不能降低 PNG 导出尺寸或改变模板坐标。
2. 模板状态同一动画帧内的连续变化合并为一次预览重绘；页面卸载时必须取消待执行帧，避免隐藏路由残留绘制。
3. 不预加载未选中模板的背景。特别是 `silence-fashion-background.png` 为 `3000 x 3000`，压缩文件约 `3.1 MB`，解码后内存远高于网络体积；切换模板只保留浏览器 HTTP 缓存，不在前端长期保留所有背景位图。
4. 装备搜索对相同 `API base + 槽位 + 语言 + 查询词 + limit` 使用 5 分钟、最多 80 条的内存 LRU 缓存；失败和中止请求不得写入缓存，现有防抖和 `AbortController` 语义不变。
5. 染剂接口是版本稳定的读数据，前端允许使用浏览器 HTTP 缓存；跨 EquipInfo/Template 的会话内缓存继续由 `useGlamourDyePicker.ts` 负责。
6. renderer 已按模板族拆到 `src/lib/glamour/templates/renderer/`；后续调整必须继续以六模板 Canvas 回归和真实浏览器请求为前提。

验证要求：预览画面按显示像素与基线对比，导出仍按原始 Canvas 尺寸与既有基线哈希对比；模板背景仅在选中对应模板后请求，重复搜索不得产生第二个相同 API 请求。

`NSGlamourTemplateWorkspace.vue` 只保留 Canvas 舞台、装备行数据适配、图片槽、导入/模板弹层和页面级生命周期编排。设置表单、装备控制面板、装备搜索/染剂交互、图片交互和图片持久化不再直接写入主工作台：

- `NSGlamourTemplateSelectorDialog.vue`：模板筛选、模板卡片和打开时焦点。
- `NSGlamourTemplateImportDialog.vue`：链接输入、状态和打开时焦点；链接归一与提交仍由工作台编排。
- `NSGlamourTemplateCropDialog.vue`：裁剪 Canvas、缩放、拖拽、滚轮和裁剪数据输出；不直接处理图片持久化。
- `NSGlamourTemplateSettingsPanel.vue`：作者链接、模板切换/保存动作和模板专属文字/染剂样式设置；作者弹层关闭和模板选择器焦点恢复由该组件负责。
- `NSGlamourTemplateEquipmentPanel.vue`：最近记录、输出/编辑语言按钮和装备编辑器组合；最近记录弹层生命周期由该组件负责。
- `NSGlamourTemplateEquipmentEditor.vue`：模板页装备行、搜索结果、染剂选择器和对应局部样式。
- `NSGlamourEquipmentPanel.vue`：EquipInfo 标题、语言、保存动作和桌面/手机装备顺序编排；桌面与手机布局按 `1080px` 断点互斥挂载，不能恢复为同时渲染两套装备槽。
- `NSGlamourEquipmentSlot.vue`：EquipInfo 单个装备槽的候选、染剂和空槽搜索 UI；面板和槽位样式分别位于 `styles/equipment-panel.css`、`styles/equipment-slot.css`。
- `useGlamourEquipmentSearch.ts`：EquipInfo/Template 共用的装备搜索防抖、请求中止和卸载清理。
- `useGlamourDyePicker.ts`：EquipInfo/Template 共用的染剂搜索、分组和按语言会话缓存；同一语言数据在两个页面间不重复请求。
- `useGlamourEquipInfoEditor.ts`、`useGlamourTemplateEquipmentEditor.ts`：分别只编排页面特有的装备编辑事件，共用上述搜索和染剂能力。
- `useGlamourTemplateLanguageControls.ts`：固定 `ja-en-fr-de-chs-tc-ko` 显示顺序、当前编辑语言和多语言输出选择规则。
- `useGlamourTemplateImageInteraction.ts`：上传菜单、文件/URL 拖放、裁剪队列和最近图片交互。
- `useGlamourTemplateImageStore.ts`：模板图片运行时状态、同标签页备份、IndexedDB 恢复和跨模板继承。
- `imageProcessing.ts`：图片读取、URL 归一和 cover 图片生成等 Vue 无关逻辑。
- `useGlamourTemplateCanvas.ts`：字体缓存、renderer 资产、装备图标预载、绘制竞态和 PNG 下载。
- 三个弹层使用 `defineAsyncComponent` 按需加载，不能重新静态合入模板工作台首个路由 chunk。
- `NSGlamourWorkspace.vue` 只静态保留共享草稿和 API 编排；Template 工作台及 EquipInfo 的导入、复制、装备面板均通过 `defineAsyncComponent` 按当前模式加载。两个路由继续复用同一份 `GlamourDraft`，但不能重新把两套 UI 静态合入同一首个路由 chunk。

## 页面拆分方向

当前 V2 前端结构：

```text
src/pages/glamour/
├── NSGlamourPage.vue
├── components/
│   ├── NSGlamourImportPanel.vue
│   ├── NSGlamourEquipmentPanel.vue
│   ├── NSGlamourEquipmentSlot.vue
│   ├── NSGlamourRecentPanel.vue
│   ├── NSGlamourTemplateCropDialog.vue
│   ├── NSGlamourTemplateEquipmentPanel.vue
│   ├── NSGlamourTemplateEquipmentEditor.vue
│   ├── NSGlamourTemplateImportDialog.vue
│   ├── NSGlamourTemplateSelectorDialog.vue
│   ├── NSGlamourTemplateSettingsPanel.vue
│   ├── NSGlamourTemplateWorkspace.vue
│   └── NSGlamourWorkspace.vue
├── types/
│   ├── equipmentEditor.ts
│   ├── equipmentPanel.ts
│   └── templateWorkspace.ts
├── styles/
│   ├── equipment-panel.css
│   ├── equipment-slot.css
│   └── template-workspace.css
└── composables/
    ├── useGlamourDraft.ts
    ├── useGlamourDyePicker.ts
    ├── useGlamourEquipInfoEditor.ts
    ├── useGlamourEquipmentSearch.ts
    ├── useGlamourTemplateCanvas.ts
    ├── useGlamourTemplateEquipmentEditor.ts
    ├── useGlamourTemplateImageInteraction.ts
    ├── useGlamourTemplateImageStore.ts
    ├── useGlamourTemplateLanguageControls.ts
    └── useGlamourTemplateWorkspace.ts

src/lib/glamour/
├── equipment.ts
├── draft.ts
├── links.ts
├── recent.ts
└── templates/
    └── imageProcessing.ts
```

原则：

1. Vue 组件负责状态组合、表单、交互和 DOM 生命周期。
2. 装备解析、染剂归一、合法性检查、文案格式化放入 `src/lib/glamour/`。
3. Canvas 渲染器放入 `src/lib/glamour/templates/` 或 `src/lib/glamour/renderers/`，保持可测试。
4. API 调用通过 `useFetch.ts` 和 `/api/glamour`，页面不硬编码旧端口。

## CSS 和组件策略

- 样式层级：工具页业务布局为页面专属；工具页内可复用控件优先公共组件。
- 按钮、面板、输入框、状态提示、弹窗、工具栏优先使用 `src/components/` 和 `src/styles/`。
- 模板画布、装备编辑区、导入工作流等复杂布局可写页面私有样式。
- 不把旧 `NSGlamour` 的琥珀色 UI 整套复制成 V2 全站样式。
- 不把首页像素风装饰带入工具工作台。
- 如果 NSGlamour 与 NSPlate 都需要同类工具页外壳，应沉淀到 `src/pages/ffxiv/components/` 或公共组件。

## 安全边界

所有上传、粘贴、外部链接和后台浏览器相关数据都视为不可信输入。

必须注意：

1. 本地角色配置文件大小、格式和解析异常限制。
2. 外部链接只允许白名单域名和明确支持的路径。
3. 图标代理和模板预览资源不能变成开放代理。
4. 后台浏览器登录态、token、cookie 和调试端口不能暴露给公开用户。
5. 错误信息不输出服务器内部路径、密钥或堆栈。

## 验证清单

实现或迁移后至少验证：

- `npx vue-tsc --noEmit`
- `npm run build`
- 浏览器访问 `http://127.0.0.1:5175/#/ffxiv/glamour`
- `/api/glamour/health` 返回正常。
- 隐式本地配置导入得到稳定装备列表。
- 石之家链接导入和 EC 链接导入能导入标题、角色名、服务器、装备和染剂。
- 成段文字识别支持已确认格式，并能切换语言。
- 导入后先做装备合法性检查，再进入编辑栏和模板。
- 模板预览、图片裁剪、PNG 导出尺寸与旧项目关键样本对齐。
- 多语言装备名和染剂名在 `zh/en/ja/fr/de` 等已支持数据内可切换。
- 移动端至少保持导入、编辑、导出主流程可用。

## 剩余事项

- 生产 Nginx upstream 从 `8765` 切换到 `8766`，完成烟测后保留旧服务观察窗口。
- 石之家 Reader 继续作为仓库外服务运行；Token、Cookie 和浏览器 profile 不进入 V2 仓库。
- 旧目录删除和 `8765` 下线必须另起任务，并先证明不再需要回滚。
