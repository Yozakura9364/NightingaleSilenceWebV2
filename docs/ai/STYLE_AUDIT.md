# 全站样式审计记录

## 定位

本文件记录 V2 公共样式、正式像素风 token、顶栏弹窗和 Style Lab 的长期边界。它不是单次视觉稿，也不替代 `ARCHITECTURE_PLAN.md`；具体长期规则仍以架构文档为准。

## 当前结论

1. 正式站点方向已经固定为统一像素风，`day / night` 只切换同一套像素风变量。
2. `src/styles/theme.css` 是正式 token 入口；正式页优先使用 `--ns-color-*`、`--ns-pixel-*`、`--ns-status-*`、`--ns-top-nav-*` 等变量。
3. `src/styles/experiments/pixel-soft.css` 只属于 `#/style-lab` 隐藏实验区，不进入 `src/styles/index.css`。
4. `AppButton`、`AppField`、`AppToolbar`、`AppTabs`、`AppStatus`、`AppPixelWindow`、`AppNotebookList` 和 `AppTopNav` 是当前公共控件基准。
5. 公共组件默认视觉以 `docs/ai/ARCHITECTURE_PLAN.md` 的“公共组件样式契约 v0.1”为准：方角、硬边框、硬阴影、克制 day/night 像素配色和清晰状态。
6. 工房工作台变量暂不继续扩展，等第一个项目迁移完成后再按真实重复结构评估。

## 顶栏结构

当前非首页通用顶栏由三层组成：

- `src/components/AppTopNav.vue`：只负责顶栏外壳、品牌回首页、`菜单` 和 `设置` 两个弹窗的开关状态、点击外部关闭、路由切换关闭。
- `src/components/AppTopNavMenu.vue`：只负责 `菜单 | MENU` 入口、分类切换和站点导航链接。
- `src/components/AppTopNavSettings.vue`：只负责 `设置 | CONFIG` 入口、`day / night` 显示模式和中/日/韩/英 UI 语言切换。

顶栏样式集中在 `src/styles/components/top-nav.css`，并通过 `src/styles/index.css` 以 `components` layer 引入；不要再把顶栏大段样式塞回 `AppTopNav.vue` 或 `src/styles/components.css`。

## 本轮审计处理

- 将公共组件里的常见裸色收敛到正式 token：强调文字、hover 边框、表单内阴影、状态提示色和顶栏弹窗尺寸。
- `AppTopNav` 的菜单与设置弹窗保持并列入口：`菜单 | MENU` 管站点导航，`设置 | CONFIG` 管显示模式和语言。
- 顶栏弹窗路由切换后自动收起，避免用户进入新页面时遗留打开状态。
- Style Lab 新增正式公共组件基准区，放在 `pixel-soft` 实验区外，避免实验 CSS 变量污染正式控件判断。
- `AppButton` 已补齐 `secondary`、`ghost`、`danger`、`compact`、`icon`、`block` 等公共变体；业务页不要再为普通命令、轻量命令、危险命令和图标按钮重复写一套按钮基础样式。
- 已新增公共滚动容器 class：`.ns-scroll-area`、`.ns-scroll-area--compact`、`.ns-scroll-area--plain`。需要像素滚动条的内部列表、弹窗正文和工作台侧栏应显式加 class；不要全局改所有滚动条。
- 已将 Style Lab 中确认通过的记事本式列表沉淀为 `AppNotebookList`，用于短文本素材/选项列表；正式页面不要复制旧实验类名或局部 CSS。

## 后续审计重点

1. 迁移 `NSPlate` 第一个真实业务切片后，对照本文件和 `WORKBENCH_STYLE_CONTRACT.md` 检查控件是否统一。
2. 如果某个页面专属样式第三次复用，再考虑上移为公共 class 或 token。
3. 若需要替换图标，优先让用户从已确认的 iconfont 像素图标合集挑选，再统一接入资产目录。
4. 首页人物舞台和浮动装饰不得进入公共组件默认样式。

## Style Lab 日夜审计规则

- Style Lab 由顶部正式公共组件基准区和下方 `pixel-soft` 实验区组成，日夜模式调整必须同时检查两块。
- 全局 `day / night` 与实验 tone 的实际效果需要同向：tone 按钮必须保持可见且可点击；点击 `cyber-night` 同步切到全局黑夜，点击 `classic / light` 同步切到全局白天，避免同一屏出现黑白分裂。
- 修 Style Lab 的漏色问题时，优先在 Style Lab 页面或实验 CSS 边界内解决，不要把单页问题扩大成公共组件改动。
- 视觉结论必须用截图确认；构建通过只能证明代码没坏，不能证明主题没有漏色。
