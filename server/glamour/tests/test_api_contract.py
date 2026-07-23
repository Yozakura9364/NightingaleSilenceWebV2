import importlib.util
import io
import json
import os
import sys
import tempfile
from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "app.py"
sys.path.insert(0, str(app_path.parent))
from item_catalog import write_item_catalog

catalog_directory = tempfile.TemporaryDirectory()
catalog_path = Path(catalog_directory.name) / "item_catalog.sqlite3"
write_item_catalog(
    catalog_path,
    [
        {
            "item_id": 2,
            "icon": 20001,
            "rarity": 1,
            "equip_slot_category": 0,
            "names": {"zh": "火之碎晶", "en": "Fire Shard"},
        }
    ],
    {"zh": "fixture:zh", "en": "fixture:en"},
)
os.environ["NSGLAMOUR_ITEM_CATALOG_PATH"] = str(catalog_path)

spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

client = module.app.test_client()


def test_health_and_reference_data():
    assert client.get("/").get_json() == {"ok": True, "service": "nsglamour-api"}
    assert client.get("/api/health").get_json() == {"ok": True}

    localization = client.get("/api/ui-localization")
    assert localization.status_code == 200
    assert localization.get_json()["version"] == 2
    assert "no-store" in localization.headers["Cache-Control"]

    stains = client.get("/api/stains?locale=zh")
    assert stains.status_code == 200
    assert len(stains.get_json()["results"]) == 126
    assert "max-age=3600" in stains.headers["Cache-Control"]


def test_search_text_and_chara_parsing():
    catalog_search = client.get(
        "/api/search-catalog-items?q=碎晶&locale=zh&limit=12&category=other"
    )
    assert catalog_search.status_code == 200
    catalog_result = catalog_search.get_json()["results"][0]
    assert catalog_result["key"] == 2
    assert catalog_result["item_kind"] == "item"

    equipment_search = client.get(
        "/api/search-catalog-items?q=robe&locale=en&limit=12&category=equipment"
    )
    assert equipment_search.status_code == 200
    equipment_result = equipment_search.get_json()["results"][0]
    assert equipment_result["item_kind"] == "equipment"
    assert equipment_result["item_card_slot"] == "Body"
    assert equipment_result["dye_count"] >= 0

    assert client.get("/api/search-catalog-items?q=x&category=invalid").status_code == 400

    search = client.get("/api/search-items?slot=Body&q=robe&locale=en&limit=1")
    result = search.get_json()["results"][0]
    assert result["slot_label"] == "身体防具"
    assert result["model_main"]["primary"] > 0

    parsed_text = client.post(
        "/api/equipinfo/parse-text",
        json={"text": f"Body: {result['name']}", "source_locale": "en"},
    )
    assert parsed_text.status_code == 200
    assert parsed_text.get_json()["resolved_equipment"][0]["candidates"]

    model = result["model_main"]
    chara = {
        "TypeName": "Character",
        "Race": 1,
        "Gender": 0,
        "Body": {
            "ModelBase": model["primary"],
            "ModelVariant": model["secondary"],
            "DyeId": 0,
            "DyeId2": 0,
        },
    }
    parsed_chara = client.post(
        "/api/parse-chara",
        data={
            "file": (
                io.BytesIO(json.dumps(chara).encode("utf-8")),
                "migration-smoke.chara",
            )
        },
        content_type="multipart/form-data",
    )
    assert parsed_chara.status_code == 200
    assert parsed_chara.get_json()["resolved_equipment"][0]["candidates"]


def test_catalog_search_reports_unavailable_index():
    original_path = module._item_catalog.path
    try:
        module._item_catalog.path = Path(catalog_directory.name) / "missing.sqlite3"
        response = client.get(
            "/api/search-catalog-items?q=碎晶&locale=zh&limit=12&category=other"
        )
        assert response.status_code == 503
        assert response.get_json() == {"error": "item catalog unavailable"}
    finally:
        module._item_catalog.path = original_path


def test_input_errors_are_stable():
    empty_text = client.post(
        "/api/equipinfo/parse-text",
        json={"text": "", "source_locale": "zh"},
    )
    assert empty_text.status_code == 400
    assert empty_text.get_json() == {"error": "请输入装备文字"}

    invalid_file = client.post(
        "/api/parse-chara",
        data={"file": (io.BytesIO(b"{}"), "invalid.json")},
        content_type="multipart/form-data",
    )
    assert invalid_file.status_code == 400
    assert invalid_file.get_json() == {"error": "invalid file type"}


test_health_and_reference_data()
test_search_text_and_chara_parsing()
test_catalog_search_reports_unavailable_index()
test_input_errors_are_stable()

print("api contract ok")
