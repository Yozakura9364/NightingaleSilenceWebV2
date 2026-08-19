"""装备映射加载、槽位判定、名称索引与搜索缓存（数据层，无 HTTP 依赖）。"""

import json
import os
import threading
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from .item_catalog import ItemCatalog
    from .resolve_chara import (
        DEFAULT_LOCALE,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
    )
    from .services.text_utils import compact_text_input_lookup
except ImportError:
    from item_catalog import ItemCatalog
    from resolve_chara import (
        DEFAULT_LOCALE,
        SLOT_LABELS as RESOLVER_SLOT_LABELS,
    )
    from services.text_utils import compact_text_input_lookup

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MAPPING_PATH = DATA_DIR / "item_model_mapping.json"
ITEM_CATALOG_PATH = Path(
    os.environ.get("NSGLAMOUR_ITEM_CATALOG_PATH", str(DATA_DIR / "item_catalog.sqlite3"))
)

# 前后端共享业务规则唯一事实源（server/glamour/contracts/shared-rules.json）。
# 前端由 npm run build:glamour-contract 生成 TS 常量；两侧一致性由 check:nsglamour-contract 校验。
SHARED_CONTRACT = json.loads(
    (BASE_DIR / "contracts" / "shared-rules.json").read_text(encoding="utf-8")
)
SHARED_EQUIP_SLOT_CATEGORY = SHARED_CONTRACT["equipSlotCategory"]

# /api/search-items 结果缓存上限（按 mapping 文件 mtime 失效）
SEARCH_RESULTS_CACHE_MAX_ENTRIES = 256

SEARCH_SLOT_LABELS = {
    "MainHand": "武器",
    "OffHand": "武器",
    "HeadGear": "头部防具",
    "Body": "身体防具",
    "Hands": "手部防具",
    "Legs": "腿部防具",
    "Feet": "脚部防具",
    "Ears": "耳饰",
    "Neck": "项链",
    "Wrists": "手镯",
    "LeftRing": "戒指",
    "RightRing": "戒指",
}

ITEM_CARD_SLOT_BY_EQUIP_CATEGORY = {
    int(category): slot for category, slot in SHARED_CONTRACT["slotByEquipSlotCategory"].items()
}

_mapping_data: Optional[Dict[str, Any]] = None
_mapping_mtime_ns: Optional[int] = None
_equipinfo_name_index: Dict[str, Any] = {}
_equipinfo_name_index_mtime_ns: Optional[int] = None
_item_catalog = ItemCatalog(ITEM_CATALOG_PATH)

# /api/search-items 相关缓存：按 mapping 文件 mtime 整体失效
_search_cache_mtime_ns: Optional[int] = None
_slot_records_cache: Dict[str, List[Dict[str, Any]]] = {}
_item_card_equipment_cache: Dict[str, List[Dict[str, Any]]] = {}
_search_results_cache: "OrderedDict[Tuple[str, str, str, int], List[Dict[str, Any]]]" = OrderedDict()
_search_cache_lock = threading.Lock()


def get_equip_slot_category(record: Dict[str, Any]) -> int:
    try:
        return int(record.get("equip_slot_category", 0) or 0)
    except (TypeError, ValueError):
        return 0


def item_matches_equipment_slot(item: Dict[str, Any], slot_name: str) -> bool:
    slot_label = RESOLVER_SLOT_LABELS.get(slot_name, "")
    if slot_label and item.get("slot_label") != slot_label:
        return False
    if slot_name == "OffHand":
        return get_equip_slot_category(item) == int(SHARED_EQUIP_SLOT_CATEGORY["offHandCategory"])
    if slot_name == "MainHand":
        return get_equip_slot_category(item) != int(SHARED_EQUIP_SLOT_CATEGORY["offHandCategory"])
    return True


def load_mapping() -> Dict[str, Any]:
    return json.loads(MAPPING_PATH.read_text(encoding="utf-8"))


def get_mapping() -> Dict[str, Any]:
    global _mapping_data
    global _mapping_mtime_ns

    current_mtime_ns = MAPPING_PATH.stat().st_mtime_ns
    if _mapping_data is None or _mapping_mtime_ns != current_mtime_ns:
        _mapping_data = load_mapping()
        _mapping_mtime_ns = current_mtime_ns
    return _mapping_data


def get_item_catalog() -> ItemCatalog:
    return _item_catalog


def ensure_search_cache_fresh() -> None:
    global _search_cache_mtime_ns
    global _slot_records_cache
    global _item_card_equipment_cache
    current_mtime_ns = MAPPING_PATH.stat().st_mtime_ns
    if _search_cache_mtime_ns == current_mtime_ns:
        return
    with _search_cache_lock:
        if _search_cache_mtime_ns == current_mtime_ns:
            return
        _slot_records_cache = {}
        _item_card_equipment_cache = {}
        _search_results_cache.clear()
        _search_cache_mtime_ns = current_mtime_ns


def get_cached_search_results(cache_key: Tuple[str, str, str, int]) -> Optional[List[Dict[str, Any]]]:
    with _search_cache_lock:
        results = _search_results_cache.get(cache_key)
        if results is None:
            return None
        _search_results_cache.move_to_end(cache_key)
        return results


def put_cached_search_results(cache_key: Tuple[str, str, str, int], results: List[Dict[str, Any]]) -> None:
    with _search_cache_lock:
        _search_results_cache[cache_key] = results
        _search_results_cache.move_to_end(cache_key)
        while len(_search_results_cache) > SEARCH_RESULTS_CACHE_MAX_ENTRIES:
            _search_results_cache.popitem(last=False)


def get_equipinfo_name_index(mapping: Dict[str, Any]) -> Dict[str, Any]:
    global _equipinfo_name_index
    global _equipinfo_name_index_mtime_ns

    current_mtime_ns = MAPPING_PATH.stat().st_mtime_ns
    if _equipinfo_name_index and _equipinfo_name_index_mtime_ns == current_mtime_ns:
        return _equipinfo_name_index

    by_locale: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for item in mapping.get("items", []):
        names = item.get("names") or {}
        for locale, name in names.items():
            normalized = compact_text_input_lookup(name)
            if normalized:
                by_locale.setdefault(locale, {}).setdefault(normalized, []).append(item)
        normalized_default = compact_text_input_lookup(item.get("name", ""))
        if normalized_default:
            by_locale.setdefault(DEFAULT_LOCALE, {}).setdefault(normalized_default, []).append(item)

    for slot, records, slot_label in (
        ("Glasses", (mapping.get("glasses") or {}).values(), RESOLVER_SLOT_LABELS.get("Glasses", "")),
        ("FashionAccessory", (mapping.get("ornaments") or {}).values(), RESOLVER_SLOT_LABELS.get("FashionAccessory", "")),
    ):
        for record in records:
            enriched = {**record, "slot_label": slot_label, "_equipinfo_slot": slot}
            names = enriched.get("names") or {}
            for locale, name in names.items():
                normalized = compact_text_input_lookup(name)
                if normalized:
                    by_locale.setdefault(locale, {}).setdefault(normalized, []).append(enriched)
            normalized_default = compact_text_input_lookup(enriched.get("name", ""))
            if normalized_default:
                by_locale.setdefault(DEFAULT_LOCALE, {}).setdefault(normalized_default, []).append(enriched)

    _equipinfo_name_index = {"by_locale": by_locale}
    _equipinfo_name_index_mtime_ns = current_mtime_ns
    return _equipinfo_name_index


def get_slot_search_records(mapping: Dict[str, Any], slot: str) -> List[Dict[str, Any]]:
    """按槽位过滤后的记录列表（按 mapping mtime 缓存）；未知槽位返回空列表。"""
    ensure_search_cache_fresh()
    cached = _slot_records_cache.get(slot)
    if cached is not None:
        return cached

    if slot == "Glasses":
        records = list((mapping.get("glasses") or {}).values())
    elif slot == "FashionAccessory":
        records = list((mapping.get("ornaments") or {}).values())
    elif slot in SEARCH_SLOT_LABELS:
        records = [
            item
            for item in mapping.get("items", [])
            if item_matches_equipment_slot(item, slot)
        ]
    else:
        records = []
    with _search_cache_lock:
        _slot_records_cache[slot] = records
    return records


def get_item_card_equipment_records(
    mapping: Dict[str, Any], category: str = "equipment"
) -> List[Dict[str, Any]]:
    global _item_card_equipment_cache
    ensure_search_cache_fresh()
    cached = _item_card_equipment_cache.get(category)
    if cached is not None:
        return cached

    if category == "facewear":
        records = [
            {
                **record,
                "_item_card_slot": "Glasses",
                "slot_label": RESOLVER_SLOT_LABELS.get("Glasses", ""),
            }
            for record in (mapping.get("glasses") or {}).values()
        ]
    elif category == "fashion":
        records = [
            {
                **record,
                "_item_card_slot": "FashionAccessory",
                "slot_label": RESOLVER_SLOT_LABELS.get("FashionAccessory", ""),
            }
            for record in (mapping.get("ornaments") or {}).values()
        ]
    else:
        records = list(mapping.get("items", []))

    _item_card_equipment_cache[category] = records
    return records
