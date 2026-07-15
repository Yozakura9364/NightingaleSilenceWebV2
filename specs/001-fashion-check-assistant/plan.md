# Implementation Plan: 时尚品鉴历史答案库

**Branch**: `main`（Spec Kit feature: `001-fashion-check-assistant`） | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: 先完成时尚品鉴历史答案库；页面、路由和本周染色展示留到后续实施切片。

## Summary

本计划只覆盖时尚品鉴助手的数据地基：把腾讯文档中的国服历史周次、主题、标签和社区金牌装备答案，转换为以官方 `FashionCheckWeeklyTheme`、`FashionCheckThemeCategory` 和 `Item` ID 为主键的确定性本地数据集。

第一阶段目标是完整覆盖国际服第 16 至 441 期、对应国服第 1 至 426 期的历史主题和金牌装备答案。低贴合等级、历史染色、公开页面和自动更新不在本切片内。

## Project Context

**Current project**: `H:\NightingaleSilenceWeb\NightingaleSilenceWebV2`

**Technology stack**: Vue 3.5, Vite 6, TypeScript 5.7, Node.js ESM build scripts, Vue Router 4, Pinia, static JSON runtime data.

**Files and sources read**:

- `AGENTS.md`
- `docs/OWNER_VISION.md`
- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/ARCHITECTURE_PLAN.md`
- `docs/ai/CODE_STRUCTURE_RULES.md`
- `docs/ai/API_CONVENTIONS.md`
- `docs/ai/PAGE_DEVELOPMENT_GUIDE.md`
- `docs/ai/MODULE_MAP.md`
- `docs/ai/MODULES/ffxiv.md`
- `docs/ai/data/ffxiv/README.md`
- `docs/ai/data/ffxiv/csv-table-notes.md`
- `docs/ai/data/ffxiv/csv-annotations.chs.json`
- `docs/ai/data/ffxiv/generated/csv-structure.chs.json`
- `scripts/build-armoire-catalog.mjs`
- `scripts/build-armoire-store-catalog.mjs`
- `scripts/check-armoire-store-catalog.mjs`
- `public/data/armoire-catalog.json`
- `H:\NightingaleSilenceWeb\NSGlamour\data\item_model_mapping.json`
- `local-assets/fashion-check/qq-fashion-check-history.json`
- `local-assets/fashion-check/qq-fashion-check-history.csv`
- `local-assets/fashion-check/qq-fashion-check-BB08J2-raw.csv`
- `FashionCheckWeeklyTheme.csv`, `FashionCheckThemeCategory.csv`, `Item.csv`
- `NeNeppie/AvantGarde` README and public tracker, plus other discovered repositories for comparison only

## Technical Context

**Language/Version**: Node.js ESM scripts; current machine Node.js 24.14.0, implementation limited to APIs available in the repository's existing Node/Vite toolchain.

**Primary Dependencies**: Node.js standard library only. No new npm dependency.

**Storage**: Build inputs and deterministic JSON/CSV outputs. Raw third-party reference data remains under ignored `local-assets/fashion-check/`.

**Testing**: Node built-in test runner, dedicated catalog checker, schema/coverage assertions, fixture-based resolver tests.

**Target Platform**: Windows local data build now; future static Vite deployment after a separate publication approval gate.

**Project Type**: Static data pipeline inside the existing Vue web application repository.

**Performance Goals**: Process 426 weeks, approximately 3,540 reference answer rows and approximately 30,000 Item rows in under 10 seconds on the current machine after inputs are local.

**Constraints**:

- No fuzzy match may be auto-accepted as an Item ID.
- Official CSV row IDs are canonical; names are labels and aliases only.
- Raw QQ/Google data is local-only until redistribution and attribution are explicitly approved.
- Missing or ambiguous source facts remain visible in audit output; they are never invented.
- Runtime data must not depend on NSArmoire or NSGlamour module-private JSON files.

**Scale/Scope**: 426 weekly records, 425 unique source theme labels, 276 unique source category labels, 5,160 source answer token occurrences and weekly growth of one record.

## Constitution Check

*GATE: passed before research and re-checked after design.*

- **Existing project truth**: passed. The plan follows V2 static-data patterns and FFXIV CSV rules.
- **Planning and approval**: passed. No business implementation starts before owner confirmation of this plan.
- **Data accuracy**: passed. Official IDs are canonical, source anomalies are retained, and fuzzy guesses are prohibited.
- **Public content and privacy**: passed conditionally. Raw third-party data stays ignored; public promotion requires separate source authorization and attribution confirmation.
- **Scope discipline**: passed. This slice does not add the route, page, localization UI, history browser or dye workflow.
- **Verification**: passed. Deterministic build, unit tests, coverage reports and a hard-failing checker are included.

Post-design re-check: no constitutional violations or complexity exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/001-fashion-check-assistant/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── static-data-contract.md
└── tasks.md                         # created later by $speckit-tasks
```

### Planned Source And Data Files

```text
data/fashion-check/
├── sources.json
├── theme-aliases.json
├── category-aliases.json
├── item-expression-overrides.json
└── accepted-source-exceptions.json

scripts/fashion-check/
├── build-history.mjs
├── check-history.mjs
└── lib/
    ├── csv.mjs
    ├── item-resolver.mjs
    ├── source-normalizer.mjs
    └── validation.mjs

tests/fashion-check/
├── item-resolver.test.mjs
└── history-builder.test.mjs

local-assets/fashion-check/            # ignored, local-only
├── qq-fashion-check-BB08J2-raw.csv
├── qq-fashion-check-history.json
├── qq-fashion-check-history.csv
├── references/
└── generated/
    ├── history.json
    ├── answers.json
    ├── items.json
    └── audit.json

docs/ai/MODULES/fashion-check.md
docs/ai/data/ffxiv/csv-table-notes.md
docs/ai/data/ffxiv/csv-annotations.chs.json
package.json
```

**Structure Decision**: Keep build logic under `scripts/fashion-check/`, small reviewed correction tables under `data/fashion-check/`, and all unapproved third-party inputs/outputs under ignored `local-assets/`. Future public outputs will use `public/data/fashion-check/` only after a separate promotion decision.

## Implementation Phases

### Phase 1 - Reproducible Source Normalization

1. Read the already extracted QQ history JSON/CSV without embedding session or protocol metadata.
2. Read official Chinese and English Fashion Check sheets plus Item data from a supplied local datamining directory or the project's existing remote/fallback pattern.
3. Normalize 426 contiguous weeks while retaining source row numbers, 7 irregular tag-count records and 2 missing source answer cells.
4. Resolve 10 historical theme aliases and 32 category aliases through explicit reviewed tables.

### Phase 2 - Canonical Gold Answer Catalog

1. Build category-to-gold-item mappings keyed by `FashionCheckThemeCategory` ID and equipment slot.
2. Use exact Item ID/name/slot matches first.
3. Build a source registry containing every reviewed source, its role, URL, retrieval time, license status and permitted use in this project.
4. Use the public AvantGarde tracker, QQ history, Kaiyoko profiles/posts and AllGameStaff current guides as separate evidence sources; correct community slot metadata from official Item data.
5. Parse QQ group expressions only through deterministic rules: shared prefix/suffix expansion, separators, `XX` family matching constrained by slot, and reviewed aliases.
6. Put unresolved semantic collections such as “各种族初始装备” or “及同模” into explicit overrides; never accept edit-distance guesses.
7. Require every category used by history to have at least one valid gold Item ID before the catalog can be marked complete.

### Phase 3 - Compact Item Index And Audit

1. Generate a compact Item index containing only referenced IDs, localized names, icon, slot and dyeability fields.
2. Generate an audit report with per-source coverage, alias use, candidate ambiguity, source disagreements, missing source cells and accepted exceptions.
3. Attach one or more evidence references to each category/item relationship; sources that do not support a relationship remain registry-only references.
4. Add hard checks for contiguous issues, canonical IDs, slot compatibility, duplicate IDs, broken source URLs and unresolved mappings.
5. Add package scripts and Node tests.

### Phase 4 - Documentation And Promotion Gate

1. Add the Fashion Check module data-source document.
2. Annotate both Fashion Check CSV sheets in the FFXIV data documentation.
3. Keep generated catalog local-only for this slice.
4. Before any move to `public/data/fashion-check/`, confirm redistribution/attribution terms for community-maintained source data and review the exact public files.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| QQ source uses shorthand, aliases and merged item families | Wrong Item IDs | Deterministic expansion, slot filtering, manual overrides and audit output |
| Community sources do not provide lower score tiers | Full scoring simulator cannot be built | Define this slice as gold-answer history only; retain lower tiers for later research |
| Historical source contains 3/5-tag weeks and two missing cells | False completeness claims | Preserve anomalies, cross-check category-level answers, never rewrite source history silently |
| AvantGarde tracker has no explicit data license and 7 slot mistakes | Publication and correctness risk | Use locally for cross-checking only; Item.csv overrides slot metadata; separate publication gate |
| Some reviewed sites are presentation tools rather than original evidence | Misleading attribution | Record source roles and attach evidence only where the source directly supports a claim |
| Module-private catalogs change concurrently | Cross-module regression | Read official Item CSV in the builder; do not make runtime depend on NSArmoire/NSGlamour JSON |
| Existing dirty worktree contains other conversations' changes | Accidental mixing | Touch only planned files and verify scoped Git status/diffs before any later commit |

## Verification Strategy

- Node unit tests for exact, slash-family, `XX`, same-model and manual-override resolution.
- Builder fixture test covering a normal 4-tag week, a 3-tag week, a 5-tag week and a missing source answer.
- Checker requires exactly 426 contiguous global issues `16..441` and CN issues `1..426`.
- All theme/category references must resolve to official IDs.
- Every emitted Item ID must exist in the current CN Item source and match the expected slot.
- Every category used by history must have a non-empty gold Item ID list or an explicitly approved exception.
- Audit must report zero unresolved mappings for a complete build.
- Generated outputs must contain no QQ session fields, anonymous request tokens, creator IDs or private browser data.
- Every source registry entry must have a stable public URL, role, access date and license/use-status field.
- Every emitted category/item relationship must reference at least one supporting evidence source.
- `npm run check:fashion-check-history`, `node --test tests/fashion-check/*.test.mjs`, and `git diff --check` must pass.

## Complexity Tracking

No constitution violation requires an exception.

## Automation Slice (2026-07-14)

第二切片新增服务器私有采集与 QQ 通知，不改变历史答案库的公开门禁：

1. NightingaleOpsBot runner 负责公开来源适配、时间窗判断、内容哈希、私有快照和持久通知队列。
2. systemd timer 每小时 `:05` 调用 runner；runner 在窗口外返回 `SKIP`，不访问来源。
3. AstrBot `astrbot_plugin_ns_ops` 提供公开 `/fc` 当周答案，并提供仅管理员可用的 `/fc bind/status/check/unbind`；成功发送主动通知后 ACK 队列。
4. QQ 原始 JSONP 不落盘；Google CSV 和 WordPress 页面只保存结构化派生数据及来源哈希。
5. 当前切片不创建 `public/data/fashion-check/`，也不把采集成功等同于官方 ID/槽位验证或转载授权。

生产目标是 `/opt/nightingale/NightingaleOpsBot/.local/fashion-check/`。当前服务器 Node.js 18.20.8，解析代码必须保持 Node 18 兼容；AllGameStaff 的 WordPress HTML 使用 `cheerio@1.0.0` 解析，不使用自写 HTML 字符串规则。
