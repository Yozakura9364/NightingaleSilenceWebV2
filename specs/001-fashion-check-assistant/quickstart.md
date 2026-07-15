# Quickstart: 验证时尚品鉴历史答案库

This guide applies after the data-pipeline implementation is complete.

## Prerequisites

- The extracted QQ reference files exist under `local-assets/fashion-check/`.
- A current FFXIV datamining source is available locally or through the builder's existing project-style remote fallback.
- Community tracker input, when used for cross-checking, remains local and includes source metadata.

## Build

```powershell
npm run build:fashion-check-history
```

Expected local outputs:

```text
local-assets/fashion-check/generated/history.json
local-assets/fashion-check/generated/answers.json
local-assets/fashion-check/generated/items.json
local-assets/fashion-check/generated/audit.json
```

## Validate

```powershell
npm run check:fashion-check-history
node --test tests/fashion-check/*.test.mjs
```

Expected checks:

- 426 weeks.
- Global issues exactly `16..441`.
- CN issues exactly `1..426`.
- Zero unresolved theme aliases.
- Zero unresolved category aliases.
- Zero unresolved category/slot gold answer mappings.
- Zero missing or slot-incompatible Item IDs.
- Seven historical irregular tag-count records retained and reported.
- Two missing source answer cells retained in source audit but resolved through the canonical category catalog.
- No session/protocol secrets in generated files.
- Every reviewed source is present in the source registry with URL, role and license/use status.
- Every category/item answer has at least one valid evidence reference.
- Related tools without exposed supporting facts appear in credits only, not answer evidence.

## Spot Checks

1. Global issue 441 resolves the theme `知性蛮族工匠` and its four category slots.
2. `黄铜眼镜` resolves to Item ID `2668` in the head slot.
3. `春意衬衫` resolves to Item ID `21938` in the body slot.
4. A slash family such as `歹徒强袭/制敌/游击护臂` expands only to valid hand-slot Item IDs.
5. A wildcard family such as `狮鹫利爪XX戒指` produces reviewed ring candidates and no unrelated slot IDs.
6. The seven community tracker choker rows use official neck-slot metadata after validation.

## Publication Gate

Do not move generated files into `public/data/fashion-check/` during this slice. Public promotion requires:

1. Owner confirmation of the exact files to publish.
2. Attribution and redistribution review for community-maintained data.
3. A scoped public-data diff and final checker run.
