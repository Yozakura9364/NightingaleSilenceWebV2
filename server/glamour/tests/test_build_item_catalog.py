import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

from build_item_catalog import build_catalog_mounts  # noqa: E402


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
