"""站点级 Web 路由：根索引与 robots.txt。"""

from flask import Blueprint, jsonify

web_bp = Blueprint("glamour_web", __name__)


@web_bp.get("/robots.txt")
def robots_txt():
    return """User-agent: *
Disallow: /
""", {"Content-Type": "text/plain"}


@web_bp.get("/")
def index():
    return jsonify({"service": "nsglamour-api", "ok": True})
