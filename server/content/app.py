"""Content studio Flask application."""
from __future__ import annotations
import re, uuid as _uuid
from flask import Flask, jsonify, request
from . import config, schema, storage, media as media_handler, publishing, audit
from .security import require_security

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = config.MAX_BODY_BYTES

@app.errorhandler(400)
def bad_request(e): return jsonify({"error":{"code":"BAD_REQUEST","message":"Bad request"}}),400
@app.errorhandler(401)
def unauthorized(e): return jsonify({"error":{"code":"UNAUTHORIZED","message":"Unauthorized"}}),401
@app.errorhandler(403)
def forbidden(e): return jsonify({"error":{"code":"FORBIDDEN","message":"Forbidden"}}),403
@app.errorhandler(404)
def not_found(e): return jsonify({"error":{"code":"NOT_FOUND","message":"Not found"}}),404
@app.errorhandler(405)
def method_not_allowed(e): return jsonify({"error":{"code":"METHOD_NOT_ALLOWED","message":"Method not allowed"}}),405
@app.errorhandler(413)
def too_large(e): return jsonify({"error":{"code":"BODY_TOO_LARGE","message":"Request body too large"}}),413
@app.errorhandler(500)
def internal_error(e): return jsonify({"error":{"code":"INTERNAL_ERROR","message":"Internal server error"}}),500

@app.route("/api/content-studio/health")
def health(): return jsonify({"ok":True,"service":"content-studio"})

@app.route("/api/content-studio/test-secured",methods=["POST"])
@require_security
def test_secured(): return jsonify({"ok":True})

def _check_top_level(body, allowed):
    extra = set(body.keys()) - allowed
    if extra:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":f"unknown fields: {extra}"}}),422
    return None,None

UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')

def _validate_metadata(meta, require_all=True):
    if not isinstance(meta, dict):
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"metadata must be object"}}),422
    if "title" not in meta or not isinstance(meta["title"],str) or not meta["title"].strip():
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"title is required"}}),422
    if len(meta["title"]) > 120:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"title max 120 chars"}}),422
    if "summary" in meta and meta["summary"] is not None:
        if not isinstance(meta["summary"],str) or len(meta["summary"]) > 300:
            return jsonify({"error":{"code":"VALIDATION_ERROR","message":"summary max 300 chars"}}),422
    if "tags" not in meta or not isinstance(meta["tags"],list):
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"tags is required"}}),422
    if len(meta["tags"]) > 10:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"tags max 10"}}),422
    for t in meta["tags"]:
        if not isinstance(t,str) or len(t)<1 or len(t)>30:
            return jsonify({"error":{"code":"VALIDATION_ERROR","message":"each tag 1-30 chars"}}),422
    if "coverMediaId" in meta and meta["coverMediaId"] is not None:
        if not isinstance(meta["coverMediaId"],str) or not UUID_RE.match(meta["coverMediaId"]):
            return jsonify({"error":{"code":"VALIDATION_ERROR","message":"coverMediaId must be UUID"}}),422
    allowed = {"title","summary","tags","coverMediaId"}
    extra = set(meta.keys()) - allowed
    if extra:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":f"unknown fields: {extra}"}}),422
    return None,None

def _read_expected_revision():
    """Parse and validate a RevisionExpectation body. Returns (rev, error_response)."""
    body=request.get_json(silent=True)
    if not isinstance(body,dict) or "expectedRevision" not in body:
        return None,jsonify({"error":{"code":"VALIDATION_ERROR","message":"expectedRevision required"}}),422
    err,status=_check_top_level(body,{"expectedRevision"})
    if err: return None,err,status
    rev=body["expectedRevision"]
    if not isinstance(rev,int) or isinstance(rev,bool) or rev < 1:
        return None,jsonify({"error":{"code":"VALIDATION_ERROR","message":"expectedRevision must be int ≥1"}}),422
    return rev,None,None

def _audit_failure(action, content_id, entry, reason_code):
    try:
        audit.record(entry_id=content_id, action=action, result="FAILURE",
                     revision=entry.get("revision") if entry else None,
                     public_id=entry.get("publicId") if entry else None,
                     reason_code=reason_code)
    except Exception:
        pass

@app.route("/api/content-studio/drafts",methods=["GET"])
@require_security
def list_drafts():
    page=request.args.get("page",1,type=int)
    ps=request.args.get("pageSize",20,type=int)
    return jsonify(storage.list_entries(page,ps))

@app.route("/api/content-studio/drafts",methods=["POST"])
@require_security
def create_draft():
    body=request.get_json(silent=True)
    if not body or "metadata" not in body or "document" not in body:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"metadata and document required"}}),422
    err,status=_check_top_level(body,{"metadata","document"})
    if err: return err,status
    err,status=_validate_metadata(body["metadata"])
    if err: return err,status
    try:
        schema.validate_document_body(body["document"])
    except schema.SchemaValidationError as e:
        return jsonify({"error":{"code":e.code,"message":e.message,"path":e.path}}),422
    try:
        entry=storage.create_entry(body["metadata"],body["document"])
    except Exception:
        return jsonify({"error":{"code":"INTERNAL_ERROR","message":"Failed to create draft"}}),500
    return jsonify(entry),201

@app.route("/api/content-studio/drafts/<content_id>",methods=["GET"])
@require_security
def get_draft(content_id):
    entry=storage.get_entry(content_id)
    if not entry:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404
    return jsonify(entry)

@app.route("/api/content-studio/drafts/<content_id>",methods=["PATCH"])
@require_security
def save_draft(content_id):
    body=request.get_json(silent=True)
    if not body or "metadata" not in body or "expectedRevision" not in body:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"metadata and expectedRevision required"}}),422
    err,status=_check_top_level(body,{"metadata","expectedRevision","document"})
    if err: return err,status
    if not isinstance(body["expectedRevision"],int) or isinstance(body["expectedRevision"],bool) or body["expectedRevision"] < 1:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"expectedRevision must be int ≥1"}}),422
    err,status=_validate_metadata(body["metadata"])
    if err: return err,status
    try:
        schema.validate_document_body(body.get("document",{}))
    except schema.SchemaValidationError as e:
        return jsonify({"error":{"code":e.code,"message":e.message,"path":e.path}}),422
    try:
        entry=storage.save_revision(content_id,body["document"],body["expectedRevision"],metadata=body["metadata"])
    except storage.RevisionConflictError as e:
        return jsonify({"error":{"code":"CONFLICT","message":str(e),"currentRevision":e.current}}),409
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404
    return jsonify(entry)

@app.route("/api/content-studio/drafts/<content_id>",methods=["DELETE"])
@require_security
def delete_draft(content_id):
    try:
        storage.delete_entry(content_id)
        return "",204
    except storage.EntryPublishedError:
        return jsonify({"error":{"code":"STATE_CONFLICT","message":"Published entries must be archived or withdrawn instead of deleted"}}),409
    except storage.RevisionConflictError as e:
        return jsonify({"error":{"code":"CONFLICT","message":str(e),"currentRevision":e.current}}),409
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404

@app.route("/api/content-studio/drafts/<content_id>/publications",methods=["POST"])
@require_security
def create_publication(content_id):
    rev,err,status=_read_expected_revision()
    if err: return err,status
    try:
        pub=publishing.publish(content_id,rev)
        return jsonify(pub),201
    except publishing.PublicationError as e:
        _audit_failure("PUBLISH",content_id,storage.get_entry(content_id),e.code)
        return jsonify({"error":{"code":e.code,"message":e.message}}),422
    except publishing.PublicationConflictError as e:
        _audit_failure("PUBLISH",content_id,storage.get_entry(content_id),e.code)
        body={"error":{"code":e.code,"message":e.message}}
        if e.current is not None: body["error"]["currentRevision"]=e.current
        return jsonify(body),409
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404
    except storage.RecoveryError as e:
        _audit_failure("PUBLISH",content_id,storage.get_entry(content_id),e.code)
        return jsonify({"error":{"code":e.code,"message":e.message}}),500
    except Exception:
        _audit_failure("PUBLISH",content_id,storage.get_entry(content_id),"INTERNAL_ERROR")
        return jsonify({"error":{"code":"INTERNAL_ERROR","message":"Internal server error"}}),500

@app.route("/api/content-studio/drafts/<content_id>/publication",methods=["DELETE"])
@require_security
def withdraw_publication(content_id):
    try:
        publishing.withdraw(content_id)
        return "",204
    except publishing.PublicationNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"No active publication for this draft"}}),404
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404
    except storage.RevisionConflictError as e:
        return jsonify({"error":{"code":"CONFLICT","message":str(e),"currentRevision":e.current}}),409
    except storage.RecoveryError as e:
        _audit_failure("WITHDRAW",content_id,storage.get_entry(content_id),e.code)
        return jsonify({"error":{"code":e.code,"message":e.message}}),500
    except Exception:
        _audit_failure("WITHDRAW",content_id,storage.get_entry(content_id),"INTERNAL_ERROR")
        return jsonify({"error":{"code":"INTERNAL_ERROR","message":"Internal server error"}}),500

@app.route("/api/content-studio/drafts/<content_id>/archive",methods=["POST"])
@require_security
def archive_draft(content_id):
    rev,err,status=_read_expected_revision()
    if err: return err,status
    try:
        entry=publishing.archive(content_id,rev)
        return jsonify(entry),200
    except publishing.PublicationConflictError as e:
        _audit_failure("ARCHIVE",content_id,storage.get_entry(content_id),e.code)
        body={"error":{"code":e.code,"message":e.message}}
        if e.current is not None: body["error"]["currentRevision"]=e.current
        return jsonify(body),409
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404
    except storage.RecoveryError as e:
        _audit_failure("ARCHIVE",content_id,storage.get_entry(content_id),e.code)
        return jsonify({"error":{"code":e.code,"message":e.message}}),500
    except Exception:
        _audit_failure("ARCHIVE",content_id,storage.get_entry(content_id),"INTERNAL_ERROR")
        return jsonify({"error":{"code":"INTERNAL_ERROR","message":"Internal server error"}}),500

@app.route("/api/content-studio/drafts/<content_id>/restore",methods=["POST"])
@require_security
def restore_draft(content_id):
    rev,err,status=_read_expected_revision()
    if err: return err,status
    try:
        entry=publishing.restore(content_id,rev)
        return jsonify(entry),200
    except publishing.PublicationConflictError as e:
        _audit_failure("RESTORE",content_id,storage.get_entry(content_id),e.code)
        body={"error":{"code":e.code,"message":e.message}}
        if e.current is not None: body["error"]["currentRevision"]=e.current
        return jsonify(body),409
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Draft not found"}}),404
    except storage.RecoveryError as e:
        _audit_failure("RESTORE",content_id,storage.get_entry(content_id),e.code)
        return jsonify({"error":{"code":e.code,"message":e.message}}),500
    except Exception:
        _audit_failure("RESTORE",content_id,storage.get_entry(content_id),"INTERNAL_ERROR")
        return jsonify({"error":{"code":"INTERNAL_ERROR","message":"Internal server error"}}),500

@app.route("/api/content-studio/media",methods=["POST"])
@require_security
def upload_media():
    if not request.content_length:
        return jsonify({"error":{"code":"VALIDATION_ERROR","message":"No file provided"}}),422
    fn=request.headers.get("X-File-Name","")
    data=request.get_data()
    try:
        obj=media_handler.validate_and_store(data,fn)
        return jsonify(obj),201
    except media_handler.MediaValidationError as e:
        return jsonify({"error":{"code":e.code,"message":e.message}}),422

@app.route("/api/content-studio/media/<media_id>/checks",methods=["POST"])
@require_security
def check_media(media_id):
    try:
        result=media_handler.check_cdn_accessibility(media_id)
        return jsonify(result),201
    except FileNotFoundError:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Media not found"}}),404

@app.route("/api/content-studio/media/<media_id>/raw", methods=["GET"])
@require_security
def raw_media(media_id):
    obj = media_handler.get_media(media_id)
    if not obj:
        return jsonify({"error":{"code":"NOT_FOUND","message":"Media not found"}}), 404
    fp = media_handler._S / obj["publicObjectKey"]
    if not fp.is_file():
        return jsonify({"error":{"code":"NOT_FOUND","message":"Media file missing"}}), 404
    from flask import send_file
    return send_file(str(fp), mimetype=obj.get("mediaType", "image/png"))

if __name__=="__main__":
    port=config.get_port()
    token=config.get_token()
    print(f"Content Studio helper: http://{config.BIND_HOST}:{port}")
    app.run(host=config.BIND_HOST,port=port,debug=False)
