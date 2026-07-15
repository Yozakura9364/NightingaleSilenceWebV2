# Research: 时尚品鉴历史答案库

## Decision 1: Use Official IDs As Canonical Keys

**Decision**: Weekly themes, hint categories and equipment use official `FashionCheckWeeklyTheme`, `FashionCheckThemeCategory` and `Item` row IDs as canonical keys.

**Rationale**: Chinese labels in the community sheet contain old translations, aliases, typos and merged item expressions. Stable IDs allow localization and future CSV refreshes without rewriting historical relationships.

**Alternatives considered**:

- Use Chinese text as the primary key: rejected because 10 theme labels and 32 category labels already fail exact current-CSV matching.
- Use English text as the primary key: rejected for the same localization and punctuation risks.

## Decision 2: Preserve QQ Data As Local Evidence, Not Runtime Truth

**Decision**: Use the extracted QQ sheet to establish CN chronology, source labels and community answer evidence. Keep the raw and normalized source files under ignored `local-assets/fashion-check/`.

**Rationale**: The sheet supplies 426 weeks that client CSV does not contain, but it has no machine-readable license grant and includes known anomalies.

**Measured facts**:

- Raw target sheet: 943 rows x 23 columns.
- Historical range: global issues 16..441, CN issues 1..426.
- Seven historical records contain 3 or 5 labels instead of 4.
- Two source tag cells have no corresponding answer cell.
- No QQ protocol/session secrets are retained in extracted files.

**Alternatives considered**:

- Commit the raw scrape: rejected pending redistribution authorization.
- Fetch QQ Docs at runtime: rejected because it is fragile, depends on undocumented endpoints and would expose the website to external availability changes.

## Decision 3: Build A Category-Level Gold Answer Catalog

**Decision**: Deduplicate answers by `categoryId + slot`, then let each week reference those category records.

**Rationale**: Fashion Check hints recur across weeks. Repeating item arrays in all 426 records would increase inconsistency and make corrections expensive.

**Measured facts**:

- 276 unique Chinese source tag labels.
- 244 labels match current Chinese category CSV exactly.
- 32 labels require explicit alias or corruption repair.
- The public AvantGarde tracker contains 3,540 Item ID rows across 209 official categories.
- All 3,540 tracker Item IDs exist in the current local CN item catalog.
- Seven tracker rows label a choker as `Ring`; official Item slot data correctly identifies them as neck items.

**Alternatives considered**:

- Keep weekly free-text answers only: rejected because consumers cannot localize, validate slots or show icons reliably.
- Parse every week independently: rejected because repeated shorthand would create conflicting results.

## Decision 4: Use Deterministic Resolution With Manual Overrides

**Decision**: Resolution order is exact Item ID/name and slot, normalized alias, deterministic family expansion, then explicit manual override. Fuzzy candidates may be reported but never accepted automatically.

**Rationale**: The QQ source contains expressions such as `歹徒强袭/制敌/游击护臂`, `狮鹫利爪XX戒指`, `各种族初始装备` and `及同模`. These represent sets, not misspelled single item names.

**Measured facts**:

- 5,160 source answer token occurrences.
- 1,634 unique tokens.
- 3,557 occurrences (68.93%) exactly match existing Item names before family expansion.
- 727 unique tokens do not directly match.
- 518 unmatched unique tokens visibly contain group-expression syntax or semantic collection wording.

**Alternatives considered**:

- Levenshtein/fuzzy auto-match: rejected because a plausible wrong item is worse than an unresolved audit entry.
- Copy all current NSGlamour name logic: rejected because this pipeline needs category/slot provenance and reproducible build reports.

## Decision 5: Preserve Every Reviewed Source With An Explicit Role

**Decision**: Store every reviewed source in a source registry, but distinguish canonical data, historical evidence, gold-answer evidence, current-week guides, mechanics references, related tools and validation-only repositories. Official Item and Fashion Check CSV rows decide IDs, names and slots.

**Rationale**: The sources overlap but are not interchangeable. `AvantGarde` is active and its code is AGPL-3.0, but its linked tracker has no explicit standalone data license. QQ provides CN history. AllGameStaff exposes the current guide through WordPress but overwrites the article instead of offering a stable history API. Shapes is a presentation tool with opaque upstream data. Gamer Escape is useful for mechanics and item acquisition but blocks automated access. Kaiyoko is a major weekly community source, not the sole source.

**Source registry**:

| ID | Name | Role | URL |
|----|------|------|-----|
| `ffxiv-datamining-mixed` | InfSein FFXIV datamining mixed | Canonical IDs/locales | `https://github.com/InfSein/ffxiv-datamining-mixed` |
| `qq-cn-history` | FF14时尚品鉴往期统计 | CN history and source expressions | `https://docs.qq.com/sheet/DY2lCeEpwemZESm5q?tab=BB08J2` |
| `avantgarde` | AvantGarde | Gold-answer validation and scoring research | `https://github.com/NeNeppie/AvantGarde` |
| `avantgarde-tracker` | AvantGarde public data tracker | Category-to-Item evidence | `https://docs.google.com/spreadsheets/d/1b9NwL-Ba4tS0ROSy1_4HPfi7QSMQWuhXKqFSSY9Ovp4/edit` |
| `kaiyoko-reddit` | Kaiyoko Star Reddit | Weekly infographic evidence | `https://www.reddit.com/user/KaiyokoStar/` |
| `kaiyoko-x` | Kaiyoko Star X | Weekly infographic evidence | `https://x.com/KaiyokoStar` |
| `allgamestaff-en` | AllGameStaff English guide | Current 80/100, dyes and accepted-item comparison | `https://www.allgamestaff.it/fashion-report-guide-ffxiv-eng/` |
| `allgamestaff-it` | AllGameStaff Italian guide | Current 80/100, dyes and accepted-item comparison | `https://www.allgamestaff.it/guida-fashion-report-ffxiv/` |
| `shapes-fashionreportff` | Shapes Fashion Report AI | Related presentation tool, not canonical evidence | `https://shapes.inc/fashionreportff` |
| `gamerescape-fashion-report` | Gamer Escape Wiki | Mechanics and item acquisition reference | `https://ffxiv.gamerescape.com/wiki/Fashion_Report` |
| `dsa-fashion-check-tool` | FFXIV-Fashion-check-Tool | Validation-only Traditional Chinese dataset | `https://github.com/dsa83171/FFXIV-Fashion-check-Tool` |
| `kevin-fashion-report` | ffxiv-fashion-report | Validation-only historical English dataset | `https://github.com/KevinAllenWiegand/ffxiv-fashion-report` |
| `etsuna-fashion-report` | FFXIVFashionReport | Validation-only MIT tool reference | `https://github.com/Etsuna/FFXIVFashionReport` |

**Current week 441 comparison**:

| Slot/category | QQ | AvantGarde | AllGameStaff | Multi-source union |
|---------------|---:|------------:|-------------:|-------------------:|
| Head / Brain over Brawn | 3 | 5 | 8 | 8 |
| Body / Simple Is Best | 7 | 7 | 7 | 7 |
| Hands / Vagabond | 6 | 13 | 6 | 13 |
| Legs / More Beast than Man | 12 | 12 | 12 | 12 |

No single community source is complete even for the current week. A relationship may therefore cite multiple sources, and conflicting or additional candidates remain visible in audit output.

**Alternatives considered**:

- Vendor external code/data directly: rejected pending explicit compatible terms.
- Ignore community trackers: rejected because the game client CSV does not include historical weekly assignments or gold item lists.
- Label every reviewed site as an answer source: rejected because Shapes and Gamer Escape do not directly support category/item relationships.

## Decision 6: Gold Answers Only In This Slice

**Decision**: The history foundation stores verified/community-reported gold answers only. Lower fit-score tiers and weekly dyes remain out of scope.

**Rationale**: QQ and AvantGarde both focus on gold matches. AvantGarde explicitly states that dyes are tied to each weekly theme and are not stored in its category catalog.

**Known scoring facts retained for later work**:

- Fully equipped base score is 68.
- Each accessory hint raises the base by 2.
- Gold left-side gear contributes 8; gold accessories contribute 6.
- Same color family contributes 1 per dyeable slot; exact dye contributes 2.

**Alternatives considered**:

- Infer lower tiers from item similarity: rejected because no validated scoring evidence supports that inference.
- Mix dye recommendations into category answers: rejected because dyes belong to the weekly theme, not the reusable category.

## Decision 7: Local Completion Before Public Promotion

**Decision**: Generate complete local catalogs and audit reports first. Public static files are a later gate.

**Rationale**: The user requested the history library first, not the page. This keeps source, attribution and data-quality review separate from deployment.

**Alternatives considered**:

- Write directly to `public/data`: rejected because it would publish third-party-derived data before authorization review.
