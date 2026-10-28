"""Validate the frozen CSV batch consumed by V2 data generators."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import re


SCHEMA_VERSION = "nightingale.game-data.v1"
LOCALE_FOLDERS = {"zh": "chs", **{locale: locale for locale in ("en", "ja", "ko", "tc", "fr", "de")}}
HASH_RE = re.compile(r"[0-9a-f]{64}\Z")


def _provenance(entry, mode, revisions):
    if mode == "local":
        if (entry.get("repository"), entry.get("revision"), entry.get("url")) != ("local", "", ""):
            raise ValueError("Local source provenance must not claim a remote repository")
        return
    locale, sheet, revision = entry["locale"], entry["sheet"], entry.get("revision")
    repo, prefix = (("Ra-Workspace/ffxiv-datamining-ko", "csv/") if locale == "ko" else
                    ("thewakingsands/ffxiv-datamining-tc", "") if locale == "tc" else
                    ("InfSein/ffxiv-datamining-mixed", locale + "/"))
    if (not isinstance(revision, str) or not re.fullmatch(r"[0-9a-f]{40}", revision)
            or entry.get("repository") != repo
            or entry.get("url") != f"https://raw.githubusercontent.com/{repo}/{revision}/{prefix}{sheet}.csv"):
        raise ValueError("Remote source provenance must use a pinned official repository")
    if revisions.setdefault(repo, revision) != revision:
        raise ValueError("Source provenance mixes revisions of one repository")


def _unique_object(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError(f"Duplicate manifest field: {key}")
        value[key] = item
    return value


def _relative_file(root, relative):
    if not isinstance(relative, str) or "\\" in relative:
        raise ValueError("Invalid batch path")
    path = PurePosixPath(relative)
    if str(path) != relative or path.is_absolute() or any(part in ("..", ".") or ":" in part for part in path.parts):
        raise ValueError("Batch path escapes snapshot")
    resolved = (root / path).resolve()
    if not resolved.is_relative_to(root):
        raise ValueError("Batch path escapes snapshot")
    return resolved


def load_batch(manifest_path, source_root="", requirements=None):
    """Verify every listed file and return the manifest, CSV root and source index."""
    manifest_path = Path(manifest_path).resolve()
    root = manifest_path.parent
    csv_root = root / "csv"
    if source_root and Path(source_root).resolve() != csv_root:
        raise ValueError("Local source-root does not match source-batch")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"), object_pairs_hook=_unique_object)
    if manifest.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("Unsupported source batch schema")
    if manifest.get("source_mode") not in ("local", "remote"):
        raise ValueError("Invalid source batch provenance mode")
    sources = manifest.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("Source batch has no sources")
    encoded = json.dumps(sources, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    if manifest.get("batch_id") != hashlib.sha256(encoded).hexdigest():
        raise ValueError("Source batch identity mismatch")
    entries = {}
    revisions = {}
    for entry in sources:
        if not isinstance(entry, dict):
            raise ValueError("Invalid source entry")
        locale, sheet = entry.get("locale"), entry.get("sheet")
        if (locale not in LOCALE_FOLDERS.values() or not isinstance(sheet, str)
                or not sheet or sheet.endswith(".csv")):
            raise ValueError("Invalid source locale or sheet")
        key = (locale, sheet)
        if key in entries:
            raise ValueError(f"Duplicate source: {locale}/{sheet}")
        relative = f"csv/{locale}/{sheet}.csv"
        if entry.get("path") != relative:
            raise ValueError("Source path does not match locale/sheet")
        path = _relative_file(root, relative)
        _provenance(entry, manifest["source_mode"], revisions)
        digest = entry.get("sha256")
        if not isinstance(digest, str) or not HASH_RE.fullmatch(digest):
            raise ValueError("Invalid source hash")
        if not path.is_file():
            raise ValueError(f"Missing local {locale} {sheet}.csv")
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise ValueError(f"Source hash mismatch: {locale}/{sheet}")
        entries[key] = entry
    for locale, sheets in (requirements or {}).items():
        for sheet in sheets:
            if (locale, sheet) not in entries:
                raise ValueError(f"Missing batch source: {locale}/{sheet}")
    return {"manifest": manifest, "root": csv_root, "entries": entries}


def local_source(root, locale, sheet, override="", batch=None):
    """Resolve a required local input before a generator starts parsing any sheet."""
    folder = LOCALE_FOLDERS.get(locale, locale)
    expected = Path(root).resolve() / folder / (sheet + ".csv")
    if override and "://" in override:
        raise ValueError("Local source mode forbids remote overrides")
    path = Path(override).expanduser().resolve() if override else expected.resolve()
    if batch and path != expected.resolve():
        raise ValueError("Local batch mode forbids source overrides outside the batch")
    if not path.is_file():
        raise ValueError(f"Missing local {locale} {sheet}.csv: {path}")
    return str(path)


def source_record(source, root="", batch=None):
    """Describe actual inputs without disclosing the machine's local directory."""
    if batch:
        relative = Path(source).resolve().relative_to(Path(batch["root"]).resolve()).as_posix()
        folder, sheet_file = relative.split("/", 1)
        entry = batch["entries"][(folder, sheet_file[:-4])]
        return {key: entry[key] for key in ("locale", "sheet", "path", "sha256", "repository", "revision", "url")
                if key in entry}
    if root or not source.startswith(("http://", "https://")):
        path = Path(source).resolve()
        csv_root = Path(root).resolve() if root else None
        relative = path.relative_to(csv_root).as_posix() if csv_root and path.is_relative_to(csv_root) else path.name
        return {"path": relative, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "repository": "local"}
    return source
