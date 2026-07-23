# Data Model: 时尚品鉴历史答案库

## FashionCheckHistory

Represents the complete ordered history available to the first data slice.

| Field | Type | Rules |
|------|------|-------|
| `schemaVersion` | string | Exact supported contract version |
| `generatedAt` | ISO timestamp | Build time, not source truth |
| `sources` | SourceDescriptor[] | Must include official CSV and local community evidence provenance |
| `weeks` | FashionCheckWeek[] | Exactly 426 records for the initial complete build |

## SourceDescriptor

| Field | Type | Rules |
|------|------|-------|
| `sourceId` | string | Stable project-local identifier |
| `name` | string | Human-readable source name |
| `url` | absolute URL | Public source or project repository URL |
| `roles` | enum[] | `canonical`, `history`, `gold-answers`, `current-week`, `dyes`, `score-plans`, `mechanics`, `item-acquisition`, `related-tool`, `validation-only` |
| `retrievedAt` | ISO timestamp or null | Required when content was fetched |
| `licenseStatus` | enum | `official-game-data`, `declared`, `unspecified`, `not-applicable` |
| `license` | string or null | SPDX or source-provided label when known |
| `usePolicy` | enum | `canonical`, `local-evidence`, `cross-check-only`, `link-only` |
| `notes` | string | Scope, access limitations and attribution notes |

## FashionCheckWeek

| Field | Type | Rules |
|------|------|-------|
| `globalIssue` | integer | Unique and contiguous from 16 through 441 |
| `cnIssue` | integer | `globalIssue - 15`, contiguous from 1 through 426 |
| `startDate` | `YYYY-MM-DD` | Weekly Tuesday date derived from CN issue 1 at 2018-05-15 |
| `themeId` | integer | Existing `FashionCheckWeeklyTheme` row ID |
| `sourceTheme` | string | Original QQ label retained for audit |
| `sourceRows` | integer[] | Original extracted row pair |
| `slots` | FashionCheckSlot[] | Preserve historical 3/4/5-slot records; do not force rewrite |
| `anomalies` | string[] | Explicit source anomalies, empty for normal records |

## FashionCheckSlot

| Field | Type | Rules |
|------|------|-------|
| `slotId` | enum | `head`, `body`, `hands`, `legs`, `feet`, `ears`, `neck`, `wrists`, `rightRing`, `leftRing` |
| `categoryId` | integer | Existing `FashionCheckThemeCategory` row ID |
| `sourceTag` | string | Original QQ label |
| `sourceAnswer` | string | Original QQ answer expression, may be empty only when anomaly is recorded |

Relationship: many weekly slots reference one reusable category answer.

## FashionCheckAnswerCatalog

| Field | Type | Rules |
|------|------|-------|
| `schemaVersion` | string | Exact supported contract version |
| `generatedAt` | ISO timestamp | Build time |
| `categories` | Record<categoryId, CategoryAnswer> | Every category used by history must exist |

## CategoryAnswer

| Field | Type | Rules |
|------|------|-------|
| `categoryId` | integer | Canonical Fashion Check category row ID |
| `names` | locale-to-string object | Derived from official locale sheets where available |
| `goldItemIdsBySlot` | Record<slotId, integer[]> | Unique, sorted, non-empty for every used category/slot pair |
| `evidenceByItemId` | Record<itemId, EvidenceRef[]> | Every emitted category/item relationship has its own supporting evidence |
| `resolutionStatus` | enum | `resolved`, `reviewed-exception`, `unresolved` |

`unresolved` is allowed in intermediate audit output but forbidden in a complete catalog.

## EvidenceRef

| Field | Type | Rules |
|------|------|-------|
| `sourceId` | string | Must reference SourceDescriptor |
| `locator` | string | Row, category, article week, post URL or other stable public locator |
| `claim` | enum | `weekly-assignment`, `gold-item`, `dye`, `score-plan`, `mechanics`, `item-metadata` |
| `resolutionMethod` | enum | `official-id`, `exact`, `deterministic-expansion`, `cross-source-union`, `manual-review` |
| `retrievedAt` | ISO timestamp or null | Required for mutable current-week sources |

Sources registered as `related-tool` or `link-only` may appear in credits but cannot be attached as evidence unless they expose the supporting fact.

## FashionCheckItemIndex

| Field | Type | Rules |
|------|------|-------|
| `schemaVersion` | string | Exact supported contract version |
| `generatedAt` | ISO timestamp | Build time |
| `items` | Record<itemId, CompactItem> | Contains only IDs referenced by gold answers |

## CompactItem

| Field | Type | Rules |
|------|------|-------|
| `itemId` | integer | Existing current CN Item row ID |
| `names` | locale-to-string object | Available official names |
| `iconId` | integer | Non-negative official icon ID |
| `equipSlotCategoryId` | integer | Official Item slot category |
| `dyeCount` | integer | Official dye-slot count when available |

## AliasMapping

| Field | Type | Rules |
|------|------|-------|
| `sourceLabel` | string | Exact source spelling |
| `targetId` | integer | Canonical theme/category/Item ID depending on file |
| `reason` | enum | `old-translation`, `typo`, `source-column-shift`, `group-expression`, `manual-verification` |
| `evidence` | string | Short auditable note; no secrets or private paths |

## AuditReport

| Field | Type | Rules |
|------|------|-------|
| `summary` | object | Counts for weeks, themes, categories, items and unresolved entries |
| `sourceAnomalies` | object[] | Includes 3/5-slot weeks and missing cells |
| `aliasUsage` | object[] | Every alias applied and affected records |
| `itemResolution` | object[] | Exact, expanded, manual and unresolved outcomes |
| `sourceDisagreements` | object[] | Differences between QQ, tracker and official Item metadata |
| `sourceCoverage` | object[] | Per-source supported claims and missing coverage |
| `validationErrors` | string[] | Must be empty for a complete local build |

## State Transitions

```text
raw source
  -> normalized source
  -> canonical theme/category IDs resolved
  -> category gold Item IDs resolved
  -> official Item slot validation
  -> complete local catalog
  -> publication review
  -> public static catalog (later phase)
```

No transition may skip unresolved-item reporting or publication review.
