"""Safe error responses — no stack traces, paths, tokens, or request bodies."""
from __future__ import annotations

from typing import Any, Dict, Optional

from flask import jsonify


class ContentStudioError(Exception):
    """Base exception with structured error code."""

    def __init__(self, code: str, message: str, details: Any = None, status: int = 400):
        self.code = code
        self.message = message
        self.details = details
        self.status = status
        super().__init__(message)


def make_error_response(code: str, message: str, details: Any = None, status: int = 400) -> tuple:
    """Build a consistent error response dict."""
    body: Dict[str, Any] = {
        "error": {"code": code, "message": message}
    }
    if details is not None:
        body["error"]["details"] = details
    return jsonify(body), status


# Convenience error builders
def bad_request(code: str, message: str, details: Any = None) -> tuple:
    return make_error_response(code, message, details, 400)


def unauthorized(message: str = "Unauthorized") -> tuple:
    return make_error_response("UNAUTHORIZED", message, status=401)


def forbidden(message: str = "Forbidden") -> tuple:
    return make_error_response("FORBIDDEN", message, status=403)


def not_found(message: str = "Not found") -> tuple:
    return make_error_response("NOT_FOUND", message, status=404)


def method_not_allowed(message: str = "Method not allowed") -> tuple:
    return make_error_response("METHOD_NOT_ALLOWED", message, status=405)


def conflict(code: str, message: str, details: Any = None) -> tuple:
    return make_error_response(code, message, details, 409)


def body_too_large(message: str = "Request body too large") -> tuple:
    return make_error_response("BODY_TOO_LARGE", message, status=413)


def unsupported_media_type(message: str = "Unsupported Media Type") -> tuple:
    return make_error_response("UNSUPPORTED_MEDIA_TYPE", message, status=415)


def validation_error(code: str, message: str, details: Any = None) -> tuple:
    return make_error_response(code, message, details, 422)


def internal_error(message: str = "Internal server error") -> tuple:
    return make_error_response("INTERNAL_ERROR", message, status=500)
