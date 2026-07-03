# NSGlamour API 契约草案

本文件记录 V2 `NSGlamour` 模块的 API 契约方向。当前接口仍由旧 Flask 后端提供，V2 通过 `/api/glamour/*` 命名空间接入。

## 基本信息

| 项 | 值 |
|----|----|
| V2 API base | `/api/glamour` |
| 当前旧服务 | `http://localhost:8765/api` |
| 当前连通性检查 | `GET /api/glamour/health` |

## 本机代理验证

最近验证时间：2026-07-03。

| V2 路径 | 状态 | 结果摘要 |
|---------|------|----------|
| `GET /api/glamour/health` | 200 | 返回 `{ ok: true }`。 |
| `GET /api/glamour/stains` | 200 | 顶层字段 `locale`、`results`；当前样本 `locale=zh`、`results=126`。 |
| `GET /api/glamour/ui-localization` | 200 | 顶层字段 `version`、`description`、`generatedAt`、`locales`、`autoFillSources`、`strings`、`scope`。 |

本机验证通过 V2 dev server 代理访问：`http://127.0.0.1:5173/api/glamour/*`。

## 迁移原则

1. V2 对外路径保持 `/api/glamour/*`。
2. 旧后端真实路径通过代理 rewrite 到 `/api/*`。
3. 新后端可以重新实现，但必须先抽取旧接口契约和真实样本。
4. 装备、染剂、模板和导入字段不得为了前端结构好看随意改名。
5. 导入后必须先做装备和染剂合法性检查，再进入编辑状态。

## 接口清单

### `GET /api/glamour/health`

旧接口：`GET /api/health`

用途：

- 连通性检查。

当前已知字段：

```ts
interface NSGlamourHealthResponse {
  ok: boolean
}
```

待补充：

- 版本号或数据版本字段。

### `GET /api/glamour/ui-localization`

旧接口：`GET /api/ui-localization`

用途：

- 获取 UI 本地化数据。

当前已知字段：

```ts
interface NSGlamourUiLocalizationResponse {
  version: number
  description?: string
  generatedAt?: string
  locales: unknown
  autoFillSources: unknown[]
  strings: Record<string, unknown>
  scope: unknown[]
}
```

当前样本：

- `version` 当前为 `2`。
- `generatedAt` 当前为 `2026-06-20T07:20:00.000Z`。
- `strings` 是以点分 key 命名的对象，例如 `common.ui.language`、`equipinfo.ui.import_equipment_info`。
- `autoFillSources` 当前是数组，样本长度为 `4`。
- `scope` 当前是数组，样本长度为 `7`。

待补充：

- 支持语言列表。
- 缺失键 fallback 规则。

### `POST /api/glamour/import-glamour-link`

旧接口：`POST /api/import-glamour-link`

用途：

- 导入石之家或 Eorzea Collection 链接。

契约重点：

- 标题。
- 角色名。
- 服务器。
- 装备列表。
- 染剂列表。
- 来源站点。

风险：

- 外部链接白名单。
- 石之家页面/API 变化。
- 后台浏览器登录态边界。

### `POST /api/glamour/equipinfo/parse-text`

旧接口：`POST /api/equipinfo/parse-text`

用途：

- 解析成段文字中的装备和染剂。

契约重点：

- 原文语言。
- 部位顺序。
- 多格式文案。
- 紧跟装备后的染剂归属。
- 未识别行。

### `POST /api/glamour/parse-chara`

旧接口：`POST /api/parse-chara`

用途：

- 解析 `.chara` 文件。

契约重点：

- `resolved_equipment`
- `candidates`
- `dye_entries`
- `names`
- `model_main`
- 主手/副手关系。
- 染剂槽数量和可染色属性。

### `GET /api/glamour/search-items`

旧接口：`GET /api/search-items`

用途：

- 搜索装备候选。

待补充：

- 查询参数。
- 语言参数。
- 候选排序规则。
- 防抖和取消策略。

### `GET /api/glamour/stains`

旧接口：`GET /api/stains`

用途：

- 获取染剂数据。

当前已知字段：

```ts
interface NSGlamourStainsResponse {
  locale: string
  results: NSGlamourStain[]
}

interface NSGlamourStain {
  group: number
  group_name: string
  hex: string
  id: number
  name: string
  names: Record<string, string>
  rgb: number
  sub_order: number
}
```

契约重点：

- 染剂 ID。
- 多语言名称。
- 颜色。
- 空染色表示。

当前样本：

- `locale` 当前为 `zh`。
- `results` 当前为 `126` 条。
- `id=0` 表示 `无染色`，`hex=#000000`，`names` 包含 `de/en/fr/ja/ko/tc/zh` 等语言名。

### `GET /api/glamour/icon/<icon_id>`

旧接口：`GET /api/icon/<icon_id>`

用途：

- 图标代理。

风险：

- 不能成为开放代理。
- 需要缓存策略。
- 需要限制 ID 格式。

## 共享字段警戒线

这些字段语义必须稳定：

```ts
interface NSGlamourResolvedEquipment {
  resolved_equipment?: unknown
  candidates?: unknown
  dye_entries?: unknown
  names?: unknown
  model_main?: unknown
}
```

正式类型待从旧样本中抽取，不在没有样本时凭空定死。

## 合法性检查

导入链路必须包含：

1. 染剂属性一致性。
2. 不可染色装备清理染剂。
3. 双染色槽和空染色处理。
4. 主手为双手武器时清理副手。
5. 候选替换后重新校验染剂和副手。

## 验证样本待收集

- `.chara` 最小样本。
- `.chara` 双染色样本。
- 主手占用副手样本。
- 石之家链接样本。
- Eorzea Collection 链接样本。
- 成段文字多格式样本。
- 未识别装备和未知染剂样本。
- `stains` 小样本。（已确认顶层结构和字段，仍需固化为小样本文件）
- `ui-localization` 小样本。（已确认顶层结构和字符串 key 形态，仍需固化为小样本文件）

## 安全边界

- `.chara` 文件限制大小和格式。
- 外部链接只允许白名单域名。
- 后台浏览器登录态不能暴露给公开用户。
- 图标代理不能访问任意 URL 或任意文件。
- 错误返回不包含服务器路径、堆栈或密钥。
