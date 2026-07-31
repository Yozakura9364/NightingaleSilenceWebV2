# Implementation Plan: 博客与专题富内容编辑器

**Branch**: `main`（Spec Kit feature id: `002-rich-content-editor`） | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-rich-content-editor/spec.md`

**Approval Gate**: 用户已确认由 Codex 完成整套计划、Hermes 按计划实现、Codex 负责代码审查。本文列出的 Tiptap、Vitest、Pillow 和 `jsonschema` 均视为已批准；Hermes 可直接执行计划内任务，不必逐项重复询问。计划外依赖、公开鉴权、自动 COS 写入、自动 NGA 发帖、提交、推送和部署仍须另行授权。

## Summary

在 Nightingale Silence V2 中新增单一站长使用的桌面写作工作台，让博客文章和长篇专题共用统一的结构化富内容原稿，覆盖复杂表格、单图、多图网格、折叠内容和常见文字格式；同一原稿可预览、发布到 V2，并导出为 NGA BBCode，Markdown 只提供基础兼容导出。

首版选择 **Tiptap 3 编辑器内核 + 版本化 JSON 原稿 + V2 自有安全阅读渲染器 + 本机 loopback 内容服务 + 静态公开内容生成器**。写作工作台仅进入显式 authoring 构建，普通生产构建不包含编辑器 chunk；草稿和未发布图片保存在 ignored 本地目录，公开文章由生成器写入静态数据，图片经人工 COS/CDN 同步和远端校验后才能发布。

## Public Route Contract

当前项目使用 Vue Router hash mode，因此公开内容路由固定为：

| Purpose | Route | Name | Boundary |
| --- | --- | --- | --- |
| 博客列表 | `#/blog` | `blog-index` | 只读取已发布博客 index |
| 博客详情 | `#/blog/:id` | `blog-detail` | `id` 为服务器生成的数字公开标识 |
| 本地写作台 | `#/content-studio` | `content-studio` | 只在显式 authoring 构建注册，不属于公开导航 |

博客文章和长篇专题共用站点一级的 `/blog` 内容入口，不能挂到 `#/ffxiv`；`/content` 是内部数据模型名，不能作为公开内容入口；详情使用服务器生成的数字 `publicId`，不暴露内部 UUID，也不引入 slug。首版不增加 `/post`、`/article`、`/topic`、`/topics` 等别名，避免多套可观察 URL。专题集合/章节关系不进入 v1。

## Technical Context

**Language/Version**: TypeScript 5.7 / Vue 3.5 / Vite 6；Python 3.8 兼容的本机 Flask 服务；Node.js 使用项目现有 ESM 脚本（当前工作机 v24.14.0）

**Primary Dependencies**: 现有 Vue Router 4、Pinia 2、原生 fetch、Flask 2；已批准新增 Tiptap 3 核心/官方 Vue 3、StarterKit、TableKit、Image、FileHandler、文字样式与静态渲染扩展、Vitest、`Pillow>=10.4,<11` 和 `jsonschema>=4.23,<4.24`

**Storage**: ignored `local-assets/content-studio/` 保存草稿、修订、审计和媒体 staging；tracked `content/published/` 保存已发布结构化源；生成的 `public/data/content/` 作为公开运行数据；图片只引用已校验的 COS/CDN URL

**Testing**: Vitest 纯逻辑/Schema/导出黄金样例；Python `unittest` 覆盖 loopback API、文件边界和发布状态；现有 `vue-tsc`、i18n checker、Vite build；Playwright + 系统 Chrome 做桌面编辑和桌面/移动阅读回归

**Target Platform**: 普通公开构建运行于现代桌面/移动浏览器；写作工作台首版只支持本机桌面 Chrome/Edge，通过 `127.0.0.1` 服务运行

**Project Type**: 单仓库 Vue SPA + 本机辅助服务 + 静态内容生成器

**Performance Goals**: 50,000 字、50 图、20×20 表格样例可编辑/保存/恢复；常规输入不出现可感知持续卡顿；自动保存成功后 2 秒内反馈；公开阅读页不加载编辑器依赖

**Constraints**: 保持现有 hash router；普通生产构建必须排除 authoring 路由；不把 Base64、草稿、COS 凭据或未授权图片放进 Git/构建产物；不使用任意原始 HTML；NGA 不等价布局允许有损但必须报告

**Scale/Scope**: 单一站长、首版预计数百篇公开内容；无注册、多人作者、协同编辑、评论、全文搜索、BBCode 导入或自动代发 NGA

## Repository Evidence Read

- `docs/OWNER_VISION.md`、`docs/ai/PROJECT_CONTEXT.md`：整站需要承载工具、博客和创作信息，当前 Vue 3/Vite 统一前端。
- `AGENT_WORKFLOW.md`、`docs/ai/AGENT_SESSION_PROTOCOL.md`、`.specify/memory/constitution.md`：规划审批、会话声明、依赖与验证门槛。
- `docs/ai/ARCHITECTURE_PLAN.md`、`docs/ai/MODULE_MAP.md`、`docs/ai/CODE_STRUCTURE_RULES.md`：路由、目录、公共层和复杂模块拆分约束。
- `docs/ai/API_CONVENTIONS.md`、`src/composables/useFetch.ts`、`vite.config.ts`：原生 fetch、命名空间代理和错误边界。
- `docs/ai/WORKBENCH_STYLE_CONTRACT.md`、`docs/ai/STYLE_AUDIT.md`：高密度工作台、公共控件、桌面/移动与像素风边界。
- `src/router/index.ts`、`src/config/features.ts`、`src/config/site.ts`：hash router、显式内部构建开关和路由配置方式。
- `src/locales/loadUiMessages.ts`、`src/locales/keys/core.ts`：固定 UI 文案必须按模块本地化加载。
- `scripts/dev.mjs`、`server/glamour/app.py`、`server/shortlinks/app.py`：本仓库已有 Flask 服务、开发进程和受保护 API 模式。
- `.gitignore`、NSPlate COS 文档与现有静态生成脚本：本地资产、公开 manifest、人工 COS 同步和远端校验先例。
- Tiptap 官方 Vue 3、持久化、Table、Image、FileHandler、自定义 Node、样式和 Static Renderer 文档：见 [research.md](./research.md)。

## Constitution Check

*GATE: Phase 0 前检查通过；Phase 1 设计后再次检查通过。*

| Gate | Result | Evidence / Required Action |
| --- | --- | --- |
| Existing project truth | PASS | 复用 Vue 3、Router、i18n、公共组件、原生 fetch、静态 manifest 与 loopback helper 模式。 |
| Planning and approval | PASS | 用户已明确同意计划并继续本地推进；任务清单仍保留分阶段验证门槛。 |
| Behavior/data fidelity | PASS | JSON 原稿带 schema version；转换器以黄金样例固定；未知节点阻断静默丢失。 |
| Dependency approval | PASS | 用户已授权 Hermes 按整套计划实施；Tiptap、Vitest、Pillow 与 Python 3.8 兼容的 `jsonschema` 均已纳入批准范围。 |
| Localization/public copy | PASS | 所有新增固定 UI 进入独立消息模块；未提供正式文案使用 `占位用，待编辑`。 |
| Asset authorization | PASS | 图片先进入 ignored staging；显式发布和远端校验后才进入公开引用，不提交位图。 |
| Security boundary | PASS | authoring 不进普通构建；loopback API 绑定 127.0.0.1，校验 Host/Origin/token/输入；公开渲染不使用任意 HTML。 |
| Scope discipline | PASS | 不修改 FFXIV 工具行为，不引入论坛、协作、自动 NGA 发帖或 SEO 路由迁移。 |
| Verification depth | PASS | 纯逻辑、API、生成器、构建、i18n 和真实浏览器路径均有明确门槛。 |

### Dependency Approval Detail

| Dependency group | Reason | Runtime impact | Alternatives considered |
| --- | --- | --- | --- |
| `@tiptap/*` v3 MIT packages | 官方 Vue 3 集成、ProseMirror Schema、TableKit、自定义节点、JSON 持久化和受控导出 | 仅 authoring build 异步 chunk；普通生产构建通过常量分支排除 | Vditor 的 Markdown 模型限制专题/多图；Editor.js 无官方 Vue 层且插件碎片；自研 contenteditable 风险不可接受 |
| `vitest` | 对 BBCode、Markdown、Schema 迁移和未知节点进行快速黄金测试 | 仅开发依赖，不进入生产 | 只靠浏览器测试难以覆盖转换组合；重复维护 JS 测试副本不可接受 |
| `Pillow>=10.4,<11` | Python 3.8 可用的服务端图片魔数、尺寸和解码验证 | 仅本机 content-studio 服务 | 只信任浏览器校验不构成安全边界；手写多格式解析器维护风险高 |
| `jsonschema>=4.23,<4.24` | 在 Python 3.8 loopback 服务的保存和发布边界执行 `editor-document.schema.json`，避免只信任前端 | 仅本机 content-studio 服务；MIT；4.23 官方元数据声明 Python `>=3.8` | 手写递归校验器容易与契约漂移；只在前端校验不能保护文件写入和发布边界；当前 4.26 要求 Python `>=3.10`，不符合计划环境 |

## Project Structure

### Documentation (this feature)

```text
specs/002-rich-content-editor/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── hermes-implementation-brief.md
├── review-checklist.md
├── tasks.md
├── checklists/
│   └── requirements.md
└── contracts/
    ├── content-api.openapi.yaml
    ├── editor-document.schema.json
    └── nga-bbcode-export.md
```

### Planned Source Code (repository root)

```text
content/
└── published/                    # tracked published source JSON only

public/data/content/              # generated index and detail JSON

scripts/
├── dev-content-studio.mjs        # authoring-only Vite + helper launcher
└── content/
    ├── build-public-content.mjs
    └── check-public-content.mjs

server/content/
├── app.py                        # 127.0.0.1-only HTTP boundary
├── storage.py                    # atomic local draft/revision/audit files
├── media.py                      # upload validation and staging
├── publishing.py                 # publish candidate and public source write
└── tests/

src/
├── config/
│   ├── features.ts               # VITE_ENABLE_CONTENT_STUDIO
│   └── site.ts                   # public blog paths only
├── lib/content/
│   ├── model/                    # TS model, schema version, guards/migrations
│   ├── editor/                   # shared Tiptap extensions
│   ├── export/                   # NGA BBCode + basic Markdown serializers
│   └── render/                   # safe format-independent view models
├── pages/content/
│   ├── ContentIndexPage.vue
│   ├── ContentDetailPage.vue
│   └── components/               # public JSON renderer, table/gallery/collapse
├── pages/content-studio/
│   ├── ContentStudioPage.vue
│   ├── components/               # editor, toolbar, media, metadata, export dialog
│   ├── composables/              # autosave, revision conflict, editor lifecycle
│   └── services/                 # /api/content-studio client and adapters
├── locales/
│   ├── keys/content.ts
│   ├── modules/content.ts
│   └── modules/contentStudio.ts
└── router/index.ts

tests/fixtures/content/           # synthetic JSON/BBCode/Markdown golden fixtures
```

**Structure Decision**: 公开阅读与私有写作拆成两个页面模块，共享 `src/lib/content/` 的统一内容模型和安全渲染语义。Tiptap 只由 `content-studio` 动态入口依赖；公开页只读取生成 JSON 并通过 Vue 组件 allowlist 渲染。草稿服务保持本机独立边界，不并入 NSGlamour 或 shortlinks。

## Phase 0 Research Decisions

1. 使用 Tiptap 3 官方 Vue 3 集成，JSON 而非 HTML 作为唯一原稿。
2. 使用 TableKit 处理行列、表头、合并/拆分和修复；图注、画廊与折叠块使用自定义 Node。
3. FileHandler 只接收粘贴/拖入事件；真实上传由本机服务完成，Base64 永不持久化。
4. 公开阅读页递归渲染经过校验的节点 allowlist，不使用正文 `v-html`，不加载编辑器依赖。
5. 首版 authoring 仅本机启用，公开内容使用 tracked source + generated public JSON；远程在线后台和账号系统留待独立规格。
6. NGA BBCode 使用确定性树遍历和 synthetic golden fixtures；未知节点为 blocking loss，禁止静默输出。
7. Markdown 使用同一原稿的基础序列化，复杂块明确降级；不承诺 round-trip 或扩展方言兼容。
8. 图片先 staging，再由人工 COSBrowser 同步；发布前检查永久 HTTPS URL、匿名读取、图片响应类型和已配置域名，NGA 兼容性通过真实预览与防盗链测试确认；首版不实现自动 COS 写入。

详见 [research.md](./research.md)。

## Phase 1 Design Decisions

- `ContentEntry` 负责身份和当前状态，`ContentRevision` 是不可变快照；草稿 revision 与 published revision 分离。
- `ContentDocument` 使用 `content.document.v1` 包装 Tiptap JSON，所有节点和属性由 JSON Schema 白名单验证。
- autosave PATCH 必须携带 `expectedRevision`；过期写入返回 `409 REVISION_CONFLICT`，不覆盖较新草稿。
- 发布创建新的 `Publication`，只接受 schema、元数据、资源和远端图片检查全部通过的 revision。
- 公共生成物只包含已发布 revision；归档/撤回后重建索引，详情返回不可发现或移除。
- NGA/Markdown 导出返回文本和结构化 losses；导出是纯函数，不写草稿。
- API 错误统一为 `{ error: { code, message, details? } }`，不暴露本机路径或堆栈。

详见 [data-model.md](./data-model.md) 与 [contracts/](./contracts/)。

## Delivery Phases

### Phase A - Dependency and fixture gate

1. 按已批准依赖范围核对 npm/Python 包版本、许可证、provenance、lockfile diff 和 install scripts；不自动执行强制 audit 修复。
3. 使用合成内容在 NGA 编辑/预览页人工确认首版 BBCode 标签、嵌套、转义、表格、图片和折叠语法，形成黄金 fixtures，不复制他人文章。
4. 固定 `content.document.v1` JSON Schema、迁移入口和导出 loss 等级。

**Gate**: 依赖审计未通过或 NGA 表格/折叠语法未实测时，不进入大规模 UI 实现。

### Phase B - Model and conversion vertical slice

1. 建立 `src/lib/content/model`、Schema 校验和最小迁移器。
2. 建立共享 Tiptap extension 清单，仅含段落、标题、marks、列表、引用、代码、表格、图片、画廊和折叠。
3. 先写 BBCode/Markdown failing golden tests，再完成 serializer、escaping 和 loss report。
4. 建立安全 Vue 阅读渲染器的段落、marks、链接和未知节点阻断路径。

**Verification**: Vitest schema/round-trip/export fixtures；typecheck；恶意链接和未知节点样例。

### Phase C - Local draft and media service

1. 新增只监听 `127.0.0.1` 的 Flask content-studio API，默认不随 `npm run dev` 启动。
2. 以原子文件替换保存 entry/revision；revision 冲突返回 409；审计不记录正文。
3. 图片使用 Pillow 在服务端验证真实格式、像素、尺寸和解码，使用生成 ID 文件名写入 ignored staging。
4. 增加 Host/Origin/每次启动 token 校验、请求体上限、无 CORS、路径 allowlist 和安全错误。
5. 增加人工 COS 同步 manifest，以及永久 HTTPS URL、匿名 GET/HEAD、图片响应类型和 host allowlist 检查；另以代表性 NGA Referer/无 Referer 请求及真实 NGA 预览验证防盗链，不把 CORS 误当作普通图片显示门槛。

**Verification**: Python unittest 覆盖未授权、CSRF、路径穿越、伪装文件、尺寸上限、原子保存、冲突和发布阻断。

### Phase D - Authoring workbench

1. 新增 `VITE_ENABLE_CONTENT_STUDIO`，只有 `dev-content-studio` 启动器设置为 true；普通 build 为 false。
2. 创建桌面三栏/双栏工作台：内容列表、主编辑区、元数据/预览/导出面板；复用公共按钮、字段、toolbar、tabs、status、dialog。
3. 接入 autosave、显式保存状态、revision conflict 恢复、键盘命令和离开保护。
4. 完成 TableKit UI、单图、粘贴/拖入、双列/三列/网格画廊、图注、折叠块。
5. 所有固定文案进入 `contentStudio` 消息模块；编辑器首版桌面优化，窄屏只提供只读预览和明确状态。

**Verification**: Playwright 桌面完成创建、表格、多图、刷新恢复、冲突、导出；检查 console/network/overlay；普通生产 build 不生成 studio chunk。

### Phase E - Static publication and public reading

1. `POST /publications` 对当前 revision 做完整校验，资源未远端可用时阻断；成功后写入 tracked `content/published/`。
2. 实现撤回、归档和恢复状态转换：撤回回到草稿，归档移除当前公开版本，恢复只回到草稿且不自动重新发布。
3. 构建器只从 published source 生成 `public/data/content/index.json` 与 `entries/<publicId>.json`，输出稳定排序和 schema metadata。
4. 新增 `#/blog`、`#/blog/:id`，公开页不依赖 Tiptap；专题集合/章节另行设计。
5. 阅读渲染器支持响应式表格、图片网格、图注、折叠和代码；链接协议和资源 host 白名单再次校验。
6. 接入本地化标题、导航和错误/空状态；正式内容文案由用户原稿提供。

**Verification**: generator/checker；公开草稿泄漏检查；桌面 1440×900 和移动 390×844；day/night；50 图和 20×20 表格样例；普通 build bundle 检查。

### Phase F - Export, documentation and release gate

1. 在工作台加入 NGA BBCode 与基础 Markdown 导出、复制、下载和 loss report。
2. 用合成黄金样例粘贴到 NGA 预览，人工验证文字、链接、图片顺序和表格内容。
3. 新增 `docs/ai/MODULES/content.md` 与 `docs/api/content.md`，同步 `PROJECT_CONTEXT.md`、`MODULE_MAP.md`、架构/API/部署文档。
4. 运行 typecheck、i18n、Vitest、Python tests、content checker、build 和完整浏览器路径。
5. 审核依赖、未授权图片、staged diff、公开数据边界和回滚步骤；不自动 commit/push/deploy。

## Verification Strategy

| Risk surface | Automated evidence | Runtime evidence |
| --- | --- | --- |
| Document schema/migration | Vitest valid/invalid/unknown-node fixtures | 打开旧 schema fixture 并显示迁移结果 |
| Autosave/concurrency | API unittest + composable tests | 两个标签页制造 revision conflict，不覆盖较新草稿 |
| BBCode export | synthetic golden fixtures | NGA 编辑器粘贴和预览人工核对 |
| Markdown export | basic golden fixtures + loss assertions | 下载文件可读，复杂块有明确降级 |
| Rich paste/XSS | malicious HTML/link/schema fixtures | 浏览器确认无脚本执行、无危险 URL |
| Media upload | magic-byte, size, pixel, path tests | 粘贴/拖入/失败重试和远端缺图阻断 |
| Draft/public isolation | generator excludes all non-published fixtures | 公开列表和直接地址均读不到草稿 |
| UI/accessibility | typecheck + i18n checker | 键盘工具栏、focus、aria、桌面编辑、移动阅读 |
| Bundle boundary | production build asset audit | 普通构建路由不可达且无 studio/Tiptap chunk |

Planned commands after implementation:

```powershell
npm run test:content
npm run test:content-api
npm run check:content
npm run typecheck
npm run check:i18n
npm run build
git diff --check
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| NGA BBCode 无稳定版本化语法 | 导出在特定标签/嵌套下失真 | 合成黄金 fixture + NGA 真实预览；映射版本化；未知结构 blocking loss |
| Tiptap extension 变化导致旧 JSON 不可读 | 已发布文章无法编辑或渲染 | `schemaVersion`、纯迁移器、冻结 extension names/attrs、旧 fixture 回归 |
| 富文本与链接产生 stored XSS | 公开站执行恶意内容 | 禁止 raw HTML；JSON Schema allowlist；Vue 安全 renderer；URL protocol/host 校验 |
| loopback 服务被恶意网页调用 | 本机草稿/文件被篡改 | 127.0.0.1、Host/Origin/token、无 CORS、非简单请求、body/path 限制 |
| 图片 staging、CDN 与 NGA 外链策略不一致 | 公开文章或 NGA 帖子缺图 | 内容寻址 ID、上传 manifest、永久公网 URL、响应类型/host 检查、防盗链与 NGA 真实预览、发布前阻断、引用计数 |
| 编辑器包拖大公开 bundle | 工具页与首页性能回归 | authoring compile-time flag + dynamic import；公开 renderer 不依赖 Tiptap；bundle audit |
| hash router SEO 和分享预览不足 | 博客搜索发现能力有限 | 首版明确接受；稳定 hash URL；后续以独立 SSR/预渲染规格解决，不在本次顺手迁路由 |
| 手工 COS 同步降低发布流畅度 | 发布步骤较多 | UI 生成明确 manifest/状态/checker；首版优先不暴露写凭据，自动上传另行审批 |
| 现有工作区并发改动多 | 覆盖其他任务 | 实现时新建 session、逐文件 claim、只 stage 本 feature 文件/hunk |

## Rollback Boundary

- `VITE_ENABLE_CONTENT_STUDIO=false` 即可从普通/内部构建排除写作入口；不得以隐藏 CSS 代替构建排除。
- 公共内容入口可从 router/site config 移除而不影响 FFXIV 工具；`content/published/` 保留为可恢复源。
- 生成器失败时不覆盖 last-known-good `public/data/content/`；发布采用临时文件校验后原子替换。
- 图片上传永不删除远端对象；回滚文章只切回旧 publication/revision，不执行 COS 删除。
- Tiptap JSON 原稿不被 BBCode/Markdown 导出改写，因此导出器可独立回退。

## Complexity Tracking

无已批准的 constitution 违规。新增本机服务是为了隔离未发布内容、文件写入和图片验证；把这些能力塞进公开 Vue 客户端会暴露凭据或依赖不安全浏览器存储，因此拒绝该更简单表象方案。
