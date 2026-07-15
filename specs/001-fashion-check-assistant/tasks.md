# Tasks: 时尚品鉴历史答案库

**Input**: Design documents from `/specs/001-fashion-check-assistant/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/static-data-contract.md`, `quickstart.md`

**Current slice**: 只实现历史周次、官方 ID、金牌装备答案、来源证据和审计工具。不实现路由、页面、低贴合等级、历史染色或 80/100 分方案。

**Tests**: 本切片是 FFXIV 数据基础设施，按计划使用 Node 内置测试和硬失败 checker。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可与同阶段其他标记任务并行，且不修改同一文件。
- **[Story]**: 对应完整规格中被本数据切片支撑的用户故事。
- 每个任务都包含精确文件路径。

## Phase 1: Setup

**Purpose**: 建立不引入新依赖的本地数据管线目录和入口。

- [x] T001 Create `data/fashion-check/`, `scripts/fashion-check/lib/`, and `tests/fashion-check/` directory structure with only scoped files from the plan
- [x] T002 Add `build:fashion-check-history` and `check:fashion-check-history` Node ESM commands to `package.json`
- [x] T003 [P] Create the complete reviewed source registry with IDs, URLs, roles, retrieval dates, license status, use policy, and notes in `data/fashion-check/sources.json`

---

## Phase 2: Foundational Source And Canonical Data

**Purpose**: 建立所有历史和答案任务共用的 CSV、来源、别名和验证能力。

**CRITICAL**: 本阶段完成前不开始生成完整历史答案。

- [x] T004 [P] Implement RFC-compatible CSV parsing and BOM/header handling in `scripts/fashion-check/lib/csv.mjs`
- [x] T005 [P] Implement source registry loading, schema validation, role checks, and EvidenceRef validation in `scripts/fashion-check/lib/source-normalizer.mjs`
- [x] T006 [P] Add reviewed historical theme mappings in `data/fashion-check/theme-aliases.json`
- [x] T007 [P] Add reviewed historical category mappings and column-shift repairs in `data/fashion-check/category-aliases.json`
- [x] T008 Add shared issue ranges, slot enums, official-ID lookup, secret-field rejection, and deterministic JSON helpers in `scripts/fashion-check/lib/validation.mjs`
- [x] T009 Add fixture tests for CSV parsing, source registry completeness, evidence-role restrictions, and alias schemas in `tests/fashion-check/history-builder.test.mjs`

**Checkpoint**: 官方表、QQ 历史文件和全部已审阅外部来源都能被统一、可审计地读取。

---

## Phase 3: User Story 4 - 完整往期周次 (Priority: P3)

**Goal**: 产生国际服 16..441 / 国服 1..426 的连续历史，保留原始标签、原始答案、行号和异常。

**Independent Test**: 仅给定 QQ 历史和官方 Fashion Check CSV，构建器生成 426 期连续记录，所有主题和标签都转为官方 ID，7 个非 4 标签周和 2 个缺失答案单元被保留在审计中。

### Tests For User Story 4

- [x] T010 [P] [US4] Add fixtures for normal 4-slot, irregular 3-slot/5-slot, missing-answer, old-theme-name, and old-category-name weeks in `tests/fashion-check/fixtures/history/`
- [x] T011 [US4] Add failing normalization and chronology tests for 426 issues, canonical IDs, source rows, and anomaly preservation in `tests/fashion-check/history-builder.test.mjs`

### Implementation For User Story 4

- [x] T012 [US4] Implement QQ history normalization, slot normalization, chronology derivation, and canonical theme/category lookup in `scripts/fashion-check/lib/source-normalizer.mjs`
- [x] T013 [US4] Implement the history portion of the build orchestrator and audit counters in `scripts/fashion-check/build-history.mjs`
- [x] T014 [US4] Generate and inspect `local-assets/fashion-check/generated/history.json` and the history sections of `local-assets/fashion-check/generated/audit.json`

**Checkpoint**: 往期周次数据可独立生成和验证，不依赖页面实现。

---

## Phase 4: User Story 1 - 可查询的金牌装备答案底座 (Priority: P1)

**Goal**: 为历史使用过的每个 `categoryId + slotId` 生成有官方 Item ID、多来源证据和紧凑物品信息的金牌答案。

**Independent Test**: 仅读取生成的 `answers.json` 和 `items.json`，任一历史 `categoryId + slotId` 均能找到至少一件官方槽位兼容的金牌装备，并能追溯至至少一个真正支持该结论的来源。

### Tests For User Story 1

- [x] T015 [P] [US1] Add exact-name, slash-family, `XX` family, same-model wording, slot-conflict, ambiguity, and manual-override fixtures in `tests/fashion-check/fixtures/items/`
- [x] T016 [US1] Add failing deterministic resolver tests, including no fuzzy auto-acceptance and official slot precedence, in `tests/fashion-check/item-resolver.test.mjs`

### Implementation For User Story 1

- [x] T017 [P] [US1] Add reviewed deterministic expression corrections in `data/fashion-check/item-expression-overrides.json`
- [x] T018 [P] [US1] Add explicit missing-source and accepted-resolution records with evidence in `data/fashion-check/accepted-source-exceptions.json`
- [x] T019 [US1] Implement exact Item matching, separator/family expansion, slot filtering, override application, ambiguity reporting, and provenance emission in `scripts/fashion-check/lib/item-resolver.mjs`
- [x] T020 [US1] Integrate QQ evidence and available AvantGarde tracker evidence as a union keyed by canonical category and official Item slot in `scripts/fashion-check/build-history.mjs`
- [x] T021 [US1] Emit complete source registry, category EvidenceRef records, compact official Item metadata, source disagreements, and coverage reports from `scripts/fashion-check/build-history.mjs`
- [x] T022 [US1] Generate and inspect `local-assets/fashion-check/generated/answers.json`, `items.json`, and answer/audit sections of `audit.json`

**Checkpoint**: 金牌答案数据可供后续本周页面或历史页面消费，但本切片不声称已完成低贴合分档和染色。

---

## Phase 5: User Story 3 - 可重复构建与发布前验收 (Priority: P2)

**Goal**: 站点维护者可以用一组固定命令重建、审计和拒绝不完整的历史答案数据。

**Independent Test**: `npm run build:fashion-check-history` 和 `npm run check:fashion-check-history` 在完整本地输入上通过；任意删除周次、官方 ID、金牌答案、有效 evidence 或来源 URL 后 checker 必须失败。

### Tests For User Story 3

- [x] T023 [US3] Add checker mutation tests for missing issues, invalid IDs, incompatible slots, unresolved mappings, forbidden secret fields, unknown source IDs, and registry-only evidence in `tests/fashion-check/history-builder.test.mjs`

### Implementation For User Story 3

- [x] T024 [US3] Implement hard-failing generated-contract, chronology, ID, slot, evidence, source-registry, and secret-field checks in `scripts/fashion-check/check-history.mjs`
- [x] T025 [US3] Make generated JSON byte-stable for identical inputs except the documented `generatedAt` policy in `scripts/fashion-check/build-history.mjs`

**Checkpoint**: 数据维护流程能阻止不完整或无法追溯的结果进入后续公开发布阶段。

---

## Phase 6: Documentation And Cross-Cutting Verification

**Purpose**: 记录模块边界、CSV 表含义、全部来源和后续公开门禁。

- [x] T026 [P] Document module scope, commands, generated contracts, all reviewed source URLs/roles, evidence rules, known anomalies, and publication gate in `docs/ai/MODULES/fashion-check.md`
- [x] T027 [P] Document `FashionCheckWeeklyTheme.csv` and `FashionCheckThemeCategory.csv` limits in `docs/ai/data/ffxiv/csv-table-notes.md`
- [x] T028 [P] Add reviewed Chinese annotations for both Fashion Check sheets in `docs/ai/data/ffxiv/csv-annotations.chs.json`
- [x] T029 Run `npm run build:fashion-check-history`, `npm run check:fashion-check-history`, `node --test tests/fashion-check/*.test.mjs`, and `git diff --check`, then compare results with `specs/001-fashion-check-assistant/quickstart.md`
- [x] T030 Verify repository-root scoped Git status/diff contains no generated `local-assets/fashion-check/` data, raw third-party files, images, credentials, unrelated conversation changes, commits, or pushes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 可立即开始。
- **Phase 2**: 依赖 Phase 1，并阻塞所有数据用户故事。
- **US4 / Phase 3**: 依赖 Phase 2；先确立连续周次和官方 category 键。
- **US1 / Phase 4**: 依赖 US4 产生的实际 `categoryId + slotId` 集合。
- **US3 / Phase 5**: 依赖 US4 和 US1 的完整产物。
- **Phase 6**: 依赖所有实现任务。
- **US2**: 80/100 分方案不在本切片，没有实现任务。

### User Story Completion Order

```text
Foundational -> US4 history -> US1 gold-answer foundation -> US3 maintainer validation
```

### Parallel Opportunities

- T003、T004、T005、T006、T007 可按文件并行。
- T010 可与归一化实现准备并行。
- T015、T017、T018 可按 fixture/配置文件并行。
- T026、T027、T028 可按文档并行。

---

## Parallel Example: User Story 1

```text
Task T015: 在 tests/fashion-check/fixtures/items/ 准备解析和冲突样本
Task T017: 在 data/fashion-check/item-expression-overrides.json 录入已审阅表达式更正
Task T018: 在 data/fashion-check/accepted-source-exceptions.json 录入缺失源例外及证据
```

## Implementation Strategy

### History Foundation First

1. 完成 Setup 和 Foundational。
2. 先产生可验证的 426 期历史及官方主题/标签 ID。
3. 再以历史实际使用的 category/slot 集合构建多源金牌答案并集。
4. 最后用 checker、文档和公开发布门禁收口。
5. 生成物保持在 ignored `local-assets/`，不写入 `public/`，不提交、不推送。

## Notes

- 本清单共 30 个任务：Setup 3，Foundational 6，US4 5，US1 8，US3 3，Documentation/Verification 5。
- 所有任务都使用严格 checklist 格式、唯一 ID 和精确路径。
- 关联来源可以全部列入 registry，但只有直接支持某条结论的来源才能成为 EvidenceRef。
- 在本切片完成后，页面、染色、低贴合分档和 80/100 方案仍需后续规划与实现。

---

## Phase 7: Server Collection And QQ Notification

- [x] T031 Record both Asia/Shanghai collection windows and private-staging publication boundary in `data/fashion-check/collection-policy.json`
- [x] T032 Implement anonymous QQ page/bootstrap/opendoc decoding without persisting raw protocol metadata in NightingaleOpsBot runner
- [x] T033 Implement AvantGarde public CSV and AllGameStaff WordPress source adapters with content hashes
- [x] T034 Implement hourly window gating, per-source snapshots, failure counters and deduplicated persistent notifications
- [x] T035 Add `/fc bind/status/check/unbind` private admin commands and send-then-ACK delivery
- [x] T036 Add `nightingale-fashion-check.service` and `.timer` production units
- [x] T037 Add Node parser/window tests and include the collector in OpsBot syntax checks
- [x] T038 Document the automation storage, privacy, schedule, notification and publication contracts
- [x] T039 Deploy scoped runner/plugin/systemd files and run one production collection tick
- [x] T040 Bind the owner QQ private conversation and verify one real queued notification is ACKed after delivery
- [x] T041 Add public `/fc` current-week answers with stale-week suppression and keep all management subcommands administrator-only
