import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List

TOOLS_DIR = Path(__file__).resolve().parent
SERVER_DIR = TOOLS_DIR.parent
sys.path.insert(0, str(TOOLS_DIR))
sys.path.insert(0, str(SERVER_DIR))

from build_item_mapping import (  # noqa: E402
    DEFAULT_LOCALES,
    LANGUAGE_SOURCES,
    PRIMARY_LOCALE,
    clean_text,
    load_sheet_rows,
    parse_int,
)
from item_catalog import write_item_catalog  # noqa: E402


def parse_locale_list(value: str) -> List[str]:
    locales = [part.strip() for part in value.split(",") if part.strip()]
    if PRIMARY_LOCALE not in locales:
        locales.insert(0, PRIMARY_LOCALE)
    unknown = [locale for locale in locales if locale not in LANGUAGE_SOURCES]
    if unknown:
        raise ValueError(f"Unknown locale(s): {', '.join(unknown)}")
    return locales


def parse_item_overrides(values: List[str]) -> Dict[str, str]:
    overrides: Dict[str, str] = {}
    for value in values:
        locale, separator, source = value.partition("=")
        locale = locale.strip()
        source = source.strip()
        if not separator or locale not in LANGUAGE_SOURCES or not source:
            raise ValueError(f"Invalid --item-csv value: {value}")
        overrides[locale] = source
    return overrides


def build_catalog_items(locales: List[str], sources: Dict[str, str]) -> List[Dict[str, object]]:
    names_by_locale: Dict[str, Dict[int, str]] = {}
    primary_rows: Dict[int, Dict[str, str]] = {}

    for locale in locales:
        names: Dict[int, str] = {}
        for row in load_sheet_rows(sources[locale]):
            item_id = parse_int(row.get("#", "0"))
            name = clean_text(row.get("Name", ""))
            if item_id <= 0 or not name:
                continue
            names[item_id] = name
            if locale == PRIMARY_LOCALE:
                primary_rows[item_id] = row
        names_by_locale[locale] = names

    items = []
    for item_id, row in primary_rows.items():
        icon = parse_int(row.get("Icon", "0"))
        if icon <= 0:
            continue
        names = {
            locale: names_by_locale[locale][item_id]
            for locale in locales
            if item_id in names_by_locale[locale]
        }
        if not names:
            continue
        items.append(
            {
                "item_id": item_id,
                "icon": icon,
                "rarity": parse_int(row.get("Rarity", "1")) or 1,
                "equip_slot_category": parse_int(row.get("EquipSlotCategory", "0")),
                "names": names,
            }
        )
    return items


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Build the server-only NSGlamour item search catalog")
    parser.add_argument("--locales", default=",".join(DEFAULT_LOCALES))
    parser.add_argument(
        "--item-csv",
        action="append",
        default=[],
        metavar="LOCALE=SOURCE",
        help="Override one locale Item.csv source; may be repeated",
    )
    parser.add_argument(
        "--output",
        default=str(SERVER_DIR / "data" / "item_catalog.sqlite3"),
    )
    args = parser.parse_args()

    try:
        locales = parse_locale_list(args.locales)
        overrides = parse_item_overrides(args.item_csv)
        sources = {
            locale: overrides.get(locale, LANGUAGE_SOURCES[locale]["item"])
            for locale in locales
        }
        items = build_catalog_items(locales, sources)
        output = Path(args.output)
        write_item_catalog(output, items, sources)
    except Exception as error:
        print(f"Error building item catalog: {error}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "output": str(output.resolve()),
                "locales": locales,
                "item_count": len(items),
                "size_bytes": output.stat().st_size,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
