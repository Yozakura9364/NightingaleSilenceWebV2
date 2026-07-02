# Style Lab 样式探索页

## 定位

`Style Lab` 是 V2 内部样式探索页，用于在正式站点视觉定稿前比较候选皮肤效果。它不是正式功能页，也不是用户可见主题切换系统。

## 目标路由

- 隐藏路由：`#/style-lab`
- 不写入 `src/config/site.ts` 的导航配置。
- 不出现在首页、顶部导航或公开工具入口中。

## 当前边界

1. 候选皮肤只用于内部设计比较，不提供用户切换。
2. 候选皮肤必须通过容器选择器或可选 class 隔离，例如 `data-style-preview`、`.ns-pixel-*`。
3. 候选皮肤不得覆盖 `body`、`button`、`input`、`a` 等全局标签默认行为。
4. 不引入第三方 UI 组件库或样式依赖。
5. 不修改核心公共组件的 DOM、状态和业务交互。
6. `NSGlamour`、`Plate` 等工具页不默认继承强像素装饰。

## 当前候选皮肤

### pixel-soft

- 文件：`src/styles/experiments/pixel-soft.css`
- 调性：粉/蓝配色、硬边框、像素感阴影、低圆角或无圆角。
- 用途：观察 Pixelium-like 方向是否适合夜莺不语首页、分类入口和轻量工具 UI。
- 限制：不作为正式全站主题，不直接覆盖现有 `.ns-button`、`.ns-panel` 默认样式。

#### 字体试验

- 当前试用字体：Fusion Pixel Font / 缝合像素字体。
- 来源仓库：`https://github.com/TakWolf/fusion-pixel-font`。
- 当前接入文件：`public/vendor/fonts/fusion-pixel-font/fusion-pixel-12px-proportional-zh_hans.otf.woff2`。
- 当前选择：`12px`、比例模式、`zh_hans` 语言特定字形、OTF WOFF2 构建。
- 当前文件体积约 713KB，明显大于 Ark Pixel Font 的小字库版本，但更适合中文 UI 预览。
- 授权：字体使用 SIL Open Font License 1.1；许可证文件保留在 `public/vendor/fonts/fusion-pixel-font/OFL.txt`。
- OFL 通常允许免费商用、嵌入和再分发，但不能单独售卖字体本身；若未来修改字体或更换构建产物，需要继续遵守 OFL 约束和保留字体名规则。
- Ark Pixel Font / 方舟像素字体虽然同为 OFL，但当前 16px 中文字形覆盖较少，容易导致中文标题 fallback 到系统字体；Style Lab 暂改用 Fusion Pixel Font 观察完整中文像素 UI 效果。
- 当前只作用于 `[data-style-preview='pixel-soft']`，不进入正式全站字体栈。

#### 字体模式

Style Lab 当前提供两个内部预览模式，使用 `data-font-mode` 控制：

- `decorative`：默认模式。像素字体只用于装饰性文字和 UI chrome，例如页面大标题、按钮、标签、窗口标题栏、工具卡标题；正文说明、长文本、输入内容使用正常可读字体。
- `all-pixel`：对比模式。整个候选皮肤区域都使用像素字体，用来比较全像素化的氛围和阅读负担。

后续如果把候选皮肤载入正式页面，优先沿用 `decorative` 思路：像素字体表达氛围，用户需要阅读和操作的长文本保持正常字体。

#### 像素强度模式

Style Lab 当前在 `pixel-soft` 内提供两个内部强度模式，使用 `data-pixel-tone` 控制：

- `classic`：默认模式。保留较明显的像素硬边框、硬阴影、粉蓝背景网格和高识别度按钮。
- `light`：轻像素模式。保留粉蓝和像素字体氛围，但弱化边框颜色、阴影距离、背景网格和面板渐变，用来观察是否更适合正式入口页或更长期耐看的工具入口。

这不是第二套正式主题，只是 `pixel-soft` 候选皮肤内的视觉强度对照。后续如果选定其中一个方向，再把结果整理成正式页面样式。

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
3. 首页、FFXIV 分类页和工具占位页默认外观不受影响。
4. 桌面和移动宽度下预览页无明显溢出、遮挡或文本挤压。
