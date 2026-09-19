import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const GLOBAL_ISSUE_MIN = 16;
export const GLOBAL_ISSUE_MAX = 441;
export const EXPECTED_WEEK_COUNT = GLOBAL_ISSUE_MAX - GLOBAL_ISSUE_MIN + 1;

export const SLOT_IDS = Object.freeze([
  "head",
  "body",
  "hands",
  "legs",
  "feet",
  "ears",
  "neck",
  "wrists",
  "rightRing",
  "leftRing",
]);

export const SOURCE_ROLES = new Set([
  "canonical",
  "history",
  "gold-answers",
  "current-week",
  "dyes",
  "score-plans",
  "mechanics",
  "item-acquisition",
  "related-tool",
  "validation-only",
]);

export const EVIDENCE_CLAIMS = new Set([
  "weekly-assignment",
  "gold-item",
  "dye",
  "score-plan",
  "mechanics",
  "item-metadata",
]);

export const EVIDENCE_METHODS = new Set([
  "official-id",
  "exact",
  "deterministic-expansion",
  "cross-source-union",
  "manual-review",
]);

const FORBIDDEN_GENERATED_KEYS = /^(cookie|cookies|token|tokens|session|session_id|creator|creator_id|user_id|userid|tab_id)$/i;

export function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function sortUniqueNumbers(values) {
  return [...new Set(values.map(Number).filter(Number.isInteger))].sort((left, right) => left - right);
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, stableJson(value), "utf8");
}

export function validateAbsoluteHttpUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute URL`);
  }
  invariant(parsed.protocol === "https:" || parsed.protocol === "http:", `${label} must use HTTP(S)`);
}

export function findForbiddenGeneratedKeys(value, currentPath = "$") {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findings.push(...findForbiddenGeneratedKeys(entry, `${currentPath}[${index}]`)));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const childPath = `${currentPath}.${key}`;
      if (FORBIDDEN_GENERATED_KEYS.test(key)) findings.push(childPath);
      findings.push(...findForbiddenGeneratedKeys(entry, childPath));
    }
  }
  return findings;
}

// 只替换登记表中指定 sourceId 条目的 retrievedAt，保留文件原有排版（单行数组等）。
// `[^}]*?` 保证匹配不越过该条目对象边界。
export async function patchRegistryRetrievedAt(filePath, sourceId, retrievedAt) {
  const text = await readFile(filePath, "utf8");
  const pattern = new RegExp(`("sourceId"\\s*:\\s*"${sourceId}"[^}]*?"retrievedAt"\\s*:\\s*")[^"]*(")`);
  const next = text.replace(pattern, `$1${retrievedAt}$2`);
  invariant(next !== text, `${filePath}: ${sourceId} 的 retrievedAt 未找到`);
  await writeFile(filePath, next, "utf8");
}

export function generatedAtFromSources(sources) {
  const timestamps = sources.map((source) => source.retrievedAt).filter(Boolean).sort();
  invariant(timestamps.length > 0, "At least one source must have retrievedAt");
  return timestamps.at(-1);
}

export function pairKey(categoryId, slotId) {
  return `${categoryId}:${slotId}`;
}
