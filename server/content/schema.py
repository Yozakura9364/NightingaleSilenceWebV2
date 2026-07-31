"""Document validator — enforces editor-document.schema.json via jsonschema.Draft202012Validator."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from jsonschema import Draft202012Validator, ValidationError as JsonschemaError

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_SCHEMA_PATH = _REPO_ROOT / "specs" / "002-rich-content-editor" / "contracts" / "editor-document.schema.json"

MAX_REQUEST_BYTES = 5 * 1024 * 1024
MAX_NODE_COUNT = 10_000
MAX_RECURSION_DEPTH = 50
MAX_TEXT_LENGTH = 500_000
MAX_CONTENT_ITEMS = 5000


class SchemaValidationError(Exception):
    def __init__(self, code: str, message: str, path: str = "", details: Any = None):
        self.code = code; self.message = message; self.path = path; self.details = details
        super().__init__(message)


_schema: dict | None = None
_validator: Draft202012Validator | None = None


def _get_schema() -> dict:
    global _schema
    if _schema is not None:
        return _schema
    if not _SCHEMA_PATH.is_file():
        raise RuntimeError(f"Schema file not found: {_SCHEMA_PATH}")
    with open(_SCHEMA_PATH, "r", encoding="utf-8") as f:
        _schema = json.load(f)
    return _schema


def _get_validator() -> Draft202012Validator:
    global _validator
    if _validator is None:
        _validator = Draft202012Validator(_get_schema())
    return _validator


def count_nodes(obj: Any, depth: int = 0, max_depth: int = MAX_RECURSION_DEPTH) -> int:
    if depth > max_depth:
        raise SchemaValidationError("MAX_DEPTH", f"Depth {depth} exceeds {max_depth}")
    if not isinstance(obj, dict):
        return 0
    c = 1 if "type" in obj else 0
    for v in obj.values():
        if isinstance(v, dict):
            c += count_nodes(v, depth + 1, max_depth)
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    c += count_nodes(item, depth + 1, max_depth)
    return c


def _check_depth(obj, max_depth, depth=0):
    """Pre-check depth before recursion to prevent RecursionError."""
    if depth > max_depth:
        raise SchemaValidationError("MAX_DEPTH", f"Document depth {depth} exceeds {max_depth}")
    if isinstance(obj, dict):
        for v in obj.values():
            _check_depth(v, max_depth, depth + 1)
    elif isinstance(obj, list):
        for item in obj:
            _check_depth(item, max_depth, depth + 1)


def _check_content_items(obj, max_items):
    """Pre-check content array length before schema validation."""
    if isinstance(obj, dict) and obj.get("type") == "doc":
        content = obj.get("content")
        if isinstance(content, list) and len(content) > max_items:
            raise SchemaValidationError("MAX_ITEMS", f"doc content exceeds {max_items} items")

def total_text_length(obj: Any) -> int:
    if isinstance(obj, str):
        return len(obj)
    if not isinstance(obj, dict):
        return 0
    t = len(obj["text"]) if isinstance(obj.get("text"), str) else 0
    for v in obj.values():
        if isinstance(v, dict):
            t += total_text_length(v)
        elif isinstance(v, list):
            for item in v:
                t += total_text_length(item)
    return t


def validate_document_body(
    body: Dict[str, Any],
    *,
    max_bytes: int = MAX_REQUEST_BYTES,
    max_nodes: int = MAX_NODE_COUNT,
    max_depth: int = MAX_RECURSION_DEPTH,
    max_text: int = MAX_TEXT_LENGTH,
    max_content_items: int = MAX_CONTENT_ITEMS,
) -> None:
    """Validate a ContentDocument using the JSON Schema + independent limits."""
    if not isinstance(body, dict):
        raise SchemaValidationError("NOT_OBJECT", "Document must be a JSON object")

    # Depth pre-check: prevent RecursionError from deep nesting BEFORE serialization/schema
    _check_depth(body, max_depth)
    _check_content_items(body, max_content_items)

    # Size check
    raw = json.dumps(body, ensure_ascii=False)
    if len(raw.encode("utf-8")) > max_bytes:
        raise SchemaValidationError("OVERSIZED_BODY", f"Body exceeds {max_bytes} bytes")

    # Schema version
    sv = body.get("schemaVersion")
    if sv != "content.document.v1":
        raise SchemaValidationError(
            "UNKNOWN_VERSION" if sv else "MISSING_SCHEMA_VERSION",
            f"schemaVersion must be 'content.document.v1', got {sv}"
        )

    # JSON Schema validation
    validator = _get_validator()
    schema_errors = list(validator.iter_errors(body))
    if schema_errors:
        first = schema_errors[0]
        path = ".".join(str(p) for p in first.absolute_path)
        raise SchemaValidationError(
            "SCHEMA_ERROR", first.message, path=path,
            details=[{"path": ".".join(str(p) for p in e.absolute_path), "message": e.message}
                      for e in schema_errors[:10]]
        )

    # Independent limits (beyond JSON Schema coverage)
    node_count = count_nodes(body, max_depth=max_depth)
    if node_count > max_nodes:
        raise SchemaValidationError("MAX_NODES", f"{node_count} nodes exceeds {max_nodes}",
                                     details={"max_nodes": max_nodes, "actual": node_count})

    text_len = total_text_length(body)
    if text_len > max_text:
        raise SchemaValidationError("MAX_TEXT_LENGTH", f"{text_len} chars exceeds {max_text}",
                                     details={"max_text": max_text, "actual": text_len})


def validate_document(document_json: str) -> Tuple[bool, Optional[List[Dict[str, Any]]]]:
    try:
        body = json.loads(document_json)
    except json.JSONDecodeError as exc:
        return False, [{"code": "INVALID_JSON", "message": str(exc)}]
    try:
        validate_document_body(body)
        return True, None
    except SchemaValidationError as exc:
        return False, [{"code": exc.code, "message": exc.message, "path": exc.path, "details": exc.details}]
