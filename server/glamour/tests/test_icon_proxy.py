import importlib.util
import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import mock


app_path = Path(__file__).resolve().parents[1] / "app.py"
sys.path.insert(0, str(app_path.parent))

cache_directory = TemporaryDirectory()
os.environ["NSGLAMOUR_ICON_CACHE_DIR"] = cache_directory.name

spec = importlib.util.spec_from_file_location("nsglamour_app", app_path)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

client = app.app.test_client()
png_header = b"\x89PNG\r\n\x1a\n"


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self, limit=-1):
        return self.body if limit < 0 else self.body[:limit]


def test_hd_icon_is_fetched_and_cached():
    icon_data = png_header + b"hd-icon"
    expected_url = f"{app.ICON_BASE_URL}/041000/041261_hd.png"

    def fake_urlopen(url, timeout=0):
        assert url == expected_url
        assert timeout == 8
        return FakeResponse(icon_data)

    with mock.patch.object(app.urllib.request, "urlopen", side_effect=fake_urlopen):
        response = client.get("/api/icon/41261")

    assert response.status_code == 200
    assert response.data == icon_data
    assert (Path(cache_directory.name) / "041000" / "041261_hd.png").read_bytes() == icon_data

    with mock.patch.object(
        app.urllib.request,
        "urlopen",
        side_effect=AssertionError("cached HD icon should not be fetched again"),
    ):
        cached_response = client.get("/api/icon/41261")

    assert cached_response.status_code == 200
    assert cached_response.data == icon_data


def test_hd_failure_falls_back_to_hr1():
    icon_data = png_header + b"hr1-fallback"
    requested_urls = []

    def fake_urlopen(url, timeout=0):
        requested_urls.append(url)
        if url.endswith("_hd.png"):
            raise app.urllib.error.HTTPError(url, 404, "not found", None, None)
        return FakeResponse(icon_data)

    with mock.patch.object(app.urllib.request, "urlopen", side_effect=fake_urlopen):
        response = client.get("/api/icon/41262")

    assert response.status_code == 200
    assert response.data == icon_data
    assert requested_urls == [
        f"{app.ICON_BASE_URL}/041000/041262_hd.png",
        f"{app.ICON_BASE_URL}/041000/041262_hr1.png",
    ]
    assert (Path(cache_directory.name) / "041000" / "041262_hr1.png").read_bytes() == icon_data


def test_non_hd_segment_only_fetches_hr1():
    icon_data = png_header + b"hr1-icon"
    requested_urls = []

    def fake_urlopen(url, timeout=0):
        requested_urls.append(url)
        return FakeResponse(icon_data)

    with mock.patch.object(app.urllib.request, "urlopen", side_effect=fake_urlopen):
        response = client.get("/api/icon/65025")

    assert response.status_code == 200
    assert response.data == icon_data
    assert requested_urls == [f"{app.ICON_BASE_URL}/065000/065025_hr1.png"]


def test_existing_hr1_cache_does_not_block_hd_upgrade():
    cache_dir = Path(cache_directory.name) / "041000"
    cache_dir.mkdir(parents=True, exist_ok=True)
    (cache_dir / "041263_hr1.png").write_bytes(png_header + b"old-hr1")
    hd_data = png_header + b"new-hd"
    requested_urls = []

    def fake_urlopen(url, timeout=0):
        requested_urls.append(url)
        return FakeResponse(hd_data)

    with mock.patch.object(app.urllib.request, "urlopen", side_effect=fake_urlopen):
        response = client.get("/api/icon/41263")

    assert response.status_code == 200
    assert response.data == hd_data
    assert requested_urls == [f"{app.ICON_BASE_URL}/041000/041263_hd.png"]
    assert (cache_dir / "041263_hd.png").read_bytes() == hd_data


test_hd_icon_is_fetched_and_cached()
test_hd_failure_falls_back_to_hr1()
test_non_hd_segment_only_fetches_hr1()
test_existing_hr1_cache_does_not_block_hd_upgrade()

print("icon proxy ok")
