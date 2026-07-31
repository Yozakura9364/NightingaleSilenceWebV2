# Contract: NGA BBCode Export v1

**Mapping id**: `nga.bbcode.v1`

## Boundary

- Input is one validated immutable `content.document.v1` document.
- Output is `{ text, losses, mappingVersion }`.
- Export is local and pure: it does not save the draft, mutate JSON, authenticate to NGA, fetch NGA content or submit a post.
- Exact target syntax is enabled only after synthetic fixtures pass NGA's current real editor and preview. This document records semantic obligations; fixture output is the executable dialect contract.

## Loss Levels

| Severity | Export behavior |
| --- | --- |
| `INFO` | Equivalent content with a cosmetic normalization; export succeeds. |
| `WARNING` | Content is preserved with a documented layout/attribute downgrade; export succeeds and UI highlights the loss. |
| `BLOCKING` | Content would be omitted, reordered, unsafe or ambiguous; export is not presented as successful. |

Every loss includes `nodePath`, `nodeType`, stable `code`, localization `messageKey`, and fallback name where applicable.

## Validation Gate Before Implementation

Use only synthetic text and project-authorized images to verify these target constructs in NGA preview:

1. nesting/escaping for bold, italic, underline, strike, color and size;
2. link syntax and characters requiring escaping;
3. quote, code, ordered/unordered list and nested list behavior;
4. table row/cell syntax, header representation, colspan and rowspan support;
5. image syntax, captions and consecutive images;
6. collapse title/content syntax;
7. maximum accepted nesting and any editor normalization.

The resulting golden fixtures live under `tests/fixtures/content/nga/`. Do not use another author's article as fixture content.

## Semantic Mapping

| V2 semantic | NGA v1 policy | Loss policy |
| --- | --- | --- |
| paragraph | Text followed by normalized paragraph spacing | None |
| heading 2-4 | Verified bold + size combination per level | `INFO` because NGA/V2 typography is not pixel-identical |
| bold / italic / underline / strike | Corresponding verified inline tag | None after fixture validation |
| text color | Verified color tag using normalized six-digit hex | `WARNING` only if target rejects color; then plain text |
| text size | Nearest verified discrete NGA size | `INFO` for exact match, `WARNING` for nearest-size normalization |
| left/center/right alignment | Corresponding verified alignment wrapper | None after fixture validation |
| justify alignment | Left alignment fallback | `WARNING: ALIGN_JUSTIFY_TO_LEFT` |
| link | Verified URL tag; visible text preserved | `BLOCKING` for unsafe protocol; none for valid target |
| inline code | Verified inline code form if supported; otherwise code-styled plain text | `WARNING` if inline form unavailable |
| blockquote | Verified quote wrapper | None |
| code block | Verified code wrapper; language retained only if target supports it | `WARNING: CODE_LANGUAGE_DROPPED` when needed |
| unordered list | Verified list/item tags | None |
| ordered list | Verified ordered list when supported; otherwise numbered text | `WARNING: ORDERED_LIST_FLATTENED` only for fallback |
| horizontal rule | Verified divider tag or deterministic text divider | `INFO` for text divider fallback |
| table | Verified table/row/cell structure | See table rules below |
| image | Verified image tag using `https://` public URL | `BLOCKING` when media is not remote-verified |
| image caption | Caption text immediately after image | `INFO: CAPTION_MOVED_AFTER_IMAGE` |
| gallery | Images emitted in source order, separated by deterministic spacing | `WARNING: GALLERY_FLATTENED` |
| collapse | Verified collapse wrapper with escaped title | None after fixture validation |
| unknown node/mark | No implicit fallback | `BLOCKING: UNKNOWN_NODE` / `UNKNOWN_MARK` |

## Table Rules

1. Cell text and source row order are mandatory and may never be silently omitted.
2. Column visual width is advisory and is dropped unless NGA fixtures prove an equivalent attribute (`INFO: TABLE_WIDTH_DROPPED`).
3. Alignment is emitted only when the target cell syntax supports it; otherwise cell content is preserved with `WARNING: CELL_ALIGN_DROPPED`.
4. `colspan`/`rowspan` are emitted only after actual preview validation. If unsupported, the serializer expands the logical grid and repeats/empties cells according to a documented fixture, with `WARNING: CELL_SPAN_EXPANDED`.
5. A malformed logical table is `BLOCKING: INVALID_TABLE`; the serializer does not call a best-effort HTML converter.

## Image and Gallery Rules

- Only `https://` URLs on the configured verified content host are exportable.
- Local `media://`, Blob, data URL and unverified external hosts are blocking.
- Source image order is immutable.
- Gallery columns, crop and V2 display width do not map to NGA; images flatten to a linear sequence and retain captions.
- No downloader/proxy is invoked by export.

## Escaping and Nesting

- Text escaping is context-aware: plain text, tag attribute, URL and code contexts use distinct functions.
- Marks close in reverse opening order and fixture tests cover every supported pairwise nesting combination.
- User text can never create an exporter-owned closing/opening tag without being escaped.
- Code block contents preserve literal text according to the verified NGA code escaping rule and never pass through normal inline-mark serialization.
- Export normalizes line endings to `\n` and does not append hidden signatures or tracking text.

## Determinism

For identical canonical JSON and mapping version:

- `text` is byte-for-byte identical;
- `losses` are ordered by node path, then code;
- no timestamps or environment-specific URL/path values appear in output;
- export does not depend on editor selection or DOM state.

## Required Golden Fixtures

| Fixture | Minimum coverage |
| --- | --- |
| `inline-marks` | every mark, escaping, mixed nesting, Chinese/ASCII/emoji |
| `links` | internal, HTTPS, mailto, query/hash, unsafe protocol rejection |
| `lists-quotes-code` | nested lists, quote paragraphs, literal tag-like code text |
| `table-basic` | headers, multiple rows, empty cells, alignment |
| `table-span` | merge/split, colspan/rowspan supported or expanded fallback |
| `images-gallery` | single image, caption, 2/3/grid flattening and order |
| `collapse` | title escaping and nested supported blocks |
| `unknown` | unknown node/mark produces blocking loss and no silent success |

## Acceptance

The exporter is ready only when:

1. all synthetic golden fixtures pass automated byte/loss assertions;
2. every non-blocking fixture is pasted into NGA's real preview and checked manually;
3. the full fixture preserves 100% of text, link targets, image URLs/order and table cell content;
4. every intentional visual downgrade appears in `losses`;
5. no fixture requires NGA account credentials in code, test data or logs.
