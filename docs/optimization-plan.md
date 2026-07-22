# Nightingale Silence Web V2 — 项目优化流程文档

> 生成日期：2026-07-21
> 基于代码审查结果，共梳理出 7 大类约 30+ 项优化点，分为 6 个批次逐步推进。

---

## 优化总览

| 批次 | 主题 | 优先级 | 预估工作量 |
|------|------|--------|-----------|
| Batch 1 | 可访问性 + 主题变量修复 | P0 高 | 2-3 天 |
| Batch 2 | 过渡动画与微交互 | P0 高 | 2-3 天 |
| Batch 3 | 性能优化 + 响应式 | P1 中 | 2-3 天 |
| Batch 4 | CSS 统一与清理 | P1 中 | 1-2 天 |
| Batch 5 | 工具页面细节优化 | P2 低 | 3-4 天 |
| Batch 6 | Silence 页面专项优化 | P2 低 | 2-3 天 |

---

## Batch 1：可访问性 + 主题变量修复

### 1.1 键盘导航 — 下拉菜单 (`AppTopNavMenu.vue`)

**问题：** 菜单仅靠 `mouseenter`/`mouseleave` 触发，键盘用户无法展开子菜单。200ms 关闭延迟导致 Tab 进入时菜单先行关闭。

**方案：**
- 增加 `@focus`/`@blur` 事件监听，配合 `focusin`/`focusout` 在下拉菜单获得/失去焦点时控制显隐
- 父链接添加 `@keydown.enter` 和 `@keydown.space` 切换展开状态
- 设置 `aria-expanded` 和 `aria-haspopup="true"` 属性
- 下拉菜单容器添加 `role="menu"`，子项添加 `role="menuitem"`
- 展开时自动聚焦第一个菜单项（`refs[0].$el.focus()`）
- 增加多级悬停/聚焦合并计时器：mouseenter 时清除关闭计时器并打开；mouseleave + 非聚焦子元素时启动 300ms 关闭延迟

### 1.2 弹窗焦点管理 (`AppDialog.vue`, `AppTopNavSettings.vue`)

**问题：** 弹窗打开后焦点不进入、关闭后不返回、背后页面未 `aria-hidden`。

**方案：**
- 创建 `useFocusTrap` composable：接收容器 ref，Tab/Shift+Tab 循环在内部可聚焦元素之间，Escape 释放
- 弹窗 `onMounted` 时自动聚焦确认按钮（或提示框的输入框）
- 弹窗 `onClose` 时将焦点返回触发元素（通过 prop 传入 triggerRef 或记录 `document.activeElement`）
- 弹窗打开时给 `#app` 设置 `aria-hidden="true"` 和 `inert` 属性，关闭后移除

### 1.3 焦点环对比度 (`theme.css` / `theme-night.css`)

**问题：** `--ns-focus-ring` 透明度 42%/32%，叠加后几乎不可见。

**方案：**
- 日间：`--ns-focus-ring: 0 0 0 3px rgba(99, 217, 220, 0.78)`（提高到 78% 透明度）
- 夜间：`--ns-focus-ring: 0 0 0 3px rgba(127, 217, 227, 0.70)`（提高到 70% 透明度）
- 或改用不透明青色 + outline 方案：`outline: 2px solid #63d9dc; outline-offset: 2px`

### 1.4 小字号对比度 (`top-nav.css`)

**问题：** 10px/9px 文字 `#766a83` 在日间背景下对比度不足。

**方案：**
- 将 `--ns-color-text-muted` 从 `#766a83` 改为更深的 `#5a4e67`（计算对比度约 5.2:1，满足 AA）
- 或仅对 `brand-command` 和 `locale-option small` 单独覆盖颜色为 `#5a4e67`

### 1.5 硬编码阴影变量化 (`components.css:125`)

**问题：** `.ns-button:active` 的 `box-shadow` 硬编码 `rgba(42, 33, 56, 0.16)`，夜间不可见。

**方案：**
- `theme.css` 新增：`--ns-pixel-shadow-active: 1px 1px 0 rgba(42, 33, 56, 0.16)`
- `theme-night.css` 覆盖：`--ns-pixel-shadow-active: 1px 1px 0 rgba(0, 0, 0, 0.34)`
- `components.css` 改为：`box-shadow: var(--ns-pixel-shadow-active)`

### 1.6 滚动条高光硬编码 (`base.css:38`, `components.css:89`)

**方案：**
- `theme.css` 新增：`--ns-scroll-thumb-highlight: inset 2px 2px 0 rgba(255, 255, 255, 0.28)`
- 两处改为引用变量
- 夜间可选择性降低高光强度

---

## Batch 2：过渡动画与微交互

### 2.1 路由过渡动画 (`App.vue`)

**方案：**
```vue
<!-- App.vue -->
<Transition name="page" mode="out-in">
  <router-view />
</Transition>
```
```css
/* 全局 CSS 或 App.vue scoped */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
```
- 添加 `prefers-reduced-motion: reduce` 时跳过
- Silence 页面可考虑更丰富的自定义过渡

### 2.2 骨架屏加载态

**方案：**
- 在 **FashionCheckPage**、**NSPlatePage**、**NSGlamourPage**、**ItemCardPage** 的 loading 阶段，使用 `AppLoading` 组件注入骨架屏
- `AppLoading` 接受 `variant="skeleton"` 或现有 `compact`/`md`/`lg` 尺寸
- 内容区域布局确定后，骨架屏匹配内容区域的尺寸（如 3 列卡片骨架、工具栏骨架等）
- 数据到达后 `v-if`/`v-else` 切换，配合 `<Transition name="fade">` 过渡

### 2.3 补齐 `:active` 状态

**需要补充的元素：**
- HomePage 桌面图标 → 加 `&:active { transform: translate(1px, 1px); }`
- HomePage 窗口关闭按钮 → 同上
- AppTopNav brand/config button → 同其他 nav-link 的 `transition`
- AppTopNavMenu 导航链接 → 同下拉链接的 `:active` 样式
- AppTaskbar 所有按钮 → `&:active { box-shadow: inset 1px 1px 0 ... }`

### 2.4 面板打开/关闭动画

- `AppTopNavSettings`：设置面板添加 `<Transition name="panel">`，滑动 + 淡入
- `AppTopNavMenu`：下拉菜单用 `<Transition name="dropdown">`，展开 + 淡入
- `AppDialog`：已有 `app-dialog-fade-in` 动画，但需添加 `prefers-reduced-motion` 检查

### 2.5 任务栏主题切换过渡 (`AppTaskbar.vue`)

**问题：** 太阳/月亮图标瞬间切换。

**方案：** 图标用两层分别放太阳和月亮，通过 `opacity` 交叉淡入淡出过渡，0.3s ease。

---

## Batch 3：性能优化 + 响应式

### 3.1 后台标签页定时器优化 (`useHomeStatusPanel`, `useHomeEffects`)

**方案：**
```ts
// useHomeEffects.ts
onMounted(() => {
  const checkVisibility = () => {
    if (document.hidden) return // 跳过本轮调度
    // 原有逻辑...
  }
  // 定时器链中检查 visibility
})
```
- 或在调度循环中加入 `document.addEventListener('visibilitychange', ...)` 暂停/恢复定时器链
- `useHomeStatusPanel` 同理

### 3.2 拖拽状态全量更新优化 (`useHomeDragWindow`)

**问题：** 每次移动都创建 `{ ...homeWindowPositions.value }` 触发所有窗口重计算。

**方案：** 拖拽中使用非响应式 Map 暂存位移，dragEnd 时一次性提交到 `homeWindowPositions.value`。

### 3.3 移动端视差空转 (`HomePage.vue`)

**方案：** 指针移动处理器中增加 `if (window.innerWidth <= 720) return`，跳过视差计算和 RAF 请求。

### 3.4 响应式断点补充

- **HomePage**：添加 960px 过渡断点，平板下保留窗口但缩小间距
- **FashionCheck**：760px-960px 间增加 2 列布局 @media (max-width: 860px)
- **ItemCard**：900px-1200px 间使用 `minmax(300px, 1fr)` 避免侧边栏跳跃
- **About**：620px-820px 间增加过渡断点，社交链接在窄屏自适应

### 3.5 应用添加 Skip-to-Content (`App.vue`)

```vue
<a href="#main-content" class="ns-sr-only ns-sr-only--focusable">
  跳到主要内容
</a>
<main id="main-content">
  <router-view />
</main>
```
`.ns-sr-only--focusable` 在聚焦时显示（absolute + 高 z-index）

---

## Batch 4：CSS 统一与清理

### 4.1 滚动条样式统一

- `base.css` 中的全局滚动条样式与 `components.css` 中的 `.ns-scroll-area` 样式对齐
- 统一轨道边框宽度为 2px
- 统一滚动条角落背景为 `--ns-scroll-track`
- `.ns-scroll-area--plain` 明确重置角落为 `transparent`

### 4.2 Status 变量补全 (`theme.css` / `components.css`)

- 新增 `--ns-status-success-text`、`--ns-status-warning-text`、`--ns-status-danger-text`
- 在 `theme-night.css` 中补充对应覆盖值
- `components.css` 中新增修饰类 `.ns-status--success`、`.ns-status--warning`、`.ns-status--danger`
- `.ns-status` 基础组件模板增加 `variant` prop 映射到这些类

### 4.3 `a` 标签装饰 (`base.css`)

**问题：** `text-decoration: none; color: inherit` 使链接与普通文本无法区分。

**方案：**
- 保留全局去下划线，但在可识别上下文中增加区别手段
- `.ns-page a:not(.ns-button):not(.app-top-nav__nav-link)` 添加 `text-decoration: underline; text-underline-offset: 2px` 或使用不同颜色
- 或者对文本中的链接用 `font-weight: 500` + `color: var(--ns-color-accent)` 区分

### 4.4 `theme-night.css` 纳入 @layer 体系

**方案：** 改为在 `index.css` 中同时导入日间和夜间主题：
```css
@import './theme.css' layer(theme);
@import './theme-night.css' layer(theme);
```
然后 `theme.ts` 中根据 `data-theme` 切换哪个 layer 生效（或通过 `@layer theme` 内置优先级管理）。

备选：保持动态加载，但确保 `theme-night.css` 开头声明 `@layer theme { ... }` 包裹全部内容。

### 4.5 `prefers-reduced-motion` 清理

- 移除 `top-nav.css:417-421` 中指向不存在的 `.app-top-nav__icon` 的规则
- 检查所有使用了 `transition`/`animation` 的组件，统一添加 `prefers-reduced-motion: reduce` 规则
- HomePage 已有但过于宽泛（移除所有动画），建议细化到只移除装饰性动画，保留功能性过渡

### 4.6 其他 CSS 清理

- 移除 `components.css:138-144` 中 `.ns-button:disabled:hover` 重复块（`pointer-events: none` 即可）
- 修正 `--ns-scrollbar-compact-size` 为 2px（区分紧凑模式）
- `reset.css` 添加 `-webkit-text-size-adjust: 100%`
- 添加 `.ns-eyebrow` 移动端字号调整

---

## Batch 5：工具页面细节优化

### 5.1 NSPlate — 错误重试

**问题：** `errorText` 显示后无重试操作。

**方案：** 在错误消息旁添加`<AppButton variant="secondary" size="compact" @click="retryLoad">重试</AppButton>`，`retryLoad` 重置 `errorText`、触发重新加载。

### 5.2 NSPlate — aria-live 范围缩小

**方案：** 将 `aria-live="polite"` 从 `<section class="nsplate-workspace">` 移到一个专门的状态区域 `<p class="nsplate-workspace__status" aria-live="polite">`。

### 5.3 NSPlate — 面板宽度持久化

**方案：** `resizePanelBy` 回调中将宽度保存到 `localStorage`（key: `nsplate-panel-width`），下次加载时从 localStorage 读取恢复。

### 5.4 NSGlamour — 翻页按钮 transition

**问题：** `transition: none` 导致按钮宽度变化生硬。

**方案：** `.nsglamour-page-turn` 和其内部的 `<small>` 添加 `transition: width 0.25s ease, opacity 0.25s ease, padding 0.25s ease`。

### 5.5 NSGlamour — 模式切换预取

**方案：** 在翻页按钮的 `mouseenter`（桌面）或 `touchstart`（移动）时触发下一页数据的预加载：如果当前是 template 模式则开始加载 equipinfo 数据，反之亦然。

### 5.6 NSGlamour — 模式切换过渡

**方案：** 用 `<Transition name="mode" mode="out-in">` 包裹 `v-if`/`v-else` 的两个 workspace 组件。

### 5.7 ItemCard — 竞态条件修复

**方案：** 将 `importing` 改为 `importLock` ref，操作开始时检查并加锁，完成后释放。连续导入队列化或使用 AbortController 取消前一个。

### 5.8 ItemCard — 对话框加载状态

**方案：** `defineAsyncComponent` 增加 `{ loadingComponent: AppLoading, delay: 200 }`。

### 5.9 ItemCard — 关闭后焦点返回

**方案：** 记录打开前的 `document.activeElement`，关闭后 `focus()` 回去。通过 composable 封装。

### 5.10 FashionCheck — SWR 缓存

**方案：** 将请求结果缓存到 `sessionStorage`，key 为 URL，过期时间为 30 分钟。下次挂载时先取缓存渲染，后台静默刷新。

### 5.11 About — 社交链接过渡

**方案：** `.about-profile__sns-link` 从 `transition: none` 改为 `transition: box-shadow 0.2s ease, background 0.2s ease, transform 0.2s ease`。

### 5.12 About — 外部链接指示器

**方案：** 社交链接旁添加 `<span class="ns-sr-only">（在新标签页中打开）</span>`，视觉上可添加微小的外部链接图标。

---

## Batch 6：Silence 页面专项优化

### 6.1 角色详情页 document.title

**方案：** `SilenceCharacterPage.vue` 中 `onMounted` / `watchEffect` 动态设置 `document.title = \`${character.name} | 夜莺不语 / Nightingale Silence\``，并在 `onUnmounted` 恢复默认标题。

### 6.2 空状态守卫

- `SilenceGroupPage.vue`：在 `currentGroup` 无数据时显示 "该群组暂无角色" 提示和返回首页链接
- `SilenceGatePoster.vue`：`v-for="group in silenceGroups"` 前加 `<template v-if="silenceGroups.length">`，否则显示空状态

### 6.3 prefers-reduced-motion 补全

- `SilenceGatePoster.vue`：添加 `@media (prefers-reduced-motion: reduce)` 禁用 hover 过渡和入场动画
- `SilenceCharacterStage.vue`：同样添加

### 6.4 异步组件加载状态

**方案：** `defineAsyncComponent` 增加 `loadingComponent: AppLoading` 和 `delay: 200`。

### 6.5 移动端角色布局适配

**方案：** 在 920px 断点下：
- `SilenceGroupVisual.vue` 切换为水平可滚动容器（`overflow-x: auto; scroll-snap-type: x mandatory`）
- 每个角色占一整屏宽度（`scroll-snap-align: center`）
- 使用 `scrollbar-width: none` 隐藏滚动条
- 绝对定位的 nameplate 改为相对定位，跟随角色卡片

---

## 执行顺序建议

```
Week 1:  Batch 1 (可访问性) → Batch 2 (过渡动画)
         └── 这两个批次触及面广、影响大，优先完成

Week 2:  Batch 3 (性能 + 响应式)
         └── 优化用户体验的核心体验

Week 3:  Batch 4 (CSS 清理)
         └── 重构性工作，不影响功能但减少未来 tech debt

Week 4:  Batch 5 (工具页面细节)
         └── 每个页面 0.5-1 天，按需调整优先级

Week 5:  Batch 6 (Silence 页面)
         └── 目前未公开上线，可灵活安排
```

每个批次完成后建议：
1. `vue-tsc --noEmit` 类型检查
2. `npm run build` 构建验证
3. 在 dev server 中手动测试受影响页面

---

## 注意事项

- **渐进式修改**：每次只做一个批次，完成后再推进下一个，便于回滚
- **CSS 变量优先**：避免引入额外的运行时开销，用 CSS 自定义属性解决主题适配
- **组件先行**：`useFocusTrap` 等可复用逻辑优先抽取为 composable，而非每个组件重复实现
- **兼容性**：`color-mix()` 仅现代浏览器支持，需保留 fallback；`:focus-visible` 需 polyfill 老旧浏览器
- **测试**：每个批次完成后手动核对日间/夜间双主题显示效果
