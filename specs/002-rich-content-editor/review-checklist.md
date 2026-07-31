# Codex Review Checklist: 博客与专题富内容编辑器

This checklist defines how Codex reviews Hermes output. A green build alone is not approval.

## 1. Review Order

For every packet, Codex reviews in this order:

1. Read the packet goal, relevant tasks, spec acceptance criteria and contracts.
2. Inspect tests before implementation; confirm they test observable behavior and would catch a regression.
3. Inspect the exact worktree diff and changed-file ownership.
4. Review correctness and error paths.
5. Review security and public/private boundaries.
6. Review architecture, type boundaries and simplicity.
7. Review performance and bundle impact.
8. Re-run focused automated checks and required real browser/API paths.
9. Issue a verdict with findings ordered by severity and file/line references.

## 2. Finding Severity and Verdict

| Severity | Meaning | Result |
| --- | --- | --- |
| Critical | Credential/public-data leak, arbitrary script execution, path escape, data loss, draft exposure, destructive external action or broken canonical content | Packet blocked |
| Required | Spec/contract mismatch, missing error branch/test, architecture regression, silent export loss, inaccessible core path or meaningful performance/bundle regression | Must fix before dependent packet |
| Optional | Improvement that does not compromise the approved behavior or code health | May defer with reason |
| Nit | Cosmetic preference only | Never blocks |

Verdicts:

- **Approve**: no unresolved Critical/Required findings and required verification reproduced.
- **Request changes**: one or more Critical/Required findings remain.
- **Blocked by environment**: implementation may be correct, but a mandatory real-world check cannot be performed; list exact residual risk and do not call it approved.

## 3. Universal Review Checks

### Correctness

- [ ] Change implements only its task IDs and matches `spec.md`, `plan.md`, data model and contracts.
- [ ] Empty, null, maximum-size, stale revision, interrupted request and partial-failure paths are handled.
- [ ] Tests assert behavior and fail when the relevant implementation is removed or broken.
- [ ] Error states are not converted into false success or silent fallback.
- [ ] Existing unrelated routes and build modes remain unchanged.

### Readability and Architecture

- [ ] Names match canonical entities and statuses; no parallel vocabulary for the same concept.
- [ ] No gratuitous `any`, casts, optional fields or generic wrappers hide an unclear invariant.
- [ ] Feature-specific logic stays under `src/lib/content`, `src/pages/content*`, `server/content` or `scripts/content`.
- [ ] Shared files contain only integration wiring, not content-specific business branches.
- [ ] No file is allowed to become a monolith; orchestration, policies and rendering remain separate.
- [ ] No duplicate TypeScript/Python document model silently drifts from the JSON Schema.
- [ ] No unrelated refactor, formatting churn or dependency upgrade is mixed into the packet.

### Security and Privacy

- [ ] All HTTP, clipboard, pasted HTML, JSON, media metadata and remote responses are untrusted at entry.
- [ ] Server validates document schema/depth/size independently from the browser.
- [ ] Loopback helper enforces bind address, Host, Origin, startup token, body limits and safe errors.
- [ ] File paths derive from generated IDs and remain below allowlisted roots.
- [ ] Image bytes are decoded with byte/pixel/dimension limits; extension and browser MIME are not trusted.
- [ ] Public renderer uses a node/mark allowlist, Vue text binding and URL policy; no arbitrary `v-html`.
- [ ] Logs/audit/errors exclude body text, image bytes, token, credentials, environment values and absolute paths.
- [ ] No draft, local audit, Base64, Blob URL, signed temporary COS URL or unauthorized image reaches Git/public output.

### Performance and UX

- [ ] 50,000 characters, 50 images and 20×20 table are bounded and remain usable.
- [ ] Autosave is serialized/debounced and does not deep-clone/render the full document unnecessarily on each keypress.
- [ ] Public list endpoints/data are paginated or bounded according to contract.
- [ ] Public pages do not ship Tiptap/ProseMirror.
- [ ] Tables/galleries/long URLs/code do not create incoherent page overflow.
- [ ] Keyboard commands, focus, dialog behavior and icon accessible names work.
- [ ] All fixed UI copy comes from localization keys.

## 4. Packet-Specific Gates

### H0A Dependencies

- [ ] Lockfile is tool-generated and limited to approved packages/transitives.
- [ ] No unrelated bulk upgrade or automatic audit fix occurred.
- [ ] License, Python/Vue peer ranges and install scripts are documented.
- [ ] Content-studio scripts do not start by default or affect existing service ports.
- [ ] Local-only paths are ignored and checked without committing empty/staged media directories.

### H0B NGA/COS

- [ ] Syntax and behavior come from current real NGA preview, not memory.
- [ ] Fixture text is synthetic and image is owner-authorized.
- [ ] COS URL is permanent anonymous HTTPS with image `Content-Type`.
- [ ] Referer/no-Referer and anti-hotlink behavior is recorded.
- [ ] No NGA post or external mutation occurred.

### H1 Canonical Model and Boundaries

- [ ] Schema version is mandatory; unknown versions/nodes/marks fail closed.
- [ ] Recursive depth, node count, text length, table dimensions and URL lengths are bounded.
- [ ] Canonical serialization is deterministic and does not include UI-only NodeView state.
- [ ] TypeScript and Python both execute equivalent document rules.
- [ ] `VITE_ENABLE_CONTENT_STUDIO=false` removes route and editor chunk at build time.
- [ ] API client never embeds a persistent token or public helper URL.

### H2 Draft, Media and Editor

- [ ] Revisions are immutable; identical saves deduplicate; stale saves return 409.
- [ ] Atomic write cannot leave the latest pointer referencing a partial/missing revision.
- [ ] Published media cannot be invalidated by deleting/replacing a draft.
- [ ] FileHandler events upload bytes through the helper; Base64 is never canonical.
- [ ] Table merge/split/resize retains a valid logical grid after round-trip.
- [ ] Gallery order, caption, alt, alignment and width survive save/reload.
- [ ] Helper loss leaves current browser content editable and clearly unsaved.
- [ ] Two-tab conflict is explicit; no last-write-wins or silent merge claim.

### H3 Publication and Reader

- [ ] Publish uses an exact immutable revision and checks expectedRevision.
- [ ] New draft edits do not alter current public JSON before republish.
- [ ] Withdraw returns to draft; archive removes publication; restore does not republish.
- [ ] Generator reads only `content/published/` and replaces output atomically.
- [ ] Checker catches unpublished entries, invalid resources, local paths, Base64 and orphan output.
- [ ] Public direct routes reveal no title/body/media for non-published content.
- [ ] Preview and public reader share semantic components without importing editor dependencies.
- [ ] Dangerous/unknown content cannot execute or disappear silently.

### H4 NGA Export

- [ ] Serializer is a pure JSON tree walk; it never routes through HTML.
- [ ] Text, attribute, URL and code contexts have separate escaping.
- [ ] Marks close in reverse order and nested fixtures cover combinations.
- [ ] Source text, links, table cells and image order are never silently omitted/reordered.
- [ ] Gallery/table/typography degradation produces deterministic losses.
- [ ] Unknown node/mark and local/temporary/unverified media are blocking.
- [ ] Identical JSON + mapping version yields byte-identical text/losses.
- [ ] Export never authenticates to or writes to NGA.

### H5 Markdown Export

- [ ] Basic semantics remain readable and deterministic.
- [ ] Complex nodes preserve content through explicit fallback/loss.
- [ ] No Markdown import or second canonical model is introduced.
- [ ] Shared export UI changes do not regress NGA behavior.

### H6 Final Quality

- [ ] Large fixture budgets and security regressions pass.
- [ ] Desktop authoring and desktop/mobile day/night reader paths are reproduced.
- [ ] Console, failed network requests and Vite overlay are clean for tested paths.
- [ ] Ordinary production asset audit proves no studio/Tiptap chunk.
- [ ] Module/API/architecture/deployment docs match actual implementation.
- [ ] Full quickstart and all listed commands have recorded outcomes.
- [ ] Final worktree audit excludes unrelated changes, unauthorized assets and secrets.

## 5. Reviewer Commands

Run only the commands relevant to the packet first, then the full gate at H6:

```powershell
npm run test:content
npm run test:content-api
npm run check:content
npm run typecheck
npm run check:i18n
npm run build
git diff --check
git status --short
```

For UI packets, Codex must also start/reuse the actual authoring or public app and inspect the required path in a real browser. Build success is not a UI verdict.

For API/media packets, Codex must run the helper and exercise both success and failure requests. Unit tests alone are not an API verdict.

For NGA, Codex must independently inspect the recorded fixture and, when the environment/login permits, reproduce the editor preview without submitting a post.

## 6. Review Response Format

```markdown
## Findings

1. Critical/Required finding with file:line, behavior impact and concrete remedy.
2. Next finding in severity order.

## Open Questions

- Only unresolved factual assumptions that materially affect the verdict.

## Verification

- command/path: result

## Verdict

Approve | Request changes | Blocked by environment
```

When no issues are found, Codex must say so explicitly and still list test gaps or residual risks. Codex does not rubber-stamp Hermes output and does not rewrite large portions during review; Hermes owns remediation unless the owner redirects the work.
