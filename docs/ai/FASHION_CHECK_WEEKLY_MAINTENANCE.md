# 时尚品鉴每周维护指南

本文是时尚品鉴助手的操作手册。目标是在不把未核验社区信息、私有会话数据或第三方原始文件公开的前提下，更新：

- `#/ffxiv/fashioncheck` 的 80 分、100 分和染色作业；
- `#/ffxiv/fashioncheck/gold-items` 的当周金牌装备；
- `/fc` 所使用的服务器私有 staging 与维护者通知。

模块结构、历史数据规则和来源登记见 `docs/ai/MODULES/fashion-check.md`。本文不替代历史构建器的证据规则。

## 维护原则

1. **先确认周次，再确认答案。** 每次都用北京时间周二 16:00 作为新周边界，公开 `globalIssue`、`cnIssue`、主题和挑战时间必须属于同一周。
2. **ID 是事实主键。** Item ID、图标 ID、槽位、主题/标签 ID 和 Dye ID 不能依据名称猜测。名称仅用于展示。
3. **金牌、80 分、100 分分开核验。** 金牌装备清单不自动推出染色和作业；来源只证明其中一种信息时，不补写其他信息。
4. **服务器采集不等于可公开。** 自动采集产物只进入私有 staging，人工确认后才修改 `public/data/fashion-check/`。
5. **不以翻译文本作为数据键。** 新增物品或染剂时必须有 ID，随后生成中英日韩名称索引。
6. **不公开敏感或原始内容。** 不提交 cookie、token、QQ `opendoc` 原始响应、浏览器状态、私有 staging、完整第三方 CSV 或未授权图片。

## 每周时间线

所有时间均为 `Asia/Shanghai`。

| 时间 | 目标 | 允许的动作 | 不允许的动作 |
| --- | --- | --- | --- |
| 周二 16:05 至周三 16:05 | 发现新主题、部位和标签 | 读取服务器通知、对照社区来源、填写待确认记录 | 根据旧周答案提前公开作业 |
| 周三至周四 | 整理主题和候选金牌 | 核对官方 ID、槽位、图标和名称 | 根据装备名相似度猜测分档 |
| 周五 16:05 至周六 16:05 | 确认金牌、染色、80/100 作业 | 多源对照、更新私有 staging、人工验算 | 未核验时将候选答案称为金牌或满分 |
| 确认完成后 | 发布当前周切片 | 修改公开 JSON、生成语言索引、跑检查、浏览器核对 | 直接发布服务器 `.local` 内容 |

## 来源使用顺序

### 事实来源

1. 官方多语言 CSV：Item ID、装备槽位、图标、品质、染色槽与名称。
2. 当周已审阅社区作业：主题、标签、金牌候选、染色和 80/100 方案。
3. 交叉来源：仅用于互证，不覆盖官方 Item 槽位。

### 公开署名来源

公开页面只列出 `public/data/fashion-check/sources.json` 中的作者和网址。新增、删除或改名公开署名时：

1. 只改公开清单，不把内部许可判断、抓取时间或使用策略暴露到页面。
2. 只保留用户确认可展示的来源。
3. 页面卡片只显示作者名和网址，不额外展示 AI 自拟标题或说明。

### 证据边界

- `link-only`、`related-tool` 和未逐帖审阅的主页只能作为参考链接，不能写入金牌 Item evidence。
- 社区来源的部位与官方 `Item.EquipSlotCategory` 冲突时，以官方槽位为准，并在审计数据中记录差异。
- 名称中出现 `XX`、职能组、同模或集合表达式时，只使用已审阅的 `data/fashion-check/item-expression-overrides.json`；不得现场添加宽泛正则或模糊匹配。

## 服务器私有采集

服务器采集由 NightingaleOpsBot 承担，生产数据在其私有 `.local/fashion-check/` staging 中。V2 网页不直接读取该目录。

### 常用维护动作

1. 收到私聊通知后，用 `/fc status` 或 `/fc check` 确认采集窗口、周次和来源状态。
2. 新主题窗口只确认主题和标签；周五答案窗口才确认金牌、染色和分数方案。
3. `/fc` 对群友只应回复已公开且属于当前周的答案；私有 staging 仍是旧周时，应保留“本周答案尚未更新”的结果。
4. 采集失败、来源变更或跨周混入时，先修私有 staging/解析，再决定是否改公开网页。

### 禁止事项

- 不把服务器 `.local/fashion-check/current.json` 复制为网页 `public/data/fashion-check/current.json`。
- 不在聊天、提交、文档或截图中粘贴 token、cookie、会话 ID、原始响应或完整机器人配置。
- 不因为来源抓取成功就跳过官方 Item ID 与槽位校验。

## 公开当前周数据

当周作业与金牌物品页面只读取以下两个文件：

```text
public/data/fashion-check/current.json
public/data/fashion-check/current-locales.json
```

### `current.json` 必填内容

| 字段 | 说明 |
| --- | --- |
| `schemaVersion` | 当前使用 `fashion-check.public-current.v4`。结构调整时升级版本。 |
| `globalIssue` / `cnIssue` | 国际服和国服周次，必须与本周主题一致。 |
| `theme` | 已确认的当前主题展示名。 |
| `challengeWindow` | `+08:00` 的可挑战起止时间。 |
| `referenceShowcase` | 用户可见的 80 分、100 分与全部位染色展示。 |
| `solutions` | 备用结构化分数方案；当前展示优先使用 `referenceShowcase`。 |
| `slots` | 金牌物品页的部位、标签、金牌分值与 Item 列表。 |

### Item 条目

每个展示装备至少包含：

```json
{
  "itemId": 7163,
  "name": "亚拉戈高位重长衣",
  "iconId": 43205,
  "rarity": 3
}
```

- `itemId` 必须存在于官方 Item.csv。
- `iconId` 必须与该 Item 对应；不使用网络图片 URL。
- `rarity` 用于网页物品品质色。
- `name` 是中文回退；中英日韩显示名由 `current-locales.json` 覆盖。

### 染剂条目

精确染剂必须携带 `dyeId`：

```json
{
  "dyeId": 6,
  "name": "煤烟黑",
  "color": "#2B2923",
  "points": 2,
  "declaration": "通用染剂",
  "declarationKey": "fashionCheck.commonDye"
}
```

- `dyeId` 是生成多语言染剂名的唯一键；缺失时生成器必须失败。
- `name` 和 `declaration` 是中文回退，不能替代 ID。
- 色系使用 `family.id`，目前只接受 `black`、`red` 等已在前端本地化消息中登记的值；新增色系前先补齐中英日韩文案。

### 泛用可染色装备

没有确定物品时，仍必须使用对应皇帝装备图标，并提供本地化 key：

```json
{
  "slotId": "body",
  "iconId": 42422,
  "label": "任意可染色身体装备",
  "labelKey": "fashionCheck.anyDyeableBody"
}
```

当前图标约定：身体 `42422`、腿部 `45539`、脚部 `46446`。不要用空白图标、通用占位符或随意替换为其他装备图标。

## 中英日韩名称索引

网页顶部菜单的 `zh-CN`、`en`、`ja`、`ko` 切换会读取 `current-locales.json`。法德当前按英文名称回退。

### 输入文件

下列文件都属于 ignored 的本地参考资料，不能提交：

```text
local-assets/fashion-check/references/official/chs/Item.csv
local-assets/fashion-check/references/official/en/Item.csv
local-assets/fashion-check/references/official/ja/Item.csv
local-assets/fashion-check/references/official/ko/Item.csv
```

染剂中英日韩名称维护在受跟踪的小型配置中：

```text
data/fashion-check/current-dye-locales.json
```

新增本周染剂时，先在该配置中补齐四种名称，再运行：

```powershell
node scripts/fashion-check/build-current-locales.mjs
```

生成器会从 `current.json` 收集所有 `itemId` 与 `dyeId`，缺任一语言名称即失败。成功后才会覆写：

```text
public/data/fashion-check/current-locales.json
```

不要手工编辑该生成物，修改源数据后重新生成。

## 标准发布流程

### 1. 收集并确认

- 确认周次、主题、标签、可挑战时间。
- 对每个金牌部位确认 Item ID、槽位、图标和品质。
- 分别确认 80 分、100 分、精确染色、同色系染色与通用/特殊染剂声明。
- 证据不足时，宁可不发布该项，也不要用上周、推测或未核验内容补齐。

### 2. 更新公开切片

1. 只编辑 `public/data/fashion-check/current.json` 中本周相关字段。
2. 所有新装备写入 `itemId`、`name`、`iconId`、`rarity`。
3. 所有精确染剂写入 `dyeId`。
4. 有泛用装备说明时使用已有 `labelKey`；新增 key 必须同时补齐中英日韩消息。
5. 必要时更新 `public/data/fashion-check/sources.json`，但只改用户确认的公开署名与网址。

### 3. 重建语言索引

```powershell
node scripts/fashion-check/build-current-locales.mjs
```

若失败，按错误中的 Item ID 或 Dye ID 修复源数据，不要删除条目绕过检查。

### 4. 自动验证

```powershell
npm run typecheck
npm run check:i18n
npm run build
```

若变更涉及历史别名、金牌证据或历史构建器，再额外运行：

```powershell
npm run build:fashion-check-history
npm run check:fashion-check-history
node --test tests/fashion-check/*.test.mjs
```

### 5. 浏览器验收

逐项检查：

1. `#/ffxiv/fashioncheck`：80 分、100 分、六个染色槽的文案、图标、色块和分数无错位。
2. `#/ffxiv/fashioncheck/gold-items`：每个部位的标签、金牌分值、装备图标与品质色正确。
3. 右上角语言切换：中文、英文、日文、韩文下的装备名、染剂名、部位名、色系和泛用装备说明都变化；法德按英文回退。
4. `#/ffxiv/fashioncheck/sources`：只显示用户确认的作者名与网址，不显示工具标题、内部说明或已移除来源。
5. 旧周的主题、挑战日期、Item ID、染剂和截图不得残留。

推荐截图命名：`fashion-check-zh.png`、`fashion-check-en.png`、`fashion-check-ja.png`、`fashion-check-ko.png`、`fashion-check-gold.png`、`fashion-check-sources.png`。

## 常见故障

| 现象 | 优先检查 | 处理方式 |
| --- | --- | --- |
| 页面显示中文装备名 | `current-locales.json` 是否存在该 Item ID | 更新 `current.json` 后重跑名称生成器 |
| 日/韩名称缺失 | 对应 Item.csv 是否在 ignored 参考目录 | 补齐官方 CSV；不要用机翻代替 |
| 染剂仍显示中文 | 染剂条目是否有 `dyeId`，配置是否包含四语名称 | 补 `current-dye-locales.json` 后重跑生成器 |
| 部位名未切换 | `slotId` 是否为标准槽位，消息 key 是否已登记 | 使用 `weapon/head/body/hands/legs/feet`，补中英日韩消息 |
| 金牌物品图标错误 | Item ID 与 Icon ID 是否来自同一行 | 以官方 Item.csv 修复，不修改图标 URL |
| 生成器报缺失 Item ID | 任一语言 Item.csv 中没有该 ID/Name | 更新本地官方 CSV 或暂停发布该物品 |
| `/fc` 发旧周答案 | 服务器私有 staging 的周次未更新 | 不修改网页补救；先修采集/审核状态 |
| 来源页出现不该展示的条目 | `public/data/fashion-check/sources.json` | 仅从公开清单移除；保留内部证据记录 |

## 交给 Codex 的最短请求

每周只需发送：

```text
到了时尚品鉴更新答案时间，帮我去找答案并且更新。
```

收到后，维护者依次完成来源检索、周次确认、官方 Item/Dye ID 与槽位核验、私有 staging 更新、公开切片更新、多语言名称生成和页面验收。证据不足时先回报缺口，不把候选答案直接公开。

## 提交与发布

- 当前周公开数据、语言索引、前端展示逻辑和维护文档应作为同一项时尚品鉴改动审阅。
- 提交前只 stage 时尚品鉴相关文件；工作区中其他模块可能同时存在未提交改动。
- 提交前检查 `git diff --cached --name-only` 和 staged diff，确认没有本地 CSV、原始参考、图片、token 或其他对话的文件。
- 未经明确要求，不创建 commit 或推送。推送前按 `AGENTS.md` 核验 GitHub 登录态、本地提交身份、历史作者/提交者和 refs。
