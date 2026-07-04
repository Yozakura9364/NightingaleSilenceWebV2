# Silence 子项目优化计划

## 范围

本计划只评估 `Silence` 创作/角色档案子项目，不包含 `NSPlate`、`NSGlamour`、`NSArmoire` 等 FFXIV 工具。

评估范围：

- `src/pages/silence/`
- `src/data/silence/`
- Silence 相关路由、站点配置和本地化 key
- Silence 当前本地预览立绘规则
- 未来正式图片接入后的服务器资源和图片流量风险

当前结论基于 2026-07-04 的代码状态。Silence 当前没有后端 API，没有数据库，没有服务端渲染，也没有运行时图片处理服务。

## 当前结构快照

当前主要文件体积：

| 文件 | 行数 | 说明 |
|------|------|------|
| `src/pages/silence/components/SilenceGatePoster.vue` | 约 406 | Silence 入口页标题浮层、左右分割海报、六人预览和 glitch 占位 |
| `src/pages/silence/components/SilenceCharacterStage.vue` | 约 304 | 单角色详情页首屏主视觉、基础资料摘要和页内锚点入口 |
| `src/pages/silence/components/SilenceGroupVisual.vue` | 约 299 | `angel` / `glitch` 分组立绘 / 窗口舞台组件 |
| `src/pages/silence/components/SilenceViiokoPrototype.vue` | 约 1278 | Salvance 的 dev-only Viioko 样式原型；模板和 scoped CSS 仍偏大，资料模型已拆出 |
| `src/pages/silence/composables/useSilenceViiokoPrototypeModel.ts` | 约 261 | Viioko 原型的资料取数、可见内容过滤和四种示意页配置生成 |
| `src/pages/silence/SilenceGroupPage.vue` | 约 205 | 分组页状态、路由打开逻辑和页面壳 |
| `src/pages/silence/components/SilenceCharacterDetails.vue` | 约 188 | 单角色详情页下滑资料区块组合 |
| `src/pages/silence/SilenceCharacterPage.vue` | 约 165 | 单角色详情页路由取数、关系适配和页面组装 |
| `src/pages/silence/components/SilenceTurnHint.vue` | 约 126 | 左右翻页渐变蒙版 |
| `src/data/silence/draftCharacterContent.ts` | 约 116 | 测试占位资料骨架和占位关系生成 |
| `src/data/silence/characters.ts` | 约 83 | 角色类型、数据组装和查询 helper |
| `src/data/silence/characterSeeds.ts` | 约 62 | 六个 `angel` 角色基础种子和 dev-only 本地预览路径 |
| `src/data/silence/navigation.ts` | 约 59 | 横向翻页线性顺序和邻居查询 |
| `src/pages/silence/SilenceIndexPage.vue` | 约 40 | Silence 入口页背景外壳 |

当前构建产物中，Silence 专属 chunk 约 `46.79 KB` 原始大小，不含全站共享入口 chunk。最近一次构建输出显示全站共享入口约 `168 KB` JS、`22 KB` CSS，gzip 后约 `59 KB` JS、`5 KB` CSS。Silence 自身 JS/CSS 当前不是主要性能压力。

当前根目录本地预览立绘：

| 图片 | 大小 |
|------|------|
| `chihaya-art-1.png` | 约 3.07 MB |
| `goelia-art-1.png` | 约 2.90 MB |
| `ney-art-1.png` | 约 2.80 MB |
| `nightingale-art-1.png` | 约 2.75 MB |
| `salvance-art-1.png` | 约 2.51 MB |
| `glynne-art-1.png` | 约 2.00 MB |
| 合计 | 约 15.29 MB |

这些图片当前被 `.gitignore` 的 `/*-art-*` 规则忽略，并且在 `characterSeeds.ts` 中通过 `import.meta.env.DEV` 限定为本地预览路径，生产构建不会静态 import 这些本地预览图。

## 结构与耦合评估

### 做得比较好的部分

1. **页面路由已经 lazy import**

   `#/silence`、`#/silence/angel`、`#/silence/glitch` 和角色详情页都由 Vue Router 按路由懒加载，不会在首屏一次加载全部 Silence 页面。

2. **角色详情采用“一个模板 + 一份数据”**

   当前没有为每个角色创建独立页面组件，`#/silence/angel/:characterId` 统一走 `SilenceCharacterPage.vue`，这是正确方向。

3. **Silence 当前无后端运行成本**

   当前没有 `fetch`、没有 API、没有数据库、没有 `localStorage` 草稿，也没有服务端图片处理。生产环境只需要静态文件托管。

4. **本地预览图片没有进入生产构建**

   立绘路径被限定在 `import.meta.env.DEV`，且图片文件被 `.gitignore` 忽略，符合当前资产规则。

5. **横向翻页规则已抽到数据层**

   `src/data/silence/navigation.ts` 统一维护线性顺序和邻居页面，比在多个页面里手写左右链接更稳定。

### 当前主要耦合点

1. **入口海报组件仍偏大，部分视觉组件接近警戒线**

   `SilenceIndexPage.vue`、`SilenceCharacterPage.vue` 和 `SilenceGroupPage.vue` 已拆到页面组装层，当前主要体量集中在 `SilenceGatePoster.vue`、`SilenceCharacterStage.vue` 和 `SilenceGroupVisual.vue`。超量主要来自组件专属 CSS，而不是复杂业务逻辑。短期不一定要继续拆到很碎，但正式素材和移动端细节进入前，`SilenceGatePoster.vue` 仍可能继续拆成标题浮层、angel 预览和 glitch 预览等更小组件。

2. **`SilenceGroupVisual.vue` 同时承担 `angel` 和 `glitch` 两种视觉**

   当前舞台组件内用 `groupId` 分支渲染六人立绘舞台和 glitch 双人窗口。现在规模还可控；如果 glitch 组后续接入正式角色、窗口互动或特殊动画，应继续拆成 `SilenceAngelStage` / `SilenceGlitchStage`，避免一个舞台组件继续变成分支集合。

3. **测试占位内容已从角色基础种子中拆出**

   `characterSeeds.ts` 只维护角色 ID、名字、代表色和 dev-only 本地预览立绘路径；`draftCharacterContent.ts` 维护 `textKeys.placeholder`、测试资料区块和占位关系。正式内容接入后，仍建议继续把正式字段和临时占位字段分层，避免角色档案数据只能服务当前 UI 文案结构。

4. **本地预览图片路径仍是临时约定**

   `goelia: '/goelia-art-1.png'` 这种路径适合本机试图，目前集中在 `characterSeeds.ts`。正式资产接入前应迁移为图片 manifest 或角色 images 字段，区分舞台图、详情图、缩略图、差分图。

5. **动态路由字符串没有完全配置化**

   `/silence/angel/:characterId` 和 `/silence/glitch/:characterId` 仍写在 `router/index.ts`。这不是严重问题，但如果后续 Silence 路由继续扩展，建议集中到 Silence 路由 helper 或配置里，减少路径散落。

6. **旧交互描述已完成第一轮清理**

   `silence.md` 已按当前横向翻页规则清理“进入档案按钮”“返回入口”“信息浮层”等旧建议文字。后续如果交互再次调整，应继续优先以“已确认横向翻页规则”为准同步文档。

## 服务器资源评估

### 当前阶段

Silence 当前基本不消耗服务器 CPU 和内存：

- 无后端 API。
- 无数据库查询。
- 无服务端图片转码。
- 无用户上传或鉴权。
- 运行时只是托管 Vue 静态文件和少量 SVG/CSS/JS。

当前服务器压力主要来自：

1. 静态文件带宽。
2. 浏览器缓存命中率。
3. 未来正式立绘和差分图的图片体积。

如果部署到 Nginx、对象存储或 CDN，当前 Silence 的 JS/CSS 体积很轻，服务器资源不是瓶颈。

### 未来正式图片接入后的风险

如果把当前 6 张 PNG 级别的原图直接作为公开素材使用，冷加载成本会很高：

- `#/silence` 和 `#/silence/angel` 当前都会在首屏展示六人群像，若直接使用原图，首屏可能触发约 `15.29 MB` 图片下载。
- 单角色详情页会加载单张立绘，约 `2-3 MB`。
- 如果未来加入表情差分、服装差分、旧设图、关系图和 gallery，图片流量会快速超过 JS/CSS。

粗略估算：

| 冷访问量 | 如果每次首屏下载 15.29 MB | 说明 |
|----------|----------------------------|------|
| 100 次 | 约 1.5 GB | 小范围预览仍可接受，但移动端体验偏重 |
| 1,000 次 | 约 15 GB | 个人站也会开始明显消耗流量 |
| 10,000 次 | 约 153 GB | 需要 CDN、缓存和图片衍生版本 |

浏览器缓存会降低重复访问成本，但首次访问、移动网络、跨设备访问和缓存失效仍会受影响。

## 图片与流量优化原则

正式图片接入前必须先做图片资产计划，不要直接把大 PNG 原图放进 `public` 或 `src/assets`。

建议把图片分成三类：

| 类型 | 用途 | 建议体积目标 |
|------|------|--------------|
| 舞台图 | `#/silence`、`#/silence/angel` 群像/大立绘 | 单人约 300-800 KB，按桌面/移动分尺寸 |
| 详情主图 | 单角色详情首屏立绘 | 单张约 500-1200 KB |
| 缩略图 / gallery 预览 | 关系、图像资料、列表 | 单张约 80-250 KB |

格式建议：

- 优先生成 `webp`，条件允许时额外生成 `avif`。
- 保留私有原图，不进入公开构建产物。
- 公开图只放已清理 EXIF、已压缩、已确认可公开的衍生版本。
- 对同一张角色图提供至少桌面和移动两个尺寸。

前端加载建议：

- 舞台首屏主图可以 `eager`，但不要一次预加载所有高分辨率差分。
- 非首屏 gallery 使用 `loading="lazy"`。
- 使用 `<picture>`、`srcset`、`sizes` 让移动端拿小图。
- `#/silence` 和 `#/silence/angel` 如果使用同一批舞台图，应尽量复用相同 URL，让浏览器缓存命中。
- 当前页只需要轮廓或背景时，使用更小的舞台专用裁切图，不要复用详情页超大透明全身图。

服务端缓存建议：

- Vite hash 资产：`Cache-Control: public, max-age=31536000, immutable`。
- `public/assets/silence/v<version>/...` 这类版本化路径：同样可长缓存。
- HTML：短缓存或 no-cache，保证新版本入口可更新。
- JS/CSS/SVG：开启 gzip 或 brotli。
- 大图：建议走 CDN 或对象存储；至少要有强缓存和 ETag。

## 优化路线

### 阶段 1：结构减压

目标：不改变视觉和交互，只降低页面文件膨胀风险。

建议拆分：

- 已完成：抽 `useSilenceTurnNavigation(route.path)`，封装 `getSilenceTurnNeighbors`、左右 label 和 route。
- 已完成：从 `SilenceGroupPage.vue` 拆出 `SilenceGroupVisual.vue`，先承接 `angel` 和 `glitch` 的共用舞台。
- 已完成：从 `SilenceCharacterPage.vue` 拆出 `SilenceCharacterStage.vue` 和 `SilenceCharacterDetails.vue`。
- 已完成：从 `SilenceIndexPage.vue` 拆出 `SilenceGatePoster.vue`。
- 待后续复杂化时再做：如果入口海报继续加入正式图切换、动效或更多交互，再从 `SilenceGatePoster.vue` 细拆标题浮层、angel 预览和 glitch 预览组件。
- 待后续复杂化时再做：如果 `angel` / `glitch` 舞台差异继续变大，再从 `SilenceGroupVisual.vue` 细拆 `SilenceAngelStage.vue` 和 `SilenceGlitchStage.vue`。
- 已完成：从 `SilenceViiokoPrototype.vue` 拆出 `useSilenceViiokoPrototypeModel.ts`，让 dev-only Viioko 原型的资料过滤、占位 fallback 和四种比例示意页配置不再混在 Vue 模板脚本里。
- 待后续复杂化时再做：如果 Viioko 原型继续调整版式，可继续拆 `SilenceViiokoPrototype.vue` 的样式文件或局部样张组件；但在样式还高频试错时，暂时保留同一个 scoped CSS 更方便快速对照视觉。

验收标准：

- 三个页面文件尽量回到 300 行左右，或至少把 CSS/模板复杂度下沉到语义明确的私有组件。
- 不改变路由、不改变当前可见交互。
- `npm run check:i18n`、`npm run build` 和 `#/silence`/`#/silence/angel`/角色详情页浏览器验证通过。

### 阶段 2：内容数据解耦

目标：让正式角色资料不被占位 UI 结构绑死。

建议：

- 已完成：把 `characters.ts` 中的测试占位块拆到 `draftCharacterContent.ts`，角色基础种子拆到 `characterSeeds.ts`，`characters.ts` 只保留类型、组装和查询 helper。
- 给角色图片字段建立明确结构，例如：

```ts
images: {
  stage?: SilenceImageSet
  hero?: SilenceImageSet
  thumbnail?: SilenceImageSet
  gallery?: SilenceGalleryItem[]
}
```

- 区分 `labelKey`、用户正式文本和占位文本。正式文案确认前仍只能使用 `占位用，待编辑`。
- 把动态路由 helper 固化，例如 `getSilenceGroupRoute(groupId)`、`getSilenceCharacterRoute(character)`。

验收标准：

- 新增角色主要改数据，不需要改页面模板。
- 页面不会渲染 `private` 或未确认公开的字段。
- `glitch` 两个角色已命名为 `ヨイン / Yoin` 和 `宵音 / よいね / Yoine`，但当前仍不创建单人详情页，先作为 `#/silence/glitch` 双人页维护。

### 阶段 3：正式图片资产流水线

目标：避免图片流量成为 Silence 最大成本。

建议流程：

1. 用户明确确认哪些图片可以公开。
2. 清理 EXIF 和隐藏信息。
3. 生成多尺寸、多格式衍生图。
4. 建立 `silence-images` manifest，角色数据只引用 manifest key。
5. 页面用统一图片组件渲染 `<picture>`、`srcset`、`sizes`、`loading`。
6. 构建或部署前检查公开图片总量和单页首屏预算。

建议预算：

| 页面 | 首屏图片预算 |
|------|--------------|
| `#/silence` | 桌面不超过 3-4 MB，移动不超过 1.5-2 MB |
| `#/silence/angel` | 桌面不超过 4 MB，移动不超过 2 MB |
| 单角色详情 | 桌面不超过 1.5 MB，移动不超过 800 KB |

这些预算不是硬性规则，但超过时需要有明确原因。

### 阶段 4：生产部署和缓存

目标：让服务器只做静态分发，不做高成本运行时处理。

建议：

- Silence 第一阶段继续保持纯静态。
- 图片转码、裁切、压缩放到本地脚本或构建前流程，不在用户请求时处理。
- 正式部署使用 Nginx/CDN 长缓存静态图。
- 对图片路径做版本化，例如 `/assets/silence/v1/...`，换图时递增版本或使用 hash 文件名。
- 保留构建产物大小检查，后续可加 `npm run analyze:silence` 或脚本输出 Silence chunk 与图片总量。

### 阶段 5：内容规模增长后的优化

只有当角色数量、图像资料或访问量明显增长时再做。

可能需要：

- 角色列表虚拟化或分组筛选。
- 图片预加载策略，根据用户当前翻页方向只预取相邻角色。
- 独立 JSON 内容文件，按角色懒加载详情数据。
- CDN 图片访问日志分析，找出过大的图和高频访问页。
- 单独的轻量 CMS 或静态内容生成脚本。

当前 6 个 `angel` 角色规模下，不建议提前引入 CMS、数据库或新依赖。

## 优先级建议

### P0：正式图片公开前必须做

- 确认图片公开范围。
- 生成公开衍生图，禁止直接公开原 PNG 大图。
- 建立图片 manifest 和尺寸规则。
- 为首屏群像页设置图片预算。

### P1：近期值得做

- 已完成 `SilenceIndexPage.vue` 的入口海报组件拆分。
- 已完成 `SilenceGroupPage.vue`、`SilenceCharacterPage.vue` 的舞台/详情组件拆分。
- 已完成 `useSilenceTurnNavigation`，减少页面重复计算左右邻居。
- 已完成 `silence.md` 第一轮旧交互描述清理，保留当前横向翻页规则为准。

### P2：正式资料填充时做

- 已完成第一步：将角色基础种子和测试占位资料分层。
- 为 `worlds`、`relationships`、`notes`、`spoilers` 增加 visibility 或公开状态规则。
- 建立正式文案维护流程，避免页面里出现 AI 临时文案。

### P3：访问量增长后再做

- CDN / 对象存储拆分。
- 角色详情数据按角色 JSON 懒加载。
- 图片访问日志分析和自动预算检查。
- 内容管理后台或 CMS。

## 当前总体判断

Silence 子项目当前的运行成本很低，服务器资源不是问题；真正需要提前控制的是未来图片公开后的带宽和首屏体验。

代码结构已经有正确方向：路由懒加载、数据/模板分离、详情页复用模板、无后端依赖。`SilenceIndexPage.vue`、`SilenceGroupPage.vue` 和 `SilenceCharacterPage.vue` 已经拆成更清楚的页面组装层；后续继续加正式内容前，优先处理正式图片资产流水线，以及在入口海报或分组舞台继续复杂化时再细拆对应私有组件。

最值得优先做的不是引入新依赖，也不是上后端，而是：

1. 先拆页面结构，降低维护成本。
2. 再建立正式图片资产流水线，控制流量。
3. 最后根据内容规模和访问量决定是否需要更复杂的数据加载或 CDN 架构。
