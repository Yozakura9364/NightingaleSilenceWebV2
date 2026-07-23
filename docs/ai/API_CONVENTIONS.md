---
summary: "V2 API base、代理、请求封装、旧后端兼容和错误处理规范。"
status: "active"
scope: "前端 API 调用、Vite/生产代理和外部服务边界。"
source_of_truth: "src/services、useFetch、vite.config.ts、docs/api 和真实后端契约。"
read_when: "新增 API、接入后端、修改代理或处理外部导入错误。"
update_when: "路径、端口、字段、错误契约或服务边界改变时。"
verify: "请求实际接口并对照代理配置和 API 文档。"
---

# API 调用规范

## 当前状态

当前项目已建立第一版统一 API 封装。

- `src/composables/useFetch.ts`：已实现基础请求封装。
- `src/services/apiBoundaries.ts`：已实现旧项目 API 边界配置读取。
- 页面组件：FFXIV 工具页已接入统一工具页外壳；NSPlate 默认读取静态 manifest，NSGlamour 等仍按模块迁移进度接入后端。
- Vite proxy：用于开发期连接需要后端的旧项目或 legacy fallback；NSPlate 正式素材/预设数据不再默认依赖旧代理。
- API 契约：`docs/api/nsplate.md`、`docs/api/nsglamour.md`、`docs/api/nsarmoire.md`。

后续业务页面应优先通过 `useFetch.ts` 发起请求，不要在组件中散落裸 `fetch`。

## 基本原则

1. 使用原生 `fetch`，不引入 axios。
2. 通过 Vite proxy 转发后端请求，避免开发期跨域。
3. API base path、语言头、错误处理、JSON 解析应由 `useFetch.ts` 统一管理。
4. 组件里不要散落裸 `fetch`，除非是非常局部且已在计划中说明的临时验证代码。
5. 不为了 V2 前端结构随意改变旧后端返回字段；优先写前端适配层。

## 开发环境代理

`vite.config.ts` 当前应保持：

```ts
server: {
  proxy: {
    '/api/plate': {
      target: 'http://localhost:3456',         // NSPlate legacy/dev fallback, not the default runtime data source
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/plate(?=\/|$)/, '/api')
    },
    '/api/glamour': {
      target: 'http://localhost:8766',         // V2-owned NSGlamour API
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/glamour(?=\/|$)/, '/api')
    },
    '/api/armoire': {
      target: 'http://127.0.0.1:8015',         // NSArmoire local helper
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/armoire(?=\/|$)/, '')
    },
    '/img':         'http://localhost:3456',   // legacy fallback only
    '/img-preview': 'http://localhost:3456',   // legacy fallback only
  }
}
```

端口约定：

| 服务 | 端口 | 说明 |
|------|------|------|
| `NSPlate` | `3456` | 仅 legacy/dev fallback、manifest 生成源和旧接口参考 |
| `NSGlamour` | `8766` | V2 自有幻化 API；旧 `8765` 仅作迁移回滚 |
| `NSArmoire helper` | `8015` | 衣柜清理大师本地助手，只监听 `127.0.0.1` |

## 已实现：fetch 封装

文件：`src/composables/useFetch.ts`

当前能力：

- `request<T>()`：基础请求，可指定 `responseType`。
- `api<T>()`：JSON 请求。
- `text()`：文本请求。
- `blob()`：Blob 请求。
- `createClient(basePath)`：按 API base path 生成简单客户端。
- `joinApiPath(basePath, path)`：拼接 API path。
- `ApiError`：包装非 2xx 响应，包含 `status`、`statusText`、`url` 和 `bodyText`。
- 请求会自动带上 `Accept-Language`。
- `json` 选项会自动序列化请求体并设置 `Content-Type: application/json`。
- `query` 选项会统一拼接查询参数。

后续可按真实 API 增加：

- 上传进度或文件上传 helper。
- 统一错误结构。
- 后端路径适配，例如 `/api/glamour/...` 是否需要 rewrite。
- 请求取消和防抖策略。

## API 边界配置

文件：`src/services/apiBoundaries.ts`

当前从 `src/config/site.ts` 的 `ffxivTools` 读取：

| id | API base | health/check path | dev port |
|----|----------|-------------------|----------|
| `itemCard` | `/api/glamour` | `/health` | `8766` |
| `glamour` | `/api/glamour` | `/health` | `8766` |
| `plate` | `/api/plate` | `/presets` | `3456`，仅 legacy/dev fallback |
| `armoire` | `/api/armoire` | `/health` | `8015` |

V2 自有 `NSGlamour` API 提供 `/api/health`，前端通过 `/api/glamour/health` 检查连通性。
旧 `NSPortable` 后端没有 `/api/health`；如果显式启用 `VITE_NSPLATE_DATA_SOURCE=legacy-api`，可用 `/api/plate/presets` 作为轻量连通性检查。默认静态模式不使用这个检查。
`NSArmoire` 的 `/api/armoire/health` 只用于 Vite 开发代理。正式完整工作台由 Helper GUI 内嵌，页面与 API 同源运行在 `http://127.0.0.1:8015`；公网 V2 只提供教程和 Release 下载入口，不连接用户本机 Helper。

规则：

1. 新增旧项目后端边界时，先在 `src/config/site.ts` 补工具或分类配置，再让 `apiBoundaries.ts` 暴露边界。
2. 组件不硬编码 `localhost` 和端口。
3. 页面可以展示必要技术标识，但未确定的用户可见说明文案仍使用 `占位用，待编辑`。

## 路径约定

- NSPlate 默认数据源：读取 `/data/plate/presets.json`、`/data/plate/files.json`，图片素材使用 manifest 中的 COS/CDN base。
- NSPlate legacy API：只有显式 `VITE_NSPLATE_DATA_SOURCE=legacy-api` 或旧导出 fallback 时使用 `/api/plate/...`；代理到旧后端时 rewrite 为 `/api/...`。
- NSPlate legacy 图片素材：`/img/...`、`/img-preview/...` 只作为旧服务 fallback，不作为生产默认路径。
- NSGlamour 业务 API：V2 前端使用 `/api/glamour/...`，代理到 `server/glamour` 时 rewrite 为 `/api/...`。
- NSArmoire helper API：Vite 开发期使用 `/api/armoire/...`，代理到本机 Helper 时去掉 `/api/armoire` 前缀；正式本地工作台由 Helper 在 `http://127.0.0.1:8015` 同源提供页面和 API；公网页面不连接 Helper。
- 不在页面组件中硬编码 `localhost`、端口号或生产域名。
- 生产环境中 NSPlate 的素材/预设默认由静态文件和 COS/CDN 提供；仍需要后端的模块由 Nginx 反向代理处理同名路径，并保持与开发代理一致的 rewrite 规则。

## 语言约定

目标行为：

1. 所有业务 API 请求携带 `Accept-Language`。
2. 语言来源为 `src/stores/locale.ts` 的 `current`。
3. 后端若无法按语言返回，应由前端适配层保底显示已有语言或原始值。

当前 `locale` store 已接入 UI 文案表、设置入口、`document.lang` 和标题刷新；后续重点是继续补齐全站固定 UI 文案覆盖和业务数据语言 fallback。

## 错误处理约定

- 非 2xx 响应由封装层抛错。
- 页面层负责把错误转为用户能理解的状态提示。
- 上传、外部链接导入、`.chara` 解析、图片代理等入口都视为不可信输入，错误文案不要暴露服务器内部路径、密钥或堆栈。

## 缓存约定

- NSPlate 游戏素材图片由 COS/CDN 提供时，缓存策略随 COS/CDN 和 manifest 版本管理；旧服务缓存策略只适用于 legacy fallback。
- V2 前端不要在未确认资源更新规则前额外加长期缓存。
- 模板、字体、游戏数据这类大资源后续需要专门规划版本号和缓存失效策略。
