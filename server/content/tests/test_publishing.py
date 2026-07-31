"""Publishing API tests — T032 [US2].

Covers publication preconditions, resource blocking, published/draft
revision isolation, withdraw, archive, restore and audit sanitization.
Uses real Flask test_client against isolated temp directories.
"""
from __future__ import annotations
import json, os, sys, tempfile, unittest, uuid
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))
from server.content import config, storage, media, publishing, audit

VALID_DOC = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
    {"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]}}
EMPTY_DOC = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": []}}
META = {"title": "Test", "tags": ["test"]}
IMG_BASE = "https://img.nightingalesilence.com/content/"


def _doc_with_media(mid):
    return {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": "A"}]},
        {"type": "image", "attrs": {"mediaId": mid, "alt": "", "align": "center", "displayWidth": 75}},
    ]}}


class PublishingApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        base = Path(cls._tmp.name)
        # Isolate every persistent path from the real workspace.
        storage._S = base / "drafts"; storage._E = storage._S / "_entries.json"
        storage._V = storage._S / "revisions"; storage._L = storage._S / ".global.lock"
        media._S = base / "staging"; media._I = media._S / "_media.json"; media._L = media._S / ".index.lock"
        publishing.PUBLISHED_DIR = base / "published"
        audit.AUDIT_DIR = base / "audit"
        cls.published_dir = publishing.PUBLISHED_DIR
        cls.audit_dir = audit.AUDIT_DIR

        from server.content.app import app as real_app
        cls.app = real_app
        real_app.config['TESTING'] = True
        real_app.config['SERVER_NAME'] = '127.0.0.1:8770'
        real_app.config['PROPAGATE_EXCEPTIONS'] = False  # simulate write failures surface as 500 responses

    def setUp(self):
        # Isolate each test method: wipe all persisted state between tests.
        import shutil
        for d in (storage._S, media._S, publishing.PUBLISHED_DIR, audit.AUDIT_DIR):
            shutil.rmtree(d, ignore_errors=True)
            d.mkdir(parents=True, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def _h(self):
        return {'X-Content-Studio-Token': config.get_token(), 'Origin': 'http://127.0.0.1:5175', 'Host': '127.0.0.1:8770'}

    def _post(self, p, d=None, **x):
        data = json.dumps(d) if d is not None else None
        ct = 'application/json' if d is not None else None
        return self.app.test_client().post(p, data=data, content_type=ct, headers={**self._h(), **x})

    def _delete(self, p, **x):
        return self.app.test_client().delete(p, headers={**self._h(), **x})

    def _create(self, doc=None, meta=None):
        r = self._post('/api/content-studio/drafts', {"metadata": meta or META, "document": doc or VALID_DOC})
        self.assertEqual(r.status_code, 201, r.data)
        d = json.loads(r.data)
        self.assertEqual(d["revision"], 1)
        return d["id"]

    def _save(self, cid, expected, doc=None):
        return self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": expected, "metadata": META, "document": doc or VALID_DOC})

    def _patch(self, p, d, **x):
        return self.app.test_client().patch(p, data=json.dumps(d), content_type='application/json', headers={**self._h(), **x})

    def _publish(self, cid, expected):
        return self._post(f'/api/content-studio/drafts/{cid}/publications', {"expectedRevision": expected})

    def _publish_path(self, public_id):
        return self.published_dir / f"{public_id}.json"

    def _add_media(self, *, status="REMOTE_VERIFIED", public_url=None, publicly_readable=True, stable_url=True):
        mid = str(uuid.uuid4())
        obj = {
            "id": mid, "mediaType": "image/png", "byteSize": 10, "width": 1, "height": 1,
            "status": status, "publicObjectKey": "x.png", "createdAt": "2026-07-30T00:00:00+00:00",
            "publicUrl": public_url, "remoteCheckedAt": "2026-07-30T00:00:00+00:00",
            "publiclyReadable": publicly_readable, "stableUrl": stable_url,
        }
        media._atomic_update(lambda d: d.update({mid: obj}))
        return mid

    def _audit_lines(self):
        if not (self.audit_dir / "audit.log").is_file():
            return []
        return [json.loads(x) for x in (self.audit_dir / "audit.log").read_text("utf-8").strip().splitlines() if x.strip()]

    # ---- 1. Publish success ----

    def test_publish_ok(self):
        cid = self._create()
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 201, r.data)
        pub = json.loads(r.data)
        self.assertEqual(pub["entryId"], cid)
        self.assertEqual(pub["revision"], 1)
        self.assertIsInstance(pub["publicId"], int)
        self.assertRegex(pub["generationHash"], r'^[0-9a-f]{64}$')
        self.assertEqual(pub["publicPath"], f"/data/content/entries/{pub['publicId']}.json")
        self.assertIn("publishedAt", pub)
        # snapshot file written atomically
        fp = self._publish_path(pub["publicId"])
        self.assertTrue(fp.is_file())
        snap = json.loads(fp.read_text("utf-8"))
        self.assertEqual(snap["entryId"], cid)
        self.assertEqual(snap["revision"], 1)
        self.assertEqual(snap["publicId"], pub["publicId"])
        self.assertEqual(snap["generationHash"], pub["generationHash"])
        # entry status flipped
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertIsNotNone(e["publishedAt"])

    def test_publish_snapshot_isolated_from_later_drafts(self):
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        snap1 = json.loads(fp.read_text("utf-8"))
        # edit draft after publish
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Updated after publish"}]}]}}
        r = self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd})
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(json.loads(r.data)["revision"], 3)
        # snapshot unchanged
        snap2 = json.loads(fp.read_text("utf-8"))
        self.assertEqual(snap2["revision"], 1)
        self.assertEqual(snap2["document"]["doc"]["content"][0]["content"][0]["text"], "Hello")
        self.assertEqual(snap2["generationHash"], snap1["generationHash"])
        # entry revision advanced but draft document is the new one
        e = storage.get_entry(cid)
        self.assertEqual(e["revision"], 3)
        self.assertEqual(e["document"]["doc"]["content"][0]["content"][0]["text"], "Updated after publish")

    # ---- 2. Publish blocking ----

    def test_publish_stale_revision_409(self):
        cid = self._create()
        self.assertEqual(self._publish(cid, 1).status_code, 201)
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "A"}]}]}}
        self.assertEqual(self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd}).status_code, 200)
        # stale expectation
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 409)

    def test_publish_bad_revision_type_422(self):
        cid = self._create()
        r = self._post(f'/api/content-studio/drafts/{cid}/publications', {"expectedRevision": True})
        self.assertEqual(r.status_code, 422)
        r = self._post(f'/api/content-studio/drafts/{cid}/publications', {"expectedRevision": 0})
        self.assertEqual(r.status_code, 422)
        r = self._post(f'/api/content-studio/drafts/{cid}/publications', {"expectedRevision": 1, "extra": 1})
        self.assertEqual(r.status_code, 422)

    def test_publish_empty_document_422(self):
        cid = self._create(doc=EMPTY_DOC)
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 422, r.data)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "DRAFT")

    def test_publish_invalid_metadata_422(self):
        cid = self._create()
        # corrupt metadata directly in storage (API would reject it at save time)
        storage.update_entry(cid, 1, lambda e: e.__setitem__("title", "   "))
        r = self._publish(cid, 2)
        self.assertEqual(r.status_code, 422, r.data)

    def test_publish_media_not_verified_422(self):
        mid = self._add_media(status="STAGED", public_url=IMG_BASE + "x.png")
        cid = self._create(doc=_doc_with_media(mid))
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 422, r.data)
        self.assertIn("MEDIA", json.loads(r.data)["error"]["code"])
        self.assertEqual(storage.get_entry(cid)["status"], "DRAFT")

    def test_publish_media_unknown_422(self):
        cid = self._create(doc=_doc_with_media(str(uuid.uuid4())))
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 422, r.data)
        self.assertIn("MEDIA", json.loads(r.data)["error"]["code"])

    def test_publish_media_unstable_url_422(self):
        mid = self._add_media(public_url="http://img.nightingalesilence.com/content/x.png")
        cid = self._create(doc=_doc_with_media(mid))
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 422, r.data)

    def test_publish_media_not_publicly_readable_422(self):
        mid = self._add_media(public_url=IMG_BASE + "x.png", publicly_readable=False)
        cid = self._create(doc=_doc_with_media(mid))
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 422, r.data)

    def test_publish_verified_media_ok(self):
        mid = self._add_media(public_url=IMG_BASE + "x.png")
        cid = self._create(doc=_doc_with_media(mid))
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 201, r.data)
        snap = json.loads(self._publish_path(json.loads(r.data)["publicId"]).read_text("utf-8"))
        self.assertEqual([m["id"] for m in snap["media"]], [mid])

    def test_publish_archived_409(self):
        cid = self._create()
        self.assertEqual(self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 1}).status_code, 200)
        r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 409, r.data)

    def test_publish_requires_token_401(self):
        cid = self._create()
        r = self.app.test_client().post(f'/api/content-studio/drafts/{cid}/publications',
            data=json.dumps({"expectedRevision": 1}), content_type='application/json',
            headers={'Host': '127.0.0.1:8770'})
        self.assertEqual(r.status_code, 401)

    # ---- 3. State transitions ----

    def test_withdraw_ok(self):
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        self.assertTrue(fp.is_file())
        r = self._delete(f'/api/content-studio/drafts/{cid}/publication')
        self.assertEqual(r.status_code, 204)
        self.assertFalse(fp.exists())
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "DRAFT")
        self.assertIsNone(e["publishedAt"])

    def test_withdraw_not_published_404(self):
        cid = self._create()
        r = self._delete(f'/api/content-studio/drafts/{cid}/publication')
        self.assertEqual(r.status_code, 404)

    def test_archive_from_draft(self):
        cid = self._create()
        r = self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 1})
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(json.loads(r.data)["status"], "ARCHIVED")
        self.assertEqual(storage.get_entry(cid)["status"], "ARCHIVED")

    def test_archive_published_withdraws_publication(self):
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        r = self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 2})
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(json.loads(r.data)["status"], "ARCHIVED")
        self.assertFalse(fp.exists())
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "ARCHIVED")
        self.assertIsNone(e["publishedAt"])

    def test_archive_bad_revision_409(self):
        cid = self._create()
        r = self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 99})
        self.assertEqual(r.status_code, 409)

    def test_archive_boolean_revision_422(self):
        cid = self._create()
        r = self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": True})
        self.assertEqual(r.status_code, 422)

    def test_restore_ok_no_autopublish(self):
        cid = self._create()
        self.assertEqual(self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 1}).status_code, 200)
        r = self._post(f'/api/content-studio/drafts/{cid}/restore', {"expectedRevision": 2})
        self.assertEqual(r.status_code, 200, r.data)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "DRAFT")
        self.assertIsNone(e["publishedAt"])
        self.assertEqual(list(self.published_dir.glob("*.json")), [])

    def test_restore_not_archived_409(self):
        cid = self._create()
        r = self._post(f'/api/content-studio/drafts/{cid}/restore', {"expectedRevision": 1})
        self.assertEqual(r.status_code, 409, r.data)

    def test_restore_bad_revision_409(self):
        cid = self._create()
        self.assertEqual(self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 1}).status_code, 200)
        r = self._post(f'/api/content-studio/drafts/{cid}/restore', {"expectedRevision": 99})
        self.assertEqual(r.status_code, 409)

    def test_delete_published_entry_409(self):
        cid = self._create()
        self.assertEqual(self._publish(cid, 1).status_code, 201)
        r = self._delete(f'/api/content-studio/drafts/{cid}')
        self.assertEqual(r.status_code, 409)
        self.assertIsNotNone(storage.get_entry(cid))

    def test_delete_draft_204(self):
        cid = self._create()
        r = self._delete(f'/api/content-studio/drafts/{cid}')
        self.assertEqual(r.status_code, 204)
        self.assertIsNone(storage.get_entry(cid))
        self.assertEqual(self._get(f'/api/content-studio/drafts/{cid}').status_code, 404)

    def test_delete_archived_204(self):
        cid = self._create()
        self.assertEqual(self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 1}).status_code, 200)
        r = self._delete(f'/api/content-studio/drafts/{cid}')
        self.assertEqual(r.status_code, 204)

    def _get(self, p, **x):
        return self.app.test_client().get(p, headers={**self._h(), **x})

    # ---- 4. Atomicity and audit ----

    def test_publish_first_index_failure_rolls_back_snapshot(self):
        """First publish: snapshot write succeeds, index save fails → no snapshot left, entry stays DRAFT."""
        cid = self._create()
        with mock.patch("server.content.storage._save", side_effect=OSError("index write failed")):
            r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 500, r.data)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "DRAFT")
        self.assertIsNone(e["publishedAt"])
        self.assertEqual(e["revision"], 1)
        # no snapshot and no stray artifacts (tmp/bak)
        self.assertEqual(list(self.published_dir.iterdir()), [])

    def test_republish_index_failure_keeps_old_snapshot(self):
        """Republish: new snapshot staged, index save fails → old snapshot and old publishedAt restored."""
        cid = self._create()
        pub1 = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub1["publicId"])
        old_content = fp.read_text("utf-8")
        old_entry = storage.get_entry(cid)
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Second"}]}]}}
        self.assertEqual(self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd}).status_code, 200)
        with mock.patch("server.content.storage._save", side_effect=OSError("index write failed")):
            r = self._publish(cid, 3)
        self.assertEqual(r.status_code, 500, r.data)
        # old snapshot fully restored
        self.assertEqual(fp.read_text("utf-8"), old_content)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertEqual(e["publishedAt"], old_entry["publishedAt"])
        self.assertEqual(e["revision"], 3)
        # backup file consumed by rollback
        self.assertEqual(list(self.published_dir.glob("*.bak")), [])

    def test_withdraw_index_failure_keeps_snapshot(self):
        """Withdraw: snapshot quarantined, index save fails → snapshot restored, entry stays PUBLISHED."""
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        old_content = fp.read_text("utf-8")
        with mock.patch("server.content.storage._save", side_effect=OSError("index write failed")):
            r = self._delete(f'/api/content-studio/drafts/{cid}/publication')
        self.assertEqual(r.status_code, 500, r.data)
        self.assertEqual(fp.read_text("utf-8"), old_content)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertIsNotNone(e["publishedAt"])
        self.assertEqual(list(self.published_dir.glob("*.retired")), [])

    def test_archive_index_failure_keeps_snapshot(self):
        """Archive published entry: index save fails → snapshot restored, entry stays PUBLISHED."""
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        old_content = fp.read_text("utf-8")
        with mock.patch("server.content.storage._save", side_effect=OSError("index write failed")):
            r = self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 2})
        self.assertEqual(r.status_code, 500, r.data)
        self.assertEqual(fp.read_text("utf-8"), old_content)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertEqual(list(self.published_dir.glob("*.retired")), [])

    def test_atomic_write_retries_then_succeeds(self):
        """Snapshot write: transient PermissionError twice, then success (bounded retry)."""
        cid = self._create()
        real_replace = os.replace
        calls = [0]

        def flaky(src, dst, *a, **kw):
            calls[0] += 1
            if calls[0] <= 2:
                raise PermissionError("locked")
            return real_replace(src, dst, *a, **kw)

        with mock.patch("server.content.publishing.os.replace", side_effect=flaky):
            r = self._publish(cid, 1)
        self.assertEqual(r.status_code, 201, r.data)
        pub = json.loads(r.data)
        self.assertTrue(self._publish_path(pub["publicId"]).is_file())
        self.assertGreaterEqual(calls[0], 3)

    def test_atomic_write_retries_exhausted_keeps_old_snapshot(self):
        """Republish: write retries exhausted → old snapshot survives, entry unchanged."""
        cid = self._create()
        pub1 = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub1["publicId"])
        old_content = fp.read_text("utf-8")
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Second"}]}]}}
        self.assertEqual(self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd}).status_code, 200)
        real_replace = os.replace
        calls = [0]

        def flaky(src, dst, *a, **kw):
            calls[0] += 1
            if calls[0] == 1:
                # move old snapshot to .bak succeeds
                return real_replace(src, dst, *a, **kw)
            if calls[0] <= 6:
                # write retries (5 attempts) all fail
                raise PermissionError("locked")
            # rollback move (.bak -> target) succeeds
            return real_replace(src, dst, *a, **kw)

        with mock.patch("server.content.publishing.os.replace", side_effect=flaky):
            r = self._publish(cid, 3)
        self.assertEqual(r.status_code, 500, r.data)
        self.assertEqual(fp.read_text("utf-8"), old_content)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertEqual(e["revision"], 3)
        self.assertEqual(list(self.published_dir.glob("*.bak")), [])

    def test_recovery_failure_reports_state_and_keeps_artifact(self):
        """Index save fails AND rollback move also exhausts retries → explicit
        recovery error (not a plain 500), quarantine artifact preserved so old
        bytes stay recoverable, audit carries a safe reasonCode."""
        cid = self._create()
        pub1 = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub1["publicId"])
        old_content = fp.read_text("utf-8")
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Second"}]}]}}
        self.assertEqual(self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd}).status_code, 200)
        real_replace = os.replace
        calls = [0]

        def flaky(src, dst, *a, **kw):
            calls[0] += 1
            if calls[0] <= 2:
                # move old -> .bak, write new snapshot both succeed
                return real_replace(src, dst, *a, **kw)
            # rollback move (.bak -> target) keeps failing (retries exhausted)
            raise PermissionError("locked")

        with mock.patch("server.content.publishing.os.replace", side_effect=flaky), \
             mock.patch("server.content.storage._save", side_effect=OSError("index write failed")):
            r = self._publish(cid, 3)
        self.assertEqual(r.status_code, 500, r.data)
        body = json.loads(r.data)
        # NOT a plain INTERNAL_ERROR: caller must know recovery is needed
        self.assertEqual(body["error"]["code"], "SNAPSHOT_RECOVERY_FAILED")
        # official snapshot gone, quarantine holds the old bytes
        self.assertFalse(fp.exists())
        baks = list(self.published_dir.glob("*.bak"))
        self.assertEqual(len(baks), 1)
        self.assertEqual(baks[0].read_text("utf-8"), old_content)
        # entry untouched by the failed publish
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertEqual(e["revision"], 3)
        # audit records FAILURE with the safe reasonCode, no paths
        lines = self._audit_lines()
        self.assertTrue(any(x["action"] == "PUBLISH" and x["result"] == "FAILURE"
                            and x["reasonCode"] == "SNAPSHOT_RECOVERY_FAILED" for x in lines))
        self.assertNotIn("C:", json.dumps(lines, ensure_ascii=False))
        self.assertNotIn("local-assets", json.dumps(lines, ensure_ascii=False))

    def test_commit_cleanup_failure_records_audit(self):
        """Withdraw succeeds but quarantine cleanup fails → 204 result, orphan
        artifact kept as evidence, FAILURE audit with ORPHAN_CLEANUP_FAILED."""
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        real_unlink = Path.unlink

        def guarded_unlink(self_path, *a, **kw):
            if str(self_path).endswith(".retired"):
                raise PermissionError("locked")
            return real_unlink(self_path, *a, **kw)

        with mock.patch("pathlib.Path.unlink", guarded_unlink):
            r = self._delete(f'/api/content-studio/drafts/{cid}/publication')
        self.assertEqual(r.status_code, 204, r.data)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "DRAFT")
        # quarantine file remains as recoverable evidence (orphan for checker)
        retired = list(self.published_dir.glob("*.retired"))
        self.assertEqual(len(retired), 1)
        self.assertEqual(json.loads(retired[0].read_text("utf-8"))["entryId"], cid)
        lines = self._audit_lines()
        self.assertTrue(any(x["action"] == "WITHDRAW" and x["result"] == "FAILURE"
                            and x["reasonCode"] == "ORPHAN_CLEANUP_FAILED" for x in lines))

    def test_snapshot_write_recovery_failure_reports_state(self):
        """New snapshot write fails AND the in-updater .bak restore also fails →
        explicit SNAPSHOT_RECOVERY_FAILED (not plain INTERNAL_ERROR); .bak bytes
        preserved as recoverable evidence, audit carries the safe reasonCode."""
        cid = self._create()
        pub1 = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub1["publicId"])
        old_content = fp.read_text("utf-8")
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Second"}]}]}}
        self.assertEqual(self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd}).status_code, 200)
        real_replace = os.replace
        calls = [0]

        def flaky(src, dst, *a, **kw):
            calls[0] += 1
            if calls[0] == 1:
                # move old snapshot -> .bak succeeds
                return real_replace(src, dst, *a, **kw)
            # new snapshot write retries AND .bak restore retries all fail
            raise PermissionError("locked")

        with mock.patch("server.content.publishing.os.replace", side_effect=flaky):
            r = self._publish(cid, 3)
        self.assertEqual(r.status_code, 500, r.data)
        body = json.loads(r.data)
        # explicit recovery state, not a plain INTERNAL_ERROR
        self.assertEqual(body["error"]["code"], "SNAPSHOT_RECOVERY_FAILED")
        # official snapshot gone; old bytes recoverable from .bak
        self.assertFalse(fp.exists())
        baks = list(self.published_dir.glob("*.bak"))
        self.assertEqual(len(baks), 1)
        self.assertEqual(baks[0].read_text("utf-8"), old_content)
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertEqual(e["revision"], 3)
        # audit: FAILURE + safe reasonCode, no paths
        lines = self._audit_lines()
        self.assertTrue(any(x["action"] == "PUBLISH" and x["result"] == "FAILURE"
                            and x["reasonCode"] == "SNAPSHOT_RECOVERY_FAILED" for x in lines))
        self.assertNotIn("C:", json.dumps(lines, ensure_ascii=False))
        self.assertNotIn("local-assets", json.dumps(lines, ensure_ascii=False))

    def test_storage_save_retries_exhausted_cleans_tmp(self):
        """storage._save: all 5 replace attempts fail → no _entries.tmp left behind."""
        real_replace = Path.replace

        def guarded(self_path, target, *a, **kw):
            if str(self_path).endswith("_entries.tmp"):
                raise PermissionError("locked")
            return real_replace(self_path, target, *a, **kw)

        with mock.patch("pathlib.Path.replace", guarded):
            with self.assertRaises(PermissionError):
                storage._save({"probe": True})
        self.assertFalse(storage._E.with_suffix(".tmp").exists())

    def test_storage_save_retries_then_succeeds_cleans_tmp(self):
        """storage._save: transient failures then success → file written, no .tmp left."""
        real_replace = Path.replace
        calls = [0]

        def flaky(self_path, target, *a, **kw):
            calls[0] += 1
            if calls[0] <= 2:
                raise PermissionError("locked")
            return real_replace(self_path, target, *a, **kw)

        with mock.patch("pathlib.Path.replace", flaky):
            storage._save({"probe": True})
        self.assertGreaterEqual(calls[0], 3)
        self.assertTrue(storage._E.is_file())
        self.assertFalse(storage._E.with_suffix(".tmp").exists())

    def test_media_atomic_update_retries_exhausted_cleans_tmp(self):
        """media._atomic_update: all 5 replace attempts fail → no _media.tmp left behind."""
        real_replace = Path.replace

        def guarded(self_path, target, *a, **kw):
            if str(self_path).endswith("_media.tmp"):
                raise PermissionError("locked")
            return real_replace(self_path, target, *a, **kw)

        with mock.patch("pathlib.Path.replace", guarded):
            with self.assertRaises(PermissionError):
                media._atomic_update(lambda d: d.update({"probe": 1}))
        self.assertFalse(media._I.with_suffix(".tmp").exists())

    def test_media_atomic_update_retries_then_succeeds_cleans_tmp(self):
        """media._atomic_update: transient failures then success → index written, no .tmp left."""
        real_replace = Path.replace
        calls = [0]

        def flaky(self_path, target, *a, **kw):
            calls[0] += 1
            if calls[0] <= 2:
                raise PermissionError("locked")
            return real_replace(self_path, target, *a, **kw)

        with mock.patch("pathlib.Path.replace", flaky):
            media._atomic_update(lambda d: d.update({"probe": 1}))
        self.assertGreaterEqual(calls[0], 3)
        self.assertTrue(media._I.is_file())
        self.assertFalse(media._I.with_suffix(".tmp").exists())

    def test_publish_atomic_failure_keeps_old_snapshot(self):
        cid = self._create()
        pub = json.loads(self._publish(cid, 1).data)
        fp = self._publish_path(pub["publicId"])
        old_snap = fp.read_text("utf-8")
        # advance revision
        nd = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Second"}]}]}}
        self.assertEqual(self._patch(f'/api/content-studio/drafts/{cid}', {"expectedRevision": 2, "metadata": META, "document": nd}).status_code, 200)
        # simulated write failure during snapshot replacement (retries exhausted);
        # the recovery move must succeed so last-known-good is restored
        real_replace = os.replace
        calls = [0]

        def flaky(src, dst, *a, **kw):
            calls[0] += 1
            if calls[0] == 1:
                return real_replace(src, dst, *a, **kw)  # move old snapshot -> .bak
            if calls[0] <= 6:
                raise OSError("simulated disk failure")  # new snapshot write retries
            return real_replace(src, dst, *a, **kw)      # rollback move .bak -> target

        with mock.patch("server.content.publishing.os.replace", side_effect=flaky):
            r = self._publish(cid, 3)
        self.assertEqual(r.status_code, 500, r.data)
        # old snapshot fully preserved, no half-written files
        self.assertEqual(fp.read_text("utf-8"), old_snap)
        self.assertEqual(list(self.published_dir.glob("*.tmp")), [])
        self.assertEqual(list(self.published_dir.glob("*.bak")), [])
        # entry state untouched by failed publish
        e = storage.get_entry(cid)
        self.assertEqual(e["status"], "PUBLISHED")
        self.assertEqual(e["revision"], 3)
        # audit records the failure
        lines = self._audit_lines()
        self.assertTrue(any(x["action"] == "PUBLISH" and x["result"] == "FAILURE" for x in lines))

    def test_audit_fields_whitelist_no_sensitive_content(self):
        secret_token = "super-secret-token-abc123"
        long_text = "x" * 5000
        doc = {"schemaVersion": "content.document.v1", "doc": {"type": "doc", "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": long_text + secret_token}]}]}}
        cid = self._create(doc=doc)
        self.assertEqual(self._publish(cid, 1).status_code, 201)
        self.assertEqual(self._delete(f'/api/content-studio/drafts/{cid}/publication').status_code, 204)
        self.assertEqual(self._post(f'/api/content-studio/drafts/{cid}/archive', {"expectedRevision": 3}).status_code, 200)
        self.assertEqual(self._post(f'/api/content-studio/drafts/{cid}/restore', {"expectedRevision": 4}).status_code, 200)

        lines = self._audit_lines()
        self.assertGreaterEqual(len(lines), 4)
        actions = [x["action"] for x in lines]
        self.assertIn("PUBLISH", actions)
        self.assertIn("WITHDRAW", actions)
        self.assertIn("ARCHIVE", actions)
        self.assertIn("RESTORE", actions)
        allowed = {"id", "entryId", "action", "result", "revision", "publicId", "reasonCode", "createdAt"}
        for ev in lines:
            self.assertEqual(set(ev.keys()) - allowed, set(), f"unexpected audit field: {ev}")
            self.assertNotIn(secret_token, json.dumps(ev, ensure_ascii=False))
            self.assertNotIn(long_text, json.dumps(ev, ensure_ascii=False))
            self.assertNotIn("document", ev)
            self.assertNotIn("token", json.dumps(ev, ensure_ascii=False).lower())
        # no absolute local paths / request bodies
        blob = json.dumps(lines, ensure_ascii=False)
        self.assertNotIn("C:", blob)
        self.assertNotIn("local-assets", blob)
        self.assertNotIn("staging", blob)
        for ev in lines:
            self.assertIsInstance(ev["createdAt"], str)
            self.assertIn(ev["result"], ("SUCCESS", "FAILURE"))


if __name__ == '__main__':
    unittest.main()
