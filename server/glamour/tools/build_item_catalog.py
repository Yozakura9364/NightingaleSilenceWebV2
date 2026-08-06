import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Iterable, List, Set

TOOLS_DIR = Path(__file__).resolve().parent
SERVER_DIR = TOOLS_DIR.parent
sys.path.insert(0, str(TOOLS_DIR))
sys.path.insert(0, str(SERVER_DIR))

from build_item_mapping import (  # noqa: E402
    DEFAULT_LOCALES,
    LANGUAGE_SOURCES,
    PRIMARY_LOCALE,
    build_language_sources,
    clean_text,
    load_sheet_rows,
    parse_int,
)
from item_catalog import write_item_catalog  # noqa: E402


DEFAULT_HOUSING_FURNITURE_SOURCE = (
    "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/"
    "HousingFurniture.csv"
)
DEFAULT_HOUSING_YARD_OBJECT_SOURCE = (
    "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/"
    "HousingYardObject.csv"
)

# ItemUICategory：73=内墙、74=地板、75=屋顶照明。内装建材不在 HousingFurniture /
# HousingYardObject 表里，按 Item.csv 的 ItemUICategory 归入家具分类。
HOUSING_FIXTURE_UI_CATEGORIES = frozenset({73, 74, 75})

DEFAULT_MOUNT_SOURCES = {
    "zh": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Mount.csv",
    "en": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Mount.csv",
    "ja": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Mount.csv",
    "ko": "https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Mount.csv",
    "tc": "https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Mount.csv",
    "fr": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Mount.csv",
    "de": "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Mount.csv",
}


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


def parse_mount_overrides(values: List[str]) -> Dict[str, str]:
    overrides: Dict[str, str] = {}
    for value in values:
        locale, separator, source = value.partition("=")
        locale = locale.strip()
        source = source.strip()
        if not separator or locale not in LANGUAGE_SOURCES or not source:
            raise ValueError(f"Invalid --mount-csv value: {value}")
        overrides[locale] = source
    return overrides


def load_furniture_item_ids(sources: Iterable[str]) -> Set[int]:
    item_ids: Set[int] = set()
    for source in sources:
        for row in load_sheet_rows(source):
            item_id = parse_int(row.get("Item", "0"))
            if item_id > 0:
                item_ids.add(item_id)
    return item_ids


def build_catalog_items(
    locales: List[str], sources: Dict[str, str], housing_sources: Iterable[str]
) -> List[Dict[str, object]]:
    names_by_locale: Dict[str, Dict[int, str]] = {}
    primary_rows: Dict[int, Dict[str, str]] = {}
    furniture_item_ids = load_furniture_item_ids(housing_sources)

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
                "dye_count": max(0, min(parse_int(row.get("DyeCount", "0")), 2)),
                "is_furniture": item_id in furniture_item_ids
                or parse_int(row.get("ItemUICategory", "0")) in HOUSING_FIXTURE_UI_CATEGORIES,
                "names": names,
            }
        )
    return items


def build_catalog_mounts(
    locales: List[str], sources: Dict[str, str]
) -> List[Dict[str, object]]:
    names_by_locale: Dict[str, Dict[int, str]] = {}
    primary_rows: Dict[int, Dict[str, str]] = {}

    for locale in locales:
        names: Dict[int, str] = {}
        for row in load_sheet_rows(sources[locale]):
            mount_id = parse_int(row.get("#", "0"))
            name = clean_text(row.get("Singular", "") or row.get("Name", ""))
            if mount_id <= 0 or not name:
                continue
            names[mount_id] = name
            if locale == PRIMARY_LOCALE:
                primary_rows[mount_id] = row
        names_by_locale[locale] = names

    mounts = []
    for mount_id, row in primary_rows.items():
        icon = parse_int(row.get("Icon", "0"))
        if icon <= 0:
            continue
        names = {
            locale: names_by_locale[locale][mount_id]
            for locale in locales
            if mount_id in names_by_locale[locale]
        }
        if names:
            mounts.append({"mount_id": mount_id, "icon": icon, "names": names})
    return mounts


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
        "--mount-csv",
        action="append",
        default=[],
        metavar="LOCALE=SOURCE",
        help="Override one locale Mount.csv source; may be repeated",
    )
    parser.add_argument(
        "--source-root",
        default="",
        help="Local root containing chs/en/ja/ko/tc/fr/de Item.csv files; disables remote fallback",
    )
    parser.add_argument(
        "--housing-furniture-csv",
        default="",
        help="HousingFurniture.csv source; defaults to the mixed datamining source",
    )
    parser.add_argument(
        "--housing-yard-object-csv",
        default="",
        help="HousingYardObject.csv source; defaults to the mixed datamining source",
    )
    parser.add_argument(
        "--output",
        default=str(SERVER_DIR / "data" / "item_catalog.sqlite3"),
    )
    args = parser.parse_args()

    try:
        locales = parse_locale_list(args.locales)
        overrides = parse_item_overrides(args.item_csv)
        mount_overrides = parse_mount_overrides(args.mount_csv)
        language_sources = build_language_sources(
            "",
            "",
            "",
            source_root=args.source_root,
            locales=locales,
        )
        sources = {
            locale: overrides.get(locale, language_sources[locale]["item"])
            for locale in locales
        }
        mount_sources = {
            locale: mount_overrides.get(locale, DEFAULT_MOUNT_SOURCES[locale])
            for locale in locales
        }
        if args.source_root:
            for locale in locales:
                local_mount_source = Path(args.source_root) / (
                    "chs" if locale == PRIMARY_LOCALE else locale
                ) / "Mount.csv"
                if local_mount_source.is_file() and locale not in mount_overrides:
                    mount_sources[locale] = str(local_mount_source)
        housing_furniture_source = args.housing_furniture_csv or DEFAULT_HOUSING_FURNITURE_SOURCE
        housing_yard_object_source = (
            args.housing_yard_object_csv or DEFAULT_HOUSING_YARD_OBJECT_SOURCE
        )
        if args.source_root:
            if not args.housing_furniture_csv:
                local_housing_source = (
                    Path(args.source_root) / "chs" / "HousingFurniture.csv"
                )
                if local_housing_source.is_file():
                    housing_furniture_source = str(local_housing_source)
            if not args.housing_yard_object_csv:
                local_yard_source = (
                    Path(args.source_root) / "chs" / "HousingYardObject.csv"
                )
                if local_yard_source.is_file():
                    housing_yard_object_source = str(local_yard_source)
        housing_sources = [housing_furniture_source, housing_yard_object_source]
        items = build_catalog_items(locales, sources, housing_sources)
        mounts = build_catalog_mounts(locales, mount_sources)
        output = Path(args.output)
        write_item_catalog(
            output,
            items,
            {"items": sources, "mounts": mount_sources},
            mounts,
        )
    except Exception as error:
        print(f"Error building item catalog: {error}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "output": str(output.resolve()),
                "locales": locales,
                "item_count": len(items),
                "mount_count": len(mounts),
                "mount_sources": mount_sources,
                "housing_sources": housing_sources,
                "size_bytes": output.stat().st_size,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
