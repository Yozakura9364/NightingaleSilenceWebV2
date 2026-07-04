# Style Lab 样式探索页

## 定位

`Style Lab` 是 V2 内部样式探索页。当前正式站点已经确定采用全站像素风，Style Lab 主要用于比较像素风强度、工作台密度和单页特殊风格。它不是正式功能页，也不是用户可见主题切换系统。

## 目标路由

- 隐藏路由：`#/style-lab`
- 不写入 `src/config/site.ts` 的导航配置。
- 不出现在首页、顶部导航或公开工具入口中。

## 当前边界

1. 实验皮肤只用于内部设计比较，不提供用户切换。
2. 实验皮肤必须通过容器选择器或可选 class 隔离，例如 `data-style-preview='pixel-soft'`、`.ns-pixel-*`。
3. 实验皮肤不得覆盖 `body`、`button`、`input`、`a` 等全局标签默认行为。
4. 不引入第三方 UI 组件库或样式依赖。
5. 不修改核心公共组件的 DOM、状态和业务交互。
6. 实验样式文件只能由隐藏实验页或调试页按路由加载，不从 `src/styles/index.css` 全站入口导入。
7. `NSGlamour`、`NSPlate` 等工具页继承全站像素风基础控件，但不默认继承首页舞台式强装饰。

## 日夜模式联动规则

1. 修改 Style Lab 的主题表现时，必须同时检查顶部正式公共组件基准区和下方 `pixel-soft` 实验区，不允许只验证其中一块。
2. 全局 `day / night` 与 `pixel-soft` 的实际生效 tone 需要保持一致：tone 按钮必须保持可见且可点击；点击 `cyber-night` 同步切到全局 `night`，点击 `classic / light` 同步切到全局 `day`，避免出现上半屏黑夜、下半屏白天的黑白分裂。
3. Style Lab 漏色修复优先限制在 `src/pages/style-lab/StyleLabPage.vue` 或 `src/styles/experiments/pixel-soft.css`，不要为了单页实验问题扩大修改公共组件、公共 token 或其他页面。
4. Style Lab 视觉修改不能只靠 `npm run build` 或 `npm run check` 判断；至少需要截图验证白天和黑夜两种状态，确认首屏正式基准区和实验区都符合当前模式。

## 当前实验内容

### 正式公共组件基准区

- 文件：`src/pages/style-lab/StyleLabPage.vue`
- 位置：页面顶部，放在 `data-style-preview='pixel-soft'` 实验容器外。
- 用途：用正式 `theme.css` token 预览 `AppPixelWindow`、`AppToolbar`、`AppButton`、`AppTabs`、`AppField`、`AppStatus` 等公共组件的基准外观。
- 限制：这一块不使用 `.ns-pixel-*` 实验类，不受 `pixel-soft`、`light`、`cyber-night` 实验变量影响。
- 后续迁移 `NSPlate`、`NSGlamour` 时，如果基础控件外观拿不准，先对照这一块。

### pixel-soft

- 文件：`src/styles/experiments/pixel-soft.css`
- 调性：粉/蓝配色、硬边框、像素感阴影、低圆角或无圆角。
- 用途：观察 Pixelium-like 方向是否适合夜莺不语首页、分类入口和轻量工具 UI。
- 限制：作为正式像素风的参考样本和强度试验，不直接覆盖现有 `.ns-button`、`.ns-panel` 默认样式。
- 窗口标题栏保留 `pixel-soft` 原有渐变和轻重，只把装饰点替换为千禧年互联网小窗体感的左侧方块图标、右侧最小化/最大化/关闭方形按钮；图标和按钮颜色跟随当前 tone token 切换。
- 当前包含右上角小菜单弹窗样例，用来观察 `TEAM.EXE` 一类千禧年像素窗口菜单是否适合替代普通顶栏。
- 当前包含 `Pixelarticons` 图标样例，用来观察像素图标在图标文字 bar、纯图标按钮、图标文字按钮和弹窗菜单中的密度、识别度和明暗模式适配。
- 当前包含赛博记事本选择面板样例，用来观察“素材选择器框架 + 紧凑列表 + 现实记事本黑色下划线排版”是否适合作为画布旁边的工作台控件，而不是导出画布内容。
- 当前包含 `pixel-soft-lite` 工作台样例，用来观察当全站采用像素方向时，复杂工具页是否可以保留像素氛围但保持密集、可读、低干扰。

#### 图标试验

- 当前试用图标：Pixelarticons 免费 SVG。
- 来源页面：`https://pixelarticons.com/`。
- 当前接入文件：`src/assets/icons/pixelarticons/`。
- 授权：Pixelarticons 免费包使用 MIT 许可；license 记录保留在 `src/assets/icons/pixelarticons/LICENSE.md`。
- 当前实现：在 Style Lab 中用本地 SVG 作为 CSS mask，使图标颜色继承按钮、bar 和菜单的当前主题色。
- 限制：这只是内部样式试验，不代表正式全站图标库已确定；正式页接入前仍应由用户确认图标集合和使用范围。

#### 字体试验

- 当前试用字体：Fusion Pixel Font / 缝合像素字体。
- 来源仓库：`https://github.com/TakWolf/fusion-pixel-font`。
- 当前接入文件：`public/vendor/fonts/fusion-pixel-font/fusion-pixel-12px-proportional-zh_hans.otf.woff2`。
- 当前选择：`12px`、比例模式、`zh_hans` 语言特定字形、OTF WOFF2 构建。
- 当前文件体积约 713KB，明显大于 Ark Pixel Font 的小字库版本，但更适合中文 UI 预览。
- 授权：字体使用 SIL Open Font License 1.1；许可证文件保留在 `public/vendor/fonts/fusion-pixel-font/OFL.txt`。
- OFL 通常允许免费商用、嵌入和再分发，但不能单独售卖字体本身；若未来修改字体或更换构建产物，需要继续遵守 OFL 约束和保留字体名规则。
- Ark Pixel Font / 方舟像素字体虽然同为 OFL，但当前 16px 中文字形覆盖较少，容易导致中文标题 fallback 到系统字体；Style Lab 暂改用 Fusion Pixel Font 观察完整中文像素 UI 效果。
- 当前已上移为全站 `--ns-font-decorative` 装饰字体 token；`pixel-soft` 继续通过 `--ns-pixel-font` 引用它做内部强度预览。

#### 字体模式

Style Lab 当前提供两个内部预览模式，使用 `data-font-mode` 控制：

- `decorative`：默认模式。像素字体只用于装饰性文字和 UI chrome，例如页面大标题、按钮、标签、窗口标题栏、工具卡标题；正文说明、长文本、输入内容使用正常可读字体。
- `all-pixel`：对比模式。整个实验区域都使用像素字体，用来比较全像素化的氛围和阅读负担。

正式页面优先沿用 `decorative` 思路：像素字体表达氛围，用户需要阅读和操作的长文本保持正常字体。

#### 像素强度模式

Style Lab 当前在 `pixel-soft` 内提供以下内部强度模式，使用 `data-pixel-tone` 控制：

- `classic`：默认模式。保留较明显的像素硬边框、硬阴影、粉蓝背景网格和高识别度按钮。
- `light`：轻像素模式。保留粉蓝和像素字体氛围，但弱化边框颜色、阴影距离、背景网格和面板渐变，用来观察是否更适合正式入口页或更长期耐看的工具入口。
- `cyber-night`：赛博夜色实验。当前方向是深黑底带少量偏色倾向，标题、按钮和窗口 chrome 使用克制的粉/青霓虹 glow，正文和长说明保持低亮可读；只用于用户在 `#/style-lab` 慢慢调色，不直接进入正式主题变量。
- `cyber-night` 的背景光斑、霓虹文字、面板投影、按钮投影、窗口 chrome、菜单舞台等关键视觉参数集中在 `--ns-pixel-cyber-*` token 区，调色优先改 token，不要在组件规则里散落新硬编码。

这不是第二套正式主题，只是 `pixel-soft` 内部的视觉强度对照。正式站点继续使用全站像素风变量承载基础外观。

## 组件展示范围

预览页优先展示：

- 标题层级和说明文字。
- 按钮主次状态。
- 面板和工具卡。
- 输入框、选择框、开关类控件。
- 状态标签、工具栏和轻量提示。

## 验证方式

1. `npm run build` 通过。
2. 浏览器访问 `#/style-lab` 能正常渲染。
3. 正式公共组件基准区不被 `pixel-soft` 的实验 token 改色。
4. 首页、FFXIV 分类页和工具占位页默认外观不受影响。
5. 桌面和移动宽度下预览页无明显溢出、遮挡或文本挤压。
