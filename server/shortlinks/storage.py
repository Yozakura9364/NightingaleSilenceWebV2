from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import secrets
import sqlite3
import threading


GENERATED_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"
GET_CACHE_MAX_ENTRIES = 512


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
    """SQLite 短链存储。

    - 每个线程复用一条持久连接（WAL 模式），不再每次操作新建连接；
    - 读操作（get/list）不加进程级写锁，WAL 允许多读单写；
    - 写操作（create/update/delete）在写锁内串行执行；
    - get() 跳转热路径带 LRU 缓存（含未命中结果），写操作会使对应缓存失效。
    """

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._write_lock = threading.RLock()
        self._cache_lock = threading.Lock()
        self._get_cache: OrderedDict[tuple[str, bool], ShortLink | None] = OrderedDict()
        self._local = threading.local()
        self._connections: list[sqlite3.Connection] = []
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """返回当前线程的持久连接，不存在则创建（WAL 模式）。"""
        connection = getattr(self._local, "connection", None)
        if connection is None:
            connection = sqlite3.connect(self.db_path, timeout=5)
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA journal_mode = WAL")
            connection.execute("PRAGMA busy_timeout = 5000")
            with self._write_lock:
                self._connections.append(connection)
            self._local.connection = connection
        return connection

    def close(self) -> None:
        """关闭所有线程创建的连接（测试清理/进程退出时使用）。"""
        with self._write_lock:
            connections, self._connections = self._connections, []
        for connection in connections:
            try:
                connection.close()
            except sqlite3.Error:
                pass
        self._local.connection = None

    def _init_db(self) -> None:
        with self._write_lock:
            connection = self._connect()
            with connection:
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

    @staticmethod
    def _generate_code(length: int = 5) -> str:
        return "".join(secrets.choice(GENERATED_CODE_ALPHABET) for _ in range(length))

    def _cache_get(self, code: str, include_disabled: bool) -> tuple[bool, ShortLink | None]:
        # code 列是 COLLATE NOCASE，缓存键统一 casefold 避免大小写变体穿透失效
        key = (code.casefold(), include_disabled)
        with self._cache_lock:
            if key not in self._get_cache:
                return False, None
            self._get_cache.move_to_end(key)
            return True, self._get_cache[key]

    def _cache_put(self, code: str, include_disabled: bool, link: ShortLink | None) -> None:
        key = (code.casefold(), include_disabled)
        with self._cache_lock:
            self._get_cache[key] = link
            self._get_cache.move_to_end(key)
            while len(self._get_cache) > GET_CACHE_MAX_ENTRIES:
                self._get_cache.popitem(last=False)

    def _cache_invalidate(self, code: str) -> None:
        key = code.casefold()
        with self._cache_lock:
            self._get_cache.pop((key, False), None)
            self._get_cache.pop((key, True), None)

    def create(self, *, target_url: str, code: str | None = None) -> ShortLink:
        attempts = 1 if code else 24
        for _ in range(attempts):
            candidate = code or self._generate_code()
            now = self._now()
            try:
                with self._write_lock:
                    connection = self._connect()
                    with connection:
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
                self._cache_invalidate(candidate)
                return self._row_to_link(row)
            except sqlite3.IntegrityError:
                if code:
                    raise ShortLinkConflictError("short code already exists")
        raise RuntimeError("failed to allocate a unique short code")

    def get(self, code: str, *, include_disabled: bool = False) -> ShortLink | None:
        hit, cached = self._cache_get(code, include_disabled)
        if hit:
            return cached

        where = "code = ?"
        if not include_disabled:
            where += " AND enabled = 1"
        row = self._connect().execute(
            f"SELECT * FROM short_links WHERE {where}",
            (code,),
        ).fetchone()
        link = self._row_to_link(row) if row else None
        self._cache_put(code, include_disabled, link)
        return link

    def list(self, *, limit: int = 100) -> list[ShortLink]:
        rows = self._connect().execute(
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
        with self._write_lock:
            connection = self._connect()
            with connection:
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
        self._cache_invalidate(code)
        return self._row_to_link(row)

    def delete(self, code: str) -> bool:
        with self._write_lock:
            connection = self._connect()
            with connection:
                cursor = connection.execute(
                    "DELETE FROM short_links WHERE code = ?",
                    (code,),
                )
                deleted = cursor.rowcount > 0
        if deleted:
            self._cache_invalidate(code)
        return deleted
