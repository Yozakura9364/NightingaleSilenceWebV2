import json
import sqlite3
import tempfile
from pathlib import Path
from typing import Dict, Iterable, List


SCHEMA_VERSION = 3
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
    sources: Dict[str, object],
    mounts: Iterable[Dict[str, object]] = (),
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
                    equip_slot_category INTEGER NOT NULL,
                    dye_count INTEGER NOT NULL,
                    is_furniture INTEGER NOT NULL
                );
                CREATE TABLE item_names (
                    item_id INTEGER NOT NULL,
                    locale TEXT NOT NULL,
                    name TEXT NOT NULL,
                    search_name TEXT NOT NULL,
                    PRIMARY KEY (locale, item_id),
                    FOREIGN KEY (item_id) REFERENCES items(item_id)
                ) WITHOUT ROWID;
                CREATE TABLE mounts (
                    mount_id INTEGER PRIMARY KEY,
                    icon INTEGER NOT NULL
                );
                CREATE TABLE mount_names (
                    mount_id INTEGER NOT NULL,
                    locale TEXT NOT NULL,
                    name TEXT NOT NULL,
                    search_name TEXT NOT NULL,
                    PRIMARY KEY (locale, mount_id),
                    FOREIGN KEY (mount_id) REFERENCES mounts(mount_id)
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
                        max(0, min(int(item.get("dye_count", 0) or 0), 2)),
                        1 if item.get("is_furniture", False) else 0,
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
                INSERT INTO items(
                    item_id, icon, rarity, equip_slot_category, dye_count, is_furniture
                )
                VALUES (?, ?, ?, ?, ?, ?)
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

            mount_rows = []
            mount_name_rows = []
            for mount in mounts:
                mount_id = int(mount.get("mount_id", 0) or 0)
                icon = int(mount.get("icon", 0) or 0)
                if mount_id <= 0 or icon <= 0:
                    continue
                mount_rows.append((mount_id, icon))
                names = mount.get("names") or {}
                if not isinstance(names, dict):
                    continue
                for locale, name in names.items():
                    clean_name = str(name or "").strip()
                    if clean_name:
                        mount_name_rows.append(
                            (mount_id, normalize_locale(str(locale)), clean_name, clean_name.casefold())
                        )

            connection.executemany(
                "INSERT INTO mounts(mount_id, icon) VALUES (?, ?)",
                mount_rows,
            )
            connection.executemany(
                """
                INSERT INTO mount_names(mount_id, locale, name, search_name)
                VALUES (?, ?, ?, ?)
                """,
                mount_name_rows,
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
        selected_category = (
            category
            if category in {"all", "equipment", "other", "furniture", "mount"}
            else "all"
        )
        with self._connect() as connection:
            if selected_category == "mount":
                mount_ids = self._find_mount_ids(
                    connection,
                    clean_query,
                    selected_locale,
                    result_limit,
                )
                return self._load_mounts(connection, mount_ids, selected_locale)
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
        category_clauses = {
            "equipment": "AND equip_slot_category > 0",
            "other": "AND equip_slot_category = 0 AND is_furniture = 0",
            "furniture": "AND is_furniture = 1",
        }
        category_clause = category_clauses.get(category, "")
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

    def _find_mount_ids(
        self,
        connection: sqlite3.Connection,
        query: str,
        locale: str,
        limit: int,
    ) -> List[int]:
        if query.isdigit():
            exact = connection.execute(
                "SELECT mount_id FROM mounts WHERE mount_id = ?",
                (int(query),),
            ).fetchone()
            return [int(exact["mount_id"])] if exact else []

        search_locales = [locale]
        if locale != "en" and any("a" <= character <= "z" for character in query):
            search_locales.append("en")
        placeholders = ", ".join("?" for _ in search_locales)
        escaped_query = escape_like(query)
        rows = connection.execute(
            f"""
            SELECT mount_names.mount_id,
                   MIN(
                       CASE
                           WHEN locale = ? AND search_name = ? THEN 0
                           WHEN locale = ? AND search_name LIKE ? ESCAPE '\\' THEN 1
                           WHEN search_name = ? THEN 2
                           WHEN search_name LIKE ? ESCAPE '\\' THEN 3
                           ELSE 4
                       END
                   ) AS score
            FROM mount_names
            WHERE locale IN ({placeholders})
              AND search_name LIKE ? ESCAPE '\\'
            GROUP BY mount_names.mount_id
            ORDER BY score, mount_names.mount_id
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
        return [int(row["mount_id"]) for row in rows]

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
            SELECT item_id, icon, rarity, equip_slot_category, dye_count, is_furniture
            FROM items
            WHERE item_id IN ({placeholders})
            """,
            item_ids,
        ).fetchall()
        names_by_id: Dict[int, Dict[str, str]] = {}
        locale_placeholders = ", ".join("?" for _ in SUPPORTED_LOCALES)
        name_rows = connection.execute(
            f"""
            SELECT item_id, locale, name
            FROM item_names
            WHERE locale IN ({locale_placeholders}) AND item_id IN ({placeholders})
            """,
            (*SUPPORTED_LOCALES, *item_ids),
        ).fetchall()
        for row in name_rows:
            names_by_id.setdefault(int(row["item_id"]), {})[str(row["locale"])] = str(row["name"])
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
                    "dye_count": int(row["dye_count"]),
                    "dye_display_by_locale": {},
                    "dye_display": "",
                    "dye_entries": [],
                    "is_emperor": False,
                    "item_kind": "item",
                }
            )
            if int(row["is_furniture"]):
                results[-1]["item_category"] = "furniture"
        return results

    def _load_mounts(
        self,
        connection: sqlite3.Connection,
        mount_ids: List[int],
        locale: str,
    ) -> List[Dict[str, object]]:
        if not mount_ids:
            return []
        placeholders = ", ".join("?" for _ in mount_ids)
        mount_rows = connection.execute(
            f"""
            SELECT mount_id, icon
            FROM mounts
            WHERE mount_id IN ({placeholders})
            """,
            mount_ids,
        ).fetchall()
        locale_placeholders = ", ".join("?" for _ in SUPPORTED_LOCALES)
        name_rows = connection.execute(
            f"""
            SELECT mount_id, locale, name
            FROM mount_names
            WHERE locale IN ({locale_placeholders}) AND mount_id IN ({placeholders})
            """,
            (*SUPPORTED_LOCALES, *mount_ids),
        ).fetchall()
        names_by_id: Dict[int, Dict[str, str]] = {}
        for row in name_rows:
            names_by_id.setdefault(int(row["mount_id"]), {})[str(row["locale"])] = str(row["name"])

        rows_by_id = {int(row["mount_id"]): row for row in mount_rows}
        results = []
        for mount_id in mount_ids:
            row = rows_by_id.get(mount_id)
            if row is None:
                continue
            names = names_by_id.get(mount_id, {})
            name = names.get(locale) or names.get("zh") or names.get("en") or next(
                iter(names.values()), ""
            )
            results.append(
                {
                    "key": mount_id,
                    "key_label": "坐骑ID",
                    "name": name,
                    "names": names,
                    "icon": int(row["icon"]),
                    "rarity": 1,
                    "slot_label": "",
                    "equip_slot_category": 0,
                    "model_main": {},
                    "dye_count": 0,
                    "dye_display_by_locale": {},
                    "dye_display": "",
                    "dye_entries": [],
                    "is_emperor": False,
                    "item_kind": "item",
                    "item_category": "mount",
                }
            )
        return results
