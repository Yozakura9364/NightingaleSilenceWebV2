# Plate API 契约草案

本文件记录 V2 `Plate` 模块的 API 契约方向。当前接口仍由旧 `NSPortable` 后端提供，V2 通过 `/api/plate/*` 命名空间接入。

## 基本信息

| 项 | 值 |
|----|----|
| V2 API base | `/api/plate` |
| 当前旧服务 | `http://localhost:3456/api` |
| 当前连通性检查 | `GET /api/plate/presets` |
| 图片资源 | `/img/*`、`/img-preview/*` |

## 迁移原则

1. V2 对外路径保持 `/api/plate/*`。
2. 旧后端真实路径通过代理 rewrite 到 `/api/*`。
3. 新后端可以重新实现，但必须保持契约或提供适配层。
4. 素材路径和导出 payload 不要在组件里临时拼接。
5. 导出接口必须保留大小、图层数量和像素总量限制。

## 接口清单

### `GET /api/plate/presets`

旧接口：`GET /api/presets`

用途：

- 获取肖像和铭牌预设。
- 当前也作为轻量连通性检查。

当前已知字段：

```ts
interface PlatePresetsResponse {
  banner: unknown[]
  charcard: unknown[]
}
```

待补充：

- 预设条目结构。
- 图层结构。
- 多语言名称字段。
- 空预设和错误返回。

### `GET /api/plate/files`

旧接口：`GET /api/files`

用途：

- 获取素材列表。
- 获取素材图片 base 和预览图 base。

当前已知字段：

```ts
interface PlateFilesResponse {
  portrait?: Record<string, unknown>
  nameplate?: Record<string, unknown>
  _meta?: {
    imgBase?: string
    previewImgBase?: string
  }
}
```

待补充：

- 素材分类结构。
- 图标 ID / 文件名规则。
- 未发布素材过滤规则。
- 缓存字段。

### `POST /api/plate/export-psd`

旧接口：`POST /api/export-psd`

用途：

- 服务端生成 PSD。

当前已知请求：

```ts
interface PlateExportPsdRequest {
  layers: PlateExportLayer[]
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
interface PlateExportLayeredZipRequest {
  layers: PlateExportLayer[]
  canvasWidth: number
  canvasHeight: number
  composerConfigFull?: unknown
}
```

## 共享类型草案

```ts
interface PlateExportLayer {
  name?: string
  x: number
  y: number
  width?: number
  height?: number
  rgbaData?: string
}
```

## 验证样本待收集

- 一组默认预设响应。
- 一组带预览图 base 的素材响应。
- 一个最小 PSD 导出 payload。
- 一个多图层 ZIP 导出 payload。
- 一个超限 payload 错误样本。

## 安全边界

- `/api/plate/files` 不输出服务器内部路径。
- `/img/*` 和 `/img-preview/*` 不允许任意文件读取。
- 导出接口限制请求体大小、图层数量、画布尺寸和总像素。
- 错误返回不包含服务器路径、堆栈或密钥。
