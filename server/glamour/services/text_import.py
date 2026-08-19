"""装备文字导入解析、EC/石之家结果构建与染剂解析。"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple

try:
    from .adapters.ec_scraper import (
        EC_SLOT_ORDER,
        clean_ec_dye_name,
        extract_ec_author,
        extract_ec_character,
        extract_ec_title,
        is_empty_ec_dye_name,
        parse_ec_equipment,
    )
    from .resolve_chara import (
        DEFAULT_DYE_LABELS,
        DEFAULT_LOCALE,
        DEFAULT_SLOT_NAMES,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
        build_no_dye_labels,
        decorate_candidates,
        get_locales,
        get_slot_names,
    )
    from .services.mapping import (
        get_equip_slot_category,
        get_equipinfo_name_index,
        item_matches_equipment_slot,
    )
    from .services.text_utils import (
        compact_text_input_lookup,
        normalize_lookup_text,
        normalize_space,
        normalize_text_input_lookup,
    )
except ImportError:
    from adapters.ec_scraper import (
        EC_SLOT_ORDER,
        clean_ec_dye_name,
        extract_ec_author,
        extract_ec_character,
        extract_ec_title,
        is_empty_ec_dye_name,
        parse_ec_equipment,
    )
    from resolve_chara import (
        DEFAULT_DYE_LABELS,
        DEFAULT_LOCALE,
        DEFAULT_SLOT_NAMES,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
        build_no_dye_labels,
        decorate_candidates,
        get_locales,
        get_slot_names,
    )
    from services.mapping import (
        get_equip_slot_category,
        get_equipinfo_name_index,
        item_matches_equipment_slot,
    )
    from services.text_utils import (
        compact_text_input_lookup,
        normalize_lookup_text,
        normalize_space,
        normalize_text_input_lookup,
    )

TEXT_INPUT_NO_DYE_SLOTS = {"Ears", "Neck", "Wrists", "LeftRing", "RightRing", "Glasses", "FashionAccessory"}
TEXT_INPUT_SLOT_ALIASES = {
    "主手": "MainHand",
    "武器": "MainHand",
    "weapon": "MainHand",
    "main hand": "MainHand",
    "mainhand": "MainHand",
    "副手": "OffHand",
    "盾": "OffHand",
    "盾牌": "OffHand",
    "off hand": "OffHand",
    "offhand": "OffHand",
    "shield": "OffHand",
    "头部": "HeadGear",
    "头": "HeadGear",
    "头部防具": "HeadGear",
    "帽子": "HeadGear",
    "head": "HeadGear",
    "headgear": "HeadGear",
    "hat": "HeadGear",
    "身体": "Body",
    "身体防具": "Body",
    "上衣": "Body",
    "body": "Body",
    "chest": "Body",
    "top": "Body",
    "手臂": "Hands",
    "手部": "Hands",
    "手部防具": "Hands",
    "手套": "Hands",
    "hands": "Hands",
    "gloves": "Hands",
    "腿部": "Legs",
    "腿部防具": "Legs",
    "裤子": "Legs",
    "legs": "Legs",
    "pants": "Legs",
    "trousers": "Legs",
    "脚部": "Feet",
    "脚部防具": "Feet",
    "鞋": "Feet",
    "鞋子": "Feet",
    "feet": "Feet",
    "boots": "Feet",
    "shoes": "Feet",
    "耳部": "Ears",
    "耳饰": "Ears",
    "耳坠": "Ears",
    "ears": "Ears",
    "earrings": "Ears",
    "项链": "Neck",
    "颈部": "Neck",
    "neck": "Neck",
    "necklace": "Neck",
    "腕部": "Wrists",
    "手镯": "Wrists",
    "手腕": "Wrists",
    "wrists": "Wrists",
    "bracelets": "Wrists",
    "左指": "LeftRing",
    "左戒指": "LeftRing",
    "左手戒指": "LeftRing",
    "left ring": "LeftRing",
    "ring 1": "LeftRing",
    "右指": "RightRing",
    "右戒指": "RightRing",
    "右手戒指": "RightRing",
    "right ring": "RightRing",
    "ring 2": "RightRing",
    "戒指": "LeftRing",
    "ring": "LeftRing",
    "面部配饰": "Glasses",
    "脸部配饰": "Glasses",
    "眼镜": "Glasses",
    "facewear": "Glasses",
    "face wear": "Glasses",
    "glasses": "Glasses",
    "时尚配饰": "FashionAccessory",
    "时尚饰品": "FashionAccessory",
    "fashion accessory": "FashionAccessory",
    "fashion accessories": "FashionAccessory",
}


def find_item_record_by_name(mapping: Dict[str, Any], item_name: str, slot_name: str) -> Optional[Dict[str, Any]]:
    normalized_name = normalize_lookup_text(item_name)
    fallback_matches = []

    for item in mapping.get("items", []):
        if slot_name and not item_matches_equipment_slot(item, slot_name):
            continue
        names = item.get("names") or {}
        all_names = [item.get("name", ""), *names.values()]
        normalized_names = {normalize_lookup_text(name) for name in all_names if name}
        if normalized_name in normalized_names:
            return dict(item)
        if any(normalized_name and normalized_name == name.replace("-", " ") for name in normalized_names):
            fallback_matches.append(item)

    return dict(fallback_matches[0]) if fallback_matches else None


def normalize_text_input_slot(value: str, mapping: Dict[str, Any], locale: str) -> str:
    text = normalize_space(str(value or ""))
    if not text:
        return ""
    normalized = normalize_text_input_lookup(text)
    compact = compact_text_input_lookup(text)
    for alias, slot in TEXT_INPUT_SLOT_ALIASES.items():
        if normalized == normalize_text_input_lookup(alias) or compact == compact_text_input_lookup(alias):
            return slot
    for slot, names in (mapping.get("slot_names") or DEFAULT_SLOT_NAMES).items():
        candidates = [slot, RESOLVER_SLOT_LABELS.get(slot, "")]
        if isinstance(names, dict):
            candidates.extend([names.get(locale, ""), *names.values()])
        for candidate in candidates:
            if not candidate:
                continue
            if normalized == normalize_text_input_lookup(candidate) or compact == compact_text_input_lookup(candidate):
                return slot
    return ""


def get_equipinfo_record_slot(record: Dict[str, Any]) -> str:
    explicit = str(record.get("_equipinfo_slot") or "")
    if explicit:
        return explicit
    slot_label = record.get("slot_label", "")
    if slot_label == RESOLVER_SLOT_LABELS.get("OffHand", "") and get_equip_slot_category(record) == 2:
        return "OffHand"
    for slot, label in RESOLVER_SLOT_LABELS.items():
        if label == slot_label and item_matches_equipment_slot(record, slot):
            return slot
    return ""


def find_equipinfo_record_by_text(
    mapping: Dict[str, Any],
    item_text: str,
    locale: str,
    slot_name: str = "",
) -> Optional[Dict[str, Any]]:
    normalized = compact_text_input_lookup(item_text)
    if not normalized:
        return None
    index = get_equipinfo_name_index(mapping)
    locale_index = (index.get("by_locale") or {}).get(locale) or {}
    fallback_index = (index.get("by_locale") or {}).get(DEFAULT_LOCALE) or {}
    matches = list(locale_index.get(normalized) or [])
    if locale != DEFAULT_LOCALE:
        matches.extend(fallback_index.get(normalized) or [])
    if not matches:
        for locale_index in (index.get("by_locale") or {}).values():
            matches.extend(locale_index.get(normalized) or [])
            if matches:
                break
    if slot_name:
        matches = [record for record in matches if item_matches_equipment_slot(record, slot_name)]
    if not matches:
        return None
    return dict(matches[0])


def split_text_input_dyes(value: str) -> List[str]:
    raw = normalize_space(str(value or ""))
    raw = re.sub(r"^(?:染色|染剂|染料|dyes?|colou?rs?)\s*[:：]\s*", "", raw, flags=re.IGNORECASE).strip()
    if is_empty_ec_dye_name(raw):
        return []
    parts = [
        clean_ec_dye_name(part)
        for part in re.split(r"\s*(?:[/／|｜、,，;+＋&＆])\s*", raw)
        if part and part.strip()
    ]
    parts = [part for part in parts if part]
    meaningful_parts = [part for part in parts if not is_empty_ec_dye_name(part)]
    if not meaningful_parts:
        return []
    return (parts if len(parts) > 1 else meaningful_parts)[:2]


def parse_text_input_item_and_dyes(value: str) -> Tuple[str, List[str]]:
    text = normalize_space(str(value or ""))
    if not text:
        return "", []

    inline_match = re.match(r"(?is)^(.+?)\s*(?:[|｜]\s*)?(?:染色|染剂|染料|dyes?|colou?rs?)\s*[:：]\s*(.+)$", text)
    if inline_match:
        return normalize_space(inline_match.group(1)), split_text_input_dyes(inline_match.group(2))

    bracket_pairs = {
        ")": "(",
        "）": "（",
        "]": "[",
        "】": "【",
    }
    close = text[-1:]
    open_char = bracket_pairs.get(close)
    if open_char:
        start = text.rfind(open_char)
        if start > 0:
            item = normalize_space(text[:start])
            dyes = split_text_input_dyes(text[start + 1 : -1])
            if item and dyes:
                return item, dyes
    return text, []


def is_text_input_dye_line(value: str, mapping: Dict[str, Any], locale: str) -> bool:
    text = normalize_space(str(value or ""))
    if not text:
        return False
    if re.match(r"^(?:[|｜]\s*)?(?:染色|染剂|染料|dyes?|colou?rs?)\s*[:：]", text, flags=re.IGNORECASE):
        return True
    if is_empty_ec_dye_name(text):
        return True
    if len(split_text_input_dyes(text)) > 1:
        return True
    return resolve_stain_id_by_name(mapping, text) > 0


def resolve_equipinfo_dye_ids(mapping: Dict[str, Any], dyes: List[str], warnings: List[str], line_number: int) -> List[int]:
    dye_ids = []
    for dye in dyes[:2]:
        if is_empty_ec_dye_name(dye):
            dye_ids.append(0)
            continue
        dye_id = resolve_stain_id_by_name(mapping, dye)
        if dye_id > 0:
            dye_ids.append(dye_id)
        elif dye and not is_empty_ec_dye_name(dye):
            warnings.append(f"第 {line_number} 行染剂未识别：{dye}")
    return dye_ids[:2]


def get_record_dye_count(record: Dict[str, Any], slot_name: str) -> int:
    if slot_name in TEXT_INPUT_NO_DYE_SLOTS:
        return 0
    return min(max(int(record.get("dye_count", 0) or 0), 0), 2)


def pad_dye_ids(dye_ids: List[int], dye_count: int) -> List[int]:
    padded = [int(value or 0) for value in dye_ids[:dye_count]]
    while len(padded) < dye_count:
        padded.append(0)
    return padded


def serialize_equipinfo_candidate(record: Dict[str, Any], slot_name: str) -> Dict[str, Any]:
    slot_label = RESOLVER_SLOT_LABELS.get(slot_name, record.get("slot_label", ""))
    return {
        **record,
        "name": record.get("names", {}).get(DEFAULT_LOCALE) or record.get("name", ""),
        "slot_label": slot_label,
        "key_label": record.get("key_label") or ("编号" if slot_name in {"Glasses", "FashionAccessory"} else "物品ID"),
        "is_emperor": record.get("is_emperor", False),
        "rarity": record.get("rarity", 1),
        "icon": record.get("icon", 0),
        "equip_slot_category": record.get("equip_slot_category", 0),
        "dye_count": get_record_dye_count(record, slot_name),
        "model_main": record.get("model_main") or {},
    }


def build_model_from_candidate(slot_name: str, candidate: Dict[str, Any]) -> Dict[str, int]:
    model = candidate.get("model_main") or {}
    primary = int(model.get("primary", 0) or 0)
    secondary = int(model.get("secondary", 0) or 0)
    tertiary = int(model.get("tertiary", 0) or 0)
    if slot_name in {"MainHand", "OffHand"}:
        return {"set": primary, "base": secondary, "variant": tertiary}
    if primary or secondary:
        return {"base": primary, "variant": secondary}
    return {}


def build_equipinfo_resolved_entry(
    item: Dict[str, Any],
    mapping: Dict[str, Any],
) -> Dict[str, Any]:
    slot_name = item["slot"]
    slot_label = RESOLVER_SLOT_LABELS[slot_name]
    raw_candidate = serialize_equipinfo_candidate(item["record"], slot_name)
    dye_count = int(raw_candidate.get("dye_count", 0) or 0)
    dye_ids = pad_dye_ids(item.get("dye_ids", []), dye_count)
    dye_id = dye_ids[0] if dye_ids else 0
    dye_id_2 = dye_ids[1] if len(dye_ids) > 1 else 0
    candidates = decorate_candidates([raw_candidate], dye_id, dye_id_2, mapping)
    candidate = candidates[0] if candidates else raw_candidate
    slot_names = get_slot_names(slot_name, mapping)

    model = build_model_from_candidate(slot_name, candidate)
    if model and slot_name in {"MainHand", "OffHand"}:
        lookup_key = f"{slot_label}|{model.get('set', 0)}|{model.get('base', 0)}|{model.get('variant', 0)}"
    elif model:
        lookup_key = f"{slot_label}|{model.get('base', 0)}|{model.get('variant', 0)}"
    else:
        lookup_key = f"TEXT|{slot_name}|{candidate.get('key', 0)}"

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": lookup_key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "source": {
            "site": "文本识别",
            "line_number": item.get("line_number", 0),
            "slot": item.get("raw_slot", ""),
            "item_name": item.get("raw_item", ""),
            "dyes": item.get("raw_dyes", []),
            "matched": True,
        },
    }


def parse_equipinfo_text_payload(text: str, source_locale: str, mapping: Dict[str, Any]) -> Dict[str, Any]:
    metadata = mapping.get("metadata", {})
    locales = metadata.get("locales", get_locales(mapping))
    locale = source_locale if source_locale in locales else metadata.get("default_locale", DEFAULT_LOCALE)
    warnings: List[str] = []
    parsed_items: List[Dict[str, Any]] = []
    last_item: Optional[Dict[str, Any]] = None
    pending_slot = ""
    pending_raw_slot = ""
    ring_count = 0

    for line_number, raw_line in enumerate(str(text or "").splitlines(), 1):
        line = normalize_space(raw_line.strip(" \t\r\n-•*"))
        if not line:
            continue

        standalone_slot = normalize_text_input_slot(line, mapping, locale)
        if standalone_slot:
            pending_slot = standalone_slot
            pending_raw_slot = line
            continue

        slot_name = ""
        raw_slot = ""
        item_text = line
        dye_texts: List[str] = []
        match = re.match(r"^(.{1,40}?)\s*[:：]\s*(.+)$", line)
        if match:
            possible_slot = normalize_text_input_slot(match.group(1), mapping, locale)
            if possible_slot:
                slot_name = possible_slot
                raw_slot = normalize_space(match.group(1))
                item_text = normalize_space(match.group(2))
            elif is_text_input_dye_line(line, mapping, locale):
                if last_item:
                    last_item["raw_dyes"].extend(split_text_input_dyes(match.group(2)))
                    last_item["dye_line_numbers"].append(line_number)
                else:
                    warnings.append(f"第 {line_number} 行染剂没有可归属的装备：{line}")
                continue

        if not slot_name and is_text_input_dye_line(line, mapping, locale):
            if last_item:
                last_item["raw_dyes"].extend(split_text_input_dyes(line))
                last_item["dye_line_numbers"].append(line_number)
            else:
                warnings.append(f"第 {line_number} 行染剂没有可归属的装备：{line}")
            continue

        if not slot_name and pending_slot:
            slot_name = pending_slot
            raw_slot = pending_raw_slot
            pending_slot = ""
            pending_raw_slot = ""

        item_text, inline_dyes = parse_text_input_item_and_dyes(item_text)
        dye_texts.extend(inline_dyes)
        if not item_text:
            continue

        record = find_equipinfo_record_by_text(mapping, item_text, locale, slot_name)
        if not record:
            warnings.append(f"第 {line_number} 行装备未识别：{item_text}")
            if slot_name:
                pending_slot = ""
                pending_raw_slot = ""
            continue

        inferred_slot = slot_name or get_equipinfo_record_slot(record)
        if not inferred_slot:
            warnings.append(f"第 {line_number} 行无法判断部位：{item_text}")
            continue
        if inferred_slot == "LeftRing" and raw_slot and normalize_text_input_slot(raw_slot, mapping, locale) == "LeftRing":
            inferred_slot = "LeftRing" if ring_count == 0 else "RightRing"
            ring_count += 1

        item = {
            "slot": inferred_slot,
            "raw_slot": raw_slot,
            "raw_item": item_text,
            "raw_dyes": dye_texts,
            "dye_line_numbers": [line_number],
            "record": record,
            "line_number": line_number,
        }
        parsed_items.append(item)
        last_item = item

    if not parsed_items:
        raise ValueError("没有识别到装备信息")

    for item in parsed_items:
        if item["slot"] in TEXT_INPUT_NO_DYE_SLOTS:
            item["dye_ids"] = []
            continue
        dye_line_number = item["dye_line_numbers"][-1] if item.get("dye_line_numbers") else item.get("line_number", 0)
        item["dye_ids"] = resolve_equipinfo_dye_ids(mapping, item.get("raw_dyes", []), warnings, dye_line_number)

    order = {slot: index for index, slot in enumerate(EC_SLOT_ORDER)}
    parsed_items.sort(key=lambda item: order.get(item["slot"], len(order)))
    return {
        "file_type": "文字信息识别",
        "source_name": "文本装备信息",
        "source_title": "文本装备信息",
        "source_locale": locale,
        "locales": locales,
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "warnings": warnings,
        "resolved_equipment": [build_equipinfo_resolved_entry(item, mapping) for item in parsed_items],
    }


def resolve_stain_id_by_name(mapping: Dict[str, Any], dye_name: str) -> int:
    normalized_names = {
        normalize_lookup_text(clean_ec_dye_name(dye_name)),
        normalize_lookup_text(dye_name),
    }
    normalized_names.discard("")
    if is_empty_ec_dye_name(dye_name):
        return 0

    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}
    for stains in stains_by_locale.values():
        for stain_id, stain_name in stains.items():
            if normalize_lookup_text(stain_name) in normalized_names or normalize_lookup_text(clean_ec_dye_name(stain_name)) in normalized_names:
                return int(stain_id)
    return 0


def known_stain_ids(mapping: Dict[str, Any]) -> Set[int]:
    stains_by_locale = mapping.get("stains_by_locale") or {DEFAULT_LOCALE: mapping.get("stains", {})}
    ids: Set[int] = set()
    for stains in stains_by_locale.values():
        for stain_id in stains.keys():
            try:
                ids.add(int(stain_id))
            except (TypeError, ValueError):
                continue
    return ids


def resolve_stain_id_by_hex(mapping: Dict[str, Any], color_hex: str) -> int:
    normalized = str(color_hex or "").strip().lower()
    if not re.fullmatch(r"#[0-9a-f]{6}", normalized):
        return 0
    matches = []
    for stain_id, color in (mapping.get("stain_colors") or {}).items():
        if str(color.get("hex", "")).strip().lower() == normalized:
            try:
                numeric_id = int(stain_id)
            except (TypeError, ValueError):
                continue
            if numeric_id > 0:
                matches.append(numeric_id)
    return matches[0] if len(matches) == 1 else 0


def build_fallback_ec_candidate(entry: Dict[str, Any], slot_label: str) -> Dict[str, Any]:
    return {
        "key": 0,
        "key_label": "EC",
        "name": entry["item_name"],
        "names": {
            DEFAULT_LOCALE: entry["item_name"],
            "en": entry["item_name"],
        },
        "rarity": 1,
        "is_emperor": False,
        "icon": entry.get("icon", 0),
        "equip_slot_category": 0,
        "slot_label": slot_label,
        "dye_count": min(len(entry.get("dyes", [])), 2),
        "model_main": {},
    }


def get_ec_variant_label(entry: Dict[str, Any]) -> str:
    if entry.get("slot") != "Glasses":
        return ""
    dyes = entry.get("dyes") if isinstance(entry.get("dyes"), list) else []
    for dye in dyes:
        label = clean_ec_dye_name(str(dye or ""))
        if label and not is_empty_ec_dye_name(label):
            return label
    return ""


def get_ec_normal_dyes(entry: Dict[str, Any]) -> List[str]:
    if entry.get("slot") == "Glasses":
        return []
    dyes = entry.get("dyes", []) if isinstance(entry.get("dyes"), list) else []
    normal_dyes = []
    for dye in dyes[:2]:
        if not normalize_space(str(dye or "")):
            continue
        cleaned = clean_ec_dye_name(str(dye))
        if cleaned:
            normal_dyes.append(cleaned)
    return normal_dyes


def find_item_record_by_id(mapping: Dict[str, Any], item_id: int, slot_name: str = "") -> Optional[Dict[str, Any]]:
    if item_id <= 0:
        return None
    fallback = None
    for item in mapping.get("items", []):
        if int(item.get("key", 0) or 0) != item_id:
            continue
        if slot_name and item_matches_equipment_slot(item, slot_name):
            return dict(item)
        if fallback is None:
            fallback = dict(item)
    return None if slot_name else fallback


def build_fallback_rs_candidate(entry: Dict[str, Any], slot_label: str) -> Dict[str, Any]:
    item_name = entry.get("item_name", "")
    item_id = int(entry.get("item_id", 0) or 0)
    return {
        "key": item_id,
        "key_label": "石之家装备ID",
        "name": item_name,
        "names": {
            DEFAULT_LOCALE: item_name,
        },
        "rarity": 1,
        "is_emperor": False,
        "icon": int(entry.get("icon", 0) or 0),
        "equip_slot_category": 0,
        "slot_label": slot_label,
        "dye_count": min(len(entry.get("dye_ids", [])), 2),
        "model_main": {},
    }


def build_ec_resolved_entry(entry: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    slot_name = entry["slot"]
    slot_label = RESOLVER_SLOT_LABELS[slot_name]
    record = find_item_record_by_name(mapping, entry["item_name"], slot_name)
    raw_candidate = record or build_fallback_ec_candidate(entry, slot_label)
    ec_variant_label = get_ec_variant_label(entry)
    normal_dyes = get_ec_normal_dyes(entry)
    raw_candidate = {
        **raw_candidate,
        "icon": raw_candidate.get("icon") or entry.get("icon", 0),
        "dye_count": get_record_dye_count(raw_candidate, slot_name),
        "ec_variant_label": ec_variant_label,
        "ec_variant_kind": "glasses-style" if ec_variant_label else "",
    }
    dye_ids = pad_dye_ids([resolve_stain_id_by_name(mapping, dye) for dye in normal_dyes], int(raw_candidate.get("dye_count", 0) or 0))
    dye_id = dye_ids[0] if dye_ids else 0
    dye_id_2 = dye_ids[1] if len(dye_ids) > 1 else 0
    candidates = decorate_candidates([raw_candidate], dye_id, dye_id_2, mapping)
    candidate = candidates[0] if candidates else raw_candidate
    slot_names = get_slot_names(slot_name, mapping)

    if record:
        model = build_model_from_candidate(slot_name, candidate)
        if slot_name in {"MainHand", "OffHand"}:
            lookup_key = f"{slot_label}|{model.get('set', 0)}|{model.get('base', 0)}|{model.get('variant', 0)}"
        else:
            lookup_key = f"{slot_label}|{model.get('base', 0)}|{model.get('variant', 0)}"
    else:
        model = {}
        lookup_key = f"EC|{slot_name}|{entry['item_name']}"

    return {
        "slot": slot_name,
        "slot_label": slot_label,
        "slot_names": slot_names,
        "slot_display": slot_names.get(DEFAULT_LOCALE, slot_name),
        "lookup_key": lookup_key,
        "model": model,
        "dye_id": dye_id,
        "dye_id_2": dye_id_2,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "source": {
            "site": "Eorzea Collection",
            "slot": entry.get("ec_slot", ""),
            "item_name": entry["item_name"],
            "dyes": entry.get("dyes", []),
            "ec_variant_label": ec_variant_label,
            "matched": bool(record),
        },
    }


def parse_ec_glamour_payload(document: str, url: str, mapping: Dict[str, Any]) -> Dict[str, Any]:
    metadata = mapping.get("metadata", {})
    title = extract_ec_title(document)
    author = extract_ec_author(document)
    character = extract_ec_character(document)
    equipment = parse_ec_equipment(document)

    return {
        "file_type": "Eorzea Collection",
        "source_name": title or url,
        "source_url": url,
        "source_title": title,
        "source_author": author.get("label", ""),
        "author": author,
        "race": character.get("race", ""),
        "gender": character.get("gender", ""),
        "locales": metadata.get("locales", get_locales(mapping)),
        "default_locale": metadata.get("default_locale", DEFAULT_LOCALE),
        "locale_labels": metadata.get("locale_labels", {DEFAULT_LOCALE: "chs"}),
        "slot_names": mapping.get("slot_names", DEFAULT_SLOT_NAMES),
        "dye_labels": mapping.get("dye_labels", DEFAULT_DYE_LABELS),
        "no_dye_labels": build_no_dye_labels(mapping),
        "resolved_equipment": [build_ec_resolved_entry(entry, mapping) for entry in equipment],
    }

