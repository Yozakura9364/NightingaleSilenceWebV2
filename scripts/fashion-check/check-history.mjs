import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

import { loadItemCatalog } from "./lib/item-resolver.mjs";
import { goldPointsForSlot } from "./lib/scoring.mjs";
import { loadNameTable, validateEvidence, validateSourceRegistry } from "./lib/source-normalizer.mjs";
import { EXPECTED_WEEK_COUNT, GLOBAL_ISSUE_MIN, SLOT_IDS, findForbiddenGeneratedKeys, invariant, readJson } from "./lib/validation.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");

function officialSlot(item) {
  return item.slotId === "ring" ? new Set(["rightRing", "leftRing", "ring"]) : new Set([item.slotId]);
}

export function checkGeneratedData({ history, answers, items, audit, official }) {
  invariant(history.schemaVersion === "fashion-check.history.v1", "Unsupported history schemaVersion");
  invariant(answers.schemaVersion === "fashion-check.answers.v1", "Unsupported answers schemaVersion");
  invariant(items.schemaVersion === "fashion-check.items.v1", "Unsupported items schemaVersion");
  invariant(audit.schemaVersion === "fashion-check.audit.v1", "Unsupported audit schemaVersion");
  invariant(history.generatedAt === answers.generatedAt && history.generatedAt === items.generatedAt && history.generatedAt === audit.generatedAt, "Generated timestamps differ");

  const sources = validateSourceRegistry({ schemaVersion: "fashion-check.sources.v1", sources: history.sources });
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  invariant(history.weeks.length === EXPECTED_WEEK_COUNT, `Expected ${EXPECTED_WEEK_COUNT} weeks`);

  const usedPairs = new Set();
  history.weeks.forEach((week, index) => {
    invariant(week.globalIssue === GLOBAL_ISSUE_MIN + index, `History issue gap at ${week.globalIssue}`);
    invariant(week.cnIssue === week.globalIssue - 15, `Invalid CN issue at ${week.globalIssue}`);
    invariant(official.themes.has(week.themeId), `Unknown theme ID ${week.themeId}`);
    invariant(Array.isArray(week.slots) && week.slots.length >= 3 && week.slots.length <= 5, `Invalid slot count at ${week.globalIssue}`);
    for (const slot of week.slots) {
      invariant(SLOT_IDS.includes(slot.slotId), `Unknown slot ID ${slot.slotId}`);
      invariant(official.categories.has(slot.categoryId), `Unknown category ID ${slot.categoryId}`);
      const canonical = slot.slotId === "rightRing" || slot.slotId === "leftRing" ? "ring" : slot.slotId;
      usedPairs.add(`${slot.categoryId}:${canonical}`);
    }
  });

  const emittedPairs = new Set();
  for (const [categoryKey, category] of Object.entries(answers.categories)) {
    invariant(Number(categoryKey) === category.categoryId, `Category key mismatch: ${categoryKey}`);
    invariant(official.categories.has(category.categoryId), `Unknown answer category ID ${category.categoryId}`);
    invariant(category.resolutionStatus !== "unresolved", `Category ${category.categoryId} is unresolved`);

    for (const [slotId, itemIds] of Object.entries(category.goldItemIdsBySlot)) {
      emittedPairs.add(`${category.categoryId}:${slotId}`);
      invariant(Array.isArray(itemIds) && itemIds.length > 0, `Category ${category.categoryId}/${slotId} has no items`);
      invariant(category.goldPointsBySlot?.[slotId] === goldPointsForSlot(slotId), `Category ${category.categoryId}/${slotId} has an invalid gold score`);
      invariant(JSON.stringify(itemIds) === JSON.stringify([...new Set(itemIds)].sort((left, right) => left - right)), `Category ${category.categoryId}/${slotId} item IDs are not unique and sorted`);

      for (const itemId of itemIds) {
        const compact = items.items[String(itemId)];
        const sourceItem = official.items.get(itemId);
        invariant(compact, `Missing compact Item ${itemId}`);
        invariant(sourceItem, `Unknown official Item ${itemId}`);
        invariant(officialSlot(sourceItem).has(slotId), `Item ${itemId} is incompatible with ${slotId}`);
        invariant(compact.equipSlotCategoryId === sourceItem.equipSlotCategoryId, `Item ${itemId} slot metadata differs from official data`);
        const evidence = category.evidenceByItemId?.[String(itemId)];
        invariant(Array.isArray(evidence) && evidence.length > 0, `Item ${itemId} has no evidence`);
        evidence.forEach((entry) => validateEvidence(entry, sourceById));
      }
    }
  }

  for (const pair of usedPairs) invariant(emittedPairs.has(pair), `Missing answer pair ${pair}`);
  invariant(audit.summary.unresolvedCategorySlots === 0, "Audit reports unresolved category slots");
  invariant(audit.summary.trackerUnresolvedRows === 0, "Audit reports unresolved tracker rows");
  invariant(Array.isArray(audit.validationErrors) && audit.validationErrors.length === 0, "Audit validationErrors is not empty");
  invariant(audit.sourceAnomalies.filter((entry) => entry.anomalies.some((value) => value.startsWith("irregular-tag-count:"))).length === 7, "Expected seven irregular-tag-count weeks");
  invariant(audit.sourceAnomalies.filter((entry) => entry.anomalies.some((value) => value.startsWith("missing-source-answer:"))).length === 2, "Expected two missing-answer weeks");

  for (const document of [history, answers, items, audit]) {
    const forbidden = findForbiddenGeneratedKeys(document);
    invariant(forbidden.length === 0, `Generated document contains forbidden fields: ${forbidden.join(", ")}`);
  }

  return {
    weeks: history.weeks.length,
    categories: Object.keys(answers.categories).length,
    items: Object.keys(items.items).length,
    sourceCount: sources.length,
  };
}

async function main() {
  const referenceRoot = path.resolve(projectRoot, process.env.FASHION_CHECK_REFERENCE_DIR ?? "local-assets/fashion-check/references");
  const outputRoot = path.resolve(projectRoot, process.env.FASHION_CHECK_OUTPUT_DIR ?? "local-assets/fashion-check/generated");
  const [history, answers, items, audit, themes, categories, itemCatalog] = await Promise.all([
    readJson(path.join(outputRoot, "history.json")),
    readJson(path.join(outputRoot, "answers.json")),
    readJson(path.join(outputRoot, "items.json")),
    readJson(path.join(outputRoot, "audit.json")),
    loadNameTable(path.join(referenceRoot, "official/chs/FashionCheckWeeklyTheme.csv")),
    loadNameTable(path.join(referenceRoot, "official/chs/FashionCheckThemeCategory.csv")),
    loadItemCatalog(path.join(referenceRoot, "official/chs/Item.csv"), path.join(referenceRoot, "official/en/Item.csv")),
  ]);

  const summary = checkGeneratedData({
    history,
    answers,
    items,
    audit,
    official: { themes: themes.byId, categories: categories.byId, items: itemCatalog.items },
  });
  console.log(`Fashion Check history check passed: ${summary.weeks} weeks, ${summary.categories} categories, ${summary.items} items, ${summary.sourceCount} sources`);
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
