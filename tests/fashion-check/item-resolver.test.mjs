import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { applyItemOverrides, collectQqEvidence } from "../../scripts/fashion-check/lib/item-resolver.mjs";

const fixture = JSON.parse(await readFile(new URL("./fixtures/items/resolution.json", import.meta.url), "utf8"));

function createCatalog() {
  const items = new Map();
  const bySlot = new Map();
  for (const source of fixture.items) {
    const item = {
      ...source,
      names: { "zh-CN": source.name, en: "" },
      iconId: 0,
      dyeCount: 0,
    };
    items.set(item.itemId, item);
    const values = bySlot.get(item.slotId) ?? [];
    values.push(item);
    bySlot.set(item.slotId, values);
  }
  return { items, bySlot };
}

test("QQ exact matching accepts official names and rejects a fuzzy typo", () => {
  const catalog = createCatalog();
  const weeks = [{
    globalIssue: 441,
    sourceRows: [59],
    slots: [
      { categoryId: 1, slotId: "head", sourceAnswer: "黄铜眼镜 秘银眼镜" },
      { categoryId: 2, slotId: "head", sourceAnswer: "黄铜眼境" },
      { categoryId: 3, slotId: "head", sourceAnswer: "黄铜眼镜（及同模）" },
    ],
  }];
  const result = collectQqEvidence(weeks, catalog, "2026-07-14T00:00:00.000Z");

  assert.deepEqual([...result.catalog.get("1:head").items.keys()].sort(), [2668, 2671]);
  assert.equal(result.catalog.has("2:head"), false);
  assert.deepEqual([...result.catalog.get("3:head").items.keys()], [2668]);
});

test("reviewed patterns expand slash/XX families only inside the official slot", () => {
  const catalog = createCatalog();
  const evidence = new Map();
  applyItemOverrides(evidence, [
    {
      categoryId: 27,
      slotId: "body",
      namePatterns: ["^歹徒.+短衣$"],
      sourceId: "qq-cn-history",
      locator: "fixture",
      resolutionMethod: "deterministic-expansion",
    },
    {
      categoryId: 83,
      slotId: "head",
      namePatterns: ["色雏菊头花$"],
      sourceId: "qq-cn-history",
      locator: "fixture",
      resolutionMethod: "deterministic-expansion",
    },
  ], catalog, { "qq-cn-history": "2026-07-14T00:00:00.000Z" });

  assert.deepEqual([...evidence.get("27:body").items.keys()].sort(), [9950, 9956]);
  assert.deepEqual([...evidence.get("83:head").items.keys()], [20261]);
  applyItemOverrides(evidence, [{
    categoryId: 99,
    slotId: "head",
    itemIds: [2668],
    sourceId: "qq-cn-history",
    locator: "manual fixture",
  }], catalog, { "qq-cn-history": "2026-07-14T00:00:00.000Z" });
  assert.equal(evidence.get("99:head").items.get(2668)[0].resolutionMethod, "manual-review");
  assert.throws(() => applyItemOverrides(new Map(), [{
    categoryId: 27,
    slotId: "head",
    namePatterns: ["^歹徒.+短衣$"],
    sourceId: "qq-cn-history",
    locator: "fixture",
  }], catalog, {}), /resolved no items/);
});
