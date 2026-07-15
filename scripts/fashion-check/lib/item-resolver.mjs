import { readObjectCsv, readSaintCoinachCsv } from "./csv.mjs";
import { goldPointsForSlot } from "./scoring.mjs";
import { pairKey, sortUniqueNumbers } from "./validation.mjs";

const EQUIP_SLOT_TO_SLOT_ID = new Map([
  [3, "head"],
  [4, "body"],
  [5, "hands"],
  [7, "legs"],
  [8, "feet"],
  [9, "ears"],
  [10, "neck"],
  [11, "wrists"],
  [12, "ring"],
]);

const TRACKER_SLOT_MAP = new Map([
  ["Head", "head"],
  ["Body", "body"],
  ["Hands", "hands"],
  ["Legs", "legs"],
  ["Feet", "feet"],
  ["Ears", "ears"],
  ["Ear", "ears"],
  ["Neck", "neck"],
  ["Wrist", "wrists"],
  ["Wrists", "wrists"],
  ["Ring", "ring"],
]);

function canonicalSlot(slotId) {
  return slotId === "rightRing" || slotId === "leftRing" ? "ring" : slotId;
}

function normalizeEnglishLabel(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[-\u2010-\u2015]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function loadItemCatalog(chsPath, enPath) {
  const [chsRows, enRows] = await Promise.all([
    readSaintCoinachCsv(chsPath),
    readSaintCoinachCsv(enPath),
  ]);
  const englishNames = new Map(enRows.map((row) => [Number(row["#"]), String(row.Name ?? "").trim()]));
  const items = new Map();
  const bySlot = new Map();

  for (const row of chsRows) {
    const itemId = Number(row["#"]);
    const name = String(row.Name ?? "").trim();
    const equipSlotCategoryId = Number(row.EquipSlotCategory);
    const slotId = EQUIP_SLOT_TO_SLOT_ID.get(equipSlotCategoryId);
    if (!Number.isInteger(itemId) || !name || !slotId) continue;

    const item = {
      itemId,
      names: { "zh-CN": name, en: englishNames.get(itemId) ?? "" },
      iconId: Number(row.Icon) || 0,
      equipSlotCategoryId,
      dyeCount: Number(row.DyeCount) || 0,
      slotId,
    };
    items.set(itemId, item);
    const slotItems = bySlot.get(slotId) ?? [];
    slotItems.push(item);
    bySlot.set(slotId, slotItems);
  }

  for (const slotItems of bySlot.values()) {
    slotItems.sort((left, right) => right.names["zh-CN"].length - left.names["zh-CN"].length || left.itemId - right.itemId);
  }

  return { items, bySlot };
}

function findContainedItems(sourceAnswer, slotId, itemCatalog) {
  const text = String(sourceAnswer ?? "").normalize("NFKC");
  if (!text) return [];
  const candidates = [];

  for (const item of itemCatalog.bySlot.get(canonicalSlot(slotId)) ?? []) {
    const name = item.names["zh-CN"].normalize("NFKC");
    if (name.length < 2) continue;
    let start = text.indexOf(name);
    while (start !== -1) {
      candidates.push({ item, start, end: start + name.length });
      start = text.indexOf(name, start + name.length);
    }
  }

  candidates.sort((left, right) => left.start - right.start || right.end - right.start - (left.end - left.start) || left.item.itemId - right.item.itemId);
  const accepted = [];
  for (const candidate of candidates) {
    if (accepted.some((entry) => candidate.start < entry.end && candidate.end > entry.start)) continue;
    accepted.push(candidate);
  }
  return accepted.map((entry) => entry.item);
}

function addEvidence(catalog, categoryId, slotId, itemId, evidence) {
  const key = pairKey(categoryId, canonicalSlot(slotId));
  const pair = catalog.get(key) ?? { categoryId, slotId: canonicalSlot(slotId), items: new Map() };
  const evidenceList = pair.items.get(itemId) ?? [];
  const signature = JSON.stringify(evidence);
  if (!evidenceList.some((entry) => JSON.stringify(entry) === signature)) evidenceList.push(evidence);
  pair.items.set(itemId, evidenceList);
  catalog.set(key, pair);
}

export function collectQqEvidence(weeks, itemCatalog, retrievedAt) {
  const catalog = new Map();
  const itemResolution = [];

  for (const week of weeks) {
    for (const slot of week.slots) {
      const items = findContainedItems(slot.sourceAnswer, slot.slotId, itemCatalog);
      for (const item of items) {
        addEvidence(catalog, slot.categoryId, slot.slotId, item.itemId, {
          sourceId: "qq-cn-history",
          locator: `Global issue ${week.globalIssue}; source row ${week.sourceRows[0]}; ${slot.slotId}; Item ID ${item.itemId}`,
          claim: "gold-item",
          resolutionMethod: "exact",
          retrievedAt,
        });
      }
      itemResolution.push({
        globalIssue: week.globalIssue,
        categoryId: slot.categoryId,
        slotId: slot.slotId,
        sourceAnswer: slot.sourceAnswer,
        exactItemIds: sortUniqueNumbers(items.map((item) => item.itemId)),
      });
    }
  }

  return { catalog, itemResolution };
}

export async function collectTrackerEvidence({ trackerPath, itemCatalog, englishCategories, retrievedAt }) {
  const rows = await readObjectCsv(trackerPath);
  const categoryByEnglish = new Map();
  for (const [id, name] of englishCategories.byId) {
    if (name) categoryByEnglish.set(normalizeEnglishLabel(name), id);
  }

  const catalog = new Map();
  const disagreements = [];
  const unresolvedRows = [];

  for (const row of rows) {
    const itemId = Number(row.ID);
    const item = itemCatalog.items.get(itemId);
    const sourceCategory = String(row["Category "] ?? row.Category ?? "").trim();
    const categoryId = categoryByEnglish.get(normalizeEnglishLabel(sourceCategory));
    if (!item || !Number.isInteger(categoryId)) {
      unresolvedRows.push({ row: row.__rowNumber, itemId, sourceCategory, reason: !item ? "missing-official-item" : "missing-official-category" });
      continue;
    }

    const trackerSlot = TRACKER_SLOT_MAP.get(String(row["Item Slot"] ?? "").trim());
    if (trackerSlot && trackerSlot !== item.slotId) {
      disagreements.push({
        type: "tracker-slot-vs-official-item",
        row: row.__rowNumber,
        itemId,
        trackerSlot,
        officialSlot: item.slotId,
      });
    }

    addEvidence(catalog, categoryId, item.slotId, itemId, {
      sourceId: "avantgarde-tracker",
      locator: `Tracker row ${row.__rowNumber}; category ${sourceCategory}; Item ID ${itemId}`,
      claim: "gold-item",
      resolutionMethod: "official-id",
      retrievedAt,
    });
  }

  return { catalog, disagreements, unresolvedRows, rowCount: rows.length };
}

export function mergeEvidenceCatalogs(...catalogs) {
  const merged = new Map();
  for (const catalog of catalogs) {
    for (const pair of catalog.values()) {
      for (const [itemId, evidence] of pair.items) {
        for (const entry of evidence) addEvidence(merged, pair.categoryId, pair.slotId, itemId, entry);
      }
    }
  }
  return merged;
}

export function applyItemOverrides(catalog, overrides, itemCatalog, retrievedAtBySource) {
  for (const override of overrides) {
    const itemIds = new Set((override.itemIds ?? []).map(Number));
    for (const pattern of override.namePatterns ?? []) {
      const expression = new RegExp(pattern, "u");
      for (const item of itemCatalog.bySlot.get(canonicalSlot(override.slotId)) ?? []) {
        if (expression.test(item.names["zh-CN"])) itemIds.add(item.itemId);
      }
    }
    if (itemIds.size === 0) throw new Error(`Override ${override.categoryId}/${override.slotId} resolved no items`);

    for (const itemId of itemIds) {
      const item = itemCatalog.items.get(Number(itemId));
      if (!item) throw new Error(`Override references missing Item ID ${itemId}`);
      if (canonicalSlot(override.slotId) !== item.slotId) throw new Error(`Override Item ID ${itemId} has incompatible slot`);
      addEvidence(catalog, override.categoryId, override.slotId, Number(itemId), {
        sourceId: override.sourceId,
        locator: override.locator,
        claim: "gold-item",
        resolutionMethod: override.resolutionMethod ?? "manual-review",
        retrievedAt: retrievedAtBySource[override.sourceId] ?? null,
      });
    }
  }
}

export function buildAnswerCatalog({ weeks, evidenceCatalog, itemCatalog, categoriesChs, categoriesEn }) {
  const requiredPairs = new Map();
  for (const week of weeks) {
    for (const slot of week.slots) {
      requiredPairs.set(pairKey(slot.categoryId, canonicalSlot(slot.slotId)), {
        categoryId: slot.categoryId,
        slotId: canonicalSlot(slot.slotId),
      });
    }
  }

  const categoryRecords = new Map();
  const unresolved = [];
  const referencedItemIds = new Set();

  for (const required of requiredPairs.values()) {
    const pair = evidenceCatalog.get(pairKey(required.categoryId, required.slotId));
    const itemIds = sortUniqueNumbers(pair ? [...pair.items.keys()] : []);
    if (itemIds.length === 0) unresolved.push(required);

    const category = categoryRecords.get(required.categoryId) ?? {
      categoryId: required.categoryId,
      names: {
        "zh-CN": categoriesChs.byId.get(required.categoryId) ?? "",
        en: categoriesEn.byId.get(required.categoryId) ?? "",
      },
      goldItemIdsBySlot: {},
      goldPointsBySlot: {},
      evidenceByItemId: {},
      resolutionStatus: "resolved",
    };
    category.goldItemIdsBySlot[required.slotId] = itemIds;
    category.goldPointsBySlot[required.slotId] = goldPointsForSlot(required.slotId);
    for (const itemId of itemIds) {
      referencedItemIds.add(itemId);
      category.evidenceByItemId[String(itemId)] = pair.items.get(itemId);
    }
    if (itemIds.length === 0) category.resolutionStatus = "unresolved";
    categoryRecords.set(required.categoryId, category);
  }

  const categories = Object.fromEntries([...categoryRecords.entries()].sort(([left], [right]) => left - right));
  const items = {};
  for (const itemId of [...referencedItemIds].sort((left, right) => left - right)) {
    const item = itemCatalog.items.get(itemId);
    items[String(itemId)] = {
      itemId,
      names: item.names,
      iconId: item.iconId,
      equipSlotCategoryId: item.equipSlotCategoryId,
      dyeCount: item.dyeCount,
    };
  }

  return { categories, items, unresolved, requiredPairCount: requiredPairs.size };
}
