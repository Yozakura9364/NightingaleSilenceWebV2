---
summary: "V2 自有 NSGlamour Flask 后端的导入、搜索、染剂和资源 API 契约。"
status: "active"
scope: "/api/glamour 代理、server/glamour 字段和前端 adapter。"
source_of_truth: "server/glamour、V2 glamour services 和真实 EC/石之家样本。"
read_when: "修改幻化后端、代理、外部导入、搜索或错误处理。"
update_when: "endpoint、字段、上游错误、鉴权或后端替换策略变化时。"
verify: "运行契约检查并请求健康、导入和搜索接口的成功/失败分支。"
---

# NSGlamour API 契约

本文件记录 V2 `NSGlamour` 模块的 API 契约。接口由本仓库 `server/glamour/` 提供，V2 通过 `/api/glamour/*` 命名空间接入。

## 基本信息

| 项 | 值 |
|----|----|
| V2 API base | `/api/glamour` |
| V2 服务 | `http://127.0.0.1:8766/api` |
| 迁移回滚服务 | `http://127.0.0.1:8765/api` |
| 当前连通性检查 | `GET /api/glamour/health` |

## 本机验证与契约检查

最近验证时间：2026-07-23。

本次验证直连 V2 服务并经 Vite 代理复验。执行 `npm run dev` 后运行：

```bash
NSGLAMOUR_CONTRACT_BASE_URL=http://127.0.0.1:5175/api/glamour npm run check:nsglamour-contract
```

| V2 路径 | 状态 | 结果摘要 |
|---------|------|----------|
| `GET /api/glamour/health` | 200 | 返回 `{ ok: true }`。 |
| `GET /api/glamour/stains?locale=zh` | 200 | 顶层字段 `locale`、`results`；当前样本 `results=126`，约 `42.6 KB` raw / `9.2 KB` gzip，`Cache-Control: public, max-age=3600`。 |
| `GET /api/glamour/stains?locale=en` | 200 | 当前样本 `results=126`。 |
| `GET /api/glamour/ui-localization` | 200 | 顶层字段 `version`、`description`、`generatedAt`、`locales`、`autoFillSources`、`strings`、`scope`；当前 `version=2`，约 `102.4 KB` raw / `19.4 KB` gzip，`no-store`。 |
| `GET /api/glamour/search-items?slot=Body&q=长袍&locale=zh&limit=3` | 200 | 返回 3 条样本，首条当前为 `书龙长袍`。 |
| `GET /api/glamour/search-items?slot=Body&q=robe&locale=zh&limit=3` | 200 | 返回 3 条样本，说明中文 locale 下仍可用英文名搜索 fallback。 |
| `POST /api/glamour/equipinfo/parse-text` | 200 | 用 `身体：书龙长袍` 可解析出 1 条 `Body` 装备。空文本返回 400 和 `error` 字段。 |

当前验证脚本：

```bash
npm run check:nsglamour-contract
npm run test:glamour-api
python server/glamour/tests/compare_api.py
```

契约脚本默认检查 V2 服务 `http://127.0.0.1:8766/api`；可通过 `NSGLAMOUR_CONTRACT_BASE_URL` 或 `--base-url` 切到 Vite 代理。`POST /parse-chara` 在设置 `NSGLAMOUR_CONTRACT_CHARA_FILE` 或 `--chara-file` 后检查。`compare_api.py` 只在旧 `8765` 与新 `8766` 并行时使用。

## 阶段 0 资产与流量约束

当前旧项目资源体积以 2026-07-06 本机统计为准：

| 资源 | 当前体积/数量 | 迁移约束 |
|------|---------------|----------|
| `server/glamour/data/item_model_mapping.json` | `47,699,612 B` raw，`4,358,245 B` gzip，`28,935` 条 items | 不进入 V2 前端 bundle，只由 Flask 持有。 |
| `server/glamour/data/item_catalog.sqlite3` | `25,358,336 B`，`50,705` 条 Item.csv 物品，7 种语言 | 仅由 `/search-catalog-items` 按请求读取，不进入 V2 前端 bundle，也不并入装备映射。 |
| `font/` | 约 `81.6 MB` | 不整目录迁入；模板字体后续按模板/语言懒加载，并单独确认授权和缓存。 |
| `static/templates/` | 约 `4.5 MB` | 只迁运行时需要的模板资源；按选中模板加载。 |
| `templates/` 源/参考文件 | 约 `327.6 MB` | 不进入 V2 构建产物；PSD/SVG 等只作为校准参考。 |
| `/template` HTML | 约 `12.6 KB` raw / `3.1 KB` gzip | HTML 很轻，但实际首屏还会拉 JS/CSS、字体、Cropper、模板背景等资源。 |
| `/equipinfo` HTML | 约 `20.1 KB` raw / `3.3 KB` gzip | 比 `/template` 更适合作为第一段轻量迁移入口。 |

迁移时优先目标：

1. 前端不静态 import 完整 mapping、字体目录、源模板目录。
2. 染剂数据保留 1 小时缓存；UI localization 当前 `no-store`，后续如拆分本地化数据需重新定义版本和缓存。
3. 装备搜索需要防抖、取消和 limit；默认不做全量拉取。
4. 模板图片、字体、预览图、Canvas 资源按模板选择后再加载。

## 迁移原则

1. V2 对外路径保持 `/api/glamour/*`。
2. `server/glamour` 真实路径通过代理 rewrite 到 `/api/*`。
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

当前已知请求：

```ts
interface NSGlamourEquipinfoParseTextRequest {
  text: string
  source_locale?: string
  locale?: string
}
```

当前已知响应字段：

```ts
interface NSGlamourEquipinfoParseTextResponse {
  file_type: string
  source_name: string
  source_title: string
  source_locale: string
  locales: string[]
  default_locale: string
  locale_labels: Record<string, string>
  slot_names: Record<string, unknown>
  dye_labels: Record<string, string>
  no_dye_labels: Record<string, string>
  warnings: string[]
  resolved_equipment: unknown[]
}
```

错误样本：

- 空 `text`：400，返回 `{ error: string }`。
- 文本超过 20000 字：413，返回 `{ error: string }`。

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

当前已知查询参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `slot` | string | 装备部位，例如 `MainHand`、`Body`、`Glasses`、`FashionAccessory`。未知部位返回空数组。 |
| `q` | string | 搜索词；为空时返回空数组。当前可命中当前 locale 名称，也会遍历多语言名称。 |
| `locale` | string | 展示语言，默认 `zh`。 |
| `limit` | number | 默认 `30`，后端限制到 `1..80`。 |

当前已知字段：

```ts
interface NSGlamourSearchItemsResponse {
  slot: string
  results: NSGlamourSearchItem[]
}

interface NSGlamourSearchItem {
  key: number
  key_label: string
  name: string
  names: Record<string, string>
  icon: number
  rarity: number
  slot_label: string
  equip_slot_category: number
  model_main: Record<string, unknown>
  dye_count: number
  dye_display_by_locale: Record<string, string>
  dye_display: string
  dye_entries: unknown[]
  is_emperor: boolean
}
```

待补充：

- 候选排序规则的完整说明。
- 前端防抖、取消和最小输入长度策略。

### `GET /api/glamour/search-catalog-items`

用途：

- 为物品卡片统一搜索装备或普通物品。
- 与按单个装备槽过滤的 `/search-items` 分离，不改变幻化装备搜索契约。

查询参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `q` | string | 物品名或精确物品 ID；为空时返回空数组，最长按 100 字符处理。 |
| `locale` | string | 当前显示语言，默认 `zh`；拉丁字母查询允许英文名称 fallback。 |
| `limit` | number | 默认 `20`，后端限制到 `1..40`；物品卡片当前请求 `12` 条。 |
| `category` | `equipment \| other \| all` | 默认 `all` 以兼容旧调用；`equipment` 搜索装备、面部配饰和时尚配饰，`other` 仅搜索 `EquipSlotCategory = 0`。非法值返回 `400`。 |

响应沿用 `NSGlamourSearchItem` 的名称、图标和品质字段，并按分类返回：

```ts
interface NSGlamourCatalogItem extends NSGlamourSearchItem {
  item_kind: 'equipment' | 'item'
  item_card_slot?: string
}
```

- `equipment` 结果保留 `equip_slot_category`、`item_card_slot`、模型和 `dye_count`，供前端沿用现有装备及染色规则。
- `other` 结果固定 `item_kind: 'item'`、`equip_slot_category: 0`、`dye_count: 0`、`dye_entries: []`。
- `all` 目前返回 Item.csv 全目录结果，保留给既有调用；物品卡片界面只请求 `equipment` 或 `other`。

运行时边界：

- 数据来自服务端 `server/glamour/data/item_catalog.sqlite3`，由 `npm run build:glamour-item-catalog` 生成。
- 装备分类复用服务端现有 glamour 映射，不向前端下发完整映射文件；普通物品分类查询 SQLite。
- SQLite 按请求只读连接，不把完整目录加载进 Flask 常驻内存。
- 索引缺失时返回 `503` 和 `{ error: "item catalog unavailable" }`，不暴露服务器路径。

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

当前服务缓存行为：

| 路径 | 缓存 |
|------|------|
| `/font/<path>` | `public, max-age=31536000, immutable` |
| `/api/icon/<icon_id>` | `public, max-age=604800` |
| `/template-preview/<path>` | `public, max-age=31536000, immutable` |
| `/api/stains` | `public, max-age=3600` |
| `/api/ui-localization` | `no-store` |

V2 迁移时不能把字体、模板预览和图标缓存策略混为一谈；大资源需要版本号或内容哈希支撑长期缓存。

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
