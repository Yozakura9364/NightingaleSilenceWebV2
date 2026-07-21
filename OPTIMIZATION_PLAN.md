# 夜莺不语 性能优化与代码重构计划

> 本文档基于项目全量代码审计编写，按阶段组织优化任务。每个阶段可独立交付，阶段内任务按推荐顺序执行。

---

## 阶段总览

| 阶段 | 主题 | 预估工作量 | 影响范围 |
|------|------|-----------|----------|
| 一 | 构建配置与打包策略 | 小 | 所有用户，浏览器缓存 |
| 二 | 组件拆分与懒加载 | 中 | HMR 性能、首屏体积 |
| 三 | 路由与导航优化 | 小 | 导航感知延迟 |
| 四 | 构建脚本重构 | 中 | CI/本地构建可维护性 |
| 五 | CSS 与样式按需加载 | 小 | 首屏 CSS 体积 |
| 六 | lib/ 层重构 | 大 | Canvas 渲染、内存管理、模块导入 |

---

## 阶段一：构建配置与打包策略

### 1.1 添加 vendor chunk 分割策略

**现状**：`vite.config.ts` 中未配置 `build.rollupOptions.output.manualChunks`，Vite 将所有第三方依赖打包到单个 vendor chunk。

**目标**：将框架代码拆分为稳定 chunk，利用浏览器长期缓存。

**文件**：`vite.config.ts`

**操作**：

在 `defineConfig` 返回的配置对象中添加 `build` 字段：

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-vue': ['vue', 'vue-router'],
        'vendor-pinia': ['pinia']
      }
    }
  }
}
```

**验收标准**：
- 构建产物中出现独立的 `vendor-vue` chunk
- `vendor-vue` chunk 在 vue/vue-router 版本不变时 hash 稳定
- 页面路由 chunk 体积不包含框架代码

---

## 阶段二：组件拆分与懒加载

### 2.1 拆分 HomePage.vue（~3,806 行）

**现状**：`src/pages/home/HomePage.vue` 包含 template 415 行、script 892 行、style 2,894 行，是项目中最大的单文件组件。

**目标**：将脚本逻辑抽取为 composables，将样式按主题/动画/布局拆分。

**操作步骤**：

1. **抽取窗口拖放逻辑** → `src/pages/home/composables/useHomeDragWindow.ts`
   - 提取窗口标题栏拖拽、定位、z-index 管理逻辑
   - 测试：拖拽行为与拆分前一致

2. **抽取动画/闪烁效果逻辑** → `src/pages/home/composables/useHomeEffects.ts`
   - 提取状态指示器闪烁、文字扫描线等定时动画
   - 测试：动画触发时机与视觉效果一致

3. **抽取模拟终端/状态面板逻辑** → `src/pages/home/composables/useHomeStatusPanel.ts`
   - 提取模拟状态指标数据生成逻辑
   - 测试：状态数据刷新频率与内容一致

4. **拆分样式文件**
   - `src/pages/home/styles/layout.css` — 页面布局与骨架样式
   - `src/pages/home/styles/animations.css` — 关键帧动画
   - `src/pages/home/styles/theme.css` — 主题相关覆盖
   - 通过 HomePage.vue 中的多个 `<style>` 块或单独 `@import` 引入

**验收标准**：
- HomePage.vue script 部分减少至 300 行以下
- 各 composable 可独立单元测试
- 页面功能与视觉无回归

### 2.2 拆分 NSArmoireStoreReviewPage.vue（~2,095 行）

**现状**：`src/pages/armoire/NSArmoireStoreReviewPage.vue` 混含大量表单逻辑、搜索过滤、补丁生成逻辑。

**操作步骤**：

1. **抽取搜索/过滤逻辑** → `src/pages/armoire/composables/useArmoireStoreReviewFilter.ts`
2. **抽取补丁生成逻辑** → `src/pages/armoire/composables/useArmoireStoreReviewPatch.ts`
3. **抽取候选评分逻辑** → `src/pages/armoire/composables/useArmoireStoreReviewCandidate.ts`

**验收标准**：
- NSArmoireStoreReviewPage.vue script 减少至 600 行以下
- 三个 composable 可独立测试

### 2.3 补充 defineAsyncComponent

**现状**：所有非页面组件（模态框、弹窗、大型面板）在当前页面模块内是静态导入的。

**目标**：对非常驻 UI 组件使用 `defineAsyncComponent` 包装。

**需要检查的文件**（逐一扫描并评估）：

| 路径 | 评估要点 |
|------|---------|
| `src/pages/armoire/components/NSArmoireProcessDialog.vue` | 弹窗，非首屏必需 |
| `src/pages/armoire/components/NSArmoireImportPanel.vue` | 导入面板，按需使用 |
| `src/pages/glamour/components/NSGlamourTemplateSelectorDialog.vue` | 模板选择弹窗 |
| `src/pages/glamour/components/NSGlamourTemplateImportDialog.vue` | 导入弹窗 |
| `src/pages/plate/components/NSPlateCropDialog.vue` | 裁剪弹窗 |
| `src/pages/item-card/components/ItemCardImportDialog.vue` | 导入弹窗 |
| `src/pages/item-card/components/ItemCardTextImportDialog.vue` | 文本导入弹窗 |

**模式**：

```ts
// 改造前
import MyDialog from './MyDialog.vue'

// 改造后
const MyDialog = defineAsyncComponent(() => import('./MyDialog.vue'))
```

**注意事项**：
- 对于高频使用的组件（如设备编辑器），保持静态导入
- 对于打开即有显著延迟的弹窗，配合加载状态组件使用

**验收标准**：
- 各页面首屏 chunk 体积减小（减少值 = 被延迟加载组件的体积）
- 弹窗打开时按需加载，无功能性回退

---

## 阶段三：路由与导航优化

### 3.1 添加路由级 prefetch

**现状**：Vite 仅对视口内动态导入链接生成 `<link rel="modulepreload">`，没有自定义预取策略。

**目标**：对高概率访问页面在空闲时预取 chunk，减少导航延迟。

**文件**：`src/router/index.ts`

**操作**：

添加空闲时预取逻辑：

```ts
// 在路由定义后，使用 requestIdleCallback 预取高概率页面
const prefetchRoutes = ['ffxiv-plate', 'ffxiv-glamour-template', 'ffxiv-armoire']

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    for (const routeName of prefetchRoutes) {
      const route = router.resolve({ name: routeName })
      // Vite 的动态导入可以通过解析组件路径触发预加载
      // route.component 本身是懒加载函数，调用即可触发 preload
    }
  })
}
```

> **注意**：Vite 的 `modulepreload` 机制已覆盖视口内链接。此优化针对非视口但高概率点击的目标。实现前请用构建分析工具验证当前预取覆盖情况。

**验收标准**：
- 目标页面的导航延迟降低（可通过 DevTools Network 面板验证）
- 不影响首屏加载性能（使用空闲时调度）

---

## 阶段四：构建脚本重构

### 4.1 抽取公共工具函数

**现状**：`parseCsv`、`readJson`、`cleanText`、`parseInteger` 等函数在多个脚本中重复实现。

**目标**：将高频工具函数抽取到共享模块。

**操作**：

1. 创建 `scripts/lib/shared.mjs`：

```js
// 集中提供以下函数（从各脚本现有实现中提取，保持签名兼容）：
// - parseCsv(text, options?)
// - readJson(path, options?)
// - cleanText(text)
// - parseInteger(value)
// - loadSheetRows(basePath, sheetName)
// - normalizeBaseUrl(url)
```

2. 逐个修改引用脚本，将本地定义替换为 `import from '../lib/shared.mjs'`

**涉及文件**：

| 函数 | 重复次数 | 涉及文件 |
|------|---------|---------|
| `parseCsv` | 4 | `build-armoire-catalog.mjs`, `audit-armoire-store-coverage.mjs`, `build-armoire-store-catalog.mjs`, `fashion-check/lib/csv.mjs` |
| `readJson` | 6 | 多个 armoire 构建脚本 |
| `cleanText` | 5 | 多个构建脚本 |
| `parseInteger` | 4 | 多个构建脚本 |
| `normalizeBaseUrl` | 2 | `build-nsplate-manifest.mjs`, `build-nsplate-thumbnails.mjs` |
| `loadSheetRows` | 3 | 多个 armoire 脚本 |

**验收标准**：
- `scripts/` 目录下无重复的工具函数定义
- 各脚本功能不变

### 4.2 同步 I/O 迁移为异步

**现状**：`check-release-readiness.mjs`、`check-ui-copy.mjs`、`check-ui-locales.mjs` 使用 `readFileSync`/`readdirSync`/`statSync`。

**目标**：迁移为 `fs.promises` API，与其他脚本保持一致。

**文件**：

| 文件 | 需改造的函数调用 |
|------|----------------|
| `scripts/check-release-readiness.mjs` | `readFileSync`, `readdirSync`, `existsSync`, `statSync`（含递归 walk） |
| `scripts/check-ui-copy.mjs` | `readFileSync`, `readdirSync`, `statSync` |
| `scripts/check-ui-locales.mjs` | `readFileSync`, `readdirSync`, `statSync` |

**改造模式**：

```js
// 改造前
const data = readFileSync(path, 'utf-8')
const items = readdirSync(dir)

// 改造后
const data = await fs.readFile(path, 'utf-8')
const items = await fs.readdir(dir)
```

**验收标准**：
- 三个脚本功能不变
- 改造后不再有同步 I/O 调用

---

## 阶段五：CSS 与样式按需加载

### 5.1 夜间主题样式按需注入

**现状**：`src/styles/theme.css`（337 行）同时包含 day 和 night 两种主题的全部 CSS 自定义属性，所有属性在初始加载时全量注入。

**目标**：延迟加载夜间主题样式，仅首次访问/切换时注入。

**操作**：

1. 将 `src/styles/theme.css` 拆分为：
   - `src/styles/theme.css` — 保留 `:root`（day 主题）和 `@font-face`
   - `src/styles/theme-night.css` — 仅包含 `:root[data-theme='night']` 块

2. 在 `src/stores/theme.ts` 中动态加载夜间主题：

```ts
let nightThemeLoaded = false

async function ensureNightTheme() {
  if (nightThemeLoaded) return
  nightThemeLoaded = true

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = new URL('@/styles/theme-night.css', import.meta.url).href
  document.head.appendChild(link)
}

function setThemeMode(mode: ThemeMode) {
  current.value = mode
  localStorage.setItem(THEME_KEY, mode)
  applyThemeMode(mode)

  if (mode === 'night') {
    ensureNightTheme()
  }
}
```

**验收标准**：
- 日间模式不加载夜间主题 CSS
- 切换到夜间模式时注入样式，无闪烁
- 初次访问夜间模式时延迟加载不影响页面渲染

---

## 阶段六：lib/ 层重构

### 6.1 消除 Barrel Export

**现状**：`src/lib/glamour/templates/index.ts` 使用 `export * from` 批量导出 9 个子模块（含 2852 行的 `renderer.ts`），任何模板功能的使用都会触发整个渲染管线的全量导入。

**目标**：改为按需导入具体模块。

**操作**：

1. 识别所有引用 `@/lib/glamour/templates` 的文件：

```bash
grep -r "from '@/lib/glamour/templates'" src/
grep -r "from '@/lib/glamour/templates/index'" src/
```

2. 将每个引用替换为具体模块路径：

```ts
// 改造前
import { renderGlamourTemplateCanvas } from '@/lib/glamour/templates'

// 改造后
import { renderGlamourTemplateCanvas } from '@/lib/glamour/templates/renderer'
```

3. 保留 `templates/index.ts` 作为兼容入口（标记 `@deprecated`），待所有引用更新后删除。

**验收标准**：
- 各页面只导入实际使用的模板模块
- 不需要渲染功能的页面不包含 `renderer.ts`

### 6.2 2852 行 renderer.ts 拆分

**现状**：`src/lib/glamour/templates/renderer.ts` 是项目中最大的单文件（不含 CSS），包含 7 种模板渲染器、10+ 辅助函数和 6 个布局常量对象。

**目标**：按模板类型拆分为独立文件。

**操作**：

拆分结构：

```
src/lib/glamour/templates/renderer/
  index.ts              # 重新导出，保持向后兼容
  types.ts              # 渲染相关类型定义
  layouts.ts            # 6 个布局常量（EORZEA_TEMPLATE, HORIZONTAL_TEMPLATE 等）
  utils.ts              # 通用渲染辅助函数（drawTextWithTracking, fitCanvasFont 等）
  render-eorzea.ts      # Eorzea 模板渲染器
  render-horizontal.ts  # Horizontal 模板渲染器
  render-double-pic.ts  # Double-Pic 模板渲染器
  render-risingstones.ts
  render-ec.ts
  render-silence.ts
  canvas.ts             # 底层 Canvas 操作（resample, luminance mask, 等）
```

**注意事项**：
- 确保拆分后函数签名与调用方完全兼容
- 建立 `index.ts` 兼容导出，避免一次修改所有调用方
- 后续逐步迁移各调用方到具体路径

**验收标准**：
- 无单个文件超过 500 行
- 各渲染器可独立导入
- 构建产物无回归

### 6.3 全局图像缓存添加 LRU 限制

**现状**：`infoLayerTextRenderer.ts` 和 `renderer.ts` 中的模块级 `Map` 缓存无大小限制，随会话时长无限增长。

**目标**：添加 LRU（最近最少使用）淘汰策略。

**文件**：

| 文件 | 缓存变量名 | 行号 |
|------|-----------|------|
| `src/lib/plate/infoLayerTextRenderer.ts` | `infoTextImageCache` | ~61 |
| `src/lib/glamour/templates/renderer.ts` | `glamourTemplateLuminanceMaskCache` | ~424 |

**操作**：

1. 创建可复用的 LRU 缓存工具：

```ts
// src/lib/utils/lruCache.ts
export function createLruCache<K, V>(maxSize: number = 50): Map<K, V> {
  const cache = new Map<K, V>()

  return new Proxy(cache, {
    get(target, prop) {
      const value = Reflect.get(target, prop)
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = value.apply(target, args)

          // 在 set 后检查大小
          if (prop === 'set' && target.size > maxSize) {
            const oldest = target.keys().next()
            if (!oldest.done) {
              target.delete(oldest.value)
            }
          }

          return result
        }
      }
      return value
    }
  })
}
```

2. 将现有 `new Map()` 替换为 `createLruCache(50)`（最大 50 条）

3. 或在路由切换时（`router.afterEach`）清空缓存

**验收标准**：
- 缓存大小存在上限，不会无限增长
- 频繁使用的缓存条目不受影响
- 旧条目自动淘汰，无内存泄漏

### 6.4 Canvas 导出路径内存优化

**现状**：`layeredExport.ts` 中每层调用 `canvas.toDataURL('image/png')` + Blob + Uint8Array，20-30 层 × 2x 分辨率下峰值内存可达 300MB+。

**目标**：降低内存峰值。

**操作**：

1. **使用 canvas.toBlob() 替代 toDataURL()**：`toBlob` 返回的 Blob 不需要中间字符串表示，减少内存占用。

2. **使用 OffscreenCanvas（现代浏览器）**：将 Canvas 操作迁移到 OffscreenCanvas，避免主线程阻塞：

```ts
if ('OffscreenCanvas' in window) {
  const offscreen = new OffscreenCanvas(width, height)
  const ctx = offscreen.getContext('2d')!
  // ... 渲染操作 ...
  const blob = await offscreen.convertToBlob({ type: 'image/png' })
}
```

3. **逐层压缩编码，逐层释放**：处理完一层后立即释放引用，不持有所有层的 Blob：

```ts
const zipBlobs: { name: string; data: Uint8Array }[] = []

for (const layer of layers) {
  const blob = await renderLayerToBlob(layer)  // 每层独立编码
  const buffer = await blob.arrayBuffer()
  zipBlobs.push({ name: layer.name, data: new Uint8Array(buffer) })
  // blob 和 buffer 在此迭代结束后可被 GC
}
```

4. **使用流式 ZIP 写入**（如果 JSZip 可用时）：避免在内存中构建完整 ZIP 后再写入。

**验收标准**：
- 导出相同内容的峰值内存降低 50% 以上
- 导出速度不慢于改造前
- 兼容现有浏览器（降级方案）

### 6.5 图像串行加载改为并行

**现状**：`canvasRenderer.ts` 和 `infoLayerImageRenderer.ts` 中层叠图像使用 `await loadImage()` 串行加载，对 20+ 层跨域图片产生累计延迟。

**目标**：使用 `Promise.all` 并行加载无依赖的 image 层。

**文件**：

| 文件 | 相关函数 |
|------|---------|
| `src/lib/plate/canvasRenderer.ts` | `drawLayers`, `renderNameplatePlan` |
| `src/lib/plate/infoLayerImageRenderer.ts` | `drawNSPlateInfoGraphicLayers` |

**操作**：

对于无渲染顺序依赖的图层：

```ts
// 改造前
for (const layer of layers) {
  const img = await loadImage(layer.src)
  ctx.drawImage(img, ...)
}

// 改造后——先并行加载所有图片
const images = await Promise.all(
  layers.map(layer => loadImage(layer.src))
)

// 再按序绘制
for (let i = 0; i < layers.length; i++) {
  ctx.drawImage(images[i], ...)
}
```

> **注意**：仅适用于渲染顺序与加载顺序无关的图层。如果底层图层必须先绘制（影响上层 blend 效果），仍须串行。

**验收标准**：
- 多图层渲染时总加载时间显著减少
- 渲染结果与改造前完全一致（像素级对比）

### 6.6 localStorage 读取缓存

**现状**：`src/lib/glamour/equipment.ts` 中 `shouldIgnoreEmperorItems()` 每次 `getVisibleEquipmentEntries()` 调用时都读取 localStorage。

**目标**：结果缓存到内存中，只在值变更时重新读取。

**操作**：

```ts
// 改造前
export function shouldIgnoreEmperorItems(): boolean {
  return localStorage.getItem('ns-glamour-ignore-emperor') === 'true'
}

// 改造后
let cachedIgnoreEmperor: boolean | null = null

export function shouldIgnoreEmperorItems(): boolean {
  if (cachedIgnoreEmperor === null) {
    cachedIgnoreEmperor = localStorage.getItem('ns-glamour-ignore-emperor') === 'true'
  }
  return cachedIgnoreEmperor
}

export function invalidateIgnoreEmperorCache(): void {
  cachedIgnoreEmperor = null
}
```

在触发值变更的入口处调用 `invalidateIgnoreEmperorCache()`（如设置面板的保存回调）。

**验收标准**：
- `shouldIgnoreEmperorItems()` 在会话中只读取一次 localStorage
- 值变更后能正确刷新

---

## 附录：各阶段依赖关系

```
阶段一（构建配置）
  └── 无前置依赖
阶段二（组件拆分）
  └── 无前置依赖
阶段三（路由优化）
  └── 无前置依赖
阶段四（构建脚本）
  └── 无前置依赖
阶段五（CSS 按需加载）
  └── 无前置依赖
阶段六（lib/ 层重构）
   ├── 6.1（消除 barrel）→ 前置依赖：阶段二（减少改动冲突的可能）
   ├── 6.2（renderer 拆分）→ 前置依赖：6.1
   ├── 6.3（缓存 LRU）→ 无前置依赖
   ├── 6.4（Canvas 内存）→ 无前置依赖
   ├── 6.5（并行加载）→ 无前置依赖
   └── 6.6（localStorage 缓存）→ 无前置依赖
```

**推荐执行顺序**：

1. 阶段一（1 行配置，立即收益）
2. 阶段五（CSS 按需加载，低风险）
3. 阶段三（路由 prefetch，低风险）
4. 阶段四（脚本重构，独立于前端）
5. 阶段二 + 阶段六（前端重构，可并行推进）
