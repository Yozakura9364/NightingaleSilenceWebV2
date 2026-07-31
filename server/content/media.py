"""Media upload and validation — T023 [US1]."""
from __future__ import annotations
import hashlib,json,os,uuid,time
from datetime import datetime,timezone
from io import BytesIO
from pathlib import Path
from typing import Any,Dict,Optional
from PIL import Image,UnidentifiedImageError

MAX_UPLOAD_BYTES=20*1024*1024; MAX_WIDTH=16384; MAX_HEIGHT=16384; MAX_PIXELS=64_000_000
ALLOWED_FORMATS={"JPEG","PNG","GIF","WebP"}
_MIME={"JPEG":"image/jpeg","PNG":"image/png","GIF":"image/gif","WebP":"image/webp"}
# Stable public CDN base; publishing only accepts URLs below this host.
PUBLIC_BASE_URL="https://img.nightingalesilence.com/content/"
_R=Path(__file__).resolve().parent.parent.parent
_S=_R/"local-assets"/"content-studio"/"staging"
_I=_S/"_media.json"
_L=_S/".index.lock"

def _ens(): _S.mkdir(parents=True,exist_ok=True)
def _load(): _ens(); return json.loads(_I.read_text("utf-8")) if _I.is_file() else {}

def _atomic_update(updater):
    _ens()
    fd=None
    for _ in range(20):
        try: fd=os.open(str(_L),os.O_CREAT|os.O_EXCL|os.O_RDWR); break
        except FileExistsError: time.sleep(0.05)
    if not fd: raise RuntimeError("lock")
    try:
        d=json.loads(_I.read_text("utf-8")) if _I.is_file() else {}
        updater(d)
        t=_I.with_suffix(".tmp"); t.write_text(json.dumps(d,ensure_ascii=False,indent=2),"utf-8")
        # Bounded backoff retry: Windows file locks (AV scan / leaked handles)
        # are transient; matches storage._save behaviour.
        last=None
        for i in range(5):
            try:
                t.replace(_I); break
            except OSError as e:
                last=e; time.sleep(0.05*(i+1))
        else:
            raise last
    finally:
        # Never leave a half-written temp index behind, on any path.
        try:
            _I.with_suffix(".tmp").unlink(missing_ok=True)
        except OSError:
            pass
        os.close(fd); _L.unlink(missing_ok=True)

class MediaValidationError(Exception):
    def __init__(s,c,m): s.code=c; s.message=m; super().__init__(m)

def validate_and_store(data,original_filename=""):
    if len(data)>MAX_UPLOAD_BYTES: raise MediaValidationError("BYTES_EXCEEDED","File too large")
    try: img=Image.open(BytesIO(data)); img.verify()
    except UnidentifiedImageError: raise MediaValidationError("NOT_IMAGE","Not a valid image")
    except Exception: raise MediaValidationError("CORRUPT","Image corrupt")
    fmt=img.format
    if fmt not in ALLOWED_FORMATS: raise MediaValidationError("BAD_FORMAT",f"Format {fmt} not allowed")
    img=Image.open(BytesIO(data)); w,h=img.size
    if w>MAX_WIDTH or h>MAX_HEIGHT: raise MediaValidationError("DIMENSIONS_EXCEEDED","Dimensions too large")
    if w*h>MAX_PIXELS: raise MediaValidationError("PIXELS_EXCEEDED","Pixel count too large")
    mid=str(uuid.uuid4()); ext=fmt.lower()
    if ext=="jpeg": ext="jpg"
    fn=f"{mid}.{ext}"
    fp=_S/fn; fp.parent.mkdir(parents=True,exist_ok=True); fp.write_bytes(data)
    ts=datetime.now(timezone.utc).isoformat()
    obj={"id":mid,"mediaType":_MIME[fmt],"byteSize":len(data),
         "width":w,"height":h,"status":"STAGED","publicObjectKey":fn,"createdAt":ts}
    _atomic_update(lambda d: d.update({mid:obj}))
    return obj

def get_media(mid): return _load().get(mid)

def check_cdn_accessibility(mid):
    obj=get_media(mid)
    if not obj: raise FileNotFoundError(f"Media {mid} not found")
    import urllib.request,urllib.error
    url=PUBLIC_BASE_URL+obj['publicObjectKey']
    result={"ok":False,"statusCode":0,"contentType":"","publiclyReadable":False,"stableUrl":True}
    try:
        req=urllib.request.Request(url,method="HEAD"); req.add_header("User-Agent","ContentStudio/1.0")
        resp=urllib.request.urlopen(req,timeout=10)
        ct=resp.headers.get("Content-Type","")
        result["statusCode"]=resp.status; result["contentType"]=ct
        result["ok"]=resp.status==200 and ct.startswith("image/")
        result["publiclyReadable"]=result["ok"]
    except urllib.error.HTTPError as e: result["statusCode"]=e.code
    except Exception: pass
    ts=datetime.now(timezone.utc).isoformat()
    _atomic_update(lambda d: _apply_check(d,mid,url,result,ts))
    return {"media":get_media(mid),"result":result}

def _apply_check(d,mid,url,result,ts):
    o=d.get(mid)
    if not o: return
    o["status"]="REMOTE_VERIFIED" if result["ok"] else "STAGED"
    o["publicUrl"]=url if result["ok"] else o.get("publicUrl")
    if result["ok"]: o["remoteCheckedAt"]=ts
    o["publiclyReadable"]=result["publiclyReadable"]
    o["stableUrl"]=result["stableUrl"]
