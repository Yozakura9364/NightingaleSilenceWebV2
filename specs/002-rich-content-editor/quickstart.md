# Quickstart Validation: 博客与专题富内容编辑器

This guide describes the runnable acceptance path expected after implementation. Commands listed here do not exist until the corresponding implementation phase lands.

## Prerequisites

- Repository dependencies installed from the committed `package-lock.json`.
- Python environment satisfying `server/content/requirements.txt`.
- System Chrome or Edge available for Playwright.
- A local authoring media directory under ignored `local-assets/content-studio/`.
- For publication checks, approved sample images synchronized manually to the configured content CDN prefix. No COS credentials are required by the app.

## 1. Start the Authoring Build

```powershell
npm run dev:content-studio
```

Expected:

- The launcher starts Vite and the content helper.
- The helper listens only on `127.0.0.1`.
- `#/content-studio` is available in this build.
- The normal `npm run dev` and `npm run build` do not register or bundle the studio route.

## 2. Create and Recover a Draft

1. Open `#/content-studio` in a desktop viewport.
2. Create one content draft with a title; the service assigns a numeric public ID.
3. Add paragraphs, H2/H3, marks, a link, quote, list, code block and collapse.
4. Insert a 3×3 table; add/delete a row and column; merge and split cells; resize one column.
5. Paste one approved image and create a three-image gallery.
6. Wait for the saved state, record the displayed revision, then refresh.

Expected:

- The exact node order, table structure, image order, captions and metadata return.
- The save state distinguishes saving, saved and failure.
- No Base64 image data appears in saved JSON or network responses.

## 3. Exercise Conflict and Failure Paths

1. Open the same draft in two tabs.
2. Save a change in tab A, then save stale content in tab B.
3. Stop the helper and continue editing.
4. Restart the helper and retry intentionally.

Expected:

- Tab B receives a revision conflict and does not overwrite tab A.
- Current in-browser content remains available during helper failure.
- Recovery requires an explicit reload/compare action; no silent merge is claimed.

## 4. Validate Media Boundaries

Attempt these uploads:

- valid PNG/JPEG/WebP/GIF
- renamed executable or text file with an image extension
- unsupported SVG
- image over byte limit
- image over pixel/dimension limit
- filename containing path separators

Expected:

- Only server-decoded allowed images enter staging.
- Staged files use generated IDs, not user names.
- Error responses contain stable codes and no absolute path/stack.
- Publication remains blocked until every referenced image has a permanent anonymous HTTPS URL on the configured host and returns an allowed image response type.
- A representative image URL is tested with NGA preview and the configured anti-hotlink policy; CORS is not required for ordinary external image display.

## 5. Validate Exports

Use the synthetic fixture defined by `tests/fixtures/content/nga-full.json`.

```powershell
npm run test:content -- --run
```

In the UI:

1. Export NGA BBCode and inspect the loss report.
2. Paste the output into NGA's real editor/preview without submitting a post.
3. Export basic Markdown and open it as text.

Expected:

- BBCode preserves all text, link targets, image references/order and table cell content.
- Gallery/topic-only layout degradation is listed and deterministic.
- Markdown preserves basic semantics and reports every complex fallback.
- Neither export changes the source revision/hash.

## 6. Publish and Read

1. Synchronize approved staged sample images to the configured content CDN prefix with COSBrowser.
2. Run the remote checker from the studio.
3. Publish the current revision.
4. Generate/check public data.

```powershell
npm run build:content
npm run check:content
```

Open:

- `#/blog`
- `#/blog/<id>`

Expected:

- Only published content fixtures appear in `#/blog` and `#/blog/<id>`.
- A newer saved draft does not change the public detail until republished.
- Withdrawing a publication returns it to draft and removes it from public lists/direct routes.
- Archiving removes any current publication; restoring an archive returns it to draft without publishing it.
- Archived/unpublished direct routes do not expose metadata or body.
- Public pages make no `/api/content-studio` request and load no Tiptap/editor chunk.

## 7. Security Fixtures

Paste/import fixtures containing:

- `<script>` and inline event handlers
- `javascript:`/`data:` links
- iframe/object/embed nodes
- unknown node and mark names
- media URL on an unapproved host
- oversized/deeply nested JSON

Expected:

- Executable/unknown content is removed or rejected at the documented boundary.
- Unknown canonical nodes block publication/export rather than disappearing silently.
- The public renderer never uses arbitrary body HTML.

## 8. Responsive and Theme Verification

Validate public pages at `1440×900` and `390×844`, in day and night modes.

Expected:

- Tables use a coherent responsive overflow treatment rather than resizing text.
- Galleries preserve order and do not overlap captions or following content.
- Long titles, URLs and code do not cause incoherent horizontal page overflow.
- Studio desktop controls have stable dimensions, visible focus and accessible names.

## 9. Full Quality Gate

```powershell
npm run test:content
npm run test:content-api
npm run check:content
npm run typecheck
npm run check:i18n
npm run build
git diff --check
```

Also inspect:

```powershell
git status --short
git diff --cached --name-only
```

Expected:

- No draft, local audit, Base64 payload, credential, staged image or unauthorized bitmap is tracked.
- Public build contains only approved published JSON and CDN references.
- Existing FFXIV routes and checks remain unaffected.
