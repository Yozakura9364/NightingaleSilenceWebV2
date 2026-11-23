"""Run the CN housing history collector and its read-only API.

usage:
    python server/housing/run.py            # collector thread + API on 127.0.0.1:8790
    python server/housing/run.py --once     # collect one round and exit
    python server/housing/run.py --api-only # only serve the API over the existing DB
"""

import argparse
import threading
from pathlib import Path

from api import serve
from collector import collect_once
from housing_db import HousingDB


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', default=str(Path(__file__).parent / 'data' / 'housing.db'))
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8790)
    parser.add_argument('--once', action='store_true')
    parser.add_argument('--api-only', action='store_true')
    args = parser.parse_args()

    db = HousingDB(args.db)
    if args.once:
        collect_once(db)
        return
    if not args.api_only:
        def loop():
            import time
            from collector import POLL_INTERVAL
            while True:
                started = time.time()
                try:
                    collect_once(db)
                except Exception as error:
                    print(f'collect round failed: {error}', flush=True)
                time.sleep(max(5, POLL_INTERVAL - (time.time() - started)))

        threading.Thread(target=loop, daemon=True).start()
    serve(db, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
