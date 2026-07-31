"""Content entry and revision storage."""
from __future__ import annotations
import hashlib,json,os,uuid,time
from datetime import datetime,timezone
from pathlib import Path
from typing import Any,Dict,Optional

_R=Path(__file__).resolve().parent.parent.parent
_S=_R/"local-assets"/"content-studio"/"drafts"
_E=_S/"_entries.json"
_V=_S/"revisions"
_L=_S/".global.lock"

def _ens(): _S.mkdir(parents=True,exist_ok=True); _V.mkdir(parents=True,exist_ok=True)
def _load():
    _ens()
    if not _E.is_file(): return {}
    d=json.loads(_E.read_text("utf-8"))
    _migrate_public_ids_inplace(d)
    return d

def _save(d):
    _ens(); t=_E.with_suffix(".tmp")
    try:
        t.write_text(json.dumps(d,ensure_ascii=False,indent=2),"utf-8")
        # Bounded backoff retry: Windows file locks (AV scan / leaked handles)
        # are transient; a short retry makes index saves resilient without
        # masking persistent failures.
        last=None
        for i in range(5):
            try:
                t.replace(_E); return
            except OSError as e:
                last=e; time.sleep(0.05*(i+1))
        raise last
    finally:
        # Never leave a half-written temp index behind, on any path.
        try:
            t.unlink(missing_ok=True)
        except OSError:
            pass

def _lock():
    _ens()
    for _ in range(100):
        try: return os.open(str(_L),os.O_CREAT|os.O_EXCL|os.O_RDWR)
        except FileExistsError: time.sleep(0.01)
    raise RuntimeError("lock")

def _unlock(fd): os.close(fd); _L.unlink(missing_ok=True)

def _hash(d): return hashlib.sha256(json.dumps(d,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def _p(cid): return _V/f"{cid}.jsonl"
def _ts(): return datetime.now(timezone.utc).isoformat()

def _migrate_public_ids_inplace(d):
    """Ensure all entries have unique publicId; called on every _load()."""
    changed=False; max_pid=0
    for e in d.values():
        if isinstance(e,dict) and e.get("publicId"): max_pid=max(max_pid,e["publicId"])
    if d.get("__pid__",0)<max_pid: d["__pid__"]=max_pid; changed=True
    seen=set()
    for e in d.values():
        if not isinstance(e,dict) or "id" not in e: continue
        if not e.get("publicId") or e["publicId"] in seen:
            d["__pid__"]=d.get("__pid__",0)+1
            e["publicId"]=d["__pid__"]
            changed=True
        seen.add(e["publicId"])
    if changed: _save(d)

def _next_pid():
    d=_load()  # migration runs in _load
    v=d.get("__pid__",0)+1; d["__pid__"]=v; _save(d); return v

def create_entry(metadata,document):
    fd=_lock()
    try:
        pid=_next_pid(); cid=str(uuid.uuid4()); d=_load(); ts=_ts()
        e={"id":cid,"publicId":pid,"title":metadata["title"],"status":"DRAFT","revision":0,
           "createdAt":ts,"updatedAt":ts,"publishedAt":None,
           "metadata":{"title":metadata["title"],"summary":metadata.get("summary"),"coverMediaId":metadata.get("coverMediaId"),"tags":metadata.get("tags",[])},
           "media":[]}
        d[cid]=e; _save(d); _write_revision(cid,1,document); e["revision"]=1; d[cid]=e; _save(d)
        return _read_entry(cid)
    finally: _unlock(fd)

def _write_revision(cid,rev,doc):
    with open(_p(cid),"a",encoding="utf-8") as f:
        f.write(json.dumps({"revision":rev,"document":doc,"hash":_hash(doc),"timestamp":_ts()},ensure_ascii=False)+"\n")

def _read_entry(cid):
    d=_load(); e=d.get(cid)
    if not e or not isinstance(e,dict) or "id" not in e: return None
    if _p(cid).is_file():
        ll=_p(cid).read_text("utf-8").strip().split("\n")
        if ll: e["document"]=json.loads(ll[-1])["document"]
    return e

get_entry=_read_entry

def list_entries(page=1,ps=20):
    d=_load()
    r=sorted(((k,v) for k,v in d.items() if isinstance(v,dict) and "id" in v),key=lambda x:x[1].get("updatedAt",""),reverse=True)
    t=len(r); p=r[(page-1)*ps:page*ps]
    return {"data":[{k:v for k,v in e.items() if k!="document"} for _,e in p],
            "pagination":{"page":page,"pageSize":ps,"totalItems":t,"totalPages":max(1,-(-t//ps))}}

def save_revision(content_id,document,expected_revision,metadata=None):
    lp=_V/f"{content_id}.lock"; lp.parent.mkdir(parents=True,exist_ok=True)
    fd=None
    for _ in range(20):
        try: fd=os.open(str(lp),os.O_CREAT|os.O_EXCL|os.O_RDWR); break
        except FileExistsError: time.sleep(0.05)
    if not fd: raise RevisionConflictError(content_id,-1,expected_revision)
    try:
        d=_load(); e=d.get(content_id)
        if not e: raise FileNotFoundError(content_id)
        if e["revision"]!=expected_revision: raise RevisionConflictError(content_id,e["revision"],expected_revision)
        if metadata:
            e["metadata"]={"title":metadata.get("title",e.get("title","")),"summary":metadata.get("summary"),
                           "coverMediaId":metadata.get("coverMediaId"),"tags":metadata.get("tags",[])}
            e["title"]=metadata.get("title",e.get("title",""))
        h=_hash(document); lh=None
        if _p(content_id).is_file():
            ll=_p(content_id).read_text("utf-8").strip().split("\n")
            if ll: lh=json.loads(ll[-1]).get("hash")
        if lh==h: e["updatedAt"]=_ts(); d[content_id]=e; _save(d); return _read_entry(content_id)
        nr=e["revision"]+1; _write_revision(content_id,nr,document); e["revision"]=nr; e["updatedAt"]=_ts(); d[content_id]=e; _save(d)
        return _read_entry(content_id)
    finally: os.close(fd); lp.unlink(missing_ok=True)

class RevisionConflictError(Exception):
    def __init__(s, cid, current, expected): s.cid=cid; s.current=current; s.expected=expected; super().__init__(f"Conflict: exp {expected}, cur {current}")

class EntryPublishedError(Exception):
    """Deletion refused because the entry has an active publication."""

class RecoveryError(Exception):
    """Entry index save failed AND rollback could not restore last-known-good.
    Recovery artifacts (.bak/.retired) are preserved in the published
    directory as recoverable evidence; callers must surface this as an
    explicit failure state, never as a plain internal error."""
    def __init__(s, code, message):
        s.code=code; s.message=message; super().__init__(message)

def update_entry(content_id, expected_revision, updater):
    """Locked atomic state update: revision must match, then updater(entry)
    mutates the entry, revision bumps by 1 and the index is saved.
    The current document (latest revision) is attached to the entry for
    updaters that need it and stripped again before the index is saved.

    Transaction protocol: updater may return a dict with
    ``{"rollback": fn, "commit": fn}`` so that side effects (e.g. published
    snapshot files) stay consistent with the entry index:
    - if the index save fails, ``rollback()`` restores the previous state;
    - after a successful save, ``commit()`` finalizes (deletes backups).
    If updater raises, nothing is persisted and no rollback runs (the
    updater itself must leave the previous state intact on failure)."""
    lp=_V/f"{content_id}.lock"; lp.parent.mkdir(parents=True,exist_ok=True)
    fd=None
    for _ in range(20):
        try: fd=os.open(str(lp),os.O_CREAT|os.O_EXCL|os.O_RDWR); break
        except FileExistsError: time.sleep(0.05)
    if not fd: raise RevisionConflictError(content_id,-1,expected_revision)
    try:
        d=_load(); e=d.get(content_id)
        if not e: raise FileNotFoundError(content_id)
        if e["revision"]!=expected_revision: raise RevisionConflictError(content_id,e["revision"],expected_revision)
        if _p(content_id).is_file():
            ll=_p(content_id).read_text("utf-8").strip().split("\n")
            if ll: e["document"]=json.loads(ll[-1])["document"]
        txn=updater(e)
        rollback = txn.get("rollback") if isinstance(txn,dict) else None
        commit = txn.get("commit") if isinstance(txn,dict) else None
        e.pop("document",None)
        e["revision"]=e.get("revision",0)+1
        e["updatedAt"]=_ts()
        d[content_id]=e
        try:
            _save(d)
        except Exception as save_err:
            if rollback:
                try:
                    rollback()
                except Exception as rb_err:
                    # Last-known-good could NOT be restored. Do not swallow:
                    # raise an explicit recovery state so callers and the
                    # public-content checker know artifacts need attention.
                    raise RecoveryError(
                        "SNAPSHOT_RECOVERY_FAILED",
                        "index save failed and published snapshot recovery could not restore last-known-good",
                    ) from rb_err
            raise
        if commit:
            try:
                commit()
            except Exception:
                # commit finalizers audit their own cleanup failures; this
                # guard only prevents a cleanup problem from failing a
                # successful state transition.
                pass
        return _read_entry(content_id)
    finally: os.close(fd); lp.unlink(missing_ok=True)

def delete_entry(content_id):
    """Delete an entry that has no active publication (DRAFT/ARCHIVED),
    along with its revision file. PUBLISHED entries are refused."""
    lp=_V/f"{content_id}.lock"; lp.parent.mkdir(parents=True,exist_ok=True)
    fd=None
    for _ in range(20):
        try: fd=os.open(str(lp),os.O_CREAT|os.O_EXCL|os.O_RDWR); break
        except FileExistsError: time.sleep(0.05)
    if not fd: raise RevisionConflictError(content_id,-1,-1)
    try:
        d=_load(); e=d.get(content_id)
        if not e: raise FileNotFoundError(content_id)
        if e.get("status")=="PUBLISHED": raise EntryPublishedError(content_id)
        del d[content_id]; _save(d)
        _p(content_id).unlink(missing_ok=True)
    finally: os.close(fd); lp.unlink(missing_ok=True)
