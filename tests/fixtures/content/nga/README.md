# NGA BBCode Export — Golden Fixtures

These fixtures lock the NGA BBCode dialect mapping for the V2 content export
(T048/T049). Each case is a canonical Tiptap JSON document plus the expected
`{ text, losses }` output of `serializeNgaBbcode`.

## Dialect conventions (v1 — to be verified in NGA real preview, T055)

| V2 node/mark            | NGA output                                   | Loss                                  |
| ----------------------- | -------------------------------------------- | ------------------------------------- |
| text (no marks)         | raw text (NGA has no escape syntax)          | —                                     |
| `[` / `]` in text       | raw output; unknown tag-like text renders literally in NGA | —                     |
| bold                    | `[b]…[/b]`                                   | —                                     |
| italic                  | `[i]…[/i]`                                   | —                                     |
| underline               | `[u]…[/u]`                                   | —                                     |
| strike                  | `[del]…[/del]` (verified 2026-08-01; `[s]` is NOT NGA) | —                     |
| code (inline mark)      | `[code]…[/code]`                             | —                                     |
| textStyle color         | `[color=#RRGGBB]…[/color]` (works; canonical NGA form is named colors, e.g. `[color=darkblue]`) | — |
| textStyle sizePercent   | `[size=NN%]…[/size]`                        | —                                     |
| link (href != text)     | `[url=href]text[/url]`                      | —                                     |
| link (href == text)     | `[url]href[/url]`                           | —                                     |
| paragraph               | block separated by blank line                | —                                     |
| heading (level 2/3/4)   | `[b][size=120%]…[/size][/b]` (level map)     | INFO `heading-degraded`               |
| blockquote              | `[quote]…[/quote]`                          | —                                     |
| bulletList              | `[list]\n[*]item…[/list]`                   | —                                     |
| orderedList             | `[list=1]\n[*]item…[/list]`                | —                                     |
| codeBlock               | `[code=lang]…[/code]`（内容原样；已确认 2026-08-01：NGA 会在内容中第一个字面 `[/code]` 处提前闭合代码块，方言无转义机制可防——接受风险） | — |
| horizontalRule          | `==========` (NGA divider `===…===`; `[h][/h]` is the fallback form) | — |
| image                   | `[img]PUBLIC_URL[/img]`                     | BLOCKING if URL unstable/missing     |
| image caption           | `\n[b]caption[/b]` right after the img       | INFO `caption-as-text`               |
| gallery                 | `[album]` one URL per line, first image is the cover; flattens to `[img]` only when a caption exists | INFO `gallery-layout-degraded` (layout attr); INFO `gallery-flattened` (caption fallback) |
| collapse                | `[collapse=title]…[/collapse]`             | —                                     |
| table                   | `[table]` `[tr]` `[td]` `[/td]` `[/tr]` `[/table]` | —                            |
| tableHeader             | `[td][b]…[/b][/td]`                        | INFO `table-header-degraded`         |
| colspan/rowspan > 1     | `[td colspan=N]` / `[td rowspan=M]` native | —                                     |
| paragraph/heading align | ignored                                      | INFO `text-align-degraded`           |
| unknown node            | nothing (node skipped)                       | BLOCKING `unknown-node`              |
| unknown mark            | mark dropped, text kept                      | WARNING `unknown-mark`               |

Notes:
- Export is a pure function: the input document object is never mutated.
- Image URLs must be permanent HTTPS (COS/CDN); temporary signed URLs are
  rejected with a BLOCKING loss.
- Losses are sorted by `(nodePath joined, code)` for deterministic output.
- `mappingVersion` is `nga-v1`.
- Escaping policy (verified 2026-08-01): NGA has **no backslash escape
  syntax** — text/code/captions go out raw and NGA renders unknown
  tag-like text literally. Only the `[url=…]` attribute position is
  encoded (`]`→`%5D`, whitespace→`%20`, real percent-encoding). Collapse
  titles have brackets stripped (no escape mechanism exists there).
  Residual accepted risk (**verified** in NGA preview 2026-08-01): a
  literal `[/code]` inside codeBlock content closes the block early and
  the trailing text leaks out — the dialect offers no escape mechanism,
  so this is accepted and documented.
- Newlines are literal: paragraphs are blank-line separated, hardBreak is
  a single newline (matches NGA's manual-Enter behavior).
- Copy/download stays available when BLOCKING losses exist; the dialog
  shows an explicit "incomplete export" warning banner instead of
  disabling the actions (product decision, 2026-08-01).

## Verification log (T055)

| Date | Fixture set | NGA preview result | Notes |
| ---- | ----------- | ------------------ | ----- |
| 2026-08-01 | samples v1（8 个原始用例，mapping nga-v1） | 部分通过：15 项映射符合预期，4 项方言不符 | 见下方明细 |
| 2026-08-01 | samples v2（方言修复后，12 用例） | 待下次预览验证 `[del]` 与 `==========` 分割线 | [url]/color/反斜杠 3 项已由业主确认关闭，见明细 |
| 2026-08-01 | samples v3（album/表格跨列原生化，14 用例） | **通过**：`[del]` ✓（删除线生效）、`==========` ✓（渲染为分割线）、`[album]` ✓（渲染为相册卡片"查看相册/共2张图片"）、`[td colspan=2]` ✓（单元格跨列可见）、`[td rowspan=2]` ✓（高单元格可见） | 另确认：`[code]` 遇内容内字面 `[/code]` 会**提前闭合**（契约已记为接受风险，本次实锤）；`[url]` 配 `%5D` 编码无乱码（example.com 仍被预览拒绝，与映射无关） |

### 2026-08-01 NGA 真实预览核对明细（操作：发新帖粘贴预览，未提交）

符合预期（通过）：

- `[b]` `[i]` `[u]` 行内样式、行内 `[code]`（渲染为带标签的代码样式）
- `[color=#RRGGBB]`、`[size=NN%]` 生效
- 标题降级 `[b][size=120%]`：渲染为加粗大字号标题样式，可接受
- `[quote]` 引用框、`[list]` / `[list=1]` 列表
- `[code=ts]`：渲染为带行号与语法高亮的代码块
- `[collapse=Spoiler]`：渲染为可展开/收起的折叠控件，标题正确
- `[table]`：渲染为带边框表格，表头 `[td][b]` 粗体生效
- `[img]`：标签格式正确被解析为图片；因桶内无占位文件 404，NGA 回退显示原链接（用户确认属预期）
- 未知节点跳过：仅显示 before/after，无残留
- 危险图 URL：无任何输出

方言不符及处置（业主 2026-08-01 晚裁定）：

1. `[s]strike[/s]` 删除线原样显示 → **已修复**：NGA 删除线为 `[del]…[/del]`（业主确认），映射已改，待下次预览验证
2. `[hr]` 原样显示 → **已修复**：NGA 分割线为 `===…===` 形式（`[h][/h]` 备选），映射改为输出 `==========`，待下次预览验证
3. `[url=href]` / `[url]` 未解析 → **已关闭**：业主确认格式正确，初测失败系 example.com 被预览拒绝所致，非映射问题
4. `\[bracket\]` 反斜杠转义 → **已修复**：业主确认 NGA 无反斜杠转义语法，全部改为原样输出（仅 `[url=…]` 属性位保留百分号编码，collapse 标题剥离方括号）
