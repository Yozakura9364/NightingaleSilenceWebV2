import importlib.util
import sys
from pathlib import Path

app_path = Path(__file__).resolve().parents[1] / "app.py"
sys.path.insert(0, str(app_path.parent))
spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

from services.search import record_matches_query

record = {"key": 123, "names": {"zh": "占星长袍", "en": "Star Velvet Robe"}}

assert record_matches_query(record, "占星", "zh")
assert not record_matches_query(record, "s", "zh")
assert record_matches_query(record, "st", "zh")
assert record_matches_query(record, "s", "en")

print("search fallback ok")
