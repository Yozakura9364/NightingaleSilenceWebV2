"""Read-only HTTP API for the housing history database (Python stdlib only)."""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from cn_servers import CN_SERVERS, SERVER_DATACENTERS, SERVER_NAMES


def make_handler(db):
    class HousingApiHandler(BaseHTTPRequestHandler):
        def log_message(self, *args):  # keep stdout clean
            return

        def send_json(self, payload, status=200):
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):  # noqa: N802 (stdlib naming)
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            try:
                self.route(parsed.path, params)
            except Exception as error:  # surface as JSON, never an HTML error page
                self.send_json({'error': str(error)}, status=500)

        def route(self, path, params):
            if path == '/api/housing/health':
                latest = db.conn.execute(
                    'SELECT id, started_at, finished_at, total_plots, failed_servers FROM poll_runs ORDER BY id DESC LIMIT 1'
                ).fetchone()
                self.send_json({'ok': True, 'latest_run': dict(latest) if latest else None})
                return
            if path == '/api/housing/servers':
                rows = db.conn.execute(
                    'SELECT s.server_id, s.plot_count, s.newest_last_seen, s.run_id, r.started_at '
                    'FROM server_snapshots s JOIN poll_runs r ON r.id = s.run_id '
                    'WHERE s.run_id = (SELECT MAX(run_id) FROM server_snapshots WHERE server_id = s.server_id)'
                ).fetchall()
                by_server = {row['server_id']: dict(row) for row in rows}
                payload = [
                    {
                        'id': server_id,
                        'name': name,
                        'datacenter': SERVER_DATACENTERS[server_id],
                        'latest': by_server.get(server_id),
                    }
                    for server_id, name, _dc in CN_SERVERS
                ]
                self.send_json(payload)
                return

            server_id = int(params.get('server', ['0'])[0])
            if server_id not in SERVER_NAMES:
                self.send_json({'error': f'unknown server id {server_id}'}, status=400)
                return
            limit = min(int(params.get('limit', ['100'])[0]), 500)
            offset = int(params.get('offset', ['0'])[0])

            if path == '/api/housing/current':
                rows = db.conn.execute(
                    'SELECT * FROM current_plots WHERE server_id = ? ORDER BY area, slot, plot_id',
                    (server_id,),
                ).fetchall()
                self.send_json([dict(row) for row in rows])
                return
            if path == '/api/housing/history':
                rows = db.conn.execute(
                    'SELECT s.run_id, s.plot_count, s.newest_last_seen, r.started_at, r.finished_at '
                    'FROM server_snapshots s JOIN poll_runs r ON r.id = s.run_id '
                    'WHERE s.server_id = ? ORDER BY s.run_id DESC LIMIT ? OFFSET ?',
                    (server_id, limit, offset),
                ).fetchall()
                self.send_json([dict(row) for row in rows])
                return
            if path == '/api/housing/events':
                rows = db.conn.execute(
                    'SELECT * FROM plot_events WHERE server_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
                    (server_id, limit, offset),
                ).fetchall()
                self.send_json([dict(row) for row in rows])
                return
            if path == '/api/housing/transfers':
                rows = db.conn.execute(
                    'SELECT * FROM transfers WHERE server_id = ? ORDER BY to_time DESC LIMIT ? OFFSET ?',
                    (server_id, limit, offset),
                ).fetchall()
                self.send_json([dict(row) for row in rows])
                return
            if path == '/api/housing/polls':
                rows = db.conn.execute(
                    'SELECT * FROM poll_runs ORDER BY id DESC LIMIT ?', (limit,)
                ).fetchall()
                self.send_json([dict(row) for row in rows])
                return
            self.send_json({'error': f'unknown route {path}'}, status=404)

    return HousingApiHandler


def serve(db, host='127.0.0.1', port=8790):
    server = ThreadingHTTPServer((host, port), make_handler(db))
    print(f'housing history API listening on http://{host}:{port}/api/housing/health', flush=True)
    server.serve_forever()
