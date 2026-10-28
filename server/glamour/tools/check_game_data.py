"""Exercise the real Flask routes against an isolated generated data batch."""
import argparse
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mapping', type=Path, required=True)
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--batch-id', required=True)
    args = parser.parse_args()
    document = json.loads(args.mapping.read_text(encoding='utf-8'))
    if document.get('metadata', {}).get('source_batch_id') != args.batch_id:
        raise ValueError('Mapping has another source batch')
    with closing(sqlite3.connect(args.catalog.resolve().as_uri() + '?mode=ro', uri=True)) as con:
        provenance = json.loads(con.execute("SELECT value FROM metadata WHERE key='sources'").fetchone()[0])
    if provenance.get('source_batch_id') != args.batch_id:
        raise ValueError('Catalog has another source batch')
    os.environ['NSGLAMOUR_ITEM_CATALOG_PATH'] = str(args.catalog.resolve())
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from app import app
    from services import mapping
    mapping.MAPPING_PATH = args.mapping.resolve()
    mapping._mapping_data = None
    results = {}
    with app.test_client() as client:
        for url, expected in (
            ('/api/stains?locale=en', 200),
            ('/api/search-catalog-items?q=a&locale=en&category=all&limit=2', 200),
            ('/api/search-catalog-items?q=a&category=invalid', 400),
            ('/api/search-catalog-items?q=&locale=en', 200),
            ('/api/search-items?slot=Body&q=a&locale=en&limit=2', 200),
        ):
            response = client.get(url)
            if response.status_code != expected or response.get_json() is None:
                raise ValueError('Generated data API check failed: ' + url + ' status=' + str(response.status_code))
            if 'category=all' in url and not response.get_json().get('results'):
                raise ValueError('Generated item catalog returned no searchable names')
            results[url] = response.status_code
    print(json.dumps({'source_batch_id': args.batch_id, 'api_checks': results}, ensure_ascii=False))


if __name__ == '__main__':
    main()
