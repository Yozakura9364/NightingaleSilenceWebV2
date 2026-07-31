"""Content studio helper configuration — loopback-only, per-session token."""
from __future__ import annotations

import os
import secrets

BIND_HOST = "127.0.0.1"
DEFAULT_PORT = 8770

# Request limits
MAX_BODY_BYTES = 5 * 1024 * 1024
MAX_URL_LENGTH = 2048
MAX_HEADER_LENGTH = 8192
ALLOWED_METHODS = frozenset({"GET", "POST", "PATCH", "DELETE"})
ALLOWED_PATH_PREFIX = "/api/content-studio/"


def generate_startup_token() -> str:
    return secrets.token_hex(32)


def _default_token() -> str:
    env_token = os.environ.get("CONTENT_STUDIO_TOKEN", "").strip()
    return env_token if env_token else generate_startup_token()


def _resolve_port() -> int:
    port_str = os.environ.get("CONTENT_STUDIO_PORT", str(DEFAULT_PORT))
    try:
        return int(port_str)
    except ValueError:
        raise ValueError(f"Invalid CONTENT_STUDIO_PORT: {port_str}")


def _build_allowed_hosts(port: int) -> frozenset[str]:
    return frozenset({f"127.0.0.1:{port}", f"localhost:{port}"})


def _build_allowed_origins() -> frozenset[str]:
    return frozenset({
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:4178",
        "http://localhost:4178",
    })


# Initialize resolved values
_resolved_port = _resolve_port()
ALLOWED_HOSTS = _build_allowed_hosts(_resolved_port)
ALLOWED_ORIGINS = _build_allowed_origins()

_startup_token: str | None = None


def get_token() -> str:
    global _startup_token
    if _startup_token is None:
        _startup_token = _default_token()
    return _startup_token


def get_port() -> int:
    return _resolved_port
