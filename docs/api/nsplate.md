# NSPlate API 契约草案

本文件记录 V2 `NSPlate` 模块的 API 契约方向。当前接口仍由旧 `NSPortable` 后端提供，V2 通过 `/api/plate/*` 命名空间接入。

前端代码不应直接把旧服务作为唯一数据来源。当前已建立 `NSPlateDataSource` 边界：默认实现仍调用 `/api/plate/*`，后续可切换为 V2 静态 manifest 和 COS/CDN 素材源。

## 基本信息

| 项 | 值 |
|----|----|
| V2 API base | `/api/plate` |
| 当前旧服务 | `http://localhost:3456/api` |
| 当前连通性检查 | `GET /api/plate/presets` |
| 图片资源 | `/img/*`、`/img-preview/*` |

## 本机代理验证

最近验证时间：2026-07-03。

| V2 路径 | 状态 | 结果摘要 |
|---------|------|----------|
| `GET /api/plate/presets` | 200 | 顶层字段 `banner`、`charcard`；当前样本 `banner=421`、`charcard=143`。 |
| `GET /api/plate/files` | 200 | 顶层字段 `portrait`、`nameplate`、`_meta`；返回素材分类和图片 base。 |

本机验证通过 V2 dev server 代理访问：`http://127.0.0.1:5173/api/plate/*`。

## 迁移原则

1. V2 对外路径保持 `/api/plate/*`。
2. 旧后端真实路径通过代理 rewrite 到 `/api/*`。
3. 新后端可以重新实现，但必须保持契约或提供适配层。
4. 素材路径和导出 payload 不要在组件里临时拼接。
5. 导出接口必须保留大小、图层数量和像素总量限制。
6. `#/ffxiv/plate` 页面组件只依赖 `NSPlateDataSource` 和 adapter 后的 V2 模型，不直接依赖旧接口原始字段。

## 静态 manifest 方向

未来关闭旧 `NSPortable` 服务前，V2 至少需要生成并部署：

- `presets.json`：结构与 `NSPlatePresetsResponse` 等价，包含 `banner`、`charcard`。
- `files.json`：结构与 `NSPlateFilesResponse` 等价，包含 `portrait`、`nameplate`、`_meta.imgBase`、`_meta.previewImgBase`。

当前可用脚本：

```bash
npm run build:plate-manifest
node scripts/build-nsplate-manifest.mjs --source-api-base http://127.0.0.1:3456/api --img-base https://example.invalid/img
```

当前代码预留环境变量：

- `VITE_NSPLATE_DATA_SOURCE=static-manifest`
- `VITE_NSPLATE_MANIFEST_BASE=/data/plate`

生成脚本环境变量：

- `NSPLATE_SOURCE_API_BASE`
- `NSPLATE_MANIFEST_OUTPUT_DIR`
- `NSPLATE_STATIC_IMG_BASE`
- `NSPLATE_STATIC_PREVIEW_IMG_BASE`

该模式尚未默认启用；必须先生成真实 manifest、确认素材 URL 指向 V2 可控的静态源或 CDN，并完成预设、素材、Canvas 和导出回归。

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

当前样本：

- `portrait` 分类示例：`肖像背景`、`肖像装饰框`、`肖像装饰物`。
- `nameplate` 分类示例：`铭牌背衬`、`铭牌底色`、`铭牌花纹`、`铭牌外框`、`肖像外框`、`职业图标`。
- `_meta.imgBase` 当前为 `/portable/img`。
- `_meta.previewImgBase` 当前为 `/portable/img-preview/256`。
- `_meta.previewMaxEdge` 当前为 `256`。

待补充：

- 图标 ID / 文件名规则。
- 未发布素材过滤规则。
- 缓存字段。

### `POST /api/plate/export-psd`

旧接口：`POST /api/export-psd`

用途：

- 服务端生成 PSD。

当前已知请求：

```ts
interface NSPlateExportPsdRequest {
  layers: NSPlateExportLayer[]
  canvasWidth: number
  canvasHeight: number
}
```

风险：

- payload 体积。
- 图层数量。
- 单层像素尺寸。
- 总像素数量。

### `POST /api/plate/export-psd-jsx`

旧接口：`POST /api/export-psd-jsx`

用途：

- 服务端 JSX 导出。

注意：

- 旧服务可能禁用该功能。
- 如果涉及服务器本地文件写入，公开部署必须默认关闭或加权限。

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
- 一个最小 PSD 导出 payload。
- 一个多图层 ZIP 导出 payload。
- 一个超限 payload 错误样本。

## 安全边界

- `/api/plate/files` 不输出服务器内部路径。
- `/img/*` 和 `/img-preview/*` 不允许任意文件读取。
- 导出接口限制请求体大小、图层数量、画布尺寸和总像素。
- 错误返回不包含服务器路径、堆栈或密钥。
