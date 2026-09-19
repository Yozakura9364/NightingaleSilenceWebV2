import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildAnswerCatalog, applyItemOverrides, collectQqEvidence, collectTrackerEvidence, loadItemCatalog, mergeEvidenceCatalogs } from "./lib/item-resolver.mjs";
import { loadNameTable, normalizeHistory, normalizeIntake, validateEvidence, validateSourceRegistry } from "./lib/source-normalizer.mjs";
import { findForbiddenGeneratedKeys, generatedAtFromSources, pairKey, readJson, writeJson } from "./lib/validation.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const referenceRoot = path.resolve(projectRoot, process.env.FASHION_CHECK_REFERENCE_DIR ?? "local-assets/fashion-check/references");
const outputRoot = path.resolve(projectRoot, process.env.FASHION_CHECK_OUTPUT_DIR ?? "local-assets/fashion-check/generated");

const paths = {
  sourceRegistry: path.join(projectRoot, "data/fashion-check/sources.json"),
  themeAliases: path.join(projectRoot, "data/fashion-check/theme-aliases.json"),
  categoryAliases: path.join(projectRoot, "data/fashion-check/category-aliases.json"),
  itemOverrides: path.join(projectRoot, "data/fashion-check/item-expression-overrides.json"),
  acceptedExceptions: path.join(projectRoot, "data/fashion-check/accepted-source-exceptions.json"),
  weeklyIntake: path.join(projectRoot, "data/fashion-check/weekly-intake.json"),
  qqHistory: path.join(projectRoot, "local-assets/fashion-check/qq-fashion-check-history.json"),
  themesChs: path.join(referenceRoot, "official/chs/FashionCheckWeeklyTheme.csv"),
  themesEn: path.join(referenceRoot, "official/en/FashionCheckWeeklyTheme.csv"),
  categoriesChs: path.join(referenceRoot, "official/chs/FashionCheckThemeCategory.csv"),
  categoriesEn: path.join(referenceRoot, "official/en/FashionCheckThemeCategory.csv"),
  itemsChs: path.join(referenceRoot, "official/chs/Item.csv"),
  itemsEn: path.join(referenceRoot, "official/en/Item.csv"),
  tracker: path.join(referenceRoot, "community/avantgarde-tracker.csv"),
};

function countEvidenceBySource(categories, sources) {
  const counts = new Map(sources.map((source) => [source.sourceId, 0]));
  for (const category of Object.values(categories)) {
    for (const entries of Object.values(category.evidenceByItemId)) {
      for (const evidence of entries) counts.set(evidence.sourceId, (counts.get(evidence.sourceId) ?? 0) + 1);
    }
  }
  return sources.map((source) => ({
    sourceId: source.sourceId,
    roles: source.roles,
    evidenceCount: counts.get(source.sourceId) ?? 0,
    registryOnly: source.usePolicy === "link-only" || source.roles.includes("related-tool") && !source.roles.includes("gold-answers"),
  }));
}

function validateConfigSchemas(config) {
  if (config.themeAliases.schemaVersion !== "fashion-check.theme-aliases.v1") throw new Error("Unsupported theme alias schemaVersion");
  if (config.categoryAliases.schemaVersion !== "fashion-check.category-aliases.v1") throw new Error("Unsupported category alias schemaVersion");
  if (config.itemOverrides.schemaVersion !== "fashion-check.item-expression-overrides.v1") throw new Error("Unsupported item override schemaVersion");
  if (config.acceptedExceptions.schemaVersion !== "fashion-check.accepted-source-exceptions.v1") throw new Error("Unsupported accepted exception schemaVersion");
  if (config.weeklyIntake && config.weeklyIntake.schemaVersion !== "fashion-check.weekly-intake.v1") throw new Error("Unsupported weekly intake schemaVersion");
}

async function main() {
  const [
    sourceDocument,
    themeAliases,
    categoryAliases,
    itemOverrides,
    acceptedExceptions,
    weeklyIntake,
    rawHistory,
    themesChs,
    themesEn,
    categoriesChs,
    categoriesEn,
    itemCatalog,
  ] = await Promise.all([
    readJson(paths.sourceRegistry),
    readJson(paths.themeAliases),
    readJson(paths.categoryAliases),
    readJson(paths.itemOverrides),
    readJson(paths.acceptedExceptions),
    readJson(paths.weeklyIntake).catch(() => null),
    readJson(paths.qqHistory),
    loadNameTable(paths.themesChs),
    loadNameTable(paths.themesEn),
    loadNameTable(paths.categoriesChs),
    loadNameTable(paths.categoriesEn),
    loadItemCatalog(paths.itemsChs, paths.itemsEn),
  ]);

  validateConfigSchemas({ themeAliases, categoryAliases, itemOverrides, acceptedExceptions, weeklyIntake });
  const sources = validateSourceRegistry(sourceDocument);
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  const generatedAt = generatedAtFromSources(sources);
  const retrievedAt = Object.fromEntries(sources.map((source) => [source.sourceId, source.retrievedAt]));

  const normalized = normalizeHistory({
    rawHistory,
    themes: themesChs,
    categories: categoriesChs,
    themeAliases: themeAliases.aliases,
    categoryAliases: categoryAliases.aliases,
  });
  const intake = normalizeIntake({
    records: weeklyIntake?.records ?? [],
    themes: themesChs,
    categories: categoriesChs,
    themeAliases: themeAliases.aliases,
    categoryAliases: categoryAliases.aliases,
  });

  const qq = collectQqEvidence(normalized.weeks, itemCatalog, retrievedAt["qq-cn-history"]);
  const intakeQq = collectQqEvidence(intake.weeks, itemCatalog, retrievedAt["qq-cn-history"]);
  const tracker = await collectTrackerEvidence({
    trackerPath: paths.tracker,
    itemCatalog,
    englishCategories: categoriesEn,
    retrievedAt: retrievedAt["avantgarde-tracker"],
  });
  const evidenceCatalog = mergeEvidenceCatalogs(qq.catalog, intakeQq.catalog, tracker.catalog);
  applyItemOverrides(evidenceCatalog, itemOverrides.overrides, itemCatalog, retrievedAt);

  const answers = buildAnswerCatalog({
    weeks: [...normalized.weeks, ...intake.weeks],
    evidenceCatalog,
    itemCatalog,
    categoriesChs,
    categoriesEn,
  });

  for (const category of Object.values(answers.categories)) {
    for (const entries of Object.values(category.evidenceByItemId)) {
      entries.forEach((evidence) => validateEvidence(evidence, sourceById));
    }
  }

  // intake 复核清单：答案文本中无法由 emitted 物品名直接解释的片段。
  // 非阻断——片段可能已被 tracker/override 证据覆盖，但无法解释时多半需要
  // 新增 namePatterns override（确定性扩展 + 人工确认）。
  const intakeReview = [];
  for (const week of intake.weeks) {
    for (const slot of week.slots) {
      const emittedIds = answers.categories[String(slot.categoryId)]?.goldItemIdsBySlot?.[slot.slotId] ?? [];
      const emittedNames = emittedIds.map((itemId) => answers.items[String(itemId)]?.names?.["zh-CN"]).filter(Boolean);
      const unexplained = String(slot.sourceAnswer ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .filter((segment) => !emittedNames.some((name) => segment.includes(name)));
      if (unexplained.length > 0) {
        intakeReview.push({
          globalIssue: week.globalIssue,
          slotId: slot.slotId,
          categoryId: slot.categoryId,
          sourceTag: slot.sourceTag,
          unexplainedSegments: unexplained,
        });
      }
    }
  }

  const validationErrors = answers.unresolved.map((entry) => `Unresolved gold answers for category ${entry.categoryId}/${entry.slotId}`);
  if (tracker.unresolvedRows.length > 0) validationErrors.push(`${tracker.unresolvedRows.length} tracker rows could not be resolved`);

  const historyDocument = {
    schemaVersion: "fashion-check.history.v1",
    generatedAt,
    sources,
    weeks: normalized.weeks,
  };
  const answerDocument = {
    schemaVersion: "fashion-check.answers.v1",
    generatedAt,
    categories: answers.categories,
  };
  const itemDocument = {
    schemaVersion: "fashion-check.items.v1",
    generatedAt,
    items: answers.items,
  };
  const auditDocument = {
    schemaVersion: "fashion-check.audit.v1",
    generatedAt,
    summary: {
      weeks: normalized.weeks.length,
      intakeWeeks: intake.weeks.length,
      themes: new Set(normalized.weeks.map((week) => week.themeId)).size,
      categories: Object.keys(answers.categories).length,
      requiredCategorySlots: answers.requiredPairCount,
      emittedCategorySlots: answers.emittedPairCount,
      catalogOnlyCategorySlots: answers.emittedPairCount - answers.requiredPairCount,
      items: Object.keys(answers.items).length,
      unresolvedCategorySlots: answers.unresolved.length,
      trackerRows: tracker.rowCount,
      trackerUnresolvedRows: tracker.unresolvedRows.length,
    },
    intakeIssues: intake.weeks.map((week) => week.globalIssue),
    intakeReview,
    sourceAnomalies: normalized.sourceAnomalies,
    acceptedSourceExceptions: acceptedExceptions.exceptions,
    aliasUsage: [...normalized.aliasUsage, ...intake.aliasUsage],
    itemResolution: [...qq.itemResolution, ...intakeQq.itemResolution],
    sourceDisagreements: tracker.disagreements,
    trackerUnresolvedRows: tracker.unresolvedRows,
    unresolvedCategorySlots: answers.unresolved,
    sourceCoverage: countEvidenceBySource(answers.categories, sources),
    validationErrors,
  };

  for (const [name, document] of Object.entries({ history: historyDocument, answers: answerDocument, items: itemDocument, audit: auditDocument })) {
    const forbidden = findForbiddenGeneratedKeys(document);
    if (forbidden.length > 0) throw new Error(`${name}.json contains forbidden fields: ${forbidden.join(", ")}`);
  }

  await Promise.all([
    writeJson(path.join(outputRoot, "history.json"), historyDocument),
    writeJson(path.join(outputRoot, "answers.json"), answerDocument),
    writeJson(path.join(outputRoot, "items.json"), itemDocument),
    writeJson(path.join(outputRoot, "audit.json"), auditDocument),
  ]);

  console.log(`Fashion Check history: ${normalized.weeks.length} weeks (+${intake.weeks.length} intake issues)`);
  console.log(`Gold answer pairs: ${answers.requiredPairCount - answers.unresolved.length}/${answers.requiredPairCount} required, ${answers.emittedPairCount} emitted`);
  console.log(`Referenced items: ${Object.keys(answers.items).length}`);
  console.log(`Audit errors: ${validationErrors.length}`);
}

await main();
