# Static Data Contract: 时尚品鉴历史答案库

## Scope

This contract defines the generated local files and the separately authorized compact public tag index consumed by Fashion Check UI work. Local evidence files remain outside the public redistribution boundary and this contract does not define page layout.

## Files

### `generated/history.json`

```json
{
  "schemaVersion": "fashion-check.history.v1",
  "generatedAt": "2026-07-13T00:00:00.000Z",
  "sources": [
    {
      "sourceId": "ffxiv-datamining-mixed",
      "name": "InfSein FFXIV datamining mixed",
      "url": "https://github.com/InfSein/ffxiv-datamining-mixed",
      "roles": ["canonical"],
      "retrievedAt": "2026-07-14T00:00:00.000Z",
      "licenseStatus": "unspecified",
      "license": null,
      "usePolicy": "canonical",
      "notes": "Official client-data extraction used for stable row IDs and localized labels."
    }
  ],
  "weeks": [
    {
      "globalIssue": 441,
      "cnIssue": 426,
      "startDate": "2026-07-07",
      "themeId": 0,
      "sourceTheme": "占位用，待编辑",
      "sourceRows": [59, 60],
      "slots": [
        {
          "slotId": "head",
          "categoryId": 0,
          "sourceTag": "占位用，待编辑",
          "sourceAnswer": "占位用，待编辑"
        }
      ],
      "anomalies": []
    }
  ]
}
```

### `generated/answers.json`

```json
{
  "schemaVersion": "fashion-check.answers.v1",
  "generatedAt": "2026-07-13T00:00:00.000Z",
  "categories": {
    "1": {
      "categoryId": 1,
      "names": {
        "zh-CN": "占位用，待编辑",
        "en": "Placeholder"
      },
      "goldItemIdsBySlot": {
        "head": [2668]
      },
      "goldPointsBySlot": {
        "head": 8
      },
      "evidenceByItemId": {
        "2668": [
          {
            "sourceId": "avantgarde-tracker",
            "locator": "Category: Brain over Brawn; Item ID: 2668",
            "claim": "gold-item",
            "resolutionMethod": "official-id",
            "retrievedAt": "2026-07-14T00:00:00.000Z"
          }
        ]
      },
      "resolutionStatus": "resolved"
    }
  }
}
```

### `generated/items.json`

```json
{
  "schemaVersion": "fashion-check.items.v1",
  "generatedAt": "2026-07-13T00:00:00.000Z",
  "items": {
    "2668": {
      "itemId": 2668,
      "names": {
        "zh-CN": "黄铜眼镜",
        "en": "Brass Spectacles"
      },
      "iconId": 40879,
      "equipSlotCategoryId": 3,
      "dyeCount": 1
    }
  }
}
```

### `generated/audit.json`

Local-only diagnostic output. It may contain raw source expressions but must not contain cookies, request tokens, QQ user/session fields or browser state.

### `public/data/fashion-check/tag-database.json`

```json
{
  "schemaVersion": "fashion-check.tag-database.v1",
  "generatedAt": "2026-07-14T00:00:00.000Z",
  "summary": {
    "categories": 250,
    "categorySlotPairs": 440,
    "items": 3393
  },
  "categories": [
    {
      "categoryId": 4,
      "names": {
        "zh-CN": "野兽",
        "en": "Animal Instincts",
        "ja": "ケモノ",
        "ko": "동물"
      },
      "slots": [
        { "slotId": "head", "goldPoints": 8, "itemIds": [7360] }
      ]
    }
  ],
  "items": {
    "7360": {
      "itemId": 7360,
      "names": {
        "zh-CN": "狮鬃战盔",
        "en": "Wolfram Helm",
        "ja": "ウォルフラムヘルム",
        "ko": "볼프람 투구"
      },
      "iconId": 41040,
      "rarity": 2
    }
  }
}
```

The public index is generated from reviewed category/slot answers and official locale CSVs. It must not contain evidence, locators, source IDs, source expressions, anomalies or local paths. Item locale names may omit a locale only when that regional client has an empty official Item row; the UI then uses the shared English/Chinese fallback order.

## Invariants

1. `history.json` contains exactly global issues 16 through 441 with no duplicate or missing issue.
2. `cnIssue` always equals `globalIssue - 15`.
3. Every `themeId` exists in the official weekly-theme sheet.
4. Every `categoryId` exists in the official category sheet.
5. Every category/slot pair used by history resolves to at least one gold Item ID for a complete build.
6. Every Item ID exists in the selected CN Item source.
7. Item slot compatibility is determined from official Item data, not community labels.
8. Arrays of IDs are unique and numerically sorted.
9. Intermediate unresolved records appear only in `audit.json`; complete history/answer outputs must not silently omit them.
10. Historical 3/5-slot source records remain intact and carry anomaly metadata.
11. Every evidence `sourceId` exists in the source registry.
12. Every source has a public URL, role, license status and use policy.
13. Registry-only related tools are not presented as supporting evidence.
14. Every Item ID in `goldItemIdsBySlot` has a non-empty matching `evidenceByItemId` entry.
15. Every `goldPointsBySlot` value is derived from the canonical slot: armor slots are 8 points and accessories are 6 points; the historical catalog does not infer silver grades.
16. Every public tag has non-empty `zh-CN`, `en`, `ja` and `ko` names.
17. Every public item reference resolves to one compact item entry with a valid icon, rarity and compatible equipment slot.
18. Public tag data excludes all evidence and source-location fields.

## Compatibility

- Consumers must reject unsupported `schemaVersion` values.
- Adding optional fields is backward-compatible within v1.
- Renaming required fields, changing ID meaning or changing slot enum values requires a new schema major version.
