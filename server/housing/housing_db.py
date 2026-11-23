"""SQLite storage for the housing history collector (stdlib only)."""

import json
import sqlite3
import time
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS poll_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at REAL NOT NULL,
    finished_at REAL,
    server_count INTEGER NOT NULL DEFAULT 0,
    total_plots INTEGER NOT NULL DEFAULT 0,
    failed_servers TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS server_snapshots (
    server_id INTEGER NOT NULL,
    run_id INTEGER NOT NULL,
    plot_count INTEGER NOT NULL,
    newest_last_seen INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (server_id, run_id)
);
CREATE TABLE IF NOT EXISTS current_plots (
    server_id INTEGER NOT NULL,
    area INTEGER NOT NULL,
    slot INTEGER NOT NULL,
    plot_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    size INTEGER NOT NULL,
    purchase_type INTEGER NOT NULL,
    region_type INTEGER NOT NULL,
    state INTEGER NOT NULL,
    participate INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (server_id, area, slot, plot_id)
);
CREATE TABLE IF NOT EXISTS plot_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    area INTEGER NOT NULL,
    slot INTEGER NOT NULL,
    plot_id INTEGER NOT NULL,
    event TEXT NOT NULL,
    run_id INTEGER NOT NULL,
    at REAL NOT NULL,
    detail TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_plot_events_server_at ON plot_events (server_id, at);
CREATE TABLE IF NOT EXISTS transfers (
    server_id INTEGER NOT NULL,
    area INTEGER NOT NULL,
    slot INTEGER NOT NULL,
    plot_id INTEGER NOT NULL,
    from_owner TEXT NOT NULL DEFAULT '',
    to_owner TEXT NOT NULL DEFAULT '',
    from_type INTEGER NOT NULL DEFAULT 0,
    to_type INTEGER NOT NULL DEFAULT 0,
    from_time INTEGER NOT NULL DEFAULT 0,
    to_time INTEGER NOT NULL,
    PRIMARY KEY (server_id, area, slot, plot_id, to_time)
);
CREATE INDEX IF NOT EXISTS idx_transfers_server_time ON transfers (server_id, to_time);
"""

EVENT_FIELDS = ('price', 'participate', 'state', 'purchase_type', 'region_type', 'end_time')


class HousingDB:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute('PRAGMA journal_mode=WAL')
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    def start_run(self):
        cursor = self.conn.execute('INSERT INTO poll_runs (started_at) VALUES (?)', (time.time(),))
        self.conn.commit()
        return cursor.lastrowid

    def finish_run(self, run_id, server_count, total_plots, failed_servers):
        self.conn.execute(
            'UPDATE poll_runs SET finished_at = ?, server_count = ?, total_plots = ?, failed_servers = ? WHERE id = ?',
            (time.time(), server_count, total_plots, ','.join(map(str, failed_servers)), run_id),
        )
        self.conn.commit()

    def previous_plots(self, server_id):
        rows = self.conn.execute(
            'SELECT area, slot, plot_id, price, participate, state, purchase_type, region_type, end_time '
            'FROM current_plots WHERE server_id = ?',
            (server_id,),
        ).fetchall()
        return {(row['area'], row['slot'], row['plot_id']): dict(row) for row in rows}

    def store_server_snapshot(self, run_id, server_id, sales):
        now = time.time()
        previous = self.previous_plots(server_id)
        events = []
        for item in sales:
            key = (item['Area'], item['Slot'], item['ID'])
            old = previous.pop(key, None)
            if old is None:
                events.append((key, 'appeared', ''))
                continue
            for field in EVENT_FIELDS:
                if old.get(field) != item.get(_api_field(field)):
                    events.append((key, field, f"{old.get(field)} -> {item.get(_api_field(field))}"))
        for key in previous:
            events.append((key, 'vanished', ''))

        self.conn.execute('DELETE FROM current_plots WHERE server_id = ?', (server_id,))
        for item in sales:
            self.conn.execute(
                'INSERT INTO current_plots (server_id, area, slot, plot_id, price, size, purchase_type,'
                ' region_type, state, participate, end_time, first_seen, last_seen, payload)'
                ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (
                    server_id,
                    item['Area'],
                    item['Slot'],
                    item['ID'],
                    item['Price'],
                    item['Size'],
                    item['PurchaseType'],
                    item['RegionType'],
                    item['State'],
                    item['Participate'],
                    item['EndTime'],
                    item['FirstSeen'],
                    item['LastSeen'],
                    json.dumps(item, ensure_ascii=False),
                ),
            )
        newest = max((item['LastSeen'] for item in sales), default=0)
        self.conn.execute(
            'INSERT INTO server_snapshots (server_id, run_id, plot_count, newest_last_seen) VALUES (?, ?, ?, ?)',
            (server_id, run_id, len(sales), newest),
        )
        for (area, slot, plot_id), event, detail in events:
            self.conn.execute(
                'INSERT INTO plot_events (server_id, area, slot, plot_id, event, run_id, at, detail)'
                ' VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                (server_id, area, slot, plot_id, event, run_id, now, detail),
            )
        self.conn.commit()
        return len(events)

    def store_transfers(self, server_id, changes):
        inserted = 0
        for item in changes:
            cursor = self.conn.execute(
                'INSERT OR IGNORE INTO transfers (server_id, area, slot, plot_id, from_owner, to_owner,'
                ' from_type, to_type, from_time, to_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (
                    server_id,
                    item.get('Area'),
                    item.get('Slot'),
                    item.get('ID'),
                    item.get('FromOwner', ''),
                    item.get('ToOwner', ''),
                    item.get('FromType', 0),
                    item.get('ToType', 0),
                    item.get('FromTime', 0),
                    item.get('ToTime', 0),
                ),
            )
            inserted += cursor.rowcount
        self.conn.commit()
        return inserted


def _api_field(snake):
    return {
        'price': 'Price',
        'participate': 'Participate',
        'state': 'State',
        'purchase_type': 'PurchaseType',
        'region_type': 'RegionType',
        'end_time': 'EndTime',
    }[snake]
