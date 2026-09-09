import json
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from server.glamour.tools.sync_kr_item_icons import (
    icon_relative_path,
    load_config,
    parse_csv_icon_ids,
    scan_baseline_ids,
    source_url_for,
)


ITEM_CSV_TEXT = """key,0,1
#,Singular,Icon
int32,str,Image
1,Alpha,39931
2,Beta,57949
3,Gamma,0
4,Delta,
5,Epsilon,not-a-number
6,Zeta,57949
7,Theta,-5
8,Iota,1234567
"""


class ParseCsvIconIdsTest(unittest.TestCase):
    def test_extracts_unique_positive_ids(self):
        ids = parse_csv_icon_ids(ITEM_CSV_TEXT)
        self.assertEqual(ids, {39931, 57949})

    def test_handles_bom(self):
        ids = parse_csv_icon_ids("﻿" + ITEM_CSV_TEXT)
        self.assertEqual(ids, {39931, 57949})

    def test_rejects_short_content(self):
        with self.assertRaises(ValueError):
            parse_csv_icon_ids("key,Icon\n1,2")

    def test_rejects_missing_icon_column(self):
        with self.assertRaises(ValueError):
            parse_csv_icon_ids("key,0\n#,Name\nint32,str\n1,x\n")


class IconPathTest(unittest.TestCase):
    def test_relative_path_rule(self):
        self.assertEqual(icon_relative_path(200709), "200000/200709_hd.png")
        self.assertEqual(icon_relative_path(39931), "039000/039931_hd.png")
        self.assertEqual(icon_relative_path(1), "000000/000001_hd.png")

    def test_source_url_rule(self):
        template = "https://image.ff14.co.kr/guide/resources/images/GV7.5/{folder}/{id}.png"
        self.assertEqual(
            source_url_for(template, 200709),
            "https://image.ff14.co.kr/guide/resources/images/GV7.5/200000/200709.png",
        )


class ScanBaselineIdsTest(unittest.TestCase):
    def test_scans_valid_hd_files_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "039000").mkdir()
            (root / "039000" / "039931_hd.png").write_bytes(b"x")
            (root / "200000").mkdir()
            (root / "200000" / "200709_hd.png").write_bytes(b"x")
            (root / "200000" / "200709_hr1.png").write_bytes(b"x")
            (root / "200000" / "notes.txt").write_bytes(b"x")
            ids = scan_baseline_ids(root)
            self.assertEqual(ids, {39931, 200709})

    def test_missing_dir_raises(self):
        with self.assertRaises(ValueError):
            scan_baseline_ids(Path("Z:/definitely/not/here"))


class LoadConfigTest(unittest.TestCase):
    def test_missing_required_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            config_path = Path(tmp) / "config.json"
            with self.assertRaises(ValueError):
                load_config({}, config_path=config_path)

    def test_overrides_and_defaults(self):
        with tempfile.TemporaryDirectory() as tmp:
            config_path = Path(tmp) / "config.json"
            config_path.write_text(json.dumps({
                "csvPath": "a.csv", "baselineDir": "base", "mirrorDir": "mirror",
                "workers": 7,
            }), encoding="utf-8")
            config = load_config({"workers": 2, "stagingDir": "stage"}, config_path=config_path)
            self.assertEqual(config["workers"], 2)
            self.assertEqual(config["stagingDir"], "stage")
            self.assertEqual(config["maxRetries"], 3)
            self.assertIn("sourceTemplate", config)

    def test_config_file_values_kept_without_override(self):
        with tempfile.TemporaryDirectory() as tmp:
            config_path = Path(tmp) / "config.json"
            config_path.write_text(json.dumps({
                "csvPath": "a.csv", "baselineDir": "base", "mirrorDir": "mirror",
            }), encoding="utf-8")
            config = load_config({"workers": None}, config_path=config_path)
            self.assertEqual(config["workers"], 4)


if __name__ == "__main__":
    unittest.main()
