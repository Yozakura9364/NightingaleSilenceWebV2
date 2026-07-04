# API 调用规范

## 当前状态

当前项目已建立第一版统一 API 封装。

- `src/composables/useFetch.ts`：已实现基础请求封装。
- `src/services/apiBoundaries.ts`：已实现旧项目 API 边界配置读取。
- 页面组件：FFXIV 工具占位页已接入统一工具页外壳，真实业务请求待后续迁移。
- Vite proxy：用于开发期连接旧项目后端。
- API 契约草案：`docs/api/nsplate.md`、`docs/api/nsglamour.md`。

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
      target: 'http://localhost:3456',         // NSPlate / 旧 NSPortable
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/plate(?=\/|$)/, '/api')
    },
    '/api/glamour': {
      target: 'http://localhost:8765',         // NSGlamour
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/glamour(?=\/|$)/, '/api')
    },
    '/api/armoire': {
      target: 'http://127.0.0.1:8015',         // NSArmoire local helper
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/armoire(?=\/|$)/, '')
    },
    '/img':         'http://localhost:3456',   // 旧 NSPortable 游戏素材
    '/img-preview': 'http://localhost:3456',   // 旧 NSPortable 预览缩略图
  }
}
```

端口约定：

| 服务 | 端口 | 说明 |
|------|------|------|
| `NSPlate` | `3456` | 当前接旧 `NSPortable` 铭牌后端和素材服务 |
| `NSGlamour` | `8765` | 幻化后端，本机项目长期使用该端口 |
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
| `glamour` | `/api/glamour` | `/health` | `8765` |
| `plate` | `/api/plate` | `/presets` | `3456` |
| `armoire` | `/api/armoire` | `/health` | `8015` |

`NSGlamour` 旧后端有 `/api/health`，因此 V2 通过 `/api/glamour/health` 检查连通性。
旧 `NSPortable` 后端没有 `/api/health`，当前使用 `/api/plate/presets` 作为轻量连通性检查；不要臆造旧后端不存在的 health 接口。
`NSArmoire` 的 `/api/armoire/health` 只用于开发代理；公开页面不能假设服务器能访问用户本机 helper，应直连 `http://127.0.0.1:8015` 并保留手动导入 fallback。

规则：

1. 新增旧项目后端边界时，先在 `src/config/site.ts` 补工具或分类配置，再让 `apiBoundaries.ts` 暴露边界。
2. 组件不硬编码 `localhost` 和端口。
3. 页面可以展示必要技术标识，但未确定的用户可见说明文案仍使用 `占位用，待编辑`。

## 路径约定

- NSPlate 业务 API：V2 前端使用 `/api/plate/...`，代理到旧后端时 rewrite 为 `/api/...`。
- NSPlate 图片素材：使用 `/img/...`、`/img-preview/...`。
- NSGlamour 业务 API：V2 前端使用 `/api/glamour/...`，代理到旧后端时 rewrite 为 `/api/...`。
- NSArmoire helper API：开发期使用 `/api/armoire/...`，代理到本机 helper 时去掉 `/api/armoire` 前缀；生产/公开页面直连用户本机 `http://127.0.0.1:8015/...`。
- 不在页面组件中硬编码 `localhost`、端口号或生产域名。
- 生产环境由 Nginx 反向代理处理同名路径，并保持与开发代理一致的 rewrite 规则。

## 语言约定

目标行为：

1. 所有业务 API 请求携带 `Accept-Language`。
2. 语言来源为 `src/stores/locale.ts` 的 `current`。
3. 后端若无法按语言返回，应由前端适配层保底显示已有语言或原始值。

当前 `locale` store 只有基础结构，文案文件和 UI 语言切换仍待接入。

## 错误处理约定

- 非 2xx 响应由封装层抛错。
- 页面层负责把错误转为用户能理解的状态提示。
- 上传、外部链接导入、`.chara` 解析、图片代理等入口都视为不可信输入，错误文案不要暴露服务器内部路径、密钥或堆栈。

## 缓存约定

- 游戏素材图片若由旧服务提供，优先沿用旧服务缓存策略。
- V2 前端不要在未确认资源更新规则前额外加长期缓存。
- 模板、字体、游戏数据这类大资源后续需要专门规划版本号和缓存失效策略。
