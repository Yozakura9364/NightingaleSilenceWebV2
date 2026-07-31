"""Security boundary — enforces token, Host, Origin, method, path, and size limits."""
from __future__ import annotations

import hmac
from functools import wraps
from typing import Any, Callable, Dict, Optional

from flask import Response, jsonify, request

from . import config


def _safe_compare(a: str, b: str) -> bool:
    """Constant-time string comparison for tokens."""
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def _is_allowed_origin(origin: Optional[str]) -> bool:
    """Check if the Origin header is in the allowlist."""
    if not origin:
        return False
    return origin in config.ALLOWED_ORIGINS


def _is_allowed_host(host: Optional[str]) -> bool:
    """Check if the Host header is in the allowlist."""
    if not host:
        return False
    return host in config.ALLOWED_HOSTS


def check_token() -> Optional[Response]:
    """Validate the Studio-Token header. Returns None if valid, error Response if not."""
    token = request.headers.get("X-Content-Studio-Token", "")
    if not token or not _safe_compare(token, config.get_token()):
        return jsonify({
            "error": {"code": "UNAUTHORIZED", "message": "Valid Studio-Token header is required"}
        }), 401
    return None


def check_host() -> Optional[Response]:
    """Validate the Host header. Returns None if valid, error Response if not."""
    host = request.headers.get("Host", "")
    if not _is_allowed_host(host):
        return jsonify({
            "error": {"code": "FORBIDDEN", "message": "Invalid Host header"}
        }), 403
    return None


def check_origin() -> Optional[Response]:
    """Validate the Origin header for state-changing requests. Returns None if valid."""
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return None
    origin = request.headers.get("Origin", "")
    if not _is_allowed_origin(origin):
        return jsonify({
            "error": {"code": "FORBIDDEN", "message": "Invalid or missing Origin header"}
        }), 403
    return None


def check_method() -> Optional[Response]:
    """Validate the HTTP method. Returns None if allowed."""
    if request.method not in config.ALLOWED_METHODS:
        return jsonify({
            "error": {"code": "METHOD_NOT_ALLOWED", "message": f"Method {request.method} not allowed"}
        }), 405
    return None


def check_path() -> Optional[Response]:
    """Validate the request path against the allowlist prefix."""
    path = request.path
    if not path.startswith(config.ALLOWED_PATH_PREFIX):
        return jsonify({
            "error": {"code": "NOT_FOUND", "message": "Not found"}
        }), 404
    if ".." in path:
        return jsonify({
            "error": {"code": "FORBIDDEN", "message": "Invalid request path"}
        }), 403
    return None


def check_body_size() -> Optional[Response]:
    """Validate request body size using Flask's MAX_CONTENT_LENGTH."""
    # Flask raises 413 automatically if MAX_CONTENT_LENGTH is set.
    # This function exists for explicit testing and defense-in-depth.
    content_length = request.content_length
    if content_length is not None:
        if content_length > config.MAX_BODY_BYTES:
            return jsonify({
                "error": {"code": "BODY_TOO_LARGE", "message": f"Body exceeds {config.MAX_BODY_BYTES} bytes"}
            }), 413
    # When content_length is None (chunked), body size is limited by
    # Flask's MAX_CONTENT_LENGTH config at app level.
    return None


def check_url_length() -> Optional[Response]:
    """Validate the request URL length."""
    if len(request.url) > config.MAX_URL_LENGTH:
        return jsonify({
            "error": {"code": "URL_TOO_LONG", "message": f"URL exceeds {config.MAX_URL_LENGTH} characters"}
        }), 414
    return None


def require_security(f: Callable) -> Callable:
    """Decorator that applies all security checks to a route."""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        # Order: method -> path -> host -> origin -> body size -> token
        for check in [check_method, check_path, check_url_length, check_host, check_body_size, check_token, check_origin]:
            result = check()
            if result is not None:
                return result
        return f(*args, **kwargs)

    return wrapper
