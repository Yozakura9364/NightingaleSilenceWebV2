---
summary: '时尚品鉴页面、历史底座、当前周公开数据和采集发布边界。'
status: 'active'
scope: 'fashion-check 页面、数据、生成器、来源和维护流程。'
source_of_truth: 'src/pages/fashion-check、data/public 数据、scripts 和 checker。'
read_when: '修改时尚品鉴页面、周数据、来源、多语言或自动采集。'
update_when: '路由、数据格式、来源、页面能力或发布边界改变时。'
verify: '运行历史 checker、生成器并检查三个公开路由。'
---

# 时尚品鉴助手模块

## 当前状态

- 页面路由：`#/ffxiv/fashioncheck`、`#/ffxiv/fashioncheck/gold-items`、`#/ffxiv/fashioncheck/sources`。
- 已完成：历史周次与金牌装备答案的本地数据底座；当前周 Vue 页面、80/100 作业、金牌物品一览和数据来源展示。
- 已实现并部署：服务器私有自动采集、两个北京时间窗口、持久 QQ 通知队列。
- 当前页面数据：`public/data/fashion-check/current.json` 仅包含用户确认可公开的当前周切片，含所需物品 ID、图标 ID、品质和金牌分值；`public/data/fashion-check/current-locales.json` 按同一批 ID 提供中英日韩装备名、染剂名，以及根据染剂分类自动解析的实际消耗物品与图标，跟随全局语言状态切换。页面进入时以无缓存请求读取这两个文件；展示结构不变的每周更新可以只替换生产静态目录中的语言索引和当前周 JSON，不需要重启静态服务。
- 未实现：低贴合分档、历史染色、历史答案公开浏览和公开自动发布。
- 未公开：原始参考和生成物位于 ignored `local-assets/fashion-check/`。

Spec Kit 设计文档位于 `specs/001-fashion-check-assistant/`。

每周公开作业与服务器 staging 的维护步骤见 `docs/ai/FASHION_CHECK_WEEKLY_MAINTENANCE.md`。

## 页面样式契约

- 一级业务区域统一使用 `.ns-workbench-panel`、`--solid` / `--soft` / `--compact` modifier 和公共 panel title；内部装备行、染色行等高密度数据可继续使用 `1px` 像素分隔。
- 页面标题使用公共 night bloom，`AppTabs` 和右键菜单按钮保留公共像素字体、focus 与交互状态，页面 scoped CSS 不覆盖公共控件字体。
- 双列/三列桌面布局与移动端单列布局属于 FashionCheck 页面私有结构，不上提为公共工作台布局组件。
- Item rarity 颜色是 FFXIV 业务颜色，必须保持当前值；在没有第二个稳定复用点前不抽通用状态色或全站 token。

## 数据范围

2026-07-14 本地验证快照：

- 国际服 16..441 期，对应国服 1..426 期，共 426 期连续历史。
- 426 个官方 `FashionCheckWeeklyTheme` RowId。
- 历史使用 250 个官方 `FashionCheckThemeCategory` RowId。
- 440 个实际 `categoryId + slotId` 组合全部拥有金牌 Item ID。
- 3393 个官方 Item RowId，包含中英名称、图标、槽位和染色槽数。
- 10 个主题旧译名、32 个标签旧译名/错别字/列错位和 1 条部位修正均显式记录。

本切片只声称“社区已验证/已报告的金牌装备”。不根据装备名相似度推断低贴合分档，不从金牌答案反推历史染色。

`data/fashion-check/lower-tier-candidates.json` 仅保存已审阅来源中明确标注的低分档候选，例如 Gottesstrafe Reddit `1 Star` 装备；它不是公开页面数据，也不参与当前金牌答案构建。

服务器当前周采集也遵循相同证据规则：QQ 表中的平铺装备文本默认是“待核验档位”；只有来源明确的 Gold/Silver 分数表或维护者人工确认才会写入分档与分值。80/100 方案会保留基础分、装备和染色的逐项审计；缺少任一可靠分值时只保留来源方案，不能宣称精确得分。

## 目录边界

```text
data/fashion-check/                 # 已审阅的来源/别名/表达式配置
data/fashion-check/lower-tier-candidates.json  # 明确来源标注的低分档候选，当前仅本地证据
scripts/fashion-check/              # Node ESM 构建器和 checker
tests/fashion-check/                # fixture 与真实生成物 mutation 测试
local-assets/fashion-check/         # 原始第三方参考与生成物，不跟踪
specs/001-fashion-check-assistant/  # 规格、计划、契约和任务
```

构建器直接读取官方 CSV，不读取 NSArmoire/NSGlamour 模块私有 JSON。

## 全部来源

机器可读登记表是 `data/fashion-check/sources.json`。每个来源均保留 URL、角色、检索时间、许可状态、使用政策和说明。公开页面只读取 `public/data/fashion-check/sources.json` 中已核准的署名、标题和链接。

| Source ID                | URL                                                                                        | 角色                                          | 当前用法                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `ffxiv-datamining-mixed` | `https://github.com/InfSein/ffxiv-datamining-mixed`                                        | canonical                                     | RowId、名称、图标和 Item 槽位；仓库未声明许可证                                       |
| `qq-cn-history`          | `https://www.youwanc.com/`                                                                 | history, gold-answers                         | 游玩 c 哩酱的国服历史与答案原文，仅本地证据                                           |
| `avantgarde`             | `https://github.com/NeNeppie/AvantGarde`                                                   | gold-answers, mechanics, validation-only      | AGPL-3.0 代码/机制参考，不复制源码                                                    |
| `avantgarde-tracker`     | `https://docs.google.com/spreadsheets/d/1b9NwL-Ba4tS0ROSy1_4HPfi7QSMQWuhXKqFSSY9Ovp4/edit` | gold-answers                                  | Category-to-Item 证据；表内感谢 Kaiyoko Star，数据许可未声明                          |
| `kaiyoko-reddit`         | `https://www.reddit.com/user/KaiyokoStar/`                                                 | current-week, gold-answers, dyes              | 每周信息图主页；未审阅具体帖子时不作 evidence                                         |
| `kaiyoko-x`              | `https://x.com/KaiyokoStar`                                                                | current-week, gold-answers, dyes              | 每周信息图主页，当前 link-only                                                        |
| `gottesstrafe-reddit`    | `https://www.reddit.com/user/Gottesstrafe/`                                                | current-week, gold-answers, dyes, score-plans | 当前英文社区常见 results/full-details 发帖者；已审阅 Results 帖可作本地低分档候选证据 |
| `allgamestaff-en`        | `https://www.allgamestaff.it/fashion-report-guide-ffxiv-eng/`                              | current-week, gold-answers, dyes              | 可变的当周 80/100/染色对照，非稳定历史 API                                            |
| `allgamestaff-it`        | `https://www.allgamestaff.it/guida-fashion-report-ffxiv/`                                  | current-week, gold-answers, dyes              | 意大利语当周对照，非稳定历史 API                                                      |
| `shapes-fashionreportff` | `https://shapes.inc/fashionreportff`                                                       | related-tool                                  | 相关展示工具，不暴露稳定底层数据，不作 evidence                                       |
| `dsa-fashion-check-tool` | `https://github.com/dsa83171/FFXIV-Fashion-check-Tool`                                     | history, validation-only                      | 繁中周次/部位校对，仓库未声明许可证                                                   |
| `kevin-fashion-report`   | `https://github.com/KevinAllenWiegand/ffxiv-fashion-report`                                | history, validation-only                      | 英文历史周次与提示校对，仓库未声明许可证                                              |
| `etsuna-fashion-report`  | `https://github.com/Etsuna/FFXIVFashionReport`                                             | related-tool, validation-only                 | MIT 桌面工具参考，不作主数据源                                                        |

`related-tool` 或 `link-only` 来源可出现在 credits/registry，但不能被写入 Item `EvidenceRef`。checker 会拒绝这种混用。

## 证据规则

1. 官方 Fashion Check / Item RowId 和 Item 槽位是主键与元数据真值。
2. QQ 历史答案中的完整 Item 名先做精确匹配。
3. AvantGarde tracker 用 Item ID 与英文 Category 做并集；社区槽位与 Item 冲突时以 Item 为准。
4. `XX`、职能组和花色集合只通过 `item-expression-overrides.json` 中已审阅且受槽位约束的正则展开。
5. 不使用编辑距离/模糊匹配自动接受 Item。
6. 每个 `categoryId + itemId` 关系都有独立 `evidenceByItemId`。

## 已知源异常

- 7 期 `tag_count` 不是 4；国际服 145 期实际保留 4 个槽位，但手部标签为空。
- 2 个 QQ 答案单元缺失：国际服 220 期手部、303 期身体。分类答案由其他已登记证据补齐，原单元仍保留为异常。
- 国际服 70 期“皮靴”被 QQ 源放在腿部；Kevin 周表和 Item 槽位确认为脚部。审计保留 `legs -> feet`。
- AvantGarde tracker 有 7 行把 choker 标为 Ring；生成物使用官方 Neck 槽位并保留差异。
- tracker 的 `Avant Garde` 与官方 `Avant-garde` 仅做大小写、空白和连字符标准化。

## 生成契约

```text
local-assets/fashion-check/generated/
├── history.json  # 周次、全部来源、官方主题/标签 ID、原文与异常
├── answers.json  # category/slot 金牌 Item ID 及逐 Item evidence
├── items.json    # 仅包含被答案引用的紧凑 Item 索引
└── audit.json    # 别名、解析、来源覆盖、差异、例外和错误
```

详细字段见 `specs/001-fashion-check-assistant/contracts/static-data-contract.md`。生成物不得包含 cookie、token、session、QQ creator/user 字段或浏览器状态。

## 构建与验证

```powershell
npm run build:fashion-check-history
npm run check:fashion-check-history
node --test tests/fashion-check/*.test.mjs
node scripts/fashion-check/build-current-locales.mjs
```

`build-current-locales.mjs` 只提取当前公开切片引用的 Item ID 和 Dye ID，产物不包含完整官方 CSV。它同时读取轻量 `armoire-dye-catalog.json` 的染剂分类，自动把普通色、追加染剂 1、追加染剂 2 和独立商城染剂解析为实际消耗物品，并写入 `dyeItems`。脚本需要 ignored 的 `local-assets/fashion-check/references/official/{chs,en,ja,ko}/Item.csv`；中英文源与历史构建器共用，日文和韩文源只用于当前公开名称索引。法德不在此契约内，前端按英文回退。

## 自动采集

调度策略见 `data/fashion-check/collection-policy.json`，服务契约见 `specs/001-fashion-check-assistant/contracts/automation-contract.md`。

- 周二 16:05 至周三 16:05：每小时采集 QQ 当前主题、部位和标签。
- 周五 16:05 至周六 16:05：每小时采集 QQ、AvantGarde tracker、AllGameStaff 中英页面。
- `gottesstrafe-reddit` 已登记为候选来源，并可人工审阅 Results 帖中的明确低分档 claim；尚未加入自动采集窗口，加入前需确认具体帖子的新鲜度语义、转载/引用边界和解析失败口径。
- 窗口外不访问来源；相同内容按 SHA-256 去重。
- QQ `opendoc` 原始响应不落盘，只保存去除协议/账号字段后的派生数据。
- `/fc` 向群友和私聊用户返回严格属于当前周次的答案；旧周 staging 不会被冒充为本周答案。
- `/fc bind` 单独绑定维护者私聊；`status/bind/check/unbind` 仅限管理员，通知发送成功后才从持久队列 ACK。
- 当前产物属于服务器私有 staging，不是公开页面数据，也不替代官方 Item ID/槽位校验。

2026-07-14 生产验证：`nightingale-fashion-check.timer` 与 `nightingale-ops-runner` 均为 active；手动触发周二窗口成功读取 QQ 943 行并生成 1 条持久通知。维护者绑定私聊后，队列由 1 变为 0，确认发送后 ACK 成功。Google tracker 在服务器直连超时，已仅对该来源使用现有 `172.19.0.1:7890` 受控代理；QQ 和 AllGameStaff 保持直连。

checker 要求 426 期连续周次、0 unresolved、官方 ID/槽位有效、逐 Item evidence 完整、7 期标签数异常与 2 期答案缺失保留，并拒绝敏感字段。

## 公开发布门禁

当前仅公开用户已确认的当前周切片 `public/data/fashion-check/current.json`、其生成的中英日韩名称索引 `public/data/fashion-check/current-locales.json`，以及经用户确认的来源署名清单 `public/data/fashion-check/sources.json`。扩展为历史库或其他公开静态数据前必须：

1. 由用户确认具体公开文件和字段。
2. 复核 QQ 社区表和 AvantGarde tracker 的转载、署名与许可条款。
3. 确认 credits 覆盖 tracker 明示感谢的 Kaiyoko Star。
4. 生成独立公开数据 diff，重跑 checker/test/build。
5. 确认无原始第三方文件、会话数据、私有路径或未授权图片进入构建产物。
