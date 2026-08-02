from __future__ import annotations

from functools import wraps
import hmac
import os
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlsplit

from flask import Flask, jsonify, redirect, request

from .storage import ShortLink, ShortLinkConflictError, ShortLinkStore


CODE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")
DEFAULT_DB_PATH = "/var/lib/nightingalesilence-v2/shortlinks/shortlinks.sqlite3"
DEFAULT_PUBLIC_BASE_URL = "https://n9s.site"
DEFAULT_BLOCKED_HOSTS = {
    "n9s.site",
    "www.n9s.site",
    "nsffxiv.com",
    "www.nsffxiv.com",
    "nightingalesilence.com",
    "www.nightingalesilence.com",
}


def normalize_code(value: object) -> str:
    code = str(value or "").strip().lower()
    if not CODE_PATTERN.fullmatch(code):
        raise ValueError("short code must contain 1-32 lowercase letters, numbers, _ or -")
    return code


def validate_target_url(value: object, *, blocked_hosts: set[str]) -> str:
    target_url = str(value or "").strip()
    if (
        not target_url
        or len(target_url) > 2048
        or any(char.isspace() or unicodedata.category(char).startswith("C") for char in target_url)
    ):
        raise ValueError("invalid target URL")
    try:
        parsed = urlsplit(target_url)
        hostname = (parsed.hostname or "").lower()
    except ValueError as error:
        raise ValueError("invalid target URL") from error
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or not hostname:
        raise ValueError("target URL must use http or https")
    try:
        parsed.port
    except ValueError as error:
        raise ValueError("invalid target URL") from error
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("target URL must not contain credentials")
    if hostname in blocked_hosts and parsed.path.startswith("/s/"):
        raise ValueError("short links cannot redirect to another local short link")
    return target_url


def _read_secret(*, value: str, file_path: str) -> str:
    if value.strip():
        return value.strip()
    if file_path.strip():
        return Path(file_path).read_text(encoding="utf-8").strip()
    return ""


def _serialize_link(link: ShortLink, public_base_url: str) -> dict[str, object]:
    return {
        "code": link.code,
        "target_url": link.target_url,
        "short_url": f"{public_base_url.rstrip('/')}/s/{link.code}",
        "enabled": link.enabled,
        "created_at": link.created_at,
        "updated_at": link.updated_at,
    }


def create_app(config: dict[str, object] | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.update(
        SHORTLINK_DB_PATH=os.environ.get("NS_SHORTLINK_DB_PATH", DEFAULT_DB_PATH),
        SHORTLINK_PUBLIC_BASE_URL=os.environ.get(
            "NS_SHORTLINK_PUBLIC_BASE_URL", DEFAULT_PUBLIC_BASE_URL
        ),
        SHORTLINK_API_TOKEN=os.environ.get("NS_SHORTLINK_API_TOKEN", ""),
        SHORTLINK_API_TOKEN_FILE=os.environ.get("NS_SHORTLINK_API_TOKEN_FILE", ""),
        SHORTLINK_BLOCKED_HOSTS=os.environ.get(
            "NS_SHORTLINK_BLOCKED_HOSTS", ",".join(sorted(DEFAULT_BLOCKED_HOSTS))
        ),
        JSON_AS_ASCII=False,
    )
    if config:
        app.config.update(config)

    store = ShortLinkStore(Path(str(app.config["SHORTLINK_DB_PATH"])))
    app.extensions["shortlink_store"] = store
    api_token = _read_secret(
        value=str(app.config.get("SHORTLINK_API_TOKEN", "")),
        file_path=str(app.config.get("SHORTLINK_API_TOKEN_FILE", "")),
    )
    public_base_url = str(app.config["SHORTLINK_PUBLIC_BASE_URL"]).rstrip("/")
    blocked_hosts = {
        item.strip().lower()
        for item in str(app.config["SHORTLINK_BLOCKED_HOSTS"]).split(",")
        if item.strip()
    }

    def require_api_token(handler):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            if not api_token:
                return jsonify({"error": "management API is not configured"}), 503
            authorization = request.headers.get("Authorization", "")
            supplied = authorization[len("Bearer ") :].strip() if authorization.startswith("Bearer ") else ""
            if not supplied or not hmac.compare_digest(supplied, api_token):
                return jsonify({"error": "unauthorized"}), 401
            return handler(*args, **kwargs)

        return wrapped

    @app.after_request
    def add_response_headers(response):
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
        return response

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    @app.get("/s/<code>")
    def follow_short_link(code: str):
        try:
            normalized_code = normalize_code(code)
        except ValueError:
            return jsonify({"error": "not found"}), 404
        link = store.get(normalized_code)
        if not link:
            return jsonify({"error": "not found"}), 404
        return redirect(link.target_url, code=302)

    @app.get("/internal/short-links")
    @require_api_token
    def list_short_links():
        try:
            limit = int(request.args.get("limit", "100"))
        except ValueError:
            limit = 100
        return jsonify(
            {
                "links": [
                    _serialize_link(link, public_base_url) for link in store.list(limit=limit)
                ]
            }
        )

    @app.post("/internal/short-links")
    @require_api_token
    def create_short_link():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "JSON object required"}), 400
        try:
            target_url = validate_target_url(payload.get("target_url"), blocked_hosts=blocked_hosts)
            code = normalize_code(payload["code"]) if payload.get("code") else None
            link = store.create(target_url=target_url, code=code)
        except ShortLinkConflictError as error:
            return jsonify({"error": str(error)}), 409
        except ValueError as error:
            return jsonify({"error": str(error)}), 400
        return jsonify(_serialize_link(link, public_base_url)), 201

    @app.patch("/internal/short-links/<code>")
    @require_api_token
    def update_short_link(code: str):
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "JSON object required"}), 400
        try:
            normalized_code = normalize_code(code)
            target_url = (
                validate_target_url(payload.get("target_url"), blocked_hosts=blocked_hosts)
                if "target_url" in payload
                else None
            )
            enabled = payload.get("enabled") if "enabled" in payload else None
            if enabled is not None and not isinstance(enabled, bool):
                raise ValueError("enabled must be a boolean")
            if target_url is None and enabled is None:
                raise ValueError("nothing to update")
        except ValueError as error:
            return jsonify({"error": str(error)}), 400
        link = store.update(normalized_code, target_url=target_url, enabled=enabled)
        if not link:
            return jsonify({"error": "not found"}), 404
        return jsonify(_serialize_link(link, public_base_url))

    @app.delete("/internal/short-links/<code>")
    @require_api_token
    def delete_short_link(code: str):
        try:
            normalized_code = normalize_code(code)
        except ValueError:
            return jsonify({"error": "not found"}), 404
        if not store.delete(normalized_code):
            return jsonify({"error": "not found"}), 404
        return "", 204

    return app


def main() -> int:
    host = os.environ.get("NS_SHORTLINK_HOST", "127.0.0.1")
    port = int(os.environ.get("NS_SHORTLINK_PORT", "18768"))
    create_app().run(host=host, port=port, debug=False, use_reloader=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
