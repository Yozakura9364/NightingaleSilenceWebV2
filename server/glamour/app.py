import os
from pathlib import Path

from flask import Flask, request
from werkzeug.middleware.proxy_fix import ProxyFix

BASE_DIR = Path(__file__).resolve().parent


def load_local_env_file(path: Path) -> None:
    if not path.is_file():
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ[key] = value


load_local_env_file(BASE_DIR / ".env.local")

try:
    from .routes.api import api_bp
    from .routes.web import web_bp
except ImportError:
    from routes.api import api_bp
    from routes.web import web_bp

MAX_CHARA_UPLOAD_MB = max(1, int(os.environ.get("NSGLAMOUR_MAX_CHARA_UPLOAD_MB", "5")))
BASE_PATH = os.environ.get("NSGLAMOUR_BASE_PATH", "").strip().rstrip("/")
if BASE_PATH and not BASE_PATH.startswith("/"):
    BASE_PATH = f"/{BASE_PATH}"
ICON_CACHE_SECONDS = 7 * 24 * 60 * 60
REFERENCE_DATA_CACHE_SECONDS = 60 * 60


class BasePathMiddleware:
    def __init__(self, wsgi_app, base_path: str):
        self.wsgi_app = wsgi_app
        self.base_path = base_path

    def __call__(self, environ, start_response):
        if self.base_path:
            environ["SCRIPT_NAME"] = self.base_path

        path_info = environ.get("PATH_INFO", "")
        if path_info == self.base_path:
            environ["PATH_INFO"] = "/"
        elif path_info.startswith(f"{self.base_path}/"):
            environ["PATH_INFO"] = path_info[len(self.base_path) :] or "/"

        return self.wsgi_app(environ, start_response)


app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_CHARA_UPLOAD_MB * 1024 * 1024
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
if BASE_PATH:
    app.wsgi_app = BasePathMiddleware(app.wsgi_app, BASE_PATH)

app.register_blueprint(api_bp)
app.register_blueprint(web_bp)


@app.after_request
def add_no_cache_headers(response):
    is_cacheable_response = 200 <= response.status_code < 400
    if is_cacheable_response and request.path.startswith("/api/icon/"):
        response.headers["Cache-Control"] = f"public, max-age={ICON_CACHE_SECONDS}"
        response.headers.pop("Pragma", None)
        response.headers.pop("Expires", None)
    elif is_cacheable_response and request.path.startswith("/api/stains"):
        response.headers["Cache-Control"] = f"public, max-age={REFERENCE_DATA_CACHE_SECONDS}"
        response.headers.pop("Pragma", None)
        response.headers.pop("Expires", None)
    else:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    script_src = "script-src 'self' 'unsafe-inline'"
    connect_src = "connect-src 'self'"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "object-src 'none'; "
        "frame-ancestors 'self'; "
        "form-action 'self'; "
        "img-src 'self' data: blob:; "
        "font-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        f"{script_src}; "
        f"{connect_src}"
    )
    return response


def main() -> int:
    port = int(os.environ.get("NSGLAMOUR_PORT", "8766"))
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
