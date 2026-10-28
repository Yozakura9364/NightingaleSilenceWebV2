import sys
import tempfile
import contextlib
import io
import hashlib
import json
import sqlite3
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

from build_item_catalog import build_catalog_mounts  # noqa: E402
import build_item_catalog  # noqa: E402


CSV_HEADER = "key,0,31\n#,Singular,Icon\nint32,str,Image\n"


with tempfile.TemporaryDirectory() as temporary_directory:
    root = Path(temporary_directory)
    zh_source = root / "Mount-zh.csv"
    en_source = root / "Mount-en.csv"
    zh_source.write_text(CSV_HEADER + '4,"古菩猩猩",4003\n', encoding="utf-8")
    en_source.write_text(CSV_HEADER + '4,"Guu Bo",4003\n', encoding="utf-8")

    mounts = build_catalog_mounts(
        ["zh", "en"],
        {"zh": str(zh_source), "en": str(en_source)},
    )

    assert mounts == [
        {
            "mount_id": 4,
            "icon": 4003,
            "names": {"zh": "古菩猩猩", "en": "Guu Bo"},
        }
    ]

print("mount csv catalog builder ok")


class LocalCatalogTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.csv = self.root / "csv"
        for locale in ("chs", "en"):
            directory = self.csv / locale
            directory.mkdir(parents=True)
            (directory / "Item.csv").write_text(
                "key,0,1\n#,Name,Icon\nint32,str,int32\n1,Sample,20\n", encoding="utf-8")
            (directory / "Mount.csv").write_text(CSV_HEADER + '4,"Guu Bo",4003\n', encoding="utf-8")
        for sheet in ("HousingFurniture", "HousingYardObject"):
            (self.csv / "chs" / (sheet + ".csv")).write_text(
                "key,0\n#,Item\nint32,int32\n1,1\n", encoding="utf-8")

    def run_main(self, *extra):
        arguments = ["build_item_catalog.py", "--source-root", str(self.csv),
                     "--locales", "zh,en", "--output", str(self.root / "catalog.sqlite3"), *extra]
        errors = io.StringIO()
        with patch.object(sys, "argv", arguments), contextlib.redirect_stderr(errors), contextlib.redirect_stdout(io.StringIO()):
            result = build_item_catalog.main()
        return result, errors.getvalue()

    def test_catalog_local_mode_requires_only_its_own_tables(self):
        result, errors = self.run_main()
        self.assertEqual(result, 0, errors)
        self.assertTrue((self.root / "catalog.sqlite3").is_file())

    def test_missing_mount_fails_before_any_sheet_or_network_read(self):
        (self.csv / "en/Mount.csv").unlink()
        with patch.object(build_item_catalog, "load_sheet_rows", side_effect=AssertionError("unexpected read")):
            result, errors = self.run_main()
        self.assertEqual(result, 1)
        self.assertIn("Missing local en Mount.csv", errors)

    def test_missing_furniture_fails_before_any_sheet_or_network_read(self):
        (self.csv / "chs/HousingFurniture.csv").unlink()
        with patch.object(build_item_catalog, "load_sheet_rows", side_effect=AssertionError("unexpected read")):
            result, errors = self.run_main()
        self.assertEqual(result, 1)
        self.assertIn("Missing local chs HousingFurniture.csv", errors)

    def test_local_mode_rejects_remote_override(self):
        result, errors = self.run_main("--mount-csv", "en=https://example.invalid/Mount.csv")
        self.assertEqual(result, 1)
        self.assertIn("local", errors.lower())
        self.assertIn("override", errors.lower())

    def test_frozen_batch_is_recorded_in_actual_sqlite_output(self):
        entries = []
        for path in sorted(self.csv.rglob("*.csv")):
            entries.append({"locale": path.parent.name, "sheet": path.stem,
                            "path": path.relative_to(self.root).as_posix(),
                            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                            "repository": "local", "revision": "", "url": ""})
        identity = hashlib.sha256(json.dumps(entries, ensure_ascii=False, sort_keys=True,
                                             separators=(",", ":")).encode("utf-8")).hexdigest()
        manifest = self.root / "manifest.json"
        manifest.write_text(json.dumps({"schema_version": "nightingale.game-data.v1",
                                       "batch_id": identity, "source_mode": "local", "sources": entries}), encoding="utf-8")
        result, errors = self.run_main("--source-batch", str(manifest))
        self.assertEqual(result, 0, errors)
        output = self.root / "catalog.sqlite3"
        with contextlib.closing(sqlite3.connect(output)) as connection:
            metadata = json.loads(connection.execute("SELECT value FROM metadata WHERE key='sources'").fetchone()[0])
            self.assertEqual(connection.execute("SELECT count(*) FROM items").fetchone()[0], 1)
        self.assertEqual(metadata["source_batch_id"], identity)
        self.assertNotIn(str(self.root), json.dumps(metadata))
        before = output.read_bytes()
        (self.csv / "en/Mount.csv").write_text("changed", encoding="utf-8")
        result, errors = self.run_main("--source-batch", str(manifest))
        self.assertEqual(result, 1)
        self.assertIn("hash mismatch", errors)
        self.assertEqual(output.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
