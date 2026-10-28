"""Shared batch inputs are verified before either equipment generator reads CSV."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from game_data_batch import load_batch, local_source, source_record


class GameDataBatchTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "csv/chs/Item.csv"
        self.source.parent.mkdir(parents=True)
        self.source.write_text("key,0\n#,Name\nint32,str\n1,Example\n", encoding="utf-8")
        self.entry = {"locale": "chs", "sheet": "Item", "path": "csv/chs/Item.csv",
                      "sha256": hashlib.sha256(self.source.read_bytes()).hexdigest(),
                      "repository": "local", "revision": "", "url": ""}
        self.manifest_path = self.root / "manifest.json"
        self.write_manifest([self.entry])

    def write_manifest(self, entries):
        encoded = json.dumps(entries, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        self.identity = hashlib.sha256(encoded).hexdigest()
        self.manifest_path.write_text(json.dumps({"schema_version": "nightingale.game-data.v1",
            "batch_id": self.identity, "source_mode": "local", "sources": entries}), encoding="utf-8")

    def test_valid_batch_preserves_actual_provenance_without_absolute_path(self):
        batch = load_batch(self.manifest_path, requirements={"chs": {"Item"}})
        source = local_source(batch["root"], "zh", "Item", batch=batch)
        provenance = source_record(source, batch=batch)
        self.assertEqual(provenance["sha256"], self.entry["sha256"])
        self.assertNotIn(str(self.root), json.dumps(provenance))

    def test_corrupted_file_is_not_consumed(self):
        self.source.write_text("changed", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "hash"):
            load_batch(self.manifest_path)

    def test_missing_dependency_duplicate_key_and_escape_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Missing"):
            load_batch(self.manifest_path, requirements={"chs": {"Mount"}})
        self.write_manifest([self.entry, self.entry])
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            load_batch(self.manifest_path)
        changed = dict(self.entry, sheet="../Item", path="csv/chs/../Item.csv")
        self.write_manifest([changed])
        with self.assertRaises(ValueError):
            load_batch(self.manifest_path)

    def test_noncanonical_path_is_rejected(self):
        changed = dict(self.entry, sheet="./Item", path="csv/chs/./Item.csv")
        self.write_manifest([changed])
        with self.assertRaises(ValueError):
            load_batch(self.manifest_path)

    def test_source_root_and_override_cannot_switch_batch(self):
        with self.assertRaisesRegex(ValueError, "match"):
            load_batch(self.manifest_path, str(self.root))
        batch = load_batch(self.manifest_path)
        with self.assertRaisesRegex(ValueError, "override"):
            local_source(batch["root"], "zh", "Item", str(self.manifest_path), batch)

    def test_local_manifest_cannot_claim_remote_provenance(self):
        self.write_manifest([dict(self.entry, repository="upstream", revision="a" * 40)])
        with self.assertRaisesRegex(ValueError, "provenance"):
            load_batch(self.manifest_path)


if __name__ == "__main__":
    unittest.main()
