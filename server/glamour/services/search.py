"""装备/物品搜索匹配与序列化。"""

import re
from typing import Any, Dict, List

try:
    from .services.mapping import ITEM_CARD_SLOT_BY_EQUIP_CATEGORY, get_equip_slot_category
    from .services.text_utils import clean_datamining_text
except ImportError:
    from services.mapping import ITEM_CARD_SLOT_BY_EQUIP_CATEGORY, get_equip_slot_category
    from services.text_utils import clean_datamining_text


def localized_name(record: Dict[str, Any], locale: str) -> str:
    names = record.get("names") or {}
    return clean_datamining_text(names.get(locale) or names.get("zh") or record.get("name", "") or "")


def should_search_english_fallback(query: str, locale: str) -> bool:
    if (locale or "").casefold().startswith("en"):
        return True
    return len(query) >= 2 and bool(re.search(r"[a-z]", query))


def record_matches_query(record: Dict[str, Any], query: str, locale: str) -> bool:
    """Only match current locale name + English fallback — NOT all languages."""
    if query in str(record.get("key", "")):
        return True
    names = record.get("names") or {}
    locale_name = str(names.get(locale, "")).casefold()
    if query in locale_name:
        return True
    if not should_search_english_fallback(query, locale):
        return False
    en_name = str(names.get("en", "")).casefold()
    if en_name and query in en_name:
        return True
    return False


def search_score(record: Dict[str, Any], query: str, locale: str) -> int:
    """Lower = better. Current locale gets priority over English fallback."""
    key = str(record.get("key", ""))
    if key == query:
        return 0

    names = record.get("names") or {}
    locale_name = str(names.get(locale, "")).casefold()
    en_name = str(names.get("en", "")).casefold()

    if locale_name == query:
        return 1
    if locale_name.startswith(query):
        return 2
    if should_search_english_fallback(query, locale) and en_name == query:
        return 3
    if should_search_english_fallback(query, locale) and en_name.startswith(query):
        return 4
    return 5


def get_item_card_slot(record: Dict[str, Any]) -> str:
    explicit_slot = str(record.get("_item_card_slot", "") or "")
    if explicit_slot:
        return explicit_slot
    return ITEM_CARD_SLOT_BY_EQUIP_CATEGORY.get(get_equip_slot_category(record), "")


def serialize_search_record(record: Dict[str, Any], locale: str, key_label: str = "物品ID") -> Dict[str, Any]:
    item_card_slot = get_item_card_slot(record)
    return {
        "key": record.get("key", 0),
        "key_label": record.get("key_label") or key_label,
        "name": localized_name(record, locale),
        "names": {
            name_locale: clean_datamining_text(name)
            for name_locale, name in (record.get("names") or {}).items()
            if name
        },
        "icon": record.get("icon", 0),
        "rarity": record.get("rarity", 1),
        "slot_label": record.get("slot_label", ""),
        "equip_slot_category": record.get("equip_slot_category", 0),
        "model_main": record.get("model_main") or {},
        "dye_count": record.get("dye_count", 0),
        "dye_display_by_locale": {},
        "dye_display": "",
        "dye_entries": [],
        "is_emperor": record.get("is_emperor", False),
        "item_kind": "equipment" if item_card_slot else record.get("item_kind", "item"),
        "item_card_slot": item_card_slot,
    }


def search_records(records: List[Dict[str, Any]], query: str, locale: str, limit: int) -> List[Dict[str, Any]]:
    matched = [record for record in records if record_matches_query(record, query, locale)]
    matched.sort(key=lambda record: (search_score(record, query, locale), localized_name(record, locale), int(record.get("key", 0))))
    return [serialize_search_record(record, locale) for record in matched[:limit]]
