"""API 路由蓝图：/api/health、/api/stains、搜索、图标代理、链接/文本/chara 导入。"""

import json
import os
import re
import secrets
import sqlite3
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List

from flask import Blueprint, abort, after_this_request, current_app, jsonify, request, send_file

try:
    from .adapters.ec_scraper import EC_ALLOWED_HOST, fetch_ec_html
    from .resolve_chara import DEFAULT_LOCALE, resolve_chara
    from .services.mapping import (
        DATA_DIR,
        SEARCH_SLOT_LABELS,
        SHARED_CONTRACT,
        get_cached_search_results,
        get_item_catalog,
        get_item_card_equipment_records,
        get_mapping,
        get_slot_search_records,
        item_matches_equipment_slot,
        put_cached_search_results,
    )
    from .services.risingstones import (
        extract_risingstones_glamour_ids,
        humanize_risingstones_error,
        parse_rs_glamour_payload,
        read_risingstones_details,
    )
    from .services.search import search_records, should_search_english_fallback
    from .services.text_import import parse_ec_glamour_payload, parse_equipinfo_text_payload
except ImportError:
    from adapters.ec_scraper import EC_ALLOWED_HOST, fetch_ec_html
    from resolve_chara import DEFAULT_LOCALE, resolve_chara
    from services.mapping import (
        DATA_DIR,
        SEARCH_SLOT_LABELS,
        SHARED_CONTRACT,
        get_cached_search_results,
        get_item_catalog,
        get_item_card_equipment_records,
        get_mapping,
        get_slot_search_records,
        item_matches_equipment_slot,
        put_cached_search_results,
    )
    from services.risingstones import (
        extract_risingstones_glamour_ids,
        humanize_risingstones_error,
        parse_rs_glamour_payload,
        read_risingstones_details,
    )
    from services.search import search_records, should_search_english_fallback
    from services.text_import import parse_ec_glamour_payload, parse_equipinfo_text_payload

BASE_DIR = DATA_DIR.parent
UI_LOCALIZATION_PATH = DATA_DIR / "ui-localization.json"
ICON_BASE_URL = os.environ.get(
    "NSGLAMOUR_ICON_BASE_URL",
    "https://img.nightingalesilence.com/ui/icon",
).rstrip("/")
ICON_MAX_BYTES = 512 * 1024
ICON_CACHE_DIR = Path(os.environ.get("NSGLAMOUR_ICON_CACHE_DIR", str(BASE_DIR / ".runtime" / "icon-cache")))
ENABLE_CHARA_IMPORT = os.environ.get("NSGLAMOUR_ENABLE_CHARA_IMPORT", "1").lower() not in {"0", "false", "no"}
INCLUDE_DEBUG_ERRORS = os.environ.get("NSGLAMOUR_DEBUG_ERRORS", "").lower() in {"1", "true", "yes", "on"}

# /api/import-glamour-link 防护：外部请求慢（EC 最多 4×12s、石之家 45s），
# 需要限流 + 并发闸门，避免少量慢请求拖死 worker
IMPORT_LINK_MAX_URL_LENGTH = 512
IMPORT_LINK_MAX_ID_LENGTH = 20
IMPORT_LINK_RATE_LIMIT_COUNT = max(1, int(os.environ.get("NSGLAMOUR_IMPORT_RATE_LIMIT_COUNT", "10")))
IMPORT_LINK_RATE_LIMIT_WINDOW_SECONDS = max(1, int(os.environ.get("NSGLAMOUR_IMPORT_RATE_LIMIT_WINDOW", "60")))
IMPORT_LINK_MAX_CONCURRENT = max(1, int(os.environ.get("NSGLAMOUR_IMPORT_MAX_CONCURRENT", "2")))
IMPORT_LINK_QUEUE_TIMEOUT_SECONDS = 5

_import_link_semaphore = threading.BoundedSemaphore(IMPORT_LINK_MAX_CONCURRENT)
_import_link_rate_lock = threading.Lock()
_import_link_request_log: Dict[str, List[float]] = {}

api_bp = Blueprint("glamour_api", __name__)


def check_import_link_rate_limit(key: str) -> bool:
    """每 IP 滑动窗口限流，返回 True 表示放行。"""
    now = time.monotonic()
    window_start = now - IMPORT_LINK_RATE_LIMIT_WINDOW_SECONDS
    with _import_link_rate_lock:
        timestamps = [ts for ts in _import_link_request_log.get(key, []) if ts > window_start]
        if len(timestamps) >= IMPORT_LINK_RATE_LIMIT_COUNT:
            _import_link_request_log[key] = timestamps
            return False
        timestamps.append(now)
        _import_link_request_log[key] = timestamps
        # 防止 key 无限增长：定期清理窗口外已无记录的 IP
        if len(_import_link_request_log) > 4096:
            for stale_key in [k for k, v in _import_link_request_log.items() if not v or v[-1] <= window_start]:
                _import_link_request_log.pop(stale_key, None)
        return True


def is_local_request() -> bool:
    return request.remote_addr in {"127.0.0.1", "::1"}


def is_chara_import_authorized() -> bool:
    return ENABLE_CHARA_IMPORT


def chara_import_error_response():
    return jsonify({"error": "chara import disabled"}), 404


def require_chara_import_access():
    if is_chara_import_authorized():
        return None
    return chara_import_error_response()


def resolve_chara_payload(chara: Dict[str, Any], filename: str) -> Dict[str, Any]:
    resolved = resolve_chara(chara, get_mapping())
    resolved["source_name"] = filename
    return resolved


def risingstones_error_response(error: Any, status: int = 502):
    message = humanize_risingstones_error(error)
    raw_message = str(error or "").strip()
    payload = {"error": message}
    if INCLUDE_DEBUG_ERRORS and raw_message and raw_message != message:
        payload["debug_error"] = raw_message
    return jsonify(payload), status


@api_bp.get("/api/health")
def health():
    return jsonify({"ok": True})


@api_bp.get("/api/ui-localization")
def ui_localization():
    if not UI_LOCALIZATION_PATH.exists():
        abort(404)
    response = send_file(UI_LOCALIZATION_PATH, mimetype="application/json")
    response.headers["Cache-Control"] = "no-store"
    return response


@api_bp.post("/api/import-glamour-link")
def import_glamour_link():
    if not _import_link_semaphore.acquire(timeout=IMPORT_LINK_QUEUE_TIMEOUT_SECONDS):
        return jsonify({"error": "导入服务繁忙，请稍后重试"}), 503

    @after_this_request
    def _release_import_link_slot(response):
        _import_link_semaphore.release()
        return response

    if not check_import_link_rate_limit(request.remote_addr or "unknown"):
        return jsonify({"error": "请求过于频繁，请稍后再试"}), 429

    payload = request.get_json(silent=True, cache=True) or {}
    raw_url = str(payload.get("url", "") or payload.get("target", "")).strip()
    if raw_url and not re.match(r"^[a-z][a-z0-9+.-]*://", raw_url, flags=re.IGNORECASE):
        raw_url = f"https://{raw_url}"
    if len(raw_url) > IMPORT_LINK_MAX_URL_LENGTH:
        return jsonify({"error": "链接过长，请直接粘贴幻化详情页链接"}), 400
    try:
        parsed_url = urllib.parse.urlparse(raw_url)
        host = parsed_url.hostname or ""
    except Exception:
        host = ""

    if host == EC_ALLOWED_HOST:
        try:
            document, final_url = fetch_ec_html(raw_url)
            return jsonify(parse_ec_glamour_payload(document, final_url, get_mapping()))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    if host == "ff14risingstones.web.sdo.com":
        ids = extract_risingstones_glamour_ids(raw_url)
        if any(len(detail_id) > IMPORT_LINK_MAX_ID_LENGTH for detail_id in ids):
            return jsonify({"error": "石之家详情 ID 无效"}), 400
        if not ids:
            return jsonify({"error": "没有识别到石之家详情 ID"}), 400
        if len(ids) > 1:
            return jsonify({"error": "一次只能载入一条石之家幻化链接"}), 400
        try:
            result = read_risingstones_details(ids)
        except ValueError as exc:
            return risingstones_error_response(exc, 400)
        except RuntimeError as exc:
            return risingstones_error_response(exc, 502)
        details = [detail for detail in (result.get("details") or []) if isinstance(detail, dict)]
        if not details:
            failures = result.get("failures") if isinstance(result.get("failures"), list) else []
            message = failures[0].get("message") if failures and isinstance(failures[0], dict) else ""
            return risingstones_error_response(message or "没有读到石之家幻化详情", 502)
        try:
            return jsonify(parse_rs_glamour_payload(details[0], get_mapping()))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    return jsonify({"error": "无法识别，请输入石之家或 Eorzea Collection 链接"}), 400


@api_bp.post("/api/equipinfo/parse-text")
def equipinfo_parse_text():
    payload = request.get_json(silent=True, cache=True) or {}
    text = str(payload.get("text", "") or "").strip()
    source_locale = str(payload.get("source_locale", "") or payload.get("locale", "") or DEFAULT_LOCALE).strip()
    if not text:
        return jsonify({"error": "请输入装备文字"}), 400
    if len(text) > 20000:
        return jsonify({"error": "文本过长，一次最多 20000 字"}), 413
    try:
        return jsonify(parse_equipinfo_text_payload(text, source_locale, get_mapping()))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@api_bp.get("/api/icon/<int:icon_id>")
def icon(icon_id: int):
    if icon_id <= 0:
        abort(404)

    icon_name = str(icon_id).zfill(6)
    folder = f"{icon_name[:3]}000"
    cache_dir = ICON_CACHE_DIR / folder
    folder_id = int(folder)
    icon_contract = SHARED_CONTRACT["itemIcon"]
    hd_folder_min = int(icon_contract["hdFolderMin"])
    hd_folder_max = int(icon_contract["hdFolderMaxExclusive"])
    hd_folder_extra = [int(value) for value in icon_contract["hdFolderExtra"]]
    suffixes = (
        ("hd", "hr1")
        if hd_folder_min <= folder_id < hd_folder_max or folder_id in hd_folder_extra
        else ("hr1",)
    )
    invalid_upstream_response = False

    # Check HD before an existing HR1 cache so warm deployments upgrade automatically.
    for suffix in suffixes:
        cache_path = cache_dir / f"{icon_name}_{suffix}.png"
        if cache_path.is_file():
            return send_file(cache_path, mimetype="image/png")

        icon_url = f"{ICON_BASE_URL}/{folder}/{icon_name}_{suffix}.png"
        try:
            with urllib.request.urlopen(icon_url, timeout=8) as response:
                data = response.read(ICON_MAX_BYTES + 1)
        except (urllib.error.URLError, TimeoutError):
            continue
        if len(data) > ICON_MAX_BYTES or not data.startswith(b"\x89PNG\r\n\x1a\n"):
            invalid_upstream_response = True
            continue

        temp_path = cache_path.with_suffix(f".{secrets.token_hex(6)}.tmp")
        try:
            cache_dir.mkdir(parents=True, exist_ok=True)
            temp_path.write_bytes(data)
            os.replace(temp_path, cache_path)
        except OSError:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                pass

        return send_file(BytesIO(data), mimetype="image/png")

    abort(502 if invalid_upstream_response else 404)


@api_bp.get("/api/stains")
def stains():
    locale = request.args.get("locale", "zh").strip() or "zh"
    query = request.args.get("q", "").strip().casefold()
    mapping = get_mapping()
    stains_by_locale = mapping.get("stains_by_locale") or {}
    fallback_stains = stains_by_locale.get("zh", {})
    locale_stains = stains_by_locale.get(locale) or fallback_stains
    colors = mapping.get("stain_colors") or {}
    group_labels = mapping.get("stain_groups") or {}
    allow_en_fallback = should_search_english_fallback(query, locale)

    results = []
    for key, color in sorted(
        colors.items(),
        key=lambda item: (
            int(item[1].get("group", 0) or 0),
            int(item[1].get("sub_order", 0) or 0),
            int(item[0]),
        ),
    ):
        name = locale_stains.get(key) or fallback_stains.get(key)
        if not name:
            continue
        group = int(color.get("group", 0) or 0)
        group_name = group_labels.get(str(group), f"分组 {group}" if group else "")
        # Only search current locale name + English fallback — not all languages
        searchable_parts = [key, color.get("hex", ""), group, group_name, str(name).casefold()]
        en_stains = stains_by_locale.get("en", {})
        if allow_en_fallback and en_stains.get(key) and en_stains.get(key) != name:
            searchable_parts.append(str(en_stains.get(key)).casefold())
        searchable = " ".join(str(part).casefold() for part in searchable_parts)
        if query and query not in searchable:
            continue
        results.append(
            {
                "id": int(key),
                "name": name,
                "names": {
                    stain_locale: stain_map.get(key)
                    for stain_locale, stain_map in stains_by_locale.items()
                    if isinstance(stain_map, dict) and stain_map.get(key)
                },
                "hex": color.get("hex", "#000000"),
                "rgb": color.get("rgb", 0),
                "group": group,
                "group_name": group_name,
                "sub_order": int(color.get("sub_order", 0) or 0),
            }
        )

    return jsonify({"locale": locale, "results": results})


@api_bp.get("/api/search-items")
def search_items():
    slot = request.args.get("slot", "").strip()
    query = request.args.get("q", "").strip().casefold()
    locale = request.args.get("locale", "zh").strip() or "zh"
    try:
        limit = max(1, min(int(request.args.get("limit", "30")), 80))
    except ValueError:
        limit = 30

    if not query:
        return jsonify({"slot": slot, "results": []})

    mapping = get_mapping()
    cache_key = (slot, query, locale, limit)
    cached_results = get_cached_search_results(cache_key)
    if cached_results is not None:
        return jsonify({"slot": slot, "results": cached_results})

    records = get_slot_search_records(mapping, slot)
    results = search_records(records, query, locale, limit)
    put_cached_search_results(cache_key, results)
    return jsonify({"slot": slot, "results": results})

    # NOTE: 以下分支为迁移遗留死代码（return 之后的不可达分支），
    # 保持原样搬移以便行为比对；后续经确认后可删除。
    if slot == "FashionAccessory":
        records = list((mapping.get("ornaments") or {}).values())
        return jsonify({"slot": slot, "results": search_records(records, query, locale, limit)})

    slot_label = SEARCH_SLOT_LABELS.get(slot)
    if not slot_label:
        return jsonify({"slot": slot, "results": []})

    records = [
        item
        for item in mapping.get("items", [])
        if item_matches_equipment_slot(item, slot)
    ]
    return jsonify({"slot": slot, "results": search_records(records, query, locale, limit)})


@api_bp.get("/api/search-catalog-items")
def search_catalog_items():
    query = request.args.get("q", "").strip()
    locale = request.args.get("locale", "zh").strip() or "zh"
    category = request.args.get("category", "all").strip().lower() or "all"
    try:
        limit = max(1, min(int(request.args.get("limit", "20")), 40))
    except ValueError:
        limit = 20

    if not query:
        return jsonify({"results": []})

    if category not in {"all", "equipment", "facewear", "fashion", "other", "furniture", "mount"}:
        return jsonify({"error": "invalid item category"}), 400

    if category in {"equipment", "facewear", "fashion"}:
        mapping = get_mapping()
        cache_key = (f"__item_card_{category}__", query.casefold(), locale, limit)
        cached_results = get_cached_search_results(cache_key)
        if cached_results is not None:
            return jsonify({"results": cached_results})
        records = get_item_card_equipment_records(mapping, category)
        results = search_records(records, query.casefold(), locale, limit)
        put_cached_search_results(cache_key, results)
        return jsonify({"results": results})

    try:
        results = get_item_catalog().search(query, locale, limit, category=category)
    except (OSError, sqlite3.Error, ValueError):
        return jsonify({"error": "item catalog unavailable"}), 503
    return jsonify({"results": results})


@api_bp.post("/api/parse-chara")
def parse_chara():
    error = require_chara_import_access()
    if error:
        return error

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "missing file"}), 400

    filename = file.filename or ""
    if not filename.lower().endswith(".chara"):
        return jsonify({"error": "invalid file type"}), 400

    data = file.stream.read(current_app.config["MAX_CONTENT_LENGTH"] + 1)
    if len(data) > current_app.config["MAX_CONTENT_LENGTH"]:
        return jsonify({"error": "file too large"}), 413

    try:
        chara = json.loads(data.decode("utf-8-sig"))
    except Exception as exc:
        return jsonify({"error": f"failed to parse file: {exc}"}), 400

    return jsonify(resolve_chara_payload(chara, filename))
