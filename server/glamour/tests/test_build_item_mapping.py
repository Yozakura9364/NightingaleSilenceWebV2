import tempfile
import sys
import csv
import hashlib
import json
import subprocess
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from server.glamour.tools.build_item_mapping import (
    DEFAULT_LOCALES,
    build_language_sources,
)


SOURCE_FOLDERS = {
    "zh": "chs",
    "en": "en",
    "ja": "ja",
    "ko": "ko",
    "tc": "tc",
    "fr": "fr",
    "de": "de",
}
SOURCE_FILES = ("Item.csv", "Stain.csv", "Addon.csv", "Glasses.csv", "Ornament.csv")


with tempfile.TemporaryDirectory() as temporary_directory:
    root = Path(temporary_directory)
    for folder in SOURCE_FOLDERS.values():
        locale_root = root / folder
        locale_root.mkdir()
        for file_name in SOURCE_FILES:
            (locale_root / file_name).write_text("fixture", encoding="utf-8")

    sources = build_language_sources("", "", "", source_root=str(root), locales=DEFAULT_LOCALES)

    for locale in DEFAULT_LOCALES:
        for source_kind, file_name in zip(("item", "stain", "addon", "glasses", "ornament"), SOURCE_FILES):
            assert Path(sources[locale][source_kind]) == root / SOURCE_FOLDERS[locale] / file_name

    (root / "tc" / "Stain.csv").unlink()
    try:
        build_language_sources("", "", "", source_root=str(root), locales=DEFAULT_LOCALES)
    except ValueError as error:
        assert "Missing local tc Stain.csv" in str(error)
    else:
        raise AssertionError("missing local source must fail closed")

    (root / "tc" / "Stain.csv").write_text("fixture", encoding="utf-8")
    try:
        build_language_sources("https://example.invalid/Item.csv", "", "",
                               source_root=str(root), locales=DEFAULT_LOCALES)
    except ValueError as error:
        assert "local" in str(error).lower() and "override" in str(error).lower()
    else:
        raise AssertionError("local source mode must reject remote overrides")

print("local source-root mapping ok")


class MappingBatchTests(unittest.TestCase):
    def test_cli_consumes_verified_batch_and_emits_real_provenance(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            fixtures = {
                "Item": (["#", "Name", "Icon", "EquipSlotCategory", "Model{Main}"],
                         [1, "Sample", 20, 3, "1,2,3,0"]),
                "Stain": (["#", "Color", "Shade", "SubOrder", "Name"], [1, 16711680, 1, 1, "Red"]),
                "Addon": (["#", "Text"], [738, "Main Hand"]),
                "Glasses": (["#", "Name", "Icon"], [1, "Glasses", 30]),
                "Ornament": (["#", "Singular", "Icon", "Model"], [1, "Parasol", 40, 10]),
            }
            entries = []
            for locale in ("chs", "en"):
                for sheet, (header, row) in fixtures.items():
                    path = root / "csv" / locale / (sheet + ".csv")
                    path.parent.mkdir(parents=True, exist_ok=True)
                    with path.open("w", encoding="utf-8", newline="") as handle:
                        writer = csv.writer(handle)
                        writer.writerows([["key", *range(len(header) - 1)], header,
                                          ["int32", *["str"] * (len(header) - 1)], row])
                    entries.append({"locale": locale, "sheet": sheet,
                                    "path": path.relative_to(root).as_posix(),
                                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                                    "repository": "local", "revision": "", "url": ""})
            identity = hashlib.sha256(json.dumps(entries, ensure_ascii=False, sort_keys=True,
                                                 separators=(",", ":")).encode("utf-8")).hexdigest()
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"schema_version": "nightingale.game-data.v1",
                                           "batch_id": identity, "source_mode": "local", "sources": entries}), encoding="utf-8")
            output = root / "mapping.json"
            tool = Path(__file__).resolve().parents[1] / "tools/build_item_mapping.py"
            result = subprocess.run([sys.executable, "-X", "utf8", "-B", str(tool),
                                     "--source-batch", str(manifest), "--locales", "zh,en",
                                     "--output", str(output)], capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(result.returncode, 0, result.stderr)
            mapping = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(len(mapping["items"]), 1)
            self.assertEqual(mapping["metadata"]["source_batch_id"], identity)
            self.assertEqual(mapping["metadata"]["item_sources"]["zh"]["path"], "csv/chs/Item.csv")
            self.assertNotIn(str(root), json.dumps(mapping["metadata"]))


if __name__ == "__main__":
    unittest.main()
