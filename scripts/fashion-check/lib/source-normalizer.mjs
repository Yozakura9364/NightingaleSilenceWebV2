import { readSaintCoinachCsv } from "./csv.mjs";
import {
  EVIDENCE_CLAIMS,
  EVIDENCE_METHODS,
  EXPECTED_WEEK_COUNT,
  GLOBAL_ISSUE_MAX,
  GLOBAL_ISSUE_MIN,
  SLOT_IDS,
  SOURCE_ROLES,
  invariant,
  validateAbsoluteHttpUrl,
} from "./validation.mjs";

const SLOT_LABELS = new Map([
  ["头部防具", "head"],
  ["身体防具", "body"],
  ["手部防具", "hands"],
  ["腿部防具", "legs"],
  ["脚部防具", "feet"],
  ["耳坠", "ears"],
  ["项环", "neck"],
  ["手饰", "wrists"],
  ["戒指（右手）", "rightRing"],
  ["戒指（左手）", "leftRing"],
]);

const LICENSE_STATUSES = new Set(["official-game-data", "declared", "unspecified", "not-applicable"]);
const USE_POLICIES = new Set(["canonical", "local-evidence", "cross-check-only", "link-only"]);

export async function loadNameTable(filePath) {
  const rows = await readSaintCoinachCsv(filePath);
  const byId = new Map();
  const byName = new Map();

  for (const row of rows) {
    const id = Number(row["#"]);
    const name = String(row.Name ?? "").trim();
    if (!Number.isInteger(id)) continue;
    byId.set(id, name);
    if (name) {
      const ids = byName.get(name) ?? [];
      ids.push(id);
      byName.set(name, ids);
    }
  }

  return { byId, byName };
}

export function validateSourceRegistry(document) {
  invariant(document?.schemaVersion === "fashion-check.sources.v1", "Unsupported source registry schemaVersion");
  invariant(Array.isArray(document.sources) && document.sources.length > 0, "Source registry must not be empty");
  const ids = new Set();

  for (const source of document.sources) {
    invariant(typeof source.sourceId === "string" && source.sourceId.length > 0, "Source sourceId is required");
    invariant(!ids.has(source.sourceId), `Duplicate sourceId: ${source.sourceId}`);
    ids.add(source.sourceId);
    invariant(typeof source.name === "string" && source.name.length > 0, `${source.sourceId}: name is required`);
    validateAbsoluteHttpUrl(source.url, `${source.sourceId}.url`);
    invariant(Array.isArray(source.roles) && source.roles.length > 0, `${source.sourceId}: roles are required`);
    source.roles.forEach((role) => invariant(SOURCE_ROLES.has(role), `${source.sourceId}: invalid role ${role}`));
    invariant(LICENSE_STATUSES.has(source.licenseStatus), `${source.sourceId}: invalid licenseStatus`);
    invariant(USE_POLICIES.has(source.usePolicy), `${source.sourceId}: invalid usePolicy`);
    invariant(typeof source.notes === "string" && source.notes.length > 0, `${source.sourceId}: notes are required`);
  }

  invariant(ids.has("ffxiv-datamining-mixed"), "Canonical datamining source is missing");
  invariant(ids.has("qq-cn-history"), "QQ history source is missing");
  return document.sources;
}

export function validateEvidence(evidence, sourceById) {
  invariant(sourceById.has(evidence.sourceId), `Unknown evidence source: ${evidence.sourceId}`);
  invariant(typeof evidence.locator === "string" && evidence.locator.length > 0, "Evidence locator is required");
  invariant(EVIDENCE_CLAIMS.has(evidence.claim), `Invalid evidence claim: ${evidence.claim}`);
  invariant(EVIDENCE_METHODS.has(evidence.resolutionMethod), `Invalid evidence method: ${evidence.resolutionMethod}`);
  const source = sourceById.get(evidence.sourceId);
  invariant(!source.roles.includes("related-tool") || source.roles.some((role) => ["gold-answers", "history", "dyes", "mechanics", "item-metadata"].includes(role)), `${source.sourceId} is registry-only and cannot support evidence`);
  invariant(source.usePolicy !== "link-only", `${source.sourceId} is link-only and cannot support evidence`);
}

function findAlias(aliases, sourceLabel, globalIssue, slotId) {
  const matches = aliases.filter((alias) => alias.sourceLabel === sourceLabel
    && (alias.globalIssue === undefined || alias.globalIssue === globalIssue)
    && (alias.slotId === undefined || alias.slotId === slotId));
  invariant(matches.length <= 1, `Ambiguous alias for ${sourceLabel || "<empty>"} at issue ${globalIssue}/${slotId}`);
  return matches[0] ?? null;
}

function expectedThemeId(globalIssue) {
  return globalIssue <= 19 ? globalIssue - 6 : globalIssue + 9;
}

export function normalizeHistory({
  rawHistory,
  themes,
  categories,
  themeAliases,
  categoryAliases,
  issueMin = GLOBAL_ISSUE_MIN,
  issueMax = GLOBAL_ISSUE_MAX,
}) {
  invariant(Array.isArray(rawHistory?.records), "QQ history records are missing");
  const expectedWeekCount = issueMax - issueMin + 1;
  invariant(rawHistory.records.length === expectedWeekCount, `Expected ${expectedWeekCount} history records`);
  const aliasUsage = [];
  const sourceAnomalies = [];

  const weeks = rawHistory.records.map((record) => {
    const globalIssue = Number(record.global_issue);
    const cnIssue = Number(record.cn_issue);
    invariant(Number.isInteger(globalIssue), "global_issue must be an integer");
    invariant(cnIssue === globalIssue - 15, `Issue ${globalIssue}: invalid CN issue`);

    const themeId = expectedThemeId(globalIssue);
    const officialTheme = themes.byId.get(themeId);
    invariant(officialTheme !== undefined, `Issue ${globalIssue}: official theme ID ${themeId} is missing`);
    if (officialTheme !== record.theme) {
      const alias = findAlias(themeAliases, record.theme, globalIssue, null);
      invariant(alias?.targetId === themeId, `Issue ${globalIssue}: unresolved theme alias ${record.theme}`);
      aliasUsage.push({ type: "theme", globalIssue, sourceLabel: record.theme, targetId: themeId, reason: alias.reason });
    }

    const anomalies = [];
    if (Number(record.tag_count) !== 4) anomalies.push(`irregular-tag-count:${record.tag_count}`);
    if (record.slots.length !== 4) anomalies.push(`irregular-slot-count:${record.slots.length}`);
    if (record.missing_answer_count > 0) anomalies.push(`missing-source-answer:${record.missing_answer_count}`);

    const slots = record.slots.map((slot) => {
      const sourceSlotId = SLOT_LABELS.get(slot.slot);
      invariant(SLOT_IDS.includes(sourceSlotId), `Issue ${globalIssue}: unsupported slot ${slot.slot}`);
      const contextualAlias = findAlias(categoryAliases, slot.tag, globalIssue, sourceSlotId);
      const slotId = contextualAlias?.targetSlotId ?? sourceSlotId;
      const directIds = categories.byName.get(slot.tag) ?? [];
      let categoryId;

      if (contextualAlias) {
        categoryId = contextualAlias.targetId;
        invariant(categories.byId.has(categoryId), `Issue ${globalIssue}/${slotId}: category ID ${categoryId} is missing`);
        aliasUsage.push({ type: "category", globalIssue, slotId, sourceLabel: slot.tag, targetId: categoryId, reason: contextualAlias.reason });
        if (contextualAlias.targetSlotId) anomalies.push(`source-slot-correction:${sourceSlotId}->${slotId}`);
        if (contextualAlias.reason === "source-column-shift") anomalies.push(`source-column-shift:${slotId}`);
      } else if (directIds.length === 1) {
        [categoryId] = directIds;
      } else {
        const alias = findAlias(categoryAliases, slot.tag, globalIssue, sourceSlotId);
        invariant(alias, `Issue ${globalIssue}/${slotId}: unresolved category alias ${slot.tag || "<empty>"}`);
        categoryId = alias.targetId;
        invariant(categories.byId.has(categoryId), `Issue ${globalIssue}/${slotId}: category ID ${categoryId} is missing`);
        aliasUsage.push({ type: "category", globalIssue, slotId, sourceLabel: slot.tag, targetId: categoryId, reason: alias.reason });
        if (alias.reason === "source-column-shift") anomalies.push(`source-column-shift:${slotId}`);
      }

      return {
        slotId,
        categoryId,
        sourceTag: slot.tag,
        sourceAnswer: slot.items_text,
      };
    });

    const week = {
      globalIssue,
      cnIssue,
      startDate: record.start_date,
      themeId,
      sourceTheme: record.theme,
      sourceRows: record.source_rows.map(Number),
      slots,
      anomalies: [...new Set(anomalies)],
    };

    if (week.anomalies.length > 0) {
      sourceAnomalies.push({ globalIssue, anomalies: week.anomalies });
    }
    return week;
  }).sort((left, right) => left.globalIssue - right.globalIssue);

  weeks.forEach((week, index) => invariant(week.globalIssue === issueMin + index, `History gap at index ${index}`));
  invariant(weeks.at(-1).globalIssue === issueMax, "History does not reach the expected latest issue");

  return { weeks, aliasUsage, sourceAnomalies };
}
