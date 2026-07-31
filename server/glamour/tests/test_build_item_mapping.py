import tempfile
import sys
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

print("local source-root mapping ok")
