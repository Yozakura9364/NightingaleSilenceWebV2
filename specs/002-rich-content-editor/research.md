# Research: 博客与专题富内容编辑器

**Date**: 2026-07-28

## Decision 1: Tiptap 3 as the editor core

**Decision**: Use the official Tiptap 3 Vue 3 integration and ProseMirror document model for the authoring surface.

**Rationale**:

- The official Vue 3 guide provides `@tiptap/vue-3`, `@tiptap/pm`, and `@tiptap/starter-kit`, including Composition API and `<script setup>` usage.
- Current npm metadata reports `@tiptap/vue-3` 3.29.2, MIT license, Vue peer range `^3.0.0`, and development against Vue 3.5.13, matching this repository's Vue 3.5 line.
- Tiptap is headless-first, so the project can build a restrained pixel-workbench UI instead of adopting a third-party visual shell.
- Custom Node extensions provide a supported route for gallery and collapse semantics that do not fit basic Markdown.

**Alternatives considered**:

- **Vditor**: strong WYSIWYG Markdown experience, but Markdown remains the canonical model and constrains merged tables, galleries and future topic blocks.
- **Editor.js**: block JSON is suitable, but there is no official Vue integration and important capabilities depend on separately maintained plugins.
- **Ghost/Decap CMS**: provide broader publishing workflows, but introduce a separate administration product and do not satisfy the desired V2-native editing experience.
- **Custom contenteditable**: rejected because selection, IME, tables, paste normalization, undo and accessibility would become project-owned editor-engine work.

**Official sources**:

- https://tiptap.dev/docs/editor/getting-started/install/vue3
- https://tiptap.dev/docs/editor/getting-started/style-editor
- https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node
- https://registry.npmjs.org/%40tiptap%2Fvue-3/latest

## Decision 2: Versioned JSON is the canonical document

**Decision**: Persist `{ schemaVersion, doc }`, where `doc` is Tiptap/ProseMirror JSON. HTML, BBCode and Markdown are derived artifacts only.

**Rationale**:

- Tiptap's persistence documentation explicitly recommends JSON over HTML because it is more flexible and easier to parse or edit without another HTML parser.
- Versioning outside the raw document makes extension migrations explicit and prevents old articles from silently depending on current Node attributes.
- Keeping exports derived means accepted NGA/Markdown degradation never damages the V2 original.

**Alternatives considered**:

- **HTML source of truth**: easy to display but harder to validate, migrate and safely transform; increases stored-XSS risk.
- **Markdown source of truth**: portable but cannot faithfully represent the confirmed table/gallery/topic requirements.
- **BBCode source of truth**: couples V2 to an external forum dialect and recreates the editor experience the user wants to avoid.

**Official source**: https://tiptap.dev/docs/editor/core-concepts/persistence

## Decision 3: Built-in tables plus custom semantic nodes

**Decision**: Use Tiptap TableKit for tables and custom nodes for `gallery` and `collapse`; use a constrained image node with media identity, alt, caption, alignment and display size.

**Rationale**:

- Official Table commands cover insert/delete rows and columns, header toggles, merge/split, resize configuration, arbitrary registered cell attributes and `fixTables()`.
- The Image extension supports block images, alt/title attributes and resize UI, but explicitly does not upload files, so upload remains a separate service boundary.
- Gallery and collapse need stable semantic JSON rather than visual-only HTML wrappers.

**Alternatives considered**:

- Model galleries as consecutive images: rejected because layout, order and degradation policy become implicit.
- Store image blobs/Base64 inside JSON: rejected for document size, caching, portability and public-data safety.

**Official sources**:

- https://tiptap.dev/docs/editor/extensions/nodes/table
- https://tiptap.dev/docs/editor/extensions/nodes/image
- https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node

## Decision 4: FileHandler handles events; a loopback service handles files

**Decision**: Tiptap FileHandler receives paste/drop events, while a Flask service bound to `127.0.0.1` validates and stages image bytes. Base64 parsing remains disabled.

**Rationale**:

- Official FileHandler and Image docs both state that server upload functionality is not included.
- Server-side validation is required because browser MIME/type checks are not a security boundary.
- A loopback service matches the repository's existing local-helper/service patterns and avoids placing COS credentials in browser code.

**Alternatives considered**:

- Direct browser-to-COS upload: deferred because it needs scoped temporary credentials, CORS, expiry and a separately approved credential service.
- Public content management API: deferred because the repository has no owner authentication system and adding one would materially expand scope.
- IndexedDB-only drafts: useful as a crash cache but insufficient for publication files, cross-revision integrity and validated media staging.

**Official source**: https://tiptap.dev/docs/editor/extensions/functionality/filehandler

## Decision 5: Authoring is excluded from normal production builds

**Decision**: Add a compile-time `VITE_ENABLE_CONTENT_STUDIO` flag and a dedicated local launcher. The normal production build must evaluate the flag to false and omit the route and Tiptap chunk.

**Rationale**:

- The repository already uses explicit compile-time flags for Silence, Style Lab and the Armoire local workbench.
- Hiding an editor route without authentication is not access control.
- The user can complete the confirmed first-version workflow locally while public visitors receive only static reading data.

**Alternatives considered**:

- Public route with a secret URL: rejected as security by obscurity.
- Bearer token in localStorage: rejected because client-accessible auth tokens violate project security rules.
- Full login/session service: useful for remote authoring, but requires a separate scope and threat model.

## Decision 6: Public rendering uses a Vue allowlist, not arbitrary HTML

**Decision**: Recursively render validated JSON through V2 Vue components. Do not store or render raw HTML and do not use body content with `v-html`.

**Rationale**:

- Vue text interpolation safely escapes text by default.
- A node/mark allowlist makes unknown schema versions fail closed and lets tables, galleries and collapse share editor/reader semantics.
- The public route avoids loading Tiptap/ProseMirror and protects the existing site's bundle size.

**Alternatives considered**:

- Tiptap read-only editor: correct semantics but unnecessarily ships editor dependencies publicly.
- Static-rendered HTML + sanitizer: workable, but introduces an HTML trust boundary and another sanitizer dependency for no first-version benefit.

**Related official source**: https://tiptap.dev/docs/editor/api/utilities/static-renderer

## Decision 7: Deterministic NGA BBCode with explicit loss reporting

**Decision**: Implement a pure JSON-tree serializer that returns `{ text, losses }`. Exact tags, nesting and escaping are locked by synthetic golden fixtures verified in NGA's actual editor/preview before enabling the exporter.

**Rationale**:

- NGA is the primary compatibility target, but V2 nodes can be richer than the target dialect.
- A structured loss report makes accepted degradation visible instead of silently deleting data.
- Synthetic fixtures avoid copying or committing another author's content.

**Alternatives considered**:

- Generate BBCode through HTML: rejected because the extra intermediate format loses semantics and makes escaping harder to reason about.
- Directly post to NGA: explicitly out of scope and would add credentials, automation policy and external-write risk.

## Decision 8: Markdown is a low-priority derived export

**Decision**: Export a conservative Markdown subset and provide mappings for custom nodes; do not implement Markdown import or promise round-trip fidelity.

**Rationale**:

- Tiptap's Static Renderer can render JSON to Markdown with custom node/mark mappings and unhandled handlers.
- The official documentation warns that the renderer does not validate any particular Markdown flavor, matching the user's low-priority requirement and the need for explicit degradation.

**Alternative considered**: A separate Markdown-first editor or dual canonical formats was rejected because it would create conflicting sources of truth.

**Official source**: https://tiptap.dev/docs/editor/api/utilities/static-renderer

## Decision 9: Static publication and manually controlled media release

**Decision**: Drafts and staged media remain ignored locally. An explicit publication creates tracked structure-only source data. Images are manually synchronized to a dedicated COS/CDN prefix and must use a permanent anonymous HTTPS URL with an allowed image response type before publication. NGA compatibility is verified with representative anti-hotlink requests and NGA's real preview; ordinary image embedding does not require CORS.

**Rationale**:

- The repository already uses static manifests and a manual COSBrowser flow for NSPlate assets.
- Public runtime does not need a new database service.
- No COS write credentials enter the repository, browser or helper logs.
- Permanent CDN URLs avoid expiring COS signatures that would break published V2 articles or NGA posts.

**Alternatives considered**:

- Commit images under `public/`: prohibited without per-asset authorization and inefficient for large image libraries.
- Automatic COS upload in v1: deferred until scoped credentials, protected prefixes, audit and rollback receive separate approval.

## Decision 10: Test conversion logic independently from browser UI

**Decision**: Add Vitest for TypeScript schema/serializer tests, Python unittest for the helper, existing project checks for integration, and Playwright for real editor/reader paths.

**Rationale**:

- BBCode nesting and escaping need fast combinatorial fixtures.
- File and publication security boundaries need isolated error-branch tests.
- Browser tests remain necessary for IME, selection, tables, paste/drop, responsive layout and bundle/runtime behavior.

**Alternatives considered**:

- Browser-only tests: too slow and imprecise for serializers.
- Duplicate `.mjs` production logic solely for Node's built-in test runner: rejected because it would split TypeScript source and test behavior.

## Decision 11: Execute the canonical JSON Schema at the Python write boundary

**Decision**: Use the owner-approved `jsonschema>=4.23,<4.24` for the Python 3.8 loopback service. Hermes must still audit the resolved dependency and lockfile before implementation.

**Rationale**:

- Saving and publication write files from an untrusted HTTP request, so frontend validation alone is not a server security boundary.
- Reusing `contracts/editor-document.schema.json` avoids a handwritten Python validator drifting from the TypeScript model and public renderer.
- Official PyPI metadata for `jsonschema 4.23.0` declares Python `>=3.8` and the MIT license. Current `4.26.0` requires Python `>=3.10`, so it is outside this plan's runtime range.

**Alternatives considered**:

- Handwritten recursive Python validation: rejected because the document contains recursive block, mark, table and media rules that would duplicate the executable contract.
- Frontend-only validation: rejected because direct or malicious loopback requests could bypass it.
- Raising the helper runtime to Python 3.10: deferred because the approved plan explicitly preserves Python 3.8 compatibility.

**Official sources**:

- https://pypi.org/project/jsonschema/4.23.0/
- https://pypi.org/project/jsonschema/
