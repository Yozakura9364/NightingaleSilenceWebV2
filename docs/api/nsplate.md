# NSPlate API 契约草案

本文件记录 V2 `NSPlate` 模块的数据源和旧兼容 API 契约。

当前正式运行数据源已经切到 V2 静态 manifest 和 COS/CDN 素材源。旧 `NSPortable` 后端只保留为显式 legacy/dev fallback、manifest 生成源和旧导出接口参考；页面业务组件不得把 `/api/plate/*` 视为默认运行依赖。

## 基本信息

| 项 | 值 |
|----|----|
| 默认数据源 | `static-manifest` |
| 默认 manifest base | `/data/plate` |
| manifest 文件 | `/data/plate/presets.json`、`/data/plate/files.json` |
| 图片资源 | `https://img.nightingalesilence.com` |
| 缩略图资源 | `https://img.nightingalesilence.com/plate-preview-webp/256`，WebP Q82 |
| 旧兼容 API base | `/api/plate`，仅显式 `VITE_NSPLATE_DATA_SOURCE=legacy-api` 时用于本地 fallback |

## 旧兼容 API 验证

以下只记录旧兼容 API 的历史契约，不代表正式页面默认依赖它。

| V2 路径 | 状态 | 结果摘要 |
|---------|------|----------|
| `GET /api/plate/presets` | 200 | 顶层字段 `banner`、`charcard`；当前样本 `banner=421`、`charcard=143`。 |
| `GET /api/plate/files` | 200 | 顶层字段 `portrait`、`nameplate`、`_meta`；返回素材分类和图片 base。 |

本机验证通过 V2 dev server 代理访问：`http://127.0.0.1:5173/api/plate/*`。旧 `NSPortable` 服务没有 `/api/health`，不能把 health 接口当成运行依赖。

## 迁移原则

1. `#/ffxiv/plate` 默认读取静态 manifest，不依赖旧 `/api/plate/presets` 或 `/api/plate/files`。
2. 旧后端真实路径通过代理 rewrite 到 `/api/*`，只用于显式 `legacy-api`、manifest 生成和旧导出能力参考。
3. 素材路径和导出 payload 不要在组件里临时拼接。
4. 导出接口必须保留大小、图层数量和像素总量限制。
5. 页面组件只依赖 `NSPlateDataSource` 和 adapter 后的 V2 模型，不直接依赖旧接口原始字段。

## 静态 manifest 方向

正式运行需要生成并部署：

- `presets.json`：结构与 `NSPlatePresetsResponse` 等价，包含 `banner`、`charcard`。
- `files.json`：结构与 `NSPlateFilesResponse` 等价，包含 `portrait`、`nameplate`、`_meta.imgBase`；缩略图已同步后写入 `_meta.previewImgBase`、`_meta.previewMaxEdge` 和 `_meta.previewFormat`。
- `manifest-meta.json`：记录生成时间、COS base、预设数量、素材数量、未实装素材和占位素材过滤结果；不写入本机源 API 地址。

当前可用脚本：

```bash
npm run build:plate-manifest
npm run build:plate-manifest:no-preview
npm run build:plate-thumbnails -- --source-dir "H:\解包\nine-1326554799"
npm run build:plate-thumbnails -- --source-dir "H:\解包\nine-1326554799" --output-dir "H:\解包\nine-1326554799\plate-preview-webp\256"
npm run check:plate-static
npm run check:plate-static:preview
node scripts/check-nsplate-static-manifest.mjs --check-remote
node scripts/check-nsplate-static-manifest.mjs --expect-preview --check-preview-remote
```

运行环境变量：

- `VITE_NSPLATE_DATA_SOURCE`：默认 `static-manifest`。只有显式设为 `legacy-api` 才会读旧 `/api/plate`。
- `VITE_NSPLATE_MANIFEST_BASE`：默认 `/data/plate`。

生成脚本环境变量：

- `NSPLATE_SOURCE_API_BASE`
- `NSPLATE_MANIFEST_OUTPUT_DIR`
- `NSPLATE_STATIC_IMG_BASE`
- `NSPLATE_STATIC_PREVIEW_IMG_BASE`
- `NSPLATE_STATIC_PREVIEW_MAX_EDGE`
- `NSPLATE_STATIC_PREVIEW_FORMAT`
- `NSPLATE_INCLUDE_UNRELEASED`：默认 `true`。只有生成单独的隐藏未实装测试 manifest 时才设为 `0`，且必须配合独立输出目录。

缩略图生成脚本环境变量：

- `NSPLATE_THUMBNAIL_SOURCE_DIR`
- `NSPLATE_THUMBNAIL_OUTPUT_DIR`
- `NSPLATE_THUMBNAIL_MAX_EDGE`
- `NSPLATE_THUMBNAIL_CONCURRENCY`
- `NSPLATE_THUMBNAIL_FORCE`
- `NSPLATE_THUMBNAIL_FORMAT`
- `NSPLATE_THUMBNAIL_QUALITY`
- `MAGICK_PATH` / `NSPLATE_MAGICK_PATH`

当前公开 manifest 规则：

- 默认 `_meta.imgBase` 为 `https://img.nightingalesilence.com`，不复制游戏素材到 V2 仓库。
- 当前 `npm run build:plate-manifest` 默认写入 `_meta.previewImgBase=https://img.nightingalesilence.com/plate-preview-webp/256`、`_meta.previewMaxEdge=256` 和 `_meta.previewFormat=webp`；如需临时排查原图预览 fallback，使用 `npm run build:plate-manifest:no-preview`。
- 缩略图为离线生成的 WebP Q82 产物，默认输出到仓库外 `../.cache/nsplate-thumbnails/256/`，目录结构与素材路径一致，扩展名由 `.png` 改为 `.webp`；上传到 COS 后使用 `plate-preview-webp/256/` prefix。
- 如果使用 COSBrowser 从本机同步整个素材桶，推荐直接输出到本机桶同步目录 `H:\解包\nine-1326554799\plate-preview-webp\256`，同步到桶根后对应 URL 前缀为 `https://img.nightingalesilence.com/plate-preview-webp/256`。
- 只有确认 COS 上对应 `plate-preview-webp/256/` 缩略图已同步完成后，才给正式 `files.json` 写完整 preview meta；否则素材卡会回退到 COS 原图。
- 正式 manifest 默认保留旧源数据标记为 `unreleased` 的素材，让未实装素材能正常出现在素材列表并被选择。
- 始终过滤 Plate 素材范围内的占位/索引编号：`234400`、以及 `190000..199999` / `230000..239999` 范围内编号末尾为 `000` 或 `001` 的素材。此类素材是占位/空素材，不属于用户应选择的未实装内容。
- 不再默认维护“内部版 manifest”。如果未来临时需要隐藏未实装素材，只能用 `--exclude-unreleased` 或 `NSPLATE_INCLUDE_UNRELEASED=0` 生成到独立目录，不得覆盖正式 `public/data/plate/`。

静态 manifest 已是默认模式。2026-07-13 已将正式缩略图切到 `https://img.nightingalesilence.com/plate-preview-webp/256/.../*.webp`；页面仍只用 PNG 原图参与 Canvas 和导出。

## 下载文件名规则

当前浏览器端下载文件名统一由 `src/lib/plate/downloadFilenames.ts` 生成：

| 类型 | 规则 | 示例 |
|------|------|------|
| 配置 JSON | `plate-config_YYYYMMDD-HHMMSS.json` | `plate-config_20260705-152958.json` |
| 扁平 PNG | `plate-nameplate_YYYYMMDD-HHMMSS.png`，2x 时追加 `_2x` | `plate-nameplate_20260705-152959.png` |
| 扁平 JPG | `plate-nameplate_YYYYMMDD-HHMMSS_white-bg.jpg`，2x 时追加 `_2x` | `plate-nameplate_20260705-152959_white-bg.jpg` |
| 分层 ZIP | `plate-layers_YYYYMMDD-HHMMSS.zip`，2x 时追加 `_2x` | `plate-layers_20260705-152959.zip` |

## 接口清单

### `GET /api/plate/presets`

旧接口：`GET /api/presets`

用途：

- 获取肖像和铭牌预设。
- 当前也作为轻量连通性检查。

当前已知字段：

```ts
interface NSPlatePresetsResponse {
  banner: NSPlatePreset[]
  charcard: NSPlatePreset[]
}

interface NSPlatePreset {
  name: string
  names?: Record<string, string>
  layers: unknown[]
}
```

待补充：

- 图层结构。
- 空预设和错误返回。

### `GET /api/plate/files`

旧接口：`GET /api/files`

用途：

- 获取素材列表。
- 获取素材图片 base 和预览图 base。

当前已知字段：

```ts
interface NSPlateFilesResponse {
  portrait?: Record<string, NSPlateAsset[]>
  nameplate?: Record<string, NSPlateAsset[]>
  _meta?: {
    imgBase?: string
    previewImgBase?: string
    previewMaxEdge?: number
    previewFormat?: 'png' | 'webp' | 'avif'
  }
}

interface NSPlateAsset {
  id: string | number
  file: string
  path: string
  name: string
  names?: Record<string, string>
}
```

旧兼容 API 样本：

- `portrait` 分类示例：`肖像背景`、`肖像装饰框`、`肖像装饰物`。
- `nameplate` 分类示例：`铭牌背衬`、`铭牌底色`、`铭牌花纹`、`铭牌外框`、`肖像外框`、`职业图标`。
- `_meta.imgBase` 旧 API 样本为 `/portable/img`；正式静态 manifest 为 `https://img.nightingalesilence.com`。
- `_meta.previewImgBase` 的旧动态值为 `/portable/img-preview/256`；2026-07-13 起旧站生产配置和正式静态 manifest 都使用 `https://img.nightingalesilence.com/plate-preview-webp/256`。
- `_meta.previewMaxEdge` 当前为 `256`。
- `_meta.previewFormat` 当前为 `webp`，adapter 将素材 `.png` 路径映射成缩略图 `.webp` 路径。

待补充：

- 图标 ID / 文件名规则。
- 缓存字段。

### 已删除计划的旧服务端导出接口

旧 `NSPortable` 曾存在 Photoshop 相关服务端导出接口，但 V2 当前不迁移、不验证、不作为后续计划入口。V2 第一阶段可编辑导出以浏览器端分层 ZIP 为准。

### `POST /api/plate/export-layered-zip`

旧接口：`POST /api/export-layered-zip`

用途：

- 导出分层 ZIP。

当前已知请求：

```ts
interface NSPlateExportLayeredZipRequest {
  layers: NSPlateExportLayer[]
  canvasWidth: number
  canvasHeight: number
  composerConfigFull?: unknown
}
```

## 共享类型草案

```ts
interface NSPlateExportLayer {
  name?: string
  x: number
  y: number
  width?: number
  height?: number
  rgbaData?: string
}
```

## 验证样本待收集

- 一组默认预设响应。（已确认顶层结构和数量，仍需固化为小样本文件）
- 一组带预览图 base 的素材响应。（已确认顶层结构，仍需固化为小样本文件）
- 一个多图层 ZIP 导出 payload。
- 一个超限 payload 错误样本。

## 安全边界

- `files.json` 和旧 `/api/plate/files` 不输出服务器内部路径。
- COS/CDN 素材路径必须来自 manifest 白名单；旧 `/img/*` 和 `/img-preview/*` 不允许任意文件读取。
- 导出接口限制请求体大小、图层数量、画布尺寸和总像素。
- 错误返回不包含服务器路径、堆栈或密钥。
