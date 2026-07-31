# Tasks: 博客与专题富内容编辑器

**Input**: `specs/002-rich-content-editor/` 下已经确认的规格、计划、研究、数据模型与契约

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: 本功能的结构迁移、保存恢复、上传安全、公开隔离、导出确定性和真实浏览器路径均为明确验收条件；每个用户故事先建立失败测试或可复现验收，再实现对应行为。

**Organization**: 任务按用户故事组织。Phase 1-2 是所有故事共享的审批、方言、模型和安全基础；其后每个故事可独立验收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 在依赖已满足时可与相邻任务并行，且不修改同一文件
- **[Story]**: 对应 `spec.md` 中的 US1-US4
- 每个任务都包含明确文件路径；不得顺手修改或格式化无关文件

---

## Phase 1: Setup - Dependency, Build and NGA Dialect Gates

**Purpose**: 在业务实现前固定依赖、authoring 构建边界、测试入口和真实 NGA 方言

- [ ] T001 按已批准依赖范围审计许可证、Python 3.8/npm peer 兼容、install scripts 和 lockfile diff，并将 Tiptap/Vitest 依赖写入 `package.json`、`package-lock.json`，将 Pillow/jsonschema 写入 `server/content/requirements.txt`
- [ ] T002 在 `package.json` 和 `scripts/dev-content-studio.mjs` 增加 `dev:content-studio`、`test:content`、`test:content-api`、`build:content`、`check:content` 命令及本机 Vite/helper 生命周期管理
- [ ] T003 [P] 在 `vitest.config.ts` 建立只覆盖 `src/lib/content/` 与 `tests/content/` 的 Vitest 配置，不改变现有 Node 测试入口
- [ ] T004 [P] 在 `.gitignore` 和 `scripts/content/check-local-boundary.mjs` 固定 `local-assets/content-studio/`、草稿、审计、staging 图片和 Base64 不得进入 Git/构建产物的检查
- [ ] T005 使用合成文本和一张已授权 COS 测试图，在 NGA 真实编辑预览中核对基础标签、嵌套、转义、表格、折叠、永久 HTTPS 图片 URL 与防盗链行为，并把结论写入 `tests/fixtures/content/nga/README.md` 和 `tests/fixtures/content/nga/dialect-v1.json`，不得提交测试图片或发布帖子

**Checkpoint**: 依赖审计、普通构建隔离方向和 NGA 实际方言均已明确；依赖审计或 T005 未通过时不得进入业务实现。

---

## Phase 2: Foundational - Canonical Model and Security Boundaries

**Purpose**: 建立所有故事共享的版本化原稿、验证、错误、API 与安全边界

**CRITICAL**: 本阶段完成前不得开始用户故事实现。

- [ ] T006 [P] 先为合法/非法/未知版本/未知节点/危险链接/超深结构建立失败测试与合成样例，写入 `tests/content/model/document-schema.test.ts` 和 `tests/fixtures/content/documents/`
- [ ] T007 [P] 先为缺失 token、恶意 Host/Origin、超大请求、路径穿越和错误脱敏建立失败测试，写入 `server/content/tests/test_security.py`
- [ ] T008 在 `src/lib/content/model/types.ts` 定义 ContentEntry、ContentRevision、ContentDocument、MediaAsset、Publication、ExportArtifact、ExportLoss 与状态枚举，字段保持与 `data-model.md` 一致
- [ ] T009 在 `src/lib/content/model/document-validator.ts` 和 `src/lib/content/model/migrations.ts` 实现 `content.document.v1` 白名单、深度/数量限制、未知版本 fail-closed 和纯迁移入口，使 T006 通过
- [ ] T010 [P] 在 `src/lib/content/model/canonical-json.ts` 和 `src/lib/content/model/media-url.ts` 实现稳定 JSON/hash 输入、HTTPS/根相对链接规则、COS/CDN host allowlist 与永久 URL 判定
- [ ] T011 [P] 在 `src/lib/content/export/types.ts` 和 `src/lib/content/export/tree-walker.ts` 建立确定性遍历、节点路径、loss 等级与未知节点阻断基础
- [ ] T012 在 `server/content/schema.py` 使用同一份 `specs/002-rich-content-editor/contracts/editor-document.schema.json` 执行 Python 写入边界验证，并增加独立深度、字节和节点数量限制
- [ ] T013 在 `server/content/config.py`、`server/content/security.py` 和 `server/content/errors.py` 实现仅 `127.0.0.1`、Host/Origin/启动 token、请求上限、路径 allowlist、无 CORS 与无堆栈/绝对路径错误响应，使 T007 通过
- [ ] T014 [P] 在 `src/pages/content-studio/services/contentStudioApi.ts` 和 `src/pages/content-studio/services/contentStudioTypes.ts` 按 `contracts/content-api.openapi.yaml` 建立类型化客户端、统一错误与 token 注入，不硬编码公开环境端口
- [ ] T015 在 `src/config/features.ts`、`src/env.d.ts`、`vite.config.ts` 和 `src/router/index.ts` 建立 `VITE_ENABLE_CONTENT_STUDIO` 编译期边界，保证 false 时不注册 studio 路由且无法生成 Tiptap chunk

**Checkpoint**: 原稿、服务端写入、URL、错误和 authoring 构建边界可独立测试，未知内容不会静默进入保存、发布或渲染。

---

## Phase 3: User Story 1 - 编写并恢复富内容草稿 (Priority: P1) MVP

**Goal**: 站长可所见即所得编写文字、复杂表格、单图/多图与折叠内容，并可靠自动保存和恢复。

**Independent Test**: 创建包含标题、列表、引用、代码、20×20 表格、单图和三图画廊的草稿；刷新后节点、表格、图片顺序、图注和元数据完整恢复，冲突/断线不覆盖较新内容。

### Tests for User Story 1

- [ ] T016 [P] [US1] 先为 Tiptap JSON 往返、表格修复、画廊/折叠节点和 50,000 字样例建立失败测试，写入 `tests/content/editor/editor-roundtrip.test.ts`
- [ ] T017 [P] [US1] 先为草稿创建、相同保存去重、原子 revision、409 冲突和恢复建立失败 API 测试，写入 `server/content/tests/test_drafts.py`
- [ ] T018 [P] [US1] 先为伪装图片、SVG、字节/像素/尺寸超限、路径文件名、匿名 CDN 检查和部分上传失败建立失败测试，写入 `server/content/tests/test_media.py`
- [ ] T019 [P] [US1] 先编写桌面创建、表格操作、粘贴/拖入、多图、自动保存、刷新恢复和双标签冲突的浏览器验收，写入 `tests/content/browser/content-studio-draft.spec.mjs`

### Implementation for User Story 1

- [ ] T020 [P] [US1] 在 `src/lib/content/editor/extensions.ts` 配置受控 StarterKit、文字 marks、对齐、TableKit、Image 与 FileHandler，禁用 raw HTML 和 Base64
- [ ] T021 [P] [US1] 在 `src/lib/content/editor/nodes/gallery.ts`、`src/lib/content/editor/nodes/collapse.ts` 和 `src/lib/content/editor/nodes/figure.ts` 实现稳定的 gallery/collapse/figure Schema 与 JSON 属性，使 T016 通过
- [ ] T022 [US1] 在 `server/content/storage.py` 和 `server/content/models.py` 实现 ContentEntry、不可变 revision、canonical hash、原子替换、revision 去重与审计文件边界
- [ ] T023 [US1] 在 `server/content/media.py` 实现 Pillow 真格式解码、字节/像素/尺寸限制、生成对象名、staging 和永久匿名 HTTPS 远端检查，使 T018 通过
- [ ] T024 [US1] 在 `server/content/app.py` 实现 `/health`、`/drafts`、`/drafts/{contentId}`、`/media` 与 `/media/{mediaId}/checks` 契约，使 T017/T018 通过
- [ ] T025 [P] [US1] 在 `src/pages/content-studio/composables/useDraftAutosave.ts` 实现串行 debounce、保存状态、expectedRevision、失败保留与 409 显式恢复
- [ ] T026 [P] [US1] 在 `src/pages/content-studio/components/ContentEditor.vue` 和 `src/pages/content-studio/components/ContentToolbar.vue` 实现编辑生命周期、文字格式、标题、列表、引用、代码、链接、颜色、离散字号、对齐、撤销/重做和可访问命令
- [ ] T027 [P] [US1] 在 `src/pages/content-studio/components/TableToolbar.vue` 实现行列、表头、合并/拆分、对齐、列宽和 `fixTables()` 交互
- [ ] T028 [P] [US1] 在 `src/pages/content-studio/components/MediaInsertDialog.vue` 和 `src/pages/content-studio/components/GalleryEditor.vue` 实现选择/粘贴/拖入、单图属性、双列/三列/网格、局部失败重试和顺序管理
- [ ] T029 [P] [US1] 在 `src/pages/content-studio/components/ContentMetadataPanel.vue` 和 `src/pages/content-studio/components/DraftList.vue` 实现统一内容条目、标题、数字 publicId（只读）、摘要、封面、标签和草稿切换
- [ ] T030 [US1] 在 `src/pages/content-studio/ContentStudioPage.vue` 和 `src/pages/content-studio/content-studio.css` 组装桌面高密度工作台、稳定控件尺寸、离开保护和窄屏只读状态
- [ ] T031 [US1] 在 `src/locales/keys/content.ts`、`src/locales/modules/contentStudio.ts` 和 `src/locales/loadUiMessages.ts` 接入 US1 全部固定文案、错误、aria-label、tooltip 和保存状态，并运行 T016-T019 的独立验收

**Checkpoint**: US1 可作为独立本机写作 MVP 使用；不需要公开路由或导出功能即可完成验收。

---

## Phase 4: User Story 2 - 预览并发布内容 (Priority: P1)

**Goal**: 站长可使用公开阅读语义预览、发布、撤回、归档和恢复；访客只能读取明确发布的不可变版本。

**Independent Test**: 创建两篇统一内容，只发布其中一篇；博客列表/详情不泄露草稿，后续草稿不改变公开版本，撤回/归档立即移出生成数据，恢复不自动发布。

### Tests for User Story 2

- [ ] T032 [P] [US2] 先为发布前置、资源阻断、published/draft revision 隔离、撤回、归档、恢复和审计脱敏建立失败测试，写入 `server/content/tests/test_publishing.py`
- [ ] T033 [P] [US2] 先为稳定排序、publicId/type 路径、草稿排除、原子生成和 last-known-good 保护建立失败测试，写入 `tests/content/publishing/public-content-builder.test.ts`
- [ ] T034 [P] [US2] 先为公开 renderer 的节点/mark allowlist、危险链接、未知节点、表格/画廊/折叠和无 `v-html` 建立失败测试，写入 `tests/content/render/public-renderer.test.ts`
- [ ] T035 [P] [US2] 先编写预览一致性、发布隔离、直接地址防泄漏、撤回/归档/恢复、桌面/移动阅读的浏览器验收，写入 `tests/content/browser/content-publication.spec.mjs`

### Implementation for User Story 2

- [ ] T036 [US2] 在 `server/content/publishing.py` 实现发布前 schema/元数据/media/remote checks、expectedRevision、不可变 Publication 和 `content/published/` 原子写入，使 T032 通过
- [ ] T037 [US2] 在 `server/content/app.py` 实现 publications、publication DELETE、archive、restore 契约与状态冲突响应，并在 `server/content/audit.py` 记录不含正文/凭据/路径的最小事件
- [ ] T038 [P] [US2] 在 `scripts/content/build-public-content.mjs` 实现从 `content/published/` 生成 `public/data/content/index.json` 与 `entries/<publicId>.json` 的稳定、原子输出
- [ ] T039 [P] [US2] 在 `scripts/content/check-public-content.mjs` 验证 schema、hash、路由唯一性、资源 host、草稿泄漏、Base64/本机路径/未授权位图与 orphan 文件，使 T033 通过
- [ ] T040 [P] [US2] 在 `src/lib/content/render/contentViewModel.ts`、`src/lib/content/render/markRenderer.ts` 和 `src/lib/content/render/linkPolicy.ts` 实现校验后 allowlist view model 与危险 URL fail-closed
- [ ] T041 [P] [US2] 在 `src/pages/content/components/ContentRichText.vue`、`ContentTable.vue`、`ContentGallery.vue`、`ContentFigure.vue` 和 `ContentCollapse.vue` 实现不依赖 Tiptap、无任意 HTML 的 Vue 阅读组件，使 T034 通过
- [ ] T042 [P] [US2] 在 `src/pages/content/services/publicContent.ts` 实现静态 index/detail 读取、错误分类和 hash/版本检查，复用项目 fetch 边界
- [ ] T043 [P] [US2] 在 `src/pages/content/ContentIndexPage.vue` 和 `src/pages/content/ContentDetailPage.vue` 实现统一内容列表与稳定博客详情阅读页
- [ ] T044 [P] [US2] 在 `src/pages/content/content.css` 实现 day/night、响应式表格、图片网格、长标题/URL/代码换行和移动端无页面级横向溢出
- [ ] T045 [US2] 在 `src/config/site.ts` 和 `src/router/index.ts` 注册 `blog-index`=`#/blog`、`blog-detail`=`#/blog/:id`，公开路由只加载静态 reader chunk且不增加专题/文章别名
- [ ] T046 [US2] 在 `src/pages/content-studio/components/PublicationPanel.vue` 和 `src/pages/content-studio/components/ContentPreview.vue` 接入共享阅读组件、发布、撤回、归档、恢复、revision 提示和资源阻断详情
- [ ] T047 [US2] 在 `src/locales/modules/content.ts`、`src/locales/modules/contentStudio.ts` 和 `src/locales/loadUiMessages.ts` 补齐 US2 固定文案并运行 T032-T035 的独立验收

**Checkpoint**: US2 完成后，V2 已能承载统一内容条目的草稿、预览和安全静态发布；公开访客无法读取非发布版本。

---

## Phase 5: User Story 3 - 导出 NGA BBCode (Priority: P2)

**Goal**: 从不可变原稿生成可粘贴到 NGA 的确定性 BBCode，并完整报告所有布局或属性降级。

**Independent Test**: 对格式文字、引用、列表、链接、代码、表格、单图、COS 多图和折叠黄金样例导出；NGA 真实预览保留全部正文、链接、图片顺序与表格单元格，所有有损布局进入 loss report。

### Tests for User Story 3

- [ ] T048 [P] [US3] 先按已验证方言为 inline marks、links、lists/quotes/code、tables/spans、images/gallery、collapse 和 unknown 节点建立失败黄金测试，写入 `tests/content/export/nga-bbcode.test.ts` 与 `tests/fixtures/content/nga/`
- [ ] T049 [P] [US3] 先为相同 JSON 字节级确定性、loss 排序、上下文转义、危险/临时 COS URL 阻断和导出不改写原稿建立失败测试，写入 `tests/content/export/nga-determinism.test.ts`

### Implementation for User Story 3

- [ ] T050 [US3] 在 `src/lib/content/export/nga/escaping.ts`、`inline.ts` 和 `blocks.ts` 实现经 fixture 验证的上下文转义、marks 逆序闭合、段落/标题/列表/引用/代码/折叠映射
- [ ] T051 [US3] 在 `src/lib/content/export/nga/table.ts` 和 `image.ts` 实现表格 span 降级、COS 永久 HTTPS 图片、图注与画廊顺序展开，禁止下载/proxy 和静默丢失
- [ ] T052 [US3] 在 `src/lib/content/export/nga/serializeNgaBbcode.ts` 汇总 `{ text, losses }`、mapping version、blocking 状态和稳定排序，使 T048/T049 通过
- [ ] T053 [P] [US3] 在 `src/pages/content-studio/components/ExportDialog.vue` 和 `src/pages/content-studio/components/ExportLossList.vue` 实现 NGA 预览、loss 定位、复制和 UTF-8 文本下载，不提供自动发帖
- [ ] T054 [P] [US3] 在 `src/locales/modules/contentStudio.ts` 补齐 BBCode、loss code、COS URL 阻断、复制/下载状态和可访问名称
- [ ] T055 [US3] 将完整合成样例和已授权 COS URL 粘贴到 NGA 真实预览但不提交，记录各 fixture 的验证日期与结果到 `tests/fixtures/content/nga/README.md`，随后运行 T048/T049 与 US3 浏览器路径

**Checkpoint**: NGA BBCode 是可独立使用的主要导出；未知节点、临时 URL 或未验证图片不得显示为成功导出。

---

## Phase 6: User Story 4 - 基础 Markdown 导出 (Priority: P3)

**Goal**: 提供适合备份/迁移的基础 Markdown，不承诺复杂布局一比一还原，也不静默丢失内容。

**Independent Test**: 混合内容样例导出后，标题、段落、列表、引用、代码、链接和图片可读；复杂表格、画廊与折叠均有确定性文本降级或 loss。

### Tests and Implementation for User Story 4

- [ ] T056 [P] [US4] 先为基础语义、表格/画廊/折叠降级、未知节点和确定性建立失败黄金测试，写入 `tests/content/export/markdown.test.ts` 与 `tests/fixtures/content/markdown/`
- [ ] T057 [US4] 在 `src/lib/content/export/markdown/serializeMarkdown.ts` 和 `mappings.ts` 实现保守基础方言、上下文转义、复杂块降级与 `{ text, losses }`，使 T056 通过
- [ ] T058 [P] [US4] 在 `src/pages/content-studio/components/ExportDialog.vue` 接入 Markdown 模式、UTF-8 下载和复杂块 loss 展示，不加入 Markdown 导入或 round-trip 声明
- [ ] T059 [US4] 在 `src/locales/modules/contentStudio.ts` 补齐 Markdown 固定文案并用 `tests/fixtures/content/markdown/full.json` 完成 UI 导出验收

**Checkpoint**: US4 仅提供基础可迁移导出，不改变 JSON 原稿，也不扩大为第二套编辑模型。

---

## Phase 7: Polish and Cross-Cutting Quality Gates

**Purpose**: 覆盖性能、安全、bundle、文档、真实浏览器和交付边界

- [ ] T060 [P] 在 `tests/fixtures/content/performance/large-document.json` 和 `tests/content/performance/large-document.test.ts` 建立 50,000 字、50 图、20×20 表格的保存/恢复/预览/导出预算测试
- [ ] T061 [P] 在 `server/content/tests/test_security.py` 和 `tests/content/render/public-renderer.test.ts` 补齐恶意粘贴、递归深度、压缩/解码炸弹、协议相对 URL、未知 mark/node 与资源 host 绕过回归
- [ ] T062 在 `scripts/content/check-studio-bundle.mjs` 审计普通 `npm run build` 不含 content-studio 路由、Tiptap/ProseMirror chunk、草稿、本机路径、token 或未授权位图
- [ ] T063 [P] 在 `tests/content/browser/content-accessibility.spec.mjs` 验证键盘命令、focus、仅图标控件名称、dialog 焦点和桌面写作工作流；在 `tests/content/browser/content-responsive.spec.mjs` 验证 1440×900 与 390×844、day/night 阅读路径
- [ ] T064 [P] 新建 `docs/ai/MODULES/content.md` 和 `docs/api/content.md`，记录真实实现后的模块边界、路由、状态机、Schema、loopback API、COS 手工同步、NGA 外链与验证方式
- [ ] T065 在 `docs/ai/PROJECT_CONTEXT.md`、`docs/ai/MODULE_MAP.md`、`docs/ai/ARCHITECTURE_PLAN.md`、`docs/ai/API_CONVENTIONS.md` 和 `docs/ai/DEPLOYMENT_CHECKLIST.md` 同步实际落地的路由、构建开关、公开数据和回滚边界，不复制临时过程记录
- [ ] T066 依次运行 `npm run test:content`、`npm run test:content-api`、`npm run check:content`、`npm run typecheck`、`npm run check:i18n`、`npm run build` 与 `git diff --check`，并把失败归因和修复限制在本功能文件
- [ ] T067 按 `specs/002-rich-content-editor/quickstart.md` 完成本机 helper、创建/恢复、冲突、媒体、发布、撤回/归档、NGA/Markdown、桌面/移动真实浏览器全路径，检查 console、network、Vite overlay 和公开 bundle
- [ ] T068 审计 `git status --short`、本任务 diff、`git diff --cached --name-only`、未授权图片、Base64、凭据形态、绝对路径和其他会话改动；未经用户再次确认不得 commit、push、上传 COS 或部署

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 Setup**: 可立即开始；T001 的依赖审计和 T005 的 NGA 方言/COS 图片测试必须在大规模 UI 前完成。
- **Phase 2 Foundational**: 依赖 Phase 1，完成后才允许进入任何用户故事。
- **US1 (Phase 3)**: 依赖 Phase 2，是本机写作 MVP。
- **US2 (Phase 4)**: 依赖 Phase 2 的模型/安全基础和 US1 的 revision/media 能力；其公开 renderer 与生成器可并行开发。
- **US3 (Phase 5)**: 依赖 Phase 2 和 T005 方言结果；可在 US1 后与 US2 的公开页面工作并行，但 ExportDialog 集成依赖 US1 工作台。
- **US4 (Phase 6)**: 依赖 Phase 2 的 tree walker/loss 类型和 US1 ExportDialog，可与 US2 后半段并行。
- **Phase 7**: 依赖准备交付的全部用户故事；只交付 MVP 时仍必须运行 US1 相关安全、bundle 和浏览器门槛。

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 (MVP)
                         |\
                         | +-> US3 NGA export -> US4 Markdown export
                         +----> US2 preview/publication
                                      \
All selected stories -----------------> Polish / release gates
```

### Parallel Opportunities

- Phase 2 的 TypeScript 模型测试、Python 安全测试、导出遍历基础和 API 客户端可按 `[P]` 分开处理。
- US1 中 editor、table、media UI 和 metadata UI 在 extension/API 契约稳定后可并行；`ContentStudioPage.vue` 最后集成。
- US2 中 generator/checker、public renderer、数据读取与页面样式可并行；路由和发布面板最后集成。
- US3 的 serializer 测试、导出 UI 和本地化可在共享 loss 契约稳定后并行。
- 不得让并行任务同时修改 `package.json`、`src/router/index.ts`、`src/locales/modules/contentStudio.ts` 或其他共享文件；执行时仍须逐文件 claim。

---

## Parallel Examples

### User Story 1

```text
T026 ContentEditor/Toolbar
T027 TableToolbar
T028 MediaInsertDialog/GalleryEditor
T029 ContentMetadataPanel/DraftList
```

### User Story 2

```text
T038 build-public-content
T039 check-public-content
T041 public Vue render components
T042 public content service
T044 responsive reader styles
```

### User Story 3

```text
T053 ExportDialog/ExportLossList
T054 contentStudio localization
```

---

## Implementation Strategy

### MVP First

1. 完成 Phase 1 和 Phase 2，不绕过依赖审计、NGA 方言、写入边界与普通构建隔离门槛。
2. 完成 US1，仅交付本机写作、表格、多图、保存和恢复。
3. 停止并运行 US1 独立测试、真实桌面路径和普通 bundle 审计。

### Incremental Delivery

1. US1：先获得可靠写作 MVP。
2. US2：再让统一内容条目安全进入 V2 博客阅读页。
3. US3：接入主要 NGA BBCode 导出与真实预览校准。
4. US4：最后补基础 Markdown 迁移出口。
5. 每个阶段完成后更新 session 日志、运行对应独立验收；不得把全部风险压到最终构建。

## Notes

- 所有测试样例使用合成文本与明确授权的 COS URL，不复制他人文章、不提交测试位图。
- NGA 验证只使用编辑预览，不自动发帖；BBCode/Markdown 永远不是可反向覆盖 JSON 原稿的输入。
- CORS 只与未来浏览器直传 COS 等跨域 API 有关，不是普通 `<img>` 或 NGA 外链显示的发布门槛。
- 每次实施任务都必须建立新的 Agent session、逐文件 claim，并保护当前工作区中其他对话的未提交修改。
