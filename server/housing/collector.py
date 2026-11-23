"""Polling collector for the CN housing sales API (Python stdlib only).

Data source: 艾欧泽亚售楼中心 (house.ffxiv.cyou, mirror househelper.ffxiv.cyou),
crowdsourced by HousingCheckXP plugin reports. This collector follows their API
etiquette: descriptive User-Agent, low request rate, data source attribution.
"""

import argparse
import gzip
import json
import time
import urllib.request
from pathlib import Path

from cn_servers import CN_SERVERS
from housing_db import HousingDB

API_BASES = ['https://house.ffxiv.cyou', 'https://househelper.ffxiv.cyou']
USER_AGENT = 'NightingaleSilenceHousing/1.0 (+https://nightingalesilence.com)'
POLL_INTERVAL = 120  # upstream Cloudflare edge cache is 120s; polling faster gains nothing


def get_json(path):
    last_error = None
    for base in API_BASES:
        request = urllib.request.Request(
            base + path,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                raw = response.read()
                if response.headers.get('Content-Encoding') == 'gzip':
                    raw = gzip.decompress(raw)
                return json.loads(raw)
        except Exception as error:  # fall through to the mirror host
            last_error = error
    raise last_error


def collect_once(db):
    run_id = db.start_run()
    total = 0
    failed = []
    for server_id, name, _dc in CN_SERVERS:
        try:
            sales = get_json(f'/api/sales?server={server_id}')
            events = db.store_server_snapshot(run_id, server_id, sales)
            total += len(sales)
            changes = get_json(f'/api/change?server={server_id}&offset=0')
            inserted = db.store_transfers(server_id, changes)
            print(f'[{name} {server_id}] plots={len(sales)} events={events} transfers+={inserted}', flush=True)
        except Exception as error:  # keep going with the remaining servers
            failed.append(server_id)
            print(f'[{name} {server_id}] FAILED: {error}', flush=True)
        time.sleep(0.25)
    db.finish_run(run_id, len(CN_SERVERS) - len(failed), total, failed)
    print(f'run {run_id} done: {total} plots, failed={failed}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', default=str(Path(__file__).parent / 'data' / 'housing.db'))
    parser.add_argument('--once', action='store_true', help='collect a single round and exit')
    args = parser.parse_args()

    db = HousingDB(args.db)
    if args.once:
        collect_once(db)
        return
    while True:
        started = time.time()
        try:
            collect_once(db)
        except Exception as error:  # never let the loop die
            print(f'collect round failed: {error}', flush=True)
        time.sleep(max(5, POLL_INTERVAL - (time.time() - started)))


if __name__ == '__main__':
    main()
