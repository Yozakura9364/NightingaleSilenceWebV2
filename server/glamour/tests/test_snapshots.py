import tempfile
import sys
import json
import re
import sqlite3
from contextlib import closing
from pathlib import Path

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from snapshots import (
    EquipmentSnapshotStore,
    SnapshotNotFoundError,
    SnapshotValidationError,
    register_snapshot_routes,
    sanitize_snapshot_payload,
)


def sample_payload():
    return {
        "locales": ["ja", "en", "zh", "ko"],
        "slot_names": {"Body": {"zh": "身体", "en": "Body", "ja": "胴"}},
        "no_dye_labels": {"zh": "无染色", "en": "No Dye"},
        "source": {"url": "https://private.example", "author": "do not persist"},
        "entries": [
            {
                "slot": "Body",
                "candidate": {
                    "key": "123",
                    "name": "赤麻御敌战甲",
                    "names": {"zh": "赤麻御敌战甲", "en": "Ramie Tabard of Fending", "ja": "ラミー"},
                    "icon": 12345,
                    "model_main": {"raw": "hidden"},
                    "dye_entries": [
                        {"id": 7, "name": "煤烟黑", "names": {"zh": "煤烟黑", "en": "Soot Black"}, "hex": "#1F1F1F"},
                        {"id": 0, "name": "无染色", "names": {"zh": "无染色"}, "hex": "transparent", "isEmpty": True},
                    ],
                },
            }
        ],
    }


def test_snapshot_projection_drops_source_model_and_unknown_slots():
    payload = sample_payload()
    payload["entries"].append({"slot": "Unknown", "candidate": {"name": "hidden"}})

    snapshot = sanitize_snapshot_payload(payload)

    assert snapshot["entries"][0]["slot"] == "Body"
    assert snapshot["entries"][0]["item"]["names"]["en"] == "Ramie Tabard of Fending"
    assert snapshot["entries"][0]["item"]["dyes"][0]["hex"] == "#1F1F1F"
    assert "source" not in snapshot
    assert "model_main" not in snapshot["entries"][0]["item"]
    assert len(snapshot["entries"]) == 1


def test_snapshot_store_round_trip_and_rejects_invalid_id():
    with tempfile.TemporaryDirectory() as directory:
        store = EquipmentSnapshotStore(Path(directory) / "snapshots.sqlite3")
        created = store.create(sample_payload())
        loaded = store.get(created["id"])

    assert loaded["snapshot"] == created["snapshot"]
    assert re.fullmatch(r"[23456789abcdefghjkmnpqrstuvwxyz]{10}", created["id"])
    assert created["reused"] is False

    try:
        store.get("not a snapshot id")
    except SnapshotNotFoundError:
        pass
    else:
        raise AssertionError("invalid snapshot id must not be accepted")


def test_snapshot_store_reuses_identical_public_payload():
    with tempfile.TemporaryDirectory() as directory:
        store = EquipmentSnapshotStore(Path(directory) / "snapshots.sqlite3")
        first_payload = sample_payload()
        second_payload = sample_payload()
        second_payload["source"] = {"url": "https://ignored.example", "title": "ignored"}
        second_payload["entries"][0]["candidate"]["model_main"] = {"raw": "also ignored"}

        first = store.create(first_payload)
        second = store.create(second_payload)

    assert second["id"] == first["id"]
    assert second["created_at"] == first["created_at"]
    assert second["reused"] is True


def test_snapshot_store_keeps_distinct_dye_payloads():
    with tempfile.TemporaryDirectory() as directory:
        store = EquipmentSnapshotStore(Path(directory) / "snapshots.sqlite3")
        first = store.create(sample_payload())
        changed_payload = sample_payload()
        changed_payload["entries"][0]["candidate"]["dye_entries"][0]["id"] = 8
        second = store.create(changed_payload)

    assert second["id"] != first["id"]
    assert second["reused"] is False


def test_snapshot_store_migrates_legacy_rows_without_breaking_links():
    with tempfile.TemporaryDirectory() as directory:
        database_path = Path(directory) / "snapshots.sqlite3"
        payload = sanitize_snapshot_payload(sample_payload())
        payload_json = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        with closing(sqlite3.connect(database_path)) as connection:
            connection.execute(
                """
                CREATE TABLE equipment_snapshots (
                    snapshot_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    payload_json TEXT NOT NULL
                )
                """
            )
            connection.execute(
                "INSERT INTO equipment_snapshots VALUES (?, ?, ?)",
                ("legacy_snapshot_identifier", "2026-01-01T00:00:00+00:00", payload_json),
            )
            connection.commit()

        store = EquipmentSnapshotStore(database_path)
        reused = store.create(sample_payload())
        loaded = store.get("legacy_snapshot_identifier")

    assert reused["id"] == "legacy_snapshot_identifier"
    assert reused["reused"] is True
    assert loaded["snapshot"] == payload


def test_snapshot_requires_at_least_one_selected_item():
    try:
        sanitize_snapshot_payload({"entries": []})
    except SnapshotValidationError:
        pass
    else:
        raise AssertionError("empty snapshot must be rejected")


def test_snapshot_routes_return_only_sanitized_snapshot():
    with tempfile.TemporaryDirectory() as directory:
        app = Flask(__name__)
        register_snapshot_routes(app, EquipmentSnapshotStore(Path(directory) / "snapshots.sqlite3"))
        client = app.test_client()
        created = client.post("/api/equipinfo/snapshots", json=sample_payload())

        assert created.status_code == 201
        response_body = created.get_json()
        assert "source" not in response_body["snapshot"]
        assert response_body["reused"] is False

        reused = client.post("/api/equipinfo/snapshots", json=sample_payload())
        assert reused.status_code == 200
        assert reused.get_json()["id"] == response_body["id"]
        assert reused.get_json()["reused"] is True

        loaded = client.get(f"/api/equipinfo/snapshots/{response_body['id']}")
        assert loaded.status_code == 200
        assert loaded.get_json()["snapshot"]["entries"][0]["item"]["key"] == "123"

        assert client.post("/api/equipinfo/snapshots", json={"entries": []}).status_code == 400
        assert client.get("/api/equipinfo/snapshots/invalid id").status_code == 404


if __name__ == "__main__":
    test_snapshot_projection_drops_source_model_and_unknown_slots()
    test_snapshot_store_round_trip_and_rejects_invalid_id()
    test_snapshot_store_reuses_identical_public_payload()
    test_snapshot_store_keeps_distinct_dye_payloads()
    test_snapshot_store_migrates_legacy_rows_without_breaking_links()
    test_snapshot_requires_at_least_one_selected_item()
    test_snapshot_routes_return_only_sanitized_snapshot()
    print("snapshot api ok")
