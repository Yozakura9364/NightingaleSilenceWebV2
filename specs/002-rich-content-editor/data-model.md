# Data Model: 博客与专题富内容编辑器

**Schema family**: `content.*.v1`

## Entity Overview

```text
ContentEntry 1 ─── * ContentRevision
ContentEntry 1 ─── 0..1 Publication ─── 1 ContentRevision
ContentRevision * ─── * MediaAsset (through MediaReference)
ContentRevision 1 ─── * ExportArtifact
ExportArtifact 1 ─── * ExportLoss
ContentEntry 1 ─── * AuditEvent
```

## ContentEntry

Represents the durable identity and metadata of one published content entry.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID string | Server-generated; immutable; never derived from title/path |
| `publicId` | positive integer | Server-generated; immutable; globally unique across the blog route; used by the public `#/blog/:id` route |
| `title` | string | Trimmed, 1-120 characters for publication; draft may temporarily be empty |
| `summary` | string or null | Max 300 characters; no raw HTML |
| `coverMediaId` | UUID or null | Must reference a verified media asset before publication |
| `tags` | string[] | Max 10; each trimmed and max 30 characters; stable display order |
| `status` | `DRAFT \| PUBLISHED \| ARCHIVED` | Derived from publication state, not trusted from client input |
| `draftRevisionId` | UUID | Points to latest successfully saved draft revision |
| `publishedRevisionId` | UUID or null | Points to immutable public snapshot |
| `revision` | positive integer | Optimistic concurrency token for metadata/draft pointer updates |
| `createdAt` | ISO 8601 UTC | Server-generated |
| `updatedAt` | ISO 8601 UTC | Updated after successful mutation |
| `publishedAt` | ISO 8601 UTC or null | Set when current publication is created |

## ContentRevision

Immutable snapshot of metadata plus one `ContentDocument`.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID string | Immutable |
| `entryId` | UUID string | Existing ContentEntry |
| `sequence` | positive integer | Strictly increasing per entry |
| `document` | ContentDocument | Must pass the exact versioned JSON Schema |
| `metadataSnapshot` | object | `publicId`, `title`, `summary`, `coverMediaId`, `tags` at save time |
| `mediaReferences` | MediaReference[] | Derived from the document; client list is not trusted |
| `documentHash` | lowercase SHA-256 hex | Calculated from canonical JSON for integrity/deduplication |
| `createdAt` | ISO 8601 UTC | Server-generated |

Revision files are append-only. Autosave creates a new revision only when canonical content or metadata changes; identical saves return the current revision.

## ContentDocument

Wrapper around the editor JSON.

| Field | Type | Rules |
| --- | --- | --- |
| `schemaVersion` | `content.document.v1` | Unknown versions fail closed and require a migration |
| `doc` | document node | Root type is `doc`; child nodes must be in the allowlist |

Allowed first-version block semantics:

- paragraph, heading levels 2-4
- blockquote, ordered list, bullet list, list item
- code block, horizontal rule
- table, row, header cell, normal cell
- image/figure, gallery
- collapse

Allowed inline semantics:

- text and hard break
- bold, italic, underline, strike, inline code
- text color
- link with allowed `https`, `http`, `mailto`, root-relative or hash-route target

No raw HTML, script, iframe, style attribute, event attribute or unknown node/mark is valid in v1.

The executable schema is [contracts/editor-document.schema.json](./contracts/editor-document.schema.json).

## MediaAsset

Represents an image independently of any one article.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID string | Generated before staging; used for references and safe filenames |
| `contentHash` | SHA-256 hex | Hash of exact uploaded bytes; duplicate bytes can reuse an asset |
| `originalName` | string | Display-only sanitized basename; never used as filesystem path |
| `mediaType` | enum | `image/png`, `image/jpeg`, `image/webp`, `image/gif`; SVG excluded in v1 |
| `byteSize` | integer | 1 byte to configured max (initial proposal: 20 MiB) |
| `width` / `height` | integer | Server-decoded; each 1-16,384; total pixels capped |
| `localObjectName` | string | Generated ID plus verified extension under allowlisted staging root |
| `publicObjectKey` | string | Generated `content/<yyyy>/<id>.<ext>`; no user path segments |
| `publicUrl` | HTTPS URL or null | Host must match configured content image host |
| `status` | `STAGED \| REMOTE_VERIFIED \| REFERENCED \| ORPHANED` | Server-controlled |
| `remoteCheckedAt` | UTC timestamp or null | Set only after permanent HTTPS URL, anonymous access, allowed image response type and configured host checks succeed |
| `createdAt` | UTC timestamp | Server-generated |

The document node owns presentation metadata (`alt`, `caption`, `align`, `displayWidth`); MediaAsset owns file identity and technical properties.

## MediaReference

Derived relation between revision and media.

| Field | Type | Rules |
| --- | --- | --- |
| `revisionId` | UUID | Existing revision |
| `mediaId` | UUID | Existing asset |
| `nodePath` | integer[] | Stable path in that immutable revision for diagnostics |
| `role` | `BODY \| GALLERY \| COVER` | Derived |

## Publication

Current public pointer and static artifact metadata.

| Field | Type | Rules |
| --- | --- | --- |
| `entryId` | UUID | One current publication maximum per entry |
| `revisionId` | UUID | Immutable revision that passed all publication checks |
| `publicId` | snapshot | Determines the public route and generated file |
| `sourcePath` | repository-relative path | Must remain below `content/published/`; derived, never client supplied |
| `publicPath` | public data path | Must remain below `/data/content/entries/` |
| `publishedAt` | UTC timestamp | Server-generated |
| `generationHash` | SHA-256 hex | Hash of generated public JSON |

Publication preconditions:

1. Required metadata is valid and `publicId` is unique.
2. Document schema is known and valid.
3. Document contains meaningful body content.
4. Every MediaReference points to a `REMOTE_VERIFIED` asset on the configured HTTPS host.
5. No blocking export/render validation issue exists.
6. `expectedRevision` matches the latest draft pointer.

## ExportArtifact

Ephemeral or downloadable output derived from an immutable revision.

| Field | Type | Rules |
| --- | --- | --- |
| `revisionId` | UUID | Exact source revision |
| `format` | `NGA_BBCODE \| MARKDOWN` | BBCode is primary compatibility target |
| `mappingVersion` | string | e.g. `nga.bbcode.v1`, `markdown.basic.v1` |
| `text` | string | Generated output; never accepted as canonical input |
| `losses` | ExportLoss[] | Empty only when every semantic maps without degradation |
| `generatedAt` | UTC timestamp | For UI/download metadata; not written into canonical document |

## ExportLoss

| Field | Type | Rules |
| --- | --- | --- |
| `severity` | `INFO \| WARNING \| BLOCKING` | BLOCKING prevents silent export completion |
| `nodePath` | integer[] | Source location |
| `nodeType` | string | Original semantic node/mark |
| `code` | stable string | Machine-readable reason, e.g. `GALLERY_FLATTENED` |
| `messageKey` | localization key | UI resolves user-visible message |
| `fallback` | string or null | Name of applied deterministic fallback |

## AuditEvent

Minimal append-only operational event.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Generated |
| `entryId` | UUID | Target identity |
| `action` | enum | `PUBLISH`, `WITHDRAW`, `ARCHIVE`, `RESTORE`, `MEDIA_STAGE`, `MEDIA_VERIFY` |
| `revisionId` | UUID or null | Included when applicable |
| `result` | `SUCCESS \| FAILURE` | Stable status |
| `reasonCode` | string or null | Machine-readable, no stack/path/body |
| `createdAt` | UTC timestamp | Generated |

Audit events MUST NOT contain document text, image bytes, tokens, environment values or absolute filesystem paths.

## State Transitions

```text
new -> DRAFT
DRAFT --publish(valid revision)--> PUBLISHED
PUBLISHED --save edit--> PUBLISHED + newer isolated draft revision
PUBLISHED --publish(new revision)--> PUBLISHED (public pointer advances atomically)
DRAFT/PUBLISHED --archive--> ARCHIVED (current publication, if any, is removed)
PUBLISHED --withdraw--> DRAFT (public pointer removed; latest draft retained)
ARCHIVED --restore to editing--> DRAFT
ARCHIVED --republish valid revision--> PUBLISHED
```

Deleting a draft with no publication may remove its entry after confirmation. Deleting or archiving an entry never automatically deletes local or remote media; orphan cleanup is a separate audited maintenance action outside v1.

## Concurrency Rules

- Every PATCH includes `expectedRevision` from the last successful read/save.
- A mismatch returns HTTP 409 with current revision metadata, never an automatic last-write-wins merge.
- Autosave is debounced and serialized per entry; an in-flight save cannot be overtaken by an older queued payload.
- Publication uses the exact requested immutable revision and an atomic source-file replacement.

## Migration Rules

- `schemaVersion` is mandatory on every ContentDocument and generated public file.
- Migration functions are pure `vN -> vN+1` transforms with fixtures for both success and rejected unknown data.
- Old extension names/attributes remain readable through migrations; UI-only NodeView state is never canonical.
- Publication refuses a document when migration or validation produces an unknown node, invalid media reference or blocking loss.
