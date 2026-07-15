import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { checkGeneratedData } from "../../scripts/fashion-check/check-history.mjs";
import { parseCsv } from "../../scripts/fashion-check/lib/csv.mjs";
import { normalizeHistory, validateEvidence, validateSourceRegistry } from "../../scripts/fashion-check/lib/source-normalizer.mjs";

const projectUrl = new URL("../../", import.meta.url);

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, projectUrl), "utf8"));
}

function nameTable(entries) {
  const byId = new Map(entries);
  const byName = new Map();
  for (const [id, name] of entries) {
    const ids = byName.get(name) ?? [];
    ids.push(id);
    byName.set(name, ids);
  }
  return { byId, byName };
}

function clone(value) {
  return structuredClone(value);
}

test("CSV parser handles BOM, escaped quotes, commas, and multiline fields", () => {
  assert.deepEqual(parseCsv('\uFEFF"a","b"\r\n"x,1","line 1\nline ""2"""\r\n'), [
    ["a", "b"],
    ["x,1", 'line 1\nline "2"'],
  ]);
});

test("source registry contains every reviewed source and blocks link-only evidence", async () => {
  const document = await readJson("data/fashion-check/sources.json");
  const sources = validateSourceRegistry(document);
  assert.equal(sources.length, 13);
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  assert.throws(() => validateEvidence({
    sourceId: "shapes-fashionreportff",
    locator: "fixture",
    claim: "gold-item",
    resolutionMethod: "manual-review",
    retrievedAt: null,
  }, sourceById), /registry-only|link-only/);
});

test("history fixture preserves 3/5-tag and missing-answer anomalies and applies aliases", async () => {
  const rawHistory = await readJson("tests/fashion-check/fixtures/history/anomalies.json");
  const result = normalizeHistory({
    rawHistory,
    themes: nameTable([[10, "theme-10"], [11, "theme-11"], [12, "theme-12"], [13, "theme-13"]]),
    categories: nameTable([[1, "head-tag"], [2, "body-tag"], [3, "hands-tag"], [4, "legs-tag"], [5, "feet-tag"]]),
    themeAliases: [{ sourceLabel: "old-theme-12", targetId: 12, reason: "old-translation" }],
    categoryAliases: [{ sourceLabel: "old-head-tag", targetId: 1, reason: "old-translation" }],
    issueMin: 16,
    issueMax: 19,
  });

  assert.deepEqual(result.weeks.map((week) => week.globalIssue), [16, 17, 18, 19]);
  assert.equal(result.sourceAnomalies.filter((entry) => entry.anomalies.some((value) => value.startsWith("irregular-tag-count:"))).length, 2);
  assert.equal(result.sourceAnomalies.filter((entry) => entry.anomalies.some((value) => value.startsWith("missing-source-answer:"))).length, 1);
  assert.equal(result.aliasUsage.filter((entry) => entry.type === "theme").length, 1);
  assert.equal(result.aliasUsage.filter((entry) => entry.type === "category").length, 1);
});

test("real generated catalog passes and checker rejects contract mutations", async () => {
  const [history, answers, items, audit] = await Promise.all([
    readJson("local-assets/fashion-check/generated/history.json"),
    readJson("local-assets/fashion-check/generated/answers.json"),
    readJson("local-assets/fashion-check/generated/items.json"),
    readJson("local-assets/fashion-check/generated/audit.json"),
  ]);
  const slotByEquipCategory = new Map([[3, "head"], [4, "body"], [5, "hands"], [7, "legs"], [8, "feet"], [9, "ears"], [10, "neck"], [11, "wrists"], [12, "ring"]]);
  const official = {
    themes: new Map(history.weeks.map((week) => [week.themeId, true])),
    categories: new Map(Object.values(answers.categories).map((category) => [category.categoryId, true])),
    items: new Map(Object.values(items.items).map((item) => [item.itemId, { ...item, slotId: slotByEquipCategory.get(item.equipSlotCategoryId) }])),
  };

  assert.equal(checkGeneratedData({ history, answers, items, audit, official }).weeks, 426);

  const missingWeek = clone(history);
  missingWeek.weeks.pop();
  assert.throws(() => checkGeneratedData({ history: missingWeek, answers, items, audit, official }), /Expected 426 weeks/);

  const noEvidence = clone(answers);
  const firstCategory = Object.values(noEvidence.categories)[0];
  const firstItemId = Object.values(firstCategory.goldItemIdsBySlot)[0][0];
  firstCategory.evidenceByItemId[String(firstItemId)] = [];
  assert.throws(() => checkGeneratedData({ history, answers: noEvidence, items, audit, official }), /has no evidence/);

  const invalidGoldScore = clone(answers);
  const scoreCategory = Object.values(invalidGoldScore.categories)[0];
  const scoreSlotId = Object.keys(scoreCategory.goldItemIdsBySlot)[0];
  scoreCategory.goldPointsBySlot[scoreSlotId] = 0;
  assert.throws(() => checkGeneratedData({ history, answers: invalidGoldScore, items, audit, official }), /invalid gold score/);

  const unknownSource = clone(answers);
  const sourceCategory = Object.values(unknownSource.categories)[0];
  const sourceItemId = Object.values(sourceCategory.goldItemIdsBySlot)[0][0];
  sourceCategory.evidenceByItemId[String(sourceItemId)][0].sourceId = "missing-source";
  assert.throws(() => checkGeneratedData({ history, answers: unknownSource, items, audit, official }), /Unknown evidence source/);

  const forbidden = clone(audit);
  forbidden.token = "fixture";
  assert.throws(() => checkGeneratedData({ history, answers, items, audit: forbidden, official }), /forbidden fields/);

  const wrongSlot = clone(official);
  wrongSlot.items = new Map(official.items);
  const referencedItem = Object.values(items.items)[0];
  wrongSlot.items.set(referencedItem.itemId, { ...wrongSlot.items.get(referencedItem.itemId), slotId: "body" });
  assert.throws(() => checkGeneratedData({ history, answers, items, audit, official: wrongSlot }), /incompatible/);
});
