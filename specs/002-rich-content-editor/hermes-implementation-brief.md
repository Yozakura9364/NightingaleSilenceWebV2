# Hermes Implementation Brief: 博客与专题富内容编辑器

**Status**: Approved for local implementation

**Owner decision**: Codex owns specification, implementation planning and code review. Hermes owns implementation and remediation. The owner makes the final product/commit/push decision.

## 1. Read Order and Authority

Hermes must read these sources before changing code, in this order:

1. Repository `AGENTS.md`, `AGENT_WORKFLOW.md`, `docs/OWNER_VISION.md`, `docs/ai/PROJECT_CONTEXT.md` and `docs/ai/AGENT_SESSION_PROTOCOL.md`.
2. [spec.md](./spec.md) for user value, scope and acceptance criteria.
3. [plan.md](./plan.md) for approved architecture, dependencies, files, risks and rollback.
4. [data-model.md](./data-model.md) and [contracts/](./contracts/) for executable boundaries.
5. [tasks.md](./tasks.md) for task order and exact paths.
6. [quickstart.md](./quickstart.md) for the final runnable acceptance path.
7. [review-checklist.md](./review-checklist.md) for the evidence Codex will require.

Conflict priority is: current code and project rules, then approved spec/plan/contracts, then this brief, then task wording. Report a material conflict before implementing the conflicting part; do not silently reinterpret it.

Document ownership is intentionally separated:

- `spec.md` owns user requirements and success criteria;
- `research.md` owns architectural decisions, alternatives and official sources;
- `plan.md` owns approved architecture, file layout, delivery phases, risk and rollback;
- `data-model.md` and `contracts/` own structured data/API/export interfaces;
- `tasks.md` owns atomic implementation order and exact target paths;
- this brief owns Hermes execution batches, evidence and stop conditions;
- `review-checklist.md` owns Codex review gates and verdict rules.

Do not copy new facts into multiple documents during implementation. Update the owning document, then link to it from durable module/API documentation where required by T064-T065.

## 2. Approved Scope

Hermes may implement all tasks T001-T068 locally, including the plan-listed dependencies:

- official Tiptap 3 Vue packages needed by the approved extension set;
- Vitest as a development dependency;
- `Pillow>=10.4,<11`;
- `jsonschema>=4.23,<4.24` for Python 3.8.

This authorization does not include:

- any dependency not listed above;
- a public authoring/login service;
- browser-held COS credentials or automatic COS uploads;
- BBCode import, Markdown import or reverse conversion into canonical JSON;
- automatic NGA login, posting, editing or scraping;
- comments, accounts, collaboration, forum/community features or full-text search;
- committing, pushing, publishing, deploying or deleting remote COS objects.

## 3. Non-Negotiable Architecture

```text
Local-only authoring build
  -> Tiptap 3 controlled schema
  -> content.document.v1 canonical JSON
  -> loopback Flask validation/revisions/media staging
  -> tracked content/published structured source
  -> generated public/data/content JSON
  -> safe Vue allowlist reader

Canonical JSON
  -> deterministic NGA BBCode + loss report
  -> conservative Markdown + loss report
```

The implementation must preserve these invariants:

- JSON is the only complete source of truth; HTML, BBCode and Markdown are derived.
- Public readers never use arbitrary article HTML or `v-html` and never load Tiptap.
- Normal builds do not register the studio route or emit Tiptap/ProseMirror chunks.
- The helper binds only `127.0.0.1` and validates Host, Origin, startup token, size, path and schema at the write boundary.
- Draft and published revisions are isolated; stale autosave never overwrites a newer revision.
- Images remain local until explicitly synchronized; only permanent anonymous HTTPS URLs on the configured host can publish/export.
- Ordinary image display does not require CORS. NGA compatibility is proven by anti-hotlink checks and real NGA preview.
- Unknown schema versions, nodes, marks or unsafe URLs fail closed and never disappear silently.
- No unauthorized bitmap, credentials, local path, draft, Base64 payload or audit body enters Git or public output.

### Public Route Contract

Implement exactly these route records in `src/config/site.ts` and `src/router/index.ts`:

| Route | Route name | Meaning |
| --- | --- | --- |
| `#/blog` | `blog-index` | published blog list |
| `#/blog/:id` | `blog-detail` | published blog detail; numeric public ID |
| `#/content-studio` | `content-studio` | authoring-only local route |

Do not add `/post`, `/article`, `/topic`, `/topics`, `/content` or compatibility aliases in v1. Blog articles and long-form topics share the top-level `/blog` route and do not sit under `/ffxiv`. The public detail key is the server-generated globally unique numeric `publicId`, never a slug or internal UUID. A multi-article topic collection is a future feature, not a second v1 content type. The studio route must remain compile-time excluded from ordinary builds; hiding it with CSS or relying on an obscure URL is not an access boundary.

## 4. Working Protocol

For every implementation packet:

1. Run `node scripts/agent-session.mjs status` and inspect `git status --short`.
2. Start one independent Agent session for that packet.
3. Read the current diff before claiming any dirty file; use `--allow-dirty` only for a known, preserved boundary.
4. Claim every file before editing it. Do not edit a file held by another active session.
5. Write the named tests first and prove the relevant tests fail for the expected reason.
6. Implement only the packet scope. Do not combine unrelated cleanup, upgrades or formatting.
7. Run packet verification, update the session log and prepare the review packet below.
8. Finish the session as `completed` only when the packet itself is complete; otherwise mark the exact continuation point as `interrupted`.
9. Stop for Codex review at each review gate. Address all Critical/Required findings before starting the next dependent packet.

No implementation packet should exceed roughly 500 changed lines without an earlier review. If a task grows beyond five focused files or mixes independent subsystems, split it and update only the task execution notes, not the approved behavior.

## 5. Implementation and Review Packets

### Packet H0A - Dependencies and Local Boundaries

**Tasks**: T001-T004

**Deliverables**:

- reviewed npm/Python dependency declarations and lockfile;
- dedicated content-studio launcher and scripts;
- Vitest scope;
- local draft/media/build leakage checker.

**Required evidence**:

- exact direct packages and resolved versions;
- license, Python/npm compatibility and install-script summary;
- focused `package.json`/lockfile diff explanation;
- existing typecheck/build status before and after;
- proof that local assets remain ignored.

**Review focus**: supply-chain drift, accidental bulk upgrades, package scripts touching unrelated services, public bundle leakage.

### Packet H0B - NGA Dialect and COS Proof

**Task**: T005

**Deliverables**: synthetic dialect fixtures and a written real-preview result using one authorized permanent COS URL.

**Required evidence**: tested NGA tags, escaping/nesting results, table/span behavior, collapse behavior, image URL response facts, Referer/no-Referer behavior and preview result. Do not submit a post or commit an image.

**Review focus**: assumptions presented as facts, copied third-party content, temporary signed URLs, missing degradation policy.

### Packet H1A - Canonical TypeScript Model

**Tasks**: T006, T008-T011

**Deliverables**: failing fixtures first, canonical types, version validator/migrations, stable JSON/URL policies and shared exporter traversal.

**Required evidence**: valid/invalid/unknown/deep fixtures, deterministic output assertions, protocol-relative URL rejection and no mutation of input JSON.

**Review focus**: contract drift, gratuitous `any`/casts, incomplete recursion limits, validators that normalize unknown data instead of rejecting it.

### Packet H1B - Python Write Boundary and Build Isolation

**Tasks**: T007, T012-T015

**Deliverables**: server-side Schema execution, helper security/error boundary, typed frontend client and compile-time studio exclusion.

**Required evidence**: unauthorized/Origin/Host/path/oversize tests; ordinary production build asset audit; proof external schema path resolves in both test and helper runtime.

**Review focus**: loopback CSRF, token leakage, trusting frontend validation, filesystem escape, stack/path disclosure, studio chunk retained by static imports.

### Packet H2A - Draft, Revision and Media Backend

**Tasks**: T017-T018, T022-T024

**Deliverables**: failing API/media tests, append-only revision storage, conflict handling, Pillow validation, staging and draft/media endpoints.

**Required evidence**: atomic-write interruption test, identical-save behavior, stale revision 409, disguised/oversized/decompression image cases, partial failure behavior and no absolute paths in responses/logs.

**Review focus**: data loss, race conditions, path traversal, image bombs, insecure filenames, body/token content in audit logs.

### Packet H2B - Authoring UI and Recovery

**Tasks**: T016, T019-T021, T025-T031

**Deliverables**: controlled Tiptap extensions, editor/table/media/metadata UI, autosave and desktop studio page with localization.

**Required evidence**: editor round-trip tests; real desktop creation, table, gallery, refresh and two-tab conflict path; console/network/overlay results; normal bundle exclusion recheck.

**Review focus**: NodeView-only state leaking into JSON, IME/selection breakage, autosave races, Base64 persistence, unlocalized UI, icon buttons without accessible names, unstable workbench layout.

### Packet H3A - Publication State and Static Generation

**Tasks**: T032-T033, T036-T039

**Deliverables**: publication/state tests, publish/withdraw/archive/restore service, minimal audit, deterministic generator and public-data checker.

**Required evidence**: draft/public revision isolation, invalid media blocking, atomic last-known-good behavior, stable ordering/hash and proof no unpublished entry reaches generated output.

**Review focus**: stale publication race, destructive archive semantics, source/generated divergence, leaked local paths/drafts/media, non-deterministic artifacts.

### Packet H3B - Safe Public Reader and Preview

**Tasks**: T034-T035, T040-T047

**Deliverables**: safe view model, Vue reader components, public service/pages/routes/styles, shared preview and localized publication controls.

**Required evidence**: malicious fixture results; desktop/mobile day/night screenshots; direct unpublished URL result; public network trace showing no studio API/Tiptap; long table/gallery overflow check.

**Review focus**: XSS/unsafe URL handling, `v-html`, renderer/schema drift, public route discovery of drafts, Tiptap bundle coupling, mobile overflow and hard-coded copy.

### Packet H4A - NGA Serializer

**Tasks**: T048-T052

**Deliverables**: golden tests and deterministic serializers for inline, blocks, tables, images/galleries and losses.

**Required evidence**: byte-stable outputs, context escaping combinations, span fallback, COS permanent URL rules, blocking unknown nodes and proof the source JSON hash is unchanged.

**Review focus**: tag injection, incorrect nesting, lost/reordered content, environment-dependent output, silent fallback, unsafe/unverified URLs.

### Packet H4B - NGA Export UI and Real Preview

**Tasks**: T053-T055

**Deliverables**: export/loss UI, localization, clipboard/download and final real NGA preview record.

**Required evidence**: full fixture preview, loss-to-node navigation, UTF-8 copy/download, no NGA credential or submission request and no source revision mutation.

**Review focus**: misleading success state, missing warnings, clipboard errors, accidental external writes and inaccessible dialog behavior.

### Packet H5 - Basic Markdown Export

**Tasks**: T056-T059

**Deliverables**: golden tests, conservative serializer, loss-aware UI and localization.

**Required evidence**: preserved basic semantics, explicit complex-block fallback, deterministic text and no import/round-trip behavior.

**Review focus**: silent content loss, duplicate canonical model, unsupported flavor claims and NGA behavior regressions in the shared dialog.

### Packet H6A - Security, Performance and Browser Gates

**Tasks**: T060-T063

**Deliverables**: large fixture budget, security regressions, bundle audit and accessibility/responsive browser suites.

**Required evidence**: commands and measured timings/sizes, screenshots, console/network results and normal production asset list.

**Review focus**: unbounded recursion/memory, synchronous hot paths, unnecessary rerenders, test assertions that do not fail when behavior regresses and studio code in public output.

### Packet H6B - Documentation and Final Acceptance

**Tasks**: T064-T068

**Deliverables**: module/API/project docs, full automated gate, complete quickstart run and final diff/public-boundary audit.

**Required evidence**: every command and result, all quickstart paths, remaining risks, exact changed files, untracked/staged audit and proof no unauthorized asset/credential is included.

**Review focus**: documentation claiming unverified behavior, omitted failure paths, unrelated worktree changes and release actions performed without authorization.

## 6. Review Packet Format

Hermes must hand Codex this information after each packet:

```markdown
## Packet: Hx

Tasks completed: Txxx-Txxx

Changed files:
- path: reason

Behavior delivered:
- observable behavior

Tests written first:
- command: expected initial failure

Verification:
- command: pass/fail and key result
- browser/API path: observed result

Diff boundary:
- git status --short summary
- unrelated dirty files preserved
- dependency/asset/public-output changes

Known risks or deviations:
- none, or explicit item linked to the plan
```

Do not report only “tests pass.” Include enough evidence for Codex to reproduce and challenge the implementation.

## 7. Stop Conditions

Hermes must stop the affected packet and report evidence when:

- a required file is claimed by another active session;
- a plan-listed dependency resolves incompatibly or introduces an unexpected install script/license;
- the implementation needs a new dependency, public auth, browser COS credentials, automatic NGA actions or a route architecture change;
- actual NGA behavior contradicts the dialect contract;
- existing project behavior/documents materially contradict the approved plan;
- verification would require an unauthorized image, credential, external publication, commit, push or deployment;
- a test/build failure is outside this feature and cannot be isolated without changing unrelated code.

Ordinary implementation choices inside the approved file/behavior boundary do not require owner questions. Make the conservative choice, document it in the packet and let Codex review it.

## 8. Completion Definition

The feature is implementation-complete only when:

- T001-T068 are checked with evidence;
- all Critical and Required Codex findings are resolved;
- JSON round-trip, API security/media, publication isolation, NGA/Markdown golden, content checker, typecheck, i18n and production build pass;
- real desktop authoring and desktop/mobile public paths pass with no relevant console/network/overlay error;
- normal production output contains no studio/Tiptap chunk, draft, local path, token, Base64 or unauthorized bitmap;
- NGA real preview preserves mandatory content and reports every accepted degradation;
- documentation matches the actual routes, API, state machine, COS process and rollback behavior;
- the owner explicitly decides whether to commit, push or deploy.
