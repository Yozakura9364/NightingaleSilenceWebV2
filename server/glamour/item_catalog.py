import json
import sqlite3
import tempfile
from pathlib import Path
from typing import Dict, Iterable, List


SCHEMA_VERSION = 1
SUPPORTED_LOCALES = ("zh", "en", "ja", "ko", "tc", "fr", "de")


def normalize_locale(locale: str) -> str:
    value = (locale or "zh").strip().lower()
    if value in {"zh-cn", "zh-hans", "chs", "cn"}:
        return "zh"
    if value in {"zh-tw", "zh-hant", "cht"}:
        return "tc"
    return value or "zh"


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def write_item_catalog(
    path: Path,
    items: Iterable[Dict[str, object]],
    sources: Dict[str, str],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        prefix=f"{path.stem}-",
        suffix=".sqlite3.tmp",
        dir=path.parent,
        delete=False,
    ) as temporary_file:
        temporary_path = Path(temporary_file.name)

    try:
        connection = sqlite3.connect(temporary_path)
        try:
            connection.executescript(
                """
                PRAGMA journal_mode = OFF;
                PRAGMA synchronous = OFF;
                CREATE TABLE metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE items (
                    item_id INTEGER PRIMARY KEY,
                    icon INTEGER NOT NULL,
                    rarity INTEGER NOT NULL,
                    equip_slot_category INTEGER NOT NULL
                );
                CREATE TABLE item_names (
                    item_id INTEGER NOT NULL,
                    locale TEXT NOT NULL,
                    name TEXT NOT NULL,
                    search_name TEXT NOT NULL,
                    PRIMARY KEY (locale, item_id),
                    FOREIGN KEY (item_id) REFERENCES items(item_id)
                ) WITHOUT ROWID;
                """
            )
            connection.executemany(
                "INSERT INTO metadata(key, value) VALUES (?, ?)",
                [
                    ("schema_version", str(SCHEMA_VERSION)),
                    ("sources", json.dumps(sources, ensure_ascii=False, sort_keys=True)),
                ],
            )

            item_rows = []
            name_rows = []
            for item in items:
                item_id = int(item.get("item_id", 0) or 0)
                icon = int(item.get("icon", 0) or 0)
                if item_id <= 0 or icon <= 0:
                    continue
                item_rows.append(
                    (
                        item_id,
                        icon,
                        max(1, int(item.get("rarity", 1) or 1)),
                        max(0, int(item.get("equip_slot_category", 0) or 0)),
                    )
                )
                names = item.get("names") or {}
                if not isinstance(names, dict):
                    continue
                for locale, name in names.items():
                    clean_name = str(name or "").strip()
                    if clean_name:
                        name_rows.append(
                            (item_id, normalize_locale(str(locale)), clean_name, clean_name.casefold())
                        )

            connection.executemany(
                """
                INSERT INTO items(item_id, icon, rarity, equip_slot_category)
                VALUES (?, ?, ?, ?)
                """,
                item_rows,
            )
            connection.executemany(
                """
                INSERT INTO item_names(item_id, locale, name, search_name)
                VALUES (?, ?, ?, ?)
                """,
                name_rows,
            )
            connection.commit()
        finally:
            connection.close()
        temporary_path.replace(path)
    finally:
        temporary_path.unlink(missing_ok=True)


class ItemCatalog:
    def __init__(self, path: Path):
        self.path = path

    def search(
        self,
        query: str,
        locale: str,
        limit: int = 20,
        category: str = "all",
    ) -> List[Dict[str, object]]:
        clean_query = str(query or "").strip().casefold()[:100]
        if not clean_query:
            return []
        selected_locale = normalize_locale(locale)
        result_limit = max(1, min(int(limit or 20), 40))
        selected_category = category if category in {"all", "other"} else "all"
        with self._connect() as connection:
            item_ids = self._find_item_ids(
                connection,
                clean_query,
                selected_locale,
                result_limit,
                selected_category,
            )
            return self._load_items(connection, item_ids, selected_locale)

    def _connect(self) -> sqlite3.Connection:
        if not self.path.is_file():
            raise FileNotFoundError(self.path)
        connection = sqlite3.connect(f"file:{self.path.as_posix()}?mode=ro", uri=True)
        connection.row_factory = sqlite3.Row
        return connection

    def _find_item_ids(
        self,
        connection: sqlite3.Connection,
        query: str,
        locale: str,
        limit: int,
        category: str,
    ) -> List[int]:
        item_ids: List[int] = []
        category_clause = "AND equip_slot_category = 0" if category == "other" else ""
        if query.isdigit():
            exact = connection.execute(
                f"SELECT item_id FROM items WHERE item_id = ? {category_clause}",
                (int(query),),
            ).fetchone()
            if exact:
                return [int(exact["item_id"])]
            return []

        search_locales = [locale]
        if locale != "en" and any("a" <= character <= "z" for character in query):
            search_locales.append("en")
        placeholders = ", ".join("?" for _ in search_locales)
        escaped_query = escape_like(query)
        rows = connection.execute(
            f"""
            SELECT item_names.item_id,
                   MIN(
                       CASE
                           WHEN locale = ? AND search_name = ? THEN 0
                           WHEN locale = ? AND search_name LIKE ? ESCAPE '\\' THEN 1
                           WHEN search_name = ? THEN 2
                           WHEN search_name LIKE ? ESCAPE '\\' THEN 3
                           ELSE 4
                       END
                   ) AS score
            FROM item_names
            JOIN items ON items.item_id = item_names.item_id
            WHERE locale IN ({placeholders})
              AND search_name LIKE ? ESCAPE '\\'
              {category_clause}
            GROUP BY item_names.item_id
            ORDER BY score, item_names.item_id
            LIMIT ?
            """,
            (
                locale,
                query,
                locale,
                f"{escaped_query}%",
                query,
                f"{escaped_query}%",
                *search_locales,
                f"%{escaped_query}%",
                limit,
            ),
        ).fetchall()
        for row in rows:
            item_id = int(row["item_id"])
            if item_id not in item_ids:
                item_ids.append(item_id)
            if len(item_ids) >= limit:
                break
        return item_ids

    def _load_items(
        self,
        connection: sqlite3.Connection,
        item_ids: List[int],
        locale: str,
    ) -> List[Dict[str, object]]:
        if not item_ids:
            return []
        placeholders = ", ".join("?" for _ in item_ids)
        item_rows = connection.execute(
            f"""
            SELECT item_id, icon, rarity, equip_slot_category
            FROM items
            WHERE item_id IN ({placeholders})
            """,
            item_ids,
        ).fetchall()
        names_by_id: Dict[int, Dict[str, str]] = {}
        for name_locale in SUPPORTED_LOCALES:
            name_rows = connection.execute(
                f"""
                SELECT item_id, name
                FROM item_names
                WHERE locale = ? AND item_id IN ({placeholders})
                """,
                (name_locale, *item_ids),
            ).fetchall()
            for row in name_rows:
                names_by_id.setdefault(int(row["item_id"]), {})[name_locale] = str(row["name"])
        rows_by_id = {int(row["item_id"]): row for row in item_rows}

        results = []
        for item_id in item_ids:
            row = rows_by_id.get(item_id)
            if row is None:
                continue
            names = names_by_id.get(item_id, {})
            name = names.get(locale) or names.get("zh") or names.get("en") or next(iter(names.values()), "")
            results.append(
                {
                    "key": item_id,
                    "key_label": "物品ID",
                    "name": name,
                    "names": names,
                    "icon": int(row["icon"]),
                    "rarity": int(row["rarity"]),
                    "slot_label": "",
                    "equip_slot_category": int(row["equip_slot_category"]),
                    "model_main": {},
                    "dye_count": 0,
                    "dye_display_by_locale": {},
                    "dye_display": "",
                    "dye_entries": [],
                    "is_emperor": False,
                    "item_kind": "item",
                }
            )
        return results
