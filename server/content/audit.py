"""Minimal append-only audit log — T037 [US2].

Records only operational facts: action, entry id, publicId, result,
revision, time and an optional machine-readable reason code.
NEVER writes document text, tokens, request bodies or absolute paths.
"""
from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

_R = Path(__file__).resolve().parent.parent.parent
AUDIT_DIR = _R / "local-assets" / "content-studio" / "audit"

ALLOWED_ACTIONS = frozenset({"PUBLISH", "WITHDRAW", "ARCHIVE", "RESTORE"})
ALLOWED_RESULTS = frozenset({"SUCCESS", "FAILURE"})


def _ens():
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)


def record(*, entry_id, action, result, revision=None, public_id=None, reason_code=None):
    """Append one audit event. Audit failure never blocks the business flow;
    it is reported to stderr so the operation outcome is not falsified."""
    if action not in ALLOWED_ACTIONS:
        raise ValueError(f"unknown audit action: {action}")
    if result not in ALLOWED_RESULTS:
        raise ValueError(f"unknown audit result: {result}")
    event = {
        "id": str(uuid.uuid4()),
        "entryId": entry_id,
        "action": action,
        "result": result,
        "revision": revision,
        "publicId": public_id,
        "reasonCode": reason_code,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    try:
        _ens()
        with open(AUDIT_DIR / "audit.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
    except OSError:
        print(f"[content-studio] audit write failed: {action} {entry_id}", file=sys.stderr)
