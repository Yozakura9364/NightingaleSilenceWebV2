from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import secrets
import sqlite3
import threading


GENERATED_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"


class ShortLinkConflictError(ValueError):
    pass


@dataclass(frozen=True)
class ShortLink:
    code: str
    target_url: str
    enabled: bool
    created_at: str
    updated_at: str


class ShortLinkStore:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=5)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._lock, self._connect() as connection:
            connection.execute("PRAGMA journal_mode = WAL")
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS short_links (
                    code TEXT PRIMARY KEY COLLATE NOCASE,
                    target_url TEXT NOT NULL,
                    enabled INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_short_links_updated_at "
                "ON short_links(updated_at DESC)"
            )

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds")

    @staticmethod
    def _row_to_link(row: sqlite3.Row) -> ShortLink:
        return ShortLink(
            code=str(row["code"]),
            target_url=str(row["target_url"]),
            enabled=bool(row["enabled"]),
            created_at=str(row["created_at"]),
            updated_at=str(row["updated_at"]),
        )

    def _generate_code(self, length: int = 5) -> str:
        return "".join(secrets.choice(GENERATED_CODE_ALPHABET) for _ in range(length))

    def create(self, *, target_url: str, code: str | None = None) -> ShortLink:
        attempts = 1 if code else 24
        for _ in range(attempts):
            candidate = code or self._generate_code()
            now = self._now()
            try:
                with self._lock, self._connect() as connection:
                    connection.execute(
                        """
                        INSERT INTO short_links (code, target_url, enabled, created_at, updated_at)
                        VALUES (?, ?, 1, ?, ?)
                        """,
                        (candidate, target_url, now, now),
                    )
                    row = connection.execute(
                        "SELECT * FROM short_links WHERE code = ?",
                        (candidate,),
                    ).fetchone()
                return self._row_to_link(row)
            except sqlite3.IntegrityError:
                if code:
                    raise ShortLinkConflictError("short code already exists")
        raise RuntimeError("failed to allocate a unique short code")

    def get(self, code: str, *, include_disabled: bool = False) -> ShortLink | None:
        where = "code = ?"
        if not include_disabled:
            where += " AND enabled = 1"
        with self._lock, self._connect() as connection:
            row = connection.execute(
                f"SELECT * FROM short_links WHERE {where}",
                (code,),
            ).fetchone()
        return self._row_to_link(row) if row else None

    def list(self, *, limit: int = 100) -> list[ShortLink]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM short_links ORDER BY updated_at DESC, code ASC LIMIT ?",
                (max(1, min(int(limit), 200)),),
            ).fetchall()
        return [self._row_to_link(row) for row in rows]

    def update(
        self,
        code: str,
        *,
        target_url: str | None = None,
        enabled: bool | None = None,
    ) -> ShortLink | None:
        assignments: list[str] = []
        params: list[object] = []
        if target_url is not None:
            assignments.append("target_url = ?")
            params.append(target_url)
        if enabled is not None:
            assignments.append("enabled = ?")
            params.append(1 if enabled else 0)
        if not assignments:
            return self.get(code, include_disabled=True)

        assignments.append("updated_at = ?")
        params.append(self._now())
        params.append(code)
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                f"UPDATE short_links SET {', '.join(assignments)} WHERE code = ?",
                params,
            )
            if cursor.rowcount == 0:
                return None
            row = connection.execute(
                "SELECT * FROM short_links WHERE code = ?",
                (code,),
            ).fetchone()
        return self._row_to_link(row)

    def delete(self, code: str) -> bool:
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                "DELETE FROM short_links WHERE code = ?",
                (code,),
            )
            return cursor.rowcount > 0
