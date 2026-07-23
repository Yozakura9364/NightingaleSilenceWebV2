import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from item_catalog import ItemCatalog, write_item_catalog


temporary_directory = tempfile.TemporaryDirectory()
catalog_path = Path(temporary_directory.name) / "item_catalog.sqlite3"

write_item_catalog(
    catalog_path,
    [
        {
            "item_id": 2,
            "icon": 20001,
            "rarity": 1,
            "equip_slot_category": 0,
            "names": {"zh": "火之碎晶", "en": "Fire Shard", "ja": "ファイアシャード"},
        },
        {
            "item_id": 4550,
            "icon": 21261,
            "rarity": 1,
            "equip_slot_category": 0,
            "names": {"zh": "强力恢复药", "en": "Hi-Potion", "ja": "ハイポーション"},
        },
        {
            "item_id": 9999,
            "icon": 40001,
            "rarity": 3,
            "equip_slot_category": 4,
            "names": {"zh": "测试长袍", "en": "Test Robe"},
        },
    ],
    {"zh": "fixture:zh", "en": "fixture:en", "ja": "fixture:ja"},
)

catalog = ItemCatalog(catalog_path)


def test_catalog_searches_id_and_localized_names():
    by_id = catalog.search("4550", "zh", 12)
    assert [item["key"] for item in by_id] == [4550]
    assert by_id[0]["name"] == "强力恢复药"
    assert by_id[0]["names"]["en"] == "Hi-Potion"

    by_zh = catalog.search("碎晶", "zh", 12)
    assert [item["key"] for item in by_zh] == [2]

    by_en_fallback = catalog.search("potion", "zh", 12)
    assert [item["key"] for item in by_en_fallback] == [4550]


def test_catalog_limits_results_and_marks_plain_items():
    results = catalog.search("test", "en", 1)
    assert len(results) == 1
    assert results[0]["item_kind"] == "item"
    assert results[0]["dye_count"] == 0


def test_other_category_excludes_equipment():
    assert [item["key"] for item in catalog.search("2", "zh", 12, category="other")] == [2]
    assert catalog.search("9999", "zh", 12, category="other") == []
    assert [item["key"] for item in catalog.search("robe", "en", 12)] == [9999]


test_catalog_searches_id_and_localized_names()
test_catalog_limits_results_and_marks_plain_items()
test_other_category_excludes_equipment()

print("item catalog ok")
