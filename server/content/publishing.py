"""Publication service — T036 [US2].

Publish an immutable snapshot of a validated draft into the tracked
`content/published/` directory (temporary file + atomic replace), and
manage withdraw / archive / restore state transitions.

Validation reuses the existing schema / storage / media-CDN modules as
the single source of truth; it never re-implements validators.
"""
from __future__ import annotations

import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import schema, storage, media
from .audit import record

_R = Path(__file__).resolve().parent.parent.parent
PUBLISHED_DIR = _R / "content" / "published"
SNAPSHOT_SCHEMA_VERSION = "content.publication.v1"
PUBLIC_ENTRIES_PREFIX = "/data/content/entries/"


class PublicationError(Exception):
    """Validation failure → HTTP 422."""

    def __init__(self, code: str, message: str, details: Any = None):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class PublicationConflictError(Exception):
    """State or optimistic-revision conflict → HTTP 409."""

    def __init__(self, code: str, message: str, current: Optional[int] = None):
        self.code = code
        self.message = message
        self.current = current
        super().__init__(message)


class PublicationNotFoundError(Exception):
    """No active publication exists → HTTP 404."""


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _snapshot_path(public_id: int) -> Path:
    return PUBLISHED_DIR / f"{public_id}.json"


def _collect_media_refs(doc: Dict[str, Any], cover_media_id: Optional[str]) -> List[str]:
    """Collect every mediaId referenced by the document (image nodes inside
    galleries included) plus the optional cover. Duplicates are removed."""
    refs: List[str] = []

    def walk(n: Any) -> None:
        if not isinstance(n, dict):
            return
        if n.get("type") == "image":
            mid = (n.get("attrs") or {}).get("mediaId")
            if isinstance(mid, str):
                refs.append(mid)
        for v in n.values():
            if isinstance(v, dict):
                walk(v)
            elif isinstance(v, list):
                for item in v:
                    walk(item)

    walk(doc.get("doc", {}))
    if isinstance(cover_media_id, str):
        refs.append(cover_media_id)
    return list(dict.fromkeys(refs))


def _validate_metadata(entry: Dict[str, Any]) -> None:
    title = entry.get("title")
    if not isinstance(title, str) or not title.strip():
        raise PublicationError("METADATA_INVALID", "title must be a non-empty string")
    if len(title) > 120:
        raise PublicationError("METADATA_INVALID", "title max 120 chars")
    meta = entry.get("metadata") or {}
    summary = meta.get("summary")
    if summary is not None and (not isinstance(summary, str) or len(summary) > 300):
        raise PublicationError("METADATA_INVALID", "summary max 300 chars")
    tags = meta.get("tags")
    if not isinstance(tags, list) or len(tags) > 10:
        raise PublicationError("METADATA_INVALID", "tags max 10")
    for t in tags:
        if not isinstance(t, str) or len(t) < 1 or len(t) > 30:
            raise PublicationError("METADATA_INVALID", "each tag 1-30 chars")


def _validate_document(entry: Dict[str, Any]) -> None:
    doc = entry.get("document")
    if not isinstance(doc, dict):
        raise PublicationError("DOCUMENT_INVALID", "document is missing")
    try:
        schema.validate_document_body(doc)
    except schema.SchemaValidationError as e:
        raise PublicationError(e.code, e.message, getattr(e, "path", ""))
    content = (doc.get("doc") or {}).get("content")
    if not isinstance(content, list) or len(content) == 0:
        raise PublicationError("EMPTY_DOCUMENT", "document must contain body content")


def _validate_media(media_id: str) -> None:
    obj = media.get_media(media_id)
    if not obj:
        raise PublicationError("MEDIA_NOT_FOUND", f"referenced media {media_id} does not exist")
    if obj.get("status") != "REMOTE_VERIFIED":
        raise PublicationError("MEDIA_NOT_VERIFIED", "media must pass the remote check before publishing")
    url = obj.get("publicUrl") or ""
    if not url.startswith(media.PUBLIC_BASE_URL):
        raise PublicationError("MEDIA_URL_UNSTABLE", "media URL must be a stable HTTPS URL on the configured host")
    if not obj.get("publiclyReadable"):
        raise PublicationError("MEDIA_NOT_PUBLIC", "media is not publicly readable")


def _snapshot_hash(snap: Dict[str, Any]) -> str:
    payload = {k: v for k, v in snap.items() if k != "generationHash"}
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def _build_snapshot(entry: Dict[str, Any]) -> Dict[str, Any]:
    meta = entry.get("metadata") or {}
    refs = _collect_media_refs(entry["document"], meta.get("coverMediaId"))
    snap: Dict[str, Any] = {
        "schemaVersion": SNAPSHOT_SCHEMA_VERSION,
        "entryId": entry["id"],
        "publicId": entry["publicId"],
        "revision": entry["revision"],
        "publishedAt": _ts(),
        "publicPath": f"{PUBLIC_ENTRIES_PREFIX}{entry['publicId']}.json",
        "metadata": meta,
        "document": entry["document"],
        "media": [media.get_media(m) for m in refs],
    }
    snap["generationHash"] = _snapshot_hash(snap)
    return snap


def _atomic_move(src: Path, dst: Path, attempts: int = 5, delay: float = 0.05) -> None:
    """os.replace with bounded backoff retry. Windows file locks (AV scans /
    leaked handles) are transient; a short retry avoids spurious 500s.
    Raises the last OSError once attempts are exhausted; on failure the
    source stays in place and the destination is untouched."""
    last: Optional[OSError] = None
    for i in range(attempts):
        try:
            os.replace(src, dst)
            return
        except OSError as e:
            last = e
            time.sleep(delay * (i + 1))
    raise last


def _atomic_write(path: Path, text: str) -> None:
    """Write via temporary file then atomic replace; on failure the target
    stays untouched and the temporary file is cleaned up."""
    PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    try:
        tmp.write_text(text, "utf-8")
        _atomic_move(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def _finalize_cleanup(path: Path, entry_id: str, action: str, revision: Any, public_id: Any) -> None:
    """Delete a backup/quarantine artifact after a successful index save.
    Cleanup failure leaves the orphan artifact as recoverable evidence and is
    audited with a safe reason code — never silent."""
    try:
        if path.exists():
            path.unlink()
    except Exception:
        try:
            record(entry_id=entry_id, action=action, result="FAILURE",
                   revision=revision, public_id=public_id,
                   reason_code="ORPHAN_CLEANUP_FAILED")
        except Exception:
            pass


def publish(content_id: str, expected_revision: int) -> Dict[str, Any]:
    """Validate and publish; returns the OpenAPI Publication object."""
    entry = storage.get_entry(content_id)
    if not entry:
        raise FileNotFoundError(content_id)
    if entry["revision"] != expected_revision:
        raise PublicationConflictError("CONFLICT", "expectedRevision mismatch", entry["revision"])
    if entry.get("status") == "ARCHIVED":
        raise PublicationConflictError("STATE_CONFLICT", "archived entries cannot be published", entry.get("revision"))

    _validate_metadata(entry)
    _validate_document(entry)
    refs = _collect_media_refs(entry["document"], (entry.get("metadata") or {}).get("coverMediaId"))
    for mid in refs:
        _validate_media(mid)

    snap_holder: Dict[str, Any] = {}

    def updater(e: Dict[str, Any]) -> Dict[str, Any]:
        # Stage the new snapshot while keeping the old one recoverable.
        # If the index save afterwards fails, rollback() restores the old
        # snapshot (or removes the new one on first publish).
        target = _snapshot_path(e["publicId"])
        backup = target.with_suffix(".bak")
        had_old = target.exists()
        if had_old:
            _atomic_move(target, backup)
        try:
            snap = _build_snapshot(e)
            snap_holder["hash"] = snap["generationHash"]
            _atomic_write(target, json.dumps(snap, ensure_ascii=False, indent=2))
        except Exception as write_err:
            # New snapshot could not be written: restore last-known-good.
            if had_old:
                try:
                    _atomic_move(backup, target)
                except Exception:
                    # Restore failed too — old bytes remain only in .bak.
                    # Surface an explicit recovery state (never a plain
                    # INTERNAL_ERROR) so callers/checker know recovery is needed.
                    raise storage.RecoveryError(
                        "SNAPSHOT_RECOVERY_FAILED",
                        "snapshot write failed and recovery could not restore last-known-good",
                    ) from write_err
            raise
        e["status"] = "PUBLISHED"
        e["publishedAt"] = snap["publishedAt"]

        def rollback():
            # Must NOT swallow: if this raises, update_entry converts it into
            # RecoveryError so callers/checker see an explicit failure state.
            if target.exists():
                target.unlink()
            if had_old:
                _atomic_move(backup, target)

        def commit():
            _finalize_cleanup(backup, e["id"], "PUBLISH", e["revision"], e["publicId"])

        return {"rollback": rollback, "commit": commit}

    updated = storage.update_entry(content_id, expected_revision, updater)
    record(entry_id=content_id, action="PUBLISH", result="SUCCESS",
           revision=expected_revision, public_id=updated["publicId"])
    return {
        "entryId": content_id,
        "revision": expected_revision,
        "publicId": updated["publicId"],
        "publicPath": f"{PUBLIC_ENTRIES_PREFIX}{updated['publicId']}.json",
        "publishedAt": updated["publishedAt"],
        "generationHash": snap_holder["hash"],
    }


def withdraw(content_id: str) -> Dict[str, Any]:
    """Remove the current publication and return the entry to DRAFT."""
    entry = storage.get_entry(content_id)
    if not entry:
        raise FileNotFoundError(content_id)
    if entry.get("status") != "PUBLISHED":
        raise PublicationNotFoundError(content_id)

    def updater(e: Dict[str, Any]) -> Dict[str, Any]:
        # Move the snapshot to a same-directory quarantine file first; the
        # entry only becomes DRAFT after the index save succeeds, otherwise
        # rollback() moves the snapshot back.
        target = _snapshot_path(e["publicId"])
        quarantine = target.with_suffix(".retired")
        if target.exists():
            _atomic_move(target, quarantine)
        e["status"] = "DRAFT"
        e["publishedAt"] = None

        def rollback():
            # Must NOT swallow: failures surface as RecoveryError.
            if quarantine.exists():
                _atomic_move(quarantine, target)

        def commit():
            _finalize_cleanup(quarantine, e["id"], "WITHDRAW", e["revision"], e["publicId"])

        return {"rollback": rollback, "commit": commit}

    updated = storage.update_entry(content_id, entry["revision"], updater)
    record(entry_id=content_id, action="WITHDRAW", result="SUCCESS",
           revision=updated["revision"], public_id=updated["publicId"])
    return updated


def archive(content_id: str, expected_revision: int) -> Dict[str, Any]:
    """Archive an entry; any current publication is withdrawn in the same lock."""
    entry = storage.get_entry(content_id)
    if not entry:
        raise FileNotFoundError(content_id)
    if entry["revision"] != expected_revision:
        raise PublicationConflictError("CONFLICT", "expectedRevision mismatch", entry["revision"])
    if entry.get("status") == "ARCHIVED":
        raise PublicationConflictError("STATE_CONFLICT", "entry is already archived", entry.get("revision"))

    def updater(e: Dict[str, Any]) -> Dict[str, Any]:
        target = _snapshot_path(e["publicId"])
        quarantine = target.with_suffix(".retired")
        if e.get("status") == "PUBLISHED" and target.exists():
            _atomic_move(target, quarantine)
        e["status"] = "ARCHIVED"
        e["publishedAt"] = None

        def rollback():
            # Must NOT swallow: failures surface as RecoveryError.
            if quarantine.exists():
                _atomic_move(quarantine, target)

        def commit():
            _finalize_cleanup(quarantine, e["id"], "ARCHIVE", e["revision"], e["publicId"])

        return {"rollback": rollback, "commit": commit}

    updated = storage.update_entry(content_id, expected_revision, updater)
    record(entry_id=content_id, action="ARCHIVE", result="SUCCESS",
           revision=expected_revision, public_id=updated["publicId"])
    return updated


def restore(content_id: str, expected_revision: int) -> Dict[str, Any]:
    """Restore an archived entry to DRAFT without re-publishing it."""
    entry = storage.get_entry(content_id)
    if not entry:
        raise FileNotFoundError(content_id)
    if entry["revision"] != expected_revision:
        raise PublicationConflictError("CONFLICT", "expectedRevision mismatch", entry["revision"])
    if entry.get("status") != "ARCHIVED":
        raise PublicationConflictError("STATE_CONFLICT", "only archived entries can be restored", entry.get("revision"))

    def updater(e: Dict[str, Any]) -> None:
        e["status"] = "DRAFT"

    updated = storage.update_entry(content_id, expected_revision, updater)
    record(entry_id=content_id, action="RESTORE", result="SUCCESS",
           revision=expected_revision, public_id=updated["publicId"])
    return updated
